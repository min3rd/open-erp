# [BUG-135] Catalog triển khai như module core in-process, không phải plugin độc lập

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-135 / Bug kiến trúc / Sprint 05 |
| Mức độ / trạng thái | **High — chặn đóng Sprint 05** / **Resolved (dev+QA)** 2026-10-28 — mobile host [TASK-403](TASK-403_mobile_plugin_screen_host.md) PASS |
| Phát hiện bởi / ngày | Chủ dự án (re-check) + Agent rà soát / 2026-10-27 |
| Owner / reviewer | Solution Architect (thiết kế lại) → Developer (di trú) / PM + QA |
| Liên quan | [SOL-S05-001](../05_solutions/01_SOL-S05-001_catalog_plugin_architecture.md) D1, [FEAT-30](FEAT-30_catalog_core_plugin.md), [TASK-375](TASK-375_migration_v4_catalog_schema.md), [TASK-376](TASK-376_plugin_registration_entity_registry.md), Sprint 03 [CONF-01](../../sprint_03_plugin_manager/04_confirmation/CONF-01_sprint_03_scope.md) |
| Ảnh hưởng | Toàn bộ 19 task Sprint 05; dữ liệu 4 bảng; UI Web/Mobile; marketplace/lifecycle |

## 1. Mô tả

Sprint 05 đang triển khai `catalog` theo **D1 — core plugin chạy in-process trong backend monolith** ([SOL-S05-001 §2](../05_solutions/01_SOL-S05-001_catalog_plugin_architecture.md)): mã nằm trong `modules/catalog`, migration nằm trong core, UI native nằm trong Web/Mobile core. Đây **không phải mô hình plugin độc lập** đã được khách hàng chốt tại Sprint 03 (repo/artifact riêng, container-per-tenant, schema riêng, API qua gateway, UI qua manifest WC/MF/iframe).

D1 mới ở trạng thái **Đề xuất**, Design ready gate vẫn `Draft`; Reading Guide đã ghi rõ “nếu muốn đóng gói riêng thì D1 phải đổi”. Việc lập trình đã đi trước review kiến trúc.

## 2. Bằng chứng sai lệch

| # | Mô hình plugin độc lập (Sprint 03) | Thực tế Sprint 05 | Bằng chứng |
| :--- | :--- | :--- | :--- |
| 1 | Plugin là repo/artifact riêng, có `plugin.json` ở gốc, đóng gói image hoặc JAR bundle + checksum | Mã nằm trong backend core `modules/catalog`; manifest đặt trong `src/main/resources/plugins/catalog/plugin.json`; `packaging = CORE_IN_PROCESS` | `src/backend/src/main/java/com/vn9melody/openerp/modules/catalog/**`; [plugin.json](../../../../plugins/catalog/plugin.json) |
| 2 | Cài qua `PluginLifecycleService`: pre-flight → datasource → deploy container → health → seed quyền → ACTIVE | Kích hoạt thẳng ledger bằng `activateInProcess`; không có `plugin_versions`, không deploy, không healthcheck, không seed quyền qua installer | `PluginProvisioningService.activateInProcess` (dòng 70–76, 104–115) |
| 3 | Dữ liệu plugin ở schema riêng `tenant_<short>_<plugin>` + DB role least privilege | 4 bảng nằm trong schema `public`, dùng `tenant_id` và lọc ở tầng ứng dụng; không RLS, không role riêng | [V4.0.0](../../../../src/backend/src/main/resources/db/migration/V4.0.0__catalog_core_plugin.sql) dòng 4, 31, 59, 96, 123 |
| 4 | Plugin tự chạy migration trong schema tenant khi container khởi động | Migration `V4.0.0` của core tạo bảng + seed + backfill; ledger ghi `storage_model = DEDICATED_SCHEMA` nhưng schema đó không tồn tại | V4.0.0 dòng 251–256; [DES-DB §6.1 #7](../06_designs/db/01_DES-DB-S05-001_catalog_schema.md) |
| 5 | API plugin đi qua runtime gateway `/api/v1/plugins/runtime/{key}/**`, có kiểm tra ledger ACTIVE | API core `/api/v1/catalog/**`; không tham chiếu `tenant_plugins`/`TenantPlugin`; gỡ hoặc tắt plugin vẫn gọi được | `modules/catalog/resource/*` (`@Path("/api/v1/catalog/...")`); không có guard ledger trong module catalog |
| 6 | UI lấy từ `plugin_versions.ui_manifest`, render `WEB_COMPONENT` / `MODULE_FEDERATION` / `IFRAME` | UI native hardcode trong route Web/Mobile; descriptor khai `render_mode = NATIVE` — **không có trong enum** `PluginRenderMode` | `src/frontend/web/src/app/app.routes.ts` dòng 194, 244; `src/frontend/mobile/src/app/app.routes.ts` dòng 116; `PluginRenderMode.java` |
| 7 | Quyền do plugin khai báo và seed khi cài | 5 quyền `catalog:*` được seed bằng migration core; `catalog:system:manage` gắn `is_system = FALSE` | V4.0.0 dòng 167–183 |
| 8 | Plugin core/locked không gỡ được (AC-14) | `uninstall` không kiểm tra `catalog.locked`; API vẫn cho gỡ | `PluginLifecycleService.uninstall` (dòng 227–271) — xem thêm [BUG-136](BUG-136_locked_plugin_uninstall_not_blocked.md) |
| 9 | Core tối giản: chỉ auth/tài khoản/phân quyền/quản lý plugin | Core chứa 4 bảng nghiệp vụ, 7 resource, 8 service, DTO/repository của catalog | `src/backend/src/main/java/com/vn9melody/openerp/modules/catalog/**` |
| 10 | Hợp đồng liên plugin qua Entity Registry/gateway | `catalog-picker` gọi trực tiếp API core `/api/v1/catalog/*`; plugin khác cũng sẽ gọi core, không qua plugin | `src/frontend/shared/services/catalog.service.ts` |

## 3. Hệ quả

- **Cách ly tenant mất lớp phòng thủ theo schema**: dữ liệu catalog nằm chung `public`, chỉ dựa vào điều kiện `tenant_id` trong từng câu truy vấn. Một query quên lọc là rò rỉ chéo tenant; không có RLS/role riêng để chặn.
- **Ledger sai sự thật**: `tenant_plugins` ghi ACTIVE + `DEDICATED_SCHEMA` nhưng không có schema/deployment. Marketplace, disable, uninstall, upgrade/rollback, snapshot, operation log đều không áp dụng đúng cho catalog.
- **Không thể nâng cấp/gỡ theo vòng đời**: không có `plugin_versions`, artifact, checksum; không thể rollback, không thể cài nhiều phiên bản.
- **UI/API không đi qua cổng plugin**: tắt/gỡ plugin không có tác dụng; UI vẫn hiện; quyền truy cập không phụ thuộc trạng thái cài đặt.
- **Trái cam kết Sprint 03**: “mọi plugin đều chạy container”, “plugin data không nằm trong schema public”, “repo plugin độc lập”. Đây là điều kiện DoD, không phải cải tiến tùy chọn.

## 4. Nguyên nhân gốc

1. D1 được đưa vào SOL khi chưa review kỹ thuật; Design ready gate chưa đóng.
2. Áp lực “always-on + dùng chung cho mọi plugin” bị diễn giải thành “phải nằm trong core”, bỏ qua khả năng plugin độc lập + API gateway.
3. Không có bài kiểm tra tuân thủ kiến trúc (architecture fitness test) chặn merge khi plugin nghiệp vụ nằm trong core.

## 5. Hướng khắc phục đề xuất

### Phương án A — Đúng mô hình Sprint 03 (khuyến nghị)

Tách `catalog` thành plugin độc lập thực sự:

1. Repo/module plugin riêng (`plugins/catalog` hoặc repo ngoài + submodule) với `plugin.json` ở gốc, build Quarkus, Dockerfile/K8s, migration `db/plugin-migration/`.
2. Đăng ký artifact + publish `plugin_versions` (image hoặc JAR bundle), seed `plugin_catalog` với `default_install = TRUE`, `locked = FALSE`; tenant bật/tắt/gỡ trong quản lý plugin.
3. Cài qua `PluginLifecycleService` (không còn `activateInProcess`); tenant mới provisioning dùng đúng hook; backfill tenant cũ bằng job cài đặt.
4. Dữ liệu vào schema `tenant_<short>_catalog`; bỏ 4 bảng khỏi `public`; chuyển dữ liệu hiện có (nếu có) sang schema tenant trước khi drop.
5. API plugin qua gateway `/api/v1/plugins/runtime/catalog/**`; core không còn `/api/v1/catalog/**`.
6. UI đóng gói WC/MF (hoặc iframe), khai báo `ui_manifest`; xoá route/menu native khỏi Web/Mobile core; `catalog-picker` dùng URL gateway.
7. Quyền seed khi cài bằng `PluginPermissionSeeder`, không bằng migration core.
8. Xử lý **danh mục hệ thống dùng chung**: chủ dự án chốt **plugin sở hữu** (system tenant ẩn) và **fan-out** cập nhật bản sao vào từng tenant schema qua `PluginFanoutService`; core không có bảng catalog. Chi tiết tại [ADR-S05-001 A6](../05_solutions/02_ADR-S05-001_catalog_independent_plugin.md).
9. Xoá `modules/catalog` khỏi core; migration V5 dọn bảng public sau khi di trú; cập nhật test/QA/docs.

**Ước lượng**: 1 sprint riêng (backend plugin + migration dữ liệu + UI bundle + QA dual-mode). Có thể chia phase: backend/schema trước, UI sau.

### Phương án B — Plugin package trong monorepo (nhanh hơn, vẫn độc lập runtime)

Giống A nhưng source nằm trong `plugins/catalog` của monorepo (chưa tách repo/submodule). Vẫn build image/container riêng, schema riêng, API gateway, UI manifest. Chấp nhận lệch quy ước “repo riêng + submodule” của Sprint 03; ghi ADR.

### Phương án C — Giữ in-process nhưng ép đúng contract plugin (không khuyến nghị)

Giữ mã trong core, nhưng: thêm version/manifest vào `plugin_versions`, gate API theo ledger, đưa API qua gateway, thêm render mode `NATIVE`, migration sang schema tenant. Vẫn không đạt “plugin độc lập”; chỉ giảm thiệt hại. Không nên chọn nếu yêu cầu là mô hình Sprint 03.

## 6. Tiêu chí nghiệm thu sau sửa

- [ ] `modules/catalog` không còn trong backend core; core không compile catalog.
- [ ] `plugin_versions` có ít nhất một bản published cho `catalog`; `tenant_plugins` có `storage_schema` thật và `deploy_ref` thật.
- [ ] Không còn bảng `catalog_*` trong schema `public`; dữ liệu nằm trong schema `tenant_<short>_catalog`.
- [ ] `/api/v1/catalog/**` trả 404; mọi call đi qua `/api/v1/plugins/runtime/catalog/**`.
- [ ] Gỡ/tắt plugin ⇒ UI và API catalog không còn truy cập được; bật lại ⇒ hoạt động.
- [ ] `uninstall` plugin locked trả `PLUGIN_LOCKED_DEFAULT` (AC-14).
- [ ] Web/Mobile không còn route/menu catalog native; UI tải từ manifest plugin.
- [ ] Test backend + QA dual-mode cập nhật; `TR-S05-001` chạy lại trên baseline mới.
- [ ] ADR ghi rõ cách xử lý system catalog dùng chung và phương án di trú dữ liệu.

## 7. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Tạo bug sau re-check của chủ dự án; ghi 10 sai lệch + 3 phương án | Agent rà soát; đối chiếu SOL-S05-001, Sprint 03 CONF-01, mã nguồn hiện tại |
| 0.2 | 2026-10-27 | Chốt hướng B; system catalog do plugin sở hữu + fan-out tenant schema (ADR-S05-001 0.2) | Chủ dự án chỉ đạo trực tiếp |
| 0.3 | 2026-10-28 | QA P5: backend/runtime/web đạt; mobile còn native UI | Agent; xem §8 |
| 0.4 | 2026-10-28 | **Resolved (dev+QA)**: mobile plugin host + read-only + touch 40px PASS; 9/9 tiêu chí §6 đạt | Developer/QA |

## 8. Trạng thái khắc phục (2026-10-28)

| # | Tiêu chí | Kết quả | Bằng chứng |
| :--- | :--- | :--- | :--- |
| 1 | `modules/catalog` không còn trong core | ✅ | `grep modules/catalog` rỗng; API legacy `GET /api/v1/catalog/types` → **404** |
| 2 | `plugin_versions` published + ledger `storage_schema`/`deploy_ref` thật | ✅ | `plugin_versions` 1.0.0 PUBLISHED; `tenant_plugins` trỏ container catalog + schema `tenant_<short>_catalog` |
| 3 | Không còn bảng `catalog_*` trong `public` | ✅ | `information_schema` chỉ thấy 5 bảng × schema tenant/system, không có `public` |
| 4 | API chỉ qua gateway | ✅ | Gateway không token → 401; plugin API qua `/api/v1/plugins/runtime/catalog/**` PASS |
| 5 | Tắt/gỡ plugin ⇒ UI/API không truy cập | ✅ (dev) | `PluginLifecycleApiTest` + gateway ledger check; UI manifest bỏ screen |
| 6 | Uninstall plugin locked | ✅ | `PluginLifecycleApiTest` 403 `PLUGIN_LOCKED_DEFAULT` PASS |
| 7 | Web không còn route native; UI từ manifest | ✅ | `/settings/apps/catalog` host iframe; 20 rows, overflow 0, 0 console error |
| 8 | Mobile không còn route native; UI từ manifest | ✅ | Mobile host iframe + `readonly=1`; 390×844: 20 rows, overflow 0, touch ≥40px, 0 console error |
| 9 | Test backend + QA dual-mode + TR mới | ✅ | Backend **266 PASS / 0 fail / 1 skip**; web + mobile plugin UI PASS; [TR-S05-002](../08_testing/03_TR-S05-002_plugin_architecture_test_report.md) |
