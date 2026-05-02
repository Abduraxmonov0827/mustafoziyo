import { Telegraf, session } from "telegraf";
import { Redis } from "@upstash/redis";
import { attachBookingBot } from "../../telegram_bot_logic.mjs";

const SESSION_PREFIX = "tg_sess:";
const SESSION_TTL_SEC = 60 * 60 * 24 * 14;

function createRedisSessionStore() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url?.trim() || !token?.trim()) {
    throw new Error(
      "Netlify bot uchun UPSTASH_REDIS_REST_URL va UPSTASH_REDIS_REST_TOKEN kerak.",
    );
  }
  const redis = new Redis({ url: url.trim(), token: token.trim() });

  return {
    async get(key) {
      const raw = await redis.get(SESSION_PREFIX + key);
      if (raw == null || raw === "") return undefined;
      if (typeof raw === "object")
        return JSON.parse(JSON.stringify(raw));
      try {
        return JSON.parse(String(raw));
      } catch {
        return undefined;
      }
    },
    async set(key, value) {
      await redis.set(SESSION_PREFIX + key, JSON.stringify(value), {
        ex: SESSION_TTL_SEC,
      });
    },
    async delete(key) {
      await redis.del(SESSION_PREFIX + key);
    },
  };
}

let botSingleton;

function getBot() {
  if (botSingleton) return botSingleton;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken?.trim()) {
    throw new Error("TELEGRAM_BOT_TOKEN yo‘q.");
  }
  botSingleton = new Telegraf(botToken.trim());
  attachBookingBot(botSingleton, {
    sessionMiddleware: session({ store: createRedisSessionStore() }),
  });
  return botSingleton;
}

export const handler = async (event) => {
  const headers = {
    "Content-Type": "text/plain",
  };

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (expectedSecret) {
    const got =
      event.headers["x-telegram-bot-api-secret-token"] ??
      event.headers["X-Telegram-Bot-Api-Secret-Token"];
    if (got !== expectedSecret) {
      return { statusCode: 401, headers, body: "Unauthorized" };
    }
  }

  try {
    const bot = getBot();
    const update = JSON.parse(event.body || "{}");
    await bot.handleUpdate(update);
  } catch (e) {
    console.error("telegram-bot function:", e);
    return { statusCode: 500, headers, body: "Internal Error" };
  }

  return { statusCode: 200, headers, body: "" };
};
