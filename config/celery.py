import os
from celery import Celery

# Django settings module set karo
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('mindforge')

# Django settings se config load karo (CELERY_ prefix wali settings)
app.config_from_object('django.conf:settings', namespace='CELERY')

# Sab installed apps ke tasks auto-discover karo
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Test task — Celery worker chal raha hai ya nahi check karne ke liye."""
    print(f'Request: {self.request!r}')
