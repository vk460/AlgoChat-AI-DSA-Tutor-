from django.db import models
from django.conf import settings

class UserProgress(models.Model):
    PROGRESS_TYPES = (
        ('quiz', 'Quiz'),
        ('assignment', 'Assignment'),
        ('code_practice', 'Code Practice'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='progress')
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

class ConceptMastery(models.Model):
    """Core of the personalization system — one row per concept per user"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='concept_mastery')
    concept_name = models.CharField(max_length=100)
    topic = models.CharField(max_length=50)  # binary_search, linked_list, etc.
    mastery_score = models.FloatField(default=0.0)  # 0-100
    status = models.CharField(
        max_length=20,
        choices=[('weak', 'Weak'), ('learning', 'Learning'), ('mastered', 'Mastered')],
        default='weak'
    )
    times_practiced = models.IntegerField(default=0)
    times_wrong = models.IntegerField(default=0)
    persistent_weakness = models.BooleanField(default=False)
    last_practiced = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['user', 'concept_name']

    def __str__(self):
        return f"{self.user.username} - {self.concept_name} ({self.status})"
