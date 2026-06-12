# Tài liệu kỹ thuật chi tiết: TSK-1.4 - Mời nhân viên qua Email
## Phân hệ: Quản trị doanh nghiệp & Nhân sự (User Management - Sprint 1)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng luồng mời nhân sự tham gia hệ thống tự động và bảo mật. Cho phép Quản trị viên mời nhân sự mới bằng cách điền thông tin email và gán trực tiếp vào một phòng ban, chi nhánh cụ thể. Hệ thống xử lý hàng đợi gửi email bất đồng bộ, tạo liên kết kích hoạt an toàn có thời hạn 24 giờ.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Luồng gửi lời mời bất đồng bộ (Asynchronous Invite Loop)
Để tránh nghẽn luồng xử lý chính của API khi kết nối với máy chủ gửi thư (SMTP/Amazon SES), toàn bộ tiến trình gửi email được thực hiện bất đồng bộ thông qua hàng đợi **BullMQ (Redis)**:

```text
[Admin (Gửi lời mời)] ──► API: /org/users/invite 
                               │
                               ▼
            [Lưu DB: users (status: Pending)]
                               │
                               ▼
        [Đẩy Job vào Redis Queue: email-queue (BullMQ)]
                               │
                               ▼
         [Worker lấy Job & Gửi email qua Amazon SES]
                               │
                               ▼
        [Nhân viên nhận Mail chứa Link kích hoạt có Token]
```

#### 2.2 Đặc tả Token kích hoạt (Activation Token)
* Token được tạo ngẫu nhiên dưới dạng chuỗi bảo mật mã hóa chứa thông tin: `user_id` và thời hạn hết hạn (`expire_at` sau 24 giờ).
* Token được lưu trong bảng `user_activation_tokens` để đối soát. Khi người dùng nhấp vào link và thiết lập mật khẩu thành công, Token lập tức bị hủy (Single-use Token).

#### 2.3 Đặc tả API endpoint liên quan
Tham chiếu chi tiết trong [api_overview.md](../../03_functional/api_overview.md).

* **`POST /api/v1/org/users/invite`** (Yêu cầu quyền Admin)
  - **Payload yêu cầu:**
    ```json
    {
      "email": "staff@gotech.com",
      "firstName": "Nguyễn Văn",
      "lastName": "B",
      "departmentId": "uuid-phong-sales",
      "roleId": "uuid-role-employee"
    }
    ```
* **`POST /api/v1/auth/activate`** (Public - Dùng khi nhân viên thiết lập mật khẩu từ email)
  - **Payload yêu cầu:**
    ```json
    {
      "token": "secure-activation-token-string",
      "password": "NewSecurePassword123!"
    }
    ```

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: Triển khai hàng đợi BullMQ & Mailer Module**
  - Cài đặt `@nestjs/bullmq` và cấu hình kết nối Redis.
  - Viết `EmailConsumer` (Worker) xử lý job gửi thư. Tích hợp NodeMailer kết nối với Amazon SES hoặc dịch vụ SMTP.
  - Thiết kế Email template HTML đẹp, hiển thị đúng logo công ty của tenant và hỗ trợ đa ngôn ngữ.
* **Nhiệm vụ 2: Viết APIs mời và kích hoạt tài khoản**
  - Viết logic tạo tài khoản user trạng thái `Pending`.
  - Viết logic xác thực token kích hoạt, cho phép cập nhật `password_hash` và đổi trạng thái user thành `Active`.

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Form mời nhân viên & Màn hình danh sách**
  - Xây dựng form mời nhân sự trên giao diện quản trị, gán phòng ban bằng Dropdown chọn từ sơ đồ cây của TSK-1.3.
  - Sử dụng các UI components chuẩn từ thư viện dùng chung **`open-erp-ui`** đảm bảo màu sắc **Rose Gold** và hỗ trợ Light/Dark Mode.
* **Nhiệm vụ 2: Trang thiết lập mật khẩu kích hoạt**
  - Thiết kế trang `https://<subdomain>.open-erp.9ms.io.vn/activate` nhận token từ URL và hiển thị form đặt mật khẩu cho nhân sự mới.
  - Tích hợp Transloco hiển thị đầy đủ đa ngôn ngữ.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* *Lưu ý nghiệp vụ:* Đối với phiên bản MVP, tính năng mời nhân sự chỉ hỗ trợ trên phiên bản Web của Admin. Phiên bản Mobile chỉ thiết lập màn hình danh bạ nhân sự hiển thị danh sách nhân viên đã được kích hoạt hoạt động trong công ty.

#### 3.4 DevOps
* Thiết lập cấu hình Redis Cluster trong cụm Kubernetes phục vụ BullMQ.
* Gán các biến môi trường cấu hình SMTP/AWS SES Credentials vào Kubernetes Secret.

#### 3.5 QA Engineer
* Viết các kịch bản kiểm thử:
  - Gửi lời mời thành công và kiểm tra email thực tế có gửi về hòm thư hay không.
  - Sử dụng link kích hoạt đã quá 24h và kiểm tra hệ thống báo lỗi hết hạn chính xác.
  - Kích hoạt thành công, sau đó nhấp lại link cũ và xác nhận link không còn tác dụng.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)

* **Bước 1 (Hạ tầng):** Đảm bảo cụm hạ tầng PostgreSQL & Redis local đang chạy:
  ```bash
  docker compose -f ../../docker-compose.local.yml up -d
  ```
* **Bước 2 (Gỡ lỗi Queue):** Mở dự án `open-erp-services` trong VSCode, bật tab Run and Debug và chạy **"Debug NestJS Backend"**. Đặt breakpoint trong file `email.consumer.ts` để kiểm tra tiến trình nhận job gửi mail từ Redis.
* **Bước 3 (Giả lập Mail):** Nếu chạy ở local không cấu hình Amazon SES thực tế, cấu hình biến môi trường SMTP sử dụng dịch vụ giả lập mail như **Ethereal Email** hoặc **Maildev** chạy bằng Docker để bắt email debug.

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* **Kết quả bàn giao:**
  - API gửi lời mời và kích hoạt hoạt động tốt, có unit test đầy đủ (coverage > 80%).
  - Giao diện form mời và giao diện trang đặt mật khẩu trên Web hoạt động ổn định, responsive, hỗ trợ Light/Dark mode và màu Rose Gold.
  - Email gửi đi có định dạng HTML chuyên nghiệp và hiển thị đúng ngôn ngữ.
  - Toàn bộ source code được review, approve và merge vào nhánh `develop`.
