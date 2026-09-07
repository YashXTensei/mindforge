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


def extract_topics_from_text(text: str) -> list[str]:
    """
    Uses Gemini to extract core learning topics from a given text.
    
    Called by: rag/tasks.py after chunking is complete.
    Input: The raw text extracted from a PDF/Note.
    Output: A list of topic strings like ["React Hooks", "JWT Authentication"].
    """
    try:
        # User requested to use the EXTRACTION_MODEL (gemini-3.5-flash-lite) for topic extraction
        model = genai.GenerativeModel(settings.RAG_CONFIG['EXTRACTION_MODEL'])
        
        # Dynamically calculate max topics based on document length.
        # Assume ~3000 chars per page. We want approx 1 topic per page, min 5, max 30.
        char_length = len(text)
        max_topics = max(5, min(30, char_length // 3000))
        
        # We can pass the whole text because Gemini has a massive context window (1M+ tokens)
        prompt = f"""Analyze the following text and extract up to {max_topics} core learning topics or concepts.
These topics will be used to generate spaced repetition flashcards.

Rules:
1. Keep topics concise (1-4 words max).
2. Extract meaningful, learnable concepts rather than trivial entity names (e.g., 'React useEffect' or 'Isekai Anime Tropes').
3. Make them specific enough to be testable.
4. {max_topics} is a MAXIMUM limit, not a target. Only extract topics that are genuinely important or useful to learn from this text.
5. Do not assume any material is 'invalid'; if the user uploaded it, find the core concepts within it.
6. Return ONLY a valid JSON list of strings, nothing else.

Text to analyze:
{text}"""
        
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
        model = genai.GenerativeModel(settings.RAG_CONFIG['QUESTION_MODEL'])
        
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
4. DO NOT start questions with meta-phrases like "Based on the provided notes", "According to the context", or "In the text". Frame the question directly and naturally.
5. Return ONLY valid JSON, nothing else."""

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


def validate_question(q_data: dict) -> bool:
    """
    Validates a single question dict from Gemini output.
    Returns True if the question has all required fields and valid values.
    """
    if not isinstance(q_data, dict):
        return False
    
    required_keys = {'question', 'options', 'correct_answer', 'explanation'}
    if not required_keys.issubset(q_data.keys()):
        return False
    
    # correct_answer must be exactly one of A, B, C, D
    if q_data['correct_answer'] not in ['A', 'B', 'C', 'D']:
        return False
    
    # options must be a dict with A, B, C, D keys
    options = q_data.get('options')
    if not isinstance(options, dict):
        return False
    if not {'A', 'B', 'C', 'D'}.issubset(options.keys()):
        return False
    
    # question and explanation must be non-empty strings
    if not isinstance(q_data['question'], str) or not q_data['question'].strip():
        return False
    if not isinstance(q_data['explanation'], str):
        return False
    
    return True


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
        List of validated question dicts matching the input order.
    """
    if not topics_data:
        return []
        
    try:
        model = genai.GenerativeModel(settings.RAG_CONFIG['QUESTION_MODEL'])
        
        # Build the batch prompt
        prompt = "Generate EXACTLY ONE multiple-choice question for each of the following topics.\n\n"
        prompt += "IMPORTANT SOURCE-FIRST STRATEGY:\n"
        prompt += "- If the provided context contains relevant source material, primarily base your question on that material.\n"
        prompt += "- If the source material is insufficient for a meaningful question, supplement it with relevant general knowledge.\n"
        prompt += "- If no useful source context is provided, use general knowledge to create a meaningful question.\n"
        prompt += "- NEVER invent facts about what the user's document contains.\n"
        prompt += "- NEVER contradict the source material.\n\n"
        
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
2. correct_answer MUST be exactly one character: "A", "B", "C", or "D".
3. options MUST be a JSON object with keys "A", "B", "C", "D".
4. Generate exactly one question per topic.
5. DO NOT repeat any previously asked question. Ask about a DIFFERENT aspect of the topic.
6. Tailor question complexity based on the user's stats — if accuracy is high, push harder within the given difficulty level.
7. DO NOT start questions with meta-phrases like "Based on the provided notes", "According to the context", or "In the text". Frame the question directly and naturally.
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
        
        # Validate each item individually — skip invalid ones instead of crashing
        validated = []
        for q in questions_array:
            if validate_question(q):
                validated.append(q)
            else:
                logger.warning(f"Skipping invalid question from Gemini: {str(q)[:200]}")
        
        return validated
        
    except Exception as e:
        logger.error(f"Failed to batch generate questions: {str(e)}")
        return []

