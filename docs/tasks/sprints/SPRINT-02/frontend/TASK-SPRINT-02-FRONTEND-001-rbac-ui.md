# TASK-SPRINT-02-FRONTEND-001: Angular Web — RBAC UI Nâng cao

## Thông tin

| Thuộc tính       | Giá trị                                                              |
|------------------|----------------------------------------------------------------------|
| Task ID          | TASK-SPRINT-02-FRONTEND-001                                          |
| Sprint           | Sprint 02                                                            |
| Cluster          | frontend                                                             |
| Loại             | Frontend                                                             |
| Người phụ trách  | Frontend                                                             |
| Story Points     | 8                                                                    |
| Trạng thái       | ⬜ TODO                                                              |
| Phụ thuộc        | TASK-SPRINT-01-FRONTEND-002, TASK-SPRINT-02-SYSTEM_ADMIN-001         |

## Mô tả

Xây dựng giao diện quản lý phân quyền nâng cao cho Angular Web App. Bao gồm: Role Builder với permission matrix đầy đủ (data-level, field-level, workflow permissions), giao diện gán role cho users (drag & drop), tính năng xem trước quyền hạn (simulate as user), và tích hợp CASL ở frontend để ẩn/hiện UI elements theo quyền.

## Phạm vi kỹ thuật

### Frontend Web (Angular 18 — `open-erp-web`)

**Cấu trúc module:**
```
src/app/features/system-admin/rbac/
├── rbac.routes.ts
├── role-builder/
│   ├── role-builder.component.ts
│   ├── role-builder.component.html
│   ├── role-builder.component.scss
│   └── components/
│       ├── permission-matrix/
│       │   ├── permission-matrix.component.ts    ← Checkbox grid
│       │   └── permission-matrix.component.html
│       ├── data-permission-rules/
│       │   ├── data-permission-rules.component.ts
│       │   └── data-permission-rules.component.html
│       └── workflow-permissions/
│           ├── workflow-permissions.component.ts
│           └── workflow-permissions.component.html
├── user-role-assignment/
│   ├── user-role-assignment.component.ts        ← Drag & drop
│   └── user-role-assignment.component.html
└── permission-preview/
    ├── permission-preview.component.ts          ← Simulate as user
    └── permission-preview.component.html
```

**Permission Matrix Component:**
```
Giao diện dạng bảng 2 chiều:

                  | Create | Read | Update | Delete | Approve |
Users             |  [x]   | [x]  |  [x]   |  [ ]   |   N/A   |
  Scope:          |        | All▼ |  Own▼  |        |         |
Orders            |  [x]   | [x]  |  [ ]   |  [ ]   |  [x]   |
  Scope:          |        |Dept▼ |        |        | Dept▼   |
  Max Amount:     |        |      |        |        | 100M    |
Invoices          |  [ ]   | [x]  |  [ ]   |  [ ]   |  [ ]   |
Leave Requests    |  [x]   | [x]  |  [ ]   |  [ ]   |  [x]   |
...

Rows = resources (grouped by module)
Columns = actions
Cell = checkbox + scope dropdown (own/department/all)
```

**Role Builder — tính năng:**
- Tên role + mô tả (editable)
- 3 tabs: Permissions | Data Rules | Workflow Permissions
- Tab Permissions: permission matrix checkbox grid (grouped by module)
- Tab Data Rules: per-resource rules (conditions, scope)
  - Dropdown: "Chỉ xem dữ liệu của phòng ban mình / Toàn bộ"
  - Hidden fields: multi-select danh sách fields nhạy cảm
- Tab Workflow: per-resource workflow actions
  - Checkbox: submit/approve/reject
  - Number input: max amount (cho purchase-orders)
- Save button + Cancel
- "Duplicate role" từ role có sẵn
- Preview trực tiếp khi checkbox thay đổi

**User Role Assignment (Drag & Drop):**
```
Giao diện 2 cột:
Left:  [Search users...      ]
       [User danh sách]
       - Avatar | Tên | Email | Current Roles

Right: [Role 1: MANAGER        ]
       Drag users vào đây để gán role

Kéo user từ left → phải để gán role
Click nút X để thu hồi role
```

**Permission Preview (Simulate as User):**
```
1. Chọn user cần simulate
2. Hệ thống lấy CASL ability của user đó
3. Render preview UI: 
   - Danh sách resources
   - Với mỗi resource: check từng action
   - Hiển thị: ✅ Được phép | ❌ Không được | ⚠️ Có điều kiện
4. Simulate link: có thể click vào trang bất kỳ và xem UI như user đó
```

**CASL Integration Frontend:**
```typescript
// Cài đặt @casl/angular @casl/ability
// npm install @casl/angular @casl/ability

// ability.service.ts
@Injectable({ providedIn: 'root' })
export class AbilityService {
  private ability = new Ability<[Action, Subject]>();
  ability$ = toSignal(this.authService.user$.pipe(
    switchMap(user => this.loadAbility(user)),
  ));
  
  async loadAbility(user: User): Promise<void> {
    const rules = await this.rbacApi.getMyAbility();
    this.ability.update(rules);
  }
  
  can(action: Action, subject: Subject): boolean {
    return this.ability.can(action, subject);
  }
}

// Sử dụng trong template với directive
// <button *appCan="'create'; subject: 'Order'">Tạo đơn hàng</button>
// <mat-menu-item *appCan="'approve'; subject: 'LeaveRequest'">Duyệt</mat-menu-item>
```

**AppCan Directive:**
```typescript
@Directive({ selector: '[appCan]', standalone: true })
export class AppCanDirective {
  @Input('appCan') action!: string;
  @Input('appCanSubject') subject!: string;
  
  constructor(
    private viewContainer: ViewContainerRef,
    private templateRef: TemplateRef<unknown>,
    private abilityService: AbilityService,
  ) {}
  
  ngOnInit() {
    if (this.abilityService.can(this.action as Action, this.subject)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
```

## API Endpoints sử dụng

| API                                             | Component sử dụng          |
|-------------------------------------------------|----------------------------|
| `GET /api/v1/permissions`                       | PermissionMatrixComponent  |
| `GET /api/v1/roles`                             | RoleBuilderComponent       |
| `POST /api/v1/roles`                            | RoleBuilderComponent       |
| `PATCH /api/v1/roles/:id`                       | RoleBuilderComponent       |
| `PATCH /api/v1/roles/:id/data-permissions`      | DataPermissionRulesComponent |
| `PATCH /api/v1/roles/:id/workflow-permissions`  | WorkflowPermissionsComponent |
| `GET /api/v1/users`                             | UserRoleAssignmentComponent |
| `POST /api/v1/users/:id/roles`                  | UserRoleAssignmentComponent |
| `DELETE /api/v1/users/:id/roles/:roleId`        | UserRoleAssignmentComponent |
| `POST /api/v1/permission-check/ability`         | PermissionPreviewComponent  |
| `GET /api/v1/users/me/ability`                  | AbilityService (CASL)       |

## Acceptance Criteria

- [ ] Permission matrix hiển thị đúng tất cả resources và actions
- [ ] Checkbox state phản ánh đúng permissions trong DB
- [ ] Save role → tất cả permissions được cập nhật
- [ ] Data rule: chọn scope "phòng ban mình" → lưu đúng conditions
- [ ] Workflow permission: nhập max amount → lưu đúng
- [ ] User role assignment: drag & drop hoạt động
- [ ] Remove role: click X → confirm → role bị thu hồi
- [ ] Permission preview: simulate user đúng (dùng user khác để test)
- [ ] `*appCan` directive: ẩn button "Tạo đơn hàng" với user không có quyền
- [ ] CASL reload khi user permissions thay đổi
- [ ] Unit test coverage ≥ 80%
- [ ] Responsive trên desktop (1280px+)

## Ghi chú kỹ thuật

- Angular CDK DragDrop (`@angular/cdk/drag-drop`) cho user role assignment.
- `@casl/angular` package tích hợp CASL với Angular — dùng `AblePurePipe` hoặc directive custom.
- Permission matrix có thể có 100+ rows × 5+ columns → virtual scroll cho performance.
- Debounce 500ms khi save permissions (tránh gửi quá nhiều request khi check/uncheck nhanh).
- Snapshot permissions trước khi edit, so sánh khi save để chỉ gửi diff.
- Permission preview dùng iframe với user token giả hoặc query với userId param.
