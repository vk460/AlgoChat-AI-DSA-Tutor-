import json
from langchain_groq import ChatGroq
from langgraph_agents.prompts.diagnostic_prompt import DIAGNOSTIC_SESSION_PROMPT

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.5)

def diagnostic_node(state):
    """
    Handles the 15-question cold-start diagnostic flow.
    """
    student_name = state["student_context"]["student_name"]
    topic = state["student_context"]["topic"]
    
    # Check if we are starting or continuing diagnostic
    q_index = state.get("diagnostic_q_index", 0)
    
    if q_index >= 15:
        return {**state, "diagnostic_complete": True}

    prompt = DIAGNOSTIC_SESSION_PROMPT.format(
        student_name=student_name,
        requested_topic=topic
    )
    
    # We ask the LLM to generate the next diagnostic question based on history
    response = llm.invoke([
        {"role": "system", "content": prompt},
        *state["messages"]
    ])
    
    return {
        **state,
        "response": response.content,
        "diagnostic_q_index": q_index + 1
    }
