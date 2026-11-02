# [00] Sprint 09 — Plugin Chấm công & Bảng công (Attendance & Timesheet)

| Trường | Giá trị |
| :--- | :--- |
| ID / phiên bản / cập nhật | READ-S09-001 / 0.8 / 2026-11-02 |
| Trạng thái tài liệu / sprint | 🚧 **ĐANG THỰC HIỆN** — Scope + SOL/ADR + **DES APPROVED 1.0**; bước 07 (FEAT/TASK + code) mở cho Developer |
| Owner / reviewer | BA Agent / Chủ dự án (duyệt scope tại CONF) |
| Đầu vào / đọc trước | [RAW-S09-001](01_raw_notes/01_RAW-S09-001_attendance_timesheet_plugin_requirements.md) — yêu cầu trực tiếp chủ dự án 2026-11-02 / [Sprint 08](../sprint_08_plugin_form_workflow/00_READING_GUIDE.md) (Design In Review, chưa đóng), [Sprint 07](../sprint_07_plugin_employee/00_READING_GUIDE.md) (đã đóng) |
| Đọc tiếp | [ANL-S09-001](02_analysis/01_ANL-S09-001_attendance_timesheet_plugin.md) → [BENCH-S09-001](03_benchmarks/01_BENCH-S09-001_attendance_timesheet_benchmarks.md) → [CONF-S09-001](04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) → [SOL-S09-001](05_solutions/01_SOL-S09-001_attendance_architecture.md) |

## 1. Đọc để hiểu gì?

Sprint 09 xây **plugin `attendance`** (đề xuất) — plugin HR thứ hai của Open-ERP, theo yêu cầu trực tiếp của chủ dự án: *"tập trung vào plugin quản lý bảng công và chấm công cho nhân viên"*. Plugin trả lời chuỗi câu hỏi:

> **Nhân viên ghi nhận giờ vào/ra bằng cách nào, hệ thống quy đổi thành công ngày theo ca và quy tắc nào, tổng hợp thành bảng công kỳ ra sao, ai duyệt khi có sai lệch, và khi nào dữ liệu sẵn sàng cho tính lương?**

Plugin **không** tính lương/thuế/bảo hiểm — dữ liệu chốt được xuất payroll-ready cho plugin lương sau này. Nghiệp vụ gắn chặt chuẩn thị trường Việt Nam (MISA AMIS, Base.vn, 1Office): đa phương thức chấm (web/mobile/kiosk/máy vân tay), tính công theo ca có tolerance, sửa công qua duyệt, **bảng công tháng → gửi nhân viên xác nhận → chốt → chuyển lương**.

Sprint này chạy **song song với Sprint 08** (đang Design In Review, chưa đóng): nếu chọn dùng workflow engine cho duyệt sửa công (Q9), cần tôn trọng trạng thái thiết kế của Sprint 08.

### 1.1. Kiến thức nền cần có

| Chủ đề | Đọc trước | Vì sao cần |
| :--- | :--- | :--- |
| Hồ sơ & phân công nhân viên | [Sprint 07](../sprint_07_plugin_employee/00_READING_GUIDE.md) — employee plugin, assignment, manager, trạng thái | "Nhân viên" được chấm công là phân công active của employee plugin; quản lý đọc từ assignment |
| Tổ chức & data scope | [Sprint 02](../sprint_02_superadmin_rbac/00_READING_GUIDE.md), Sprint 07 (organization plugin) | Phạm vi dữ liệu theo tenant/chi nhánh/phòng ban; lịch theo đơn vị |
| Danh mục | [Sprint 05](../sprint_05_catalog_plugin/00_READING_GUIDE.md) — loại `SHIFT` (FLAT, tenant tự định nghĩa) | Câu hỏi kiến trúc Q3: cấu trúc ca đặt ở đâu |
| Nền tảng plugin | [Sprint 06](../sprint_06_plugin_dev_platform/00_READING_GUIDE.md) — Entity Registry, WC/MF, event/outbox, notification | Plugin độc lập, sự kiện công phát cho plugin khác tiêu thụ |
| Workflow engine | [Sprint 08](../sprint_08_plugin_form_workflow/00_READING_GUIDE.md) — In Review | Q9: duyệt sửa công có dùng engine chung không |

### 1.2. Kết quả nghiên cứu đối thủ (tóm tắt điều hướng)

- **[BENCH-S09-001](03_benchmarks/01_BENCH-S09-001_attendance_timesheet_benchmarks.md)** — 10 sản phẩm/nhóm (Odoo, Frappe HR, Zoho, Jibble, BambooHR, MISA AMIS, Base.vn, 1Office, ZKTeco/BioTime, kiosk Odoo). Bài học cốt lõi: tách 3 tầng dữ liệu **log thô (append-only) → công ngày → bảng công kỳ**; một lõi chấm đa phương thức có enum nguồn; ca làm là cấu trúc dữ liệu riêng (giờ vào/ra, grace, threshold, ca đêm); tolerance 2 chiều muộn/OT cấu hình được; sửa công phải qua duyệt có audit; chuỗi VN **tổng hợp → gửi NV xác nhận → chốt → chuyển lương**; không tự tính lương, chỉ xuất payroll-ready; máy chấm công nối qua middleware push API/import file, không viết driver.

## 2. Lộ trình đọc

Khách hàng đọc **01 → 03** (hiểu yêu cầu + đối chuẩn) rồi trả lời 16 câu hỏi tương tác tại CONF; developer đọc thêm 05–09 sau khi scope duyệt.

| Thứ tự | ID | Link file | Nội dung/câu hỏi được giải đáp | Owner |
| :--- | :--- | :--- | :--- | :--- |
| 01.01 | RAW-S09-001 | [Yêu cầu gốc](01_raw_notes/01_RAW-S09-001_attendance_timesheet_plugin_requirements.md) | Nguyên văn yêu cầu, R1–R4, diễn giải BA, ràng buộc, 16 câu hỏi mở | BA |
| 02.01 | ANL-S09-001 | [Phân tích plugin attendance](02_analysis/01_ANL-S09-001_attendance_timesheet_plugin.md) | 28 US, scope in/out đề xuất, BR-A01…A14, 10 edge case, ánh xạ câu hỏi CONF | BA |
| 03.01 | BENCH-S09-001 | [Đối chuẩn attendance/timesheet](03_benchmarks/01_BENCH-S09-001_attendance_timesheet_benchmarks.md) | 10 sản phẩm, 8 chủ đề, 12 bài học, 4 khoảng trống | BA |
| 04.01 | CONF-S09-001 | [Scope, AC & câu trả lời](04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) | ✅ **APPROVED 1.0** — 18/18 câu; In/Out scope; 5 luồng; 37 AC + ma trận D/M; 6 rủi ro (Q9/Q18 phụ thuộc Sprint 08, Q14 leave đầy đủ) | BA + Khách hàng |
| 05.01 | SOL-S09-001 | [Giải pháp tổng thể](05_solutions/01_SOL-S09-001_attendance_architecture.md) | 1 plugin attendance + 1 mảnh Core; ranh giới; 6 luồng chính; rủi ro | Architect |
| 05.02 | ADR-S09-001 | [Ca làm việc trong plugin](05_solutions/02_ADR-S09-001_shift_structure_in_plugin.md) | ShiftDefinition + template đơn vị + override NV; catalog SHIFT chỉ là nhãn | Architect |
| 05.03 | ADR-S09-002 | [Đơn từ trên form/workflow Sprint 08](05_solutions/03_ADR-S09-002_request_forms_on_form_workflow.md) | RequestType seed 6 + mapping; fallback duyệt 1 cấp nội bộ | Architect |
| 05.04 | ADR-S09-003 | [Engine tính công](05_solutions/04_ADR-S09-003_attendance_calculation_engine.md) | 3 tầng dữ liệu; job idempotent; tolerance 2 chiều; OT window | Architect |
| 05.05 | ADR-S09-004 | [Số dư phép theo ledger](05_solutions/05_ADR-S09-004_leave_balance_ledger.md) | Grant/usage/adjust/expiry append-only; cộng dồn + hạn dùng | Architect |
| 05.06 | ADR-S09-005 | [Ingestion log đa nguồn](05_solutions/06_ADR-S09-005_multi_source_log_ingestion.md) | 1 lõi log append-only; kiosk PIN; CSV; API push qua Core | Architect |
| 06.01 | DES-ARCH-S09-001 | [Kiến trúc thành phần & luồng](06_designs/arch/01_DES-ARCH-S09-001_components_and_flows.md) | Thành phần, sequence 4 luồng, phân quyền, tương tác plugin, test | Architect |
| 06.02 | DES-DB-S09-001 | [Schema DB](06_designs/db/01_DES-DB-S09-001_attendance_schema.md) | 19 bảng/cột/index/ràng buộc, registry, manifest, outbox | Architect |
| 06.03 | DES-API-S09-001 | [API contract](06_designs/api/01_DES-API-S09-001_attendance_api.md) | Endpoint nhóm chấm/ca/đơn/leave/timesheet/báo cáo; 4 mẫu response; error codes | Architect |
| 06.04 | DES-UI-S09-001 | [UI/UX](06_designs/ui/01_DES-UI-S09-001_attendance_ui.md) | Route map, kiosk, 4 bước timesheet, shared components, mobile 390×844 | Architect |
| 07.01 | FEAT-43 | [Core: scaffold + ca/lịch + ingestion + tính công](07_items/FEAT-43_attendance_core_shifts_ingestion_calc.md) | TASK-443…447; TASK-443/444 Done (dev) — build + 40/40 test PASS | Developer |
| 07.02 | FEAT-44 | [Bảng công kỳ + chốt + xuất + báo cáo](07_items/FEAT-44_attendance_timesheets.md) | TASK-448…451 reserved | Developer |
| 07.03 | FEAT-45 | [Đơn từ trên form/workflow + fallback](07_items/FEAT-45_attendance_request_forms.md) | TASK-452…455 reserved | Developer |
| 07.04 | FEAT-46 | [Leave module (ledger số dư phép)](07_items/FEAT-46_attendance_leave_module.md) | TASK-456…458 reserved | Developer |
| 07.05 | FEAT-47 | [UI Web + Mobile Ionic](07_items/FEAT-47_attendance_ui_web_mobile.md) | TASK-459…461 reserved | Developer |
| 08.01+ | TP/TR-S09-001 | Chưa tạo | Test plan/report | QA |
| 09.01 | REV-S09-001 | Chưa tạo | DoD + closure | PM |

> Bảng đọc là snapshot. Không tạo link giả cho artifact chưa tồn tại; khi tạo file phải cập nhật index trước khi giao việc.

## 3. Gate riêng biệt

| Gate | Trạng thái | Người quyết định | Nguồn/phiên bản/ngày |
| :--- | :--- | :--- | :--- |
| Scope & AC (CONF-S09-001) | ✅ **APPROVED 1.0** — chủ dự án duyệt toàn bộ scope (18/18 câu + 37 AC) qua hội thoại tương tác (đã nêu rõ rủi ro Q9/Q18 phụ thuộc Sprint 08, Q14 leave đầy đủ) | Chủ dự án | CONF-S09-001 1.0, 2026-11-02 |
| Design ready (SOL/ADR/DES) | ✅ **APPROVED 1.0** — 1 SOL + 5 ADR + 4 DES (hội thoại tương tác 2026-11-02) | Architect + Chủ dự án | SOL/ADR/DES-S09 1.0, 2026-11-02 |
| Implementation | ⏳ Pending — bước 07 mở: cấp FEAT/TASK + scaffold | Developer | — |
| QA sign-off | ⏳ Pending | QA | — |
| PM DoD / Customer acceptance | ⏳ Pending | Chủ dự án | — |
| Sprint closure | ⏳ Pending | PM | — |

## 4. Danh mục ID và việc chuyển tiếp

| TYPE/ID | File hoặc reservation | Owner | Tình trạng cấp số |
| :--- | :--- | :--- | :--- |
| READ-S09-001 | [00_READING_GUIDE.md](00_READING_GUIDE.md) | BA | Used — 0.5 |
| RAW-S09-001 | [01_raw_notes/](01_raw_notes/) | BA | Used — Draft 0.2 (18/18 câu đã trả lời) |
| ANL-S09-001 | [02_analysis/](02_analysis/) | BA | Used — Draft 0.2 |
| BENCH-S09-001 | [03_benchmarks/](03_benchmarks/) | BA | Used — Draft 0.1 |
| CONF-S09-001 | [04_confirmation/](04_confirmation/) | BA + Khách hàng | Used — **APPROVED 1.0** (18/18 câu trả lời + duyệt scope) |
| SOL-S09-001 | [05_solutions/](05_solutions/) | Architect | Used — **APPROVED 1.0** |
| ADR-S09-001…005 | [05_solutions/](05_solutions/) | Architect | Used — **APPROVED 1.0** |
| DES-ARCH-S09-001 | [06_designs/arch/](06_designs/arch/) | Architect | Used — **APPROVED 1.0** |
| DES-DB-S09-001 | [06_designs/db/](06_designs/db/) | Architect | Used — **APPROVED 1.0** |
| DES-API-S09-001 | [06_designs/api/](06_designs/api/) | Architect | Used — **APPROVED 1.0** |
| DES-UI-S09-001 | [06_designs/ui/](06_designs/ui/) | Architect | Used — **APPROVED 1.0** |
| FEAT-43 | [07_items/](07_items/) | Developer | Used — In Progress (TASK-443/444 Done dev) |
| FEAT-44…47 | [07_items/](07_items/) | Developer | Used — To Do (TASK-448…461 reserved) |
| TASK-443, TASK-444 | [07_items/](07_items/) | Developer | Used — Done (dev) |
| TASK-445…447 | [07_items/](07_items/) | Developer | Reserved — tạo file trước phân công |

## 5. Liên hệ với các Sprint trước

| Nguồn | Tài sản hiện có | Sprint 09 dùng thế nào |
| :--- | :--- | :--- |
| Sprint 01–02 | `users`, `user_tenants`, RBAC, data scope | Phân quyền xem/quản lý công theo tenant/chi nhánh/phòng ban |
| Sprint 05 | Catalog — loại `SHIFT` FLAT tenant tự định nghĩa | Q3 quyết định: giữ làm nguồn tên ca hay nâng cấp |
| Sprint 06 | Plugin scaffold, Entity Registry, WC/MF, notification, event/outbox | Đóng gói plugin độc lập; sự kiện `attendance.*` phát outbox; thông báo qua notification plugin |
| Sprint 07 | Employee assignment (quản lý trực tiếp, chi nhánh/phòng ban), trạng thái hồ sơ | Nhân viên được chấm công = assignment active; manager duyệt theo assignment; ngày vào/việc giới hạn khoảng tính công |
| Sprint 08 | Workflow engine (Design In Review) | Q9: cơ chế duyệt yêu cầu sửa công — dùng engine chung hay cơ chế đơn giản nội bộ plugin |

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Khởi tạo Sprint-Pack 09: RAW-S09-001 (R1–R4 + 16 câu hỏi mở), ANL-S09-001 (24 US + 14 BR + edge case), BENCH-S09-001 (10 sản phẩm + 12 bài học); gate Pending; CONF reserved — trình 16 câu hỏi tương tác cho chủ dự án | BA Agent; yêu cầu trực tiếp chủ dự án 2026-11-02 |
| 0.2 | 2026-11-02 | Chủ dự án trả lời **16/16 câu** qua hội thoại tương tác (4 vòng); soạn CONF-S09-001 0.2 (In/Out scope + 5 luồng + 31 AC + ma trận D/M + 5 rủi ro); RAW nâng 0.2; gate vẫn Pending — chờ duyệt scope & AC | BA Agent; hội thoại tương tác chủ dự án |
| 0.3 | 2026-11-02 | Chủ dự án phản hồi *"sprint 9 còn thiếu phần tạo các loại đơn phù hợp cho nghiệp vụ"* → trả lời thêm Q17/Q18: **module Đơn từ** (6 loại chuẩn + tenant tạo loại mới, form builder + workflow Sprint 08); CONF 0.3 (37 AC + 6 rủi ro), ANL 0.2 (28 US), RAW 0.2; gate vẫn Pending | BA Agent; hội thoại tương tác chủ dự án |
| 0.4 | 2026-11-02 | **Scope & AC APPROVED 1.0** — chủ dự án chọn "Duyệt toàn bộ scope" sau khi được nêu rủi ro Q9/Q18 (phụ thuộc Sprint 08) và Q14 (leave đầy đủ); CONF nâng 1.0; bước 05 (SOL) mở cho Architect | BA Agent; hội thoại tương tác chủ dự án |
| 0.5 | 2026-11-02 | Architect khảo sát codebase (Event Hub + Entity Write Proxy đã implement; form/workflow đã scaffold có engine; employee manifest) và soạn **SOL-S09-001 + ADR-S09-001…005** (Draft 0.1); quyết định then chốt: ca trong plugin, đơn từ trên form/workflow có fallback, engine tính công job idempotent, ledger số dư phép, ingestion đa nguồn qua Core; Design **In Review** | Architect; khảo sát repo 2026-11-02 |
| 0.6 | 2026-11-02 | **SOL + 5 ADR APPROVED 1.0** — chủ dự án duyệt qua hội thoại tương tác ("ok duyệt"); bước 06 (DES) mở | Architect; hội thoại tương tác chủ dự án |
| 0.7 | 2026-11-02 | Architect soạn **DES-ARCH/DB/API/UI-S09-001** (Draft 0.1): 19 bảng schema, API contract 4 khuôn mẫu + 31 error codes, sequence 4 luồng, route map Web + 5 tab Mobile; Design **In Review** chờ duyệt | Architect |
| 0.8 | 2026-11-02 | **DES APPROVED 1.0** — chủ dự án chốt ("ok chốt"); bước 07 mở: cấp FEAT/TASK, Developer bắt đầu scaffold plugin attendance | Architect/PM; hội thoại tương tác chủ dự án |
| 0.9 | 2026-11-02 | Developer cấp **FEAT-43…47 + TASK-443…461** (reservation); scaffold `plugins/attendance` (pom, manifest 12 entities, migration V1 12 bảng) + engine thuần ShiftResolver/AttendanceCalculator; **build PASS, 40/40 unit test PASS**; TASK-443/444 Done (dev) | Developer; working tree |
