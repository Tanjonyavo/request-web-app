from rest_framework import permissions

from .models import RequestStatus, UserRole


class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.MANAGER


class CanEditRequest(permissions.BasePermission):
    """Authors can edit only SUBMITTED requests, managers can edit everything."""

    def has_object_permission(self, request, view, obj):
        if request.user.role == UserRole.MANAGER:
            return True

        is_author = obj.author_id == request.user.id
        if request.method in permissions.SAFE_METHODS:
            return is_author

        return is_author and obj.status == RequestStatus.SUBMITTED
