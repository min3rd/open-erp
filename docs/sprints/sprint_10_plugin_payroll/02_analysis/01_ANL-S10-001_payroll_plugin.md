# [ANL-S10-001] Phân tích: Plugin Payroll — Quản lý & tính lương & phân tích lương

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S10-001 / Phân tích / Sprint 10 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S10-001](../01_raw_notes/01_RAW-S10-001_payroll_plugin_requirements.md) 0.1, [BENCH-S10-001](../03_benchmarks/01_BENCH-S10-001_payroll_benchmarks.md) 0.1 |
| Đọc trước / đọc tiếp | [RAW-S10-001](../01_raw_notes/01_RAW-S10-001_payroll_plugin_requirements.md), [BENCH-S10-001](../03_benchmarks/01_BENCH-S10-001_payroll_benchmarks.md) / [CONF-S10-001](../04_confirmation/01_CONF-S10-001_sprint_10_scope_and_ac.md) |

## 1. Mục đích và bối cảnh

Phân tích R1–R4 của [RAW-S10-001](../01_raw_notes/01_RAW-S10-001_payroll_plugin_requirements.md) thành user stories, quy tắc nghiệp vụ và ranh giới scope đề xuất theo bài học [BENCH-S10-001](../03_benchmarks/01_BENCH-S10-001_payroll_benchmarks.md). Plugin `payroll` (đề xuất tên) — plugin HR thứ ba: **nhận bảng công đã chốt từ attendance (S09) → tính lương theo cấu trúc cấu hình được → phiếu lương → phân tích chi phí lương**.

Phân vai: **HR/C&B** (quản trị cấu trúc, chạy kỳ lương), **Tenant Admin** (duyệt/khóa), **Manager** (báo cáo team theo scope), **Employee** (xem phiếu lương của mình, xác nhận).

## 2. User Stories

### 2.1. Quản lý cấu trúc lương

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-S01 | As an **HR/C&B**, I want **định nghĩa Salary Component (thu nhập/khấu trừ/đóng bởi công ty) với công thức + điều kiện** so that **mô hình được mọi chính sách lương không cần code lại** | Frappe/Odoo pattern |
| US-S02 | As an **HR/C&B**, I want **lắp components thành Salary Structure và gán cho nhân viên từ ngày hiệu lực** so that **mỗi nhân viên có đúng cấu trúc lương** | Effective-dated |
| US-S03 | As an **HR/C&B**, I want **quản lý quyết định lương (tăng lương/thưởng với số, ngày hiệu lực, người ký)** so that **thay đổi lương có chứng từ và audit** | VN đặc thù L07 |
| US-S04 | As an **HR/C&B**, I want **cấu hình phụ cấp cố định (ăn trưa, xăng xe, chuyên cần…)** so that **tự tính theo điều kiện đi làm** | Q9 |

### 2.2. Quy tắc pháp lý (thuế & bảo hiểm)

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-T01 | As an **HR/C&B**, I want **cấu hình biểu thuế TNCN lũy tiến theo bậc + giảm trừ bản thân/phụ thuộc + hiệu lực theo năm** so that **luật đổi chỉ cần cập nhật cấu hình** | L02 — versioned |
| US-T02 | As an **HR/C&B**, I want **cấu hình các loại bảo hiểm (NLĐ + NSDLAO) với tỷ lệ, trần, mức đóng tối thiểu theo vùng** so that **tính đúng và theo kịp thay đổi luật** | L02 |
| US-T03 | As a **System**, I want **engine thuế thuần tính theo slabs test được từng bậc** so that **kết quả khớp công cụ chuẩn VN** | BENCH L01 |

### 2.3. Chạy kỳ lương

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-R01 | As an **HR/C&B**, I want **tạo kỳ lương theo tháng + phạm vi (toàn tenant/phòng ban/nhóm NV)** so that **nhiều bảng lương song song theo mô hình** | MISA L04 |
| US-R02 | As a **System**, I want **nhận dữ liệu công đã chốt từ attendance qua event** so that **lương tính từ công chính xác không nhập tay** | L03 — event `attendance.timesheet.locked` |
| US-R03 | As an **HR/C&B**, I want **nhập đầu vào thủ công cho kỳ (thưởng, tạm ứng, khấu trừ khác, KPI)** so that **các khoản ngoài chấm công được tính** | Odoo other inputs |
| US-R04 | As a **System**, I want **chạy tính lương: gross → đóng BH → giảm trừ → thuế TNCN → net cho từng nhân viên** so that **bảng lương chính xác nhất quán** | L01 |
| US-R05 | As an **HR/C&B**, I want **rà soát/sửa từng dòng bảng lương kèm lý do trước khi duyệt** so that **xử lý ngoại lệ có audit** | |
| US-R06 | As a **Tenant Admin**, I want **duyệt bảng lương và khóa dữ liệu kỳ** so that **bảng lương sau duyệt không đổi khi chưa mở khóa** | L05 |
| US-R07 | As an **HR/C&B**, I want **chạy tính lại toàn kỳ khi cấu hình đổi giữa chừng** so that **kết quả cập nhật nhất quán** | |

### 2.4. Phiếu lương & nhân viên

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-P01 | As a **System**, I want **sinh phiếu lương (payslip) breakdown theo component cho từng nhân viên** so that **minh bạch từng khoản** | L06 |
| US-P02 | As an **Employee**, I want **xem/lưu phiếu lương PDF của mình theo tháng** so that **kiểm tra quyền lợi** | |
| US-P03 | As an **Employee**, I want **xác nhận/từ chối bảng lương của mình kèm ghi chú** so that **phát hiện sai kịp thời** | Q7 |
| US-P04 | As an **HR/C&B**, I want **theo dõi trạng thái xác nhận và được chốt khi quá hạn** so that **không kẹt deadline chi trả** | Pattern MISA |

### 2.5. Phân tích lương

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-A01 | As an **HR/Admin**, I want **dashboard chi phí lương theo thời gian/đơn vị/loại thành phần** so that **nắm chi phí nhân sự tức thời** | Deel/BambooHR |
| US-A02 | As an **HR/Admin**, I want **pay band theo chức danh/grade (trung vị, min-max, vị trí từng người)** so that **quản lý công bằng nội bộ** | L09 |
| US-A03 | As a **Manager**, I want **báo cáo chi phí lương team theo scope** so that **quản lý ngân sách nhóm** | |
| US-A04 | As an **HR/C&B**, I want **xuất dữ liệu phân tích Excel** so that **phân tích sâu ngoài hệ thống** | |

### 2.6. Tích hợp & mobile

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-I01 | As an **HR/C&B**, I want **xuất bảng lương đã duyệt ra Excel payroll-ready cho kế toán** so that **bàn giao đúng chuẩn** | L11 |
| US-I02 | As an **Employee (Mobile)**, I want **xem phiếu lương + xác nhận** so that **thao tác trên điện thoại** | Q15 |
| US-I03 | As a **System**, I want **thông báo khi bảng lương chờ duyệt/xác nhận, payslip sẵn sàng, kỳ đã khóa** so that **không bỏ sót** | Q16 |

## 3. Ranh giới scope đề xuất (chờ CONF duyệt)

### 3.1. In-Scope đề xuất

- **Cấu trúc lương**: SalaryComponent (earning/deduction/employer) với công thức + điều kiện thuần; SalaryStructure gán nhân viên effective-dated; quyết định lương (tăng lương/thưởng) đơn giản có số + ngày hiệu lực.
- **Quy tắc VN versioned**: biểu thuế slabs + giảm trừ theo năm hiệu lực; loại bảo hiểm (tỷ lệ NLĐ/NSDLAO, trần, mức tối thiểu vùng) cấu hình.
- **Chạy lương**: PayrollRun theo kỳ + phạm vi; nhận công từ attendance đã chốt qua Event Hub; đầu vào thủ công (thưởng/tạm ứng/khấu trừ); chạy gross→net; sửa dòng có audit; duyệt 1 cấp + khóa; chạy lại.
- **Payslip**: breakdown component, PDF, gửi notification, xác nhận nhân viên (quá hạn vẫn khóa).
- **Phụ cấp seed**: 6 loại (ăn trưa, xăng xe, điện thoại, chuyên cần, trách nhiệm, nhà ở) với điều kiện đi làm.
- **OT/thưởng**: OT tự nhận từ attendance (tỷ 150/200/300 + làm đêm cấu hình); thưởng nhập tay qua đầu vào.
- **Phân tích**: dashboard chi phí (thời gian/đơn vị/component) + pay band theo chức danh; xuất Excel.
- **Xuất kế toán**: Excel payroll-ready cột chuẩn.
- **Mobile**: xem payslip + xác nhận.

### 3.2. Out-of-Scope đề xuất (backlog)

- Chi trả lương qua ngân hàng / bank file; liên kết kế toán bút toán tự động; file báo cáo D02-LT/TMX61-LS; net→gross 2 chiều; pay benchmark thị trường (dữ liệu ngoài); dự báo chi phí; multi-currency; lương theo giờ ngoài VN; EOR/global payroll; tích hợp HRM ngoài (KPI/doanh số tự động).

## 4. Quy tắc nghiệp vụ đề xuất (BR)

| ID | Quy tắc | Nguồn |
| :--- | :--- | :--- |
| BR-P01 | Component có loại (EARNING/DEDUCTION/EMPLOYER_CONTRIBUTION), công thức thuần tham chiếu component khác + biến kỳ (công chuẩn, công thực, OT, số ngày làm); không circular | Frappe L01 |
| BR-P02 | Thuế/BH/tỷ lệ là dữ liệu cấu hình theo `effective_from` — job chọn bộ hiệu lực tại ngày tính; không hardcode | L02 |
| BR-P03 | PayrollRun chỉ nhận công từ timesheet trạng thái khóa của kỳ tương ứng; kỳ chưa chốt → cảnh báo, phần NV thiếu công đánh dấu chờ | L03, Sprint 09 |
| BR-P04 | Kỳ lương có chuỗi 1 chiều: Draft → Duyệt → Khóa; khóa chỉ Admin mở (audit); sau khóa payslip + export bất biến | L05 |
| BR-P05 | Quyền xem lương tách `payroll:read`; nhân viên chỉ thấy payslip của mình; mọi xem/sửa bảng lương ghi audit | L10 |
| BR-P06 | OT lương = ot_minutes từ record attendance (đã duyệt) × hệ số theo loại ngày (ngày thường/weekend/lễ) × đơn giá từ cấu trúc lương | Sprint 09 BR-A05 |
| BR-P07 | Thuế = SUM(slab) trên taxable income (gross − đóng BH NLĐ − giảm trừ); giảm trừ phụ thuộc số người phụ thuộc đăng ký | VN law |
| BR-P08 | Quyết định lương effective-dated: chỉ tác động kỳ có ngày hiệu lực; không sửa quá khứ đã khóa | L07 |
| BR-P09 | Số tiền làm tròn theo cấu hình tenant (mặc định VND làm tròn đồng); không âm net (khấu trừ vượt → dư nợ chuyển kỳ nếu cấu hình) | |
| BR-P10 | Multi-tenant: mọi bảng/job mang tenant_id đã xác thực; isolation là hạng mục nghiệm thu | Guardrail |
| BR-P11 | Sự kiện nghiệp vụ phát qua outbox (`payroll.run.locked`, `payroll.payslip.published`) cho plugin khác | Sprint 06/08/09 pattern |
| BR-P12 | Tạm ứng là PayrollInput loại trừ, có duyệt; dư nợ tạm ứng theo dõi từng nhân viên | Odoo inputs |

## 5. Edge cases cần thiết kế (bước 05–06)

| # | Tình huống | Đề xuất xử lý |
| :--- | :--- | :--- |
| E01 | Nhân viên vào/việc giữa kỳ | Lương theo ngày công thực tế; công tính từ ngày active assignment |
| E02 | Đổi cấu trúc lương giữa kỳ | Quyết định hiệu lực ngày D → kỳ chứa D tính theo 2 cấu trúc chia ngày |
| E03 | Luật thuế/BH đổi giữa năm | Bộ cấu hình effective_from; kỳ tính theo ngày đầu kỳ; chạy lại dùng bộ mới có cảnh báo |
| E04 | Nhân viên lương net (công ty chịu thuế) | Backlog (BR net→gross) — v1 ghi nhận net pay cố định, phần thuế công ty chịu làm thành phần employer; tùy Q3 |
| E05 | Phụ thuộc thay đổi giữa kỳ | Số phụ thuộc lấy theo thời điểm tính; quyết định ở bước 06 |
| E06 | Kỳ lương chạy 2 lần trong tháng | PayrollRun nhiều lần per period; bảng chi tiết → tổng hợp cuối kỳ |
| E07 | Thuế âm (không đủ giảm trừ) | Thuế = 0, không hoàn ở v1 (backlog hoàn thuế cuối năm) |
| E08 | Chạy lại sau khi đã duyệt | Admin mở khóa (audit) → tính lại → duyệt lại; payslip cũ hủy phiên bản |
| E09 | Attendance chưa chốt kỳ nhưng cần tính lương | Cảnh báo + đánh dấu NV thiếu công; HR chốt attendance hoặc nhập tay qua PayrollInput |
| E10 | Tenant nhiều đồng tiền | V1: 1 đồng tiền/tenant (VND); multi-currency backlog |

## 6. Câu hỏi chuyển sang CONF

16 câu hỏi tại [RAW-S10-001 §6](../01_raw_notes/01_RAW-S10-001_payroll_plugin_requirements.md) chuẩn hóa thành 16 câu tương tác tại [CONF-S10-001](../04_confirmation/01_CONF-S10-001_sprint_10_scope_and_ac.md), 4 nhóm: (A) cấu trúc & nguồn dữ liệu — Q1–Q4, (B) kỳ & quy trình — Q5–Q8, (C) thành phần tính — Q9–Q12, (D) phân tích & tích hợp — Q13–Q16.

Rủi ro kiến trúc cần chủ dự án lưu ý:
- **Q16 (tích hợp attendance)**: Sprint 09 đang code — event `attendance.timesheet.locked` đã thiết kế nhưng plugin chưa release; v1 cần cơ chế nhận dữ liệu dự phòng (import công) khi attendance chưa sẵn sàng.
- **Q1 (formula engine)**: công thức lương là bề mặt cấu hình mạnh — cần sandbox/parser có test để tránh công thức gây lỗi kỳ lương.
- **Q4 (thuế/BH 2026)**: biểu thuế hiệu lực 2026 cần kiểm chứng pháp lý trước khi seed dữ liệu mặc định.

## 7. Lịch sử

| Phiên bản | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Bản nháp đầu tiên: 21 US, scope đề xuất, 12 BR, 10 edge case, ánh xạ 16 câu hỏi CONF |
