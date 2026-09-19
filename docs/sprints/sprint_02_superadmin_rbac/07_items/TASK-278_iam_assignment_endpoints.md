# [TASK-278] Endpoint Quản Lý Gán Vai Trò Người Dùng (List/Remove Role, List User Của Role)

- **Mã Công Việc**: TASK-278
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục nhóm IAM trong [BUG-61](BUG-61_missing_endpoints.md) — §5.5 mới chỉ có API gán vai trò.
- Mục tiêu: hoàn thiện vòng đời gán vai trò cho người dùng.
- Tài liệu thiết kế: [DES-02-API](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md) §5.5; [DES-02-DB](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md) §4.4.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] `GET /api/v1/iam/users/{user_id}/roles` — danh sách vai trò hiện tại (khuôn mẫu 3).
- [ ] `DELETE /api/v1/iam/users/{user_id}/roles/{role_id}` — gỡ vai trò; chặn gỡ vai trò cuối cùng của tenant owner (BR-RBAC-01/02).
- [ ] `GET /api/v1/iam/roles/{role_id}/users` — danh sách user đang gán vai trò.
- [ ] Phát sự kiện vô hiệu hóa cache Redis khi thay đổi vai trò (`UserRoleAssignedEvent`).
- [ ] Audit + i18n code đầy đủ; test integration trên PostgreSQL & Redis thật.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] 3 endpoint hoạt động đúng đặc tả, envelope chuẩn.
- [ ] Cache phân quyền bị vô hiệu sau thao tác (kiểm chứng bằng test).
- [ ] `mvn test` pass 100%; API spec cập nhật.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA kiểm thử gán/gỡ vai trò và hiệu lực quyền tức thì.
- [ ] Không phát sinh regression.

## Ghi Chú Hoàn Thành (2026-09-18)
- Hoàn thiện vòng đời gán vai trò: `GET /iam/users/{id}/roles`, `DELETE /iam/users/{id}/roles/{roleId}` (chặn gỡ vai trò hệ thống bắt buộc cuối cùng), `GET /iam/roles/{id}/users`; bổ sung `GET /iam/users` (directory trong tenant).
- Phát `UserRoleAssignedEvent` → `PermissionInvalidationService` xóa cache Redis `sec:ctx:*` để quyền có hiệu lực tức thì.
- Test `UserRoleApiTest` + `PermissionInvalidationServiceTest` trên PostgreSQL & Redis thật.
