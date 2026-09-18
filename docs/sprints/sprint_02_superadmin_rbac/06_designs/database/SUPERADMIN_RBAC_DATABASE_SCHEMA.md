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
```

### 2.4. Bảng `platform_audit_logs` (Nhật Ký Kiểm Toán Bất Biến Nền Tảng)
```sql
CREATE TABLE platform_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(64) NOT NULL,                  -- TENANT_SUSPEND, TENANT_QUOTA_UPDATE, USER_GLOBAL_LOCK...
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

CREATE INDEX idx_user_dept_user ON user_department_memberships(user_id);
CREATE INDEX idx_user_dept_tenant ON user_department_memberships(tenant_id);
CREATE INDEX idx_user_dept_branch ON user_department_memberships(branch_id);
CREATE INDEX idx_user_dept_dept ON user_department_memberships(department_id);
CREATE INDEX idx_user_dept_manager ON user_department_memberships(direct_manager_user_id);
```

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
    custom_conditions JSONB,                      -- Biểu thức điều kiện động bổ sung
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
