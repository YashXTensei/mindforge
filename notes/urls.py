from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, TagViewSet, NoteViewSet

# Router banaya
router = DefaultRouter()

# Router ko bataya ki kaunse endpoints pe kaunsa ViewSet chalana hai
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'notes', NoteViewSet, basename='note')

# Generated URLs ko urlpatterns mein daal diya
urlpatterns = [
    path('', include(router.urls)),
]