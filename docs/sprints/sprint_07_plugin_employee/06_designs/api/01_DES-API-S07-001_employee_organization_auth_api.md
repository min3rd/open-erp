# [DES-API-S07-001] API contract: employee, organization, auth switch

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-API-S07-001 / Thiết kế API / Sprint 07 |
| Trạng thái / phiên bản / cập nhật | Approved / 1.0 / 2026-10-30 |
| Owner / reviewer | Architect Agent / Chủ dự án + BA |
| Đầu vào | [CONF-S07-001 1.0](../../04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md), [DES-DB-S07-001](../db/01_DES-DB-S07-001_employee_organization_schema.md), [ADR-S07-003](../../05_solutions/04_ADR-S07-003_tenant_switcher_header.md) |
| Đọc trước / đọc tiếp | DES-DB-S07-001 / [DES-UI-S07-001](../ui/01_DES-UI-S07-001_employee_organization_ui.md) |

## 1. Quy ước chung

- Base: `/api/v1/org`, `/api/v1/employee`, `/api/v1/auth`, `/api/v1/internal`.
- Auth: Bearer JWT; tenant lấy từ token, **không** nhận `tenant_id` client (trừ internal service token).
- Mọi response theo 4 khuôn mẫu tại [api_standards.md](../../../../../.agents/rules/api_standards.md); `code` UPPER_SNAKE_CASE; `message` tiếng Anh; `params` object; không message tiếng Việt.
- Paginated list: `data.items/page/size/total_items/total_pages`; page 0-based.
- `Idempotency-Key` cho POST tạo request/import/export/switch.
- Permission + data scope kiểm tra server; self endpoint resolve từ JWT.
- File download là binary (ngoại lệ có kiểm soát): `Content-Type`/`Content-Disposition`, audit; không bọc envelope.

## 2. Auth

### 2.1. `GET /api/v1/auth/me/tenants`

- Auth: Bearer.
- Response: Non-Paginated List.
```json
{
  "success": true,
  "code": "AUTH_TENANT_LIST_SUCCESS",
  "message": "Tenant list retrieved successfully.",
  "params": {},
  "data": {
    "items": [
      { "id": "uuid", "name": "Acme", "slug": "acme", "role": "OWNER", "is_default": true, "status": "ACTIVE" }
    ]
  }
}
```

### 2.2. `POST /api/v1/auth/switch-tenant`

- Auth: Bearer hiện tại.
- Request: `{ "tenant_id": "uuid" }`
- Response: Single Resource (LoginResult).
- Side effects: revoke session cũ, tạo session mới, audit `AUTH_TENANT_SWITCHED`.
- Errors: `AUTH_TENANT_ACCESS_DENIED` (403), `AUTH_TENANT_SUSPENDED` (403), `AUTH_SESSION_INVALID` (401), `AUTH_TENANT_SWITCH_RATE_LIMITED` (429).
- Idempotency: key tùy chọn; nếu lặp trong 30s trả cùng kết quả.

## 3. Organization plugin

### 3.1. Branches

| Method | Path | Permission | Response |
| :--- | :--- | :--- | :--- |
| GET | `/org/branches` | `organization:branch:read` | Paginated List (`q`, `status`, `page`, `size`) |
| GET | `/org/branches/options` | `organization:branch:read` | Non-Paginated List (`{items:[{value,label,is_default,status}]}`) |
| POST | `/org/branches` | `organization:branch:manage` | Single Resource |
| GET | `/org/branches/{id}` | `organization:branch:read` | Single Resource |
| PUT | `/org/branches/{id}` | `organization:branch:manage` | Single Resource |
| DELETE | `/org/branches/{id}` | `organization:branch:manage` | Single Resource (`data:null`; archive) |

Codes: `ORG_BRANCH_LIST_SUCCESS`, `ORG_BRANCH_CREATED`, `ORG_BRANCH_UPDATED`, `ORG_BRANCH_ARCHIVED`, `ORG_BRANCH_NOT_FOUND`, `ORG_BRANCH_CODE_EXISTS`, `ORG_BRANCH_DEFAULT_REQUIRED`, `ORG_BRANCH_IN_USE`.

### 3.2. Departments

| Method | Path | Permission | Response |
| :--- | :--- | :--- | :--- |
| GET | `/org/departments` | `organization:department:read` | Paginated List (`q`, `branch_id`, `parent_id`, `status`) |
| GET | `/org/departments/tree` | `organization:department:read` | Non-Paginated List (cây) |
| POST | `/org/departments` | `organization:department:manage` | Single Resource |
| GET/PUT | `/org/departments/{id}` | read/manage | Single Resource |
| DELETE | `/org/departments/{id}` | `organization:department:manage` | Single Resource (archive; chặn nếu còn con/nhân viên) |

Codes: `ORG_DEPARTMENT_*`, `ORG_DEPARTMENT_CYCLE`, `ORG_DEPARTMENT_IN_USE`, `ORG_DEPARTMENT_BRANCH_MISMATCH`.

### 3.3. Memberships (access)

| Method | Path | Permission | Response |
| :--- | :--- | :--- | :--- |
| GET | `/org/memberships` | `organization:membership:read` | Paginated List (`user_id`, `branch_id`, `department_id`) |
| POST | `/org/memberships` | `organization:membership:manage` | Single Resource |
| PUT | `/org/memberships/{id}` | `organization:membership:manage` | Single Resource |
| DELETE | `/org/memberships/{id}` | `organization:membership:manage` | Single Resource |
| PUT | `/org/memberships/by-user/{user_id}` | service/HR internal | Single Resource (upsert idempotent) |

Codes: `ORG_MEMBERSHIP_*`, `ORG_MEMBERSHIP_PRIMARY_REQUIRED`, `ORG_MEMBERSHIP_OVERLAP`, `ORG_MEMBERSHIP_CYCLE`, `ORG_MEMBERSHIP_NOT_FOUND`.

### 3.4. Branch access

`GET/POST/PUT/DELETE /org/branch-access`; permission `organization:branch-access:*`; codes `ORG_BRANCH_ACCESS_*`.

### 3.5. Org chart

`GET /org/org-chart?root_department_id=&depth=` — Non-Paginated List hoặc tree object; permission `organization:org-chart:read`; trả node `{department_id,name,branch_id,manager_user_id,children[]}`. Không trả sensitive HR.

## 4. Employee plugin

### 4.1. Employees (HR admin)

| Method | Path | Permission | Response |
| :--- | :--- | :--- | :--- |
| GET | `/employee/employees` | `employee:profile:read` | Paginated List (`q`, `branch_id`, `department_id`, `status`, `employee_type`, `page`, `size`, `sort`) |
| POST | `/employee/employees` | `employee:profile:create` | Single Resource |
| GET | `/employee/employees/{id}` | `employee:profile:read` | Single Resource (mask theo quyền) |
| PUT | `/employee/employees/{id}` | `employee:profile:update` | Single Resource |
| DELETE | `/employee/employees/{id}` | `employee:profile:archive` | Single Resource (archive/LEFT; không hard delete) |
| POST | `/employee/employees/{id}/link-user` | `employee:profile:update` | Single Resource |
| POST | `/employee/employees/{id}/unlink-user` | `employee:profile:update` | Single Resource |
| GET | `/employee/employees/{id}/history` | `employee:profile:read` | Paginated List |

Codes: `EMPLOYEE_LIST_SUCCESS`, `EMPLOYEE_CREATED`, `EMPLOYEE_UPDATED`, `EMPLOYEE_ARCHIVED`, `EMPLOYEE_NOT_FOUND`, `EMPLOYEE_CODE_EXISTS`, `EMPLOYEE_USER_ALREADY_LINKED`, `EMPLOYEE_USER_NOT_MEMBER`, `EMPLOYEE_USER_NOT_LINKED`, `EMPLOYEE_ACTIVE_MEMBERSHIP`, `EMPLOYEE_OFFBOARD_HAS_SUBORDINATES`, `EMPLOYEE_LAST_OWNER_FORBIDDEN`, `EMPLOYEE_PLATFORM_ROLE_FORBIDDEN`.

### 4.2. Assignments

| Method | Path | Permission | Response |
| :--- | :--- | :--- | :--- |
| GET | `/employee/employees/{id}/assignments` | `employee:profile:read` | Non-Paginated List |
| POST | `/employee/employees/{id}/assignments` | `employee:assignment:manage` | Single Resource |
| PUT | `/employee/employees/{id}/assignments/{assignmentId}` | `employee:assignment:manage` | Single Resource |
| DELETE | `/employee/employees/{id}/assignments/{assignmentId}` | `employee:assignment:manage` | Single Resource |

Codes: `EMPLOYEE_ASSIGNMENT_*`, `EMPLOYEE_ASSIGNMENT_OVERLAP`, `EMPLOYEE_ASSIGNMENT_PRIMARY_REQUIRED`, `EMPLOYEE_ASSIGNMENT_MANAGER_CYCLE`, `EMPLOYEE_SCOPE_SYNC_PENDING`.

### 4.2.1. Reporting relationships (matrix)

| Method | Path | Permission | Response |
| :--- | :--- | :--- | :--- |
| GET | `/employee/employees/{id}/reporting-relationships` | `employee:profile:read` | Non-Paginated List |
| POST | `/employee/employees/{id}/reporting-relationships` | `employee:reporting:manage` | Single Resource |
| PUT | `/employee/reporting-relationships/{id}` | `employee:reporting:manage` | Single Resource |
| DELETE | `/employee/reporting-relationships/{id}` | `employee:reporting:manage` | Single Resource |

Request: `{manager_employee_id, relationship_type: PRIMARY|DOTTED|MATRIX, valid_from, valid_to}`.
Codes: `EMPLOYEE_REPORTING_*`, `EMPLOYEE_REPORTING_SELF_FORBIDDEN`, `EMPLOYEE_REPORTING_CYCLE`, `EMPLOYEE_REPORTING_OVERLAP`.

### 4.3. Contracts

`GET/POST/PUT/DELETE /employee/employees/{id}/contracts`; permission `employee:contract:manage`; codes `EMPLOYEE_CONTRACT_*`, `EMPLOYEE_CONTRACT_NO_EXISTS`, `EMPLOYEE_CONTRACT_DATE_INVALID`.

### 4.4. Documents

| Method | Path | Permission | Response |
| :--- | :--- | :--- | :--- |
| GET | `/employee/employees/{id}/documents` | `employee:document:read` | Non-Paginated List |
| POST | `/employee/employees/{id}/documents` | `employee:document:manage` | Single Resource (upload multipart) |
| GET | `/employee/documents/{docId}/download` | `employee:document:read` | Binary (signed URL/stream) |
| DELETE | `/employee/documents/{docId}` | `employee:document:manage` | Single Resource (archive) |
| GET | `/employee/me/documents` | `employee:self:read` | Non-Paginated List |
| POST | `/employee/me/documents` | `employee:self:update` | Single Resource (upload của mình) |
| GET | `/employee/me/documents/{docId}/download` | `employee:self:read` | Binary (của mình) |

Codes: `EMPLOYEE_DOCUMENT_*`, `EMPLOYEE_DOCUMENT_SCAN_FAILED`, `EMPLOYEE_DOCUMENT_TOO_LARGE`, `EMPLOYEE_DOCUMENT_TYPE_NOT_ALLOWED`, `EMPLOYEE_DOCUMENT_FORBIDDEN`.

### 4.5. Self-service

| Method | Path | Permission | Response |
| :--- | :--- | :--- | :--- |
| GET | `/employee/me` | `employee:self:read` | Single Resource |
| PATCH | `/employee/me` | `employee:self:update` | Single Resource (direct fields; others create request) |
| GET | `/employee/me/change-requests` | `employee:self:read` | Paginated List |
| POST | `/employee/me/change-requests` | `employee:self:update` | Single Resource |
| POST | `/employee/me/change-requests/{id}/withdraw` | `employee:self:update` | Single Resource |

Self endpoint **không** nhận `employee_id`; resolve từ JWT. Codes: `EMPLOYEE_PROFILE_NOT_FOUND`, `EMPLOYEE_SELF_FORBIDDEN`, `EMPLOYEE_FIELD_NOT_EDITABLE`, `EMPLOYEE_CHANGE_REQUEST_PENDING`, `EMPLOYEE_CHANGE_REQUEST_CONFLICT`.

### 4.6. Approval

| Method | Path | Permission | Response |
| :--- | :--- | :--- | :--- |
| GET | `/employee/change-requests` | `employee:change-request:read` | Paginated List (`status`, `employee_id`, `page`, `size`) |
| GET | `/employee/change-requests/{id}` | `employee:change-request:read` | Single Resource (diff + steps) |
| POST | `/employee/change-requests/{id}/approve` | `employee:change-request:approve` | Single Resource |
| POST | `/employee/change-requests/{id}/reject` | `employee:change-request:approve` | Single Resource (`reason` required) |

Codes: `EMPLOYEE_CHANGE_REQUEST_*`, `EMPLOYEE_SELF_APPROVAL_FORBIDDEN`, `EMPLOYEE_APPROVAL_CHAIN_INVALID`, `EMPLOYEE_APPROVAL_STEP_NOT_CURRENT`, `EMPLOYEE_REJECTION_REASON_REQUIRED`.

### 4.7. Config

| Method | Path | Permission | Response |
| :--- | :--- | :--- | :--- |
| GET/PUT | `/employee/config/fields` | `employee:field-config:manage` | Non-Paginated List / Single |
| GET/PUT | `/employee/config/approvals` | `employee:approval-config:manage` | Non-Paginated List / Single |
| GET/PUT | `/employee/config/privacy` | `employee:privacy:manage` | Single Resource |

### 4.8. Onboarding / campaign / privacy

| Method | Path | Permission | Response |
| :--- | :--- | :--- | :--- |
| POST | `/employee/onboarding-invites` | `employee:onboarding:manage` | Single Resource (link/token một lần) |
| GET | `/employee/onboarding-invites` | `employee:onboarding:manage` | Paginated List |
| POST | `/employee/public/onboarding/{token}` | public + token | Single Resource (submit; rate limit) |
| POST | `/employee/campaigns` | `employee:campaign:manage` | Single Resource |
| GET | `/employee/campaigns` | `employee:campaign:manage` | Paginated List |
| GET | `/employee/campaigns/{id}/recipients` | `employee:campaign:manage` | Paginated List |
| POST | `/employee/privacy/requests` | `employee:self:update` hoặc `employee:privacy:manage` | Single Resource |
| GET | `/employee/privacy/requests` | `employee:privacy:manage` | Paginated List |
| POST | `/employee/privacy/requests/{id}/complete` | `employee:privacy:manage` | Single Resource |

### 4.9. Directory / org chart

`GET /employee/directory` — `employee:directory:read`; Paginated List basic fields.
`GET /employee/org-chart` — `employee:org-chart:read`; tree read-only; không sensitive.

### 4.10. Import/export

| Method | Path | Permission | Response |
| :--- | :--- | :--- | :--- |
| POST | `/employee/imports` | `employee:profile:import` | Single Resource (job id; multipart CSV) |
| GET | `/employee/imports/{id}` | `employee:profile:import` | Single Resource (status/report) |
| POST | `/employee/exports` | `employee:profile:export` | Single Resource (job id/filter) |
| GET | `/employee/exports/{id}` | `employee:profile:export` | Single Resource |
| GET | `/employee/exports/{id}/download` | `employee:profile:export` | Binary |

## 5. Internal projection API

### 5.1. `PUT /api/v1/internal/scope-projections/{tenant_id}/{user_id}`

- Auth: service token/mTLS; không public.
- Request: `{primary_branch_id, primary_department_id, member_branch_ids[], managed_branch_ids[], department_ids[], version}`.
- Response: Single Resource (`CORE_SCOPE_PROJECTION_UPSERTED`).
- Stale version: `CORE_SCOPE_PROJECTION_STALE_SKIPPED` (200, không ghi).

### 5.2. `DELETE /api/v1/internal/scope-projections/{tenant_id}/{user_id}`

- Response: Single Resource (`CORE_SCOPE_PROJECTION_DELETED`).

### 5.3. `PUT /api/v1/internal/department-closure/{tenant_id}`

- Body: `{edges:[{ancestor_id,descendant_id,depth}]}`; replace transactionally.
- Response: Single Resource (`CORE_DEPARTMENT_CLOSURE_UPDATED`).

### 5.4. `POST /api/v1/internal/employee/documents/{doc_id}/scan-result`

- Auth: service token/mTLS (virus scanner).
- Body: `{status: "CLEAN|INFECTED|FAILED", engine, scanned_at}`.
- Response: Single Resource (`EMPLOYEE_DOCUMENT_SCAN_UPDATED`).
- `INFECTED` ⇒ document không public; audit; thông báo HR.

## 6. Error envelope mẫu

```json
{
  "success": false,
  "code": "EMPLOYEE_ASSIGNMENT_OVERLAP",
  "message": "Employee assignment period overlaps an existing assignment.",
  "params": { "employee_id": "uuid" },
  "errors": [
    { "field": "valid_from", "code": "VALIDATION_PERIOD_OVERLAP", "params": { "existing_from": "2026-01-01" } }
  ],
  "timestamp": "2026-10-30T10:30:00Z"
}
```

## 7. Permission mapping

| Old | New | Ghi chú |
| :--- | :--- | :--- |
| `core:organization:manage` | `organization:org:manage` | Migration grant |
| `core:branch:read/manage` | `organization:branch:read/manage` | |
| `core:department:read/manage` | `organization:department:read/manage` | |
| `core:membership:read/manage` | `organization:membership:read/manage` | |
| `core:branch-assignment:read/manage` | `organization:branch-access:read/manage` | |

Employee permission mới: `employee:profile:read/create/update/archive/export/import`, `employee:assignment:manage`, `employee:reporting:manage`, `employee:contract:manage`, `employee:document:read/manage`, `employee:sensitive:read`, `employee:change-request:read/approve`, `employee:self:read/update`, `employee:field-config:manage`, `employee:approval-config:manage`, `employee:onboarding:manage`, `employee:campaign:manage`, `employee:privacy:manage`, `employee:directory:read`, `employee:org-chart:read`.

## 8. Traceability

AC-01…AC-37; đặc biệt AC-06 self, AC-08 approval, AC-13 pagination, AC-14 isolation, AC-15 permission, AC-18 import/export, AC-19 mobile, AC-30 organization, AC-33 switch.

## 9. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Contract auth/org/employee/internal; 4 response templates; error/permission mapping | Architect; CONF 1.0 |
| 0.2 | 2026-10-30 | Thêm reporting relationship API, self documents, scan callback; U7 | Architect; UI interactive |
| 1.0 | 2026-10-30 | Approved cùng Design review | Chủ dự án; design review 2026-10-30 |
