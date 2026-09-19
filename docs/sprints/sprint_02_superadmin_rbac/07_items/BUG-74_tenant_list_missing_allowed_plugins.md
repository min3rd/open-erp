# [BUG-74] Tenant List API Thiếu `allowed_plugins` — Drawer Hạn Mức Hiển Thị Sai Và Có Thể Vô Tình Thu Hồi Quyền Plugin

- **Mã Lỗi**: BUG-74
- **Phân Loại**: Bug / Defect (Functional + Data Integrity)
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent (Browser Dual-Mode Testing Sprint 02)
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred
- **Ngày Phát Hiện**: 2026-09-19

---

## 1. Mô Tả Lỗi

> API danh sách tenant `GET /api/v1/platform/tenants` (dùng bởi màn `/platform/tenants`) **không trả về trường `allowed_plugins`**, dù DTO `PlatformResponses.TenantItem` đã khai báo trường này và DB đã lưu giá trị. Hệ quả: Drawer "Cấu hình hạn mức khách thuê" (`TenantQuotaDrawerComponent`) đọc `tenant.allowed_plugins || ['core']` từ dòng danh sách nên **luôn hiển thị lại chỉ `core`**, làm mất trạng thái plugin đã lưu. Nếu admin bấm "Lưu" lần nữa mà không tick lại, hệ thống sẽ **ghi đè và thu hồi toàn bộ plugin khác** của tenant.

- **Môi trường**: Web Desktop 1440x900, Chrome (Playwright headless channel=chrome), backend Quarkus dev `http://localhost:8088`, DB `openerp_dev`.
- **Tài khoản test**: `qa.sa02@example.com` (SUPER_ADMIN) — mật khẩu test nội bộ QA, không ghi vào repo.
- **Tenant test**: `qa-test-corp-02` (id `20cced6a-f0c2-48f7-8b8a-56e5877406db`).

### Bằng chứng (file:line)

- `src/backend/.../platform/service/PlatformTenantService.java:277-293` — `toItem()` (list) **không gán** `item.allowedPlugins`, trong khi `detail()` tại dòng 100 có gán `detail.allowedPlugins = tenant.allowedPlugins;`.
- `src/backend/.../platform/dto/PlatformResponses.java:84-85` — `TenantItem.allowedPlugins` có `@JsonProperty(PlatformResponseKey.Json.ALLOWED_PLUGINS)` nhưng không bao giờ được set ở list path.
- `src/frontend/web/src/app/features/platform/tenants/tenant-quota-drawer.component.ts:65` — `this.plugins.set([...(current.allowed_plugins || ['core'])]);` đọc từ dòng danh sách.

### Bằng chứng runtime

1. Lưu quota qua UI: `plan_tier=ENTERPRISE`, `max_users=25`, `max_storage_mb=2048`, tick plugin `sales` → thành công (`PLATFORM_TENANT_QUOTA_UPDATED`).
2. DB xác nhận đã lưu: `select allowed_plugins from tenants where slug='qa-test-corp-02'` → `["core", "sales"]`.
3. `GET /api/v1/platform/tenants?keyword=qa-test-corp-02` → item trả về **không có** `allowed_plugins` (thiếu hẳn key).
4. `GET /api/v1/platform/tenants/{id}` (detail) → **có** `"allowed_plugins":["core","sales"]` (chứng minh dữ liệu lưu đúng, chỉ list bị thiếu).
5. Mở lại Drawer hạn mức trên UI → checkbox `sales` = **unchecked** (đáng lẽ phải checked), `core` = checked; plan/25/2048 vẫn đúng.
   - Ảnh minh chứng: `../08_testing/screenshots/web/QA-W-02_i_quota_reopen_after_save.png`.

### Các bước tái hiện (Reproduction Steps)

1. Đăng nhập Platform SUPER_ADMIN → mở `/platform/tenants`.
2. Bấm "Hạn mức" tại dòng tenant bất kỳ → Drawer trượt phải mở ra.
3. Tick thêm plugin `sales` (ngoài `core`) → bấm "Lưu" → nhận thông báo cập nhật hạn mức thành công.
4. Kiểm tra DB: `allowed_plugins = ["core","sales"]` (đúng).
5. Bấm "Hạn mức" lần nữa cho cùng tenant → **`sales` hiển thị unchecked** (sai).
6. (Hệ quả) Bấm "Lưu" ngay → DB trở về `["core"]` → tenant bị mất quyền plugin `sales` mà không có cảnh báo.

## 2. Tác Động

- Giao diện quản trị hiển thị sai trạng thái phân quyền plugin của tenant (vi phạm tính nhất quán trạng thái UI ↔ backend).
- Nguy cơ **thu hồi quyền plugin ngoài ý muốn** khi admin chỉnh quota lần sau (ví dụ sửa `max_users` rồi Lưu) → có thể làm hỏng luồng nghiệp vụ phụ thuộc plugin.
- Enforce allowlist phía backend (`TenantPluginAllowlistService.assertAllowed`) là thật, nên việc mất plugin sẽ trả `403 PLATFORM_PLUGIN_NOT_ALLOWED` cho tenant → sự cố vận hành.

## 3. Kết Quả Kỳ Vọng

- `toItem()` gán `item.allowedPlugins = tenant.allowedPlugins;` (đồng bộ với `detail()`), **hoặc** frontend gọi API detail `GET /platform/tenants/{id}` trước khi mở Drawer hạn mức.
- Drawer khi mở lại phải phản ánh đúng `allowed_plugins` đã lưu.
- Bổ sung test backend khẳng định list item chứa `allowed_plugins` (PostgreSQL thật, không H2).

## 4. Xác Nhận Khắc Phục (QA Verification)

- [ ] Developer sửa mapping `toItem()` hoặc chuyển Drawer sang dùng API detail.
- [ ] QA re-test theo đúng 6 bước tái hiện; xác nhận `sales` checked sau khi mở lại và DB không bị ghi đè khi bấm Lưu lại.
- [ ] Bổ sung bằng chứng ảnh chụp + kết quả API vào `08_testing/test_report.md`.

## Ghi Chú QA (2026-09-19)

- Phát hiện trong QA-W-02 (Quota Drawer) của đợt kiểm thử trình duyệt Dual-Mode Sprint 02.
- Bản thân thao tác lưu quota / khóa / mở khóa tenant trong QA-W-02 vẫn **PASS**; lỗi này là bug riêng về dữ liệu list API và trạng thái Drawer.

## Ghi Chú Hoàn Thành (2026-09-19)

- **Sửa gốc theo phương án backend** (giữ 1 nguồn dữ liệu cho Drawer, không cần gọi API detail):
  - `src/backend/.../modules/platform/dto/PlatformResponses.java:44-45` — bổ sung `allowedPlugins` (`@JsonProperty(ALLOWED_PLUGINS)`) vào `TenantItem`.
  - `src/backend/.../modules/platform/service/PlatformTenantService.java:306` — `toItem()` gán `item.allowedPlugins = tenant.allowedPlugins;` đồng bộ với `detail()` (`:105`).
- **Test**: `PlatformTenantApiTest.testListIncludesAllowedPlugins` — PATCH quota `["core","sales"]` rồi `GET /platform/tenants?keyword=...` khẳng định `data.items[0].allowed_plugins` chứa `core` + `sales` (PostgreSQL thật).
- Kiểm chứng: full `mvn test` **187/187 PASS** (BUILD SUCCESS, PostgreSQL + Redis thật, không H2).
- **Còn lại cho QA**: re-test 6 bước tái hiện trên trình duyệt + chụp ảnh bổ sung vào `08_testing/test_report.md`.

## Ghi Chú QA Re-test (2026-09-19) — QA-R-74

- **PASS phần backend/BUG gốc**: `GET /api/v1/platform/tenants?keyword=qa-test-corp-02` trả `allowed_plugins = ["core","sales"]`; Drawer đọc trực tiếp từ list (không rơi fallback detail); Lưu 2 lần liên tiếp **không ghi đè mất `sales`** (DB giữ `["core", "sales"]`).
- **FAIL phần hiển thị switch (bug mới)**: Drawer **không hiển thị switch `sales`** do catalog `GET /platform/plugins` chỉ có `core` → nhóm TÙY CHỌN trống. Đã tách thành **BUG-80** (High).
- Ảnh: `../08_testing/screenshots/web/QA-R-74_a_quota_drawer_open_state.png`, `QA-R-74_b_quota_saved.png`, `QA-R-74_c_quota_reopen_after_save.png`.
- **Kết luận item**: Fix BUG-74 (map `allowed_plugins` ở list) **đạt** — không tái phát lỗi mất dữ liệu; phần UI switch thuộc BUG-80. Giữ trạng thái **Done** cho BUG-74.
