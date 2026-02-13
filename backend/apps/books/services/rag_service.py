import logging
import uuid
import requests
from io import BytesIO
import PyPDF2
from typing import List, Dict, Any, Tuple, Optional
from apps.core.services.ai_service import AIService
from apps.core.services.pinecone_service import PineconeService
from apps.core.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)

class RAGService:
    """Service for RAG operations: indexing and querying."""
    
    def __init__(self):
        self.ai = AIService()
        self.pinecone = PineconeService()
        self.chunk_size = 1000  # Local characters
        self.chunk_overlap = 200

    def ingest_book(self, book_id: str) -> bool:
        """Fetch book PDF, chunk it, embed it, and store in Pinecone."""
        try:
            logger.info(f"Starting RAG ingestion for book: {book_id}")
            
            # Fetch book from Supabase
            book = SupabaseService.fetch_by_id('books', book_id)
            if not book:
                logger.error(f"Book {book_id} not found in database.")
                return False
                
            pdf_url = book.get('download_url')
            if not pdf_url:
                logger.error(f"No download URL for book {book_id}")
                return False
                
            # Download PDF
            response = requests.get(pdf_url)
            response.raise_for_status()
            pdf_content = response.content
            
            # Extract text by page
            pages = self._extract_text_by_page(pdf_content)
            
            # Chunk and Embed
            vectors = []
            chunk_count = 0
            
            for page in pages:
                page_text = page['text']
                page_num = page['page_number']
                
                # Simple sliding window chunking
                # In production, use a more sophisticated chunker (e.g. LangChain)
                chunks = self._chunk_text(page_text)
                
                for i, chunk in enumerate(chunks):
                    if not chunk.strip():
                        continue
                        
                    embedding = self.ai.generate_embedding(chunk)
                    
                    vector_id = f"{book_id}_p{page_num}_c{i}"
                    vectors.append({
                        "id": vector_id,
                        "values": embedding,
                        "metadata": {
                            "book_id": book_id,
                            "page_number": page_num,
                            "chunk_index": i,
                            "text": chunk,
                            "book_title": book.get('title', 'Unknown')
                        }
                    })
                    chunk_count += 1
                    
                    # Batch upsert to avoid large requests
                    if len(vectors) >= 100:
                        self.pinecone.upsert_vectors(vectors)
                        vectors = []
            
            # Final upsert
            if vectors:
                self.pinecone.upsert_vectors(vectors)
                
            # Update book status in DB
            SupabaseService.update_record('books', book_id, {
                'is_processed': True,
                'metadata': {**book.get('metadata', {}), 'rag_indexed': True}
            })
            
            logger.info(f"Successfully ingested book {book_id}. Total chunks: {chunk_count}")
            return True
            
        except Exception as e:
            logger.error(f"Error ingesting book {book_id} into RAG: {e}")
            return False

    def query_book_context(self, query: str, book_id: Optional[str] = None, top_k: int = 5) -> str:
        """Search for relevant chunks and return formatted context."""
        try:
            query_embedding = self.ai.generate_embedding(query)
            
            filter = None
            if book_id:
                filter = {"book_id": book_id}
                
            matches = self.pinecone.query_vectors(query_embedding, top_k=top_k, filter=filter)
            
            context_parts = []
            for match in matches:
                metadata = match.get('metadata', {})
                text = metadata.get('text', '')
                page = metadata.get('page_number', '?')
                title = metadata.get('book_title', 'Book')
                
                context_parts.append(f"--- FROM {title}, PAGE {page} ---\n{text}")
                
            return "\n\n".join(context_parts)
            
        except Exception as e:
            logger.error(f"Error querying book context: {e}")
            return ""

    def _extract_text_by_page(self, pdf_content: bytes) -> List[Dict[str, Any]]:
        """Extract text from each page of the PDF."""
        pages = []
        try:
            pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_content))
            for i, page in enumerate(pdf_reader.pages):
                pages.append({
                    'page_number': i + 1,
                    'text': page.extract_text() or ''
                })
        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
        return pages

    def _chunk_text(self, text: str) -> List[str]:
        """Simple text chunking with overlap."""
        if not text:
            return []
            
        chunks = []
        start = 0
        while start < len(text):
            end = start + self.chunk_size
            chunks.append(text[start:end])
            start = end - self.chunk_overlap
            
        return chunks
