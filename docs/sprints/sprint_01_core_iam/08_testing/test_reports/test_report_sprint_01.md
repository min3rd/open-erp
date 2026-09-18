# [TR-01] Báo Cáo Kiểm Thử Sprint 01 - Core IAM

- **Mã Báo Cáo**: TR-01
- **Thuộc Sprint**: Sprint 01 - Core Identity, Access & Account Management
- **Người Thực Hiện**: QA/QC Agent
- **Ngày**: 2026-09-18
- **Kết Luận**: **ĐẠT yêu cầu tự động - chờ QA Browser Manual Testing ký xác nhận cuối cùng**

---

## 1. Tổng Hợp Bằng Chứng Kiểm Thử

| Loại | Lệnh / Công Cụ | Kết Quả | Ghi Chú |
| :--- | :--- | :--- | :--- |
| Backend Unit + API Test | `mvn test` (`src/backend`) | **36/36 PASS** | PostgreSQL thật `openerp_test` + Redis `/1`, không H2 |
| Frontend Web Build | `npm run build` (`src/frontend/web`) | **PASS** | Production |
| Mobile Build | `npm run build` (`src/frontend/mobile`) | **PASS** | Production |
| HTTP Smoke | curl 8088/4200/8100/8025 | **200** | Cả 4 dịch vụ |
| Browser E2E - Auth/Routing | puppeteer (Chrome headless) | **7/7 PASS** | Deep-link, F5 giữ trạng thái, Escape stacked drawer, guard |
| Browser E2E - Login + token cũ | puppeteer | **3/3 PASS** | Hiển thị đúng i18n, không còn "Internal Server Error" |
| Browser Verify - Tồn đọng Sprint 01 | puppeteer (Chrome headless) | **6/6 PASS** | Login không checkbox điều khoản; form doanh nghiệp 2 bước + live slug check (báo trùng/còn trống); login tài khoản demo bật 2FA → `/auth/2fa`; console 0 lỗi |
| Browser E2E - Mobile | puppeteer (viewport 390x844) | **18/18 PASS** | Đăng ký → OTP → login → dashboard → account → 2FA |
| Ảnh minh chứng | `docs/06_user_guides/assets/sprint_01_core_iam/` | **20 ảnh** | Light/Dark + Web/Mobile |
| Báo cáo chi tiết | [QA_RETEST_SPRINT_01.md](../../09_review/QA_RETEST_SPRINT_01.md) | REV-03 | Lịch sử re-test |

## 2. Kết Quả Theo Test Case (`test_plan.md`)

| ID | Kịch Bản | Kết Quả |
| :---: | :--- | :---: |
| TC-01 | Đăng ký cá nhân + hash Argon2id + OTP | PASS (service + API test) |
| TC-02 | Đăng ký doanh nghiệp + role TENANT_ADMIN | PASS |
| TC-03 | Đăng nhập + brute-force khóa 15 phút | PASS |
| TC-04 | Quên mật khẩu (token SHA-256, revoke session) | PASS |
| TC-05 | TOTP 6 số, drift ±30s, backup code | PASS |
| TC-06 | Đăng ký 2FA trong Drawer (QR + backup codes) | PASS (browser: ảnh 09/10) |
| TC-07 | Tắt 2FA bảo mật kép | PASS (browser: ảnh 20) |
| TC-08 | Giám sát & hủy phiên | PASS (ảnh 11) |
| TC-09 | Giao diện Anti-Modal | PASS (không còn alert/prompt/confirm, browser audit) |
| TC-10 | Khóa xác thực 2FA sau 3 lần sai | PASS (API test) |
| TC-11 | Refresh & Logout token | PASS (API test) |
| TC-12 | Personal Workspace | PASS |
| TC-13 | Resend verification rate limit 60s | PASS (API test) |
| TC-14 | Tenant data isolation + session ownership | PASS (API test, cross-user 404) |
| TC-15 | Token mang session của người khác | PASS (API test) |
| TC-16 | 4xx giữ đúng HTTP status + envelope (415) | PASS (API test) |
| TC-17 | Routing URL-driven + F5 + deep-link + guard | PASS (browser 7/7) |
| TC-18 | Dark mode đồng nhất | PASS (template audit + ảnh 14/15) |
| TC-19 | Drawer overlay đúng (Tailwind quét shared) | PASS (CSS class + browser) |

## 3. Kiểm Thử Thủ Công Trên Trình Duyệt (Browser Manual Testing)

- Hướng dẫn thao tác từng bước: [manual_test_guide.md](../manual_test_guide.md) (TEST-02).
- Ảnh chụp toàn bộ luồng (Web light/dark + Mobile): `docs/06_user_guides/assets/sprint_01_core_iam/`.
- **Còn lại**: QA/QC (người dùng) xác nhận trực quan trên máy thật theo mục 3 & 4 của TEST-02, sau đó chuyển 13 item `In Review` sang `Done`.

## 4. Tồn Đọng Sau Kiểm Thử

- **Không còn item Critical/High/Medium/Low mở** — toàn bộ BUG-24 → BUG-31, BUG-34, BUG-42 → BUG-45 đã xử lý trong đợt sửa 2026-09-18 (Done).
- **BUG-47 đã xử lý (hậu kiểm API contract 4 khuôn mẫu)**: validation errors `[{field, code, params}]` field snake_case, malformed JSON → `VALIDATION_MALFORMED_JSON`, sessions bọc `data.items`, envelope luôn có `data` (null khi không có dữ liệu), duplicate email kèm `errors[].code`. Bằng chứng curl runtime (backend 8088): validation envelope + `errors[{password/VALIDATION_SIZE, full_name/VALIDATION_REQUIRED, email/VALIDATION_EMAIL}]`; malformed JSON `errors[{field:null, code:VALIDATION_MALFORMED_JSON}]`; `GET /account/sessions` → `data:{"items":[...]}`; `POST /auth/logout` → `"data":null`; duplicate email → `code:AUTH_EMAIL_ALREADY_EXISTS` + `errors[{field:"email", code:VALIDATION_EMAIL_DUPLICATE}]`; check-slug invalid → `errors[{field:"slug", code:VALIDATION_SLUG_INVALID}]`; `mvn test` 34/34 PASS.
- **BUG-48 đã xử lý (enforce độ phức tạp mật khẩu)**: thêm `@Pattern` (hoa+thường+số+ký tự đặc biệt) cho `PersonalRegisterRequest.password`, `BusinessRegisterRequest.AdminInfo.password`, `ResetPasswordRequest.newPassword`; `ValidationExceptionMapper` ưu tiên message dạng code `^VALIDATION_[A-Z_]+$`; i18n `VALIDATION_PASSWORD_TOO_WEAK` đủ Web/Mobile (vi/en). Bằng chứng: `mvn test` **36/36 PASS** (thêm 2 test register/reset weak password); curl `POST /auth/register/personal` password `password123` → 400 `VALIDATION_FAILED` + `errors[{field:"password", code:"VALIDATION_PASSWORD_TOO_WEAK"}]`; `POST /auth/reset-password` `new_password` yếu → 400 cùng code; mật khẩu mạnh vẫn 201.
- Còn lại duy nhất: **QA Browser Manual Testing ký xác nhận cuối cùng** (Web + Mobile) để chuyển các item `In Review` sang `Done` và tiến hành đóng Sprint 01.
