# Lazy loading resources
_model = None
_index = None
_chunks = None

def get_resources():
    global _model, _index, _chunks
    if _model is None:
        import faiss
        import pickle
        from sentence_transformers import SentenceTransformer
        import os
        
        # Determine the project root (backend/)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.dirname(os.path.dirname(current_dir))
        
        # Load embedding model
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        
        # Load FAISS index
        _index = faiss.read_index(os.path.join(backend_dir, "data", "processed", "faiss_index.bin"))
        
        # Load text chunks
        with open(os.path.join(backend_dir, "data", "processed", "chunks.pkl"), "rb") as f:
            _chunks = pickle.load(f)
            
    return _model, _index, _chunks

def retrieve_top_chunks(query, top_k=3):
    model, index, chunks = get_resources()
    
    # Convert query to embedding
    query_embedding = model.encode([query]).astype("float32")

    # Search in FAISS
    distances, indices = index.search(query_embedding, top_k)

    results = []
    for i in indices[0]:
        results.append(chunks[i])

    return results

if __name__ == "__main__":
    # Test query
    query = "What is a binary search tree?"
    results = retrieve_top_chunks(query)
    
    # print("\nTop Results:\n")
    for r in results:
        print(r)
        print("-"*50)