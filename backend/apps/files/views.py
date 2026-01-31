from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework import status
from apps.core.services.supabase_service import SupabaseService
from apps.core.services.file_processor import FileProcessor
import logging

logger = logging.getLogger(__name__)


class DocumentViewSet(ViewSet):
    """ViewSet for Document operations."""
    
    def list(self, request):
        filters = {}
        conversation_id = request.query_params.get('conversation_id')
        
        if conversation_id:
            filters['conversation_id'] = conversation_id
        
        documents = SupabaseService.fetch_table('documents', filters, order_by='created_at')
        return Response(documents)
    
    def retrieve(self, request, pk=None):
        document = SupabaseService.fetch_by_id('documents', pk)
        if document:
            return Response(document)
        return Response(
            {'error': 'Document not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    def create(self, request):
        """
        Upload and process a document.
        
        Expects:
            - file: Uploaded file
            - conversation_id: ID of conversation to associate with
            - document_type: Type of document (e.g., 'textbook', 'teacher_guide')
            - chapter: Chapter number (optional)
            - topics: List of topics (optional)
        """
        if 'file' not in request.FILES:
            return Response(
                {'error': 'File is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file_obj = request.FILES['file']
        processor = FileProcessor()
        
        if not processor.is_supported(file_obj.content_type):
            return Response(
                {'error': 'Unsupported file type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Read file content
            file_content = file_obj.read()
            
            # Extract text
            file_type = processor.get_file_type(file_obj.content_type)
            extracted_text, page_count = processor.process_file(file_content, file_type)
            
            # Prepare data for Supabase
            data = {
                'file_name': file_obj.name,
                'file_type': file_obj.content_type,
                'file_size': file_obj.size,
                'storage_path': f"documents/{file_obj.name}",
                'extracted_text': extracted_text,
                'document_type': request.data.get('document_type', 'textbook'),
                'chapter': request.data.get('chapter'),
                'topics': request.data.get('topics', []),
                'is_processed': True,
                'conversation_id': request.data.get('conversation_id'),
            }
            
            # Upload to storage
            if 'conversation_id' in data:
                public_url = SupabaseService.upload_file('educational-content', data['storage_path'], file_content)
                data['download_url'] = public_url
            
            # Save to database
            document = SupabaseService.insert_record('documents', data)
            
            return Response(document, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error uploading document: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, pk=None):
        document = SupabaseService.update_record('documents', pk, request.data)
        if document:
            return Response(document)
        return Response(
            {'error': 'Failed to update document'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def destroy(self, request, pk=None):
        if SupabaseService.delete_record('documents', pk):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            {'error': 'Failed to delete document'},
            status=status.HTTP_400_BAD_REQUEST
        )
