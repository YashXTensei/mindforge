import json
import logging
from django.conf import settings
import google.generativeai as genai

logger = logging.getLogger(__name__)

# Initialize Gemini
genai.configure(api_key=settings.RAG_CONFIG['GEMINI_API_KEY'])

def extract_topics_from_text(text: str, max_topics: int = 5) -> list[str]:
    """
    Uses Gemini to extract core learning topics from a given text.
    Returns a list of topic strings.
    """
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""
        Analyze the following text and extract up to {max_topics} core learning topics or concepts.
        These topics will be used in a spaced repetition learning system.
        
        Rules:
        1. Keep topics concise (1-4 words max).
        2. Focus on foundational concepts, not trivial details.
        3. Make them specific enough to be testable (e.g., 'React useEffect' instead of just 'React').
        4. Return ONLY a valid JSON list of strings, nothing else. No markdown blocks.
        
        Text to analyze:
        {text[:15000]}  # Limit text to avoid blowing up token limits
        """
        
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,  # Low temp for consistent JSON
                response_mime_type="application/json",
            )
        )
        
        topics = json.loads(response.text)
        
        # Ensure it's a list of strings
        if isinstance(topics, list) and all(isinstance(t, str) for t in topics):
            return [t.strip() for t in topics[:max_topics]]
        else:
            logger.error(f"Gemini returned invalid topic format: {topics}")
            return []
            
    except Exception as e:
        logger.error(f"Failed to extract topics: {str(e)}")
        return []
