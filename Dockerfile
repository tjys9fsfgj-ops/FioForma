# FioForma — imagem de produção (Next.js 15 + Prisma)
# Build: docker build -t fioforma .
# Run:   docker run -p 3000:3000 --env-file .env.production fioforma

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Dependências (com lockfile)
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Build da aplicação
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# O build não consulta o banco: todas as páginas são renderizadas sob demanda.
# A variável abaixo só satisfaz a validação do schema do Prisma.
ENV DATABASE_URL="mysql://build:build@127.0.0.1:3306/build"
RUN node scripts/prisma.mjs generate && pnpm exec next build

# Runtime
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

# Aplica migrações pendentes antes de subir o servidor.
CMD ["sh", "-c", "node scripts/prisma.mjs migrate deploy && node_modules/.bin/next start -p ${PORT:-3000} -H ${HOSTNAME:-0.0.0.0}"]
