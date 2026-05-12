import json
import time
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from .prompts.socratic_master_prompt import SOCRATIC_MASTER_PROMPT

llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0.7)
llm_fast = ChatGroq(model_name="llama-3.1-8b-instant", temperature=0.1)

class SocraticState(TypedDict):
    messages: List[Dict[str, str]]
    current_concept: str
    is_diagnostic: bool
    diagnostic_index: int
    concept_history: Dict[str, Any]
    mistake_dna: Dict[str, Any]
    response: str
    show_quiz: bool
    quiz_data: list  # structured quiz questions, returned directly to frontend

def build_dna_node(state: SocraticState):
    start_time = time.time()
    print("\n--- [STAGE 1] Message Analysis ---")
    query = state['messages'][-1]['content']
    history = state.get("concept_history", {})

    # STEP 1: Is this a NEW QUESTION or a student ANSWER?
    # This is the most critical check - answers must NEVER trigger a quiz
    classification_prompt = f"""You are classifying a student message in a DSA tutoring session.

Message: "{query}"

Classify as:
A) NEW QUESTION - Student is asking about a new topic to learn (e.g. "What is recursion?", "explain arrays", "how does a stack work", "what is sorting")
B) ANSWER or FOLLOW-UP - Student is responding to the tutor or giving a short reply (e.g. "I don't know", "yes", "array", "to store data", "at last position")

Short single-word or single-phrase messages that look like answers are almost always B.
Reply with ONLY the letter A or B."""

    cls_res = llm_fast.invoke(classification_prompt)
    msg_class = "A" if "A" in cls_res.content.strip().upper()[:3] else "B"
    print(f"  [DEBUG] Message Type: {'NEW QUESTION' if msg_class == 'A' else 'ANSWER/FOLLOW-UP'}")

    # Answers and follow-ups go directly to teaching — NEVER trigger quiz
    if msg_class == "B":
        print("  [DEBUG] Student answer → Skipping diagnostic, going to teaching")
        return {**state, "is_diagnostic": False, "show_quiz": False}

    # STEP 2: Extract the concept from the NEW question
    extraction_prompt = f"""From this DSA question: "{query}"
Extract the single core concept being asked about.
Return ONLY the concept name (1-3 words). Return 'None' if unclear."""

    concept_res = llm_fast.invoke(extraction_prompt)
    concept = concept_res.content.strip().lower().replace("*", "").strip(".")
    # Normalize plurals (arrays→array, stacks→stack)
    concept = concept.rstrip('s') if concept.endswith('s') and len(concept) > 3 else concept
    concept = concept.strip()

    print(f"  [DEBUG] Concept: '{concept}' (Took: {time.time() - start_time:.2f}s)")

    if "none" in concept or not concept or len(concept.split()) > 4:
        return {**state, "is_diagnostic": False, "show_quiz": False, "current_concept": "General"}

    # STEP 3: Check if this concept has already been quizzed this session
    is_first = concept not in history or not history[concept].get("quiz_taken", False)
    if concept not in history:
        history[concept] = {"quiz_taken": False}

    print(f"  [DEBUG] Diagnostic Required? {is_first}")

    return {
        **state,
        "is_diagnostic": is_first,
        "current_concept": concept,
        "show_quiz": is_first,
        "concept_history": history
    }

def diagnostic_node(state: SocraticState):
    start_time = time.time()
    concept = state.get("current_concept", "General")
    print(f"--- [STAGE 2] Generating Foundation Quiz for: {concept} ---")

    prompt = f"""Generate exactly 15 MCQs assessing foundational knowledge of prerequisites for {concept}.

Rules:
- Output ONLY a valid JSON array.
- Each item: {{"question": "...", "options": ["A","B","C","D"], "correct": 0, "explanation": "..."}}
- No extra text, no markdown, just the raw JSON array."""

    res = llm_fast.invoke(prompt)
    raw = res.content.strip()
    print(f"  [DEBUG] Quiz Generation Complete (Took: {time.time() - start_time:.2f}s)")

    # Parse quiz directly — no regex needed on frontend
    quiz_data = []
    try:
        # Strip any accidental code fences
        clean = raw.replace("```json", "").replace("```quiz-json", "").replace("```", "").strip()
        quiz_data = json.loads(clean)
        if not isinstance(quiz_data, list):
            quiz_data = []
        print(f"  [DEBUG] Quiz parsed successfully: {len(quiz_data)} questions")
    except Exception as e:
        print(f"  [DEBUG] Quiz parse error: {e} — raw[:200]: {raw[:200]}")

    history = state.get("concept_history", {})
    history[concept] = {"quiz_taken": True}

    return {
        **state,
        "response": f"Neural Check Initialized for **{concept}**. Starting prerequisite assessment...",
        "is_diagnostic": True,
        "show_quiz": True,
        "quiz_data": quiz_data,
        "concept_history": history
    }

def socratic_question_node(state: SocraticState):
    start_time = time.time()
    concept = state.get("current_concept", "General")
    print(f"--- [STAGE 3] Socratic Teaching: {concept} ---")

    prompt = SOCRATIC_MASTER_PROMPT.format(
        mistake_dna="{}", student_context="{}", current_topic=concept
    )
    res = llm.invoke([{"role": "system", "content": prompt}] + state["messages"])
    print(f"  [DEBUG] Teaching Response Ready (Took: {time.time() - start_time:.2f}s)")
    return {**state, "response": res.content, "show_quiz": False}

def router(state):
    if state.get("is_diagnostic", False):
        return "diagnostic"
    return "ask_question"

workflow = StateGraph(SocraticState)
workflow.add_node("build_dna", build_dna_node)
workflow.add_node("diagnostic", diagnostic_node)
workflow.add_node("ask_question", socratic_question_node)

workflow.set_entry_point("build_dna")
workflow.add_conditional_edges("build_dna", router, {
    "diagnostic": "diagnostic",
    "ask_question": "ask_question"
})
workflow.add_edge("diagnostic", END)
workflow.add_edge("ask_question", END)
socratic_app = workflow.compile()
