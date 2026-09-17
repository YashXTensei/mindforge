MindForge — Final Implementation Plan
Updated: 16 Sep 2026 — Reviewer feedback incorporated

Execution Sequence

┌─────────────────────────────┐
│ Phase 5 Closure (3 items)   │ ← ~3-4 days
├─────────────────────────────┤
│ 1. Review bug fix           │
│ 2. Gemini SDK migration     │
│ 3. Blind-spot visualization │
├─────────────────────────────┤
│ + CI Pipeline Setup         │ ← ~1 day
└─────────────────────────────┘
         ↓
    PHASE 5 CLOSED ✅
         ↓
┌─────────────────────────────┐
│ Phase 6.1 — Contradictions  │ ← ~1 week
│ Phase 6.2 — Synthesis       │ ← ~1 week
│ Phase 6.3 — Analytics       │ ← ~1 week
│ Phase 6.4 — Intel Report    │ ← ~3-4 days
│ Polish + Testing            │ ← ~3-4 days
└─────────────────────────────┘
         ↓
    PHASE 6 CLOSED ✅
         ↓
    Phase 7 — Study Planner
Already Done (From Review's 6 Items)
These were fixed in previous sessions — no action needed:

AI Chat "No chats" loading state ✅ Done
Notes duplicate category error message ✅ Done
Notes topic-extraction checkbox + Process with AI ✅ Done (with auto-trigger, signal fixes, polling)
Phase 5 Closure — 3 Remaining Items
Item 1: Daily Review Intermittent Bug 🔴
Bug: "Start review aaj ka ho chuka tha 10 questions usne show kiye, 6 baki the jab start review pe click karo to vo completed dikhata ha aur wahi pichla score dikha raha ha. Kabhi kabhi ye dikkat ati ha"

Investigation Plan:

Read 
learning/views.py
 — start_review / DailyReviewSession logic
Read 
DailyReview.jsx
 — Frontend session state
Check if ReviewSession query filters by date=today properly (timezone issue?)
Check if completed session detection has a race condition
Likely Root Cause: Timezone mismatch — server UTC vs user IST. If today is calculated in UTC but the user's "today" is IST, a session from yesterday (UTC) might show as today's completed session.

Estimated Time: ~3-4 hours (investigation + fix)

Item 2: Gemini SDK Migration 🟠
Current: google.generativeai (deprecated, shows FutureWarning) Target: google.genai (new official SDK)

Files to Migrate:

File	Gemini Usage
rag/chat.py
Chat response generation
learning/generation.py
Topic extraction + review question generation
graph/services.py
Knowledge compilation (claims + relationships)
Migration Steps:

pip install google-genai + pip uninstall google-generativeai
Update imports: import google.generativeai as genai → from google import genai
Update client init: genai.configure(api_key=...) → client = genai.Client(api_key=...)
Update model calls: genai.GenerativeModel(...) → client.models.generate_content(...)
Update streaming: check if streaming API changed
Update response_mime_type / generation_config syntax
Update requirements.txt
Test all 3 files
Estimated Time: ~4-5 hours

Item 3: Blind Spot Visualization 🟠
What: Isolated nodes (topics with zero connections — no incoming or outgoing edges) should be visually highlighted in the knowledge graph.

Implementation:

In 
KnowledgeGraph.jsx
, in the node rendering callback:
Check if a node has any links (either as source or target)
If zero links → render with a dashed border / pulsing animation / special icon
Add a "Blind Spots" counter in the graph stats header
In 
services.py
 get_graph_data():
Add is_isolated: true/false flag to each node
Count isolated nodes and return as blind_spot_count
Estimated Time: ~1-2 hours

CI Pipeline Setup
Minimum viable CI (GitHub Actions):

yaml

# .github/workflows/ci.yml
name: MindForge CI
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_DB: mindforge_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r requirements.txt
      - run: python manage.py test --parallel
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/mindforge_test
          GEMINI_API_KEY: test
          COHERE_API_KEY: test
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci && npm run build
Estimated Time: ~2-3 hours (setup + debug + first green run)

Phase 6 — Knowledge Intelligence
IMPORTANT

Principle: Each sub-phase ships independently. No feature creep. Each component is a "production-ready mini-system."

Phase 6.1 — Contradiction Detection (~1 week)
What it does: When new content is processed, compare its claims against existing claims. Surface conflicts like "Document A says X is always true, Document B says X is not necessarily true."

Backend
[NEW] intelligence/models.py
python

class Contradiction(models.Model):
    user = ForeignKey(User)
    claim_a = ForeignKey(Claim, related_name='contradictions_as_a')
    claim_b = ForeignKey(Claim, related_name='contradictions_as_b')
    similarity_score = FloatField()  # Cosine similarity between claim embeddings
    ai_analysis = TextField()        # Gemini's explanation of the contradiction
    status = CharField(choices=['new', 'reviewed', 'dismissed'])
    created_at = DateTimeField(auto_now_add=True)
[NEW] intelligence/services.py
detect_contradictions(user, new_claims) — called after compile_knowledge() in pipeline
Get embeddings for new claims (using Cohere, same as chunks)
Compare against ALL existing claim embeddings (cosine similarity)
If similarity > 0.75 but claims have different/opposing content → candidate
Send candidates to Gemini: "Are these claims contradictory? Explain."
Save confirmed contradictions
[MODIFY] rag/tasks.py
Add Step 7 after knowledge compilation: detect_contradictions(user, new_claims)
[NEW] intelligence/views.py
GET /api/intelligence/contradictions/ — list user's contradictions
PATCH /api/intelligence/contradictions/<id>/ — mark as reviewed/dismissed
Frontend
[NEW] pages/Intelligence.jsx (or section on Dashboard)
List of contradiction alerts with:
Claim A text + source document
Claim B text + source document
AI analysis explaining the conflict
"Dismiss" / "Mark Reviewed" actions
Phase 6.2 — Cross-Document Synthesis (~1 week)
What it does: Discover connections across documents the user never saw. "The Observer Pattern from your Design Patterns PDF uses the same principle as React's useEffect — both subscribe to state changes."

Backend
[NEW] intelligence/models.py (add to existing)
python

class InsightCard(models.Model):
    user = ForeignKey(User)
    insight_text = TextField()
    connecting_topics = ManyToManyField(TopicMastery)
    source_documents = JSONField()  # [{"type": "document", "id": 5, "title": "..."}, ...]
    created_at = DateTimeField(auto_now_add=True)
[NEW] intelligence/services.py (add)
generate_insights(user) — On-demand (button click)
Find topic pairs that appear in different documents
Fetch claims from both documents for those topics
Send to Gemini: "Find meaningful connections between these concepts from different sources"
Save as InsightCards
[NEW] intelligence/views.py (add)
GET /api/intelligence/insights/ — list insight cards
POST /api/intelligence/insights/generate/ — trigger on-demand generation
Frontend
Insight Cards carousel on Dashboard or Intelligence page
"Generate New Insights" button
Phase 6.3 — Learning Analytics (~1 week)
What it does: Visualize learning patterns — velocity, forgetting curves, strength rankings.

Backend
[NEW] intelligence/views.py (add)
GET /api/intelligence/analytics/ — Returns aggregated data:
Topics mastered per week (from TopicMastery.created_at + confidence_level > 0.7)
Forgetting curve data (from ReviewSession history — confidence over time per topic)
Strength/weakness rankings (sorted by confidence_level)
Knowledge coverage (mastered vs just stored — topics with reviews vs without)
Study patterns (reviews per day-of-week, time-of-day from ReviewSession.completed_at)
Frontend
[NEW] pages/Analytics.jsx
Using Recharts (already available or easy to add):

Learning Velocity — Line chart (topics mastered per week over last 8 weeks)
Strength/Weakness — Horizontal bar chart (top 10 strong + bottom 10 weak topics)
Knowledge Coverage — Donut chart (mastered / learning / unreviewed)
Study Patterns — Heatmap (day-of-week × time-of-day)
Forgetting Curves — Multi-line chart for selected topics (confidence over time)
Phase 6.4 — Intelligence Report (~3-4 days)
What it does: Generate a summary report of learning intelligence.

IMPORTANT

Phase 1: On-demand button — "Generate Intelligence Report" Phase 2 (later): Celery Beat — Automatic weekly generation

Backend
[NEW] intelligence/models.py (add)
python

class IntelligenceReport(models.Model):
    user = ForeignKey(User)
    report_data = JSONField()  # Structured report sections
    generated_at = DateTimeField(auto_now_add=True)
[NEW] intelligence/services.py (add)
generate_report(user):
Gather: new contradictions this week, new insights, decaying topics, learning velocity
Send to Gemini: "Summarize this learning data into an actionable report"
Save report
[NEW] intelligence/views.py (add)
POST /api/intelligence/reports/generate/ — Generate report on-demand
GET /api/intelligence/reports/ — List past reports
GET /api/intelligence/reports/latest/ — Get latest report
Frontend
"Generate Report" button on Analytics or Intelligence page
Report display with sections: New Contradictions, New Insights, Decaying Topics, Suggested Focus Areas, Velocity Trend
New Django App Structure

intelligence/
├── __init__.py
├── apps.py
├── models.py       # Contradiction, InsightCard, IntelligenceReport
├── services.py     # detect_contradictions, generate_insights, generate_report
├── views.py        # All API endpoints
├── serializers.py  # DRF serializers
├── urls.py         # URL patterns
├── admin.py        # Admin registration
└── migrations/
New Frontend Structure

frontend/src/
├── pages/
│   ├── Analytics.jsx        # Learning analytics charts
│   └── Intelligence.jsx     # Contradictions + Insights + Reports
├── api/
│   └── intelligence.js      # API calls
Verification Plan
After Phase 5 Closure
 Daily Review bug cannot be reproduced
 python -c "from google import genai" works (SDK migrated)
 Knowledge Graph shows isolated nodes with visual indicator
 CI pipeline runs green on push
After Each Phase 6 Sub-Phase
 6.1: Upload a document that contradicts existing content → Contradiction alert appears
 6.2: Click "Generate Insights" → Meaningful cross-document connections appear
 6.3: Analytics page renders charts with real data
 6.4: Click "Generate Report" → Readable intelligence report appears