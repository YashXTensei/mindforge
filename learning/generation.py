"""
AI-powered content generation for the Learning Engine.

Two main jobs:
1. Extract topics from uploaded documents/notes (called during RAG pipeline)
2. Generate quiz questions for daily review (called when user starts a review)
"""

import json
import logging
from django.conf import settings
import google.generativeai as genai

logger = logging.getLogger(__name__)

# Initialize Gemini — same pattern as rag/chat.py
genai.configure(api_key=settings.GEMINI_API_KEY)


def extract_topics_from_text(text: str, max_topics: int = 5) -> list[str]:
    """
    Uses Gemini to extract core learning topics from a given text.
    
    Called by: rag/tasks.py after chunking is complete.
    Input: The raw text extracted from a PDF/Note.
    Output: A list of topic strings like ["React Hooks", "JWT Authentication"].
    
    WHY THIS EXISTS:
    When a user uploads a PDF about "System Design", we don't want to just embed it.
    We want MindForge to KNOW that this PDF contains topics like "Load Balancing", 
    "Database Sharding", "CAP Theorem" — so it can quiz the user on them later.
    """
    try:
        # User requested to use the VISION_MODEL (gemini-3.5-flash) for topic extraction
        model = genai.GenerativeModel(settings.RAG_CONFIG['VISION_MODEL'])
        
        # We only send the first ~15000 chars to avoid blowing up token limits.
        # For most documents, the first few pages contain the key topics anyway.
        trimmed_text = text[:15000]
        
        prompt = f"""Analyze the following text and extract up to {max_topics} core learning topics or concepts.
These topics will be used in a spaced repetition learning system.

Rules:
1. Keep topics concise (1-4 words max).
2. Focus on foundational concepts, not trivial details.
3. Make them specific enough to be testable (e.g., 'React useEffect' instead of just 'React').
4. Return ONLY a valid JSON list of strings, nothing else.

Text to analyze:
{trimmed_text}"""
        
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,  # Low temp = consistent, predictable JSON output
                response_mime_type="application/json",  # Forces Gemini to return valid JSON
            ),
            request_options={"timeout": 15}
        )
        
        topics = json.loads(response.text)
        
        # Validate: must be a list of strings
        if isinstance(topics, list) and all(isinstance(t, str) for t in topics):
            return [t.strip() for t in topics[:max_topics]]
        else:
            logger.error(f"Gemini returned invalid topic format: {topics}")
            return []
            
    except Exception as e:
        logger.error(f"Failed to extract topics: {str(e)}")
        return []


def generate_review_question(topic_name: str, context_text: str, difficulty: int) -> dict | None:
    """
    Generates a single MCQ question for a topic using relevant chunks as context.
    
    Called by: learning/views.py when building a daily review session.
    Input: topic name, relevant text from user's documents, difficulty level (1-3).
    Output: A dict with question, options, correct_answer, explanation.
    
    WHY THIS EXISTS:
    This is NOT a generic quiz generator (that would be a GPT wrapper).
    This generates questions from the USER'S OWN uploaded documents.
    So if you uploaded a React PDF, the question will be about YOUR specific notes on React,
    not generic React trivia from the internet.
    """
    try:
        model = genai.GenerativeModel(settings.RAG_CONFIG['CHAT_MODEL'])
        
        # Map difficulty int to descriptive instruction for Gemini
        difficulty_map = {
            1: "EASY — Test basic recall and definitions. The answer should be directly stated in the context.",
            2: "MEDIUM — Test understanding and application. Require the user to apply the concept.",
            3: "HARD — Test deep understanding and edge cases. Ask about nuances, exceptions, or comparisons.",
        }
        difficulty_instruction = difficulty_map.get(difficulty, difficulty_map[2])
        
        prompt = f"""Generate a multiple-choice question about "{topic_name}".

Context from the user's study materials:
{context_text[:10000]}

Difficulty: {difficulty_instruction}

Return a JSON object with this exact schema:
{{
    "question": "The question text",
    "options": {{"A": "First option", "B": "Second option", "C": "Third option", "D": "Fourth option"}},
    "correct_answer": "A",
    "explanation": "Why this answer is correct and why other options are wrong"
}}

Rules:
1. The question MUST be answerable from the provided context.
2. All 4 options must be plausible (no obviously wrong answers).
3. The explanation should help the user learn, not just state the answer.
4. Return ONLY valid JSON, nothing else."""

        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,  # Slightly higher temp for variety in questions
                response_mime_type="application/json",
            ),
            request_options={"timeout": 15}
        )
        
        question_data = json.loads(response.text)
        
        # Validate the response structure
        required_keys = {'question', 'options', 'correct_answer', 'explanation'}
        if not required_keys.issubset(question_data.keys()):
            logger.error(f"Missing keys in generated question: {question_data.keys()}")
            return None
            
        if question_data['correct_answer'] not in ['A', 'B', 'C', 'D']:
            logger.error(f"Invalid correct_answer: {question_data['correct_answer']}")
            return None
            
        return question_data
        
    except Exception as e:
        logger.error(f"Failed to generate question for '{topic_name}': {str(e)}")
        return None


def generate_review_questions_batch(topics_data: list[dict]) -> list[dict]:
    """
    Generates multiple MCQ questions in a SINGLE API call.
    
    Args:
        topics_data: List of dicts, e.g. 
        [
            {"topic_name": "React", "context": "...", "difficulty": 2, "mastery_id": 5},
            ...
        ]
        
    Returns:
        List of generated question dicts matching the input order.
    """
    if not topics_data:
        return []
        
    try:
        model = genai.GenerativeModel(settings.RAG_CONFIG['CHAT_MODEL'])
        
        # Build the batch prompt
        prompt = "Generate EXACTLY ONE multiple-choice question for each of the following topics based on their provided context.\n\n"
        
        for i, data in enumerate(topics_data):
            diff_map = {1: "EASY", 2: "MEDIUM", 3: "HARD"}
            diff_text = diff_map.get(data['difficulty'], "MEDIUM")
            
            prompt += f"--- TOPIC {i+1}: {data['topic_name']} ---\n"
            prompt += f"Difficulty: {diff_text}\n"
            
            # Mastery context — helps AI gauge where the user stands
            prompt += f"User Stats: Confidence {data.get('confidence', 0)}%, Accuracy {data.get('accuracy', 0)}%, "
            prompt += f"Reviewed {data.get('total_reviews', 0)} times, "
            prompt += f"Streak: {data.get('consecutive_correct', 0)} correct in a row\n"
            
            # Anti-repeat — send last 3-4 questions so AI doesn't repeat them
            prev_qs = data.get('prev_questions', [])
            if prev_qs:
                prompt += "Previously asked questions (DO NOT repeat these, ask something DIFFERENT):\n"
                for j, pq in enumerate(prev_qs, 1):
                    prompt += f"  {j}. {pq}\n"
            
            prompt += f"Context: {data['context'][:3000]}\n\n"
            
        prompt += """
Return a JSON array containing EXACTLY as many objects as there are topics requested.
The output MUST be a valid JSON array of objects with this exact schema:
[
  {
      "topic_index": <integer starting from 1 matching the topic number above>,
      "question": "The question text",
      "options": {"A": "First option", "B": "Second option", "C": "Third option", "D": "Fourth option"},
      "correct_answer": "A",
      "explanation": "Why this answer is correct"
  }
]

Rules:
1. You MUST return an array of objects.
2. Ensure options are A, B, C, D.
3. Generate exactly one question per topic.
4. DO NOT repeat any previously asked question. Ask about a DIFFERENT aspect of the topic.
5. Tailor question complexity based on the user's stats — if accuracy is high, push harder within the given difficulty level.
"""
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                response_mime_type="application/json",
            ),
            request_options={"timeout": 30}
        )
        
        questions_array = json.loads(response.text)
        
        # Validate output is a list
        if not isinstance(questions_array, list):
            logger.error("Batch generation did not return a list")
            return []
            
        return questions_array
        
    except Exception as e:
        logger.error(f"Failed to batch generate questions: {str(e)}")
        return []
