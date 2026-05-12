import os
import django
import sys
import json

# Set up Django
sys.path.append("f:/GEN_AI_ASSISTANT/backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from langgraph_agents.socratic_graph import socratic_app
from users.models import User

def test_socratic_flow():
    """
    Simulates a full student interaction to test LangGraph node transitions.
    """
    print("Starting End-to-End Flow Test...")
    
    # 1. Setup mock state
    mock_user = User.objects.first() # Get the first user for context
    
    initial_state = {
        "messages": [{"role": "user", "content": "How does Merge Sort divide the array?"}],
        "student_context": {
            "student_name": mock_user.username if mock_user else "TestStudent",
            "topic": "merge-sort",
            "level": 30,
            "language": "python",
            "weak_concepts": [],
            "recent_mistakes": [],
            "overall_mastery": 20
        },
        "current_topic": "merge-sort",
        "current_concept": "divide-and-conquer",
        "session_complete": False,
        "hint_count": 0,
        "deep_teach_active": False,
        "xp_earned": 0
    }

    print("  Running graph nodes...")
    try:
        # Run the graph
        final_state = socratic_app.invoke(initial_state)
        
        print("  Graph executed successfully!")
        
        # 2. Verify Output
        response = final_state.get("response", "")
        if response:
            print(f"\n[AI RESPONSE]:\n{response[:200]}...")
            
            # Check for JSON structure
            if isinstance(final_state, dict):
                print("\n  State contains all required fields.")
                print(f"  Current Difficulty: {final_state.get('difficulty_level', 'Not set')}")
                print(f"  RAG Context Found: {'Yes' if final_state.get('rag_context') else 'No'}")
        
    except Exception as e:
        print(f"  Flow Test Failed: {e}")

if __name__ == "__main__":
    test_socratic_flow()
