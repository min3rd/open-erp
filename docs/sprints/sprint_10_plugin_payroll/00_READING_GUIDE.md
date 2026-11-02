# [00] Sprint 10 — Plugin Payroll (Quản lý & tính lương + phân tích lương)

| Trường | Giá trị |
| :--- | :--- |
| ID / phiên bản / cập nhật | READ-S10-001 / 0.3 / 2026-11-02 |
| Trạng thái tài liệu / sprint | 🚧 **ĐANG THỰC HIỆN** — **Scope APPROVED 1.0** (16/16 câu + 27 AC); bước 05 (SOL) mở cho Architect — BA phase hoàn tất |
| Owner / reviewer | BA Agent / Chủ dự án (duyệt scope tại CONF) |
| Đầu vào / đọc trước | [RAW-S10-001](01_raw_notes/01_RAW-S10-001_payroll_plugin_requirements.md) — yêu cầu trực tiếp chủ dự án 2026-11-02 / [Sprint 09](../sprint_09_plugin_attendance_timesheet/00_READING_GUIDE.md) (đang code bước 07), [Sprint 07](../sprint_07_plugin_employee/00_READING_GUIDE.md) (đã đóng) |
| Đọc tiếp | [ANL-S10-001](02_analysis/01_ANL-S10-001_payroll_plugin.md) → [BENCH-S10-001](03_benchmarks/01_BENCH-S10-001_payroll_benchmarks.md) → [CONF-S10-001](04_confirmation/01_CONF-S10-001_sprint_10_scope_and_ac.md) |

## 1. Đọc để hiểu gì?

Sprint 10 xây **plugin `payroll`** (đề xuất) — plugin HR thứ ba, theo yêu cầu trực tiếp của chủ dự án: *"plugin quản lý, tính lương và các công cụ phân tích lương cần thiết"*. Plugin trả lời chuỗi câu hỏi:

> **Cấu trúc lương của tenant được mô hình hóa thế nào (component/công thức), dữ liệu công lấy từ đâu (attendance đã chốt), thuế TNCN và bảo hiểm tính theo quy tắc nào (versioned theo luật), ai duyệt bảng lương, nhân viên nhận phiếu lương ra sao, và chi phí lương được phân tích thế nào?**

Chuỗi giá trị: **attendance (S09) chốt bảng công → payroll (S10) nhận công qua Event Hub → tính gross → BH → thuế TNCN → net → payslip + xuất kế toán → dashboard chi phí lương** — đúng mô hình MISA AMIS (Chấm công → Tiền lương) và Frappe/Odoo payroll.

Sprint chạy **song song với Sprint 09** (đang bước 07): payroll phụ thuộc event + dữ liệu attendance đã chốt — nếu Sprint 09 chưa release khi Sprint 10 code, cần đường dự phòng import công (Q16).

### 1.1. Kiến thức nền cần có

| Chủ đề | Đọc trước | Vì sao cần |
| :--- | :--- | :--- |
| Hồ sơ & hợp đồng nhân viên | [Sprint 07](../sprint_07_plugin_employee/00_READING_GUIDE.md) — employee, assignment, hợp đồng | Người được tính lương + loại hợp đồng + quản lý |
| Chấm công & bảng công | [Sprint 09](../sprint_09_plugin_attendance_timesheet/00_READING_GUIDE.md) — records, timesheets, lock, event | Nguồn công đã chốt cho lương |
| Plugin platform | [Sprint 06](../sprint_06_plugin_dev_platform/00_READING_GUIDE.md) — Event Hub, outbox, WC/MF, notification | Nhận event attendance, phát event payroll, thông báo |
| Workflow engine | [Sprint 08](../sprint_08_plugin_form_workflow/00_READING_GUIDE.md) — In Review | Q6: duyệt bảng lương nhiều cấp nếu chọn |
| Danh mục | [Sprint 05](../sprint_05_catalog_plugin/00_READING_GUIDE.md) | Loại hợp đồng, chức danh cho pay band |

### 1.2. Kết quả nghiên cứu đối thủ (tóm tắt điều hướng)

- **[BENCH-S10-001](03_benchmarks/01_BENCH-S10-001_payroll_benchmarks.md)** — 10 sản phẩm/nhóm (Odoo Payroll, Frappe HR, BambooHR Compensation, Deel, Payscale, MISA AMIS Tiền lương, 1Office, Vi-Office, công cụ gross-net VN, cộng đồng Excel C&B VN). Bài học cốt lõi: **component + công thức thuần là lõi** (bảng lương chỉ là view); tỷ lệ thuế/BH là **dữ liệu versioned theo luật** không hardcode; attendance là nguồn công (MISA/Frappe đều nhận từ chốt công); nhiều bảng lương song song + chi tiết → tổng hợp; payslip PDF + xác nhận nhân viên; **quyết định lương** là chứng từ effective-dated VN đặc thù; analytics v1 khả thi = dashboard chi phí + pay band nội bộ (benchmark/dự báo cần dữ liệu ngoài); quyền xem lương tách bạch + audit bắt buộc.

## 2. Lộ trình đọc

Khách hàng đọc **01 → 03** (hiểu yêu cầu + đối chuẩn) rồi trả lời 16 câu hỏi tương tác tại CONF; developer đọc thêm 05–09 sau khi scope duyệt.

| Thứ tự | ID | Link file | Nội dung/câu hỏi được giải đáp | Owner |
| :--- | :--- | :--- | :--- | :--- |
| 01.01 | RAW-S10-001 | [Yêu cầu gốc](01_raw_notes/01_RAW-S10-001_payroll_plugin_requirements.md) | Nguyên văn yêu cầu, R1–R4, diễn giải BA, ràng buộc, 16 câu hỏi mở | BA |
| 02.01 | ANL-S10-001 | [Phân tích plugin payroll](02_analysis/01_ANL-S10-001_payroll_plugin.md) | 21 US, scope in/out đề xuất, BR-P01…P12, 10 edge case, ánh xạ câu hỏi CONF | BA |
| 03.01 | BENCH-S10-001 | [Đối chuẩn payroll](03_benchmarks/01_BENCH-S10-001_payroll_benchmarks.md) | 10 sản phẩm, 7 chủ đề, 12 bài học, 4 khoảng trống | BA |
| 04.01 | CONF-S10-001 | [Scope, AC & câu trả lời](04_confirmation/01_CONF-S10-001_sprint_10_scope_and_ac.md) | ✅ **APPROVED 1.0** — 16/16 câu; In/Out scope; 4 luồng; 27 AC + ma trận D/M; 7 rủi ro (Q6 Sprint 08, Q16 chờ Sprint 09, Q3 net→gross) | BA + Khách hàng |
| 05.01 | SOL-S10-001 | Chưa tạo | Giải pháp tổng thể, quyết định kiến trúc | Architect |
| 06.01–06.04 | DES-ARCH/DB/API/UI-S10-001 | Chưa tạo | Kiến trúc, schema, API contract, UI/UX | Architect |
| 07.01+ | FEAT/TASK | Chưa cấp | Không cấp số trước khi CONF duyệt scope | Developer |
| 08.01+ | TP/TR-S10-001 | Chưa tạo | Test plan/report | QA |
| 09.01 | REV-S10-001 | Chưa tạo | DoD + closure | PM |

> Bảng đọc là snapshot. Không tạo link giả cho artifact chưa tồn tại; khi tạo file phải cập nhật index trước khi giao việc.

## 3. Gate riêng biệt

| Gate | Trạng thái | Người quyết định | Nguồn/phiên bản/ngày |
| :--- | :--- | :--- | :--- |
| Scope & AC (CONF-S10-001) | ✅ **APPROVED 1.0** — chủ dự án duyệt toàn bộ scope (16/16 câu + 27 AC) qua hội thoại tương tác (đã nêu rủi ro Q6/Q16/Q3/Q8) | Chủ dự án | CONF-S10-001 1.0, 2026-11-02 |
| Design ready (SOL/ADR/DES) | ⏳ Pending — bước 05 đã mở; Architect đánh giá phụ thuộc Sprint 08/09 trước khi thiết kế | Architect + Chủ dự án | — |
| Implementation | ⏳ Pending | Developer | — |
| QA sign-off | ⏳ Pending | QA | — |
| PM DoD / Customer acceptance | ⏳ Pending | Chủ dự án | — |
| Sprint closure | ⏳ Pending | PM | — |

## 4. Danh mục ID và việc chuyển tiếp

| TYPE/ID | File hoặc reservation | Owner | Tình trạng cấp số |
| :--- | :--- | :--- | :--- |
| READ-S10-001 | [00_READING_GUIDE.md](00_READING_GUIDE.md) | BA | Used — 0.2 |
| RAW-S10-001 | [01_raw_notes/](01_raw_notes/) | BA | Used — Draft 0.2 (16/16 câu đã trả lời) |
| ANL-S10-001 | [02_analysis/](02_analysis/) | BA | Used — Draft 0.1 |
| BENCH-S10-001 | [03_benchmarks/](03_benchmarks/) | BA | Used — Draft 0.1 |
| CONF-S10-001 | [04_confirmation/](04_confirmation/) | BA + Khách hàng | Used — **APPROVED 1.0** (16/16 câu trả lời + duyệt scope) |
| SOL/ADR/DES-S10-001+ | *(chưa cấp)* | Architect | Không cấp trước khi CONF duyệt scope |
| FEAT/TASK/BUG | *(chưa cấp)* | Developer/QA | Không cấp số trước khi CONF duyệt scope |

## 5. Liên hệ với các Sprint trước

| Nguồn | Tài sản hiện có | Sprint 10 dùng thế nào |
| :--- | :--- | :--- |
| Sprint 01–02 | `users`, RBAC, data scope | Phân quyền lương theo scope; `payroll:read` tách bạch dữ liệu nhạy cảm |
| Sprint 05 | Catalog — loại hợp đồng, chức danh | Đối tượng gán cấu trúc lương; pay band theo chức danh |
| Sprint 06 | Event Hub, outbox, notification, WC/MF | Nhận event attendance, phát event payroll, thông báo, UI plugin |
| Sprint 07 | Employee assignment, hợp đồng, trạng thái | Đối tượng tính lương; ngày vào/việc giới hạn kỳ; quản lý duyệt |
| Sprint 08 | Workflow engine (In Review) | Q6: duyệt bảng lương nhiều cấp nếu chọn |
| Sprint 09 | Attendance records/timesheets/lock + event `attendance.timesheet.locked` (đang code) | Nguồn công đã chốt; OT phút đã duyệt → lương OT |

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Khởi tạo Sprint-Pack 10: RAW-S10-001 (R1–R4 + 16 câu hỏi mở), ANL-S10-001 (21 US + 12 BR + edge case), BENCH-S10-001 (10 sản phẩm + 12 bài học), CONF Draft 0.1 — trình 16 câu hỏi tương tác cho chủ dự án | BA Agent; yêu cầu trực tiếp chủ dự án 2026-11-02 |
| 0.2 | 2026-11-02 | Chủ dự án trả lời **16/16 câu** qua hội thoại tương tác (4 vòng); soạn CONF-S10-001 0.2 (In/Out scope + 4 luồng + 27 AC + ma trận D/M + 7 rủi ro); RAW nâng 0.2; gate vẫn Pending — chờ duyệt scope & AC | BA Agent; hội thoại tương tác chủ dự án |
| 0.3 | 2026-11-02 | **Scope & AC APPROVED 1.0** — chủ dự án chọn "Duyệt toàn bộ scope" sau khi được nêu rủi ro Q6 (Sprint 08), Q16 (chờ Sprint 09), Q3 (net→gross), Q8 (chữ ký giữ chỗ); CONF nâng 1.0; bước 05 (SOL) mở cho Architect | BA Agent; hội thoại tương tác chủ dự án |
