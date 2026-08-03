"""
Django settings for MindForge project.
"""

from pathlib import Path
from datetime import timedelta
import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Environment variables
env = environ.Env(
    DEBUG=(bool, False),
)
environ.Env.read_env(BASE_DIR / '.env')

# SECURITY
SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.postgres',

    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',

    # Local apps
    'accounts',
    'notes',
    'taxonomy',
    'vault',
    'search',
    'rag',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database — PostgreSQL
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# ──────────────────────────────────────────────
# Rate Limiting (Centralized Configuration)
# ──────────────────────────────────────────────
RATE_LIMITS = {
    'AI_CHAT_RATE': '10/minute',
    'AI_SEARCH_RATE': '10/minute',
    'GENERAL_API_RATE': '120/minute',
    'DOCUMENT_PROCESS_RATE': '5/m',   # Celery: per worker
}

# Django REST Framework

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'chat_api': '10/minute',
        'search_api': '10/minute',
        'default': '120/minute',
    },
    'EXCEPTION_HANDLER': 'config.exceptions.custom_exception_handler',
}


# JWT Settings

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}


# CORS — allow React dev server

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  # Vite default
    'http://127.0.0.1:5173',
]


# Internationalization

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)

STATIC_URL = 'static/'

# Media files (PDFs, uploads — Phase 2)
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Media files (user uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Vault settings
MAX_DOCUMENT_UPLOAD_SIZE = 20 * 1024 * 1024  # 20MB
ALLOWED_UPLOAD_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp']

# ──────────────────────────────────────────────
# RAG Configuration
# ──────────────────────────────────────────────
RAG_CONFIG = {
    'EMBEDDING_PROVIDER': 'cohere',
    'EMBEDDING_MODEL': 'embed-english-v3.0',
    'EMBEDDING_DIMENSIONS': 1024,
    'EMBEDDING_BATCH_SIZE': 96,
    'EMBEDDING_MAX_RETRIES': 3,
    'CHAT_PROVIDER': 'gemini',
    'CHAT_MODEL': env(
    'GEMINI_CHAT_MODEL',
    default='gemini-3.6-flash'
),
    'CHUNK_SIZE': 500,        # tokens per chunk
    'CHUNK_OVERLAP': 50,      # overlap tokens between chunks
    'SEARCH_TOP_K': 10,       # semantic search results count
    'VISION_MODEL': env('GEMINI_VISION_MODEL', default='gemini-3.6-flash'),
    'MAX_IMAGE_SIZE_MB': 5,   # max size for processing images
}

# Celery Configuration
CELERY_BROKER_URL = env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Kolkata'

# API Keys
COHERE_API_KEY = env('COHERE_API_KEY', default='')
GEMINI_API_KEY = env('GEMINI_API_KEY', default='')
