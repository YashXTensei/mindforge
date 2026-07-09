from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PDFViewSet, ResourceViewSet

router = DefaultRouter()
router.register(r'pdfs', PDFViewSet, basename='pdf')
router.register(r'resources', ResourceViewSet, basename='resource')

urlpatterns = [
    path('', include(router.urls)),
]