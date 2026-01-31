"""
URL configuration for Insight Navigator backend.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.courses.views import GradeViewSet, SubjectViewSet, CourseViewSet
from apps.books.views import BookViewSet
from apps.files.views import DocumentViewSet
from apps.chat.views import ChatView, ConversationViewSet
from apps.auth.views import SupabaseAuthView

# Create router for viewsets
router = DefaultRouter()
router.register(r'grades', GradeViewSet, basename='grades')
router.register(r'subjects', SubjectViewSet, basename='subjects')
router.register(r'courses', CourseViewSet, basename='courses')
router.register(r'books', BookViewSet, basename='books')
router.register(r'documents', DocumentViewSet, basename='documents')
router.register(r'conversations', ConversationViewSet, basename='conversations')

urlpatterns = [
    # API v1 endpoints
    path('api/v1/', include(router.urls)),
    
    # Chat endpoint
    path('api/v1/chat/', ChatView.as_view(), name='chat'),
    
    # Auth endpoints
    path('api/v1/auth/verify/', SupabaseAuthView.as_view(), name='auth-verify'),
    
    # File upload endpoint
    path('api/v1/upload/', DocumentViewSet.as_view({'post': 'create'}), name='file-upload'),
    
    # Book download endpoint
    path('api/v1/books/<str:book_id>/download/', BookViewSet.as_view({'get': 'download'}), name='book-download'),
    
    # Book pipeline endpoints: Download → Upload → Register
    path('api/v1/books/download-register/', BookViewSet.as_view({'post': 'download_and_register'}), name='book-download-register'),
    path('api/v1/books/bulk-download-register/', BookViewSet.as_view({'post': 'bulk_download_and_register'}), name='book-bulk-download-register'),
]
