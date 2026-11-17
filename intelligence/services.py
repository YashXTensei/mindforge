"""
Contradiction Detection Service — Phase 6.1

The brain of the intelligence engine. Detects when two claims from
different sources contradict each other.

Flow:
  1. New claims created (by Knowledge Compiler in Step 6)
  2. Generate embeddings for new claims (Cohere)
  3. Find semantically similar existing claims (pgvector cosine search)
  4. Send candidate pairs to Gemini for confirmation
  5. Save confirmed contradictions

Called by: rag/tasks.py Step 7 (after knowledge compilation)
"""

import json
import logging
from django.conf import settings
from django.db.models import Q
from pgvector.django import CosineDistance
from google import genai
from google.genai import types

from graph.models import Claim
from rag.embeddings import generate_embeddings
from .models import Contradiction

logger = logging.getLogger(__name__)

# Initialize Gemini client (same pattern as other services)
gemini_client = genai.Client(
    api_key=settings.GEMINI_API_KEY,
    http_options=types.HttpOptions(timeout=60_000),
)

# Claims with cosine distance below this threshold are candidates
SIMILARITY_THRESHOLD = 0.35  # Lower = more similar (cosine distance, not similarity)
MAX_CANDIDATES_PER_CLAIM = 5


def detect_contradictions(user, new_claim_ids: list[int]) -> list[Contradiction]:
    """
    Main entry point. Called after claims are created for a new document/note.
    
    Args:
        user: The user who owns the claims
        new_claim_ids: List of Claim IDs just created
        
    Returns:
        List of newly created Contradiction objects
    """
    if not new_claim_ids:
        return []

    new_claims = list(Claim.objects.filter(id__in=new_claim_ids, user=user))
    if not new_claims:
        return []

    logger.info(f"Contradiction detection: Processing {len(new_claims)} new claims for user {user.id}")

    # Step 1: Generate & save embeddings for new claims that don't have them
    _embed_claims(new_claims)

    # Step 2: For each new claim, find similar existing claims
    all_contradictions = []
    for claim in new_claims:
        if claim.embedding is None:
            continue

        candidates = _find_similar_claims(claim, user)
        if not candidates:
            continue

        logger.info(f"Claim '{claim.claim_text[:50]}': Found {len(candidates)} similar candidates")

        # Step 3: Confirm contradictions with Gemini
        for candidate in candidates:
            try:
                result = _confirm_contradiction(claim, candidate)
                if result and result.get('is_contradiction'):
                    # Check if this pair already exists (in either order)
                    exists = Contradiction.objects.filter(
                        Q(claim_a=claim, claim_b=candidate) |
                        Q(claim_a=candidate, claim_b=claim)
                    ).exists()

                    if not exists:
                        contradiction = Contradiction.objects.create(
                            user=user,
                            claim_a=claim,
                            claim_b=candidate,
                            explanation=result.get('explanation', 'Contradiction detected.'),
                            severity=result.get('severity', 'medium'),
                        )
                        all_contradictions.append(contradiction)
                        logger.info(
                            f"🔴 Contradiction found: '{claim.claim_text[:40]}' vs '{candidate.claim_text[:40]}'"
                        )
            except Exception as e:
                logger.warning(f"Contradiction confirmation failed for pair: {e}")
                continue

    logger.info(f"Contradiction detection complete: {len(all_contradictions)} new contradictions found")
    return all_contradictions


def _embed_claims(claims: list[Claim]) -> None:
    """Generate and save embeddings for claims that don't have them yet."""
    claims_to_embed = [c for c in claims if c.embedding is None]
    if not claims_to_embed:
        return

    texts = [c.claim_text for c in claims_to_embed]
    try:
        embeddings = generate_embeddings(texts, input_type="search_document")
        for claim, embedding in zip(claims_to_embed, embeddings):
            claim.embedding = embedding
            claim.save(update_fields=['embedding'])
        logger.info(f"Embedded {len(claims_to_embed)} claims")
    except Exception as e:
        logger.error(f"Failed to embed claims: {e}")


def _find_similar_claims(claim: Claim, user) -> list[Claim]:
    """
    Find existing claims from DIFFERENT sources that are semantically similar.
    Uses pgvector cosine distance — lower = more similar.
    """
    if claim.embedding is None:
        return []

    similar = (
        Claim.objects
        .filter(user=user, embedding__isnull=False)
        .exclude(id=claim.id)
        # Exclude claims from the SAME source document/note
        .exclude(content_type=claim.content_type, object_id=claim.object_id)
        .annotate(distance=CosineDistance('embedding', claim.embedding))
        .filter(distance__lt=SIMILARITY_THRESHOLD)
        .order_by('distance')
        [:MAX_CANDIDATES_PER_CLAIM]
    )

    return list(similar)


def _confirm_contradiction(claim_a: Claim, claim_b: Claim) -> dict | None:
    """
    Use Gemini to confirm whether two semantically similar claims actually contradict.
    Returns dict with is_contradiction, explanation, severity — or None on failure.
    """
    # Get source names for context
    source_a = _get_source_name(claim_a)
    source_b = _get_source_name(claim_b)

    prompt = f"""You are an expert fact-checker analyzing a student's knowledge base for contradictions.

Two claims from different sources appear semantically similar but may contradict each other.

**Claim A** (from "{source_a}", topic: {claim_a.topic.topic_name}):
"{claim_a.claim_text}"
Evidence: "{claim_a.evidence_text[:500]}"

**Claim B** (from "{source_b}", topic: {claim_b.topic.topic_name}):
"{claim_b.claim_text}"
Evidence: "{claim_b.evidence_text[:500]}"

Analyze carefully:
1. Do these claims CONTRADICT each other? (not just different aspects of the same thing)
2. A contradiction means they CANNOT both be true simultaneously.
3. Claims about different aspects of the same topic are NOT contradictions.
4. If one claim is a specific case and the other is general, that's NOT a contradiction.

Return JSON:
{{
    "is_contradiction": true/false,
    "explanation": "Clear explanation of why they do or don't contradict",
    "severity": "low" | "medium" | "high"
}}

Severity guide:
- "low": Minor inconsistency or difference in emphasis
- "medium": Conflicting statements that could confuse the learner  
- "high": Direct factual contradiction — they cannot both be true"""

    try:
        response = gemini_client.models.generate_content(
            model=settings.RAG_CONFIG['EXTRACTION_MODEL'],
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )

        if not response.text:
            logger.warning("Gemini returned empty response for contradiction check")
            return None

        text_response = response.text.strip()
        if text_response.startswith('```json'):
            text_response = text_response[7:-3].strip()
        elif text_response.startswith('```'):
            text_response = text_response[3:-3].strip()

        result = json.loads(text_response)

        # Validate severity
        if result.get('severity') not in ('low', 'medium', 'high'):
            result['severity'] = 'medium'

        return result

    except Exception as e:
        logger.error(f"Gemini contradiction confirmation failed: {e}")
        return None


def _get_source_name(claim: Claim) -> str:
    """Get a human-readable source name for a claim."""
    try:
        source = claim.source
        if source and hasattr(source, 'title'):
            return source.title
        return f"Source #{claim.object_id}"
    except Exception:
        return f"Source #{claim.object_id}"


def backfill_claim_embeddings(user) -> int:
    """
    Utility: Generate embeddings for all existing claims that don't have them.
    Run this once after deploying Phase 6.1 to enable contradiction detection
    on previously uploaded documents.
    
    Usage: python manage.py shell → from intelligence.services import backfill_claim_embeddings
    """
    claims = list(Claim.objects.filter(user=user, embedding__isnull=True))
    if not claims:
        logger.info("No claims need embedding backfill")
        return 0

    _embed_claims(claims)
    logger.info(f"Backfilled embeddings for {len(claims)} claims")
    return len(claims)
