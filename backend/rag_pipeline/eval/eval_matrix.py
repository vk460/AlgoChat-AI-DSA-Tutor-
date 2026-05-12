import os
import django
import sys
import json
from rich.console import Console
from rich.table import Table

# Set up Django
sys.path.append("f:/GEN_AI_ASSISTANT/backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from langgraph_agents.nodes.rag_node import retrieve_chunks
from langgraph_agents.nodes.faithfulness_node import faithfulness_check_node

console = Console()

# Ground Truth Test Suite
EVAL_TEST_CASES = [
    {
        "query": "How do I choose the mid element to avoid overflow?",
        "topic": "binary-search",
        "expected_concept": "mid_calculation",
        "level": 3
    },
    {
        "query": "What is the time complexity of the merge step?",
        "topic": "merge-sort",
        "expected_concept": "complexity",
        "level": 5
    },
    {
        "query": "How to reverse a linked list using three pointers?",
        "topic": "linked-list",
        "expected_concept": "reversal",
        "level": 4
    },
    {
        "query": "Why use Two Pointers for sum of two numbers?",
        "topic": "two-pointers",
        "expected_concept": "two_sum",
        "level": 2
    },
    {
        "query": "Base case for binary tree height calculation",
        "topic": "binary-tree",
        "expected_concept": "height",
        "level": 3
    }
]

def run_evaluation_matrix():
    table = Table(title="Socratic Tutor - Evaluation Matrix")
    table.add_column("Query", style="cyan")
    table.add_column("Retrieval Accuracy", style="green")
    table.add_column("Faithfulness Score", style="magenta")
    table.add_column("Status", style="bold")

    results = []

    console.print("[bold yellow]Starting Pedagogical Stress Test...[/bold yellow]\n")

    for test in EVAL_TEST_CASES:
        # 1. Test Retrieval
        retrieved = retrieve_chunks(test["query"], test["topic"], "concept", 3)
        
        retrieval_hit = any(test["expected_concept"].lower() in r["content"].lower() or 
                           test["topic"].lower() in r["content"].lower() for r in retrieved)
        
        # 2. Test Faithfulness (Mocking a response for the check)
        mock_state = {
            "rag_context": retrieved,
            "response": f"To solve {test['topic']}, you should follow the steps in the retrieved context about {test['expected_concept']}."
        }
        faith_report = faithfulness_check_node(mock_state)["faithfulness_report"]
        
        score = faith_report.get("score", 0)
        status = "PASS" if retrieval_hit and score > 0.7 else "FAIL"
        
        table.add_row(
            test["query"][:40] + "...",
            "100%" if retrieval_hit else "0%",
            f"{score*100:.1f}%",
            status
        )
        
        results.append({
            "query": test["query"],
            "hit": retrieval_hit,
            "faith_score": score
        })

    console.print(table)
    
    avg_hit = sum(1 for r in results if r["hit"]) / len(results)
    avg_faith = sum(r["faith_score"] for r in results) / len(results)
    
    console.print(f"\n[bold]Final Metrics:[/bold]")
    console.print(f"Retrieval Precision@3: {avg_hit*100:.2f}%")
    console.print(f"Context Faithfulness: {avg_faith*100:.2f}%")

if __name__ == "__main__":
    run_evaluation_matrix()
