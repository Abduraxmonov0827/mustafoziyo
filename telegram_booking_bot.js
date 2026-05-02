import "dotenv/config";
import { Telegraf, session, Markup } from "telegraf";

const BOOKING_URL = "https://alardaavenue.uz/en-gb/booking/";
const CALL_PHONE = "+998917714455";

function notifyChatIds() {
  const raw = process.env.BOOKING_NOTIFY_CHAT_IDS ?? "";
  const ids = [];
  for (const part of raw.split(",")) {
    const s = part.trim();
    if (!s) continue;
    const n = Number(s);
    if (!Number.isFinite(n)) console.warn("Noto‘g‘ri chat ID:", s);
    else ids.push(n);
  }
  return ids;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function todayLocalDate() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDate(text) {
  const t = text.trim();
  let y;
  let mo;
  let da;

  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (m) {
    y = +m[1];
    mo = +m[2] - 1;
    da = +m[3];
  } else {
    m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(t);
    if (m) {
      da = +m[1];
      mo = +m[2] - 1;
      y = +m[3];
    } else {
      m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
      if (m) {
        da = +m[1];
        mo = +m[2] - 1;
        y = +m[3];
      } else {
        return null;
      }
    }
  }

  const d = new Date(y, mo, da);
  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== da)
    return null;
  return d;
}

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, "");
  return digits || raw.trim();
}

function getBooking(ctx) {
  ctx.session ??= {};
  return ctx.session;
}

function bookingDraft(ctx) {
  const s = getBooking(ctx);
  s.booking ??= {};
  return s.booking;
}

function clearBooking(ctx) {
  const s = getBooking(ctx);
  delete s.booking;
}

const startKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback("📝 Bron boshlash", "book_start")],
]);

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN .env faylida yo‘q.");
  process.exit(1);
}

const bot = new Telegraf(token);

bot.use(session());

bot.command("start", async (ctx) => {
  const text =
    "🏨 <b>Al Arda Avenue Hotel</b>, Toshkent.\n\n" +
    "Bron uchun oddiy savollarga javob berasiz — " +
    "so‘rovingiz xodijlarimizga yuboriladi.\n\n" +
    `Yoki veb-sayt: ${BOOKING_URL}\n` +
    `Tel: <code>${CALL_PHONE}</code>`;
  await ctx.reply(text, { parse_mode: "HTML", ...startKeyboard });
});

bot.command("book", async (ctx) => {
  await ctx.reply("Bron uchun tugmani bosing.", {
    parse_mode: "HTML",
    ...startKeyboard,
  });
});

bot.command("cancel", async (ctx) => {
  clearBooking(ctx);
  await ctx.reply("Bron bekor qilindi.", Markup.removeKeyboard());
});

bot.action("book_start", async (ctx) => {
  await ctx.answerCbQuery();
  bookingDraft(ctx).step = "checkin";
  await ctx.editMessageReplyMarkup(undefined);
  await ctx.reply(
    "📅 <b>Kirish sanasi</b>\n" +
      "Format: <code>YYYY-MM-DD</code> yoki <code>DD.MM.YYYY</code>\n" +
      "Masalan: <code>2026-06-15</code>",
    { parse_mode: "HTML", ...Markup.removeKeyboard() },
  );
});

async function replyBookingPreview(ctx) {
  const b = bookingDraft(ctx);
  const notes = b.notes ?? "";
  let summary =
    "📋 <b>Broningiz</b>\n\n" +
    `Kirish: <code>${b.checkin}</code>\n` +
    `Chiqish: <code>${b.checkout}</code>\n` +
    `Mehmonlar: <code>${b.guests}</code>\n` +
    `Ism: ${escapeHtml(b.full_name ?? "")}\n` +
    `Tel: <code>${escapeHtml(b.phone ?? "")}</code>\n`;
  if (notes) summary += `Izoh: ${escapeHtml(notes)}\n`;
  summary += "\nYuborilsinmi?";

  await ctx.reply(summary, {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback("✅ Ha, yuborish", "confirm_yes"),
        Markup.button.callback("❌ Bekor", "confirm_no"),
      ],
    ]),
  });
  b.step = "preview";
}

bot.command("skip", async (ctx, next) => {
  const b = bookingDraft(ctx);
  if (b.step !== "notes") return next();
  b.notes = "";
  await replyBookingPreview(ctx);
});

bot.action(/^confirm_(yes|no)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const data = ctx.match[0];
  const b = bookingDraft(ctx);

  if (data === "confirm_no") {
    await ctx.editMessageText("Bron bekor qilindi.");
    clearBooking(ctx);
    return;
  }

  const need = ["checkin", "checkout", "guests", "full_name", "phone"];
  if (!need.every((k) => b[k] != null && b[k] !== "")) {
    await ctx.editMessageText(
      "Ma'lumotlar topilmadi. /start bilan qaytadan boshlang.",
    );
    clearBooking(ctx);
    return;
  }

  const user = ctx.from;
  const username = user?.username ? `@${user.username}` : "—";
  const uid = user?.id ?? "—";

  let adminMessage =
    "🏨 <b>Yangi bron so‘rovi</b>\n\n" +
    `Kirish: <code>${b.checkin}</code>\n` +
    `Chiqish: <code>${b.checkout}</code>\n` +
    `Mehmonlar: <code>${b.guests}</code>\n` +
    `Ism: ${escapeHtml(b.full_name ?? "")}\n` +
    `Tel: <code>${escapeHtml(b.phone ?? "")}</code>\n`;
  if (b.notes) adminMessage += `Izoh: ${escapeHtml(b.notes)}\n`;
  adminMessage += `\nTelegram: ${escapeHtml(username)}\nUser ID: <code>${uid}</code>`;

  const chats = notifyChatIds();
  if (chats.length) {
    for (const chatId of chats) {
      try {
        await ctx.telegram.sendMessage(chatId, adminMessage, {
          parse_mode: "HTML",
        });
      } catch (e) {
        console.error("Admin ga yuborishda xatolik chat_id=", chatId, e);
      }
    }
  } else {
    console.warn("BOOKING_NOTIFY_CHAT_IDS sozlanmagan — faqat mijozga javob.");
  }

  await ctx.editMessageText(
    "✅ So‘rovingiz qabul qilindi. Tez orada siz bilan bog‘lanamiz.\n\n" +
      `Veb-bron: ${BOOKING_URL}\nTel: ${CALL_PHONE}`,
  );
  clearBooking(ctx);
});

bot.on("contact", async (ctx, next) => {
  const b = bookingDraft(ctx);
  if (b.step !== "phone") return next();

  const phone = ctx.message.contact.phone_number ?? "";
  if (phone.length < 8) {
    await ctx.reply("Telefon raqami juda qisqa. Qaytadan kiriting.");
    return;
  }
  b.phone = phone;
  b.step = "notes";
  await ctx.reply(
    "Qo‘shimcha izoh yoki xona turidagi tilaklar (ixtiyoriy).\nO‘tkazib yuborish uchun: /skip",
    Markup.removeKeyboard(),
  );
});

bot.on("text", async (ctx, next) => {
  const text = ctx.message.text ?? "";
  if (text.startsWith("/")) return next();

  const b = bookingDraft(ctx);
  const step = b.step;

  if (!step || step === "preview") return next();

  if (step === "checkin") {
    const d = parseDate(text);
    const today = todayLocalDate();
    if (!d) {
      await ctx.reply(
        "Sanani tushunmadim. Qaytadan kiriting (masalan 2026-06-15).",
      );
      return;
    }
    if (d.getTime() < today.getTime()) {
      await ctx.reply("Kirish sanasi bugundan oldin bo‘lishi mumkin emas.");
      return;
    }
    b.checkin = toISODate(d);
    await ctx.reply(
      "📅 <b>Chiqish sanasi</b>\n" + `Kirish: <code>${b.checkin}</code>`,
      { parse_mode: "HTML" },
    );
    b.step = "checkout";
    return;
  }

  if (step === "checkout") {
    const d = parseDate(text);
    const ci = parseDate(b.checkin ?? "");
    if (!d || !ci) {
      await ctx.reply("Sanani tushunmadim. Qaytadan kiriting.");
      return;
    }
    if (d.getTime() <= ci.getTime()) {
      await ctx.reply("Chiqish sanasi kirishdan keyin bo‘lishi kerak.");
      return;
    }
    b.checkout = toISODate(d);
    await ctx.reply("Mehmonlar soni? (raqam, masalan 2)");
    b.step = "guests";
    return;
  }

  if (step === "guests") {
    const t = text.trim();
    if (!/^\d+$/.test(t)) {
      await ctx.reply("Faqat butun son kiriting (masalan 2).");
      return;
    }
    const n = Number(t);
    if (n < 1 || n > 20) {
      await ctx.reply("1 dan 20 gacha son kiriting.");
      return;
    }
    b.guests = n;
    await ctx.reply("Ism va familiyangiz (to‘liq):");
    b.step = "full_name";
    return;
  }

  if (step === "full_name") {
    const name = text.trim();
    if (name.length < 3) {
      await ctx.reply("Iltimos, ismni biroz batafsilroq yozing.");
      return;
    }
    b.full_name = name;
    b.step = "phone";
    await ctx.reply(
      "Telefon raqamingizni yozing yoki tugma orqali kontakt yuboring:",
      Markup.keyboard([[Markup.button.contactRequest("📱 Kontakt ulashish")]])
        .oneTime()
        .resize(),
    );
    return;
  }

  if (step === "phone") {
    const phone = normalizePhone(text);
    if (phone.length < 8) {
      await ctx.reply("Telefon raqami juda qisqa. Qaytadan kiriting.");
      return;
    }
    b.phone = phone;
    b.step = "notes";
    await ctx.reply(
      "Qo‘shimcha izoh yoki xona turidagi tilaklar (ixtiyoriy).\nO‘tkazib yuborish uchun: /skip",
      Markup.removeKeyboard(),
    );
    return;
  }

  if (step === "notes") {
    b.notes = text.trim();
    await replyBookingPreview(ctx);
    return;
  }

  return next();
});

bot.catch((err, ctx) => {
  console.error("Bot xatolik:", err);
  void ctx.reply("Vaqtinchalik xatolik. Keyinroq qayta urinib ko‘ring.");
});

async function main() {
  try {
    const me = await bot.telegram.getMe();
    console.log(
      `✓ Telegram ulanishi OK — bot: @${me.username ?? "?"} (${me.first_name})`,
    );
  } catch (e) {
    console.error("✗ TELEGRAM_BOT_TOKEN noto‘g‘ri yoki Telegram bloklangan:", e.message);
    process.exit(1);
  }

  // Webhook qoldiq bo‘lsa, polling yangilanishlarni olmaydi — har safar tozalaymiz
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
