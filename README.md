# Al Arda Avenue — landing va Telegram bron boti

Statik mehmonxona sahifasi (`index.html`, CSS/JS, uch til) va Node.js (`telegraf`) orqali ishlaydigan bron boti.

## Bepul rejim (tavsiya etiladi)

| Qism | Bepul bo‘lishi | Izoh |
|------|----------------|------|
| Landing sahifa | Ha | Netlify / GitHub Pages / boshqa statik hosting |
| Veb forma → Telegram xabar | Ha | Netlify **Functions** (`booking-notify`) + token / chat ID |
| **Suhbatli** bot (`/start`, bosqichma-bosqich bron) | Netlify **webhook** + [Upstash Redis](https://upstash.com) (bepul kvota) yoki uy PC / VPS | Serverlessda sessiya uchun Redis kerak — quyida |

**Botni $0 bilan ishga tushirish:**

1. **O‘z kompyuteringiz / uy serveringiz** — `npm start`; mashina yoqiq va internetda turishi kerak (eng sodda).
2. **Oracle Cloud Always Free** (VM) — doimiy bepul kapasitet; ichida Docker yoki to‘g‘ridan-to‘g‘ri Node: [Oracle Free Tier](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic.htm).
3. **Har qanday VPS** da Docker: [`Dockerfile`](Dockerfile) bilan image yarating, `-e TELEGRAM_BOT_TOKEN=... -e BOOKING_NOTIFY_CHAT_IDS=...` bering.

```bash
docker build -t al-arda-bot .
docker run --restart unless-stopped \
  -e TELEGRAM_BOT_TOKEN="BOT_TOKENINGIZ" \
  -e BOOKING_NOTIFY_CHAT_IDS="CHAT_ID1,CHAT_ID2" \
  al-arda-bot
```

Agar faqat **saytdan kelgan bronlar** Telegramga yetarli bo‘lsa, botni umuman bulutda ishlatmasangiz ham bo‘ladi — Netlify `booking-notify` xabarni yuboradi.

## Maxfiy ma’lumotlar

- `.env` repoga **kirmaydi** (`.gitignore`).
- Namuna: `env.example` — nusxa olib `.env` qiling va qiymatlarni to‘ldiring.

## Telegram bot — ikki rejim

**A) Mahalliy / VPS / Docker** — **long polling** (`npm start`). Redis kerak emas.

```bash
npm install
copy env.example .env
npm start
```

**B) Netlify** — **webhook** (`/.netlify/functions/telegram-bot`). **Polling bilan bir vaqtda ishlamaydi**: webhook yoqilgan bo‘lsa `npm start` ni to‘xtating.

Redis va webhook bo‘yicha qadamlar pastda „Netlify“ bo‘limida.

(PowerShell: `copy env.example .env`; Unix: `cp env.example .env`.)

## Render (ixtiyoriy, ko‘pincha pullik)

[`render.yaml`](render.yaml) — Background **Worker**. Ko‘pchilik akkauntlarda **karta qo‘shish** talab qilinadi; Worker bepul deb kafolatlanmaydi ([narxlar](https://render.com/pricing)).

1. Kodni GitHub ga push qiling.
2. [Render](https://render.com) → **New +** → **Blueprint** yoki **Background Worker**.
3. **Build:** `npm install` · **Start:** `npm start`
4. **Environment:** `TELEGRAM_BOT_TOKEN`, `BOOKING_NOTIFY_CHAT_IDS`
5. Logda `✓ Bot ishlamoqda`.

**Bepul Web Service** uyqu rejimida uzilib qoladi — polling bot uchun mos emas.

## Netlify: sahifa, veb bron va suhbatli bot

Saytni GitHub dan Netlify ga ulang ([`netlify.toml`](netlify.toml)).

### Environment variables (Netlify Dashboard)

| O‘zgaruvchi | Kerakmi | Izoh |
|-------------|---------|------|
| `TELEGRAM_BOT_TOKEN` | Ha | BotFather token |
| `BOOKING_NOTIFY_CHAT_IDS` | Tavsiya | Admin chat ID lar (`booking-notify` va bot tasdiqlashi uchun) |
| `UPSTASH_REDIS_REST_URL` | Bot uchun ha | [Upstash](https://upstash.com) dan Redis yarating → REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Bot uchun ha | Upstash REST token |
| `TELEGRAM_WEBHOOK_SECRET` | Tavsiya | Tasodifiy uzun qator (`openssl rand -hex 32`). Webhook firibgarligidan himoya |

Redeploy qiling har safar env o‘zgarganda.

### 1) Veb forma → Telegram (`booking-notify`)

«Bron qilish» tugmasi forma ma’lumotlarini Telegramga yuboradi — yuqoridagi `TELEGRAM_BOT_TOKEN` va `BOOKING_NOTIFY_CHAT_IDS` ishlatiladi.

### 2) Suhbatli bot (`telegram-bot` funktsiyasi)

Netlify serverlessda sessiya **Redis** da saqlanadi (oddiy RAM bilan ishlamaydi).

**Webhook ni bir marta qo‘ying** (mahalliyda `.env` yoki vaqtinchalik env bilan):

```bash
WEBHOOK_URL=https://SIZNING-SAYT.netlify.app/.netlify/functions/telegram-bot npm run set-webhook
```

`TELEGRAM_WEBHOOK_SECRET` `.env` da bo‘lsa, Telegram ham xuddi shu maxfiy kalit bilan chaqiriladi.

**Tekshirish:** `@BotFather` → `/setWebhook` emas — brauzerda `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`

### Mahalliy ishlab chiqish

```bash
npx netlify dev
```

Webhook URL production Netlify domeniga qarashi kerak — Telegram Internetdan chaqira oladigan HTTPS manzil.

**Boshqa hosting** (faqat statik HTML): Netlify funktsiyalari ishlamaydi; forma `fetch` xatosini yutadi va faqat tashqi bron sahifasi ochiladi.

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
