# [BUG-29] State UI Không Đồng Bộ Sau Cập Nhật Hồ Sơ Và Checkbox Điều Khoản Không Có State

- **Mã Lỗi**: BUG-29
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Sau khi cập nhật hồ sơ, Drawer chỉ cập nhật signal nội bộ mà không đồng bộ state toàn cục nên TopBar vẫn hiển thị tên cũ; checkbox "điều khoản" ở màn đăng nhập là UI chết, không có state xử lý.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Quản lý tài khoản — Cập nhật hồ sơ (FEAT-06 AC1); Đăng nhập (FEAT-03).
- **File liên quan**:
  - `src/frontend/web/src/app/features/dashboard/account-drawer/account-drawer.component.ts:141-145` — sau khi update chỉ gọi `this.profile.set(res.data)` và `alert(...)`, không cập nhật `authService.user()`.
  - `src/frontend/web/src/app/features/dashboard/dashboard.component.html:6` — TopBar bind `auth.user()?.full_name` nên vẫn hiển thị tên cũ.
  - `src/frontend/web/src/app/features/auth/login/login.component.html:50-51` — checkbox `id="remember"` không có `[(ngModel)]`/state, label `AUTH_TERMS_AGREE`; trạng thái tick không được xử lý.
- **Tài liệu đối chiếu**:
  - FEAT-06 Kịch bản 1 (`docs/sprints/sprint_01_core_iam/07_items/FEAT-06_account_management.md:20`): dữ liệu cập nhật phải hiển thị ngay trên thanh Header/TopBar.
  - DES-03 (`docs/sprints/sprint_01_core_iam/06_designs/ui_ux/CORE_IAM_UI_SPEC.md`) — quy chuẩn UI màn đăng nhập.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Đăng nhập, mở Drawer Quản lý tài khoản (tab Hồ sơ).
2. Đổi họ tên khác và bấm Lưu.
3. Quan sát tên hiển thị trên TopBar/dashboard.
4. Ra màn đăng nhập, tick checkbox "điều khoản", đăng nhập rồi quay lại — kiểm tra trạng thái checkbox và dữ liệu được lưu.

## 3. Kết Quả Thực Tế (Actual Result)
- TopBar vẫn hiển thị tên cũ vì `auth.user()` không được cập nhật, chỉ reload/đăng nhập lại mới thấy tên mới (vi phạm FEAT-06 AC1).
- Checkbox "điều khoản" không có state: tick/không tick đều không có tác dụng, không được validate, không lưu trạng thái — là UI chết.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Sau khi lưu hồ sơ thành công, cập nhật state toàn cục `authService.user()` (signal) để TopBar và dashboard hiển thị tên mới ngay lập tức.
- Checkbox "điều khoản" phải có state xử lý hai chiều và logic ràng buộc (hoặc loại bỏ khỏi UI nếu không nằm trong phạm vi nghiệp vụ), không để UI chết.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer đã sửa xong.
- [ ] QA đã re-test và xác nhận không còn lỗi.
- [ ] Không gây lỗi phát sinh (Regression test pass).
