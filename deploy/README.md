# Deploy Assets Sprint 01

Thư mục này chứa bộ asset triển khai chuẩn hóa cho Sprint 01, gồm Docker Compose và Kubernetes manifest.

## Cấu trúc

- `docker/`: Compose files cho local và staging.
- `k8s/base/`: Manifests Kubernetes nền tảng.
- `runbook/`: Runbook triển khai và rollback cơ bản.

## Quy ước chung

- Không commit secret thật vào repo.
- Image tag dùng biến `IMAGE_TAG`, mặc định `dev`.
- Mọi endpoint public cần đi qua ingress/reverse proxy có TLS ở môi trường staging/production.
