import pytest
from django.urls import reverse
from taxonomy.models import Category, Tag

@pytest.mark.django_db
class TestTaxonomyAPI:
    
    def test_category_create_and_ownership(self, api_client1, user1):
        """
        Why: Ensures users can create categories and that the category is correctly assigned to them.
        Real Bug Caught: A bug where a category is created without an owner, or assigned to a default user, which breaks data segregation.
        Production Importance: MindForge is a multi-tenant system. If a user creates a 'Math' folder, it must exclusively belong to them.
        """
        url = reverse('category-list')
        response = api_client1.post(url, {'name': 'Mathematics'})
        
        assert response.status_code == 201
        assert Category.objects.count() == 1
        assert Category.objects.first().user == user1
        assert Category.objects.first().name == 'Mathematics'

    def test_category_isolation(self, api_client1, api_client2, user1, user2):
        """
        Why: Ensures User A cannot see User B's categories.
        Real Bug Caught: User A logging in and seeing User B's private folders in their sidebar because the API forgot to filter by `request.user`.
        Production Importance: Fundamental privacy. Data leakage between users is a critical security vulnerability.
        """
        # User 1 creates a category
        Category.objects.create(name="User1_Secret_Folder", user=user1)
        
        # User 2 fetches categories
        url = reverse('category-list')
        response = api_client2.get(url)
        
        assert response.status_code == 200
        # User 2 should see 0 categories
        assert len(response.data) == 0

    def test_duplicate_category_constraint(self, api_client1, user1):
        """
        Why: Ensures a user cannot create two categories with the exact same name.
        Real Bug Caught: A frontend bug allowing users to click 'Save' twice rapidly, creating duplicate folders that confuse the UI and database queries.
        Production Importance: Database integrity. We rely on unique names per user for clean UI dropdowns and predictable filtering.
        """
        Category.objects.create(name="Science", user=user1)
        
        url = reverse('category-list')
        response = api_client1.post(url, {'name': 'Science'})
        
        # Should fail due to UniqueConstraint(fields=['name', 'user'])
        assert response.status_code == 400

    def test_tag_crud_flow(self, api_client1, user1):
        """
        Why: Verifies the entire lifecycle of a Tag (Create, Read, Delete).
        Real Bug Caught: A typo in the ViewSet that breaks the DELETE method, meaning users can create tags but never remove them, cluttering their workspace forever.
        Production Importance: Core functionality. Users need full control over their metadata lifecycle.
        """
        url = reverse('tag-list')
        
        # 1. Create
        res_create = api_client1.post(url, {'name': 'python'})
        assert res_create.status_code == 201
        tag_id = res_create.data['id']
        
        # 2. Read
        res_list = api_client1.get(url)
        assert len(res_list.data) == 1
        assert res_list.data[0]['name'] == 'python'
        
        # 3. Delete
        delete_url = reverse('tag-detail', args=[tag_id])
        res_delete = api_client1.delete(delete_url)
        assert res_delete.status_code == 204
        assert Tag.objects.count() == 0
