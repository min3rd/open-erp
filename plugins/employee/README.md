# Employee plugin

Plugin key `employee` (always-on). Backend vertical slice for Sprint 07 (TASK-430…434): HR profiles,
effective-dated assignments, self-service allowlist, multi-step change requests, document
storage/metadata, directory, field/approval configuration, onboarding, campaigns and privacy.
Zero-DB: all reads/writes go through `PluginDataClient` query descriptors.

## API

Base path: `/api/v1/employee`.

| Method | Path | Permission |
| :--- | :--- | :--- |
| GET | `/employees` | `employee:profile:read` |
| GET | `/employees/export` | `employee:profile:read` (CSV) |
| POST | `/employees/import` | `employee:profile:create` (JSON, dry-run) |
| POST | `/employees` | `employee:profile:create` |
| GET | `/employees/{id}` | `employee:profile:read` |
| PUT | `/employees/{id}` | `employee:profile:update` |
| GET | `/employees/{id}/assignments` | `employee:profile:read` |
| POST | `/employees/{id}/assignments` | `employee:assignment:manage` |
| GET | `/me` | `employee:self:read` |
| PATCH | `/me` | `employee:self:update` |
| GET | `/me/change-requests` | `employee:self:read` |
| POST | `/me/change-requests` | `employee:self:update` |
| POST | `/me/change-requests/{id}/withdraw` | `employee:self:update` |
| GET | `/change-requests` | `employee:change-request:read` |
| GET | `/change-requests/{id}` | `employee:change-request:read` |
| POST | `/change-requests` | `employee:profile:update` |
| POST | `/change-requests/{id}/approve` | `employee:change-request:approve` |
| POST | `/change-requests/{id}/reject` | `employee:change-request:approve` |
| GET | `/config/fields` | `employee:field-config:manage` |
| PUT | `/config/fields` | `employee:field-config:manage` |
| GET | `/config/approvals` | `employee:approval-config:manage` |
| PUT | `/config/approvals` | `employee:approval-config:manage` |
| DELETE | `/config/approvals/{id}` | `employee:approval-config:manage` |
| GET | `/directory` | `employee:directory:read` |
| GET | `/org-chart` | `employee:directory:read` |
| GET | `/employees/{id}/documents` | `employee:document:read` |
| POST | `/employees/{id}/documents` | `employee:document:manage` |
| POST | `/employees/{id}/documents` (multipart) | `employee:document:manage` |
| GET | `/documents/{id}/download` | `employee:document:read` |
| GET | `/me/documents` | `employee:self:read` |
| POST | `/me/documents` (multipart) | `employee:self:update` |
| GET | `/me/documents/{id}/download` | `employee:self:read` |
| POST | `/internal/documents/{id}/scan-result` | `employee:document:manage` |
| POST | `/onboarding-invites` | `employee:onboarding:manage` |
| GET | `/onboarding-invites` | `employee:onboarding:manage` |
| POST | `/onboarding-invites/{id}/revoke` | `employee:onboarding:manage` |
| POST | `/public/onboarding/{token}` | public (gateway tenant context) |
| POST | `/campaigns` | `employee:campaign:manage` |
| GET | `/campaigns` | `employee:campaign:manage` |
| GET | `/campaigns/{id}/recipients` | `employee:campaign:manage` |
| POST | `/campaigns/{id}/close` | `employee:campaign:manage` |
| POST | `/privacy/requests` | self (`employee:self:update`) or `employee:privacy:manage` |
| GET | `/privacy/requests` | `employee:privacy:manage` |
| POST | `/privacy/requests/{id}/complete` | `employee:privacy:manage` |
| GET | `/privacy/consents` | self (`employee:self:read`) or `employee:privacy:manage` |
| PUT | `/privacy/consents` | self (`employee:self:update`) or `employee:privacy:manage` |
| POST | `/internal/tenant/bootstrap` | `employee:field-config:manage` |

All responses use the SDK `ApiResponse` templates (single, paginated, non-paginated, error) and
UPPER_SNAKE_CASE codes from `EmployeeErrorCode`. `tenant_id` always comes from the gateway context.
`/me` resolves the profile from the authenticated `user_id`; it never accepts an employee id.

## Approval chain

`PUT /config/approvals` accepts a list of rows and upserts them by
`(scope_type, scope_id, field_group, step_no)`. `TENANT` rows ignore `scope_id`; `BRANCH`/
`DEPARTMENT` rows require it. A change request resolves the chain from the employee's primary
active assignment: `DEPARTMENT` overrides `BRANCH` overrides `TENANT` for the same configured step,
and `field_group` matches the changed field group, `PROFILE` or `ALL`. Steps are renumbered from 1
when the request is created. Without matching config the request keeps the single `ROLE` step.
Approving a non-final step advances `current_step`; the final approval applies the diff; any reject
closes the request. Approvers may not approve or reject their own request.

## Migration

`migrations/V1.0.0__employee_schema.sql` creates `plg_employee_*` tables per DES-DB-S07-001:

- profiles, assignments, reporting relationships, contracts, job history
- field config, approval config, change requests + steps
- documents, onboarding invites, update campaigns + recipients, consents, privacy requests, outbox
- `btree_gist` + GiST `EXCLUDE` prevent overlapping assignment/reporting periods; partial unique
  indexes enforce one active primary assignment and one open change request per employee.

`V1.0.1__employee_offboarding.sql` adds exit fields. `V1.0.2__employee_onboarding_campaign_privacy.sql`
adds the onboarding `payload` column, a partial unique index for tenant-scope approval config, and
campaign/privacy indexes. The checksums in `plugin.json` are checked by the CLI.

## Bootstrap

`POST /internal/tenant/bootstrap` is idempotent and seeds the default `employee_field_config` rows
from `EmployeeFields`. Call it after tenant provisioning; self-service PATCH is denied for fields
that are not provisioned in the tenant allowlist.

## Documented limits (v1 slice)

- **Document storage is plugin-local.** Multipart upload writes under
  `employee.document.storage-dir` (`EMPLOYEE_DOCUMENT_STORAGE_DIR`) or the OS temp directory plus
  `open-erp-employee-documents`; JSON metadata upload remains available for externally stored
  objects. Max size defaults to 10 MiB (`EMPLOYEE_DOCUMENT_MAX_BYTES`); accepted MIME types are PDF,
  PNG/JPEG/WEBP images, Word, Excel, CSV and plain text. Downloads are blocked while `scan_status`
  is `INFECTED` or `FAILED`; scan results arrive through the internal callback. Self-service upload/
  download uses `/me/documents` and only serves the caller's own profile. Short-lived signed download
  URLs (`POST /documents/{id}/signed-url`, `/me/documents/{id}/signed-url`, public
  `GET /signed-documents/{id}` passthrough, HMAC-SHA256 + TTL) ship since TASK-433; the WC downloads
  documents through them (TASK-442). No retention job or worker-level virus scanner in this slice.
- **Approval chain resolution is deterministic but simple.** It uses the primary active assignment
  for branch/department scope and selects one row per configured step (scope specificity wins, then
  the alphabetically first field group); there is no delegation, reminder, approver-identity
  enforcement (only the permission and self-approval guard) or automatic conflict re-check before
  applying a diff.
- **Organization master data is a soft reference.** Branch/department ids are validated for presence
  only; the employee plugin cannot query the organization plugin. Assignment changes emit
  `SCOPE_UPSERT` to `plg_employee_outbox`; access-membership/projection sync is TASK-431 follow-up.
  Outbox writes are best-effort (logged, primary write already committed) because the gateway has no
  cross-query transaction.
- **Onboarding submit is safe by design.** The public route requires gateway tenant context (the
  token itself is not a tenant lookup), stores only hashed tokens, and marks the invite `SUBMITTED`
  with the submitted payload. It does not create or update a profile; HR still reviews and creates
  the employee. Rate limiting is delegated to the gateway; token format and payload size are cheap
  pre-checks. Expired/used/revoked tokens are rejected.
- **Campaigns** create up to 500 recipients from an explicit id list or an `ALL`/`ACTIVE` filter and
  emit one `NOTIFICATION` outbox event. Recipient rows are written sequentially, so a mid-create
  failure can leave a partial campaign. There is no scheduler, per-recipient notification worker or
  recipient completion API; closing a campaign marks pending recipients `SKIPPED`.
- **Privacy** stores request type/status/payload and consent purpose/status only; no legal text,
  DSAR export/delete worker, breach workflow or retention policy engine is implemented.
- **Directory** returns basic profile fields only (no branch/department/job title join). `GET /org-chart`
  returns a flat pre-order tree from active employees + reporting relationships (max depth 20).
  Import is JSON-only with `dry_run`; export is CSV and applies the same sensitive-field mask.
  A bad import row is reported by row number and does not roll back earlier rows.
- **Sensitive fields** (`national_id`, `tax_code`, insurance numbers) are returned only when the
  caller has `employee:sensitive:read` (or platform context).
- Field config updates are partial: omitted booleans keep the existing or seeded default.
- Change request header and steps are written sequentially (gateway descriptors are single-table).
  A failure mid-create can leave an open request without all steps; retrying create is blocked by
  the open-request unique index and needs manual repair.
- No import/export job or aggregate org-chart endpoint in this slice.
- **Offboarding governance** calls Core `GET /api/v1/internal/employees/{userId}/offboarding-check`
  with the plugin service token; `OPENERP_CORE_URL` must be set in every deployment. The check is
  fail-closed when Core is unavailable.
- **UI** ships as the `employee-plugin` Angular project (`web/`): admin list/detail/create/edit,
  self change requests + withdraw, document upload/download, change-request approval and approval
  config, plus an `op-employee-menu-item` user-menu contribution. Field-config/campaign/onboarding/
  privacy screens are not built yet.

## Build

From the repository root (when `plugins/pom.xml` includes the module):

```bash
mvn -q -f plugins/pom.xml -pl employee -am test
```

Standalone fallback (module not yet registered in `plugins/pom.xml`; requires the installed SDK):

```bash
mvn -q -f plugins/employee/pom.xml test
```

Manifest validation from this directory:

```bash
node ../../tools/open-erp-cli/bin/open-erp.js validate
```
