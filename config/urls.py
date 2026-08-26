from django.contrib import admin
from django.urls import path , include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from accounts.views import hello_world, register , get_user_profile
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/hello/', hello_world),

    # Auth
    path('api/auth/register/', register, name='register'),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', get_user_profile, name='user_profile'),
    
    path('api/', include('notes.urls')),
    path('api/vault/', include('vault.urls')),
    path('api/search/', include('search.urls')),
    path('api/rag/', include('rag.urls')),
    path('api/learning/', include('learning.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)