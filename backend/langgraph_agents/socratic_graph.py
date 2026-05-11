from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from typing import TypedDict, List
import json
import os

# Initialize LLMs
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.7)
llm_fast = ChatGroq(model="llama-3.1-8b-instant", temperature=0.1)

class SocraticState(TypedDict):
    messages: List[dict]           # Full conversation history
    student_context: dict          # Built by context_builder
    current_concept: str
    answer_quality: str            # "correct" | "partial" | "wrong"
    hint_count: int
    struggled_concepts: List[str]
    mastered_concepts: List[str]
    session_complete: bool
    response: str                  # The latest AI response

def socratic_question_node(state: SocraticState) -> SocraticState:
    """Generates the next Socratic question based on student context"""
    context = state["student_context"]
    
    system_prompt = f"""You are AlgoChat's Socratic tutor. Your student is learning {state['current_concept']}.

STUDENT PROFILE:
- Name: {context['student_name']}
- Level: {context['level']}  
- Language preference: {context['language']}
- Weak areas in this topic: {context['weak_concepts']}
- Recent mistakes they made: {context['recent_mistakes']}
- Persistent weaknesses: {context['persistent_weaknesses']}

TEACHING RULES:
1. NEVER give the answer directly on first message.
2. Start by asking what they already know.
3. ONE question at a time.
4. Reference their specific past mistakes if relevant.
5. If they show the same mistake from their history, flag it gently.
6. Keep each response under 4 sentences.
7. End EVERY message with a question.
8. Use {context['language']} code examples when needed.
9. LANGUAGE MIRRORING RULE: 
   - If the student asks in **English**, you MUST respond in **English**.
   - If the student asks in **Hindi or Hinglish** (Hindi in Roman script), you MUST respond in **Hinglish**.
   - Keep technical terms (e.g., 'Array', 'Recursion', 'Time Complexity') in **English** always.
   - Do NOT mix languages unless the student does.

Output MUST be a JSON object: {{"response": "...", "concept_being_tested": "..."}}"""

    # We use a wrapper to ensure JSON format
    response = llm.invoke([
        {"role": "system", "content": system_prompt},
        *state["messages"]
    ])
    
    try:
        content = json.loads(response.content)
        return {
            **state,
            "response": content.get("response", response.content),
            "current_concept": content.get("concept_being_tested", state["current_concept"])
        }
    except:
        return {**state, "response": response.content}

def evaluate_answer_node(state: SocraticState) -> SocraticState:
    """Evaluates student answer and categorizes it"""
    system_prompt = """Evaluate this student answer strictly.
    Output JSON: {
      "quality": "correct|partial|wrong",
      "concept_demonstrated": "...",
      "specific_gap": "exactly what they got wrong or missed"
    }"""
    
    # We evaluate the last user message
    user_msg = state["messages"][-1]["content"] if state["messages"] else ""
    
    response = llm_fast.invoke([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg}
    ])
    
    try:
        eval_data = json.loads(response.content)
        quality = eval_data.get("quality", "wrong")
        
        struggled = list(state["struggled_concepts"])
        mastered = list(state["mastered_concepts"])
        
        if quality == "correct":
            mastered.append(state["current_concept"])
        else:
            struggled.append(state["current_concept"])

        return {
            **state,
            "answer_quality": quality,
            "struggled_concepts": struggled,
            "mastered_concepts": mastered,
            "hint_count": state["hint_count"] + 1 if quality != "correct" else 0
        }
    except:
        return {**state, "answer_quality": "wrong"}

def route_after_evaluation(state: SocraticState) -> str:
    """LangGraph routing — this is the intelligence of the graph"""
    if state["answer_quality"] == "correct":
        # If they got it right and we have enough info, complete or move to next
        if len(state["mastered_concepts"]) >= 3:
            return "session_complete"
        return "ask_question"
    
    if state["hint_count"] >= 3:
        return "explain_directly"
    
    return "give_hint"

def hint_node(state: SocraticState) -> SocraticState:
    """Gives a targeted hint based on the identification of a gap"""
    system_prompt = f"""Provide a small, helpful Socratic hint for {state['current_concept']}. 
    DO NOT give the solution.
    
    LANGUAGE RULE: If the student has been talking in Hinglish/Hindi, provide the hint in Hinglish (e.g., "Ek baar socho, loop kahan rukna chahiye?").
    """
    response = llm.invoke([
        {"role": "system", "content": system_prompt},
        *state["messages"]
    ])
    return {**state, "response": response.content}

def session_complete_node(state: SocraticState) -> SocraticState:
    """Final node — marks session as finished"""
    return {**state, "session_complete": True, "response": "Great job! You've mastered these concepts. Ready for a quick quiz?"}

# Build the graph
workflow = StateGraph(SocraticState)

workflow.add_node("ask_question", socratic_question_node)
workflow.add_node("evaluate_answer", evaluate_answer_node)
workflow.add_node("give_hint", hint_node)
workflow.add_node("session_complete", session_complete_node)

workflow.set_entry_point("ask_question")
workflow.add_edge("ask_question", "evaluate_answer")
workflow.add_conditional_edges(
    "evaluate_answer",
    route_after_evaluation,
    {
        "ask_question": "ask_question",
        "give_hint": "give_hint",
        "explain_directly": "ask_question", # Fallback
        "session_complete": "session_complete"
    }
)
workflow.add_edge("give_hint", "ask_question")
workflow.add_edge("session_complete", END)

socratic_app = workflow.compile()
