# Multi-stage Docker build for Wedding Jump v2

# ===== Stage 1: Build Frontend =====
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

# Vite 環境變數在構建時注入
ARG VITE_WS_URL=ws://localhost:8001
ARG VITE_API_URL=http://localhost:8002
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# ===== Stage 2: Production =====
FROM node:20-alpine AS production

# Install PM2
RUN npm install pm2 -g

WORKDIR /app

# Copy server files
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

COPY server/ ./server/

# Copy built frontend
COPY --from=frontend-builder /app/client/dist ./client/dist

# Copy docker config
COPY docker/ecosystem.config.cjs ./
COPY docker/static-server.cjs ./

# Create data directory
RUN mkdir -p ./server/data

# Expose ports
# 3000 - Static frontend (serve)
# 3001 - WebSocket server
# 3002 - REST API server
EXPOSE 3000 3001 3002

# Start with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
