# [DES-API-S05-001] Thiết kế API plugin Danh mục (quản trị + lookup cho form động)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-API-S05-001 / Thiết kế API / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-06 |
| Owner / reviewer | Solution Architect / Chưa review |
| Đầu vào | [SOL-S05-001](../../05_solutions/01_SOL-S05-001_catalog_plugin_architecture.md) (D9–D13), [DES-DB-S05-001](../db/01_DES-DB-S05-001_catalog_schema.md) |
| Đọc trước / đọc tiếp | DES-DB-S05-001 / [DES-UI-S05-001](../ui/01_DES-UI-S05-001_catalog_admin_ui.md) |

## 1. Nguyên tắc chung

- Đúng 4 khuôn mẫu phản hồi của dự án; mọi response có `code` UPPER_SNAKE_CASE; **không** message tiếng Việt trong payload (FE dịch theo `code` + `params`).
- `tenant_id` **không bao giờ** nhận từ client — lấy từ security context.
- Mọi API đọc nhận `as_of` (ISO-8601, mặc định `now()`).
- Danh mục hệ thống chỉ đọc với tenant; ghi loại hệ thống cần quyền `catalog:system:manage` (platform).

## 2. Nhóm A — Quản trị loại danh mục & phân quyền

| Method | Path | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| GET | `/api/v1/catalog/types` | `catalog:item:read` | Danh sách loại (hệ thống + tenant) — non-paginated `data.items[]` |
| POST | `/api/v1/catalog/types` | `catalog:type:manage` | Tạo loại tenant (mã, nhãn i18n, mode TREE/DAG, cho nhập tự do, schema thuộc tính) |
| PUT | `/api/v1/catalog/types/{id}` | `catalog:type:manage` | Sửa loại tenant (không đổi `code`) |
| GET | `/api/v1/catalog/types/{code}/grants` | `catalog:type:manage` | Quyền theo vai trò cho loại |
| PUT | `/api/v1/catalog/types/{code}/grants` | `catalog:type:manage` | Ghi đè danh sách grant `{role_id, can_read, can_write}` |

## 3. Nhóm B — Quản trị bản ghi & quan hệ

| Method | Path | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| GET | `/api/v1/catalog/types/{code}/items` | `catalog:item:read` + grant `can_read` | **Paginated**: `q`, `parent_id`, `relation_type`, `as_of`, `status`, `page`, `size` |
| POST | `/api/v1/catalog/types/{code}/items` | `catalog:item:manage` + `can_write` | Tạo bản ghi (v1) |
| GET | `/api/v1/catalog/items/{id}` | `catalog:item:read` | Chi tiết bản ghi (kèm `parents[]`, `children[]` khi `?with_relations=true`) |
| PUT | `/api/v1/catalog/items/{id}` | `catalog:item:manage` + `can_write` | **Sửa ⇒ tạo phiên bản mới**, đóng bản cũ |
| DELETE | `/api/v1/catalog/items/{id}` | `catalog:item:manage` + `can_write` | **Đóng hiệu lực** (`valid_to = now()`), không xoá cứng |
| GET | `/api/v1/catalog/items/{id}/versions` | `catalog:item:read` | Lịch sử phiên bản (mới nhất trước) |
| GET | `/api/v1/catalog/items/{id}/parents` | `catalog:item:read` | Danh sách cha (đa cha) kèm `relation_type`, hiệu lực |
| GET | `/api/v1/catalog/items/{id}/descendants` | `catalog:item:read` | Con cháu (recursive CTE) — `?depth=` |
| POST | `/api/v1/catalog/edges` | `catalog:item:manage` + `can_write` | Tạo quan hệ `{parent_item_id, child_item_id, relation_type, sort_order}`; từ chối chu trình |
| DELETE | `/api/v1/catalog/edges/{id}` | `catalog:item:manage` + `can_write` | Đóng hiệu lực quan hệ |

## 4. Nhóm C — Lookup cho **form động** (lazy, mọi người dùng có quyền đọc)

| Method | Path | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| GET | `/api/v1/catalog/lookup/types` | đăng nhập | Loại dùng được cho form (schema renderer) — `data.items[]` |
| GET | `/api/v1/catalog/lookup/{typeCode}/options` | `catalog:item:read` | **Paginated** options: `q`, `parent_id`, `as_of`, `page`, `size` (mặc định 20, tối đa 100) |
| POST | `/api/v1/catalog/lookup/{typeCode}/resolve` | `catalog:item:read` | Resolve theo lô `{ids: []}` → item (không N+1) |
| GET | `/api/v1/catalog/lookup/{typeCode}/path` | `catalog:item:read` | Tổ tiên/breadcrumb của một mục (`?id=`) |
| POST | `/api/v1/catalog/lookup/{typeCode}/inline` | `catalog:item:inline-create` | Tạo nhanh từ nhập tự do `{name, code?}` → item mới (chống trùng theo `code`/`name`) |

### 4.1. Nhóm D — Import / Export (khách chốt Q7: trong phạm vi Sprint 5)

| Method | Path | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| POST | `/api/v1/catalog/types/{code}/import` | `catalog:item:manage` + `can_write` | Upload **CSV hoặc `.xlsx`** (multipart), `?dry_run=true` để kiểm tra trước; cột `parent_code` tuỳ chọn để tạo quan hệ cha–con; validate **toàn tệp** rồi mới ghi; trả báo cáo `created/updated/skipped/edges_created/errors[{row, code, params}]` |
| GET | `/api/v1/catalog/types/{code}/import/template` | `catalog:item:read` | Tải tệp mẫu CSV (UTF-8 BOM) đúng cột cho loại đó |
| GET | `/api/v1/catalog/export` | `catalog:item:read` | Xuất CSV: `?type_code=` (hoặc `all=true`), `as_of`, kèm cột cha/con + hiệu lực + trạng thái |

Quy tắc: tối đa **20.000 dòng**/lần import (cấu hình được; vượt ⇒ `CATALOG_IMPORT_TOO_LARGE`); mã `code` là khoá khớp (có ⇒ cập nhật tạo phiên bản mới, chưa có ⇒ tạo); `parent_code` (nếu có) tạo cạnh cha–con sau khi tạo item, **kiểm tra chu trình** như API thường; lỗi theo dòng **không** chặn các dòng hợp lệ nhưng báo cáo đầy đủ; export dùng cùng bộ lọc với danh sách. **`.xlsx`** đọc bằng Apache POI ở backend (ngoại lệ thư viện — SOL D19, chốt tại N7).

## 5. Contract mẫu

**5.1 Schema cho form renderer** — `GET /catalog/lookup/types` (non-paginated)
```json
{
  "success": true, "code": "CATALOG_LOOKUP_TYPES_SUCCESS", "message": null, "params": null,
  "data": { "items": [
    { "code": "JOB_TITLE", "name_key": "CATALOG_TYPE_JOB_TITLE", "allow_free_text": true,
      "hierarchy_mode": "DAG", "parent_type_code": null, "multiple": false,
      "attributes_schema": { "fields": [ { "key": "level", "label_key": "CATALOG_FIELD_LEVEL", "type": "NUMBER" } ] } }
  ] }
}
```

**5.2 Options (lazy)** — `GET /catalog/lookup/JOB_TITLE/options?q=ke&page=0&size=20`
```json
{
  "success": true, "code": "CATALOG_LOOKUP_OPTIONS_SUCCESS", "message": null, "params": null,
  "data": { "items": [ { "id": "…", "code": "KE_TOAN", "name": "Kế toán", "is_system": false, "has_children": false } ],
            "page": 0, "size": 20, "total_items": 3, "total_pages": 1 }
}
```

**5.3 Giá trị trường danh mục trong form (model dùng chung Web/Mobile)**
```json
{ "catalog_item_id": "8f2c…|null", "text": "Kế toán trưởng" }
```
Quy tắc: chọn từ danh mục ⇒ có `catalog_item_id` và `text` (tên tại thời điểm chọn); nhập tự do ⇒ chỉ `text`; tối thiểu một trong hai.

**5.4 Tạo quan hệ (đa cha)** — `POST /catalog/edges`
```json
{ "parent_item_id": "…", "child_item_id": "…", "relation_type": "CLASSIFICATION", "sort_order": 0 }
```
Thành công: `201` + `code = CATALOG_EDGE_CREATED_SUCCESS`. Chu trình: `400` + `code = CATALOG_EDGE_CYCLE`.
Trùng cạnh còn hiệu lực: `409` + `code = CATALOG_EDGE_DUPLICATE`.

**5.5 Sửa bản ghi (tạo phiên bản)** — `PUT /catalog/items/{id}`
```json
{ "name": "Phòng Công nghệ thông tin", "attributes": { "level": 3 } }
```
Trả về phiên bản **mới** (`version = n+1`, `valid_from = now()`); bản cũ có `valid_to = now()`.
Chồng lấn hiệu lực: `409` + `code = CATALOG_ITEM_WINDOW_OVERLAP`.

## 6. Mã lỗi / mã thành công (enum dùng chung)

| Nhóm | Mã |
| :--- | :--- |
| Loại | `CATALOG_TYPE_FETCH_SUCCESS`, `CATALOG_TYPE_CREATED_SUCCESS`, `CATALOG_TYPE_UPDATED_SUCCESS`, `CATALOG_TYPE_NOT_FOUND`, `CATALOG_TYPE_CODE_EXISTS`, `CATALOG_TYPE_FORBIDDEN` |
| Bản ghi | `CATALOG_ITEM_FETCH_SUCCESS`, `CATALOG_ITEM_CREATED_SUCCESS`, `CATALOG_ITEM_UPDATED_SUCCESS`, `CATALOG_ITEM_CLOSED_SUCCESS`, `CATALOG_ITEM_NOT_FOUND`, `CATALOG_ITEM_CODE_EXISTS`, `CATALOG_ITEM_WINDOW_OVERLAP` |
| Quan hệ | `CATALOG_EDGE_CREATED_SUCCESS`, `CATALOG_EDGE_CLOSED_SUCCESS`, `CATALOG_EDGE_CYCLE`, `CATALOG_EDGE_DUPLICATE`, `CATALOG_EDGE_NOT_FOUND`, `CATALOG_EDGE_SELF_REFERENCE` |
| Quyền theo loại | `CATALOG_GRANT_FETCH_SUCCESS`, `CATALOG_GRANT_UPDATED_SUCCESS` |
| Lookup | `CATALOG_LOOKUP_TYPES_SUCCESS`, `CATALOG_LOOKUP_OPTIONS_SUCCESS`, `CATALOG_LOOKUP_RESOLVE_SUCCESS`, `CATALOG_LOOKUP_INLINE_SUCCESS`, `CATALOG_LOOKUP_INLINE_DUPLICATE` |
| Import/Export | `CATALOG_IMPORT_SUCCESS`, `CATALOG_IMPORT_VALIDATION_FAILED`, `CATALOG_IMPORT_TOO_LARGE`, `CATALOG_IMPORT_TEMPLATE_SUCCESS`, `CATALOG_EXPORT_SUCCESS` |

Mọi mã trên phải có key i18n tương ứng ở **13 locale** của app dùng (web; mobile dùng tập con).

## 7. Truy vết AC

| AC | Endpoint |
| :--- | :--- |
| AC-01…AC-04 | `GET /items/{id}/descendants`, `GET /items/{id}/parents`, `POST /edges` |
| AC-05 | `POST /edges` (mã `CATALOG_EDGE_CYCLE`) |
| AC-06, AC-08 | `PUT /items/{id}`, `GET /items/{id}/versions`, tham số `as_of` |
| AC-07 | `PUT /items/{id}` (`CATALOG_ITEM_WINDOW_OVERLAP`) |
| AC-09 | `GET /types/{code}/grants`, `PUT …/grants`, lỗi `CATALOG_TYPE_FORBIDDEN` |
| AC-10, AC-11 | `GET /lookup/{typeCode}/options`, `POST /lookup/{typeCode}/resolve` |
| AC-12 | `POST /lookup/{typeCode}/inline` |
| AC-18 | `POST /types/{code}/import` (+ `dry_run`, báo cáo theo dòng) |
| AC-19 | `GET /export` (+ `/import/template`) |
| AC-20 | Quy tắc hợp nhất tenant thắng ở options + bản ghi tenant cùng `code` |
| AC-15 | Mọi endpoint lấy tenant từ context |

## 8. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-06 | Bản nháp 3 nhóm API + contract + mã lỗi | Architect; chưa review |
