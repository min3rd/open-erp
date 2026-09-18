# [BUG-19] Frontend Lạm Dụng alert()/prompt()/confirm() Trái Quy Chuẩn Anti-Modal

- **Mã Lỗi**: BUG-19
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Frontend sử dụng native dialog `alert()`, `prompt()`, `confirm()` ở khoảng 15 vị trí để thông báo và xác nhận, vi phạm nghiêm trọng quy chuẩn Anti-Modal (phải dùng Drawer xếp chồng/Split-Screen và thông báo inline). Đặc biệt có vị trí dùng `prompt()` để nhập mật khẩu hiện tại khiến mật khẩu hiển thị dạng văn bản thô.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Toàn bộ UI Web (đăng ký, quên/đặt lại mật khẩu, 2FA, quản lý tài khoản), FEAT-04, FEAT-05, FEAT-06
- **Tệp liên quan** (15 vị trí):
  - `register-personal.component.ts:77`
  - `register-business.component.ts:91`
  - `reset-password.component.ts:67`
  - `setup-2fa-drawer.component.ts:75`
  - `disable-2fa-drawer.component.ts:55`
  - `account-drawer.component.ts:144,169,183,188,192,198,205,211,215,219`; trong đó dòng 183 dùng `prompt()` để nhập mật khẩu hiện tại (lộ ký tự).
- **Tài liệu đối chiếu**: AGENTS.md - "Hạn chế tối đa Modal" (nghiêm cấm lạm dụng Modal, thay bằng Router/Drawer/Split-Screen); [DES-03 - CORE_IAM_UI_SPEC.md](../06_designs/ui_ux/CORE_IAM_UI_SPEC.md) mục 1.1 và mục 3.2 (Stacked Drawers); [FEAT-06 - FEAT-06_account_management.md](FEAT-06_account_management.md) AC8 (Anti-Modal).

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Đăng nhập, mở Drawer Quản lý tài khoản → tab Bảo mật → bấm "Mã dự phòng" → tạo lại mã.
2. Quan sát hộp thoại `prompt()` hiện mật khẩu hiện tại dưới dạng văn bản thô khi người dùng gõ.
3. Bấm "Đăng xuất thiết bị này"/"Đăng xuất toàn bộ thiết bị khác" và quan sát native `confirm()`.
4. Thực hiện đăng ký cá nhân/doanh nghiệp, đặt lại mật khẩu, bật/tắt 2FA và quan sát các native `alert()` bật lên chặn màn hình.

## 3. Kết Quả Thực Tế (Actual Result)
- Trình duyệt hiển thị hộp thoại native xấu, không theo design token, chặn toàn bộ màn hình và mất ngữ cảnh làm việc.
- Thông báo thành công/lỗi bị đẩy ra ngoài Drawer thay vì hiển thị inline.
- `prompt()` tại `account-drawer.component.ts:183` hiển thị mật khẩu người dùng dạng plain text, tiềm ẩn rủi ro bảo mật (vai kề nhìn thấy).

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Loại bỏ hoàn toàn `alert()`, `prompt()`, `confirm()` khỏi mã nguồn frontend.
- Thông báo thành công/lỗi hiển thị inline trong Drawer (banner/toast nội bộ); form nhập mật khẩu dùng Drawer con xếp chồng (`Setup2FaDrawerComponent`/`Disable2FaDrawerComponent` style); xác nhận hành động nguy hiểm dùng nút/luồng inline thay vì `confirm()`.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
- Không có

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng automated browser test (puppeteer: routing/deep-link 7/7, login + token cũ 3/3, form 2 bước + live slug check + 2FA redirect 6/6, console 0 lỗi), Mobile smoke 18/18 PASS, Web/Mobile build PASS; ảnh minh chứng tại docs/06_user_guides/assets/sprint_01_core_iam/. Nghiệm thu cuối của khách hàng thực hiện khi đóng Sprint.
