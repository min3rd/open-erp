# [FEAT-23] Phân Phối Plugin Đa Kênh, Deployer Container-per-Tenant & Plugin Host Runtime

- **Mã Tính Năng**: FEAT-23
- **Phân Loại**: Feature / Platform Runtime
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Yêu Cầu**: Khách hàng (Gate 2026-09-19 — 3 kênh, auto-deploy, MinIO, WC/MF)
- **Người Xử Lý (Assignee)**: Developer Agent (Backend, DevOps & Web)
- **Thuộc Sprint**: Sprint 03 - Plugin Manager, Plugin CLI & Cơ Chế Phân Phối Plugin
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred
- **Ngày Tạo**: 2026-09-20
- **Tài Liệu Thiết Kế**: [SOL-02](../05_solutions/SOL-02_plugin_distribution_runtime_and_isolation.md), [SOL-03](../05_solutions/SOL-03_plugin_ui_extension_and_cli_dev_experience.md), [DES-03-API](../06_designs/api/PLUGIN_MANAGER_API_SPEC.md), [DES-03-UI](../06_designs/ui_ux/PLUGIN_MANAGER_UI_SPEC.md)

---

## 1. Mô Tả Yêu Cầu

Đưa plugin vào hệ thống qua 3 kênh (Docker Hub / Image Registry / tệp JAR + Web bundle), xác minh manifest + checksum, lưu MinIO (lưu trữ chính toàn hệ thống), build image từ bundle, **tự động deploy container riêng cho từng tenant** (Docker local + K8s staging/prod) với Tenant Datasource Router (schema/database riêng + DB role least privilege), và **Plugin Host Runtime** hiển thị Web plugin 2 chế độ bằng **Web Components + Module Federation** (iframe sandbox dự phòng) cho cả plugin Official lẫn plugin riêng của tenant.

## 2. Tiêu Chí Nghiệm Thu (Theo CONF-01)

- [ ] AC-23.1 Đăng ký từ 3 kênh → catalog DRAFT → PUBLISHED; tenant cài được như nhau.
- [ ] AC-23.2 Checksum sai → từ chối `PLUGIN_ARTIFACT_CHECKSUM_MISMATCH` (không ghi catalog).
- [ ] AC-23.3 JAR upload → build image → deploy; **không restart Core**.
- [ ] AC-23.4 Cô lập dữ liệu: migration 2 tenant chạy đồng thời không ảnh hưởng nhau; DB role tenant A không ghi được schema tenant B.
- [ ] AC-23.5 UI Contribution WC/MF cho cả Official và plugin riêng; iframe dự phòng; 0 console error; ẩn theo quyền.
- [ ] AC-23.6 Deployer tự động (Docker local + K8s staging): nhãn chuẩn, health check, resource limits, dọn dẹp khi gỡ, rollback nâng cấp.
- [ ] AC-23.7 Credentials platform/tenant: nhiều credential, mã hóa, chọn đúng theo host, không lộ UI/log.

## 3. Phân Rã Sub-Task (Inline)

| Mã | Nhiệm Vụ | Phụ Trách | Trạng Thái |
| :--- | :--- | :--- | :---: |
| **TASK-331** | `ArtifactSourceResolver` + `OciRegistryClient`: phân giải Docker Hub/Registry v2 (token auth, digest, tag), allowlist host + HTTPS + chặn redirect + timeout/size. **Một phần**: registration validate manifest do caller cung cấp; pull manifest từ image + token auth → hoàn thiện cùng TASK-339/QA | Dev Backend | In Progress |
| **TASK-332** | `BundleIngestService`: upload multipart streaming → quarantine MinIO; giới hạn dung lượng; checksum; gắn `owner_tenant_id` (T14). **Đã code upload P4/T14 + ownership prefix + checksum** | Dev Backend | In Review |
| **TASK-333** | `ArtifactVerifier`: JSON Schema manifest, checksum SHA-256, SemVer, tương thích Core, phụ thuộc, trùng key/version; quy tắc DRAFT→PUBLISHED chỉ khi đã xác minh | Dev Backend | To Do |
| **TASK-334** | `ImageBuilder`: bundle → image chuẩn (base runtime + JAR + Web assets) → push registry nội bộ; backend Docker daemon (local) và **Kaniko Job** (K8s); log job + retry idempotent | Dev Backend/DevOps | To Do |
| **TASK-335** | Tích hợp **MinIO** (lưu trữ chính): buckets `plugin-artifacts`, `plugin-snapshots`, `tenant-files` (khung); SSE, versioning, presigned URL; config + `make infra-storage`; tài liệu hóa. **Đã code `MinioArtifactStorage` (AWS SigV4, zero SDK) + switch `openerp.storage.provider`; SSE/versioning/presigned → TASK-345** | Dev Backend/DevOps | In Review |
| **TASK-336** | `CredentialService`: AES-GCM (master key từ secret), scope PLATFORM/TENANT, nhiều credential, chọn theo host + ưu tiên tenant; API P16–P18, T10–T11, test connection; không trả secret. **Đã code service + resources + test (secret không lộ, tenant isolation)** | Dev Backend | In Review |
| **TASK-337** | `TenantDatasourceService`: `ensureSchema(tenant, plugin)` → schema `tenant_<short>_<plugin>`, role least privilege, mật khẩu ngẫu nhiên (mã hóa), rotate, thu hồi; script backup/restore theo tenant. **Đã code ensureDatasource + role/password; script backup/restore → TASK-310/345** | Dev Backend | In Progress |
| **TASK-338** | `PluginRuntimeDeployer` interface + `DockerRuntimeDeployer`: create/start/stop/remove, labels (`tenant_id/plugin_key/version`), resource limits, env secrets, healthcheck, rollback image. **Đã code interface + `ProcessPluginRuntimeDeployer` (docker CLI + runtime `noop`); Kubernetes → TASK-339** | Dev Backend | In Progress |
| **TASK-339** | `KubernetesRuntimeDeployer`: Deployment/Service/Secret/ConfigMap, readiness/liveness, resource limits, NetworkPolicy egress hạn chế, ServiceAccount RBAC tối thiểu quyền | Dev Backend/DevOps | To Do |
| **TASK-340** | Runtime gateway/proxy: Core forward request tới container plugin theo `(tenant_id, plugin_key)`; API S3 runtime health; token ngắn hạn cho iframe; CSP/frame-src allowlist động | Dev Backend | To Do |
| **TASK-341** | Plugin Host runtime (shared `src/frontend/shared/plugin-host`): `PluginSlotComponent`, `ContributionOutletComponent`, loaders WC/MF/iframe, `ui-manifest.service`, theme/i18n bridge, error boundary, host/contract version resolve | Web (Shared) | To Do |
| **TASK-342** | Hợp đồng đóng gói Web plugin: remote entry (MF, shared scope version pin), custom element (Shadow DOM), trang iframe; hỗ trợ template CLI (liên kết FEAT-22 TASK-323/326/327) | Web (Shared) | To Do |
| **TASK-343** | UI đăng ký artifact: Platform Drawer 3 kênh + preview (P4/P5) và Tenant Drawer 3 kênh + quản lý phiên bản (T14–T18); credential pages; dùng `operation-progress` | Dev Web | To Do |
| **TASK-344** | Integration/E2E tests: checksum mismatch bị từ chối, registry auth/allowlist, build image từ bundle, deploy/undeploy Docker, cô lập datasource 2 tenant, credentials, UI Manifest resolve host version; smoke K8s staging | Backend/QA | To Do |
| **TASK-345** | Tài liệu: `docs/07_deployment_guides/` (MinIO, allowlist registry, Deployer config, ServiceAccount, snapshot retention), `docs/08_developer_guides/` (plugin host contract, render modes, packaging), cập nhật Entity Registry docs | Architect/Dev | To Do |

## 4. Ghi Chú

- Interface `PluginRuntimeDeployer`/`TenantDatasourceService` phải chốt sớm để FEAT-21 (TASK-304) code song song.
- Ký số artifact để giai đoạn sau; Sprint 03 chỉ checksum SHA-256 (đã chốt).
- `dev` (FEAT-22) là công cụ phát triển local, không thay thế Deployer production.
- Toàn bộ thao tác đăng ký artifact/deploy phải ghi audit `PLUGIN_ARTIFACT_*`, `PLUGIN_SERVICE_*`.
