# Phase 4 Hardening — Audit Results (Completed 7 September 2026)

3 parallel auditors reviewed 30+ files across rag/, learning/, vault/, notes/, config/. This document consolidates all findings into actionable categories. All items have been successfully resolved.

## 🟢 BUGS — Fixed

- ✅ **BUG-1: Document Context is NEVER Used for Question Generation [CRITICAL]**
  - **Fix:** Used semantic search (`rag.search.semantic_search`) to retrieve relevant chunks for question generation context instead of broken hasattr checks.
- ✅ **BUG-2: Unvalidated Gemini Output Crashes Daily Review [HIGH]**
  - **Fix:** Added a `validate_question(q_data)` helper to gracefully skip malformed AI output instead of crashing.
- ✅ **BUG-3: SM-2 Easiness Factor Never Changes [HIGH]**
  - **Fix:** Passed varied quality values (correct=5, wrong=1, skip=0) and applied formula on incorrect answers to ensure EF properly adjusts.
- ✅ **BUG-4: Deleting Documents Destroys Review History [HIGH]**
  - **Fix:** Changed `ReviewItem.mastery` `on_delete` to `models.SET_NULL` (migration `0002_alter_reviewitem_mastery.py` created) to preserve historical review data.
- ✅ **BUG-5: Internal Error Disclosure in ChatView [HIGH/SECURITY]**
  - **Fix:** Returned a generic error message to the frontend and logged the raw exception server-side.
- ✅ **BUG-6: Orphan Chunks on Zero-Text Reprocessing [MEDIUM]**
  - **Fix:** Moved the "delete old chunks" step before the zero-text short-circuit check.
- ✅ **BUG-7: updated_at Broken by update_fields in ProcessingMixin [MEDIUM]**
  - **Fix:** Included 'updated_at' in every `update_fields` list.
- ✅ **BUG-8: ReviewSession.score Never Calculated [MEDIUM]**
  - **Fix:** Calculated `session.score` when a session completes.
- ✅ **BUG-9: Redundant Chunk Title Updates on Every Status Change [MEDIUM]**
  - **Fix:** Tracked `_original_title` and only updated chunks when the title actually changes.
- ✅ **BUG-10: N+1 Queries in Semantic Search [MEDIUM]**
  - **Fix:** Added `.select_related('content_type')` to the Chunk queryset.
- ✅ **BUG-11: No Concurrency Guard on Processing Trigger [MEDIUM]**
  - **Fix:** Checked if a document is already in a processing state before queueing multiple Celery tasks.

## 🟢 IMPROVEMENTS — Fixed

- ✅ **IMP-1: N+1 in ConversationListView**
  - **Fix:** Used annotation with `Count` and `Subquery` (DISTINCT ON) in the queryset.
- ✅ **IMP-2: Topic Extraction Prompt Quality**
  - **Fix:** Improved the extraction prompt for unconventional material, emphasizing testable concepts and treating "up to" as a maximum.
- ✅ **IMP-3: Question Generation Prompt — Source-First + Fallback**
  - **Fix:** Updated the prompt to clearly implement a source-first strategy and added a meta-phrase rule (no "Based on the provided notes...").
- ✅ **IMP-4: requests.get Without Timeout**
  - **Fix:** Added `timeout=60` to the remote file download request.

## ⏸️ Deferred (Still Pending)

| Item | Reason |
|---|---|
| weak_sub_concepts implementation | Phase 5 scope — requires knowledge graph for proper sub-concept relationships |
| generate_review_question dead code | Harmless; may be useful for future single-question API |
| Cross-tenant IDOR on taxonomy (category/tags) | Requires taxonomy model redesign; currently low impact (single-user system) |
| Thread-safety in embedding provider singleton | Single Celery worker with -P solo; no real concurrency |
| PyMuPDF resource leak (doc.close() without finally) | Rare edge case; Celery worker restart cleans it up |
| Chat history role ordering edge case | Rare (only when 10th-oldest message is assistant); complex fix |
| Gemini SDK migration | Working fine; migration should be a separate, dedicated task (Added to ideas) |
| Direct Cloudinary upload | Separate architectural task, planned for next (Added to ideas) |
| Re-upload topic refresh | Complex behavior change; needs design discussion for Phase 5 (Added to ideas) |

## Verification Plan — Completed
- Tests added in `learning/tests.py` (4 test functions).
- `extract_topics` boolean field added to Document and Note models.
