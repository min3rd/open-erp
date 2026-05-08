# TASK-SPRINT-03-DOMAIN_MIGRATION-005: FE Integration cho workdoc-service và hr-service

**Trạng thái:** 🟡 REVIEW
**Loại:** Frontend
**Sprint:** 03
**Cluster:** domain-migration
**Ưu tiên:** Cao
**Người nhận:** Senior Frontend Programmer
**Phụ thuộc:** TASK-SPRINT-03-DOMAIN_MIGRATION-001, TASK-SPRINT-03-DOMAIN_MIGRATION-002

---

## Mô tả

Tích hợp 2 domain services mới (workdoc-service port 3009 và hr-service port 3010) vào Angular frontend (`open-erp-web`). Cần:
1. Thêm API base URL constants
2. Tạo Angular services gọi các API endpoint mới
3. Kiểm tra TypeScript compile pass

---

## Tài liệu cần đọc

- `e:\Minh\open-erp\open-erp-web\src\core\constant.ts` — xem pattern API_URI hiện có
- `e:\Minh\open-erp\open-erp-web\src\core\services\` — xem pattern Angular services hiện có (vd: catalog.service.ts, stock.service.ts)
- `e:\Minh\open-erp\open-erp-backend\apps\workdoc-service\src\document\document.controller.ts`
- `e:\Minh\open-erp\open-erp-backend\apps\workdoc-service\src\workflow\workflow.controller.ts`
- `e:\Minh\open-erp\open-erp-backend\apps\hr-service\src\employee\employee.controller.ts`
- `e:\Minh\open-erp\open-erp-backend\apps\hr-service\src\leave-request\leave-request.controller.ts`
- `e:\Minh\open-erp\open-erp-backend\apps\hr-service\src\department\department.controller.ts`

---

## Yêu cầu triển khai

### 1. Cập nhật `src/core/constant.ts`

Thêm 2 hằng số mới:
```typescript
export const API_URI_WORKDOC = 'http://localhost:3009';
export const API_URI_HR = 'http://localhost:3010';
```

### 2. Tạo Angular services cho workdoc-service

**`src/core/services/workdoc/workdoc-document.service.ts`**

```typescript
// Inject HttpClient
// baseUrl = API_URI_WORKDOC + '/api/v1/workdoc/documents'
// Methods:
//   getAll(params?: any): Observable<any>      → GET /
//   getById(id: string): Observable<any>       → GET /:id
//   create(data: any): Observable<any>         → POST /
//   update(id: string, data: any): Observable<any>  → PATCH /:id
//   delete(id: string): Observable<any>        → DELETE /:id
```

**`src/core/services/workdoc/workdoc-workflow.service.ts`**

```typescript
// baseUrl = API_URI_WORKDOC + '/api/v1/workdoc/workflows'
// Methods:
//   getAll(params?: any): Observable<any>
//   getById(id: string): Observable<any>
//   create(data: any): Observable<any>
//   approve(id: string, data?: any): Observable<any>   → PATCH /:id/approve
//   reject(id: string, data?: any): Observable<any>    → PATCH /:id/reject
```

### 3. Tạo Angular services cho hr-service

**`src/core/services/hr/hr-employee.service.ts`**

```typescript
// baseUrl = API_URI_HR + '/api/v1/hr/employees'
// Methods:
//   getAll(params?: any): Observable<any>
//   getById(id: string): Observable<any>
//   create(data: any): Observable<any>
//   update(id: string, data: any): Observable<any>
//   delete(id: string): Observable<any>
```

**`src/core/services/hr/hr-leave-request.service.ts`**

```typescript
// baseUrl = API_URI_HR + '/api/v1/hr/leave-requests'
// Methods:
//   getAll(params?: any): Observable<any>
//   getById(id: string): Observable<any>
//   create(data: any): Observable<any>
//   approve(id: string, data?: any): Observable<any>
//   reject(id: string, data?: any): Observable<any>
```

**`src/core/services/hr/hr-department.service.ts`**

```typescript
// baseUrl = API_URI_HR + '/api/v1/hr/departments'
// Methods:
//   getAll(params?: any): Observable<any>
//   getById(id: string): Observable<any>
//   create(data: any): Observable<any>
//   update(id: string, data: any): Observable<any>
//   delete(id: string): Observable<any>
```

---

## Pattern cần tuân theo

Xem `src/core/services/stock/stock.service.ts` hoặc `src/core/services/catalog/catalog.service.ts` làm mẫu:
- Dùng `HttpClient` (inject)
- Import `API_URI_*` từ `../../constant` hoặc path tương đối đúng
- Dùng `Observable<any>` làm return type
- Không dùng `async/await` — dùng RxJS Observable

---

## Tiêu chí hoàn thành

- [ ] `constant.ts` có `API_URI_WORKDOC` và `API_URI_HR`
- [ ] 5 service files đã tạo (2 workdoc + 3 hr)
- [ ] Chạy `cd e:\Minh\open-erp\open-erp-web ; npx tsc --noEmit` → 0 errors
- [ ] Không xóa hoặc sửa bất kỳ service hiện có nào
- [ ] Cập nhật trạng thái task → 🟡 REVIEW
- [ ] Cập nhật `docs/tasks/sprints/SPRINT-03/TASK-INDEX.md` → task 005 = 🟡 REVIEW

---

## Kết quả triển khai

**Ngày hoàn thành:** 2026-05-08
**Files đã tạo / sửa:**
- `open-erp-web/src/core/constant.ts` — thêm `API_URI_WORKDOC` (port 3009) và `API_URI_HR` (port 3010)
- `open-erp-web/src/core/services/workdoc/workdoc-document.service.ts` — CRUD documents
- `open-erp-web/src/core/services/workdoc/workdoc-workflow.service.ts` — CRUD + approve/reject workflows
- `open-erp-web/src/core/services/hr/hr-employee.service.ts` — CRUD employees
- `open-erp-web/src/core/services/hr/hr-leave-request.service.ts` — CRUD + approve/reject leave requests
- `open-erp-web/src/core/services/hr/hr-department.service.ts` — CRUD departments

**Kết quả TypeScript compile:**
```
npx tsc --noEmit → 0 errors (không có output = thành công)
```

**Definition of Done:**
- [x] `constant.ts` có `API_URI_WORKDOC` và `API_URI_HR`
- [x] 5 service files đã tạo (2 workdoc + 3 hr)
- [x] `npx tsc --noEmit` → 0 errors
- [x] Không xóa hoặc sửa bất kỳ service hiện có nào
- [x] Cập nhật trạng thái task → 🟡 REVIEW
- [ ] Cập nhật `docs/tasks/sprints/SPRINT-03/TASK-INDEX.md` → task 005 = 🟡 REVIEW ← đang cập nhật
