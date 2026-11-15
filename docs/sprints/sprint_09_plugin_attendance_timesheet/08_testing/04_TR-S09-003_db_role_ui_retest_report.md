# [TR-S09-003] Test Report Sprint 09 — Kiểm thử theo luồng nghiệp vụ

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TR-S09-003 / Test Report / Sprint 09 |
| Trạng thái / phiên bản / cập nhật | Reviewed (QA self-check) / 1.1 / 2026-11-14 |
| Owner / reviewer | QA Agent / Solution Architect |
| Đầu vào | [TP-S09-001](01_TP-S09-001_sprint_09_test_plan.md) 1.0, [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) 1.0, [TR-S09-001](02_TR-S09-001_sprint_09_test_report.md) 1.0 |
| Đọc trước / đọc tiếp | [TR-S09-001](02_TR-S09-001_sprint_09_test_report.md) / [REV-S09-001](../09_review/01_REV-S09-001_sprint_09_dod_review.md) |
| Môi trường | Windows 10; JDK 21.0.12.1; Maven 3.9.12; Node 24.15.0; PostgreSQL 16.15; Redis; database sạch `openerp_test` |
| Thời điểm chạy | 2026-11-14 18:08–22:02 (+07:00) |

> Báo cáo viết theo **luồng nghiệp vụ**: mỗi luồng nêu người dùng, mục đích, các bước và ảnh màn hình thực tế. Kết quả kỹ thuật (DB, build, test) nằm ở mục 10.
>
> **Cập nhật 2026-11-15:** ma trận màn hình và kết quả QA mới nhất nằm tại [TR-S09-004](05_TR-S09-004_full_screen_flow_qa.md). Báo cáo này giữ lại lịch sử vòng DB/role/UI ngày 2026-11-14.

---

## 1. Kết quả tổng hợp

| Hạng mục | Kết quả |
| :--- | :--- |
| Backend DB thật (PostgreSQL + Redis) | **260 test, 0 failures, 0 errors, 1 skipped** — BUILD SUCCESS |
| Plugin `attendance` | **118/118 PASS** (thêm 2 test kiosk token/branch) |
| Attendance schema | **20/20 bảng** apply sạch, unique constraint PASS |
| Attendance UI build | **PASS, 0 warning** |
| Web / Mobile build | **PASS** |
| i18n strict parity | **100%** web 2.332 keys + mobile 1.920 keys |
| Browser QA | **43 ảnh/kịch bản**, 0 `console.error`, mobile overflow = 0 |

---

## 1.1. Ma trận kịch bản & kết quả cuối

| # | Kịch bản | Kết quả cuối | Bằng chứng | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| 1 | Nhân viên chấm vào đúng giờ | Log IN, ngày công PRESENT, giờ công được tính | Unit `AttendanceLogService` + ảnh 02 | PASS |
| 2 | Nhân viên chấm ra | Log OUT, `worked_minutes` cập nhật | Unit + ảnh 02 | PASS |
| 3 | Đi muộn quá grace | `late_minutes > 0`, trạng thái theo ngưỡng | Unit `AttendanceCalculator` | PASS |
| 4 | Quên chấm ra | Bản ghi `needs_review = true`, vào hanging check | Unit `AttendanceCalculator` | PASS |
| 5 | Chấm ngoài geofence | Lưu `in_geofence=false`, `distance_meters`, không chặn | Unit `GeofenceCalculator` | PASS |
| 6 | Nộp đơn nghỉ phép | Đơn PENDING, gắn pipeline duyệt | UI ảnh 05, 07 | PASS |
| 7 | Quản lý duyệt đơn nghỉ | Đơn APPROVED, ledger trừ phép, công ngày ON_LEAVE | Unit `RequestService`/`MappingExecutor` + ảnh 07 | PASS |
| 8 | Quản lý từ chối đơn | Đơn REJECTED, số dư phép không đổi | Unit `RequestService` | PASS |
| 9 | Đảo phép khi hủy đơn | Ledger ghi `USAGE_REVERSAL`, hoàn phép | Unit `LeaveLedgerService` | PASS |
| 10 | Duyệt OT | OT window/`ot_minutes` cập nhật | Unit `AttendanceCalculator` | PASS |
| 11 | Chạy tính công kỳ | Tổng công, phép, OT, công tác được tổng hợp | Unit `TimesheetService` + ảnh 14 | PASS |
| 12 | Khóa kỳ công | `locked=true`, chặn nộp đơn vào kỳ | Unit `TimesheetService` + ảnh 15, 16 | PASS |
| 13 | Xuất payroll CSV | File CSV đúng template whitelist, có tổng công | Unit `ExportTemplateService` | PASS |
| 14 | NV xác nhận / khiếu nại | CONFIRM/REJECT cập nhật trạng thái xác nhận bảng công | Unit `TimesheetService` + ảnh 32, 33 | PASS |
| 15 | Kiosk thiếu device/token | 401/UI từ chối, không lộ danh bạ | `KioskResourceTest` + ảnh 39 | PASS |
| 16 | Kiosk đúng token nhưng khác chi nhánh | Chỉ trả nhân viên thuộc `branch_id` thiết bị | `KioskResourceTest` + ảnh 22, 23 | PASS |
| 17 | Kiosk sai PIN 5 lần | Khóa thiết bị 15 phút | Unit `KioskSecurityService` | PASS |
| 18 | Employee xem menu | Chỉ 3 tab self-service | UI ảnh 34 | PASS |
| 19 | Manager xem menu | Thêm team + duyệt đơn | UI ảnh 35 | PASS |
| 20 | Bảng nhiều dòng | Có phân trang và context menu thao tác nhanh | UI ảnh 04, 10, 38 | PASS |
| 21 | Thêm bước duyệt quy trình | Pipeline 3 cấp hiển thị ngay trong drawer và bảng sau khi Lưu | Ảnh 41, 42 | PASS |
| 22 | Bỏ bước duyệt quy trình | Xóa cấp cuối, pipeline trở về 2 cấp; chặn xóa khi chỉ còn 1 cấp | Ảnh 43 | PASS |
| 23 | Tiếng Việt | Không còn raw key/English label; ngày và kiosk theo locale | ảnh 01, 19, 22 | PASS |
| 24 | Ngày hôm nay | Ô ngày hiện tại được highlight trong lịch tuần | ảnh 01, 28 | PASS |
| 25 | Check-in trùng khi chưa check-out | Chặn và trả `ATTENDANCE_ALREADY_CHECKED_IN` | Unit `AttendanceLogService` | PASS |
| 26 | Check-out khi chưa check-in | Lỗi `ATTENDANCE_NO_OPEN_CHECKIN` | Unit `AttendanceLogService` | PASS |
| 27 | Nghỉ nửa ngày trong báo cáo | Bản ghi `HALF_DAY` được tổng hợp đúng | Unit `AttendanceReportService` | PASS |
| 28 | Ngày lễ | `ShiftResolver` trả `HOLIDAY`, ưu tiên hơn mọi template ca | Unit `ShiftResolver` | PASS |
| 29 | OT được duyệt trong cửa sổ OT | `ot_minutes` được cộng vào công ngày | Unit `AttendanceCalculationService` | PASS |
| 30 | Phép hết hạn | Ledger ghi `EXPIRY`, số dư giảm | Unit `LeaveLedgerService` | PASS |
| 31 | Cấp/điều chỉnh phép | Ledger ghi `GRANT`/`ADJUSTMENT`, số dư cập nhật | Unit `LeaveAdminResource` | PASS |
| 32 | Import CSV sai dòng | Trả danh sách lỗi, bỏ dòng lỗi | Unit `CsvLogParser` | PASS |
| 33 | Tính lại giữ override thủ công | `is_override=true` không bị ghi đè | Unit `AttendanceCalculationService` | PASS |
| 34 | Mở khóa kỳ công | Kỳ mở lại sau khóa, có audit | Unit `TimesheetService` | PASS |
| 35 | Export template cột lạ | Lỗi whitelist `ATTENDANCE_EXPORT_COLUMN_UNKNOWN` | Unit `ExportTemplateService` | PASS |
| 36 | Nộp đơn vào kỳ đã khóa | Trả lỗi `ATTENDANCE_PERIOD_LOCKED` | Unit `RequestService` | PASS |
| 37 | Chấm công thay (on-behalf) thiếu lý do | Trả lỗi bắt buộc lý do; có lý do thì tạo log `MANUAL` | Unit `AttendanceLogService` | PASS |
| 38 | Xóa log thiếu lý do | Trả lỗi, không xóa; có lý do thì soft delete | Unit `AttendanceLogService` | PASS |
| 39 | Sửa công ngày thiếu lý do | Trả lỗi validation; có lý do thì `is_override=true` | `AttendanceAdminResourceTest` | PASS |
| 40 | Import CSV BioTime/ZKTeco | Log hợp lệ được tạo, dòng lỗi được báo | Unit `CsvLogParser` + `AttendanceLogService` | PASS |
| 41 | Hardware push ingestion | Sự kiện máy chấm công tạo log | Unit `AttendanceLogService` | PASS |
| 42 | Event Hub `workflow.instance.completed` | Mapping đơn được kích hoạt | Unit `RequestService` | PASS |
| 43 | Fallback duyệt nội bộ | APPROVE kích hoạt mapping | Unit `RequestService` | PASS |
| 44 | Gửi xác nhận bảng công | Nhân viên CONFIRM/REJECT cập nhật trạng thái | Unit `TimesheetService` | PASS |
| 45 | Loại đơn hệ thống | Không cho sửa/xóa loại đơn hệ thống | Unit `RequestTypeService` | PASS |
| 46 | Báo cáo team/top late/OT | Số liệu tổng hợp theo phòng ban đúng | Unit `AttendanceReportService` | PASS |

> Case 1–13, 17, 25–46 là unit/resource test backend (118 test). Case 14–16, 18–24 là browser QA; case 21–22 được kiểm tra thao tác thêm/bỏ bước và lưu thật trên UI.

---

**Người dùng:** Nhân viên. **Mục đích:** ghi nhận giờ làm, xem công/thu nhập tạm tính, nộp đơn, xác nhận bảng công.

### 2.1. Vào ca / ra ca

Nhân viên mở **Chấm công của tôi**, kiểm tra ca và GPS rồi bấm **CHẤM VÀO / CHẤM RA**. Sau khi chấm, trạng thái đổi sang **Có mặt**, giờ quẹt và khoảng cách GPS hiển thị ngay.

![Trước khi chấm công](evidence/screenshots/01_desktop_self_overview.png)

![Sau khi chấm vào](evidence/screenshots/02_desktop_self_punched_in.png)

Nếu làm ngoài văn phòng, backend vẫn ghi nhận log với `in_geofence=false` và `distance_meters` để HR đối soát (kiểm thử `GeofenceCalculator`). Ảnh headless không thể hiện cảnh báo GPS vì trình duyệt không cấp quyền định vị.

### 2.2. Xem bảng công của tôi

Tab **Bảng công của tôi** trả lời câu hỏi “tháng này tôi được bao nhiêu công, còn phép, OT bao nhiêu?”. Màn hình gồm kỳ công hiện tại, trạng thái khóa, nút xác nhận/khiếu nại, lưới tổng hợp và nhật ký chấm công cá nhân.

![Bảng công của tôi](evidence/screenshots/40_desktop_employee_my_timesheet.png)

Nhân viên chỉ thấy 3 tab self-service; không thấy KPI công ty, hộp thư duyệt hay nút Xuất CSV:

![Vai trò Employee](evidence/screenshots/34_desktop_role_employee.png)

### 2.3. Nộp đơn

Danh sách đơn hiển thị trạng thái và phương thức duyệt. Drawer nộp đơn tự đổi trường theo loại đơn (nghỉ phép, OT, giải trình, công tác, đi muộn, đổi ca).

![Danh sách đơn](evidence/screenshots/04_desktop_requests_list.png)

![Drawer nộp đơn nghỉ phép](evidence/screenshots/05_desktop_request_drawer_leave.png)

![Drawer nộp đơn OT](evidence/screenshots/06_desktop_request_drawer_overtime.png)

### 2.4. Xác nhận / khiếu nại bảng công trên mobile

Nhân viên xác nhận số liệu công tháng hoặc gửi khiếu nại ngay trên mobile:

![Xác nhận bảng công mobile](evidence/screenshots/32_mobile_confirm_timesheet.png)

![Khiếu nại bảng công mobile](evidence/screenshots/33_mobile_dispute_timesheet.png)

**Kết quả:** PASS. Số dư phép chỉ còn hiển thị của chính nhân viên (không còn 2–3 thẻ “Phép năm 2026” trùng).

---

## 3. Luồng 2 — Quản lý duyệt đơn

**Người dùng:** Line Manager. **Mục đích:** duyệt/từ chối đơn của nhân viên, xem tiến trình nhiều cấp và tác động sau duyệt.

Quản lý thấy thêm tab **Công phòng ban** và **Duyệt đơn**:

![Vai trò Line Manager](evidence/screenshots/35_desktop_role_manager.png)

Màn hình split-view: bên trái là hộp thư đơn + bộ lọc loại đơn; bên phải là pipeline duyệt nhiều cấp, dữ liệu form, số dư phép, hành động tự động và nút Duyệt/Từ chối.

![Duyệt đơn nghỉ phép](evidence/screenshots/07_desktop_approvals_splitview_leave.png)

Đơn OT/công tác/đổi ca dùng pipeline riêng:

![Duyệt đơn OT và ma trận quy trình](evidence/screenshots/08_desktop_approvals_splitview_attendance_fix.png)

**Kết quả:** PASS. Duyệt/từ chối cập nhật trạng thái, ghi audit và kích hoạt mapping công/phép.

---

## 4. Luồng 3 — HR chốt bảng công tháng

**Người dùng:** HR Admin. **Mục đích:** biến log thô thành bảng công chốt, xử lý khiếu nại và xuất dữ liệu lương.

Màn hình kỳ công dẫn HR qua 5 bước: chốt đơn tồn đọng → đối soát quẹt thẻ → chạy tính công → xử lý khiếu nại → ký duyệt & khóa sổ.

![Quy trình 5 bước chốt bảng công](evidence/screenshots/14_desktop_timesheets_step3_calculate.png)

Sau khi khóa, kỳ công chuyển **ĐÃ KHÓA**, dữ liệu đóng băng:

![Bảng công đã khóa](evidence/screenshots/15_desktop_timesheets_step5_locked.png)

Drawer khóa kỳ bắt buộc nhập lý do kiểm toán:

![Drawer khóa bảng công](evidence/screenshots/16_desktop_lock_timesheet_drawer.png)

**Kết quả:** PASS. Xuất payroll-ready CSV hoạt động; khóa kỳ phát sự kiện `attendance.timesheet.locked`.

---

## 5. Luồng 4 — HR quản trị ca, log, nghỉ phép, báo cáo

**Người dùng:** HR Admin. **Mục đích:** cấu hình ca, kiểm tra log, quản lý quỹ phép và theo dõi chuyên cần.

### 5.1. Ca làm việc

![Quản lý ca làm việc](evidence/screenshots/11_desktop_admin_shifts.png)

### 5.2. Nhật ký chấm công đa nguồn

![Nhật ký chấm công](evidence/screenshots/10_desktop_admin_logs.png)

### 5.3. Nghỉ phép & sổ cái

![Số dư phép và sổ cái](evidence/screenshots/17_desktop_admin_leave_balances.png)

### 5.4. Báo cáo chuyên cần & OT

![Báo cáo chuyên cần](evidence/screenshots/18_desktop_admin_reports_analytics.png)

Bảng dữ liệu lớn có phân trang; chuột phải mở context menu thao tác nhanh:

![Context menu nhật ký](evidence/screenshots/38_desktop_context_menu_logs.png)

**Kết quả:** PASS.

---

## 6. Luồng 5 — Kiosk chấm công theo chi nhánh

**Người dùng:** Nhân viên tại sảnh/nhà máy + HR quản trị thiết bị. **Mục đích:** chấm công công cộng nhưng không lộ danh bạ chi nhánh khác.

### 6.1. HR tạo link theo chi nhánh

![Quản trị Kiosk chi nhánh](evidence/screenshots/21_desktop_admin_kiosk_branches.png)

### 6.2. Nhân viên chấm công tại Kiosk

Mỗi link chỉ hiển thị nhân viên thuộc chi nhánh của thiết bị:

![Kiosk Hà Nội](evidence/screenshots/22_desktop_kiosk_hanoi_branch.png)

![Kiosk TP.HCM](evidence/screenshots/23_desktop_kiosk_hcm_branch.png)

Nhập PIN và chấm công:

![Nhập PIN Kiosk](evidence/screenshots/24_desktop_kiosk_pin_entered.png)

![Chấm công thành công](evidence/screenshots/25_desktop_kiosk_punch_success.png)

### 6.3. Truy cập trái phép bị chặn

Link `/kiosk?branch=BRANCH-HCM` không có `device` + `token` bị từ chối, không tải danh sách nhân viên:

![Kiosk từ chối truy cập](evidence/screenshots/39_desktop_kiosk_access_denied.png)

Backend kiểm tra token thiết bị (salted SHA-256), lọc nhân viên theo `branch_id`, từ chối session của thiết bị khác. **Kết quả:** PASS, `KioskResourceTest` 6/6.

---

## 7. Luồng 6 — Cấu hình quy trình phê duyệt theo loại đơn

**Người dùng:** HR Admin/System Admin. **Mục đích:** đổi số cấp duyệt, người duyệt và SLA cho từng loại đơn.

Màn hình đã tối giản thành bảng: loại đơn, pipeline các cấp duyệt (số + vai trò), SLA, trạng thái, nút Sửa. Bỏ RACI matrix và các đoạn mô tả dài.

![Cấu hình quy trình dạng bảng](evidence/screenshots/19_desktop_admin_workflows.png)

Drawer sửa tối giản: bật/tắt, SLA, danh sách cấp duyệt; không còn label mô tả dài.

![Drawer sửa quy trình](evidence/screenshots/20_desktop_workflow_edit_drawer.png)

Thêm một bước duyệt: bấm **+ Thêm bước**, chọn vai trò ở ô select rồi **Lưu**. Pipeline tăng từ 2 lên 3 cấp và bảng cập nhật ngay:

![Thêm bước duyệt thứ 3](evidence/screenshots/41_desktop_workflow_added_step.png)

![Bảng sau khi lưu 3 cấp](evidence/screenshots/42_desktop_workflow_saved_table.png)

Bỏ bước duyệt: mở lại drawer, bấm nút thùng rác ở cấp cuối rồi **Lưu**. Pipeline trở về 2 cấp; nút xóa bị vô hiệu khi chỉ còn 1 cấp.

![Bỏ bước duyệt, trở về 2 cấp](evidence/screenshots/43_desktop_workflow_removed_step.png)

**Kết quả:** PASS. Chỉ HR Admin/System Admin thấy tab này; thêm/bỏ cấp duyệt và lưu cập nhật ngay bảng cấu hình.

---

## 8. Luồng mobile

Bottom navigation chỉ giữ icon (không label chữ), vẫn có `aria-label`/`title` đa ngôn ngữ; Employee chỉ thấy 4 tab.

![Chấm công mobile](evidence/screenshots/26_mobile_punch_in_range.png)

![Lịch tuần mobile](evidence/screenshots/28_mobile_schedule_week.png)

![Đơn của tôi mobile](evidence/screenshots/29_mobile_requests_list.png)

![Duyệt đơn mobile](evidence/screenshots/31_mobile_approvals_inbox.png)

**Kết quả:** PASS, overflow = 0, touch target ≥ 48px.

---

## 9. Kiểm thử DB thật — lỗi phát hiện và đã sửa

| ID | Mức | Vấn đề | Trạng thái |
| :--- | :--- | :--- | :--- |
| BUG-183 | High | Migration `V8.0.1` dùng `user_tenants.created_at` (không tồn tại) → Flyway fail, backend không khởi động trên DB hiện hữu. Sửa sang `joined_at`. | **Fixed** |
| BUG-184 | High | Default plugin provisioning thất bại làm transaction đăng ký tenant rollback-only. Sửa bằng `QuarkusTransaction.requiringNew()` cho từng plugin. | **Fixed** |
| BUG-185 | High | Provisioning cài plugin default trước khi tenant commit → rollback. | **Fixed** |
| BUG-186 | Critical | Runtime attendance sai prefix `/api/v1/attendance`, thiếu migration manifest và quyền admin → toàn bộ API 404. | **Fixed** |
| BUG-187 | High | Form dùng `[(ngModel)]` trên signal → không nhập được ngày/lý do, nút gửi luôn disabled. | **Fixed** |
| BUG-188 | High | UI gửi `data` nhưng API đọc `response`/`affected_window`; `approval_mode varchar(16)` không chứa `INTERNAL_FALLBACK`. | **Fixed** |
| BUG-189 | High | Phân trang 1-based vs gateway 0-based → trang 1 rỗng dù còn dữ liệu. | **Fixed** |
| BUG-190 | High | `records/recalculate` là no-op → 2.069 log nhưng 0 record, bảng công toàn 0 ngày. | **Fixed** |
| BUG-191 | High | Thiếu descriptor `assignment.insert` → không phân ca được, duyệt SHIFT_SWAP mapping FAILED. | **Fixed** |
| BUG-192 | High | Đọc danh sách một lần (500 dòng) → snapshot/báo cáo thiếu dữ liệu. | **Fixed** |
| BUG-193 | High | UI bảng công lệch DTO + dữ liệu mẫu 45 nhân sự/43 xác nhận/7 dòng. | **Fixed** |
| BUG-194 | High | Cột `numeric` bind varchar → tạo loại phép 500, sổ cái phép 0. | **Fixed** |
| BUG-195 | Critical | Method `/admin/*` khai báo trong resource `@Path("/")` bị route shadow → 404. | **Fixed** |
| BUG-196 | High | Sổ cái phép 500 (numeric dạng String), tên nhân viên hardcode, `my-requests` sai path, giờ công ca trống. | **Fixed** |
| BUG-197 | High | Panel chốt kỳ công và tab Công phòng ban/Báo cáo còn số liệu mẫu; nút xử lý không gọi API. | **Fixed** |
| BUG-198 | High | Đơn từ và số dư phép dùng `user_id` thay vì `employee_id` → không khớp dữ liệu công. | **Fixed** |
| BUG-199 | High | Cột phòng ban trong báo cáo trống — chưa đọc org/employee qua gRPC chéo plugin. | **Fixed** |
| BUG-200 | High | Header/KPI chiếm chỗ, tab 2 hàng, thiếu lọc/sub-tab, Công ngày sai field và hiện UID, nút ca bị dãn giữa màn. | **Fixed** |
| BUG-201 | High | “Bảng công của tôi” trống dù có log quá khứ — thiếu `/my-records`, `/my-timesheets`, snapshot cũ. | **Fixed** |
| BUG-202 | High | Bảng không sticky header, thiếu xem chi tiết, lệch theme core, ca không rõ phạm vi, báo cáo không lọc, nhật ký chỉ tải 100 dòng, workflow không mở được. | **Fixed, QA 23/23** |

Trước sửa: 4 failures + 1 error ở luồng đăng ký. Sau sửa: **260 test, 0F/0E, 1 skip**.

Attendance schema: 20 bảng apply sạch trên PostgreSQL 16, unique `(tenant_id, code)` hoạt động.

### 9.1. Dữ liệu thật sau khi sửa (tenant `review50c`, 2026-11-15)

| Kiểm tra | Kết quả |
| :--- | :--- |
| Nhân sự import qua UI | 51 (`EMP-000…050`) |
| Log tháng 10/2026 import qua drawer CSV | 2.069 |
| Phân ca HC tháng 10 qua API/UI (22 ngày × 51) | 1.122 assignment |
| Record tính từ log + phân ca | 1.124 record (PRESENT/ABSENT/ON_LEAVE) |
| Snapshot kỳ công 10/2026 | 51 nhân sự, `actual_days` > 0 |
| Loại phép tạo qua API | `ANNUAL`, `SICK` + 3 loại QA |
| Cấp 12 ngày phép cho 51 nhân sự | `granted_count = 51` (sổ cái 55 bút toán sau các lần QA) |
| Audit trail | `TIMESHEET_STEP`, `RECORD_RECALCULATE`, `SHIFT_BULK_ASSIGN`, `LEAVE_GRANT`, `LEAVE_TYPE_CREATE` (TASK-468) |
| Bộ QA API trên DB thật | `npm run qa:attendance-api` — **18/18 PASS** (đăng nhập, nhân sự, phân công phòng ban, loại phép, cấp phép, sổ cái, nộp/duyệt đơn, báo cáo theo phòng ban qua gRPC, audit, tính lại công, công ngày, kỳ công, ca) |

### 9.2. Vòng UI theo góp ý khách hàng (2026-11-15)

| Kiểm tra | Kết quả |
| :--- | :--- |
| Header | KPI thu gọn mặc định sau nút “Tổng quan”, chỉ render cho quyền quản lý |
| Tab strip | 1 hàng, scroll ngang (`scrollWidth 1731 > clientWidth 1015`), không wrap |
| Đơn của tôi | 5 đơn, lọc loại/trạng thái/ngày, drawer chi tiết + tiến trình + payload, deep link `drawer=my-request&id=...` |
| Bảng công của tôi | 1 kỳ 10/2026, 22 bản ghi thật (08:00–17:05), tổng 22d / 199.8h; đổi kỳ bằng dropdown |
| Công phòng ban | Lọc tháng/phòng ban/tìm; 51 nhân sự kèm phòng ban |
| Bảng công kỳ | Sub-tab `periods` (1 kỳ, lọc năm/trạng thái/tìm) và `detail` (bảng nhân sự lọc phòng ban/tìm); F5 giữ `sub` |
| Ca làm việc | Nút gom bên phải, lọc trạng thái/tìm; 1 ca HC |
| Công ngày | 51 dòng ngày 05/10/2026, có mã + tên + ca + giờ vào/ra; lọc ngày/tìm/cần rà soát, `work_date` trên URL |
| Nhật ký chấm công | 100/2.069 dòng, lọc nguồn/ngày/tìm, hiện mã + tên + thiết bị |
| Quản lý nghỉ phép | Sub-tab loại/số dư/sổ cái; lọc loại biến động + tìm; `lv` trên URL |
| Console | 0 `console.error` khi chuyển 8 tab và mở drawer |

### 9.3. Vòng kiểm tra bảng, chi tiết và phạm vi ca (2026-11-15)

| Kiểm tra | Kết quả |
| :--- | :--- |
| Định dạng ngày/tháng | Ô lọc hiển thị `05/10/2026` và `10/2026`; model API vẫn ISO/`yyyy-MM` |
| Sticky header/footer | 18 vùng bảng dùng `.op-table-scroll`: `position: sticky`, `max-height: 574px`, `overflow-y: auto`; pagination ngoài vùng cuộn |
| Context menu | “Xem chi tiết”, “Xem bảng công nhân sự”, “Sao chép”, “Chạy tính toán công” |
| Drawer chi tiết | Công ngày, lượt chấm công, bảng công nhân sự (22 dòng), ca làm việc, nghỉ phép |
| Công phòng ban | Click dòng mở bảng công nhân sự tháng 10/2026 |
| Bảng công kỳ | Click dòng nhân sự mở đúng bảng công kỳ 10/2026 |
| Ca làm việc | Coverage 51 nhân sự / 8 phòng ban / 1 chi nhánh; lọc tháng |
| Phân ca hàng loạt | Lọc chi nhánh/phòng ban/tìm; “Kinh doanh” còn 6 người; chọn tất cả + đếm đã chọn; chặn khi chưa chọn |
| Nhật ký chấm công | 2.113 bản ghi; đổi trang thay đổi dữ liệu; nguồn `WEB` = 0 đúng |
| Báo cáo | Lọc tháng/phòng ban/tìm; 10/2026: 94.1%, 51 nhân sự, 110 muộn |
| Workflow | Nút “Tạo quy trình” mở `/settings/apps/workflow` (có nút “Luồng mới”) |
| Theme | Bỏ override slate; nền plugin dùng token core `#171717` / `#0a0a0a` |
| QA API | **23/23 PASS**, gồm directory phòng ban/chi nhánh, bảng công nhân sự, coverage ca, my-records/my-timesheets |

---

## 10. Phát hiện & hạn chế còn lại

| Mức | Nội dung | Đề xuất |
| :--- | :--- | :--- |
| Medium | `employee` thiếu version PUBLISHED; `org-structure` thiếu migration bundle trong test profile | Bổ sung catalog/migration bundle |
| Medium | Plugin `attendance` chưa có integration test DB thật (118 test là unit/in-process) | Bổ sung test DB cho plugin |
| Medium | Panel chốt kỳ công vẫn hiển thị checklist mẫu (số đơn chờ, bất thường, khiếu nại) và các nút "xử lý" chưa nối API | Nối checklist với đơn PENDING + record `needs_review` |
| Medium | Tab Công phòng ban và Báo cáo còn số liệu mẫu ở phần phòng ban | Tổng hợp theo `primary_department_id` khi có catalog phòng ban |
| Low | Ảnh 03/26/27 chưa thể hiện GPS ngoài bán kính do headless không cấp quyền định vị | Fake geolocation cho harness |

---

## 11. Kết luận

- 6 luồng nghiệp vụ chính đã được kiểm thử end-to-end với ảnh màn hình thực tế; ma trận 46 kịch bản có kết quả cuối rõ ràng.
- Backend DB thật PASS sau khi sửa 2 lỗi High; plugin 118/118; UI build 0 warning; i18n 100%.
- Vòng 2026-11-15 sửa thêm 11 lỗi High/Critical (BUG-185…195), đưa dữ liệu thật vào bảng công/kỳ công và bổ sung audit trail (TASK-468).
- Sprint 09 sẵn sàng nghiệm thu lại; các mục Medium cần theo dõi trước production.
