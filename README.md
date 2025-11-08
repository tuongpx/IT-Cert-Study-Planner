# Hướng dẫn Triển khai & Bảo mật (Mô hình Frontend/Backend)

## Tổng quan Dự án

Đây là ứng dụng Lập kế hoạch Học tập Chứng chỉ IT được xây dựng với React, TypeScript và Tailwind CSS, sử dụng Gemini API để tạo kế hoạch thông minh. Hướng dẫn này mô tả cách triển khai ứng dụng theo mô hình kiến trúc hai tầng (frontend và backend riêng biệt) bằng Docker, Kubernetes và các phương pháp bảo mật tốt nhất theo tiêu chuẩn ISO 27001.

---

## Cấu trúc thư mục đề xuất để triển khai

Để phân biệt rõ ràng giữa cấu hình Docker và Kubernetes, chúng tôi đề xuất cấu trúc sau. Điều này giúp các quy trình CI/CD dễ dàng nhắm mục tiêu vào các tệp cấu hình cần thiết.

```
IT-study-planner/
├── backend/
│   ├── src/
│   │   └── app.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── docker/
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
└── k8s/
    ├── namespace.yaml
    ├── secrets.yaml
    ├── backend/
    │   ├── deployment.yaml
    │   └── service.yaml
    ├── frontend/
    │   ├── deployment.yaml
    │   └── service.yaml
    └── ingress.yaml
```

-   **`backend/`, `frontend/`**: Chứa mã nguồn của từng dịch vụ.
-   **`docker/`**: Chứa tất cả các `Dockerfile` để build image cho các dịch vụ.
-   **`k8s/`**: Chứa tất cả các tệp manifest của Kubernetes để triển khai.

---

## 1. Hướng dẫn Triển khai với Docker

Chúng ta sẽ tạo hai image Docker: một cho backend và một cho frontend, sử dụng các tệp `Dockerfile` được lưu trữ tập trung trong thư mục `docker/`.

#### Bước 1: Tạo `docker/backend.Dockerfile`

Dockerfile này cài đặt dependencies và sao chép mã nguồn từ thư mục `src/` vào image.

```dockerfile
# docker/backend.Dockerfile

# Giai đoạn 1: Sử dụng một image Python chính thức
FROM python:3.9-slim AS base
WORKDIR /app

# Tạo môi trường ảo để cô lập dependencies
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Cài đặt các thư viện cần thiết
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép mã nguồn ứng dụng từ thư mục src
COPY ./src .

# Mở cổng mà Gunicorn sẽ chạy
EXPOSE 5000

# Lệnh để chạy ứng dụng trong môi trường production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

#### Bước 2: Tạo `docker/frontend.Dockerfile`

Dockerfile này sử dụng multi-stage build để tạo ra một image Nginx nhẹ nhàng chỉ chứa các tệp tĩnh của ứng dụng React.

```dockerfile
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
```

#### Bước 3: Build và Đẩy các Image

Mở terminal và chạy các lệnh sau từ thư mục gốc của dự án (`IT-study-planner/`). Sử dụng cờ `-f` để chỉ định đường dẫn đến Dockerfile.

```bash
# Build image backend (context là thư mục ./backend)
docker build -t your-dockerhub-user/study-planner-backend:latest -f ./docker/backend.Dockerfile ./backend

# Build image frontend (context là thư mục ./frontend)
docker build -t your-dockerhub-user/study-planner-frontend:latest -f ./docker/frontend.Dockerfile ./frontend

# Đăng nhập vào registry
docker login

# Đẩy các image
docker push your-dockerhub-user/study-planner-backend:latest
docker push your-dockerhub-user/study-planner-frontend:latest
```

---

## 2. Hướng dẫn Triển khai với Kubernetes (K8s)

Chúng ta sẽ tạo các tài nguyên riêng biệt cho backend và frontend trong thư mục `k8s/`, sau đó sử dụng Ingress để điều hướng lưu lượng truy cập.

#### Bước 1: Tạo các tệp Manifest Kubernetes

Tạo các tệp YAML sau trong thư mục `k8s/` theo cấu trúc đã mô tả.

##### a. `k8s/namespace.yaml`
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: study-planner
```

##### b. `k8s/secrets.yaml` (Quản lý API Key)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: gemini-api-secret
  namespace: study-planner
type: Opaque
data:
  # Echo 'YOUR_API_KEY' | base64
  apiKey: WVdSUF9BUElfS0VZX0hFUkU=
```

##### c. `k8s/backend/deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
  namespace: study-planner
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend-container
        image: your-dockerhub-user/study-planner-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: gemini-api-secret
              key: apiKey
```

##### d. `k8s/backend/service.yaml`
Service này sử dụng `ClusterIP` vì nó chỉ cần được truy cập từ bên trong cluster (bởi Ingress).
```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: study-planner
spec:
  selector:
    app: backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 5000
  type: ClusterIP
```

##### e. `k8s/frontend/deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deployment
  namespace: study-planner
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend-container
        image: your-dockerhub-user/study-planner-frontend:latest
        ports:
        - containerPort: 80
```

##### f. `k8s/frontend/service.yaml`
```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: study-planner
spec:
  selector:
    app: frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: ClusterIP
```

##### g. `k8s/ingress.yaml`
Ingress là cổng vào cho cluster, điều hướng request đến đúng service dựa trên đường dẫn.
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: study-planner-ingress
  namespace: study-planner
  annotations:
    # (Tùy chọn) Thêm các annotation cần thiết cho Ingress controller của bạn
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

#### Bước 2: Áp dụng các Manifest lên Cluster

Áp dụng các tệp cấu hình từ thư mục `k8s/`.

```bash
# 1. Tạo namespace
kubectl apply -f k8s/namespace.yaml

# 2. Tạo secrets
kubectl apply -f k8s/secrets.yaml

# 3. Triển khai backend (deployment và service)
kubectl apply -f k8s/backend/

# 4. Triển khai frontend (deployment và service)
kubectl apply -f k8s/frontend/

# 5. Tạo Ingress để lộ ứng dụng
kubectl apply -f k8s/ingress.yaml
```

#### Bước 3: Xác minh việc Triển khai

```bash
# Kiểm tra các Pod trong namespace study-planner
kubectl get pods -n study-planner

# Kiểm tra các Service
kubectl get services -n study-planner

# Lấy địa chỉ IP của Ingress controller để truy cập ứng dụng
kubectl get ingress -n study-planner
```

---

## 3. Hướng dẫn Bảo mật (ISO 27001 & Mạng Công cộng)

-   **Tách biệt Trách nhiệm:** Mô hình frontend/backend cho phép bạn bảo vệ các tài nguyên nhạy cảm (như API key, kết nối cơ sở dữ liệu) trong backend, không bao giờ để lộ chúng ra client.
-   **HTTPS (SSL/TLS):** Cấu hình Ingress để chấm dứt (terminate) SSL, đảm bảo tất cả lưu lượng truy cập từ bên ngoài đều được mã hóa. Sử dụng cert-manager trong K8s để tự động hóa việc quản lý chứng chỉ Let's Encrypt.
-   **CORS (Cross-Origin Resource Sharing):** Cấu hình backend API của bạn để chỉ chấp nhận các request từ domain của frontend, ngăn chặn các trang web khác gọi trực tiếp vào API của bạn.
-   **Cập nhật Thường xuyên:** Giữ tất cả các thư viện (npm, pip), image Docker cơ sở, và các thành phần K8s được cập nhật để vá các lỗ hổng bảo mật.
-   **Xác thực Đầu vào & Mã hóa Đầu ra:** Backend phải chịu trách nhiệm xác thực tất cả dữ liệu nhận được từ frontend. Frontend phải mã hóa tất cả dữ liệu hiển thị để chống lại XSS.
-   **Biến Môi trường cho Bí mật:** Luôn sử dụng Kubernetes Secrets hoặc các công cụ quản lý bí mật bên ngoài (như Vault) để quản lý thông tin nhạy cảm.
-   **Giới hạn Tốc độ (Rate Limiting):** Triển khai giới hạn tốc độ tại Ingress controller hoặc trong backend API để bảo vệ khỏi các cuộc tấn công DoS và lạm dụng.
-   **Ghi log & Giám sát:** Thiết lập một hệ thống ghi log tập trung (ví dụ: EFK stack - Elasticsearch, Fluentd, Kibana) và giám sát (Prometheus, Grafana) để theo dõi cả hai dịch vụ và phát hiện các hành vi bất thường.
