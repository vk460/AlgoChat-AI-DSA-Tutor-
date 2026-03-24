# Unified model loader to save memory on small servers (Render Free Tier)
_model = None

def get_shared_model():
    """
    Returns a singleton instance of the SentenceTransformer model.
    Loading this once saves ~300MB-500MB of RAM compared to multiple loads.
    """
    global _model
    if _model is None:
        import gc
        import os
        
        # Limit Torch memory overhead before loading
        os.environ["OMP_NUM_THREADS"] = "1"
        os.environ["MKL_NUM_THREADS"] = "1"
        
        print("FORCING GC BEFORE MODEL LOAD")
        gc.collect()
        
        from sentence_transformers import SentenceTransformer
        import torch
        torch.set_num_threads(1)
        
        print("LOADING SHARED MODEL: sentence-transformers/all-MiniLM-L6-v2")
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        
        # Collect again after loading to prune temp buffers
        gc.collect()
        
    return _model
