from langchain_groq import ChatGroq
import os
import re

# Use a fast model for the judge to handle 1000 runs quickly
llm_judge_model = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

def evaluate_rules(response):
    """
    Hard-rule scoring (0.0 to 1.0)
    Checks for the 'Exactly One Question' rule and highlights.
    """
    score = 0
    
    # Rule 1: Exactly one question mark
    if response.count("?") == 1:
        score += 0.5
    
    # Rule 2: Presence of Socratic highlights (!!color!!)
    if "!!" in response:
        score += 0.5
        
    return score

def llm_judge(response, student_context):
    """
    Advanced LLM Scoring (1.0 to 5.0)
    """
    prompt = f"""
    You are an Expert Pedagogical Judge. Rate this Socratic Tutor's response.
    
    STUDENT CONTEXT: {student_context}
    AI RESPONSE: {response}
    
    CRITERIA:
    1. Socratic Method: Did it ask a leading question instead of giving the answer?
    2. Grounding: Is it technically accurate for DSA?
    3. Tone: Is it encouraging but firm (no "Great job!")?
    
    OUTPUT: Return ONLY a single float number between 1.0 and 5.0.
    """
    
    try:
        res = llm_judge_model.invoke(prompt)
        # Extract number using regex
        match = re.search(r"([0-5]\.\d|[0-5])", res.content)
        return float(match.group(1)) if match else 3.0
    except:
        return 0.0
