# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Копируем package files
COPY package.json yarn.lock ./

# Устанавливаем зависимости через yarn
RUN yarn install --frozen-lockfile --ignore-scripts

# Stage 2: Builder
FROM node:20-alpine AS builder
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
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Создаём пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем все что нужно для запуска (сразу с правильным владельцем)
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Запуск приложения через npm start
CMD ["npm", "start"]
