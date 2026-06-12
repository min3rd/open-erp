# Tài liệu kỹ thuật chi tiết: TSK-0.3 - Thiết kế Kiến trúc & Cơ sở dữ liệu
## Phân hệ: Kiến trúc hệ thống (Solution Architecture - Sprint 0)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng tài liệu thiết kế kiến trúc hệ thống tổng thể, thiết lập cơ cấu bảo mật cô lập dữ liệu cho mô hình SaaS Multi-tenant, thiết lập cơ chế kết nối thời gian thực, thiết kế cấu trúc database snapshot và đồng bộ hóa thiết kế API phục vụ cho việc phát triển trong các Sprint tiếp theo.

---

### 2. Thiết kế Kiến trúc chi tiết

#### 2.1 Kiến trúc Multi-tenant Isolation (Cô lập dữ liệu)
* **Mô hình triển khai:** Shared Database, Separate Schema/Tenant ID kết hợp với PostgreSQL Row-Level Security (RLS) để cô lập dữ liệu logic.
* **Cơ chế thiết lập tự động:**
  - Viết middleware trong NestJS để bắt header `X-Tenant-ID` hoặc phân tích thông tin subdomain từ HTTP Request.
  - Sử dụng connection pool để gán tham số phiên kết nối vào context: `SET LOCAL app.current_tenant_id = 'uuid';`.
  - Thiết lập chính sách bảo mật RLS trên database cho tất cả các bảng giao dịch:
    ```sql
    CREATE POLICY tenant_isolation_policy ON tasks 
        FOR ALL USING (tenant_id = current_setting('app.current_tenant_id'));
    ```

#### 2.2 Kiến trúc kết nối thời gian thực (Real-time Protocols)
* **WebSockets (Socket.io/WS):** Sử dụng cho hệ thống thông báo đẩy (In-app notifications) và cập nhật Kanban board tức thời. Cấu hình **Redis Adapter** để đồng bộ WebSocket events giữa các instance NestJS chạy độc lập.
* **Server-Sent Events (SSE):** Sử dụng để stream dữ liệu một chiều tải nhẹ (ví dụ: tiến trình nén file tài liệu hoặc tiến trình export dữ liệu).
* **gRPC / TCP Transporter:** Sử dụng để kết nối và trao đổi dữ liệu tốc độ cao giữa các NestJS microservices (`open-erp-services`) chạy trong cụm mạng nội bộ (Kubernetes VPC).

#### 2.3 Kiến trúc lưu vết bằng Transactional Snapshot
* Thiết kế cơ chế chụp ảnh trạng thái (Entity Snapshot) cho các bảng giao dịch tài chính, công phép, lương thưởng và phê duyệt để đảm bảo tính bất biến của dữ liệu quá khứ:
  - Sử dụng trường dữ liệu dạng `JSONB` để chụp lại toàn bộ object cấu hình (ví dụ: chụp thông tin hợp đồng lao động tại thời điểm tính lương).

---

### 3. Công việc chi tiết của Solution Architect & BE Lead
* **Nhiệm vụ 1: Thiết kế Database Schema**
  - Viết file tài liệu `docs/04_technical/data_model.md` định nghĩa đầy đủ các bảng dữ liệu cốt lõi, kiểu dữ liệu, các ràng buộc khóa ngoại (Foreign Keys), indexes để tối ưu hóa truy vấn.
* **Nhiệm vụ 2: Thiết kế API Specs**
  - Viết file tài liệu `docs/03_functional/api_overview.md` định nghĩa chuẩn URL, Header, cấu hình HTTP Status Codes, và định dạng JSON phản hồi lỗi/thành công.
* **Nhiệm vụ 3: Thiết lập sơ đồ kiến trúc**
  - Vẽ sơ đồ luồng dữ liệu vật lý và logic trong `docs/04_technical/system_design.md`.

---

### 4. Tiêu chí hoàn thành (Definition of Done - DoD)
* **Kết quả bàn giao:**
  - Tài liệu Kiến trúc hệ thống ([system_design.md](../../04_technical/system_design.md)), Mô hình dữ liệu ([data_model.md](../../04_technical/data_model.md)) và Thiết kế API ([api_overview.md](../../03_functional/api_overview.md)) được phê duyệt và lưu trữ đầy đủ trong repo.
