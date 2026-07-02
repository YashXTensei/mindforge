from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from .models import Category, Tag, Note
from .serializers import CategorySerializer, TagSerializer, NoteSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    # Sirf us user ki categories dikhao jo logged in hai
    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    # Category create karte time user automatically assign karo
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
    
    # Filtering aur Searching activate kar rahe hain
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content'] # Search bar me kya type karein toh search ho
    ordering_fields = ['updated_at', 'created_at'] # Sort karne ke options
    # Cursor pagination default pe depends on ordering, toh default sorting idhar lagate hain
    ordering = ['-updated_at'] 

    def get_queryset(self):
        # Base query: Sirf apne notes
        queryset = Note.objects.filter(user=self.request.user)
        
        # Custom filters (jaise: /api/notes/?category=1)
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        # Jaise /api/notes/?tag=2
        tag_id = self.request.query_params.get('tag')
        if tag_id:
            queryset = queryset.filter(tags__id=tag_id)
            
        # Pinned notes filter: /api/notes/?is_pinned=true
        is_pinned = self.request.query_params.get('is_pinned')
        if is_pinned is not None:
            # check string 'true' in lower case
            queryset = queryset.filter(is_pinned=(is_pinned.lower() == 'true'))
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)