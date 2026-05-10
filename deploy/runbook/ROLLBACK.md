# Runbook Rollback Cơ Bản

## Mục tiêu

Khôi phục nhanh phiên bản ổn định gần nhất khi rollout mới gây lỗi.

## Rollback Docker Compose

1. Xác định image tag ổn định gần nhất.
2. Cập nhật `IMAGE_TAG` trong file env môi trường.
3. Redeploy:

```bash
docker compose --env-file deploy/docker/.env.staging -f deploy/docker/compose.staging.yml up -d
```

4. Verify:

```bash
docker compose --env-file deploy/docker/.env.staging -f deploy/docker/compose.staging.yml ps
docker compose --env-file deploy/docker/.env.staging -f deploy/docker/compose.staging.yml logs --tail 100 api-gateway
```

## Rollback Kubernetes

1. Kiểm tra lịch sử rollout:

```bash
kubectl rollout history deploy/api-gateway -n open-erp
```

2. Rollback revision trước:

```bash
kubectl rollout undo deploy/api-gateway -n open-erp
```

3. Xác nhận trạng thái:

```bash
kubectl rollout status deploy/api-gateway -n open-erp
kubectl get pods -n open-erp
```

## Điều kiện leo thang

- Rollback thất bại 2 lần liên tiếp.
- Service vẫn không healthy sau rollback.
- Có dấu hiệu lỗi dữ liệu hoặc mất kết nối liên dịch vụ.
