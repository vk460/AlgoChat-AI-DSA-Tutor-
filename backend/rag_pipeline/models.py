# Unified model loader to save memory on small servers (Render Free Tier)
_model = None

def get_shared_model():
    """
    Returns a singleton instance of the SentenceTransformer model.
    Loading this once saves ~300MB-500MB of RAM compared to multiple loads.
    """
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        print("LOADING SHARED MODEL: sentence-transformers/all-MiniLM-L6-v2")
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _model
