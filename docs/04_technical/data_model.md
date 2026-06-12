# Thiết kế mô hình dữ liệu (Data Model Overview)
## Dự án: Nền tảng SaaS quản trị doanh nghiệp hợp nhất - Enterprise SaaS Platform

---

### 1. Quy chuẩn cơ sở dữ liệu chung
* **Khóa chính (Primary Key):** Sử dụng kiểu dữ liệu `UUID` (UUIDv4) cho tất cả các bảng để đảm bảo không bị xung đột khóa khi đồng bộ dữ liệu giữa các máy chủ hoặc thực hiện phân tách database sau này.
* **Cột hệ thống bắt buộc (System Audit Columns):** Tất cả các bảng nghiệp vụ bắt buộc phải chứa các cột sau để phục vụ cho cơ chế Multi-tenant và ghi nhận lịch sử thay đổi:
  - `tenant_id` UUID: Mã định danh doanh nghiệp (Khóa ngoại trỏ đến bảng `tenants`).
  - `created_at` Timestamp: Thời gian tạo bản ghi.
  - `updated_at` Timestamp: Thời gian cập nhật bản ghi gần nhất.
  - `created_by` UUID: ID người tạo bản ghi.
  - `updated_by` UUID: ID người cập nhật bản ghi gần nhất.
  - `deleted_at` Timestamp: Thời gian xóa (Nếu khác null nghĩa là bản ghi đã bị xóa - Soft Delete).
  - `version` Integer: Số phiên bản bản ghi (sử dụng cho Optimistic Locking).

---

### 2. Thiết kế chi tiết các bảng thực thể (Entities Schema)

#### 2.1 Nhóm Hệ thống & Tổ chức (System & Organization)

##### Bảng `tenants` (Thông tin doanh nghiệp)
* `id` UUID PK
* `name` Varchar(255)
* `subdomain` Varchar(100) UNIQUE
* `logo_url` Varchar(500)
* `status` Varchar(50) (Active, Suspended, Trial)
* `package_id` UUID FK
* `created_at` Timestamp

##### Bảng `users` (Tài khoản đăng nhập)
* `id` UUID PK
* `email` Varchar(255) UNIQUE
* `password_hash` Varchar(255)
* `phone` Varchar(50)
* `status` Varchar(50) (Active, Inactive, Pending)
* `tenant_id` UUID FK -> tenants.id
* `created_at` Timestamp

##### Bảng `branches` (Chi nhánh)
* `id` UUID PK
* `tenant_id` UUID FK -> tenants.id
* `name` Varchar(255)
* `address` Varchar(500)
* `phone` Varchar(50)
* `email` Varchar(255)

##### Bảng `departments` (Phòng ban)
* `id` UUID PK
* `tenant_id` UUID FK -> tenants.id
* `branch_id` UUID FK -> branches.id
* `name` Varchar(255)
* `parent_id` UUID FK -> departments.id
* `manager_id` UUID FK -> users.id

---

#### 2.2 Nhóm Nhân sự (HRM & Recruitment)

##### Bảng `employees` (Hồ sơ nhân viên)
* `id` UUID PK (Liên kết 1-1 với `users.id` nếu có tài khoản hệ thống)
* `tenant_id` UUID FK -> tenants.id
* `department_id` UUID FK -> departments.id
* `first_name` Varchar(100)
* `last_name` Varchar(100)
* `gender` Varchar(10)
* `date_of_birth` Date
* `id_card_number` Varchar(50)
* `tax_code` Varchar(50)
* `social_insurance_number` Varchar(50)
* `status` Varchar(50) (Working, Probationary, Terminated)

##### Bảng `employee_contracts` (Hợp đồng lao động)
* `id` UUID PK
* `tenant_id` UUID FK
* `employee_id` UUID FK -> employees.id
* `contract_number` Varchar(100)
* `contract_type` Varchar(50) (Indefinite, Definite, Probation)
* `start_date` Date
* `end_date` Date
* `base_salary` Decimal(18,2)
* `allowance_amount` Decimal(18,2)
* `status` Varchar(50) (Active, Expired, Terminated)

---

#### 2.3 Nhóm Sales / CRM & Marketing

##### Bảng `leads` (Khách hàng tiềm năng)
* `id` UUID PK
* `tenant_id` UUID FK -> tenants.id
* `first_name` Varchar(100)
* `last_name` Varchar(100)
* `company_name` Varchar(255)
* `email` Varchar(255)
* `phone` Varchar(50)
* `source_id` UUID FK (Nguồn lead: Website, Facebook Ads...)
* `status` Varchar(50) (New, Contacting, Opportunity, Disqualified)
* `owner_id` UUID FK -> users.id

##### Bảng `opportunities` (Cơ hội bán hàng)
* `id` UUID PK
* `tenant_id` UUID FK
* `lead_id` UUID FK -> leads.id
* `name` Varchar(255)
* `expected_revenue` Decimal(18,2)
* `probability` Integer
* `stage` Varchar(50)
* `status` Varchar(50) (Open, Won, Lost)
* `lost_reason` Text

##### Bảng `quotes` (Báo giá)
* `id` UUID PK
* `tenant_id` UUID FK
* `opportunity_id` UUID FK -> opportunities.id
* `quote_number` Varchar(100) UNIQUE
* `total_amount` Decimal(18,2)
* `discount_amount` Decimal(18,2)
* `tax_amount` Decimal(18,2)
* `status` Varchar(50) (Draft, Pending, Approved, Rejected)

##### Bảng `contracts` (Hợp đồng bán hàng)
* `id` UUID PK
* `tenant_id` UUID FK
* `opportunity_id` UUID FK -> opportunities.id
* `contract_number` Varchar(100) UNIQUE
* `sign_date` Date
* `value_amount` Decimal(18,2)
* `status` Varchar(50) (Active, Closed, Terminated)

##### Bảng `campaigns` (Chiến dịch Marketing)
* `id` UUID PK
* `tenant_id` UUID FK
* `name` Varchar(255)
* `budget` Decimal(18,2)
* `actual_cost` Decimal(18,2)
* `start_date` Date
* `end_date` Date
* `status` Varchar(50) (Planning, Active, Completed, Cancelled)

---

#### 2.4 Nhóm Tài chính - Kế toán nội bộ

##### Bảng `invoices` (Hóa đơn công nợ)
* `id` UUID PK
* `tenant_id` UUID FK
* `contract_id` UUID FK -> contracts.id (Có thể null nếu bán lẻ)
* `invoice_number` Varchar(100) UNIQUE
* `total_amount` Decimal(18,2)
* `due_date` Date
* `type` Varchar(50) (Receivable - Bán hàng, Payable - Mua hàng)
* `status` Varchar(50) (Unpaid, Partially_Paid, Paid, Overdue)

##### Bảng `payments` (Phiếu thu / Phiếu chi)
* `id` UUID PK
* `tenant_id` UUID FK
* `invoice_id` UUID FK -> invoices.id (Tham chiếu nếu thanh toán hóa đơn)
* `payment_number` Varchar(100) UNIQUE
* `amount` Decimal(18,2)
* `payment_date` Date
* `payment_method` Varchar(50) (Cash, Bank_Transfer)
* `type` Varchar(50) (Receipt - Thu, Expense - Chi)
* `status` Varchar(50) (Draft, Confirmed, Cancelled)

---

#### 2.5 Nhóm Vận hành nội bộ (Tasks, Projects, Documents & CS)

##### Bảng `projects` (Dự án)
* `id` UUID PK
* `tenant_id` UUID FK
* `name` Varchar(255)
* `status` Varchar(50) (Planning, Active, Completed)

##### Bảng `tasks` (Công việc)
* `id` UUID PK
* `tenant_id` UUID FK
* `project_id` UUID FK -> projects.id
* `title` Varchar(255)
* `assignee_id` UUID FK -> users.id
* `status` Varchar(50) (Todo, In_progress, Review, Done, Cancelled)
* `due_date` Timestamp

##### Bảng `documents` (Văn bản tài liệu)
* `id` UUID PK
* `tenant_id` UUID FK
* `title` Varchar(255)
* `doc_type` Varchar(50) (Incoming, Outgoing, Internal)
* `doc_number` Varchar(100)
* `status` Varchar(50) (Draft, In_Review, Approved, Published)

##### Bảng `document_versions` (Phiên bản tài liệu)
* `id` UUID PK
* `tenant_id` UUID FK
* `document_id` UUID FK -> documents.id
* `version_number` Integer
* `file_url` Varchar(500)
* `created_at` Timestamp

##### Bảng `tickets` (Ticket Chăm sóc khách hàng)
* `id` UUID PK
* `tenant_id` UUID FK
* `customer_id` UUID FK (Trỏ đến leads/accounts)
* `title` Varchar(255)
* `priority` Varchar(50) (Low, Medium, High, Urgent)
* `status` Varchar(50) (New, Processing, Resolved, Closed, Overdue)
* `sla_deadline` Timestamp

---

#### 2.6 Nhóm Mua hàng & Kho vật tư

##### Bảng `purchase_requests` (Yêu cầu mua hàng)
* `id` UUID PK
* `tenant_id` UUID FK
* `requester_id` UUID FK -> users.id
* `total_estimated_cost` Decimal(18,2)
* `status` Varchar(50) (Draft, Pending, Approved, Rejected)

##### Bảng `purchase_orders` (Đơn mua hàng PO)
* `id` UUID PK
* `tenant_id` UUID FK
* `request_id` UUID FK -> purchase_requests.id
* `vendor_id` UUID FK (Nhà cung cấp)
* `total_amount` Decimal(18,2)
* `status` Varchar(50) (Draft, Sent, Received, Completed)

##### Bảng `inventory_items` (Vật tư / Hàng hóa)
* `id` UUID PK
* `tenant_id` UUID FK
* `sku` Varchar(100) UNIQUE
* `name` Varchar(255)
* `unit` Varchar(50) (Cái, Bộ, Kg...)
* `minimum_stock` Integer
* `current_stock` Integer

##### Bảng `inventory_transactions` (Phiếu Nhập/Xuất kho)
* `id` UUID PK
* `tenant_id` UUID FK
* `po_id` UUID FK -> purchase_orders.id (Có thể null)
* `type` Varchar(50) (Import, Export)
* `transaction_date` Date
* `status` Varchar(50) (Draft, Completed, Cancelled)

---

#### 2.7 Nhóm Tài sản (Assets)

##### Bảng `assets` (Tài sản công ty)
* `id` UUID PK
* `tenant_id` UUID FK
* `name` Varchar(255)
* `asset_code` Varchar(100) UNIQUE
* `purchase_date` Date
* `purchase_cost` Decimal(18,2)
* `depreciation_months` Integer
* `status` Varchar(50) (Active, Assigned, Maintenance, Liquidated)
