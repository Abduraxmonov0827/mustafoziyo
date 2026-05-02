function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function clamp(str, max) {
  const t = String(str ?? "").trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

function parsePayload(raw) {
  let body;
  try {
    body = JSON.parse(raw || "{}");
  } catch {
    return null;
  }
  if (!body || typeof body !== "object") return null;

  const iso = /^(\d{4}-\d{2}-\d{2})$/;
  const check_in = clamp(body.check_in, 12);
  const check_out = clamp(body.check_out, 12);
  if (check_in && !iso.test(check_in)) return null;
  if (check_out && !iso.test(check_out)) return null;

  const guestsRaw = clamp(body.guests, 8);
  const guests =
    guestsRaw === ""
      ? ""
      : /^\d+$/.test(guestsRaw) && Number(guestsRaw) <= 99
        ? guestsRaw
        : "";

  return {
    check_in,
    check_out,
    guests,
    room_type: clamp(body.room_type, 64),
    room_label: clamp(body.room_label, 160),
    promo: clamp(body.promo, 48),
    source: clamp(body.source, 32) || "website",
  };
}

function formatTelegramMessage(p, referer) {
  let text =
    "🏨 <b>Veb-saytdan bron so‘rovi</b>\n\n" +
    (p.check_in ? `Kirish: <code>${escapeHtml(p.check_in)}</code>\n` : "") +
    (p.check_out ? `Chiqish: <code>${escapeHtml(p.check_out)}</code>\n` : "") +
    (p.guests ? `Mehmonlar: <code>${escapeHtml(p.guests)}</code>\n` : "");

  if (p.room_label || p.room_type) {
    const label = p.room_label || p.room_type;
    text += `Xona: ${escapeHtml(label)}`;
    if (p.room_type && p.room_label && p.room_type !== p.room_label)
      text += ` (<code>${escapeHtml(p.room_type)}</code>)`;
    text += "\n";
  }

  if (p.promo) text += `Promo: <code>${escapeHtml(p.promo)}</code>\n`;

  text += `\nManba: ${escapeHtml(p.source)}`;
  const ref = clamp(referer, 512);
  if (ref) text += `\nReferer: ${escapeHtml(ref)}`;

  return text;
}

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, error: "method_not_allowed" }),
    };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIdsRaw = process.env.BOOKING_NOTIFY_CHAT_IDS ?? "";

  if (!token?.trim()) {
    console.error("booking-notify: TELEGRAM_BOT_TOKEN yo‘q");
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ ok: false, error: "service_not_configured" }),
    };
  }

  const chatParts = chatIdsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!chatParts.length) {
    console.error("booking-notify: BOOKING_NOTIFY_CHAT_IDS bo‘sh");
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ ok: false, error: "no_notify_targets" }),
    };
  }

  const parsed = parsePayload(event.body);
  if (!parsed) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: "invalid_payload" }),
    };
  }

  const referer =
    event.headers?.referer ||
    event.headers?.Referer ||
    event.headers?.["x-forwarded-host"] ||
    "";

  const text = formatTelegramMessage(parsed, referer);

  const failures = [];

  for (const chatId of chatParts) {
    const chatTarget = /^-?\d+$/.test(chatId) ? Number(chatId) : chatId;
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatTarget,
            text,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!data.ok) {
        failures.push({ chatId, description: data.description ?? res.status });
      }
    } catch (e) {
      failures.push({ chatId, description: String(e.message ?? e) });
    }
  }

  if (failures.length === chatParts.length) {
    console.error("booking-notify: barcha chatlarga yuborilmadi", failures);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ ok: false, error: "telegram_failed", failures }),
    };
  }

  if (failures.length)
    console.warn("booking-notify: qisman muvaffaqiyatli", failures);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ok: true }),
  };
};
