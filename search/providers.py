from django.contrib.postgres.search import SearchVector
from django.db.models.aggregates import StringAgg
from django.db.models import Value
from notes.models import Note
from vault.models import Document, Resource

class BaseSearchProvider:
    """Base class for all search providers. Ensures a modular architecture."""
    model = None
    type_name = ''
    
    def get_search_vector(self):
        """Return the SearchVector configuration for this model."""
        raise NotImplementedError

    def get_queryset(self):
        """Return the base queryset to search over."""
        return self.model.objects.select_related('category').prefetch_related('tags').annotate(
            tags_string=StringAgg('tags__name', delimiter=Value(' '))
        )

    def format_result(self, instance):
        """Format a single model instance into the unified JSON schema."""
        return {
            'id': instance.id,
            'type': self.type_name,
            'title': instance.title,
            'preview': self.get_preview(instance),
            'url': self.get_url(instance),
            'category': instance.category.name if instance.category else None,
            'tags': [tag.id for tag in instance.tags.all()],
            'rank': getattr(instance, 'rank', 0),
            'updated_at': instance.updated_at.isoformat(),
        }

    def get_preview(self, instance):
        """Override to provide model-specific preview text."""
        return ''

    def get_url(self, instance):
        """Override to provide the link to open this item."""
        return None


class NoteSearchProvider(BaseSearchProvider):
    model = Note
    type_name = 'note'

    def get_search_vector(self):
        # Title is most important (A), content is secondary (B)
        return (
            SearchVector('title', weight='A') + 
            SearchVector('content', weight='B') +
            SearchVector('category__name', weight='C') +
            SearchVector('tags_string', weight='D')
        )

    def get_preview(self, instance):
        # Return first 150 chars of content as preview
        return (instance.content[:150] + '...') if len(instance.content) > 150 else instance.content

    def get_url(self, instance):
        return f'/notes/{instance.id}'


class DocumentSearchProvider(BaseSearchProvider):
    model = Document
    type_name = 'document'

    def get_search_vector(self):
        return (
            SearchVector('title', weight='A') + 
            SearchVector('description', weight='B') + 
            SearchVector('original_filename', weight='B') +
            SearchVector('category__name', weight='C') +
            SearchVector('tags_string', weight='D')
        )

    def get_preview(self, instance):
        return (instance.description[:150] + '...') if instance.description and len(instance.description) > 150 else (instance.description or '')

    def get_url(self, instance):
        return instance.file.url if instance.file else None


class ResourceSearchProvider(BaseSearchProvider):
    model = Resource
    type_name = 'resource'

    def get_search_vector(self):
        return (
            SearchVector('title', weight='A') + 
            SearchVector('description', weight='B') + 
            SearchVector('url', weight='C') +
            SearchVector('category__name', weight='C') +
            SearchVector('tags_string', weight='D')
        )

    def get_preview(self, instance):
        return (instance.description[:150] + '...') if len(instance.description) > 150 else instance.description

    def get_url(self, instance):
        return instance.url


# Registry of all active providers
SEARCH_PROVIDERS = [
    NoteSearchProvider(),
    DocumentSearchProvider(),
    ResourceSearchProvider(),
]
