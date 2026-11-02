# [ADR-S08-004] Migration luồng duyệt employee sang workflow engine (phương án C)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ADR-S08-004 / Quyết định kiến trúc / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | [CONF-S08-001](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) Q3 (APPROVED — phương án C) + §5 rủi ro, khảo sát employee approval 2026-11-02, [ANL-S08-002](../02_analysis/02_ANL-S08-002_workflow_plugin.md) §5 |
| Đọc trước / đọc tiếp | [SOL-S08-001](01_SOL-S08-001_form_workflow_architecture.md) / [DES-ARCH-S08-001](../06_designs/arch/01_DES-ARCH-S08-001_components_and_flows.md) |

## 1. Vấn đề

CONF Q3 chốt **C — migrate ngay Sprint 08**: luồng duyệt đề cập hồ sơ nhân viên (hiện chạy trong employee: `plg_employee_approval_config` 1 row/step + state machine trên `plg_employee_change_requests.current_step`) chuyển sang chạy trên workflow engine. Rủi ro cao nhất của sprint — hệ đang production, employee 1.1.23, backend Core 254/254 + employee 18/18 test PASS. Điểm yếu hiện có giúp migration có giá trị: engine chung sẽ thêm **enforce identity người duyệt, reminder/overdue, event log** — những thứ employee chưa có.

## 2. Quyết định

**UI và API shape của employee giữ nguyên; runtime duyệt chuyển hoàn toàn sang workflow engine qua internal API.**

### 2.1. Ranh giới sau migration

| Thành phần employee | Sau migration |
| :--- | :--- |
| `plg_employee_change_requests` (header) | **Giữ** — nguồn sự thật nghiệp vụ đề cập; trạng thái đồng bộ từ workflow |
| `plg_employee_approval_config` | **Bỏ dùng** — thay bằng workflow definition per tenant; migration import config cũ → definition |
| `plg_employee_change_request_steps` | **Bỏ dùng** (giữ bảng đến cutover, migration đọc rồi đánh dấu deprecated; drop ở V1.2.0 sau khi verify) |
| API `/change-requests/*` | **Giữ shape** — list/detail/withdraw như cũ; `approve`/`reject` proxy sang workflow engine; thêm trường `workflow_instance_id` vào response |
| UI (tabs requests/config, sơ đồ node) | **Giữ tương tác** — tab config chuyển thành **read-only view luồng hiện hành + link mở Workflow plugin** để chỉnh (builder chỉ ở workflow) |
| Diff apply (`applyChangeRequest`) | **Giữ ở employee** — kích hoạt bởi event `workflow.instance.completed` (subscribe qua Event Hub) |
| Self-approval guard | Chuyển xuống engine (AC-W07: chặn initiator tự duyệt) |

### 2.2. Giao tiếp employee ↔ workflow (qua Core internal, service token)

- Mở instance: `POST /api/v1/internal/workflow/instances` — payload `{definition_key: "employee-profile-change", context: {entity: "employee.ChangeRequest", aggregate_id, changes, initiator_user_id, branch_id, department_id, manager_user_id}}`.
- Action: `POST /api/v1/internal/workflow/tasks/{taskId}/actions` — `{action: APPROVE|REJECT|RETURN|REASSIGN, comment, actor_user_id}` — engine **enforce identity** (actor phải nằm trong assignee/candidates của task — vá điểm yếu hiện tại).
- Đọc tiến trình: `GET /api/v1/internal/workflow/instances/{id}` — steps + trạng thái để UI render.
- Employee subscribe `workflow.instance.completed` (Event Hub, ADR-S08-002) để áp diff + cập nhật trạng thái header.

### 2.3. Bootstrap & dữ liệu

- Workflow plugin thêm endpoint `/internal/tenant/bootstrap` (pattern `PluginTenantBootstrapService`): seed definition **`employee-profile-change`** (2 node: MANAGER_OF initiator → ROLE `TENANT_ADMIN`; khớp seed hiện tại "Quản lý trực tiếp → Theo vai trò") + đăng ký subscription.
- Migration employee V1.2.0 (chạy lúc upgrade plugin): đọc `plg_employee_approval_config` + đề xuất đang mở → sinh definition riêng nếu tenant đã chỉnh config; mở instance cho đề xuất đang `PENDING/IN_REVIEW` đúng `current_step`; **backup snapshot** trước (pattern `rollback_strategy: SNAPSHOT_RESTORE`).

### 2.4. Cutover (theo điều kiện CONF §5)

1. Dev QA: cài workflow + upgrade employee trên tenant QA; chạy regression E2E: đề xuất mới → duyệt 2 bước → hồ sơ cập nhật; đề xuất cũ import → tiếp tục duyệt đúng bước; từ chối/rút lui/đổi người duyệt.
2. Kiểm chứng "254/254 Core + employee suite mới PASS" — `ApprovalChainTest` (5 test) chuyển thành test resolve assignment của engine; thêm integration test runtime duyệt (lỗ hổng hiện tại: chưa có test DB cho approve/reject).
3. Rollback drill: snapshot tenant QA → restore; nếu blocker → lùi phương án B (employee quay lại runtime cũ, workflow tiếp tục cho form) — quyết định báo chủ dự án trước khi sửa scope.
4. Production: backup tenant thật → upgrade → smoke check 4 luồng ở mục §2.2.

## 3. Phương án loại trừ

| Phương án | Lý do loại |
| :--- | :--- |
| A — giữ luồng employee riêng | 2 hệ duyệt song song, người dùng học 2 nơi (đã loại tại CONF Q3) |
| Employee gọi trực tiếp DB workflow | Vi phạm ranh giới plugin |
| Đổi API shape employee cùng lúc | Nhân đôi rủi ro migration; shape giữ nguyên để frontend ít đổi |

## 4. Hệ quả và kiểm chứng

- (+) Một engine duyệt duy nhất cho toàn hệ thống từ Sprint 08; vá enforce identity + reminder + audit.
- (−) Employee và workflow phải release phối hợp (employee 1.2.0 yêu cầu workflow ≥ 1.0.0 — khai báo `dependencies` trong manifest).
- Kiểm chứng: regression E2E trên tenant QA theo checklist §2.4; suite mới PASS; rollback drill thành công. AC truy vết: AC-W13, AC-W05, AC-W07, AC-W09, AC-W11.
