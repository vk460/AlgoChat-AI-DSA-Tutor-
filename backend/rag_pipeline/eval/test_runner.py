import time
import random
import sys
import os
import django

# Set up Django context
sys.path.append("f:/GEN_AI_ASSISTANT/backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from langgraph_agents.socratic_graph import socratic_app
from rag_pipeline.eval.evaluator import evaluate_rules, llm_judge

STUDENT_PROFILES = [
    {"name": "LazyDev", "level": 10, "type": "beginner", "query": "just give me the code for merge sort"},
    {"name": "LogicLeaper", "level": 45, "type": "intermediate", "query": "why is the mid calculation different?"},
    {"name": "BugHunter", "level": 75, "type": "advanced", "query": "prove the O(n log n) bound for worst case"},
    {"name": "SilentLearner", "level": 20, "type": "confused", "query": "i dont understand the divide part"}
]

def run_production_tests(count=10):
    results = []
    print(f"Starting {count} Production Stress Tests...")

    for i in range(count):
        profile = random.choice(STUDENT_PROFILES)
        
        state = {
            "messages": [{"role": "user", "content": profile["query"]}],
            "student_context": {
                "student_name": profile["name"],
                "level": profile["level"],
                "language": "python",
                "topic": "merge-sort",
                "overall_mastery": profile["level"],
                "weak_concepts": []
            },
            "current_topic": "merge-sort",
            "mistake_dna": {},
            "hint_count": 0
        }

        start = time.time()
        try:
            # Invoke the real Socratic Graph
            final_state = socratic_app.invoke(state)
            latency = time.time() - start
            response_text = final_state.get("response", "")

            # 1. Rule Score
            rule_score = evaluate_rules(response_text)

            # 2. LLM Judge Score
            judge_score = llm_judge(response_text, profile)

            results.append({
                "iteration": i,
                "student": profile["name"],
                "rule_score": rule_score,
                "judge_score": judge_score,
                "latency": latency,
                "status": "SUCCESS"
            })
            print(f"  [{i+1}/{count}] {profile['name']}: Judge={judge_score} | Rules={rule_score} | {latency:.2f}s")

        except Exception as e:
            print(f"  [{i+1}/{count}] FAILED: {e}")
            results.append({"iteration": i, "status": "FAILED", "error": str(e)})

    return results
