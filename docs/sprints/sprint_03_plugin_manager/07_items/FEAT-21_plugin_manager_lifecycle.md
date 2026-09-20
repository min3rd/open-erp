# [FEAT-21] Plugin Manager — Danh Mục, Vòng Đời & Marketplace Plugin

- **Mã Tính Năng**: FEAT-21
- **Phân Loại**: Feature / Core Platform
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Yêu Cầu**: Khách hàng (Gate 2026-09-19)
- **Người Xử Lý (Assignee)**: Developer Agent (Backend & Web/Mobile)
- **Thuộc Sprint**: Sprint 03 - Plugin Manager, Plugin CLI & Cơ Chế Phân Phối Plugin
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred
- **Ngày Tạo**: 2026-09-20
- **Tài Liệu Thiết Kế**: [DES-03-DB](../06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md), [DES-03-API](../06_designs/api/PLUGIN_MANAGER_API_SPEC.md), [DES-03-UI](../06_designs/ui_ux/PLUGIN_MANAGER_UI_SPEC.md), [SOL-01](../05_solutions/SOL-01_plugin_manager_architecture_and_lifecycle.md)

---

## 1. Mô Tả Yêu Cầu

Quản lý plugin tùy chọn cấp hệ thống và theo tenant: danh mục + phiên bản (SemVer), một bảng duy nhất `tenant_plugins` (entitlement + vòng đời + phiên bản ghim + deploy), cài/gỡ/bật/tắt/nâng cấp/rollback có bù trừ, cài mặc định hệ thống, plugin riêng của tenant, khóa khẩn cấp 2 cấp (catalog/version) + cưỡng chế gỡ + thông báo, Marketplace Web + Mobile read-only, audit bất biến.

## 2. Phạm Vi & Tham Chiếu

- **In-scope**: toàn bộ AC-21.1 → AC-21.7 tại [CONF-01](../04_confirmation/CONF-01_sprint_03_scope.md); các quyết định Gate #1–#21.
- **Phụ thuộc**: FEAT-23 (Deployer, Datasource, artifact) và FEAT-22 (CLI tạo plugin phục vụ QA) — có thể phát triển song song theo interface đã chốt.
- **Ngoài phạm vi**: purge dữ liệu, trial, marketplace bên thứ ba.

## 3. Tiêu Chí Nghiệm Thu (Theo CONF-01)

- [ ] AC-21.1 Cài plugin cho tenant (container riêng + plugin tự migrate + health + menu theo RBAC).
- [ ] AC-21.2 Gỡ giữ nguyên dữ liệu; cài lại dùng lại dữ liệu (migration idempotent).
- [ ] AC-21.3 Đa phiên bản song song giữa các tenant.
- [ ] AC-21.4 Khóa khẩn cấp 2 cấp: chặn publish/cài mới, cưỡng chế gỡ toàn bộ tenant, thông báo, dữ liệu giữ nguyên; P25/P26 unblock chỉ SUPER_ADMIN.
- [ ] AC-21.5 Cài mặc định: `locked=true` → ACTIVE không tắt/gỡ; `locked=false` → NOT_INSTALLED chờ bật.
- [ ] AC-21.6 Plugin riêng của tenant (`TENANT_PRIVATE`): đăng ký/cài cho chính mình; tenant khác không thấy; Super Admin giám sát + khóa.
- [ ] AC-21.7 Chặn gỡ khi có dependents + trả lộ trình thứ tự gỡ.

## 4. Phân Rã Sub-Task (Inline)

| Mã | Nhiệm Vụ | Tầng | Phụ Trách | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| **TASK-301** | Flyway `V3.0.0` schema 7 bảng + ALTER tenants + trigger scope/publish + seed Core slots; `V3.0.1` seed/placeholder catalog; `V3.0.2` backfill `allowed_plugins` + đối soát per-tenant/key (fail-fast) | Backend/DB | Dev Backend | In Review |
| **TASK-302** | Module `modules/plugin`: enums (`TenantPluginStatus`, `PluginCatalogStatus`, `PluginVisibility`, `PluginReleaseStatus`, `PluginStorageModel`, `PluginDistributionType`, `PluginRenderMode`, `PluginRollbackStrategy`, `PluginMigrationPolicy`, `PluginCredentialScope`, `PluginOperationType` + TS mirror), DTO (thực thi cùng TASK-303), `PluginErrorCode`, `PluginResponseKey`, repository | Backend | Dev Backend | In Review |
| **TASK-303** | Catalog & Version APIs: **P2, P3, P5–P8, P24, P25, P26, T2 (tenant detail, entitlement/own-private guard) đã code** + validate manifest/SemVer/permission/UI slot; P1 (phân trang, dual-mode với FEAT-20 — BUG-94) đã code tại endpoint cũ; P4 (upload artifact) → TASK-332; P14/P15 (governance tenant-private) → TASK-308; P9–P13 → TASK-306/307 | Backend | Dev Backend | In Review |
| **TASK-304** | Ledger `tenant_plugins` + Saga orchestrator: pre-flight → ledger → datasource → deploy → health → seed quyền → **precondition check cuối** → ACTIVE; bù trừ đầy đủ; Redis lock + optimistic lock (`row_version`). **Đã code install/enable/disable/uninstall + marketplace + S2; upgrade/rollback → TASK-310** | Backend | Dev Backend | In Progress |
| **TASK-305** | Dependency resolver: SemVer comparator + range parser; kiểm tra thiếu phụ thuộc (`PLUGIN_DEPENDENCY_MISSING`), dependents + removal plan (`PLUGIN_HAS_DEPENDENTS`), cycle detection | Backend | Dev Backend | To Do |
| **TASK-306** | Entitlement APIs P12/P13 + tương thích ngược `PATCH /platform/tenants/{id}/quotas` (suy ra `allowed_plugins` từ ledger) + nâng cấp `TenantPluginAllowlistService` (chỉ ACTIVE). **Đã code allowlist ledger + core always-on + P12/P13 + quota sync grant ledger** | Backend | Dev Backend | In Review |
| **TASK-307** | Cài mặc định hệ thống: `default_install`/`locked`, hook provisioning khi tạo tenant, job bulk apply + preview (`operation_id`, báo cáo từng tenant). **Đã code `PluginProvisioningService` + hook `AuthService.registerBusiness` + `PluginBulkApplyService` (preview/apply P10/P11); async job theo dõi tiến trình → TASK-312** | Backend | Dev Backend | In Review |
| **TASK-308** | Khóa khẩn cấp: scope VERSION/CATALOG, force-uninstall fans-out, atomic gate (catalog/version lock + gateway), thông báo tenant, audit. **Đã code P7 force-uninstall + P12/P13 + P14/P15 + P19–P23 + audit; gateway/CSP enforcement → TASK-340** | Backend | Dev Backend | In Review |
| **TASK-309** | Permission seeding (TENANT_OWNER nhận quyền plugin mới) + đồng bộ UI slots từ `ui_manifest` khi publish + **UI Manifest API (S1)** resolve theo ACTIVE + RBAC + installed host version | Backend | Dev Backend | In Review |
| **TASK-310** | Upgrade/Rollback an toàn dữ liệu: `migration_policy`, quiesce, snapshot + preservation snapshot, preflight 4 điều kiện, `ROLLBACK_FAILED`, `rollback_strategy` (SNAPSHOT_RESTORE/DOWN_MIGRATION + verify), P19–P23 | Backend | Dev Backend | In Review |
| **TASK-311** | Notification service: `tenant_notifications`, API T12/T13, gửi khi block/force-uninstall/update/fail; bell + banner | Backend | Dev Backend | In Review |
| **TASK-312** | Operation status API (S2) + `plugin_operation_logs` ghi vết từng bước Saga + job recovery (idempotent) | Backend | Dev Backend | To Do |
| **TASK-313** | Audit & metrics vòng đời: `PlatformAction`/`TenantAction` mở rộng, hash-chain, thống kê adoption/version lỗi thời. **Đã code 19 `PlatformAction` plugin + `PluginAuditService` wired vào catalog/lifecycle/governance/entitlement; metrics để TASK-345/PM** | Backend | Dev Backend | In Review |
| **TASK-314** | Unit/Integration Test (JUnit 5 + RestAssured, PostgreSQL + Redis thật): vòng đời, đa phiên bản, isolation 2 tenant, entitlement/backfill, dependency, block/unblock, upgrade/rollback, notification. **Đã có `PluginLifecycleApiTest` (5 case PASS) + `TenantPluginAllowlistServiceTest`; bổ sung isolation/đa tenant → In Review** | Backend | Dev Backend | In Progress |
| **TASK-315** | Web Portal Super Admin: `/platform/plugins` split-screen + Drawer 3 tầng, Block/Bulk Apply drawers, `/platform/plugin-credentials`, `/platform/tenant-private-plugins`, badge "Đã khóa", unblock P25/P26. **Đã code đủ 3 màn: catalog split-screen (list phân trang + filter, detail metadata/versions/tenant P9 + support P19–P23 + entitlement P12/P13), Drawers đăng ký/sửa metadata, đăng ký phiên bản 3 kênh + upload, khóa khẩn cấp, bulk apply, polling S2; credentials page (P16–P18, form che secret, test connection); tenant-private page (P14/P15 khóa plugin riêng); backend P9; build PASS** | Web | Dev Web | In Review |
| **TASK-316** | Web Marketplace tenant `/settings/plugins`: nhóm Đã cài/Có thể cài/Plugin riêng, version picker, gỡ có cảnh báo giữ dữ liệu, banner thông báo, notification bell. **Đã code trang + `PluginService` tenant (T1–T7, S2, T12/T13) + Drawer chi tiết/version-timeline + Drawer nâng cấp (snapshot bắt buộc khi BREAKING) + Drawer gỡ (soft) + Drawer thông báo + banner khóa; notification bell trên TopBar → TASK-320; build PASS** | Web | Dev Web | In Review |
| **TASK-317** | Web: Drawer "Đăng ký plugin riêng" (3 kênh + quản lý phiên bản T14–T18) + `/settings/plugin-credentials` | Web | Dev Web | To Do |
| **TASK-318** | Shared components: `plugin-management-list` (nâng cấp `plugin-switch-list`), `plugin-card`, `version-timeline`, `operation-progress`, `credential-form`, `render-mode-badge` (đóng gói vào `src/frontend/shared`). **Đã code 6 component + TS models `plugin.model.ts` + i18n vi/en 4 từ điển; tsc strict PASS** | Shared UI | Dev Web | In Review |
| **TASK-319** | Mobile (Ionic): màn `/settings/plugins` read-only + banner thông báo; touch ≥ 40px; overflow 0 | Mobile | Dev Mobile | To Do |
| **TASK-320** | i18n vi/en parity cho toàn bộ key plugin-manager + QA dual-mode (Web ≥1280, emulation 390x844, 0 console error) + ảnh minh chứng | Web/Mobile/QA | Dev + QA | To Do |

## 5. Ghi Chú

- **[TASK-301 — In Review]** 3 migration `V3.0.0/V3.0.1/V3.0.2` đã chạy thành công trên PostgreSQL 16 thật (single transaction + rollback, không đổi dữ liệu ứng dụng): tạo 7 bảng + trigger + 2 Core slot; backfill entitlement `sales` cho tenant hiện hữu; verification fail-fast PASS. Bằng chứng: [TASK-301_migration_pg_verify.txt](../08_testing/evidence/TASK-301_migration_pg_verify.txt).
- **[TASK-302 — In Review]** Module `modules/plugin` đã tạo: 11 enum Java (`core.enums`) + mirror TS (`@shared/enums/plugin.enum.ts`), `PluginErrorCode` (success + error codes theo DES-03-API mục 6), `PluginResponseKey` (+ nested `Json`), 7 entity (`@RegisterEntity` pluginId `core-plugin`) và 7 repository. `mvn -DskipTests compile` **PASS** (2026-09-20); DTO triển khai cùng TASK-303.
- **[TASK-303 — In Review]** Đã code: `PluginAdminService` (register/update/detail/delete catalog; register version DRAFT + validate manifest/SemVer/permission/dependency/UI slot + build `distribution` 3 kênh; publish/deprecate/block/unblock version gọi hàm DB atomic; block/unblock catalog có xác nhận `confirm_text`) + `PlatformPluginAdminResource` (P2/P3/P5/P6/P7/P8/P24/P25/P26; SUPER_ADMIN ghi, SUPPORT_ENGINEER chỉ xem) + `PluginRequests/PluginResponses`. `mvn compile` PASS và `PlatformPluginApiTest/PlatformPluginCatalogConfigTest` PASS (app boot không xung đột path). Audit wiring chuyển TASK-313.
- **[TASK-304 — In Progress]** Đã code install/enable/disable/uninstall + marketplace list + operation status: `PluginLifecycleService` (saga có bù trừ, `PluginOperationLockService` Redis lock, `PluginOperationLogService` vết bước), `ProcessPluginRuntimeDeployer` (docker CLI + runtime `noop` cho test), `TenantDatasourceService` (schema + role least privilege, mật khẩu cấp mới mỗi deploy), `LocalArtifactStorage`, `PluginSemver`, `PluginDependencyResolver`, `TenantPluginResource` (T1/T3/T4/T5/T7 + `@RequirePermission`), `PluginOperationResource` (S2). `mvn compile` + 3 test plugin PASS. Upgrade/rollback/snapshot chuyển TASK-310; permission seeding/UI Manifest chuyển TASK-309; notification chuyển TASK-311; audit TASK-313.
- Mọi API tuân thủ 4 khuôn mẫu + `PluginErrorCode`/`PluginResponseKey`; không hardcode chuỗi.
- Saga phải **idempotent** và có recovery sau restart; không bao giờ xóa dữ liệu tenant.
- Phối hợp FEAT-23 để chốt interface `PluginRuntimeDeployer`/`TenantDatasourceService` trước khi code TASK-304.
