# Bằng chứng kiểm thử Sprint 05 — Danh mục (TASK-389)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | EVD-S05-001 / Evidence index / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | Draft — thêm ảnh P4 iframe / 0.4 / 2026-10-27 |
| Owner / reviewer | QA/QC Agent / PM + Architect |
| Đầu vào | [TP-S05-001](../01_TP-S05-001_sprint_05_test_plan.md) (25 TC), [UG-S05-001](../../../../06_user_guides/sprint_05_catalog_plugin_user_guide.md) |

Ảnh chụp lưu tại `evidence/screenshots/`; mỗi ảnh gắn với TC tương ứng trong test plan. Báo cáo kết quả ở `02_TR-S05-001_sprint_05_test_report.md`.

## 0. P4 — Plugin iframe bundle (2026-10-27)

| Ảnh | Nội dung | Trạng thái |
| :--- | :--- | :--- |
| `plugin-iframe-catalog.png` | Màn danh mục render trong iframe plugin tại `/apps/catalog`: cột loại, bảng bản ghi, badge `HỆ THỐNG`/`GHI ĐÈ`, nút thêm/sửa | ✅ Dev (browser, tenant `e2e-tenant`; API types/items 200) |
| `desktop-native-catalog-context-menu.png` | **Native route** `/settings/catalog` (không iframe), full màn hình; loại + bản ghi có nút `Thao tác khác` (context menu), URL path-state `/settings/catalog/DISTRICT/-/20/1/-/list?view=list` | ✅ Dev (browser, tenant `e2e-tenant`; click type + menu PASS) |

## 1. Desktop (≥1280px)

| # | Ảnh dự kiến | TC | Nội dung cần thấy |
| :--- | :--- | :--- | :--- |
| 1 | `desktop-catalog-3col.png` | TC-01, TC-15 | Màn 3 cột: loại (trái) — bản ghi (giữa) — chi tiết (phải), mật độ cao, viền vuông |
| 2 | `desktop-type-drawer.png` | TC-01 | Drawer tạo/sửa loại (mode TREE/DAG/FLAT, quan hệ cho phép, loại cha, schema thuộc tính) |
| 3 | `desktop-item-version-history.png` | TC-04, TC-05 | Drawer sửa bản ghi + cảnh báo "tạo phiên bản mới" và lịch sử phiên bản ở cột phải |
| 4 | `desktop-edge-drawer.png` | TC-06, TC-07 | Drawer thêm quan hệ dùng picker chọn cha; lỗi chu trình hiển thị inline |
| 5 | `desktop-multi-parent.png` | TC-08 | Mục có nhiều cha (DAG) + breadcrumb theo đường đang chọn |
| 6 | `desktop-grants-matrix.png` | TC-09, TC-10 | Ma trận quyền vai trò × đọc/ghi; trạng thái chỉ đọc khi thiếu quyền ghi |
| 7 | `desktop-free-text-inline-save.png` | TC-11, TC-12 | Ô picker với giá trị tự do + nút "Lưu vào danh mục" |
| 8 | `desktop-import-dry-run.png` | TC-20, TC-23 | Drawer Import: kết quả kiểm tra trước theo dòng (tạo/cập nhật/bỏ qua/lỗi) |
| 9 | `desktop-import-report.png` | TC-20 | Báo cáo sau khi ghi + số quan hệ cha–con đã tạo |
| 10 | `desktop-tenant-override.png` | TC-22 | Badge "Ghi đè" trên bản ghi tenant cùng mã với mục hệ thống |
| 11 | `desktop-platform-system-catalog.png` | TC-25 | Màn quản trị danh mục **hệ thống** ở cổng Platform |
| 12 | `desktop-dark-theme.png` | TC-19 | Giao diện chế độ tối của màn danh mục |
| 13 | `desktop-provinces-communes.png` | TC-24 | Loại `PROVINCE` (34 mục) và `COMMUNE` lọc theo tỉnh (xã là con trực tiếp) — xác minh qua API/DB; ảnh UI dùng chung với ảnh #1 |
| 13b | `desktop-catalog-1400px.png` | TC-17 | Màn 3 cột ở viewport thật **1400×900** (≥1280px) — cột rộng, không wrap |
| 13c | `desktop-catalog-two-column.png` | TC-02, TC-08 | **Khung 2 cột** sau điều chỉnh §2.1 #1 — không cột chi tiết trống khi chưa chọn bản ghi; bảng chiếm hết bề rộng còn lại, nút **API** cạnh tên loại |
| 13d | `desktop-item-detail-drawer.png` | TC-02, TC-08 | **Drawer chi tiết** phải (mở khi bấm hàng): thông tin, thuộc tính, cha/con — **danh sách con phân trang 10/trang** (Hà Nội: 126 con ⇒ 13 trang), lịch sử phiên bản read-only |
| 13e | `desktop-catalog-api-panel.png` | — | **Panel "API"** của loại `PROVINCE`: endpoint options + phản hồi mẫu, inline (kèm quyền), resolve, path, ghi chú mode, shape giá trị form; nút **Sao chép** mỗi đoạn |

## 2. Mobile (Ionic, 390×844)

| # | Ảnh dự kiến | TC | Nội dung cần thấy |
| :--- | :--- | :--- | :--- |
| 14 | `mobile-catalog-browse.png` | TC-16 | Trang tra cứu read-only (không nút sửa/xoá), không tràn ngang |
| 15 | `mobile-catalog-detail.png` | TC-16 | Panel chi tiết inline + breadcrumb |
| 16 | `mobile-menu-entry.png` | TC-16 | Mục "Danh mục" trong menu điều hướng (drawer dùng chung) |
| 17 | `mobile-picker-in-form.png` | TC-12 | Ô chọn danh mục trong form (touch ≥40px) — chờ bổ sung |
| 18 | `mobile-390x844.png` | TC-17 | Trang Mobile ở viewport thật **390×844**: không tràn ngang, 23/23 touch target ≥40px |

## 3. Ghi chú kiểm chứng phi giao diện

| Hạng mục | Cách kiểm chứng | Kết quả |
| :--- | :--- | :--- |
| 0 lỗi console | DevTools console ở cả hai chế độ | ✅ web (0 error sau khi mở khung 2 cột, drawer chi tiết, panel API); mobile xem TR-S05-001 |
| API tenant không thấy dữ liệu tenant khác | Test `TenantIsolationOrgTest` + bộ catalog (đã xanh) | ✅ (test) |
| Ghi vào danh mục hệ thống bị chặn | `CatalogTypeApiTest` + platform guard test | ✅ (test) |
| EXCLUDE chặn chồng lấn hiệu lực | `CatalogRepositoryPostgresTest` (`23P01`) | ✅ (test) |
| Giới hạn import cấu hình được | `CatalogImportMaxRowsApiTest` | ✅ (test) |
| Toàn bộ suite backend | `npm run backend:test` | ⏳ (đang chạy) |
