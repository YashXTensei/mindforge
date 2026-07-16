from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet, ResourceViewSet

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'resources', ResourceViewSet, basename='resource')

urlpatterns = [
    path('', include(router.urls)),
]