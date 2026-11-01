# [DES-DB-S07-001] Schema organization, employee & Core scope projection

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-DB-S07-001 / Thiết kế CSDL / Sprint 07 |
| Trạng thái / phiên bản / cập nhật | Approved / 1.1 / 2026-10-30 |
| Owner / reviewer | Architect Agent / Chủ dự án + BA |
| Đầu vào | [ADR-S07-001](../../05_solutions/02_ADR-S07-001_two_layer_assignment_projection.md), [ADR-S07-002](../../05_solutions/03_ADR-S07-002_organization_extraction_cutover.md), [CONF-S07-001 1.0](../../04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md) |
| Đọc trước / đọc tiếp | ADR-S07-001/002 / [DES-API-S07-001](../api/01_DES-API-S07-001_employee_organization_auth_api.md), [DES-UI-S07-001](../ui/01_DES-UI-S07-001_employee_organization_ui.md) |

## 1. Quy ước

- PostgreSQL 16; `uuid` cho khóa chính; `timestamptz` cho thời điểm; `date` cho ngày nghiệp vụ.
- **Tên bảng implementation dùng prefix `plg_<plugin>_`** (ví dụ `plg_organization_branches`, `plg_employee_profiles`); tên logic trong tài liệu (`org_branch`, `employee_profile`…) dùng để đọc/thiết kế.
- Mọi bảng plugin có `tenant_id NOT NULL`; gateway/service token xác thực tenant. Không tin `tenant_id` client.
- Soft delete/archive bằng `status`/`valid_to`; không xóa cứng dữ liệu HR đã kích hoạt.
- Enum Java + `varchar(32)` + CHECK; frontend dùng enum chung.
- Mọi bảng đăng ký Entity Registry; plugin schema riêng theo tenant.
- Tên bảng mới không trùng bảng Core cũ; migration big-bang giữ UUID.

## 2. Plugin organization

### 2.1. `org_branch`

| Cột | Kiểu | Ràng buộc |
| :--- | :--- | :--- |
| `id` | uuid | PK, default gen_random_uuid() |
| `tenant_id` | uuid | NOT NULL |
| `code` | varchar(32) | NOT NULL |
| `name` | varchar(255) | NOT NULL |
| `phone` | varchar(32) | NULL |
| `address` | text | NULL |
| `is_default` | boolean | NOT NULL DEFAULT false |
| `status` | varchar(32) | NOT NULL DEFAULT 'ACTIVE', CHECK IN ('ACTIVE','INACTIVE') |
| `created_at` | timestamptz | NOT NULL DEFAULT now() |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() |

Index/constraint:
- `UNIQUE (tenant_id, code)`
- `CREATE UNIQUE INDEX uq_org_branch_default ON org_branch(tenant_id) WHERE is_default`
- `INDEX (tenant_id, status)`

### 2.2. `org_department`

| Cột | Kiểu | Ràng buộc |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `branch_id` | uuid | NOT NULL, FK `org_branch(id)` |
| `parent_id` | uuid | NULL, FK `org_department(id)` |
| `code` | varchar(32) | NOT NULL |
| `name` | varchar(255) | NOT NULL |
| `manager_user_id` | uuid | NULL (soft ref Core user) |
| `status` | varchar(32) | NOT NULL DEFAULT 'ACTIVE', CHECK IN ('ACTIVE','INACTIVE') |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

Index/constraint:
- `UNIQUE (tenant_id, code)`
- `INDEX (tenant_id, branch_id)`, `INDEX (tenant_id, parent_id)`
- `INDEX (tenant_id, manager_user_id)`
- Chống cycle ở service (recursive CTE) + trigger/check nếu khả thi.

### 2.3. `org_membership`

| Cột | Kiểu | Ràng buộc |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `user_id` | uuid | NOT NULL (soft ref Core user) |
| `branch_id` | uuid | NOT NULL, FK `org_branch(id)` |
| `department_id` | uuid | NOT NULL, FK `org_department(id)` |
| `direct_manager_user_id` | uuid | NULL (soft ref Core user) |
| `is_primary` | boolean | NOT NULL DEFAULT false |
| `joined_at` | timestamptz | NOT NULL DEFAULT now() |
| `valid_from` | date | NOT NULL DEFAULT current_date |
| `valid_to` | date | NULL |
| `status` | varchar(32) | NOT NULL DEFAULT 'ACTIVE', CHECK IN ('ACTIVE','INACTIVE') |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

Index/constraint:
- `UNIQUE (tenant_id, user_id, department_id, valid_from)`
- `CREATE UNIQUE INDEX uq_org_membership_primary ON org_membership(tenant_id, user_id) WHERE is_primary AND status='ACTIVE'`
- `INDEX (tenant_id, user_id)`, `INDEX (tenant_id, branch_id)`, `INDEX (tenant_id, department_id)`, `INDEX (tenant_id, direct_manager_user_id)`
- `CHECK (valid_to IS NULL OR valid_to >= valid_from)`
- Department phải thuộc branch: service kiểm tra (cross-table FK không đủ).

### 2.4. `org_branch_access`

| Cột | Kiểu | Ràng buộc |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `user_id` | uuid | NOT NULL |
| `branch_id` | uuid | NOT NULL, FK `org_branch(id)` |
| `is_primary` | boolean | NOT NULL DEFAULT false |
| `can_manage` | boolean | NOT NULL DEFAULT false |
| `assigned_at` | timestamptz | NOT NULL DEFAULT now() |
| `valid_from` / `valid_to` | date | NOT NULL / NULL |
| `status` | varchar(32) | NOT NULL DEFAULT 'ACTIVE' |

Index/constraint: `UNIQUE (tenant_id,user_id,branch_id,valid_from)`; partial unique primary; index user/branch/can_manage.

### 2.5. `org_outbox`

| Cột | Kiểu | Ràng buộc |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `event_type` | varchar(64) | NOT NULL (`MEMBERSHIP_UPSERTED`, `MEMBERSHIP_REMOVED`, `DEPARTMENT_TREE_CHANGED`, `BRANCH_CHANGED`) |
| `aggregate_id` | uuid | NOT NULL |
| `payload` | jsonb | NOT NULL |
| `status` | varchar(16) | NOT NULL DEFAULT 'PENDING', CHECK IN ('PENDING','SENT','FAILED') |
| `retry_count` | int | NOT NULL DEFAULT 0 |
| `next_retry_at` | timestamptz | NULL |
| `created_at` / `sent_at` | timestamptz | NOT NULL / NULL |

Index: `(status, next_retry_at)`, `(tenant_id, created_at)`.

## 3. Plugin employee

### 3.1. `employee_profile`

| Cột | Kiểu | Ràng buộc |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `employee_code` | varchar(32) | NOT NULL |
| `user_id` | uuid | NULL (soft ref Core user; unique/tenant khi có) |
| `status` | varchar(32) | NOT NULL DEFAULT 'DRAFT', CHECK IN ('DRAFT','PROBATION','ACTIVE','SUSPENDED','LEFT','RETIRED') |
| `employee_type` | varchar(32) | NOT NULL DEFAULT 'EMPLOYEE', CHECK IN ('EMPLOYEE','WORKER','INTERN','CONTRACTOR','FREELANCER') |
| `full_name` | varchar(255) | NOT NULL |
| `photo_url` | text | NULL |
| `date_of_birth` | date | NULL |
| `gender` | varchar(16) | NULL |
| `nationality` | varchar(64) | NULL |
| `marital_status` | varchar(32) | NULL |
| `national_id` | varchar(32) | NULL |
| `national_id_issue_date` | date | NULL |
| `national_id_issue_place` | varchar(255) | NULL |
| `tax_code` | varchar(32) | NULL |
| `social_insurance_no` | varchar(32) | NULL |
| `health_insurance_no` | varchar(32) | NULL |
| `personal_email` | varchar(255) | NULL |
| `work_email` | varchar(255) | NULL |
| `phone` | varchar(32) | NULL |
| `current_address` | text | NULL |
| `permanent_address` | text | NULL |
| `emergency_contact_name` | varchar(255) | NULL |
| `emergency_contact_relationship` | varchar(64) | NULL |
| `emergency_contact_phone` | varchar(32) | NULL |
| `education_level` | varchar(64) | NULL |
| `school` | varchar(255) | NULL |
| `major` | varchar(255) | NULL |
| `graduation_year` | int | NULL |
| `notes` | text | NULL |
| `scope_sync_status` | varchar(16) | NOT NULL DEFAULT 'PENDING', CHECK IN ('PENDING','SYNCED','FAILED','NOT_APPLICABLE') |
| `created_at` / `updated_at` / `archived_at` | timestamptz | NOT NULL / NOT NULL / NULL |
| `version` | bigint | NOT NULL DEFAULT 0 |

Index/constraint:
- `UNIQUE (tenant_id, employee_code)`
- `CREATE UNIQUE INDEX uq_employee_user ON employee_profile(tenant_id, user_id) WHERE user_id IS NOT NULL`
- `INDEX (tenant_id, status)`, `INDEX (tenant_id, full_name)`, `INDEX (tenant_id, work_email)`
- optional trigram index on `full_name`.

### 3.2. `employee_assignment`

| Cột | Kiểu | Ràng buộc |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `employee_id` | uuid | NOT NULL, FK `employee_profile(id)` |
| `branch_id` | uuid | NOT NULL (soft ref org branch) |
| `department_id` | uuid | NOT NULL (soft ref org department) |
| `job_title` | varchar(255) | NOT NULL |
| `job_title_catalog_id` | uuid | NULL (soft ref catalog) |
| `manager_employee_id` | uuid | NULL, FK `employee_profile(id)` |
| `is_primary` | boolean | NOT NULL DEFAULT false |
| `valid_from` | date | NOT NULL |
| `valid_to` | date | NULL |
| `status` | varchar(32) | NOT NULL DEFAULT 'ACTIVE', CHECK IN ('ACTIVE','INACTIVE') |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

Constraint:
- `CHECK (valid_to IS NULL OR valid_to >= valid_from)`
- `EXCLUDE USING gist (tenant_id WITH =, employee_id WITH =, daterange(valid_from, COALESCE(valid_to, 'infinity'::date), '[]') WITH &&)` — cần `btree_gist`; không cho chồng khoảng.
- `CREATE UNIQUE INDEX uq_employee_primary_assignment ON employee_assignment(tenant_id, employee_id) WHERE is_primary AND status='ACTIVE'`
- `INDEX (tenant_id, branch_id)`, `INDEX (tenant_id, department_id)`, `INDEX (tenant_id, manager_employee_id)`
- Service chặn manager self/cycle.

### 3.2.1. `employee_reporting_relationship`

Dùng cho org chart ma trận (U7): quan hệ báo cáo chính/dotted/matrix.

| Cột | Kiểu | Ràng buộc |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `employee_id` | uuid | NOT NULL, FK `employee_profile(id)` |
| `manager_employee_id` | uuid | NOT NULL, FK `employee_profile(id)` |
| `relationship_type` | varchar(16) | NOT NULL, CHECK IN ('PRIMARY','DOTTED','MATRIX') |
| `valid_from` | date | NOT NULL |
| `valid_to` | date | NULL |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

- `CHECK (employee_id <> manager_employee_id)`
- `UNIQUE (tenant_id, employee_id, manager_employee_id, relationship_type, valid_from)`
- `EXCLUDE USING gist (tenant_id WITH =, employee_id WITH =, manager_employee_id WITH =, relationship_type WITH =, daterange(valid_from, COALESCE(valid_to,'infinity'::date), '[]') WITH &&)`
- `INDEX (tenant_id, manager_employee_id)`, `INDEX (tenant_id, relationship_type)`
- `employee_assignment.manager_employee_id` là **primary manager snapshot** cho assignment/sync; service kiểm tra khớp relationship PRIMARY. Quan hệ DOTTED/MATRIX chỉ nằm ở bảng này.
- Service chặn cycle trên đồ thị PRIMARY; DOTTED/MATRIX được phép nhưng cảnh báo nếu cycle.

### 3.3. `employee_contract`

| Cột | Kiểu | Ràng buộc |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `employee_id` | uuid | NOT NULL, FK |
| `contract_type` | varchar(64) | NOT NULL (catalog/text) |
| `contract_no` | varchar(64) | NOT NULL |
| `start_date` / `end_date` | date | NOT NULL / NULL |
| `status` | varchar(32) | NOT NULL DEFAULT 'ACTIVE' |
| `document_id` | uuid | NULL, FK `employee_document(id)` |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

`UNIQUE (tenant_id, contract_no)`; `INDEX (tenant_id, employee_id, start_date)`; `CHECK (end_date IS NULL OR end_date >= start_date)`.

### 3.4. `employee_job_history`

`id`, `tenant_id`, `employee_id`, `change_type` (`CREATED`,`UPDATED`,`STATUS_CHANGED`,`ASSIGNMENT_CHANGED`,`CONTRACT_CHANGED`,`LINKED_USER`,`UNLINKED_USER`,`EXITED`,`REHIRED`,`DOCUMENT`), `effective_date date`, `old_values jsonb`, `new_values jsonb`, `actor_user_id uuid`, `source varchar(16)` (`ADMIN`,`SELF_SERVICE`,`IMPORT`,`SYSTEM`), `reason text`, `created_at timestamptz`.
Index `(tenant_id, employee_id, effective_date desc)`.

### 3.5. `employee_field_config`

`tenant_id`, `field_key varchar(64)`, `editable_by_employee boolean`, `requires_approval boolean`, `sort_order int`, `updated_by uuid`, `updated_at`.
PK `(tenant_id, field_key)`. Seed default template per tenant.

### 3.6. `employee_approval_config`

`id`, `tenant_id`, `scope_type` (`TENANT`,`BRANCH`,`DEPARTMENT`), `scope_id uuid NULL`, `field_group varchar(64)`, `step_no int`, `approver_type` (`ROLE`,`USER`,`MANAGER`), `approver_id uuid NULL`, `created_at`.
`UNIQUE (tenant_id, scope_type, scope_id, field_group, step_no)`; index field_group.

### 3.7. `employee_change_request`

`id`, `tenant_id`, `employee_id`, `requested_by_user_id`, `status` (`PENDING`,`IN_REVIEW`,`APPROVED`,`REJECTED`,`WITHDRAWN`,`CONFLICT`,`EXPIRED`), `current_step int`, `changes jsonb`, `submitted_at`, `reviewed_at`, `rejection_reason text`, `version bigint`.
Partial unique: `CREATE UNIQUE INDEX uq_employee_open_request ON employee_change_request(tenant_id, employee_id) WHERE status IN ('PENDING','IN_REVIEW','CONFLICT')`.
Index `(tenant_id, status, submitted_at)`.

### 3.8. `employee_change_request_step`

`id`, `tenant_id`, `request_id FK`, `step_no`, `approver_type`, `approver_id`, `status` (`PENDING`,`APPROVED`,`REJECTED`,`SKIPPED`), `acted_by uuid`, `acted_at timestamptz`, `comment text`.
`UNIQUE (request_id, step_no)`; index approver/status.

### 3.9. `employee_document`

`id`, `tenant_id`, `employee_id`, `document_type varchar(64)`, `version int`, `storage_key text`, `file_name`, `mime_type`, `size_bytes bigint`, `checksum varchar(64)`, `scan_status` (`PENDING`,`CLEAN`,`INFECTED`,`FAILED`), `uploaded_by uuid`, `upload_source` (`HR`,`EMPLOYEE`), `retention_until date`, `status` (`ACTIVE`,`ARCHIVED`), `created_at`.
`UNIQUE (tenant_id, employee_id, document_type, version)`; index employee/status/scan.

### 3.10. `employee_onboarding_invite`

`id`, `tenant_id`, `employee_id NULL`, `email`, `token_hash varchar(128)`, `expires_at`, `status` (`PENDING`,`SUBMITTED`,`APPROVED`,`EXPIRED`,`REVOKED`), `submitted_at`, `created_by`, `created_at`.
`UNIQUE (token_hash)`; index email/status.

### 3.11. `employee_update_campaign`

`id`, `tenant_id`, `name`, `filter jsonb`, `deadline date`, `status` (`DRAFT`,`ACTIVE`,`CLOSED`), `created_by`, `created_at`.
`employee_update_campaign_recipient`: `campaign_id`, `employee_id`, `status` (`PENDING`,`COMPLETED`,`SKIPPED`), `completed_at`; PK `(campaign_id, employee_id)`.

### 3.12. `employee_consent`

`id`, `tenant_id`, `employee_id`, `purpose varchar(64)`, `status` (`GRANTED`,`REVOKED`,`PENDING`), `granted_at`, `revoked_at`, `source`.
`UNIQUE (tenant_id, employee_id, purpose)`.

### 3.13. `employee_privacy_request`

`id`, `tenant_id`, `subject_user_id`, `employee_id NULL`, `request_type` (`ACCESS`,`EXPORT`,`DELETE`,`RECTIFY`,`RESTRICT`), `status` (`RECEIVED`,`IN_PROGRESS`,`COMPLETED`,`REJECTED`), `payload jsonb`, `due_at`, `completed_at`, `created_at`.
Index `(tenant_id, status, due_at)`.

### 3.14. `employee_outbox`

Giống `org_outbox`: `event_type` (`SCOPE_UPSERT`,`SCOPE_REMOVE`,`NOTIFICATION`,`DOCUMENT_SCAN`), `aggregate_id`, `payload`, `status`, `retry_count`, `next_retry_at`.

## 4. Core scope projection

### 4.1. `core_user_scope`

| Cột | Kiểu | Ràng buộc |
| :--- | :--- | :--- |
| `tenant_id` | uuid | PK part |
| `user_id` | uuid | PK part |
| `primary_branch_id` | uuid | NULL |
| `primary_department_id` | uuid | NULL |
| `member_branch_ids` | uuid[] | NOT NULL DEFAULT '{}' |
| `managed_branch_ids` | uuid[] | NOT NULL DEFAULT '{}' |
| `department_ids` | uuid[] | NOT NULL DEFAULT '{}' |
| `version` | bigint | NOT NULL DEFAULT 0 |
| `updated_at` | timestamptz | NOT NULL |

PK `(tenant_id, user_id)`; index `(tenant_id, primary_department_id)`; arrays read by user.

### 4.2. `core_user_manager_edge`

`tenant_id`, `manager_user_id`, `subordinate_user_id`, `source varchar(16)` (`ORG`,`EMPLOYEE`), `updated_at`.
PK `(tenant_id, manager_user_id, subordinate_user_id)`; index subordinate.

### 4.3. `core_department_closure`

`tenant_id`, `ancestor_id`, `descendant_id`, `depth int`, `updated_at`.
PK `(tenant_id, ancestor_id, descendant_id)`; index descendant.

## 5. Migration

| File | Nội dung |
| :--- | :--- |
| `plugins/organization/migrations/V1.0.0__organization_schema.sql` | org tables + outbox |
| `plugins/employee/migrations/V1.0.0__employee_schema.sql` | employee tables + outbox |
| `core/V7.0.0__scope_projection.sql` | projection tables + functions |
| `core/V7.0.1__drop_legacy_org.sql` | drop `branches`, `departments`, `user_department_memberships`, `user_branch_assignments` sau cutover |
| `scripts/org-cutover` | freeze/copy/verify/rebuild; không chạy trong app request |

Cutover mapping:
- `branches` → `org_branch` (giữ UUID)
- `departments` → `org_department` (giữ UUID, parent/branch)
- `user_department_memberships` → `org_membership`
- `user_branch_assignments` → `org_branch_access`
- rebuild projection từ org tables.

## 6. Retention & security

- `employee_document.retention_until` + config tenant; default theo tư vấn pháp lý, không hardcode.
- Sensitive columns (CCCD, tax, insurance) mask theo permission; audit view.
- Document: virus scan trước `CLEAN`; signed URL ngắn hạn; không public bucket.
- Privacy: consent/DSAR/breach/retention; audit.
- RLS: bật policy tenant nếu hạ tầng dùng; gateway vẫn là lớp chính.

## 7. Traceability

| AC | Bảng |
| :--- | :--- |
| AC-01/02/03/04 | `employee_profile` |
| AC-05/21 | `employee_assignment` |
| AC-07/08/09 | `employee_field_config`, `employee_change_request`, `employee_change_request_step` |
| AC-10/27 | sensitive columns + audit |
| AC-11/22 | `employee_assignment` range, `employee_job_history` |
| AC-12/37 | `employee_profile.status`, offboarding guard (Core) |
| AC-17 | Entity Registry |
| AC-23 | org chart (org tables) |
| AC-24 | `employee_document` |
| AC-25/26 | `employee_field_config`, `employee_approval_config` |
| AC-27/28 | onboarding/campaign |
| AC-29 | consent/privacy |
| AC-30/36 | org tables + projection |
| AC-31 | cutover mapping |
| AC-33/34/35 | Core auth/session + projection |

## 8. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Schema organization/employee/projection + migration mapping | Architect; CONF 1.0 |
| 0.2 | 2026-10-30 | Thêm `employee_reporting_relationship` cho org chart matrix; U7 | Architect; UI interactive |
| 1.0 | 2026-10-30 | Approved cùng Design review | Chủ dự án; design review 2026-10-30 |
| 1.1 | 2026-10-30 | Ghi chú prefix bảng implementation `plg_*` | Developer; TASK-426 |
