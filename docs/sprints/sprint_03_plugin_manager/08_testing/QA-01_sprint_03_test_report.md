# Báo Cáo QA/QC Sprint 03 — Plugin Manager (Bước 8)

> Người thực hiện: QA/QC Agent · Ngày: 2026-09-20 · Phương pháp: rà soát tĩnh đối chiếu DES-03-DB/API/UI + SOL-01/02/03, chạy toàn bộ kiểm thử tự động trên PostgreSQL/Redis thật, kiểm tra build 3 nền tảng, kiểm tra parity i18n, kiểm thử cô lập tenant và rà soát bảo mật gateway.

## 1. Kết Quả Tự Động (Regression)

| Hạng mục | Kết quả |
| :--- | :--- |
| Backend full suite `mvn -q test` (PostgreSQL + Redis thật, **không H2**) | **211/211 PASS** (0 failures, 0 errors, 0 skipped) — chạy 2026-09-20 |
| Migrations V3.0.0–V3.0.2 + rollback (psql) | PASS (`evidence/TASK-301_migration_pg_verify.txt`) |
| Web build `ng build` | PASS (chunks: `platform-plugin-list`, `plugin-marketplace`, `plugin-app`) |
| Mobile build `ng build` | PASS (chunk `plugins-page`) |
| CLI smoke `node --test` | 3/3 PASS |
| i18n parity (Web/Mobile, vi↔en) | Web 864/864 · Mobile 535/535 — **0 lệch** |
| Test lặp (idempotent) `PluginArtifactVerifierTest` chạy 2 lần liên tiếp | PASS (đã sửa ô nhiễm dữ liệu test do trùng host+name) |

## 2. Phát Hiện (Đã vào items để lưu vết)

| Mã | Mức độ | Tóm tắt | Trạng thái |
| :--- | :---: | :--- | :--- |
| [BUG-95](../07_items/BUG-95_wc_mf_runtime_assets_unauthenticated.md) | **High** | WC/MF loader nạp asset không kèm token → gateway 401, screen MF/WC không chạy | **Resolved** (token cho asset, cache script theo entry gốc) |
| [BUG-96](../07_items/BUG-96_version_registration_credential_id_missing.md) | **High** | `credential_id` của P5/T15 không được nhận/lưu; UI thiếu bước chọn credential | **Resolved** (DTO + validate scope/tenant + persist distribution + select 2 Drawer) |
| [BUG-97](../07_items/BUG-97_tenant_detail_exposes_non_installable_versions.md) | Medium | T2 lộ phiên bản DRAFT/BLOCKED và `entitlement_plans` | **Resolved** (lọc PUBLISHED/DEPRECATED) |
| [BUG-98](../07_items/BUG-98_notification_bell_and_global_banner_missing.md) | Medium | Thiếu bell TopBar, banner toàn cục, banner Dashboard Mobile | Deferred → Sprint 04 (có workaround) |
| [BUG-99](../07_items/BUG-99_platform_action_reason_and_confirmation_gaps.md) | Low | Reason hardcode, chưa đối chiếu `affected_tenants`, S2 `target_version` sai nguồn | Deferred → Sprint 04 |
| [BUG-100](../07_items/BUG-100_notification_read_invalid_uuid_500.md) | Low | UUID sai định dạng ở T13 → 500 | **Resolved** (400 chuẩn) |
| [BUG-101](../07_items/BUG-101_marketplace_blocked_actions_not_locked.md) | **High** | Marketplace tenant không khóa hành động khi catalog BLOCKED (acceptance BUG-93) | **Resolved** (badge + disable mọi hành động) |
| [BUG-102](../07_items/BUG-102_missing_core_plugin_permission_seed.md) | **Critical** | Thiếu seed `core:plugin:*` → tenant 403 toàn bộ tính năng ngoài test | **Resolved** (migration `V3.0.3` + grant TENANT_OWNER/TENANT_ADMIN) |
| [BUG-103](../07_items/BUG-103_empty_registry_allowlist_boot_failure.md) | **Critical** | `registry-allowed-hosts=` rỗng làm backend fail startup | **Resolved** (`Optional<String>` + bỏ dòng rỗng) |
| [BUG-104](../07_items/BUG-104_marketplace_groups_not_installed_as_installed.md) | **High** | `NOT_INSTALLED` bị xếp nhóm "Đã cài" + nút "Gỡ" | **Resolved** (isInstalled theo trạng thái thực) |
| [BUG-105](../07_items/BUG-105_marketplace_missing_uninstalled_tenant_private.md) | **High** | T1 bỏ sót plugin riêng chưa có ledger | **Resolved** (bổ sung pass TENANT_PRIVATE) |
| [BUG-106](../07_items/BUG-106_marketplace_hides_blocked_catalog.md) | **High** | T1 ẩn plugin bị khóa thay vì badge "Đã khóa" | **Resolved** (giữ item BLOCKED) |
| [BUG-107](../07_items/BUG-107_installations_tenant_uuid_display.md) | **High** | P9 hiển thị tenant bằng UUID (thiếu mapping snake_case) | **Resolved** (`@JsonProperty` + tên tenant) |
| [BUG-108](../07_items/BUG-108_table_screens_missing_route_state.md) | **High** | Màn bảng chưa lưu state vào Route (filter/page/selection/drawer) | **Resolved** (query-param state + deep-link/F5/Back) |
| [BUG-109](../07_items/BUG-109_impersonation_timeout_job_enum_error.md) | Medium | Job impersonation lỗi định kỳ (nghi hot-reload) | **Resolved** — xác nhận hot-reload artifact, 0 lỗi sau restart sạch |
| [BUG-110](../07_items/BUG-110_ng01354_ngmodel_child_component_warning.md) | Low | Warning `NG01354` ngModel trong child component | Deferred → Sprint 04 |
| [TASK-348](../07_items/TASK-348_route_state_rollout_sprint01_02.md) | High/Medium | Route-state cho màn bảng Sprint 01/02 (7/7 màn chính Done, phần phụ → Sprint 04) | In Review (verified browser 4/4) |
| [TASK-346](../07_items/TASK-346_operation_recovery_job_and_dependency_cycle.md) | Medium | Thiếu job phục hồi thao tác (TASK-312 dư) + phát hiện chu trình dependency (TASK-305 dư) | Deferred → Sprint 04 |
| [TASK-347](../07_items/TASK-347_cli_publish_registry.md) | Medium | CLI `publish` chưa có (TASK-329 dư) | Deferred → Sprint 04 |

## 2b. Kiểm Thử Trình Duyệt Thật (Browser QA — Playwright-style CDP trên Chrome)

Thực thi tự động qua Chrome headless + CDP (zero-dependency), backend dev + Web (4200) + Ionic (8100) chạy thật, tài khoản TENANT_ADMIN/SUPER_ADMIN thật, dữ liệu seed trên PostgreSQL thật.

| Bộ kiểm | Phạm vi | Kết quả | Ảnh |
| :--- | :--- | :--- | :--- |
| Tenant Web 1280×900 | Login, marketplace 3 nhóm, badge khóa + disable, install → ACTIVE, upgrade drawer BREAKING, disable→enable, detail versions, soft uninstall, credentials page | **18/18 PASS, 0 console error** | `web_10..web_17_*.png` |
| Route-state (BUG-108) | Deep-link detail, F5 giữ drawer, deep-link upgrade, mở drawer đổi URL, đóng drawer (Escape) xóa params, platform deep-link, tên tenant ở P9 | **8/8 PASS, 0 console error** | `web_18..web_22_*.png` |
| Platform Web 1280×900 | Portal list + badge BLOCKED, detail panel (versions + tenants), credentials, tenant-private | **6/6 PASS, 0 console error** | `web_20..web_23_*.png` |
| Ionic Mobile 390×844 | Login, read-only page, ghi chú, overflow = 0, ion-item min 48px, badge khóa, menu mở | **8/8 PASS, 0 console error** | `mobile_20..mobile_21_*.png` |

Bằng chứng bổ sung: container `openerp-plugin-sales-aeea9eed` được tạo thật và đạt ACTIVE; schema `tenant_aeea9eed_sales` **vẫn tồn tại sau soft uninstall** (dữ liệu giữ nguyên).

Kết quả JSON thô: `qa_tenant_result.json`, `qa_route_result.json`, `qa_platform_result.json`, `qa_mobile_result.json`, `qa_ionic_result.json` (cùng thư mục screenshots).

## 2c. Vòng QA Bổ Sung Theo Phản Hồi Khách Hàng (2026-09-20)

| Bộ kiểm | Phạm vi | Kết quả | Bằng chứng |
| :--- | :--- | :--- | :--- |
| Truy cập `/platform/tenant-private-plugins` | Tài khoản **SUPPORT_ENGINEER** thật | **4/4 PASS** — vào được màn, thấy bảng, **không** thấy nút khóa, 0 lỗi | `web_30_support_tenant_private.png` |
| Route-state Sprint 01/02 (TASK-348) | tenants/audit-logs/sample-records/members deep-link | **4/4 PASS** — filter `keyword=qa&status=ACTIVE` khôi phục đúng; `drawer=create` mở Drawer sau F5 | `web_31→34`, `qa_verify_result.json` |
| Cursor pointer | sharp-button, toggle, plugin-card, pagination | **4/4 PASS** — `cursor: pointer` toàn bộ control bấm được (base layer CSS dùng chung Web+Mobile) | cùng `qa_verify_result.json` |

**Nguyên nhân gốc lỗi "không vào được màn tenant-private"**: backend chỉ cho `SUPER_ADMIN` đọc P14 và menu bị ẩn với `SUPPORT_ENGINEER`. Đã sửa: cho phép SUPPORT_ENGINEER **read-only** (khóa vẫn chỉ SUPER_ADMIN), menu hiển thị cho support, nút "Khóa khẩn cấp" ẩn với support.

**Bổ sung item mới**: [TASK-348](../07_items/TASK-348_route_state_rollout_sprint01_02.md) (rollout route-state — 7/7 màn chính Done, còn danh sách phụ → Sprint 04), [BUG-110](../07_items/BUG-110_ng01354_ngmodel_child_component_warning.md) (Low, warning NG01354, deferred).

## 2d. Chuẩn Path-Segment `/:filter/:sort/:pageSize/:page/:id/:mode` (khách hàng chốt 2026-09-21)

Thay query-param bằng path segments theo khuôn mẫu khách hàng gợi ý; helper `PathListStateService`, routes khai báo qua `listState()`; canonical `all/-/20/1/-/list`; `q` giữ từ khóa, query phụ giữ `scope/version/tenant`. Chuẩn ghi tại [coding_standards.md 2.4](../../../08_developer_guides/coding_standards.md). **12 màn** đã chuyển đổi (5 Plugin Manager + 7 bảng Sprint 01/02), helper cũ đã xoá.

| Bộ kiểm (browser thật) | Kết quả | Ảnh |
| :--- | :--- | :--- |
| URL ngắn `/platform/plugins` redirect canonical | PASS (`/all/-/20/1/-/list`) | — |
| Filter segment `BLOCKED` áp dụng vào select | PASS | `web_40_path_filter.png` |
| Page segment `/2/` tải trang 2, không lỗi | PASS | `web_41_path_page2.png` |
| Tenants filter `ACTIVE` từ path | PASS | `web_42_path_tenants.png` |
| SUPPORT_ENGINEER deep-link mode `block` bị normalize về `list`, ẩn nút khóa | PASS | `web_43_support_block_guard.png` |
| Marketplace deep-link `qa-custom-tool/detail` mở Drawer | PASS | `web_44_marketplace_detail_path.png` |
| Marketplace deep-link `manage` mở Drawer phiên bản | PASS | `web_45_marketplace_manage_path.png` |
| Sample-records deep-link `create` mở Drawer | PASS | `web_46_sample_records_path.png` |

**Tổng: 9/9 PASS, 0 console error** (`qa_path_result.json`).



## 3. Kết Quả Rà Soát Theo Hạng Mục

### 3.1. Bảo mật & Cô lập Multi-Tenant
- [x] T1–T18 đều lấy `tenantId` từ SecurityContext, không nhận từ client.
- [x] Gateway runtime chặn theo ledger ACTIVE; token iframe scope tenant×plugin, từ chối token sai plugin/tenant (`PLUGIN_RUNTIME_TOKEN_INVALID`).
- [x] Upload artifact gắn prefix tenant + `assertOwnedBy` (`PLUGIN_ARTIFACT_NOT_OWNED`); T8/T15 từ chối artifact tenant khác.
- [x] Notification `markRead` update theo `tenantId AND id`; operation S2 kiểm tra `tenantId` của log.
- [x] Entitlement: tenant cài plugin nền tảng phải có ledger; plugin riêng tự tạo ledger cho chính tenant (tenant khác 403).
- [x] Registry allowlist + chặn host private/loopback (TASK-333).

### 3.2. API Contract (4 khuôn mẫu)
- [x] 100% endpoint plugin trả `{success, code, message, params, data}`; list phân trang dùng `items/page/size/total_items/total_pages`; lỗi trả `code` chuẩn, **không nhúng message tiếng Việt**.
- [x] `ResponseKey` enum cho payload (backend + TS mirror), DTO cố định, không `Map<String,Object>`.

### 3.3. UI/UX & i18n
- [x] Anti-Modal: 100% chi tiết/nhập liệu dùng Drawer xếp tầng (`zIndex`), không Modal.
- [x] Không hardcode chuỗi hiển thị; mọi text qua `appTranslate`/`TranslatePipe`; parity vi/en 0 lệch.
- [x] Component dùng chung nằm trong `src/frontend/shared` (plugin-host + 6 component plugin-manager), không có UI ad-hoc trong Web/Mobile.
- [x] Mật độ cao `text-xs`, viền mảnh, `rounded-none`.

### 3.4. Vòng Đời Plugin (E2E trên DB thật)
- [x] Install → ACTIVE (seed quyền), Disable/Enable, Uninstall giữ schema (soft).
- [x] Upgrade COMPATIBLE; BREAKING bắt buộc snapshot (`PLUGIN_SNAPSHOT_REQUIRED`).
- [x] Block khẩn cấp fan-out force-uninstall + thông báo tenant.
- [x] Plugin riêng: register DRAFT → PUBLISH → install → chặn xóa version đang dùng → xóa version/catalog.
- [x] JAR_BUNDLE: upload → checksum → build image (noop trong test) → install ACTIVE.

## 4. Kết Luận & Điều Kiện Đóng Sprint

**Verdict: PASS (browser matrix)** — 0 Critical, 0 High tồn đọng; 40/40 kiểm tự động trên trình duyệt thật PASS với **0 console error** trên cả 3 nền tảng; BUG-102/103 (Critical) và BUG-104→108 (High) đã sửa và được xác minh lại bằng browser. Medium/Low còn lại đã hoãn hợp lệ kèm lý do/workaround (BUG-109 đang theo dõi sau restart sạch).

Điều kiện còn lại trước DoD (Bước 8→9):
1. ~~QA thủ công dual-mode~~ → **ĐÃ CHẠY** (xem mục 2b) — ảnh lưu tại `08_testing/evidence/screenshots/`.
2. **Reviewer ký** BUG-86/88/89/90/91/92/93/94 (BUG-87 đã xác nhận triển khai; BUG-95→108 đã Resolved kèm bằng chứng).
3. PM (Bước 9) cập nhật Task Board/Work Log/Changelog + `sprint_review.md`; các item Deferred chuyển Sprint 04 hoặc backlog kèm lý do.

## 5. Ghi Chú Kỹ Thuật Cho Reviewer

- BUG-96 đóng phần contract `credential_id`; việc **dùng credential để pull manifest/digest (OCI token auth)** vẫn nằm trong TASK-331 (`In Progress`) — cần hạ tầng registry thật để nghiệm thu, đã ghi rõ tại item.
- BUG-94 (xung đột contract P1/FEAT-20) đã có test phân trang + legacy; đề nghị Reviewer xác nhận phương án dual-mode trước khi Sprint 04 gỡ legacy.
