# Thiết kế kiến trúc hệ thống (System Design Overview)
## Dự án: Nền tảng SaaS quản trị doanh nghiệp hợp nhất - Enterprise SaaS Platform

---

### 1. Kiến trúc vật lý tổng quan (Physical System Architecture)
Hệ thống được thiết kế theo hướng Microservices-ready chạy trên nền tảng NestJS Microservices (`open-erp-services`), Web Client sử dụng Angular + Tailwind CSS (`open-erp-web`), và Mobile Client sử dụng Ionic App (`open-erp-mobile`). Cả hai client cùng tích hợp thư viện UI dùng chung **`open-erp-ui`** (Shared UI Library) để đảm bảo đồng bộ hóa trải nghiệm người dùng và tái sử dụng mã nguồn. Hệ thống triển khai trên nền tảng Containerization (Kubernetes) nhằm đảm bảo khả năng co giãn và chịu lỗi cao.

```
       [ Web: Angular Client ]     [ Mobile: Ionic Client ]
                 │                            │
                 └─────────────┬──────────────┘
                               ▼
                   [ Shared UI: open-erp-ui ]
                               │
                               ▼
                    [ Cloudflare CDN / WAF ]
                               │
                               ▼
                  [ Nginx Ingress Controller ]
                              │
                              ▼
                     [ API Gateway (Kong) ]
                              │
         ┌────────────────────┼────────────────────┐ (gRPC/TCP Transporter)
         ▼                    ▼                    ▼
   [ Auth Svc ]         [ Work Svc ]         [ Finance Svc ] ... (NestJS Microservices)
   (NestJS)             (NestJS)             (NestJS)
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
             [ Redis Cluster Cache ] (Sessions, Rate Limit, Event Queues, WS Adapter)
                              │
                              ▼
               [ PostgreSQL Cluster Database ] (Multi-tenant with RLS)
                              │
                              ▼
                 [ AWS S3 Object Storage ] (Tệp đính kèm phân tách thư mục)
```

#### Các thành phần chính trong kiến trúc:
* **API Gateway:** Đóng vai trò là điểm truy cập duy nhất, xử lý định tuyến (routing), xác thực JWT, ghi nhận log request ban đầu và giới hạn tần suất (Rate Limiting).
* **Ứng dụng lõi (NestJS Backend Microservices):** Các microservice nghiệp vụ được phát triển bằng NestJS trong repository `open-erp-services`. Các dịch vụ giao tiếp nội bộ qua gRPC hoặc NestJS TCP Transporter để đạt hiệu năng cao và độ trễ thấp.
* **Cơ sở dữ liệu (Primary Database):** Sử dụng hệ quản trị cơ sở dữ liệu PostgreSQL. Cấu hình Cluster dạng Master-Slave với cơ chế Read-Write Splitting (Ghi dữ liệu vào Master, Đọc dữ liệu từ Slave) để tối ưu hiệu năng.
* **Web Frontend (Angular + Tailwind CSS):** Ứng dụng Web quản trị tối giản, mật độ cao hiển thị trong repo `open-erp-web`.
* **Mobile Frontend (Ionic + Angular):** Ứng dụng di động đa nền tảng (iOS/Android) trong repo `open-erp-mobile` dùng chung logic Angular và CSS Tailwind.

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

#### 3.3 Dịch vụ kết nối thời gian thực & thông báo (Real-time & Notification Engine)
* **Giao thức kết nối thời gian thực:**
  - **WebSockets (Socket.io/WS):** Sử dụng cho chức năng Chat trực tuyến (Chat Svc), thông báo tức thời (In-app notification) và cập nhật đồng thời trạng thái công việc (Real-time collaborative editing). WebSocket Servers sử dụng **Redis Pub/Sub Adapter** làm message broker để đồng bộ sự kiện giữa các pod khi hệ thống co giãn ngang (horizontal scaling).
  - **Server-Sent Events (SSE):** Sử dụng làm kênh truyền tải thông báo một chiều (unidirectional stream) từ máy chủ đến trình duyệt đối với các tác vụ có tải nhẹ, giúp tối ưu hóa kết nối di động mà không cần duy trì kết nối WebSocket hai chiều đầy tải.
  - **gRPC Streaming:** Sử dụng cho giao tiếp thời gian thực, đồng bộ dữ liệu nội bộ giữa các microservice (Auth, Work, Finance Svc) nhằm tối thiểu hóa độ trễ (latency < 10ms).
* Đối với email/SMS, tin nhắn sẽ được đẩy vào hàng đợi Redis Queue (BullMQ) để xử lý bất đồng bộ, tránh nghẽn luồng xử lý API chính.

#### 3.4 Kiến trúc Client UI & Đa ngôn ngữ (i18n & Theme Architecture)
* **Đa ngôn ngữ với Transloco:** Client Web (`open-erp-web`) và Mobile (`open-erp-mobile`) sử dụng thư viện **Transloco** (`@ngneat/transloco`) làm công cụ chính để tải động và dịch nhãn (labels) trên giao diện. Các tệp dịch JSON được phân cấp và lưu tại assets: tiếng Việt (`vi`), tiếng Anh (`en`), tiếng Trung (`zh`), tiếng Nhật (`ja`).
* **Hỗ trợ Đa chế độ hiển thị (Light & Dark Mode):** Sử dụng Tailwind CSS với cấu hình `class` kết hợp với CSS Variables. Giao diện có thể chuyển đổi tức thì từ Light Mode (nền sáng ngọc trai `#F8FAFC`) sang Dark Mode (nền Slate sẫm `#0F172A`) bằng cách thêm/bớt class `dark` ở thẻ `<html>`.
* **Theme chủ đạo Rose Gold:** Áp dụng bảng màu Rose Gold (`#B76E79`) cho tất cả các UI components chính trong thư viện dùng chung `open-erp-ui`.

---

### 4. Kiến trúc lưu vết & Bảo toàn dữ liệu theo Snapshot (Entity Snapshot Architecture)
Nhằm đảm bảo hệ thống có khả năng lưu vết lịch sử xử lý và vận hành ổn định qua nhiều phiên bản nâng cấp phần mềm (khi cấu trúc sản phẩm, đơn giá, thuế suất hoặc quy trình thay đổi), hệ thống áp dụng cơ chế **Transactional Snapshot**:

```
[ Thực thể gốc (e.g. Product, Employee) ]
               │
               ├─► Cập nhật thông tin (Đổi đơn giá/Lương) ──► (Ghi đè bản ghi gốc)
               │
               ▼ (Tại thời điểm phát sinh giao dịch)
[ Tạo giao dịch (e.g. Hóa đơn, Bảng lương, Đề xuất) ]
               │
               ▼
[ Bảng Snapshot Dữ liệu (e.g. Invoice_Item_Snapshot) ] ──► Lưu trữ JSON snapshot của bản ghi gốc
                                                            (Bảo toàn trạng thái cũ mãi mãi)
```

#### Quy tắc thiết kế:
1. **Immutable Transactions (Giao dịch bất biến):** Các thực thể tài chính, công phép, lương thưởng không chỉ tham chiếu bằng khóa ngoại (Foreign Key) đơn thuần đến danh mục gốc. Tại thời điểm phát sinh giao dịch (e.g. chốt hóa đơn, duyệt nghỉ phép), toàn bộ trạng thái dữ liệu liên quan được chụp lại dưới dạng cấu trúc JSONB hoặc copy hoàn toàn sang một bảng snapshot chuyên biệt (ví dụ: `invoice_items` chứa bản sao tên sản phẩm, giá bán, thuế suất tại thời điểm xuất hóa đơn).
2. **Versioned Tables (Bản ghi phân cấp phiên bản):** Đối với các thực thể thay đổi theo thời gian (như hợp đồng lao động, chính sách lương), hệ thống sử dụng thiết kế **SCD Type 2 (Slowly Changing Dimensions)** hoặc lưu trữ `version_number` kết hợp mốc hiệu lực `effective_start` và `effective_end`. Hệ thống có thể chạy tính toán ngược lại bất kỳ thời điểm nào trong quá khứ một cách chính xác mà không bị ảnh hưởng bởi dữ liệu cập nhật hiện tại.

---

### 5. Thiết kế Bộ Tích Hợp Hóa Đơn Điện Tử (E-Invoice Integration Adapter)

Để tránh phụ thuộc trực tiếp vào API của một nhà cung cấp đơn lẻ và hỗ trợ tích hợp linh hoạt nhiều đối tác (MISA, VNPT, Viettel, BKAV...) trên cùng một hạ tầng SaaS, hệ thống triển khai kiến trúc **E-Invoice Integration Adapter**:

```
                 [ Finance Service (NestJS Core) ]
                                 │
                     (Dùng chung Interface)
                                 │
                                 ▼
                     [ EInvoiceAdapterFactory ]
                                 │
            ┌────────────────────┼────────────────────┐
            ▼                    ▼                    ▼
   [ MisaInvoiceAdapter ] [ VnptInvoiceAdapter ] [ ViettelInvoiceAdapter ]
            │                    │                    │
            ▼ (REST/SOAP API)    ▼ (REST/SOAP API)    ▼ (REST/SOAP API)
   [ MISA meInvoice API ] [ VNPT Invoice API ]   [ Viettel SInvoice API ]
```

* **EInvoiceAdapterFactory:** Đóng vai trò là Class khởi tạo adapter động. Khi hệ thống xử lý giao dịch cho một Tenant, Factory sẽ đọc bảng `einvoice_configurations` để lấy cấu hình của Tenant đó (API Endpoint, API Key, Token, Client Certificate) và khởi tạo Adapter tương ứng.
* **Cơ chế Hàng đợi & Retry (Resilience Pattern):** Các yêu cầu gửi phát hành được chuyển đổi thành Job đẩy vào **Redis BullMQ**.
  - Nếu gặp lỗi kết nối (Timeout, Gateway Error): Queue tự động retry tối đa 3 lần với cơ chế giãn cách số mũ (Exponential Backoff).
  - Nếu gặp lỗi dữ liệu (ví dụ MST khách hàng không tồn tại): Job lập tức dừng lại, ghi nhận trạng thái lỗi vào `einvoice_integration_logs` và gửi WebSocket notification về cho Kế toán.


