# Hướng Dẫn Triển Khai Hệ Thống Lên Kubernetes (K8s Production)

Tài liệu này hướng dẫn chi tiết quy trình triển khai nền tảng `open-erp` lên cụm Kubernetes (EKS, GKE, AKS, hoặc On-Premise K8s) sử dụng **Kustomize**.

---

## 1. Cấu Trúc Manifest K8s
Thư mục `deployments/k8s/` được tổ chức theo chuẩn Kustomize:
- `base/`: Khai báo các tài nguyên dùng chung (Deployments, Services, Ingress, Resource limits, Healthchecks).
- `overlays/staging/`: Cấu hình riêng cho môi trường Staging (Namespace: `openerp-staging`, Host: `staging.openerp.vn`).
- `overlays/production/`: Cấu hình riêng cho môi trường Production (Namespace: `openerp-prod`, Replicas: Backend=5, Web=3, Host: `app.openerp.vn`).

---

## 2. Các Bước Triển Khai

### 2.1. Kiểm Tra Kết Nối Cụm K8s
```bash
kubectl cluster-info
kubectl get nodes
```

### 2.2. Triển Khai Bằng Script Tự Động
```bash
# Triển khai môi trường Staging
./scripts/deploy/deploy_k8s.sh staging

# Triển khai môi trường Production
./scripts/deploy/deploy_k8s.sh production
```

### 2.3. Kiểm Tra Trạng Thái Pods & Ingress
```bash
kubectl get pods -n openerp-prod -o wide
kubectl get ingress -n openerp-prod
```

---

## 3. Quản Lý Secret & Biến Môi Trường Bảo Mật
Các thông tin nhạy cảm (mật khẩu CSDL, khóa JWT private key, Kafka credentials) **bắt buộc** phải được tạo dưới dạng Kubernetes Secrets:
```bash
kubectl create secret generic openerp-db-secrets \
  --from-literal=POSTGRES_PASSWORD='your_strong_secret_password' \
  -n openerp-prod
```

---

## 4. Cơ Chế Tự Động Co Giãn (Horizontal Pod Autoscaling - HPA)
Production hỗ trợ HPA tự động tăng số lượng Pod khi tải CPU > 75% hoặc Memory > 80%:
```bash
kubectl autoscale deployment openerp-backend --cpu-percent=75 --min=3 --max=20 -n openerp-prod
```
