from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User


@api_view(['POST' , 'GET'])
@permission_classes([AllowAny])
def register(request):
    """
    New user registration.
    Expects: username, email, password
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    # Validation — check ki sab fields aaye hain
    if not username or not email or not password:
        return Response(
            {"error": "username, email, and password are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check ki username pehle se toh nahi hai
    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already taken."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check ki email pehle se toh nahi hai
    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already registered."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Sab sahi hai — user banao
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    return Response(
        {"message": f"User '{user.username}' registered successfully!"},
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def hello_world(request):
    return Response({"message": "Hello from Django Backend! 🚀"})