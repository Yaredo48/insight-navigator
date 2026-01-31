from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.core.services.supabase_service import SupabaseService
import jwt
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class SupabaseAuthView(APIView):
    """Authentication endpoints for Supabase JWT validation."""
    
    def post(self, request):
        """
        Verify a Supabase JWT token and return user info.
        
        Expected request data:
            - token: Supabase JWT token
        
        Returns:
            - user_id: User ID from the token
            - email: User email
            - role: User role
            - is_valid: Token validation status
        """
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Decode and verify the JWT token
            # Supabase uses JWT with the secret from SUPABASE_JWT_SECRET
            jwt_secret = settings.SUPABASE_JWT_SECRET
            
            if not jwt_secret:
                # If no JWT secret configured, try to validate via Supabase client
                user_info = SupabaseService.get_user_by_token(token)
                if user_info:
                    return Response({
                        'user_id': user_info.get('id'),
                        'email': user_info.get('email'),
                        'role': user_info.get('role', 'authenticated'),
                        'is_valid': True
                    })
                else:
                    return Response(
                        {'error': 'Invalid token'},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
            
            # Decode the JWT
            payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
            
            # Extract user info from the payload
            user_id = payload.get('sub')
            email = payload.get('email')
            role = payload.get('role', 'authenticated')
            
            return Response({
                'user_id': user_id,
                'email': email,
                'role': role,
                'is_valid': True,
                'exp': payload.get('exp'),
                'iat': payload.get('iat')
            })
            
        except jwt.ExpiredSignatureError:
            return Response(
                {'error': 'Token has expired'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid JWT token: {e}")
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            logger.error(f"Auth verification error: {e}")
            return Response(
                {'error': 'Authentication failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get(self, request):
        """
        Check if the user is authenticated (for session validation).
        
        Headers:
            - Authorization: Bearer <token>
        
        Returns:
            - is_authenticated: Boolean
            - user_id: User ID if authenticated
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return Response({
                'is_authenticated': False,
                'message': 'No authorization header'
            })
        
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        
        # Validate token
        verification_result = self._validate_token(token)
        
        if verification_result['is_valid']:
            return Response({
                'is_authenticated': True,
                'user_id': verification_result.get('user_id'),
                'email': verification_result.get('email'),
                'role': verification_result.get('role')
            })
        else:
            return Response({
                'is_authenticated': False,
                'message': verification_result.get('error', 'Invalid token')
            })
    
    def _validate_token(self, token):
        """Validate a Supabase JWT token."""
        try:
            jwt_secret = settings.SUPABASE_JWT_SECRET
            
            if not jwt_secret:
                user_info = SupabaseService.get_user_by_token(token)
                if user_info:
                    return {
                        'is_valid': True,
                        'user_id': user_info.get('id'),
                        'email': user_info.get('email'),
                        'role': user_info.get('role', 'authenticated')
                    }
                return {'is_valid': False, 'error': 'Invalid token'}
            
            payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
            
            return {
                'is_valid': True,
                'user_id': payload.get('sub'),
                'email': payload.get('email'),
                'role': payload.get('role', 'authenticated')
            }
            
        except jwt.ExpiredSignatureError:
            return {'is_valid': False, 'error': 'Token has expired'}
        except jwt.InvalidTokenError:
            return {'is_valid': False, 'error': 'Invalid token'}
        except Exception as e:
            logger.error(f"Token validation error: {e}")
            return {'is_valid': False, 'error': 'Validation failed'}
