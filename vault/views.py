from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import PDF, Resource
from .serializers import PDFSerializer, ResourceSerializer


class PDFViewSet(viewsets.ModelViewSet):
    serializer_class = PDFSerializer
    permission_classes = [IsAuthenticated]
    # File upload ke liye MultiPartParser zaroori hai
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'original_filename']
    ordering_fields = ['updated_at', 'created_at', 'title']
    ordering = ['-updated_at']

    def get_queryset(self):
        queryset = PDF.objects.filter(user=self.request.user)

        # Filter by category: /api/vault/pdfs/?category=1
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        # Filter by tags: /api/vault/pdfs/?tags=1,3,5
        tags_param = self.request.query_params.get('tags')
        if tags_param:
            tag_ids = tags_param.split(',')
            for tag_id in tag_ids:
                queryset = queryset.filter(tags__id=tag_id)

        # Filter by favorite: /api/vault/pdfs/?is_favorite=true
        is_favorite = self.request.query_params.get('is_favorite')
        if is_favorite is not None:
            queryset = queryset.filter(is_favorite=(is_favorite.lower() == 'true'))

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'url']
    ordering_fields = ['updated_at', 'created_at', 'title']
    ordering = ['-updated_at']

    def get_queryset(self):
        queryset = Resource.objects.filter(user=self.request.user)

        # Filter by category
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        # Filter by tags
        tags_param = self.request.query_params.get('tags')
        if tags_param:
            tag_ids = tags_param.split(',')
            for tag_id in tag_ids:
                queryset = queryset.filter(tags__id=tag_id)

        # Filter by resource_type: /api/vault/resources/?type=article
        resource_type = self.request.query_params.get('type')
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)

        # Filter by favorite
        is_favorite = self.request.query_params.get('is_favorite')
        if is_favorite is not None:
            queryset = queryset.filter(is_favorite=(is_favorite.lower() == 'true'))

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)