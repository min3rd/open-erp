# Đặc tả yêu cầu phi chức năng (Non-Functional Requirements - NFR)
## Dự án: Nền tảng SaaS quản trị doanh nghiệp hợp nhất - Enterprise SaaS Platform

---

### 1. Hiệu năng & Khả năng đáp ứng (Performance & Responsiveness)
* **Thời gian phản hồi của API (Response Time):**
  - Các API truy vấn dữ liệu thông thường (Read-only APIs): $95\%$ số request có thời gian phản hồi $< 300$ ms.
  - Các API ghi/sửa dữ liệu (Write/Update APIs): $95\%$ số request có thời gian phản hồi $< 500$ ms.
  - Các tác vụ nặng như xuất báo cáo Excel, kết xuất bảng lương hoặc tổng hợp báo cáo tài chính phải được xử lý bất đồng bộ (background jobs via BullMQ/Redis) với thời gian phản hồi phản hồi trạng thái ban đầu $< 1$ giây và hiển thị thanh tiến độ xử lý.
* **Thời gian tải trang (Page Load Time):**
  - Tải trang đầu tiên (FCP - First Contentful Paint): $< 1.5$ giây.
  - Tương tác đầy đủ (TTI - Time to Interactive): $< 2.0$ giây.
* **Tải đồng thời (Concurrency):**
  - Hệ thống lõi đáp ứng tối thiểu $10,000$ người dùng hoạt động đồng thời (Concurrent Active Users) ở giai đoạn đầu mà không bị suy giảm hiệu năng.
  - Khả năng tự động co giãn (Auto-scaling) từ 2 pod lên tối đa 10 pods ở lớp API Gateway và API Server khi CPU vượt quá $70\%$ trong 2 phút liên tiếp.

---

### 2. Bảo mật & An toàn dữ liệu (Security & Privacy)
* **Cô lập dữ liệu Multi-tenant (Data Isolation):**
  - Sử dụng cơ chế phân tách logic bằng Row-Level Security (RLS) trên PostgreSQL. Mọi câu lệnh SQL chạy từ Client API đều phải được tự động chèn thêm điều kiện ràng buộc `tenant_id = current_tenant_id()` thông qua Middleware mà không phụ thuộc vào code nghiệp vụ của lập trình viên.
  - Khóa mã hóa dữ liệu riêng biệt cho từng doanh nghiệp (KMS per-tenant) đối với các thông tin nhạy cảm (như bảng lương, thông tin cá nhân nhân viên).
* **Mã hóa dữ liệu (Encryption):**
  - *Dữ liệu truyền tải (Data-in-Transit):* Bắt buộc sử dụng giao thức HTTPS (TLS 1.3) cho tất cả các kết nối từ client đến server và kết nối nội bộ giữa các service.
  - *Dữ liệu lưu trữ (Data-at-Rest):* Mã hóa toàn bộ ổ đĩa lưu trữ database và file upload bằng thuật toán AES-256.
* **Xác thực & Ủy quyền (Authentication & Authorization):**
  - Mật khẩu người dùng được băm bằng thuật toán bcrypt với số vòng băm (work factor) tối thiểu là 12.
  - Hỗ trợ xác thực đa yếu tố (2FA) qua mã OTP (Google Authenticator/SMS) đối với tài khoản quản trị (Tenant Admin, Owner) và kế toán.
  - Thiết lập chính sách mật khẩu tối thiểu: 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt.
  - Token JWT có thời hạn hết hạn ngắn (15 phút) kết hợp với Refresh Token lưu trong Redis có cơ chế tự hủy (rotation) để ngăn ngừa đánh cắp phiên làm việc.

---

### 3. Khả năng sẵn sàng & Khắc phục sự cố (Availability & Disaster Recovery)
* **Chỉ số sẵn sàng (Availability SLA):**
  - Cam kết thời gian hệ thống hoạt động ổn định đạt mức $99.9\%$ hàng năm (tương đương tổng thời gian downtime ngoài kế hoạch không quá 8.76 giờ/năm).
* **Sao lưu dữ liệu (Backup Policy):**
  - *Sao lưu tự động hàng ngày (Daily Full Backup):* Thực hiện vào khung giờ thấp điểm (02:00 AM), lưu trữ bản sao lưu tại 2 phân vùng vật lý khác nhau (AWS S3 Cross-Region Replication).
  - *Sao lưu gia tăng (Incremental Backup):* Thực hiện mỗi 2 tiếng một lần để ghi nhận các giao dịch tài chính phát sinh.
  - Thời gian lưu trữ bản sao lưu tối thiểu là 365 ngày đối với dữ liệu giao dịch tài chính và nhân sự.
* **Chỉ số khắc phục (RPO & RTO):**
  - *RPO (Recovery Point Objective):* Khoảng thời gian mất mát dữ liệu tối đa chấp nhận được là dưới 2 giờ.
  - *RTO (Recovery Time Objective):* Thời gian tối đa để khôi phục toàn bộ hệ thống hoạt động trở lại sau thảm họa là dưới 4 giờ.

---

### 4. Khả năng mở rộng (Scalability)
* **Kiến trúc Microservices-ready:**
  - Thiết kế các module dưới dạng các package độc lập (Modular Monolith) ở giai đoạn đầu để dễ triển khai, nhưng giao tiếp qua Event Bus nội bộ (Redis/RabbitMQ) để dễ dàng tách thành các microservice riêng biệt khi hệ thống lớn mạnh (ví dụ tách riêng dịch vụ: Notification, Approval Workflow, Reporting).
* **Quản lý file tải lên (Storage Scaling):**
  - File tài liệu, ảnh sản phẩm, CV ứng viên được tải trực tiếp lên AWS S3 hoặc hệ thống lưu trữ tương thích S3 (MinIO) thông qua cơ chế Pre-signed URL để giảm tải cho API Server.

---

### 5. Khả năng giám sát & Nhật ký hoạt động (Observability & Audit Logs)
* **Nhật ký thao tác hệ thống (Audit Logs):**
  - Ghi nhận tất cả các thao tác thay đổi dữ liệu (CREATE, UPDATE, DELETE) của người dùng: Mã nhân viên, thời gian, IP, User Agent, thực thể bị tác động, giá trị trước và sau khi thay đổi.
  - Audit logs được lưu trữ trong một bảng riêng với quyền ghi duy nhất (Append-only) và không thể bị sửa/xóa bởi bất kỳ tài khoản nào kể cả Tenant Admin.
* **Hệ thống giám sát (Monitoring & Alerting):**
  - Tích hợp Prometheus để thu thập số liệu phần cứng (CPU, RAM, Disk, Network) và số liệu ứng dụng (số request, tỷ lệ lỗi 5xx).
  - Sử dụng Grafana để trực quan hóa biểu đồ sức khỏe hệ thống.
  - Thiết lập cảnh báo tự động qua Slack/Telegram khi tỷ lệ lỗi API Gateway vượt quá $2\%$ trong 1 phút hoặc dung lượng đĩa còn dưới $15\%$.
