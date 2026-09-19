# [TASK-268] Định Nghĩa & Seed Danh Mục Quyền Core Ban Đầu

- **Mã Công Việc**: TASK-268
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: [TASK-241 (trong FEAT-14)](FEAT-14_functional_rbac_matrix.md) yêu cầu nạp danh mục quyền chuẩn nhưng chưa có danh sách nào được định nghĩa — xem [BUG-51](BUG-51_missing_functional_permission_enforcement.md).
- Mục tiêu: danh mục quyền core ban đầu cho user/role/branch/department/permission/audit/user-role kèm `description_key` i18n.
- Tài liệu thiết kế: [DES-02-DB](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md) §4.1; [DES-02-API](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md) §5.1.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Chốt danh mục quyền core: `core:user:*`, `core:role:*`, `core:branch:*`, `core:department:*`, `core:permission:*`, `core:audit:read`, `core:user-role:*` (create/read/update/delete/export nếu phù hợp).
- [ ] Sinh `description_key` dạng `PERM_CORE_<RESOURCE>_<ACTION>` và bổ sung bản dịch vi/en cho Web + Mobile.
- [ ] Hiện thực seed idempotent (Flyway V2 hoặc startup service UPSERT theo `code`).
- [ ] Gán mặc định quyền cho các role hệ thống (`TENANT_OWNER`, `TENANT_ADMIN`, `GENERAL_MANAGER`, `STAFF`, `VIEWER`).
- [ ] Viết test xác nhận seed chạy lại không sinh bản ghi trùng trên PostgreSQL thật.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Bảng `permissions` + `role_permissions` có dữ liệu chuẩn sau migrate.
- [ ] Không hardcode chuỗi hiển thị; 100% có `description_key` vi/en.
- [ ] API `GET /api/v1/iam/permissions` trả đúng catalog.
- [ ] `mvn test` pass 100%.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA kiểm tra catalog và bản dịch i18n.
- [ ] Không phát sinh regression.

## Ghi Chú Hoàn Thành (2026-09-18)
- Migration `V2.0.0__superadmin_rbac_schema.sql` §6 seed idempotent **24 permissions** core (`core:user:*`, `core:role:*`, `core:permission:*`, `core:organization:*`, `core:branch:*`, `core:department:*`, `core:membership:*`, `core:branch-assignment:*`, `core:audit:read`, `core:sample-record:*`) kèm `description_key` i18n; chạy lại không sinh bản ghi trùng (`ON CONFLICT (code) DO NOTHING`).
- §8 phân bổ `role_permissions` cho **5 system roles** (`tenant_id NULL`): TENANT_OWNER/TENANT_ADMIN toàn bộ, GENERAL_MANAGER read+export, STAFF sample-record read/create/update + organization:read, VIEWER toàn bộ read.
- `mvn test` **51/51 PASS** trên `openerp_dev` (PostgreSQL thật, không H2); catalog kiểm chứng trên DB dev.
