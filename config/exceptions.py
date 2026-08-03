"""
Custom DRF Exception Handler.
Returns user-friendly error messages instead of raw DRF defaults.
"""

from rest_framework.views import exception_handler
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Override DRF's default exception handler to return
    friendly messages for throttled requests.
    """
    response = exception_handler(exc, context)

    if response is not None and response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
        response.data = {
            'error': 'Rate limit exceeded.',
            'detail': 'You are sending too many requests. Please wait a few seconds before trying again.',
        }

    return response
