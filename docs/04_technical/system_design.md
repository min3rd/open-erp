# Thiết kế kiến trúc hệ thống (System Design Overview)
## Dự án: Nền tảng SaaS quản trị doanh nghiệp hợp nhất - Enterprise SaaS Platform

---

### 1. Kiến trúc vật lý tổng quan (Physical System Architecture)
Hệ thống được thiết kế theo hướng Microservices-ready, triển khai trên nền tảng Containerization (Kubernetes) nhằm đảm bảo khả năng co giãn và chịu lỗi cao.

```
       [ Người dùng: Web / Mobile Clients ]
                      │ (HTTPS)
                      ▼
             [ Cloudflare CDN / WAF ]
                      │
                      ▼
         [ Nginx Ingress Controller ]
                      │
                      ▼
             [ API Gateway (Kong) ]
                      │
         ┌────────────┼────────────┐ (gRPC/HTTP-REST Internal)
         ▼            ▼            ▼
   [ Auth Svc ]  [ Work Svc ]  [ Finance Svc ] ... (Các Microservices)
         │            │            │
         └────────────┼────────────┘
                      ▼
             [ Redis Cluster Cache ] (Sessions, Rate Limit, Event Queues)
                      │
                      ▼
       [ PostgreSQL Cluster Database ] (Multi-tenant with RLS)
                      │
                      ▼
        [ AWS S3 Object Storage ] (Tệp đính kèm phân tách thư mục)
```

#### Các thành phần chính trong kiến trúc:
* **API Gateway:** Đóng vai trò là điểm truy cập duy nhất, xử lý định tuyến (routing), xác thực JWT, ghi nhận log request ban đầu và giới hạn tần suất (Rate Limiting).
* **Ứng dụng lõi (Backend Services):** Các module nghiệp vụ được phát triển độc lập. Giai đoạn 1 đóng gói dưới dạng Modular Monolith chạy trong Docker Container, sẵn sàng tách thành các microservice riêng khi lưu lượng truy cập lớn.
* **Cơ sở dữ liệu (Primary Database):** Sử dụng hệ quản trị cơ sở dữ liệu PostgreSQL. Cấu hình Cluster dạng Master-Slave với cơ chế Read-Write Splitting (Ghi dữ liệu vào Master, Đọc dữ liệu từ Slave) để tối ưu hiệu năng.

---

### 2. Chiến lược cô lập dữ liệu Multi-tenant (Data Isolation Strategy)
Chúng tôi sử dụng mô hình **Shared Database, Separate Schemas/Logical Tenant ID with Row-Level Security (RLS)** làm mặc định để tối ưu chi phí hạ tầng đối với nhóm khách hàng SMEs:

```sql
-- Kích hoạt tính năng Row-Level Security cho bảng
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách bảo mật dựa trên Tenant ID
CREATE POLICY tenant_isolation_policy ON tasks
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id'));
```

#### Cơ chế hoạt động:
1. Khi có request gửi lên, API Gateway phân tích token JWT để trích xuất `tenant_id` và gán vào session context.
2. Lớp Connection Pool trước khi thực thi câu lệnh SQL sẽ chạy lệnh thiết lập biến môi trường cho phiên kết nối: `SET LOCAL app.current_tenant_id = 'xxx'`.
3. PostgreSQL tự động lọc dữ liệu của bảng `tasks` chỉ trả về dòng có `tenant_id = 'xxx'`, ngăn ngừa tuyệt đối nguy cơ truy cập nhầm dữ liệu giữa các doanh nghiệp.
4. *Đối với khách hàng lớn (Enterprise):* Hệ thống hỗ trợ cơ chế định tuyến động (Dynamic Datasource Router) để kết nối trực tiếp đến một database vật lý độc lập (Database-per-tenant) nằm ở phân vùng riêng.

---

### 3. Thiết kế các dịch vụ dùng chung (Shared Services)

#### 3.1 Dịch vụ quy trình phê duyệt (Workflow Engine)
Hệ thống sử dụng một công cụ thực thi máy trạng thái định nghĩa trước (Database-driven Workflow Engine):
* Các bước phê duyệt được lưu dưới dạng đồ thị có hướng (Directed Acyclic Graph - DAG) trong bảng cấu hình `workflow_definitions`.
* Khi một yêu cầu được gửi lên, `workflow_instance` được tạo ra. Dịch vụ tự động quét điều kiện (ví dụ số tiền đề xuất $> 50$ triệu VND) để quyết định luồng đi tiếp theo.

#### 3.2 Dịch vụ tệp tin (File Service)
* Không lưu tệp tin trực tiếp trên máy chủ ứng dụng.
* Khi người dùng bấm tải lên, Frontend gửi yêu cầu lên API để nhận về một **Amazon S3 Pre-signed URL** có thời hạn hiệu lực ngắn (5 phút).
* Frontend tự động tải file trực tiếp từ trình duyệt lên S3 bucket của tenant nhằm tăng tốc độ tải và tiết kiệm tài nguyên máy chủ.
* Đường dẫn lưu trữ: `s3://open-erp-bucket/tenants/{tenant_id}/{module}/{year}/{month}/{file_uuid}.pdf`.

#### 3.3 Dịch vụ thông báo (Notification Engine)
* Sử dụng Socket.io (Node.js) làm WebSocket Server, kết nối với Redis Adapter để hỗ trợ gửi thông báo đa máy chủ (Multi-instance push).
* Đối với email, tin nhắn sẽ được đẩy vào hàng đợi Redis Queue (BullMQ) để xử lý bất đồng bộ, tránh nghẽn luồng xử lý API chính.
