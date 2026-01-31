from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from apps.core.services.supabase_service import SupabaseService
from apps.core.services.ai_service import AIService
import logging

logger = logging.getLogger(__name__)


class ConversationViewSet(ViewSet):
    """ViewSet for Conversation operations."""
    
    def list(self, request):
        """List conversations for the authenticated user."""
        user_id = request.META.get('HTTP_X_USER_ID')
        filters = {'user_id': user_id} if user_id else {}
        
        conversations = SupabaseService.fetch_table(
            'conversations', 
            filters, 
            order_by='updated_at',
            order_desc=True
        )
        return Response(conversations)
    
    def retrieve(self, request, pk=None):
        """Get a specific conversation with messages."""
        conversation = SupabaseService.fetch_by_id('conversations', pk)
        if conversation:
            # Get messages for this conversation
            messages = SupabaseService.fetch_table(
                'messages',
                {'conversation_id': pk},
                order_by='created_at'
            )
            conversation['messages'] = messages
            return Response(conversation)
        return Response(
            {'error': 'Conversation not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    def create(self, request):
        """Create a new conversation."""
        user_id = request.META.get('HTTP_X_USER_ID')
        data = request.data.copy()
        
        if user_id:
            data['user_id'] = user_id
        
        conversation = SupabaseService.insert_record('conversations', data)
        if conversation:
            return Response(conversation, status=status.HTTP_201_CREATED)
        return Response(
            {'error': 'Failed to create conversation'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def destroy(self, request, pk=None):
        """Delete a conversation and its messages."""
        # Delete messages first
        messages = SupabaseService.fetch_table('messages', {'conversation_id': pk})
        for msg in messages:
            SupabaseService.delete_record('messages', msg['id'])
        
        if SupabaseService.delete_record('conversations', pk):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            {'error': 'Failed to delete conversation'},
            status=status.HTTP_400_BAD_REQUEST
        )


class ChatView(APIView):
    """Chat API endpoint for AI responses with context."""
    
    def post(self, request):
        """
        Process a chat message and return AI response.
        
        Expected request data:
            - message: User's message
            - conversation_id: Existing conversation ID (optional)
            - context: Additional context (optional)
            - grade_id: User's grade ID (optional)
            - subject_id: Current subject ID (optional)
        
        Returns:
            - response: AI response
            - conversation_id: Conversation ID
            - message_id: Message ID
        """
        user_message = request.data.get('message')
        conversation_id = request.data.get('conversation_id')
        context = request.data.get('context', {})
        grade_id = request.data.get('grade_id')
        subject_id = request.data.get('subject_id')
        
        if not user_message:
            return Response(
                {'error': 'Message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_id = request.META.get('HTTP_X_USER_ID')
        
        try:
            # Get or create conversation
            if not conversation_id:
                conversation_data = {
                    'user_id': user_id,
                    'title': user_message[:50] + '...' if len(user_message) > 50 else user_message,
                    'grade_id': grade_id,
                    'subject_id': subject_id,
                }
                conversation = SupabaseService.insert_record('conversations', conversation_data)
                conversation_id = conversation['id']
            else:
                conversation = SupabaseService.fetch_by_id('conversations', conversation_id)
            
            # Save user message
            user_msg_data = {
                'conversation_id': conversation_id,
                'role': 'user',
                'content': user_message,
            }
            user_message_record = SupabaseService.insert_record('messages', user_msg_data)
            
            # Get conversation history
            messages = SupabaseService.fetch_table(
                'messages',
                {'conversation_id': conversation_id},
                order_by='created_at'
            )
            
            # Build context from books and documents
            context_text = ""
            
            # Get relevant books if grade/subject specified
            if grade_id or subject_id:
                book_filters = {}
                if grade_id:
                    book_filters['grade_id'] = grade_id
                if subject_id:
                    book_filters['subject_id'] = subject_id
                
                books = SupabaseService.fetch_table('books', book_filters, limit=5)
                if books:
                    context_text = "Relevant educational content:\n"
                    for book in books:
                        if book.get('extracted_text'):
                            # Use first 500 chars of extracted text
                            context_text += f"- {book['title']}: {book['extracted_text'][:500]}...\n"
            
            # Get relevant documents
            documents = SupabaseService.fetch_table(
                'documents',
                {'conversation_id': conversation_id},
                limit=3
            )
            if documents:
                context_text += "\nUploaded documents:\n"
                for doc in documents:
                    if doc.get('extracted_text'):
                        context_text += f"- {doc['file_name']}: {doc['extracted_text'][:300]}...\n"
            
            # Build message history for AI
            message_history = []
            for msg in messages[-10:]:  # Last 10 messages
                message_history.append({
                    'role': msg['role'],
                    'content': msg['content']
                })
            
            # Get AI response
            ai_service = AIService()
            ai_response = ai_service.chat(
                message=user_message,
                context=context_text,
                conversation_history=message_history,
                system_prompt=context.get('system_prompt')
            )
            
            # Save AI response
            ai_msg_data = {
                'conversation_id': conversation_id,
                'role': 'assistant',
                'content': ai_response,
            }
            ai_message_record = SupabaseService.insert_record('messages', ai_msg_data)
            
            # Update conversation timestamp
            SupabaseService.update_record('conversations', conversation_id, {'updated_at': 'now()'})
            
            return Response({
                'response': ai_response,
                'conversation_id': conversation_id,
                'message_id': ai_message_record['id'],
                'context_used': bool(context_text)
            })
            
        except Exception as e:
            logger.error(f"Chat error: {e}")
            return Response(
                {'error': f'Chat failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
