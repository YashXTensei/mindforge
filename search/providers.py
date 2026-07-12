from django.contrib.postgres.search import SearchVector
from notes.models import Note
from vault.models import PDF, Resource

class BaseSearchProvider:
    """Base class for all search providers. Ensures a modular architecture."""
    model = None
    type_name = ''
    
    def get_search_vector(self):
        """Return the SearchVector configuration for this model."""
        raise NotImplementedError

    def get_queryset(self):
        """Return the base queryset to search over."""
        return self.model.objects.select_related('category').prefetch_related('tags')

    def format_result(self, instance):
        """Format a single model instance into the unified JSON schema."""
        return {
            'id': instance.id,
            'type': self.type_name,
            'title': instance.title,
            'preview': self.get_preview(instance),
            'category': instance.category.name if instance.category else None,
            'tags': [tag.id for tag in instance.tags.all()],
            'rank': getattr(instance, 'rank', 0),
            'updated_at': instance.updated_at.isoformat(),
        }

    def get_preview(self, instance):
        """Override to provide model-specific preview text."""
        return ''


class NoteSearchProvider(BaseSearchProvider):
    model = Note
    type_name = 'note'

    def get_search_vector(self):
        # Title is most important (A), content is secondary (B)
        return SearchVector('title', weight='A') + SearchVector('content', weight='B')

    def get_preview(self, instance):
        # Return first 150 chars of content as preview
        return (instance.content[:150] + '...') if len(instance.content) > 150 else instance.content


class PDFSearchProvider(BaseSearchProvider):
    model = PDF
    type_name = 'pdf'

    def get_search_vector(self):
        return SearchVector('title', weight='A') + SearchVector('description', weight='B') + SearchVector('original_filename', weight='C')

    def get_preview(self, instance):
        return (instance.description[:150] + '...') if len(instance.description) > 150 else instance.description


class ResourceSearchProvider(BaseSearchProvider):
    model = Resource
    type_name = 'resource'

    def get_search_vector(self):
        return SearchVector('title', weight='A') + SearchVector('description', weight='B') + SearchVector('url', weight='C')

    def get_preview(self, instance):
        return (instance.description[:150] + '...') if len(instance.description) > 150 else instance.description


# Registry of all active providers
SEARCH_PROVIDERS = [
    NoteSearchProvider(),
    PDFSearchProvider(),
    ResourceSearchProvider(),
]
