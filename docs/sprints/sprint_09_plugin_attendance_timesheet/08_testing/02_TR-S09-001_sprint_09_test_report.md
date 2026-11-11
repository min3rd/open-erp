# [TR-S09-001] Test Report Sprint 09 — Plugin Chấm công, Bảng công & Đơn từ (`attendance`)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TR-S09-001 / Test Report / Sprint 09 |
| Trạng thái / phiên bản / cập nhật | Approved / 1.0 / 2026-11-11 |
| Owner / reviewer | QA Agent / Solution Architect |
| Đầu vào | [TP-S09-001](01_TP-S09-001_sprint_09_test_plan.md) 1.0, [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) |
| Đọc trước / đọc tiếp | [TP-S09-001](01_TP-S09-001_sprint_09_test_plan.md) / [01_SPRINT_REVIEW.md](../09_review/01_SPRINT_REVIEW.md) |

---

## 1. Tóm tắt kết quả kiểm thử

| Tiêu chí | Kết quả | Trạng thái |
| :--- | :--- | :--- |
| **Backend Unit & Integration Tests** | 116 / 116 test PASS (0 failures, 0 errors, 0 skipped) | **PASS 100%** |
| **Backend Compilation & Packaging** | `mvn package` tạo thành công `plugin-attendance-1.0.0.jar` | **PASS** |
| **Frontend WebComponent Build** | `npm run attendance:ui:build` sinh bundle `main.js` (410KB) + `styles.css` (95KB) | **PASS** |
| **Frontend Web App Build** | `npm run web:build` thành công | **PASS** |
| **Frontend Mobile Ionic Build** | `npm run mobile:build` thành công | **PASS** |
| **Đa ngôn ngữ (i18n Strict Parity)** | Đạt 100.0% strict parity trên 13 ngôn ngữ cho Web & Mobile (`npm run i18n:check:strict`) | **PASS 100%** |
| **Kiểm tra Rule 23 (Zero native fetch)** | 0 lệnh `fetch()` trực tiếp trong Angular TypeScript code | **PASS** |
| **Dual-Mode Browser Testing (Desktop ≥1280px)** | 25 kịch bản màn hình Desktop toàn diện trong Open-ERP Shell (Chấm công cá nhân, Đơn từ, Split-view Duyệt đơn với dải lọc ngang dùng chung `<app-filter-strip>`, Công phòng ban, Logs đa nguồn, Ca làm việc, Công ngày, Stepper kỳ công, Khóa kỳ công, Sổ cái phép, Báo cáo chuyên cần, Cấu hình Quy trình & Ma trận RACI, Drawer Chỉnh sửa Policy, Quản trị Kiosk Chi nhánh, Kiosk Sảnh Hà Nội cách ly danh tính, Kiosk Sảnh TP.HCM cách ly danh tính, Kiosk PIN pad & Quẹt thẻ thành công), **0 console.error** | **PASS (25/25 ảnh)** |
| **Dual-Mode Browser Testing (Mobile 390x844 px)** | 8 kịch bản màn hình Mobile Ionic toàn diện (Chấm công GPS trong/ngoài bán kính, Lịch tuần, Danh sách đơn, Nộp đơn di động, Duyệt đơn quản lý, Xác nhận kỳ công, Khiếu nại công), touch target ≥ 48px, safe-area, **0 overflow (scrollWidth = 390px)**, **0 console.error** | **PASS (8/8 ảnh)** |

---

## 2. Chi tiết Kết quả Backend Test Suites (116 Tests)

```text
-------------------------------------------------------
 T E S T S
-------------------------------------------------------
Running com.vn9melody.openerp.plugins.attendance.engine.AttendanceCalculatorTest
Tests run: 26, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.643 s
Running com.vn9melody.openerp.plugins.attendance.engine.CsvLogParserTest
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.054 s
Running com.vn9melody.openerp.plugins.attendance.engine.GeofenceCalculatorTest
Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.015 s
Running com.vn9melody.openerp.plugins.attendance.engine.ShiftResolverTest
Tests run: 14, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.052 s
Running com.vn9melody.openerp.plugins.attendance.resource.AttendanceAdminResourceTest
Tests run: 8, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.107 s
Running com.vn9melody.openerp.plugins.attendance.resource.AttendanceResourceTest
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.031 s
Running com.vn9melody.openerp.plugins.attendance.resource.KioskResourceTest
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.049 s
Running com.vn9melody.openerp.plugins.attendance.resource.LeaveAdminResourceTest
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.019 s
Running com.vn9melody.openerp.plugins.attendance.resource.RequestResourceTest
Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.066 s
Running com.vn9melody.openerp.plugins.attendance.resource.ShiftAdminResourceTest
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.022 s
Running com.vn9melody.openerp.plugins.attendance.resource.TimesheetAdminResourceTest
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.070 s
Running com.vn9melody.openerp.plugins.attendance.service.AttendanceCalculationServiceTest
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.363 s
Running com.vn9melody.openerp.plugins.attendance.service.AttendanceLogServiceTest
Tests run: 11, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.094 s
Running com.vn9melody.openerp.plugins.attendance.service.AttendanceReportServiceTest
Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.032 s
Running com.vn9melody.openerp.plugins.attendance.service.ExportTemplateServiceTest
Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.154 s
Running com.vn9melody.openerp.plugins.attendance.service.KioskSecurityServiceTest
Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.018 s
Running com.vn9melody.openerp.plugins.attendance.service.LeaveLedgerServiceTest
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.026 s
Running com.vn9melody.openerp.plugins.attendance.service.RequestMappingExecutorTest
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.021 s
Running com.vn9melody.openerp.plugins.attendance.service.RequestServiceTest
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.055 s
Running com.vn9melody.openerp.plugins.attendance.service.RequestTypeServiceTest
Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.017 s
Running com.vn9melody.openerp.plugins.attendance.service.TimesheetServiceTest
Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.056 s

Results: Tests run: 116, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

---

## 3. Kết quả Kiểm thử Trình duyệt Hai Chế Độ Mở Rộng (29 Kịch Bản Màn Hình)

Toàn bộ 29 kịch bản màn hình dưới đây được chụp trực tiếp từ môi trường trình duyệt tự động (**Dual-Mode Browser Testing**), nhúng đầy đủ bên trong **Khung ứng dụng chuẩn Open-ERP (Open-ERP Application Shell)** — bao gồm: Topbar (Thương hiệu Open-ERP, Tenant Acme Corp, Role badge `TENANT_ADMIN`, Bộ tìm kiếm nhanh, Language switcher, User info), Thanh điều hướng Sidebar bên trái (đánh dấu plugin `Chấm công & Bảng công` đang kích hoạt với chấm xanh), Breadcrumbs và Banner trạng thái plugin `plugin: attendance (v1.0.0) • Active`.

---

### 3.1. Nhóm A: Chấm công cá nhân & Các kịch bản quẹt thẻ Desktop

#### Ảnh 01: Tổng quan Chấm công cá nhân — Trạng thái Chưa chấm (Vắng mặt)
Màn hình bảng điều khiển cá nhân khi nhân viên chưa chấm công trong ngày: Huy hiệu trạng thái ngày `VẮNG MẶT` (màu đỏ), khoảng cách định vị GPS, các nút tác vụ `CHẤM VÀO` (xanh) / `CHẤM RA` (đỏ), lịch tuần cá nhân, và bảng số dư phép còn lại.
![Ảnh 01: Tổng quan Chấm công cá nhân Desktop (Chưa chấm)](evidence/screenshots/01_desktop_self_overview.png)

#### Ảnh 02: Chấm vào thành công — Trạng thái Có mặt (Present)
Nhân viên bấm `CHẤM VÀO`: Giao diện cập nhật tức thì trạng thái sang `CÓ MẶT` (màu xanh lục), hiển thị thời điểm quẹt mới nhất (ví dụ `08:02:14`), khoảng cách GPS hợp lệ trong bán kính văn phòng và thông báo toast thành công.
![Ảnh 02: Chấm vào thành công Có mặt](evidence/screenshots/02_desktop_self_punched_in.png)

#### Ảnh 03: Kịch bản Chấm công Ngoài bán kính GPS (Outside Geofence)
Kịch bản nhân viên làm việc tại công trường hoặc dự án bên ngoài văn phòng: Hệ thống cảnh báo khoảng cách mét (`Ngoài văn phòng (1250m)`), yêu cầu hoặc tự động ghi nhận kèm ô nhập ghi chú địa điểm công tác.
![Ảnh 03: Chấm công ngoài bán kính GPS](evidence/screenshots/03_desktop_self_outside_geofence.png)

---

### 3.2. Nhóm B: Đơn từ & Phê duyệt Đa tầng Desktop

#### Ảnh 04: Danh sách Đơn từ của tôi (My Requests List)
Bảng tổng hợp toàn bộ các đơn từ cá nhân đã gửi (Nghỉ phép năm, Làm thêm giờ OT, Giải trình chấm công, Đi muộn về sớm) kèm trạng thái màu sắc chuẩn mực (`ĐÃ DUYỆT`, `CHỜ DUYỆT`, `TỪ CHỐI`) và phương thức duyệt `INTERNAL_FALLBACK`.
![Ảnh 04: Danh sách Đơn của tôi](evidence/screenshots/04_desktop_requests_list.png)

#### Ảnh 05: Drawer Biểu mẫu Nộp đơn Nghỉ phép năm
Thao tác bấm `+ Tạo đơn mới` kích hoạt Drawer trượt cạnh phải (Anti-Modal chuẩn Rule 10, Rule 26 không 2 lớp viền footer). Các nút bấm ở footer drawer ở chế độ sáng (Light Mode) được áp dụng màu sắc độ tương phản cao sắc nét: Nút Hủy (`bg-white` viền `border-neutral-300 text-neutral-800`), Nút Gửi đơn (`bg-sky-600 text-white font-bold`). Biểu mẫu chọn loại đơn Nghỉ phép năm, chọn từ ngày - đến ngày, và ô nhập lý do nộp đơn.
![Ảnh 05: Drawer Nộp đơn Nghỉ phép](evidence/screenshots/05_desktop_request_drawer_leave.png)

#### Ảnh 06: Drawer Biểu mẫu Nộp đơn Làm thêm giờ (OT)
Kịch bản nhân viên nộp đơn làm thêm giờ: Drawer tự động thích ứng với cấu hình loại đơn OT, cho phép nhập số giờ làm thêm dự kiến và lý do tăng ca phục vụ dự án; các nút bấm thao tác ở footer có độ tương phản và phân cấp thị giác rõ ràng.
![Ảnh 06: Drawer Nộp đơn Làm thêm giờ](evidence/screenshots/06_desktop_request_drawer_overtime.png)

#### Ảnh 07: Hộp thư Duyệt đơn Split-View — Chi tiết Đơn Nghỉ phép & Quy trình Phê duyệt Đa tầng (Workflow Pipeline)
Giao diện Split-View chia đôi màn hình:
- **Cột trái**: Dải bộ lọc phân loại đơn ngang dùng chung `<app-filter-strip>` (`FilterStripComponent` trong `@shared/components`) nằm gọn trên một dòng duy nhất với 7 loại đơn (*Tất cả*, *Nghỉ phép*, *Làm thêm giờ*, *Công tác*, *Bổ sung công*, *Đi muộn / Về sớm*, *Đổi ca*), hỗ trợ cuộn ngang linh hoạt qua cử chỉ cảm ứng, con lăn chuột (`wheel` -> `scrollLeft`), phím mũi tên và nút cuộn trái/phải với độ tương phản cao, badge số lượng từng loại đơn; cùng Danh sách hộp thư các đơn chờ duyệt và bộ chuyển đổi chế độ xem giữa *Hộp thư duyệt đơn* và *Ma trận Quy trình (6 loại đơn)*.
- **Cột phải**: Chi tiết đơn được chọn tích hợp đầy đủ **Quy trình duyệt đơn đa cấp Sprint 08 (`ADR-S09-002`)**:
  * **Tiến trình phê duyệt 4 bước trực quan (`selectedRequestWorkflow`)**: 1. Nhân viên gửi đơn (`COMPLETED`) -> 2. Quản lý trực tiếp phê duyệt (`PENDING`) -> 3. Trưởng phòng ban kiểm duyệt (`WAITING`) -> 4. Động cơ tự động HR (`WAITING`), hiển thị rõ ràng người thực hiện, chức vụ, vai trò, thời gian và ý kiến đóng góp.
  * **Lưới dữ liệu Form Builder**: Loại nghỉ phép, khoảng ngày, kiểm tra số dư phép, nhân viên bàn giao công việc và lý do chi tiết.
  * **Hành động tự động sau duyệt (Post-actions Grid)**: Khấu trừ sổ cái phép (`LEAVE_LEDGER_DEDUCTION`), đánh dấu công ngày (`DAILY_RECORD_MARK`).
  * **Bộ nút tác vụ phê duyệt**: Nút `DUYỆT ĐƠN` (xanh lục), `TỪ CHỐI` (đỏ), `YÊU CẦU GIẢI TRÌNH THÊM` (trung tính).
![Ảnh 07: Hộp thư Duyệt đơn Split-view Đơn Nghỉ phép](evidence/screenshots/07_desktop_approvals_splitview_leave.png)

#### Ảnh 08: Hộp thư Duyệt đơn Split-View — Đơn Làm thêm giờ OT & Ma trận 6 Quy trình Phê duyệt Độc lập
Chi tiết đơn làm thêm giờ OT với quy trình phê duyệt 3 bước (Nhân viên nộp -> Quản lý dự án duyệt -> Động cơ HR cộng dồn quỹ giờ OT kèm hệ số tăng ca 1.5x / 2.0x).
Bảng đối chiếu toàn bộ 6 loại đơn chuẩn của doanh nghiệp sang các quy trình Workflow Engine Sprint 08 độc lập:
- Nghỉ phép năm (`LEAVE` -> `WF-LEAVE-3LEVEL`, 3 bước duyệt: Nhân viên -> Quản lý -> Trưởng phòng -> Khấu trừ số dư phép)
- Làm thêm giờ (`OVERTIME` -> `WF-OT-2LEVEL`, 2 bước duyệt: Nhân viên -> Quản lý dự án -> Ghi nhận quỹ OT)
- Công tác ngoại tỉnh (`BUSINESS_TRIP` -> `WF-TRIP-3LEVEL`, 3 bước duyệt: Nhân viên -> Trưởng phòng -> Giám đốc điều hành -> Tạm ứng công tác phí & Miễn kiểm tra Geofence)
- Bổ sung công (`ATTENDANCE_FIX` -> `WF-FIX-2LEVEL`, 2 bước duyệt: Nhân viên -> Giám sát ca -> Chèn log bù & Tính lại công ngày)
- Đi muộn / về sớm (`LATE_EARLY` -> `WF-LATE-1LEVEL`, 1 bước duyệt: Nhân viên -> Quản lý trực tiếp -> Miễn trừ phạt chuyên cần)
- Đổi ca làm việc (`SHIFT_SWAP` -> `WF-SWAP-2LEVEL`, 2 bước duyệt: Nhân viên A -> Nhân viên B đồng ý -> Quản lý ca duyệt -> Hoán đổi ca trên lịch)
![Ảnh 08: Duyệt đơn Làm thêm giờ và Ma trận Quy trình](evidence/screenshots/08_desktop_approvals_splitview_attendance_fix.png)

---

### 3.3. Nhóm C: Quản trị Điểm danh, Nhật ký Logs & Lịch ca Desktop

#### Ảnh 09: Theo dõi Công phòng ban Toàn công ty (Team Attendance)
Bảng theo dõi trực quan tình hình nhân sự trong ngày: Bộ 5 thẻ KPI (Tổng nhân sự: 45, Có mặt: 42, Đi muộn: 3, Vắng mặt: 1, Nghỉ phép: 2) và bảng danh sách nhân viên theo từng phòng ban, ca làm việc, giờ vào/ra thực tế.
![Ảnh 09: Theo dõi Công phòng ban](evidence/screenshots/09_desktop_team_attendance.png)

#### Ảnh 10: Nhật ký Chấm công Toàn công ty (Admin Attendance Logs)
Bảng quản trị toàn bộ dữ liệu quẹt thẻ thô (Raw punch logs) từ đa nguồn: WEB, MOBILE, KIOSK sảnh, và MÁY VÂN TAY (BIOMETRIC), lưu trữ append-only bất biến, ghi nhận chi tiết tọa độ GPS và khoảng cách.
![Ảnh 10: Nhật ký Chấm công Toàn công ty](evidence/screenshots/10_desktop_admin_logs.png)

#### Ảnh 11: Quản lý Ca làm việc & Lịch phân ca (Shift Definitions)
Danh mục các ca làm việc được thiết lập cho tenant: Ca Hành chính tiêu chuẩn (HC: 08:00 - 17:00), Ca sáng (06:00 - 14:00), Ca chiều (14:00 - 22:00), Ca đêm (22:00 - 06:00) với biên độ muộn/sớm (grace period) và công quy đổi.
![Ảnh 11: Quản lý Ca làm việc](evidence/screenshots/11_desktop_admin_shifts.png)

#### Ảnh 12: Drawer Tạo / Sửa Ca làm việc
Drawer trượt hỗ trợ quản trị viên thêm mới hoặc cấu hình lại thông số ca: Mã ca, tên ca, khung giờ bắt đầu/kết thúc, thời gian nghỉ giữa ca và giờ chuẩn công.
![Ảnh 12: Drawer Tạo Ca làm việc](evidence/screenshots/12_desktop_shift_drawer.png)

#### Ảnh 13: Bảng Công ngày Tổng hợp & Tính toán Công (Daily Attendance Records)
Bảng dữ liệu công ngày đã được engine tính toán tự động: Hiển thị chi tiết giờ vào thực tế, giờ ra thực tế, số phút đi muộn, phút về sớm, giờ làm thêm OT và trạng thái công của từng nhân viên; có nút `Chạy tính toán công` để kích hoạt recalculate engine.
![Ảnh 13: Bảng Công ngày Tổng hợp](evidence/screenshots/13_desktop_admin_records.png)

---

### 3.4. Nhóm D: Quản trị Bảng công kỳ, Nghỉ phép & Báo cáo Desktop

#### Ảnh 14: Quản lý Bảng công kỳ — Quy trình Xử lý & Chốt công 5 Bước Toàn diện (Timesheet Closing Pipeline)
Giao diện quản lý kỳ công tích hợp quy trình xử lý và chốt công chuẩn mực trước khi xuất dữ liệu tính lương:
- **Hệ thống Kiểm soát 5 Bước Tiên quyết (5-Step Closing Pipeline)**:
  * **Bước 1 — Xử lý Đơn từ Tồn đọng (Pending Requests Check)**: Kiểm tra toàn bộ đơn nghỉ phép, OT, công tác, bổ sung công chưa duyệt. Tích hợp nút `Giải quyết hàng loạt` để phê duyệt tự động theo chính sách.
  * **Bước 2 — Đối soát Quẹt thẻ & Bất thường (Anomalies Check)**: Rà soát phát hiện các bản ghi quên quẹt ra hoặc ngoài phạm vi Geofence. Nút `Tự động chuẩn hóa` giải quyết các bản ghi bất thường.
  * **Bước 3 — Động cơ Tính công Tổng hợp (Batch Calculation Engine)**: Kích hoạt engine tính toán đồng loạt toàn bộ 45 nhân viên, tổng hợp ngày công thực tế, ngày phép hưởng lương, giờ làm thêm OT và ngày công tác.
  * **Bước 4 — Đối soát & Khiếu nại từ Nhân viên (Disputes Review)**: Hiển thị trạng thái xác nhận di động (43/45 đã xác nhận), danh sách 2 khiếu nại công kèm nút `Xử lý khiếu nại`.
  * **Bước 5 — Ký duyệt Đa cấp & Khóa sổ (Audit Sign-off & Lock)**: Ký duyệt kép giữa Quản lý Nhân sự và Giám đốc Điều hành, băm mã SHA-256 đóng băng bất biến dữ liệu, kích hoạt nút `Xuất bảng lương CSV`.
- **Bảng Tổng hợp Công kỳ 45 Nhân sự**: Hiển thị chi tiết theo từng cột chuẩn mực: Mã NV, Họ tên, Phòng ban, Ngày công chuẩn (22.0), Công thực tế, Phép hưởng lương, Giờ OT (1.5x/2.0x), Ngày công tác, Phút đi muộn, Tổng công thanh toán và Trạng thái xác nhận.
![Ảnh 14: Quy trình Xử lý và Chốt Bảng công kỳ](evidence/screenshots/14_desktop_timesheets_step3_calculate.png)

#### Ảnh 15: Quản lý Bảng công kỳ — Kỳ công Đã khóa an toàn (DONE / Locked)
Kỳ công Tháng 10/2026 đã đóng hoàn tất: Trạng thái `ĐÃ KHÓA` (ổ khóa đỏ), toàn bộ dữ liệu công được đóng băng an toàn, sẵn sàng xuất dữ liệu tính lương (Payroll-ready) và không cho phép chỉnh sửa tùy tiện.
![Ảnh 15: Bảng công kỳ Đã khóa](evidence/screenshots/15_desktop_timesheets_step5_locked.png)

#### Ảnh 16: Drawer Xác nhận Khóa Kỳ Bảng công
Bấm `Khóa bảng công` mở Drawer xác nhận: Cảnh báo đóng băng dữ liệu toàn bộ kỳ công, yêu cầu nhập bắt buộc lý do kiểm toán / khóa kỳ trước khi chuyển sang phần mềm tính lương.
![Ảnh 16: Drawer Xác nhận Khóa Bảng công](evidence/screenshots/16_desktop_lock_timesheet_drawer.png)

#### Ảnh 17: Quản lý Nghỉ phép — Bảng Số dư phép & Sổ cái Biến động phép (Leave Ledger)
Màn hình quản trị nghỉ phép gồm 2 khu vực: Bảng tổng hợp số dư phép từng nhân sự (Được cấp, Đã dùng, Còn lại, Sắp hết hạn, Hạn dùng) và Bảng lịch sử sổ cái phép ghi nhận toàn bộ biến động cộng/trừ ngày phép append-only.
![Ảnh 17: Quản lý Nghỉ phép và Sổ cái phép](evidence/screenshots/17_desktop_admin_leave_balances.png)

#### Ảnh 18: Báo cáo Chuyên cần, Top Đi muộn & Thống kê Làm thêm giờ OT
Thống kê phân tích dữ liệu chuyên cần: Tỷ lệ chuyên cần (93.3%), Tổng giờ OT (180h), Tổng ngày nghỉ phép (14d); Bảng Top nhân viên đi muộn nhiều nhất và Bảng phân bổ giờ OT theo từng phòng ban; hỗ trợ xuất CSV mẫu tính lương.
![Ảnh 18: Báo cáo Chuyên cần và Thống kê OT](evidence/screenshots/18_desktop_admin_reports_analytics.png)

---

### 3.5. Nhóm E: Quản trị Quy trình & Quản trị Kiosk Chi nhánh trong Khung Open-ERP Shell

#### Ảnh 19: Cấu hình Quy trình & Ma trận Phân quyền Trách nhiệm RACI (`admin-workflows`)
Giải quyết trực tiếp yêu cầu người dùng: *"chưa thấy màn hình chức năng cấu hình luồng xử lý của plugin này? ai là người cấu hình"*.
- **Thông báo Quyền hạn Cấu hình**: Khẳng định rõ ràng **HR Admin & System Admin** là người thiết lập chính sách và cấu hình quy trình; **Line Manager** thực hiện phê duyệt Cấp 1; **HR Manager** duyệt Cấp 2 và Khóa bảng công; **Nhân viên** theo dõi tiến trình và nộp đơn.
- **Ma trận Trách nhiệm RACI 4 Vai trò**: Trực quan hóa trách nhiệm giữa Nhân viên (R), Quản lý trực tiếp (A), HR Admin (C), và System Admin (I) qua 5 loại quy trình.
- **5 Thẻ Chính sách Quy trình Độc lập với Stepper Đa tầng Trực quan**:
  1. *Đơn Nghỉ phép (Leave Policy)*: 3 cấp (Quản lý trực tiếp -> Trưởng phòng ban -> Động cơ trừ phép tự động), SLA 24h.
  2. *Đơn Làm thêm giờ (OT Policy)*: 2 cấp (Quản lý dự án -> HR tính quỹ OT), SLA 12h.
  3. *Đơn Giải trình / Bổ sung công (Regularization Policy)*: 2 cấp (Giám sát ca -> HR chèn log bù & tính lại công), SLA 24h.
  4. *Đơn Công tác ngoại tỉnh (Business Trip Policy)*: 3 cấp (Trưởng phòng -> Giám đốc -> Tạm ứng & Miễn Geofence), SLA 48h.
  5. *Quy trình Chốt & Khóa Bảng Chấm công Kỳ (Monthly Timesheet Closing Policy)*: 3 cấp (Kiểm toán công -> Ký duyệt kép HR Manager & CEO -> Băm mã SHA-256 khóa sổ), SLA 72h.
- **Thao tác nhanh**: Nút gạt Kích hoạt/Vô hiệu hóa tức thì và nút `Chỉnh sửa Cấu hình Policy`.
![Ảnh 19: Cấu hình Quy trình & Ma trận RACI](evidence/screenshots/19_desktop_admin_workflows.png)

#### Ảnh 20: Drawer Chỉnh sửa Cấu hình Quy trình Phê duyệt Đa tầng
Thao tác bấm `Chỉnh sửa` tại thẻ chính sách mở Drawer trượt cạnh phải (Anti-modal chuẩn Rule 10, Rule 26):
- **Cấu hình tham số SLA**: Thiết lập thời hạn SLA tối đa (giờ) cho toàn bộ quy trình.
- **Trạng thái kích hoạt**: Bật/tắt chính sách áp dụng toàn tenant.
- **Danh sách chi tiết các cấp duyệt**: Cấp 1 (Line Manager - Quản lý trực tiếp), Cấp 2 (Department Head / HR Manager), Cấp 3 (Automated Engine / Director) với vai trò, mô tả và cấu hình chuyển cấp tự động (Escalation) khi quá hạn.
- **Footer Drawer độ tương phản cao**: Nút Hủy và Nút Lưu (`COMMON_CANCEL`, `COMMON_SAVE`) sắc nét, dễ nhìn trên chế độ sáng (Light Mode).
![Ảnh 20: Drawer Chỉnh sửa Cấu hình Quy trình](evidence/screenshots/20_desktop_workflow_edit_drawer.png)

#### Ảnh 21: Quản trị Kiosk Chi nhánh & Xuất Link Bảo Mật Cách Ly Danh Tính (`admin-kiosk`)
Giải quyết trực tiếp yêu cầu người dùng: *"chức năng kiosk thì phải cho phép từng đơn vị/chi nhánh xuất link riêng để đảm bảo bảo mật danh tính nhân viên ở các chi nhánh khác nhau cho phù hợp"*.
- **Bộ 4 chỉ số tổng quan Kiosk**: Tổng thiết bị (3 máy), Đang trực tuyến (2 máy online), Ngoại tuyến (1 máy offline), Tổng lượt quẹt thẻ hôm nay (142 lượt).
- **Bảng Danh mục Thiết bị Kiosk phân bổ theo từng Chi nhánh / Đơn vị độc lập**:
  * *Hà Nội (`BRANCH-HN` / `KIOSK-HN-01`)*: Sảnh Lễ tân Keangnam (Tầng 1), hiển thị link chi nhánh chuyên biệt `?branch=BRANCH-HN&device=KIOSK-HN-01&token=...`, danh sách phòng ban: Kỹ thuật, Kinh doanh.
  * *TP. Hồ Chí Minh (`BRANCH-HCM` / `KIOSK-HCM-01`)*: Sảnh Văn phòng Bitexco (Tầng 12), link `?branch=BRANCH-HCM&device=KIOSK-HCM-01&token=...`, phòng ban: Nhân sự, Tài chính, Vận hành.
  * *Bình Dương (`BRANCH-BD` / `KIOSK-BD-01`)*: Cổng Nhà máy VSIP II (Cổng A), link `?branch=BRANCH-BD&device=KIOSK-BD-01&token=...`, phòng ban: Xưởng Sản xuất, Kho vận.
- **Các nút tác vụ bảo mật 1-chạm**:
  * `Sao chép Link Chi nhánh`: Tự động copy link chứa token bảo mật vào clipboard.
  * `Mở Kiosk Sảnh`: Mở màn hình Kiosk độc lập toàn màn hình.
  * `Xoay vòng Token`: Rotate Token vô hiệu hóa link cũ khi nghi ngờ lộ token.
![Ảnh 21: Quản trị Kiosk Chi nhánh](evidence/screenshots/21_desktop_admin_kiosk_branches.png)

---

### 3.6. Nhóm F: Chế độ Kiosk Sảnh Công cộng Độc lập Cách ly Danh tính theo Chi nhánh (`/kiosk`)

#### Ảnh 22: Kiosk Sảnh Chi nhánh Hà Nội — Cách ly Danh tính Tuyệt đối (`/kiosk?branch=BRANCH-HN`)
Khi mở link chuyên biệt của Chi nhánh Hà Nội:
- **Header Kiosk phân lập**: Hiển thị rõ ràng tên chi nhánh `Chi nhánh Hà Nội` (Sảnh Lễ tân Tòa Keangnam - Tầng 1) kèm huy hiệu bảo mật `Cách ly danh tính chi nhánh`.
- **Cách ly danh bạ triệt để**: Danh sách nhân viên CHỈ hiển thị **12 nhân viên** thuộc Chi nhánh Hà Nội (`EMP-001` đến `EMP-012`). Tuyệt đối không hiển thị nhân viên TP.HCM hay Nhà máy Bình Dương, ngăn chặn triệt để nguy cơ rò rỉ thông tin nhân sự giữa các đơn vị.
- **Tiện ích sảnh trực quan**: Đồng hồ số thời gian thực, Lưới thẻ cảm ứng, Thanh chữ cái A-Z, Vuốt chạm chuyển trang, Bộ lọc phòng ban (Kỹ thuật, Kinh doanh).
![Ảnh 22: Kiosk Sảnh Chi nhánh Hà Nội](evidence/screenshots/22_desktop_kiosk_hanoi_branch.png)

#### Ảnh 23: Kiosk Sảnh Chi nhánh TP. Hồ Chí Minh — Cách ly Danh tính Tuyệt đối (`/kiosk?branch=BRANCH-HCM`)
Khi mở link chuyên biệt của Chi nhánh TP.HCM:
- **Header Kiosk phân lập**: Tự động nhận diện chi nhánh `Chi nhánh TP. Hồ Chí Minh` (Sảnh Văn phòng Bitexco - Tầng 12) kèm huy hiệu `Cách ly danh tính chi nhánh`.
- **Cách ly danh bạ triệt để**: Danh sách nhân viên CHỈ hiển thị **6 nhân viên** thuộc Chi nhánh TP.HCM (`EMP-013` đến `EMP-018`: Ngô Bảo N, Trần Gia P, Nguyễn Hoàng Q, v.v.). Toàn bộ nhân sự các chi nhánh khác hoàn toàn bị ẩn.
![Ảnh 23: Kiosk Sảnh Chi nhánh TP. Hồ Chí Minh](evidence/screenshots/23_desktop_kiosk_hcm_branch.png)

#### Ảnh 24: Kiosk Sảnh — Chạm Thẻ Nhân sự & Bàn phím PIN Pad Cảm ứng 3x4
Chạm vào thẻ nhân viên `Ngô Bảo N` (EMP-013) tại Chi nhánh TP.HCM:
- **Thẻ Hồ sơ Nhân sự Đồng bộ (Linked Employee Profile Card)**: Phía trên bàn phím PIN hiển thị trọn vẹn thẻ hồ sơ nhân sự liên kết từ `plugin-employee` gồm ảnh avatar, họ tên, mã nhân viên, chức danh công việc, phòng ban.
- **Bàn phím PIN Pad cảm ứng 3x4**: Nút số to rõ, phản hồi cảm ứng nhạy bén, nút `⌫` xóa lùi, nút `Đổi nhân viên` để quay lại lưới.
- **Bảo mật tuyệt đối**: Che giấu mã PIN bằng ký tự tròn bảo mật khi chạm.
![Ảnh 24: Kiosk Sảnh Nhập PIN](evidence/screenshots/24_desktop_kiosk_pin_entered.png)

#### Ảnh 25: Kiosk Sảnh — Chấm công Thành công Banner Chào mừng
Bấm `CHẤM VÀO`:
- **Xác thực an toàn**: Backend xác thực mã PIN qua băm muối SHA-256 bảo mật cao.
- **Banner chào mừng lớn**: Hiển thị banner chào mừng thành công màu xanh lục kèm tên nhân viên (`Ngô Bảo N`), mã nhân viên (`EMP-013`), và thời điểm chấm công (`08:05:00`).
- **Tự động làm mới (Auto-Reset)**: Giao diện tự động đếm lùi 3.5 giây và làm mới màn hình về danh sách nhân viên chi nhánh cho lượt quẹt tiếp theo.
![Ảnh 25: Kiosk Sảnh Chấm công Thành công](evidence/screenshots/25_desktop_kiosk_punch_success.png)

---

### 3.7. Nhóm G: Chế độ Thiết bị Di động Mobile Emulation (390x844 px chuẩn iPhone)

Kiểm thử toàn diện trên trình duyệt với chế độ giả lập điện thoại thông minh (chuẩn iPhone 390x844 px):
- **Tràn ngang**: `scrollWidth = 390px` (**tràn ngang = 0**).
- **Touch Target**: Mọi nút bấm và tab điều hướng có chiều cao tối thiểu **48px** (vượt chuẩn tối thiểu 44px).
- **Safe-area**: Thanh điều hướng 5 tab dưới đáy luôn hiển thị rõ ràng, không che khuất nội dung.

#### Ảnh 26: Mobile Tab 1 — Chấm công Di động Trong Bán kính GPS
Nút bấm lớn `CHẤM VÀO` (xanh) / `CHẤM RA` (đỏ), hiển thị chỉ báo GPS trong bán kính văn phòng và ca làm việc hôm nay.
![Ảnh 26: Mobile Chấm công Trong Bán kính GPS](evidence/screenshots/26_mobile_punch_in_range.png)

#### Ảnh 27: Mobile Tab 1 — Chấm công Di động Ngoài Bán kính GPS
Kịch bản quẹt thẻ ngoài phạm vi văn phòng: Hệ thống hiển thị huy hiệu cảnh báo và yêu cầu nhập ghi chú lý do công tác.
![Ảnh 27: Mobile Chấm công Ngoài Bán kính GPS](evidence/screenshots/27_mobile_punch_outside_range.png)

#### Ảnh 28: Mobile Tab 2 — Lịch làm việc Tuần Cá nhân
Hiển thị danh sách phân ca làm việc tuần cá nhân theo từng ngày, kèm huy hiệu trạng thái công thực tế (Có mặt / Nghỉ tuần).
![Ảnh 28: Mobile Lịch làm việc Tuần](evidence/screenshots/28_mobile_schedule_week.png)

#### Ảnh 29: Mobile Tab 3 — Danh sách Đơn từ Cá nhân
Liệt kê các đơn từ cá nhân đã gửi với mã số, loại đơn, thời gian nộp và huy hiệu trạng thái màu sắc trực quan.
![Ảnh 29: Mobile Danh sách Đơn từ](evidence/screenshots/29_mobile_requests_list.png)

#### Ảnh 30: Mobile Tab 3 — Biểu mẫu Nộp đơn Mới Di động
Drawer biểu mẫu nộp đơn tối ưu cho thao tác chạm trên màn hình cảm ứng điện thoại, dễ dàng nhập liệu và gửi duyệt.
![Ảnh 30: Mobile Biểu mẫu Nộp đơn](evidence/screenshots/30_mobile_request_new_drawer.png)

#### Ảnh 31: Mobile Tab 4 — Hộp thư Duyệt đơn dành cho Quản lý Di động
Quản lý trực tiếp có thể xem xét, nhập ý kiến phản hồi và bấm `DUYỆT` hoặc `TỪ CHỐI` đơn từ của nhân viên cấp dưới ngay trên di động.
![Ảnh 31: Mobile Hộp thư Duyệt đơn Quản lý](evidence/screenshots/31_mobile_approvals_inbox.png)

#### Ảnh 32: Mobile Tab 5 — Nhân viên Xác nhận Kỳ Bảng công
Nhân viên xem thông tin kỳ công tháng, bấm `ĐÃ XÁC NHẬN` để đồng ý với số liệu công và giờ làm thêm được tổng hợp.
![Ảnh 32: Mobile Nhân viên Xác nhận Bảng công](evidence/screenshots/32_mobile_confirm_timesheet.png)

#### Ảnh 33: Mobile Tab 5 — Nhân viên Khiếu nại Kỳ Bảng công
Trường hợp có sai lệch giờ quẹt thẻ hoặc ca làm việc, nhân viên bấm `KHIẾU NẠI BẢNG CÔNG` kèm ghi chú phản hồi để quản trị viên kiểm tra và điều chỉnh.
![Ảnh 33: Mobile Nhân viên Khiếu nại Bảng công](evidence/screenshots/33_mobile_dispute_timesheet.png)

---

### 3.8. Tuân thủ Tuyệt đối Quy chuẩn UI/UX ERP (Rule 28 & Rule 29)

- **Rule 28 (Zero-Emoji & Pure Semantic Labels Invariant)**: 100% nhãn, nút bấm, tiêu đề và badge trạng thái trên cả 33 ảnh đều là văn bản ngữ nghĩa thuần túy; biểu tượng trực quan được hiển thị bằng SVG tinh chuẩn độc lập, tuyệt đối không chứa ký tự emoji Unicode (`⚠️`, `✓`, `❌`, `📍`, `☀️`, `🌙`, v.v.).
- **Rule 29 (Zero-Raw Display Values & 100% i18n)**: 100% chuỗi hiển thị, nhãn trường, giá trị enum trạng thái, thông số nội suy kèm đơn vị tính (`{meters}m`, `{hours}h`, `{tab}`) đều được dịch thông qua `TranslatePipe` / `TranslateDirective` từ từ điển hệ thống, đạt 100.0% strict parity trên 13 ngôn ngữ.
- **Độ tương phản màu sắc Light Mode**: Toàn bộ văn bản sử dụng `text-ink` (#171717) sắc nét, tiêu đề bảng `bg-slate-100`, viền `border-default`, footer drawer có nền và nút bấm phân cấp độ tương phản vượt chuẩn WCAG 2.1 AA.

---

## 4. Kết luận Nghiệm thu QA

- **Tiêu chuẩn Sprint DoD Gate**: **100% item hoàn thành**, **0 lỗi Critical**, **0 lỗi High**, **0 lỗi Medium**.
- Toàn bộ 23 tiêu chí nghiệm thu (AC-A*, AC-S*, AC-T*, AC-R*, AC-L*, AC-M*) đều đạt trạng thái **PASS**.
- Toàn bộ 33 kịch bản màn hình chức năng và các trường hợp nghiệp vụ khác nhau đã được kiểm thử, chụp ảnh minh chứng đầy đủ và xác thực đạt chuẩn.
- Đủ điều kiện đóng Sprint 09 và bàn giao nghiệm thu.


