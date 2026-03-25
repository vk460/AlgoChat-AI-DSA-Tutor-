"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from chatbot.views import (
    home_view, ask_rag, analyze_practice_code, login_view, 
    get_conversations, get_messages, process_video, 
    video_chat, submit_assignment, get_user_progress,
    run_code_view, explain_code_view, student_profile_view
)

urlpatterns = [
    path('', home_view, name='home'),
    path('admin/', admin.site.urls),
    
    # Auth & Conversations
    path('api/login/', login_view, name='login'),
    path('api/login', login_view, name='login_no_slash'),
    path('api/conversations/', get_conversations, name='conversations'),
    path('api/conversations', get_conversations, name='conversations_no_slash'),
    path('api/messages/<str:session_id>/', get_messages, name='messages'),
    
    # AI Chat / RAG
    path('api/chat/ask/', ask_rag, name='ask_api'),
    path('api/chat/ask', ask_rag, name='ask_api_no_slash'),
    path('api/ask/', ask_rag, name='ask_api_root'),
    path('api/ask', ask_rag, name='ask_api_root_no_slash'),
    path('ask/', ask_rag, name='ask'),
    path('ask', ask_rag, name='ask_no_slash'),
    
    # Analysis & Code
    path('api/analyze/', analyze_practice_code, name='analyze_api'),
    path('analyze/', analyze_practice_code, name='analyze'),
    path('api/run/', run_code_view, name='run_code_api'),
    path('run/', run_code_view, name='run_code'),
    path('api/explain/', explain_code_view, name='explain_code_api'),
    path('explain/', explain_code_view, name='explain_code'),
    
    # Video RAG
    path('api/video/process/', process_video, name='process_video_api'),
    path('video/process/', process_video, name='process_video'),
    path('api/video/chat/', video_chat, name='video_chat_api'),
    path('video/chat/', video_chat, name='video_chat'),
    
    # Progress & Profiles
    path('api/progress/', get_user_progress, name='get_user_progress_api'),
    path('progress/', get_user_progress, name='get_user_progress'),
    path('api/student-profile/', student_profile_view, name='student_profile'),
    
    # Assignments
    path('api/assignment/submit/', submit_assignment, name='submit_assignment_api'),
    path('assignment/submit/', submit_assignment, name='submit_assignment'),
]
