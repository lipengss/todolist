FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN npx prisma generate
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
RUN corepack enable
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && node dist/main"]
