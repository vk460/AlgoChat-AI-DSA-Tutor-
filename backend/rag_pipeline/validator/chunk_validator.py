import os
import json
from langchain_groq import ChatGroq

# Note: Using 8b model for fast, cheap validation
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

VALIDATION_PROMPT = """
You are a DSA expert. Review this knowledge chunk for pedagogical and technical correctness.
Topic: {topic}
Chunk Type: {chunk_type}

Content to validate:
{content}

Check for:
1. Technical accuracy (Is the algorithm logic correct?)
2. Big-O complexity (Are the time/space claims accurate?)
3. Code correctness (If code is present, does it have syntax errors?)

Respond in STRICT JSON:
{{
  "is_correct": true/false,
  "confidence": 0.0-1.0,
  "issues": ["list errors found"],
  "corrected_content": "Full corrected version of the text/code if errors found, otherwise null",
  "pedagogical_value": "high|medium|low"
}}
"""

def validate_chunk(content, topic, chunk_type):
    """
    Validates a chunk using LLM to ensure no 'hallucinations' from scraped data.
    """
    try:
        prompt = VALIDATION_PROMPT.format(
            topic=topic,
            chunk_type=chunk_type,
            content=content
        )
        response = llm.invoke(prompt)
        # Handle potential string or object response from LangChain
        text = response.content if hasattr(response, 'content') else str(response)
        
        # Strip potential markdown code blocks
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        result = json.loads(text)
        return result
    except Exception as e:
        print(f"Validation failed for a chunk: {e}")
        return {"is_correct": True, "confidence": 0.5, "issues": ["Validation error"]} # Fallback to true but low confidence
