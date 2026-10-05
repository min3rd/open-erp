# BUG-94: Xung đột contract `GET /api/v1/platform/plugins` giữa Sprint 02 (FEAT-20) và P1 Sprint 03

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-94 |
| **Mức độ** | Medium |
| **Phát hiện bởi** | Dev Agent (TASK-315) |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Done (đóng 2026-10-05 theo xác nhận của chủ dự án — hồ sơ [QA-02](../08_testing/QA-02_sprint_03_requal_2026-10-05.md)) |
| **Liên quan** | FEAT-20 `PlatformPluginResource`, DES-03-API P1, TASK-303, TASK-315, PlatformPluginApiTest |

## Mô tả

`GET /api/v1/platform/plugins` đã tồn tại từ Sprint 02 (FEAT-20): trả **non-paginated** `data.items = [{key, name_key, description_key, is_core}]` (core + CSV `openerp.platform.plugin-catalog`), dùng bởi Drawer quota tenant (`platform.service.getPlugins()`).

DES-03-API P1 lại định nghĩa **cùng path** `GET /platform/plugins` là danh sách catalog **phân trang** + filter `q, release_status, visibility, platform, source`.

Hai resource cùng `@Path("/api/v1/platform/plugins")` với `@GET` gốc sẽ gây ambiguous routing nếu thêm P1 độc lập.

## Phương án xử lý (đề xuất, đã triển khai)

Giữ **một endpoint duy nhất**, mở rộng tương thích ngược hai chế độ:

1. **Legacy mode** (không có tham số truy vấn): giữ nguyên contract Sprint 02 (non-paginated, `key/is_core`) — không phá Drawer quota tenant và test FEAT-20.
2. **Paginated mode** (khi có bất kỳ `page|size|q|keyword|catalog_status`): trả khuôn mẫu **Paginated List** chuẩn với `items[].plugin_key` từ `plugin_catalog` (Sprint 03), filter `keyword` (plugin_key/name_key) + `catalog_status`.

- Quyền: giữ SUPER_ADMIN cho cả hai chế độ trong Sprint 03; `SUPPORT_ENGINEER` xem chi tiết plugin (P2) như thiết kế.
- Portal `/platform/plugins` (TASK-315) dùng paginated mode.
- Sau khi Drawer quota tenant chuyển hẳn sang catalog Sprint 03 (khi `default_install/locked` phủ hết core), legacy mode có thể gỡ ở sprint sau.

## Rủi ro còn lại

- Đường dẫn P1 trong DES-03-API không đổi, nhưng contract có 2 mode → cần reviewer xác nhận; nếu chốt bỏ legacy mode thì phải cập nhật FEAT-20 test + Drawer quota trong cùng PR.
