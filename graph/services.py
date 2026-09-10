"""
Knowledge Compiler — The brain of Phase 5.

Takes already-processed text chunks + user's existing topic IDs,
sends them to Gemini, and extracts:
  1. Claims — factual statements with evidence quotes
  2. Relationships — prerequisite/related connections between topics

Also provides:
  - Graph data serialization for the frontend
  - Gap analysis (backward BFS through PREREQ edges)
"""

import json
import logging
from collections import deque

from django.conf import settings
from django.contrib.contenttypes.models import ContentType

import google.generativeai as genai

from learning.models import TopicMastery
from .models import TopicRelationship, Claim

logger = logging.getLogger(__name__)

# Configure Gemini (same pattern as rag/chat.py and learning/generation.py)
genai.configure(api_key=settings.GEMINI_API_KEY)


# ──────────────────────────────────────────────
# Knowledge Compiler (Core)
# ──────────────────────────────────────────────

def compile_knowledge(user, chunk_texts: list[str], topics_with_ids: list[dict], source_obj):
    """
    Analyze text chunks and extract claims + relationships.

    Called by: rag/tasks.py (Step 6) after topic extraction.

    Args:
        user: User object
        chunk_texts: list of str — already-processed chunk texts from Step 2
        topics_with_ids: list of dicts — [{"id": 5, "name": "React Hooks"}, ...]
        source_obj: Document or Note instance — the source being processed

    This function is designed to be ISOLATED — if it fails, the rest of
    the RAG pipeline still succeeds. Never raise exceptions that would
    kill the parent task.
    """
    if not chunk_texts or not topics_with_ids:
        logger.info("Knowledge compiler: No chunks or topics to process, skipping")
        return

    # Don't process if there's only 1 topic — no relationships possible
    if len(topics_with_ids) < 2:
        logger.info(f"Knowledge compiler: Only {len(topics_with_ids)} topic(s), skipping relationship detection")
        # Still extract claims even with 1 topic
        if len(topics_with_ids) == 1:
            _extract_claims_only(user, chunk_texts, topics_with_ids, source_obj)
        return

    try:
        # Build the combined text (cap at ~15000 chars to save tokens)
        combined_text = "\n\n---\n\n".join(chunk_texts)
        if len(combined_text) > 15000:
            combined_text = combined_text[:15000] + "\n\n[... truncated for analysis ...]"

        # Build topic list for the prompt
        topics_json = json.dumps(topics_with_ids, indent=2)

        result = _call_gemini_compiler(combined_text, topics_json)

        if not result:
            logger.warning("Knowledge compiler: Gemini returned empty result")
            return

        # Save claims
        claims_data = result.get('claims', [])
        _save_claims(user, claims_data, topics_with_ids, source_obj)

        # Save relationships
        relationships_data = result.get('relationships', [])
        _save_relationships(user, relationships_data, topics_with_ids)

        logger.info(
            f"Knowledge compiler: Saved {len(claims_data)} claims, "
            f"{len(relationships_data)} relationships for {source_obj}"
        )

    except Exception as e:
        logger.error(f"Knowledge compiler failed: {e}")
        # Don't re-raise — this is an isolated failure


def _extract_claims_only(user, chunk_texts, topics_with_ids, source_obj):
    """Extract claims when there's only 1 topic (no relationships possible)."""
    try:
        combined_text = "\n\n---\n\n".join(chunk_texts)
        if len(combined_text) > 15000:
            combined_text = combined_text[:15000]

        model = genai.GenerativeModel(settings.RAG_CONFIG['EXTRACTION_MODEL'])

        topic = topics_with_ids[0]
        prompt = f"""Analyze the following text and extract key factual claims about the topic "{topic['name']}".

Text:
{combined_text}

Extract up to 10 important factual claims. For each claim, provide a direct evidence quote from the text.

Return JSON:
{{
    "claims": [
        {{"topic_id": {topic['id']}, "claim": "The factual claim", "evidence": "Direct quote from text..."}}
    ]
}}

Rules:
1. Claims must be factual statements that can be verified from the text.
2. Evidence must be actual quotes from the provided text, not paraphrased.
3. Keep claims concise (1-2 sentences max).
4. Return ONLY valid JSON."""

        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                response_mime_type="application/json",
            ),
            request_options={"timeout": 30}
        )

        result = json.loads(response.text)
        claims_data = result.get('claims', [])
        _save_claims(user, claims_data, topics_with_ids, source_obj)
        logger.info(f"Knowledge compiler (claims-only): Saved {len(claims_data)} claims")

    except Exception as e:
        logger.error(f"Claims-only extraction failed: {e}")


def _call_gemini_compiler(combined_text: str, topics_json: str) -> dict | None:
    """
    Single Gemini call to extract both claims AND relationships.
    Uses EXTRACTION_MODEL (gemini-3.5-flash) for speed and cost.
    """
    model = genai.GenerativeModel(settings.RAG_CONFIG['EXTRACTION_MODEL'])

    prompt = f"""You are analyzing a user's study material to build their knowledge graph.

Here are their EXISTING topics with IDs:
{topics_json}

Text chunks from the document:
{combined_text}

Your job:
1. CLAIMS: Extract key factual statements with direct evidence quotes, linked to the correct topic ID.
2. RELATIONSHIPS: Detect prerequisite or related connections between the listed topics.
   - PREREQ: Topic A is a prerequisite for Topic B (you need to understand A before B).
   - RELATED: Topics are related but neither is strictly a prerequisite.

Return JSON:
{{
    "claims": [
        {{"topic_id": <int>, "claim": "The factual claim", "evidence": "Direct quote from text..."}}
    ],
    "relationships": [
        {{
            "source_topic_id": <int>,
            "target_topic_id": <int>,
            "type": "PREREQ" or "RELATED",
            "weight": <float 0.5-1.0>,
            "reason": "Why these topics are connected — be specific"
        }}
    ]
}}

Rules:
1. Only use topic IDs from the provided list. Do NOT invent new topic IDs.
2. Claims must be factual and backed by evidence quotes from the text.
3. Evidence must be actual quotes, not paraphrased.
4. For PREREQ: source_topic_id is the prerequisite, target_topic_id is the dependent topic.
5. weight is your confidence (0.5 = somewhat confident, 1.0 = very confident). Skip anything below 0.5.
6. Reasons should be specific: "Understanding X from topic A is needed to grasp Y in topic B".
7. Do NOT create self-relationships (same source and target).
8. Keep claims concise (1-2 sentences).
9. Extract up to 15 claims and up to 10 relationships.
10. Return ONLY valid JSON."""

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                response_mime_type="application/json",
            ),
            request_options={"timeout": 45}
        )

        result = json.loads(response.text)

        # Basic structure validation
        if not isinstance(result, dict):
            logger.error(f"Compiler: Expected dict, got {type(result)}")
            return None

        return result

    except json.JSONDecodeError as e:
        logger.error(f"Compiler: Invalid JSON from Gemini: {e}")
        return None
    except Exception as e:
        logger.error(f"Compiler: Gemini call failed: {e}")
        return None


# ──────────────────────────────────────────────
# Validation & Saving
# ──────────────────────────────────────────────

def _save_claims(user, claims_data: list, topics_with_ids: list, source_obj):
    """Validate and bulk-save claims to the database."""
    if not claims_data:
        return

    # Build a set of valid topic IDs for quick lookup
    valid_topic_ids = {t['id'] for t in topics_with_ids}

    content_type = ContentType.objects.get_for_model(source_obj)

    claims_to_create = []
    for claim_data in claims_data:
        topic_id = claim_data.get('topic_id')
        claim_text = claim_data.get('claim', '').strip()
        evidence_text = claim_data.get('evidence', '').strip()

        # Validate
        if not topic_id or topic_id not in valid_topic_ids:
            continue
        if not claim_text or not evidence_text:
            continue
        if len(claim_text) < 10:  # Skip trivially short claims
            continue

        claims_to_create.append(Claim(
            user=user,
            topic_id=topic_id,
            claim_text=claim_text,
            evidence_text=evidence_text,
            content_type=content_type,
            object_id=source_obj.id,
        ))

    if claims_to_create:
        Claim.objects.bulk_create(claims_to_create)
        logger.info(f"Saved {len(claims_to_create)} claims (skipped {len(claims_data) - len(claims_to_create)})")


def _save_relationships(user, relationships_data: list, topics_with_ids: list):
    """Validate and save relationships (edges) to the database."""
    if not relationships_data:
        return

    valid_topic_ids = {t['id'] for t in topics_with_ids}
    saved_count = 0

    for rel_data in relationships_data:
        source_id = rel_data.get('source_topic_id')
        target_id = rel_data.get('target_topic_id')
        rel_type = rel_data.get('type', '').upper()
        weight = rel_data.get('weight', 1.0)
        reason = rel_data.get('reason', '').strip()

        if not _validate_relationship(source_id, target_id, rel_type, weight, valid_topic_ids):
            continue

        # Use get_or_create to handle the unique_together constraint gracefully
        _, created = TopicRelationship.objects.get_or_create(
            source_topic_id=source_id,
            target_topic_id=target_id,
            relationship_type=rel_type,
            defaults={
                'user': user,
                'weight': weight,
                'relationship_reason': reason,
            }
        )

        if created:
            saved_count += 1

    logger.info(f"Saved {saved_count} relationships (skipped {len(relationships_data) - saved_count})")


def _validate_relationship(source_id, target_id, rel_type, weight, valid_topic_ids) -> bool:
    """
    Returns True only if the relationship is valid.
    Rejects self-relations, invalid IDs, low confidence, and obvious cycles.
    """
    # 1. No self-relations
    if source_id == target_id:
        return False

    # 2. Both topic IDs must exist in user's topics
    if source_id not in valid_topic_ids or target_id not in valid_topic_ids:
        return False

    # 3. Valid relationship type
    if rel_type not in ('PREREQ', 'RELATED'):
        return False

    # 4. Minimum confidence threshold
    if weight < 0.5:
        return False

    # 5. No obvious prerequisite cycles (A→B and B→A)
    if rel_type == 'PREREQ' and TopicRelationship.objects.filter(
        source_topic_id=target_id,
        target_topic_id=source_id,
        relationship_type='PREREQ'
    ).exists():
        return False

    return True


# ──────────────────────────────────────────────
# Graph Data Serialization (for API / Frontend)
# ──────────────────────────────────────────────

def get_graph_data(user):
    """
    Serialize topics (nodes) and relationships (links) for react-force-graph-2d.

    Returns:
        dict: {
            "nodes": [{"id": 5, "name": "React Hooks", "confidence": 0.8, ...}],
            "links": [{"source": 12, "target": 5, "type": "PREREQ", ...}]
        }
    """
    # Fetch all user's topics with claim counts
    from django.db.models import Count

    topics = (
        TopicMastery.objects
        .filter(user=user)
        .annotate(claim_count=Count('claims'))
        .values(
            'id', 'topic_name', 'confidence_level', 'easiness_factor',
            'total_reviews', 'total_correct', 'consecutive_correct',
            'next_review_date', 'claim_count'
        )
    )

    nodes = []
    for t in topics:
        accuracy = (t['total_correct'] / t['total_reviews'] * 100) if t['total_reviews'] > 0 else 0
        nodes.append({
            'id': t['id'],
            'name': t['topic_name'],
            'confidence': round(t['confidence_level'] * 100, 1),
            'accuracy': round(accuracy, 1),
            'review_count': t['total_reviews'],
            'consecutive_correct': t['consecutive_correct'],
            'claim_count': t['claim_count'],
            'next_review': str(t['next_review_date']),
        })

    # Fetch all relationships
    relationships = (
        TopicRelationship.objects
        .filter(user=user)
        .values('source_topic_id', 'target_topic_id', 'relationship_type', 'weight', 'relationship_reason')
    )

    links = []
    for r in relationships:
        links.append({
            'source': r['source_topic_id'],
            'target': r['target_topic_id'],
            'type': r['relationship_type'],
            'weight': round(r['weight'], 2),
            'reason': r['relationship_reason'],
        })

    return {'nodes': nodes, 'links': links}


# ──────────────────────────────────────────────
# Gap Analysis — "What am I missing to understand X?"
# ──────────────────────────────────────────────

def analyze_gaps(user, target_topic_id: int) -> dict:
    """
    Backward BFS from target_topic through PREREQ edges.
    Identifies weak (confidence < 50%) and missing (confidence == 0) prerequisites.

    Algorithm:
      1. Start at the target topic node
      2. Follow all incoming PREREQ edges backward
      3. For each prerequisite: check confidence_level
         - 0   → MISSING (never reviewed)
         - <0.5 → WEAK (needs work)
         - ≥0.5 → OK (skip)
      4. Recursively check prerequisites of weak/missing nodes
      5. Return the full path with status

    Returns:
        dict: {
            "target": {"id": 5, "name": "React Hooks", "confidence": 0},
            "missing": [{"id": 12, "name": "Closures", "confidence": 0}],
            "weak": [{"id": 8, "name": "Scope", "confidence": 30}],
            "ready": [{"id": 3, "name": "Variables", "confidence": 85}],
            "path": ["Variables", "Scope", "Closures", "React Hooks"]
        }
    """
    try:
        target_topic = TopicMastery.objects.get(id=target_topic_id, user=user)
    except TopicMastery.DoesNotExist:
        return {"error": "Topic not found"}

    # Build adjacency list of PREREQ edges for this user (reverse direction)
    # "A --PREREQ--> B" means A is a prerequisite for B
    # We want: for each node, what are its prerequisites? → incoming PREREQ edges
    prereq_edges = TopicRelationship.objects.filter(
        user=user,
        relationship_type='PREREQ'
    ).values_list('source_topic_id', 'target_topic_id')

    # Build reverse adjacency: target → [list of prerequisites (sources)]
    prereq_map = {}
    for source_id, target_id in prereq_edges:
        prereq_map.setdefault(target_id, []).append(source_id)

    # Cache topic data
    all_topics = {
        t.id: t for t in TopicMastery.objects.filter(user=user)
    }

    # BFS backward from target
    visited = set()
    queue = deque([target_topic_id])
    missing = []
    weak = []
    ready = []
    path_order = []  # Topological order (prerequisites first)

    while queue:
        current_id = queue.popleft()
        if current_id in visited:
            continue
        visited.add(current_id)

        topic = all_topics.get(current_id)
        if not topic:
            continue

        # Skip the target itself for categorization
        if current_id != target_topic_id:
            topic_info = {
                'id': topic.id,
                'name': topic.topic_name,
                'confidence': round(topic.confidence_level * 100, 1),
                'review_count': topic.total_reviews,
            }

            if topic.confidence_level == 0:
                missing.append(topic_info)
            elif topic.confidence_level < 0.5:
                weak.append(topic_info)
            else:
                ready.append(topic_info)

        path_order.append(topic.topic_name)

        # Add prerequisites of current node to queue
        for prereq_id in prereq_map.get(current_id, []):
            if prereq_id not in visited:
                queue.append(prereq_id)

    # Reverse path so prerequisites come first
    path_order.reverse()

    return {
        'target': {
            'id': target_topic.id,
            'name': target_topic.topic_name,
            'confidence': round(target_topic.confidence_level * 100, 1),
        },
        'missing': missing,
        'weak': weak,
        'ready': ready,
        'path': path_order,
        'total_prerequisites': len(missing) + len(weak) + len(ready),
    }
