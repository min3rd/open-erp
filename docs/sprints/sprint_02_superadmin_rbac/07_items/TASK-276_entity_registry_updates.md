# [TASK-276] Đăng Ký 11 Entity Mới Vào Entity Registry

- **Mã Công Việc**: TASK-276
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục [BUG-60](BUG-60_entity_registry_not_updated.md) — 12 bảng cấu trúc mới + bảng Reference Entity `core_sample_records` chưa đăng ký Entity Registry.
- Mục tiêu: annotation `@RegisterEntity` cho toàn bộ entity mới + ban hành registry doc.
- Tài liệu thiết kế: [DES-02-DB](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md); `docs/system/entity_registry/README.md`.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Gắn `@RegisterEntity` (entityName, table, publicFields, relations) cho 11 entity: `platform_super_admins`, `platform_impersonation_logs`, `platform_audit_logs`, `branches`, `departments`, `user_department_memberships`, `permissions`, `roles`, `role_permissions`, `user_roles`, `role_data_policies`.
- [ ] Xác nhận `EntityRegistryService` UPSERT vào `sys_entity_registry` khi startup, không sinh bản ghi trùng.
- [ ] Ban hành `docs/system/entity_registry/SUPERADMIN_RBAC_REGISTRY.md` (danh mục + public fields).
- [ ] Cập nhật liên kết tại `docs/system/entity_registry/README.md` §4 (danh mục đăng ký).
- [ ] Test: khởi động lại app 2 lần, registry không nhân bản; số entity đúng 11.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] 100% entity mới có annotation và xuất hiện trong `sys_entity_registry`.
- [ ] Registry doc ban hành, khớp dữ liệu thực tế.
- [ ] `mvn test` pass 100% trên PostgreSQL thật.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA đối chiếu doc với bảng `sys_entity_registry`.
- [ ] Không phát sinh regression.

## Ghi Chú Hoàn Thành (2026-09-18)
- Toàn bộ **13 entity Sprint 02** đã gắn `@RegisterEntity`: 3 platform (`core-platform`), 4 organization (`core-organization`), 5 IAM (`core-iam`), 1 reference `CoreSampleRecord` (`core`); tổng registry hiện tại **20 entity** (7 Core IAM + 13 Sprint 02).
- `EntityRegistryService` UPSERT theo `(plugin_id, entity_name)` khi startup, không sinh bản ghi trùng; test `EntityRegistryServiceTest` đã cập nhật và PASS trong `mvn test` **51/51**.
- Ban hành `docs/system/entity_registry/SUPERADMIN_RBAC_REGISTRY.md` và cập nhật liên kết tại `docs/system/entity_registry/README.md` §4.
