from io import BytesIO
from typing import Tuple
import PyPDF2
import docx2txt
import logging

logger = logging.getLogger(__name__)


class FileProcessor:
    """Service for processing uploaded files (PDF, DOCX, TXT)."""
    
    SUPPORTED_TYPES = {
        'application/pdf': 'pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'text/plain': 'txt',
    }
    
    def process_file(self, file_content: bytes, file_type: str) -> Tuple[str, int]:
        """
        Process a file and extract text.
        
        Returns:
            Tuple of (extracted_text, page_count)
        """
        processor = self._get_processor(file_type)
        if not processor:
            raise ValueError(f"Unsupported file type: {file_type}")
        
        return processor(file_content)
    
    def _get_processor(self, file_type: str):
        """Get the appropriate processor for a file type."""
        processors = {
            'pdf': self._process_pdf,
            'docx': self._process_docx,
            'txt': self._process_txt,
        }
        return processors.get(file_type)
    
    def _process_pdf(self, file_content: bytes) -> Tuple[str, int]:
        """Extract text from PDF."""
        try:
            pdf_reader = PyPDF2.PdfReader(BytesIO(file_content))
            text = ''
            for page in pdf_reader.pages:
                text += page.extract_text() or ''
            return text, len(pdf_reader.pages)
        except Exception as e:
            logger.error(f"Error processing PDF: {e}")
            raise
    
    def _process_docx(self, file_content: bytes) -> Tuple[str, int]:
        """Extract text from DOCX."""
        try:
            text = docx2txt.process(BytesIO(file_content))
            return text, 1
        except Exception as e:
            logger.error(f"Error processing DOCX: {e}")
            raise
    
    def _process_txt(self, file_content: bytes) -> Tuple[str, int]:
        """Extract text from TXT."""
        try:
            text = file_content.decode('utf-8')
            return text, 1
        except Exception as e:
            logger.error(f"Error processing TXT: {e}")
            raise
    
    def get_file_type(self, content_type: str) -> str:
        """Get the processor file type from content type."""
        return self.SUPPORTED_TYPES.get(content_type, '')
    
    def is_supported(self, content_type: str) -> bool:
        """Check if a content type is supported."""
        return content_type in self.SUPPORTED_TYPES
