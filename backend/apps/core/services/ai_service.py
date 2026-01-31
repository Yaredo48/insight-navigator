import openai
from django.conf import settings
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class AIService:
    """Service for interacting with OpenAI API."""
    
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY must be set")
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.embedding_model = settings.OPENAI_EMBEDDING_MODEL
        self.chat_model = settings.OPENAI_CHAT_MODEL
    
    def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> str:
        """Generate AI response with chat history."""
        try:
            response = self.client.chat.completions.create(
                model=self.chat_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            raise
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text."""
        try:
            response = self.client.embeddings.create(
                model=self.embedding_model,
                input=text[:8000]  # Limit to 8000 chars
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise
    
    def build_system_prompt(
        self, 
        role: str = 'student', 
        grade: str = None, 
        subject: str = None
    ) -> str:
        """Build system prompt based on role and context."""
        if role == 'student':
            return f"""You are "Insight Navigator," an AI learning assistant for Ethiopian secondary schools (Grades 9-12).

You are helping a Grade {grade or 'secondary school'} student{' with ' + subject if subject else ''}.

## Your Role:
- Provide curriculum-aligned answers based on Ethiopian textbooks and educational materials
- Break down complex topics into step-by-step explanations
- Use examples and analogies relevant to Ethiopian students
- Ask comprehension questions to ensure understanding
- Be patient, encouraging, and supportive

## Guidelines:
1. Base answers on standard Ethiopian secondary school curriculum
2. Adjust complexity to the appropriate grade level
3. Use practical examples relevant to Ethiopian context
4. End with comprehension checks when appropriate

Remember: You are a patient, encouraging tutor helping Ethiopian students succeed in their studies."""
        elif role == 'teacher':
            return """You are "Insight Navigator," an AI assistant for Ethiopian secondary school teachers.

## Your Role:
- Provide teaching resources and pedagogical guidance
- Help create lesson plans aligned with Ethiopian curriculum
- Suggest teaching strategies and classroom activities
- Support classroom management and differentiated instruction

## Guidelines:
1. Professional, collegial tone
2. Base suggestions on Ethiopian educational standards
3. Provide actionable, classroom-ready resources
4. Consider Ethiopian educational context"""
        else:
            return """You are an AI-powered educational assistant for Ethiopian secondary schools.

## Core Principles:
1. Accuracy - Provide accurate, curriculum-aligned information
2. Clarity - Use clear, accessible language
3. Engagement - Make learning interactive
4. Support - Be helpful, patient, and encouraging
5. Context - Consider the Ethiopian educational context"""
    
    def generate_chat_response(
        self,
        user_message: str,
        context: str = None,
        history: List[Dict] = None,
        role: str = 'student',
        grade: str = None,
        subject: str = None
    ) -> str:
        """Generate chat response with context and history."""
        messages = []
        
        # Add system prompt
        system_prompt = self.build_system_prompt(role, grade, subject)
        messages.append({"role": "system", "content": system_prompt})
        
        # Add context if available
        if context:
            messages.append({
                "role": "system", 
                "content": f"Use the following reference materials when answering:\n\n{context}"
            })
        
        # Add chat history (last 10 messages)
        if history:
            for msg in history[-10:]:
                messages.append({
                    "role": msg.get('role', 'user'),
                    "content": msg.get('content', '')
                })
        
        # Add current message
        messages.append({"role": "user", "content": user_message})
        
        return self.generate_response(messages)
