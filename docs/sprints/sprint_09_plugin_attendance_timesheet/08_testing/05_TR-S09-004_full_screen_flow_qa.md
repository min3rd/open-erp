# [TR-S09-004] Test Report — QA toàn bộ màn hình & luồng Plugin Chấm công

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TR-S09-004 / Test Report / Sprint 09 |
| Trạng thái / phiên bản / cập nhật | **QA PASS (chờ xác nhận đóng sprint) / 1.1 / 2026-11-15 18:15 (+07:00)** |
| Owner / reviewer | QA Agent / Solution Architect |
| Đầu vào | [TP-S09-001](01_TP-S09-001_sprint_09_test_plan.md), [TR-S09-003](04_TR-S09-003_db_role_ui_retest_report.md), [BUG-200…203](../07_items/) |
| Phạm vi | 14 tab desktop, 8 drawer chi tiết, 3 vai trò, mobile 390×844, 6 loại đơn, API/DB thật |
| Môi trường | Windows; Node 24.15.0; JDK 21; PostgreSQL 16 + Redis thật; web `localhost:4200`; backend `localhost:8088`; plugin container `openerp-plugin-attendance-1-0-0` |
| Tenant chính | `review50c` — `Công ty TNHH Review 50 C` (51 nhân sự) |
| Tenant phụ | `review50` — `Công ty TNHH Review 50` (kiểm tra cài plugin + tạo quy trình) |

> Báo cáo này thay thế ma trận màn hình của TR-S09-003. Vòng QA cuối (18:00–19:10) đã chụp lại **25 ảnh màn hình thật** trên tenant `review50c` bằng Chrome CDP 1440×900; ảnh lưu tại [`evidence/screenshots/`](evidence/screenshots/) với tiền tố `01_…25_` của vòng này.

---

## 1. Kết quả tổng hợp

| Hạng mục | Kết quả |
| :--- | :--- |
| Plugin unit/resource tests | **118/118 PASS** (`mvn -f plugins/attendance/pom.xml test`) |
| Backend core tests | **284/284 PASS**, 0 failures/errors (`mvn -f src/backend/pom.xml test`) |
| QA API trên DB thật | **25/25 PASS** (`npm run qa:attendance-api`), gồm lọc audit + khóa kỳ dương tính |
| Kiosk public QA | **11/11 PASS** (`npm run qa:attendance-kiosk`), route công khai + device-scoped token |
| UI build | **PASS** (`npm run attendance:ui:build`, `npm run web:build`) |
| i18n strict | **100%** web 2.431 keys + mobile 1.920 keys, 13 ngôn ngữ |
| Console | **0 `console.error`** trên 14 tab admin và 3 tab STAFF |
| Raw i18n key | **0** sau khi đăng nhập lần đầu (đã sửa preload dictionary) |
| Bảng dữ liệu | 18 vùng `.op-table-scroll`: header sticky, chỉ scroll rows, footer/pagination ngoài vùng cuộn |
| Định dạng ngày/tháng | Ngày `dd/mm/yyyy`, tháng `mm/yyyy`; API/URL giữ ISO |
| Vai trò | STAFF 3 tab; GENERAL_MANAGER 14 tab (quyền HR); TENANT_ADMIN 14 tab |
| Mobile 390×844 | 5 tab đáy, touch target 48 px, `overflow = 0` |
| Cross-tenant | `review50`: cài đủ dependency + attendance ACTIVE; workflow app mở được “Luồng mới” |

---

## 2. Ma trận màn hình (desktop)

| # | Màn hình / tab | Trường hợp đã kiểm | Kết quả | Bằng chứng |
| :---: | :--- | :--- | :---: | :--- |
| 1 | Chấm công của tôi | Ca làm việc, GPS, CHẤM VÀO/RA, lịch tuần, nhật ký 30 ngày, loading | **PASS** | Log IN/OUT thật; UI “Đã ghi nhận chấm công thành công” |
| 2 | Đơn của tôi | 6 loại đơn, lọc loại/trạng thái/ngày, phân trang, drawer chi tiết, timeline, payload, context menu | **PASS** | 25 đơn; đủ LEAVE/OVERTIME/ATTENDANCE_FIX/LATE_EARLY/BUSINESS_TRIP/SHIFT_SWAP |
| 3 | Bảng công của tôi | Chọn kỳ 10/2026, 22 bản ghi, tổng công/giờ/OT/muộn, xác nhận/khiếu nại | **PASS** | 22d, 199.8h, giờ vào 08:00 / ra 17:05 |
| 4 | Công phòng ban | Lọc tháng, phòng ban, tìm; phân trang; drawer nhân sự; context menu | **PASS** | 51 nhân sự; lọc Kinh doanh còn 6/51; drawer 22 dòng |
| 5 | Duyệt đơn | Hộp thư, lọc loại, split-view, timeline cấp duyệt, DUYỆT/TỪ CHỐI, audit | **PASS** | 1 đơn chờ → duyệt → hộp thư 0; tên nhân viên hiển thị đúng |
| 6 | Bảng công kỳ | Sub-tab kỳ/quy trình, lọc năm/trạng thái/tìm, 51 dòng, drawer nhân sự, pipeline, khóa kỳ | **PASS** (khóa dương tính: PARTIAL) | 6 trang × 10 dòng; khóa bị chặn đúng khi kỳ ở S3 |
| 7 | Ca làm việc & Lịch | Lọc tháng/trạng thái/tìm, coverage, drawer ca, phân ca hàng loạt chọn nhóm | **PASS** | 1 ca; coverage 51/8 phòng ban/1 chi nhánh; lọc Kinh doanh 6 người |
| 8 | Công ngày | Lọc ngày/tìm/cần rà soát, phân trang, drawer công ngày, context menu, recalc | **PASS** | 05/10/2026: 51 dòng; drawer đúng EMP/giờ vào-ra |
| 9 | Nhật ký chấm công | Tải toàn bộ 2.116 log, lọc nguồn/ngày/tìm, phân trang, drawer log | **PASS** | Trang 1→2 đổi dữ liệu; nguồn WEB = 0 đúng |
| 10 | Quản lý nghỉ phép | Sub-tab loại/số dư/sổ cái, lọc loại/loại biến động/tìm, drawer chi tiết | **PASS** | 59 số dư, 63 sổ cái; lọc QA leave còn 1 |
| 11 | Báo cáo & Xuất dữ liệu | Lọc tháng/phòng ban/tìm, KPI, top muộn, OT, export | **PASS** | 10/2026: 94.1%, 51 nhân sự, 110 muộn; top muộn 5 dòng |
| 12 | Cấu hình quy trình | 6 loại đơn, nút Tạo quy trình mở workflow app | **PASS** | Workflow app “Luồng mới” khả dụng |
| 13 | Quản trị Kiosk | 2 thiết bị, link lưu vĩnh viễn, tạo lại link, rotate token, mở Kiosk | **PASS** | `KIOSK-HP08PG` + `KIOSK-HN8VPB`; token lưu DB, reload vẫn dùng lại được; rotate sinh link mới, link cũ 401 |
| 14 | Lịch sử hoạt động | Audit list, refresh, phân trang | **PASS** | 23 dòng audit; chưa có filter (Medium) |

### 2.1. Drawer chi tiết

| Drawer | Kiểm tra | Kết quả |
| :--- | :--- | :---: |
| Chi tiết đơn của tôi | Mã, loại, trạng thái, thời điểm, hình thức duyệt, mapping, ý kiến, timeline, payload | PASS |
| Chi tiết công ngày | Nhân sự, ngày, ca, trạng thái, giờ vào/ra, công, OT, muộn, về sớm, override | PASS |
| Chi tiết lượt chấm công | Nhân sự, thời gian, loại, nguồn, thiết bị, GPS, ghi chú | PASS |
| Bảng công nhân sự | Mã/tên, phòng ban/chi nhánh, kỳ, tổng hợp, 22 dòng công | PASS |
| Chi tiết ca | Mã/tên, giờ, grace, coverage tháng, phòng ban/chi nhánh, sửa | PASS |
| Chi tiết nghỉ phép | Nhân sự, loại, granted/used/remaining/expiring, ledger | PASS |

---

## 3. Ma trận luồng nghiệp vụ

| # | Luồng | Các bước | Kết quả |
| :---: | :--- | :--- | :--- |
| F1 | Nhân viên chấm công | Đăng nhập STAFF → Chấm công → CHẤM VÀO → CHẤM RA → xem log | **PASS** — log IN/OUT thật; lỗi gọi `/punch` đã sửa thành `/check-in`/`/check-out` |
| F2 | Nhân viên xem công | Bảng công của tôi → chọn kỳ 10/2026 → xem 22 ngày | **PASS** — 22d / 199.8h |
| F3 | Nhân viên nộp đơn | Tạo đơn → PENDING → xem timeline | **PASS** — 6 loại đơn tạo được |
| F4 | Quản lý duyệt đơn | Hộp thư → chọn đơn → DUYỆT → audit/mapping | **PASS** — 1 PENDING → APPROVED, mapping APPLIED, inbox 0 |
| F5 | 6 loại đơn end-to-end | LEAVE, OVERTIME, ATTENDANCE_FIX, LATE_EARLY, BUSINESS_TRIP, SHIFT_SWAP → duyệt cuối | **PASS** — cả 6 APPROVED; 5 mapping APPLIED, SHIFT_SWAP đúng payload APPLIED |
| F6 | HR chốt kỳ | Kỳ 10/2026 → pipeline S3 → kiểm tra 51 dòng → nút khóa mở drawer lý do | **PASS (âm tính)** — API chặn khóa vì kỳ chưa DONE; không phá dữ liệu |
| F7 | HR phân ca | Ca HC → coverage → phân ca hàng loạt → lọc chi nhánh/phòng ban → chọn 6 người | **PASS** — chọn đúng nhóm, chặn submit khi chưa chọn |
| F8 | HR đối soát công | Công ngày 05/10 → lọc/tìm → mở drawer → context menu | **PASS** |
| F9 | HR xem log | Nhật ký 2.116 dòng → lọc nguồn WEB → 0 dòng → nguồn IMPORT → 2.116 | **PASS** |
| F10 | HR quản lý phép | Sub-tab số dư → lọc loại → xem chi tiết; sổ cái → lọc USAGE | **PASS** |
| F11 | HR báo cáo | Báo cáo → lọc 10/2026 → KPI 94.1% → top muộn 5 dòng | **PASS** |
| F12 | Cấu hình workflow | Cấu hình quy trình → Tạo quy trình → workflow app → “Luồng mới” | **PASS** |
| F13 | Kiosk | Mở link không token → từ chối; route đúng plugin | **PASS (âm tính)** — chưa có thiết bị seed để chấm PIN |
| F14 | Tenant khác | Đăng nhập review50 → cài dependency + attendance → mở 14 tab → workflow app | **PASS sau khi cài** — trước đó tất cả plugin `NOT_INSTALLED` |

---

## 4. Kiểm thử vai trò & mobile

| Vai trò | Tài khoản QA | Tab hiển thị | Kết quả |
| :--- | :--- | :--- | :--- |
| STAFF | `qa.att.employee@acme.test` (EMP-010) | 3: Chấm công, Đơn, Bảng công của tôi | PASS — không KPI/export/admin API, 0 console error |
| GENERAL_MANAGER | `qa.att.manager@acme.test` (EMP-020) | 14 (quyền HR đầy đủ trừ khóa kỳ) | PASS — 0 console error |
| TENANT_ADMIN | `review50c@acme.test` | 14 | PASS |

Mobile (viewport nội bộ 390×844):

- 5 tab đáy, chiều cao nút 48 px (≥ 40 px).
- `document.documentElement.scrollWidth - clientWidth = 0`.
- Nội dung mobile: chấm công, lịch tuần, số dư phép, tab bar; không tràn ngang.
- Lưu ý: QA dùng viewport override trong Chromium automation, không phải thiết bị Ionic thật; cần chạy lại trên mobile app thật trước release.

---

## 5. Kiểm thử phi chức năng

| Hạng mục | Kết quả |
| :--- | :--- |
| Sticky header | `position: sticky`; container `max-height: 574px`, `overflow-y: auto`; `scrollHeight > clientHeight` |
| Footer/pagination | Nằm ngoài vùng cuộn (`pager.top >= wrap.bottom`), luôn hiển thị khi cuộn rows |
| Loading | Overlay spinner cho log/công ngày; thanh tiến trình cho báo cáo; nút disable khi submit |
| Filter → bảng | Đổi filter trang/nguồn/ngày làm thay đổi số dòng và tổng bản ghi |
| URL/F5 | `sub`, `lv`, `drawer`, `workday`, filter params được giữ sau reload |
| i18n | 0 raw key; ngày/tháng theo locale; 13 ngôn ngữ parity 100% |
| Theme | Plugin dùng token core; nền `#171717` / header bảng `#0a0a0a`; không còn override slate |
| Console | 0 `console.error`, 0 HTTP 403 sau khi gate API theo vai trò |

---

## 6. API/DB & unit tests

| Bộ test | Kết quả |
| :--- | :--- |
| Plugin unit/resource (JUnit) | **118/118 PASS**, 0 failures, 0 errors |
| QA API thật | **25/25 PASS**: auth, employees, org assignments, leave type/grant/balance/ledger, submit/approve, team/summary gRPC, audit, recalc, records, timesheets, shifts, directory phòng ban/chi nhánh, employee records, shift coverage, my timesheets/my records, audit action filter, positive timesheet lock/unlock |

### 6.1. Vòng bổ sung sort, duyệt đơn, Kiosk PIN (17:00)

| Kiểm tra | Kết quả |
| :--- | :--- |
| Sort header | `TableSortService` + directive dùng chung; click header đổi asc/desc, `aria-sort` cập nhật |
| Default page size | Tất cả bảng đặt 100 bản ghi/trang |
| Duyệt đơn | Split-view 2 cột, bảng 4 cột, lọc loại + tìm + phân trang 100 |
| Loại nghỉ phép | Lọc trạng thái/tìm, phân trang 100, sort mã/tên |
| Kiosk tạo thiết bị | Drawer tạo `KIOSK-HN8VPB`, trả link device+token, hiển thị/sao chép/mở |
| Kiosk route | URL giữ `/kiosk?device=...&token=...`, F5 không mất trang, mã máy đúng |
| Kiosk PIN cá nhân | API đặt PIN 9753; auth kiosk 9753 PASS, PIN thiết bị 123456 FAIL đúng |
| Nhật ký hoạt động | Bỏ JSON, hiển thị key/value; sort thời gian/hành động/đối tượng |
| Tồn đọng | Link Kiosk vẫn cần phiên đăng nhập core khi mở trên tablet chưa đăng nhập (anonymous public kiosk chưa làm) |
| DB thật | 51 employee refs; 2.116 log; 1.124 record; 59 số dư phép; 63 bút toán; 25 đơn: 6 loại; 1 kỳ công |

### 6.2. Vòng QA cuối 18:00 — Kiosk link/PIN/theme + ảnh nghiệm thu thật

| Kiểm tra | Kết quả | Bằng chứng |
| :--- | :--- | :--- |
| Kiosk nhân sự | **51 nhân sự**, đúng phòng ban/chi nhánh qua `OrgDirectoryService` (trước đây 0 do lọc `primary_branch_id`) | `13_kiosk_directory.png` (“Hiện thị 12 / 51 nhân viên”) |
| Link Kiosk dùng lại được | Token lưu cột `public_token`; mở lại URL/F5 sau nhiều giờ vẫn vào Kiosk, mã máy `KIOSK-HN8VPB` | `13_kiosk_directory.png` |
| Rotate token | `POST /admin/devices/{id}/rotate` sinh token mới + link mới; token cũ trả `401 KIOSK_DEVICE_TOKEN_INVALID` | API: new `200` (51 NV) / old `401` |
| Tạo link cho thiết bị cũ | Nút **Tạo link** hiện với thiết bị chưa có token; bấm tạo link tại chỗ | `12_kiosk_admin_devices.png` |
| PIN cá nhân | `9753` → `KIOSK_AUTH_SUCCESS`; PIN thiết bị `123456` → `KIOSK_AUTH_FAILED`; drawer “Đặt PIN Kiosk” lưu thành công | `14`–`16`, `18_employee_pin_drawer.png` |
| Chấm công Kiosk | Nhập PIN → CHẤM RA → banner “Chấm công thành công!”, ghi nhận giờ thật | `16_kiosk_punch_result.png` |
| Kiosk theme tenant | Bỏ `dark`/`slate`/`emerald` cứng; dùng `bg-surface`, `text-ink`, `border-default`, `bg-primary`, `success/danger` | `13`–`16` |
| F5 / deep link | URL `/kiosk?device=…&token=…` giữ nguyên sau reload; không redirect về trang admin | `13_kiosk_directory.png` |
| Duyệt đơn có dữ liệu | Đơn `REQ-202611-9011` (Ngô Mai Nam, nghỉ 20/11) hiện trong hộp thư; chọn dòng → pipeline 2 bước, payload form, nút DUYỆT/TỪ CHỐI | `04_approvals_split.png` |
| Đơn của tôi (STAFF) | 1 đơn `REQ-202611-9011`, trạng thái CHỜ DUYỆT, lọc loại/trạng thái/ngày, pager 100 | `02_my_requests.png` |
| Loại nghỉ phép | 16 bản ghi, lọc trạng thái + tìm mã, sort cột, 100 dòng/trang | `09_leave_types.png` |
| Lịch sử hoạt động | 106 bản ghi, chi tiết key/value (không JSON thô), sort thời gian/hành động/đối tượng | `11_activity_audit.png` |
| Bảng công của tôi | Kỳ 10/2026, công/giờ/OT, sort cột | `03_my_timesheet.png` |
| Công phòng ban | 51 nhân sự, lọc tháng/phòng ban/tìm, sort | `05_team.png` |
| Kỳ công | Danh sách kỳ, trạng thái khóa, mở stepper | `06_timesheets.png` |
| Ca làm việc | Danh sách ca + coverage, sort | `07_shifts.png` |
| Công ngày | Bảng công ngày có lọc/sort/pager 100 | `08_records.png` |
| Báo cáo | KPI, top muộn, OT, bộ lọc tháng/phòng ban | `10_reports.png` |
| Chấm công của tôi (STAFF) | 3 tab theo quyền, nút **Đặt PIN Kiosk**, nhật ký 30 ngày có sort | `17_employee_self.png` |

Ảnh nghiệm thu (18 ảnh đợt 1, dữ liệu thật tenant `review50c`, chụp 18:00–18:10 ngày 15/11/2026; 7 ảnh đợt Medium ở mục 6.3):
`01_self_punch.png`, `02_my_requests.png`, `03_my_timesheet.png`, `04_approvals_split.png`, `05_team.png`, `06_timesheets.png`, `07_shifts.png`, `08_records.png`, `09_leave_types.png`, `10_reports.png`, `11_activity_audit.png`, `12_kiosk_admin_devices.png`, `13_kiosk_directory.png`, `14_kiosk_pin_pad.png`, `15_kiosk_pin_entered.png`, `16_kiosk_punch_result.png`, `17_employee_self.png`, `18_employee_pin_drawer.png`.

### 6.3. Vòng đóng Medium (19:10) — public kiosk route, device-scoped token, filter/column, backfill, khóa kỳ

| Hạng mục Medium | Cách xử lý | Kiểm chứng |
| :--- | :--- | :--- |
| Public kiosk yêu cầu đăng nhập core | **Route công khai** `/public/kiosk/:tenantSlug/:deviceCode` (Angular, không `authGuard`), tự mount plugin web component | `23_public_kiosk_anonymous.png` mở bằng profile Chrome sạch, không có phiên core |
| Token public dùng chung cả plugin | **Device-scoped token**: `POST /api/v1/plugins/public-session/attendance/kiosk` bắt buộc `device_code` + `device_token`, JWT mang claim `kiosk_device`; runtime gateway chặn mọi path ngoài `/kiosks/{device}/` | QA kiosk **11/11 PASS**: token đúng thiết bị 200, thiết bị khác 403, thiếu/sai device token 401, tải được `main.js`/`styles.css` |
| Activity/Kiosk/Workflow thiếu filter + column config | Thêm lọc hành động/đối tượng (audit), tìm + trạng thái (kiosk), tìm + trạng thái + phân trang + sort (workflow); **column chooser** dùng chung ẩn/hiện và đổi thứ tự cột | `19_activity_filters_columns.png`, `20_kiosk_admin_filters_columns.png`, `21_workflows_filters_columns.png` |
| Vuốt grid Kiosk không có animation | Grid bám ngón tay (`translateX`, tối đa 120px), nhả tay chuyển trang + slide 260ms; nút Trang trước/Sau dùng cùng animation; tôn trọng `prefers-reduced-motion` | Touch thật qua CDP: `Trang 1 → 2`, transform `-88px` khi kéo, class `kiosk-slide-next` sau khi nhả |
| Tenant cũ chưa tự cài plugin mặc định | `PluginProvisioningService` reconcile lúc khởi động: tenant ACTIVE thiếu locked default nào thì chạy lại install saga | DB check: **0 tenant** thiếu 5 plugin mặc định (`catalog`, `org-structure`, `employee`, `form`, `workflow`) |
| Khóa kỳ dương tính chưa test | QA API tạo kỳ 09/2026 → S3 → S4 → DONE → lock → sửa bị chặn `ATTENDANCE_RECORD_LOCKED` → unlock thành công | `22_timesheet_locked_positive.png`; QA API bước “Timesheet lock blocks edits and unlock restores” PASS |

Ảnh bổ sung: `19_activity_filters_columns.png`, `20_kiosk_admin_filters_columns.png`, `21_workflows_filters_columns.png`, `22_timesheet_locked_positive.png`, `23_public_kiosk_anonymous.png`, `24_public_kiosk_pin.png`, `25_public_kiosk_punch.png`.

---

## 7. Lỗi phát hiện & xử lý trong vòng QA

| ID | Mức | Nội dung | Trạng thái |
| :--- | :--- | :--- | :--- |
| BUG-203.1 | Critical | UI chấm công gọi `/punch` không tồn tại → 500/405 | Fixed, retest PASS |
| BUG-203.2 | High | STAFF gọi API admin → 403/console error | Fixed, lazy-load theo tab/quyền |
| BUG-203.3 | High | `ATTENDANCE_FIX` mapping FAILED do `meta` Map vs jsonb | Fixed, retest APPLIED |
| BUG-203.4 | High | Duyệt đơn hiện UUID thay tên nhân viên | Fixed, resolve tên |
| BUG-203.5 | High | Lần đầu login raw i18n key | Fixed, preload dictionary trước custom element |
| BUG-203.6 | High | Pipeline khóa kỳ bỏ qua lý do audit | Fixed, mở drawer lý do |
| BUG-203.7 | High | Link Kiosk `/kiosk` về login | Fixed, route plugin `/settings/apps/attendance/kiosk` |
| BUG-203.8 | High | 17 unit test errors do thiếu dependency mới | Fixed, 118/118 PASS |

Chi tiết: [BUG-203](../07_items/BUG-203_attendance_full_qa_runtime_fixes.md).

---

## 8. Tồn đọng & hạn chế (không chặn luồng chính)

| Mức | Nội dung | Đề xuất |
| :--- | :--- | :--- |
| Low | Mobile QA dùng viewport override, không phải Ionic device thật | Chạy lại 390×844 trên mobile app trước release |

---

## 9. Kết luận QA

- Toàn bộ 14 tab, 6 drawer chi tiết và 6 loại đơn đã được kiểm tra trên dữ liệu thật; các luồng chính PASS.
- 8 lỗi Critical/High phát hiện trong QA đã được sửa và retest; plugin tests 118/118, backend 284/284, API QA 25/25, kiosk public QA 11/11, i18n 100%, console 0 lỗi.
- **Đủ điều kiện QA Done, chờ người dùng xác nhận đóng Sprint**: 0 lỗi Critical/High/Medium tồn đọng; chỉ còn 1 hạn chế Low (mobile QA dùng viewport override thay vì thiết bị Ionic thật) không chặn release.
