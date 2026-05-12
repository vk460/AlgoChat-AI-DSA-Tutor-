import os
import django
import sys
from sentence_transformers import SentenceTransformer

# Set up Django environment
sys.path.append("f:/GEN_AI_ASSISTANT/backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from langgraph_agents.models import KnowledgeChunk
from rag_pipeline.chunker.semantic_chunker import get_all_chunks
from rag_pipeline.validator.chunk_validator import validate_chunk

# Load embedding model (384 dims)
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def migrate_to_pgvector():
    """
    Reads structured JSON data, chunks it, validates it, and stores in pgvector.
    """
    print("🚀 Starting migration to pgvector...")
    
    chunks = get_all_chunks()
    if not chunks:
        print("❌ No chunks found. Did you run the scraper first?")
        return

    print(f"📦 Found {len(chunks)} total chunks. Starting processing...")

    count = 0
    for chunk in chunks:
        try:
            # 1. (Optional) Validate chunk logic
            # For massive ingestion, we might skip or do this in batches
            # valid_result = validate_chunk(chunk.content, chunk.topic, chunk.chunk_type)
            # if not valid_result['is_correct'] and valid_result['corrected_content']:
            #     chunk.content = valid_result['corrected_content']

            # 2. Generate Embedding
            vector = embedder.encode(chunk.content).tolist()

            # 3. Save to Django Model
            KnowledgeChunk.objects.update_or_create(
                chunk_id=chunk.chunk_id,
                defaults={
                    "topic":      chunk.topic,
                    "chunk_type": chunk.chunk_type,
                    "content":    chunk.content,
                    "metadata":   chunk.metadata,
                    "source":     chunk.source,
                    "embedding":  vector,
                }
            )
            count += 1
            if count % 10 == 0:
                print(f"  Processed {count}/{len(chunks)} chunks...")

        except Exception as e:
            print(f"  Failed to store chunk {chunk.chunk_id}: {e}")

    print(f"✅ Migration complete! {count} chunks stored in PostgreSQL.")

if __name__ == "__main__":
    migrate_to_pgvector()
