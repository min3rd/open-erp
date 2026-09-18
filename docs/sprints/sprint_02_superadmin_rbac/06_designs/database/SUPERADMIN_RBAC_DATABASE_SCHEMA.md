# [DES-02-DB] Thiết Kế Chi Tiết Cơ Sở Dữ Liệu: Super Admin Nền Tảng, Cơ Cấu Tổ Chức & Phân Quyền Đa Phạm Vi

- **Mã Tài Liệu**: DES-02-DB
- **Phụ Trách**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Hệ Quản Trị CSDL**: PostgreSQL 16+
- **Schema**: `public`
- **Ngày Hoàn Thành**: 2026-09-18

---

## 1. Sơ Đồ Quan Hệ Thực Thể Tổng Thể (ERD)

```
[platform_super_admins]                 [tenants (Extended)]
       |                                       |
       v                                       +--------------------------------+
[platform_audit_logs]                          |                                |
       ^                                       v                                v
       |                                  [branches]                         [roles]
[platform_impersonation_logs]                  |                                |
                                               v                                +---------------+
                                         [departments]                          |               |
                                               |                                v               v
                                               v                       [role_permissions] [role_data_policies]
                                  [user_department_memberships]                 |               |
                                               ^                                v               |
                                               |                          [permissions]         |
                                         [user_roles] <-----------------------------------------+
                                               |
                                               v
                                        [users (Core)]
                                               ^
                                               |
                                  [user_branch_assignments] ---> [branches]
```

---

## 2. Chi Tiết Các Bảng Dữ Liệu Quản Trị Nền Tảng (Platform Layer)

### 2.1. Cập Nhật Bảng `tenants` (Bổ Sung Hạn Mức & Khóa Vận Hành)
```sql
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(32) NOT NULL DEFAULT 'STANDARD', -- COMMUNITY, STANDARD, ENTERPRISE
ADD COLUMN IF NOT EXISTS max_users INT NOT NULL DEFAULT 10,                 -- Giới hạn số user hoạt động
ADD COLUMN IF NOT EXISTS max_storage_mb INT NOT NULL DEFAULT 5120,          -- Hạn mức lưu trữ file (MB)
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,            -- Thời điểm hết hạn dùng thử
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE,          -- Trạng thái khóa khẩn cấp
ADD COLUMN IF NOT EXISTS lock_reason TEXT,                                  -- Lý do khóa
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS allowed_plugins JSONB DEFAULT '["core"]'::jsonb;   -- Danh sách plugin được bật

CREATE INDEX IF NOT EXISTS idx_tenants_plan_tier ON tenants(plan_tier);
CREATE INDEX IF NOT EXISTS idx_tenants_is_locked ON tenants(is_locked);
CREATE INDEX IF NOT EXISTS idx_tenants_trial_ends ON tenants(trial_ends_at);
```

**Trạng thái vòng đời Tenant (BUG-55)**:
- `status` ∈ `ACTIVE`, `TRIAL`, `SUSPENDED`, `EXPIRED`, `PENDING_DELETION`, `DELETED` (đồng bộ enum Java `TenantStatus` và TypeScript `@shared/enums`).
- Quy tắc bất biến: `is_locked = TRUE ⇔ status = 'SUSPENDED'`.
  - **Lock**: đặt `is_locked = TRUE`, `status = 'SUSPENDED'`, bắt buộc kèm `lock_reason`, `locked_at = NOW()`.
  - **Unlock**: đặt `is_locked = FALSE`, `lock_reason = NULL`; `status` trở về `ACTIVE`, hoặc `EXPIRED` nếu trial đã quá hạn (`trial_ends_at < NOW()`).
- Job vòng đời định kỳ (TASK-272) chịu trách nhiệm chuyển `TRIAL → EXPIRED` và `ACTIVE/TRIAL/EXPIRED → PENDING_DELETION → DELETED` theo chính sách.

### 2.2. Bảng `platform_super_admins` (Định Danh Người Quản Trị Nền Tảng)
```sql
CREATE TABLE platform_super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'SUPER_ADMIN', -- SUPER_ADMIN, SUPPORT_ENGINEER
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    granted_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_platform_admin_user UNIQUE(user_id)
);

CREATE INDEX idx_platform_super_admins_active ON platform_super_admins(is_active);
```

### 2.3. Bảng `platform_impersonation_logs` (Nhật Ký Đăng Nhập Đại Diện)
```sql
CREATE TABLE platform_impersonation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    super_admin_user_id UUID NOT NULL REFERENCES users(id),
    target_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    support_ticket VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(32) NOT NULL DEFAULT 'STARTED' -- STARTED, ENDED, TIMEOUT
);

CREATE INDEX idx_imp_logs_super_admin ON platform_impersonation_logs(super_admin_user_id);
CREATE INDEX idx_imp_logs_tenant ON platform_impersonation_logs(target_tenant_id);
CREATE INDEX idx_imp_logs_ticket ON platform_impersonation_logs(support_ticket);
CREATE INDEX idx_imp_logs_started ON platform_impersonation_logs(started_at DESC);
CREATE INDEX idx_imp_logs_admin_started ON platform_impersonation_logs(super_admin_user_id, started_at DESC);
```

> **Ngoại lệ bất biến có kiểm soát**: Bảng `platform_impersonation_logs` **KHÔNG** áp trigger immutable như `platform_audit_logs`, vì luồng nghiệp vụ bắt buộc `UPDATE` cột `status` (`STARTED → ENDED/TIMEOUT`) và `ended_at` khi phiên đại diện kết thúc. Bảng vẫn bị `REVOKE DELETE` với role ứng dụng; mọi thao tác `UPDATE` chỉ thực hiện qua service nội bộ (không cấp cho client).

### 2.4. Bảng `platform_audit_logs` (Nhật Ký Kiểm Toán Bất Biến Nền Tảng)
```sql
CREATE TABLE platform_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(64) NOT NULL,                  -- TENANT_LOCK, TENANT_UNLOCK, TENANT_QUOTA_UPDATE, USER_GLOBAL_LOCK, USER_GLOBAL_UNLOCK, USER_FORCE_PASSWORD_RESET, USER_BREAK_GLASS_DISABLE_2FA, IMPERSONATION_START, IMPERSONATION_END
    target_tenant_id UUID REFERENCES tenants(id),
    target_user_id UUID REFERENCES users(id),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,   -- { "old_value": {...}, "new_value": {...} }
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_platform_audit_actor ON platform_audit_logs(actor_user_id);
CREATE INDEX idx_platform_audit_action ON platform_audit_logs(action);
CREATE INDEX idx_platform_audit_tenant ON platform_audit_logs(target_tenant_id);
CREATE INDEX idx_platform_audit_created ON platform_audit_logs(created_at DESC);

-- Trigger PostgreSQL đảm bảo tính BẤT BIẾN (Chống UPDATE và DELETE)
CREATE OR REPLACE FUNCTION trg_fn_prevent_audit_tamper()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'CANNOT MODIFY OR DELETE AUDIT TRAIL LOG RECORD';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON platform_audit_logs
FOR EACH ROW EXECUTE FUNCTION trg_fn_prevent_audit_tamper();
```

> **Ghi chú**: Bảng `platform_impersonation_logs` (§2.3) **KHÔNG** áp trigger immutable vì cần `UPDATE` trạng thái `STARTED → ENDED/TIMEOUT`; đây là ngoại lệ có kiểm soát và vẫn bị `REVOKE DELETE`.

### 2.5. Bảng `core_sample_records` (Reference Entity - FEAT-17)
Bảng thực nghiệm dùng để kiểm chứng **Data Permission Enforcement Engine** (SOL-02) với đầy đủ 5 cột chuẩn `tenant_id, branch_id, department_id, created_by, assignee_id`:

```sql
CREATE TABLE core_sample_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID,
    department_id UUID,
    created_by UUID NOT NULL REFERENCES users(id),
    assignee_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, ARCHIVED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bộ chỉ mục chuẩn phục vụ Data Scope SQL Compiler (SOL-02 §7)
CREATE INDEX idx_core_sample_tenant_branch ON core_sample_records(tenant_id, branch_id);
CREATE INDEX idx_core_sample_tenant_dept ON core_sample_records(tenant_id, department_id);
CREATE INDEX idx_core_sample_tenant_created ON core_sample_records(tenant_id, created_by);
CREATE INDEX idx_core_sample_tenant_assignee ON core_sample_records(tenant_id, assignee_id);
```

> Entity này bắt buộc đăng ký vào **Entity Registry** (TASK-276) để xuất hiện trong `GET /api/v1/iam/data-resources` (TASK-282).

---

## 3. Chi Tiết Các Bảng Cơ Cấu Tổ Chức Doanh Nghiệp (Organization Layer)

### 3.1. Bảng `branches` (Danh Mục Chi Nhánh)
```sql
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,                    -- BR-HN, BR-HCM, BR-DN
    name VARCHAR(255) NOT NULL,                   -- Chi nhánh Hà Nội, Chi nhánh TP.HCM
    phone VARCHAR(32),
    address TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_branch_tenant_code UNIQUE(tenant_id, code)
);

CREATE INDEX idx_branches_tenant ON branches(tenant_id);
CREATE INDEX idx_branches_status ON branches(status);
```

### 3.2. Bảng `departments` (Cây Phòng Ban Phân Cấp)
```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES departments(id) ON DELETE RESTRICT, -- Phòng ban cấp trên (Self-referencing tree)
    code VARCHAR(32) NOT NULL,                    -- KD-B2B, KD-RETAIL, KETOAN
    name VARCHAR(255) NOT NULL,                   -- Phòng Kinh Doanh B2B
    manager_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Trưởng bộ phận
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_dept_tenant_code UNIQUE(tenant_id, code)
);

CREATE INDEX idx_departments_tenant ON departments(tenant_id);
CREATE INDEX idx_departments_branch ON departments(branch_id);
CREATE INDEX idx_departments_parent ON departments(parent_id);
CREATE INDEX idx_departments_manager ON departments(manager_user_id);
```

### 3.3. Bảng `user_department_memberships` (Gán Nhân Viên & Tuyến Quản Lý Báo Cáo)
```sql
CREATE TABLE user_department_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    direct_manager_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Quản lý trực tiếp
    title VARCHAR(128),                           -- Chức danh: Trưởng nhóm kinh doanh, Chuyên viên
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,     -- Phòng ban chính
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_user_dept UNIQUE(user_id, department_id)
);

CREATE UNIQUE INDEX uq_user_primary_dept ON user_department_memberships(user_id) WHERE is_primary;

CREATE INDEX idx_user_dept_user ON user_department_memberships(user_id);
CREATE INDEX idx_user_dept_tenant ON user_department_memberships(tenant_id);
CREATE INDEX idx_user_dept_branch ON user_department_memberships(branch_id);
CREATE INDEX idx_user_dept_dept ON user_department_memberships(department_id);
CREATE INDEX idx_user_dept_manager ON user_department_memberships(direct_manager_user_id);
```

> **Backfill dữ liệu hiện hữu (TASK-275)**: Với mọi tenant/user đã tồn tại trước Sprint 02, migration `V2.0.1` tạo một branch mặc định (`is_default = TRUE`) và department mặc định (`code = 'DEFAULT'`), sau đó tạo membership chính (`is_primary = TRUE`) trỏ về cặp branch/department này nếu user chưa có membership — nhờ đó partial unique index `uq_user_primary_dept` không bị vi phạm khi áp dụng.

> **Ghi chú (BR-RBAC-11, TASK-288)**: `departments.manager_user_id` được **auto-sync** thành membership của trưởng bộ phận (tạo/cập nhật `user_department_memberships` tương ứng) để đảm bảo một nguồn scope thống nhất; `manager_user_id` không được dùng như nguồn tính scope độc lập.

### 3.4. Bảng `user_branch_assignments` (Phân Công Quản Lý Chi Nhánh)
Bảng tách biệt khái niệm **Chi nhánh được quản lý** (`managed_branch_ids`) khỏi **Chi nhánh thành viên** (từ membership), phục vụ mô hình Giám đốc vùng phụ trách nhiều Chi nhánh mà không cần membership giả (BUG-71, TASK-287):

```sql
CREATE TABLE user_branch_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    can_manage BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_user_branch UNIQUE(user_id, branch_id)
);
CREATE UNIQUE INDEX uq_user_primary_branch ON user_branch_assignments(user_id) WHERE is_primary;
CREATE INDEX idx_user_branch_tenant ON user_branch_assignments(tenant_id);
CREATE INDEX idx_user_branch_branch ON user_branch_assignments(branch_id);
```

> **Quy tắc**: partial unique index `uq_user_primary_branch` đảm bảo mỗi user tối đa **một** `primary_branch` (BR-RBAC-09) — dùng làm Chi nhánh mặc định khi CREATE. `effective_branch_ids = member_branch_ids ∪ managed_branch_ids` (BR-RBAC-08). Composite FK `(branch_id, tenant_id)` chống ghép cặp sai tenant tại §3.5.

### 3.5. Ràng Buộc Toàn Vẹn Chéo Tenant (Cross-Tenant Integrity) (BUG-66)
Để phòng thủ chiều sâu ở tầng CSDL (ngoài RLS và Enforcement Engine), bổ sung khóa phụ `(id, tenant_id)` và composite FK chống ghép cặp dữ liệu sai tenant:

```sql
-- 1) Khóa phụ (id, tenant_id) làm đích cho composite FK
ALTER TABLE branches    ADD CONSTRAINT uq_branches_id_tenant    UNIQUE (id, tenant_id);
ALTER TABLE departments ADD CONSTRAINT uq_departments_id_tenant UNIQUE (id, tenant_id);
ALTER TABLE roles       ADD CONSTRAINT uq_roles_id_tenant       UNIQUE (id, tenant_id);

-- 2) Membership không thể trỏ branch/department của tenant khác
ALTER TABLE user_department_memberships
    ADD CONSTRAINT fk_membership_branch_tenant
        FOREIGN KEY (branch_id, tenant_id) REFERENCES branches(id, tenant_id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_membership_department_tenant
        FOREIGN KEY (department_id, tenant_id) REFERENCES departments(id, tenant_id) ON DELETE CASCADE;

-- 3) user_roles không thể gán role của tenant khác
ALTER TABLE user_roles
    ADD CONSTRAINT fk_user_roles_role_tenant
        FOREIGN KEY (role_id, tenant_id) REFERENCES roles(id, tenant_id) ON DELETE CASCADE;

-- 4) role_data_policies không thể cấu hình role của tenant khác
ALTER TABLE role_data_policies
    ADD CONSTRAINT fk_role_data_policies_role_tenant
        FOREIGN KEY (role_id, tenant_id) REFERENCES roles(id, tenant_id) ON DELETE CASCADE;

-- 5) user_branch_assignments không thể phân công branch của tenant khác
ALTER TABLE user_branch_assignments
    ADD CONSTRAINT fk_user_branch_assignments_branch_tenant
        FOREIGN KEY (branch_id, tenant_id) REFERENCES branches(id, tenant_id) ON DELETE CASCADE;

-- 6) membership.branch_id phải khớp departments.branch_id khi department có gán branch (BR-RBAC-10).
--    CHECK constraint không thể tham chiếu bảng khác → bắt buộc enforce bằng trigger:
CREATE OR REPLACE FUNCTION trg_fn_check_membership_branch_matches_dept()
RETURNS TRIGGER AS $$
DECLARE dept_branch UUID;
BEGIN
    SELECT branch_id INTO dept_branch FROM departments WHERE id = NEW.department_id;
    IF dept_branch IS NOT NULL AND dept_branch <> NEW.branch_id THEN
        RAISE EXCEPTION 'MEMBERSHIP_BRANCH_MISMATCH_DEPARTMENT';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_membership_branch_match
BEFORE INSERT OR UPDATE ON user_department_memberships
FOR EACH ROW EXECUTE FUNCTION trg_fn_check_membership_branch_matches_dept();
```

Các composite FK này là ràng buộc bảo mật bắt buộc; các FK đơn cũ (`branch_id`, `department_id`, `role_id`) có thể giữ để tương thích ORM nhưng không thay thế được composite FK.

> **Ghi chú (BUG-71, TASK-287)**: Sau bổ sung Quản lý đa chi nhánh, CSDL Sprint 02 gồm **12 bảng mới**: `platform_super_admins`, `platform_impersonation_logs`, `platform_audit_logs`, `branches`, `departments`, `user_department_memberships`, `user_branch_assignments`, `permissions`, `roles`, `role_permissions`, `user_roles`, `role_data_policies` (bảng `core_sample_records` của FEAT-17 là reference entity, không tính vào nhóm cấu trúc IAM/Platform).

---

## 4. Chi Tiết Các Bảng Phân Quyền Chức Năng & Dữ Liệu (IAM Layer)

### 4.1. Bảng `permissions` (Danh Mục Quyền Chức Năng Hệ Thống)
```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) UNIQUE NOT NULL,             -- domain:resource:action (core:user:create, sales:order:read)
    domain VARCHAR(32) NOT NULL,                  -- core, sales, accounting, inventory
    resource VARCHAR(32) NOT NULL,                -- user, role, branch, order, invoice
    action VARCHAR(32) NOT NULL,                  -- create, read, update, delete, export, share, approve
    description_key VARCHAR(128) NOT NULL,        -- Mã i18n: PERM_CORE_USER_CREATE_DESC
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_permissions_domain ON permissions(domain);
CREATE INDEX idx_permissions_resource ON permissions(resource);
```

### 4.2. Bảng `roles` (Vai Trò Người Dùng Trong Tenant)
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL nếu là Vai trò hệ thống mẫu toàn cục
    code VARCHAR(64) NOT NULL,                    -- TENANT_OWNER, TENANT_ADMIN, SALES_MANAGER, ACCOUNTANT
    name VARCHAR(128) NOT NULL,                   -- Tên hiển thị: Giám đốc kinh doanh
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,     -- TRUE: Không được xóa/sửa code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_tenant_role_code UNIQUE(tenant_id, code)
);

-- Vai trò hệ thống (tenant_id IS NULL) không bị chặn trùng bởi UNIQUE(tenant_id, code) do NULL không so sánh bằng,
-- nên cần partial unique index để đảm bảo mỗi code hệ thống chỉ tồn tại một lần (BUG-66).
CREATE UNIQUE INDEX uq_roles_system_code ON roles(code) WHERE tenant_id IS NULL;

CREATE INDEX idx_roles_tenant ON roles(tenant_id);
CREATE INDEX idx_roles_system ON roles(is_system);
```

### 4.3. Bảng `role_permissions` (Liên Kết Quyền Chức Năng Của Vai Trò)
```sql
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(role_id, permission_id)
);
```

### 4.4. Bảng `user_roles` (Gán Vai Trò Cho Người Dùng Trong Tenant)
```sql
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY(user_id, tenant_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_tenant ON user_roles(tenant_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
```

### 4.5. Bảng `role_data_policies` (Ma Trận Phạm Vi Dữ Liệu & 6 Thao Tác)
```sql
CREATE TABLE role_data_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    resource VARCHAR(64) NOT NULL,                -- SALE_ORDER, CUSTOMER, INVOICE, EMPLOYEE
    create_scope VARCHAR(32) NOT NULL DEFAULT 'OWN_ONLY',
    read_scope VARCHAR(32) NOT NULL DEFAULT 'OWN_ONLY',
    update_scope VARCHAR(32) NOT NULL DEFAULT 'OWN_ONLY',
    delete_scope VARCHAR(32) NOT NULL DEFAULT 'NONE',
    export_scope VARCHAR(32) NOT NULL DEFAULT 'NONE',
    share_scope VARCHAR(32) NOT NULL DEFAULT 'NONE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_role_resource_policy UNIQUE(role_id, resource),
    CONSTRAINT chk_data_scopes CHECK (
        create_scope IN ('ALL', 'BRANCH', 'DEPARTMENT_AND_CHILDREN', 'DEPARTMENT', 'OWN_AND_SUBORDINATES', 'OWN_ONLY', 'NONE') AND
        read_scope IN ('ALL', 'BRANCH', 'DEPARTMENT_AND_CHILDREN', 'DEPARTMENT', 'OWN_AND_SUBORDINATES', 'OWN_ONLY', 'NONE') AND
        update_scope IN ('ALL', 'BRANCH', 'DEPARTMENT_AND_CHILDREN', 'DEPARTMENT', 'OWN_AND_SUBORDINATES', 'OWN_ONLY', 'NONE') AND
        delete_scope IN ('ALL', 'BRANCH', 'DEPARTMENT_AND_CHILDREN', 'DEPARTMENT', 'OWN_AND_SUBORDINATES', 'OWN_ONLY', 'NONE') AND
        export_scope IN ('ALL', 'BRANCH', 'DEPARTMENT_AND_CHILDREN', 'DEPARTMENT', 'OWN_AND_SUBORDINATES', 'OWN_ONLY', 'NONE') AND
        share_scope IN ('ALL', 'BRANCH', 'DEPARTMENT_AND_CHILDREN', 'DEPARTMENT', 'OWN_AND_SUBORDINATES', 'OWN_ONLY', 'NONE')
    )
);

CREATE INDEX idx_role_data_policies_tenant ON role_data_policies(tenant_id);
CREATE INDEX idx_role_data_policies_role ON role_data_policies(role_id);
CREATE INDEX idx_role_data_policies_resource ON role_data_policies(resource);
```

> **Ghi chú (BUG-50)**: Cột `custom_conditions JSONB` đã được **loại bỏ** khỏi thiết kế Sprint 02. Các scope `ABAC` / `CUSTOM` (điều kiện động, biểu thức tùy biến) **thuộc Out-of-Scope Sprint 02**; hệ thống chỉ hỗ trợ đúng 7 giá trị `DataScope` chuẩn.

---

## 5. Kế Hoạch Migration (Flyway) (TASK-275)

| Version | File | Nội dung |
| :--- | :--- | :--- |
| `V2.0.0` | `V2.0.0__superadmin_rbac_schema.sql` | Tạo toàn bộ schema Sprint 02: cột mở rộng `tenants`, `platform_super_admins`, `platform_impersonation_logs`, `platform_audit_logs` + trigger immutable, `branches`, `departments`, `user_department_memberships`, `user_branch_assignments` (partial unique primary + index + trigger branch-dept, TASK-287), `permissions`, `roles`, `role_permissions`, `user_roles`, `role_data_policies`, `core_sample_records`; seed idempotent `permissions` (TASK-268) và roles hệ thống mẫu (`TENANT_OWNER`, `TENANT_ADMIN`, `GENERAL_MANAGER`). |
| `V2.0.1` | `V2.0.1__backfill_existing_tenants.sql` | Backfill dữ liệu tenant/user hiện hữu: tạo branch mặc định (`is_default = TRUE`) + department mặc định (`code = 'DEFAULT'`), gán membership chính (`is_primary = TRUE`) và ánh xạ role cũ sang `user_roles` mới (TASK-275). Bắt buộc **idempotent** để chạy lại an toàn. |

**Nguyên tắc migration**:
- Không xóa/đổi tên cột dữ liệu đang dùng; chỉ `ADD COLUMN IF NOT EXISTS` và `CREATE ... IF NOT EXISTS`.
- Seed dùng `INSERT ... ON CONFLICT DO NOTHING`.
- Migration chạy trên PostgreSQL thật (không H2), đúng chính sách môi trường dev `make infra`.
