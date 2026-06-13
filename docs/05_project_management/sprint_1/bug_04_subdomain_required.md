# Tài liệu báo cáo lỗi & Thiết kế: BUG-1.4 - Lỗi API check subdomain báo thiếu thông tin subdomain (SUBDOMAIN_REQUIRED)
## Phân hệ: Xác thực & Đăng ký (Auth Web Client & Backend Services - Sprint 1)

---

### 1. Mô tả lỗi (Bug Description)
Khi gọi API kiểm tra subdomain khả dụng:
`GET http://localhost:3000/api/v1/auth/check-subdomain?subdomain=test`
Mặc dù đã truyền tham số query `subdomain=test` đầy đủ, hệ thống backend vẫn trả về lỗi 400 Bad Request với nội dung:
```json
{
    "success": false,
    "error": {
        "code": "SUBDOMAIN_REQUIRED",
        "messageKey": "auth.subdomain_required"
    }
}
```

---

### 2. Nguyên nhân lỗi (Root Cause)
Lỗi xảy ra trong [tenant.middleware.ts](../../../open-erp-services/src/core/tenant/tenant.middleware.ts) do cơ chế phân giải đường dẫn kiểm tra loại trừ (bypass paths) hoạt động không chính xác:
- **Hiện trạng**: Middleware kiểm tra điều kiện bỏ qua kiểm tra subdomain bằng cách so sánh `req.path`:
  ```typescript
  const path = req.path;
  if (path.includes('/auth/check-subdomain') || path.includes('/auth/register')) {
    return next();
  }
  ```
- **Lý do thất bại**: Trong NestJS, khi một global prefix (như `api/v1`) được cấu hình, và middleware được áp dụng cho mọi routes (`forRoutes('*')`), NestJS mount middleware thông qua router Express. Tại thời điểm chạy middleware, Express đã khớp đường dẫn tuyến đường và rewrite `req.path` thành `/` (hoặc relative path với route handler). 
  Vì vậy, đối với cuộc gọi `/api/v1/auth/check-subdomain`, `req.path` trả về `/` chứ không phải `/api/v1/auth/check-subdomain`. 
- **Hệ quả**: Điều kiện `path.includes('/auth/check-subdomain')` trả về `false`. Middleware tiếp tục chạy xuống kiểm tra sự hiện diện của subdomain trong Host header, không tìm thấy subdomain trên Host của API (chạy cổng 3000 trực tiếp) và quăng ra lỗi `SUBDOMAIN_REQUIRED`.

---

### 3. Giải pháp khắc phục (Resolution Design)
Sử dụng thuộc tính `req.originalUrl` thay thế cho `req.path`. 
- `req.originalUrl` là thuộc tính chuẩn của Express ghi nhận nguyên vẹn URI gốc được gửi từ client (ví dụ: `/api/v1/auth/check-subdomain?subdomain=test`) và không bị thay đổi hay cắt ngắn bởi cơ chế định tuyến của NestJS/Express sub-router.

* **Tệp tin đích cần sửa đổi:** [tenant.middleware.ts (open-erp-services)](../../../open-erp-services/src/core/tenant/tenant.middleware.ts)
* **Nguyên tắc sửa đổi logic**:
  ```typescript
  // Cũ:
  const path = req.path;
  if (path.includes('/auth/check-subdomain') || path.includes('/auth/register')) { ... }

  // Mới:
  const originalUrl = req.originalUrl;
  if (originalUrl.includes('/auth/check-subdomain') || originalUrl.includes('/auth/register')) {
    return next();
  }
  ```

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)
1. Truy cập trực tiếp `http://localhost:3000/api/v1/auth/check-subdomain?subdomain=test` (không cần gửi header Host dạng `subdomain.localhost`) trả về trạng thái `200 OK` và dữ liệu JSON `{"success":true,"data":{"available":true}}`.
2. Luồng đăng ký tại giao diện `/register` gọi kiểm tra subdomain khả dụng không còn bị chặn bởi lỗi 400 `SUBDOMAIN_REQUIRED` từ TenantMiddleware.
3. Không làm ảnh hưởng đến cơ chế bảo vệ và chặn các route yêu cầu tenant khác (như `/auth/login`, `/auth/logout`) khi thiếu subdomain trong Host header.

---

### 5. Kết quả thực hiện (Resolution & Deliverables)
- **Trạng thái (Status)**: [x] Đã hoàn thành (Completed)
- **Chi tiết thay đổi (Implementation Details)**:
  - Đã cập nhật [tenant.middleware.ts](../../../open-erp-services/src/core/tenant/tenant.middleware.ts) để chuyển đổi từ việc kiểm tra `req.path` sang `req.originalUrl`.
  - Kiểm thử trực tiếp bằng `curl.exe` xác nhận API check-subdomain hoạt động bình thường, phản hồi `200 OK` cùng kết quả kiểm tra chính xác.
