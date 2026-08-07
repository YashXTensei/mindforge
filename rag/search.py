"""
Semantic Search — find content by meaning, not just keywords.

How it works:
  1. User query → Cohere embedding (vector)
  2. PGVector cosine distance search → find similar chunks
  3. Return ranked results with source info

This is the "retrieval" part of RAG (Retrieval-Augmented Generation).
"""

import logging
from django.conf import settings
from pgvector.django import CosineDistance
from .models import Chunk
from .embeddings import generate_query_embedding

logger = logging.getLogger(__name__)


def semantic_search(query, user, top_k=None):
    """
    Search for chunks similar to the query using vector similarity.

    Args:
        query: str — user's search query ("What is React?")
        user: User object — search only within this user's data
        top_k: int — how many results to return

    Returns:
        list of dict — [
            {
                'chunk_id': 1,
                'content': 'React is a JavaScript library...',
                'source_title': 'React Notes',
                'source_type': 'note',
                'source_id': 5,
                'chunk_index': 0,
                'metadata': {'page_num': 1},
                'distance': 0.15,   # lower = more similar
                'score': 0.85,      # higher = more relevant
            },
            ...
        ]
    """
    if top_k is None:
        top_k = settings.RAG_CONFIG['SEARCH_TOP_K']

    if not query.strip():
        return []

    # Step 1: Convert query text to vector
    logger.info(f"Semantic search: '{query}' (top_k={top_k})")
    query_embedding = generate_query_embedding(query)

    # Step 2: PGVector cosine distance search
    # We annotate each chunk with its distance from the query vector
    threshold = settings.RAG_CONFIG.get('SIMILARITY_THRESHOLD', 0.50)
    max_distance = 1.0 - threshold

    # Stage 1: Fetch candidate pool (top_k * 2)
    candidate_pool_size = top_k * 2

    results = list(
        Chunk.objects
        .filter(user=user)
        .annotate(distance=CosineDistance('embedding', query_embedding))
        .filter(distance__lte=max_distance)  # THRESHOLD FIX: Ignore irrelevant kachra
        .order_by('distance')  # closest first
        [:candidate_pool_size]
    )

    # Stage 2: Re-rank using weighted scoring (Semantic 0.9 + Recency 0.1)
    from django.utils import timezone
    now = timezone.now()

    formatted = []
    for chunk in results:
        similarity_score = 1.0 - float(chunk.distance)
        
        # Recency score calculation (0.0 to 1.0, where 1.0 is brand new)
        age_days = (now - chunk.created_at).days
        # Decay over 365 days, maxing at 1.0
        recency_score = max(0.0, 1.0 - (age_days / 365.0))
        
        # Weighted formula
        final_score = (similarity_score * 0.9) + (recency_score * 0.1)

        formatted.append({
            'chunk_id': chunk.id,
            'content': chunk.content,
            'source_title': chunk.source_title,
            'source_type': chunk.content_type.model,  # 'note' or 'document'
            'source_id': chunk.object_id,
            'chunk_index': chunk.chunk_index,
            'metadata': chunk.metadata,
            'created_at': chunk.created_at.strftime('%d %b %Y'),
            'distance': round(float(chunk.distance), 4),
            'score': round(similarity_score, 4),  # Pure semantic score
            'final_score': round(final_score, 4), # Re-ranking score
        })

    # Sort by final_score descending and take top_k
    formatted.sort(key=lambda x: x['final_score'], reverse=True)
    formatted = formatted[:top_k]

    logger.info(f"Found {len(formatted)} results after re-ranking")
    return formatted


def get_context_for_chat(query, user, top_k=5):
    """
    Get relevant chunks formatted as context for the LLM.
    Used by the Chat API (Step 8).

    Returns:
        tuple: (context_text, sources)
            - context_text: formatted string to inject into LLM prompt
            - sources: list of source citations
    """
    results = semantic_search(query, user, top_k=top_k)

    if not results:
        return "", []

    # Build context string for LLM
    context_parts = []
    sources = []

    for i, result in enumerate(results, 1):
        source_label = f"[Source {i}: {result['source_title']} (Added: {result['created_at']})"
        if result['metadata'].get('page_num'):
            source_label += f", Page {result['metadata']['page_num']}"
        source_label += "]"

        context_parts.append(f"{source_label}\n{result['content']}")

        sources.append({
            'chunk_id': result['chunk_id'],
            'source_title': result['source_title'],
            'source_type': result['source_type'],
            'source_id': result['source_id'],
            'snippet': result['content'][:200],  # first 200 chars as preview
            'page_num': result['metadata'].get('page_num'),
            'score': result['score'],
        })

    context_text = "\n\n---\n\n".join(context_parts)
    return context_text, sources
