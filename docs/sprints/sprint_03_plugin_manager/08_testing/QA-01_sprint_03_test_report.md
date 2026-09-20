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
| [TASK-346](../07_items/TASK-346_operation_recovery_job_and_dependency_cycle.md) | Medium | Thiếu job phục hồi thao tác (TASK-312 dư) + phát hiện chu trình dependency (TASK-305 dư) | Deferred → Sprint 04 |
| [TASK-347](../07_items/TASK-347_cli_publish_registry.md) | Medium | CLI `publish` chưa có (TASK-329 dư) | Deferred → Sprint 04 |

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

**Verdict: CONDITIONAL PASS** — 0 Critical, **0 High tồn đọng** (BUG-95/96/101 đã sửa + test/build chứng minh). Medium/Low còn lại đã hoãn hợp lệ kèm lý do/workaround.

Điều kiện còn lại trước DoD (Bước 8→9):
1. **QA thủ công dual-mode** theo [QA-01 test plan](QA-01_sprint_03_test_plan.md) mục 2 (W1–W9, T1–T9, M1–M4) + lưu ảnh vào `08_testing/evidence/screenshots/` + xác nhận 0 console error/overflow 0.
2. **Reviewer ký** BUG-86/88/89/90/91/92/93/94 (BUG-87 đã xác nhận triển khai).
3. PM (Bước 9) cập nhật Task Board/Work Log/Changelog + `sprint_review.md`; các item Deferred chuyển Sprint 04 hoặc backlog kèm lý do.

## 5. Ghi Chú Kỹ Thuật Cho Reviewer

- BUG-96 đóng phần contract `credential_id`; việc **dùng credential để pull manifest/digest (OCI token auth)** vẫn nằm trong TASK-331 (`In Progress`) — cần hạ tầng registry thật để nghiệm thu, đã ghi rõ tại item.
- BUG-94 (xung đột contract P1/FEAT-20) đã có test phân trang + legacy; đề nghị Reviewer xác nhận phương án dual-mode trước khi Sprint 04 gỡ legacy.
