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


new plan : 

Phase 5: "The Network Effect" — Final Implementation Plan
Finalized: 31 August 2026

Vision
"MindForge doesn't just store knowledge — it compiles it into a structured, queryable intelligence."

Phase 5 transforms isolated topics into a connected knowledge network. AI extracts claims, evidence, and prerequisite relationships from the user's own documents. The graph is not just a visualization — it's a tool that answers: "What am I missing to understand X?"

Key Design Decisions (Locked In)
Decision	Choice	Reasoning
Graph library	react-force-graph-2d	Lighter, cleaner, mobile-friendly. No 3D needed
Relationship types	PREREQ + RELATED only	Keep it simple. No large ontology yet
Compiler context	Use already-processed chunks, NOT full documents	Saves tokens, uses existing pipeline output
Topic matching	Pass existing TopicMastery IDs + names to Gemini, map back by ID	More reliable than fuzzy name matching
Failure isolation	Compiler failure ≠ pipeline failure	Document processing, embeddings, topic extraction all succeed even if compiler crashes
Recompile existing docs	Yes — idempotent Celery task	So existing users get a populated graph
"Why connected?"	Store relationship_reason on every edge	Makes the graph useful, not just pretty
Proposed Changes
1. New Django App: graph
[NEW] graph/models.py
TopicRelationship — Directed edges in the knowledge graph

python

class TopicRelationship(models.Model):
    class RelationshipType(models.TextChoices):
        PREREQUISITE = 'PREREQ', 'Is Prerequisite For'
        RELATED = 'RELATED', 'Is Related To'
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    source_topic = models.ForeignKey(TopicMastery, on_delete=models.CASCADE, related_name='outgoing_edges')
    target_topic = models.ForeignKey(TopicMastery, on_delete=models.CASCADE, related_name='incoming_edges')
    relationship_type = models.CharField(max_length=20, choices=RelationshipType.choices)
    weight = models.FloatField(default=1.0)  # AI confidence 0.0-1.0
    # "Why are these topics connected?" — makes the graph useful
    relationship_reason = models.TextField(
        blank=True, default='',
        help_text='AI-generated explanation: "B requires A because concept X from A is needed to understand Y in B"'
    )
    class Meta:
        unique_together = ['source_topic', 'target_topic', 'relationship_type']
Claim — Factual statements extracted from user's documents

python

class Claim(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    topic = models.ForeignKey(TopicMastery, on_delete=models.CASCADE, related_name='claims')
    claim_text = models.TextField()          # "React uses virtual DOM for efficient updates"
    evidence_text = models.TextField()       # Direct quote from the source document
    # Source tracking (Document or Note)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    source = GenericForeignKey('content_type', 'object_id')
    created_at = models.DateTimeField(auto_now_add=True)
[NEW] graph/admin.py
Register both models with useful list_display and filters
[NEW] graph/serializers.py
ClaimSerializer — for the claims panel
Graph data serialized directly in views (nodes/links format for D3)
2. Knowledge Compiler (AI Service)
[NEW] graph/services.py
compile_knowledge(user, chunk_texts, topics_with_ids, source_obj)

Key approach: Instead of sending the full document, we send already-processed chunks (from the RAG pipeline) + existing topic IDs and names so Gemini maps relationships back using IDs.

Prompt structure sent to Gemini:


You are analyzing a user's study material. Here are their EXISTING topics with IDs:
[
  {"id": 5, "name": "React Hooks"},
  {"id": 12, "name": "JavaScript Closures"},
  {"id": 8, "name": "Component Lifecycle"}
]
Text chunks from the document:
[chunk 1 text...]
[chunk 2 text...]
Extract:
1. CLAIMS: Factual statements with direct evidence quotes, linked to topic IDs
2. RELATIONSHIPS: Prerequisite/related connections between topic IDs with a reason WHY
Return JSON:
{
  "claims": [
    {"topic_id": 5, "claim": "useEffect runs after every render by default", "evidence": "...quote..."}
  ],
  "relationships": [
    {
      "source_topic_id": 12,
      "target_topic_id": 5,
      "type": "PREREQ",
      "weight": 0.85,
      "reason": "Understanding closures is essential for useEffect because the dependency array relies on closure behavior to capture variable values"
    }
  ]
}
Validation before saving (critical!):

python

def _validate_relationship(source_id, target_id, rel_type, weight, user_topic_ids):
    """Returns True only if the relationship is valid."""
    # 1. No self-relations
    if source_id == target_id:
        return False
    # 2. Both topic IDs must exist in user's topics
    if source_id not in user_topic_ids or target_id not in user_topic_ids:
        return False
    # 3. Minimum confidence threshold
    if weight < 0.5:
        return False
    # 4. No duplicate edges (handled by unique_together, but check first to avoid exceptions)
    if TopicRelationship.objects.filter(
        source_topic_id=source_id, target_topic_id=target_id, relationship_type=rel_type
    ).exists():
        return False
    # 5. No obvious prerequisite cycles (A→B and B→A)
    if rel_type == 'PREREQ' and TopicRelationship.objects.filter(
        source_topic_id=target_id, target_topic_id=source_id, relationship_type='PREREQ'
    ).exists():
        return False
    return True
3. Celery Pipeline Integration
[MODIFY] rag/tasks.py
Add Step 6 to both process_document and process_note — AFTER topic extraction (Step 5):

python

# ── Step 6: Knowledge Compiler (Phase 5) ──
try:
    from graph.services import compile_knowledge
    # Use existing topic IDs (from Step 5) + chunks (from Step 2)
    user_topics = TopicMastery.objects.filter(user=doc.user).values('id', 'topic_name')
    topics_with_ids = [{"id": t['id'], "name": t['topic_name']} for t in user_topics]
    compile_knowledge(doc.user, chunk_texts, topics_with_ids, doc)
    logger.info(f"Document {doc.id}: Knowledge compilation complete")
except Exception as compile_err:
    # ⚡ ISOLATED FAILURE — doc processing still succeeds
    logger.warning(f"Document {doc.id}: Knowledge compilation failed (non-fatal): {compile_err}")
[NEW] graph/tasks.py — Recompile Existing Documents
python

@shared_task
def recompile_all_documents(user_id=None):
    """
    One-time task to compile knowledge from existing documents.
    Idempotent: skips documents that already have claims/relationships.
    Can be triggered from admin or management command.
    """
Loops through all processed Documents and Notes
Checks if claims already exist for that source (idempotent — skip if found)
Calls compile_knowledge() for each
Rate-limited to avoid hitting Gemini quota
4. Graph API Endpoints
[NEW] graph/views.py
Endpoint	Method	Purpose	Response
/api/graph/network/	GET	Full graph data for visualization	{ "nodes": [{id, name, confidence, review_count, claim_count}], "links": [{source, target, type, weight, reason}] }
/api/graph/topics/<id>/claims/	GET	Claims panel for a clicked node	[{claim_text, evidence_text, source_title, source_type}]
/api/graph/analyze-gap/?target=<id>	GET	Gap analysis for a target topic	{ "target": {...}, "weak": [...], "missing": [...], "path": [...] }
[NEW] graph/urls.py
python

urlpatterns = [
    path('network/', GraphNetworkView.as_view()),
    path('topics/<int:topic_id>/claims/', TopicClaimsView.as_view()),
    path('analyze-gap/', GapAnalysisView.as_view()),
]
[MODIFY] config/urls.py
python

path('api/graph/', include('graph.urls')),
[MODIFY] config/settings.py
python

INSTALLED_APPS = [..., 'graph']
5. Gap Analysis Algorithm
Backward BFS through PREREQ edges (pure Python, no extra library):


User asks: "What do I need to master 'Distributed Consensus'?"
Algorithm:
1. Start at "Distributed Consensus" node
2. Follow all incoming PREREQ edges backward
3. For each prerequisite node, check confidence_level:
   - confidence == 0  → "MISSING" (never reviewed)
   - confidence < 0.5 → "WEAK" (needs work)
   - confidence >= 0.5 → "OK" (skip)
4. Recursively check prerequisites of weak/missing nodes
5. Return the full path with status
Result:
{
  "target": {"name": "Distributed Consensus", "confidence": 0},
  "missing": [{"name": "Leader Election", "confidence": 0}],
  "weak": [{"name": "Network Protocols", "confidence": 30}],
  "path": ["Network Protocols", "Leader Election", "Distributed Consensus"]
}
6. Frontend
[NEW] frontend/src/pages/KnowledgeGraph.jsx
Main graph page using react-force-graph-2d:

Nodes = TopicMastery records
Color: Red (<40%) → Yellow (40-70%) → Green (>70%) confidence
Size: Scaled by claim count + source count
Label: Topic name
Edges = TopicRelationship records
Solid directional arrows for PREREQ
Dashed lines for RELATED
Hover shows relationship_reason ("Why are these connected?")
Interactions:
Hover node → Tooltip with: name, confidence%, accuracy%, review count
Click node → Side panel with:
Mastery stats (confidence bar, accuracy, streak)
Claims with evidence quotes and source links
Connected topics (incoming/outgoing)
"Analyze Prerequisites" button → triggers gap analysis
Gap Analysis result → Highlights the path in the graph (red/orange nodes), shows actionable text: "To master 'X', review 'Y' (Confidence: 10%) first"
[NEW] frontend/src/api/graph.js
javascript

export const fetchGraphData = () => API.get('/graph/network/').then(r => r.data);
export const fetchTopicClaims = (topicId) => API.get(`/graph/topics/${topicId}/claims/`).then(r => r.data);
export const analyzeGap = (topicId) => API.get(`/graph/analyze-gap/?target=${topicId}`).then(r => r.data);
[MODIFY] frontend/src/components/Layout.jsx
Add nav item: { path: '/graph', name: 'Knowledge Graph', icon: <Share2 size={20} /> }
[MODIFY] frontend/src/App.jsx
Add route: <Route path="/graph" element={<KnowledgeGraph />} />
Files Summary
File	Type	What
graph/__init__.py	NEW	App init
graph/apps.py	NEW	App config
graph/models.py	NEW	Claim, TopicRelationship (with relationship_reason)
graph/admin.py	NEW	Admin registration
graph/serializers.py	NEW	DRF serializers
graph/services.py	NEW	Knowledge Compiler + validation + fuzzy fallback
graph/views.py	NEW	3 API endpoints
graph/urls.py	NEW	URL routing
graph/tasks.py	NEW	Recompile existing docs task
rag/tasks.py	MODIFY	Add Step 6 (Knowledge Compiler hook)
config/settings.py	MODIFY	Add 'graph' to INSTALLED_APPS
config/urls.py	MODIFY	Add path('api/graph/', ...)
frontend/src/api/graph.js	NEW	Axios API calls
frontend/src/pages/KnowledgeGraph.jsx	NEW	Main graph page
frontend/src/components/Layout.jsx	MODIFY	Add sidebar nav item
frontend/src/App.jsx	MODIFY	Add /graph route
Implementation Order
Step	What	Details
1	Django app + models + migrations	graph app, Claim, TopicRelationship, admin, register in settings
2	graph/services.py — Knowledge Compiler	Gemini prompt with topic IDs, validation logic, save claims + relationships
3	Hook into rag/tasks.py (Step 6)	Isolated try/except after topic extraction
4	graph/views.py + urls.py + serializers	3 endpoints: network, claims, gap analysis
5	Gap analysis algorithm	Backward BFS through PREREQ edges
6	Install react-force-graph-2d	npm install react-force-graph-2d
7	Build KnowledgeGraph.jsx	Graph + side panel + gap analysis UI
8	Route + sidebar nav	/graph route, Layout.jsx nav item
9	Recompile task	graph/tasks.py — idempotent recompile for existing docs
10	End-to-end testing	Upload PDF → verify claims/relationships → verify graph → verify gap analysis
Verification Plan
Automated
Test validation logic (self-relations rejected, cycles rejected, min confidence enforced)
Test gap analysis algorithm with a known graph structure
Test idempotent recompile (running twice doesn't create duplicates)
Manual
Upload a new PDF → Check Django Admin for auto-created Claims and Relationships with reasons
Visit /graph → Verify nodes appear with correct mastery colors
Click a node → Verify side panel shows claims with evidence quotes
Hover an edge → Verify "Why connected?" reason tooltip
Click "Analyze Prerequisites" → Verify path highlighting and actionable recommendation
Run recompile task → Verify existing documents get claims without duplicates