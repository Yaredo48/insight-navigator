"""
Supabase JWT Authentication for Django REST Framework.
"""
import jwt
import logging
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
from apps.core.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)


class SupabaseAuthentication(BaseAuthentication):
    """
    Custom authentication class that validates Supabase JWT tokens.
    """

    def authenticate(self, request):
        """
        Authenticate the request based on the Authorization header.
        
        Expected header:
            Authorization: Bearer <supabase_jwt_token>
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header:
            return None

        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        token = parts[1]

        try:
            user_info = self._validate_token(token)
            return (user_info, token)
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            raise AuthenticationFailed(str(e))

    def _validate_token(self, token):
        """
        Validate the JWT token using Supabase JWT secret.
        """
        jwt_secret = settings.SUPABASE_JWT_SECRET

        if jwt_secret:
            # Decode JWT using the secret
            try:
                payload = jwt.decode(
                    token,
                    jwt_secret,
                    algorithms=[settings.JWT_ALGORITHM],
                    options={"verify_sub": False}
                )
                return {
                    'id': payload.get('sub'),
                    'email': payload.get('email'),
                    'role': payload.get('role', 'authenticated'),
                    'token_payload': payload
                }
            except jwt.ExpiredSignatureError:
                raise AuthenticationFailed('Token has expired')
            except jwt.InvalidTokenError as e:
                raise AuthenticationFailed(f'Invalid token: {str(e)}')
        else:
            # Fallback to Supabase client validation
            user_info = SupabaseService.get_user_by_token(token)
            if not user_info:
                raise AuthenticationFailed('Invalid token')
            return user_info

    def authenticate_header(self, request):
        """
        Return the value for WWW-Authenticate header.
        """
        return 'Bearer'
