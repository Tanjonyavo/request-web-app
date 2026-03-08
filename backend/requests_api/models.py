from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models


class UserRole(models.TextChoices):
    USER = "user", "Utilisateur"
    MANAGER = "manager", "Gestionnaire"


class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.USER)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self) -> str:
        return self.email


class RequestType(models.TextChoices):
    INFRASTRUCTURE = "INFRASTRUCTURE", "Infrastructure"
    SOFTWARE = "SOFTWARE", "Software"
    HARDWARE = "HARDWARE", "Hardware"
    OTHER = "OTHER", "Other"


class RequestStatus(models.TextChoices):
    SUBMITTED = "SUBMITTED", "Submitted"
    IN_PROGRESS = "IN_PROGRESS", "In progress"
    CLOSED = "CLOSED", "Closed"


ALLOWED_STATUS_TRANSITIONS = {
    RequestStatus.SUBMITTED: {RequestStatus.IN_PROGRESS, RequestStatus.CLOSED},
    RequestStatus.IN_PROGRESS: {RequestStatus.CLOSED},
    RequestStatus.CLOSED: set(),
}


class Request(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    type = models.CharField(max_length=20, choices=RequestType.choices)
    status = models.CharField(
        max_length=20,
        choices=RequestStatus.choices,
        default=RequestStatus.SUBMITTED,
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="requests",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-id"]

    def clean(self):
        if len(self.title.strip()) < 5:
            raise ValidationError({"title": "Le titre doit contenir au moins 5 caracteres."})
        if len(self.description.strip()) < 10:
            raise ValidationError(
                {"description": "La description doit contenir au moins 10 caracteres."}
            )

    def can_transition_to(self, next_status: str) -> bool:
        return next_status in ALLOWED_STATUS_TRANSITIONS[self.status]

    def __str__(self) -> str:
        return f"{self.id} - {self.title} ({self.status})"


class Comment(models.Model):
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]

    def __str__(self) -> str:
        return f"Comment {self.id} for Request {self.request_id}"


class RequestStatusHistory(models.Model):
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name="history")
    from_status = models.CharField(max_length=20, choices=RequestStatus.choices)
    to_status = models.CharField(max_length=20, choices=RequestStatus.choices)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="status_changes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]

    def __str__(self) -> str:
        return f"Request {self.request_id}: {self.from_status}->{self.to_status}"
