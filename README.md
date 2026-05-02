# Al Arda Avenue — landing va Telegram bron boti

Statik mehmonxona sahifasi (`al_arda_avenue_hotel_aos.html`, CSS/JS, uch til) va Node.js (`telegraf`) orqali ishlaydigan bron boti.

## Maxfiy ma’lumotlar

- `.env` repoga **kirmaydi** (`.gitignore`).
- Namuna: `env.example` — nusxa olib `.env` qiling va qiymatlarni to‘ldiring.

## Telegram bot

```bash
npm install
copy env.example .env
```

`.env` ichida `TELEGRAM_BOT_TOKEN` va `BOOKING_NOTIFY_CHAT_IDS` ni o‘rnating, keyin:

```bash
npm start
```

(PowerShell da `copy`; macOS/Linux da `cp env.example .env`.)

## Render ga botni chiqarish

[`render.yaml`](render.yaml) repository ildizida — Background **Worker** sifatida ishga tushadi (sayt bilan birga GitHub ga push qiling).

1. Kodni GitHub ga push qiling.
2. [Render](https://render.com) ga kiring → **New +** → **Blueprint** → repository ni ulang yoki **New +** → **Background Worker**.
3. Agar Worker ni qo‘lda yasasangiz: **Root Directory** bo‘sh qoldiring, **Build Command** `npm install`, **Start Command** `npm start`.
4. **Environment** da o‘zgaruvchilarni qo‘shing (`.env` Renderda ishlamaydi):
   - `TELEGRAM_BOT_TOKEN` — BotFather dan token (majburiy).
   - `BOOKING_NOTIFY_CHAT_IDS` — admin / guruh chat ID lar, vergul bilan (ixtiyoriy); bo‘lmasa bron xabarlari faqat logga yoziladi.
5. **Deploy** — logda `✓ Bot ishlamoqda` chiqishi kerak.

Eslatma: Renderda **Worker** odatda **to‘lov rejasiga** kiradi (tekshiring: [render.com/pricing](https://render.com/pricing)); bepul Web Service uyqu rejimida bot uchun mos emas.

## Sahifani ochish

Brauzerda `al_arda_avenue_hotel_aos.html` ni oching yoki fayllarni har qanday static hostingga (GitHub Pages, Netlify va h.k.) yuklang.

## GitHub ga yuklash

1. [GitHub](https://github.com) da yangi **repository** yarating (masalan `al-arda-hotel`). README / `.gitignore` qo‘shmang — lokalda commit bor.

2. Loyha papkasida remote ulang va push qiling (`USERNAME` va `REPO` ni o‘zgartiring):

```powershell
cd d:\mustafoziyo
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

Agar `remote add` „already exists“ desa: `git remote set-url origin https://github.com/USERNAME/REPO.git`

Birinchi marta HTTPS da **Personal Access Token** yoki SSH kalit so‘raladi.

**GitHub Desktop:** *Add local repository* → `d:\mustafoziyo` → *Publish repository*.

**Yangi klonda** (commit yo‘q bo‘lsa): `git init`, `git add .`, `git commit -m "Initial commit"`, `git branch -M main`, keyin yuqoridagi `remote` va `push`.
