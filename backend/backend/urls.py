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
    run_code_view, explain_code_view, student_profile_view, force_migrate_view
)

urlpatterns = [
    path('', home_view, name='home'),
    path('admin/', admin.site.urls),
    path('api/login/', login_view, name='login'),
    path('api/login', login_view, name='login_no_slash'),
    path('api/conversations/', get_conversations, name='conversations'),
    path('api/conversations', get_conversations, name='conversations_no_slash'),
    path('api/messages/<str:session_id>/', get_messages, name='messages'),
    path('ask/', ask_rag, name='ask'),
    path('analyze/', analyze_practice_code, name='analyze'),
    path('run/', run_code_view, name='run_code'),
    path('explain/', explain_code_view, name='explain_code'),
    path('video/process/', process_video, name='process_video'),
    path('video/chat/', video_chat, name='video_chat'),
    path('assignment/submit/', submit_assignment, name='submit_assignment'),
    path('progress/', get_user_progress, name='get_user_progress'),
    path('api/student-profile/', student_profile_view, name='student_profile'),
    path('force-migrate/', force_migrate_view, name='force_migrate'),
]
