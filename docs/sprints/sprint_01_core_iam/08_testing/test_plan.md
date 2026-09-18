# [08] Kế Hoạch Kiểm Thử Chất Lượng: Sprint 01 - Core IAM

- **Mã Tài Liệu**: TEST-01
- **Thuộc Sprint**: Sprint 01 - Core Identity, Access & Account Management
- **Phụ Trách**: QA/QC Agent
- **Trạng Thái**: [x] Hoàn thành - Khách hàng nghiệm thu (2026-09-18)

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
| **TC-01** | Đăng ký cá nhân | Backend | Đăng ký thành công, hash mật khẩu Argon2id, gửi OTP kích hoạt | [x] **PASS** (AuthServiceTest) |
| **TC-02** | Đăng ký doanh nghiệp | Backend | Tạo Tenant mới, tạo user với role `TENANT_ADMIN`, cô lập CSDL | [x] **PASS** (AuthServiceTest) |
| **TC-03** | Đăng nhập & Brute-force | Backend | Nhập sai mật khẩu 5 lần $\rightarrow$ khóa tài khoản 15 phút (423 Locked) | [x] **PASS** (AuthServiceTest) |
| **TC-04** | Quên mật khẩu | Backend | Sinh token khôi phục SHA-256 hạn 15 phút, thu hồi session cũ | [x] **PASS** (AuthServiceTest) |
| **TC-05** | Xác thực 2FA | Backend | Xác thực TOTP 6 số, độ lệch thời gian $\pm 30s$, dùng 1 backup code | [x] **PASS** (TwoFactorServiceTest) |
| **TC-06** | Đăng ký 2FA trong Drawer | Browser QA | Mở Stacked Drawer, quét QR, nhập OTP 6 số kích hoạt, nhận 8 backup codes | [ ] Chờ Browser Manual Testing (build PASS) |
| **TC-07** | Tắt 2FA bảo mật kép | Browser QA & Backend | Nhập đúng mật khẩu + OTP để tắt; nhập sai thì báo lỗi và từ chối | Backend **PASS**; FE chờ Browser Manual Testing |
| **TC-08** | Giám sát & Hủy Session | Browser QA & Backend | Hiển thị đúng IP/Browser, bấm đăng xuất thì phiên làm việc bị xóa | Backend **PASS**; FE chờ Browser Manual Testing |
| **TC-09** | Giao diện Anti-Modal | Browser QA | Kiểm tra toàn bộ thao tác trong Drawer và Stacked Drawer, không có Modal pop-up | [ ] Chờ Browser Manual Testing (build PASS) |
| **TC-10** | Khóa xác thực 2FA | Backend | Nhập sai mã 2FA 3 lần liên tiếp → hủy token, trả `AUTH_2FA_ATTEMPTS_EXCEEDED` | [x] **PASS** (TwoFactorServiceTest) |
| **TC-11** | Refresh & Logout Token | Backend | Refresh token hợp lệ cấp Access Token mới; Logout blacklist token | [x] **PASS** (AuthServiceTest) |
| **TC-12** | Personal Workspace | Backend | Xác thực email cá nhân thành công → tự động tạo `tenants.type = 'PERSONAL'` + liên kết `TENANT_ADMIN` | [x] **PASS** (AuthServiceTest) |
| **TC-17** | Routing URL-driven | Browser QA | `/account/detail|security|sessions`, `/account/security/2fa/setup`, deep-link, F5 giữ trạng thái, guard chặn `/account/**` | [x] **PASS** (puppeteer 7/7 + Mobile 18/18) |
| **TC-18** | Dark Mode | Browser QA | Duyệt các màn hình chính ở `prefers-color-scheme: dark`, màu sắc đồng nhất | [x] **PASS** (browser audit + template audit) |
| **TC-19** | UI Shared/Tailwind | Browser QA | Drawer overlay đúng cạnh phải, backdrop/shadow đầy đủ (Tailwind quét `shared`) | [x] **PASS** (CSS 34.713 bytes, class `.fixed`/`.shadow-2xl` FOUND) |
| **TC-20** | Multi-tenant chọn workspace | Backend | Đăng nhập tài khoản nhiều tenant → `AUTH_SELECT_TENANT_REQUIRED`; `POST /auth/select-tenant` cấp JWT đúng tenant đã chọn | [x] **PASS** (AuthResourceApiTest) |
| **TC-21** | Backup code single-use | Backend | Backup code chỉ dùng được 1 lần, dùng lại lần 2 bị từ chối | [x] **PASS** (TwoFactorServiceTest) |
| **TC-22** | Tắt 2FA sai code | Backend | Nhập sai mật khẩu/OTP khi tắt 2FA → `ACCOUNT_2FA_INVALID_PASSWORD_OR_CODE` | [x] **PASS** (TwoFactorServiceTest) |
| **TC-23** | Change-password thu hồi phiên khác | Backend | Đổi mật khẩu → thu hồi toàn bộ session khác, giữ session hiện tại | [x] **PASS** (AccountServiceTest) |
| **TC-24** | Brute-force hết hạn khóa | Backend | Sau 15 phút khóa, tài khoản tự mở khóa và đăng nhập lại được | [x] **PASS** (AuthServiceTest) |
| **TC-25** | Check-slug API | Backend & Browser QA | `GET /auth/check-slug` trả `AVAILABLE`/`DUPLICATE` đúng contract; 400 khi slug invalid/reserved | [x] **PASS** (AuthResourceApiTest + browser) |
| **TC-26** | 401 envelope | Backend | Request không token/token rác → 401 envelope `code=UNAUTHORIZED` | [x] **PASS** (AuthResourceApiTest + curl) |

---

## 3. Kết Quả Re-test Tự Động Sau Khi Xử Lý BUG (2026-09-18)

Báo cáo đầy đủ: [QA_RETEST_SPRINT_01.md](../09_review/QA_RETEST_SPRINT_01.md) (REV-03).

| Loại Test | File / Lệnh | Số Test | Kết Quả |
| :--- | :--- | :---: | :---: |
| Service Test | `AuthServiceTest` (8), `AccountServiceTest` (3), `TwoFactorServiceTest` (3) | 14 | **PASS** |
| Registry Test | `EntityRegistryServiceTest` (7 entity `core-iam` đăng ký) | 1 | **PASS** |
| API Test (RestAssured) | `AuthResourceApiTest` (register/verify/login/select-tenant/profile/refresh/logout/2FA lockout/resend/415/check-slug/401 envelope) | 12 | **PASS** |
| API Test (RestAssured) | `AccountTenantIsolationApiTest` (tenant isolation + session ownership) | 3 | **PASS** |
| Frontend Web | `npm run build` (production) | - | **PASS** |
| Mobile Ionic 8 | `npm run build` + `ionic serve` | - | **PASS** |
| Browser E2E | puppeteer (Chrome headless) — login không checkbox, form doanh nghiệp 2 bước, live slug check, 401, 2FA redirect | 6 | **PASS 6/6** |
| **Tổng Backend** | `mvn test` (PostgreSQL + Redis thật, không H2) | **30** | **PASS 30/30** |

Ghi chú:
- TC-13 (resend rate limit), TC-14/TC-14b/TC-15 (tenant isolation), TC-16 (4xx envelope), TC-20 → TC-26 là các kịch bản API bổ sung, đã pass.
- BUG-34 (`401` body rỗng từ tầng HTTP Security) đã xử lý: mọi 401 trả envelope `code=UNAUTHORIZED` (TC-26 PASS, curl + test).
- Còn thiếu: **QA Browser Manual Testing** do QA/QC ký xác nhận cuối cùng cho Web (Drawer/QR/i18n/Anti-Modal, không lỗi console) và Mobile theo DoD.
