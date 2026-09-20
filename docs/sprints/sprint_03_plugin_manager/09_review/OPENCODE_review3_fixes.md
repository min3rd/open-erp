# [OPENCODE] Handoff Report: Review 3 Documentation Fixes for Sprint 03

- **Ngày**: 2026-09-20
- **Baseline**: HEAD `1919b23` (working tree clean before edits)
- **Scope**: Documentation-only fixes for BUG-86, BUG-92, BUG-93 per reviewer feedback REV-02
- **Author**: OpenCode (docs agent)

---

## 1. Tóm Tắt Thay Đổi Theo File

| File | Bug(s) | Loại Thay Đổi |
|------|--------|---------------|
| `06_designs/api/PLUGIN_MANAGER_API_SPEC.md` | BUG-86, BUG-93 | Cập nhật §4.4 (upgrade/rollback), thêm P26 endpoint, chốt bảng chuyển trạng thái version, atomic blocking enforcement, force_uninstall behavior |
| `05_solutions/SOL-02_plugin_distribution_runtime_and_isolation.md` | BUG-86 | Mở rộng §4.4: preservation snapshot, DOWN_MIGRATION execution/verify/fail recovery, preflight snapshot checks, fail closed post-upgrade writes |
| `06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md` | BUG-86, BUG-93 | Thêm quy tắc 11–16 (§5); thêm function `unblock_plugin_version`, `unblock_plugin_catalog`; cập nhật publish guard trigger |
| `06_designs/ui_ux/PLUGIN_MANAGER_UI_SPEC.md` | BUG-93 | Cập nhật Drawer chi tiết (tầng 1: Mở khóa catalog P25; tầng 2: Mở khóa phiên bản P26, không auto reinstall); Marketplace: version bị khóa không hiển thị |
| `04_confirmation/CONF-01_sprint_03_scope.md` | BUG-86, BUG-93 | Cập nhật AC-21.4 (block enforcement, gateway, force_uninstall); Phụ lục 9: chi tiết BUG-86/93 fixes |
| `07_items/BUG-86_upgrade_rollback_data_contract.md` | BUG-86 | Bổ sung Ghi Chú Xử Lý: mandatory snapshot (no bypass), preservation snapshot, preflight, ROLLBACK_FAILED, DOWN_MIGRATION execution, conservative reject post-activation |
| `07_items/BUG-93_catalog_block_publish_bypass.md` | BUG-93 | (Giữ nguyên — tài liệu đã khớp sau edits trên) |
| `07_items/BUG-92_core_slot_seed_conflict_target.md` | BUG-92 | Thêm mục "Xác Nhận Static Validation": conflict target đã khớp index predicate, In Review, không claim runtime PASS |

---

## 2. Quyết Định Kỹ Thuật Chính (Decisions)

### BUG-86 — Upgrade/Rollback Data Contract
| Điểm | Quyết Định | Rationale |
|------|------------|-----------|
| Snapshot mandatory cho BREAKING | **API từ chối `snapshot=false`** (chỉ chấp nhận `true`/omitted); mã `PLUGIN_SNAPSHOT_REQUIRED` | Fail closed — không cho bypass snapshot khi migration phá vỡ tương thích |
| Preservation snapshot | **Bắt buộc tạo trước restore** pre-upgrade snapshot; path `post-{current_version}/{ts}.dump`; ref ghi `plugin_operation_logs.detail.preservation_snapshot_ref` | Không mất dữ liệu phát sinh sau nâng cấp; admin thấy cả 2 snapshot |
| Preflight snapshot checks | 4 điều kiện: exist + digest match + not expired (30d) + restoreable (pg_dump header/PG version); thiếu → từ chối, **không dừng container** | Không disrupting service khi snapshot không an toàn |
| ROLLBACK_FAILED state | Restore fail → ledger `ROLLBACK_FAILED` (KHÔNG ACTIVE), plugin ngưng phục vụ, giữ snapshot, can thiệp thủ công; chỉ ACTIVE sau health OK | Tránh đánh dấu ACTIVE giả vờ khi schema không khớp |
| Rollback sau activation (post-upgrade writes) | **Từ chối `SNAPSHOT_RESTORE`** (`PLUGIN_ROLLBACK_NOT_ALLOWED: post_upgrade_writes_detected`); chỉ `DOWN_MIGRATION` nếu `down_migration_verified: true`, hoặc quy trình thủ công | Conservative Sprint 03 — không restore snapshot sau khi v2 đã phục vụ ghi |
| DOWN_MIGRATION | Plugin tự chạy down-migration **trước** deploy image cũ; verify schema tương thích v1; fail → `ROLLBACK_FAILED`, không deploy cũ, giữ container v2+snapshot; thiếu `down_migration_verified: true` → từ chối (`PLUGIN_DOWN_MIGRATION_NOT_VERIFIED`), fail closed | Chỉ cho phép down-migration khi plugin chứng minh an toàn |

### BUG-93 — Catalog Block / Publish Bypass
| Điểm | Quyết Định | Rationale |
|------|------------|-----------|
| Catalog unblock vs Version unblock | **P25**: `POST /platform/plugins/{key}/unblock` → chỉ mở `catalog_status` ACTIVE (cho phép publish version mới, cấp entitlement, cài đặt). **P26**: `PATCH /platform/plugins/{key}/versions/{version}/unblock` → chỉ chuyển `release_status` BLOCKED→PUBLISHED (cho phép cài version đó). **Cần cả 2** khi catalog và version đều bị khóa. | Phân biệt rõ ràng: catalog lock ≠ version lock; không auto reinstall |
| Version state transition | `BLOCKED → PUBLISHED` **chỉ Platform** qua P26 (không qua P25, không qua P7 scope VERSION). P7 scope VERSION chỉ đặt BLOCKED. | Chốt chặn: tenant không thể tự publish lại version bị khóa |
| Atomic blocking enforcement | Job `ACTIVATE` step: `SELECT ... FOR SHARE` trên `plugin_catalog` + `plugin_versions` trong transaction; gateway từ chối request mới khi catalog/version BLOCKED; container hiện tại xử lý xong request đang chạy | Tránh check-then-write race; defense-in-depth: API + DB trigger + gateway |
| Force uninstall | `force_uninstall=false` **không bypass** cưỡng chế gỡ; chỉ điều khiển tốc độ (true=song song, false=lần lượt) nhưng **luôn gỡ tất cả tenant** khi scope CATALOG hoặc version ACTIVE | Giữ hành vi đã chốt tại Gate: khóa khẩn cấp = gỡ tất cả tenant bị ảnh hưởng |

### BUG-92 — Core Slot Seed Conflict Target
| Điểm | Xác Nhận |
|------|----------|
| Conflict target | `ON CONFLICT (slot_code) WHERE host_type = 'CORE' DO NOTHING` đã khớp chính xác với partial unique index `uq_plugin_ui_slot_core (slot_code) WHERE host_type = 'CORE'` theo PostgreSQL 16 spec |
| Plugin slot cùng slot_code | Hợp lệ nhờ composite index `uq_plugin_ui_slot_plugin (owner_plugin_key, slot_code, contract_version) WHERE host_type = 'PLUGIN'` — không xung đột |
| Trạng thái | **In Review** — chờ Reviewer xác nhận đóng. **Không claim runtime PASS**; validation tĩnh qua đối chiếu tài liệu PostgreSQL chính thức |

---

## 3. Validations Performed (Static Only)

- **API Contract**: Đối chiếu DES-03-API §4.4 với SOL-02 §4.4 và DES-03-DB quy tắc 10–16 — nhất quán 100%.
- **State Transition Table**: Bảng chuyển trạng thái version (§3 note) khớp với DB functions `unblock_plugin_version`, `unblock_plugin_catalog` và trigger `trg_plugin_version_publish_guard`.
- **UI Mapping**: Drawer tier 1 (P25 catalog unblock) vs tier 2 (P26 version unblock) phân biệt rõ; Marketplace ẩn version BLOCKED.
- **AC-21.4**: Cập nhật bao gồm gateway enforcement, atomic DB check, force_uninstall semantics.
- **BUG-92**: Conflict target static validation qua PostgreSQL 16 docs — PASS.

---

## 4. Unresolved Points / Reviewer Action Required

| Item | Trạng Thái | Cần Reviewer Làm Gì |
|------|------------|---------------------|
| BUG-86 | In Review | Xác nhận mandatory snapshot no-bypass, preservation snapshot, preflight, ROLLBACK_FAILED, DOWN_MIGRATION execution logic, conservative reject post-activation. Đóng khi đồng ý. |
| BUG-93 | In Review | Xác nhận P25 vs P26 distinction, atomic blocking (FOR SHARE), gateway enforcement, force_uninstall=no-bypass. Đóng khi đồng ý. |
| BUG-92 | In Review | Xác nhận static validation PASS (conflict target khớp index predicate). Đóng khi đồng ý. **Không yêu cầu runtime test**. |

> **Lưu ý**: Tất cả 3 items vẫn ở trạng thái **In Review**. Reviewer sẽ đóng (Done) sau khi xác nhận tài liệu. Không có thay đổi source code, không commit, không push, không close sprint.

---

## 5. Files Modified (git diff --name-only)

```
docs/sprints/sprint_03_plugin_manager/06_designs/api/PLUGIN_MANAGER_API_SPEC.md
docs/sprints/sprint_03_plugin_manager/05_solutions/SOL-02_plugin_distribution_runtime_and_isolation.md
docs/sprints/sprint_03_plugin_manager/06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md
docs/sprints/sprint_03_plugin_manager/06_designs/ui_ux/PLUGIN_MANAGER_UI_SPEC.md
docs/sprints/sprint_03_plugin_manager/04_confirmation/CONF-01_sprint_03_scope.md
docs/sprints/sprint_03_plugin_manager/07_items/BUG-86_upgrade_rollback_data_contract.md
docs/sprints/sprint_03_plugin_manager/07_items/BUG-92_core_slot_seed_conflict_target.md
docs/sprints/sprint_03_plugin_manager/09_review/OPENCODE_review3_fixes.md
```

---

## 6. Kết Luận

- **3/3 High issues** đã được xử lý ở mức tài liệu (design-level fix).
- **0 source code changes** — chỉ cập nhật spec, solution, DB rules, UI, confirmation, BUG notes.
- **Tài liệu đồng bộ**: DES-03-API, SOL-02, DES-03-DB, DES-03-UI, CONF-01, BUG-86, BUG-92 đều nhất quán.
- **Reviewer action**: Xác nhận đóng 3 BUG items (In Review → Done). Sau đó mới chuyển sang Bước 7 (Lập trình).