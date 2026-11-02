# [00] Sprint 11 — Plugin KPI (Quản lý & xử lý KPI)

| Trường | Giá trị |
| :--- | :--- |
| ID / phiên bản / cập nhật | READ-S11-001 / 0.3 / 2026-11-02 |
| Trạng thái tài liệu / sprint | 🚧 **ĐANG THỰC HIỆN** — **Scope APPROVED 1.0** (16/16 câu + 26 AC); bước 05 (SOL) mở cho Architect — BA phase hoàn tất |
| Owner / reviewer | BA Agent / Chủ dự án (duyệt scope tại CONF) |
| Đầu vào / đọc trước | [RAW-S11-001](01_raw_notes/01_RAW-S11-001_kpi_plugin_requirements.md) — yêu cầu trực tiếp chủ dự án 2026-11-02 / [Sprint 10](../sprint_10_plugin_payroll/00_READING_GUIDE.md) (Scope APPROVED, bước 05 mở), [Sprint 09](../sprint_09_plugin_attendance_timesheet/00_READING_GUIDE.md) (đang code bước 07) |
| Đọc tiếp | [ANL-S11-001](02_analysis/01_ANL-S11-001_kpi_plugin.md) → [BENCH-S11-001](03_benchmarks/01_BENCH-S11-001_kpi_okr_benchmarks.md) → [CONF-S11-001](04_confirmation/01_CONF-S11-001_sprint_11_scope_and_ac.md) |

## 1. Đọc để hiểu gì?

Sprint 11 xây **plugin `kpi`** (đề xuất) — plugin HR thứ tư, theo yêu cầu trực tiếp của chủ dự án: *"plugin quản lý và xử lý KPI"*. Plugin trả lời chuỗi câu hỏi:

> **Chỉ tiêu KPI được định nghĩa thế nào (định lượng/định tính, thư viện mẫu theo chức danh), gán cho ai theo chu kỳ nào, số liệu actual cập nhật từ đâu, điểm tính theo công thức và trọng số ra sao, ai duyệt, và kết quả chốt kỳ đi đâu (payroll tiêu thụ qua kênh KPI đã mở ở Sprint 10)?**

Chuỗi giá trị trọn bộ HR: **employee (S07) → attendance (S09) → payroll (S10) ← KPI (S11)** — kết quả KPI chốt kỳ là nguồn cho kênh input mà CONF-S10-001 (Q2/K01) đã thiết kế; ngược lại KPI nhận số liệu tự động từ attendance khi Sprint 09 release.

Sprint chạy **song song với Sprint 09 (đang code) và Sprint 10 (bước 05 mở)**.

### 1.1. Kiến thức nền cần có

| Chủ đề | Đọc trước | Vì sao cần |
| :--- | :--- | :--- |
| Hồ sơ nhân viên & tổ chức | [Sprint 07](../sprint_07_plugin_employee/00_READING_GUIDE.md) — assignment, chức danh, manager | Gán KPI theo chức danh; manager duyệt/chấm |
| Plugin platform | [Sprint 06](../sprint_06_plugin_dev_platform/00_READING_GUIDE.md) — Event Hub, outbox, notification | Publish kết quả kỳ; nhận số liệu tự động |
| Workflow engine | [Sprint 08](../sprint_08_plugin_form_workflow/00_READING_GUIDE.md) — In Review | Q8: duyệt nhiều cấp nếu chọn; Q16: form builder câu hỏi định tính |
| Attendance | [Sprint 09](../sprint_09_plugin_attendance_timesheet/00_READING_GUIDE.md) — đang code | Nguồn số liệu tự động (chuyên cần, OT…) |
| Payroll | [Sprint 10](../sprint_10_plugin_payroll/00_READING_GUIDE.md) — Scope APPROVED | Kênh KPI AC-K01 tiêu thụ kết quả kỳ |

### 1.2. Kết quả nghiên cứu đối thủ (tóm tắt điều hướng)

- **[BENCH-S11-001](03_benchmarks/01_BENCH-S11-001_kpi_okr_benchmarks.md)** — 10 sản phẩm (Odoo Appraisals, Frappe HR, Lattice, 15Five, Profit.co, Quantive/Tability, BambooHR, MISA AMIS Đánh giá, 1Office KPI, Base.vn OKRs). Bài học cốt lõi: một lõi chỉ tiêu **2 loại** (định lượng target/actual + định tính rating); **thư viện mẫu theo chức danh tái sử dụng** là lõi thị trường VN (1Office); điểm = **Σ(achievement × weight)** với cap chống lệch + hướng "càng thấp càng tốt"; chu kỳ tự do tự kích hoạt; **2 điểm duyệt** (đầu kỳ + kết quả) — VN dùng nhiều cấp; actual có append-log + minh chứng + nguồn tự động; **kết quả kỳ gắn lương thưởng qua liên kết dữ liệu** (trọn chuỗi với payroll); appraisal tổng hợp/360 là tầng 2 để backlog.

## 2. Lộ trình đọc

Khách hàng đọc **01 → 03** (hiểu yêu cầu + đối chuẩn) rồi trả lời 16 câu hỏi tương tác tại CONF; developer đọc thêm 05–09 sau khi scope duyệt.

| Thứ tự | ID | Link file | Nội dung/câu hỏi được giải đáp | Owner |
| :--- | :--- | :--- | :--- | :--- |
| 01.01 | RAW-S11-001 | [Yêu cầu gốc](01_raw_notes/01_RAW-S11-001_kpi_plugin_requirements.md) | Nguyên văn yêu cầu, R1–R3, diễn giải BA, ràng buộc, 16 câu hỏi mở | BA |
| 02.01 | ANL-S11-001 | [Phân tích plugin kpi](02_analysis/01_ANL-S11-001_kpi_plugin.md) | 18 US, scope in/out đề xuất, BR-K01…K12, 10 edge case, ánh xạ câu hỏi CONF | BA |
| 03.01 | BENCH-S11-001 | [Đối chuẩn KPI/OKR](03_benchmarks/01_BENCH-S11-001_kpi_okr_benchmarks.md) | 10 sản phẩm, 7 chủ đề, 12 bài học, 4 khoảng trống | BA |
| 04.01 | CONF-S11-001 | [Scope, AC & câu trả lời](04_confirmation/01_CONF-S11-001_sprint_11_scope_and_ac.md) | ✅ **APPROVED 1.0** — 16/16 câu; In/Out scope; 4 luồng; 26 AC + ma trận D/M; 6 rủi ro (Q8/Q16 Sprint 08, Q5 chờ Sprint 09) | BA + Khách hàng |
| 05.01 | SOL-S11-001 | Chưa tạo | Giải pháp tổng thể, quyết định kiến trúc | Architect |
| 06.01–06.04 | DES-ARCH/DB/API/UI-S11-001 | Chưa tạo | Kiến trúc, schema, API contract, UI/UX | Architect |
| 07.01+ | FEAT/TASK | Chưa cấp | Không cấp số trước khi CONF duyệt scope | Developer |
| 08.01+ | TP/TR-S11-001 | Chưa tạo | Test plan/report | QA |
| 09.01 | REV-S11-001 | Chưa tạo | DoD + closure | PM |

> Bảng đọc là snapshot. Không tạo link giả cho artifact chưa tồn tại; khi tạo file phải cập nhật index trước khi giao việc.

## 3. Gate riêng biệt

| Gate | Trạng thái | Người quyết định | Nguồn/phiên bản/ngày |
| :--- | :--- | :--- | :--- |
| Scope & AC (CONF-S11-001) | ✅ **APPROVED 1.0** — chủ dự án duyệt toàn bộ scope (16/16 câu + 26 AC) qua hội thoại tương tác (đã nêu rủi ro Q8/Q16/Q5/Q3) | Chủ dự án | CONF-S11-001 1.0, 2026-11-02 |
| Design ready (SOL/ADR/DES) | ⏳ Pending — bước 05 đã mở; Architect đánh giá phụ thuộc kép Sprint 08 trước khi thiết kế | Architect + Chủ dự án | — |
| Implementation | ⏳ Pending | Developer | — |
| QA sign-off | ⏳ Pending | QA | — |
| PM DoD / Customer acceptance | ⏳ Pending | Chủ dự án | — |
| Sprint closure | ⏳ Pending | PM | — |

## 4. Danh mục ID và việc chuyển tiếp

| TYPE/ID | File hoặc reservation | Owner | Tình trạng cấp số |
| :--- | :--- | :--- | :--- |
| READ-S11-001 | [00_READING_GUIDE.md](00_READING_GUIDE.md) | BA | Used — 0.3 |
| RAW-S11-001 | [01_raw_notes/](01_raw_notes/) | BA | Used — Draft 0.2 (16/16 câu đã trả lời) |
| ANL-S11-001 | [02_analysis/](02_analysis/) | BA | Used — Draft 0.1 |
| BENCH-S11-001 | [03_benchmarks/](03_benchmarks/) | BA | Used — Draft 0.1 |
| CONF-S11-001 | [04_confirmation/](04_confirmation/) | BA + Khách hàng | Used — **APPROVED 1.0** (16/16 câu trả lời + duyệt scope) |
| SOL/ADR/DES-S11-001+ | *(chưa cấp)* | Architect | Không cấp trước khi CONF duyệt scope |
| FEAT/TASK/BUG | *(chưa cấp)* | Developer/QA | Không cấp số trước khi CONF duyệt scope |

## 5. Liên hệ với các Sprint trước

| Nguồn | Tài sản hiện có | Sprint 11 dùng thế nào |
| :--- | :--- | :--- |
| Sprint 01–02 | `users`, RBAC, data scope | Quyền xem điểm theo scope + cấu hình visibility |
| Sprint 05 | Catalog — chức danh | Nhóm chức danh cho thư viện KPI + pay-band style grouping |
| Sprint 06 | Event Hub, outbox, notification, WC/MF | Publish `kpi.result.published`; nhận event nguồn; thông báo; UI plugin |
| Sprint 07 | Employee assignment, chức danh, manager | Đối tượng gán KPI; manager duyệt/chấm; ngày vào/việc giữa kỳ |
| Sprint 08 | Workflow engine + form builder (In Review) | Q8 duyệt nhiều cấp; Q16 câu hỏi định tính |
| Sprint 09 | Attendance (đang code) | Nguồn actual tự động khi release (BR-K08) |
| Sprint 10 | Payroll kênh KPI AC-K01 (Scope APPROVED) | Tiêu thụ `kpi.result.published` — trọn chuỗi lương thưởng theo hiệu suất |

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Khởi tạo Sprint-Pack 11: RAW-S11-001 (R1–R3 + 16 câu hỏi mở), ANL-S11-001 (18 US + 12 BR + edge case), BENCH-S11-001 (10 sản phẩm + 12 bài học), CONF Draft 0.1 — trình 16 câu hỏi tương tác cho chủ dự án | BA Agent; yêu cầu trực tiếp chủ dự án 2026-11-02 |
| 0.2 | 2026-11-02 | Chủ dự án trả lời **16/16 câu** qua hội thoại tương tác (4 vòng); soạn CONF-S11-001 0.2 (In/Out scope + 4 luồng + 26 AC + ma trận D/M + 6 rủi ro); RAW nâng 0.2; gate vẫn Pending — chờ duyệt scope & AC | BA Agent; hội thoại tương tác chủ dự án |
| 0.3 | 2026-11-02 | **Scope & AC APPROVED 1.0** — chủ dự án chọn "Duyệt toàn bộ scope" sau khi được nêu rủi ro Q8/Q16 (phụ thuộc kép Sprint 08), Q5 (chờ Sprint 09), Q3 (cascade); CONF nâng 1.0; bước 05 (SOL) mở cho Architect | BA Agent; hội thoại tương tác chủ dự án |
