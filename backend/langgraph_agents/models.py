from django.db import models
from pgvector.django import VectorField
from users.models import User

class KnowledgeChunk(models.Model):
    """
    Stores semantic units of DSA knowledge for RAG.
    """
    CHUNK_TYPES = [
        ('concept', 'Concept Explanation'),
        ('code', 'Code Example'),
        ('steps', 'Algorithm Steps'),
        ('diagram', 'Diagram/Visualization'),
        ('misconception', 'Common Misconception'),
    ]

    chunk_id = models.CharField(max_length=255, unique=True)
    topic = models.CharField(max_length=100, db_index=True)
    chunk_type = models.CharField(max_length=20, choices=CHUNK_TYPES)
    content = models.TextField()
    metadata = models.JSONField(default=dict)
    source = models.CharField(max_length=100, default='gfg')
    
    # 384 dimensions for all-MiniLM-L6-v2
    embedding = VectorField(dimensions=384, null=True, blank=True)

    def __str__(self):
        return f"{self.topic} | {self.chunk_type} | {self.chunk_id}"

class MistakeDNA(models.Model):
    """
    Stores analyzed root cause patterns for a student.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mistake_dna')
    dominant_pattern = models.CharField(max_length=100) # e.g. boundary_blindness
    cross_topic = models.BooleanField(default=False)
    evidence = models.JSONField(default=list) # List of mistake IDs
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Mistake DNA Records"
