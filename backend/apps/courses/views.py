from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework import status
from apps.core.services.supabase_service import SupabaseService


class GradeViewSet(ViewSet):
    """ViewSet for Grade operations."""
    
    def list(self, request):
        grades = SupabaseService.fetch_table('grades', order_by='grade_number')
        return Response(grades)
    
    def retrieve(self, request, pk=None):
        grade = SupabaseService.fetch_by_id('grades', pk)
        if grade:
            return Response(grade)
        return Response(
            {'error': 'Grade not found'},
            status=status.HTTP_404_NOT_FOUND
        )


class SubjectViewSet(ViewSet):
    """ViewSet for Subject operations."""
    
    def list(self, request):
        subjects = SupabaseService.fetch_table('subjects', order_by='name')
        return Response(subjects)
    
    def retrieve(self, request, pk=None):
        subject = SupabaseService.fetch_by_id('subjects', pk)
        if subject:
            return Response(subject)
        return Response(
            {'error': 'Subject not found'},
            status=status.HTTP_404_NOT_FOUND
        )


class CourseViewSet(ViewSet):
    """ViewSet for Course (Conversation) operations."""
    
    def list(self, request):
        user_id = request.query_params.get('user_id')
        filters = {}
        if user_id:
            filters['user_id'] = user_id
        courses = SupabaseService.fetch_table('conversations', filters, order_by='updated_at')
        return Response(courses)
    
    def retrieve(self, request, pk=None):
        course = SupabaseService.fetch_by_id('conversations', pk)
        if course:
            return Response(course)
        return Response(
            {'error': 'Course not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    def create(self, request):
        data = request.data.copy()
        course = SupabaseService.insert_record('conversations', data)
        if course:
            return Response(course, status=status.HTTP_201_CREATED)
        return Response(
            {'error': 'Failed to create course'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def update(self, request, pk=None):
        course = SupabaseService.update_record('conversations', pk, request.data)
        if course:
            return Response(course)
        return Response(
            {'error': 'Failed to update course'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def destroy(self, request, pk=None):
        if SupabaseService.delete_record('conversations', pk):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            {'error': 'Failed to delete course'},
            status=status.HTTP_400_BAD_REQUEST
        )


class ConversationViewSet(ViewSet):
    """ViewSet for Conversation operations (alias for Course)."""
    
    def list(self, request):
        user_id = request.query_params.get('user_id')
        filters = {}
        if user_id:
            filters['user_id'] = user_id
        conversations = SupabaseService.fetch_table('conversations', filters, order_by='updated_at')
        return Response(conversations)
