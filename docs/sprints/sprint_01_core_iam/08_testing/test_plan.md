# [08] Kế Hoạch Kiểm Thử Chất Lượng: Sprint 01 - Core IAM

- **Mã Tài Liệu**: TEST-01
- **Thuộc Sprint**: Sprint 01 - Core Identity, Access & Account Management
- **Phụ Trách**: QA/QC Agent
- **Trạng Thái**: [ ] In Progress

---

## 1. Chiến Lược Kiểm Thử (Testing Strategy)

Tuân thủ nghiêm ngặt **Chính Sách Kiểm Thử Thực Dụng (Pragmatic Testing Policy)**:
1. **Backend Quarkus Java**:
   - Viết Automated Unit Tests & Integration Tests (JUnit 5 + RestAssured + Panache Mock).
   - Bao phủ 100% logic: Hash mật khẩu Argon2id, brute-force locking, sinh/xác thực mã TOTP, logic bảo mật kép khi tắt 2FA, session revocation trong Redis, và cô lập dữ liệu đa Tenant (Tenant Data Isolation).
2. **Frontend Angular 22 & Ionic 8**:
   - **TUYỆT ĐỐI KHÔNG VIẾT Unit Test** (không tạo file `.spec.ts`).
   - **Bắt buộc thực hiện Kiểm Thử Thủ Công Trên Trình Duyệt (Browser Manual Testing)**:
     - Mở trực tiếp trên Web Browser thật để thao tác các luồng: Đăng ký, Đăng nhập, Quên mật khẩu, Mở Drawer Quản lý tài khoản, Bật 2FA (quét QR, nhập mã), Tắt 2FA (nhập mật khẩu + OTP), Đăng xuất từ xa.
     - Kiểm tra trực quan: Mật độ thông tin cao (`text-xs`), viền vuông (`rounded-none`), hiệu ứng trượt Drawer xếp chồng mượt mà, responsive không vỡ layout, không có lỗi console.

---

## 2. Ma Trận Kịch Bản Kiểm Thử (Test Matrix)

| ID | Tính Năng | Loại Test | Kịch Bản Kiểm Thử | Kết Quả |
| :---: | :--- | :---: | :--- | :---: |
| **TC-01** | Đăng ký cá nhân | Backend | Đăng ký thành công, hash mật khẩu BCrypt/Argon2, gửi OTP kích hoạt | [x] **PASS** (AuthServiceTest) |
| **TC-02** | Đăng ký doanh nghiệp | Backend | Tạo Tenant mới, tạo user với role `TENANT_ADMIN`, cô lập CSDL | [x] **PASS** (AuthServiceTest) |
| **TC-03** | Đăng nhập & Brute-force | Backend | Nhập sai mật khẩu 5 lần $\rightarrow$ khóa tài khoản 15 phút (423 Locked) | [x] **PASS** (AuthServiceTest) |
| **TC-04** | Quên mật khẩu | Backend | Sinh token khôi phục SHA-256 hạn 15 phút, thu hồi session cũ | [x] **PASS** (AuthServiceTest) |
| **TC-05** | Xác thực 2FA | Backend | Xác thực TOTP 6 số, độ lệch thời gian $\pm 30s$, dùng 1 backup code | [x] **PASS** (TwoFactorServiceTest) |
| **TC-06** | Đăng ký 2FA trong Drawer | Browser QA | Mở Stacked Drawer, quét QR, nhập OTP 6 số kích hoạt, nhận 8 backup codes | [x] **PASS** (Frontend Angular) |
| **TC-07** | Tắt 2FA bảo mật kép | Browser QA & Backend | Nhập đúng mật khẩu + OTP để tắt; nhập sai thì báo lỗi và từ chối | [x] **PASS** (TwoFactorServiceTest & Frontend) |
| **TC-08** | Giám sát & Hủy Session | Browser QA & Backend | Hiển thị đúng IP/Browser, bấm đăng xuất thì phiên làm việc bị xóa | [x] **PASS** (AccountServiceTest & Frontend) |
| **TC-09** | Giao diện Anti-Modal | Browser QA | Kiểm tra toàn bộ thao tác trong Drawer và Stacked Drawer, không có Modal pop-up | [x] **PASS** (Angular Drawers) |
| **TC-10** | Khóa xác thực 2FA | Backend | Nhập sai mã 2FA 3 lần liên tiếp → hủy token, trả `AUTH_2FA_ATTEMPTS_EXCEEDED` | [x] **PASS** (TwoFactorServiceTest) |
| **TC-11** | Refresh & Logout Token | Backend | Refresh token hợp lệ cấp Access Token mới; Logout blacklist token | [x] **PASS** (AuthServiceTest) |
| **TC-12** | Personal Workspace | Backend | Xác thực email cá nhân thành công → tự động tạo `tenants.type = 'PERSONAL'` + liên kết `TENANT_ADMIN` | [x] **PASS** (AuthServiceTest) |
