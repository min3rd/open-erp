# [BUG-59] Thiếu Migration Backfill Dữ Liệu Sprint 1 Sang Schema Sprint 2

- **Mã Lỗi**: BUG-59
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Chưa có migration/backfill nào: seed roles + permissions cho các tenant Sprint 1, gán vai trò `TENANT_OWNER`, và tạo branch/department mặc định cho user hiện hữu — trong khi BR-RBAC-03 bắt buộc mọi user phải có phòng ban chính và chi nhánh để tính phạm vi dữ liệu.

- **Môi trường**: Backend Quarkus + PostgreSQL (Local/Staging)
- **Bằng chứng (file:line)**:
  - `src/backend/src/main/resources/db/migration/` — chỉ có V1.0.0 → V1.0.3; không có migration V2.x seed roles/permissions/backfill.
  - `../02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md:193` — BR-RBAC-03: user bắt buộc thuộc ≥ 1 phòng ban chính (`is_primary = true`) và một chi nhánh.
  - `../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md:172-192, 215-257` — bảng `user_department_memberships`, `roles`, `user_roles` mới nhưng không có dữ liệu cho tenant cũ.
  - `../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md:132-164` — branches/departments chưa có bản ghi mặc định.
- **Tài Liệu Đối Chiếu**: BUG-54 (xung đột nguồn vai trò); BR-RBAC-01/03.

## 2. Tác Động
- User Sprint 1 không có role/data policy/membership → Data Permission Engine không tính được phạm vi; tenant mới không có chi nhánh/phòng ban mặc định để hoạt động.

## 3. Kết Quả Kỳ Vọng
- Flyway V2.0.1: tạo branch "HQ" + department "GENERAL" mặc định, membership primary cho user hiện hữu, seed roles/permissions và gán vai trò theo bảng mapping (TASK-275).
- Migration chạy an toàn, idempotent, có kiểm chứng trên PostgreSQL thật.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [ ] Migration V2.0.1 hoàn tất và pass trên DB sạch lẫn DB có dữ liệu Sprint 1.
- [ ] 100% user hiện hữu có primary membership + role.
- [ ] QA xác nhận không mất dữ liệu, không phá vỡ tenant hiện có.

- **Ghi chú QA (2026-09-18)**: Kế hoạch Flyway V2.0.1 đã bổ sung (DES-DB §5, TASK-275); chờ migration.

## Ghi Chú Hoàn Thành (2026-09-18)
- Ban hành `V2.0.1__backfill_existing_tenants.sql` (idempotent): HQ/GENERAL mặc định + membership primary + branch assignment primary cho mọi `user_tenants`; backfill `user_roles` theo mapping TASK-271.
- Seed 24 permissions + 5 system roles từ `V2.0.0` (§6-8) áp dụng cho cả tenant hiện hữu; `mvn test` **51/51 PASS** trên PostgreSQL thật.
- **Hoãn sang sóng API (Wave 2)**: bảo đảm 100% tenant có ≥ 1 `TENANT_OWNER` — cần logic nghiệp vụ khi legacy role không map được, không thể ép an toàn bằng SQL backfill.
