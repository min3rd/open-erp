# Hướng Dẫn Triển Khai Plugin Manager (Sprint 03)

> Phạm vi: hạ tầng và cấu hình cần thiết để vận hành Plugin Manager ở Local, Docker và Kubernetes.
> Liên quan: [DES-03-DB](../sprints/sprint_03_plugin_manager/06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md), [DES-03-API](../sprints/sprint_03_plugin_manager/06_designs/api/PLUGIN_MANAGER_API_SPEC.md).

## 1. Cấu Hình Backend (`application.properties`)

```properties
# Deployer runtime: docker (local) | kubernetes (staging/prod) | noop (test)
openerp.plugin.deployer.runtime=docker
openerp.plugin.deployer.binary=docker
openerp.plugin.deployer.kubectl-binary=kubectl
openerp.plugin.deployer.namespace=openerp-plugins
openerp.plugin.deployer.timeout-seconds=90
openerp.plugin.runtime-network=openerp-net
openerp.plugin.resources.default-memory-mb=512
openerp.plugin.resources.default-cpus=0.5

# Runtime gateway (proxy tenant → container)
openerp.plugin.gateway.timeout-seconds=30
openerp.plugin.gateway.session-token-minutes=5

# Image builder: docker | kaniko | noop
openerp.plugin.image-builder=docker
openerp.plugin.internal-registry=${DOCKER_REGISTRY:openerp-registry.local}
openerp.plugin.builder.push=true
openerp.plugin.builder.timeout-seconds=600
openerp.plugin.builder.namespace=openerp-plugins
openerp.plugin.builder.base-image=eclipse-temurin:21-jre
openerp.plugin.builder.kaniko-context-dir=/workspace/plugin-contexts
openerp.plugin.max-artifact-size-mb=512

# Credentials registry (AES-GCM) — BẮT BUỘC override ở staging/production
openerp.plugin.credentials.master-key=${OPENERP_PLUGIN_MASTER_KEY}

# Lưu trữ artifact: local | minio
openerp.storage.provider=minio
openerp.storage.minio.endpoint=${MINIO_ENDPOINT:http://minio:9000}
openerp.storage.minio.access-key=${MINIO_ACCESS_KEY}
openerp.storage.minio.secret-key=${MINIO_SECRET_KEY}
openerp.storage.minio.bucket=plugin-artifacts
openerp.storage.minio.region=us-east-1

# Snapshot an toàn dữ liệu
openerp.plugin.snapshot.pg-dump-binary=pg_dump
openerp.plugin.snapshot.psql-binary=psql
openerp.plugin.snapshot.timeout-seconds=300
```

**Bắt buộc**:
- `openerp.plugin.credentials.master-key`: khóa AES-256 (Base64, 32 byte). Sinh bằng `openssl rand -base64 32`; lưu trong Secret của K8s/Vault; **không commit**.
- `openerp.core.version`: phiên bản Core dùng để kiểm tra `core_version_compatibility` khi cài plugin.

## 2. MinIO (Lưu Trữ Chính)

1. Khởi chạy profile storage ở local: `make infra-storage` (docker compose profile `storage`).
2. Tạo bucket `plugin-artifacts` (bắt buộc) và khuyến nghị bật **versioning** + **SSE-S3**.
3. Cấp credential riêng cho backend (chỉ `s3:GetObject/PutObject/ListBucket` trên bucket này).
4. Kiểm tra: `mc admin info local` hoặc `curl -s http://minio:9000/minio/health/live`.

Bucket khác (khung): `plugin-snapshots` (snapshot DB), `tenant-files` (dùng chung sau này).

## 3. Deployer Docker (Local)

- Plugin chạy **một container cho mỗi (tenant, plugin)**, cùng network `openerp-net` với backend.
- Yêu cầu: Docker daemon sẵn sàng; user chạy backend có quyền `docker run/rm/inspect`.
- Kiểm tra nhanh: `docker ps --filter label=app=open-erp-plugin`.
- Gỡ plugin = `docker rm -f` (không xóa schema/dữ liệu).

## 4. Deployer Kubernetes (Staging/Production)

- Backend gọi `kubectl apply/delete/get` (không dùng SDK) → cần ServiceAccount gắn với backend:
  - `create/delete/get/list` trên `deployments`, `services`, `jobs` trong namespace plugin (ví dụ `openerp-plugins`).
  - Khuyến nghị thêm NetworkPolicy: plugin chỉ egress tới PostgreSQL/Redis nội bộ, cấm Internet.
- Manifest được sinh tự động: Deployment + Service (labels `tenant_id`, `plugin_key`, `plugin_version`), probes `/q/health/ready` + `/q/health/live`, resource limits.
- Kaniko (build image từ bundle): Job dùng `--context=tar:///workspace/contexts/<key>-<version>.tar.gz`; thư mục `openerp.plugin.builder.kaniko-context-dir` phải là volume chia sẻ giữa backend và cluster (hostPath/PVC). Với môi trường nhiều node, dùng PVC RWX.
- Readiness: `readyReplicas >= 1`; fail → saga trả `PLUGIN_SERVICE_UNHEALTHY` và bù trừ.

## 5. Registry Allowlist & Credentials

- Allowlist host registry qua cấu hình `openerp.plugin.registry-allowed-hosts` (CSV, rỗng = cho phép host công khai phổ biến); host ngoài allowlist → `PLUGIN_REGISTRY_NOT_ALLOWED`.
- Credential (Docker Hub/Registry riêng) quản lý tại `/platform/plugin-credentials` (platform) hoặc `/settings/plugin-credentials` (tenant). Secret mã hóa AES-GCM, không bao giờ trả về API.
- Đổi `master-key` sẽ làm credential cũ không giải mã được → phải nhập lại.

## 6. Snapshot & Retention

- Upgrade `migration_policy=BREAKING` **bắt buộc** snapshot (`PLUGIN_SNAPSHOT_REQUIRED`); rollback cần preflight 4 điều kiện (tồn tại, digest, hạn, restoreable).
- Snapshot lưu MinIO `plugin-snapshots/{tenant}/{plugin}/{operation_id}/{version}/{timestamp}.dump`.
- Retention mặc định 30 ngày (`openerp.plugin.snapshot-retention-days`); dọn định kỳ bằng cron job ngoài backend.

## 7. Kiểm Tra Sau Triển Khai

```bash
# 1. Schema plugin đã migrate
docker exec -i openerp-postgres-primary psql -U openerp -d openerp_dev -c "\dt plugin_*"

# 2. API catalog (SUPER_ADMIN)
curl -H "Authorization: Bearer $TOKEN" "https://openerp.9ms.io.vn/api/v1/platform/plugins?page=0&size=5"

# 3. UI manifest của tenant
curl -H "Authorization: Bearer $TENANT_TOKEN" "https://openerp.9ms.io.vn/api/v1/plugins/ui-manifest"

# 4. Container plugin đang chạy
docker ps --filter label=app=open-erp-plugin
```

## 8. Xử Lý Sự Cố Thường Gặp

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
| :--- | :--- | :--- |
| `PLUGIN_DEPLOY_FAILED` | Docker/kubectl không có trong PATH, hết tài nguyên | Kiểm tra binary, quota CPU/RAM, log deployer |
| `PLUGIN_SERVICE_UNHEALTHY` | Container không lên, thiếu env DB | `docker logs <name>` / `kubectl logs`; kiểm tra schema/role |
| `PLUGIN_RUNTIME_UNAVAILABLE` (gateway) | Ledger không ACTIVE hoặc runtime `noop` | Kiểm tra trạng thái cài trong `/settings/plugins` |
| `PLUGIN_ARTIFACT_NOT_OWNED` | Artifact thuộc tenant khác | Upload lại bundle ở tenant hiện tại |
| `PLUGIN_REGISTRY_AUTH_FAILED` | Credential sai/hết hạn | Cập nhật credential và bấm "Kiểm tra kết nối" |
