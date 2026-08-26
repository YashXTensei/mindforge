web: gunicorn config.wsgi --log-file -
worker: celery -A config worker -l info --concurrency=2 -P solo
release: python manage.py migrate
