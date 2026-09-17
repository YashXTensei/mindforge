# Feature Ideas & Improvements

## Pending Features

1. Celery night worker for improving UX and reducing API rate limit chances
2. API Key/Model fallback system
3. The Professional Way (Direct Upload): "Direct Browser Upload" — React frontend file ko Heroku bhejne ke bajaye, seedha Cloudinary ko upload karega (Heroku 30s timeout bypass) — **Deferred to post-Phase 6**
4. Change Gemini models version to newer models

## Phase 5 Closure (Next Up)

- [ ] Gemini SDK migration (google.generativeai → google.genai) — 3 files: rag/chat.py, learning/generation.py, graph/services.py
- [ ] Blind spot visualization in Knowledge Graph (isolated nodes highlight)
- [ ] CI pipeline (GitHub Actions: backend tests + frontend build)
- [ ] Daily Review intermittent bug — investigate & fix

## Completed Features

- ~~Re-upload topic refresh~~ ✅
- ~~Duplicate documents not allowed~~ ✅
- ~~import re mid file~~ ✅
- ~~CI pipeline~~ → Planned for Phase 5 closure
- ~~Test coverage~~ → Incremental approach with CI

---

# Bugs

## Open

1. Jab ham edit karke checkbox check karte ha to jo waha green color me ready time dikhata ha vo uploaded pdf se calculate kar raha ha maybe — needs investigation
2. Daily Review intermittent bug: Start review pe click karo to vo completed dikhata ha aur wahi pichla score — kabhi kabhi hota ha (likely timezone mismatch)

## Fixed

- ~~AI chat pe jab chats load hoti ha to "No chats" dikhata ha~~ ✅ (Loading state fix)
- ~~Notes me new category add karne pe unclear error~~ ✅ (Clear error message)
- ~~Notes me topic extraction checkbox~~ ✅ (Dual AI Options: Process + Extract)
- ~~Checkbox for AI read par uska koi fayda nahi~~ ✅ (Signal ordering + extract_topics re-trigger)
- ~~AI Note ko padh nahi pa raha — double processing~~ ✅ (_signal_processing flag)
- ~~Processing loader bina refresh ke green nahi hota~~ ✅ (refetchInterval added to Notes + Dashboard)
- ~~Upload time me -1 minutes show karta tha~~ ✅ (Math.max(0, diff) + "Just now")
- ~~Vault edit checkbox not saving~~ ✅ (Serializer re-trigger for unprocessed docs)
- ~~Notes edit checkbox useless~~ ✅ (NoteSerializer re-trigger + polling fix)