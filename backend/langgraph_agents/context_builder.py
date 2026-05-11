from algo_sessions.models import MistakeRecord, LearningSession
from progress.models import ConceptMastery
from django.db import models

def build_student_context(user, topic: str) -> dict:
    """
    Called before EVERY AI interaction.
    Builds the full context the AI needs to personalize its teaching.
    """
    if not user.is_authenticated:
        return {
            "student_name": "Guest",
            "language": "python",
            "level": 1,
            "topic": topic,
            "weak_concepts": [],
            "recent_mistakes": [],
            "persistent_weaknesses": [],
            "last_session_summary": [],
            "overall_mastery": 0
        }

    # Get top 5 weakest concepts for this topic
    weak_concepts = ConceptMastery.objects.filter(
        user=user,
        topic=topic,
        status__in=['weak', 'learning']
    ).order_by('mastery_score')[:5]

    # Get last 10 mistakes (most recent first)
    recent_mistakes = MistakeRecord.objects.filter(
        user=user,
        topic=topic,
        reviewed=False
    ).order_by('-timestamp')[:10]

    # Get persistent weaknesses across ALL topics
    persistent_weaknesses = ConceptMastery.objects.filter(
        user=user,
        persistent_weakness=True
    ).values_list('concept_name', flat=True)

    # Get last session for this topic
    last_session = LearningSession.objects.filter(
        user=user,
        topic=topic,
        completed=True
    ).order_by('-ended_at').first()

    return {
        "student_name": user.first_name or user.username,
        "language": user.preferred_language,
        "level": user.level,
        "topic": topic,
        "weak_concepts": [
            {
                "concept": c.concept_name,
                "score": round(c.mastery_score),
                "times_wrong": c.times_wrong
            } for c in weak_concepts
        ],
        "recent_mistakes": [
            {
                "concept": m.concept,
                "mistake": m.mistake_description,
                "student_said": m.student_answer,
                "correct_was": m.correct_answer,
                "source": m.source
            } for m in recent_mistakes
        ],
        "persistent_weaknesses": list(persistent_weaknesses),
        "last_session_summary": last_session.struggled_concepts if last_session else [],
        "overall_mastery": round(
            ConceptMastery.objects.filter(user=user, topic=topic)
            .aggregate(avg=models.Avg('mastery_score'))['avg'] or 0
        )
    }
