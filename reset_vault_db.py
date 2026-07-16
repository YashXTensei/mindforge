import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    print("Deleting vault from django_migrations...")
    cursor.execute("DELETE FROM django_migrations WHERE app='vault';")
    print("Dropping old vault tables...")
    cursor.execute("DROP TABLE IF EXISTS vault_pdf CASCADE;")
    cursor.execute("DROP TABLE IF EXISTS vault_pdf_tags CASCADE;")
    cursor.execute("DROP TABLE IF EXISTS vault_resource CASCADE;")
    cursor.execute("DROP TABLE IF EXISTS vault_resource_tags CASCADE;")
    cursor.execute("DROP TABLE IF EXISTS vault_document CASCADE;")
    cursor.execute("DROP TABLE IF EXISTS vault_document_tags CASCADE;")
    print("Done!")
