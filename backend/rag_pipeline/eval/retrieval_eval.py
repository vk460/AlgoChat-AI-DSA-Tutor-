import os
import django
import sys

# Set up Django
sys.path.append("f:/GEN_AI_ASSISTANT/backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from langgraph_agents.nodes.rag_node import retrieve_chunks

RETRIEVAL_TEST_CASES = [
    {
        "query": "how to find mid in binary search",
        "topic": "binary-search",
        "expected_concept": "mid_calculation",
    },
    {
        "query": "base case for binary tree traversal",
        "topic": "binary-tree",
        "expected_concept": "base_case",
    },
    {
        "query": "linked list reversal pointer logic",
        "topic": "linked-list",
        "expected_concept": "reversal",
    },
]

def run_retrieval_eval():
    """
    Calculates Precision@K for the RAG system.
    """
    print("🧪 Running Retrieval Evaluation...")
    
    total = len(RETRIEVAL_TEST_CASES)
    hits = 0
    
    for test in RETRIEVAL_TEST_CASES:
        results = retrieve_chunks(test["query"], test["topic"], "concept", 3)
        
        # Check if any retrieved chunk content contains keywords from expected concept
        found = False
        for res in results:
            if test["expected_concept"].lower() in res["content"].lower():
                found = True
                break
        
        if found:
            hits += 1
            print(f"  ✅ Match found for: '{test['query']}'")
        else:
            print(f"  ❌ Failed to retrieve correct concept for: '{test['query']}'")

    accuracy = (hits / total) * 100
    print(f"\n📊 Evaluation Results:")
    print(f"   Total Queries: {total}")
    print(f"   Successful Hits: {hits}")
    print(f"   RAG Accuracy (Precision@3): {accuracy:.2f}%")

if __name__ == "__main__":
    run_retrieval_eval()
