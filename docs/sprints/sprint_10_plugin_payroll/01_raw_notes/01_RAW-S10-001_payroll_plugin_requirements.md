# [RAW-S10-001] Yêu cầu gốc: Sprint 10 — Plugin Payroll (Quản lý & tính lương + công cụ phân tích lương)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | RAW-S10-001 / Yêu cầu gốc / Sprint 10 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.2 / 2026-11-02 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | Hội thoại trực tiếp với chủ dự án 2026-11-02 |
| Đọc trước / đọc tiếp | [Sprint 09 — đang thực hiện](../../sprint_09_plugin_attendance_timesheet/00_READING_GUIDE.md) (DES approved, đang code), [Sprint 07](../../sprint_07_plugin_employee/00_READING_GUIDE.md) (đã đóng) / [ANL-S10-001](../02_analysis/01_ANL-S10-001_payroll_plugin.md), [BENCH-S10-001](../03_benchmarks/01_BENCH-S10-001_payroll_benchmarks.md) |

## 1. Nguồn yêu cầu

Nguồn duy nhất: hội thoại trực tiếp giữa chủ dự án và Agent điều phối, ngày 2026-11-02, khi Sprint 09 đang ở bước 07 (implementation — TASK-443/444 Done dev). Chủ dự án yêu cầu chạy phân tích BA của Sprint 10 song song.

## 2. Nguyên văn lời khách hàng

> "tiếp tục phân tích cho sprint 10: plugin quản lý, tính lương và các công cụ phân tích lương cần thiết. Hãy phân tích các đối thủ xem đang làm thế nào"

Phần cuối của lời nhắn là chỉ định nghiên cứu đối thủ — đã thực hiện tại [BENCH-S10-001](../03_benchmarks/01_BENCH-S10-001_payroll_benchmarks.md). Scope chi tiết (mô hình cấu trúc lương, thuế/bảo hiểm, quy trình duyệt, phiếu lương, bộ công cụ phân tích) chưa phát biểu → thuộc bước 02 phân tích và bước 04 xác nhận.

## 3. Bóc tách yêu cầu thô

| # | Yêu cầu thô | Nguồn |
| :--- | :--- | :--- |
| R1 | Xây **plugin quản lý lương** — cấu trúc lương, phụ cấp, khấu trừ, quản trị dữ liệu lương của tenant | Hội thoại 2026-11-02 |
| R2 | Xây **plugin tính lương** — chạy kỳ lương, tính gross/net, thuế TNCN, bảo hiểm, phiếu lương | Hội thoại 2026-11-02 |
| R3 | Xây **các công cụ phân tích lương cần thiết** — dashboard/báo cáo chi phí lương, phân tích Compensation | Hội thoại 2026-11-02 |
| R4 | Nghiên cứu cách **các đối thủ** xử lý payroll trước khi chốt scope | Hội thoại 2026-11-02 |

Mục tiêu sprint phát biểu bởi khách hàng là **plugin payroll chạy được** — Sprint 10 bàn giao plugin nghiệp vụ độc lập. Chuỗi giá trị tự nhiên: **attendance (S09) chốt bảng công → payroll (S10) nhận công → tính lương → phiếu lương + xuất kế toán**, đúng mô hình MISA AMIS (Chấm công → Tiền lương) và Frappe (Attendance → Payroll).

## 4. Diễn giải BA (tách bạch khỏi lời khách hàng)

- "Quản lý lương" hiểu là **quản trị cấu trúc lương**: thành phần thu nhập (cơ bản, phụ cấp, thưởng), khấu trừ, cấu trúc gán cho nhân viên, quyết định lương/thay đổi lương. **Chưa rõ**: component-based với công thức (Frappe/Odoo) hay bảng cột cố định (Excel-style), quản lý pay band/grade.
- "Tính lương" hiểu là **chạy kỳ lương**: nhận công từ bảng công đã chốt (S09) + cấu trúc lương → gross → đóng bảo hiểm → giảm trừ → thuế TNCN lũy tiến → net; sinh phiếu lương. **Chưa rõ**: gross→net một chiều hay cả net→gross; trần/định mức bảo hiểm; tạm ứng/khấu trừ khác; nhiều kỳ lương trong tháng.
- "Công cụ phân tích lương" hiểu là **payroll analytics**: chi phí lương theo thời gian/đơn vị, cấu trúc tổng thu nhập, pay band/so sánh nội bộ. **Chưa rõ**: mức sâu (dashboard cơ bản → pay equity → benchmark thị trường → dự báo chi phí).
- Ràng buộc pháp lý VN (đối chuẩn BENCH §3.6): thuế TNCN lũy tiến + giảm trừ gia cảnh thay đổi theo nghị quyết (2026: 15.5 triệu/6.2 triệu theo NQ 110/2025/UBTVQH15 — cần kiểm chứng pháp lý khi triển khai); bảo hiểm NLĐ 10.5% (BHXH 8 + BHYT 1.5 + BHTN 1), phần NSDLAO khác; OT 150/200/300%, làm đêm +30%; mức lương vùng tối thiểu. Các tỷ lệ này **bắt buộc cấu hình được**, không hardcode.
- Câu hỏi kiến trúc nổi bật: attendance→payroll qua event `attendance.timesheet.locked` (đã thiết kế Sprint 09); duyệt bảng lương qua workflow engine; công thức tính lương là **engine thuần test được** (pattern ADR-S09-003).

## 5. Ràng buộc đã biết (từ guardrails dự án, không phải yêu cầu mới)

1. Plugin độc lập, schema riêng, đăng ký Entity Registry; không đưa nghiệp vụ vào Core.
2. Multi-tenant: mọi bảng/job/query mang tenant context đã xác thực; dữ liệu lương là dữ liệu **nhạy cảm nhất** — quyền xem lương phải tách bạch (self-read lương của mình; HR theo scope; chặn rò rỉ chéo).
3. Backend Quarkus Java, frontend Angular 22 + Ionic 8; UI shared library, Drawer/Split-view, anti-modal; 100% i18n; 4 khuôn mẫu API; DTO/enum/ResponseKey chuẩn.
4. Employee (S07) là nguồn hồ sơ + hợp đồng; attendance (S09, đang code) là nguồn công đã chốt; workflow (S08, đang review) là cơ chế duyệt; notification (S06) là kênh thông báo.
5. Không viết unit test frontend; backend test trên PostgreSQL/Redis thật (No H2); engine công thức phải là hàm thuần test được.
6. Mobile Ionic tối giản; plugin khai báo minh bạch Desktop/Mobile.

## 6. Câu hỏi mở cần làm rõ (chuyển sang ANL/CONF)

1. **Cấu trúc lương**: component-based + công thức (Frappe/Odoo style) hay bảng cột cố định; pay band/grade có cần không?
2. **Nguồn dữ liệu**: attendance đã chốt + cấu hình là đủ, hay cần đầu vào thủ công khác (KPI, doanh số, thưởng ngoài attendance)?
3. **Gross/Net**: một chiều gross→net hay cấu hình 2 chiều (net→gross hoàn nguyên)?
4. **Thuế & bảo hiểm VN**: bộ quy tắc VN (7 bậc, giảm trừ, tỷ lệ đóng) cấu hình theo luật thay đổi; có cần dùng ngay bản 2026 (15.5tr/6.2tr)?
5. **Kỳ lương**: 1 kỳ/tháng hay nhiều kỳ chi tiết → bảng tổng hợp (MISA)?
6. **Duyệt bảng lương**: workflow engine nhiều cấp, 1 cấp HR→Admin, hay không cần?
7. **Phiếu lương (payslip)**: PDF + gửi nhân viên; nhân viên xác nhận lương hàng tháng?
8. **Quyết định lương**: tạo/duyệt/lưu quyết định tăng lương/thưởng có cần ở v1?
9. **Bộ phụ cấp mặc định**: ăn trưa, xăng xe, điện thoại, chuyên cần, trách nhiệm, nhà ở — seed nào?
10. **OT & thưởng**: OT tự tính từ attendance (150/200/300 + làm đêm) hay nhập tay; thưởng lễ Tết/13 tháng?
11. **BHXH & báo cáo**: trần đóng, sổ nhân viên tham gia; có cần sinh file báo cáo D02-LT/TMX61-LS hay chỉ Excel tổng hợp?
12. **Tạm ứng & khấu trừ**: tạm ứng lương, hoàn ứng, khấu trừ khác có cần v1?
13. **Công cụ phân tích lương**: mức nào ở v1 (dashboard chi phí / pay band & pay equity / benchmark / dự báo)?
14. **Xuất kế toán**: chỉ Excel payroll-ready hay thêm bút toán hạch toán chi phí lương?
15. **Mobile Ionic**: xem phiếu lương + xác nhận + duyệt?
16. **Tích hợp attendance**: nhận bảng công đã chốt qua event ngay v1 (rủi ro phụ thuộc Sprint 09 đang code)?

> Danh sách câu hỏi trên là đầu vào thô; [ANL-S10-001](../02_analysis/01_ANL-S10-001_payroll_plugin.md) phân tích, [BENCH-S10-001](../03_benchmarks/01_BENCH-S10-001_payroll_benchmarks.md) đối chuẩn, [CONF-S10-001](../04_confirmation/01_CONF-S10-001_sprint_10_scope_and_ac.md) chuẩn hóa thành câu hỏi tương tác + AC và xin duyệt.

## 7. Kết quả trả lời câu hỏi (cập nhật 0.2)

Toàn bộ 16 câu hỏi mở ở §6 đã được chủ dự án trả lời qua **hội thoại tương tác, 2026-11-02** (4 vòng theo 4 nhóm A–D). Bảng trả lời đầy đủ tại [CONF-S10-001 §2](../04_confirmation/01_CONF-S10-001_sprint_10_scope_and_ac.md). Tóm tắt: component + công thức + **pay band ngay**; nguồn attendance + đầu vào tay + **kênh KPI mở**; **gross/net 2 chiều**; seed thuế/BH 2026 tenant chỉnh; **nhiều kỳ chi tiết → tổng hợp**; duyệt qua workflow engine Sprint 08; payslip PDF + xác nhận; quyết định lương đầy đủ + PDF + **giữ chỗ chữ ký số**; phụ cấp seed mở rộng 10+; OT tự nhận + **quy tắc thưởng tự động**; BHXH cấu hình + Excel; tạm ứng có dư nợ; analytics dashboard + pay band; xuất Excel template; mobile xem + xác nhận; **chờ Sprint 09 release** cho tích hợp attendance. Gate vẫn Pending — chờ duyệt scope & AC tại CONF.

| Lịch sử | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Khởi tạo: nguyên văn yêu cầu, R1–R4, diễn giải, ràng buộc, 16 câu hỏi mở |
| 0.2 | 2026-11-02 | Bổ sung §7: 16/16 câu đã trả lời qua hội thoại tương tác 4 vòng; dẫn CONF-S10-001 0.2 |
