# Celery app ko import karo taaki Django start hone pe Celery bhi load ho
from .celery import app as celery_app

__all__ = ('celery_app',)
