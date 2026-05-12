import os
import sys
import json
import subprocess
import tempfile

# Add rag_pipeline to sys.path so its internal modules can refer to each other
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

from langgraph_agents.socratic_graph import socratic_app
from groq import Groq
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', '.env'))
API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=API_KEY) if API_KEY else None

# ---------------- DB HELPERS ----------------

def _load_concept_history(user_id: int) -> dict:
    """Load concept history from PostgreSQL for a specific user."""
    try:
        from users.models import ConceptHistory
        records = ConceptHistory.objects.filter(user_id=user_id)
        return {r.concept: {"quiz_taken": r.quiz_taken, "score": r.quiz_score} for r in records}
    except Exception as e:
        print(f"  [DB] Could not load concept history: {e}")
        return {}

def _save_concept_history(user_id: int, concept_history: dict):
    """Save updated concept history back to PostgreSQL."""
    try:
        from users.models import ConceptHistory
        for concept, data in concept_history.items():
            if data.get("quiz_taken"):
                ConceptHistory.objects.update_or_create(
                    user_id=user_id,
                    concept=concept,
                    defaults={"quiz_taken": True, "quiz_score": data.get("score", 0.0)}
                )
        print(f"  [DB] Concept history saved for user {user_id}: {list(concept_history.keys())}")
    except Exception as e:
        print(f"  [DB] Could not save concept history: {e}")

# ---------------- IN-MEMORY CACHE (for messages within a session) ----------------
SESSION_CACHE = {}

def ask_question(query, session_id="default", top_k=3, custom_history_text=None, student_context=None, user_id=1):
    """
    Neural Entry Point — DB-backed concept memory + LangGraph Socratic Engine.
    """
    if session_id not in SESSION_CACHE:
        SESSION_CACHE[session_id] = {
            "messages": [],
            "current_concept": "General",
            "diagnostic_index": 0,
            "is_diagnostic": False,
            "show_quiz": False,
            "quiz_data": [],
            "response": "",
            "mistake_dna": {}
        }

    # Always load fresh concept_history from DB (survives restarts)
    db_history = _load_concept_history(user_id)
    current_state = SESSION_CACHE[session_id].copy()
    current_state["concept_history"] = db_history
    current_state["messages"] = SESSION_CACHE[session_id]["messages"] + [{"role": "user", "content": query}]

    try:
        result = socratic_app.invoke(current_state)

        # Persist updated concept history to DB
        updated_history = result.get("concept_history", {})
        _save_concept_history(user_id, updated_history)

        # Update in-memory session cache (for message history only)
        SESSION_CACHE[session_id]["messages"] = result["messages"] + [
            {"role": "assistant", "content": result["response"]}
        ]
        SESSION_CACHE[session_id]["mistake_dna"] = result.get("mistake_dna", {})

        return {
            "answer": result["response"],
            "show_quiz": result.get("show_quiz", False),
            "current_concept": result.get("current_concept", "General"),
            "quiz_data": result.get("quiz_data", [])
        }
    except Exception as e:
        print(f"Neural Engine Error: {e}")
        return {"answer": "Neural link failure.", "show_quiz": False, "current_concept": "General"}


# ---------------- UTILITIES ----------------

def run_python_code(code, input_data="", timeout=5):
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode='w', encoding='utf-8') as tmp:
        tmp.write(code)
        tmp_path = tmp.name
    try:
        result = subprocess.run([sys.executable, tmp_path], input=input_data, capture_output=True, text=True, timeout=timeout)
        return (result.stdout + "\n" + result.stderr).strip() or "No output."
    except Exception as e:
        return f"Error: {str(e)}"
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def analyze_code(code, execute_output, goal, session_id="practice_default"):
    prompt = f"Student Code:\n{code}\nOutput:\n{execute_output}\nGoal: {goal}\nSocratically guide them to fix errors."
    res = client.chat.completions.create(messages=[{"role": "user", "content": prompt}], model="llama-3.3-70b-versatile")
    return res.choices[0].message.content

def process_video_transcript(transcript, session_id="video_default"):
    prompt = f"Break this transcript into 3-5 learning steps:\n{transcript[:4000]}"
    res = client.chat.completions.create(messages=[{"role": "user", "content": prompt}], model="llama-3.3-70b-versatile", response_format={"type": "json_object"})
    data = json.loads(res.choices[0].message.content)
    return data.get("steps", [])

def analyze_assignment(submission_text, topic, session_id="assignment_default"):
    prompt = f"Grade this assignment on {topic}:\n{submission_text}"
    res = client.chat.completions.create(messages=[{"role": "user", "content": prompt}], model="llama-3.3-70b-versatile", response_format={"type": "json_object"})
    return json.loads(res.choices[0].message.content)
