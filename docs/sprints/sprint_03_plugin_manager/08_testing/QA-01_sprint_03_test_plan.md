# Kế Hoạch Kiểm Thử Sprint 03 — Plugin Manager (Bước 8)

> Người phụ trách: QA/QC Agent. Phạm vi: toàn bộ bề mặt Plugin Manager trên Web, Mobile và Backend.
> Quy chuẩn bắt buộc: **Dual-Mode Browser Testing** (Web ≥ 1280px, Mobile emulation 390×844), **0 lỗi console**, **overflow = 0**, mật độ ERP, Anti-Modal.

## 1. Bằng Chứng Tự Động Đã Có (Regression Baseline)

| Hạng mục | Lệnh | Kết quả |
| :--- | :--- | :--- |
| Backend full suite (PostgreSQL + Redis thật, không H2) | `mvn -q test` (trong `src/backend`) | **210/210 PASS** (2026-09-20) |
| Migrations V3.0.0–V3.0.2 | psql verify + rollback | PASS — [evidence/TASK-301_migration_pg_verify.txt](evidence/TASK-301_migration_pg_verify.txt) |
| Web build | `npm run build` (`src/frontend/web`) | PASS (chunk `plugin-marketplace`, `platform-plugin-list`, `plugin-app`) |
| Mobile build | `npm run build` (`src/frontend/mobile`) | PASS (chunk `plugins-page`) |
| CLI smoke | `node --test test/*.test.mjs` (`tools/open-erp-cli`) | 3/3 PASS |
| i18n parity | script đối chiếu key vi/en | Web 864/864, Mobile 535/535, **0 lệch** |

## 2. Ma Trận Kiểm Thử Thủ Công (Bắt buộc chụp ảnh)

### 2.1. Web — Portal Super Admin (≥ 1280px)

| # | Màn / Thao tác | Kỳ vọng | Ảnh |
| :---: | :--- | :--- | :--- |
| W1 | `/platform/plugins` — tải danh sách, filter `BLOCKED`, phân trang | Bảng dense, badge Đã khóa/Mặc định/Bắt buộc, không tràn ngang | `web_platform_plugins_list.png` |
| W2 | Mở Drawer "Đăng ký plugin" → nhập key/name → Lưu | Tạo catalog ACTIVE, toast i18n | `web_platform_register_plugin.png` |
| W3 | Register version 3 kênh (Docker Hub / Registry / Upload .zip) | Tab đổi field đúng; upload hiển thị checksum; version DRAFT xuất hiện trong timeline | `web_platform_register_version.png` |
| W4 | Publish / Deprecate / Block / Unblock version | Badge trạng thái đổi đúng; P26 chỉ đổi BLOCKED→PUBLISHED, không auto reinstall | `web_platform_version_actions.png` |
| W5 | Drawer "Khóa khẩn cấp": preview số tenant, gõ lại key, bật cưỡng chế | Nút chỉ bật khi đủ điều kiện; sau khóa có tiến trình + tenant nhận thông báo | `web_platform_block_emergency.png` |
| W6 | Drawer "Áp dụng hàng loạt": Xem trước → Chạy | Preview có tổng tenant; báo cáo success/failed từng tenant | `web_platform_bulk_apply.png` |
| W7 | Bảng tenant tầng 3 + Hỗ trợ (reason bắt buộc) + Cấp/Thu entitlement | Reason trống không submit; audit + operation_id hiển thị | `web_platform_tenant_support.png` |
| W8 | `/platform/plugin-credentials` — thêm/sửa/test/xóa | Secret không bao giờ hiển thị; xóa credential đang dùng → `PLUGIN_CREDENTIAL_IN_USE` | `web_platform_credentials.png` |
| W9 | `/platform/tenant-private-plugins` — khóa plugin riêng | Bảng có tenant sở hữu; khóa thành công + thông báo | `web_platform_tenant_private.png` |

### 2.2. Web — Khu Vực Tenant (≥ 1280px)

| # | Màn / Thao tác | Kỳ vọng | Ảnh |
| :---: | :--- | :--- | :--- |
| T1 | `/settings/plugins` — 3 nhóm Đã cài/Có thể cài/Plugin riêng | Nhóm đúng, badge phiên bản + Có cập nhật | `web_tenant_marketplace.png` |
| T2 | Cài plugin → Nâng cấp (COMPATIBLE, snapshot tùy chọn) | Tiến trình steps hiển thị, trạng thái ACTIVE + version mới | `web_tenant_install_upgrade.png` |
| T3 | Nâng cấp bản BREAKING (snapshot=false) | Bị chặn `PLUGIN_SNAPSHOT_REQUIRED`; bật snapshot → thành công | `web_tenant_breaking_guard.png` |
| T4 | Gỡ plugin (soft) | Cảnh báo giữ dữ liệu, trạng thái UNINSTALLED, schema còn | `web_tenant_uninstall.png` |
| T5 | Drawer đăng ký plugin riêng (Có tài nguyên): 3 tab + upload `.zip` + manifest | Bản ghi DRAFT; PUBLISH → cài được; xóa version đang dùng bị chặn | `web_tenant_custom_register.png` |
| T6 | `/settings/plugin-credentials` — thêm/test/xóa | Bảng dense, secret che | `web_tenant_credentials.png` |
| T7 | Thông báo plugin (bell/drawer) khi bị nền tảng khóa | Banner đỏ + danh sách thông báo + Đánh dấu đã đọc | `web_tenant_notifications_blocked.png` |
| T8 | Route động `/apps/<pluginKey>` (WC/MF/iframe) | Skeleton → nội dung plugin; lỗi plugin cô lập (không vỡ màn host) | `web_plugin_app_render.png` |
| T9 | Plugin bị khóa: mọi hành động cài/nâng cấp/bật bị khóa | Badge "Đã khóa", nút disabled, version BLOCKED không xuất hiện trong picker | `web_tenant_blocked_actions.png` |

### 2.3. Mobile Ionic — Emulation 390×844

| # | Màn / Thao tác | Kỳ vọng | Ảnh |
| :---: | :--- | :--- | :--- |
| M1 | Menu → "Quản lý plugin" → `/settings/plugins` | Chỉ đọc; badge trạng thái/cập nhật/khóa; ghi chú dùng Web để cài | `mobile_plugins_list.png` |
| M2 | Pull-to-refresh | Loading hoàn tất, không nhảy layout | `mobile_plugins_refresh.png` |
| M3 | Đo `document.body.scrollWidth <= 390` + touch target ≥ 40px | **Overflow = 0**, mọi item ≥ 40px | `mobile_overflow_check.png` |
| M4 | Banner cập nhật/khóa khi có dữ liệu | Banner hiển thị đúng ngữ cảnh vi/en | `mobile_plugins_banner.png` |

### 2.4. Console & Đa Ngôn Ngữ

- [ ] Cả Web và Mobile: mở DevTools Console → **0 `console.error`** trong toàn bộ luồng trên (ghi lại ảnh Console sạch mỗi nền tảng).
- [ ] Chuyển VI↔EN trên từng màn trọng yếu (W1, T1, M1): không còn chuỗi hardcode, không key thô.

## 3. Tiêu Chí Thoát (Exit Criteria — DoD Bước 8)

1. 100% case mục 2 PASS, ảnh lưu tại `08_testing/evidence/screenshots/`.
2. **0 Critical / 0 High** mở mới; mọi phát hiện mới tạo file `BUG-xx` trong `07_items/`.
3. Không console error; overflow = 0; i18n parity giữ nguyên 0 lệch.
4. QA ghi báo cáo `08_testing/QA-01_sprint_03_test_report.md` kèm kết luận PASS/FAIL và danh sách bug.

## 4. Ghi Chú Kỹ Thuật Cho QA

- Backend chạy local: `make infra` (PostgreSQL + Redis) → `make backend`; Web `make web`; Mobile `make mobile`.
- Deployer mặc định `docker`; cần Docker daemon cho luồng cài thật (T2–T5). Nếu không có Docker, dùng môi trường staging.
- Build bundle test nhanh: `cd tools/open-erp-cli && npx . package` trong project mẫu (xem `create_new_plugin_guide.md`).
- Thông báo plugin chỉ sinh khi: khóa cưỡng chế, cập nhật khả dụng, cài/nâng cấp thất bại.
