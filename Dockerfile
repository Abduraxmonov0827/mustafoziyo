# Telegram bron boti — Docker da ishga tushirish (Oracle Free Tier, VPS va h.k.)
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY telegram_booking_bot.js ./

ENV NODE_ENV=production
CMD ["node", "telegram_booking_bot.js"]
