"""
RAG Chat Service — Ask questions, get answers from YOUR knowledge.

Flow:
  User question → Semantic search → Top chunks as context → Gemini LLM → Answer with citations
"""

import logging
import google.generativeai as genai
from django.conf import settings
from .search import get_context_for_chat
from .models import ChatConversation, ChatMessage

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = """You are MindForge AI — a helpful assistant that answers questions using the user's personal knowledge base.

RULES:
1. Answer ONLY based on the provided context. If the context doesn't contain enough information, say so honestly.
2. When you use information from a source, cite it like [Source 1], [Source 2], etc.
3. Be concise but thorough.
4. If the user asks something completely unrelated to the context, politely say you can only answer from their stored knowledge.
5. Format your answers in Markdown for readability.

CONTEXT FROM USER'S KNOWLEDGE BASE:
{context}
"""

NO_CONTEXT_PROMPT = """You are MindForge AI. The user asked a question but no relevant content was found in their knowledge base.

Politely inform them that:
1. No relevant documents/notes were found for their question.
2. They should upload relevant PDFs or create notes first.
3. Then try asking again.

Be helpful and encouraging."""


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

    # Get relevant context via semantic search
    context_text, sources = get_context_for_chat(user_message, user, top_k=5)

    # Build the prompt
    if context_text:
        system_prompt = SYSTEM_PROMPT.format(context=context_text)
    else:
        system_prompt = NO_CONTEXT_PROMPT

    # Get conversation history (last 10 messages for context window)
    history = ChatMessage.objects.filter(
        conversation=conversation
    ).order_by('-created_at')[:10]

    # Build Gemini chat history
    gemini_history = []
    for msg in reversed(list(history)):
        if msg.id == user_msg.id:
            continue  # skip current message, we'll send it separately
        gemini_history.append({
            'role': 'user' if msg.role == 'user' else 'model',
            'parts': [msg.content],
        })

    # Call Gemini
    model_name = settings.RAG_CONFIG['CHAT_MODEL']
    model = genai.GenerativeModel(
        model_name=model_name,
        system_instruction=system_prompt,
    )

    try:
        chat_session = model.start_chat(history=gemini_history)
        response = chat_session.send_message(user_message)

        assistant_content = response.text
        
        # Extract token usage if available
        prompt_tokens = None
        completion_tokens = None
        if hasattr(response, 'usage_metadata'):
            usage = response.usage_metadata
            prompt_tokens = getattr(usage, 'prompt_token_count', None)
            completion_tokens = getattr(usage, 'candidates_token_count', None)

    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        import traceback
        trace_str = traceback.format_exc()
        assistant_content = f"I'm sorry, I encountered an error: {str(e)}\n\nTraceback:\n```\n{trace_str}\n```"
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
