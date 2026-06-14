# Tài liệu kỹ thuật chi tiết: TSK-1.5 - Phân quyền RBAC & Menu động
## Phân hệ: Quản trị doanh nghiệp & Xác thực (SaaS Access Control - Sprint 1)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng phân hệ Quản lý phân quyền dựa trên vai trò (Role-Based Access Control - RBAC). Cho phép Tenant Owner tạo lập các nhóm vai trò, cấu hình quyền thao tác chi tiết (Xem, Thêm, Sửa, Xóa, Xuất) trên từng phân hệ chức năng nghiệp vụ, và render động thanh menu điều hướng (Sidebar Navigation Menu) tương ứng cho người dùng.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Cơ cấu Phân quyền (RBAC Matrix)
Quyền truy cập được quản lý thông qua liên kết giữa Tài khoản (`users`), Vai trò (`roles`), và Quyền hạn (`permissions`). Xem chi tiết cấu trúc bảng dữ liệu trong [data_model.md](../../../04_technical/data_model.md).

```text
  [ Tài khoản User ] ──► [ Vai trò: Quản lý Sales (Role) ]
                                      │
                                      ▼
                        [ Bảng Quyền Hạn (Permissions) ]
                        - CRM_READ   (Xem thông tin CRM)
                        - CRM_CREATE (Tạo cơ hội mới)
                        - CRM_DELETE (Xóa cơ hội - Từ chối gán)
```
* **Quyền thao tác cơ sở:** Định nghĩa chuẩn hóa: `<MODULE>_READ`, `<MODULE>_CREATE`, `<MODULE>_UPDATE`, `<MODULE>_DELETE`, `<MODULE>_EXPORT`.

#### 2.2 Cơ chế chặn API bảo mật trên Backend (Permissions Guard)
* Tất cả các endpoints API nghiệp vụ nhạy cảm phải được bảo vệ bằng NestJS Guard: `@UseGuards(JwtAuthGuard, PermissionsGuard)`.
* Sử dụng Custom Decorator `@RequirePermissions('CRM_DELETE')` để khai báo quyền yêu cầu cho từng controller endpoint.
* `PermissionsGuard` đọc thông tin quyền của User lưu trong session context (hoặc truy vấn cache Redis) để so sánh và ra quyết định: trả về `200/201` hoặc chặn lại với mã lỗi `403 Forbidden`.

#### 2.3 Cơ chế Ẩn/Hiện Menu động trên Frontend
* Khi đăng nhập thành công, Client gọi API `/api/v1/auth/me` để lấy thông tin hồ sơ và danh sách mã quyền tương ứng.
* Sidebar component lọc danh sách cấu hình menu tĩnh, chỉ giữ lại các menu mà người dùng có quyền `READ` tương ứng và thực hiện hiển thị trên giao diện.
* **Angular Custom Directive (`*appHasPermission`):** Sử dụng để ẩn/hiện các nút thao tác trên màn hình (ví dụ: chỉ hiện nút "Xóa phòng ban" nếu người dùng có quyền `ORG_DELETE`).
  ```html
  <button *appHasPermission="'ORG_DELETE'" (click)="deleteDept()">Xóa phòng ban</button>
  ```
* **Angular Route Guard (`PermissionGuard`):** Bảo vệ các router dẫn tới trang tính năng, tự động chuyển hướng người dùng về trang Dashboard nếu họ cố tình truy cập link trực tiếp mà không có quyền.

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: CRUD & RLS cho Roles & Permissions**
  - Viết các APIs CRUD cho `roles`, gán quyền cho roles (`role_permissions`) và gán vai trò cho người dùng (`user_roles`). Đảm bảo áp dụng RLS cô lập theo `tenant_id`.
* **Nhiệm vụ 2: Viết NestJS Guard**
  - Viết `PermissionsGuard` xử lý đối soát quyền năng động, tối ưu hóa truy vấn bằng cách cache danh sách quyền của user vào Redis khi đăng nhập.

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Giao diện Cấu hình phân quyền (Role Builder)**
  - Thiết kế màn hình ma trận phân quyền: Hiển thị bảng danh sách quyền theo cột (Xem, Thêm, Sửa, Xóa, Xuất) và dòng (module) để quản trị viên tick chọn dễ dàng.
  - Sử dụng các UI components chuẩn từ thư viện dùng chung **`open-erp-ui`**, hỗ trợ màu sắc **Rose Gold** và chế độ hiển thị Light/Dark Mode.
* **Nhiệm vụ 2: Triển khai Directive & Route Guards**
  - Viết directive `appHasPermission` và đăng ký route guard trong `app.routes.ts`.
  - Tích hợp Transloco hiển thị đa ngôn ngữ cho nhãn nhầm lẫn và thông báo lỗi.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* **Nhiệm vụ 1: Định tuyến và kiểm tra quyền trên Mobile**
  - Đồng bộ logic phân quyền trên Mobile. Sử dụng route guards của Angular Router trong Ionic để chặn truy cập trang trái phép.
  - Ẩn/hiện các tab điều hướng dưới màn hình tương ứng theo danh sách quyền của user.

#### 3.4 UI/UX Designer
* Thiết kế bảng cấu hình ma trận phân quyền (Role Builder Table) trực quan, responsive trên tablet/mobile.

#### 3.5 QA Engineer
* Viết các kịch bản kiểm thử:
  - Tài khoản Employee (không có quyền xóa) cố tình gọi API xóa phòng ban bằng công cụ Postman/Curl -> Xác nhận nhận về mã lỗi `403 Forbidden`.
  - Tài khoản Employee đăng nhập vào Web -> Xác nhận nút "Xóa" trên UI biến mất.
  - Tài khoản Admin có đầy đủ quyền -> Xác nhận hiển thị đầy đủ và gọi API thành công.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)

* **Bước 1 (Hạ tầng):** Đảm bảo cụm hạ tầng PostgreSQL & Redis local đang chạy:
  ```bash
  docker compose -f ../../../../docker-compose.local.yml up -d
  ```
* **Bước 2 (Gỡ lỗi Backend):** Mở dự án `open-erp-services` trong VSCode, đặt breakpoint trong `permissions.guard.ts`. Chạy debug cấu hình **"Debug NestJS Backend"**.
* **Bước 3 (Chạy client):** Khởi chạy client Web (`npm run start`) để kiểm tra ẩn hiện nút thao tác realtime khi thay đổi quyền.

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* **Kết quả bàn giao:**
  - Bộ APIs CRUD vai trò & gán quyền hoạt động ổn định, có unit test đầy đủ (coverage > 80%).
  - NestJS `PermissionsGuard` chặn API chính xác.
  - Angular directive `*appHasPermission` và Route Guard trên Web & Mobile hoạt động đúng như mong đợi.
  - Hiển thị đầy đủ đa ngôn ngữ qua Transloco.
  - Toàn bộ source code được review, approve và merge vào nhánh `develop`.
