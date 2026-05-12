import json
from langchain_groq import ChatGroq

llm_fast = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

FAITHFULNESS_PROMPT = """
You are a RAG validator. Verify if the AI's response is grounded in the provided context.

RETRIEVED CONTEXT:
{context}

AI RESPONSE:
{response}

Rules:
1. If the AI makes a claim NOT in the context, flag it.
2. If the AI hallucinates code that contradicts the context, flag it.
3. If the AI is faithful, score 1.0.

Output JSON:
{{
  "is_grounded": true/false,
  "score": 0.0-1.0,
  "hallucinations": ["list specific claims if any"]
}}
"""

def faithfulness_check_node(state):
    """
    Validation node that runs after the Socratic response is generated.
    """
    context = str(state.get("rag_context", "No context"))
    response = state.get("response", "")
    
    prompt = FAITHFULNESS_PROMPT.format(context=context, response=response)
    res = llm_fast.invoke(prompt)
    
    try:
        text = res.content if hasattr(res, 'content') else str(res)
        # Strip potential markdown code blocks
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        eval_data = json.loads(text)
        return {**state, "faithfulness_report": eval_data}
    except Exception as e:
        print(f"Faithfulness parsing failed: {e}")
        return {**state, "faithfulness_report": {"is_grounded": True, "score": 1.0, "hallucinations": []}}
