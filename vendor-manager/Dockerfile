# ── Frontend build stage ─────────────────────────────────────────────────
FROM node:20-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json .
RUN npm install
COPY frontend/ .
RUN npm run build

# ── Backend runtime ───────────────────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

COPY package.json .
RUN npm install --omit=dev

COPY src/ ./src/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

EXPOSE 3000

CMD ["node", "src/index.js"]
