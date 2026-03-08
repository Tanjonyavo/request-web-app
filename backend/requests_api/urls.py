from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import MeAPIView, RegisterAPIView, RequestViewSet, UqoTokenObtainPairView, health

router = DefaultRouter()
router.register("requests", RequestViewSet, basename="requests")

urlpatterns = [
    path("health/", health, name="health"),
    path("auth/register/", RegisterAPIView.as_view(), name="register"),
    path("auth/login/", UqoTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeAPIView.as_view(), name="me"),
    path("", include(router.urls)),
]
