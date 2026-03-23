import os
import sys
import json

# Add rag_pipeline to sys.path so its internal modules can refer to each other
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from retrieval.retrieve import retrieve_top_chunks
from groq import Groq

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', '.env'))

# ---------------- SETTINGS ----------------
API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    print("WARNING: GROQ_API_KEY not found in environment. Socratic Tutor will fail.")
    client = None
else:
    client = Groq(api_key=API_KEY)

# ---------------- MEMORY STORE ----------------
# Simple in-memory prototype for Short-term memory conversation history
SESSIONS = {}

# ---------------- SOCRATIC PROMPT TEMPLATE ----------------
SOCRATIC_SYSTEM_PROMPT = """You are an experienced and patient computer science teacher who specializes in teaching Data Structures and Algorithms (DSA).
Goal: Teach like a human teacher in a classroom using an interactive Socratic method. DO NOT give long lecture-style explanations.

Strict Teaching Principles:
1. Short Chunks: Explain in medium-sized chunks (5–8 lines). Never give long paragraphs.
2. Mandatory Questions: After each chunk, pause and ask a curiosity, prediction, or reasoning question.
3. Teaching Loop:
   - Start with a real-life curiosity question.
   - Introduce concepts gradually (chunked).
   - Use diagrams for visualization (Stack, List, Tree, etc.).
   - Ask for reasoning/predictions.
4. Formatting:
   - Explanation -> Diagram/Example -> Question -> STOP.
5. Adaptive: Scale difficulty based on student answers. Simplify if they are confused.
6. Structured Output for UI:
   - ALWAYS include a specialized `d3-json` block for frontend visualization:
     ```d3-json
     {
       "algorithm": "linear_search",
       "array": [4,7,2,9,5],
       "target": 9,
       "steps": [
         {"index":0,"value":4,"result":"not_equal"},
         {"index":1,"value":7,"result":"found"}
       ]
     }
     ```
   - ALWAYS include a `quiz-json` block for dynamic assessments:
     ```quiz-json
     [
       {
         "question": "What is the next step?",
         "options": ["A", "B", "C"],
         "correct": 1
       }
     ]
     ```
   - If the student needs a complex task, provide an `assignment-prompt` block:
     ```assignment-prompt
     "Task: Implement Binary Search and handle the null case."
     ```

Example Style:
Teacher: Imagine a pile of plates. Which do you take first? (Top/Bottom?)
(Wait)
Teacher: Correct! That's LIFO. Stacks work like this. [Diagram]
How would we remove 'X' from this stack?
"""

# ---------------- FUNCTION TO ASK QUESTIONS ----------------
def ask_question(query, session_id="default", top_k=5, custom_history_text=None):

    # 1 Retrieve chunks from FAISS
    top_chunks = retrieve_top_chunks(query, top_k)
    context = "\n\n".join(top_chunks)

    # 2 Load or Init Memory Profile
    if custom_history_text is not None:
        history_text = custom_history_text
    else:
        if session_id not in SESSIONS:
            SESSIONS[session_id] = []
        
        # Keep only the last 6 turns to prevent overwhelming context length
        convo_history = SESSIONS[session_id][-6:]
        history_text = "\n".join([f"{msg['role'].capitalize()}: {msg['text']}" for msg in convo_history])

    # 3 Create prompt
    prompt = f"""
{SOCRATIC_SYSTEM_PROMPT}

Use the following reference knowledge:
{context}

Use the previous conversation as context:
{history_text}

The student asked: "{query}"
"""

    # 4 AI Tutor Response (Socratic)
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": SOCRATIC_SYSTEM_PROMPT},
                {"role": "user", "content": f"Reference Knowledge:\n{context}\n\nPrevious History:\n{history_text}\n\nStudent Query: {query}"}
            ],
            model="llama-3.3-70b-versatile",
        )
        answer = chat_completion.choices[0].message.content
        
        # 5 Update Memory
        if custom_history_text is None:
            SESSIONS[session_id].append({"role": "user", "text": query})
            SESSIONS[session_id].append({"role": "assistant", "text": answer})
        return answer
    except Exception as e:
        print(f"Socratic Tutor Error: {e}")
        return f"I'm sorry, I'm having a bit of trouble connecting to my reasoning engine right now. (Error: {str(e)})"


def process_video_transcript(transcript, session_id="video_default"):
    """
    Uses Groq to break a video transcript into logical 'Learning Steps'.
    Each step includes a summary and a Socratic guiding question.
    """
    prompt = f"""You are a Socratic learning assistant. A student is watching a video with this transcript:
{transcript[:6000]} # Increased context for better step identification

Task:
1. Identify 3-5 key logical concepts or steps explained in this video segment.
2. For each concept, provide:
   - "step": The sequence number (1, 2, 3...).
   - "title": A short title for this step.
   - "explanation": A very simple, 2-sentence explanation of the concept.
   - "question": A question to check the student's understanding of this specific step.

Return the response as a strict JSON object with a single key "steps" containing an array of these objects:
{{
  "steps": [
    {{
      "step": 1,
      "title": "Concept Name",
      "explanation": "Simple explanation...",
      "question": "Socratic question..."
    }}
  ]
}}
"""
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        data = json.loads(chat_completion.choices[0].message.content)
        # Handle cases where LLM returns a root object instead of array
        if isinstance(data, dict) and "steps" in data:
            return data["steps"]
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"Transcript processing failed: {str(e)}")
        return []

def analyze_assignment(submission_text, topic, session_id="assignment_default"):
    """
    Evaluates a student's assignment submission out of 10.
    """
    prompt = f"""You are a senior DSA teacher grading a student's assignment.
Topic: {topic}
Student Submission:
{submission_text}

Task:
1. Evaluate the submission's correctness, efficiency, and clarity.
2. Give a score out of 10.
3. Provide constructive Socratic feedback. Identify weak concepts.

Return the response as a strict JSON object:
{{
    "score": 8,
    "total_score": 10,
    "feedback": "Your logic for partitioning is correct, but consider the case of an empty array.",
    "weak_concepts": ["Edge cases", "Partitioning"]
}}
"""
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        print(f"Assignment Analysis Error: {e}")
        return {
            "score": 0,
            "total_score": 10,
            "feedback": f"Error during analysis: {str(e)}",
            "weak_concepts": []
        }

import subprocess
import tempfile

def run_python_code(code, input_data="", timeout=5):
    """
    Executes Python code in a subprocess and returns the output/errors.
    Supports standard input (stdin).
    """
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode='w', encoding='utf-8') as tmp:
        tmp.write(code)
        tmp_path = tmp.name

    try:
        result = subprocess.run(
            [sys.executable, tmp_path],
            input=input_data,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        output = result.stdout
        error = result.stderr
        
        # Combine stdout and stderr for a more complete execution picture
        combined_output = ""
        if output:
            combined_output += output
        if error:
            if combined_output:
                combined_output += "\n"
            combined_output += error
            
        return combined_output if combined_output else "No output."
    except subprocess.TimeoutExpired:
        return "Error: Execution timed out (max 5 seconds)."
    except Exception as e:
        return f"Error: {str(e)}"
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

from agents.codellama_agent import analyze_logic_with_codellama

def analyze_code(code, execute_output, goal, session_id="practice_default"):
    """
    Code Analysis Function
    instructs Groq to provide Socratic hints on user code without giving away the direct solution.
    Incorporates deep logical analysis from Code Llama.
    """
    # 1. Perform deep logical analysis using Code Llama
    logic_analysis = analyze_logic_with_codellama(code, execute_output)
    
    analysis_context = ""
    if logic_analysis.get("has_error"):
        analysis_context = f"""
Deep Logical Analysis Results:
- Category: {logic_analysis.get('category')}
- Technical Issue: {logic_analysis.get('issue_summary')}
- Suggested Tutor Direction: {logic_analysis.get('suggestion_for_tutor')}
"""

    prompt = f"""You are an experienced and patient CS Teacher helping a student with their code.
Your goal is to guide them SOCRATICALLY to find their own mistake. DO NOT give corrected code.

Student Goal: "{goal}"
Student Code:
```python
{code}
```
Program Output:
```
{execute_output}
```
{analysis_context}

Follow the CS Teacher Principles:
1. Explanation: 5-8 lines max. Simple terms.
2. Visual: Generate a Mermaid diagram or ASCII diagram showing the program flow or data state.
3. Question: Ask a reasoning question to help them find the bug (e.g., "What value is 'x' at line 5?").

Rules:
- NO full solutions.
- One chunk at a time.
- If it's an EOFError, point them to the STDIN box.

Format:
Explanation: <text>
Diagram: <mermaid or ascii>
Question: <text>
"""
    # 2. AI Tutor Response (Socratic analysis)
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Analysis Error: {e}")
        return f"Explanation: I'm having trouble analyzing your code right now.\n\nGuiding Question: Can you try running it again?\n\nHint: Check your connection.\n\n(Error: {str(e)})"

def explain_code_lines(code):
    """
    Provides a line-by-line explanation of the provided code,
    including time and space complexity.
    """
    prompt = f"""You are an elite DSA instructor. Explain the following Python code line-by-line.
For each logical block or significant line, explain WHAT it does and WHY it's there.
Also, include a final section on Time and Space Complexity.

Format:
Line X: <explanation>
...
Total Time Complexity: O(...)
Space Complexity: O(...)

Code:
```python
{code}
```
"""
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Error during explanation: {str(e)}"



def process_video_transcript(transcript, session_id="video_default"):
    """
    Uses Groq to break a video transcript into logical 'Learning Steps'.
    Each step includes a summary and a Socratic guiding question.
    """
    prompt = f"""You are a Socratic learning assistant. A student is watching a video with this transcript:
{transcript[:6000]} # Increased context for better step identification

Task:
1. Identify 3-5 key logical concepts or steps explained in this video segment.
2. For each concept, provide:
   - "step": The sequence number (1, 2, 3...).
   - "title": A short title for this step.
   - "explanation": A very simple, 2-sentence explanation of the concept.
   - "question": A question to check the student's understanding of this specific step.

Return the response as a strict JSON object with a single key "steps" containing an array of these objects:
{{
  "steps": [
    {{
      "step": 1,
      "title": "Concept Name",
      "explanation": "Simple explanation...",
      "question": "Socratic question..."
    }}
  ]
}}
"""
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        data = json.loads(chat_completion.choices[0].message.content)
        # Handle cases where LLM returns a root object instead of array
        if isinstance(data, dict) and "steps" in data:
            return data["steps"]
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"Transcript processing failed: {str(e)}")
        return []

# ---------------- INTERACTIVE MODE ----------------
if __name__ == "__main__":

    print("=== RAG QA SYSTEM USING GEMINI ===")

    while True:

        query = input("\nEnter your question (or 'exit' to quit): ")

        if query.lower() == "exit":
            break

        answer = ask_question(query)

        print("\nAnswer:\n", answer)
