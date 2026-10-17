# =====================================================================
#  MotoDrive · Imagen de la aplicación web (multi-stage)
# =====================================================================

# ---------- Etapa 1: dependencias de producción ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

# ---------- Etapa 2: imagen final mínima ----------
FROM node:20-alpine AS runtime
LABEL org.opencontainers.image.title="motodrive-web" \
      org.opencontainers.image.description="CRUD de inventario de motocicletas" \
      org.opencontainers.image.version="1.0.0"

ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public

# Ejecutar como usuario sin privilegios
USER node

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "src/server.js"]
