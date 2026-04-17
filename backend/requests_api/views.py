from django.db import transaction
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Comment, Request, RequestStatus, RequestStatusHistory, UserRole
from .serializers import (
    CommentSerializer,
    RegisterSerializer,
    RequestSerializer,
    RequestStatusUpdateSerializer,
    UserSerializer,
    UqoTokenObtainPairSerializer,
)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(_request):
    return Response({"status": "ok"})


class RegisterAPIView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            raise PermissionDenied(
                "Vous etes deja authentifie. Veuillez vous deconnecter avant de creer un nouveau compte."
            )
        return super().create(request, *args, **kwargs)


class MeAPIView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class UqoTokenObtainPairView(TokenObtainPairView):
    serializer_class = UqoTokenObtainPairSerializer


class RequestViewSet(viewsets.ModelViewSet):
    serializer_class = RequestSerializer
    queryset = Request.objects.select_related("author").prefetch_related(
        "comments__author", "history__author"
    )

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.MANAGER:
            return self.queryset
        return self.queryset.filter(author=user)

    def perform_create(self, serializer):
        request_obj = serializer.save(author=self.request.user)
        RequestStatusHistory.objects.create(
            request=request_obj,
            from_status=RequestStatus.SUBMITTED,
            to_status=RequestStatus.SUBMITTED,
            author=self.request.user,
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        self._enforce_update_permissions(request.user, instance, request.data)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        self._enforce_update_permissions(request.user, instance, request.data)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.role != UserRole.MANAGER:
            if instance.author_id != request.user.id:
                raise PermissionDenied("Vous ne pouvez pas supprimer cette demande.")
            if instance.status != RequestStatus.SUBMITTED:
                raise ValidationError(
                    {"detail": "Seules les demandes SUBMITTED peuvent etre supprimees."}
                )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="change-status")
    def change_status(self, request, pk=None):
        if request.user.role != UserRole.MANAGER:
            raise PermissionDenied("Seul un gestionnaire peut changer le statut.")

        request_obj = self.get_object()
        serializer = RequestStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        next_status = serializer.validated_data["status"]
        comment = serializer.validated_data.get("comment", "").strip()

        if not request_obj.can_transition_to(next_status):
            raise ValidationError(
                {
                    "status": (
                        f"Transition invalide de {request_obj.status} vers {next_status}."
                    )
                }
            )

        previous_status = request_obj.status

        with transaction.atomic():
            request_obj.status = next_status
            request_obj.save(update_fields=["status", "updated_at"])

            RequestStatusHistory.objects.create(
                request=request_obj,
                from_status=previous_status,
                to_status=next_status,
                author=request.user,
            )

            if comment:
                Comment.objects.create(
                    request=request_obj,
                    author=request.user,
                    content=comment,
                )

        request_obj.refresh_from_db()
        return Response(RequestSerializer(request_obj).data)

    @action(detail=True, methods=["get", "post"], url_path="comments")
    def comments(self, request, pk=None):
        request_obj = self.get_object()

        if request.user.role != UserRole.MANAGER and request_obj.author_id != request.user.id:
            raise PermissionDenied("Vous ne pouvez pas consulter ces commentaires.")

        if request.method == "GET":
            serialized = CommentSerializer(request_obj.comments.all(), many=True)
            return Response(serialized.data)

        if request.user.role != UserRole.MANAGER:
            raise PermissionDenied("Seul un gestionnaire peut ajouter un commentaire.")

        content = str(request.data.get("content", "")).strip()
        if not content:
            raise ValidationError({"content": "Le contenu du commentaire est requis."})

        comment = Comment.objects.create(
            request=request_obj,
            author=request.user,
            content=content,
        )
        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @staticmethod
    def _enforce_update_permissions(user, request_obj, payload):
        if user.role == UserRole.MANAGER:
            return

        if request_obj.author_id != user.id:
            raise PermissionDenied("Vous ne pouvez pas modifier cette demande.")

        if request_obj.status != RequestStatus.SUBMITTED:
            raise ValidationError(
                {
                    "detail": "Seules les demandes avec statut SUBMITTED peuvent etre modifiees."
                }
            )

        if "status" in payload:
            raise ValidationError(
                {"status": "Le statut ne peut pas etre modifie par un utilisateur."}
            )

        if "author" in payload:
            raise ValidationError({"author": "Le champ author est en lecture seule."})
