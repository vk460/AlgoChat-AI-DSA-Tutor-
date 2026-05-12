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
from django.urls import path, include
from chatbot.views import (
    home_view, ask_rag, analyze_practice_code, login_view, 
    get_conversations, get_messages, process_video, 
    video_chat, submit_assignment, get_user_progress,
    run_code_view, explain_code_view, student_profile_view,
    analyze_live_view, submit_code_view, get_intelligence_reports
)

urlpatterns = [
    path('', home_view, name='home'),
    path('admin/', admin.site.urls),
    
    # Auth & Neural State
    path('api/auth/', include('users.urls')),
    
    # Conversations
    path('api/conversations/', get_conversations, name='conversations'),
    path('api/messages/<str:session_id>/', get_messages, name='messages'),
    
    # AI Chat / RAG
    path('api/chat/ask/', ask_rag, name='ask_api'),
    path('api/chat/ask', ask_rag, name='ask_api_no_slash'),
    path('api/ask/', ask_rag, name='ask_api_root'),
    path('api/ask', ask_rag, name='ask_api_root_no_slash'),
    path('ask/', ask_rag, name='ask'),
    path('ask', ask_rag, name='ask_no_slash'),
    
    # Analysis & Code Intelligence
    path('api/analyze-live/', analyze_live_view, name='analyze_live'),
    path('api/submit-code/', submit_code_view, name='submit_code'),
    path('api/intelligence-reports/', get_intelligence_reports, name='intelligence_reports'),
    path('api/run/', run_code_view, name='run_code_api'),
    path('api/execute/', run_code_view, name='execute_code_api'),
    path('api/explain/', explain_code_view, name='explain_code_api'),
    path('api/student-profile/', student_profile_view, name='student_profile'),
    
    # Legacy / Root paths
    path('run/', run_code_view, name='run_code'),
    path('explain/', explain_code_view, name='explain_code'),
    path('analyze/', analyze_practice_code, name='analyze'),
    
    # Video RAG
    path('api/video/process/', process_video, name='process_video_api'),
    path('video/process/', process_video, name='process_video'),
    path('api/video/chat/', video_chat, name='video_chat_api'),
    path('video/chat/', video_chat, name='video_chat'),
    
    # Progress & Profiles
    path('api/progress/', get_user_progress, name='get_user_progress_api'),
    path('progress/', get_user_progress, name='get_user_progress'),
    
    # Assignments
    path('api/assignment/submit/', submit_assignment, name='submit_assignment_api'),
    path('assignment/submit/', submit_assignment, name='submit_assignment'),
    
    # New Modular Apps
    path('api/auth/', include('users.urls')),
    path('api/games/', include('algo_games.urls')),
    path('api/progress/', include('progress.urls')),
]
