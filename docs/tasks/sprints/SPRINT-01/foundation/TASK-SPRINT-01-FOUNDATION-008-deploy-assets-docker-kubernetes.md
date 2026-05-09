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
| Trạng thái | ⬜ TODO |
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
- [ ] Có đầy đủ thư mục `deploy/docker` và `deploy/k8s` với cấu trúc nhất quán.
- [ ] Docker compose chạy được tối thiểu stack Sprint 01 trên local/staging.
- [ ] Kubernetes manifests validate thành công bằng công cụ kiểm tra cú pháp.
- [ ] Có tài liệu mapping biến môi trường và cách cấu hình secret.
- [ ] Có runbook deploy, verify healthcheck và rollback cho cả Docker/Kubernetes.
- [ ] Deliverables được liên kết trong task index Sprint 01.
