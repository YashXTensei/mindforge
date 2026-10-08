"""
Vision service for extracting semantic meaning from images.
Uses Gemini Vision API to convert images into structured text.
"""

import json
import logging
import pathlib
from google import genai
from google.genai import types
from django.conf import settings

logger = logging.getLogger(__name__)

# Initialize Gemini client with 60s timeout (new unified SDK)
gemini_client = genai.Client(
    api_key=settings.GEMINI_API_KEY,
    http_options=types.HttpOptions(timeout=60_000),
)

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
    model_name = settings.RAG_CONFIG.get('VISION_MODEL', 'gemini-3.8-flash')

    ext = pathlib.Path(image_path).suffix.lower()
    mime_type = MIME_TYPES.get(ext, 'image/jpeg')

    try:
        logger.info(f"Reading image bytes from {image_path}")
        image_bytes = pathlib.Path(image_path).read_bytes()

        logger.info(f"Sending image to Gemini Vision (model: {model_name})")
        response = gemini_client.models.generate_content(
            model=model_name,
            contents=[
                types.Content(role='user', parts=[
                    types.Part(text=VISION_PROMPT),
                    types.Part(inline_data=types.Blob(mime_type=mime_type, data=image_bytes)),
                ]),
            ],
        )

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

def describe_pdf_pages_batch(image_bytes_list: list[bytes]) -> list[str]:
    """
    Takes a list of JPEG image bytes (from PDF pages) and returns a list of OCR text strings.
    Sends all images in a single API call to save time and quota.
    """
    if not image_bytes_list:
        return []

    model_name = settings.RAG_CONFIG.get('VISION_MODEL', 'gemini-3.8-flash')
    
    prompt = f"""
You are an expert OCR AI. I am providing you with {len(image_bytes_list)} images, which are scanned pages from a document.
Your task is to transcribe ALL the text and math equations visible on each page.
If a page contains math, transcribe it clearly.

Provide your response as a valid JSON array of strings, where each string corresponds to the text of one page, in the exact order they were provided.
The array must have exactly {len(image_bytes_list)} elements.
If a page has no text, return an empty string for that element.

Return ONLY the JSON array, with no markdown formatting.
    """

    content_parts = [types.Part(text=prompt)]
    for img_bytes in image_bytes_list:
        content_parts.append(
            types.Part(inline_data=types.Blob(mime_type="image/jpeg", data=img_bytes))
        )

    try:
        logger.info(f"Sending batch of {len(image_bytes_list)} pages to Gemini Vision")
        
        response = gemini_client.models.generate_content(
            model=model_name,
            contents=[types.Content(role='user', parts=content_parts)],
            config=types.GenerateContentConfig(
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )

        text_response = response.text.strip()
        result = json.loads(text_response)
        
        if isinstance(result, list) and len(result) == len(image_bytes_list):
            return result
        else:
            logger.error(f"Batch OCR returned {len(result) if isinstance(result, list) else 'non-list'} items, expected {len(image_bytes_list)}")
            # Fallback: return what we got padded with empty strings
            if isinstance(result, list):
                return result + [""] * (len(image_bytes_list) - len(result))
            return [""] * len(image_bytes_list)

    except Exception as e:
        logger.error(f"Gemini Vision API batch error: {str(e)}")
        return [""] * len(image_bytes_list)
