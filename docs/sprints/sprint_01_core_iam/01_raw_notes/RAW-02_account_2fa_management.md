# [RAW-02] Ghi Chú Yêu Cầu Bổ Sung: Đăng Ký & Xóa/Tắt 2FA Trong Quản Lý Tài Khoản

- **Ngày tiếp nhận**: 2026-09-18
- **Người cung cấp**: Khách hàng (User)
- **Người ghi nhận**: BA Agent
- **Phương thức tiếp nhận**: Trao đổi trực tiếp / Phản hồi yêu cầu
- **Phân hệ liên quan**: Quản lý tài khoản (Account Management - FEAT-06)

---

## 1. Nội Dung Yêu Cầu Nguyên Bản Từ Khách Hàng

Khách hàng phản hồi yêu cầu bổ sung cho tính năng Quản lý tài khoản:
> *"ở feat quản lý tài khoản còn mục đăng ký/xóa 2fa nữa nhé"*

---

## 2. Phân Tích Ý Định & Bối Cảnh Nghiệp Vụ
1. **Nhu cầu cốt lõi**:
   - Bên cạnh tính năng xác thực 2FA khi đăng nhập (FEAT-05), người dùng cần có một trung tâm thao tác trực tiếp ngay trong giao diện Quản lý tài khoản (FEAT-06) để:
     - **Đăng ký / Bật 2FA (Setup & Enable TOTP)** khi tài khoản chưa bật.
     - **Xóa / Tắt 2FA (Disable/Remove TOTP)** khi không còn nhu cầu hoặc muốn thay đổi thiết bị xác thực.
     - **Quản lý mã dự phòng (Backup Codes)**: Xem số mã còn lại, tạo lại bộ mã mới.
2. **Ràng buộc an toàn & bảo mật (Security Guardrail)**:
   - Thao tác xóa/hủy 2FA là hành động có rủi ro bảo mật cao, tuyệt đối không cho phép bấm tắt một chạm mà **bắt buộc phải xác thực lại mật khẩu hiện tại và mã OTP 6 số hiện tại** (hoặc Backup Code) để chống tấn công chiếm quyền phiên đăng nhập (Session Hijacking).
   - Hệ thống gửi email cảnh báo bảo mật tức thì khi 2FA bị vô hiệu hóa.
3. **Quy chuẩn UI/UX**:
   - Thao tác được tích hợp trong Tab "Bảo Mật" của Drawer Quản lý tài khoản (`AccountDrawerComponent`).
   - Sử dụng **Stacked Drawer (Drawer phụ trượt xếp chồng từ cạnh phải)** để quét QR / nhập mã kích hoạt hoặc xác nhận tắt 2FA, đảm bảo **Anti-Modal (Không mở modal pop-up)**.
