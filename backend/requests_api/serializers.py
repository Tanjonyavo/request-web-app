from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Comment, Request, RequestStatus, RequestStatusHistory, UserRole

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "role"]

    def get_full_name(self, obj):
        full_name = obj.get_full_name().strip()
        return full_name or obj.username


class RegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["email", "full_name", "password"]

    def validate(self, attrs):
        allowed_fields = {"email", "full_name", "password"}
        extra_fields = set(self.initial_data.keys()) - allowed_fields
        if extra_fields:
            raise serializers.ValidationError(
                {field: "Ce champ n'est pas autorise." for field in sorted(extra_fields)}
            )
        return attrs

    def create(self, validated_data):
        full_name = validated_data.pop("full_name").strip()
        email = validated_data["email"].lower()

        username_base = email.split("@")[0][:140] or "user"
        username = username_base
        suffix = 1
        while User.objects.filter(username=username).exists():
            username = f"{username_base}{suffix}"
            suffix += 1

        first_name = ""
        last_name = ""
        if full_name:
            parts = full_name.split()
            first_name = parts[0]
            last_name = " ".join(parts[1:])

        user = User(
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            role=UserRole.USER,
        )
        user.set_password(validated_data["password"])
        user.full_clean()
        user.save()
        return user


class UqoTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "content", "author", "created_at"]


class RequestStatusHistorySerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = RequestStatusHistory
        fields = ["id", "from_status", "to_status", "author", "created_at"]


class RequestSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    history = RequestStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Request
        fields = [
            "id",
            "title",
            "description",
            "type",
            "status",
            "created_at",
            "updated_at",
            "author",
            "comments",
            "history",
        ]
        read_only_fields = ["status", "created_at", "updated_at", "author", "comments", "history"]

    def validate_title(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Le titre doit contenir au moins 5 caracteres.")
        return value

    def validate_description(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "La description doit contenir au moins 10 caracteres."
            )
        return value


class RequestStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=RequestStatus.choices)
    comment = serializers.CharField(required=False, allow_blank=True)
