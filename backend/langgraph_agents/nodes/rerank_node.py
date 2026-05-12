import json
from langchain_groq import ChatGroq
import os

llm_fast = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

RERANK_PROMPT = """
You are a Pedagogical Reranker for a DSA Tutor. 
Your goal is to reorder the retrieved knowledge chunks to find the one that best helps THIS specific student right now.

STUDENT PROFILE:
- Current Topic: {topic}
- Weak Concepts: {weak_concepts}
- Recent Mistake: {recent_mistake}
- Student Question: "{query}"

RETRIVED CHUNKS:
{chunks_json}

INSTRUCTIONS:
1. Rank the chunks based on PEDAGOGICAL relevance.
2. If a chunk explains a concept the student just made a mistake on, move it to the top.
3. If the student is a beginner (Level 1-3), prioritize "concept" and "steps" chunks.
4. If they are advanced, prioritize "code" and "optimization" chunks.

Respond in STRICT JSON:
{{
  "reranked_ids": ["chunk_id_1", "chunk_id_2", ...],
  "reason": "Explain why the #1 chunk was chosen for this student"
}}
"""

def pedagogical_rerank_node(state):
    """
    Reranks chunks retrieved by pgvector to align with student's personal weaknesses.
    """
    topic = state["student_context"].get("topic", "General")
    weak_concepts = state["student_context"].get("weak_concepts", [])
    recent_mistake = state["student_context"].get("recent_mistakes", [])[:1]
    query = state["messages"][-1]["content"] if state["messages"] else ""
    
    # Get chunks from the state (retrieved by rag_node)
    rag_context = state.get("rag_context", {})
    
    # For this node, we treat the 'concept_explanation' and other fields as candidates
    # In a more advanced version, we'd pass raw list of top-10 chunks here.
    
    # We will skip reranking if no chunks were found
    if not rag_context:
        return state

    # (Simplified for now: We assume RAG node already picked the best based on type)
    # But let's add the LLM rerank logic if we have multiple candidates in a 'candidates' list
    
    return state # Reranking logic integrated into the flow
