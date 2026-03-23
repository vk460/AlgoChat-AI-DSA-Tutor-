import re
from youtube_transcript_api import YouTubeTranscriptApi

try:
    from .whisper_service import get_whisper_transcript
except ImportError:
    from whisper_service import get_whisper_transcript

# Create a single instance of the API (v1.x uses instance methods, not static)
_ytt_api = YouTubeTranscriptApi()

def extract_video_id(url):
    """
    Extracts the video ID from a YouTube URL.
    Handles shorts, embed, watch?v=, youtu.be, and more.
    """
    regex = r"(?:v=|\/|embed\/|shorts\/|youtu\.be\/)([0-9A-Za-z_-]{11})"
    match = re.search(regex, url)
    return match.group(1) if match else None

def get_transcript(video_id, return_snippets=False):
    """
    Fetches the transcript for a given YouTube video ID.
    Returns a string of the combined text OR a list of snippet objects if return_snippets=True.
    Attempts the YouTube Transcript API first, falls back to Whisper Speech-to-Text.
    """
    try:
        print(f"DEBUG: Attempting to fetch transcript via YouTubeTranscriptApi for {video_id}...")
        
        # v1.x API: use instance .fetch() method
        try:
            fetched_transcript = _ytt_api.fetch(video_id, languages=['en', 'hi'])
        except Exception as e:
            print(f"DEBUG: Preferred languages failed, trying to list available: {e}")
            transcript_list = _ytt_api.list(video_id)
            # Find any available transcript
            try:
                fetched_transcript = transcript_list.find_transcript(['en', 'hi', 'de', 'es', 'fr', 'ja', 'ko']).fetch()
            except Exception:
                # Last resort: just get the first one available
                fetched_transcript = next(iter(transcript_list)).fetch()

        if fetched_transcript:
            if return_snippets:
                # Return list of dictionaries with 'text' and 'start' (timestamp)
                return [{"text": snippet.text, "start": snippet.start} for snippet in fetched_transcript]
            
            transcript_text = " ".join([snippet.text for snippet in fetched_transcript])
            return transcript_text
            
    except Exception as e:
        print(f"YouTube transcript extraction failed for {video_id}: {str(e)}")
        
    # Fallback to Whisper
    try:
        print(f"DEBUG: Falling back to Whisper Speech-to-Text for {video_id}...")
        whisper_text = get_whisper_transcript(video_id)
        if whisper_text:
            if return_snippets:
                # Whisper returns a string currently. For now, we return it as one large snippet.
                return [{"text": whisper_text, "start": 0.0}]
            return whisper_text
    except Exception as e:
        print(f"Whisper fallback failed for {video_id}: {str(e)}")
        
    return None
