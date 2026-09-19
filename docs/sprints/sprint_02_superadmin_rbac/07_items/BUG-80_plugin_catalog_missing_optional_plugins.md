# [BUG-80] Catalog Plugin Backend Chỉ Trả `core` — TenantQuotaDrawer Không Hiển Thị Plugin Tùy Chọn (sales) Đang Được Phép

- **Mã Lỗi**: BUG-80
- **Phân Loại**: Bug / Defect (FEAT-20 acceptance + BUG-74 UI verification)
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent (Re-test Sprint 02, 2026-09-19)
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred
- **Ngày Phát Hiện**: 2026-09-19

---

## 1. Mô Tả Lỗi

> Tenant test `qa-test-corp-02` có `allowed_plugins = ["core","sales"]` (đã lưu DB và API list trả đúng sau fix BUG-74). Tuy nhiên khi mở Drawer **Hạn mức** trên Web, phần **TÙY CHỌN** hiển thị *"Không có plugin tùy chọn."* — **không có switch `sales`**. Nguyên nhân: `GET /api/v1/platform/plugins` chỉ trả duy nhất `core` (catalog backend), mà `PluginSwitchListComponent` chỉ render switch theo catalog nhận được (không merge với `allowed_plugins` đang có).

### Bằng chứng runtime (re-test 2026-09-19)

| Kiểm tra | Kết quả |
| :--- | :--- |
| `GET /api/v1/platform/tenants?keyword=qa-test-corp-02` | `allowed_plugins = ["core","sales"]` (200) |
| `GET /api/v1/platform/plugins` | 200 `PLATFORM_PLUGIN_LIST_SUCCESS`, `items = [{key:"core", is_core:true}]` — **thiếu toàn bộ plugin tùy chọn** |
| Drawer Hạn mức (web) | `requiredItems=[core (disabled ON)]`; `optionalItems=[]`; text "TÙY CHỌN / Không có plugin tùy chọn." |
| Mobile `/platform/emergency` (cùng dữ liệu) | Hiển thị **2** plugin read-only: `Plugin lõi` + `Bán hàng` (do đọc thẳng `allowed_plugins`) → mâu thuẫn với Drawer web |

- Ảnh minh chứng: `../08_testing/screenshots/web/QA-R-74_a_quota_drawer_open_state.png`, `QA-F-20_a_plugin_switch_list_superadmin.png`; mobile: `QA-F-20_d_mobile_emergency_plugin_readonly.png`.

### Bằng chứng (file:line)

- `src/backend/.../modules/platform/service/PluginCatalogService.java:28-30` — `CATALOG = List.of(new PluginDefinition(TenantPluginAllowlistService.PLUGIN_CORE, ...))`; catalog tĩnh **chỉ khai báo `core`**, không có `sales/accounting/inventory/crm` dù frontend có fallback catalog 5 plugin.
- `src/frontend/web/.../tenants/plugin-switch-list.component.ts:23-24` — `requiredItems/optionalItems` chỉ lọc từ `items()` (catalog API); plugin nằm trong `plugins()` nhưng ngoài catalog **không được render**.
- `src/frontend/web/.../tenants/tenant-quota-drawer.component.ts:182` — `this.catalog.set(items.length ? items : FALLBACK_PLUGIN_CATALOG);` → vì API trả 1 item (`core`) nên **không rơi vào fallback** 5 plugin.

### Các bước tái hiện (Reproduction Steps)

1. Đăng nhập SUPER_ADMIN → `/platform/tenants` → "Hạn mức" tenant `qa-test-corp-02` (đang có `sales`).
2. Quan sát mục "Plugin được phép": nhóm TÙY CHỌN trống, không có switch `sales`.
3. Đối chiếu `GET /api/v1/platform/plugins` → chỉ có `core`.
4. (Hệ quả) Admin **không thể bật/tắt** `sales`, `accounting`, `inventory`, `crm` trên UI; mọi thay đổi allowlist plugin tùy chọn phải gọi API thủ công.
5. (Rủi ro) Nếu sau này catalog thay đổi/không có plugin đang bật, `normalizeSelection` có thể loại bỏ plugin ngoài catalog khỏi selection khi Lưu.

## 2. Tác Động

- FEAT-20 không đạt tiêu chí "danh sách plugin với switch bật/tắt" — phần Tùy chọn hoàn toàn trống; không thể quản trị allowlist plugin trên UI.
- Re-test BUG-74 không thể xác nhận "switch `sales` ON đúng trạng thái" dù API/DB đã đúng.
- Bất nhất trải nghiệm giữa Web (ẩn `sales`) và Mobile (hiển thị `sales`).

## 3. Kết Quả Kỳ Vọng

- Backend `PluginCatalogService` bổ sung đầy đủ các plugin đã biết (`sales`, `accounting`, `inventory`, `crm`) khớp FE fallback/`allowed_plugins`, **hoặc** `PluginSwitchListComponent` merge `plugins()` hiện có vào danh sách optional (hiển thị switch ON cho plugin đang được phép nhưng chưa có trong catalog).
- Drawer hiển thị đúng trạng thái `["core","sales"]`; switch `sales` bật và có thể tắt/bật + Lưu; `core` luôn disabled ON.
- Bổ sung test backend khẳng định catalog chứa các plugin tùy chọn đã biết và `GET /platform/plugins` đủ item cho UI.

## 4. Xác Nhận Khắc Phục (QA Verification)

- [ ] Developer bổ sung catalog/merge optional plugins.
- [ ] QA re-test QA-R-74: switch `sales` ON sau khi mở lại; bật/tắt + Lưu → DB đúng; core không tắt được.
- [ ] Cập nhật `08_testing/test_report.md`.

## Ghi Chú QA (2026-09-19)

- Phát hiện khi re-test BUG-74 + QA-F-20. Lưu ý: fix BUG-74 (list trả `allowed_plugins`) và cơ chế chống ghi đè khi Lưu **hoạt động đúng** (DB giữ `["core","sales"]` qua 2 lần Lưu) — lỗi này là **khoảng trống catalog/UI**, không phải tái phát BUG-74.
- Backend round-trip `PATCH quotas` với `allowed_plugins` vẫn đúng (test qua API: `[]` → `["core"]`, `["core","sales"]` → giữ nguyên).

## Ghi Chú Triển Khai (Developer) — 2026-09-19

> **FE đã sửa xong, chờ QA re-test QA-R-74.** Không chạm backend; giải pháp là merge catalog ở tầng FE đúng như phương án 2 tại mục "Kết Quả Kỳ Vọng".

- `src/frontend/web/src/app/features/platform/tenants/tenant-quota-drawer.component.ts:202-220` — `mergeCatalog()` hợp nhất: (1) catalog API, (2) `FALLBACK_PLUGIN_CATALOG` (`core/sales/accounting/inventory/crm`) để plugin đã biết luôn hiển thị và bật lại được sau khi tắt, (3) mọi key trong `allowed_plugins` của tenant chưa có trong catalog (entry tổng hợp `name_key=''`). Dùng ở cả nhánh success (`:188`) lẫn error (`:194`).
- `plugin-switch-list.component.ts:29-50` — `optionalItems` tự merge thêm các key đang chọn ngoài catalog (fallback tên = key, `inCatalog=false`) nên component dùng lại được độc lập; `core` vẫn lọc riêng nhóm Bắt buộc.
- `plugin-switch-list.component.html:36-43` — plugin ngoài catalog hiển thị tên = key + nhãn i18n `PLATFORM_TENANT_QUOTA_PLUGIN_NOT_IN_CATALOG`.
- `tenant-quota-drawer.component.ts:100-115` — tắt plugin ngoài catalog hiển thị cảnh báo riêng `PLATFORM_TENANT_QUOTA_PLUGIN_UNKNOWN_DISABLE_WARNING`; tắt plugin thường giữ cảnh báo cũ.
- **Lưu khi Lưu**: `normalizeSelection()` (`:240-256`) vẫn giữ toàn bộ key lạ (extras, không tự xóa) + luôn thêm `core`; gửi đúng mảng đã chọn qua `PATCH /platform/tenants/{id}/quotas`.
- i18n: thêm 2 key parity vi/en `PLATFORM_TENANT_QUOTA_PLUGIN_NOT_IN_CATALOG`, `PLATFORM_TENANT_QUOTA_PLUGIN_UNKNOWN_DISABLE_WARNING` tại `web/public/i18n/{vi,en}.json`.
- `npm run build` Web **PASS** (2026-09-19); mobile không sửa i18n/model nên chỉ build lại do share `drawer` (cũng PASS).
- Kỳ vọng QA: tenant `qa-test-corp-02` mở Drawer Hạn mức → nhóm Tùy chọn có switch `sales` ON; bật/tắt + Lưu cập nhật DB; `core` vẫn disabled ON; key lạ (nếu có) hiển thị tên = key + nhãn "không có trong danh mục".

## Ghi Chú QA Nghiệm Thu Cuối (2026-09-19) — QA-R2-80 / QA-F-20: PASS → Done

- Tenant test `["core","sales","unknown-x"]` mở Drawer Hạn mức: nhóm **Bắt buộc** `core` disabled ON; nhóm **Tùy chọn** có switch `sales` **ON**, `unknown-x` **ON + nhãn "Không có trong danh mục plugin"**, các plugin fallback còn lại OFF; đếm `Đã bật 3/6`.
- Lưu lần 1 → DB `["core","sales","unknown-x"]`; mở lại Drawer vẫn 3/6; Lưu lần 2 (không thay đổi) → DB giữ nguyên (không mất plugin) — hết hẳn lỗi nhóm Tùy chọn trống.
- Search "sales" lọc đúng 1 dòng; empty state riêng; toggle tắt plugin thường/key lạ hiện banner cảnh báo tương ứng; `core` không thể tắt.
- Dọn dẹp: khôi phục tenant `["core","sales"]`; console errors = 0. Ảnh: `QA-R2-80_a..f`, `QA-F2-20_a..b`. Kết luận: **Done**.
