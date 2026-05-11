from django.db import models
from django.conf import settings

class GameScore(models.Model):
    GAME_TYPES = [
        ('debug', 'Bug Hunter'),
        ('trace', 'Trace Master'),
        ('complexity', 'Big O Battle'),
        ('battle', 'Concept Battle'),
        ('build', 'Algorithm Builder')
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    game_type = models.CharField(max_length=20, choices=GAME_TYPES)
    score = models.IntegerField()
    level_reached = models.IntegerField(default=1)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
