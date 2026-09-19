# [FEAT-20] Cấu Hình Plugin Cho Hệ Thống/Tenant Dạng Danh Sách Kèm Switch Button

- **Mã Tính Năng**: FEAT-20
- **Phân Loại**: Feature / UI Enhancement
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Yêu Cầu**: Khách hàng (2026-09-19)
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred *(QA nghiệm thu cuối 2026-09-19 — QA-F2-20 PASS; BUG-80 đã fix)*
- **Ngày Tạo**: 2026-09-19

---

## 1. Mô Tả Yêu Cầu

> Phần hiển thị cấu hình plugin (cho hệ thống và cho tenant) phải là **danh sách** các plugin với **switch button** bật/tắt từng plugin, thay cho dạng checkbox/chips/JSON hiện tại.

- **Vị trí**:
  1. **System (Platform)**: catalog plugin của hệ thống + trạng thái bật/tắt mặc định (hiển thị trong khu vực quản trị platform).
  2. **Tenant**: `TenantQuotaDrawer` (`/platform/tenants` → Hạn mức) hiển thị danh sách plugin với switch; lưu vào `tenants.allowed_plugins`.
- **Hành vi switch**: ON = plugin nằm trong allowlist; OFF = gỡ khỏi allowlist; có trạng thái lưu rõ ràng (nút Lưu hiện có), cảnh báo nếu tắt plugin đang được dùng (nếu có dữ liệu liên quan — tối thiểu ghi chú).

## 2. Yêu Cầu Kỹ Thuật

1. **Backend**: thêm `GET /api/v1/platform/plugins` — catalog plugin đã biết (hiện có `core`; mở rộng theo Entity Registry/module registry) trả `{success, code: PLATFORM_PLUGIN_LIST_SUCCESS, data:{items:[{key, name_key, description_key, is_core}]}}` (Non-Paginated List). Chỉ SUPER_ADMIN.
2. `PATCH /platform/tenants/{id}/quotas` giữ nguyên contract `allowed_plugins` (mảng key); `core` luôn bắt buộc (không cho tắt — disable switch + tooltip).
3. **Web**: component `plugin-switch-list` (tách template, dùng `SharpToggle` shared nếu phù hợp) — danh sách dense: tên plugin (i18n `name_key`), mô tả ngắn, switch bên phải; nhóm "Bắt buộc" (core, switch disabled ON) và "Tùy chọn".
4. Mobile: hiển thị read-only danh sách plugin tenant (nếu màn phù hợp) — tối giản, touch target ≥ 40px.
5. i18n vi/en parity; không hardcode tên plugin (dùng key).

## 3. Tiêu Chí Nghiệm Thu

- [x] TenantQuotaDrawer hiển thị danh sách switch đúng trạng thái `allowed_plugins` (không còn lỗi reset về `core` — phối hợp BUG-74).
- [x] Bật/tắt + Lưu → DB cập nhật đúng; `core` không thể tắt.
- [x] `GET /platform/plugins` có test backend; SUPPORT_ENGINEER không truy cập được action ghi.
- [x] Build web/mobile PASS; QA chụp ảnh danh sách switch.

## Ghi Chú Tiến Độ (2026-09-19)

- **Backend catalog hoàn tất 2026-09-19, UI do FE agent** — giữ `In Progress` đến khi Web/Mobile xong:
  - `src/backend/.../modules/platform/resource/PlatformPluginResource.java` (mới) — `GET /api/v1/platform/plugins`, chỉ SUPER_ADMIN (SUPPORT_ENGINEER → 403 `PLATFORM_ACCESS_DENIED`); trả Non-Paginated List `data.items = [{key, name_key, description_key, is_core}]`, mã `PLATFORM_PLUGIN_LIST_SUCCESS` (`PlatformErrorCode.java:21`).
  - `src/backend/.../modules/platform/service/PluginCatalogService.java` (mới) — catalog tĩnh mở rộng được, hiện có `core`; i18n keys `PLUGIN_CORE_NAME` / `PLUGIN_CORE_DESCRIPTION` (FE agent thêm vào `vi.json`/`en.json`).
  - `src/backend/.../modules/platform/service/PlatformTenantService.java:144,343-358` — `PATCH/PUT /platform/tenants/{id}/quotas` tự thêm `core` khi thiếu, chuẩn hóa trim/dedupe, không cho gỡ `core`.
- **Test**: `PlatformPluginApiTest` (3 test: SUPER_ADMIN 200 + contract, SUPPORT_ENGINEER 403, thiếu token 401) và `PlatformTenantApiTest.testQuotasAlwaysKeepCorePlugin`. BUG-74 đã trả `allowed_plugins` ở list để Drawer đọc đúng trạng thái.
- Kiểm chứng: full `mvn test` **187/187 PASS** (PostgreSQL + Redis thật, không H2).
- **Còn lại cho FE agent**: component `plugin-switch-list` (template tách riêng, `SharpToggle` shared, nhóm Bắt buộc/Tùy chọn, switch `core` disabled ON), i18n parity vi/en, mobile read-only touch target ≥ 40px.

## Ghi Chú Triển Khai (Developer) — 2026-09-19

> **FE hoàn tất 2026-09-19, chờ QA xác nhận.** Backend `GET /api/v1/platform/plugins` do Backend Agent triển khai song song; FE đã code đúng contract `data.items:[{key,name_key,description_key,is_core}]`.

- **Component dùng chung mới**: `web/.../platform/tenants/plugin-switch-list.component.{ts,html}` — danh sách dense, nhóm **Bắt buộc** (`core`, `SharpToggle` disabled ON + tooltip `PLATFORM_TENANT_QUOTA_PLUGIN_CORE_LOCKED`) và **Tùy chọn**; tên/mô tả plugin lấy từ `name_key`/`description_key` qua i18n, không hardcode.
- **`TenantQuotaDrawer`**: thay toàn bộ checkbox/chips bằng `app-plugin-switch-list`; trạng thái đọc từ `allowed_plugins`; nếu field thiếu trên payload list (BUG-74) → **fallback gọi API detail** `GET /platform/tenants/{id}` trước khi hiển thị/ghi (không còn nguy cơ ghi đè mất plugin). `core` luôn được thêm lại khi chuẩn hóa và khi Lưu.
- **Lưu**: chuyển sang `PATCH /api/v1/platform/tenants/{id}/quotas` (thêm `ApiService.patch`); contract `allowed_plugins` giữ nguyên.
- **Cảnh báo tắt plugin**: hiển thị banner amber inline (`PLATFORM_TENANT_QUOTA_PLUGIN_DISABLE_WARNING`) khi tắt một plugin tùy chọn (không modal/alert native).
- **Catalog fallback**: nếu `GET /platform/plugins` lỗi/rỗng, dùng catalog mặc định (`core/sales/accounting/inventory/crm`) + banner cảnh báo; tên plugin vẫn qua i18n key `PLUGIN_<KEY>_NAME/DESCRIPTION` (đã thêm vi/en).
- **Mobile (read-only)**: màn `/platform/emergency` hiển thị danh sách plugin được phép của tenant (chỉ khi payload có `allowed_plugins`) dạng toggle disabled ON `size="touch"` (≥40px) + nhãn i18n.
- **Files**: `platform-tenants/plugin-switch-list.component.{ts,html}`, `tenant-quota-drawer.component.{ts,html}`, `platform.service.ts`, `api.service.ts`, `shared/components/sharp-toggle/*`, i18n web+mobile.
- **Lưu ý phạm vi**: màn "System (Platform) catalog plugin + trạng thái mặc định" chưa có route trong UI Sprint 02; component `plugin-switch-list` đã đóng gói dùng chung sẵn sàng tái sử dụng khi bổ sung màn platform plugin.
- Build `npm run build` Web + Mobile PASS ngày 2026-09-19.
- **Chờ QA**: xác nhận trạng thái switch sau bật/tắt + Lưu, `core` không tắt được, ảnh chụp danh sách switch; phối hợp BUG-74 khi Backend Agent hoàn tất.

## Ghi Chú QA Xác Nhận (2026-09-19) — QA-F-20: FAIL (chờ BUG-80)

| Hạng mục | Kết quả |
| :--- | :--- |
| `GET /api/v1/platform/plugins` (SUPER_ADMIN) | **PASS** — 200 `PLATFORM_PLUGIN_LIST_SUCCESS`; nhưng catalog chỉ có `core` |
| `GET /platform/plugins` + `PATCH /quotas` (SUPPORT_ENGINEER) | **PASS** — 403 `PLATFORM_ACCESS_DENIED` cả hai |
| SUPPORT_ENGINEER trên Web `/platform/tenants` | **PASS** — chỉ-xem, không có nút Hạn mức/Truy cập đại diện/Khóa |
| Nhóm Bắt buộc `core` disabled ON | **PASS** — switch 16×28 (desktop), `disabled`, `aria-checked=true`, tooltip khóa |
| Nhóm Tùy chọn + bật/tắt + Lưu trên Drawer | **FAIL** — nhóm Tùy chọn trống ("Không có plugin tùy chọn."), không có switch `sales` dù tenant đang có `allowed_plugins=["core","sales"]` → **BUG-80 (High)** |
| Backend round-trip `allowed_plugins` (API) | **PASS** — `["core"]` khi PATCH rỗng/off; giữ `["core","sales"]` khi bật lại; `core` tự thêm khi thiếu |
| Mobile `/platform/emergency` read-only | **PASS** — 2 toggle `Plugin lõi` + `Bán hàng` 44×40px, checked+disabled, overflow 0 |

- Ảnh: `QA-F-20_a_plugin_switch_list_superadmin.png`, `QA-F-20_b_quota_saved_from_ui.png`, `QA-F-20_c_support_readonly_tenants.png`, `mobile/QA-F-20_d_mobile_emergency_plugin_readonly.png`.
- **Kết luận**: giữ **In Progress** — hoàn tất sau khi BUG-80 được sửa và QA xác nhận switch tùy chọn bật/tắt + Lưu đúng DB.

## Ghi Chú Developer (2026-09-19)

- BUG-80 đã được FE xử lý (`[x] Done`) bằng merge catalog + `allowed_plugins` trong `plugin-switch-list.component.ts` / `tenant-quota-drawer.component.ts` — giữ **In Progress** chờ QA re-test QA-F-20/QA-R-74.

## Ghi Chú Developer (2026-09-19) — Nâng cấp theo yêu cầu khách hàng: chuyển list + search, chờ QA

> **Trạng thái: `In Progress` — chuyển list + search theo yêu cầu khách hàng, chờ QA.** Không chạm backend; giữ nguyên logic merge BUG-80.

- **`PluginSwitchListComponent` (`plugin-switch-list.component.{ts,html}`) nâng cấp thành danh sách dọc mở rộng được** (thay hẳn dạng grid checkbox 2 cột trong ảnh khách hàng gửi):
  - Nhóm **Bắt buộc** (`core`, `SharpToggle` disabled ON + tooltip) và **Tùy chọn**; mỗi plugin 1 dòng: tên (i18n `name_key`, fallback key thô) + mô tả ngắn (`description_key`) + switch bên phải.
  - **Thanh tìm kiếm** lọc theo tên/key (accent-insensitive không cần, dùng lowercase) + nút xoá nhanh; **đếm "Đã bật X/Y"** trên toàn bộ danh mục.
  - **`max-h-64` + cuộn dọc** cho hàng trăm plugin; group header sticky; **empty state** phân biệt "không có plugin tùy chọn" và "không tìm thấy plugin phù hợp".
  - **Key lạ ngoài catalog** (từ merge `allowed_plugins`) hiển thị tên = key + nhãn cảnh báo `PLATFORM_TENANT_QUOTA_PLUGIN_NOT_IN_CATALOG`; không hardcode danh sách — render từ `GET /platform/plugins` + merge (giữ BUG-80).
  - Sửa nhỏ so với trước: item đã được Drawer hợp nhất vào catalog (key lạ) được nhận diện bằng `name_key`/`description_key` rỗng → luôn hiện nhãn cảnh báo (trước đây chỉ hiện khi `inCatalog=false` nên Drawer merge che mất).
- `TenantQuotaDrawer` (web) dùng component này; API `PATCH /platform/tenants/{id}/quotas` + `allowed_plugins` giữ nguyên (đã xác nhận body gửi đủ `core/sales/unknown-x`). Mobile giữ màn read-only `/platform/emergency` với toggle `size="touch"` ≥40px — không sửa.
- i18n thêm 4 key parity vi/en: `PLATFORM_TENANT_QUOTA_PLUGIN_SEARCH_PLACEHOLDER`, `..._SEARCH_EMPTY`, `..._ENABLED_COUNT`, `..._CLEAR_SEARCH`.
- **Kiểm chứng (harness Playwright tĩnh, tenant `allowed_plugins=["core","sales","unknown-x"]`, catalog 44 mục sau merge)**:
  - 44 switch render đủ, "Đã bật 3/44", `core` disabled ON; container cuộn `1425 > 254` px (max-height hoạt động).
  - Tìm "sales" → còn 1 dòng; xoá tìm → 44 dòng; đếm giữ nguyên `3/44` khi lọc.
  - Tắt `sales` → banner cảnh báo + "Đã bật 2/44"; tắt `unknown-x` → cảnh báo key ngoài danh mục; bật lại đủ.
  - Lưu → `PATCH /platform/tenants/t1/quotas` giữ `core`, `sales`, `unknown-x`; 0 console error.
- `npm run build` Web + Mobile **PASS** (2026-09-19).
- **Chờ QA**: xác nhận danh sách switch + tìm kiếm + Lưu đúng DB, ảnh chụp danh sách; phối hợp re-test BUG-80/QA-R-74.

## Ghi Chú Backend — Catalog Cấu Hình Được (Developer, 2026-09-19)

> Giữ **In Progress** (chờ QA re-test QA-F-20 + BUG-80). Ops giờ thêm plugin mới **không cần sửa code**: catalog mở rộng qua config Quarkus.

- **Config mới**: `openerp.platform.plugin-catalog` — CSV entry dạng `key[:name_key[:description_key]]` (tài liệu hóa ngay trong `src/backend/src/main/resources/application.properties` mục 13, mặc định để trống → chỉ `core`):
  - `sales:PLUGIN_SALES_NAME:PLUGIN_SALES_DESCRIPTION` — name/description key tường minh (khuyến nghị).
  - `inventory` — suy diễn `PLUGIN_INVENTORY_NAME` / `PLUGIN_INVENTORY_DESCRIPTION`.
  - `billing:PLUGIN_BILLING_NAME` — name tường minh, description suy diễn.
- **Hợp nhất & dedupe**: `PluginCatalogService.catalog()` luôn đặt `core` đầu tiên (`is_core=true`); entry trùng key (kể cả `core` trong config) bị bỏ qua không phân biệt hoa/thường; entry rỗng/không hợp lệ bị bỏ qua.
- **API không đổi contract**: `GET /api/v1/platform/plugins` vẫn trả Non-Paginated List `data.items = [{key, name_key, description_key, is_core}]`, mã `PLATFORM_PLUGIN_LIST_SUCCESS`, chỉ SUPER_ADMIN.
- **Test**:
  - `PlatformPluginCatalogConfigTest` (mới, `@TestProfile` override `openerp.platform.plugin-catalog=sales:PLUGIN_SALES_NAME:PLUGIN_SALES_DESCRIPTION,core,inventory,billing:PLUGIN_BILLING_NAME`) → API trả đủ 4 item đúng thứ tự, `core` dedupe/`is_core=true`, key suy diễn đúng.
  - `PlatformPluginApiTest.testCatalogWithoutConfigContainsOnlyCore` (mới) → không config, catalog chỉ có `core`.
- **Kiểm chứng**: full `mvn test` **193/193 PASS, BUILD SUCCESS** (PostgreSQL + Redis thật, không H2).

## Ghi Chú QA Nghiệm Thu Cuối (2026-09-19) — QA-F2-20 + QA-R2-80: PASS → Done

- **Danh sách dọc + search**: tenant `["core","sales","unknown-x"]` → 6 dòng (Bắt buộc: `core` disabled ON; Tùy chọn: sales ON, accounting/inventory/crm OFF, `unknown-x` ON kèm nhãn "Không có trong danh mục plugin"); đếm `Đã bật 3/6`; container cuộn thật `298 > 254px`; search "sales" còn đúng 1 dòng, đếm giữ 3/6; empty state "Không tìm thấy plugin phù hợp"; xóa search quay lại 6 dòng.
- **Bật/tắt + cảnh báo**: tắt sales → banner "sẽ chặn khách thuê" + đếm 2/6; tắt `unknown-x` → banner "không có trong danh mục" + đếm 1/6; bật lại đủ 3/6.
- **Lưu 2 lần liên tiếp**: DB giữ đúng `["core","sales","unknown-x"]` cả 2 lần; mở lại Drawer đếm 3/6 (không mất plugin — hết BUG-74/80); `core` luôn disabled ON, không tắt được.
- **Mobile** `/platform/emergency`: 19 toggle read-only `size=touch` đạt **44×40px**, checked+disabled, nhãn "Bán hàng"/"unknown-x" hiển thị; overflow 0.
- **Dọn dẹp**: tenant test khôi phục `["core","sales"]`; console errors = 0.
- Ảnh: `web/QA-F2-20_a..b`, `QA-R2-80_a..f`, `mobile/QA-F2-20_c`. Kết luận: **đạt toàn bộ tiêu chí nghiệm thu → Done**.
