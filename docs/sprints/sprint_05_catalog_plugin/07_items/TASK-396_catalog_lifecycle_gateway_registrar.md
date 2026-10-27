# [TASK-396] Lifecycle, provisioning, entity/permission registrar, gateway

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-396 / Task / Sprint 05 |
| Severity / trạng thái | High / **Done (dev)** — lifecycle, gateway, entity registrar, BUG-136, fan-out + platform route; QA verify ở TASK-398 |
| Owner / reviewer | Developer / Architect |
| depends_on / blocks | TASK-394, TASK-395 / TASK-397, TASK-398 |
| Write scope | `modules/plugin/service/PluginLifecycleService.java`, `PluginProvisioningService.java`, `PluginRuntimeGatewayService.java`, `PluginPermissionSeeder.java`, `EntityRegistryService.java`, `PluginFanoutService.java`, `TenantType.java`, `PlatformPluginRuntimeResource.java`, seed `plugin_versions` |

## 1. Mục tiêu

Cài `catalog` qua đúng saga Sprint 03; platform admin quản trị system catalog qua system tenant; fan-out cập nhật từng tenant schema; API qua gateway.

## 2. Việc phải làm

- [ ] Seed `plugin_catalog` (`default_install = TRUE`, `locked = TRUE`) + `plugin_versions` published (distribution image, manifest, permissions, entities, ui_manifest).
- [ ] `PluginProvisioningService`: bỏ nhánh `activateInProcess`; mọi default plugin dùng `PluginLifecycleService.install`; bỏ qua system tenant khi provision tenant thường.
- [ ] `uninstall` chặn `locked` → `PLUGIN_LOCKED_DEFAULT` (BUG-136).
- [ ] Entity registrar: đọc `plugin_versions.entities` khi cài/publish, ghi `sys_entity_registry` với `plugin_id = plugin_key`.
- [ ] Permission seeder: seed 5 quyền `catalog:*` khi cài; không seed bằng migration core.
- [ ] `TenantType.SYSTEM` + filter system tenant khỏi list/quota/báo cáo; seed fixed UUID.
- [ ] `PluginFanoutService`: enumerate tenant `catalog` ACTIVE (trừ system), gọi `POST /internal/system-catalog/sync` trên từng instance, ghi operation log + retry; contract versioned.
- [ ] Platform route `/api/v1/platform/plugins/runtime/catalog/**`: platform token → system tenant; plugin UI/API quản trị system catalog.
- [ ] Gateway: forward `X-User-Permissions` + `X-User-Roles` + `X-Tenant-Id`/`X-User-Id`; kiểm tra ledger ACTIVE.
- [ ] Xoá `/api/v1/catalog/**` khỏi core; client đổi sang `/api/v1/plugins/runtime/catalog/**`.
- [ ] Test: cài/gỡ/bật/tắt catalog; locked uninstall 403; gateway 403; fan-out 1 tenant lỗi không chặn tenant khác; system tenant ẩn.

## 3. Tiêu chí nghiệm thu

- Tenant mới được cài catalog qua lifecycle, có `storage_schema` + `deploy_ref` thật.
- Không còn `activateInProcess`; không còn endpoint core catalog.
- `uninstall` locked trả `PLUGIN_LOCKED_DEFAULT`; disable/enable hoạt động.
- Entity Registry có 4 dòng `plugin_id = catalog` sau cài.
- Publish system catalog → mọi tenant ACTIVE nhận bản sao mới; tenant lỗi có retry/trạng thái riêng.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Tạo task; gộp BUG-136 | Agent; ADR-S05-001 |
| 0.2 | 2026-10-27 | **Done phần lifecycle**: bỏ `activateInProcess`; provisioning dùng install saga; thêm `PluginEntityRegistrar` (manifest entities → `sys_entity_registry`); `uninstall` chặn locked; test `PluginLifecycleApiTest` 10/10 PASS (gồm BUG-136). Gateway header/fan-out còn P3. |
| 0.3 | 2026-10-27 | **Gateway headers**: forward `X-User-Permissions`/`X-User-Roles` từ security context; plugin token mang permissions/roles; `PluginLifecycleApiTest` 10/10 PASS. Còn platform route + fan-out. | Developer Agent; PostgreSQL/Redis thật |
| 0.4 | 2026-10-27 | **Fan-out done (dev)**: plugin `SystemCatalogSyncService` snapshot/apply; core `PluginFanoutService` + `POST /api/v1/platform/plugins/catalog/fanout`; dev Docker system tenant + tenant plugin. Test thật: snapshot 5 types/3355 items/3321 edges → sync **0 skipped**. | Developer Agent; Docker dev | Developer Agent; PostgreSQL/Redis thật |
