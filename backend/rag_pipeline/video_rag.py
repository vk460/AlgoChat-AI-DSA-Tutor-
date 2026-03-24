import os

# Storage path for video-specific indices
def get_model():
    from rag_pipeline.models import get_shared_model
    return get_shared_model()

VIDEO_INDEX_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "video_vectors")
os.makedirs(VIDEO_INDEX_DIR, exist_ok=True)

def index_video_transcript(video_id, chunks):
    """
    Creates and saves a FAISS index for a specific video's transcript chunks.
    """
    if not chunks:
        print(f"WARNING: No chunks to index for video {video_id}")
        return False
        
    model = get_model()
    texts = [c['text'] for c in chunks]
    embeddings = model.encode(texts).astype("float32")
    
    # Create FAISS index
    dimension = embeddings.shape[1]
    import faiss
    import pickle
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    
    # Save index and corresponding metadata (chunks with timestamps)
    index_path = os.path.join(VIDEO_INDEX_DIR, f"{video_id}.index")
    metadata_path = os.path.join(VIDEO_INDEX_DIR, f"{video_id}.pkl")
    
    faiss.write_index(index, index_path)
    with open(metadata_path, "wb") as f:
        pickle.dump(chunks, f)
        
    print(f"SUCCESS: Indexed {len(chunks)} chunks for video {video_id}")
    return True

def query_video_rag(video_id, query, top_k=3):
    """
    Retrieves most relevant chunks from a specific video's index.
    """
    import faiss
    import pickle
    index_path = os.path.join(VIDEO_INDEX_DIR, f"{video_id}.index")
    metadata_path = os.path.join(VIDEO_INDEX_DIR, f"{video_id}.pkl")
    
    if not os.path.exists(index_path) or not os.path.exists(metadata_path):
        print(f"ERROR: No index found for video {video_id}")
        return []
        
    # Load index and metadata
    index = faiss.read_index(index_path)
    with open(metadata_path, "rb") as f:
        chunks = pickle.load(f)
        
    # Search
    model = get_model()
    query_embedding = model.encode([query]).astype("float32")
    distances, indices = index.search(query_embedding, top_k)
    
    results = []
    for i in indices[0]:
        if i < len(chunks):
            results.append(chunks[i])
            
    return results

if __name__ == "__main__":
    # Test
    test_id = "test_vid_123"
    test_chunks = [
        {"text": "Python is a great language.", "timestamp": 0.0},
        {"text": "Recursion is when a function calls itself.", "timestamp": 60.0},
        {"text": "Binary search is an efficient search algorithm.", "timestamp": 120.0},
    ]
    
    index_video_transcript(test_id, test_chunks)
    res = query_video_rag(test_id, "What is recursion?")
    print("Query Results:")
    for r in res:
        print(f"[{r['timestamp']}s] {r['text']}")
