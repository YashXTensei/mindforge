import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

@pytest.fixture
def user1(db):
    """Creates a primary user for testing."""
    return User.objects.create_user(username='testuser1', email='user1@test.com', password='password123')

@pytest.fixture
def user2(db):
    """Creates a secondary user to test data isolation and permissions."""
    return User.objects.create_user(username='testuser2', email='user2@test.com', password='password123')

@pytest.fixture
def api_client1(user1):
    """Returns an APIClient authenticated as user1."""
    client = APIClient()
    client.force_authenticate(user=user1)
    return client

@pytest.fixture
def api_client2(user2):
    """Returns an APIClient authenticated as user2."""
    client = APIClient()
    client.force_authenticate(user=user2)
    return client
