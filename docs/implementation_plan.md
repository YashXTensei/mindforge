# Phase 5 Implementation Plan: The Network Effect (Interactive Graph)

> Last Updated: 25 August 2026

## 1. Vision & Goal

"MindForge doesn't just store knowledge — it *compiles* it into a structured, queryable intelligence."

Phase 5 introduces the **Knowledge Compiler** and **Interactive Knowledge Graph**. Instead of just extracting isolated topics, MindForge will now extract claims, evidence, and prerequisite relationships, allowing users to visualize their knowledge base as a connected network and identify gaps in their understanding.

---

## 2. Core Features

### Keep ✅
- **Topic Extraction**: Built in Phase 4, serves as the foundation (nodes) for the graph.
- **RAG Pipeline**: Existing chunking and embedding pipeline provides the raw text and semantic search capabilities.

### Add ⭐
- **Knowledge Compiler (LLM)**: Analyzes text chunks to extract structured claims with evidence, and auto-detects prerequisite relationships between topics (e.g., "useEffect" -> requires -> "React Component Lifecycle").
- **Interactive Knowledge Graph (UI)**: 3D or 2D force-directed graph (using `react-force-graph`). Nodes are topics, edges are prerequisite/relationship links, colors indicate mastery level, and size indicates source count.
- **Gap Analysis & Blind Spot Detection**: Graph algorithms (topological sort, reachability) to answer "What am I missing to understand X?" and highlight isolated nodes or prerequisite gaps.

### Don't Build ❌
- Fully manual graph editing (too tedious, defeats the purpose of AI automation).
- Overly complex multi-modal graph connections (keep it focused on text/concept relationships for now).

---

## 3. Database Schema (Django Models)

### Update `learning/models.py` or Create `graph/models.py`

```python
# graph/models.py (New App)

from django.db import models
from django.conf import settings
from learning.models import TopicMastery
from vault.models import Document
from notes.models import Note
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

class Claim(models.Model):
    """A structured factual claim extracted from a document/note."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    topic = models.ForeignKey(TopicMastery, on_delete=models.CASCADE, related_name='claims')
    claim_text = models.TextField()
    evidence_text = models.TextField() # Direct quote or summary supporting the claim
    
    # Source tracking
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    source = GenericForeignKey('content_type', 'object_id')
    
    created_at = models.DateTimeField(auto_now_add=True)

class TopicRelationship(models.Model):
    """Directed edges between topics in the knowledge graph."""
    class RelationshipType(models.TextChoices):
        PREREQUISITE = 'PREREQ', 'Is Prerequisite For'
        RELATED = 'RELATED', 'Is Related To'
        CONTRADICTS = 'CONTRADICT', 'Contradicts' # For Phase 6 prep
        
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    source_topic = models.ForeignKey(TopicMastery, on_delete=models.CASCADE, related_name='outgoing_edges')
    target_topic = models.ForeignKey(TopicMastery, on_delete=models.CASCADE, related_name='incoming_edges')
    relationship_type = models.CharField(max_length=20, choices=RelationshipType.choices, default=RelationshipType.RELATED)
    
    # Confidence or weight given by the LLM (0.0 to 1.0)
    weight = models.FloatField(default=1.0)
    
    class Meta:
        unique_together = ['source_topic', 'target_topic', 'relationship_type']
```

---

## 4. System Architecture

### 4.1 The Knowledge Compiler (Celery Task Extension)

Extend the existing RAG pipeline (`process_document` / `process_note`) or create a separate asynchronous task triggered after topic extraction.

```
[Phase 4 Pipeline]
Upload → Extract Text → Chunk → Embed → Topic Extraction → TopicMastery

[Phase 5 Extension]
                                            ↓
                                  Knowledge Compiler Task
                                            ↓
               ┌────────────────────────────┴────────────────────────────┐
               ↓                                                         ↓
      Extract Claims (JSON)                                 Detect Relationships (JSON)
      (Topic A: Claim 1, Evidence 1)                        (Topic A -> PREREQ -> Topic B)
               ↓                                                         ↓
      Save to Claim Model                                   Save to TopicRelationship Model
```

- Send combined chunks (or document summary) to Gemini with a schema requesting a list of `claims` (with `topic_name`, `claim_text`, `evidence`) and a list of `relationships` (with `source_topic`, `target_topic`, `type`).
- Fuzzy match topic names to link them to existing `TopicMastery` records.

### 4.2 Graph Computation & Gap Analysis

Create utility functions in `graph/services.py`:

```python
def get_graph_data(user):
    """Serialize topics (nodes) and relationships (links) for D3/react-force-graph."""
    pass

def analyze_gaps(user, target_topic_name):
    """
    Perform topological traversal from target_topic backwards through PREREQ edges.
    Identify any nodes where mastery confidence_level < 0.5.
    Return a path of missing knowledge.
    """
    pass
```

---

## 5. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/graph/network/` | Returns JSON format suitable for graph rendering: `{"nodes": [...], "links": [...]}` |
| GET | `/api/graph/analyze-gap/?target=Topic` | Returns missing prerequisites and weak nodes in the path to the target topic. |
| GET | `/api/graph/topics/{id}/claims/` | Returns claims and evidence associated with a specific topic node. |

---

## 6. Frontend Components (React + Tailwind)

### Knowledge Graph View (`/graph`)
- Use `react-force-graph-2d` or `react-force-graph-3d`.
- **Nodes**: Represent `TopicMastery`.
  - Color based on `confidence_level` (Red -> Yellow -> Green).
  - Size based on number of linked sources or claims.
- **Edges**: Represent `TopicRelationship`.
  - Directional arrows for PREREQ.
- **Interactions**:
  - Hover: Tooltip showing topic stats.
  - Click: Opens a side panel showing details (Claims, Sources, Mastery info).
  - "Analyze Path" button in the side panel triggers Gap Analysis.

### Gap Analysis UI
- Visual indicator (e.g., highlighting a specific path in the graph).
- Text summary: "To master 'Distributed Consensus', you need to review 'Leader Election' (Confidence: 10%) first."

---

## 7. File Changes

| File | Type | What Changes |
|---|---|---|
| `graph/models.py` | **NEW** | `Claim`, `TopicRelationship` |
| `graph/serializers.py` | **NEW** | Serializers for graph nodes/links and claims |
| `graph/views.py` | **NEW** | Endpoints for network data and gap analysis |
| `graph/urls.py` | **NEW** | API routing |
| `graph/services.py` | **NEW** | Graph algorithms and LLM compilation logic |
| `rag/tasks.py` | **MODIFY** | Hook Knowledge Compiler step into Celery pipeline |
| `config/settings.py` | **MODIFY** | Add `graph` to `INSTALLED_APPS` |
| `frontend/src/api/graph.js` | **NEW** | Axios calls for graph endpoints |
| `frontend/src/pages/KnowledgeGraph.jsx`| **NEW** | Main graph visualization page |
| `frontend/src/App.jsx` & `Layout.jsx` | **MODIFY**| Add route and sidebar icon for Graph |

---

## 8. Verification Plan

1. **Automated Tests**: Test graph traversal logic (no cycles, handles missing nodes gracefully).
2. **LLM Extraction**: Upload a technical PDF, verify claims and relationships are generated logically.
3. **UI Rendering**: Ensure `react-force-graph` performs smoothly with >50 nodes. Verify node colors accurately reflect DB mastery states.
4. **Gap Analysis**: Set a prerequisite topic's mastery to 0%, run analysis on the target topic, verify the prerequisite is flagged as a gap.