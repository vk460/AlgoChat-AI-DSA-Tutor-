from django.db import models
from users.models import User

class LearningSession(models.Model):
    """Stores every interaction for personalization"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    topic = models.CharField(max_length=50)
    session_type = models.CharField(
        max_length=20,
        choices=[
            ('socratic', 'Socratic'),
            ('game', 'Game'),
            ('quiz', 'Quiz'),
            ('code_review', 'Code Review'),
            ('interview', 'Interview')
        ]
    )
    language = models.CharField(max_length=10, default='python')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True)
    
    # The crucial personalization data
    struggled_concepts = models.JSONField(default=list)
    mastered_concepts = models.JSONField(default=list)
    messages = models.JSONField(default=list)  # Full conversation history
    performance_score = models.FloatField(null=True)
    
    # What the AI context builder reads
    xp_earned = models.IntegerField(default=0)
    completed = models.BooleanField(default=False)

class MistakeRecord(models.Model):
    """Every specific mistake stored for the chatbot context"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mistakes')
    session = models.ForeignKey(LearningSession, on_delete=models.CASCADE, null=True, blank=True)
    concept = models.CharField(max_length=100)
    topic = models.CharField(max_length=50)
    mistake_description = models.TextField()
    student_answer = models.TextField()
    correct_answer = models.TextField()
    source = models.CharField(max_length=20)  # socratic | game | quiz | code
    timestamp = models.DateTimeField(auto_now_add=True)
    reviewed = models.BooleanField(default=False)  # Has the AI addressed this in a later session?
