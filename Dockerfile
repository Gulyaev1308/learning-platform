# Этап 1: Установка всех зависимостей и сборка
FROM node:20-alpine AS builder
WORKDIR /app

# Нам понадобятся инструменты сборки для некоторых npm пакетов
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Этап 2: Запуск приложения в минимальном образе
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Копируем только то, что необходимо для работы standalone-режима
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/database ./database

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Если у тебя в папке database/init.js написана инициализация таблиц Postgres, 
# мы можем запустить её прямо перед стартом сервера
CMD ["sh", "-c", "node database/init.js && node server.js"]