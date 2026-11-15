# [BUG-204] Bổ sung sort, layout duyệt đơn, phân trang nghỉ phép, Kiosk PIN cá nhân & nhật ký dễ đọc

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-204 / Bug & bổ sung UI / Sprint 09 |
| Severity / trạng thái | **High / Fixed — QA PASS 18:15 15/11/2026** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / phản hồi QA 18:00 |
| depends_on / blocks / parent | BUG-203 / nghiệm thu UI / [TASK-462](TASK-462_attendance_ui_pagination_context_menu.md) |
| Write scope | attendance web, `@shared` TableSort, Kiosk API/PIN, manifest/migration |

## 1. Hiện tượng

1. Mọi bảng thiếu sort header.
2. Duyệt đơn: dải lọc chip khó đọc, không phải bảng, không lọc/phân trang, split-view chưa rõ.
3. Loại nghỉ phép không có lọc/phân trang.
4. Kiosk không tạo được thiết bị/link; nút mở public dẫn về admin; F5 mất trang kiosk.
5. Link Kiosk chỉ hiện một lần lúc tạo, quay lại không dùng lại được; rotate token không sinh link.
6. Kiosk báo **0 nhân viên** dù tenant có 51 nhân sự.
7. Lịch sử hoạt động hiển thị `detail` dạng JSON thô.
8. Default page size mỗi bảng khác nhau (10/20/50/100), không theo rule 100.
9. Kiosk chỉ có PIN dùng chung, không có PIN cá nhân; giao diện Kiosk hardcode `dark`/`slate`/`emerald` khác theme tenant.

## 2. Sửa đổi

- Thêm `TableSortService` + `TableSortHeaderDirective` dùng chung trong `@shared`; gắn `appTableSort`/`sortKey` cho các bảng: đơn của tôi, công ngày, nhật ký, nghỉ phép, kỳ công, nhân sự kỳ công, báo cáo, audit, kiosk, approvals. Header có mũi tên sort, `aria-sort`.
- Chuẩn hóa **mọi page size mặc định = 100**; `pageSizeOptions` vẫn 10/20/50/100.
- Duyệt đơn: bỏ filter chip, dựng **bảng hộp thư** (mã, nhân viên, loại, thời điểm nộp), lọc loại + tìm kiếm + phân trang; giữ split-view 2 cột 5/7 bằng CSS `.approvals-split`.
- Loại nghỉ phép: thêm lọc trạng thái/tìm kiếm, phân trang, sort.
- Kiosk:
  - Nút **Thêm Kiosk** + drawer tạo thiết bị (mã, tên, chi nhánh, PIN dùng chung).
  - Migration `V1.6.0__attendance_device_public_token.sql`: lưu `public_token` trên `plg_attendance_devices`; descriptor `attendance.device.set_public_token` để rotate.
  - API tạo thiết bị trả `device_token` + `public_token`; API device list trả `public_token` → **link Kiosk luôn hiển thị lại** sau reload.
  - Nút **Tạo link** cho thiết bị cũ chưa có token; nút **rotate** sinh token mới + link mới, token cũ bị vô hiệu.
  - Router giữ route kiosk (`routeReady`, không tự phát route self), F5 giữ nguyên trang và mã máy.
  - Nhân sự Kiosk lấy phòng ban/chi nhánh qua `OrgDirectoryService.employeeOrg()` (gRPC), fallback `primary_branch_id`; không còn 0 nhân viên.
  - Giao diện Kiosk dùng token theme tenant (`bg-surface`, `text-ink`, `border-default`, `bg-primary`, `success/danger`), bỏ class `dark` và màu slate/emerald/rose cứng.
  - Grid nhân sự Kiosk: vuốt theo ngón tay (`translateX`), nhả tay chuyển trang kèm animation slide 260ms (`prefers-reduced-motion` tắt animation).
  - Punch Kiosk: session token truyền bằng query `?session=…` (gateway core loại bỏ header `X-Kiosk-Session-Token`), tránh 401 giả và redirect login.
  - **Public route + device-scoped token**: route `/public/kiosk/:tenantSlug/:deviceCode` (không `authGuard`) tự mint phiên và mount plugin; `POST /api/v1/plugins/public-session/attendance/kiosk` bắt buộc `device_code` + `device_token`, JWT mang claim `kiosk_device`; runtime gateway chặn mọi path ngoài `/kiosks/{device}/`.
- **Bảng dữ liệu còn thiếu filter/column**: Activity thêm lọc hành động/đối tượng; Kiosk thêm tìm + trạng thái; Workflow thêm tìm + trạng thái + phân trang + sort; cả 3 dùng `app-table-columns` (ẩn/hiện + đổi thứ tự cột).
- **Backfill tenant cũ**: `PluginProvisioningService` reconcile lúc khởi động, tự cài locked default còn thiếu cho tenant ACTIVE.
- **Khóa kỳ dương tính**: QA API đưa kỳ 09/2026 tới DONE, lock, xác nhận sửa bị chặn, rồi unlock.
- Lịch sử hoạt động: bỏ `json` pipe; hiển thị key/value từng dòng, key thân thiện; sort theo thời gian/hành động/đối tượng.
- **PIN cá nhân**:
  - Migration `V1.5.0__attendance_kiosk_pin.sql`: thêm `kiosk_pin_hash`, `kiosk_pin_updated_at` vào employee refs.
  - Descriptor `attendance.employee_ref.set_kiosk_pin`; entity EmployeeRef mở 2 field.
  - `PUT /attendance/my-kiosk-pin` (4–6 số, hash SHA-256 salted) + nút **Đặt PIN Kiosk** trong màn Chấm công của tôi.
  - Kiosk authenticate ưu tiên PIN cá nhân; fallback PIN thiết bị nếu chưa đặt.

## 3. Kiểm chứng (dữ liệu thật tenant `review50c`)

- QA API: đặt PIN `9753` → `ATTENDANCE_MY_KIOSK_PIN_SUCCESS`; Kiosk auth bằng `9753` = 200, PIN thiết bị `123456` = 401 (đúng ưu tiên PIN cá nhân).
- UI employee: nút Đặt PIN Kiosk mở drawer, lưu thành công, drawer đóng (`18_employee_pin_drawer.png`).
- Duyệt đơn: grid 2 cột `485px / 679px`, bảng 4 cột, 2 select + search, pager size 100, sort header hoạt động; hộp thư hiển thị đơn `REQ-202611-9011` kèm pipeline/payload (`04_approvals_split.png`).
- Loại nghỉ phép: 16 bản ghi, lọc trạng thái/tìm, phân trang 100, click header đổi asc/desc (`09_leave_types.png`).
- Kiosk:
  - Danh sách 2 thiết bị, cả hai hiển thị **Sao chép link / Mở / Rotate** sau reload (`12_kiosk_admin_devices.png`).
  - `KIOSK-HN8VPB` mở đúng **51 nhân sự**, đủ 8 phòng ban, tìm kiếm/chữ cái/phân trang hoạt động (`13_kiosk_directory.png`).
  - Rotate sinh token mới: token mới `200` (51 NV), token cũ `401 KIOSK_DEVICE_TOKEN_INVALID`.
  - Nhập PIN `9753` → CHẤM RA → banner “Chấm công thành công!”, giờ ghi nhận thật (`16_kiosk_punch_result.png`).
  - URL/F5 giữ nguyên `/kiosk?device=KIOSK-HN8VPB&token=…`, không redirect admin.
- Nhật ký: 106 bản ghi, chi tiết key/value, không còn JSON một dòng (`11_activity_audit.png`); lọc hành động/đối tượng + column chooser (`19_activity_filters_columns.png`).
- Kiosk admin: tìm/trạng thái + column chooser (`20_kiosk_admin_filters_columns.png`); Workflow: tìm/trạng thái/phân trang/sort + column chooser (`21_workflows_filters_columns.png`).
- Public kiosk: route ẩn danh `/public/kiosk/:tenantSlug/:deviceCode` mở bằng profile sạch (`23_public_kiosk_anonymous.png`), nhập PIN (`24_public_kiosk_pin.png`), chấm công thành công (`25_public_kiosk_punch.png`); QA kiosk **11/11 PASS** gồm chặn token sang thiết bị khác (403) và tải asset.
- Khóa kỳ: kỳ 09/2026 DONE → khóa (`22_timesheet_locked_positive.png`), sửa bị chặn `ATTENDANCE_RECORD_LOCKED`, unlock thành công.
- Backfill: DB check **0 tenant** ACTIVE thiếu locked default plugin.
- Hồi quy: **118/118** plugin tests, **284/284** backend tests, **25/25** QA API, **11/11** kiosk public QA, i18n **100%** (web 2.431 keys), UI build PASS.

## 4. Tồn đọng (không chặn Sprint)

- Kiosk chưa seed thiết bị mặc định cho tenant mới (Low).
