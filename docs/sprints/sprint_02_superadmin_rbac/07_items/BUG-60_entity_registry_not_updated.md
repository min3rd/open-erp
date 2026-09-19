# [BUG-60] 11 Bảng Mới Chưa Đăng Ký Entity Registry

- **Mã Lỗi**: BUG-60
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Sprint 02 tạo 12 bảng cấu trúc mới (13 entity nếu tính cả bảng Reference Entity `core_sample_records` của FEAT-17) nhưng chưa entity nào được đăng ký vào Entity Registry chung; danh mục `docs/system/entity_registry/` mới chỉ có 7 entity Core IAM Sprint 1.

- **Môi trường**: Backend Quarkus + PostgreSQL (Local)
- **Bằng chứng (file:line)**:
  - `../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md` — 11 `CREATE TABLE`: `platform_super_admins`, `platform_impersonation_logs`, `platform_audit_logs`, `branches`, `departments`, `user_department_memberships`, `permissions`, `roles`, `role_permissions`, `user_roles`, `role_data_policies`.
  - `docs/system/entity_registry/README.md:64` — danh mục chỉ ghi Core IAM 7 entity; chưa có registry cho SuperAdmin/RBAC.
  - `docs/system/entity_registry/CORE_IAM_REGISTRY.md` — chưa cập nhật entity Sprint 02.
- **Tài Liệu Đối Chiếu**: `AGENTS.md` (Cơ Chế Entity Registry — bắt buộc đăng ký); `docs/system/entity_registry/README.md` §2 (annotation `@RegisterEntity`).

## 2. Tác Động
- Plugin/ma trận data-policy không có nguồn catalog resource an toàn; vi phạm ràng buộc kiến trúc nền tảng.

## 3. Kết Quả Kỳ Vọng
- 11 entity mới có annotation `@RegisterEntity` và được UPSERT vào `sys_entity_registry`.
- Ban hành `docs/system/entity_registry/SUPERADMIN_RBAC_REGISTRY.md` (TASK-276).

## 4. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer đã đăng ký đủ 11 entity (TASK-276).
- [ ] Registry doc được ban hành và khớp dữ liệu `sys_entity_registry`.
- [ ] QA xác nhận startup UPSERT không sinh bản ghi trùng.

- **Ghi chú QA (2026-09-18)**: Danh mục entity cần đăng ký đã xác định (TASK-276); chờ thực thi.

## Ghi Chú Hoàn Thành (2026-09-18)
- **13/13 entity** Sprint 02 đã có annotation `@RegisterEntity` và xuất hiện trong `sys_entity_registry`; tổng registry **20 entity** (7 Core IAM + 13 Sprint 02).
- `EntityRegistryService` UPSERT idempotent theo `(plugin_id, entity_name)`, khởi động lại không nhân bản; `EntityRegistryServiceTest` cập nhật và PASS trong `mvn test` **51/51**.
- Ban hành `docs/system/entity_registry/SUPERADMIN_RBAC_REGISTRY.md`; cập nhật `README.md` §4.
