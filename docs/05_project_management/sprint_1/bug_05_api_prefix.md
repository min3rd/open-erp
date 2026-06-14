# Tài liệu báo cáo lỗi & Thiết kế: BUG-1.5 - Lỗi API prefix (NestJS 11 Unsupported route path /api/v1/*)
## Phân hệ: Cấu hình Hệ thống (Backend API Service - Sprint 1)

---

### 1. Mô tả lỗi (Bug Description)
Khi khởi chạy dịch vụ backend NestJS (`open-erp-services`), hệ thống ghi lại cảnh báo (Warning) trong log console:
`WARN [LegacyRouteConverter] Unsupported route path: "/api/v1/*". In previous versions, the symbols ?, *, and + were used to denote optional or repeating path parameters. The latest version of "path-to-regexp" now requires the use of named parameters. For example, instead of using a route like /users/* to capture all routes starting with "/users", you should use /users/*path. For more details, refer to the migration guide. Attempting to auto-convert...`

---

### 2. Nguyên nhân lỗi (Root Cause)
- **Cơ chế**: NestJS 11 đã nâng cấp driver HTTP mặc định lên **Express v5** và thư viện `path-to-regexp` phiên bản mới hơn. Thư viện này không còn hỗ trợ các ký tự đại diện wildcard đơn lẻ không tên (ví dụ: `*`).
- **Hiện trạng**: Trong tệp [app.module.ts](../../../open-erp-services/src/app.module.ts), middleware `TenantMiddleware` được cấu hình để áp dụng cho tất cả các tuyến đường bằng phương thức `forRoutes('*')`.
- **Hệ quả**: NestJS tự động kết hợp global prefix `api/v1` với wildcard `*` thành đường dẫn `/api/v1/*` và đăng ký với Express router. Khi Express v5/path-to-regexp biên dịch đường dẫn này, nó phát hiện ký tự `*` không tên và đưa ra cảnh báo lỗi độ tương thích, đồng thời kích hoạt bộ chuyển đổi cũ `LegacyRouteConverter` để tự chuyển đổi tự động nhưng gây ảnh hưởng đến hiệu năng và log ứng dụng.

---

### 3. Giải pháp khắc phục (Resolution Design)
Để khắc phục hoàn toàn cảnh báo này, chúng ta cần khai báo rõ ràng tham số wildcard bằng cú pháp tham số đặt tên (named parameter) mới hỗ trợ trong Express v5.

* **Tệp tin đích cần sửa đổi:** [app.module.ts (open-erp-services)](../../../open-erp-services/src/app.module.ts)
* **Nguyên tắc sửa đổi logic**:
  Thay đổi cấu hình `forRoutes('*')` thành `forRoutes('{*splat}')`.

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)
1. Ứng dụng backend NestJS biên dịch và khởi chạy thành công (`npm run build` và `npm run start`).
2. Log console khởi chạy không còn xuất hiện cảnh báo `WARN [LegacyRouteConverter] Unsupported route path: "/api/v1/*"`.
3. Middleware `TenantMiddleware` vẫn hoạt động chính xác cho tất cả các API endpoints.

---

### 5. Kết quả thực hiện (Resolution & Deliverables)
- **Trạng thái (Status)**: [x] Đã hoàn thành (Completed)
- **Chi tiết thay đổi (Implementation Details)**:
  - Cập nhật phương thức `configure` trong [app.module.ts](../../../open-erp-services/src/app.module.ts) từ `.forRoutes('*')` thành `.forRoutes('{*splat}')`.
  - Kiểm tra chạy thử tại máy local và biên dịch lại ứng dụng thành công. Cảnh báo đã hoàn toàn biến mất khỏi log hệ thống.
