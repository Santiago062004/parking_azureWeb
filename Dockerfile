# ==================== ETAPA 1: DEPENDENCIAS ====================
FROM node:20-slim AS deps

# Instalar dependencias necesarias para Prisma
RUN apt-get update && apt-get install -y \
    libc6-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar archivos de gestión de paquetes
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# ==================== ETAPA 2: CONSTRUCCIÓN ====================
FROM node:20-slim AS builder

WORKDIR /app

# Instalar dependencias necesarias para Prisma en el builder
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copiar dependencias de la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Configurar variables de entorno para el build
ARG DATABASE_URL
ARG DIRECT_URL
ARG TOMTOM_API_KEY
ARG NEXT_PUBLIC_APP_URL

ENV DATABASE_URL=${DATABASE_URL}
ENV DIRECT_URL=${DIRECT_URL}
ENV TOMTOM_API_KEY=${TOMTOM_API_KEY}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Generar cliente Prisma
RUN npx prisma generate

# Construir la aplicación Next.js
RUN npm run build

# ==================== ETAPA 3: EJECUCIÓN ====================
FROM node:20-slim AS runner

WORKDIR /app

# Instalar dependencias necesarias para runtime
RUN apt-get update && apt-get install -y \
    postgresql-client \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no root para seguridad
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copiar cliente Prisma generado
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Configurar permisos
RUN chown -R nextjs:nodejs /app

USER nextjs

# Configurar variables de entorno para runtime
ARG DATABASE_URL
ARG DIRECT_URL
ARG TOMTOM_API_KEY
ARG NEXT_PUBLIC_APP_URL
ARG PORT

ENV DATABASE_URL=${DATABASE_URL}
ENV DIRECT_URL=${DIRECT_URL}
ENV TOMTOM_API_KEY=${TOMTOM_API_KEY}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV PORT=${PORT:-3000}
ENV NODE_ENV=production

# Exponer puerto
EXPOSE 3000

# Script de inicio
CMD ["node", "server.js"]
