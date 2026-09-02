# features that may helpful :

1 : photo recognition in pdfs ✅done

2 : celery night worker for improving UX and reducing API rate limit chances

3 : API Key/Model fallback system

4 : The Professional Way (Direct Upload): Agar tumhe isko permanently fix karna hai, to hume ek architectural change karna padega. "Direct Browser Upload" — jisme React frontend file ko Heroku bhejne ke bajaye, seedha Cloudinary ko upload karega (kyunki Cloudinary me koi 30s timeout nahi hai), aur fir Heroku ko bas us file ka link (URL) bhej dega

# bugs to be fixed :

1 : pdf delete karne se us pdf se related topics delete nahi hote 

2 : aisa hona chahiye ki photos and pdfs jo ham chahiye sirf unse hi topics extract ho bakiyo se na ho , kuch personal use ya bas store ke liye bhi rakhte ha diff than studies 
like any SS , Anime list etc

3 : abhi shayad ham fixed number of topics kar rahe hai from any pdf butagar pdf me bahut sare pages ha aur bahut sare topics ha to ek min and max criteria set karna chahiye topics ke liye aur agar max se jyada topics ha to most relevant topics ane chahiye ya koi msg user ko ki "pdf contains too many topics so we have selected only most relevat topics" something like that

