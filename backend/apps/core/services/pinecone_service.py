import logging
from typing import List, Dict, Any, Optional
from pinecone import Pinecone, ServerlessSpec
from django.conf import settings

logger = logging.getLogger(__name__)

class PineconeService:
    """Service for interacting with Pinecone Vector Database."""
    
    def __init__(self):
        self.api_key = settings.PINECONE_API_KEY
        self.index_name = settings.PINECONE_INDEX_NAME
        
        if not self.api_key:
            logger.warning("PINECONE_API_KEY not set. Pinecone functionality will be disabled.")
            self.pc = None
            self.index = None
            return

        try:
            self.pc = Pinecone(api_key=self.api_key)
            
            # Create index if it doesn't exist
            active_indexes = [idx.name for idx in self.pc.list_indexes()]
            if self.index_name not in active_indexes:
                logger.info(f"Creating Pinecone index: {self.index_name}")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=1536,  # OpenAI text-embedding-ada-002 dimension
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region="us-east-1"  # Default region, should probably be configurable
                    )
                )
            
            self.index = self.pc.Index(self.index_name)
        except Exception as e:
            logger.error(f"Error initializing Pinecone: {e}")
            self.pc = None
            self.index = None

    def upsert_vectors(self, vectors: List[Dict[str, Any]], namespace: str = "books"):
        """
        Upsert vectors to Pinecone.
        vectors format: [{"id": "chunk_1", "values": [...], "metadata": {...}}]
        """
        if not self.index:
            logger.error("Pinecone index not initialized.")
            return False
            
        try:
            self.index.upsert(vectors=vectors, namespace=namespace)
            return True
        except Exception as e:
            logger.error(f"Error upserting to Pinecone: {e}")
            return False

    def query_vectors(
        self, 
        vector: List[float], 
        top_k: int = 5, 
        filter: Optional[Dict[str, Any]] = None,
        namespace: str = "books"
    ) -> List[Dict[str, Any]]:
        """Query Pinecone for similar vectors."""
        if not self.index:
            logger.error("Pinecone index not initialized.")
            return []
            
        try:
            results = self.index.query(
                vector=vector,
                top_k=top_k,
                filter=filter,
                include_metadata=True,
                namespace=namespace
            )
            return results.get("matches", [])
        except Exception as e:
            logger.error(f"Error querying Pinecone: {e}")
            return []

    def delete_vectors(self, ids: List[str], namespace: str = "books"):
        """Delete vectors from Pinecone."""
        if not self.index:
            return False
            
        try:
            self.index.delete(ids=ids, namespace=namespace)
            return True
        except Exception as e:
            logger.error(f"Error deleting from Pinecone: {e}")
            return False
