# TASK-SPRINT-02-SYSTEM_ADMIN-005: Org Chart Nâng cao — Cơ cấu tổ chức

## Thông tin

| Thuộc tính      | Giá trị                         |
| --------------- | ------------------------------- |
| Task ID         | TASK-SPRINT-02-SYSTEM_ADMIN-005 |
| Sprint          | Sprint 02                       |
| Cluster         | system-admin                    |
| Loại            | Backend                         |
| Người phụ trách | Backend                         |
| Story Points    | 3                               |
| Trạng thái      | ⬜ TODO                         |
| Phụ thuộc       | TASK-SPRINT-01-USER-001         |

## Mô tả

Nâng cấp cấu trúc tổ chức từ cây phòng ban đơn giản (Sprint 01) thành Org Chart đầy đủ với: vị trí/chức danh (positions), gán quản lý, theo dõi biên chế (headcount), và xuất dữ liệu Org Chart dạng JSON cho frontend visualization.

## Phạm vi kỹ thuật

### Backend (NestJS — `user-service`, nâng cấp)

**Cấu trúc bổ sung:**

```
src/
├── org-chart/
│   ├── org-chart.controller.ts
│   └── org-chart.service.ts
└── positions/
    ├── positions.controller.ts
    ├── positions.service.ts
    └── schemas/
        └── position.schema.ts
```

**Position/Title Management:**

```typescript
interface Position {
  tenantId: ObjectId;
  code: string; // 'CEO', 'DEV_LEAD', 'ACCOUNTANT'
  name: string; // 'Giám đốc điều hành', 'Trưởng nhóm dev'
  level: number; // Cấp bậc: 1 (cao nhất) - 10 (thấp nhất)
  departmentId?: ObjectId; // Vị trí thường gắn với phòng ban nào
  maxHeadcount?: number; // Số lượng vị trí này tối đa
  currentHeadcount: number; // Số người đang giữ vị trí này
  description?: string;
  responsibilities?: string[]; // Danh sách trách nhiệm
  isActive: boolean;
}
```

**Org Chart Node:**

```typescript
interface OrgChartNode {
  id: string; // departmentId hoặc userId
  type: "department" | "person";
  name: string;
  title?: string; // Position title
  avatarUrl?: string;
  email?: string;
  parentId: string | null;
  children: OrgChartNode[]; // Nested children
  meta: {
    headcount?: number;
    level?: number;
    positionCode?: string;
  };
}
```

**Org Chart Service:**

```typescript
@Injectable()
export class OrgChartService {
  // Lấy toàn bộ org chart của tenant
  async getOrgChart(tenantId: string): Promise<OrgChartNode[]>;

  // Lấy org chart từ một department xuống
  async getDepartmentSubtree(
    tenantId: string,
    departmentId: string,
  ): Promise<OrgChartNode>;

  // Cập nhật manager của user
  async assignManager(
    tenantId: string,
    userId: string,
    managerId: string,
  ): Promise<void>;

  // Cập nhật position của user
  async assignPosition(
    tenantId: string,
    userId: string,
    positionId: string,
  ): Promise<void>;

  // Lấy reporting chain (chain of command từ user lên CEO)
  async getReportingChain(
    tenantId: string,
    userId: string,
  ): Promise<UserSummary[]>;

  // Cập nhật headcount tự động
  async recalculateHeadcount(
    tenantId: string,
    departmentId: string,
  ): Promise<void>;
}
```

**Headcount Tracking:**

```typescript
// Tự động cập nhật headcount khi:
// - User được thêm/xoá khỏi department
// - User status thay đổi (ACTIVE/INACTIVE)
// Subscribe: user.created, user.updated, user.deleted
@EventPattern('user.created')
@EventPattern('user.updated')
@EventPattern('user.deleted')
async recalculateHeadcount(event: UserEvent) {
  if (event.payload.departmentId) {
    await this.orgChartService.recalculateHeadcount(
      event.tenantId,
      event.payload.departmentId
    );
  }
}
```

### Database (MongoDB)

**Cập nhật collection `departments`** — thêm fields:

| Trường            | Kiểu   | Mô tả                                       |
| ----------------- | ------ | ------------------------------------------- |
| `type`            | string | Loại phòng ban (từ catalog department_type) |
| `budget`          | number | Ngân sách phòng ban (VNĐ)                   |
| `targetHeadcount` | number | Biên chế kế hoạch                           |
| `headcount`       | number | Biên chế thực tế (auto-calculate)           |
| `establishedDate` | Date   | Ngày thành lập                              |
| `description`     | string | Mô tả nhiệm vụ phòng ban                    |

**Collection: `positions`** (tenantId-scoped)

| Trường             | Kiểu     | Ràng buộc      | Mô tả              |
| ------------------ | -------- | -------------- | ------------------ |
| `_id`              | ObjectId | —              | Primary key        |
| `tenantId`         | ObjectId | required       | Tenant             |
| `code`             | string   | required       | Mã chức danh       |
| `name`             | string   | required       | Tên chức danh      |
| `level`            | number   | 1-10, required | Cấp bậc            |
| `departmentId`     | ObjectId | optional       | Phòng ban mặc định |
| `maxHeadcount`     | number   | optional       | Biên chế tối đa    |
| `currentHeadcount` | number   | auto           | Số người đang giữ  |
| `description`      | string   | optional       | Mô tả              |
| `isActive`         | boolean  | default: true  | —                  |
| `isDeleted`        | boolean  | default: false | Soft delete        |
| `createdAt`        | Date     | auto           | —                  |

**Indexes:**

```
{ tenantId: 1, code: 1 }        — unique
{ tenantId: 1, level: 1 }
{ tenantId: 1, departmentId: 1 }
```

## API Endpoints

| Method | Path                                   | Mô tả                                 | Auth         |
| ------ | -------------------------------------- | ------------------------------------- | ------------ |
| GET    | `/api/v1/org-chart`                    | Toàn bộ org chart (tree JSON)         | Any user     |
| GET    | `/api/v1/org-chart/departments/:id`    | Org chart từ department xuống         | Any user     |
| GET    | `/api/v1/users/:id/reporting-chain`    | Chuỗi báo cáo lên trên                | Any user     |
| GET    | `/api/v1/departments/:id/members`      | Thành viên trực tiếp trong department | Any user     |
| GET    | `/api/v1/departments/:id/members/all`  | Tất cả thành viên (bao gồm sub-dept)  | Any user     |
| PATCH  | `/api/v1/users/:id/manager`            | Gán manager cho user                  | Tenant Admin |
| PATCH  | `/api/v1/users/:id/position`           | Gán chức danh cho user                | Tenant Admin |
| GET    | `/api/v1/positions`                    | Danh sách chức danh                   | Tenant Admin |
| POST   | `/api/v1/positions`                    | Tạo chức danh mới                     | Tenant Admin |
| PATCH  | `/api/v1/positions/:id`                | Cập nhật chức danh                    | Tenant Admin |
| DELETE | `/api/v1/positions/:id`                | Xoá chức danh                         | Tenant Admin |
| GET    | `/api/v1/departments/headcount-report` | Báo cáo biên chế toàn bộ              | Tenant Admin |

## Acceptance Criteria

- [ ] Org Chart API trả về tree JSON đầy đủ (department + users)
- [ ] Gán manager → reporting chain được cập nhật
- [ ] Gán position → currentHeadcount của position tăng lên
- [ ] Headcount tự động cập nhật khi user thay đổi department
- [ ] Sub-tree query: chỉ trả về department con và users trong đó
- [ ] Reporting chain: trả về đúng chain từ user → CEO
- [ ] Headcount report: tất cả departments với actual vs target headcount
- [ ] Unit test coverage ≥ 80%
- [ ] Multi-tenancy: mọi DB query đều có tenantId filter

## Ghi chú kỹ thuật

- Org chart tree build: dùng recursive `$graphLookup` aggregation hoặc build từ flat list trong memory (phù hợp khi < 10.000 nodes).
- Cache org chart trong Redis (5 phút), invalidate khi có thay đổi cấu trúc.
- Export Org Chart: trả về JSON phù hợp với thư viện frontend `OrgChart.js` hoặc `D3.js`.
- `path` field trong departments: `/rootId/parentId/thisId` — cho phép query nhanh toàn subtree bằng `$regex: '^/rootId/parentId'`.
