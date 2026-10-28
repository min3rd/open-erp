# [TR-S05-004] Báo cáo kiểm thử TASK-404 + TASK-406 — quan hệ cha/con & runtime dùng chung theo version

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TR-S05-004 / Test report / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | **Pass (QA)** / 0.1 / 2026-10-29 |
| Owner / reviewer | QA/QC Agent / PM + Architect |
| Phạm vi | TASK-404 (workspace quan hệ trong item drawer), TASK-406 (1 container/version dùng chung nhiều tenant) |
| Môi trường | Dev Docker: backend `:8088`, web `:4200`, mobile `:8100`, catalog bound qua shared container `openerp-plugin-catalog-1-0-0`; PostgreSQL 16 + Redis thật |
| Tài khoản | tenant `e2e-tenant@example.com`; tenant thứ hai dùng ledger `cdba7d62` (tài khoản QA tạm, đã disable sau test) |
| Bằng chứng | `evidence/screenshots/desktop-task406-catalog.jpg`, `desktop-task404-relations.jpg`, `mobile-task404-catalog-390x844.png` |
| Commit kiểm thử | `a51d2abe` |

## 1. Kết quả tổng hợp

### 1.1. TASK-406 — runtime dùng chung theo version

| # | Hạng mục | Cách kiểm chứng | Kết quả |
| :--- | :--- | :--- | :--- |
| 1 | Hai tenant cùng `catalog@1.0.0` dùng chung container | Install tenant A, install tenant B; `docker ps` + runtime API | ✅ Chỉ `openerp-plugin-catalog-1-0-0` (ID `47197af871a0`); cả hai runtime `200` |
| 2 | Enable tenant thứ hai không tạo container mới | So sánh container ID trước/sau install | ✅ Cùng ID, không có container `tenantShort` |
| 3 | Disable tenant A không ảnh hưởng tenant B | Disable A → `docker ps` + runtime B | ✅ Container vẫn chạy; B runtime `200`; A trả `PLUGIN_DISABLED_FOR_TENANT` |
| 4 | Enable lại tenant A tái sử dụng container | Enable A → container ID + runtime | ✅ Cùng ID `47197af871a0`; runtime `200` |
| 5 | Uninstall tenant B khi tenant A còn ACTIVE | Uninstall B → `docker ps` + runtime A | ✅ Container vẫn chạy; A runtime `200` |
| 6 | Chỉ xoá container khi hết tenant cùng scope | Dev evidence TASK-406 §3.1 + đọc logic `countOtherTenantsOnVersion` (scope tenant/system tách biệt) | ✅ Tenant cuối cùng bị uninstall → container xoá; system tenant dùng `-system` không tính lẫn |
| 7 | Bootstrap tenant sau install/enable | Log plugin container + dữ liệu tenant | ✅ `10 types`, `34 provinces`, `3321 communes`; grants/types đúng tenant |
| 8 | Không còn container test trong profile dev | `docker compose --profile dev config --services` | ✅ Không còn `catalog-dev`/`catalog-e2e-dev`; chỉ `backend-dev`, `web-dev`, `mobile-dev`, `catalog-system-dev` |
| 9 | Backend regression | `mvn -f src/backend/pom.xml test` trên commit `a51d2abe` | ✅ **268 run / 0 fail / 1 skip** |

### 1.2. TASK-404 — workspace quan hệ cha/con trong item drawer

| # | Hạng mục | Cách kiểm chứng | Kết quả |
| :--- | :--- | :--- | :--- |
| 10 | Tab quan hệ trong drawer sửa | Mở bản ghi Hà Nội → Sửa → tab `Phân cấp` | ✅ Có tab `Thông tin` + `Phân cấp`; vùng **CHA** và **CON** tách biệt |
| 11 | Nhóm con theo `Quan hệ · Loại con` | Kiểm tra header nhóm | ✅ `Phân cấp · COMMUNE (126)`, `Phân cấp · DISTRICT (0)`; có badge số lượng |
| 12 | Collapse + phân trang nhóm | Thu gọn/mở nhóm, chuyển trang | ✅ Toggle đóng/mở; bảng 10 dòng/nhóm; `Trang 1/13` |
| 13 | Tạo nhanh bản ghi con | `+ Tạo nhanh` → mã `QA406T`, tên `Phường QA406` | ✅ Nhóm tăng `126 → 127`, dòng mới xuất hiện tại chỗ |
| 14 | Không đóng drawer / không mất dữ liệu form | Đổi tên bản ghi thành `Thành phố Hà Nội QA406` (chưa lưu) → tạo nhanh con → quay lại tab Thông tin | ✅ Drawer vẫn mở; tên vẫn `Thành phố Hà Nội QA406` |
| 15 | Gỡ quan hệ + dọn dữ liệu QA | `Gỡ quan hệ` dòng QA406T; API đóng bản ghi QA | ✅ Nhóm về `126`; bản ghi QA đóng hiệu lực, không còn trong danh sách hiện hành |
| 16 | i18n đủ 13 locale | `node scripts/check-i18n-parity.mjs` | ✅ Web 1202 keys + Mobile 555 keys: 13/13 locale 100%, 0 missing |
| 17 | Desktop UI + console | Web 1446×894, plugin iframe `/settings/apps/catalog` | ✅ Render đúng; **0 `console.error`**; ảnh `desktop-task406-catalog.jpg`, `desktop-task404-relations.jpg` |
| 18 | Mobile read-only 390×844 | Chromium headless (Playwright), viewport 390×844, `isMobile`/`hasTouch` | ✅ URL plugin có `readonly=1`; **0 nút ghi** (Thêm/Sửa/Tạo/Gỡ/Lưu); overflow ngang `0`; **0 console error**; ảnh `mobile-task404-catalog-390x844.png` |
| 19 | Touch target mobile | Đo toàn bộ phần tử tương tác trong iframe | ✅ 24 target, tất cả cao ≥ 40px; 2 chip `API`/`Cây` rộng 29–30px (ghi chú, không chặn) |

## 2. Lỗi phát hiện

Không có lỗi mức Critical/High/Medium. Không tạo bug mới.

## 3. Hạn chế / ghi chú

- Mobile được kiểm bằng **Chromium headless Playwright 1.49** với viewport thật `390×844`, `isMobile` + `hasTouch`; không kiểm haptic/safe-area trên thiết bị thật. Ảnh full-page đã lưu.
- Hai chip chuyển chế độ xem `API`/`Cây` có bề rộng 29–30px (chiều cao 40px). Nếu muốn tuyệt đối ≥40px cả hai chiều, có thể thêm `min-w-10`; hiện không ảnh hưởng thao tác.
- Dữ liệu QA tạo trong lúc test (`QA406T`, tên tạm `Thành phố Hà Nội QA406`) đã được gỡ/đóng; tài khoản tenant thứ hai đã disable và xoá membership.
- Container `openerp-plugin-catalog-1-0-0` đang phục vụ `e2e-tenant` + tenant `minhvv` (cùng version); `catalog-system-dev` vẫn giữ cho platform scope.

## 4. Kết luận

**PASS (QA)** cho TASK-404 và TASK-406 trên commit `a51d2abe`. Đủ điều kiện cập nhật hai task sang **Done (QA)**; Sprint 05 tiếp tục theo dõi DoD/các bug còn lại.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | QA TASK-404 + TASK-406: desktop/mobile, API lifecycle, i18n, backend suite; kết luận PASS | QA/QC |
