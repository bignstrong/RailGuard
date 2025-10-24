# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Копируем package files
COPY package.json yarn.lock ./

# Устанавливаем зависимости через yarn
RUN yarn install --frozen-lockfile

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Копируем зависимости из предыдущего stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Генерируем Prisma Client (БЕЗ миграций)
RUN yarn prisma generate

# Собираем Next.js приложение (БЕЗ миграций)
ENV SKIP_ENV_VALIDATION=1
RUN yarn next build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Создаём пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем только необходимые файлы
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Даём права пользователю nextjs
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Запуск приложения
CMD ["node", "server.js"]
