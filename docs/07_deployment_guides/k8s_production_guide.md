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

### 3.1. Secret & cấu hình nền tảng (Sprint 02)

```bash
kubectl create secret generic openerp-platform-secrets \
  --from-literal=OPENERP_ADMIN_BOOTSTRAP_SECRET='doi-secret-manh' \
  -n openerp-prod
```

| Biến môi trường | Nguồn | Mô tả |
| :--- | :--- | :--- |
| `OPENERP_ADMIN_BOOTSTRAP_SECRET` | Secret | Bootstrap first-run + Offline CLI; thiếu → bootstrap bỏ qua an toàn. |
| `OPENERP_PLATFORM_BOOTSTRAP_EMAILS` | ConfigMap/Secret | CSV email Super Admin khởi tạo (chỉ chạy khi không còn SUPER_ADMIN `ACTIVE`). |
| `OPENERP_PLATFORM_PLUGIN_CATALOG` | ConfigMap | CSV plugin tùy chọn (`key[:name_key[:description_key]]`); trống → chỉ `core`. |
| `OPENERP_FRONTEND_URL` | ConfigMap | URL frontend cho email (prod: `https://openerp.9ms.io.vn`). |
| `OPENERP_PLATFORM_IMPERSONATION_TTL_SECONDS` | ConfigMap | TTL phiên Impersonation (mặc định `1800`). |

- Jobs nền chạy trong pod backend (`audit partition/retention`, `tenant lifecycle`, `impersonation timeout` interval `300s`); với deployment nhiều replica (HPA), Quarkus đảm bảo timer chạy trên từng node nhưng job dùng transaction/row-lock an toàn — theo dõi log `Impersonation timeout` trên `vert.x-worker-thread-*`.
- **Lưu ý timezone**: lưu UTC trong CSDL; hiển thị theo timezone người dùng ở frontend. Không cấu hình TZ địa phương cho container.
- Vận hành khẩn cấp khi mất toàn bộ admin: mở shell vào pod backend và chạy Offline CLI:
  ```bash
  kubectl exec -it deploy/openerp-backend -n openerp-prod -- \
    java -jar quarkus-run.jar admin-cli list-admins
  ```
  Lệnh hỗ trợ: `bootstrap`, `list-admins`, `grant-admin --email X --role R`, `revoke-admin --email X`; không nhận mật khẩu qua tham số; audit `actor_type = CLI`.

---

## 4. Cơ Chế Tự Động Co Giãn (Horizontal Pod Autoscaling - HPA)
Production hỗ trợ HPA tự động tăng số lượng Pod khi tải CPU > 75% hoặc Memory > 80%:
```bash
kubectl autoscale deployment openerp-backend --cpu-percent=75 --min=3 --max=20 -n openerp-prod
```
