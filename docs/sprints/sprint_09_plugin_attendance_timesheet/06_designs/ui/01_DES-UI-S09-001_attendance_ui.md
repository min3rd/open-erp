# [DES-UI-S09-001] UI/UX: Plugin attendance (Web + Mobile Ionic)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-UI-S09-001 / Thiết kế UI / Sprint 09 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | [DES-ARCH-S09-001](../arch/01_DES-ARCH-S09-001_components_and_flows.md), [DES-API-S09-001](../api/01_DES-API-S09-001_attendance_api.md), [ui_ux_standards](../../../../../.agents/rules/ui_ux_standards.md), [CONF-S09-001](../../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) Q15 |
| Đọc trước / đọc tiếp | [DES-API-S09-001](../api/01_DES-API-S09-001_attendance_api.md) / bước 07 FEAT/TASK |

## 1. Nguyên tắc áp dụng

- **High-density**: `text-xs/text-sm`, `p-1/p-2`, `gap-1`, bảng công là grid mật độ cao nhất của plugin; giảm cuộn.
- **Sharp/square** (theme mặc định): `rounded-none/rounded-sm`, viền `border-neutral-200 dark:border-neutral-800`; Design Token chung `ColorVariant/SizeVariant/ShapeVariant` — cấm enum riêng.
- **Anti-modal**: mọi chi tiết/biểu mẫu dùng **Drawer trượt phải (stacked)**, **Split-view** hoặc **nested route**; modal chỉ cho confirm hủy tác động (destructive confirm).
- **100% i18n**: `TranslatePipe`/`[appTranslate]` với key `attendance.*`; zero hardcode; thêm `vi.json`, `en.json` của plugin WC.
- Loading/empty/error state cho mọi list (skeleton row, empty illustration text i18n, error banner retry); **0 console.error** là tiêu chí nghiệm thu.

## 2. Route map (Web — WC screens trong `ui_manifest`)

| Route (nested) | Màn hình | Chính |
| :--- | :--- | :--- |
| `/attendance` | **Tổng quan chấm công của tôi** | Widget check-in/out lớn (giờ hiện tại, nút IN/OUT, trạng thái ca, geofence cảnh báo), lịch tuần của tôi, lịch sử 30 ngày (bảng text-xs), số dư phép |
| `/attendance/requests` | **Đơn của tôi** | Bảng đơn (mã, loại, trạng thái, timeline), nộp đơn mới → Drawer chọn loại → form động theo form_ref |
| `/attendance/requests/new/:typeCode` | Nested — form điền đơn | Form render theo form definition (pin version), validate, submit |
| `/attendance/team` | **Công team (Manager)** | Bảng nhân viên × ngày tháng hiện tại (mã màu trạng thái), filter phòng ban; click cell → Drawer chi tiết record + actions (override, chấm hộ) |
| `/attendance/approvals` | **Duyệt (Manager)** | Tab: Đơn chờ duyệt (inbox), Lịch cần duyệt (SHIFT_SWAP); Split-view: danh sách trái + chi tiết/timeline phải, hành động Duyệt/Từ chối (lý do bắt buộc) |
| `/attendance/admin/logs` | **HR — Log chấm công** | Bảng log filter đa điều kiện, import CSV (Drawer nhiều bước), xóa log (lý do), chấm hộ |
| `/attendance/admin/shifts` | **HR — Ca làm việc** | Bảng ca + Drawer CRUD (giờ, grace, break, OT), tab Ngày lễ, tab Template tuần theo đơn vị (grid 7 ngày) |
| `/attendance/admin/records` | **HR — Công ngày** | Grid nhân viên × ngày (mã trạng thái màu), override → Drawer, tính lại, needs_review queue |
| `/attendance/admin/requests` | **HR — Cấu hình đơn từ** | Bảng loại đơn (seed 6 + tùy chỉnh), bật/tắt, tạo loại mới → Drawer (chọn form + luồng engine + window_days) |
| `/attendance/admin/leave` | **HR — Nghỉ phép** | Tab Loại nghỉ (thuộc tính), tab Số dư (bảng tổng hợp + điều chỉnh Drawer), tab Ledger (append-only, filter), cấp phép năm (multi-select nhân viên) |
| `/attendance/admin/timesheets` | **HR — Bảng công kỳ** | Danh sách kỳ; tạo kỳ → chuyển **trang 4 bước**: stepper S1_LOGS→S2_SCHEDULE→S3_CALCULATE→S4_ADJUST→DONE, mỗi bước 1 nested route, cảnh báo ghi đè khi quay lại; grid nhân viên × ngày |
| `/attendance/admin/timesheets/:id/confirmations` | **Gửi & theo dõi xác nhận** | Bảng trạng thái từng người, gửi lại, hành động chốt (quá hạn vẫn chốt + đánh dấu) |
| `/attendance/admin/reports` | **HR — Báo cáo** | Summary tenant (attendance rate, OT, muộn, nghỉ) + biểu đồ theo phòng ban; xuất Excel/CSV qua Drawer chọn template |
| `/attendance/admin/devices` | **HR — Thiết bị & cấu hình** | Kiosk/middleware (secret rotate), import, settings (threshold, geofence, ca mặc định) |
| `/kiosk/:deviceCode` | **Màn kiosk** (fullscreen, không nav) | Nhập mã NV + PIN → punch IN/OUT; state chờ tự reset; không hiển thị dữ liệu người khác |

Điều hướng: menu plugin "Chấm công" theo vai trò (Nhân viên: Tổng quan/Đơn; Manager thêm Team/Duyệt; HR thêm nhóm admin) — pattern role-chip menu Sprint 07.

## 3. Shared components (đóng gói vào `src/frontend/shared/components/`)

| Component | Dùng ở | Ghi chú |
| :--- | :--- | :--- |
| `AttendanceStatusBadge` | mọi grid/bảng | chip vuông màu theo 6 trạng thái + `needs_review` (viền đứt) — dùng `ColorVariant` |
| `EmployeeDayGrid` | team/records/timesheets | grid nhân viên × ngày generic, cell slot render callback, virtual scroll > 200 nhân viên |
| `RequestTimeline` | chi tiết đơn | timeline từ event log engine + mapping status |
| `LeaveBalanceCard` | self/HR | breakdown được cấp/đã dùng/còn lại/hết hạn |
| `PeriodStepper` | timesheets | stepper 4 bước + cảnh báo quay lại |
| `GpsIndicator` | mobile check-in | hiển thị trong/ngoài bán kính (cảnh báo không chặn) |
| `DateRangeFilter`, `ScopeFilter` (branch/department) | các bảng admin | tái dùng từ organization/employee nếu đã có |

## 4. Mobile Ionic (390×844 — CONF Q15 full self-service)

| Page | Nội dung | Ghi chú |
| :--- | :--- | :--- |
| Tab Chấm công | Nút IN/OUT lớn, GPS indicator, trạng thái hôm nay, lịch tuần | touch target ≥ 44px, safe-area |
| Tab Lịch của tôi | lịch tháng + ca từng ngày | |
| Tab Đơn của tôi | danh sách + nộp đơn (form động) + timeline | Drawer thay modal |
| Tab Duyệt (manager) | inbox đơn chờ + duyệt/từ chối (lý do) | action sheet → drawer |
| Xác nhận công | banner khi có bảng chờ xác nhận → confirm/reject kèm ghi chú | deep-link từ notification |
| Không có | cấu hình admin, builder, import, báo cáo tổng | builder chỉ Web (CONF AC-Đ02) |

Ràng buộc: không tràn ngang (overflow = 0), không modal che màn, mọi list có empty state i18n, pull-to-refresh; ảnh minh chứng 390×844 cho TR.

## 5. Trạng thái giao diện & i18n

- Loading: skeleton row/ cell grid; Empty: `ATTENDANCE_EMPTY_*`; Error: banner + retry (map `code` API → key i18n `attendance.error.<code>`); geofence cảnh báo hiển thị màu vàng chip, không chặn.
- Bộ key chính: `attendance.checkin.*`, `attendance.shift.*`, `attendance.request.*`, `attendance.leave.*`, `attendance.timesheet.step.*`, `attendance.report.*`, `attendance.error.*`; trạng thái/enum render qua key `attendance.status.<ENUM>`.
- Ngôn ngữ dữ liệu tenant (tên ca, tên loại nghỉ) hiển thị nguyên văn — dữ liệu, không i18n (pattern employee).

## 6. Kiểm chứng UI

QA browser 2 chế độ: Desktop ≥1280px (grid mật độ cao, drawer stack, split-view duyệt) + Mobile emulation 390×844 (5 tab trên, GPS, xác nhận); 0 console error; ảnh chụp từng màn chính kèm role (Nhân viên/Manager/HR/Tenant Admin) vào TR. AC truy vết: AC-A01/02/03 (widget/kiosk), AC-M01 (mobile), AC-T02 (grid 4 bước), AC-T03 (confirmations), AC-Đ05 (inbox), AC-S04 (my-schedule).
