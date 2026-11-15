# Tài Liệu Thu Thập & Chuẩn Hóa Yêu Cầu Gốc — Sprint 18 (`plugins/project-task`)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | RAW-S18-001 |
| Sprint | Sprint 18 (`sprint_18_plugin_project_task`) |
| Tác giả | AI Business Analyst (BA) |
| Trạng thái | DRAFT — Chờ Khách hàng xác nhận tại Gate `CONF-S18-001` |
| Phiên bản | 0.2 |
| Tài liệu liên quan | [00_READING_GUIDE.md](../00_READING_GUIDE.md) · [BENCH-S18-001](../03_benchmarks/01_BENCH-S18-001_project_task_jira_redmine_benchmarks.md) · [ANL-S18-001](../02_analysis/01_ANL-S18-001_project_task_kpi_workflows.md) |

---

## 1. Bối Cảnh & Yêu Cầu Cốt Lõi Từ Khách Hàng

Trong một doanh nghiệp vừa và lớn sử dụng Open-ERP, các phân hệ trước đã xử lý tốt quản trị nhân sự, chấm công (`S09`), tiền lương (`S10`), khung KPI (`S11`), bán hàng (`S14`), mua hàng (`S15`), kết xuất tài liệu (`S16`) và tài chính kế toán (`S17`). Tuy nhiên, phần lớn doanh nghiệp vẫn phải dùng rời rạc **Jira**, **Redmine**, **Trello**, **Asana**, **MS Project** hoặc **Zalo/Excel** bên ngoài để giao việc và theo dõi tiến độ. Sự đứt gãy này gây ra 4 hệ lụy nghiêm trọng:
1. **Đứt gãy dữ liệu Dự án — Tài chính**: Hợp đồng đã ký bên CRM (`S14`) hoặc Mua sắm bên Purchasing (`S15`) không tự liên kết sang đội triển khai; Kế toán (`S17`) không nắm được tiến độ nghiệm thu theo cột mốc để xuất hóa đơn hay tập hợp chi phí nhân công (`Worklog`) theo dự án.
2. **Đánh giá KPI nhân viên cảm tính ("Bôi đẹp số liệu")**: Tại `plugins/kpi` (`S11`), nhân viên vẫn phải tự điền kết quả hoàn thành công việc cuối tháng hoặc quản lý chấm tay vì không có hệ thống đo lường khách quan: *Bao nhiêu task đúng hạn? Trễ mấy ngày? Chất lượng làm lại (Reopen/Bug) ra sao? Tốn bao nhiêu giờ so với ước lượng?*
3. **Khai khống giờ công (`Worklog Gaming`)**: Nhân viên log 10–12 tiếng/ngày vào dự án để tính chi phí hoặc thể hiện sự bận rộn, trong khi bảng chấm công (`attendance` `S09`) ghi nhận nghỉ phép hoặc chỉ có mặt 8 tiếng.
4. **Hành vi lách luật KPI khi dùng công cụ thuần kỹ thuật**: Nhân viên tự ý lùi hạn (`Due Date`) ngay trước khi hết hạn, tự bấm `Done` dù chưa được QA/Quản lý kiểm tra, hoặc xé 1 đầu việc đơn giản thành 20 task nhỏ để "cày" số lượng hoàn thành.
5. **Bỏ quên mảng Công việc Hàng ngày & Lặp đi Lặp lại (70–80% khối lượng vận hành thực tế)**: Trong thực tế doanh nghiệp, phần lớn nhân sự phòng ban (Kế toán, Nhân sự, Hành chính, Kho, Cửa hàng, Kỹ thuật trực ca, Mua hàng, Chăm sóc khách hàng) **không làm việc theo Dự án/Hợp đồng có ngày kết thúc**, mà vận hành **Công việc hàng ngày phát sinh** và **Công việc lặp đi lặp lại theo ca/ngày/tuần/tháng/kỳ chốt sổ**. Nếu hệ thống ép mọi việc phải tạo "Dự án" hoặc đẻ ra hàng trăm Issue rời rạc mỗi tháng sẽ gây quá tải thao tác, không xử lý được tình huống **nghỉ phép phải tự đẩy việc định kỳ sang người làm thay**, và khiến Trưởng phòng "ngợp" nếu ngày nào cũng phải bấm duyệt thủ công hàng trăm đầu việc nhỏ.

**Mục tiêu yêu cầu**: Thiết kế `plugins/project-task` kết hợp chiều sâu kỹ thuật quản lý Dự án/Hợp đồng của **Jira** và **Redmine** (được phân tích bằng phương pháp luận Reverse-Engineering `REA`) với hệ điều hành **Công việc Hàng ngày (`Daily Work & My Day`) + Công việc Lặp đi Lặp lại (`Recurring / Daily Shift Runbook / SOP Routines`)** hoàn chỉnh, và **Động cơ Liên thông Tính KPI Nhân viên Tự động & Minh bạch**.

---

## 2. Phân Tích 3 Không Gian Công Việc & 4 Mô Hình Vận Hành Thực Tế

Doanh nghiệp hiếm khi chỉ vận hành một phương pháp duy nhất. Plugin không ép mọi đầu việc phải gắn "Dự án/Hợp đồng" mà cung cấp **3 Không gian Công việc Độc lập (`Work Containers`)**:
- **`PROJECT_WORKSPACE`**: Dành cho Dự án, Hợp đồng, Chiến dịch có ngày bắt đầu/kết thúc, Ngân sách và Cột mốc (`Sprint / WBS / Gantt`).
- **`DEPARTMENT_ROUTINE_STREAM`**: Không gian vận hành thường xuyên liên tục gắn trực tiếp với `Phòng ban / Chi nhánh / Kho / Cửa hàng` (`department_id` / `branch_id`) — nơi chứa các quy trình lặp lại, đầu việc vận hành định kỳ và bảng kiểm ca làm việc mà **không cần tạo Project giả**.
- **`DAILY_DIRECT_AND_MY_DAY`**: Không gian Giao việc nhanh hàng ngày (`Quick Dispatch`), Yêu cầu phối hợp chéo liên phòng ban (`Inter-department Request`) và Bảng kế hoạch trong ngày của cá nhân (`My Day Plan & End-of-Day Handover`).

Trên 3 không gian đó, hệ thống vận hành mượt mà **4 Mô hình Thực tế**:

### 2.1. Mô Hình 1: Dự Án Phát Triển Sản Phẩm, Phần Mềm & R&D (`Agile / Scrum / Kanban — Jira Archetype`)
- **Đối tượng sử dụng**: Phòng R&D, Kỹ thuật phần mềm, Thiết kế sản phẩm, Phát triển tính năng mới.
- **Đặc trưng vận hành**:
  - Phân cấp `Initiative / Theme -> Epic -> User Story / Technical Task / Bug -> Sub-task`.
  - Quản lý `Product Backlog` được sắp xếp ưu tiên (`Backlog Ranking / Drag-and-Drop Priority`).
  - Lập kế hoạch `Sprint` (chu kỳ 1–4 tuần): chọn hạng mục vào `Sprint`, đánh giá năng lực nhóm (`Capacity Planning`), ghi nhận **Sprint Commitment Baseline** khi bấm `Start Sprint`, theo dõi các task **thêm mới hoặc rút khỏi Sprint giữa chừng (`Scope Change Tracking`)**.
  - Hai hệ quy chiếu ước lượng song song: **`Story Points`** (đo độ phức tạp/giá trị đầu ra để tính KPI khối lượng) và **`Time Tracking` (`Original Estimate`, `Remaining Estimate`, `Time Spent`)**.
  - Bảng **Kanban Board** cấu hình cột linh hoạt theo nhóm trạng thái, thiết lập **WIP Limit (`Max Items per Column`)** để tránh nghẽn cổ chai ở bước `Code Review` hoặc `QA Testing`.
  - Báo cáo đặc thù: `Sprint Burndown Chart`, `Epic/Release Burnup Chart`, `Team Velocity History`, `Cumulative Flow Diagram (CFD)`.

### 2.2. Mô Hình 2: Dự Án Triển Khai Khách Hàng, Xây Lắp, EPC & Dịch Vụ Kỹ Thuật (`Waterfall / WBS / Gantt — Redmine & MS Project Archetype`)
- **Đối tượng sử dụng**: Công ty Tư vấn/Triển khai ERP, Agency Marketing, Tổng thầu Xây lắp/Cơ điện (EPC), Gia công đơn hàng lớn.
- **Đặc trưng vận hành**:
  - **Cấu trúc Cây Dự án Đa tầng (`Project Hierarchy`)**: Dự án mẹ (Hợp đồng tổng) chứa nhiều Dự án con (`Sub-projects` theo từng chi nhánh/hạng mục), hỗ trợ kế thừa nhân sự hoặc phân quyền độc lập từng dự án con.
  - **WBS Đa cấp (`Work Breakdown Structure`)**: `Phase (Giai đoạn) -> Deliverable / Milestone (Cột mốc bàn giao) -> Task (Công việc chính) -> Sub-task`.
  - **Biểu đồ Gantt & Mạng Công việc (`Critical Path Method`)**: Hỗ trợ 4 loại phụ thuộc có trễ (`FS - Finish-to-Start`, `SS - Start-to-Start`, `FF - Finish-to-Finish`, `SF - Start-to-Finish` + `Lag/Lead days`). Tự động tính đường găng (`Critical Path`) và dời lịch dây chuyền (`Auto-Reschedule`) khi công việc tiền nhiệm thay đổi ngày kết thúc.
  - **Chốt Kế hoạch Gốc (`Baseline Lock`) & Đường S-Curve**: Lưu snapshot `Baseline Plan` trước khi chạy; đối chiếu liên tục `Planned Progress vs. Actual Progress (% Done)` và tính chỉ số `SPI` (Schedule Performance Index), `CPI` (Cost Performance Index).
  - **Cuộn Tiến độ (`Weighted % Done Rollup`)**: `% Hoàn thành` của Task cha/Phase/Milestone tự động tính bằng trung bình trọng số theo `Estimated Hours` (hoặc `Weight`) của các Task con bên dưới.
  - **Nghiệm thu Cột mốc Gắn Doanh thu (`Billing Milestone Sign-off`)**: Khi Milestone chuyển sang `Client Accepted` (kèm Biên bản nghiệm thu từ `plugins/document-template` S16), tự động báo sang `crm` (S14) & `accounting` (S17) để xuất hóa đơn thu tiền đợt.

### 2.3. Mô Hình 3: Điều Hành Công Việc Hàng Ngày (`Daily Work`) & Tác Vụ Lặp Đi Lặp Lại (`Recurring / Shift Runbook / SOP`)
- **Đối tượng sử dụng**: Khối Phòng ban chức năng (Kế toán, Nhân sự, Hành chính, Mua hàng, Marketing), Vận hành Chi nhánh/Cửa hàng bán lẻ, Thủ kho, Đội Kỹ thuật trực ca/bảo trì, và quản lý giao việc hàng ngày của các Trưởng bộ phận.
- **Đặc trưng vận hành thực tế**:
  1. **Công việc Hàng ngày Không Gắn Dự án (`Daily Ad-hoc & My Day`)**:
     - Giao việc đột xuất 1 chạm (`Quick Dispatch`: Người nhận + Hạn trong ngày + Kết quả mong đợi + Trọng số) hoặc Gửi việc phối hợp liên phòng ban (`Inter-department Request` — VD Kinh doanh nhờ Kế toán xuất hóa đơn gấp, HR nhờ IT cấp máy tính) kèm đánh giá mức độ hài lòng nội bộ (`Internal CSAT`).
     - Màn hình **`My Day` (Việc hôm nay của tôi)**: Gom toàn bộ việc đến hạn hôm nay, việc lặp lại trong ca/ngày, việc quá hạn chưa xong và cho phép nhân viên ghim ưu tiên đầu ngày (`Morning Focus`) + tổng kết bàn giao cuối ngày (`End-of-Day Wrap-up`).
  2. **4 Mô hình Công việc Lặp đi Lặp lại (`4 Recurrence Archetypes`)**:
     - *Lặp theo Lịch Cố định & Ca làm việc (`Calendar & Shift-Based Recurrence`)*: Theo Ca (`Đầu ca / Giữa ca / Cuối ca` đồng bộ danh mục Ca từ `attendance` S09), Hàng ngày, Hàng tuần, Ngày làm việc thứ $N$ hoặc cuối cùng của tháng, Quý, Năm. Hỗ trợ **Quy tắc Dịch chuyển Ngày Lễ/Cuối tuần (`Holiday Shift Policy`)**: tự đẩy lên ngày làm việc liền trước (`SHIFT_TO_PREVIOUS_WORKDAY` — dùng cho chốt lương/thuế), lùi sang ngày làm việc sau (`SHIFT_TO_NEXT_WORKDAY`), hoặc giữ nguyên (`KEEP_EXACT_DATE` — cho đội trực 24/7).
     - *Lặp Cuốn chiếu Sau khi Hoàn thành (`Trigger-After-Completion / Rolling Recurrence`)*: Kỳ tiếp theo chỉ tự sinh sau $N$ ngày/giờ tính từ thời điểm hoàn tất kỳ hiện tại (`completed_at + interval` — dùng cho bảo trì định kỳ máy móc, vệ sinh công nghiệp, kiểm kê an toàn, chăm sóc khách hàng định kỳ).
     - *Bộ Công việc Lặp theo Sự kiện Chuẩn (`Event-Driven SOP Bundle`)*: Tự động sinh chuỗi đầu việc liên phòng ban mỗi khi có sự kiện nghiệp vụ phát sinh (`Nhân viên mới Onboarding`, `Nghỉ việc Offboarding`, `Kiểm kê cuối tháng`, `Khóa sổ Kế toán cuối kỳ`).
     - *Bảng Kiểm Ca/Ngày Gộp (`Daily Shift Runbook / Consolidated Checklist Matrix`)*: Giải quyết bài toán nhân viên kho/cửa hàng/trực ca phải làm 10–25 đầu việc lặp giống hệt nhau mỗi ngày — thay vì đẻ ra 25 Issue rác/ngày, hệ thống sinh **1 Phiếu Runbook Ca/Ngày** gồm các khung giờ (`08:00`, `12:00`, `17:30`), đính kèm ảnh chụp/số đo từng dòng và tính `% Hoàn thành Ca`.
  3. **Xử lý Thực tế Khi Nghỉ Phép & Chuyển Ca (`Auto-Substitution & Shift Handover`)**:
     - Cấu hình **`Backup Assignee Matrix`** (`Primary -> Backup 1 -> Backup 2 / Round-Robin`) cho từng mẫu việc định kỳ: mỗi đầu ngày/đầu ca, hệ thống kiểm tra đơn nghỉ phép từ `plugins/attendance` (S09); nếu người chính nghỉ, phiên việc ngày đó tự động giao cho người làm thay và cộng điểm KPI cho người làm thay.
     - Hỗ trợ **Bàn giao Ca / Cuối ngày (`Shift Handover`)**: Phần việc chưa xong cuối ca được bàn giao kèm ghi chú sang ca tiếp theo hoặc chuyển sang hôm sau.
  4. **Kiểm soát Chống Đánh Dấu Bù & Nghiệm Thu Gộp (`Auto-Expire & Weekly Spot-Check`)**:
     - Việc hàng ngày/theo ca có cửa sổ thời gian hiệu lực (`Time-Window Cutoff`); quá hạn không làm tự động khóa chuyển sang **`Missed Occurrence`** để chặn việc cuối tháng mới bấm `Done` bù loạt việc hàng ngày.
     - Tránh gây quá tải cho Quản lý: thay vì ngày nào cũng bắt Sếp ký từng việc lặp nhỏ, hỗ trợ **Nghiệm thu Gộp Tuần (`Weekly Batch Sign-off`) kèm Hậu kiểm Ngẫu nhiên `10–20%` (`Random Spot-Check`)** trên minh chứng ảnh/số liệu đã nộp.

### 2.4. Mô Hình 4: Trung Tâm Tiếp Nhận Yêu Cầu Nội Bộ & Hỗ Trợ Kỹ Thuật (`Service Desk / Ticket & SLA`)
- **Đối tượng sử dụng**: IT Helpdesk nội bộ, Bộ phận Hành chính/Bảo trì thiết bị, Đội CSKH/Bảo hành sau bán hàng (`After-Sales Support`).
- **Đặc trưng vận hành**:
  - Tiếp nhận yêu cầu qua Portal Form chuẩn (`plugins/form` S08) hoặc Email-to-Ticket tự động phân loại theo `Tracker` (`Sự cố`, `Yêu cầu cấp quyền`, `Bảo trì`, `Khiếu nại`) và `Severity / Priority` (`P0 Critical`, `P1 High`, `P2 Medium`, `P3 Low`).
  - **Bộ Đếm SLA Hai Chặng (`Dual SLA Clocks`)**: Theo dõi thời gian phản hồi đầu tiên (`First Response SLA`) và thời gian xử lý dứt điểm (`Resolution SLA`).
  - **Tính giờ SLA theo Lịch Làm việc (`Business Hours Calendar`)** lấy từ `plugins/attendance` (S09) và **Tự động Tạm dừng Đồng hồ SLA (`SLA Clock Pause`)** khi Ticket ở trạng thái `Waiting for Requester / Waiting for Vendor`.
  - **Quy tắc Cảnh báo & Leo thang Tự động (`Auto-Escalation`)**: Khi tiêu thụ `75%` quỹ thời gian SLA, cảnh báo người xử lý; đạt `90%` hoặc `100% (Breached)`, tự động nhắc Trưởng nhóm/Quản lý qua `in-app-notification`.

---

## 3. 13 Trụ Cột Nghiệp Vụ Cốt Lõi Của `plugins/project-task`

1. **Kiến trúc 3 Không gian Công việc (`Project Workspace`, `Department Routine Stream`, `Daily Direct & My Day`)**: Tách biệt rõ dự án có điểm kết thúc với luồng công việc hàng ngày/thường xuyên phòng ban, hỗ trợ `Project Templates` bật/tắt module linh hoạt.
2. **Định nghĩa `Tracker / Issue Type` & Biểu mẫu Động 3 Tầng (`plugins/form` S08)**: Mỗi loại đầu việc (`Epic`, `Story`, `Task`, `Bug`, `Ticket`, `Change Request`, `Milestone Deliverable`, `Daily Routine / Shift Runbook`) có tập trường chuẩn khóa cứng kết hợp trường mở rộng tùy biến theo Tenant/Chi nhánh/Phòng ban (`System -> Tenant -> Project/Routine Type`).
3. **Động cơ Quy trình Trạng thái & Ma trận Phân quyền 3 Chiều (`Workflow State Machine + Role x Tracker x Status Field Matrix`)**: Kết hợp `Conditions / Validators / Post-Functions` + `Status vs. Resolution` (Jira) với Ma trận `Read-only / Required / Editable` theo Vai trò tại từng Trạng thái (Redmine).
4. **Hoạch định Tiến độ, Phụ thuộc Đa dạng & Quản lý Baseline (`Scheduling, Gantt & Baseline Lock`)**: Hỗ trợ phụ thuộc `FS/SS/FF/SF` + `Lag`, tính đường găng (`Critical Path`), tự động dời lịch dây chuyền, chốt và lưu lịch sử nhiều phiên bản `Baseline`, yêu cầu duyệt `Baseline Change Request` qua `plugins/workflow` (S08).
5. **Hệ điều hành Công việc Hàng ngày & 4 Mô hình Lặp đi Lặp lại (`Daily Work, Shift Runbook & Auto-Substitution`)**: Lặp theo Lịch/Ca (`Holiday Shift Policy`), Lặp cuốn chiếu (`Rolling`), SOP theo sự kiện, và Bảng kiểm Ca gộp (`Daily Runbook`); kết hợp `My Day`, Bàn giao ca (`Shift Handover`), Tự động thế chỗ khi nghỉ phép (`Backup Matrix` nối `attendance` S09) và Tự đóng quá hạn kỳ (`Auto-Expire`).
6. **Điều phối Nguồn lực & Cân bằng Tải (`Resource Allocation & Workload Heatmap`)**: Cảnh báo quá tải (`> 100%` công suất ngày/tuần — tính gộp cả việc Dự án lẫn việc Định kỳ hàng ngày), đồng bộ trực tiếp lịch nghỉ phép từ `plugins/attendance` (S09) và kéo thả điều chuyển.
7. **Ghi nhận Thời gian (`TimeEntry Worklog`) & Đối soát Chéo Chấm công (`S09/S10`)**: Phân loại giờ làm việc theo hoạt động (`Design`, `Dev`, `QA`, `Ops`, `On-site`) và cờ `Billable / Non-billable`; đối chiếu chéo tổng giờ chấm công thực tế + OT hợp lệ từ `plugins/attendance` và đẩy giờ công sang `plugins/payroll` (S10).
8. **Quản trị Rủi ro, Vấn đề & Yêu cầu Thay đổi (`RAID Log & Scope Change`)**: Theo dõi `Risks`, `Assumptions`, `Issues/Blockers`, `Dependencies`, và `Change Requests` gắn trực tiếp vào Dự án và tác động lên `Deadline/Cost/KPI Baseline`.
9. **Quản trị Cột mốc Thanh toán & Chi phí Dự án (`crm` S14, `purchasing` S15, `accounting` S17)**: Khởi tạo dự án từ Hợp đồng `CRM`, liên kết `PR/PO` vật tư/thầu phụ, tổng hợp doanh thu-chi phí thực tế (`Project P&L` / `EV - PV - AC`) và kích hoạt nghiệm thu thanh toán.
10. **Động cơ Quy đổi Hiệu suất Công việc sang KPI Nhân viên (`Task-to-KPI Quantitative Engine -> plugins/kpi` S11)**: Tự động lượng hóa **7 nhóm chỉ số** (`OTD %`, `Weighted Output`, `Effort Efficiency %`, `First-Time-Right / Reopen & Defect Rate`, `SLA Compliance %`, `PM Milestone & SPI/CPI`, và **`KPI-WRK-07 Daily & Routine Discipline %`**) kèm **Cấu hình Tỷ trọng Hỗn hợp Dự án vs. Hàng ngày** và bảng truy vết minh chứng (`Evidence Drill-down Snapshot`).
11. **Cơ chế Chống Gian lận & Nghiệm thu 3 Cấp (`7-Layer Anti-Gaming, Auto-Expire & Weekly Batch Spot-Check`)**: Khóa Baseline, `SoD (Assignee != Reviewer)`, Kiểm soát `Blocked`, Đối soát chấm công, Chống xé nhỏ task ảo, Đóng phiên quá hạn chống bấm bù (`Auto-Expire`), và Nghiệm thu gộp tuần kèm Hậu kiểm ngẫu nhiên `10–20%` (`Spot-Check Penalty`).
12. **Lưu Vết Lịch Sử Bất Biến 4 Tầng & Tự động hóa Quy tắc (`4-Layer Audit Trail & Rule Automation`)**: Ghi nhận mọi thay đổi trường (`Field Diff History`), thay đổi trạng thái (`Workflow Transition Log`), liên kết phả hệ (`Lineage Graph`), và động cơ Automation Rule (`Trigger -> Condition -> Action`).
13. **Kết xuất Hồ sơ Dự án/Nghiệm thu/Bảng kiểm Ca (`plugins/document-template` S16) & Đa Góc nhìn (`My Day, List, Kanban, Gantt, Runbook, Workload`)**: Kết xuất `Project Charter`, `Biên bản Nghiệm thu`, `Báo cáo Tiến độ`, `Sổ Giao Ca / Runbook`, `Bảng KPI Công việc` qua Sprint 16; giao diện Web/Mobile `@shared/*`, Sticky Scroll Table, Context Menu chuột phải, URL-synced State, 100% i18n, Zero-Emoji.
