"""
Vision service for extracting semantic meaning from images.
Uses Gemini Vision API to convert images into structured text.
"""

import json
import logging
import pathlib
import google.generativeai as genai
from django.conf import settings

logger = logging.getLogger(__name__)

# Configure Gemini for Vision
genai.configure(api_key=settings.GEMINI_API_KEY)

VISION_PROMPT = """
You are an expert AI vision assistant for a knowledge base (MindForge).
Your task is to analyze this image and extract information so it can be indexed for semantic search.

Provide your response as a valid JSON object with the following exact keys:
{
    "image_type": "string (e.g., flowchart, screenshot, diagram, photograph, notes, chart, table, other)",
    "summary": "string (A 1-2 sentence high-level overview of what this image shows)",
    "description": "string (A detailed semantic description of the visual elements, flow, relationships, or meaning)",
    "ocr_text": "string (All visible text in the image, transcribed exactly as it appears. If no text, use empty string.)"
}

Ensure the output is ONLY the JSON object, with no markdown formatting blocks like ```json.
"""

# Map file extension to MIME type
MIME_TYPES = {
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.webp': 'image/webp',
}


def describe_image(image_path: str) -> dict:
    """
    Analyzes an image and returns a structured dictionary of its contents.

    Reads the image as raw bytes and sends it inline to Gemini — no File API
    or OAuth required, works with a standard API key.

    Args:
        image_path: Absolute path to the image file.

    Returns:
        dict: {'image_type': '...', 'summary': '...', 'description': '...', 'ocr_text': '...'}
    """
    model_name = settings.RAG_CONFIG.get('VISION_MODEL', 'gemini-3.6-flash')

    ext = pathlib.Path(image_path).suffix.lower()
    mime_type = MIME_TYPES.get(ext, 'image/jpeg')

    try:
        model = genai.GenerativeModel(model_name)

        logger.info(f"Reading image bytes from {image_path}")
        image_bytes = pathlib.Path(image_path).read_bytes()

        image_part = {
            "mime_type": mime_type,
            "data": image_bytes,
        }

        logger.info(f"Sending image to Gemini Vision (model: {model_name})")
        response = model.generate_content([VISION_PROMPT, image_part])

        # Parse JSON from response
        text_response = response.text.strip()
        if text_response.startswith('```json'):
            text_response = text_response[7:-3].strip()
        elif text_response.startswith('```'):
            text_response = text_response[3:-3].strip()

        return json.loads(text_response)

    except Exception as e:
        logger.error(f"Gemini Vision API error for {image_path}: {str(e)}")
        # Return fallback so pipeline doesn't crash completely
        return {
            "image_type": "unknown",
            "summary": "Failed to analyze image.",
            "description": f"Error during vision analysis: {str(e)}",
            "ocr_text": ""
        }
