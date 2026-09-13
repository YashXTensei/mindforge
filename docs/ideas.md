# features that may helpful :

1. celery night worker for improving UX and reducing API rate limit chances

2. API Key/Model fallback system

3. The Professional Way (Direct Upload): Agar tumhe isko permanently fix karna hai, to hume ek architectural change karna padega. "Direct Browser Upload" — jisme React frontend file ko Heroku bhejne ke bajaye, seedha Cloudinary ko upload karega (kyunki Cloudinary me koi 30s timeout nahi hai), aur fir Heroku ko bas us file ka link (URL) bhej dega (Next Priority)

4. Gemini SDK migration (google.generativeai → google.genai) — the old SDK shows FutureWarning

5. CI pipeline

6. test coverage

# bugs to be fixed :

1. Jab ham edit karke Check box check karte ha to jo waha green color me ready time dikhata ha vo uploaded pdf se calculate kar raha ha maybe , it needs to be checked 