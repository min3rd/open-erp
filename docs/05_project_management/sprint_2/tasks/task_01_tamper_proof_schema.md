# Tài liệu kỹ thuật chi tiết: TSK-2.1 - Thiết kế sơ đồ dữ liệu Workflow Engine & Chống chỉnh sửa dấu vết nhật ký
## Phân hệ: Lõi quy trình phê duyệt & Bảo mật (Workflow Engine Core - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Thiết lập cấu trúc cơ sở dữ liệu chi tiết cho lõi quy trình phê duyệt (Workflow Engine) hỗ trợ phân tách đa doanh nghiệp (SaaS Multi-tenant Isolation) và đảm bảo tính bất biến, chống giả mạo của nhật ký phê duyệt (`workflow_logs`). Triển khai thuật toán liên kết chuỗi băm (hash-chaining) để phát hiện và ngăn chặn mọi hành vi thay đổi dấu vết dữ liệu trực tiếp trong database.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Cấu trúc cơ sở dữ liệu (Database Schema)
Các bảng dữ liệu được cấu hình khóa ngoại chặt chẽ và bắt buộc chứa cột `tenant_id` để kích hoạt Row-Level Security (RLS) của PostgreSQL.

```text
┌────────────────┐       ┌──────────────────────┐       ┌────────────────────┐
│   workflows    │ ───►  │    workflow_steps    │ ───►  │   dynamic_forms    │
└────────────────┘       └──────────────────────┘       └────────────────────┘
        │                            │
        ▼                            ├────────────────────────┐
┌────────────────┐                   ▼                        ▼
│  w_instances   │       ┌──────────────────────┐   ┌────────────────────┐
└────────────────┘       │w_step_assignees(Conf)│   │ workflow_approvers │
        │                └──────────────────────┘   │  (Actual Tasks)    │
        ▼                                           └────────────────────┘
┌────────────────┐                                            ▲
│ workflow_logs  │ ───────────────────────────────────────────┘
│ (Tamper-proof) │
└────────────────┘
```

##### Bảng: `workflows` (Mẫu quy trình)
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants.id)
- `name` (VARCHAR)
- `description` (TEXT)
- `is_active` (BOOLEAN, default: true)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

##### Bảng: `workflow_steps` (Các bước cấu hình)
- `id` (UUID, PK)
- `workflow_id` (UUID, FK -> workflows.id)
- `tenant_id` (UUID, FK -> tenants.id)
- `name` (VARCHAR)
- `step_order` (INTEGER)
- `step_type` (VARCHAR) - Kiểu bước: 'START', 'APPROVAL', 'FORK', 'JOIN', 'END'
- `next_step_ids` (UUID[]) - Mảng các ID bước tiếp theo. Nếu `step_type` là 'FORK', toàn bộ các bước trong mảng sẽ được kích hoạt song song.
- `config` (JSONB) - Chứa thông tin về điều kiện rẽ nhánh (branching_rules), quy tắc đồng thuận (consensus_rules), và luật gộp nhánh song song (join_rules: ALL_BRANCHES - gộp khi tất cả nhánh xong, hoặc ANY_BRANCH - gộp khi có 1 nhánh xong).
- `form_id` (UUID, FK -> dynamic_forms.id, nullable) - Form điền thông tin tại bước này
- `template_id` (UUID, FK -> document_templates.id, nullable) - Biểu mẫu đính kèm

##### Bảng cấu hình gán việc: `workflow_step_assignees` (Mẫu phân công)
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants.id)
- `step_id` (UUID, FK -> workflow_steps.id)
- `assignee_type` (VARCHAR) - Kiểu đối tượng: 'USER', 'DEPARTMENT', 'ROLE', 'DYNAMIC' (gán động theo trường dữ liệu trong form)
- `assignee_id` (VARCHAR) - ID của người dùng, phòng ban, vai trò cụ thể hoặc biến định dạng để gán động.

##### Bảng: `dynamic_forms` (Biểu mẫu động)
Bảng này chứa thiết kế cấu trúc form động, hỗ trợ cơ chế lưu trữ nhiều phiên bản (versioning) nhằm tránh ảnh hưởng các quy trình cũ đang chạy và hỗ trợ khôi phục phiên bản trước.
- `id` (UUID, PK) - ID định danh duy nhất cho từng phiên bản form
- `tenant_id` (UUID, FK -> tenants.id)
- `form_key` (VARCHAR) - Mã khóa duy nhất định danh form không đổi (ví dụ: 'leave_request_form')
- `name` (VARCHAR) - Tên biểu mẫu hiển thị
- `version` (INTEGER, default: 1) - Phiên bản số hiệu (1, 2, 3...)
- `is_latest` (BOOLEAN, default: true) - Đánh dấu phiên bản mới nhất đang được áp dụng
- `fields` (JSONB) - Mảng cấu hình các trường (fields schema) của form
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- Ràng buộc: Unique `(tenant_id, form_key, version)`

##### Bảng: `workflow_instances` (Các lượt chạy quy trình thực tế)
- `id` (UUID, PK)
- `workflow_id` (UUID, FK -> workflows.id)
- `tenant_id` (UUID, FK -> tenants.id)
- `creator_id` (UUID, FK -> users.id)
- `status` (VARCHAR) - 'PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS'
- `current_step_ids` (UUID[]) - Mảng các ID bước đang xử lý hiện tại (hỗ trợ nhiều bước chạy song song đồng thời)
- `context_data` (JSONB) - Lưu trữ dữ liệu thu thập qua các bước (bao gồm cả form dữ liệu)
- `created_at` (TIMESTAMPTZ)

##### Bảng phân công xử lý thực tế: `workflow_approvers` (Tác vụ phê duyệt thực tế)
Bảng này lưu các tác vụ phê duyệt thực tế được sinh ra khi chạy quy trình, giúp tối ưu hóa việc tìm kiếm, lọc nhanh công việc chờ xử lý của từng cá nhân/phòng ban và lập báo cáo thống kê hiệu năng.
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants.id)
- `instance_id` (UUID, FK -> workflow_instances.id)
- `step_id` (UUID, FK -> workflow_steps.id)
- `user_id` (UUID, FK -> users.id) - Người duyệt thực tế (được phân giải từ cấu hình USER/DEPARTMENT/ROLE)
- `department_id` (UUID, FK -> departments.id, nullable) - Phòng ban của người duyệt (phục vụ lọc theo phòng ban)
- `status` (VARCHAR) - Trạng thái duyệt cá nhân: 'PENDING', 'APPROVED', 'REJECTED', 'CONSULTING'
- `assigned_at` (TIMESTAMPTZ, default: now())
- `action_at` (TIMESTAMPTZ, nullable)
- `deadline_at` (TIMESTAMPTZ, nullable) - Hạn chót người xử lý phải thực hiện (phục vụ nhắc nhở và báo cáo trễ hạn)
- `comment` (TEXT, nullable)
- `signature_id` (UUID, nullable) - Chữ ký số liên kết nếu có

##### Bảng nhật ký chống giả mạo: `workflow_logs` (Hash-chain)
Mỗi hành động trong luồng duyệt sẽ ghi một dòng nhật ký liên kết chặt chẽ với bản ghi trước đó qua hash SHA-256.
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants.id)
- `instance_id` (UUID, FK -> workflow_instances.id)
- `step_id` (UUID, FK -> workflow_steps.id, nullable)
- `action` (VARCHAR) - 'SUBMIT', 'APPROVE', 'REJECT', 'CONSULT', 'SIGN', 'FORWARD'
- `actor_id` (UUID, FK -> users.id)
- `payload` (JSONB) - Dữ liệu thực thi tại bước đó
- `timestamp` (TIMESTAMPTZ, default: now())
- `prev_hash` (VARCHAR(64)) - Mã băm của bản ghi nhật ký liền trước trong cùng `instance_id`. Bản ghi đầu tiên của instance có `prev_hash` là chuỗi 64 ký tự '0'.
- `hash` (VARCHAR(64)) - Mã băm của bản ghi hiện tại.

#### 2.2 Thuật toán Hash-chaining và Xác minh dữ liệu
Mã băm của bản ghi hiện tại được tính toán bằng NestJS backend bằng cách ghép nối và băm chuỗi (SHA-256):
```typescript
hash = SHA256(
  prev_hash + 
  tenant_id + 
  instance_id + 
  (step_id || '') + 
  action + 
  actor_id + 
  JSON.stringify(payload) + 
  timestamp.toISOString()
)
```

Khi kiểm tra tính toàn vẹn (Integrity Check), backend sẽ duyệt tuần tự từ bản ghi đầu tiên đến bản ghi cuối cùng của một instance để tính lại mã băm. Nếu phát hiện bất kỳ sự sai lệch nào (mã băm tính lại khác mã băm đã lưu), hệ thống lập tức kích hoạt cảnh báo an ninh, khóa tài khoản liên quan và gắn cờ báo động đỏ trên trang quản trị.

#### 2.3 Đặc tả API liên quan
* **`GET /api/v1/workflows/logs/:instanceId/verify`** (Internal/Admin)
  - **Phản hồi thành công (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "verified": true,
        "integrityCheckedAt": "2026-06-21T12:00:00Z",
        "logCount": 5
      }
    }
    ```
  - **Phản hồi lỗi giả mạo (400 Bad Request):**
    ```json
    {
      "success": false,
      "error": {
        "code": "SECURITY_COMPROMISED",
        "message": "Phát hiện dấu vết dữ liệu bị chỉnh sửa trái phép tại bản ghi nhật ký ID: xxx-yyy-zzz",
        "corruptedLogId": "xxx-yyy-zzz"
      }
    }
    ```

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: Thiết kế Cơ sở dữ liệu & Di chuyển (Migration)**
  - Viết file di dời schema (TypeORM Migrations) khởi tạo các bảng `workflows`, `workflow_steps`, `workflow_instances`, `workflow_logs`.
  - Cấu hình RLS trên PostgreSQL cho toàn bộ bảng.
* **Nhiệm vụ 2: Cài đặt lõi Hash-chain & Integrity Validator**
  - Viết `WorkflowLogSubscriber` hoặc Hook của TypeORM tự động tính toán `prev_hash` và `hash` khi chèn một bản ghi mới vào `workflow_logs`.
  - Viết Service hỗ trợ xác minh toàn vẹn chuỗi nhật ký cho một `instance_id`.

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ: Giao diện Lịch sử phê duyệt & Trạng thái Chứng thực**
  - Tạo component Timeline hiển thị quá trình xử lý đơn từ, tích hợp huy hiệu "Đã xác minh toàn vẹn" (màu xanh lá) hoặc "Bị thay đổi trái phép" (màu đỏ nhấp nháy) dựa trên kết quả API kiểm tra toàn vẹn chuỗi logs.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* **Nhiệm vụ: Hiển thị Timeline trên Mobile**
  - Thiết kế màn hình xem tiến trình duyệt đơn của nhân viên hỗ trợ xem chi tiết các bước đã duyệt kèm trạng thái an toàn.

#### 3.4 UI/UX Designer
* Thiết kế component Timeline lịch sử duyệt và huy hiệu chứng thực chống giả mạo trên cả Web và Mobile.

#### 3.5 DevOps
* Thiết lập cấu hình sao lưu cơ sở dữ liệu định kỳ (Database Backup) và cài đặt thông báo khẩn cấp qua Slack/Telegram khi hệ thống phát hiện lỗi kiểm tra toàn vẹn nhật ký.

#### 3.6 QA Engineer
* Viết kịch bản kiểm thử:
  - Tạo các bản ghi logs hợp lệ, chạy API verify trả về `verified: true`.
  - Can thiệp trực tiếp vào DB thay đổi giá trị một cột bất kỳ (ví dụ: đổi `action` từ 'APPROVE' thành 'REJECT') rồi chạy API verify, đảm bảo trả về mã lỗi `SECURITY_COMPROMISED`.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Bước 1 (Migration):** Chạy lệnh migration để cập nhật database local:
  ```bash
  npm run migration:run
  ```
* **Bước 2 (Unit Test DB):** Chạy file test viết riêng cho cơ chế hash-chaining:
  ```bash
  npm run test -- src/features/workflow/workflow-log.spec.ts
  ```

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* Khởi tạo đầy đủ bảng trong DB, có RLS cho từng bảng.
* Thuật toán băm và liên kết chuỗi hoạt động chính xác.
* Unit test đạt tỷ lệ bao phủ dòng lệnh > 90% đối với phần lõi tính toán hash-chain.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
*(Chưa bắt đầu)*
