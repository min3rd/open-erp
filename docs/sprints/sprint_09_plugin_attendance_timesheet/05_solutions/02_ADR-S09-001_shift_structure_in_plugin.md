# [ADR-S09-001] Ca làm việc: cấu trúc dữ liệu riêng trong plugin attendance

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ADR-S09-001 / Quyết định kiến trúc / Sprint 09 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) Q3/Q5 (APPROVED), [BENCH-S09-001](../03_benchmarks/01_BENCH-S09-001_attendance_timesheet_benchmarks.md) §3.3, khảo sát `CatalogTenantSeeder` (loại `SHIFT` FLAT) |
| Đọc trước / đọc tiếp | [SOL-S09-001](01_SOL-S09-001_attendance_architecture.md) / [ADR-S09-002](03_ADR-S09-002_request_forms_on_form_workflow.md) |

## 1. Vấn đề

Tính công cần ca có **cấu trúc thời gian** (giờ vào/ra, grace trước/sau, break, ca đêm qua ngày, ngưỡng OT) và **lịch gán ca** (theo phòng ban/chi nhánh + override từng nhân viên). Hiện catalog chỉ có loại `SHIFT` dạng FLAT — danh mục tên ca tenant tự nhập, không có thời gian. Ba lựa chọn: nâng cấp catalog, tạo cấu trúc trong plugin, hoặc chỉ 1 ca mặc định (bị CONF loại vì không phục vụ ca kíp).

## 2. Quyết định

**Tạo cấu trúc ca đầy đủ trong plugin attendance; catalog `SHIFT` giữ nguyên trạng thái, chỉ làm nguồn tên ca hiển thị (soft ref `catalog_shift_id`).**

### 2.1. ShiftDefinition (`plg_attendance_shift_definitions`)

| Trường chính | Ý nghĩa |
| :--- | :--- |
| `code`, `name`, `catalog_shift_id` | Định danh; tên hiển thị ưu tiên từ catalog nếu còn, fallback `name` trong plugin |
| `start_time`, `end_time` | `TIME`; `end_time <= start_time` → **ca đêm qua ngày**, công gán về ngày bắt đầu ca |
| `grace_in_minutes`, `grace_out_minutes` | Tolerance "thiên về nhân viên" (muộn/về sớm dưới ngưỡng không phạt) |
| `break_minutes` | Nghỉ giữa ca trừ khỏi giờ làm |
| `ot_grace_minutes`, `min_ot_minutes` | Tolerance "thiên về công ty" + ngưỡng OT tối thiểu (OT dưới ngưỡng không tính) |
| `working_minutes` | Giờ chuẩn 1 ca (tính công hưởng lương, cờ Half Day threshold) |
| `is_active` | Ngừng dùng ca mới, không xóa ca đã gán |

### 2.2. Lịch: template theo đơn vị + override nhân viên (effective-dated)

- `plg_attendance_shift_templates`: gán ca theo **tuần** cho `scope_type` (TENANT/BRANCH/DEPARTMENT) + `scope_id` + `effective_from/effective_to`; mỗi template có 7 ô ngày (tên ca hoặc OFF) — sinh lịch theo tuần lặp lại.
- `plg_attendance_shift_assignments`: override từng `employee_id` + `work_date` (1 dòng/ngày/người, tạo bởi HR hoặc từ đơn SHIFT_SWAP được duyệt), precedence cao hơn template.
- Resolve ca ngày D cho nhân viên E: assignment(E, D) → template theo department → template theo branch → template tenant → ca mặc định tenant (nếu cấu hình) → "chưa xác định ca" (record chờ HR — CONF E06).
- `plg_attendance_holidays`: ngày lễ theo tenant + năm (tên, ngày, lặp hằng năm tùy chọn) — không tính vắng mặt; làm thực tế ngày lễ vẫn ghi công.

## 3. Phương án loại trừ

| Phương án | Lý do loại |
| :--- | :--- |
| Nâng cấp loại `SHIFT` catalog thành cấu trúc có thời gian | Đổi nghĩa danh mục đang chạy (FLAT → có thời gian) phá dữ liệu tenant hiện có; catalog là hệ dùng chung Sprint 05, thêm schema thời gian làm catalog phình mục đích (danh mục tên) |
| 1 ca mặc định theo giờ hành chính toàn tenant | CONF Q3 đã loại — không phục vụ ca kíp/nhà máy |
| Ca định nghĩa trong organization plugin | Ca là nghiệp vụ chấm công (tính công, tolerance, OT) — đưa sang organization làm plugin HR niêm yết schema sai phạm vi; organization giữ master tổ chức |

## 4. Hệ quả và kiểm chứng

- (+) Catalog không đổi — tenant cũ không ảnh hưởng; plugin sở hữu toàn bộ ngữ cảnh tính công; 2 "nguồn sự thật" tránh được vì catalog chỉ là nhãn, plugin là cấu trúc.
- (−) Tên ca có thể lệch catalog nếu HR đổi tên catalog sau khi gán — chấp nhận: hiển thị theo soft-ref tại thời điểm đọc, record tính công lưu snapshot tên ca.
- Kiểm chứng: unit test resolve ca (4 tầng precedence + ca đêm + ngày lễ); integration test sinh lịch theo tuần + override; AC truy vết: AC-S01, AC-S02, AC-S03, AC-S04, AC-C01.
