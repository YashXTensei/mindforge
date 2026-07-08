import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User

# @pytest.mark.django_db ka matlab hai test ko fake database use karne do 
# taaki tumhara asli database kharab na ho.
@pytest.mark.django_db
def test_user_registration():
    # 1. APIClient hamara "Fake Browser/User" hai
    client = APIClient()

    # 2. Fake data jo hum register API ko bhejenge
    payload = {
        "username": "testyash",
        "email": "testyash@gmail.com",
        "password": "supersecretpassword"
    }

    # 3. Request bhejna (POST /api/auth/register/)
    response = client.post('/api/auth/register/', payload)

    # 4. Check (Assert) karna ki kya response sahi aaya!
    assert response.status_code == 201  # 201 = Created Successfully
    assert response.data["message"] == "User 'testyash' registered successfully!"
    
    # 5. Database mein check karna ki user sach mein ban gaya kya
    assert User.objects.filter(username="testyash").exists()