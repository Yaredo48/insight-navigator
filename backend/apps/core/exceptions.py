from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Custom exception handler for consistent error responses."""
    response = exception_handler(exc, context)
    
    if response is not None:
        response.data = {
            'error': True,
            'message': str(exc),
            'details': response.data
        }
    else:
        # Handle unexpected exceptions
        logger.exception(f"Unexpected error: {exc}")
        response = Response(
            {
                'error': True,
                'message': 'An unexpected error occurred',
                'details': str(exc) if exc else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return response


class SupabaseError(Exception):
    """Exception raised for Supabase-related errors."""
    pass


class AIError(Exception):
    """Exception raised for AI-related errors."""
    pass


class FileProcessingError(Exception):
    """Exception raised for file processing errors."""
    pass
