from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import make_password
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import User

@csrf_exempt
def signup_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            if User.objects.filter(username=data['email']).exists():
                return JsonResponse({'error': 'User already exists'}, status=400)
            
            user = User.objects.create(
                username=data['email'],
                email=data['email'],
                password=make_password(data['password']),
                first_name=data.get('name', '')
            )
            return JsonResponse({
                'message': 'Signup successful',
                'user': {
                    'id': user.id,
                    'name': user.first_name,
                    'email': user.email
                }
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'POST required'}, status=405)

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user = authenticate(username=data['email'], password=data['password'])
        if user:
            return JsonResponse({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'name': user.first_name,
                    'email': user.email,
                    'level': user.level
                }
            })
        return JsonResponse({'error': 'Invalid credentials'}, status=401)
    return JsonResponse({'error': 'POST required'}, status=405)

@csrf_exempt
def terminate_session_view(request):
    """
    Resets the user's progress and history for testing.
    """
    print("\n[DEBUG] TERMINATE REQUEST RECEIVED")
    if request.method == 'POST':
        data = json.loads(request.body)
        user_id = data.get('user_id')
        print(f"[DEBUG] User ID to terminate: {user_id}")
        try:
            user = User.objects.get(id=user_id)
            # Resetting level and any related session data
            user.level = 1
            user.xp = 0
            user.save()
            print(f"[DEBUG] User {user.email} neural state reset successfully.")
            return JsonResponse({'message': 'Session terminated and neural state reset.'})
        except User.DoesNotExist:
            print(f"[DEBUG] ERROR: User ID {user_id} not found in database.")
            return JsonResponse({'error': 'User not found'}, status=404)
    return JsonResponse({'error': 'POST required'}, status=405)
