```dockerfile
# docker/backend.Dockerfile

# Giai đoạn 1: Cài đặt dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production

# Giai đoạn 2: Build code TypeScript
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Giai đoạn 3: Chạy ứng dụng production
FROM node:18-alpine AS runner
WORKDIR /app
# Sao chép các dependencies đã cài đặt và mã nguồn đã build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# (Tùy chọn) Sao chép file .env nếu bạn quản lý secrets theo cách này
# COPY .env .
EXPOSE 5001
CMD ["node", "dist/app.js"]
```