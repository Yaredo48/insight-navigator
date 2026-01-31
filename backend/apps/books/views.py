from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework import status
from apps.core.services.supabase_service import SupabaseService
from apps.core.services.file_processor import FileProcessor
import requests
import logging
import uuid
import re

logger = logging.getLogger(__name__)


class BookViewSet(ViewSet):
    """ViewSet for Book operations with complete download → upload → register pipeline."""
    
    def list(self, request):
        """List all books with optional filtering by grade_id and subject_id."""
        filters = {}
        grade_id = request.query_params.get('grade_id')
        subject_id = request.query_params.get('subject_id')
        grade_level = request.query_params.get('grade_level')
        subject_name = request.query_params.get('subject_name')
        
        if grade_id:
            filters['grade_id'] = grade_id
        if subject_id:
            filters['subject_id'] = subject_id
        
        books = SupabaseService.fetch_table('books', filters, order_by='title')
        return Response(books)
    
    def retrieve(self, request, pk=None):
        """Get a specific book by ID."""
        book = SupabaseService.fetch_by_id('books', pk)
        if book:
            return Response(book)
        return Response(
            {'error': 'Book not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    def create(self, request):
        """
        Register a new book without downloading (manual registration).
        
        Expects:
            - title: Book title
            - grade_id: Grade ID
            - subject_id: Subject ID
            - author: Author name (optional)
            - description: Book description (optional)
            - storage_path: Existing storage path (optional)
            - download_url: Existing download URL (optional)
        """
        data = request.data.copy()
        book = SupabaseService.insert_record('books', data)
        if book:
            return Response(book, status=status.HTTP_201_CREATED)
        return Response(
            {'error': 'Failed to create book'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def update(self, request, pk=None):
        """Update a book record."""
        book = SupabaseService.update_record('books', pk, request.data)
        if book:
            return Response(book)
        return Response(
            {'error': 'Failed to update book'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def destroy(self, request, pk=None):
        """Delete a book record."""
        if SupabaseService.delete_record('books', pk):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            {'error': 'Failed to delete book'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def download(self, request, pk=None):
        """Get download URL for a book."""
        book = SupabaseService.fetch_by_id('books', pk)
        if book:
            return Response({
                'id': book['id'],
                'title': book['title'],
                'download_url': book.get('download_url') or book.get('storage_path')
            })
        return Response(
            {'error': 'Book not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    def download_and_register(self, request):
        """
        Complete pipeline: Download official PDF → upload to storage → register in DB.
        
        This endpoint handles the entire workflow for adding official educational PDFs.
        
        Expected request data:
            - source_url: URL to download the official PDF from
            - title: Book title (auto-extracted if not provided)
            - grade_id: Grade ID to associate with
            - subject_id: Subject ID to associate with
            - grade_level: Grade level name (e.g., "Grade 10")
            - subject_name: Subject name (e.g., "Mathematics")
            - author: Author name (optional)
            - description: Book description (optional)
        
        Returns:
            - The registered book record with download URL
        """
        source_url = request.data.get('source_url')
        title = request.data.get('title')
        grade_id = request.data.get('grade_id')
        subject_id = request.data.get('subject_id')
        grade_level = request.data.get('grade_level')
        subject_name = request.data.get('subject_name')
        author = request.data.get('author', '')
        description = request.data.get('description', '')
        
        # Validate required fields
        if not source_url:
            return Response(
                {'error': 'source_url is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not (grade_id or (grade_level and subject_name)):
            return Response(
                {'error': 'Either grade_id or both grade_level and subject_name are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Step 1: Download the official PDF
            logger.info(f"Downloading PDF from: {source_url}")
            
            response = requests.get(source_url, timeout=60)
            response.raise_for_status()
            
            # Verify it's a PDF
            content_type = response.headers.get('content-type', '')
            if 'pdf' not in content_type.lower() and not source_url.lower().endswith('.pdf'):
                # Check first bytes for PDF magic number
                if response.content[:4] != b'%PDF':
                    return Response(
                        {'error': 'The downloaded file is not a valid PDF'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            file_content = response.content
            file_size = len(file_content)
            
            # Extract title from URL if not provided
            if not title:
                title = self._extract_title_from_url(source_url)
            
            # Generate storage path
            file_extension = 'pdf'
            safe_title = re.sub(r'[^\w\s-]', '', title).strip()[:50]
            storage_filename = f"{safe_title}_{uuid.uuid4().hex[:8]}.{file_extension}"
            storage_path = f"books/{storage_filename}"
            
            logger.info(f"Generated storage path: {storage_path}")
            
            # Step 2: Upload to Supabase Storage
            logger.info("Uploading PDF to Supabase Storage...")
            
            bucket_name = 'educational-content'
            public_url = SupabaseService.upload_file(bucket_name, storage_path, file_content)
            
            logger.info(f"Uploaded successfully. Public URL: {public_url}")
            
            # Step 3: Extract text content for search/indexing
            logger.info("Extracting text content from PDF...")
            processor = FileProcessor()
            extracted_text, page_count = processor.process_file(file_content, 'pdf')
            
            # Step 4: Register in database
            book_data = {
                'title': title,
                'author': author,
                'description': description,
                'storage_path': storage_path,
                'download_url': public_url,
                'file_size': file_size,
                'page_count': page_count,
                'extracted_text': extracted_text[:10000],  # Limit text size
                'is_official': True,
            }
            
            # Add grade/subject associations
            if grade_id:
                book_data['grade_id'] = grade_id
            if subject_id:
                book_data['subject_id'] = subject_id
            
            # Get or create grade/subject if names provided
            if not grade_id and grade_level:
                grade = SupabaseService.fetch_table('grades', {'name': grade_level})
                if grade:
                    book_data['grade_id'] = grade[0]['id']
            
            if not subject_id and subject_name:
                subject = SupabaseService.fetch_table('subjects', {'name': subject_name})
                if subject:
                    book_data['subject_id'] = subject[0]['id']
            
            logger.info("Registering book in database...")
            book = SupabaseService.insert_record('books', book_data)
            
            if book:
                logger.info(f"Book registered successfully: {book['id']}")
                return Response(book, status=status.HTTP_201_CREATED)
            else:
                return Response(
                    {'error': 'Failed to register book in database'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to download PDF: {e}")
            return Response(
                {'error': f'Failed to download PDF: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error in download_and_register pipeline: {e}")
            return Response(
                {'error': f'Pipeline failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def bulk_download_and_register(self, request):
        """
        Bulk pipeline: Download multiple official PDFs → upload to storage → register in DB.
        
        Expected request data:
            - books: List of book objects with source_url and optional metadata
            - default_grade_id: Default grade ID for books without specific grade
            - default_subject_id: Default subject ID for books without specific subject
        
        Returns:
            - List of registered book records
        """
        books_to_import = request.data.get('books', [])
        default_grade_id = request.data.get('default_grade_id')
        default_subject_id = request.data.get('default_subject_id')
        
        if not books_to_import:
            return Response(
                {'error': 'No books specified for import'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = []
        errors = []
        
        for i, book_data in enumerate(books_to_import):
            # Prepare request data for single book
            single_request_data = {
                'source_url': book_data.get('source_url'),
                'title': book_data.get('title'),
                'grade_id': book_data.get('grade_id') or default_grade_id,
                'subject_id': book_data.get('subject_id') or default_subject_id,
                'grade_level': book_data.get('grade_level'),
                'subject_name': book_data.get('subject_name'),
                'author': book_data.get('author', ''),
                'description': book_data.get('description', ''),
            }
            
            # Create a mock request object
            class MockRequest:
                def __init__(self, data):
                    self.data = data
            
            mock_request = MockRequest(single_request_data)
            
            # Process single book
            result = self.download_and_register(mock_request)
            
            if result.status_code == 201:
                results.append(result.data)
            else:
                errors.append({
                    'index': i,
                    'title': book_data.get('title', 'Unknown'),
                    'error': result.data.get('error', 'Unknown error')
                })
        
        return Response({
            'imported': results,
            'errors': errors,
            'total_imported': len(results),
            'total_errors': len(errors)
        }, status=status.HTTP_201_CREATED if results else status.HTTP_400_BAD_REQUEST)
    
    def _extract_title_from_url(self, url):
        """Extract a readable title from a URL."""
        # Remove protocol and common path parts
        clean_url = url.replace('https://', '').replace('http://', '')
        clean_url = clean_url.replace('www.', '')
        
        # Get the last part of the path
        parts = clean_url.split('/')
        filename = parts[-1] if parts else 'downloaded-book'
        
        # Remove file extension
        if filename.endswith('.pdf'):
            filename = filename[:-4]
        
        # Replace hyphens and underscores with spaces
        title = filename.replace('-', ' ').replace('_', ' ')
        
        # Capitalize words
        title = ' '.join(word.capitalize() for word in title.split())
        
        return title if title else 'Untitled Book'
