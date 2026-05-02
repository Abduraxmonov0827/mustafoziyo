import "dotenv/config";
import { Telegraf, session } from "telegraf";
import { attachBookingBot } from "./telegram_bot_logic.mjs";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN .env faylida yo‘q.");
  process.exit(1);
}

const bot = new Telegraf(token);
attachBookingBot(bot, { sessionMiddleware: session() });

async function main() {
  try {
    const me = await bot.telegram.getMe();
    console.log(
      `✓ Telegram ulanishi OK — bot: @${me.username ?? "?"} (${me.first_name})`,
    );
  } catch (e) {
    console.error(
      "✗ TELEGRAM_BOT_TOKEN noto‘g‘ri yoki Telegram bloklangan:",
      e.message,
    );
    process.exit(1);
  }

  await bot.telegram.deleteWebhook({ drop_pending_updates: false });
  console.log("✓ Webhook o‘chirildi (long polling uchun).");

  await bot.launch();
  console.log("✓ Bot ishlamoqda — /start yuboring.");
}

main().catch((e) => {
  console.error("Ishga tushirishda xatolik:", e);
  process.exit(1);
});
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
