# [CONF-S10-001] Scope, Acceptance Criteria & Câu hỏi — Sprint 10: Plugin Payroll

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | CONF-S10-001 / Xác nhận / Sprint 10 |
| Trạng thái / phiên bản / cập nhật | **✅ APPROVED 1.0 / 2026-11-02** — chủ dự án duyệt scope & AC qua hội thoại tương tác (nội dung 0.2 giữ nguyên) |
| Owner / reviewer | BA Agent / Chủ dự án (người duyệt) |
| Đầu vào | [RAW-S10-001](../01_raw_notes/01_RAW-S10-001_payroll_plugin_requirements.md) 0.1, [ANL-S10-001](../02_analysis/01_ANL-S10-001_payroll_plugin.md) 0.1, [BENCH-S10-001](../03_benchmarks/01_BENCH-S10-001_payroll_benchmarks.md) 0.1 |
| Đọc trước / đọc tiếp | [BENCH-S10-001](../03_benchmarks/01_BENCH-S10-001_payroll_benchmarks.md) / [00_READING_GUIDE](../00_READING_GUIDE.md) — bước 05 SOL mở sau khi APPROVED |

## 1. Mục tiêu Sprint 10 (đề xuất)

Bàn giao **1 plugin nghiệp vụ chạy được trên tenant thật** theo yêu cầu trực tiếp của chủ dự án:

**Plugin `payroll`** (đề xuất tên) — quản lý & tính lương + công cụ phân tích lương:

1. **Cấu trúc lương** component-based với công thức + điều kiện; cấu trúc gán nhân viên effective-dated; quyết định lương/thưởng có chứng từ.
2. **Quy tắc pháp lý VN versioned**: biểu thuế TNCN lũy tiến, giảm trừ gia cảnh, các loại bảo hiểm (tỷ lệ/trần/vùng) — cấu hình theo luật thay đổi, không hardcode.
3. **Chạy kỳ lương**: nhận công từ attendance đã chốt qua Event Hub + đầu vào thủ công; gross → BH → thuế → net; duyệt + khóa kỳ; chạy lại.
4. **Payslip** breakdown component, PDF, gửi nhân viên, xác nhận (quá hạn vẫn khóa).
5. **Phân tích lương**: dashboard chi phí (thời gian/đơn vị/component) + pay band theo chức danh; xuất Excel.
6. **Xuất kế toán** Excel payroll-ready; **Mobile** xem payslip + xác nhận.

Không làm: chi trả ngân hàng/bank file, bút toán kế toán tự động, báo cáo BHXH D02-LT, net→gross, benchmark thị trường, dự báo chi phí, multi-currency, EOR/global payroll.

Phạm vi chi tiết đề xuất tại [ANL-S10-001 §3](../02_analysis/01_ANL-S10-001_payroll_plugin.md).

## 2. Phạm vi đã chốt qua 16 câu hỏi tương tác

Nguồn: hội thoại tương tác giữa chủ dự án và Agent điều phối, **2026-11-02** (4 vòng, 16/16 câu trả lời đầy đủ). Kết quả:

| # | Câu hỏi | Câu trả lời của chủ dự án |
| :--- | :--- | :--- |
| Q1 | Cấu trúc lương v1 | **Component + công thức + pay band ngay** (khoảng lương theo chức danh) |
| Q2 | Nguồn dữ liệu | **Attendance + đầu vào thủ công + kênh tích hợp KPI tự động** (kênh input mở qua API internal, nguồn KPI khi có) |
| Q3 | Gross/Net | **2 chiều cấu hình** (gross→net chuẩn + net→gross cho lương net công ty chịu) |
| Q4 | Thuế & bảo hiểm VN | **Seed 2026 + tenant chỉnh** (effective_from theo luật) |
| Q5 | Kỳ lương | **Nhiều kỳ chi tiết → tổng hợp cuối kỳ** (kiểu MISA) |
| Q6 | Duyệt bảng lương | **Workflow engine Sprint 08** (nhiều cấp cấu hình) |
| Q7 | Payslip | **PDF + gửi notification + nhân viên xác nhận** (quá hạn vẫn khóa) |
| Q8 | Quyết định lương | **Đầy đủ: số QĐ + ngày hiệu lực + duyệt + in PDF + giữ chỗ chữ ký số** (chữ ký số khi nền tảng sẵn sàng — pattern Sprint 08) |
| Q9 | Phụ cấp seed | **Bộ mở rộng 10+** (ăn trưa, xăng xe, điện thoại, chuyên cần, trách nhiệm, nhà ở, thai sản, ốm đau, công tác, trực đêm) |
| Q10 | OT & thưởng | **OT tự nhận từ attendance (hệ số cấu hình) + quy tắc thưởng tự động** (tháng 13, hiệu suất — cấu hình theo kỳ/điều kiện) |
| Q11 | BHXH | **Cấu hình loại/tỷ lệ/trần/vùng + Excel tổng hợp** (file D02-LT backlog) |
| Q12 | Tạm ứng | **Có — đăng ký → duyệt → theo dõi dư nợ → tự trừ kỳ sau** (giới hạn cấu hình) |
| Q13 | Phân tích lương | **Dashboard chi phí + pay band theo chức danh** (benchmark/dự báo backlog) |
| Q14 | Xuất kế toán | **Excel payroll-ready + template tenant** (bút toán backlog) |
| Q15 | Mobile | **Xem payslip + xác nhận** |
| Q16 | Tích hợp attendance | **Chờ Sprint 09 release** — subscription khai báo sẵn, kích hoạt khi attendance ra mắt; trước đó không tính đầy đủ |

### 2.1. Phạm vi In-Scope

**Cấu trúc lương:** SalaryComponent (EARNING/DEDUCTION/EMPLOYER_CONTRIBUTION) với công thức thuần + điều kiện, validate không circular; SalaryStructure lắp components + gán nhân viên effective-dated (pin version khi đã có payslip); **PayBand** theo chức danh/grade (min/mid/max, cảnh báo ngoài band); SalaryDecision (số QĐ, loại, ngày hiệu lực, duyệt qua engine, PDF khung chữ ký giữ chỗ).

**Quy tắc pháp lý versioned:** TaxConfig theo năm hiệu lực (slabs lũy tiến, giảm trừ bản thân/phụ thuộc — seed 2026, tenant chỉnh); InsuranceConfig (loại, tỷ lệ NLĐ/NSDLAO, trần, mức tối thiểu vùng); tax engine thuần test từng bậc; **net→gross** cấu hình per employee (vòng lặp tính, phần thuế/BH DN chịu thành component employer).

**Chạy lương:** PayrollRun nhiều lần trong tháng theo phạm vi (chi tiết) + tổng hợp cuối kỳ; đầu vào kỳ thủ công (thưởng, khấu trừ, KPI qua **kênh input mở API internal**); quy tắc thưởng tự động (tháng 13, hiệu suất — cấu hình điều kiện); chạy gross→net; sửa dòng có lý do + audit; duyệt qua workflow engine (seed 1 cấp → Admin); khóa/mở khóa; chạy lại với phiên bản payslip.

**Payslip & xác nhận:** breakdown component; PDF; notification; nhân viên xác nhận/từ chối kèm ghi chú; trạng thái quay về bảng; quá hạn HR khóa.

**Phụ cấp & khoản đặc thù:** seed bộ mở rộng 10+ với điều kiện đi làm; OT tự nhận từ attendance (hệ số 150/200/300 + làm đêm, cấu hình) khi Sprint 09 release; **tạm ứng** đăng ký → duyệt → dư nợ → tự trừ kỳ sau (giới hạn cấu hình, VD ≤ % net kỳ trước).

**Phân tích lương:** dashboard chi phí (thời gian/đơn vị/loại component); pay band theo chức danh (trung vị, min–max, vị trí từng người); báo cáo team manager theo scope; xuất Excel analytics.

**Xuất & mobile:** Excel payroll-ready cột chuẩn + template tenant; Mobile: xem payslip + xác nhận; thông báo 4 nhóm (chờ duyệt, chờ xác nhận, payslip sẵn sàng, kỳ khóa).

### 2.2. Phạm vi Out-of-Scope (backlog)

Chi trả ngân hàng/bank file; bút toán hạch toán tự động; file báo cáo BHXH D02-LT/TMX61-LS; benchmark thị trường & dự báo chi phí; hoàn thuế cuối năm; chữ ký số thực (giữ chỗ theo Sprint 08); multi-currency; EOR/global payroll; plugin KPI/doanh số (payroll chỉ mở kênh nhận); ký số trên quyết định.

## 3. Luồng nghiệp vụ chính

1. **Cấu trúc lương**: HR định nghĩa components (công thức) → lắp cấu trúc → gán nhân viên (effective-dated) → quyết định tăng lương tạo thay đổi từ ngày hiệu lực; pay band cảnh báo lệch.
2. **Chạy kỳ lương**: HR tạo PayrollRun (kỳ + phạm vi) → nhận công từ attendance đã chốt (khi S09 release) + đầu vào thủ công/KPI → chạy gross → BH → giảm trừ → thuế → net → rà sửa có audit → duyệt qua engine → khóa kỳ.
3. **Payslip**: sinh payslip per employee → PDF + notification → nhân viên xác nhận/từ chối → HR chốt khi quá hạn → xuất Excel kế toán.
4. **Phân tích**: dashboard chi phí + pay band cập nhật sau mỗi kỳ khóa; manager xem báo cáo team theo scope.

## 4. Acceptance Criteria

Ma trận: **D** = Desktop (web ≥ 1280px), **M** = Mobile Ionic (390×844). Truy vết: AC-S (cấu trúc) ↔ US-S; AC-T (thuế/BH) ↔ US-T; AC-R/K (chạy lương) ↔ US-R; AC-P (payslip) ↔ US-P; AC-A (analytics) ↔ US-A; AC-I (tích hợp/mobile) ↔ US-I. Tổng 27 AC.

| AC | Nội dung | D | M |
| :--- | :--- | :-: | :-: |
| AC-S01 | SalaryComponent CRUD 3 loại + công thức thuần + điều kiện; validate tham chiếu + chặn circular; sandbox kiểm tra công thức trước lưu | D | — |
| AC-S02 | SalaryStructure lắp components; gán nhân viên effective-dated; cấu trúc đã có payslip → sửa tạo version mới, payslip pin version | D | — |
| AC-S03 | PayBand theo chức danh/grade (min/mid/max); cấu trúc lương ngoài band cảnh báo hiển thị | D | — |
| AC-S04 | SalaryDecision: số QĐ, loại (tăng lương/thưởng/điều chỉnh), ngày hiệu lực, duyệt qua workflow engine; áp effective-dated; PDF có khung chữ ký giữ chỗ | D | — |
| AC-T01 | TaxConfig theo năm hiệu lực (slabs, giảm trừ bản thân/phụ thuộc); seed 2026; tenant chỉnh; job chọn bộ hiệu lực theo ngày | D | — |
| AC-T02 | InsuranceConfig (loại, tỷ lệ NLĐ/NSDLAO, trần, mức tối thiểu vùng); seed 2026; tính cả 2 phía trong bảng lương | D | — |
| AC-T03 | Tax engine thuần: test từng bậc lũy tiến khớp công cụ gross-net chuẩn VN (đối chiếu số liệu mẫu) | — | — |
| AC-T04 | Net→gross per employee: vòng lặp tính gross từ net mục tiêu; phần thuế/BH DN chịu là component employer hiển thị riêng | D | — |
| AC-R01 | PayrollRun nhiều lần/tháng theo phạm vi (tenant/đơn vị/nhóm NV); bảng chi tiết từng lần + tổng hợp cuối kỳ | D | — |
| AC-R02 | Chạy tính lương: công chuẩn/thực + OT → gross → BH NLĐ → giảm trừ → thuế → net; formula engine thuần test toàn diện | — | — |
| AC-R03 | Đầu vào kỳ thủ công: thưởng, khấu trừ, tạm ứng…; **kênh KPI mở qua API internal** (ánh xạ thành phần lương; nguồn KPI khi có plugin) | D | — |
| AC-R04 | Sửa từng dòng bảng lương kèm lý do + audit; sửa sau khi chạy → đánh dấu cần duyệt lại | D | — |
| AC-R05 | Duyệt qua workflow engine (seed 1 cấp HR→Admin, tenant cấu hình thêm cấp); khóa kỳ sau duyệt; chỉ Admin mở khóa có audit | D | M |
| AC-R06 | Chạy lại khi cấu hình đổi: recompute + payslip cũ hủy (kèm phiên bản) + payslip mới | D | — |
| AC-R07 | Quy tắc thưởng tự động (tháng 13, hiệu suất): cấu hình công thức + điều kiện + kỳ áp dụng | D | — |
| AC-P01 | Payslip per employee/kỳ: breakdown component (thu nhập/khấu trừ/đóng DN), PDF tải, notification | D | M |
| AC-P02 | Nhân viên xác nhận/từ chối kèm ghi chú; trạng thái quay về bảng; HR khóa khi quá hạn (đánh dấu chưa xác nhận) | D | M |
| AC-A01 | Dashboard chi phí lương: theo thời gian, đơn vị, loại component; filter kỳ | D | — |
| AC-A02 | Pay band view: trung vị/min–max theo chức danh; vị trí từng người so với band | D | — |
| AC-A03 | Báo cáo team cho manager theo data scope | D | — |
| AC-A04 | Xuất Excel dữ liệu phân tích | D | — |
| AC-I01 | Xuất Excel payroll-ready: bộ cột chuẩn (gross, BH, thuế, net, chi phí DN…) + template cấu hình tenant | D | — |
| AC-I02 | Phụ cấp seed bộ mở rộng 10+ với điều kiện tính (đi làm, số ngày công); tenant thêm loại qua component | D | — |
| AC-I03 | OT lương = ot_minutes attendance đã duyệt × hệ số theo loại ngày (150/200/300 + làm đêm, cấu hình); trước S09 release → đầu vào tay | — | — |
| AC-I04 | Tạm ứng: đăng ký → duyệt → theo dõi dư nợ → tự trừ kỳ sau với giới hạn cấu hình (≤ % net kỳ trước) | D | M |
| AC-I05 | Event subscription `attendance.timesheet.locked` khai báo sẵn; kích hoạt khi Sprint 09 release; không import công trong v1 | — | — |
| AC-I06 | Mobile: xem payslip theo tháng + xác nhận/từ chối bảng lương | — | M |
| AC-I07 | Tenant isolation mọi bảng/job; **quyền payroll:read tách bạch**; audit mọi lần xem/sửa bảng lương và payslip; test isolation hạng mục nghiệm thu | — | — |

M\* — không áp dụng. Backend test: JUnit 5 + RestAssured trên PostgreSQL/Redis thật (No H2); frontend không viết unit test; QA browser Desktop + Mobile emulation 390×844, 0 console error.

## 5. Rủi ro cần chủ dự án lưu ý (đã chọn ở Q1/Q2/Q3/Q6/Q8/Q16)

1. **Q6 — Workflow engine Sprint 08**: cùng phụ thuộc như Sprint 09 (design In Review); Architect đánh giá ở bước 05; fallback duyệt 1 cấp nội bộ giữ schema (pattern ADR-S09-002) nếu engine chưa release.
2. **Q16 — Chờ Sprint 09**: payroll không nhận công tự động trước khi attendance release; kỳ lương trước đó tính bằng đầu vào tay (thiếu OT/chấm tự động); subscription đã khai báo sẵn để kích hoạt sau — **không tính được lương OT tự động cho đến khi Sprint 09 ra mắt**.
3. **Q3+T04 — Net→gross**: bài toán nghịch đảo (lặp tính); Architect thiết kế engine 2 chiều thuần có test; biên: net quá thấp/không hội tụ → báo lỗi cấu hình.
4. **Q2/K01 — Kênh KPI mở**: chưa có plugin KPI — v1 chỉ là **kênh input API có secret** (pattern ingest Sprint 09) + ánh xạ thành phần; kỳ vọng tự động phải chờ nguồn KPI.
5. **Q8 — Chữ ký số**: đã backlog từ Sprint 08 — v1 chỉ **khung giữ chỗ trên PDF**; ký số thực khi nền tảng có (không cam kết trong sprint).
6. **Q4 — Pháp lý seed 2026**: kiểm chứng nguồn pháp lý chính thức (NQ 110/2025/UBTVQH15, nghị định BH…) trước khi seed số liệu; slabs/tỷ lệ là dữ liệu nên không ảnh hưởng thiết kế.
7. **Tổng thể**: 16/16 câu chọn phạm vi rộng (pay band + KPI + 2 chiều + quyết định + chữ ký giữ chỗ + thưởng tự động) — sprint lớn; nếu muốn gọn có thể tách net→gross (Q3) hoặc pay band (Q1) trước khi duyệt.

## 6. Confirmation Gate

| Mục | Trạng thái |
| :--- | :--- |
| 16/16 câu hỏi scope đã trả lời | ✅ (hội thoại tương tác 2026-11-02) |
| Duyệt scope & AC (bảng §1, §2.1, §4) | ✅ **APPROVED 1.0** — chủ dự án chọn "Duyệt toàn bộ scope" qua hội thoại tương tác 2026-11-02 (đã nêu rõ rủi ro §5: Q6 phụ thuộc Sprint 08, Q16 chờ Sprint 09, Q3 net→gross, Q8 chữ ký giữ chỗ) |
| Chuyển sang bước 05 (SOL) | ✅ Đã mở — Architect nghiên cứu giải pháp, không tự thay đổi scope/AC |

> Lịch sử: 0.1 (2026-11-02) — soạn CONF nháp với 16 câu hỏi chốt scope + đề xuất mục tiêu; **0.2 (2026-11-02)** — ghi nhận 16/16 câu trả lời tương tác; bổ sung In-Scope/Out-of-Scope, 4 luồng nghiệp vụ, 27 AC + ma trận D/M, 7 rủi ro; **1.0 (2026-11-02) — APPROVED bởi chủ dự án qua hội thoại tương tác, nội dung 0.2 giữ nguyên**. Đổi scope/AC sau này phải xác nhận phần thay đổi và tăng phiên bản.

| Lịch sử | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Bản nháp đầu tiên: mục tiêu đề xuất + 16 câu hỏi 4 nhóm + 4 rủi ro; chờ trả lời tương tác |
| 0.2 | 2026-11-02 | Ghi nhận 16/16 câu trả lời; soạn scope §2, luồng §3, AC §4 (27 AC), rủi ro §5; chờ duyệt |
| 1.0 | 2026-11-02 | **APPROVED** — chủ dự án duyệt toàn bộ scope (16/16 câu + 27 AC) qua hội thoại tương tác |
