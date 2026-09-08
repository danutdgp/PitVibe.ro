# PitVibe.ro

Rețea socială locală pentru oamenii din Pitești, construită cu Next.js, TypeScript, Tailwind CSS și Supabase. Domeniul de producție pregătit este `pitvibe.ro`.

## Pornire locală

1. Instalează Node.js 24 LTS și rulează `npm install`.
2. Copiază `.env.example` ca `.env.local` și completează valorile proiectului Supabase.
3. Aplică migrațiile din `supabase/migrations` într-un proiect Supabase de dezvoltare (CLI: `supabase db push`, după conectarea proiectului).
4. În Supabase Authentication activează autentificarea prin e-mail/parolă și confirmarea e-mailului.
5. Adaugă `http://localhost:3000/auth/callback` la Redirect URLs, apoi rulează `npm run dev`.

Nu folosi proiectul sau datele de producție pentru dezvoltare și nu comite `.env.local`. Cheia `SUPABASE_SERVICE_ROLE_KEY` este exclusiv pentru codul executat pe server.

## Configurare Supabase

Migrațiile creează profilurile publice, datele private de vârstă, rolurile, interesele, urmăririle, blocările, postările și interacțiunile, jurnalul de moderare și bucketurile private pentru fotografii. Un trigger creează automat profilul și rolul `user` la înregistrare. Data nașterii este separată de profilul public și validată 13+ atât pe server, cât și în baza de date.

Pentru e-mailurile de autentificare, configurează un furnizor SMTP propriu înainte de lansare și personalizează șabloanele în română. Păstrează limitele anti-abuz Supabase active; CAPTCHA se va configura înainte de publicarea publică.

## Publicare pe Vercel

- Importă repository-ul și setează directorul aplicației la `pitvibe-app` dacă repository-ul păstrează structura actuală.
- Adaugă aceleași variabile de mediu, cu `NEXT_PUBLIC_SITE_URL=https://pitvibe.ro`.
- În Supabase setează Site URL la `https://pitvibe.ro` și adaugă `https://pitvibe.ro/auth/callback` la Redirect URLs.
- Conectează domeniul `pitvibe.ro` în Vercel după configurarea DNS.

## PWA și instalare

Manifestul, pictogramele, modul standalone, service worker-ul și pagina offline sunt configurate fără o dependență externă. Service worker-ul păstrează în cache numai pagina publică offline; nu salvează feedul, profilurile, mesajele sau alte răspunsuri autentificate. Instalarea necesită HTTPS în producție. Instrucțiunile pentru Android, desktop și iPhone sunt disponibile la `/instaleaza`.

## Reclame și consimțământ

AdSense este dezactivat implicit prin `NEXT_PUBLIC_ADSENSE_ENABLED=false`. Nu adăuga un ID demonstrativ. După aprobarea domeniului, configurează identificatorul real în `NEXT_PUBLIC_ADSENSE_CLIENT`, publică fișierul `ads.txt` exact cum este furnizat de Google și activează reclamele numai după integrarea unei CMP certificate de Google pentru SEE/Regatul Unit/Elveția. Mesajele și conversațiile private trebuie să rămână neeligibile pentru reclame.

## Siguranță și copii de rezervă

RLS trebuie să rămână activ pentru toate tabelele. Înainte de lansare, configurează backupurile bazei în funcție de planul Supabase și o procedură separată de export/verificare pentru fișierele Storage. Testează restaurarea într-un proiect separat; un backup neverificat nu este suficient.

## Stadiu

Etapele 1–4 includ fundația vizuală responsive, autentificarea, profilurile, postările, descoperirea, ieșirile, conversațiile prin cereri, notificările, blocările și raportările. PWA-ul instalabil, starea offline și proiectele inițiale pentru paginile juridice sunt implementate. Datele operatorului și textele juridice trebuie completate și verificate înainte de lansare. Promovările sponsorizate și statisticile lor reprezintă următoarea subetapă; AdSense rămâne dezactivat.
