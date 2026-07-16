import pytest
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from vault.models import Document, Resource

@pytest.mark.django_db
class TestVaultAPI:

    def test_document_upload_success(self, api_client1, user1):
        """
        Why: Tests the file upload endpoint to ensure a valid Document is accepted, saved, and attached to the user.
        Real Bug Caught: The `parser_classes` missing `MultiPartParser` in DRF, causing file uploads to silently fail or return 400 Bad Request because the server can't read `FormData`.
        Production Importance: Core feature. If users can't upload documents, the Vault module is useless.
        """
        url = reverse('document-list')
        # Create a dummy PDF file in memory
        dummy_file = SimpleUploadedFile("test_doc.pdf", b"file_content", content_type="application/pdf")
        
        response = api_client1.post(url, {'file': dummy_file, 'title': 'My Document'}, format='multipart')
        
        assert response.status_code == 201
        doc = Document.objects.first()
        assert doc.title == 'My Document'
        assert doc.user == user1
        assert doc.original_filename == 'test_doc.pdf'

    def test_document_reject_invalid_extension(self, api_client1, user1):
        """
        Why: Ensures the `FileExtensionValidator` on the model actually works.
        Real Bug Caught: A malicious user or confused user uploading a `.exe` or `.py` file, which could be a security risk (Remote Code Execution) or break the frontend PDF viewer.
        Production Importance: Security and Data Integrity. We must strictly enforce that the Vault only accepts safe, expected file types.
        """
        url = reverse('document-list')
        dummy_file = SimpleUploadedFile("test_script.py", b"print('hack')", content_type="text/x-python")
        
        response = api_client1.post(url, {'file': dummy_file, 'title': 'Malicious'}, format='multipart')
        
        assert response.status_code == 400  # Should be rejected
        assert Document.objects.count() == 0

    def test_resource_crud_and_ownership(self, api_client1, api_client2, user1, user2):
        """
        Why: Tests that Links (Resources) can be added and that isolation works exactly like Notes.
        Real Bug Caught: Failing to assign `user=request.user` in the `perform_create` method of `ResourceViewSet`, resulting in IntegrityErrors (NOT NULL constraint failed).
        Production Importance: Allows users to bookmark the web safely.
        """
        url = reverse('resource-list')
        data = {
            'title': 'Django Docs',
            'url': 'https://docs.djangoproject.com/',
            'resource_type': 'article'
        }
        
        # User 1 creates
        res_create = api_client1.post(url, data)
        assert res_create.status_code == 201
        
        resource = Resource.objects.first()
        assert resource.user == user1
        
        # User 2 tries to read User 1's resources
        res_list = api_client2.get(url)
        assert len(res_list.data) == 0
