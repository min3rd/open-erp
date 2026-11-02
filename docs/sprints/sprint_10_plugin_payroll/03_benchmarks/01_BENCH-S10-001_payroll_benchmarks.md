# [BENCH-S10-001] Đối chuẩn: Payroll — Quản lý & tính lương & phân tích lương

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BENCH-S10-001 / Đối chuẩn / Sprint 10 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S10-001](../01_raw_notes/01_RAW-S10-001_payroll_plugin_requirements.md) 0.1 (R4) |
| Đọc trước / đọc tiếp | [RAW-S10-001](../01_raw_notes/01_RAW-S10-001_payroll_plugin_requirements.md) / [ANL-S10-001](../02_analysis/01_ANL-S10-001_payroll_plugin.md), [CONF-S10-001](../04_confirmation/01_CONF-S10-001_sprint_10_scope_and_ac.md) |

## 1. Mục đích và bối cảnh

Trả lời câu hỏi R4 của chủ dự án: **các đối thủ xử lý payroll (quản lý cấu trúc lương, tính lương, tuân thủ thuế/bảo hiểm, phiếu lương, phân tích lương) như thế nào**. Phạm vi 2 nhóm: (a) payroll engine quốc tế — mô hình cấu trúc lương linh hoạt; (b) thị trường Việt Nam — gross/net, thuế TNCN, BHXH, quyết định lương, liên thông chấm công–kế toán; kèm nhóm công cụ phân tích lương (compensation analytics).

## 2. Danh sách sản phẩm đối chuẩn

| # | Sản phẩm | Phân khúc | Nguồn |
| :--- | :--- | :--- | :--- |
| 1 | Odoo Payroll | ERP modular, localization theo quốc gia | [Odoo Payroll](https://www.odoo.com/app/payroll-features), [Salaries docs](https://www.odoo.com/documentation/master/applications/hr/payroll/salaries.html) |
| 2 | Frappe HR / ERPNext Payroll | HRM mã nguồn mở | [Payroll](https://frappe.io/hr/payroll), [Salary Component docs](https://docs.frappe.io/hr/salary-component), [docs Salary Structure](https://docs.frappe.io/hr/salary-structure-and-payroll) |
| 3 | BambooHR (Payroll + Compensation) | HRM SaaS Mỹ | [Compensation](https://www.bamboohr.com/platform/compensation/) |
| 4 | Deel (Compensation analytics) | Global payroll/EOR | [Compensation](https://www.deel.com/solutions/compensation/), [Dashboards](https://help.letsdeel.com/hc/en-gb/articles/19027627693713-Analytics-Dashboards-Overview) |
| 5 | Payscale | Pay equity & benchmark chuyên sâu | [Best Pay Equity 2026](https://peoplemanagingpeople.com/tools/best-pay-equity-software/) |
| 6 | MISA AMIS Tiền lương | HRM Việt Nam #1 | [Lập bảng lương](https://helpamis.misa.vn/amis-tien-luong/kb/lap-bang-luong/), [AMIS Kế toán — Tiền lương](https://helpact.misa.vn/kb/tien-luong/) |
| 7 | 1Office Tính lương | HRM Việt Nam | [Tính lương](https://1office.vn/tinh-luong), [Công-Ca-Lương](https://1office.vn/cong-ca-luong) |
| 8 | Vi-Office Lương | HRM Việt Nam | [HRM Payroll](https://vi-office.com/product/hrm-payroll) |
| 9 | Công cụ gross-net VN (thuvienphapluat, taichinhpro, thuevietnam…) | Compliance calculator chuẩn thị trường | [Tính lương gross net 2026](https://taichinhpro.com/cong-cu/tinh-luong-gross-net) |
| 10 | Cộng đồng bảng lương Excel VN | Nghiệp vụ thực tế C&B VN | [Sheet.com.vn — tính lương tự động](https://sheet.com.vn/blog/tinh-luong-tu-dong-bang-google-sheets-huong-dan-chi-tiet) |

## 3. Phân tích theo chủ đề

### 3.1. Cấu trúc lương: component + formula là chuẩn ngành

- **Frappe**: `Salary Component` (earning/deduction/employer contribution) với **công thức + điều kiện** (VD `BS * 0.12`, tham chiếu `gross_pay`); components lắp thành `Salary Structure`; gán qua `Salary Structure Assignment`; tính theo ngày công thực tế, rounding, amount-in-total rules. Tax: **multiple tax slabs** có rate + điều kiện, tối thiểu/tối đa taxable.
- **Odoo**: 6 yếu tố xác định lương — **structure types → structures → rules → rule parameters → categories → input types**; "other inputs" cho khoản ngoài chu kỳ; **country localization** cài sẵn luật từng nước; **batches** payslips theo kỳ + cấu trúc.
- **MISA/1Office/Vi-Office VN**: "quy định lương, bảo hiểm, thuế TNCN" là bước cấu hình đầu tiên; bảng lương là **bảng cột** (lương cơ bản, phụ cấp, OT, thưởng, khấu trừ, thực nhận) nhưng nội dung tính theo công thức cấu hình được.
- **Bài học**: một lõi **component + công thức thuần** là cần và đủ; bảng cột chỉ là **view** trên components.

### 3.2. Luồng chạy lương (payroll run)

| Bước | MISA AMIS | Frappe/Odoo |
| :--- | :--- | :--- |
| 1. Chuẩn bị | Quy định lương/BH/thuế; nhận bảng tổng hợp chấm công | Salary structure assignment; work entries |
| 2. Chạy | Bảng lương **chi tiết** từng kỳ (nếu nhiều kỳ) → **bảng lương tổng hợp** | "Get Employees" theo filter (dept/branch/structure) → payslips; batch |
| 3. Duyệt | Kiểm tra → xác nhận bảng lương | Validate → Submit payslips → Confirm batch |
| 4. Chi trả | Chuyển kế toán/quyết định chi | Payment entries; bank file |

- MISA cho phép **nhiều bảng lương song song** theo nhóm nhân sự/phòng ban/mô hình tính (1Office tương tự: "tạo không giới hạn các loại bảng lương").
- **Attendance là nguồn công**: MISA "lấy dữ liệu từ AMIS Chấm công đưa vào bảng lương"; Sprint 09 đã thiết kế event `attendance.timesheet.locked` cho đúng mục đích này.

### 3.3. Tuân thủ Việt Nam (2026 — cần kiểm chứng pháp lý khi triển khai)

Tổng hợp từ các công cụ gross-net chuẩn thị trường (đều 2025–2026):

| Hạng mục | Giá trị tham chiếu 2026 | Nguồn |
| :--- | :--- | :--- |
| Thuế TNCN | Lũy tiến 7 bậc 5%–35% (một số công cụ mới nhắc biểu 5 bậc theo Luật TNCN 2025 — **cần kiểm chứng pháp lý**) | thuevietnam.org, sheet.com.vn |
| Giảm trừ gia cảnh | **15.5 triệu/tháng bản thân, 6.2 triệu/phụ thuộc** (NQ 110/2025/UBTVQH15) | thuvienphapluat, KTHDIGI |
| BH phía NLĐ | **10.5%** (BHXH 8% + BHYT 1.5% + BHTN 1%) trên mức đóng | taoclip, sheet.com.vn |
| BH phía NSDLAO | Khác (≈21.5% tổng; từng loại riêng — cấu hình được) | các công cụ trên |
| Trần/mức đóng | Theo mức lương tối thiểu vùng + trần đóng BHXH (cấu hình) | gross-net tools |
| OT | 150% ngày thường / 200% ngày nghỉ tuần / 300% ngày lễ; làm đêm +30% | sheet.com.vn, Bộ luật Lao động |
| Kỳ lương | Tháng; lương ngày công từ chấm công; lương tháng 13/thưởng | MISA, các mẫu Excel |

- **Bài học bắt buộc**: mọi tỷ lệ/threshold là **dữ liệu cấu hình versioned** (luật thay đổi hằng năm) — không hardcode; công thức thuế là engine riêng có test theo từng bậc.
- MISA còn **kết nối AMIS Thuế TNCN** sinh chứng từ khấu trừ và **hạch toán chi phí lương** sang AMIS Kế toán — cho thấy chuẩn kỳ vọng: payroll xuất cho kế toán ở 2 dạng (bút toán + file).

### 3.4. Phiếu lương & xác nhận

- Frappe: `Salary Slip` per employee per period, breakdown theo component, submit/confirm; gửi PDF.
- Odoo: payslip PDF từ batch, công bố cho nhân viên qua portal.
- MISA/1Office VN: bảng lương gửi nhân viên xác nhận (như bảng công — norm xác nhận kỳ đã thấy ở Sprint 09 BENCH).

### 3.5. Quyết định lương (VN đặc thù)

- 1Office/MISA: **quyết định lương/thưởng/lại** là chứng từ riêng có số, ngày hiệu lực, người ký — làm thay đổi lương cấu trúc từ một thời điểm (effective-dated, giống pattern assignment của employee plugin).
- Frappe: thay đổi lương qua sửa Salary Structure Assignment (effective_from) — không có khái niệm "quyết định" riêng.

### 3.6. Phân tích lương (compensation analytics)

| Sản phẩm | Công cụ |
| :--- | :--- |
| BambooHR | Compensation: pay equity, tự động review lương, salary bands, lịch tăng lương |
| Deel | Dashboard 6 nhóm: Total Compensation, Total Payroll, Compensation by Country/Job Type, Average Compensation, Pay Gap; filter đa chiều |
| Payscale | Benchmark thị trường, pay equity monitoring, reporting chuyên sâu |
| MISA/1Office | Tổng hợp chi phí lương theo đơn vị/tháng, so sánh kỳ, thống kê BHXH |

- **Bài học**: v1 nên có (a) **dashboard chi phí lương** (theo thời gian/đơn vị/loại thành phần), (b) **pay band & so sánh nội bộ** (trung vị theo chức danh/grade, khoảng cách từng người); benchmark thị trường ngoài cần **dữ liệu ngoài** — để sau; dự báo chi phí là nâng cao.

### 3.7. Bảo mật dữ liệu lương

- Tất cả sản phẩm tách quyền "xem lương người khác" khỏi quyền HR thông thường; payslip cá nhân chỉ người đó thấy; audit mọi lần xem/sửa bảng lương. Với open-erp: quyền `payroll:read` tách khỏi `employee:profile:read`; bảng lương chốt khóa như timesheet.

## 4. Bảng tổng hợp tính năng

| Tính năng | Odoo | Frappe | Bamboo | Deel | MISA | 1Office | Vi-Office |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| Component + công thức | ✅ | ✅ | ⭕ | ⭕ | ✅ | ✅ | ✅ |
| Cấu trúc gán theo NV | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Nhiều bảng lương/kỳ | ✅ batch | ⭕ | ⭕ | ✅ | ✅ | ✅ | ✅ |
| Nhận công từ attendance | ✅ work entries | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| Thuế lũy tiến slabs | ✅ local | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gross/net 2 chiều | ⭕ | ⭕ | — | ✅ | ✅ | ✅ | ✅ |
| Bảo hiểm/phần DN | ✅ local | ✅ employer | ✅ | ✅ | ✅ | ✅ | ✅ |
| Payslip PDF | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Xác nhận lương NV | ⭕ | — | ⭕ | ✅ | ✅ | ✅ | ✅ |
| Quyết định lương | — | — | ✅ comp review | — | ✅ | ✅ | ✅ |
| Tạm ứng/other inputs | ✅ | ✅ | ⭕ | ✅ | ✅ | ✅ | ✅ |
| Hạch toán kế toán | ✅ | ✅ | ✅ | — | ✅ | ✅ | ⭕ |
| Analytics chi phí/pay band | ⭕ | ⭕ | ✅ | ✅ | ⭕ | ⭕ | ⭕ |
| Pay equity/benchmark | — | — | ✅ | ✅ | — | — | — |

(✅ có — ⭕ phần cơ bản/qua cấu hình — — không có; tổng hợp từ nguồn mục 2.)

## 5. Bài học áp dụng vào open-erp

| # | Bài học | Nguồn | Áp dụng đề xuất |
| :--- | :--- | :--- | :--- |
| L01 | Component + công thức là lõi; bảng lương là view trên components | Frappe/Odoo | `SalaryComponent` (earning/deduction/employer) + formula thuần test được |
| L02 | Tỷ lệ thuế/BH/định mức là dữ liệu versioned theo luật, không hardcode | gross-net tools | `TaxBracket`, `InsuranceRate` với `effective_from` — cập nhật theo nghị quyết |
| L03 | Attendance là nguồn công; payroll nhận từ kỳ đã chốt | MISA, Sprint 09 | Consume `attendance.timesheet.locked` qua Event Hub; không đọc bảng attendance trực tiếp |
| L04 | Nhiều bảng lương song song (nhóm NV/đơn vị/mô hình) + bảng chi tiết → tổng hợp | MISA/1Office | `PayrollRun` theo kỳ + scope; hỗ trợ chạy nhiều lần trong tháng |
| L05 | Duyệt bảng lương trước khi chi trả; khóa sau duyệt | MISA/Frappe | Trạng thái Draft → Duyệt → Khóa; dùng workflow engine nếu khách chọn |
| L06 | Payslip per employee per period, breakdown theo component, gửi PDF | Frappe/Odoo | Payslip entity + sinh PDF + notification |
| L07 | Quyết định lương là chứng từ effective-dated riêng | 1Office/MISA | `SalaryDecision` (tăng lương/thưởng) gắn thay đổi cấu trúc từ ngày hiệu lực |
| L08 | Other inputs cho khoản ngoài chu kỳ (tạm ứng, hoàn ứng, thưởng ngoài) | Odoo | `PayrollInput` thủ công + approval nếu cần |
| L09 | Analytics: chi phí theo thời gian/đơn vị + pay band nội bộ là v1 khả thi; benchmark/dự báo cần dữ liệu ngoài | BambooHR/Deel | Dashboard + pay band; benchmark để backlog |
| L10 | Quyền xem lương tách bạch + audit mọi lần xem/sửa | Tất cả | `payroll:read` riêng; audit bảng lương + payslip |
| L11 | Xuất cho kế toán: Excel payroll-ready + (tùy chọn) bút toán | MISA | Excel chuẩn trước; bút toán backlog |
| L12 | Gross→net một chiều trước, net→gross là bài toán nghịch đảo phức tạp | gross-net tools | Q4 quyết định |

## 6. Khoảng trống cần kiểm chứng thêm

1. Biểu thuế TNCN hiệu lực 2026 (7 bậc hay 5 bậc theo Luật TNCN 2025) và mức giảm trừ chính xác — kiểm chứng pháp lý trước khi code; kiến trúc giữ slabs là dữ liệu nên không ảnh hưởng thiết kế.
2. Tỷ lệ BHXH phần NSDLAO chi tiết từng loại (xuất tháng 13, thai sản…) — cấu hình theo luật, cần nguồn chính thức khi triển khai.
3. Mẫu file xuất kế toán thực tế tenant đang dùng (MISA/Fast/Bravo) — cần mẫu khi triển khai.
4. Dữ liệu benchmark thị trường VN cho pay benchmarking — ngoài hệ thống, backlog.

## 7. Nguồn đã đọc

- Frappe HR Payroll + Salary Component + Salary Structure docs (frappe.io, docs.frappe.io) — đọc 2026-11-02.
- Odoo Payroll features + Salaries docs (odoo.com) — đọc 2026-11-02.
- MISA AMIS Tiền lương + AMIS Kế toán Tiền lương (helpamis.misa.vn, helpact.misa.vn) — đọc 2026-11-02.
- 1Office Tính lương + Công-Ca-Lương (1office.vn) — đọc 2026-11-02.
- Vi-Office HRM Payroll (vi-office.com) — đọc 2026-11-02.
- BambooHR Compensation (bamboohr.com) — đọc 2026-11-02.
- Deel Compensation + Analytics Dashboards (deel.com) — đọc 2026-11-02.
- Payscale/Best Pay Equity Software 2026 (peoplemanagingpeople.com) — đọc 2026-11-02.
- Công cụ gross-net VN 2026 (taichinhpro, thuevietnam.org, taoclip, KTHDIGI, thuvienphapluat) — đọc 2026-11-02.
- Sheet.com.vn — bảng lương tự động theo luật VN — đọc 2026-11-02.

| Lịch sử | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Bản nháp đầu tiên: 10 sản phẩm/nhóm, 7 chủ đề, 12 bài học, 4 khoảng trống |
