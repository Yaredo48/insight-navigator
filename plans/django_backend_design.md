# Django Backend Architecture for AI-Powered Learning Platform

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React)                           │
│                    insight-navigator/                          │
│                   - Course Selection                           │
│                   - Chat Interface                             │
│                   - Book Management                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ REST API
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Django Backend (Python)                            │
│                  backend/                                       │
│   - Course APIs        - Chat APIs       - Book APIs            │
│   - Auth Integration   - AI Service      - File Processing      │
│   - Context Service    - Vector Search   - Data Ingestion       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ PostgreSQL Connection
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Supabase Database                             │
│   - Existing tables (courses, books, conversations, etc.)       │
│   - PostgreSQL with pgvector for embeddings                    │
│   - Row Level Security (RLS) policies                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ Storage
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│               Supabase Storage / AWS S3                         │
│   - PDF files    - Documents    - Images                        │
└─────────────────────────────────────────────────────────────────┘

## Key Design Decisions

1. **Database**: Connect Django to existing Supabase PostgreSQL database
2. **Authentication**: Keep using Supabase Auth (JWT-based)
3. **File Storage**: Use Supabase Storage or S3
4. **AI Integration**: Django handles OpenAI API calls
5. **Vector Search**: Use pgvector extension in Supabase
```

## 1. Project Structure

```
backend/
├── manage.py
├── requirements.txt
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── core/
│   │   ├── __init__.py
│   │   ├── models.py           # Supabase table mappings
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── ai_service.py
│   │       ├── embedding_service.py
│   │       ├── file_processor.py
│   │       └── supabase_service.py
│   ├── courses/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── books/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── files/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── chat/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   └── auth/
│       ├── __init__.py
│       ├── authentication.py  # Supabase JWT validation
│       ├── permissions.py
│       └── views.py
├── scripts/
│   └── sync_db.py
└── logs/
```

## 2. Django Settings (Supabase Connection)

```python
# config/settings.py
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Supabase Database Connection
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_PUBLISHABLE_KEY')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('SUPABASE_DB_NAME', 'postgres'),
        'USER': os.getenv('SUPABASE_DB_USER', 'postgres'),
        'PASSWORD': os.getenv('SUPABASE_DB_PASSWORD'),
        'HOST': os.getenv('SUPABASE_DB_HOST'),
        'PORT': os.getenv('SUPABASE_DB_PORT', '5432'),
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

# Supabase Storage
SUPABASE_STORAGE_URL = f"{SUPABASE_URL}/storage/v1"

# OpenAI
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
OPENAI_EMBEDDING_MODEL = 'text-embedding-ada-002'
OPENAI_CHAT_MODEL = 'gpt-4'

# JWT Validation (Supabase Auth)
JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET')
JWT_ALGORITHM = 'HS256'
```

## 3. Supabase Integration Service

```python
# apps/core/services/supabase_service.py
from supabase import create_client, Client
from django.conf import settings
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class SupabaseService:
    _client = None
    
    @classmethod
    def get_client(cls) -> Client:
        if cls._client is None:
            cls._client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_KEY
            )
        return cls._client
    
    @classmethod
    def fetch_table(cls, table: str, filters: Dict = None, limit: int = None) -> List[Dict]:
        """Fetch data from a Supabase table"""
        client = cls.get_client()
        query = client.table(table).select('*')
        
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        
        if limit:
            query = query.limit(limit)
        
        result = query.execute()
        return result.data or []
    
    @classmethod
    def insert_record(cls, table: str, data: Dict) -> Dict:
        """Insert a record into Supabase table"""
        client = cls.get_client()
        result = client.table(table).insert(data).execute()
        return result.data[0] if result.data else None
    
    @classmethod
    def update_record(cls, table: str, record_id: str, data: Dict) -> Dict:
        """Update a record in Supabase table"""
        client = cls.get_client()
        result = client.table(table).update(data).eq('id', record_id).execute()
        return result.data[0] if result.data else None
    
    @classmethod
    def delete_record(cls, table: str, record_id: str) -> bool:
        """Delete a record from Supabase table"""
        client = cls.get_client()
        result = client.table(table).delete().eq('id', record_id).execute()
        return len(result.data) > 0
    
    @classmethod
    def upload_file(cls, bucket: str, file_path: str, file_content: bytes) -> str:
        """Upload a file to Supabase Storage"""
        client = cls.get_client()
        result = client.storage.from_(bucket).upload(
            file_path,
            file_content,
            {'content-type': 'application/pdf'}
        )
        
        # Get public URL
        public_url = client.storage.from_(bucket).get_public_url(file_path)
        return public_url
```

## 4. Django Models (Mapping to Supabase Tables)

### 4.1 Core Models

```python
# apps/core/models.py
from django.db import models
import uuid

class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
        app_label = 'core'
```

### 4.2 Course Models (Supabase Tables: grades, subjects, conversations)

```python
# apps/courses/models.py
from django.db import models
from django.conf import settings

class Grade(BaseModel):
    grade_number = models.PositiveIntegerField(unique=True)
    name = models.CharField(max_length=100)
    
    class Meta:
        db_table = 'grades'
        ordering = ['grade_number']
    
    def __str__(self):
        return self.name

class Subject(BaseModel):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    
    class Meta:
        db_table = 'subjects'
    
    def __str__(self):
        return self.name

class Course(BaseModel):
    """Maps to conversations table with grade_id and subject_id"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    title = models.CharField(max_length=200, blank=True)
    role = models.CharField(max_length=20, default='student')
    grade = models.ForeignKey(
        Grade,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='courses'
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='courses'
    )
    
    class Meta:
        db_table = 'conversations'
    
    def __str__(self):
        return self.title or f"Course {self.id}"
```

### 4.3 Book Model (Supabase Table: books)

```python
# apps/books/models.py
from django.db import models
from django.conf import settings

class Book(BaseModel):
    title = models.CharField(max_length=500)
    author = models.CharField(max_length=200, blank=True)
    publisher = models.CharField(max_length=200, blank=True)
    isbn = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    
    # Relations to grade/subject
    grade = models.ForeignKey(
        'courses.Grade',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='books'
    )
    subject = models.ForeignKey(
        'courses.Subject',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='books'
    )
    
    # Chapter info
    chapter = models.PositiveIntegerField(null=True, blank=True)
    version = models.CharField(max_length=50, blank=True)
    published_year = models.PositiveIntegerField(null=True, blank=True)
    language = models.CharField(max_length=10, default='en')
    
    # File info
    file_name = models.CharField(max_length=500)
    file_size = models.BigIntegerField()
    file_type = models.CharField(max_length=100, default='application/pdf')
    storage_path = models.CharField(max_length=500)
    download_url = models.URLField(blank=True)
    source_url = models.URLField(blank=True)
    official_source = models.CharField(max_length=200, blank=True)
    
    # AI processing
    extracted_text = models.TextField(blank=True)
    is_processed = models.BooleanField(default=False)
    page_count = models.PositiveIntegerField(null=True, blank=True)
    
    # Vector embedding (using pgvector or JSON)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'books'
        ordering = ['grade', 'subject', 'chapter', 'title']
    
    def __str__(self):
        return self.title
```

### 4.4 Document/File Model (Supabase Table: documents)

```python
# apps/files/models.py
from django.db import models
from django.conf import settings

class Document(BaseModel):
    conversation = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='documents'
    )
    file_name = models.CharField(max_length=500)
    file_type = models.CharField(max_length=100)
    file_size = models.BigIntegerField()
    storage_path = models.CharField(max_length=500)
    
    # Content
    extracted_text = models.TextField(blank=True)
    document_type = models.CharField(max_length=50, blank=True)
    chapter = models.CharField(max_length=50, blank=True)
    topics = models.JSONField(default=list, blank=True)
    
    # AI processing
    is_processed = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'documents'
    
    def __str__(self):
        return self.file_name
```

### 4.5 Chat Models (Supabase Table: messages)

```python
# apps/chat/models.py
from django.db import models

class Message(BaseModel):
    conversation = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='messages'
    )
    role = models.CharField(max_length=20)  # 'user', 'assistant', 'system'
    content = models.TextField()
    
    class Meta:
        db_table = 'messages'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}"
```

## 5. Django REST Framework APIs

### 5.1 URLs Configuration

```python
# config/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.courses.views import CourseViewSet, GradeViewSet, SubjectViewSet
from apps.books.views import BookViewSet
from apps.files.views import DocumentViewSet
from apps.chat.views import ChatView, ConversationViewSet
from apps.auth.views import SupabaseAuthView

router = DefaultRouter()
router.register(r'grades', GradeViewSet, basename='grades')
router.register(r'subjects', SubjectViewSet, basename='subjects')
router.register(r'courses', CourseViewSet, basename='courses')
router.register(r'books', BookViewSet, basename='books')
router.register(r'documents', DocumentViewSet, basename='documents')
router.register(r'conversations', ConversationViewSet, basename='conversations')

urlpatterns = [
    path('api/v1/', include(router.urls)),
    path('api/v1/chat/', ChatView.as_view(), name='chat'),
    path('api/v1/auth/verify/', SupabaseAuthView.as_view(), name='auth-verify'),
    path('api/v1/upload/', DocumentViewSet.as_view({'post': 'create'}), name='file-upload'),
]
```

### 5.2 Chat API View

```python
# apps/chat/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import openai
from apps.core.services.supabase_service import SupabaseService
from apps.core.services.ai_service import AIService

class ChatView(APIView):
    def post(self, request):
        user = request.user
        course_id = request.data.get('course_id')
        message = request.data.get('message')
        conversation_id = request.data.get('conversation_id')
        
        if not message:
            return Response(
                {'error': 'Message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create conversation
        if conversation_id:
            conversation = SupabaseService.fetch_table(
                'conversations',
                {'id': conversation_id}
            )[0]
        else:
            conversation = SupabaseService.insert_record('conversations', {
                'user_id': user.id,
                'role': 'student',
                'title': message[:50],
                'grade_id': course_id.get('grade_id') if course_id else None,
                'subject_id': course_id.get('subject_id') if course_id else None,
            })
            conversation_id = conversation['id']
        
        # Save user message
        SupabaseService.insert_record('messages', {
            'conversation_id': conversation_id,
            'role': 'user',
            'content': message,
        })
        
        # Get context from books and documents
        context = self._get_context(course_id, message)
        
        # Get chat history
        history = SupabaseService.fetch_table(
            'messages',
            {'conversation_id': conversation_id},
            limit=10
        )
        
        # Build prompt with context
        prompt = self._build_prompt(message, context, history)
        
        # Call AI
        ai_service = AIService()
        response_text = ai_service.generate_response(prompt)
        
        # Save assistant message
        SupabaseService.insert_record('messages', {
            'conversation_id': conversation_id,
            'role': 'assistant',
            'content': response_text,
        })
        
        return Response({
            'conversation_id': conversation_id,
            'response': response_text,
            'context_used': context is not None
        })
    
    def _get_context(self, course_id, query):
        """Get relevant book and document context"""
        books = SupabaseService.fetch_table('books', {
            'grade_id': course_id.get('grade_id') if course_id else None,
            'subject_id': course_id.get('subject_id') if course_id else None,
        }, limit=5)
        
        # Format book context
        context = \"\"\"
## Available Reference Materials:
\"\"\"
        
        for book in books:
            if book.get('extracted_text'):
                context += f\"\"\"
### {book['title']} by {book.get('author', 'Unknown')}
Chapter: {book.get('chapter', 'N/A')}

Content:
{book['extracted_text'][:2000]}
---
\"\"\"
        
        return context
    
    def _build_prompt(self, message, context, history):
        system_prompt = \"\"\"You are an AI learning assistant for Ethiopian secondary schools.
        Use the reference materials provided to answer questions accurately.\"\"\"
        
        # Build messages array
        messages = [
            {\"role\": \"system\", \"content\": system_prompt},
        ]
        
        if context:
            messages.append({\"role\": \"system\", \"content\": context})
        
        # Add history
        for msg in history:
            messages.append({
                \"role\": msg['role'],
                \"content\": msg['content']
            })
        
        messages.append({\"role\": \"user\", \"content\": message})
        
        return messages
```

## 6. AI Service

```python
# apps/core/services/ai_service.py
import openai
from django.conf import settings
from typing import List, Dict

class AIService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.embedding_model = settings.OPENAI_EMBEDDING_MODEL
        self.chat_model = settings.OPENAI_CHAT_MODEL
    
    def generate_response(self, messages: List[Dict[str, str]]) -> str:
        \"\"\"Generate AI response with chat history\"\"\"
        response = self.client.chat.completions.create(
            model=self.chat_model,
            messages=messages,
            temperature=0.7,
            max_tokens=1000
        )
        return response.choices[0].message.content
    
    def generate_embedding(self, text: str) -> List[float]:
        \"\"\"Generate embedding for text\"\"\"
        response = self.client.embeddings.create(
            model=self.embedding_model,
            input=text[:8000]
        )
        return response.data[0].embedding
```

## 7. File Processor Service

```python
# apps/core/services/file_processor.py
import PyPDF2
import docx2txt
from django.core.files.uploadedfile import UploadedFile
from typing import Tuple

class FileProcessor:
    SUPPORTED_TYPES = {
        'application/pdf': 'pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'text/plain': 'txt',
    }
    
    def process_file(self, file: UploadedFile) -> Tuple[str, int]:
        file_type = self.SUPPORTED_TYPES.get(file.content_type)
        
        if not file_type:
            raise ValueError(f\"Unsupported file type: {file.content_type}\")
        
        if file_type == 'pdf':
            return self._process_pdf(file)
        elif file_type == 'docx':
            return self._process_docx(file)
        elif file_type == 'txt':
            return self._process_txt(file)
    
    def _process_pdf(self, file: UploadedFile) -> Tuple[str, int]:
        pdf_reader = PyPDF2.PdfReader(file)
        text = ''
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text, len(pdf_reader.pages)
    
    def _process_docx(self, file: UploadedFile) -> Tuple[str, int]:
        text = docx2txt.process(file)
        return text, 1
    
    def _process_txt(self, file: UploadedFile) -> Tuple[str, int]:
        content = file.read().decode('utf-8')
        return content, 1
```

## 8. Requirements

```txt
# requirements.txt
Django>=4.2
djangorestframework>=3.14
psycopg2-binary>=2.9
django-cors-headers>=4.3
openai>=1.3
python-dotenv>=1.0
PyPDF2>=3.0
python-docx>=1.1
supabase>=2.0
gunicorn>=21.0
```

## 9. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/grades/` | GET | List all grades |
| `/api/v1/subjects/` | GET | List all subjects |
| `/api/v1/courses/` | GET/POST | List/create courses (conversations) |
| `/api/v1/courses/<id>/` | GET/PUT/DELETE | Course operations |
| `/api/v1/books/` | GET/POST | List/add books |
| `/api/v1/books/<id>/` | GET/PUT/DELETE | Book operations |
| `/api/v1/documents/` | GET/POST | List/upload documents |
| `/api/v1/chat/` | POST | Send chat message |
| `/api/v1/auth/verify/` | POST | Verify Supabase JWT |

## 10. Frontend Integration

Update the React frontend to use Django REST API instead of Supabase SDK:

```typescript
// Update useChat.ts to use Django API
const sendMessage = async (content: string) => {
  const response = await fetch('http://localhost:8000/api/v1/chat/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseToken}`,
    },
    body: JSON.stringify({
      message: content,
      course_id: { gradeId, subjectId },
      conversation_id: currentConversationId,
    }),
  });
  
  const data = await response.json();
  return data;
};
```
