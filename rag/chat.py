"""
RAG Chat Service — Ask questions, get answers from YOUR knowledge.

Flow:
  User question → Semantic search → Top chunks as context → Gemini LLM → Answer with citations
"""

import logging
import re
import traceback
from google import genai
from google.genai import types
from django.conf import settings
from .search import get_context_for_chat
from .models import ChatConversation, ChatMessage

logger = logging.getLogger(__name__)

# Initialize Gemini client with 60s timeout (new unified SDK)
gemini_client = genai.Client(
    api_key=settings.GEMINI_API_KEY,
    http_options=types.HttpOptions(timeout=60_000),
)

SYSTEM_PROMPT = """You are MindForge AI — a helpful assistant and a Personal AI Operating System.
You help the user manage their knowledge base, but you are also a highly capable general AI assistant.

RULES:
1. If the user's question can be answered using the provided context, prioritize the context.
2. When you use information from the context, YOU MUST cite it like [Source 1], [Source 2], etc.
3. IMPORTANT: Only cite a source if it genuinely helps answer the query. If a source is irrelevant to the question, completely ignore it and DO NOT cite it.
4. If the context does NOT contain the answer, or if the user is asking a general knowledge question, YOU MUST answer using your own general AI knowledge.
5. Format your answers in Markdown for readability.

CONTEXT FROM USER'S KNOWLEDGE BASE:
{context}
"""

NO_CONTEXT_PROMPT = """You are MindForge AI — a helpful assistant and a Personal AI Operating System.
You help the user manage their knowledge base, but you are also a highly capable general AI assistant.

RULES:
1. There is currently no relevant context found in the user's vault for this specific question.
2. YOU MUST ANSWER the user's question using your own general AI knowledge. Do not refuse to answer.
3. Since you are answering from general knowledge, you may politely (but briefly) mention that you didn't find specific notes on this in their vault, but here is the answer anyway.
4. Format your answers in Markdown for readability.
"""


# Context-dependent keywords indicating the user is referring to previous chat history
CONTEXT_DEPENDENT_WORDS = {
    'it', 'this', 'that', 'those', 'these', 'again', 'he', 'she', 
    'they', 'him', 'her', 'them', 'more', 'same', 'continue', 'recheck', 'previous'
}

def requires_previous_context(query: str) -> bool:
    """
    Heuristic-based ambiguity detection.
    Returns True if the query relies on conversational context.
    Extensible: Later we can replace this with an LLM call (Level 2).
    """
    # Use regex to strip punctuation and extract pure words
    words = re.findall(r"\b\w+\b", query.lower())
    
    # Check if any word exactly matches a context word
    if any(word in CONTEXT_DEPENDENT_WORDS for word in words):
        return True
        
    return False


def chat(conversation_id, user_message, user):
    """
    Process a user message and generate an AI response.

    Args:
        conversation_id: int or None — existing conversation, or None for new
        user_message: str — the user's question
        user: User object

    Returns:
        dict — {
            'conversation_id': 1,
            'user_message': {...},
            'assistant_message': {...},
        }
    """
    # Get or create conversation
    if conversation_id:
        conversation = ChatConversation.objects.get(id=conversation_id, user=user)
    else:
        # Auto-generate title from first message
        title = user_message[:50] + ('...' if len(user_message) > 50 else '')
        conversation = ChatConversation.objects.create(user=user, title=title)

    # Save user message
    user_msg = ChatMessage.objects.create(
        conversation=conversation,
        role='user',
        content=user_message,
    )

    # Level 1: Conversation-aware retrieval
    search_query = user_message
    if conversation_id and requires_previous_context(user_message):
        # Fetch ONLY the single most recent previous user message
        last_user_msg = ChatMessage.objects.filter(
            conversation=conversation, 
            role='user'
        ).exclude(id=user_msg.id).order_by('-created_at').first()
        
        if last_user_msg:
            # Use natural text concatenation instead of symbols like '|'
            search_query = f"{last_user_msg.content}. {user_message}"

    # Get relevant context via semantic search
    context_text, sources = get_context_for_chat(search_query, user, top_k=5)

    # Build the prompt
    if context_text:
        system_prompt = SYSTEM_PROMPT.format(context=context_text)
    else:
        system_prompt = NO_CONTEXT_PROMPT

    # Get conversation history (last 10 messages for context window)
    history = ChatMessage.objects.filter(
        conversation=conversation
    ).order_by('-created_at')[:10]

    # Build contents list with history + current message
    contents = []
    for msg in reversed(list(history)):
        if msg.id == user_msg.id:
            continue  # skip current message, we'll add it at the end
        contents.append(types.Content(
            role='user' if msg.role == 'user' else 'model',
            parts=[types.Part(text=msg.content)],
        ))
    # Add current user message at the end
    contents.append(types.Content(
        role='user',
        parts=[types.Part(text=user_message)],
    ))

    # Call Gemini with new SDK
    model_name = settings.RAG_CONFIG['CHAT_MODEL']

    try:
        response = gemini_client.models.generate_content(
            model=model_name,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
            ),
        )

        assistant_content = response.text
        if not assistant_content:
            raise ValueError("Gemini returned empty response (possibly blocked by safety filters)")
        
        # LLM-Based Source Filtering (Interim Regex Solution)
        # Check which [Source X] tags were actually cited in the response
        if sources:
            cited_indices = set()
            matches = re.findall(r'\[Source (\d+)\]', assistant_content)
            for m in matches:
                try:
                    cited_indices.add(int(m))
                except ValueError:
                    pass
            
            # Only keep the sources that were cited
            filtered_sources = []
            for i, src in enumerate(sources, 1):
                if i in cited_indices:
                    filtered_sources.append(src)
            sources = filtered_sources
        
        # Extract token usage if available
        prompt_tokens = None
        completion_tokens = None
        if hasattr(response, 'usage_metadata') and response.usage_metadata:
            usage = response.usage_metadata
            prompt_tokens = getattr(usage, 'prompt_token_count', None)
            completion_tokens = getattr(usage, 'candidates_token_count', None)

    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())  # Log full trace server-side only

        error_msg = str(e).lower()
        if '429' in error_msg or 'rate limit' in error_msg or 'quota' in error_msg or 'resource_exhausted' in error_msg:
            assistant_content = (
                "⏳ **API Rate Limit Exceeded**\n\n"
                "I am currently experiencing a high volume of requests and have reached the AI provider's rate limit. "
                "Please wait approximately **30 to 60 seconds** before sending another message.\n\n"
                "*(Note: The current free tier allows a maximum of 5 requests per minute.)*"
            )
        elif '404' in error_msg or 'not found' in error_msg:
            assistant_content = (
                f"❌ **Model Configuration Error**\n\n"
                f"The configured AI model (`{model_name}`) was not found or is not available on this API key. "
                f"Please verify `GEMINI_CHAT_MODEL` in your environment or Heroku settings."
            )
        elif 'timeout' in error_msg or 'timed out' in error_msg:
            assistant_content = (
                "⏱️ **Request Timed Out**\n\n"
                "The AI model took longer than 60 seconds to respond. Please try sending your query again."
            )
        else:
            assistant_content = (
                "❌ **Processing Error**\n\n"
                "I apologize, but I encountered an unexpected error while generating a response. "
                "Please try submitting your query again in a few moments."
            )
        sources = []
        prompt_tokens = None
        completion_tokens = None

    # Save assistant message
    assistant_msg = ChatMessage.objects.create(
        conversation=conversation,
        role='assistant',
        content=assistant_content,
        sources=sources,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        model_name=model_name,
    )

    # Update conversation timestamp
    conversation.save()  # triggers auto_now on updated_at

    return {
        'conversation_id': conversation.id,
        'user_message': {
            'id': user_msg.id,
            'role': user_msg.role,
            'content': user_msg.content,
            'created_at': user_msg.created_at,
        },
        'assistant_message': {
            'id': assistant_msg.id,
            'role': assistant_msg.role,
            'content': assistant_msg.content,
            'sources': assistant_msg.sources,
            'prompt_tokens': assistant_msg.prompt_tokens,
            'completion_tokens': assistant_msg.completion_tokens,
            'model_name': assistant_msg.model_name,
            'created_at': assistant_msg.created_at,
        },
    }
