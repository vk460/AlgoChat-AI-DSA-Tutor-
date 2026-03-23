from django.db import models
from django.contrib.auth.models import User

class Conversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations', null=True, blank=True)
    title = models.CharField(max_length=255, default="New Conversation")
    session_id = models.CharField(max_length=255, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=50) # 'user' or 'assistant'
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.role} at {self.timestamp}"
class UserProgress(models.Model):
    PROGRESS_TYPES = (
        ('quiz', 'Quiz'),
        ('assignment', 'Assignment'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress')
    topic = models.CharField(max_length=255)
    score = models.IntegerField()
    total_score = models.IntegerField(default=10)
    progress_type = models.CharField(max_length=20, choices=PROGRESS_TYPES)
    feedback = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username} - {self.topic} ({self.score}/{self.total_score})"
