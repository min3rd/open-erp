# [BUG-21] Backend Hardcode IP "127.0.0.1" Cho Mọi Phiên Đăng Nhập

- **Mã Lỗi**: BUG-21
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Backend hardcode `String ipAddress = "127.0.0.1";` tại 3 điểm xử lý đăng nhập thay vì lấy IP thật của client, khiến Session Monitor luôn hiển thị sai địa chỉ IP cho mọi phiên.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: FEAT-06 (Giám sát phiên đăng nhập - Active Sessions Monitor), FEAT-03
- **Tệp liên quan**: `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/resource/AuthResource.java`
  - Dòng 65: `String ipAddress = "127.0.0.1";` trước `authService.login(req, device, ipAddress)`
  - Dòng 90: `String ipAddress = "127.0.0.1";` trước `authService.selectTenant(...)`
  - Dòng 103: `String ipAddress = "127.0.0.1";` trước `twoFactorService.verifyLogin2Fa(...)`
- **Tài liệu đối chiếu**: [FEAT-06 - FEAT-06_account_management.md](FEAT-06_account_management.md) AC6 (hiển thị chi tiết Thiết bị, Địa chỉ IP, thời điểm đăng nhập gần nhất); [08_testing/test_plan.md](../08_testing/test_plan.md) TC-08 ("Hiển thị đúng IP/Browser").

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Khởi chạy backend + PostgreSQL + Redis, đăng nhập từ trình duyệt trên máy local (IP `127.0.0.1`).
2. Đăng nhập thêm từ một máy/thiết bị khác trong mạng LAN (hoặc gọi API qua `X-Forwarded-For` khác).
3. Mở Drawer Quản lý tài khoản → tab Phiên đăng nhập, quan sát cột IP của tất cả phiên.
4. Gọi trực tiếp API `/api/v1/auth/login` kèm header `X-Forwarded-For: 203.0.113.10` và kiểm tra dữ liệu phiên trong Redis/API sessions.

## 3. Kết Quả Thực Tế (Actual Result)
- Mọi phiên đăng nhập đều ghi nhận IP `127.0.0.1` bất kể client đến từ đâu.
- Session Monitor hiển thị sai thông tin, người dùng không thể phát hiện thiết bị lạ theo IP; TC-08 không đạt yêu cầu "hiển thị đúng IP".

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Lấy IP thật của client từ request: ưu tiên `X-Forwarded-For` (khi qua reverse proxy) và fallback về remote address của kết nối.
- Truyền IP thật vào các luồng `login`, `select-tenant`, `2fa/verify-login` để lưu đúng vào phiên trong Redis và trả về `UserSessionResponse`.
- Cấu hình danh sách proxy tin cậy (`quarkus.http.proxy.*`) để tránh giả mạo header.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
- Không có

## 6. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer đã sửa xong.
- [ ] QA đã re-test và xác nhận không còn lỗi.
- [ ] Không gây lỗi phát sinh (Regression test pass).
