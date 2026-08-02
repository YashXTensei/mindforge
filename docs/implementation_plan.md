# ADR: Image Intelligence (Phase 3.5)

## 1. Problem

MindForge ka RAG pipeline sirf PDF text samajhta hai. Do blind spots hain:
- **Standalone images** (screenshots, study notes, diagrams) vault me padi rehti hain bina AI understanding ke
- **PDF embedded images** (diagrams on page 5, charts on page 12) silently skip ho jaati hain

Real-world vault content ka ~30-40% visual hai. Bina image support ke, RAG pipeline incomplete hai.

## 2. Chosen Solution

**Approach 1: Image → Text Representation → Existing Pipeline**

```
Image ──→ Gemini Vision ──→ Structured Text ──→ [Existing] Chunk → Embed → PGVector
```

### Core Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Vision API | Gemini (already in stack) | No new dependency, free tier available |
| Output format | Structured (type + summary + description + OCR) | Richer semantic context than plain paragraph |
| Pipeline changes | Extraction layer only | Zero changes to chunking, embedding, search, chat |
| DB schema changes | None | Existing `metadata` JSONField is sufficient |
| Duplicate OCR | Programmatic detection (difflib) | More reliable than prompt-based deduplication |
| Rate limiting | Celery task-level + Redis throttle | Non-blocking, doesn't freeze workers |
| Architecture | BaseExtractor pattern | Future-proofs for DOCX, PPTX, audio, etc. |

### New File: `rag/vision.py`

Single responsibility: Talk to Gemini Vision, return structured data.

```python
def describe_image(image_bytes: bytes, filename: str) -> dict:
    """
    Returns:
        {
            "image_type": "flowchart",      # auto-detected category
            "summary": "...",               # 1-2 sentence overview
            "description": "...",           # detailed semantic description
            "ocr_text": "..."              # all visible text extracted
        }
    """
```

### Rich Knowledge Representation

Combined text that gets passed to chunking:

```
=== Image Type ===
Flowchart

=== Summary ===
A flowchart showing the Django request-response cycle from client to server.

=== Semantic Description ===
The diagram shows a horizontal flow starting from 'Client Browser'...
Each box is color-coded: blue for client-side, green for server-side.

=== Visible Text ===
Client Browser → URL Router → View → Template → Response
```

### Extractor Abstraction

```
BaseExtractor (ABC)
├── extract(file_path) → [{"page_num": int, "text": str}]
├── supports(file_ext) → bool
│
├── PDFExtractor        ← PyMuPDF text + embedded image extraction
├── ImageExtractor      ← Gemini Vision → structured text
└── (future: DocxExtractor, PptxExtractor, AudioExtractor)
```

Every extractor returns the **same format**. Pipeline doesn't care what the source was.

### Duplicate OCR Detection

```python
from difflib import SequenceMatcher

def is_duplicate_text(ocr_text: str, page_text: str, threshold=0.85) -> bool:
    """If OCR text is 85%+ similar to already-extracted page text, skip it."""
    ratio = SequenceMatcher(None, ocr_text.strip(), page_text.strip()).ratio()
    return ratio >= threshold
```

Used when merging PDF page text with image OCR. If the image is just a screenshot of the same text that's already on the page, we don't duplicate it.

### Rate Limiting Strategy

Instead of `time.sleep()` (which blocks the Celery worker), we use two layers:

**Layer 1 — Celery Task-Level Rate Limiting:**
```python
@shared_task(bind=True, rate_limit='15/m')  # max 15 image tasks per minute
def process_image_description(self, image_data):
    ...
```

**Layer 2 — Redis-Based Token Bucket (for within-task calls):**
When a single PDF has 20 embedded images, we use a Redis-backed throttle to control Gemini API call frequency without blocking the worker thread entirely. If the bucket is empty, the task re-queues itself with a `countdown` delay instead of sleeping.

### Enriched Chunk Metadata

```python
# Standalone image chunk
metadata = {
    "page_num": 1,
    "source_format": "image",
    "image_type": "architecture_diagram",
    "contains_text": True,
    "contains_graph": False,
    "original_filename": "system_arch.png"
}

# PDF page with embedded images
metadata = {
    "page_num": 5,
    "source_format": "pdf",
    "has_images": True,
    "image_count": 2,
    "image_types": ["flowchart", "table"]
}
```

No schema migration needed. Everything fits in existing `JSONField`.

### Files Changed

| File | Type | What Changes |
|---|---|---|
| `rag/vision.py` | **NEW** | Gemini Vision API wrapper |
| `rag/extraction.py` | **REFACTOR** | BaseExtractor + PDFExtractor + ImageExtractor |
| `rag/tasks.py` | **MODIFY** | Route by file type, use extractor pattern |
| `config/settings.py` | **MODIFY** | Add `VISION_MODEL`, `MAX_IMAGE_SIZE` to `RAG_CONFIG` |

> **Note (Aug 2, 2026):** Extracting embedded images from PDFs has been deferred to Phase 4. Phase 3.5 currently handles standalone images only.

### Files NOT Changed

| File | Why Untouched |
|---|---|
| `rag/chunking.py` | Input format unchanged (`[{page_num, text}]`) |
| `rag/embeddings.py` | Still embedding text, not images |
| `rag/search.py` | PGVector cosine search unchanged |
| `rag/chat.py` | Context injection unchanged |
| `rag/models.py` | Chunk model already flexible |
| `rag/serializers.py` | No new API contracts |
| All frontend files | Zero UI changes needed |

## 3. Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| **Multimodal Embeddings** (CLIP, Google Multimodal) | Requires replacing Cohere, redesigning retrieval pipeline, separate vector spaces for text vs image. Overkill for our use case |
| **Image Region Chunking** (split image into quadrants, embed each) | Too complex, fragile for diagrams/flowcharts where meaning spans the full image |
| **Store images as-is, send to Gemini at chat time** | Slow (API call on every search), expensive, doesn't scale |
| **Local Vision Model** (LLaVA, etc.) | Requires GPU, complex deployment, worse quality than Gemini |

## 4. Trade-offs

| We Get | We Give Up |
|---|---|
| Image understanding via existing pipeline | Direct pixel-level image search |
| Zero changes to retrieval/chat/search | Slightly lossy representation (text description vs actual image) |
| Simple architecture (1 new file) | Dependency on Gemini Vision API availability |
| Future extractor pattern | Small refactor of existing extraction.py |
| Works today with free tier | Rate limited on high-volume image processing |

**Acceptable?** Yes. For study materials, screenshots, flowcharts, and diagrams — text representation captures 95%+ of the semantic meaning. The 5% we lose (exact pixel layout) is irrelevant for RAG search and chat.

## 5. Future Extensions

These are **not** in scope for Phase 3.5, but the architecture supports them:

| Extension | How It Fits |
|---|---|
| **DOCX Extractor** | New `DocxExtractor(BaseExtractor)` — same pattern |
| **PPTX Extractor** | New `PptxExtractor(BaseExtractor)` — slides as pages |
| **Audio Transcripts** | New `AudioExtractor(BaseExtractor)` — Whisper → text → embed |
| **Multimodal Embeddings** | Swap Cohere provider in `embeddings.py` — extraction layer unchanged |
| **Image Type Filtering** | Frontend filter: "Show only flowchart sources" using `metadata.image_type` |
| **Re-describe with better model** | Just update `VISION_MODEL` in settings, reprocess |

---

> **Phase Classification:** This is **Phase 3.5** — an extension of the existing RAG engine's ingestion capabilities. Not a new phase.