# TC-SPRINT-01-TENANT-001 — Tenant Service self-registration & lifecycle

**Trạng thái:** ❌ FAIL  
**Loại:** Functional | Security | Regression  
**Module:** Tenant  
**Độ ưu tiên:** Cao  
**Task liên quan:** TASK-SPRINT-01-TENANT-001  
**Tham chiếu:**
- `docs/tasks/sprints/SPRINT-01/tenant/TASK-SPRINT-01-TENANT-001-tenant-service.md`
- `docs/architecture/API-DESIGN.md`

## Điều kiện và phạm vi đánh giá

- Đánh giá dựa trên source code hiện tại trong `open-erp-backend`, build cục bộ và unit test hiện có.
- Không có runtime backend/hạ tầng để chạy manual API hoặc Playwright end-to-end cho đăng ký tenant.
- Evidence dùng cho vòng QA này:

```text
npm run build
npm test -- src/auth/auth.service.spec.ts src/tenant/tenant.service.spec.ts src/tenant/tenant.controller.spec.ts --runInBand --passWithNoTests

PASS  src/tenant/tenant.controller.spec.ts
PASS  src/tenant/tenant.service.spec.ts
Test Suites: 3 passed, 3 total
Tests: 25 passed, 25 total
```

## Ma trận test case

| Mã TC con | Kịch bản | Loại | Điều kiện tiên quyết | Bước kiểm tra | HTTP kỳ vọng | Response key / trường bắt buộc | Kết quả QA | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| TENANT-001-01 | Đăng ký MST hợp lệ tạo registration chờ kích hoạt email | Functional | MST và subdomain chưa tồn tại | Gọi `POST /api/v1/register` với `companyName`, `taxCode`, `email`, `subdomain` hợp lệ | 201 | `success=true`, `data.registrationId`, `data.status=PENDING_EMAIL_ACTIVATION` | ✅ PASS | Có unit test `register success`. |
| TENANT-001-02 | MST trùng bị chặn conflict | Error | MST đã tồn tại ở tenant hoặc registration còn hiệu lực | Gọi `POST /api/v1/register` với MST trùng | 409 | `error.code=CONFLICT`, key `tenant.tax_code.duplicate` | ✅ PASS | Có unit test duplicate tax code. |
| TENANT-001-03 | Activation token hết hạn trả 410 | Error / Edge | Registration có token đã hết hạn | Gọi `GET /api/v1/register/activate?token=...` | 410 | `error.code=TOKEN_EXPIRED`, key `tenant.registration.activation_token_expired` | ✅ PASS | Có unit test expired token. |
| TENANT-001-04 | Verify tax code với định dạng sai bị chặn | Validation | Tax code không đúng 10/13 chữ số | Gọi `POST /api/v1/register/verify-tax-code` với tax code sai | 400 | `error.code=VALIDATION_ERROR`, key `tenant.tax_code.invalid_format` | ✅ PASS | Có unit test invalid format. |
| TENANT-001-05 | Verify tax code phải yêu cầu registration tồn tại và đã EMAIL_VERIFIED | Security / Functional | Chưa activate email hoặc chưa có registration | Gọi `POST /api/v1/register/verify-tax-code` trước bước activate | 400 hoặc 422 | Key mong đợi dạng `tenant.registration.invalid_state` hoặc `tenant.registration.not_found` | ❌ FAIL | Service hiện không kiểm tra state/tồn tại của registration; vẫn có thể trả `success=true`. |
| TENANT-001-06 | Register không được trả lộ activation token qua API public | Security | Luồng self-register công khai | Gọi `POST /api/v1/register` và kiểm tra payload trả về | 201 | Chỉ nên có `registrationId`, `status`, metadata không nhạy cảm | ❌ FAIL | Service đang trả `data.activationToken`. |
| TENANT-001-07 | Complete onboarding chỉ được phép khi MST đã xác thực | Security / Business rule | Registration `EMAIL_VERIFIED` nhưng `taxVerified=false` | Gọi `POST /api/v1/register/complete-onboarding` | 422 | Key mong đợi dạng `tenant.registration.tax_not_verified` | ❌ FAIL | Code chỉ kiểm tra `EMAIL_VERIFIED`, không chặn `taxVerified=false`. |
| TENANT-001-08 | Complete onboarding phải tạo tenant admin user và MinIO bucket thực tế | Functional / Integration | Registration hợp lệ và đã verify đủ bước | Gọi complete-onboarding | 201 hoặc 200 theo flow | `data.id`, `data.status`, evidence side effect tenant admin + bucket | ❌ FAIL | `OnboardingService` hiện chỉ trả metadata mock, chưa tạo side effects thật. |
| TENANT-001-09 | API quản lý tenant phải có soft delete và đổi plan theo scope task | Functional / Contract | Super Admin đã đăng nhập | Kiểm tra endpoint `DELETE /api/v1/tenants/:id` và `PATCH /api/v1/tenants/:id/plan` | 204 / 200 | Contract endpoint phải tồn tại | ❌ FAIL | Controller hiện chưa triển khai hai endpoint này. |
| TENANT-001-10 | Event `tenant.created` chỉ publish sau khi hoàn tất Onboarding Wizard | Regression / Integration | Luồng nhiều bước theo task doc | Đối chiếu thời điểm publish event | Sau wizard hoàn tất | Event publish đúng thời điểm | ❌ FAIL | Code publish `tenant.created` ngay trong `complete-onboarding`. |

## Kết luận tạm thời

- Một số nhánh validation cơ bản và conflict được cover bởi unit test hiện có.
- Luồng self-registration/onboarding còn hở business rule và security đáng kể, nên chưa thể sign-off cho backend review.
- Cần tạo bug task mới tối thiểu cho các mục `TENANT-001-05` đến `TENANT-001-09`; sau khi sửa phải retest lại bằng API runtime thực.