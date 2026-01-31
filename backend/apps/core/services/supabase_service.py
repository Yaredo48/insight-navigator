from supabase import create_client, Client
from django.conf import settings
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


class SupabaseService:
    """Service for interacting with Supabase database and storage."""
    
    _client: Optional[Client] = None
    
    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client."""
        if cls._client is None:
            if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
                raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
            cls._client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_KEY
            )
        return cls._client
    
    @classmethod
    def fetch_table(
        cls, 
        table: str, 
        filters: Dict = None, 
        limit: int = None,
        order_by: str = None,
        ascending: bool = True
    ) -> List[Dict]:
        """Fetch data from a Supabase table."""
        try:
            client = cls.get_client()
            query = client.table(table).select('*')
            
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            
            if order_by:
                query = query.order(order_by, desc=not ascending)
            
            if limit:
                query = query.limit(limit)
            
            result = query.execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching from {table}: {e}")
            raise
    
    @classmethod
    def fetch_by_id(cls, table: str, record_id: str) -> Optional[Dict]:
        """Fetch a single record by ID."""
        results = cls.fetch_table(table, {'id': record_id}, limit=1)
        return results[0] if results else None
    
    @classmethod
    def insert_record(cls, table: str, data: Dict) -> Optional[Dict]:
        """Insert a record into Supabase table."""
        try:
            client = cls.get_client()
            result = client.table(table).insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error inserting into {table}: {e}")
            raise
    
    @classmethod
    def update_record(cls, table: str, record_id: str, data: Dict) -> Optional[Dict]:
        """Update a record in Supabase table."""
        try:
            client = cls.get_client()
            result = client.table(table).update(data).eq('id', record_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error updating {table}: {e}")
            raise
    
    @classmethod
    def delete_record(cls, table: str, record_id: str) -> bool:
        """Delete a record from Supabase table."""
        try:
            client = cls.get_client()
            result = client.table(table).delete().eq('id', record_id).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error deleting from {table}: {e}")
            raise
    
    @classmethod
    def upload_file(cls, bucket: str, file_path: str, file_content: bytes) -> str:
        """Upload a file to Supabase Storage."""
        try:
            client = cls.get_client()
            result = client.storage.from_(bucket).upload(
                file_path,
                file_content,
                {'content-type': 'application/pdf'}
            )
            
            # Get public URL
            public_url = client.storage.from_(bucket).get_public_url(file_path)
            return public_url
        except Exception as e:
            logger.error(f"Error uploading file to {bucket}: {e}")
            raise
    
    @classmethod
    def get_storage_public_url(cls, bucket: str, file_path: str) -> str:
        """Get public URL for a file in Supabase Storage."""
        client = cls.get_client()
        return client.storage.from_(bucket).get_public_url(file_path)
    
    @classmethod
    def get_user_by_token(cls, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate a Supabase JWT token and return user info.
        Uses the GoTrue API to verify the token.
        """
        try:
            client = cls.get_client()
            # Get user info using the GoTrue API
            user_response = client.auth.get_user(token)
            if user_response and user_response.user:
                return {
                    'id': user_response.user.id,
                    'email': user_response.user.email,
                    'role': user_response.user.role or 'authenticated',
                }
            return None
        except Exception as e:
            logger.error(f"Error validating token: {e}")
            return None
