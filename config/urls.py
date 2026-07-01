from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from accounts.views import hello_world, register

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/hello/', hello_world),

    # Auth
    path('api/auth/register/', register, name='register'),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]