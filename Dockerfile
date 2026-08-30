# Этап 1: Сборка
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Этап 2: Запуск
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Запускаем продакшн сервер Next.js напрямую, минуя старый init.js
# Сначала запускаем скрипт инициализации таблиц, затем поднимаем сервер Next.js
CMD ["sh", "-c", "node database/init.js && node server.js"]

