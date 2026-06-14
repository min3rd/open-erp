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
Lỗi xảy ra trong [tenant.middleware.ts](../../../../open-erp-services/src/core/tenant/tenant.middleware.ts) do cơ chế phân giải đường dẫn kiểm tra loại trừ (bypass paths) hoạt động không chính xác:
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
1. **Sửa lỗi loại trừ**: Sử dụng thuộc tính `req.originalUrl` thay thế cho `req.path` để không bị NestJS sub-router định tuyến cắt ngắn.
2. **Khắc phục hardcode hostname**: Trích xuất subdomain động dựa trên biến môi trường `process.env.APP_DOMAIN` (mặc định là `localhost`). Middleware so khớp xem hostname có kết thúc bằng `.${APP_DOMAIN}` hay không để tự động lấy phần prefix làm subdomain, tăng tính tùy biến khi deploy.
3. **Subdomain dạng tùy chọn (Optional)**: Hỗ trợ phân giải tenant thông qua các custom HTTP headers: `X-Tenant-ID` (tìm theo ID tenant) hoặc `X-Subdomain` (tìm theo subdomain). Doanh nghiệp có thể chọn cấu hình header thay thế mà không bắt buộc sử dụng cơ chế subdomain trên trình duyệt.

* **Tệp tin đích cần sửa đổi:** [tenant.middleware.ts (open-erp-services)](../../../../open-erp-services/src/core/tenant/tenant.middleware.ts)
* **Nguyên tắc sửa đổi logic**:
  ```typescript
  // Trích xuất subdomain dựa trên APP_DOMAIN
  const baseDomain = (process.env.APP_DOMAIN || 'localhost').toLowerCase();
  if (domain.endsWith('.' + baseDomain)) {
    return domain.slice(0, -(baseDomain.length + 1));
  }
  ```

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)
1. Truy cập trực tiếp `http://localhost:3000/api/v1/auth/check-subdomain?subdomain=test` trả về trạng thái `200 OK` và dữ liệu JSON `{"success":true,"data":{"available":true}}`.
2. Hỗ trợ xác định Tenant qua request headers `x-tenant-id` hoặc `x-subdomain` khi gọi các API cần context tenant mà không bắt buộc dùng subdomain ở cấp độ URL/Host.
3. Loại bỏ hoàn toàn việc hardcode các domain cụ thể (như `.open-erp.9ms.io.vn`) trong mã nguồn.

---

### 5. Kết quả thực hiện (Resolution & Deliverables)
- **Trạng thái (Status)**: [x] Đã hoàn thành (Completed)
- **Chi tiết thay đổi (Implementation Details)**:
  - Đã cập nhật [tenant.middleware.ts](../../../../open-erp-services/src/core/tenant/tenant.middleware.ts) hỗ trợ cả ba hình thức phân giải tenant: trích xuất subdomain từ Host (dựa trên `APP_DOMAIN`), custom header `X-Tenant-ID`, và custom header `X-Subdomain`.
  - Cập nhật trang đăng ký tại [RegisterComponent](../../../../open-erp-web/src/app/features/auth/register/register.component.ts) để trường subdomain thành tùy chọn (optional). Tự động sinh subdomain duy nhất từ tên doanh nghiệp nếu người dùng bỏ trống trường này.
  - Các bài kiểm tra đơn vị (Unit Tests) trong backend và quá trình biên dịch toàn bộ dự án đã thành công hoàn hảo.
