# ============================================================
# Stage 1: Build the frontend static files
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Cài đặt toàn bộ dependencies (bao gồm devDependencies)
RUN npm ci

# Copy source code của ứng dụng
COPY . .

# Build React/Vite app sang thư mục /dist
RUN npm run build

# ============================================================
# Stage 2: Run the production Node.js server
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy dependency configs
COPY package*.json ./

# Chỉ cài đặt các packages cần thiết cho runtime (production dependencies)
RUN npm ci --only=production

# Copy thư mục static files đã build từ stage 1
COPY --from=builder /app/dist ./dist

# Copy backend logic (api/) và server script
COPY api/ ./api
COPY server.js ./

# Expose cổng chạy ứng dụng
EXPOSE 3000

# Chạy server Express
CMD ["node", "server.js"]
