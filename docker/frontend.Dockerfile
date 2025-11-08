# docker/frontend.Dockerfile

# Giai đoạn 1: Build ứng dụng React
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
# Sao chép toàn bộ context, bao gồm cả thư mục src/ và public/
COPY . .
# Tạo bản build production
RUN npm run build

# Giai đoạn 2: Phục vụ ứng dụng bằng Nginx
FROM nginx:stable-alpine
# Sao chép các tệp build tĩnh từ giai đoạn trước
COPY --from=build /app/dist /usr/share/nginx/html
# (Tùy chọn) Sao chép cấu hình Nginx để proxy các request API đến backend
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
