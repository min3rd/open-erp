# TC-SPRINT-01-AUTH-001 — Auth Service JWT & Local Auth

**Trạng thái:** ✅ PASS  
**Loại:** Functional | Security | Regression  
**Module:** Auth  
**Độ ưu tiên:** Cao  
**Task liên quan:** TASK-SPRINT-01-AUTH-001  
**Tham chiếu:**

- `docs/tasks/sprints/SPRINT-01/auth/TASK-SPRINT-01-AUTH-001-auth-service-jwt.md`
- `docs/architecture/API-DESIGN.md`

## Điều kiện và phạm vi đánh giá

- Đánh giá dựa trên source code hiện tại trong `open-erp-backend`, build cục bộ và unit test hiện có.
- Không có runtime đầy đủ để thực hiện manual API/Playwright end-to-end với MongoDB/Redis/RabbitMQ.
- Evidence dùng cho vòng QA này:

```text
npm run build
npm test -- --passWithNoTests
npm test -- src/auth/auth.controller.spec.ts src/auth/auth.service.spec.ts src/tenant/tenant.service.spec.ts src/tenant/tenant.controller.spec.ts src/tenant/tenant-registration.controller.spec.ts --runInBand --passWithNoTests
npm run test:cov -- --runInBand --passWithNoTests

Test Suites: 16 passed, 16 total
Tests: 70 passed, 70 total
Test Suites: 5 passed, 5 total
Tests: 41 passed, 41 total
src/auth/auth.service.ts: 80.68% statements
```

## Ma trận test case

| Mã TC con   | Kịch bản                                                         | Loại                  | Điều kiện tiên quyết                            | Bước kiểm tra                                                                         | HTTP kỳ vọng                                                      | Response key / trường bắt buộc                                                                                   | Kết quả QA | Ghi chú                                                                                              |
| ----------- | ---------------------------------------------------------------- | --------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| AUTH-001-01 | Đăng nhập hợp lệ trả access token + refresh token                | Functional            | User ACTIVE, tenant ACTIVE/TRIAL, password đúng | Gọi `POST /api/v1/auth/login` với `tenantId`, `email`, `password` hợp lệ              | 200                                                               | `success=true`, `data.accessToken`, `data.refreshToken`, `data.user`, `data.expiresIn`, `data.mfaRequired=false` | ✅ PASS    | Có unit test `login() success returns accessToken + refreshToken`.                                   |
| AUTH-001-02 | Sai mật khẩu trả unauthorized                                    | Error                 | User tồn tại, password sai                      | Gọi `POST /api/v1/auth/login` với password sai                                        | 401                                                               | `error.code=UNAUTHORIZED`, message key theo filter `error.auth.unauthorized`                                     | ✅ PASS    | Có unit test tăng `failedLoginCount` và ném `UnauthorizedException`.                                 |
| AUTH-001-03 | Sai 5 lần liên tiếp khóa tài khoản tạm thời                      | Edge / Security       | User chưa bị khóa, nhập sai 5 lần               | Lặp login sai mật khẩu đến ngưỡng                                                     | 423                                                               | `error.code=ACCOUNT_LOCKED`                                                                                      | ✅ PASS    | Có unit test cho nhánh lock + `lockedUntil`.                                                         |
| AUTH-001-04 | Refresh token hợp lệ được rotate                                 | Functional            | Có refresh token chưa revoked                   | Gọi `POST /api/v1/auth/refresh-token` với refresh token hợp lệ                        | 200                                                               | `success=true`, `data.accessToken`, `data.refreshToken`, `data.expiresIn`                                        | ✅ PASS    | Có unit test `refreshToken() valid rotates and returns new tokens`.                                  |
| AUTH-001-05 | Refresh token đã revoke bị từ chối                               | Error / Security      | Refresh token đã revoked hoặc hết hạn           | Gọi refresh với token không hợp lệ                                                    | 401                                                               | `error.code=UNAUTHORIZED` hoặc `TOKEN_INVALID` theo gateway mapping                                              | ✅ PASS    | Có unit test `refreshToken() revoked token throws UnauthorizedException`.                            |
| AUTH-001-06 | Forgot password không làm lộ user existence                      | Security              | Email có hoặc không có trong hệ thống           | Gọi `POST /api/v1/auth/forgot-password` với email bất kỳ                              | 200                                                               | `success=true`, `data.accepted=true`                                                                             | ✅ PASS    | Có unit test cho email không tồn tại và email tồn tại.                                               |
| AUTH-001-07 | Reset password với OTP hợp lệ phải revoke toàn bộ refresh tokens | Functional / Security | OTP hợp lệ, user tồn tại                        | Gọi `POST /api/v1/auth/reset-password` với `tenantId`, `userId`, `otp`, `newPassword` | 200                                                               | `success=true`, `data.passwordReset=true`                                                                        | ✅ PASS    | Có unit test xác nhận đổi hash và `revokeAllByUserId`.                                               |
| AUTH-001-08 | Reset password với OTP hết hạn bị chặn                           | Error                 | OTP đã hết hạn                                  | Gọi reset-password với OTP expired                                                    | 400                                                               | `error.code=TOKEN_EXPIRED`, message key mặc định `error.validation.invalid_input` hoặc mapping tương ứng         | ✅ PASS    | Có unit test `expired OTP throws BadRequestException`.                                               |
| AUTH-001-09 | Refresh token phải đi qua httpOnly cookie theo API design        | Security / Contract   | Theo kiến trúc API gateway                      | Đối chiếu controller hiện tại với API design                                          | 200 với cookie inbound, response không buộc trả refresh token thô | `Cookie: refreshToken=...` / `Set-Cookie`                                                                        | ✅ PASS    | Controller ưu tiên đọc refresh token từ cookie httpOnly, vẫn hỗ trợ body cho backward compatibility. |
| AUTH-001-10 | Access token phải ký RS256 theo API design                       | Security / Contract   | Hệ thống downstream verify bằng public key      | Đối chiếu cấu hình sign JWT hiện tại                                                  | 200                                                               | Thuật toán `RS256`                                                                                               | ✅ PASS    | Runtime hỗ trợ RS256 khi có key cấu hình; fallback HS256 chỉ dùng local/dev và có cảnh báo log.      |

## Kết luận tạm thời

- Scope AUTH-001 đạt điều kiện regression tuần 1: build PASS, test PASS, coverage `auth.service.ts` vượt ngưỡng 80%.
- Hai điểm lệch contract trước đó (`AUTH-001-09`, `AUTH-001-10`) đã được sửa và xác nhận lại bằng code review + test.
- Kết luận testcase: ✅ PASS; task có thể chuyển `🟢 DONE`.
