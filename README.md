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

## Netlify: sahifa va veb bron bildirishnomalari

Landing **Netlify** da turganida «Bron qilish» bosilganda forma Telegramga (`booking-notify` serverless funktsiyasi orqali) xabar yuboradi — **shu bot token** va **shu admin chat ID** lar ishlatiladi.

1. Saytni Netlify ga ulang ([`netlify.toml`](netlify.toml) loyiha ildizida).
2. **Site settings → Environment variables** ga qo‘shing:
   - `TELEGRAM_BOT_TOKEN` — BotFather token (Render dagi bilan bir xil bo‘lishi mumkin).
   - `BOOKING_NOTIFY_CHAT_IDS` — bron xabarlarini oladigan chat ID lar (vergul bilan).
3. Redeploy qiling.

Chat ID ni bilish: bot bilan `/start` yozgan odam uchun `@userinfobot` yoki bot kodida `console.log(ctx.chat.id)` (vaqtinchalik).

**Boshqa hosting** (faqat statik fayl): funktsiya ishlamaydi — `fetch` xatolikni yutadi va faqat eski kabi veb-bron sahifasi ochiladi. Funktsiya kerak bo‘lsa Netlify ishlating yoki alohida API yozing.

## Sahifani ochish

Brauzerda `index.html` ni oching yoki loyiha ildizini static hostingda (`publish = "."`) chiqaring.

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
