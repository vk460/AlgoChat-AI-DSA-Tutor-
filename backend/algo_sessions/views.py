from rest_framework.views import APIView
from rest_framework.response import Response
from .models import LearningSession
from langgraph_agents.socratic_graph import socratic_app
from langgraph_agents.context_builder import build_student_context
import uuid

class StartSessionView(APIView):
    def post(self, request):
        topic = request.data.get('topic', 'binary_search')
        session_type = request.data.get('session_type', 'socratic')
        user = request.user

        # Create session record
        session = LearningSession.objects.create(
            user=user if user.is_authenticated else None,
            topic=topic,
            session_type=session_type,
            language=user.preferred_language if user.is_authenticated else 'python'
        )

        # Build context
        context = build_student_context(user, topic) if user.is_authenticated else {
            "student_name": "Guest", "language": "python", "level": 1, "topic": topic,
            "weak_concepts": [], "recent_mistakes": [], "persistent_weaknesses": [],
            "last_session_summary": [], "overall_mastery": 0
        }

        # Initialize LangGraph state
        initial_state = {
            "messages": [],
            "student_context": context,
            "current_concept": topic,
            "answer_quality": "partial",
            "hint_count": 0,
            "struggled_concepts": [],
            "mastered_concepts": [],
            "session_complete": False
        }

        # Run first step to get the first question
        result = socratic_app.invoke(initial_state)

        # Save messages to session
        session.messages = result["messages"]
        session.save()

        return Response({
            "session_id": session.id,
            "initial_message": result["messages"][-1]["content"],
            "student_context": context
        })

class ChatMessageView(APIView):
    def post(self, request, session_id):
        message = request.data.get('message')
        session = LearningSession.objects.get(id=session_id)
        
        # Reconstruct state
        state = {
            "messages": session.messages + [{"role": "user", "content": message}],
            "student_context": build_student_context(session.user, session.topic) if session.user else {},
            "current_concept": session.topic,
            "answer_quality": "partial",
            "hint_count": 0,
            "struggled_concepts": session.struggled_concepts,
            "mastered_concepts": session.mastered_concepts,
            "session_complete": session.completed
        }

        # Run LangGraph
        result = socratic_app.invoke(state)

        # Update session
        session.messages = result["messages"]
        session.struggled_concepts = result["struggled_concepts"]
        session.mastered_concepts = result["mastered_concepts"]
        session.completed = result["session_complete"]
        session.save()

        return Response({
            "response": result["messages"][-1]["content"],
            "session_complete": result["session_complete"]
        })
