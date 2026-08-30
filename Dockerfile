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

# Явно переносим файлы базы данных и конфиги внутрь runner образа
COPY --from=builder /app/database ./database
COPY --from=builder /app/package*.json ./
RUN npm prune --production

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# ПОЛНАЯ АВТОМАТИЗАЦИЯ: Таблицы -> Пользователи -> Старт сайта
# Полный автоматический цикл: Инициализация -> Обновление схемы -> Сидинг -> Старт сайта
CMD ["node", "server.js"]

