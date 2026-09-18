# [BUG-54] Xung Đột Nguồn Vai Trò: `user_tenants.role` (Sprint 1) vs `user_roles`+`roles` (Sprint 2)

- **Mã Lỗi**: BUG-54
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Sprint 1 lưu vai trò trong cột `user_tenants.role` (chuỗi enum riêng), Sprint 2 thiết kế thêm bảng `roles` + `user_roles` nhưng không có migration/mapping/deprecation, dẫn tới hai nguồn vai trò song song.

- **Môi trường**: Backend Quarkus + PostgreSQL (Local)
- **Bằng chứng (file:line)**:
  - `src/backend/src/main/resources/db/migration/V1.0.0__init_core_iam_schema.sql:38-45` — `user_tenants.role VARCHAR(32) NOT NULL DEFAULT 'MEMBER'` (Sprint 1: OWNER/ADMIN/TENANT_ADMIN/MEMBER/VIEWER).
  - `../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md:215-257` — bảng `roles` và `user_roles` (Sprint 2).
  - `src/backend/src/main/resources/db/migration/` — chưa có migration mapping/backfill giữa hai nguồn.
  - Mã vai trò chồng lấn giữa hai hệ (`OWNER` vs `TENANT_OWNER`, `MEMBER` vs `STAFF`).
- **Tài Liệu Đối Chiếu**: ANL-02 §2.2; DES-02-DB §4.2/§4.4; BR-RBAC-01/02.

## 2. Tác Động
- Code Sprint 1 đọc `user_tenants.role`, code Sprint 2 đọc `user_roles`; quyền user mới/cũ không thống nhất, khó kiểm thử RBAC.

## 3. Kết Quả Kỳ Vọng
- Migration map: `OWNER→TENANT_OWNER`, `ADMIN/TENANT_ADMIN→TENANT_ADMIN`, `MEMBER→STAFF`, `VIEWER→VIEWER`.
- Chốt `user_roles` là nguồn vai trò chính (single source of truth); deprecate và loại bỏ dần cột `user_tenants.role`.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer hoàn tất migration mapping (TASK-271).
- [ ] Toàn bộ code đọc/ghi vai trò chuyển sang `user_roles`.
- [ ] QA xác nhận không còn nguồn vai trò song song trên PostgreSQL thật.

- **Ghi chú QA (2026-09-18)**: Mapping role đã chốt (`user_roles` là nguồn chính) theo TASK-271; chờ migration.
