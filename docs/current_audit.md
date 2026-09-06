Phase 4 Hardening — Audit Report & Implementation Plan
3 parallel auditors reviewed 30+ files across rag/, learning/, vault/, notes/, config/. This document consolidates all findings into actionable categories.

🔴 BUGS — Must Fix Now
BUG-1: Document Context is NEVER Used for Question Generation [CRITICAL]
File: 
views.py
Problem: DailyReviewView checks hasattr(src_obj, 'text_content') and hasattr(src_obj, 'content') to get source context. But Document has neither field — its text lives in rag.Chunk records. Result: every PDF-based topic gets "General knowledge about {topic}" as context, completely ignoring the user's uploaded material.
Impact: The SOURCE-FIRST strategy is broken for all PDFs/images. The learning engine is essentially a generic quiz generator for vault documents.
Fix: Use semantic search (rag.search.semantic_search) to retrieve relevant chunks for each topic, filtered by user. This reuses the existing RAG infrastructure and provides semantically relevant context rather than arbitrary text slices.
BUG-2: Unvalidated Gemini Output Crashes Daily Review [HIGH]
Files: 
generation.py
, 
views.py
Problem: generate_review_questions_batch only checks isinstance(questions_array, list). Individual items are not validated. In DailyReviewView:
If Gemini returns a string inside the list → q_data.get(...) throws AttributeError
If correct_answer is "Option A" → CharField(max_length=1) throws DataError, crashing the entire API
Missing options keys break frontend rendering
Fix: Add a validate_question(q_data) helper that checks: is dict, has required keys, correct_answer in ['A','B','C','D'], options is dict with A/B/C/D keys. Skip invalid items gracefully.
BUG-3: SM-2 Easiness Factor Never Changes [HIGH]
File: 
sm2.py
Problem: On correct answer, quality=4 is always passed. The EF delta formula yields exactly 0.0. On incorrect answers, EF is intentionally left unchanged. So EF is permanently frozen at 2.5 for every user, every topic.
Fix: Pass varied quality values: correct=5, wrong=1, skip=0. This makes the SM-2 formula actually functional — EF increases for strong performance (quality 5 → +0.1) and decreases for weak performance (quality 1 → -0.44).
BUG-4: Deleting Documents Destroys Review History [HIGH]
File: 
models.py
Problem: ReviewItem.mastery uses on_delete=models.CASCADE. When orphaned topics are cleaned up (doc deleted → TopicSource deleted → TopicMastery deleted), ALL historical ReviewItems for that topic are wiped. ReviewSessions become corrupted (total_items=10 but 0 items exist).
Fix: Change to on_delete=models.SET_NULL, null=True. Historical review data is preserved even when topics are removed. Requires migration.
BUG-5: Internal Error Disclosure in ChatView [HIGH/SECURITY]
File: 
views.py
Problem: except Exception as e: return Response({'error': str(e)}, status=500) leaks raw exception details (API keys, SQL errors, provider internals) to frontend clients.
Fix: Return a generic error message. Log the real exception server-side.
BUG-6: Orphan Chunks on Zero-Text Reprocessing [MEDIUM]
File: 
tasks.py
Problem: If a previously-processed document is reprocessed and yields 0 extractable pages, the task returns early without deleting old chunks. Old stale chunks remain in the vector DB.
Fix: Move the "delete old chunks" step before the zero-text short-circuit check.
BUG-7: updated_at Broken by update_fields in ProcessingMixin [MEDIUM]
File: 
mixins.py
Problem: update_status(), mark_completed(), mark_failed() all call self.save(update_fields=[...]) without including 'updated_at'. Django's auto_now does NOT update fields excluded from update_fields. This causes cleanup_stuck_processing() to incorrectly identify actively-running jobs as stuck.
Fix: Include 'updated_at' in every update_fields list.
BUG-8: ReviewSession.score Never Calculated [MEDIUM]
File: 
views.py
Problem: When a session completes, session.score is never computed. It stays None forever.
Fix: Calculate session.score = (session.correct_items / session.total_items) * 100 when session completes.
BUG-9: Redundant Chunk Title Updates on Every Status Change [MEDIUM]
File: 
signals.py
Problem: Every update_status() call triggers post_save → unnecessary SQL UPDATE chunk SET source_title=... query. During a single document processing, this fires 4-5 times.
Fix: Track _original_title and only update chunks when title actually changes.
BUG-10: N+1 Queries in Semantic Search [MEDIUM]
File: 
search.py
Problem: chunk.content_type.model triggers individual django_content_type query per chunk because .select_related('content_type') is missing.
Fix: Add .select_related('content_type') to the Chunk queryset.
BUG-11: No Concurrency Guard on Processing Trigger [MEDIUM]
File: 
views.py
Problem: User can spam "Process with AI" button, queueing multiple concurrent Celery tasks for the same document. This creates duplicate chunks and wastes API calls.
Fix: Check if document is already in a processing state before queueing.
🟡 IMPROVEMENTS — Should Fix
IMP-1: N+1 in ConversationListView
File: 
views.py
 + 
serializers.py
Problem: message_count and last_message execute 2 queries per conversation. 50 conversations = 101 queries.
Fix: Use annotation with Count and Subquery in the queryset.
IMP-2: Topic Extraction Prompt Quality
File: 
generation.py
Improvement: Strengthen the extraction prompt to better handle unconventional material (anime lists, personal docs). Add instruction to extract meaningful, learnable concepts rather than trivial entity names. Reinforce "up to" is a maximum, not a target.
IMP-3: Question Generation Prompt — Source-First + Fallback
File: 
generation.py
Improvement: Once BUG-1 is fixed (real context flows in), update the prompt to clearly communicate the SOURCE-FIRST + INTELLIGENT FALLBACK strategy to Gemini. Context should be primary, general knowledge should supplement when needed.
IMP-4: requests.get Without Timeout
File: 
tasks.py
Fix: Add timeout=60 to the remote file download.
⏸️ DEFERRED — Intentionally NOT Changed Before Phase 5
Item	Reason
weak_sub_concepts implementation	Phase 5 scope — requires knowledge graph for proper sub-concept relationships
generate_review_question dead code	Harmless; may be useful for future single-question API
Cross-tenant IDOR on taxonomy (category/tags)	Requires taxonomy model redesign; currently low impact (single-user system)
Thread-safety in embedding provider singleton	Single Celery worker with -P solo; no real concurrency
PyMuPDF resource leak (doc.close() without finally)	Rare edge case; Celery worker restart cleans it up
Chat history role ordering edge case	Rare (only when 10th-oldest message is assistant); complex fix
Gemini SDK migration (google.generativeai → google.genai)	Working fine; migration should be a separate, dedicated task
Direct Cloudinary upload (15MB fix)	Separate architectural task, already planned post-Phase 4
Re-upload topic refresh (services.py L53-60)	Complex behavior change; needs design discussion for Phase 5
Verification Plan
Automated Tests
Tests will cover these critical boundaries:

extract_topics=true → topics generated
extract_topics=false → no topics, but chunks/RAG remain
Review question with RAG chunk context → source-grounded question
Review question with no chunks → general knowledge fallback
Invalid Gemini response → handled gracefully, no crash
Source deletion → ReviewItems preserved (SET_NULL), no crash
User A cannot access User B's chunks/topics/reviews
SM-2 with quality=5 → EF increases; quality=1 → EF decreases
Manual Verification
Deploy to Heroku and test daily review with a real PDF
Verify question context includes actual PDF content (not just "General knowledge about...")
Delete a document and verify review history is preserved
Implementation Order
Priority	Bug ID	Est. Complexity
1	BUG-1: Fix Document context retrieval	High (core logic rewrite)
2	BUG-2: Gemini output validation	Medium
3	BUG-3: SM-2 quality values	Low
4	BUG-4: ReviewItem CASCADE → SET_NULL	Low (+ migration)
5	BUG-5: Error disclosure fix	Low
6	BUG-6: Orphan chunks on reprocess	Low
7	BUG-7: updated_at in ProcessingMixin	Low
8	BUG-8: Session score calculation	Low
9	BUG-9: Redundant chunk updates	Low
10	BUG-10: N+1 in search	Low
11	BUG-11: Concurrency guard	Low
12	IMP-1: N+1 in conversations	Medium
13	IMP-2: Topic extraction prompt	Low
14	IMP-3: Question generation prompt	Low
15	IMP-4: requests.get timeout	Low
