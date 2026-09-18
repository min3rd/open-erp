# [REV-03] Báo Cáo QA Re-test Sau Khi Xử Lý BUG Sprint 01

- **Mã Báo Cáo**: REV-03
- **Thuộc Sprint**: Sprint 01 - Core Identity, Access & Account Management
- **Người Thực Hiện**: QA/QC Agent
- **Ngày Thực Hiện**: 2026-09-18
- **Phạm Vi**: Re-test các BUG `Critical`/`High` (BUG-01 → BUG-23) + các lỗi phát sinh khi QA (BUG-32 → BUG-34)
- **Trạng Thái**: [x] Đã re-test tự động - **CHỜ QA BROWSER MANUAL TESTING để chuyển `Done`**

---

## 1. Bằng Chứng Re-test Tự Động (Automated Verification)

| Hạng Mục | Lệnh | Kết Quả |
| :--- | :--- | :--- |
| Backend Unit + API Test | `mvn test` tại `src/backend` | **PASS 22/22**, BUILD SUCCESS (PostgreSQL thật + Redis thật, không H2) |
| Frontend Web Build | `npm run build` tại `src/frontend/web` | **PASS** (production) |
| Mobile Build | `npm install` + `npm run build` + `ionic serve` tại `src/frontend/mobile` | **PASS** (bundle 677.29 kB, serve HTTP 200) |

Chi tiết test backend (5 test class):
- `AccountTenantIsolationApiTest` - 3 test API (tenant isolation, session ownership) - **PASS**
- `AuthResourceApiTest` - 6 test API (register/verify/login/profile/refresh/logout/2FA lockout/resend rate limit/415 envelope) - **PASS**
- `AccountServiceTest` - 3 test - **PASS**
- `AuthServiceTest` - 7 test - **PASS**
- `TwoFactorServiceTest` - 3 test - **PASS**

---

## 2. Kết Quả Xử Lý BUG Critical/High (BUG-01 → BUG-23)

| Mã | Nội Dung | Kết Quả |
| :--- | :--- | :--- |
| BUG-01 | Mobile Ionic 8 | ✅ Đã tạo app đầy đủ màn hình, build + serve PASS - **In Review** (chờ test thiết bị) |
| BUG-02 → BUG-07 | Sai endpoint/payload/model, Setup 2FA Drawer, QR | ✅ Đã sửa, Web build PASS - **In Review** (chờ browser test) |
| BUG-08 | Argon2id thay BCrypt | ✅ Đã sửa (argon2-jvm) - **Done** |
| BUG-09 | Mã hóa TOTP secret AES-256-GCM | ✅ Đã sửa (CryptoService) - **Done** |
| BUG-10 | Redis session/brute-force | ✅ Đã sửa (quarkus-redis-client) - **Done** |
| BUG-11 | Cửa sổ brute-force 10 phút | ✅ Đã sửa + test TC-04 - **Done** |
| BUG-12 | Endpoint refresh/logout/resend-verification | ✅ Backend đã sửa + API test PASS; FE gọi API + interceptor - **In Review** |
| BUG-13 | Hash reset token SHA-256, OTP Redis, không log secret | ✅ Đã sửa - **Done** |
| BUG-14 | Khóa 2FA sau 3 lần sai | ✅ Đã sửa + API test `AUTH_2FA_ATTEMPTS_EXCEEDED` - **Done** |
| BUG-15 | Backup Codes chỉ trả ở bước enable | ✅ Backend + Frontend đã sửa - **In Review** (chờ browser test QR/codes) |
| BUG-16 → BUG-19 | Base URL, guard/interceptor, i18n, Anti-Modal | ✅ Đã sửa, Web build PASS, không còn `alert/prompt/confirm` - **In Review** (chờ browser test) |
| BUG-20 | `@Authenticated` | ✅ Đã thêm - **Done** |
| BUG-21 | IP thật cho session | ✅ Đã sửa (X-Forwarded-For / remoteAddress) - **Done** |
| BUG-22 | Email chào mừng doanh nghiệp | ✅ Đã sửa - **Done** |
| BUG-23 | Test coverage RestAssured + tenant isolation | ✅ Đã bổ sung 9 API-level test, 22/22 PASS - **Done** |

---

## 3. Lỗi Phát Sinh Trong Quá Trình QA Và Kết Quả

| Mã | Nội Dung | Mức | Kết Quả |
| :--- | :--- | :--- | :--- |
| BUG-32 | Hủy session chéo người dùng (A hủy được session của B) | High | ✅ Đã sửa `SessionManager.revokeSession` kiểm tra ownership; test TC-14b re-enabled **PASS** - **Done** |
| BUG-33 | `GlobalExceptionMapper` biến lỗi 4xx thành 500 | High | ✅ Đã thêm `WebApplicationExceptionMapper`; test TC-16 (415 envelope) **PASS** - **Done** |
| BUG-34 | 401 từ tầng HTTP Security trả body rỗng | Medium | ⏸ **Deferred** - tầng Quarkus Security chặn trước JAX-RS; cần `HttpAuthenticationMechanism` tùy biến, chuyển Sprint 02 |

---

## 4. Đánh Giá Điều Kiện Đóng Sprint (DoD Gate)

| Điều Kiện | Kết Quả |
| :--- | :--- |
| 100% item `Critical` đạt `Done` | **CHƯA** - 12 backend `Done`, 13 item Web/Mobile `In Review` (chờ Browser Manual Testing) |
| 100% item `High` đạt `Done` | **CHƯA** - BUG-32/33 đã `Done`; BUG-12/15 phần FE chờ browser test |
| Backend test bao phủ logic + tenant isolation (JUnit 5 + RestAssured) | **PASS** - 22/22 test (7 API-level) |
| Không còn lỗi console trên trình duyệt | **CHƯA XÁC NHẬN** - cần QA Browser Manual Testing |
| Tài liệu hướng dẫn sử dụng kèm hình ảnh | **CHƯA CÓ** |
| Biên bản nghiệm thu `sprint_review.md` | **CHƯA ĐÓNG** |

> **KẾT LUẬN**: Toàn bộ `Critical`/`High` đã được xử lý (backend xác nhận bằng automated test; Web/Mobile PASS build). Còn 2 việc trước khi đóng Sprint: **(1)** QA/QC Browser Manual Testing trên Web + thiết bị/mô phỏng Mobile, **(2)** hoàn thiện `docs/06_user_guides/` kèm hình ảnh. Các item `Medium` (BUG-24 → BUG-31, BUG-34) được hoãn sang Sprint 02 kèm lý do.

---

## 5. Danh Sách Hoãn Sang Sprint 02 (Deferred Items)

| Mã | Tiêu Đề | Mức | Lý Do Hoãn |
| :--- | :--- | :--- | :--- |
| BUG-24 | `TenantType` ORGANIZATION vs BUSINESS | Medium | Cần migration đổi dữ liệu + đồng bộ BE/FE/Mobile; không chặn luồng nghiệp vụ |
| BUG-25 | `ResponseKey` enum chưa dùng hết | Medium | Không ảnh hưởng chức năng, cải tiến chuẩn hóa |
| BUG-26 | Entity Registry chưa đăng ký | Medium | Thuộc hạ tầng nền tảng, triển khai cùng Sprint Plugin Registry |
| BUG-27 | JWT issuer hardcode + khóa PEM môi trường | Medium | Cần quy trình secret management cho Staging/Production |
| BUG-28 | FE API envelope mismatch | Medium | FE đang hoạt động; cải tiến khi làm form validation nâng cao |
| BUG-29 | UI state chưa đồng bộ (TopBar, checkbox) | Medium | Không chặn luồng chính |
| BUG-30 | Form doanh nghiệp 1 bước, thiếu live-check slug/resend UI | Medium | Cải tiến UX, có thể gộp Sprint 02 |
| BUG-31 | Schema drift DES-01 (JSONB, index, cột OTP) | Medium | Cần migration mới; không ảnh hưởng runtime hiện tại |
| BUG-34 | 401 body rỗng từ HTTP Security | Medium | Cần cơ chế security tùy biến; đã ghi nhận root cause |
| (Low) | Drawer width, pom artifact relocated, vitest config, dead shims, aria, unused i18n... | Low | Xem mục 3 của `CODE_REVIEW_SPRINT_01.md` |
