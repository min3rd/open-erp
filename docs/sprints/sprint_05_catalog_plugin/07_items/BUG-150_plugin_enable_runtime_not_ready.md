# [BUG-150] Bật lại plugin trả success nhưng runtime chưa sẵn sàng (503 PLUGIN_RUNTIME_UNAVAILABLE)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-150 / Bug chức năng / Sprint 05 |
| Mức độ / trạng thái | **High** / Resolved (dev) 2026-10-28 |
| Phát hiện bởi / ngày | Chủ dự án / 2026-10-28 |
| Owner / reviewer | Developer / QA |
| Liên quan | [BUG-135](BUG-135_catalog_not_independent_plugin.md), `PluginLifecycleService`, `ProcessPluginRuntimeDeployer` |

## 1. Mô tả

Tắt plugin rồi bật lại: API `POST /api/v1/tenant/plugins/catalog/enable` trả `PLUGIN_ENABLE_SUCCESS` ngay, nhưng mọi request ngay sau đó tới `/api/v1/plugins/runtime/catalog/...` trả `503 PLUGIN_RUNTIME_UNAVAILABLE`. Sau ~16–26 giây (Quarkus + seeder khởi động) runtime mới phục vụ được. Trước đó plugin còn ghi log `PLUGIN_DATA_GATEWAY_UNAVAILABLE` trong lần seed đầu.

## 2. Nguyên nhân

- `ProcessPluginRuntimeDeployer.health()` với Docker chỉ kiểm tra `docker inspect .State.Running` — container đang chạy nhưng Quarkus chưa listen cổng 8080.
- `simpleTransition(ENABLE)` coi health = running nên ghi ledger `ACTIVE` và trả success trước khi plugin sẵn sàng; gateway dial ngay → `IOException` → 503.
- Lần seed đầu của plugin gọi data gateway khi backend chưa sẵn sàng nên log `PLUGIN_DATA_GATEWAY_UNAVAILABLE` (đã có retry, tự khỏi).

## 3. Hướng sửa

- Docker health: poll `docker exec <container> wget -qO- http://127.0.0.1:8080/q/health/ready` tới khi `status = UP` hoặc hết `openerp.plugin.deployer.timeout-seconds` (mặc định 90s).
- Health chỉ trả `healthy` khi runtime thực sự phục vụ, nên install/enable/upgrade đều chờ đúng thời điểm.

## 4. Kiểm chứng

- [x] Disable → enable: API trả success sau khi plugin ready; request runtime ngay sau đó trả 200, không còn 503.
- [x] Plugin không lên được (image lỗi) → enable trả `PLUGIN_SERVICE_UNHEALTHY` thay vì success giả.
- [x] Install/upgrade vẫn PASS; full backend test PASS.

**Kết quả dev (2026-10-28):** disable 2s → INACTIVE; enable 23s → ACTIVE; gọi `/api/v1/plugins/runtime/catalog/api/v1/catalog/types` ngay sau enable trả `200 CATALOG_TYPE_FETCH_SUCCESS` (10 type). Full backend test 268 PASS / 0 fail / 1 skip.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Tạo bug sau khi tái hiện disable → enable | Chủ dự án báo lỗi |
| 0.2 | 2026-10-28 | Health Docker poll `/q/health/ready`; enable chỉ success khi runtime phục vụ; QA API pass | Developer |
