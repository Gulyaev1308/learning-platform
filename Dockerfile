# Этап 1: Сборка приложения
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Этап 2: Запуск приложения
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Копируем настройки standalone-сборки Next.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# СТАНДАРТ ДЛЯ МИГРАЦИЙ: Явно копируем файлы базы данных и зависимости внутрь финального контейнера
COPY --from=builder /app/database ./database
COPY --from=builder /app/package*.json ./
RUN npm prune --production

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# АВТОМАТИЗАЦИЯ: Сначала запускаем инициализацию таблиц, затем сервер сайта
CMD ["sh", "-c", "node database/init.js && node server.js"]
