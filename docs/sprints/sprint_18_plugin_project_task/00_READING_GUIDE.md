# Sprint 18 Reading Guide — Plugin Quản Lý & Điều Hành Dự Án, Tiến Độ, Công Việc & Liên Thông KPI (`plugins/project-task`)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | READ-S18-001 |
| Sprint | Sprint 18 — `sprint_18_plugin_project_task` |
| Trạng thái | APPROVED 1.0 (`CONF-S18-001` đã chốt `Q1`–`Q19` — Ready for Step 05 `SOL`) |
| Phiên bản | 1.0 |
| Điều phối / Cập nhật | AI BA & Coordinator Agent (`@agent-pm`) |
| Tài liệu nền tảng | [AGENTS.md](../../../AGENTS.md) · [core_sdlc.md](../../../.agents/rules/core_sdlc.md) · [ui_ux_standards.md](../../../.agents/rules/ui_ux_standards.md) · [api_standards.md](../../../.agents/rules/api_standards.md) |

---

## 1. Mục Tiêu Sprint 18

Xây dựng **Plugin Quản Lý & Điều Hành Dự Án, Công Việc Hàng Ngày, Tác Vụ Lặp Lại & Liên Thông KPI Nhân Viên (`plugins/project-task`)** đóng vai trò **Trung tâm Điều hành Thực thi Công việc Toàn diện (Cả Dự án/Hợp đồng lẫn Vận hành Thường xuyên Hàng ngày) & Đo lường Năng suất Định lượng (`Work Execution & Quantitative KPI Bridge Hub`)** trong Open-ERP, phục vụ **4 mô hình vận hành doanh nghiệp thực tế** trên **3 Không gian Công việc Độc lập (`PROJECT_WORKSPACE`, `DEPARTMENT_ROUTINE_STREAM`, `DAILY_DIRECT_AND_MY_DAY`)**:
1. **Dự án Phát triển Sản phẩm, Phần mềm & R&D (`Agile / Scrum / Kanban — Jira Archetype`)**: Product Backlog, Epic, User Story, Task, Bug, Sub-task; Sprint Planning/Active/Closed, theo dõi Sprint Scope Change, Story Points vs. Original/Remaining Estimate, WIP Limit Kanban, Velocity & Burndown/Burnup, vòng đời Code Review / QA Testing / Reopen.
2. **Dự án Triển khai Khách hàng, Xây lắp, EPC & Dịch vụ Kỹ thuật (`Waterfall / WBS / Gantt — Redmine & MS Project Archetype`)**: Cây dự án đa cấp (`Portfolio -> Parent Project -> Sub-project`), phân rã WBS (`Phase -> Deliverable/Milestone -> Task -> Sub-task`), Gantt với 4 loại phụ thuộc (`FS/SS/FF/SF` + `Lag/Lead`), đường găng (`Critical Path`), chốt Baseline gốc, cuộn `% Hoàn thành` có trọng số và nghiệm thu theo cột mốc thanh toán (`Milestone Billing` gắn với `crm` S14 & `accounting` S17).
3. **Điều hành Công việc Hàng ngày, Phối hợp Liên phòng ban & Tác vụ Lặp đi Lặp lại (`Daily Work, Shift Runbook & 4 Recurrence Archetypes`)**: Không ép buộc phải gắn Dự án/Hợp đồng — vận hành trực tiếp qua **Luồng Phòng ban (`DEPARTMENT_ROUTINE_STREAM`)** & **`My Day / Quick Dispatch`**. Hỗ trợ đầy đủ **4 mô hình lặp lại**: (a) Theo Lịch cố định & Ca làm việc kèm quy tắc dịch chuyển Ngày lễ (`SHIFT_TO_PREVIOUS / NEXT_WORKDAY`); (b) Lặp cuốn chiếu sau khi hoàn thành (`Rolling Recurrence`); (c) Bộ SOP theo sự kiện (`Onboarding/Offboarding/Stocktake/Month-End Close`); (d) **Bảng Kiểm Ca/Ngày gộp (`Daily Shift Runbook`)** chống rác Issue. Tích hợp **Bàn giao Ca (`Shift Handover`)**, **Tự động Thế chỗ khi Nghỉ phép (`Auto-Substitution` từ `attendance` S09)**, tự đóng quá hạn kỳ chống bấm bù (`Auto-Expire / Anti-Backdating`), và **Nghiệm thu Gộp Tuần kèm Hậu kiểm Ngẫu nhiên `10–20%` (`Weekly Batch & Spot-Check`)**.
4. **Trung tâm Xử lý Yêu cầu Nội bộ & Hỗ trợ Kỹ thuật (`Internal Service Desk / Ticket & SLA`)**: Tiếp nhận Ticket theo Tracker và mức ưu tiên (`P0–P3`), bộ đếm `First Response SLA` & `Resolution SLA` theo lịch làm việc (`attendance` S09) có cơ chế tạm dừng (`SLA Clock Pause`), và leo thang tự động (`Auto-Escalation`).

Đặc biệt, bằng cách **mổ xẻ cấu trúc & cơ chế hành vi theo phương pháp Reverse-Engineering (`REA`) trên Atlassian Jira và Redmine**, Sprint 18 hợp nhất những tinh hoa kiến trúc của hai nền tảng kinh điển (State Machine Workflow `Conditions/Validators/Post-Functions` + `Status vs. Resolution` của Jira; `Role x Tracker x IssueStatus Field Permission Matrix`, `Nested Sub-project Hierarchy`, `Rollup done_ratio` và `Gantt precedes/follows Auto-Reschedule` của Redmine), đồng thời khắc phục triệt để **3 điểm mù quản trị doanh nghiệp** của Jira/Redmine thuần túy bằng:
- **Động cơ Quy đổi Hiệu suất Công việc sang KPI Nhân viên (`Task-to-KPI Quantitative Engine` — 7 Công thức chuẩn + Cấu hình Tỷ trọng Dự án vs. Hàng ngày/Lặp lại)** đẩy số liệu định lượng (`Weighted OTD %`, `Accepted Weighted Output`, `Effort Efficiency %`, `First-Time-Right % / Reopen & Defect Rate`, `SLA Compliance %`, `PM Milestone/SPI/CPI`, `Daily & Routine Discipline Rate KPI-WRK-07`) kèm link minh chứng sang **`plugins/kpi` (Sprint 11)**;
- **Kiểm soát Chéo Chấm công (`plugins/attendance` Sprint 09)** chặn khai khống Worklog vượt giờ làm việc thực tế & tự động điều phối người làm thay (`Backup Assignee`) khi nhân sự nghỉ phép/nghỉ ca;
- **Cơ chế Chống Gian lận KPI 7 Tầng (`7-Layer Anti-Gaming Governance`: Baseline Lock, SoD Assignee != Reviewer, Blocker Audit, Attendance Cross-Check, Task Splitting Guard, Auto-Expire Anti-Backdating & Weekly Spot-Check Penalty, Ledger Snapshot)**.`

---

## 2. Bản Đồ Tài Liệu & Trình Tự Đọc (Bước 00–09)

| Bước | Mã tài liệu | Tệp | Nội dung chính | Phiên bản | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `00` | `READ-S18-001` | [00_READING_GUIDE.md](./00_READING_GUIDE.md) | Định hướng đọc, danh mục tệp, phụ thuộc 10 plugin, cổng xác nhận Sprint 18 | `1.0` | Active |
| `01` | `RAW-S18-001` | [01_RAW-S18-001_project_task_management_requirements.md](./01_raw_notes/01_RAW-S18-001_project_task_management_requirements.md) | Phân tích 3 không gian việc, 4 mô hình vận hành (bổ sung chuyên sâu **Việc Hàng ngày, 4 mô hình Lặp lại, Daily Shift Runbook, Auto-Substitution**) & 13 trụ cột nghiệp vụ | `0.2` | Approved (via `CONF-S18-001`) |
| `03` | `BENCH-S18-001` | [01_BENCH-S18-001_project_task_jira_redmine_benchmarks.md](./03_benchmarks/01_BENCH-S18-001_project_task_jira_redmine_benchmarks.md) | Phân tích **Reverse-Engineering (`REA`) Jira & Redmine** (kể cả cách Jira/Redmine xử lý & điểm yếu với Việc lặp lại/Runbook ca) + Đối sánh 12 hệ thống (bổ sung `1C/Bitrix24`, `SafetyCulture / Process Street`) & 16 bài học | `0.2` | Approved (via `CONF-S18-001`) |
| `02` | `ANL-S18-001` | [01_ANL-S18-001_project_task_kpi_workflows.md](./02_analysis/01_ANL-S18-001_project_task_kpi_workflows.md) | Kiến trúc `3 Work Containers`, Động cơ 4 mô hình Lặp lại + Shift Handover + Auto-Substitution, **7 công thức Task-to-KPI (`KPI-WRK-01..07`)** + Tỷ trọng Hỗn hợp, **Chống gian lận 7 tầng & Nghiệm thu 3 cấp (Spot-Check)**, **12 luồng End-to-End**, `BR-W01..W28`, `15 Edge Cases`, `36 User Stories` | `0.2` | Approved (via `CONF-S18-001`) |
| `04` | `CONF-S18-001` | [01_CONF-S18-001_sprint_18_scope_and_ac.md](./04_confirmation/01_CONF-S18-001_sprint_18_scope_and_ac.md) | 19 câu hỏi chốt quyết định (`Q1`–`Q19`), Phạm vi In/Out-of-Scope & 32 Acceptance Criteria (`AC-01`..`AC-32`) | `1.0` | APPROVED 1.0 (2026-11-15) |
| `05` | `SOL-S18-*` | `05_solutions/` *(Chưa tạo)* | Giải pháp kiến trúc, Multi-tenant, Data Flow & Plugin Isolation (`SOL-S18-*`) | — | Open (Ready for SOL) |
| `06` | `DES-S18-*` | `06_designs/` *(Chưa tạo)* | Chỉ khởi tạo sau `SOL-S18-*` | — | Locked (Pending `SOL`) |
| `07` | `FEAT/TASK-*` | `07_items/` *(Chưa tạo)* | Chỉ tách item lập trình sau `DES-S18-*` | — | Locked (Pending `DES`) |
| `08` | `QA-S18-*` | `08_testing/` *(Chưa tạo)* | Dual-Mode Browser Testing (Desktop `>= 1280px` & Mobile `390x844px`) + Backend Integration Test (PostgreSQL & Redis thật) | — | Locked |
| `09` | `REV-S18-*` | `09_review/` *(Chưa tạo)* | Nghiệm thu Sprint DoD Gate | — | Locked |

---

## 3. Liên Kết Phụ Thuộc Hệ Thống & 10 Plugin Liên Quan

| Hệ thống / Sprint | Vai trò đối với `plugins/project-task` | Ràng buộc tích hợp |
| :--- | :--- | :--- |
| **Core Platform & IAM** | Xác thực `tenant_id`, RBAC chức năng + Data Scope theo Dự án (`Project Member Role`), Phòng ban, Danh mục công việc bảo mật | Cô lập tuyệt đối `tenant_id` trên mọi truy vấn Project, WorkItem, Worklog, KPI Snapshot; đăng ký mọi entity tại [Entity Registry](../../system/entity_registry/README.md) |
| **Plugin `employee` (Sprint 07)** | Cung cấp hồ sơ nhân sự (`employee_id`), Phòng ban, Chức vụ (`Job Grade`), Quản lý trực tiếp (`Direct Manager`) để phân công, định mức năng lực (`Capacity`) và xác định người nghiệm thu (`Reviewer`) | Liên kết qua `PluginDataServiceGrpc` / Sync Cache; xem [Sprint 07 Reading Guide](../sprint_07_plugin_employee/00_READING_GUIDE.md) |
| **Plugin `form` (Sprint 08)** | Kết xuất & tùy biến biểu mẫu 3 tầng (`System -> Tenant -> Branch/Project Type`) cho `Project Charter`, `WorkItem` theo từng `Tracker/Issue Type` (Story, Bug, Task, EPC Work Package, Ticket), `TimeEntry Worklog`, `Milestone Acceptance` | Bảo vệ `System Locked Core Fields` (`project_id`, `tracker_type`, `status`, `due_date`, `estimated_hours`, `story_points`); lưu `custom_fields_data` (`JSONB`) + `form_version`; xem [Sprint 08 Reading Guide](../sprint_08_plugin_form_workflow/00_READING_GUIDE.md) |
| **Plugin `workflow` (Sprint 08)** | Thực thi luồng phê duyệt `DOA/SoD` cho Khởi tạo Dự án vượt ngân sách, **Đơn xin điều chỉnh Baseline (`Baseline Change Request`)**, Nghiệm thu Milestone, và kết nối với State Machine nội bộ của WorkItem | Tái sử dụng Workflow Engine cho luồng duyệt quản trị (`Change Request / Sign-off`); State Machine tốc độ cao của WorkItem chạy theo ma trận cấu hình kế thừa từ `workflow` |
| **Plugin `attendance` (Sprint 09)** | Cung cấp Lịch làm việc & Ngày lễ chuẩn của từng Chi nhánh (`Working Calendar` để tính `Due Date`, `Gantt`, `SLA Clock`), Trạng thái nghỉ phép/công tác để cảnh báo quá tải/trùng lịch khi giao việc, và **Tổng giờ công thực tế + OT hợp lệ trong ngày** để đối chiếu chéo `TimeEntry (Worklog)` | Chặn hoặc gắn cờ bất thường nếu tổng Worklog trong ngày vượt giờ chấm công hợp lệ; xem [Sprint 09 Reading Guide](../sprint_09_plugin_attendance_timesheet/00_READING_GUIDE.md) |
| **Plugin `payroll` (Sprint 10)** | Nhận tổng hợp giờ công `Billable / Non-billable` theo Dự án để phân bổ chi phí nhân công trực tiếp theo dự án (`Project Labor Cost`), và dùng điểm hiệu suất công việc / thưởng dự án (nếu Tenant cấu hình) làm biến đầu vào bảng lương | Phát sự kiện `project_task.timesheets.period_closed` Idempotent; xem [Sprint 10 Reading Guide](../sprint_10_plugin_payroll/00_READING_GUIDE.md) |
| **Plugin `kpi` (Sprint 11)** | **Đích tiếp nhận dữ liệu hiệu suất định lượng (`Primary Quantitative KPI Source`)**: `plugins/project-task` định kỳ hoặc theo sự kiện nghiệm thu phát `project_task.kpi_actuals.computed` và `project_task.task.accepted` qua Event Subscription Channel (`AC-C04` / `Q5` tại `CONF-S11-001`), tự động điền `Actual` và gắn `evidence_snapshot_url` vào `KpiAssignment` | Tôn trọng quy tắc phân kỳ (`MONTHLY / QUARTERLY`), làm tròn, trần `120%` (`CONF-S11-001 Q9`), và hỗ trợ chỉ số thuận lẫn ngược (`LOWER_IS_BETTER` cho Bug/Reopen); xem [Sprint 11 Reading Guide](../sprint_11_plugin_kpi/00_READING_GUIDE.md) |
| **Plugin `office-webapp` (Sprint 12)** | Đính kèm, lưu trữ và xem trước trực tiếp tài liệu đặc tả (`PRD`, `SRS`), bản vẽ kỹ thuật, biên bản họp, minh chứng nghiệm thu ngay trên từng Dự án / WorkItem / Checklist | Giao tiếp qua Document/Attachment Proxy; xem [Sprint 12 Reading Guide](../sprint_12_office_webapp/00_READING_GUIDE.md) |
| **Plugin `crm` (Sprint 14)** | Tự động khởi tạo Dự án triển khai (`Delivery Project`) và danh sách `Billing Milestones` khi Hợp đồng bán hàng / Cơ hội thắng (`Sales Contract Won`) được xác nhận; đồng bộ tiến độ thực hiện hợp đồng về cho Sales/AM theo dõi | Giao tiếp qua Kafka Outbox + `PluginDataServiceGrpc`; xem [Sprint 14 Reading Guide](../sprint_14_plugin_crm/00_READING_GUIDE.md) |
| **Plugin `purchasing` (Sprint 15)** | Cho phép tạo & gắn Yêu cầu mua hàng (`PR`), Đơn mua hàng (`PO`), Hợp đồng thầu phụ theo mã `project_id` và `wbs_task_id` để theo dõi tiến độ vật tư phục vụ thi công/dự án | Đồng bộ trạng thái hàng về để mở khóa các Task đang bị `BLOCKED_BY_PROCUREMENT`; xem [Sprint 15 Reading Guide](../sprint_15_plugin_purchasing/00_READING_GUIDE.md) |
| **Plugin `document-template` (Sprint 16)** | Thiết kế & kết xuất PDF/DOCX + Gửi email tự động cho: `Tuyên bố Khởi động Dự án (Project Charter)`, `Biên bản Nghiệm thu Giai đoạn / Bàn giao Dự án (Milestone Sign-off)`, `Báo cáo Tiến độ Dự án Tuần/Tháng (Project Status Report)`, `Sổ Giao Ca / Bảng Kiểm Hàng Ngày (Daily Runbook & Shift Handover Report)`, `Bảng Tổng hợp Worklog Timesheet`, và `Phiếu Đối soát Hiệu suất Công việc & KPI Cá nhân` | Sử dụng hạ tầng `Render Engine` + `Mail Merge` của Sprint 16 qua `PluginDataServiceGrpc` & Drawer `?drawer=doc-output`; xem [Sprint 16 Reading Guide](../sprint_16_plugin_document_template/00_READING_GUIDE.md) |
| **Plugin `accounting` (Sprint 17)** | Cung cấp mã `project_id` làm Chiều phân tích Sổ cái (`Project Cost Center / P&L`), chuyển tổng giờ công/chi phí thực hiện sang Chi phí Dự án (`TK 154/632`) và kích hoạt sự kiện Đề nghị xuất hóa đơn / Thanh toán khi `Billing Milestone` được khách hàng nghiệm thu (`Sign-off`) | Liên kết chặt 2 chiều giữa `Milestone` (`project-task`) và `Milestone Billing / Project P&L` (`accounting`); xem [Sprint 17 Reading Guide](../sprint_17_plugin_accounting/00_READING_GUIDE.md) |

---

## 4. Bảng Kiểm Tra Xác Nhận (Confirmation Gate Checklist)

> [!IMPORTANT]
> Theo quy trình SDLC 9 bước của Open-ERP, nghiêm cấm chuyển sang Bước 05 (`05_solutions/`) hoặc viết mã nguồn khi **Confirmation Checklist** dưới đây chưa được Khách hàng phê duyệt rõ ràng.

| Hạng mục | Mô tả kiểm tra | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- |
| `RAW-S18-001` | Yêu cầu gốc chuẩn hóa cho **3 Không gian Công việc** (`Project`, `Department Routine Stream`, `Daily Direct & My Day`), **4 mô hình vận hành**, **4 mô hình công việc lặp lại (`Calendar/Shift`, `Rolling`, `Event SOP`, `Daily Shift Runbook`)**, và 13 trụ cột nghiệp vụ | Approved (1.0) | Đã nâng cấp `v0.2`, duyệt kèm `CONF-S18-001` (2026-11-15) |
| `BENCH-S18-001` | Phân tích Reverse-Engineering (`REA`) chuyên sâu **Jira & Redmine** (gồm khoảng trống với Việc hàng ngày/lặp lại) + Đối sánh 12 nền tảng + 16 bài học kiến trúc | Approved (1.0) | Đã nâng cấp `v0.2`, duyệt kèm `CONF-S18-001` (2026-11-15) |
| `ANL-S18-001` | Đặc tả Kiến trúc `3 Work Containers`, Động cơ Lặp lại + Auto-Substitution + Shift Handover, 5 chỉ số điều hành, **7 Công thức Tính KPI Nhân viên Tự động (`KPI-WRK-01..07`)** + Tỷ trọng Hỗn hợp, **Chống Gian lận 7 Tầng**, Nghiệm thu 3 cấp (`Weekly Batch & Spot-Check`), **12 luồng End-to-End**, `BR-W01..W28`, `15 Edge Cases`, `36 User Stories` | Approved (1.0) | Đã nâng cấp `v0.2`, duyệt kèm `CONF-S18-001` (2026-11-15) |
| `CONF-S18-001` | Khách hàng review & chốt 19 câu hỏi (`Q1`–`Q19`) và ký duyệt 32 Acceptance Criteria (`AC-01`..`AC-32`) | APPROVED 1.0 | Đã chốt 19/19 theo Đề xuất BA (2026-11-15); Mở khóa Bước 05 (`SOL`) |
