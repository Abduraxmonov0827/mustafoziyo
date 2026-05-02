/**
 * Bir marta ishga tushiring (mahalliyda .env yoki Netlify CLI bilan env lar bilan).
 *
 * Misollar:
 *   WEBHOOK_URL=https://SIZNING-SAYT.netlify.app/.netlify/functions/telegram-bot npm run set-webhook
 */
import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const webhookUrl = process.env.WEBHOOK_URL?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN kerak.");
  process.exit(1);
}
if (!webhookUrl) {
  console.error(
    "WEBHOOK_URL kerak (masalan https://....netlify.app/.netlify/functions/telegram-bot)",
  );
  process.exit(1);
}

const del = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ drop_pending_updates: false }),
});
if (!del.ok) console.warn("deleteWebhook javobi:", del.status);

const payload = { url: webhookUrl };
if (secret) payload.secret_token = secret;

const res = await fetch(
  `https://api.telegram.org/bot${token}/setWebhook`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  },
);

const data = await res.json().catch(() => ({}));
if (!data.ok) {
  console.error("setWebhook xato:", data);
  process.exit(1);
}

console.log("✓ Webhook qo‘yildi:", webhookUrl);
if (secret) console.log("✓ Secret token Telegram ga berildi.");
console.log(
  "\nEslatma: mahalliy polling bot ishlamasin — webhook bilan bir vaqtda ishlamaydi.",
);
