# TASK-SPRINT-02-FRONTEND-002: Angular Web — Audit Log UI

## Thông tin

| Thuộc tính       | Giá trị                                                       |
|------------------|---------------------------------------------------------------|
| Task ID          | TASK-SPRINT-02-FRONTEND-002                                   |
| Sprint           | Sprint 02                                                     |
| Cluster          | frontend                                                      |
| Loại             | Frontend                                                      |
| Người phụ trách  | Frontend                                                      |
| Story Points     | 3                                                             |
| Trạng thái       | ⬜ TODO                                                       |
| Phụ thuộc        | TASK-SPRINT-01-FRONTEND-002, TASK-SPRINT-02-SYSTEM_ADMIN-002  |

## Mô tả

Xây dựng giao diện xem và tìm kiếm Audit Logs cho Angular Web App. Bao gồm: bảng danh sách logs với bộ lọc nâng cao (date range, user, resource, action), xem chi tiết log với diff viewer so sánh dữ liệu trước/sau, và xuất CSV.

## Phạm vi kỹ thuật

### Frontend Web (Angular 18 — `open-erp-web`)

**Cấu trúc module:**
```
src/app/features/system-admin/audit-logs/
├── audit-logs.routes.ts
├── audit-log-list/
│   ├── audit-log-list.component.ts
│   ├── audit-log-list.component.html
│   └── audit-log-list.component.scss
├── audit-log-detail/
│   ├── audit-log-detail.component.ts     ← Dialog/slide panel
│   └── audit-log-detail.component.html
├── audit-log-filter/
│   ├── audit-log-filter.component.ts
│   └── audit-log-filter.component.html
└── audit-log.service.ts
```

**AuditLogListComponent — tính năng:**

Bảng danh sách với các cột:
| Cột             | Nội dung                                              |
|-----------------|-------------------------------------------------------|
| Thời gian       | Relative time ("5 phút trước") + tooltip ISO datetime |
| Người thực hiện | Avatar + tên + email                                  |
| Hành động       | Badge màu (created=xanh, updated=cam, deleted=đỏ)    |
| Tài nguyên      | Loại + ID (ví dụ: "Order #ORD-001")                  |
| IP Address      | IP + flag quốc gia                                    |
| Trạng thái      | SUCCESS (xanh) / FAILURE (đỏ)                        |
| Chi tiết        | Nút xem                                               |

**Advanced Filter Panel (Collapsible):**
```
[Date Range Picker    ][From        ][To          ]
[User Search    ▼     ][Resource ▼  ][Action   ▼ ]
[Status: ALL ● SUCCESS ○ FAILURE    ]
[IP Address              ]
[  Áp dụng  ]  [Xoá bộ lọc]  [Export CSV]
```

**Pagination với Virtual Scroll:**
- `MatPaginator` với page size: 20, 50, 100
- Virtual scroll cho performance khi render nhiều rows
- Tổng số records hiển thị

**AuditLogDetailComponent (Side Panel / Dialog):**
```
+-------------------------------------------+
| Chi tiết thao tác                      [x] |
+-------------------------------------------+
| Thời gian: 09/05/2026 14:30:22             |
| Người dùng: Nguyễn Văn A (admin@acme.com) |
| IP: 192.168.1.1                             |
| Hành động: Cập nhật người dùng             |
| Resource: User #usr_001                     |
|                                             |
| Thay đổi:                                   |
| +-------------------+--------+----------+  |
| | Trường            | Trước  | Sau      |  |
| +-------------------+--------+----------+  |
| | fullName          | Văn A  | Văn An   |  |
| | departmentId      | dep01  | dep02    |  |
| | status            | ACTIVE | INACTIVE |  |
| +-------------------+--------+----------+  |
|                                             |
| [Xem Raw JSON]                              |
+-------------------------------------------+
```

**Diff Viewer — so sánh JSON:**
```typescript
// Implement đơn giản: so sánh oldData vs newData
// Highlight:
//   🟢 Added fields (chỉ có trong newData)
//   🔴 Removed fields (chỉ có trong oldData)  
//   🟡 Modified fields (giá trị thay đổi)

interface FieldDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  type: 'added' | 'removed' | 'modified';
}

function computeDiff(oldData: object, newData: object): FieldDiff[] {
  // Flat diff (không recursive) cho Sprint này
  // Recursive diff cho Sprint sau nếu cần
}
```

**Export CSV:**
```typescript
// Gọi API export → nhận file download
exportCsv(filter: AuditLogFilter): void {
  const url = this.buildExportUrl(filter);
  window.open(url, '_blank');    // Hoặc dùng Blob + saveAs
}
```

**AuditLogService:**
```typescript
@Injectable({ providedIn: 'root' })
export class AuditLogService {
  getAuditLogs(filter: AuditLogFilter): Observable<PaginatedResult<AuditLog>>
  getAuditLog(id: string): Observable<AuditLog>
  exportCsv(filter: AuditLogFilter): Observable<Blob>
  getStats(): Observable<AuditLogStats>
}
```

## API Endpoints sử dụng

| API                                   | Component sử dụng               |
|---------------------------------------|---------------------------------|
| `GET /api/v1/audit-logs`              | AuditLogListComponent           |
| `GET /api/v1/audit-logs/:id`          | AuditLogDetailComponent         |
| `GET /api/v1/audit-logs/export`       | Export button                   |
| `GET /api/v1/audit-logs/stats`        | Stats summary (optional)        |

## Acceptance Criteria

- [ ] Bảng danh sách hiển thị đúng logs với tất cả cột
- [ ] Filter theo date range hoạt động
- [ ] Filter theo user: search và select
- [ ] Filter theo resource type và action
- [ ] Filter status SUCCESS/FAILURE
- [ ] Pagination hoạt động đúng
- [ ] Click row → mở side panel/dialog chi tiết
- [ ] Diff viewer hiển thị đúng trường thay đổi (modified/added/removed)
- [ ] "Xem Raw JSON" toggle hiển thị JSON đầy đủ
- [ ] Export CSV: download file đúng format
- [ ] Xoá bộ lọc → reset về trạng thái mặc định
- [ ] Unit test coverage ≥ 80%
- [ ] Responsive trên desktop và tablet

## Ghi chú kỹ thuật

- `MatDatepickerModule` với `MatDateRangePickerModule` cho date range filter.
- Date format hiển thị theo locale `vi-VN`.
- Virtual scroll: `@angular/cdk/scrolling` `CdkVirtualScrollViewport`.
- Diff computation client-side (không cần API riêng).
- Dùng `ngx-json-viewer` hoặc tự implement JSON pretty printer.
- Batch filter request (không gửi request mỗi khi filter thay đổi) — gửi khi user click "Áp dụng".
- Relative time pipe: "vừa xong", "5 phút trước", "3 ngày trước" (dùng `date-fns` hoặc `moment.js`).
