from django.urls import path
from .views import UserProfileView, ConceptMasteryView

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('mastery/', ConceptMasteryView.as_view(), name='concept-mastery'),
]
