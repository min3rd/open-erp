# [ADR-S07-002] Tách organization khỏi Core: big-bang cutover

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ADR-S07-002 / Architecture Decision Record / Sprint 07 |
| Trạng thái / phiên bản / cập nhật | Approved / 1.0 / 2026-10-30 |
| Owner / reviewer | Architect Agent / Chủ dự án + BA |
| Đầu vào | [CONF-S07-001 1.0](../04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md) (Q39–Q46, Q53–Q55), [ANL-S07-003](../02_analysis/03_ANL-S07-003_organization_plugin_extraction.md) |
| Đọc trước / đọc tiếp | ADR-S07-001 / [DES-ARCH-S07-001](../06_designs/arch/01_DES-ARCH-S07-001_components_and_flows.md), [DES-DB-S07-001](../06_designs/db/01_DES-DB-S07-001_employee_organization_schema.md), [DES-API-S07-001](../06_designs/api/01_DES-API-S07-001_employee_organization_auth_api.md) |

## 1. Bối cảnh

Core hiện sở hữu branch/department/membership và `SecurityContextService` query trực tiếp. Yêu cầu R8: tách branch/department khỏi Core để độc lập. Q39–Q46 chốt:

- Một plugin `organization`, always-on.
- Organization giữ branch/department master + access membership; employee giữ HR assignment (ADR-001).
- Core đọc projection.
- **Big-bang migration** (Q43).
- **Đổi namespace API/quyền/entity hoàn toàn** (Q45/Q46).
- Entity names mới; consumer phải cập nhật.

## 2. Quyết định

### 2.1. Plugin organization

- ID: `open-erp-org-structure`; plugin key `org-structure` (vì `organization` bị CLI reserve); always-on.
- Zero-DB, schema riêng theo tenant; migrations/checksum; Entity Registry.
- Sở hữu:
  - `org_branch`
  - `org_department`
  - `org_membership` (user→branch/department, manager, primary, hiệu lực)
  - `org_branch_access` (user→branch, can_manage, primary)
  - `org_outbox` (projection events)
- API prefix `/api/v1/org/*`.
- UI plugin screen `/apps/organization/*`, WC/MF; mobile read-only org chart.

### 2.2. Core sau cutover

- Xóa module `modules/organization` (resource/service/model) và các bảng legacy `branches`, `departments`, `user_department_memberships`, `user_branch_assignments`.
- Giữ projection tables + internal API.
- `SecurityContextService` chỉ đọc projection.
- Tenant onboarding gọi organization seeder (HQ/GENERAL + membership owner) qua internal API/outbox.
- Permission namespace mới `organization:*`; old `core:*` migrated, không runtime alias.

### 2.3. API/quyền/entity mới

| Cũ | Mới |
| :--- | :--- |
| `/api/v1/organization/branches` | `/api/v1/org/branches` |
| `/api/v1/organization/departments` | `/api/v1/org/departments` |
| `/api/v1/organization/memberships` | `/api/v1/org/memberships` |
| `/api/v1/organization/branch-assignments` | `/api/v1/org/branch-access` |
| `core:organization:manage` | `organization:org:manage` |
| `core:branch:read/manage` | `organization:branch:read/manage` |
| `core:department:read/manage` | `organization:department:read/manage` |
| `core:membership:read/manage` | `organization:membership:read/manage` |
| `core:branch-assignment:read/manage` | `organization:branch-access:read/manage` |
| Entity `Branch` | `OrgBranch` |
| Entity `Department` | `OrgDepartment` |
| Entity `UserDepartmentMembership` | `OrgMembership` |
| Entity `UserBranchAssignment` | `OrgBranchAccess` |

> Không giữ alias runtime. Migration grant map quyền cũ → mới cho role hiện hữu; frontend/plugin cập nhật path/route trong cùng release.

## 3. Big-bang cutover

### 3.1. Nguyên tắc

Big-bang theo Q43 nhưng **không mất kiểm soát**:

1. Freeze ghi org (maintenance window).
2. Backup toàn bộ schema Core + plugin trước cutover.
3. Copy dữ liệu, giữ nguyên UUID.
4. Verify count/checksum/spot-check.
5. Rebuild projection.
6. Cutover API/UI, drop legacy tables.
7. Smoke data scope + rollback nếu fail.

### 3.2. Các bước

| Bước | Việc | Điều kiện PASS |
| :--- | :--- | :--- |
| C0 | Preflight: inventory tenant, branch, department, membership; backup | Backup verified |
| C1 | Tạo schema/table plugin organization + employee; tạo projection Core | Migration PASS |
| C2 | Freeze ghi org; chặn API cũ | Không còn write |
| C3 | Copy `branches` → `org_branch`, `departments` → `org_department`, memberships/assignments → org tables | Count/khớp UUID |
| C4 | Seed `org_outbox`/projection; rebuild `core_user_scope`, manager edge, closure | Projection count/spot-check PASS |
| C5 | Deploy API/UI mới; permission migration grant; Entity Registry mới | Smoke API/UI PASS |
| C6 | Drop legacy tables/module; remove old permissions | Không còn reference |
| C7 | Post-cutover verify data scope cho tenant owner/admin/branch manager/employee | QA matrix PASS |

### 3.3. Rollback

- Trước C6: rollback = restore backup + bật API cũ; projection có thể rebuild lại.
- Sau C6: rollback cần restore full backup + redeploy bản cũ; không rollback từng phần.
- Diễn tập rollback trước cutover; ghi thời gian.

### 3.4. Tenant mới

- Core onboarding gọi `organization` seeder: tạo `HQ` + `GENERAL`, membership owner.
- Nếu gọi lỗi: onboarding retry/outbox; không tạo tenant “mồ côi” không scope.
- Backfill tenant cũ trong cutover.

## 4. Hệ quả

### 4.1. Tích cực

- Organization độc lập, version/migrate riêng.
- Core không còn nghiệp vụ org.
- Data scope read model rõ ràng.

### 4.2. Tiêu cực / chi phí

- Big-bang rủi ro cao; cần freeze/backup/rollback.
- Đổi namespace/entity phá consumer; cần inventory/migrate.
- Onboarding phụ thuộc plugin always-on.
- Projection phải rebuild/verify.

## 5. Tiêu chí chấp nhận

| AC | Cách đáp ứng |
| :--- | :--- |
| AC-30 | Organization giữ branch/department + access membership; Core projection |
| AC-31 | Big-bang backfill + checksum + rollback |
| AC-32 | Namespace/entity/permission migration |
| AC-36 | Non-employee membership |
| AC-37 | Offboarding guard (employee) |

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Chốt plugin organization, big-bang cutover, namespace/entity mới | Architect; CONF-S07-001 1.0 |
| 1.0 | 2026-10-30 | Approved cùng Design review | Chủ dự án; design review 2026-10-30 |
