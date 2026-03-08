from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Comment, Request, RequestStatusHistory, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (("UQO Requests", {"fields": ("role",)}),)
    list_display = ("id", "email", "username", "role", "is_staff")
    list_filter = ("role", "is_staff", "is_superuser", "is_active")
    search_fields = ("email", "username", "first_name", "last_name")


@admin.register(Request)
class RequestAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "type", "status", "author", "updated_at")
    list_filter = ("status", "type")
    search_fields = ("title", "description", "author__email")


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "request", "author", "created_at")
    search_fields = ("author__email", "content")


@admin.register(RequestStatusHistory)
class RequestStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ("id", "request", "from_status", "to_status", "author", "created_at")
    list_filter = ("from_status", "to_status")
