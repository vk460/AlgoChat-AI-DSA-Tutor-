from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
from groq import Groq
from .models import GameScore

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@csrf_exempt
def generate_level(request):
    """Generates a dynamic game level based on game type and student context"""
    if request.method == 'POST':
        data = json.loads(request.body)
        game_type = data.get('game_type')
        topic = data.get('topic', 'arrays')
        level = data.get('level', 1)
        
        prompt = f"""Generate a {game_type} challenge for level {level} on the topic of {topic}.
        
        Game Types:
        - debug: Provide a code snippet with 1 subtle bug.
        - trace: Provide a code snippet and ask what the output will be.
        - complexity: Provide a code snippet and ask for Big O.
        
        Return JSON ONLY:
        {{
            "challenge_text": "...",
            "code": "...",
            "options": ["...", "...", "...", "..."],
            "correct_option_index": 0,
            "explanation": "..."
        }}
        """
        
        try:
            completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                response_format={"type": "json_object"}
            )
            return JsonResponse(json.loads(completion.choices[0].message.content))
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Only POST allowed"}, status=405)

@csrf_exempt
def submit_score(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        if not request.user.is_authenticated:
             return JsonResponse({"error": "Auth required"}, status=401)
             
        score_obj = GameScore.objects.create(
            user=request.user,
            game_type=data.get('game_type'),
            score=data.get('score'),
            level_reached=data.get('level')
        )
        
        # Award XP
        request.user.xp += data.get('score')
        if request.user.xp >= request.user.level * 100:
            request.user.level += 1
            request.user.xp = 0
        request.user.save()
        
        return JsonResponse({
            "status": "success",
            "new_level": request.user.level,
            "new_xp": request.user.xp
        })
    return JsonResponse({"error": "Only POST allowed"}, status=405)
