# [TEST-02] Hướng Dẫn QA Manual Test Trên Môi Trường Local - Sprint 01 Core IAM

- **Mã Tài Liệu**: TEST-02
- **Thuộc Sprint**: Sprint 01 - Core Identity, Access & Account Management
- **Phụ Trách**: QA/QC Agent
- **Ngày Triển Khai Môi Trường**: 2026-09-18
- **Trạng Thái**: [x] Môi trường local đã sẵn sàng - chờ QA thao tác trên trình duyệt

---

## 1. Thông Tin Môi Trường Đang Chạy

| Dịch Vụ | URL / Thông Tin | Ghi Chú |
| :--- | :--- | :--- |
| Web Angular 22 (Desktop) | http://localhost:4200 | Dev server (live reload) |
| Mobile Ionic 8 | http://localhost:8100 | Dev server mobile web; có thể mở DevTools chế độ thiết bị |
| Backend Quarkus (dev mode) | http://localhost:8088 | Live coding, log: `%TEMP%\opencode\backend-dev2.log` |
| Swagger UI | http://localhost:8088/q/swagger-ui | Dùng để test API thủ công nếu cần |
| Mailpit (đọc email OTP) | http://localhost:8025 | **Bắt buộc mở song song khi test đăng ký/quên mật khẩu** |
| PostgreSQL | localhost:5432 - db `openerp_dev` - user `openerp` / `openerp_dev_password` | Flyway đã migrate V1.0.0 |
| Redis | localhost:6379 - password `openerp_redis_password` | Session/OTP/Brute-force/Blacklist |

**Lệnh dừng/khởi động lại môi trường:**
- Dừng app: đóng các cửa sổ `openerp-backend`, `openerp-web`, `openerp-mobile` (hoặc `taskkill` theo PID).
- Dừng hạ tầng: `docker compose down`.
- Khởi động lại: xem `Makefile` (`make infra-mail`, `make backend`, `make web`, `make mobile`).

> **Lưu ý Java 25**: backend dev mode cần biến `JAVA_TOOL_OPTIONS=-Dnet.bytebuddy.experimental=true` (đã set khi khởi chạy). Nếu chạy lại thủ công, thêm biến này trước `mvn quarkus:dev`.

---

## 2. Chuẩn Bị Trước Khi Test

1. Mở sẵn 3 tab: Web `http://localhost:4200`, Mailpit `http://localhost:8025`, Mobile `http://localhost:8100`.
2. Cài sẵn ứng dụng Authenticator (Google/Microsoft) trên điện thoại để test 2FA.
3. Mở DevTools Console của trình duyệt để kiểm tra **không có lỗi console** (điều kiện DoD).
4. Không cần tài khoản seed; QA tự đăng ký mới. Email test dùng hậu tố bất kỳ, ví dụ `qa01@example.com`.
5. Lưu ảnh chụp màn hình minh chứng vào `docs/sprints/sprint_01_core_iam/08_testing/assets/` (tự tạo thư mục khi lưu).

---

## 3. Kịch Bản Test Bắt Buộc (Theo `test_plan.md`)

### A. Đăng ký cá nhân + Xác thực email + Personal Workspace (TC-01, TC-12)
1. Web → "Đăng ký cá nhân" → nhập Họ tên, Email mới, Mật khẩu ≥ 8 ký tự → Đăng ký.
2. **Kỳ vọng**: Chuyển sang bước nhập OTP; Mailpit có email "[Open-ERP] Mã xác thực kích hoạt tài khoản" chứa mã 6 số.
3. Nhập OTP → **Kỳ vọng**: xác thực thành công, tài khoản `ACTIVE`, tự động có Personal Workspace.
4. Thử nhập OTP sai → **Kỳ vọng**: báo lỗi i18n rõ ràng, không crash.
5. Bấm "Gửi lại mã" ngay sau đó → **Kỳ vọng**: nút bị chặn 60 giây (đếm ngược), sau đó gửi lại được.

### B. Đăng ký doanh nghiệp (TC-02)
1. Web → "Đăng ký doanh nghiệp" → nhập thông tin Admin + Công ty (slug duy nhất, ví dụ `qa-corp-01`).
2. **Kỳ vọng**: Tạo thành công; Mailpit có email chào mừng doanh nghiệp kèm tên/slug workspace.
3. Đăng ký lại cùng slug → **Kỳ vọng**: lỗi "slug đã được sử dụng"; đăng ký với email đã tồn tại → lỗi email đã tồn tại.

### C. Đăng nhập & Brute-force (TC-03)
1. Đăng nhập đúng → **Kỳ vọng**: vào Dashboard, TopBar hiển thị tên + tenant.
2. Đăng xuất, nhập sai mật khẩu 5 lần → **Kỳ vọng**: lần thứ 6 báo tài khoản bị khóa kèm số giây còn lại.
3. (Kiểm tra nhanh) chờ hết khóa hoặc dùng tài khoản khác để tiếp tục.

### D. Quên mật khẩu (TC-04)
1. Web → "Quên mật khẩu" → nhập email đã đăng ký.
2. **Kỳ vọng**: Mailpit nhận email đặt lại mật khẩu; bấm link → mở trang Reset Password trên Web.
3. Đặt mật khẩu mới → đăng nhập lại bằng mật khẩu mới → **Kỳ vọng**: thành công; các phiên cũ bị thu hồi.
4. Nhập email không tồn tại → **Kỳ vọng**: vẫn hiển thị thông báo chung (không lộ email tồn tại).

### E. Xác thực 2FA - Bật / Đăng nhập / Backup code / Tắt (TC-05, TC-06, TC-07, TC-10)
1. Dashboard → Avatar → Drawer "Quản lý tài khoản" → Tab "Bảo mật" → "Bật 2FA".
2. **Kỳ vọng**: Stacked Drawer mở, hiển thị **mã QR thật** + Secret Key + nút "Sao chép"; **chưa** hiển thị backup codes.
3. Quét QR bằng Authenticator → nhập mã 6 số → Xác nhận.
4. **Kỳ vọng**: 2FA bật thành công; hiển thị **8 mã dự phòng** kèm "Sao chép toàn bộ" và "Tải file (.txt)".
5. Đăng xuất → đăng nhập lại → **Kỳ vọng**: yêu cầu nhập mã 2FA; nhập mã đúng → vào Dashboard.
6. Nhập sai mã 2FA 3 lần → **Kỳ vọng**: lần thứ 3 báo "sai quá 3 lần", phiên xác thực tạm bị hủy, phải đăng nhập lại từ đầu.
7. Đăng nhập lại → chọn "Dùng mã khôi phục" → nhập 1 backup code → **Kỳ vọng**: đăng nhập thành công; mã đó không dùng lại được.
8. Tab Bảo mật → "Tắt 2FA" → nhập mật khẩu hiện tại + mã OTP (hoặc backup code) → **Kỳ vọng**: tắt thành công; Mailpit nhận email cảnh báo bảo mật.

### F. Quản lý tài khoản (TC-08, TC-09, TC-17)
> **Kiểm tra URL bắt buộc**: mở "Quản lý tài khoản" → URL phải là `/account/detail`; tab "Bảo mật & 2FA" → `/account/security`; "Bật 2FA" → `/account/security/2fa/setup`; tab "Phiên đăng nhập" → `/account/sessions`. Nhấn F5 tại mỗi URL phải giữ nguyên đúng màn hình/tab (không quay về dashboard).
1. Tab "Hồ sơ": sửa Họ tên/SĐT → Lưu → **Kỳ vọng**: lưu thành công, TopBar cập nhật tên mới.
2. Đổi mật khẩu (đúng mật khẩu cũ) → **Kỳ vọng**: thành công; checkbox "đăng xuất thiết bị khác" hoạt động.
3. Tab "Phiên đăng nhập": mở 2 trình duyệt/2 profile đăng nhập cùng tài khoản → **Kỳ vọng**: thấy 2 phiên kèm thiết bị/IP/thời gian, phiên hiện tại có nhãn.
4. Bấm "Đăng xuất thiết bị này" ở phiên kia → **Kỳ vọng**: phiên đó biến mất; trình duyệt kia bị đẩy về trang đăng nhập khi thao tác tiếp.
5. Bấm "Đăng xuất tất cả thiết bị khác" → **Kỳ vọng**: chỉ giữ phiên hiện tại.

### G. Refresh & Logout Token (TC-11)
1. Đăng nhập → mở DevTools Network, chờ/ép access token hết hạn (15 phút) hoặc xóa token trong localStorage rồi thao tác.
2. **Kỳ vọng**: interceptor tự gọi `/auth/refresh` và request được retry, người dùng không bị đăng xuất.
3. Đăng xuất → thao tác lại bằng token cũ (nếu còn) → **Kỳ vọng**: bị từ chối 401 và điều hướng về `/login`.

### H. UI/UX & i18n (TC-09)
1. Kiểm tra toàn bộ thao tác diễn ra trong **Drawer trượt phải** hoặc trang, **không có popup modal chặn màn hình**.
2. Chuyển đổi ngôn ngữ VI/EN → **Kỳ vọng**: toàn bộ nhãn, thông báo đổi ngôn ngữ; không còn chuỗi hardcode.
3. Kiểm tra font nhỏ gọn (`text-xs`), viền vuông (`rounded-none`), không khoảng trắng thừa.
4. **Kỳ vọng**: Console không có lỗi đỏ; Network không có request 4xx/5xx ngoài các case test âm.

### I. Mobile Ionic 8 (http://localhost:8100)
1. Mở DevTools → chế độ thiết bị (iPhone/Pixel).
2. Thực hiện lại luồng: Đăng ký cá nhân + OTP → Đăng nhập → Dashboard → Tài khoản → Bật 2FA (ưu tiên nút "Sao chép mã bí mật") → Phiên đăng nhập.
3. **Kỳ vọng**: điều hướng dạng trang trượt (không drawer xếp chồng), thao tác mượt, không lỗi console.

### J. Routing (URL) & Dark Mode (TC-17, TC-18)
1. **Routing**: thực hiện đổi tab/đóng drawer/setup 2FA và quan sát thanh địa chỉ theo bảng URL ở mục F; deep-link trực tiếp các URL khi đã đăng nhập; F5 tại từng URL.
2. **Guard**: mở tab ẩn danh, truy cập `/account/security` hoặc `/dashboard` → **Kỳ vọng**: chuyển về `/login?returnUrl=...`.
3. **Dark Mode**: bật dark mode hệ điều hành → duyệt Login, Đăng ký, Dashboard, cả 3 tab tài khoản, Setup/Tắt 2FA, Quên/Đặt lại mật khẩu → **Kỳ vọng**: nền tối đồng bộ, chữ đủ tương phản, alert/badge/select/drawer không còn vùng sáng chói.
4. Mobile: mở http://localhost:8100 ở chế độ thiết bị, lặp lại kiểm tra URL `/account/detail|security|sessions` + dark mode.

---

## 4. Checklist Xác Nhận Các BUG Đã Sửa (Regression)

| Mã | Cần xác nhận trên trình duyệt |
| :--- | :--- |
| BUG-02 | Đăng nhập với tài khoản bật 2FA hoạt động (endpoint `/2fa/verify-login`) |
| BUG-03 | Nút tái tạo mã dự phòng hoạt động, hiển thị 8 mã mới |
| BUG-04 | "Đăng xuất tất cả thiết bị khác" hoạt động |
| BUG-05 | Form đăng ký cá nhân/doanh nghiệp, xác thực OTP submit thành công |
| BUG-06 | Workspace Picker hiển thị đúng tên/slug tenant khi tài khoản thuộc nhiều tenant |
| BUG-07 | Drawer Setup 2FA hiển thị QR + Secret + copy; không trống |
| BUG-15 | Backup codes chỉ hiển thị sau khi enable |
| BUG-16 | Web gọi API đúng `localhost:8088` (dev) |
| BUG-17 | Truy cập `/dashboard` khi chưa đăng nhập bị chuyển về `/login` |
| BUG-18 | Không còn nhãn hiển thị dạng `KEY_I18N`, chuyển VI/EN đầy đủ |
| BUG-19 | Không còn hộp thoại `alert/prompt/confirm` native |
| BUG-35 | Drawer overlay đúng cạnh phải, có backdrop + shadow (Tailwind đã quét shared) |
| BUG-36 | Dark mode đồng nhất trên toàn bộ màn hình (không còn vùng sáng chói/lệch màu) |
| BUG-37 | URL đổi theo thao tác, F5 giữ trạng thái, deep-link `/account/security`, `/verify-email`, `/auth/2fa`, `/select-tenant` hoạt động |

---

## 5. Lưu Ý & Item Đã Biết (Không tính là FAIL)

- **BUG-34 (Medium - deferred Sprint 02)**: request không có token trả 401 với body rỗng (không có `code=UNAUTHORIZED`); Web vẫn xử lý đúng nhờ interceptor.
- **BUG-24 → BUG-31 (Medium)**: xem danh sách hoãn trong [QA_RETEST_SPRINT_01.md](../09_review/QA_RETEST_SPRINT_01.md).
- Tài khoản smoke test `qa.smoke.*@example.com` đã tạo trong lúc kiểm tra hạ tầng - QA có thể bỏ qua.
- Backend dev mode có live-reload: sửa code Java sẽ tự build lại (không cần khởi động lại thủ công).

---

## 6. Ghi Nhận Kết Quả

Sau khi test xong, QA cập nhật:
1. Cột "Kết Quả" trong `test_plan.md` (TC-01 → TC-16).
2. Mục 6 "Xác Nhận Khắc Phục" trong từng file `BUG-01 → BUG-23` (chuyển `In Review` → `Done` nếu đạt).
3. Biên bản tổng hợp kết quả vào `08_testing/test_reports/` (tạo file `test_report_sprint_01.md` kèm ảnh trong `assets/`).
