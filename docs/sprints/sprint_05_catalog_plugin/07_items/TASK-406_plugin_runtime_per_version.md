# [TASK-406] Runtime plugin dùng chung theo version (bỏ container mỗi tenant)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-406 / Refactor hạ tầng / Sprint 05 |
| Mức độ / trạng thái | **High** / **In Progress (dev, tested — chờ QA)** 2026-10-28 |
| Owner / reviewer | Developer / Architect + QA |
| Liên quan | [TASK-402](TASK-402_plugin_data_gateway_grpc.md), [TASK-400](TASK-400_docker_only_local_environment.md), [BUG-150](BUG-150_plugin_enable_runtime_not_ready.md) |

## 1. Mục tiêu

Vì plugin đã zero-DB và mọi dữ liệu đi qua data gateway theo tenant context, **một container chỉ cần chạy theo version plugin**, không cần một container cho mỗi tenant:

- Tenant A, B dùng `catalog@1.0.0` → chung container `openerp-plugin-catalog-1-0-0`.
- Tenant C dùng `catalog@2.0.0` → container `openerp-plugin-catalog-2-0-0`.
- Tắt/bật plugin của một tenant **không** dừng container của tenant khác.
- Chỉ xoá container khi **không còn tenant nào** dùng version đó (uninstall/upgrade).

## 2. Thay đổi

### 2.1. Deployer

- Tên container `openerp-plugin-<key>-<version>` (system scope thêm `-system`); bỏ `<tenantShort>`.
- `deploy` idempotent: container đang chạy → tái sử dụng; chỉ tạo mới khi chưa có/không chạy.
- Kubernetes: Deployment/Service theo version; `kubectl apply` idempotent.
- Env container bỏ `TENANT_ID`, `PLUGIN_SERVICE_TOKEN` (không còn tenant cố định).

### 2.2. Gateway & SDK

- Core gateway mint **service token ngắn hạn theo từng request** (`X-Plugin-Service-Token`) từ tenant context.
- SDK `TenantContext` đọc token này; `PluginDataClient` ưu tiên token request, fallback token env (container tĩnh/dev).
- Nhờ vậy một container phục vụ nhiều tenant mà vẫn giữ mTLS + token + tenant isolation.

### 2.3. Vòng đời

- Install/enable: đảm bảo container version tồn tại + healthy; gọi endpoint nội bộ `/internal/tenant/bootstrap` để seed dữ liệu tenant (types/grants/admin units) vì startup seeder không còn tenant cố định.
- Disable: chỉ đổi ledger `INACTIVE`, **không undeploy**.
- Uninstall: xoá ledger; nếu không còn tenant nào **cùng scope** dùng version → undeploy container. Scope tenant và scope system dùng hai container khác nhau (`-system`) nên không tính lẫn nhau.
- Upgrade/rollback: deploy container version đích; dọn container version cũ khi không còn tenant cùng scope dùng.

### 2.4. Dọn tài nguyên dev

- Bỏ `catalog-dev` và `catalog-e2e-dev` khỏi profile `dev` (chuyển `profile: test`), dừng container.
- Container system (`catalog-system-dev`) vẫn cần cho platform system catalog đến khi migrate sang container system theo version.

### 2.5. Ghi chú triển khai

- Tên container phải là hostname hợp lệ: version `1.0.0` được chuẩn hoá thành `1-0-0` (`openerp-plugin-catalog-1-0-0`). JDK `HttpRequest` từ chối host có dạng IPv4 không hợp lệ (`...-1.0.0`) và Kubernetes cũng không cho dấu chấm trong tên tài nguyên.
- Bootstrap tenant chạy **sau khi transaction vòng đời commit**: data gateway chỉ phục vụ ledger `ACTIVE` đã thấy schema/version đã commit. Sau commit, nếu ledger vẫn `ACTIVE` và `deploy_ref` trỏ đúng container thì gọi endpoint nội bộ; lỗi seed được log, không làm fail thao tác đã hoàn tất.


## 3. Tiêu chí nghiệm chứng

- [x] Bật catalog cho 2 tenant cùng `1.0.0`: chỉ có **1** container `openerp-plugin-catalog-1-0-0`; cả 2 gọi runtime 200.
- [x] Disable tenant A: container vẫn chạy; tenant B vẫn 200; enable lại A dùng lại container, không tạo thêm.
- [x] Uninstall A: container còn (B dùng); uninstall B: container bị xoá (chỉ tính tenant cùng scope, system tenant dùng container `-system` riêng).
- [x] Seed dữ liệu tenant đúng sau bootstrap: types/grants/admin units; tenant isolation giữ nguyên.
- [x] Không còn container `catalog-dev`/`catalog-e2e-dev` trong profile dev; tài nguyên Docker giảm.
- [x] Backend test PASS: `mvn test` 268 run / 0 fail / 1 skip (2026-10-28).
- [ ] QA browser desktop/mobile PASS (UI không đổi; API runtime đã kiểm 200, chờ QA xác nhận).

### 3.1. Bằng chứng dev (2026-10-28)

| Bước | Kết quả |
| :--- | :--- |
| Tenant `e2e-tenant` install `catalog@1.0.0` | `PLUGIN_INSTALL_SUCCESS`; container `openerp-plugin-catalog-1-0-0` healthy; runtime API 200 |
| Tenant thứ hai (ledger `cdba7d62`) enable cùng version | Dùng lại đúng container đang chạy (cùng container ID), không tạo container mới; runtime API 200 |
| Disable tenant thứ nhất | Container vẫn chạy; tenant thứ hai runtime 200; tenant bị disable trả `PLUGIN_DISABLED_FOR_TENANT` |
| Enable lại tenant thứ nhất | Dùng lại container cũ (cùng container ID) |
| Uninstall tenant thứ nhất khi tenant thứ hai còn ACTIVE | Container vẫn chạy; tenant còn lại runtime 200 |
| Uninstall tenant cuối cùng cùng scope | Container `openerp-plugin-catalog-1-0-0` bị xoá; system tenant (scope `-system`) không bị ảnh hưởng |
| Bootstrap tenant | Log plugin: `Catalog tenant seed ready ... 10 types`; `Catalog admin units ready: 34 provinces, 3321 communes` |
| Compose profile dev | Chỉ còn `backend-dev`, `web-dev`, `mobile-dev`, `catalog-system-dev`; không còn `catalog-dev`/`catalog-e2e-dev` |

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Tạo task theo yêu cầu dùng chung container theo version | Chủ dự án |
| 0.2 | 2026-10-28 | Triển khai deployer theo version, token theo request, bootstrap sau commit; sửa tên container hostname hợp lệ và ref-count theo scope; kiểm chứng dev | Developer |
