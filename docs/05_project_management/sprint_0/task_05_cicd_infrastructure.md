# Tài liệu kỹ thuật chi tiết: TSK-0.5 - Thiết lập CI/CD & Cơ sở hạ tầng (Infrastructure)
## Phân hệ: DevOps & Cơ sở hạ tầng hệ thống (DevOps & Infra - Sprint 0)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng hạ tầng triển khai tự động (CI/CD Pipeline) giúp rút ngắn thời gian bàn giao sản phẩm từ khi lập trình viên commit code đến khi ứng dụng chạy trên môi trường kiểm thử. Thiết kế và thiết lập hạ tầng Kubernetes Cluster (EKS/GKE) để vận hành mô hình SaaS phân tán, hỗ trợ mở rộng động, xử lý kết nối thời gian thực và đảm bảo an toàn dữ liệu.

---

### 2. Thiết kế Hạ tầng hệ thống & Cloud Architecture

#### 2.1 Cụm máy chủ Kubernetes (K8s Cluster)
* **Giải pháp áp dụng:** Sử dụng AWS EKS (Elastic Kubernetes Service) hoặc GCP GKE (Google Kubernetes Engine) để tự động quản lý vòng đời Container.
* **Các thành phần cốt lõi trong cụm:**
  - **Ingress Controller (Nginx / Traefik):** Nhận lưu lượng mạng ngoài, định tuyến động theo subdomain (ví dụ: `*.open-erp.9ms.io.vn` chuyển vào cổng frontend, `/api/*` chuyển vào backend service).
  - **Cert-Manager:** Tự động đăng ký, gia hạn chứng chỉ SSL miễn phí từ Let's Encrypt cho các subdomain của khách hàng (Tenant Wildcard SSL).
  - **PostgreSQL Cluster (với PgBouncer):** Cơ sở dữ liệu trung tâm, thiết lập RLS. Sử dụng PgBouncer làm Connection Pooler để xử lý hàng ngàn kết nối đồng thời từ các microservices mà không làm quá tải RAM của PostgreSQL.
  - **Redis Cluster:** Bộ lưu trữ tạm thời trong RAM (In-Memory Cache). Đóng vai trò làm Redis Pub/Sub adapter kết nối các phiên WebSocket của ứng dụng NestJS, giúp đồng bộ thông tin chat, thông báo tức thời giữa nhiều bản sao (replicas) của backend container.

#### 2.2 Sơ đồ mạng và luồng dữ liệu (Data & Traffic Flow)
```text
[Người dùng (Web/Mobile)] -- HTTPS (TLS) --> [Ingress Controller]
                                                  |
                                      +-----------+-----------+
                                      |                       |
                                      v                       v
                         [open-erp-web Service]     [open-erp-services (Backend)]
                                                              |
                                                   +----------+----------+
                                                   |                     |
                                                   v                     v
                                            [Redis Cluster]      [PostgreSQL DB]
                                           (WS Sync / Cache)      (RLS Isolation)
```

---

### 3. Dockerize ứng dụng (Docker Configurations)

Mỗi dự án sẽ có một file `Dockerfile` riêng biệt được cấu hình theo cơ chế Multi-stage Build để giảm kích thước image cuối cùng và nâng cao tính bảo mật.

#### 3.1 Backend NestJS: `Dockerfile`
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Run
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

#### 3.2 Web Angular: `Dockerfile`
```dockerfile
# Stage 1: Build Angular APP
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build --configuration=production

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist/open-erp-web/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

### 4. Quy trình tự động hóa CI/CD (GitHub Actions Workflow)

Xây dựng 3 luồng pipeline tương ứng cho 3 repository hoạt động theo các giai đoạn sau:

```text
[Lập trình viên push code] 
          |
          v
Giai đoạn 1: Lint & Test (ESLint & Unit Tests)
          | (Pass)
          v
Giai đoạn 2: Build Image (Build Docker image, tag theo Git Commit SHA)
          |
          v
Giai đoạn 3: Push Registry (Đẩy image lên AWS ECR hoặc Docker Hub)
          |
          v
Giai đoạn 4: Deploy K8s (Cập nhật image tag mới vào K8s Deployment Manifest và apply)
```

#### 4.1 Cấu hình chi tiết luồng Deploy cho Backend (`.github/workflows/deploy.yml`)
```yaml
name: Deploy Backend Service to Dev

on:
  push:
    branches:
      - develop  # Tự động deploy khi merge vào develop (môi trường Dev)

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies & Run Tests
        run: |
          npm ci
          npm run test:cov
          npm run lint

      - name: Log in to Docker Registry
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: myregistry/open-erp-services:${{ github.sha }}

      - name: Configure AWS Credentials / Kubeconfig
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-1

      - name: Update Kubernetes Manifests & Deploy
        run: |
          aws eks update-kubeconfig --name open-erp-dev-cluster
          kubectl set image deployment/backend-services-deploy backend-services=myregistry/open-erp-services:${{ github.sha }}
          kubectl rollout status deployment/backend-services-deploy
```

---

### 5. Quản lý Môi trường triển khai (Environments)

1. **Môi trường Local Developer (Máy tính cá nhân):**
   * **Cách vận hành:** Hạ tầng phụ trợ (PostgreSQL RLS, Redis) được container hóa chạy qua Docker Desktop / Docker Engine. Runtime ứng dụng (NestJS, Angular, Ionic) được chạy trực tiếp trên hệ điều hành host thông qua npm và VSCode Debugger để tối ưu hiệu năng và dễ dàng debug dòng code.
   * **Mục đích:** Kiểm thử tức thời, debug cục bộ.
2. **Môi trường Development (Dev Cloud):**
   * **Domain:** `*.dev.open-erp.9ms.io.vn`
   * **Hạ tầng:** Kubernetes Cluster (EKS/GKE).
   * **Trigger:** Mọi commit merge vào nhánh `develop` trên GitHub.
   * **Mục đích:** Để lập trình viên tích hợp hệ thống và kiểm thử liên tục.
3. **Môi trường Staging (Kiểm thử & QA):**
   * **Domain:** `*.staging.open-erp.9ms.io.vn`
   * **Hạ tầng:** Kubernetes Cluster (EKS/GKE).
   * **Trigger:** Khi tạo một bản Release Tag (ví dụ: `v1.0.0-rc1`) trên Git.
   * **Mục đích:** QA thực hiện kiểm thử tự động, kiểm thử hiệu năng và PO nghiệm thu tính năng.

---

### 6. Quy chuẩn liên kết và đường dẫn file trên GitHub (GitHub Path Rules)

> [!IMPORTANT]
> **QUY TẮC BẮT BUỘC KHI VIẾT ĐƯỜNG DẪN TÀI LIỆU TRÊN GITHUB (PHẢI TUÂN THỦ NGHIÊM NGẶT):**
> 
> 1. **Sử dụng đường dẫn tương đối (Relative Paths):** Tất cả các tài liệu phải liên kết qua cấu trúc tương đối (ví dụ: `[Mô hình dữ liệu](../04_technical/data_model.md)` hoặc `[Task 03](./task_03_architecture_design.md)`). Tuyệt đối KHÔNG sử dụng đường dẫn tuyệt đối dạng Windows (`C:\...`) hoặc dạng URL file cục bộ (`file:///...`).
> 2. **Phân biệt chữ hoa/thường (Case Sensitivity):** GitHub chạy trên nền tảng hệ điều hành Linux nên phân biệt chữ hoa và chữ thường trong đường dẫn. Toàn bộ tên thư mục và tên file trong liên kết phải khớp chính xác 100% với tên thực tế trên ổ đĩa (ví dụ: `task_01_discovery_scope.md` chứ không được viết thành `Task_01_discovery_scope.md`).
> 3. **Ký tự ngăn cách:** Luôn sử dụng dấu gạch chéo `/` thay cho dấu gạch chéo ngược `\` của Windows.

---

### 7. Công việc chi tiết của Kỹ sư DevOps
* **Nhiệm vụ 1:** Khởi tạo hạ tầng Kubernetes Cluster và cấu hình mạng VPC trên Cloud Provider.
* **Nhiệm vụ 2:** Cài đặt Ingress Controller, Cert-manager để cấp phát SSL tự động cho các tenant.
* **Nhiệm vụ 3:** Viết cấu hình `Dockerfile` tối ưu cho backend, web, và mobile.
* **Nhiệm vụ 4:** Thiết lập các GitHub Secrets trên repositories (Docker credentials, AWS/K8s Access Keys, DB credentials).
* **Nhiệm vụ 5:** Viết các file cấu hình GitHub Actions Workflow trong thư mục `.github/workflows/` của từng repo.

---

### 8. Tiêu chí hoàn thành (Definition of Done - DoD)
* **Kết quả bàn giao:**
  - Cụm Kubernetes Cluster chạy ổn định, có thể truy cập được từ bên ngoài thông qua Domain chính.
  - Các pipeline GitHub Actions được kích hoạt chạy thành công (màu xanh lá trên GitHub) và hoàn thành cả 4 giai đoạn mà không gặp lỗi.
  - Ứng dụng NestJS (Backend) và Angular (Web) được deploy tự động lên cụm K8s và phản hồi chính xác khi gọi URL kiểm tra sức khỏe (`/health`).
  - Toàn bộ tệp cấu hình triển khai (Helm chart hoặc YAML manifests) được lưu trữ vào Git.
  - Các đường dẫn liên kết giữa các file tài liệu trong toàn bộ thư mục `docs/` đều sử dụng relative path chính xác và hoạt động hoàn hảo trên giao diện GitHub.
