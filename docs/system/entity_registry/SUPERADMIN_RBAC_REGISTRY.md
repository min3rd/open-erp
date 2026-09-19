# [REG-02] Sổ Đăng Ký Entity Super Admin, Cơ Cấu Tổ Chức & Phân Quyền (Sprint 02)

- **Plugin ID**: `core-platform` (Platform), `core-organization` (Organization), `core-iam` (IAM), `core` (Reference Entity).
- **Storage**: `postgres`
- **Cơ chế đăng ký**: `@RegisterEntity` + `EntityRegistryService` (quét Jandex index khi khởi động), migration `V2.0.0__superadmin_rbac_schema.sql`.
- **Tài liệu nền tảng**: [README.md](README.md), `docs/system/architecture/SYSTEM_BLUEPRINT.md` mục 5.1.
- **Trạng thái**: 13 entity đăng ký ngày 2026-09-18 (Sprint 02 - Wave 1 Foundation); tổng registry toàn hệ thống: **20 entity** (7 Core IAM + 13 Sprint 02). **Xác nhận Wave 3 (2026-09-18)**: không có entity mới phát sinh từ retrofit enforcement/quota/impersonation guard/plugin allowlist/must-change-password — 13 entity Sprint 02 giữ nguyên.

---

## 1. Danh Sách Entity Đã Đăng Ký

| Entity | Bảng | Module (Plugin) | Khóa Chính | Quan Hệ Chính (Chéo Tenant) | Ghi Chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PlatformSuperAdmin` | `platform_super_admins` | `core-platform` | `id` (UUID) | N-1 `users` (`user_id`, `disabled_by`, `granted_by`) | `user_id` UNIQUE; `role` ∈ `SUPER_ADMIN/SUPPORT_ENGINEER`; `status` ∈ `INVITED/ACTIVE/DISABLED/REVOKED` |
| `PlatformImpersonationLog` | `platform_impersonation_logs` | `core-platform` | `id` (UUID) | N-1 `users` (`super_admin_user_id`, `target_user_id`); N-1 `tenants` (`target_tenant_id`) | Nhật ký phiên đại diện `STARTED/ENDED/TIMEOUT`; app role bị thu hồi quyền `DELETE` |
| `PlatformAuditLog` | `platform_audit_logs` | `core-platform` | `(id, created_at)` | N-1 `users` (`actor_user_id`); N-1 `tenants` (`tenant_id`, `target_tenant_id`) | **Partition theo tháng trên `created_at`** (partition tháng hiện tại + 2 tháng kế tiếp + `platform_audit_logs_default`); append-only + hash chain `prev_hash`/`entry_hash`; trigger chặn `UPDATE/DELETE` |
| `Branch` | `branches` | `core-organization` | `id` (UUID) | N-1 `tenants` (`tenant_id`) | UNIQUE `(tenant_id, code)`; composite unique `(id, tenant_id)` làm đích FK chéo tenant |
| `Department` | `departments` | `core-organization` | `id` (UUID) | N-1 `tenants`; N-1 `branches` (`branch_id`); N-1 `users` (`manager_user_id`); self-ref `parent_id` | Cây phòng ban đa cấp; UNIQUE `(tenant_id, code)`; composite unique `(id, tenant_id)` |
| `UserDepartmentMembership` | `user_department_memberships` | `core-organization` | `id` (UUID) | N-1 `users`, `tenants`, `branches`, `departments`, `direct_manager_user_id` → `users` | Partial unique `uq_user_primary_dept` (mỗi user 1 phòng ban chính); FK composite chéo tenant tới `branches`/`departments`; trigger `trg_membership_branch_match` |
| `UserBranchAssignment` | `user_branch_assignments` | `core-organization` | `id` (UUID) | N-1 `users`, `tenants`, `branches` | Partial unique `uq_user_primary_branch` (mỗi user tối đa 1 primary); UNIQUE `(user_id, branch_id)`; FK composite chéo tenant tới `branches` |
| `Permission` | `permissions` | `core-iam` | `id` (UUID) | Không có quan hệ chéo tenant (danh mục toàn cục) | `code` UNIQUE toàn cục; seed 24 quyền core kèm `description_key` i18n |
| `Role` | `roles` | `core-iam` | `id` (UUID) | N-1 `tenants` (`tenant_id`) | `tenant_id NULL` = system role; partial unique `uq_roles_system_code`; UNIQUE `(tenant_id, code)`; composite unique `(id, tenant_id)` |
| `RolePermission` | `role_permissions` | `core-iam` | `(role_id, permission_id)` | N-1 `roles`, N-1 `permissions` | Bảng N-N role↔permission; gán mặc định cho 5 system roles |
| `UserRole` | `user_roles` | `core-iam` | `(user_id, tenant_id, role_id)` | N-1 `users`, N-1 `tenants`, N-1 `roles` | Trigger `trg_fn_assert_role_tenant_scope` chặn gán vai trò chéo tenant (cho phép system role `tenant_id NULL`); nguồn vai trò chính thay `user_tenants.role` |
| `RoleDataPolicy` | `role_data_policies` | `core-iam` | `id` (UUID) | N-1 `tenants`, N-1 `roles` | UNIQUE `(role_id, resource)`; check constraint 7 scopes × 6 operations; trigger `trg_fn_assert_role_tenant_scope` |
| `CoreSampleRecord` | `core_sample_records` | `core` (Reference Entity) | `id` (UUID) | N-1 `tenants`, `branches`, `departments`, `users` (`created_by`, `assignee_id`) | Entity tham chiếu FEAT-17 kiểm chứng Data Permission Engine; mang đủ cột scope `tenant_id/branch_id/department_id/created_by/assignee_id` |

---

## 2. Public Fields Xuất Ra Ngoài

| Entity | Public Fields |
| :--- | :--- |
| `PlatformSuperAdmin` | `id`, `user_id`, `role`, `is_active`, `status`, `must_change_password`, `two_factor_required`, `last_login_at` |
| `PlatformImpersonationLog` | `id`, `super_admin_user_id`, `target_tenant_id`, `target_user_id`, `support_ticket`, `started_at`, `ended_at`, `status` |
| `PlatformAuditLog` | `id`, `event_id`, `scope`, `tenant_id`, `actor_user_id`, `actor_type`, `action`, `resource_type`, `resource_id`, `result`, `created_at` |
| `Branch` | `id`, `tenant_id`, `code`, `name`, `is_default`, `status`, `created_at` |
| `Department` | `id`, `tenant_id`, `branch_id`, `parent_id`, `code`, `name`, `manager_user_id`, `status`, `created_at` |
| `UserDepartmentMembership` | `id`, `user_id`, `tenant_id`, `branch_id`, `department_id`, `direct_manager_user_id`, `is_primary`, `joined_at` |
| `UserBranchAssignment` | `id`, `user_id`, `tenant_id`, `branch_id`, `is_primary`, `can_manage`, `assigned_at` |
| `Permission` | `id`, `code`, `domain`, `resource`, `action`, `description_key`, `is_system` |
| `Role` | `id`, `tenant_id`, `code`, `name`, `is_system`, `created_at` |
| `RolePermission` | `role_id`, `permission_id`, `granted_at` |
| `UserRole` | `user_id`, `tenant_id`, `role_id`, `assigned_at`, `assigned_by` |
| `RoleDataPolicy` | `id`, `tenant_id`, `role_id`, `resource`, `create_scope`, `read_scope`, `update_scope`, `delete_scope`, `export_scope`, `share_scope` |
| `CoreSampleRecord` | `id`, `tenant_id`, `branch_id`, `department_id`, `created_by`, `assignee_id`, `title`, `amount`, `status`, `created_at` |

---

## 3. Ghi Chú An Toàn Tham Chiếu & Toàn Vẹn

- Plugin khác **chỉ được tham chiếu** các trường nằm trong cột `Public Fields`; các trường nhạy cảm (`disabled_by`, `granted_by`, `ip_address`, `user_agent`, `reason`, `support_ticket`, `correlation_id`, `details`, `prev_hash`, `entry_hash` của audit) không được xuất ra ngoài.
- **Cross-tenant isolation (BUG-66)**: các bảng tổ chức dùng FK composite `(branch_id, tenant_id) → branches(id, tenant_id)` và `(department_id, tenant_id) → departments(id, tenant_id)`. Riêng `user_roles`/`role_data_policies` dùng trigger `trg_fn_assert_role_tenant_scope` thay composite FK vì system role có `tenant_id NULL` — trigger vẫn đảm bảo role thuộc đúng tenant hoặc là system role toàn cục.
- **Audit log bất biến**: `platform_audit_logs` là bảng partition theo tháng (`PRIMARY KEY (id, created_at)`), ghi append-only qua `AuditLogService` (hash chain SHA-256); trigger `trg_audit_logs_immutable` + revoke `UPDATE/DELETE` trên app role. Job retention/partition maintenance hoàn tất Wave 2 (2026-09-18); cold archive MongoDB/S3 (TASK-293) chuyển Wave 3.
- Mọi entity mới phát sinh trong tương lai bắt buộc bổ sung `@RegisterEntity` và cập nhật bảng trên trước khi được sử dụng.
