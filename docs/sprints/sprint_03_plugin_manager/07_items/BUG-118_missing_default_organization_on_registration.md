# [BUG-118] Tenant đăng ký mới không có cơ cấu tổ chức gốc (chi nhánh/phòng ban mặc định)

| Trường | Giá trị |
| :--- | :--- |
| **Mã** | BUG-118 |
| **Mức độ** | **High** |
| **Phát hiện bởi** | Chủ dự án (báo cáo trực tiếp) |
| **Ngày** | 2026-10-05 |
| **Trạng thái** | Done (QA-03 verified 2026-10-05) |
| **Liên quan** | BR-RBAC-03, BUG-59 (backfill tenant cũ) |

## Triệu chứng

Đăng ký tài khoản doanh nghiệp mới → vào **Cơ cấu tổ chức** (`/settings/organization`) không có
công ty/chi nhánh gốc nào để gắn chi nhánh, phòng ban.

## Nguyên nhân gốc

`AuthService.registerBusiness` (và `registerPersonal`) tạo `tenants` + user + `user_roles` +
plugin mặc định, nhưng **không tạo cấu trúc tổ chức mặc định**. BR-RBAC-03 yêu cầu mọi user phải
thuộc ≥ 1 chi nhánh và phòng ban chính để engine tính được data scope.

BUG-59 đã xử lý phần **tenant cũ** bằng migration một lần `V2.0.1__backfill_existing_tenants.sql`
(HQ/GENERAL + membership primary), nhưng **tenant tạo sau migration** không được provision.

## Cách sửa

Thêm `OrganizationProvisioningService.provisionDefaults(tenantId, userId)` (idempotent) tạo:
- chi nhánh `HQ` ("Trụ sở chính", `is_default=TRUE`)
- phòng ban gốc `GENERAL` ("Phòng ban chung") thuộc HQ
- `user_department_memberships` primary + `user_branch_assignments` primary cho người tạo

Gọi ngay sau `assignSystemRole` ở cả 3 luồng tạo tenant/đăng ký trong `AuthService`.

## Kiểm chứng

- `mvn test` full suite (PostgreSQL thật) — xem `docs/.../08_testing` evidence (cập nhật sau khi chạy).
- Sau đăng ký doanh nghiệp: `branches` có HQ, `departments` có GENERAL, user có primary membership
  + branch assignment.
