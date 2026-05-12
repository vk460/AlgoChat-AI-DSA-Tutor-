from langgraph_agents.models import KnowledgeChunk
from sentence_transformers import SentenceTransformer
from django.db import connection
import os

embedder = SentenceTransformer("all-MiniLM-L6-v2")

def retrieve_chunks(query, topic, chunk_type, top_k=2):
    """
    Performs pgvector similarity search filtered by topic and chunk type.
    """
    vec = embedder.encode(query).tolist()

    # Using raw SQL for pgvector operator <=> (cosine distance)
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT content, metadata, 1 - (embedding <=> %s::vector) AS score
            FROM langgraph_agents_knowledgechunk
            WHERE topic = %s AND chunk_type = %s
            ORDER BY embedding <=> %s::vector
            LIMIT %s
        """, [vec, topic, chunk_type, vec, top_k])
        
        rows = cursor.fetchall()
        return [{"content": r[0], "metadata": r[1], "score": r[2]} for r in rows]

import json

def rag_retrieval_node(state):
    """
    LangGraph node that gathers multi-modal context from pgvector.
    """
    print("  [DEBUG] rag_retrieval_node")
    topic = state["student_context"].get("topic", "General")
    concept = state.get("current_concept", topic)
    
    # Helper to parse metadata
    def parse_meta(m):
        if isinstance(m, str):
            try: return json.loads(m)
            except: return {}
        return m if isinstance(m, dict) else {}

    # 1. Retrieve Concept Explanation
    concept_data = retrieve_chunks(f"explain {concept}", topic, "concept", 1)
    
    # 2. Retrieve Code Example
    code_data = retrieve_chunks(f"{concept} {topic} code example", topic, "code", 1)
    
    # 3. Retrieve Algorithm Steps
    steps_data = retrieve_chunks(f"steps to perform {concept}", topic, "steps", 1)
    
    # 4. Retrieve Diagram (only if needed)
    diagram_data = []
    if state["student_context"].get("overall_mastery", 100) < 50:
        diagram_data = retrieve_chunks(f"visualization of {concept}", topic, "diagram", 1)

    rag_context = {
        "concept_explanation": concept_data[0]["content"] if concept_data else "No explanation found.",
        "code_example": parse_meta(code_data[0]["metadata"]) if code_data else None,
        "algorithm_steps": parse_meta(steps_data[0]["metadata"]).get("steps", []) if steps_data else [],
        "diagram": parse_meta(diagram_data[0]["metadata"]) if diagram_data else None
    }
    
    return {**state, "rag_context": rag_context}
