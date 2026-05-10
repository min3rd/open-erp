# TASK-SPRINT-01-FOUNDATION-008: Deploy Assets cho Docker và Kubernetes

## Thông tin
| Thuộc tính | Giá trị |
|---|---|
| Task ID | TASK-SPRINT-01-FOUNDATION-008 |
| Sprint | Sprint 01 |
| Cluster | foundation |
| Loại | DevOps |
| Người phụ trách | DevOps |
| Story Points | 5 |
| Trạng thái | 🟡 REVIEW |
| Phụ thuộc | TASK-SPRINT-01-FOUNDATION-001, TASK-SPRINT-01-FOUNDATION-006 |

## Mô tả
Xây dựng bộ deploy assets chuẩn hóa cho 2 hình thức container orchestration là Docker và Kubernetes, phục vụ local/staging và tạo nền tảng triển khai production về sau.

## Phạm vi kỹ thuật

### Docker deploy assets
- Thiết kế cấu trúc thư mục `deploy/docker/`.
- Tạo manifest compose theo môi trường (local/staging) và quy ước biến môi trường.
- Chuẩn hóa network, volume, healthcheck, restart policy.

### Kubernetes deploy assets
- Thiết kế cấu trúc `deploy/k8s/` theo namespace và thành phần.
- Định nghĩa manifests cơ bản: Deployment, Service, ConfigMap, Secret template, Ingress.
- Thiết kế strategy rollout và rollback cơ bản.

### Chuẩn cấu hình chung
- Thiết kế file mẫu biến môi trường và tài liệu ánh xạ biến theo service.
- Quy định naming convention image tag, resource labels/annotations.

## Thiết kế cơ sở dữ liệu
- **Service sở hữu data:** Không áp dụng.
- **Bảng / Collection:** Không phát sinh.
- **Index cần tạo:** Không.
- **Migration cần thiết:** Không.

## Thiết kế API
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| N/A | N/A | N/A | Task triển khai hạ tầng, không thêm API nghiệp vụ |

Chi tiết từng API:
```
N/A
```

## Giao thức & Công nghệ
- **Ngôn ngữ:** YAML, Shell command guideline
- **Framework:** Docker Compose, Kubernetes manifests
- **Giao thức:** Container networking (HTTP/TCP nội bộ)
- **Thư viện đề xuất:** Helm (tùy chọn giai đoạn sau), Kustomize (tùy chọn)
- **Micro-frontend / Microservice liên quan:** Toàn bộ services trong Sprint 01

## Deliverables dự kiến
- `deploy/docker/` (compose files, env templates, README)
- `deploy/k8s/` (manifests theo service/namespace, README)
- Tài liệu runbook deploy và rollback ở mức Sprint 01

## Yêu cầu bảo mật
- [ ] Secret không hardcode trong manifest/compose
- [ ] Có guideline quản lý secret cho Docker và Kubernetes
- [ ] Giới hạn public exposure qua Ingress/port mapping
- [ ] Có baseline network policy hoặc định hướng kiểm soát traffic nội bộ

## Yêu cầu phi chức năng
- **Hiệu năng:** Luồng deploy staging hoàn tất trong SLA nội bộ đã định.
- **Khả năng mở rộng:** Manifest có thể mở rộng thêm service mà không phá vỡ cấu trúc.
- **Logging & Monitoring:** Có định hướng tích hợp logging/metrics endpoint trong manifest.
- **Xử lý lỗi:** Có hướng dẫn rollback khi rollout thất bại.

## Acceptance Criteria
- [x] Có đầy đủ thư mục `deploy/docker` và `deploy/k8s` với cấu trúc nhất quán.
- [ ] Docker compose chạy được tối thiểu stack Sprint 01 trên local/staging.
- [x] Kubernetes manifests validate thành công bằng công cụ kiểm tra cú pháp.
- [x] Có tài liệu mapping biến môi trường và cách cấu hình secret.
- [x] Có runbook deploy, verify healthcheck và rollback cho cả Docker/Kubernetes.
- [x] Deliverables được liên kết trong task index Sprint 01.

## Kết quả triển khai

**Ngày hoàn thành:** 2026-05-10  
**Trạng thái:** 🟡 REVIEW

**Deliverables đã tạo:**
- `deploy/README.md`
- `deploy/docker/compose.local.yml`
- `deploy/docker/compose.staging.yml`
- `deploy/docker/.env.local.template`
- `deploy/docker/.env.staging.template`
- `deploy/docker/README.md`
- `deploy/docker/ENV-MAPPING.md`
- `deploy/k8s/base/namespace.yaml`
- `deploy/k8s/base/configmap-app.yaml`
- `deploy/k8s/base/secret-app.template.yaml`
- `deploy/k8s/base/deployment-api-gateway.yaml`
- `deploy/k8s/base/service-api-gateway.yaml`
- `deploy/k8s/base/ingress-api-gateway.yaml`
- `deploy/k8s/base/network-policy.yaml`
- `deploy/k8s/base/kustomization.yaml`
- `deploy/k8s/README.md`
- `deploy/runbook/ROLLBACK.md`

**Bằng chứng lệnh chạy và kết quả chính:**
- `docker compose --env-file c:/Users/Minh/Documents/open-erp/deploy/docker/.env.local.template -f c:/Users/Minh/Documents/open-erp/deploy/docker/compose.local.yml config`
	- Kết quả: render compose thành công cho stack local (mongodb, rabbitmq, redis, api-gateway).
- `docker compose --env-file c:/Users/Minh/Documents/open-erp/deploy/docker/.env.staging.template -f c:/Users/Minh/Documents/open-erp/deploy/docker/compose.staging.yml config`
	- Kết quả: render compose staging thành công.
- `kubectl kustomize c:/Users/Minh/Documents/open-erp/deploy/k8s/base`
	- Kết quả: render toàn bộ manifests thành công.

**Phần còn thiếu / chưa đạt:**
- Chưa có bằng chứng `docker compose up` thành công cho staging do chưa có image tag thực tế trong registry (`IMAGE_TAG` ở mức template).

**Bất thường ghi nhận:**
- `kubectl apply --dry-run=client -k ...` bị lỗi validate OpenAPI từ cụm hiện tại; đã dùng `kubectl kustomize` để kiểm tra cú pháp manifest độc lập với cluster.
