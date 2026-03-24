import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login as django_login
from django.contrib.auth.models import User
from rag_pipeline.rag_qa import ask_question, analyze_code, process_video_transcript, analyze_assignment
from rag_pipeline.transcript_service import extract_video_id, get_transcript
from rag_pipeline.video_processor import chunk_transcript
from rag_pipeline.video_rag import index_video_transcript, query_video_rag
from .models import Conversation, Message, UserProgress, User
from django.db.models import Count, Avg

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email', '')
            name = data.get('name', '')
            
            # Simple mock authentication for now, matching React's mock
            # In production, use authenticate(username=email, password=password)
            if name and email:
                user, created = User.objects.get_or_create(
                    username=email,
                    defaults={'first_name': name, 'email': email}
                )
                
                # We mock the session/login
                django_login(request, user)
                
                return JsonResponse({
                    'id': user.id,
                    'name': user.first_name,
                    'email': user.email,
                    'role': 'student',
                    'success': True
                })
            else:
                return JsonResponse({'error': 'Name and Email required'}, status=400)
                
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
            
    return JsonResponse({'error': 'Method not allowed. Use POST.'}, status=405)

@csrf_exempt
def get_conversations(request):
    if request.method == 'GET':
        user_id = request.GET.get('user_id')
        if not user_id:
            return JsonResponse({'error': 'user_id required'}, status=400)
        
        try:
            conversations = Conversation.objects.filter(user_id=user_id).order_by('-updated_at')
            data = [{
                'id': conv.session_id,
                'title': conv.title,
                'updated_at': conv.updated_at.isoformat()
            } for conv in conversations]
            return JsonResponse({'conversations': data})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed. Use GET.'}, status=405)

@csrf_exempt
def get_messages(request, session_id):
    if request.method == 'GET':
        try:
            conversation = Conversation.objects.get(session_id=session_id)
            messages = conversation.messages.all().order_by('timestamp')
            data = [{
                'role': msg.role,
                'content': msg.content,
                'timestamp': msg.timestamp.isoformat()
            } for msg in messages]
            return JsonResponse({'messages': data})
        except Conversation.DoesNotExist:
            return JsonResponse({'messages': []})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed. Use GET.'}, status=405)

@csrf_exempt
def ask_rag(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            query = data.get('query', '')
            session_id = data.get('session_id', 'default_session')
            user_id_raw = data.get('user_id')
            
            # Safe parsing of user_id as integer
            user_id = None
            if user_id_raw:
                try:
                    user_id = int(user_id_raw)
                except (ValueError, TypeError):
                    user_id = None
            
            if not query:
                return JsonResponse({'error': 'No query provided'}, status=400)
            
            # Call our RAG pipeline, passing session_id for continuity
            user = User.objects.filter(id=user_id).first() if user_id else None
            
            conversation, created = Conversation.objects.get_or_create(
                session_id=session_id,
                defaults={
                    'user': user,
                    'title': query[:25] + "..." if len(query) > 25 else query
                }
            )
            
            # Build history text
            messages = conversation.messages.all().order_by('timestamp')
            recent_messages = messages[max(0, len(messages) - 6):]
            if recent_messages:
                history_text = "\n".join([f"{msg.role.capitalize()}: {msg.content}" for msg in recent_messages])
            else:
                history_text = ""
            
            answer = ask_question(query, session_id=session_id, custom_history_text=history_text)
            
            Message.objects.create(conversation=conversation, role='user', content=query)
            Message.objects.create(conversation=conversation, role='assistant', content=answer)
            conversation.save()
            
            return JsonResponse({'answer': answer})
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Method not allowed. Use POST.'}, status=405)


from rag_pipeline.rag_qa import ask_question, analyze_code, run_python_code

@csrf_exempt
def analyze_practice_code(request):
    """
    Receives code and execution output parameters to generate Socratic hints.
    Now supports backend Python execution.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            code = data.get('code', '')
            stdin = data.get('stdin', '')
            goal = data.get('goal', 'Improve general coding skills')
            session_id = data.get('session_id', 'practice_default')
            user_id_raw = data.get('user_id')

            user_id = None
            if user_id_raw:
                try:
                    user_id = int(user_id_raw)
                except (ValueError, TypeError):
                    user_id = None
            
            if not code:
                return JsonResponse({'error': 'No code provided'}, status=400)

            # Execute Python code on the backend with stdin support
            execution_output = run_python_code(code, input_data=stdin)
                
            hints = analyze_code(code, execution_output, goal, session_id)

            # Record progress if user is logged in
            if user_id:
                try:
                    user = User.objects.filter(id=user_id).first()
                    if user:
                        # Extract a simple topic from the goal or code
                        topic = goal[:50] if goal else "Generic DSA"
                        UserProgress.objects.create(
                            user=user,
                            topic=topic,
                            score=1 if "Perfect" in hints or "Correct" in hints else 0,
                            total_score=1,
                            progress_type='code_practice',
                            feedback=hints[:200]
                        )
                except Exception as e:
                    print(f"Failed to record progress: {e}")

            return JsonResponse({
                'hints': hints,
                'execution_output': execution_output
            })
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Method not allowed. Use POST.'}, status=405)
@csrf_exempt
def process_video(request):
    """
    Extracts transcript from a YouTube URL and generates Socratic learning steps.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            url = data.get('url', '')
            
            if not url:
                return JsonResponse({'error': 'No URL provided'}, status=400)
            
            video_id = extract_video_id(url)
            if not video_id:
                return JsonResponse({'error': 'Invalid YouTube URL'}, status=400)
            
            transcript = get_transcript(video_id)
            if not transcript:
                return JsonResponse({'error': 'Could not extract transcript. Video might not have captions.'}, status=404)
            
            # Phase 5: Create Video RAG Index
            # Fetch snippet version for indexing
            snippets = get_transcript(video_id, return_snippets=True)
            if snippets:
                chunks = chunk_transcript(snippets)
                index_video_transcript(video_id, chunks)

            steps = process_video_transcript(transcript)
            
            if not steps:
                return JsonResponse({
                    'error': 'Video is too short or logic could not be extracted. Try a coding tutorial!'
                }, status=422)

            return JsonResponse({
                'video_id': video_id,
                'steps': steps
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Method not allowed. Use POST.'}, status=405)
@csrf_exempt
def video_chat(request):
    """
    RAG-based chat for a specific video.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            video_id = data.get('video_id', '')
            query = data.get('query', '')
            
            if not video_id or not query:
                return JsonResponse({'error': 'video_id and query are required'}, status=400)
            
            # 1. Retrieve context
            context_chunks = query_video_rag(video_id, query)
            if not context_chunks:
                # Fallback to general knowledge if video index isn't found
                context_text = "No specific transcript context found for this video."
            else:
                # Format context with timestamps
                context_parts = []
                for c in context_chunks:
                    ts = int(c['timestamp'])
                    minutes = ts // 60
                    seconds = ts % 60
                    time_str = f"{minutes}:{seconds:02d}"
                    context_parts.append(f"[{time_str}] {c['text']}")
                context_text = "\n\n".join(context_parts)
            
            # 2. Call LLM
            import os
            from groq import Groq
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                return JsonResponse({
                    'answer': "I'm sorry, my AI brain (GROQ_API_KEY) is not configured on the server yet.",
                    'context': context_text
                })

            client = Groq(api_key=api_key)
            
            prompt = f"""
            You are an experienced and patient computer science teacher specializing in DSA.
            Goal: Answer the user's question about the video transcript using the interactive Socratic method.
            
            Context from video transcript:
            {context_text}

            Strict Teaching Principles:
            1. Teach in medium-sized chunks (5–8 lines). Use context from the transcript.
            2. Never give long paragraphs.
            3. Use real-life analogies for curiosity.
            4. Show a diagram (ASCII or Mermaid) to help visualize the concept from the video.
            5. ALWAYS mention relevant timestamps (e.g., [2:15]) if applicable from context.
            6. After the explanation and diagram, ask a reasoning question and STOP.

            Format:
            Explanation: <short 5-8 line text>
            Visual: <ASCII/Mermaid diagram>
            Question: <the reasoning question>

            User Question:
            {query}
            """
            
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
            )
            
            answer = completion.choices[0].message.content
            
            return JsonResponse({
                'answer': answer,
                'context': context_text
            })
            
        except Exception as e:
            print(f"Video Chat Error: {e}")
            return JsonResponse({'error': f"Internal Server Error: {str(e)}"}, status=500)
            
    return JsonResponse({'error': 'Method not allowed. Use POST.'}, status=405)
def home_view(request):
    """
    Root view to confirm API is running.
    """
    return JsonResponse({
        'status': 'success',
        'message': 'AlgoLab AI API is running',
        'version': '1.0.0'
    })

@csrf_exempt
def submit_assignment(request):
    """
    Submits student assignment and returns AI analysis.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id_raw = data.get('user_id')
            topic = data.get('topic', 'General DSA')

            user_id = None
            if user_id_raw:
                try:
                    user_id = int(user_id_raw)
                except (ValueError, TypeError):
                    user_id = None
            submission_text = data.get('submission_text', '')
            
            if not user_id or not submission_text:
                return JsonResponse({'error': 'user_id and submission_text are required'}, status=400)
            
            user = User.objects.filter(id=user_id).first()
            if not user:
                return JsonResponse({'error': 'User not found'}, status=404)
                
            analysis = analyze_assignment(submission_text, topic)
            
            # Save progress
            UserProgress.objects.create(
                user=user,
                topic=topic,
                score=analysis.get('score', 0),
                total_score=analysis.get('total_score', 10),
                progress_type='assignment',
                feedback=analysis.get('feedback', '')
            )
            
            return JsonResponse(analysis)
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Method not allowed. Use POST.'}, status=405)

@csrf_exempt
def get_user_progress(request):
    """
    Returns user progress records.
    """
    if request.method == 'GET':
        user_id_raw = request.GET.get('user_id')
        if not user_id_raw:
            return JsonResponse({'error': 'user_id required'}, status=400)
            
        user_id = None
        try:
            user_id = int(user_id_raw)
        except (ValueError, TypeError):
            return JsonResponse({'progress': []}) # Return empty progress for non-numeric IDs (like guests)
            progress = UserProgress.objects.filter(user_id=user_id).order_by('-timestamp')
            data = [{
                'topic': p.topic,
                'score': p.score,
                'total_score': p.total_score,
                'type': p.progress_type,
                'feedback': p.feedback,
                'timestamp': p.timestamp.isoformat()
            } for p in progress]
            return JsonResponse({'progress': data})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Method not allowed. Use GET.'}, status=405)

@csrf_exempt
def run_code_view(request):
    """
    Executes Python code and returns the output.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            code = data.get('code', '')
            stdin = data.get('stdin', '')
            if not code:
                return JsonResponse({'error': 'No code provided'}, status=400)
            
            # Using run_python_code from rag_qa which is imported above
            execution_output = run_python_code(code, input_data=stdin)
            
            return JsonResponse({'output': execution_output})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed. Use POST.'}, status=405)

@csrf_exempt
def explain_code_view(request):
    """
    Uses the RAG pipeline to explain a given piece of code.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            code = data.get('code', '')
            if not code:
                return JsonResponse({'error': 'No code provided'}, status=400)
            
            prompt = f"Please explain the following code clearly and concisely:\n\n{code}"
            explanation = ask_question(prompt, session_id="explain_default", custom_history_text="")
            
            return JsonResponse({'explanation': explanation})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed. Use POST.'}, status=405)

@csrf_exempt
def student_profile_view(request):
    """
    Retrieves student profile information and stats.
    """
    if request.method == 'GET':
        user_id_raw = request.GET.get('user_id')
        if not user_id_raw:
            return JsonResponse({'error': 'user_id required'}, status=400)
        
        user_id = None
        try:
            user_id = int(user_id_raw)
        except (ValueError, TypeError):
             return JsonResponse({
                'id': user_id_raw,
                'name': 'Guest',
                'email': 'guest@example.com',
                'total_exercises': 0,
            })
        
        try:
            user = User.objects.filter(id=user_id).first()
            if not user:
                return JsonResponse({'error': 'User not found'}, status=404)
            
            progress = UserProgress.objects.filter(user_id=user_id)
            total_exercises = progress.count()
            return JsonResponse({
                'id': user.id,
                'name': user.first_name,
                'email': user.email,
                'total_exercises': total_exercises,
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Method not allowed. Use GET.'}, status=405)


from django.core.management import call_command

@csrf_exempt
def force_migrate_view(request):
    """
    Emergency view to remotely trigger migrations on the server.
    """
    try:
        call_command('migrate', interactive=False)
        return JsonResponse({'status': 'Migration successful', 'message': 'Database tables created.'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

