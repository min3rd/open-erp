# [BUG-66] Lỗ Hổng Ràng Buộc Toàn Vẹn Dữ Liệu Trong Schema Mới

- **Mã Lỗi**: BUG-66
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Schema mới thiếu các ràng buộc chống trùng và chống gán chéo tenant: unique `(tenant_id, code)` không chặn vai trò hệ thống `tenant_id NULL`; không có partial unique cho phòng ban chính; memberships/user_roles/role_data_policies không ràng buộc chéo tenant.

- **Môi trường**: PostgreSQL 16+ (Local)
- **Bằng chứng (file:line)**:
  - `../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md:226` — `CONSTRAINT uq_tenant_role_code UNIQUE(tenant_id, code)`; PostgreSQL coi NULL khác nhau → trùng code system role vẫn lọt.
  - `../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md:172-192` — `user_department_memberships` thiếu partial unique `(user_id) WHERE is_primary` dù BR-RBAC-03 yêu cầu 1 phòng ban chính.
  - `../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md:174-185, 245-257, 261-284` — thiếu ràng buộc chéo tenant (user thuộc tenant A không được gán branch/department/role/policy của tenant B).
- **Tài Liệu Đối Chiếu**: ANL-02 §1, BR-RBAC-03; `AGENTS.md` (Tenant Data Isolation triệt để).

## 2. Tác Động
- Dữ liệu IAM có thể sai lệch/trùng lặp hoặc gán chéo tenant — rủi ro rò rỉ dữ liệu và sai phạm vi.

## 3. Kết Quả Kỳ Vọng
- Bổ sung partial unique cho system roles và `is_primary`; thêm composite FK/trigger kiểm tra chéo tenant cho memberships, user_roles, role_data_policies.
- Có test trên PostgreSQL thật xác nhận các ràng buộc chặn dữ liệu sai.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [ ] Migration bổ sung ràng buộc hoàn tất.
- [ ] Insert trùng/chéo tenant bị chặn.
- [ ] QA xác nhận test ràng buộc pass trên PostgreSQL thật.

- **Ghi chú QA (2026-09-18)**: Ràng buộc đã đặc tả (DES-DB §3.4 + partial unique); cần đưa vào migration V2.0.0.
