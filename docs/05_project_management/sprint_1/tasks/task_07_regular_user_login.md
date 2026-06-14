# Tài liệu kỹ thuật chi tiết: TSK-1.7 - Đăng nhập tài khoản thường
## Phân hệ: Quản trị doanh nghiệp & Xác thực (SaaS IAM - Sprint 1)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng và tối ưu hóa quy trình Đăng nhập dành cho tài khoản thường (Regular User). Thiết lập hệ thống đăng nhập tập trung trên tên miền chung (Flat Domain), cho phép người dùng đăng nhập bằng tài khoản cá nhân, tự động phân tích hoặc hiển thị màn hình chọn doanh nghiệp/workspace (Tenant Selection) nếu tài khoản đó tham gia vào nhiều công ty, và điều hướng chính xác vào giao diện làm việc tương ứng. Triển khai đồng bộ trên cả Web và Mobile App.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Luồng đăng nhập tài khoản thường (Flat Domain Login & Workspace Selection)
* Đăng nhập được thực hiện trên flat domain (ví dụ: `https://open-erp.9ms.io.vn/login` hoặc `http://localhost:4200/login` / `http://localhost:8100/login`).
* **Không yêu cầu người dùng nhập subdomain khi đăng nhập.** Hệ thống tự động xác định các tenant mà user tham gia.

```text
[Nhân viên (Web / Mobile App)] ──► Nhập Email & Mật khẩu (tại Flat Domain)
                                             │
                                             ▼
                                [API xác thực thông tin]
                                             │
                                             ▼
                 [Kiểm tra danh sách Tenant liên kết (Bảng user_tenants)]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼ (Chỉ thuộc 1 Tenant)                      ▼ (Thuộc nhiều Tenant)
             [Vào thẳng Workspace]                        [Hiển thị màn hình Chọn Workspace]
             (Trả về Token chứa tenant_id)                (User click chọn doanh nghiệp muốn làm việc)
                                                                   │
                                                                   ▼
                                                         [Trả về Token chứa tenant_id]
```

#### 2.2 Đặc tả API endpoint liên quan
Tham chiếu đầy đủ trong [api_overview.md](../../../03_functional/api_overview.md).

* **`POST /api/v1/auth/login`** (Đăng nhập global)
  - **Payload yêu cầu:**
    ```json
    {
      "email": "employee@gmail.com",
      "password": "SecurePassword123!"
    }
    ```
  - **Phản hồi thành công (Nếu thuộc nhiều Tenant - 200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "requireTenantSelection": true,
        "tenants": [
          { "id": "uuid-tenant-1", "name": "Công ty GoTech", "subdomain": "gotech" },
          { "id": "uuid-tenant-2", "name": "Cửa hàng SalesPro", "subdomain": "salespro" }
        ]
      }
    }
    ```
  - **Phản hồi thành công (Sau khi chọn Tenant hoặc chỉ có 1 Tenant - 200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "eyJhbGciOi...",
        "expiresIn": 900,
        "tenantId": "uuid-tenant-1",
        "role": "employee"
      }
    }
    ```

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: Triển khai API đăng nhập đa Tenant**
  - Cập nhật API `/auth/login` để tìm kiếm thông tin tài khoản trên phạm vi toàn cầu.
  - Kiểm tra số lượng liên kết tenant của user. Nếu lớn hơn 1, trả về cờ `requireTenantSelection` kèm danh sách tenant.
  - Viết API `/auth/select-tenant` nhận `tenantId` và sinh JWT Access Token chính thức chứa thông tin `tenant_id` của context đó, áp dụng RLS tương ứng.
* **Nhiệm vụ 2: Redis Session**
  - Quản lý phiên làm việc bằng Refresh Token tương ứng với từng phiên làm việc của tenant trong Redis.

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Giao diện Đăng nhập & Chọn Workspace trên Web**
  - Sử dụng chung giao diện của `LoginComponent` trên flat domain.
  - Nếu API yêu cầu chọn tenant, hiển thị giao diện chọn Workspace (Tenant Selector Page) đẹp mắt dạng danh sách card công ty.
  - Tự động lưu trữ token, gọi ngầm Silent Refresh và điều hướng vào Dashboard.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* **Nhiệm vụ 1: Giao diện Đăng nhập & Chọn Workspace trên Mobile**
  - Xây dựng màn hình đăng nhập phẳng trên Mobile (không yêu cầu điền subdomain trước).
  - Tích hợp màn hình chọn Workspace (Card list) trực quan, tối ưu thao tác chạm vuốt trên di động nếu tài khoản tham gia nhiều công ty.
  - Lưu trữ Access/Refresh token an toàn bằng Capacitor Secure Storage.

#### 3.4 QA Engineer
* Viết kịch bản kiểm thử:
  - Tài khoản nhân viên đăng nhập flat domain thành công.
  - Kiểm thử chọn tenant điều hướng chính xác vào hệ thống và gọi API kèm header `tenant_id`.
  - Kiểm tra luồng logout trên cả Web và Mobile.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Chạy hạ tầng local**:
  ```bash
  docker compose -f ../../../../docker-compose.local.yml up -d
  ```
* **Debug**:
  Đặt breakpoint tại hàm `login` trong `auth.controller.ts` backend. Chạy Web Client tại `http://localhost:4200/login` và Mobile Client tại `http://localhost:8100/login`.

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* Hệ thống đăng nhập và chọn tenant của tài khoản thường hoạt động ổn định, bảo mật.
* Giao diện đăng nhập trên Web và Mobile đáp ứng đầy đủ yêu cầu responsive, đa ngôn ngữ, theme Rose Gold và chế độ Light/Dark mode.
* Source code đã được review, test qua và merge thành công vào `develop`.
