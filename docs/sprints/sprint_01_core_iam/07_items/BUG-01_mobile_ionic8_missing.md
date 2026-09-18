# [BUG-01] Chưa Triển Khai Ứng Dụng Mobile Ionic 8

- **Mã Lỗi**: BUG-01
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Chưa triển khai ứng dụng Mobile Ionic 8: thư mục `src/frontend/mobile` không tồn tại, không có file cấu hình `ionic.config.json`.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Mobile App (Ionic 8 + Angular) — toàn bộ các tính năng Core IAM.
- **File liên quan**: `src/frontend/mobile/` (không tồn tại), `ionic.config.json` (không tồn tại).
- **Tài liệu đối chiếu**: FEAT-01 TASK-104, FEAT-03 TASK-115, FEAT-04 TASK-121, FEAT-05 TASK-127, FEAT-06 TASK-132, ANL-01 mục 4 (ma trận Desktop/Mobile), CONF-01.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Kiểm tra cấu trúc thư mục `src/frontend/`.
2. Tìm kiếm file cấu hình `ionic.config.json` trong toàn bộ mã nguồn.
3. Thử khởi chạy ứng dụng mobile theo Makefile (`make mobile`).

## 3. Kết Quả Thực Tế (Actual Result)
- Thư mục `src/frontend/mobile` không tồn tại; không có `ionic.config.json`.
- Không thể khởi chạy `make mobile` vì không có dự án Ionic.
- Toàn bộ màn hình đăng ký/đăng nhập/OTP/2FA/account không tồn tại trên nền tảng Mobile.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Theo ANL-01 mục 4 (ma trận Desktop/Mobile) và CONF-01, hệ thống phải có ứng dụng Mobile Ionic 8 + Angular (dùng chung thư viện UI `src/frontend/shared/`) với đầy đủ các màn hình đăng ký/đăng nhập/OTP/2FA/account tương ứng TASK-104, TASK-115, TASK-121, TASK-127, TASK-132.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer đã sửa xong.
- [ ] QA đã re-test và xác nhận không còn lỗi.
- [ ] Không gây lỗi phát sinh (Regression test pass).
