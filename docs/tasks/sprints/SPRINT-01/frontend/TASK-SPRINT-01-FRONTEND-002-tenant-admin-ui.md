# TASK-SPRINT-01-FRONTEND-002: Angular Web — Tenant Admin Dashboard và User Management UI

## Thông tin

| Thuộc tính       | Giá trị                                                                            |
|------------------|------------------------------------------------------------------------------------|
| Task ID          | TASK-SPRINT-01-FRONTEND-002                                                        |
| Sprint           | Sprint 01                                                                          |
| Cluster          | frontend                                                                           |
| Loại             | Frontend                                                                           |
| Người phụ trách  | Frontend                                                                           |
| Story Points     | 8                                                                                  |
| Trạng thái       | ⬜ TODO                                                                            |
| Phụ thuộc        | TASK-SPRINT-01-FRONTEND-001, TASK-SPRINT-01-USER-001, TASK-SPRINT-01-TENANT-001    |

## Mô tả

Xây dựng Shell Layout chính của ứng dụng (sidebar + header) và các trang quản trị cho Tenant Admin: quản lý thông tin tenant, quản lý người dùng (danh sách, tạo/sửa/xoá, khoá), quản lý phòng ban (cây phòng ban), và quản lý roles/permissions.

## Phạm vi kỹ thuật

### Frontend Web (Angular 18 — `open-erp-web`)

**Cấu trúc Shell:**
```
src/app/
├── layout/
│   ├── shell/
│   │   ├── shell.component.ts           ← Layout wrapper (sidebar + header + content)
│   │   ├── shell.component.html
│   │   └── shell.component.scss
│   ├── sidebar/
│   │   ├── sidebar.component.ts         ← Navigation menu
│   │   ├── sidebar.component.html
│   │   └── sidebar.component.scss
│   └── header/
│       ├── header.component.ts          ← User avatar, tenant name, notifications
│       ├── header.component.html
│       └── header.component.scss
└── features/
    ├── dashboard/
    │   ├── dashboard.routes.ts
    │   └── home/
    │       ├── home.component.ts        ← Placeholder dashboard
    │       └── home.component.html
    ├── system-admin/
    │   ├── system-admin.routes.ts
    │   ├── tenant-settings/
    │   │   ├── tenant-settings.component.ts
    │   │   └── tenant-settings.component.html
    │   ├── users/
    │   │   ├── user-list/
    │   │   │   ├── user-list.component.ts
    │   │   │   └── user-list.component.html
    │   │   ├── user-form/
    │   │   │   ├── user-form.component.ts    ← Create/Edit modal
    │   │   │   └── user-form.component.html
    │   │   └── user.service.ts               ← API calls
    │   ├── departments/
    │   │   ├── department-tree/
    │   │   │   ├── department-tree.component.ts
    │   │   │   └── department-tree.component.html
    │   │   └── department.service.ts
    │   └── roles/
    │       ├── role-list/
    │       │   ├── role-list.component.ts
    │       │   └── role-list.component.html
    │       └── role.service.ts
```

**ShellComponent:**
- Sidebar cố định bên trái (collapsible trên mobile)
- Header trên cùng: logo tenant, breadcrumb, bell (notifications), avatar + dropdown menu
- Content area (router-outlet)
- Sidebar navigation items được generate từ `enabledModules` của tenant settings

**Sidebar Navigation Structure:**
```
📊 Dashboard
👥 Quản trị hệ thống
  └── 👤 Người dùng
  └── 🏢 Phòng ban
  └── 🔐 Phân quyền
  └── ⚙️ Cài đặt công ty
🧑‍💼 Nhân sự (HR)     [nếu module được bật]
💼 Kinh doanh         [nếu module được bật]
📦 Kho hàng          [nếu module được bật]
💰 Kế toán           [nếu module được bật]
```

**UserListComponent — tính năng:**
- Bảng danh sách users với columns: Avatar, Tên, Email, Phòng ban, Vai trò, Trạng thái, Ngày tạo, Actions
- Phân trang (page size: 20, 50, 100)
- Tìm kiếm realtime (debounce 300ms) theo tên, email
- Bộ lọc: phòng ban, trạng thái (dropdown filter)
- Toggle trạng thái active/inactive (inline)
- Nút "Thêm người dùng" → mở modal form
- Nút Edit → mở modal form với data điền sẵn
- Nút Delete → confirm dialog → xoá mềm
- Bulk actions: chọn nhiều → xoá, khoá

**UserFormComponent (Modal Dialog):**
- Reactive form với fields: Họ tên, Email, Mật khẩu (chỉ khi tạo mới), Phòng ban (dropdown), Chức danh, Điện thoại, Trạng thái
- Validation inline
- Avatar upload preview
- Assign roles (multi-select dropdown)
- Đóng/lưu với loading state
- Không đóng modal khi đang save (prevent accidental close)

**DepartmentTreeComponent:**
- Cây phòng ban visualize bằng Angular CDK Tree hoặc thư viện `@angular/cdk/tree`
- Expand/collapse nút
- Drag & drop để di chuyển phòng ban (thay đổi `parentId`)
- Inline add/edit tên phòng ban
- Hiển thị headcount
- Context menu (right-click): thêm con, sửa, xoá

**TenantSettingsComponent:**
- Tabs: Thông tin công ty | Bảo mật | Giao diện | Modules
- Tab Thông tin: tên công ty, địa chỉ, mã số thuế, upload logo
- Tab Bảo mật: bắt buộc MFA, timeout session
- Tab Giao diện: màu chủ đạo (color picker), tên hiển thị
- Tab Modules: bật/tắt modules (enable/disable toggles)
- Save button với loading state và toast thành công/thất bại

**RoleListComponent:**
- Danh sách roles của tenant
- Expand role → hiển thị danh sách permissions (checkbox grid theo resource/action)
- Tạo role mới / xoá role custom (không xoá system roles)
- Assign role → mở modal chọn users

**Shared Components cần tạo:**
```
src/app/shared/
├── components/
│   ├── data-table/          ← Generic paginated table
│   ├── confirm-dialog/      ← Confirm modal
│   ├── form-field-error/    ← Error display
│   ├── avatar/              ← Avatar with fallback initials
│   └── status-badge/        ← Colored status chip
├── pipes/
│   ├── relative-time.pipe.ts    ← "3 phút trước"
│   └── file-size.pipe.ts        ← "1.5 MB"
└── directives/
    └── has-permission.directive.ts  ← *hasPermission="'users:update'"
```

## API Endpoints sử dụng

| API                                     | Component sử dụng         |
|-----------------------------------------|---------------------------|
| `GET /api/v1/tenants/me`                | ShellComponent (tenant info) |
| `GET /api/v1/tenants/me/settings`       | TenantSettingsComponent   |
| `PATCH /api/v1/tenants/me/settings`     | TenantSettingsComponent   |
| `GET /api/v1/users`                     | UserListComponent         |
| `POST /api/v1/users`                    | UserFormComponent         |
| `PATCH /api/v1/users/:id`               | UserFormComponent         |
| `DELETE /api/v1/users/:id`              | UserListComponent         |
| `PATCH /api/v1/users/:id/status`        | UserListComponent (toggle) |
| `POST /api/v1/users/:id/avatar`         | UserFormComponent         |
| `GET /api/v1/departments/tree`          | DepartmentTreeComponent   |
| `POST /api/v1/departments`              | DepartmentTreeComponent   |
| `PATCH /api/v1/departments/:id`         | DepartmentTreeComponent   |
| `DELETE /api/v1/departments/:id`        | DepartmentTreeComponent   |
| `GET /api/v1/roles`                     | RoleListComponent         |
| `POST /api/v1/roles`                    | RoleListComponent         |
| `PATCH /api/v1/roles/:id`               | RoleListComponent         |

## Acceptance Criteria

- [ ] Shell layout render đúng (sidebar + header + router-outlet)
- [ ] Sidebar hiển thị đúng modules theo `enabledModules` của tenant
- [ ] UserList: phân trang, tìm kiếm, bộ lọc hoạt động
- [ ] Tạo user mới → modal, submit → user xuất hiện trong danh sách
- [ ] Sửa user → modal điền sẵn data, cập nhật thành công
- [ ] Xoá user → confirm dialog → xoá mềm, remove khỏi list
- [ ] Toggle status user → cập nhật ngay inline
- [ ] Department tree render đúng cấu trúc cây
- [ ] Drag & drop phòng ban thay đổi parentId
- [ ] Tenant settings save thành công → toast notification
- [ ] Upload logo tenant → preview + lưu URL
- [ ] Roles list → expand permissions → checkbox state phản ánh DB
- [ ] HasPermission directive ẩn/hiện element đúng theo quyền user
- [ ] Shell và các trang quản trị hỗ trợ đầy đủ Light Mode và Dark Mode theo Design System tokens
- [ ] Dark mode tự áp dụng theo `prefers-color-scheme` và cho phép người dùng chuyển thủ công bằng toggle theme
- [ ] Preference giao diện được lưu bằng key `openErp.colorMode` trong localStorage
- [ ] Khi khởi động app, mode đã lưu được áp dụng trước lần render đầu tiên để tránh flash/sai màu ban đầu
- [ ] Toggle theme dùng lại component dùng chung (ví dụ `erp-theme-toggle` hoặc tương đương trong shared UI)
- [ ] Unit test coverage ≥ 80%
- [ ] Có test (unit/integration hoặc e2e) xác nhận hiển thị và chuyển đổi đúng ở cả Light Mode và Dark Mode
- [ ] Responsive trên tablet (768px) và desktop (1280px+)

## Ghi chú kỹ thuật

- Angular Material `MatTableModule`, `MatPaginatorModule`, `MatSortModule` cho data table.
- Angular Material `MatTreeModule` hoặc `@angular/cdk/tree` cho department tree.
- `MatDialog` cho modal forms.
- `MatSnackBar` cho toast notifications.
- Color picker: `ngx-color-picker` hoặc tự implement đơn giản.
- State management: Angular Signals (`signal`, `computed`) thay vì NgRx (đơn giản hơn cho giai đoạn này).
- Lazy loading: mỗi feature module lazy loaded để giảm initial bundle size.
- `HasPermissionDirective` sử dụng `RBAC Service` qua `AuthService.hasPermission(resource, action)`.
- Avatar upload: drag & drop file hoặc click-to-upload, preview trước khi submit.
