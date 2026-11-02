# [ADR-S09-002] Đơn từ: RequestType gắn form builder + workflow engine Sprint 08 (có fallback nội bộ)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ADR-S09-002 / Quyết định kiến trúc / Sprint 09 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) Q9/Q17/Q18 (APPROVED, rủi ro §5.1), khảo sát scaffold `plugins/form`, `plugins/workflow` (`FormDefinition`, `WorkflowDefinition`, `WorkflowNodeTypes`, `ExpressionEvaluator`), Event Hub đã implement |
| Đọc trước / đọc tiếp | [SOL-S09-001](01_SOL-S09-001_attendance_architecture.md) / [ADR-S09-003](04_ADR-S09-003_attendance_calculation_engine.md) |

## 1. Vấn đề

CONF chốt module Đơn từ: 6 loại chuẩn + tenant tự tạo loại mới; mẫu đơn thiết kế bằng **form builder Sprint 08**, duyệt bằng **workflow engine Sprint 08**. Nhưng cả 2 plugin đang **Design In Review** — Sprint 09 phải phụ thuộc hợp đồng chưa chốt (CONF rủi ro lớn nhất §5.1). Cần kiến trúc tách được phần nghiệp vụ attendance (mapping kết quả duyệt) khỏi phần duyệt (engine), với phương án fallback khi engine chưa release.

## 2. Quyết định

**Attendance sở hữu `RequestType` + `Request` (dữ liệu nghiệp vụ + mapping); ủy thác template cho form builder và duyệt cho workflow engine qua hợp đồng đã thấy trong scaffold; fallback duyệt 1 cấp nội bộ giữ nguyên schema khi engine chưa sẵn sàng.**

### 2.1. RequestType (`plg_attendance_request_types`)

| Trường chính | Ý nghĩa |
| :--- | :--- |
| `code` | Seed 6 loại: `LEAVE`, `OVERTIME`, `ATTENDANCE_FIX`, `LATE_EARLY`, `BUSINESS_TRIP`, `SHIFT_SWAP`; loại tenant tự tạo prefix `X_` |
| `name`, `is_active`, `is_system` | 6 loại chuẩn `is_system=true`, tenant bật/tắt chứ không xóa |
| `form_definition_ref` | JSON `{plugin: "form", definition_slug/id}` — mẫu đơn điền khi nộp (pin `form_version` khi nộp) |
| `workflow_definition_key` | Key của workflow definition (seed `attendance-request-<code>` 1 cấp MANAGER_OF, fallback HR — tenant chỉnh thêm cấp trên engine) |
| `status_mapping` | JSON khai báo mapping kết quả duyệt → dữ liệu attendance; 6 loại chuẩn có mapping cứng đã định nghĩa; loại tùy chỉnh mapping rỗng (chỉ duyệt + lưu kết quả) |
| `window_days` | Cửa sổ nộp (số ngày lùi tối đa) — theo CONF AC-R01 |

### 2.2. Request (`plg_attendance_requests`) và luồng

1. Nhân viên nộp: attendance lưu request (`response` JSONB pin `form_version`, `subject_employee_id`, kỳ đã kiểm tra BR-A09/AC-Đ06) → gọi workflow internal API mở instance (payload kèm `request_id`).
2. Duyệt: engine resolve assignee (MANAGER_OF đọc tổ chức; fallback HR theo seed definition) → task inbox → hành động theo engine.
3. Kết quả: attendance **subscribe** `{"source": "workflow", "event": "workflow.instance.completed"}` trong manifest (Event Hub fan-out — đã implement) → consume: nếu APPROVED → chạy `status_mapping` (LEAVE→ledger + công ngày; OVERTIME→`plg_attendance_ot_windows`; ATTENDANCE_FIX→log bổ sung; LATE_EARLY→ghi chú record; BUSINESS_TRIP→Business Trip; SHIFT_SWAP→`plg_attendance_shift_assignments`); idempotent theo `request_id`.
4. Timeline/estado hiển thị theo workflow instance (AC-Đ05); attendance chỉ giữ trạng thái tổng (PENDING/APPROVED/REJECTED/CANCELLED).

### 2.3. Fallback khi engine chưa release (điều kiện CONF §5.1)

- Trigger quyết định: **trước khi code ticket đơn từ**, nếu Sprint 08 chưa qua Design approved → attendance chạy fallback: node duyệt 1 cấp nội bộ (`approver_employee_id` = manager từ assignment, fallback HR; hành động Duyệt/Từ chối kèm lý do; event log trong plugin).
- Schema tương thích: `workflow_instance_id` nullable, `status_mapping` không đổi, request flow giữ nguyên → khi engine release chỉ đổi phần "mở instance" + consume event, không migration dữ liệu.
- Fallback là **kế hoạch B ghi nhận**, không phải scope mới — chuyển về phương án này phải báo chủ dự án theo CONF §5.1.

## 3. Phương án loại trừ

| Phương án | Lý do loại |
| :--- | :--- |
| Builder loại đơn tự viết trong attendance (Q18 bị loại) | CONF đã chọn form builder Sprint 08; tự viết trùng lặp engine + form đã có |
| Đơn từ nằm trong plugin workflow | Mapping attendance (ledger, ot_windows, công ngày) là nghiệp vụ chấm công — workflow giữ engine thuần, không biết attendance schema |
| Lưu response đơn trong bảng form responses của plugin form | Đơn gắn employee + kỳ + mapping — cần query theo nghiệp vụ HR; form response là dữ liệu điền chung không có ngữ cảnh attendance |
| Chờ Sprint 08 release rồi mới bắt đầu module đơn từ | Chặn sprint; fallback 2.3 cho phép chạy song song an toàn |

## 4. Hệ quả và kiểm chứng

- (+) Mapping tách khỏi engine — engine đổi contract chỉ sửa adapter "mở instance + consume event"; loại tùy chỉnh mở rộng không đụng code nghiệp vụ (mapping rỗng); 6 loại chuẩn dùng chung một lõi.
- (−) Phụ thuộc 2 plugin Sprint 08 ở luồng duyệt (chấp nhận có fallback); event fan-out là best-effort — consume phải idempotent và có job đối soát instance "completed nhưng chưa mapping".
- Kiểm chứng: integration test nộp đơn → instance → event → mapping (mỗi loại chuẩn 1 test); fallback path test riêng; đối soát idempotency khi event retry. AC truy vết: AC-Đ01…Đ06, AC-R01…R04, AC-L03/L04.
