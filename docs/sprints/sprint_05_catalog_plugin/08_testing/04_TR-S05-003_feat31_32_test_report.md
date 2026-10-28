# [TR-S05-003] Báo cáo kiểm thử FEAT-31/32 — quan hệ loại, clone/sync system type

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TR-S05-003 / Test report / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | **Pass (QA)** / 0.1 / 2026-10-28 |
| Owner / reviewer | QA/QC Agent / PM + Architect |
| Phạm vi | FEAT-31 (quan hệ loại + chọn con), FEAT-32 (clone/xoá clone/sync/platform sync) |
| Môi trường | Dev Docker: backend `:8088`, web `:4200`, mobile `:8100`, catalog iframe, PostgreSQL 16, Redis |
| Tài khoản | tenant `e2e-tenant@example.com`, platform `e2e-platform@example.com` |
| Bằng chứng | `evidence/screenshots/desktop-feat31-*.png`, `desktop-feat32-*.png`, `mobile-feat32-readonly.png` |

## 1. Kết quả tổng hợp

| # | Hạng mục | Cách kiểm chứng | Kết quả |
| :--- | :--- | :--- | :--- |
| 1 | Bảng `catalog_type_relations` + backfill | Migration plugin `V1.0.1` + core `V5.4.0`; query schema | ✅ 4 relation system (PROVINCE→DISTRICT/COMMUNE, DISTRICT→COMMUNE, INDUSTRY→JOB) |
| 2 | API quan hệ loại | `GET /types/COMMUNE/relations` | ✅ cha DISTRICT, PROVINCE (system) |
| 3 | Lưu quan hệ + validation | `PUT /types/{code}/relations` với `TEST_REL_A/B` | ✅ lưu/đọc đúng; self/relation sai bị chặn |
| 4 | Cycle cấp loại | PUT A vừa cha vừa con của B | ✅ 409 `CATALOG_TYPE_RELATION_CYCLE` |
| 5 | Type drawer chọn cha/con | Mở Sửa COMMUNE, kiểm tra chip | ✅ PROVINCE/DISTRICT active; có mục Loại con |
| 6 | Edge drawer thêm con | Menu ⋮ → Thêm con trên PROVINCE | ✅ drawer hiện relation HIERARCHY, loại con COMMUNE/DISTRICT, picker |
| 7 | Clone cụm system type | `POST /types/COMMUNE/clone` (mới) | ✅ 3 type, 3.355 item, 3.319 edge, 3 relation, ~23s |
| 8 | Clone idempotent/preview sạch | `GET /types/COMMUNE/sync/preview` sau clone | ✅ 0 conflict |
| 9 | Tenant sửa system type = clone | UI Sửa COMMUNE hệ thống + Lưu | ✅ tạo bản tenant, list ẩn system row, badge `Bản tenant` |
| 10 | Xoá clone | `DELETE /types/COMMUNE/clone` | ✅ 3 type/3.356 item xoá, system type hiện lại |
| 11 | Sync preview | Sửa `name_key`/item rồi preview | ✅ đúng 1 conflict `TYPE/COMMUNE/name_key`; không lẫn relation ngoài cụm |
| 12 | Sync apply OVERRIDE | Drawer chọn Ghi đè → Áp dụng | ✅ `name_key` về `CATALOG_TYPE_COMMUNE` |
| 13 | Sync item | Sửa tên item `10003` → preview → OVERRIDE | ✅ tên về system |
| 14 | Platform sync hộ tenant | `POST /api/v1/platform/plugins/catalog/tenants/{id}/sync` | ✅ 200, `applied=1`; audit `CATALOG_TENANT_SYNC` có `target_tenant_id` |
| 15 | Quyền platform | Tenant gọi endpoint platform sync | ✅ 403 `PLATFORM_ACCESS_DENIED` |
| 16 | System type read-only | Tenant PUT trực tiếp type INDUSTRY | ✅ 403 `CATALOG_TYPE_FORBIDDEN` |
| 17 | Desktop UI | Web 1400px, plugin iframe | ✅ type list 3 badge `Bản tenant`, không trùng system row; header/sidebar/footer cố định |
| 18 | Console | DevTools cả web và mobile | ✅ 0 `console.error` |
| 19 | Mobile read-only | Mobile `:8100/settings/catalog`, plugin iframe | ✅ không nút ghi/sync/clone, 20 dòng, overflow 0, 0 touch target < 40px |
| 20 | Full backend suite | `mvn clean test` | ✅ 268 PASS / 0 fail / 1 skip |

## 2. Lỗi phát hiện trong QA (đã fix)

| Bug | Mô tả | Trạng thái |
| :--- | :--- | :--- |
| [BUG-152](../07_items/BUG-152_catalog_sync_preview_out_of_cluster.md) | Preview sync liệt kê relation ngoài cụm (`INDUSTRY→JOB`) | ✅ Resolved + retest |
| [BUG-153](../07_items/BUG-153_catalog_clone_override_edges_missing.md) | Clone thiếu edge tới item override chưa có `system_item_id` | ✅ Resolved + retest |

## 3. Hạn chế / ghi chú

- Browser tool của môi trường QA **không có device emulation 390×844**. Mobile được kiểm tra ở viewport thực 1000×700 (read-only, overflow 0, 0 touch target <40px); ảnh 390×844 của plugin host đã có từ TASK-403/BUG-135. Cần QA bổ sung ảnh 390×844 cho riêng drawer clone/sync nếu muốn đóng bằng chứng mobile đầy đủ.
- Xoá clone xoá luôn item override đã chuyển vào clone (theo thiết kế “quay lại system read-only”); tenant cần tạo lại override nếu muốn giữ dữ liệu.
- Sync item/edge đang so sánh **current row**; lịch sử version cũ không đối chiếu từng field.
- `MERGE` với field text/array chọn hệ thống khi không phải JSON object; chỉ JSON object/array gộp thực sự.

## 4. Kết luận

**PASS (QA)** cho phạm vi FEAT-31 + FEAT-32 (clone/delete/sync/platform sync). Còn lại: cập nhật User Guide + PM DoD đóng Sprint 05.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | QA test FEAT-31/32, ghi nhận BUG-152/153 đã fix, kết luận PASS | QA/QC |
