# features that may helpful :

1. celery night worker for improving UX and reducing API rate limit chances

2. API Key/Model fallback system

3. The Professional Way (Direct Upload): Agar tumhe isko permanently fix karna hai, to hume ek architectural change karna padega. "Direct Browser Upload" — jisme React frontend file ko Heroku bhejne ke bajaye, seedha Cloudinary ko upload karega (kyunki Cloudinary me koi 30s timeout nahi hai), aur fir Heroku ko bas us file ka link (URL) bhej dega (Next Priority)

4. Gemini SDK migration (google.generativeai → google.genai) — the old SDK shows FutureWarning

~~5. Re-upload topic refresh (currently blocks new topic extraction if topics already exist)~~ (DONE)

~~6. duplicate documents not allowed~~ (DONE)

7. CI pipeline

~~8. import re mid file~~ (DONE)

9. test coverage

# bugs to be fixed :

1. Start review aaj ka ho chuka tha 10 questions usne show kiye , 6 baki the jab start review pe click karo to vo completed dikhata ha aur wahi pichla score dikha raha ha (Kabhi kabhi ye dikkat ati ha abhi 1 min baad to thik ho gaya ye aur bache hue 6 questions bhi aa gaye , ek baar isko review karna hoga - needs investigation)

~~2. AI chat pe jab chats load hoti ha to no chats dikhata ha rather than fetching/loading chats~~ (DONE)

~~3. Notes me agar ham new category add karte ha to vo ho nahi rahi agar existing ha , failed ata ha bas , clear msg ana chahiye jisse pta chal jaye user ko~~ (DONE)

~~4. Notes me bhi vo topic extraction checkbox dena chahiye hame~~ (DONE - Added Process AI and Extract Topics options with auto-trigger)

~~5. Abhi checkbox for AI read ha par uska koi fayda nahi ha Note fir bhi AI ko jata hi ha agar uncheck karo to , aur extraction wala checkbox agar edit karne ke baad check kare to uska koi use nahi hota~~ (DONE - Fixed signal ordering + extract_topics re-trigger)

~~6. AI Note ko padh nahi pa raha — double processing bug (signal ke andar update_status recursive post_save fire karta tha)~~ (DONE - Added _signal_processing flag to prevent recursive loops)

~~7. Processing loader bina refresh ke green nahi hota~~ (DONE - Fixed polling + delayed query invalidation after save)

~~8. Upload time me -1 minutes show kar raha tha~~ (DONE - Math.max(0, diff) + "Just now" for < 1 min)

9. Vault me Upload karte time agar checkbox AI wala unchecked ho to edit karne ke baad check karo to kuch nahi hota na processing hoti ma kuch dobara edit pe click karke dekho to unchecked dikhata ha , save nahi ho raha check mark kiya agar edit pe jake to , same problem for topic extraction , upload time pe agar check ho to sab thik ha lekin waise edit pe click karke nahi ho raha ha 

10. Notes me sab shai ha agar uploading ke time ho to , jab edit karte ha to AI wala checkbox useless ha aur extraction wala bhi
simply abhi jo dono features ha vo bekar ha , kaam hi nahi karte , loader abhi bhi khudse green nahi hota Notes me sirf , jaise hi refresh karo green ho jata ha maybe processing complete hue bina green ho jata ha refresh se :<