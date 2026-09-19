# [BUG-53] Hạn Mức Tenant (`max_users`, `max_storage_mb`, `allowed_plugins`) Chưa Được Enforce

- **Mã Lỗi**: BUG-53
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> FEAT-10 mới chỉ cho phép Super Admin cấu hình quota; không có task/AC nào chặn tạo user vượt `max_users`, upload vượt `max_storage_mb` hay cài plugin ngoài `allowed_plugins`.

- **Môi trường**: Backend Quarkus + PostgreSQL (Local)
- **Bằng chứng (file:line)**:
  - `FEAT-10_superadmin_tenant_management.md` — AC/sub-task dừng ở CRUD cấu hình hạn mức.
  - `../02_analysis/ANL-01_superadmin_platform_management.md:79-84` — định nghĩa mô hình hạn mức nền tảng.
  - `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md:170-195` — `PUT .../quotas` cập nhật nhưng không có API/AC kiểm tra khi sử dụng.
  - `../04_confirmation/CONF-01_sprint_02_scope.md:15` — in-scope "cấu hình hạn mức tài nguyên".
- **Tài Liệu Đối Chiếu**: ANL-01 §2.1; DES-02-DB §2.1 (`max_users`, `max_storage_mb`, `allowed_plugins`).

## 2. Tác Động
- Tenant có thể tạo vượt số user/đầy storage/cài plugin trái phép; hạn mức gói dịch vụ trở thành trang trí.

## 3. Kết Quả Kỳ Vọng
- Chặn tạo/thêm user vượt `max_users` với `409` code `PLATFORM_TENANT_QUOTA_EXCEEDED`, params `{limit, current}`.
- Có hook kiểm tra `max_storage_mb` cho tầng upload; kiểm tra `allowed_plugins` khi cài/bật plugin (`403 PLATFORM_PLUGIN_NOT_ALLOWED`).

## 4. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer đã hiện thực quota enforcement (TASK-269, TASK-270).
- [ ] Có unit/integration test trên PostgreSQL thật cho các ngưỡng quota.
- [ ] QA re-test đúng mã lỗi và params theo đặc tả.

- **Ghi chú QA (2026-09-18)**: Thiết kế enforcement đã bổ sung (TASK-269/TASK-270 + mã lỗi quota); chờ thực thi mã.

## Ghi Chú Hoàn Thành (2026-09-18)
- Wave 3 wire quota call site thật: `AuthService.registerBusiness/verifyEmail/resolveTenantAndIssueToken` → `AccountService.enforceUserQuota`; vượt `max_users` trả `409 PLATFORM_TENANT_QUOTA_EXCEEDED` kèm `params {limit, current}`.
- **Lưu ý phạm vi**: Sprint 02 chưa có API mời/thêm user nên entry point duy nhất hiện tại là luồng đăng ký; mọi điểm tạo membership tương lai bắt buộc đi qua single entry point `AccountService.enforceUserQuota`.
- Phần plugin allowlist: `TenantPluginAllowlistService` + hook sample-record, mã canonical `PLATFORM_PLUGIN_NOT_ALLOWED` (TASK-270); hook `max_storage_mb` đã có từ TASK-269 (usage 0 chờ Storage Service).
- Kiểm chứng: `TenantQuotaServiceTest` + full `mvn test` **178/178 PASS** (PostgreSQL + Redis thật, không H2).
