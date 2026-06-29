# Đặc tả thiết kế API (API Requirement Overview)
## Dự án: Nền tảng SaaS quản trị doanh nghiệp hợp nhất - Enterprise SaaS Platform

---

### 1. Nguyên tắc thiết kế API
* **Chu chuẩn RESTful:** Sử dụng các phương thức HTTP rõ ràng:
  - `GET`: Lấy thông tin tài nguyên.
  - `POST`: Tạo mới tài nguyên.
  - `PUT`: Cập nhật toàn bộ tài nguyên.
  - `PATCH`: Cập nhật một phần tài nguyên.
  - `DELETE`: Xóa tài nguyên (ưu tiên Soft Delete bằng cờ `deleted_at`).
* **Định dạng dữ liệu:** Mọi payload gửi lên và phản hồi về đều sử dụng định dạng JSON, mã hóa UTF-8.
* **Mã trạng thái phản hồi (HTTP Status Codes):**
  - `200 OK`: Thành công đối với GET/PUT/PATCH.
  - `210 Created`: Thành công đối với POST.
  - `400 Bad Request`: Lỗi kiểm tra dữ liệu đầu vào.
  - `401 Unauthorized`: Token xác thực không hợp lệ hoặc hết hạn.
  - `403 Forbidden`: Người dùng không có quyền truy cập tài nguyên này.
  - `404 Not Found`: Tài nguyên không tồn tại.
  - `429 Too Many Requests`: Vượt quá giới hạn rate-limit.
  - `500 Internal Server Error`: Lỗi phát sinh từ phía server.

---

### 2. Thông tin Header tiêu chuẩn
Tất cả các API yêu cầu xác thực bắt buộc phải truyền các header sau:
```http
Authorization: Bearer <Access_Token_JWT>
X-Tenant-ID: <Tenant_UUID>
Content-Type: application/json
```

---

### 3. Cấu trúc phản hồi chuẩn (Standard Response Format)
#### 3.1 Phản hồi thành công (Success)
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Công ty TNHH Giải pháp Phần mềm Alpha",
    "subdomain": "alpha"
  },
  "meta": {
    "timestamp": 1718182234,
    "version": "v1.0"
  }
}
```

#### 3.2 Phản hồi lỗi (Error)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "messageKey": "errors.validation_failed",
    "details": [
      {
        "field": "email",
        "messageKey": "errors.invalid_email"
      }
    ]
  },
  "meta": {
    "timestamp": 1718182234,
    "version": "v1.0"
  }
}
```

---

### 4. Danh sách các nhóm API chính

#### 4.1 Auth & Tenant API (`/api/v1/auth`)
* `POST /auth/register`: Đăng ký tài khoản tenant mới (Tạo công ty, User Admin ban đầu).
* `POST /auth/login`: Đăng nhập, trả về JWT và Refresh Token.
* `POST /auth/refresh`: Làm mới Token.
* `POST /auth/forgot-password`: Yêu cầu gửi email khôi phục mật khẩu.

#### 4.2 User & Org API (`/api/v1/org`)
* `GET /org/departments`: Lấy sơ đồ phòng ban.
* `POST /org/departments`: Tạo phòng ban mới.
* `GET /org/users`: Danh sách nhân sự kèm phân trang, tìm kiếm.
* `POST /org/users/invite`: Gửi email mời nhân viên tham gia tenant.

#### 4.3 CRM API (`/api/v1/crm`)
* `GET /crm/leads`: Danh sách lead tiềm năng.
* `POST /crm/leads`: Thêm mới lead.
* `PATCH /crm/leads/:id/stage`: Cập nhật giai đoạn của lead.
* `POST /crm/opportunities/:id/quote`: Tạo báo giá từ cơ hội.

#### 4.4 HRM API (`/api/v1/hrm`)
* `GET /hrm/employees/:id`: Lấy chi tiết hồ sơ nhân viên.
* `POST /hrm/timekeeping/check-in`: Chấm công (vào/ra ca).
* `GET /hrm/payroll/payslips`: Danh sách bảng lương của nhân viên.

#### 4.5 Task & Project API (`/api/v1/tasks`)
* `GET /tasks`: Lấy danh sách công việc của tôi/phòng ban.
* `POST /tasks`: Tạo mới công việc.
* `PUT /tasks/:id`: Cập nhật công việc.
* `POST /tasks/:id/comments`: Thêm thảo luận/bình luận vào công việc.
* `GET /projects/:id/progress`: Lấy thống kê tiến độ dự án.

#### 4.6 Approval API (`/api/v1/approvals`)
* `GET /approvals/requests`: Danh sách yêu cầu phê duyệt gửi đi hoặc cần duyệt.
* `POST /approvals/requests`: Tạo yêu cầu phê duyệt mới (Nghỉ phép, thanh toán, mua hàng).
* `POST /approvals/requests/:id/action`: Duyệt/Từ chối/Yêu cầu bổ sung cho yêu cầu phê duyệt.

#### 4.7 Finance API (`/api/v1/finance`)
* `GET /finance/cashbooks`: Lấy sổ quỹ/lịch sử giao dịch tiền mặt, ngân hàng.
* `POST /finance/receipts`: Tạo phiếu thu tiền.
* `POST /finance/payments`: Tạo phiếu chi tiền.

#### 4.8 Procurement & Inventory API (`/api/v1/inventory`)
* `POST /procurement/purchase-orders`: Tạo đơn mua hàng (PO).
* `GET /inventory/items`: Danh mục vật tư tồn kho.
* `POST /inventory/transactions/import`: Lập phiếu nhập kho.
* `POST /inventory/transactions/export`: Lập phiếu xuất kho.

#### 4.9 Asset API (`/api/v1/assets`)
* `GET /assets`: Danh sách tài sản công ty.
* `POST /assets/handover`: Thực hiện bàn giao tài sản cho nhân viên.

#### 4.10 Notification API (`/api/v1/notifications`)
* `GET /notifications`: Lấy danh sách thông báo.
* `POST /notifications/read-all`: Đánh dấu đã đọc tất cả thông báo.
* `PATCH /notifications/:id/read`: Đánh dấu một thông báo đã đọc.

---

### 5. Sprint 2 — Workflow, Form động, Storage, CA & Ký số

> Các API dưới đây đã triển khai trong Sprint 2 (`open-erp-services`). Chi tiết payload xem task spec tương ứng.

#### 5.1 Workflow Definition API (`/api/v1/workflows`)
* `POST /workflows`: Tạo/cấu hình quy trình (steps: START, APPROVAL, FORK, JOIN, END; consensus ALL/ANY/PERCENTAGE).
* `GET /workflows`: Danh sách quy trình của tenant.
* `GET /workflows/:id`: Chi tiết quy trình kèm steps.
* `GET /workflows/analytics/performance`: Thống kê hiệu năng quy trình (query: `startDate`, `endDate`).

#### 5.2 Workflow Instance API (`/api/v1/workflow-instances`)
* `POST /workflow-instances`: Khởi chạy instance (`workflowId`, `contextData`).
* `POST /workflow-instances/:instanceId/actions`: Thực hiện hành động (`stepId`, `action`: APPROVE|REJECT|CONSULT|PROVIDE_FEEDBACK|SPAWN_SUBPROCESS, `comment`, `formData`, `consultantId`, `subWorkflowId`).
* `GET /workflow-instances/:id`: Chi tiết instance và trạng thái bước hiện tại.

#### 5.3 Workflow Log Integrity API (`/api/v1/workflows`)
* `GET /workflows/logs/:instanceId/verify`: Xác minh chuỗi hash-chain SHA-256 của `workflow_logs` (tamper-proof).

#### 5.4 Dynamic Form API (`/api/v1/dynamic-forms`)
* `POST /dynamic-forms`: Tạo form mới hoặc version mới theo `formKey`.
* `GET /dynamic-forms/key/:key`: Lấy schema bản `isLatest` theo key *(planned — UI Form Builder yêu cầu)*.
* `GET /dynamic-forms/key/:key/versions`: Lịch sử phiên bản theo key.
* `POST /dynamic-forms/:id/restore`: Khôi phục version cũ thành bản latest mới.
* `POST /dynamic-forms/:id/validate`: Validate dữ liệu nhập theo schema (hỗ trợ GRID/layout).

#### 5.5 Document Template API (`/api/v1/document-templates`)
* `POST /document-templates`: Upload template (multipart: `file`, `name`, `mapping`) — yêu cầu quyền `TEMPLATE_ADMIN`.
* `GET /document-templates`: Danh sách mẫu văn bản.
* `POST /document-templates/:id/generate`: Sinh file từ form data (PDF/DOCX).
* `DELETE /document-templates/:id`: Xóa mẫu.

#### 5.6 File & OnlyOffice API (`/api/v1/files`)
* `GET /files/:fileId/onlyoffice-config`: Cấu hình editor OnlyOffice (JWT/config).
* `POST /files/onlyoffice-callback/:fileId`: Callback lưu tài liệu từ OnlyOffice.
* `GET /files/:fileId/download-binary`: Tải binary file.

#### 5.7 Object Storage API (`/api/v1/storage`)
* `POST /storage/upload`: Upload file lên MinIO/S3.
* `GET /storage/files/:fileId/download`: Pre-signed URL tải file.

#### 5.8 Internal CA API (`/api/v1/ca`)
* `POST /ca/issue`: Cấp chứng thư X.509 cho user/phòng ban.
* `GET /ca/my`: Danh sách chứng thư của user hiện tại.

#### 5.9 Digital Signature API (`/api/v1/signatures`)
* `POST /signatures/sign-instance`: Ký payload instance workflow bằng private key nội bộ.
* `POST /signatures/verify`: Xác thực chữ ký và phát hiện tamper.

#### 5.10 Real-time Notification (WebSocket)
* Namespace Socket.io: `/ws` — push in-app notification realtime (kết hợp `GET /notifications` và email qua BullMQ).
* Event nội bộ: `schedule_deadline_reminder` → queue `workflow-deadline-queue` (BullMQ).
