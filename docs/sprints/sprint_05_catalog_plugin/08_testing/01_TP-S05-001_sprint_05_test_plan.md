# [TP-S05-001] Kế Hoạch Kiểm Thử Sprint 05 — Plugin Danh mục

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TP-S05-001 / Test plan / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-06 |
| Owner / reviewer | QA Agent / Chưa review |
| Đầu vào | [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) (Pending), [DES-DB-S05-001](../06_designs/db/01_DES-DB-S05-001_catalog_schema.md), [DES-API-S05-001](../06_designs/api/01_DES-API-S05-001_catalog_api.md), [DES-UI-S05-001](../06_designs/ui/01_DES-UI-S05-001_catalog_admin_ui.md) |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) / TR-S05-001 (chưa tạo) |

## 1. Phạm Vi & Môi Trường

- Web `http://localhost:4200` (Desktop ≥1280px), Mobile Ionic `http://localhost:8100` (viewport 390×844).
- Backend + PostgreSQL + Redis thật (`npm run infra`, `npm run backend`) — **không H2**; ràng buộc EXCLUDE/CTE chỉ có trên PostgreSQL nên test CSDL là bắt buộc.
- Frontend không viết unit test; QA bằng trình duyệt thật (CDP headless chấp nhận nếu đo được số liệu).
- Ảnh minh chứng lưu tại `08_testing/evidence/screenshots/`.

## 2. Ma Trận Lấy Mẫu

| Chiều | Giá trị | Cách lấy mẫu |
| :--- | :--- | :--- |
| Loại danh mục | hệ thống (PROVINCE/DISTRICT/COMMUNE, INDUSTRY, JOB) + tenant (JOB_TITLE, DEPARTMENT bridge) | Đủ 3 nhóm: hệ thống, tenant, system-backed |
| Cấu trúc | TREE, DAG (2 cha khác loại quan hệ), nhảy cấp | Mỗi dạng ≥1 kịch bản |
| Thời gian | hiện tại, quá khứ (as-of), đóng hiệu lực | 3 mốc cho một mục |
| Phân quyền | có quyền module + grant; có quyền module thiếu grant; thiếu quyền module | 3 tổ hợp |
| Nền tảng | Web 1440, Mobile 390 | Đủ 2 |

## 3. Test Case Theo AC

| TC | AC | Kịch bản | Cách kiểm | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| TC-01 | AC-01 | Tạo `tỉnh→huyện`, `huyện→xã`; truy vấn con cháu tỉnh trả 2 cấp | API + browser | Not Run |
| TC-02 | AC-02 | Tạo trực tiếp `tỉnh→xã`; xã là con cấp 1; **không** sinh cạnh bắc cầu | API + DB | Not Run |
| TC-03 | AC-03 | "Lập trình viên" là con của CNTT **và** KHDL; API trả 2 cha | API + browser (chế độ Đa cha) | Not Run |
| TC-04 | AC-04 | "Công việc" ⊂ Ngành (CLASSIFICATION) + ⊂ Phân bổ (ALLOCATION); xoá 1 quan hệ không ảnh hưởng cái kia | API | Not Run |
| TC-05 | AC-05 | Tạo cạnh gây chu trình (A→B, B→A; và chu trình 3 cấp) | API (mã `CATALOG_EDGE_CYCLE`) | Not Run |
| TC-06 | AC-06 | Sửa mục 2 lần ⇒ 3 phiên bản; `as_of` mốc cũ trả nội dung cũ | API + browser (lịch sử) | Not Run |
| TC-07 | AC-07 | Tạo 2 phiên bản chồng khoảng hiệu lực | API (mã `CATALOG_ITEM_WINDOW_OVERLAP`) + DB constraint | Not Run |
| TC-08 | AC-08 | Đặt `valid_to` cho cạnh ⇒ mặc định không thấy, `as_of` quá khứ thấy | API | Not Run |
| TC-09 | AC-09 | Vai trò có `catalog:item:manage` nhưng thiếu grant ⇒ chỉ đọc + `CATALOG_TYPE_FORBIDDEN` khi ghi | API + browser | Not Run |
| TC-10 | AC-10 | Options: phân trang (20/100), lọc `q`, lọc `parent_id`, gộp tenant + hệ thống (tenant thắng) | API + browser (picker) | Not Run |
| TC-11 | AC-11 | Form lưu chỉ có `catalog_item_id` ⇒ mở lại resolve theo lô, không N+1 | Browser (network) | Not Run |
| TC-12 | AC-12 | Nhập tự do ⇒ lưu `{text}`; có quyền inline ⇒ lưu thành mục mới | Browser + API | Not Run |
| TC-13 | AC-13 | Tenant mới đăng ký ⇒ plugin ACTIVE + danh mục cố định; tenant cũ ⇒ backfill | Browser + DB | Not Run |
| TC-14 | AC-14 | Tenant admin thử gỡ plugin ⇒ bị chặn | Browser + API | Not Run |
| TC-15 | AC-15 | Hai tenant cùng mã: không rò rỉ chéo; danh mục hệ thống hiển thị cả hai | API + DB | Not Run |
| TC-16 | AC-16 | Entity Registry có 3 entity; manifest khai báo Desktop/Mobile | API + file | Not Run |
| TC-17 | AC-17 | Màn quản trị: chế độ Đa cha, danh sách cha, breadcrumb; không modal | Browser 1440 | Not Run |
| TC-18 | — | Backend: bộ test `modules/catalog` (DAG/version/chồng lấn/quyền/cách ly) | `mvn test` | Not Run |
| TC-19 | — | Mobile 390: picker + tra cứu, touch target ≥40px, overflow 0, 0 console error | Browser 390 | Not Run |
| TC-20 | AC-18 | Import CSV: tệp mẫu đúng ⇒ tạo/cập nhật theo `code` + báo cáo dòng; `dry_run` không ghi; tệp sai cột/tệp > 5.000 dòng ⇒ từ chối (`CATALOG_IMPORT_VALIDATION_FAILED`/`TOO_LARGE`) | API + browser | Not Run |
| TC-21 | AC-19 | Export CSV theo loại + tất cả (13 danh mục seed); mở bằng Excel đúng tiếng Việt (UTF-8 BOM); cột cha/con + hiệu lực đúng | API + browser | Not Run |
| TC-22 | AC-20 | Tenant tạo bản ghi cùng `code` ⇒ form hiển thị bản tenant (badge "Ghi đè"); bản `INACTIVE` cùng `code` ⇒ mục hệ thống biến mất khỏi options của tenant đó, tenant khác **không** đổi | API + browser (2 tenant) | Not Run |
| TC-23 | AC-18 | Import **`.xlsx`** (tương đương CSV): cùng kết quả như TC-20; tệp `.xlsx` hỏng/thiếu cột ⇒ từ chối `CATALOG_IMPORT_VALIDATION_FAILED`; cột `parent_code` tạo đúng quan hệ cha–con | API + browser | Not Run |
| TC-24 | AC-21 | Sau seed: `PROVINCE` có **63** mục; `COMMUNE` có xã là **con trực tiếp của tỉnh** (không qua huyện); lọc `parent_id=<tỉnh>` trả đúng xã thuộc tỉnh; `DISTRICT` không có dữ liệu | API + DB | Not Run |
| TC-25 | AC-22 | Cổng Platform: super admin thấy màn quản trị danh mục **hệ thống**, sửa/import được bản ghi hệ thống; tenant **không** thấy màn này (và API trả 403 nếu gọi) | Browser + API | Not Run |

## 4. Tiêu Chí Đạt (Exit Criteria)

- 100% TC PASS (hoặc Fail có bug riêng + mức độ).
- 0 `console.error`; overflow ngang = 0 tại 390×844.
- Mỗi TC PASS có ảnh/log; TC chưa chạy ghi `Not Run`, không suy diễn.
- Bug phát hiện phải có file item riêng trước khi đóng sprint.

## 5. Chưa Kiểm Chứng

Kế hoạch Draft; **chưa chạy TC nào** (chờ CONF-S05-001 được duyệt và code hoàn thành). Số liệu sẽ ghi tại TR-S05-001 kèm baseline/commit.

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-06 | Bản nháp 19 TC theo AC + ma trận lấy mẫu | QA Agent; chưa review |
