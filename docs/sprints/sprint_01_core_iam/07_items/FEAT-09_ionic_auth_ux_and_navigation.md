# [FEAT-09] Ionic Mobile: Tối Ưu Màn Hình Auth & Điều Hướng Back/Forward

- **Mã Tính Năng**: FEAT-09
- **Phân Loại**: Feature / Enhancement
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Đề Xuất**: Khách hàng (phản hồi sau FEAT-08, 2026-09-18)
- **Phụ Trách**: Developer Agent (Mobile)
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là người dùng ứng dụng Mobile (Ionic 8), tôi muốn các **màn hình đăng nhập/đăng ký/quên mật khẩu/OTP/2FA/chọn workspace phù hợp với kích thước điện thoại** và thao tác **back/forward mượt mà** (nút back trên header, cử chỉ vuốt, phím back Android) mà không bị lặp trang, sai hướng chuyển cảnh hay kẹt ở trang đăng nhập.
- **Bối cảnh**: FEAT-08 đã thêm menu/theme. Khảo sát phát hiện toàn bộ app đang gọi `router.navigate(...)` thay vì Ionic `NavController` (`navigateForward`/`navigateBack`/`navigateRoot`) → hướng animation sai, stack điều hướng không đúng (ví dụ đăng nhập xong vào dashboard nhưng bấm back có thể quay lại login); các màn auth cần tinh chỉnh bố cục cho phone.

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **AC1 - Điều hướng đúng chuẩn Ionic**:
  - Đi sâu: dùng `NavController.navigateForward` (login → 2FA/select-tenant, tài khoản → setup/disable 2FA...).
  - Quay lại: `navigateBack` hoặc `ion-back-button` (2FA → login, verify-email → login, setup/disable 2FA → `/account/security`, select-tenant → login).
  - Vào màn chính: `navigateRoot('/dashboard')` sau đăng nhập/2FA/chọn workspace và `navigateRoot('/login')` sau đăng xuất/verify/reset thành công → **stack được dọn**, back không quay lại màn trung gian.
- [x] **AC2 - Back/Forward mượt**: browser back/forward và vuốt cạnh hoạt động đúng; chuyển cảnh forward/back đúng hướng; không lặp trang khi bấm nút back trên header.
- [x] **AC3 - Auth screens phù hợp mobile**: 8 màn (login/register-personal/register-business/forgot/reset/verify-email/two-factor/select-tenant) hiển thị gọn trên 390x844: container 1 cột, padding an toàn (safe-area), input/button đủ lớn để chạm (≥40px), nút chính full-width, nội dung cuộn được khi bàn phím mở, không tràn ngang; nhất quán style vuông vắn/dense của dự án.
- [x] **AC4 - Header chuẩn**: các màn con có `ion-back-button` đúng `defaultHref`; login không có back; trang có toolbar hiển thị tiêu đề ngắn gọn (không trùng 2 header).
- [x] **AC5 - Không hồi quy chức năng**: OTP + resend 60s, slug check 2 bước, 2FA bật/tắt, chọn workspace, sessionStorage pre-auth vẫn hoạt động; build PASS; console 0 lỗi.
- [x] **AC6 - Hình ảnh hướng dẫn**: cập nhật `16-mobile-login.png` (và ảnh liên quan nếu đổi) đúng UI mới.

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [x] TASK-145: Refactor toàn bộ điều hướng mobile sang `NavController` (forward/back/root) theo AC1; cập nhật `auth.service.logout()`.
- [x] TASK-146: Rà soát & tinh chỉnh UI 8 màn auth cho 390px (padding safe-area, touch target, scroll khi bàn phím, không tràn ngang).
- [x] TASK-147: Chuẩn hóa header/back button các màn auth & tài khoản (defaultHref, tiêu đề, không trùng header).
- [x] TASK-148: QA puppeteer: forward/back/forward (browser history), không tràn ngang, console 0 lỗi; chụp lại ảnh 16 nếu đổi.

## 4. Ghi Chú
- Bổ sung phạm vi được khách hàng yêu cầu (xem `04_confirmation/CONF-01_sprint_01_scope.md` mục 3, đợt 3).
- KHÔNG yêu cầu copy 100% style Web - giữ bản sắc Ionic cho mobile, chỉ đảm bảo phù hợp kích thước điện thoại và điều hướng chuẩn.
- **Ghi chú QA (2026-09-18)**: Xác nhận puppeteer 34/34 (forward/back, stack sau login/logout, back trong luồng, overflow 0, console 0 lỗi); Mobile build PASS; điều hướng dùng NavController + replaceUrl cho navigateRoot để browser-back không quay lại màn trước; ảnh 16-mobile-login.png cập nhật.
