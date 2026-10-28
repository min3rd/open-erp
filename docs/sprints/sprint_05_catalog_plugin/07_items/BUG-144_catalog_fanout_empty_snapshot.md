# [BUG-144] Fan-out system catalog áp snapshot rỗng

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-144 / Bug chức năng / Sprint 05 |
| Mức độ / trạng thái | **High** / Resolved (dev) 2026-10-28 |
| Phát hiện bởi / ngày | Developer (khi kiểm chứng P4.1) / 2026-10-28 |
| Owner / reviewer | Developer / QA |
| Liên quan | [TASK-402](TASK-402_plugin_data_gateway_grpc.md), `PluginFanoutService`, `SystemCatalogSyncResource` |

## 1. Mô tả

Gọi `POST /api/v1/platform/plugins/catalog/fanout` trả `SYNCED` cho mọi tenant nhưng counts luôn `{types: 0, items: 0, edges: 0}`. Thay đổi system catalog của platform không bao giờ tới schema tenant.

## 2. Nguyên nhân

`PluginFanoutService` gửi nguyên envelope `{success, code, data}` lấy từ endpoint snapshot sang endpoint `/sync`; endpoint `/sync` đọc trực tiếp các mảng `types/items/edges` ở root nên thấy rỗng. Lỗi bị che vì sync vẫn trả 200 với counts 0.

## 3. Hướng sửa

- `PluginFanoutService` lấy `snapshot = response.path("data")` trước khi fan-out.
- Fail-fast `502 PLUGIN_RUNTIME_UNAVAILABLE` nếu response không có `types`.
- Thêm kiểm chứng e2e: fan-out trả `types=5, items=3355, edges=3321, skipped=0` cho 2 tenant đang active.

## 4. Kiểm chứng

- Fan-out qua core: 2 tenant `SYNCED` với counts đầy đủ; 1 tenant rác không có deployment ref bị `FAILED` (ngoài phạm vi).
- Gọi trực tiếp snapshot + sync trên container system/tenant trả cùng counts.
- Xoá 600 commune + edge ở tenant e2e rồi restart: seeder tạo lại đủ `3321/3321`.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Tạo bug; bóc `data` khỏi envelope, fail-fast snapshot thiếu dữ liệu; fan-out e2e PASS | Developer phát hiện khi QA P4.1 |
