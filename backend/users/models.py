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
