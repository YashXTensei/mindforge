import pytest
from django.urls import reverse
from notes.models import Note
from taxonomy.models import Category, Tag

@pytest.mark.django_db
class TestNotesAPI:

    def test_note_creation_and_ownership(self, api_client1, user1):
        """
        Why: Validates that submitting a note payload actually creates a database record tied to the user.
        Real Bug Caught: The frontend sends `category_id` but the backend expects `category`, causing the note to save but lose its folder placement.
        Production Importance: Core feature. If note creation fails or data is lost during the POST request, the app is fundamentally broken.
        """
        category = Category.objects.create(name="Dev", user=user1)
        tag = Tag.objects.create(name="backend", user=user1)
        
        url = reverse('note-list')
        data = {
            'title': 'Test Note',
            'content': 'This is the content.',
            'category': category.id,
            'tags': [tag.id]
        }
        
        response = api_client1.post(url, data)
        assert response.status_code == 201
        
        note = Note.objects.first()
        assert note.title == 'Test Note'
        assert note.user == user1
        assert note.category == category
        assert tag in note.tags.all()

    def test_note_isolation(self, api_client1, api_client2, user1, user2):
        """
        Why: Ensures absolute privacy. User A must never read, edit, or delete User B's notes.
        Real Bug Caught: An endpoint like `PATCH /api/notes/5/` not checking if `note.user == request.user`, allowing malicious users to guess note IDs and overwrite other people's data.
        Production Importance: The most critical security requirement for a personal knowledge base.
        """
        # User 1 creates a note
        note1 = Note.objects.create(title="User1 Secret", content="Password is 123", user=user1)
        
        # User 2 tries to GET the list
        url_list = reverse('note-list')
        res_list = api_client2.get(url_list)
        assert len(res_list.data) == 0  # Should be invisible
        
        # User 2 tries to GET the specific note directly by ID
        url_detail = reverse('note-detail', args=[note1.id])
        res_detail = api_client2.get(url_detail)
        assert res_detail.status_code == 404  # DRF correctly returns 404 Not Found (hiding existence)

    def test_note_category_filtering(self, api_client1, user1):
        """
        Why: Verifies that passing `?category=X` only returns notes in that specific folder.
        Real Bug Caught: The filter logic using `.filter(category__name=X)` instead of `category_id`, or ignoring the filter entirely.
        Production Importance: Users rely on folders to organize thousands of notes. If clicking a folder shows unrelated notes, the UX is ruined.
        """
        cat1 = Category.objects.create(name="Math", user=user1)
        cat2 = Category.objects.create(name="Science", user=user1)
        
        Note.objects.create(title="Algebra", content="Math stuff", user=user1, category=cat1)
        Note.objects.create(title="Physics", content="Science stuff", user=user1, category=cat2)
        
        url = reverse('note-list') + f'?category={cat1.id}'
        response = api_client1.get(url)
        
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]['title'] == 'Algebra'

    def test_note_search_filter(self, api_client1, user1):
        """
        Why: Checks if the DRF `SearchFilter` is correctly hooked up to `title` and `content` fields.
        Real Bug Caught: Typing a word in the search bar and getting an empty list because the `search_fields` attribute was accidentally deleted from the ViewSet.
        Production Importance: Essential for quickly retrieving information without remembering exactly where it was stored.
        """
        Note.objects.create(title="Python Tutorial", content="Learn lists", user=user1)
        Note.objects.create(title="Django Guide", content="Learn models", user=user1)
        
        # Search for 'Learn' (should match both via content)
        url = reverse('note-list') + '?search=Learn'
        res1 = api_client1.get(url)
        assert len(res1.data) == 2
        
        # Search for 'Python' (should match 1 via title)
        url2 = reverse('note-list') + '?search=Python'
        res2 = api_client1.get(url2)
        assert len(res2.data) == 1
        assert res2.data[0]['title'] == 'Python Tutorial'
