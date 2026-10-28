# [TR-S05-001] Báo Cáo Kiểm Thử Sprint 05 — Plugin Danh Mục

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TR-S05-001 / Test Report / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | Draft — QA đã chạy trên môi trường dev / 0.1 / 2026-10-06 |
| Owner / reviewer | QA/QC Agent / PM + Architect |
| Baseline mã nguồn | `fde4f03` (backend) + `f6b5131`, `503029c`, `050a3bc` (frontend) + `d507e07` (sửa lỗi QA) |
| Đầu vào | [TP-S05-001](../08_testing/01_TP-S05-001_sprint_05_test_plan.md) (25 TC), [EVD-S05-001](../08_testing/evidence/00_EVD-S05-001_evidence_index.md) |
| Môi trường | Backend Quarkus `:8088` + Web `:4200` + Mobile `:8100`; PostgreSQL 16 + Redis thật (không H2); tenant `e2e-tenant@example.com`, platform `e2e-platform@example.com` |

> **⚠️ 2026-10-27 — WITHDRAWN:** Báo cáo này là baseline của kiến trúc **catalog in-process** đã bị bác tại [BUG-135](../07_items/BUG-135_catalog_not_independent_plugin.md). Không dùng để nghiệm thu; xem báo cáo thay thế [TR-S05-002](03_TR-S05-002_plugin_architecture_test_report.md).

## 1. Tổng hợp

| Chỉ số | Kết quả |
| :--- | :--- |
| Test backend tự động | **289 test PASS**, 1 skipped (OciRegistryClientTest — có sẵn từ trước) |
| Test catalog (API/DB) | 9 + 4 + 3 + 2 + 6 + 11 + 1 + 4 + 7 + 6 + 3 + **2** (manifest plugin) = **58 PASS** (gồm import/export 12) |
| TC kiểm thử thủ công (browser) | **PASS 21**, **PARTIAL 4**, **NOT RUN 0** (chi tiết §3; 4 mục PARTIAL là thao tác UI chưa bấm nhưng API đã có test) |
| Lỗi console | **0** ở Web và Mobile sau khi sửa lỗi interceptor Mobile |
| Lỗi phát hiện & sửa trong QA | **5** (xem §2) |

## 2. Lỗi phát hiện trong QA và đã sửa

| # | Lỗi | Mức | Nguyên nhân gốc | Sửa |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Lịch sử phiên bản trống ("Chưa có phiên bản") với bản ghi **hệ thống** | High | `listVersions` lọc theo tenant của người gọi ⇒ bản `tenant_id NULL` không khớp | `CatalogItemService.versions` dùng `item.tenantId` (`d507e07`) |
| 2 | Cột **CHA** luôn "Không có cha" dù bản ghi có cha | High | API danh sách không trả `parents` | Batch-load cha cho cả trang (1 truy vấn, không N+1) (`d507e07`) |
| 3 | Mobile: mọi request qua **service dùng chung** bị **401** | Critical | App Ionic thiếu `authInterceptor` (web có) ⇒ request không kèm token | Thêm `core/interceptors/auth.interceptor.ts` + đăng ký (`050a3bc`) |
| 4 | Cột **TÊN** chỉ 58px, chữ xuống dòng 2 hàng | Medium | Không khai báo bề rộng cột + nút hành động trong hàng chiếm ~120px | Khai báo width, `whitespace-nowrap`, bỏ nút trùng (đã có ở menu chuột phải + panel chi tiết) (`050a3bc`) |
| 5 | Nút **"Thử lại"** luôn hiện cạnh tab chế độ xem | Low | Nút refresh luôn render | Xoá (`050a3bc`) |

## 3. Kết quả theo TC

| TC | AC | Kết quả | Bằng chứng |
| :--- | :--- | :--- | :--- |
| TC-01 | AC-01, AC-15 | ✅ PASS | 3 cột render, 10 loại (5 hệ thống + 5 tenant), badge `HỆ THỐNG`/`NHẬP TỰ DO`, 3.321 bản ghi xã/phường — `desktop-catalog-dark.png` |
| TC-02 | AC-02 | ✅ PASS | Tạo `QA-TEST-1` bằng UI, hàng hiện `v1 ĐANG DÙNG` |
| TC-03 | AC-02 | ✅ PASS (test) | Validation + mã lỗi trong `CatalogTypeApiTest`/`CatalogItemVersioningApiTest` |
| TC-04 | AC-06 | ✅ PASS | Sửa tên ⇒ **v2** sinh mới; drawer cảnh báo "Lưu sẽ tạo phiên bản mới" — `desktop-item-edit-drawer.png` |
| TC-05 | AC-06 | ✅ PASS | Lịch sử: v2 HIỆN HÀNH + v1 ĐÃ ĐÓNG — `desktop-item-version-history.png` |
| TC-06 | AC-01, AC-17 | ✅ PASS | Thêm cha bằng picker ⇒ hàng hiện "1 cha" — `desktop-edge-drawer.png` |
| TC-07 | AC-05 | ✅ PASS | Chu trình ⇒ `400 CATALOG_EDGE_CYCLE`; tự tham chiếu ⇒ `CATALOG_EDGE_SELF_REFERENCE` |
| TC-08 | AC-17 | ⚠️ PARTIAL | Chế độ "Đa cha" render; chưa tạo mục 2 cha để xem nhóm (API đa cha đã test) |
| TC-09 | AC-09 | ✅ PASS | Ma trận vai trò × XEM/GHI; Owner/Admin mặc định có cả hai — `desktop-grants-matrix.png` |
| TC-10 | AC-10, AC-11 | ✅ PASS | Gõ "Chuyên gia" ⇒ `GET /lookup/JOB_TITLE/options?q=...` → 200, option hiện tên + mã — `desktop-picker-dropdown.png` |
| TC-11 | AC-12 | ✅ PASS (test) | Nhập tự do + `CATALOG_LOOKUP_INLINE_NOT_ALLOWED` trong `CatalogLookupApiTest` |
| TC-12 | AC-12 | ⚠️ PARTIAL | Nút "Lưu vào danh mục" hiện theo quyền; chưa bấm trong browser (API inline đã test) |
| TC-13 | AC-15 | ✅ PASS (test) | `TenantIsolationOrgTest` + bộ catalog: tenant không thấy dữ liệu tenant khác |
| TC-14 | AC-15 | ✅ PASS | Bản hệ thống chỉ đọc: khoá + thông báo "Tạo bản ghi cùng mã để ghi đè"; API hệ thống ⇒ 403 với tenant |
| TC-15 | AC-20 | ✅ PASS | Tạo `10003` phía tenant ⇒ badge **GHI ĐÈ**; options trả bản tenant (`overridden=true`, total=1) — `desktop-tenant-override.png` |
| TC-16 | AC-16 | ✅ PASS | Mobile tra cứu read-only: 10 loại, breadcrumb tỉnh, badge hệ thống/ghi đè, không nút sửa — `mobile-catalog-browse.png`, `mobile-catalog-detail.png` |
| TC-17 | AC-16 | ✅ PASS | Đo bằng iframe có viewport thật trên chính trình duyệt QA: **390×844** ⇒ scrollWidth = 390 (không tràn ngang), **23/23 touch target ≥ 40px** (min = 40), 0 lỗi console — `mobile-390x844.png`; **1400×900** ⇒ bố cục 3 cột nguyên vẹn, không wrap — `desktop-catalog-1400px.png` |
| TC-18 | AC-17 | ✅ PASS | Theme tối hiển thị đúng màn danh mục — `desktop-catalog-dark.png` |
| TC-19 | AC-17 | ✅ PASS | Web + Mobile **0 lỗi console** sau khi sửa interceptor |
| TC-20 | AC-18 | ⚠️ PARTIAL | API import dry-run + báo cáo theo dòng: 11 test PASS; drawer UI chưa nạp được tệp (harness không có file-upload) |
| TC-21 | AC-18 | ✅ PASS (test) | Tệp sai cấu trúc bị từ chối trước khi ghi; lỗi theo dòng không chặn dòng hợp lệ |
| TC-22 | AC-20 | ✅ PASS | Như TC-15 (ẩn cục bộ bằng bản tenant `INACTIVE` — có test) |
| TC-23 | AC-18 | ✅ PASS (test) | `CatalogImportExportApiTest`: `.xlsx` cho kết quả như CSV; `parent_code` tạo cạnh |
| TC-24 | AC-21 | ✅ PASS | `PROVINCE` 34 mục, `COMMUNE` 3.321 mục, xã là con trực tiếp của tỉnh (lọc `parent_id` trả đúng 126 xã của Hà Nội) |
| TC-25 | AC-22 | ⚠️ PARTIAL | API hệ thống đã xác minh (platform token: 5 loại + 34 tỉnh; tenant: 403); route/guard + tái sử dụng component đã QA. Chưa chụp được ảnh do form đăng nhập platform không điều khiển được trong harness |

## 3.1. Lượt kiểm thử bổ sung sau review chủ sản phẩm (2026-10-06)

| Hạng mục | Kết quả | Bằng chứng |
| :--- | :--- | :--- |
| Khung **2 cột**, không cột chi tiết trống khi chưa chọn bản ghi | ✅ PASS | `desktop-catalog-two-column.png`; `document.scrollWidth - clientWidth = 0` (không tràn ngang), bảng tự cuộn ngang trong wrapper |
| **Drawer chi tiết** mở khi bấm hàng / "Xem chi tiết"; đóng ⇒ bảng chiếm lại bề rộng, hàng vẫn chọn | ✅ PASS | `desktop-item-detail-drawer.png` |
| Danh sách **con phân trang 10/trang** | ✅ PASS | Hà Nội: `Tổng: 126 bản ghi · Trang 1/13` (13 trang × 10) |
| **Panel "API"** từng loại (options/inline/resolve/path + mẫu JSON + shape giá trị form + sao chép) | ✅ PASS | `desktop-catalog-api-panel.png` — nội dung đúng `PROVINCE` |
| 0 lỗi console sau các thay đổi | ✅ PASS | `browser.console(level=error)` → `messages: []` |
| `GET /api/v1/catalog/plugin/manifest` (descriptor plugin, AC-16) | ✅ PASS (test + live) | `CatalogPluginManifestTest` (2 test) PASS; live `:8088` trả 200 `CATALOG_PLUGIN_MANIFEST_SUCCESS` |
| Bỏ `catalog_types.source` / `source_ref` (`V4.0.1`) | ✅ PASS | `mvn test` xanh; descriptor + entity registry khớp sau khi dọn |
| `npm run web:build` / `i18n:check:strict` | ✅ PASS | 0 lỗi/0 cảnh báo; web 100% (13 locale), mobile 100% |
| Dọn theo ponytail review (7 mục) | ✅ PASS | `listActiveByParent` + `findAncestors`(+test) + alias `CatalogItemStatus` đã xoá; service mobile gộp vào shared; `CatalogItemLink` thống nhất 1 bản; 3 nhánh map edge→link gộp thành `visibleByIds`/`toLinks`/`link`. `mvn test -Dtest=Catalog*Test` xanh |

## 4. Giới hạn của lượt QA này

1. **Viewport**: cửa sổ QA tối đa 1062px (DPI 125%) nên các mốc **390×844** và **1400×900** được đo bằng **iframe có viewport thật** trên chính trình duyệt này (window.innerWidth xác nhận 390/1400) — TC-17 đã PASS; ảnh Desktop chuẩn ≥1280px: `desktop-catalog-1400px.png`. Lượt bổ sung §3.1 chụp ở 1062px (vẫn ≥ lg ⇒ 2 cột) — nên xem cùng ảnh 1400px cho bố cục xl.
2. **Nạp tệp import**: harness không có công cụ chọn tệp ⇒ phần drawer Import được xác minh ở tầng API/test.
3. **Đăng nhập Platform qua UI**: JS-fill không kích hoạt được form Angular (server trả 400 khi body rỗng) ⇒ xác minh platform qua API + route + test.

## 5. Khuyến nghị trước khi đóng Sprint

1. Bổ sung ảnh màn Platform (TC-25) — API/route/guard đã xác minh, chỉ thiếu ảnh chụp UI.
2. Xác minh nốt 2 mục PARTIAL bằng thao tác tay (TC-08 tạo mục 2 cha để xem nhóm "Đa cha"; TC-12 bấm "Lưu vào danh mục" trong browser) — API đã có test.
3. Cân nhắc thêm test tự động cho 2 lỗi đã sửa ở §2 (versions hệ thống + parents trong list) — hiện đã có test phủ ở tầng repository/service.
