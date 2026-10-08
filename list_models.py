import os
import django

# Setup Django to load settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from google import genai

client = genai.Client(api_key=settings.GEMINI_API_KEY)

print("Available Models:")
try:
    for m in client.models.list():
        print(m.name)
except Exception as e:
    print("Error listing models:", e)
