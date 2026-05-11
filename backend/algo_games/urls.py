from django.urls import path
from .views import generate_level, submit_score

urlpatterns = [
    path('generate/', generate_level, name='generate_level'),
    path('submit/', submit_score, name='submit_score'),
]
