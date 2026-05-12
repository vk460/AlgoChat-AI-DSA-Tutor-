from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    level = models.IntegerField(default=1)
    xp = models.IntegerField(default=0)
    streak_days = models.IntegerField(default=0)
    last_active = models.DateField(null=True, blank=True)
    preferred_language = models.CharField(
        max_length=10,
        choices=[('python', 'Python'), ('java', 'Java')],
        default='python'
    )
    avatar_url = models.URLField(null=True, blank=True)


class ConceptHistory(models.Model):
    """Persistent neural memory: tracks which concepts a user has been quizzed on."""
    user_id = models.IntegerField(db_index=True)
    concept = models.CharField(max_length=100)
    quiz_taken = models.BooleanField(default=False)
    quiz_score = models.FloatField(default=0.0)
    mistakes = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user_id', 'concept')
        ordering = ['-updated_at']

    def __str__(self):
        return f"User {self.user_id} | {self.concept} | quiz_taken={self.quiz_taken}"
