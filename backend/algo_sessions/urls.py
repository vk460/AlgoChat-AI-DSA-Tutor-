from django.urls import path
from .views import StartSessionView, ChatMessageView

urlpatterns = [
    path('start/', StartSessionView.as_view(), name='start_session'),
    path('<int:session_id>/message/', ChatMessageView.as_view(), name='chat_message'),
]
