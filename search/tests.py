import pytest
from django.urls import reverse
from notes.models import Note
from vault.models import Document, Resource 
from taxonomy.models import Category, Tag

@pytest.mark.django_db
class TestSearchAPI:

    def test_unified_search_response_schema(self, api_client1, user1):
        """
        Why: Ensures the Global Search API returns results from multiple models (Notes, Resources) in a single, perfectly uniform JSON format.
        Real Bug Caught: Adding a new field to `NoteSearchProvider` but forgetting to add it to `PDFSearchProvider`, causing frontend React components to crash because `result.url` or `result.type` is missing.
        Production Importance: The frontend relies on a strict contract. If the schema breaks, the entire search page goes blank with a JS error.
        """
        # Create one Note and one Resource
        Note.objects.create(title="Learn Python", content="Backend stuff", user=user1)
        Resource.objects.create(title="Python Docs", url="https://python.org", resource_type="article", user=user1)
        
        url = reverse('global-search') + '?q=Python'
        response = api_client1.get(url)
        
        assert response.status_code == 200
        data = response.data
        assert len(data) == 2
        
        # Check unified schema constraints
        expected_keys = {'id', 'type', 'title', 'preview', 'url', 'category', 'tags', 'rank', 'updated_at'}
        for item in data:
            assert set(item.keys()) == expected_keys
            assert item['type'] in ['note', 'resource']

    def test_search_isolation(self, api_client1, user1, user2):
        """
        Why: Confirms that full-text search respects row-level security (ownership).
        Real Bug Caught: The `get_queryset` in search providers querying `Model.objects.all()` instead of `Model.objects.filter(user=request.user)`. A user searches for "password" and accidentally finds another user's note.
        Production Importance: Massive security vulnerability prevention. Search must NEVER bypass isolation rules.
        """
        # User 2 creates a note containing the keyword
        Note.objects.create(title="Secret Note", content="My keyword is supersecret", user=user2)
        
        # User 1 searches for that keyword
        url = reverse('global-search') + '?q=supersecret'
        response = api_client1.get(url)
        
        assert response.status_code == 200
        assert len(response.data) == 0  # Should not find User 2's note

    def test_search_by_category_and_tags(self, api_client1, user1):
        """
        Why: Validates that PostgreSQL `SearchVector` successfully indexes related metadata (Category names and Tag names) with lower weights (C and D).
        Real Bug Caught: A note titled "Unknown" has a tag "GraphQL". Searching for "GraphQL" returns 0 results because the backend forgot to `annotate` the tags array before generating the vector.
        Production Importance: UX. Users expect metadata to influence search results.
        """
        cat = Category.objects.create(name="Databases", user=user1)
        tag = Tag.objects.create(name="sql", user=user1)
        
        note = Note.objects.create(title="A random thought", content="Nothing specific", user=user1, category=cat)
        note.tags.add(tag)
        
        # Search by tag name (which is only present in the tag, not title/content)
        url = reverse('global-search') + '?q=sql'
        response = api_client1.get(url)
        
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]['title'] == 'A random thought'
