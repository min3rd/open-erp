# Bằng chứng kiểm thử Sprint 05 — Danh mục (TASK-389)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | EVD-S05-001 / Evidence index / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | Draft — thêm evidence zero-DB/mTLS + mobile plugin host + merge override/enable readiness / 0.7 / 2026-10-28 |
| Owner / reviewer | QA/QC Agent / PM + Architect |
| Đầu vào | [TP-S05-001](../01_TP-S05-001_sprint_05_test_plan.md) (25 TC), [UG-S05-001](../../../../06_user_guides/sprint_05_catalog_plugin_user_guide.md) |

Ảnh chụp lưu tại `evidence/screenshots/`; mỗi ảnh gắn với TC tương ứng trong test plan. Báo cáo kết quả ở `02_TR-S05-001_sprint_05_test_report.md`.

## 0. P4 — Plugin iframe bundle (2026-10-27)

| Ảnh | Nội dung | Trạng thái |
| :--- | :--- | :--- |
| `plugin-iframe-catalog.png` | Màn danh mục render trong iframe plugin tại `/apps/catalog`: cột loại, bảng bản ghi, badge `HỆ THỐNG`/`GHI ĐÈ`, nút thêm/sửa | ✅ Dev (browser, tenant `e2e-tenant`; API types/items 200) |
| `desktop-native-catalog-context-menu.png` | **Native route** `/settings/catalog` (không iframe), full màn hình; loại + bản ghi có nút `Thao tác khác` (context menu), URL path-state `/settings/catalog/DISTRICT/-/20/1/-/list?view=list` | ⚠️ Lịch sử — thay bởi host động 0.1 |

## 0.1. P4.1 — UI Manifest + host động (2026-10-27)

| Hạng mục | Cách kiểm chứng | Kết quả |
| :--- | :--- | :--- |
| Menu plugin từ manifest | `/api/v1/plugins/ui-manifest` → screen `/apps/catalog`; settings menu render link `Danh mục` (không hardcode) | ✅ Browser tenant `e2e-tenant` |
| Host động | `/settings/apps/catalog` mount `PluginScreenHostComponent` trong core settings layout; iframe full vùng nội dung; API types/items 200 | ✅ Browser |
| Điều kiện ACTIVE | Disable catalog → manifest `screens: 0`, menu mất; enable → `screens: 2`, container mới healthy | ✅ Browser + Docker |
| Route-state | Click `Quận/Huyện` → core URL `/settings/apps/catalog/DISTRICT/-/20/1/-/list?view=list`; iframe hash khớp; reload giữ đúng loại | ✅ Browser |
| Context menu | Nút `⋮` và chuột phải trên loại/bản ghi mở menu `Sửa/Quyền/Bản ghi/Thêm bản ghi` | ✅ Browser |
| Core không import UI plugin | `grep @catalog-plugin` trong `src/frontend/web` = 0; `npm run web:build` PASS | ✅ Build |

## 0.2. P5 — Zero-DB, mTLS, mobile plugin host (2026-10-28)

| Ảnh / bằng chứng | Nội dung | Trạng thái |
| :--- | :--- | :--- |
| `desktop-plugin-catalog.png` | Web `/settings/apps/catalog`: menu từ manifest, iframe plugin, 20 dòng, nút `Nhập/Xuất`, `Thêm loại`, `Thêm bản ghi`; overflow 0; 0 console error | ✅ Browser tenant `e2e-tenant` |
| `mobile-plugin-390x844.png` | Mobile 390×844 qua iframe: plugin UI read-only, type list + bản ghi, không nút ghi/menu hành động, touch ≥ 40px, overflow 0, 0 console error | ✅ Browser (QA frame 390×844) |
| gRPC mTLS | `grpcurl -plaintext` fail; tenant cert OK; tenant cert + SYSTEM scope → `PLUGIN_DATA_MTLS_IDENTITY_MISMATCH`; system cert + SYSTEM scope → rows | ✅ Terminal |
| Zero DB | `docker inspect` plugin không có `QUARKUS_DATASOURCE_*`/`QUARKUS_FLYWAY_*`; `public` không còn `catalog_*`; legacy `/api/v1/catalog/**` → 404 | ✅ Docker/SQL/HTTP |
| Core migration | `PluginSchemaBootstrap` apply `V1.0.0` cho 4 schema, log `Plugin migrations: catalog@1.0.0 applied 1 migration(s)` | ✅ Backend log |
| Fan-out | 2 tenant `SYNCED`: `types=5, items=3355, edges=3321, skipped=0` | ✅ Platform API |

## 0.3. BUG-149/150 — merge override + enable readiness (2026-10-28)

| Ảnh / bằng chứng | Nội dung | Trạng thái |
| :--- | :--- | :--- |
| `desktop-catalog-merged-override-10003.png` | COMMUNE lọc `10003`: chỉ 1 dòng `Xã Tây Phương (tenant)` + badge `GHI ĐÈ`; header/sidebar/pagination cố định | ✅ Browser tenant `e2e-tenant` |
| Merge API | `q=10003` → 1 item `overridden=true`, `is_system=false`; không còn dòng system cùng mã | ✅ HTTP |
| Enable readiness | disable 2s → INACTIVE; enable 23s → ACTIVE chờ `/q/health/ready`; request runtime ngay sau enable 200 | ✅ HTTP + Docker |

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
