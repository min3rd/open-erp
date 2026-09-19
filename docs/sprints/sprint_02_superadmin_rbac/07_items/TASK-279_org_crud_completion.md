# [TASK-279] Hoàn Thiện CRUD Cơ Cấu Tổ Chức (Xóa Branch/Department, Di Chuyển Phòng Ban, Membership)

- **Mã Công Việc**: TASK-279
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục nhóm Organization trong [BUG-61](BUG-61_missing_endpoints.md) — thiếu delete/move và vòng đời membership.
- Mục tiêu: hoàn thiện CRUD cơ cấu tổ chức kèm phát hiện vòng lặp cây/chu trình báo cáo.
- Tài liệu thiết kế: [DES-02-API](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md) §4; [ANL-02](../02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md) BR-RBAC-03/04; [SOL-02](../05_solutions/SOL-02_rbac_and_data_scope_enforcement_engine.md) §5.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] `DELETE /api/v1/organization/branches/{id}` — chặn nếu còn department/membership tham chiếu.
- [ ] `DELETE /api/v1/organization/departments/{id}` — chặn nếu còn phòng ban con hoặc membership.
- [ ] `PUT /api/v1/organization/departments/{id}/move` — đổi phòng ban cha, phát hiện chu trình cây (cycle detection).
- [ ] `GET/PUT/DELETE /api/v1/organization/memberships/{id}` — xem/sửa (đổi quản lý trực tiếp, is_primary)/gỡ membership; kiểm tra chu trình báo cáo (`ORGANIZATION_REPORTING_CYCLE_DETECTED`).
- [ ] Vô hiệu hóa cache Redis khi thay đổi cơ cấu; audit đầy đủ.
- [ ] Test integration: cycle detection, chặn xóa an toàn, membership removal.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Endpoint hoạt động đúng đặc tả + mã lỗi chuẩn hóa.
- [ ] Phát hiện chu trình chính xác trên cả cây phòng ban lẫn tuyến báo cáo.
- [ ] `mvn test` pass 100%; API spec cập nhật.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA kiểm thử các ca cycle và xóa an toàn.
- [ ] Không phát sinh regression.

## Ghi Chú Hoàn Thành (2026-09-18)
- Hoàn thiện CRUD tổ chức: xóa branch (chặn khi còn phòng ban/thành viên), xóa department (chặn khi còn phòng con/thành viên), di chuyển phòng ban (cycle detection), `GET/PUT/DELETE /organization/memberships/{id}` (đổi quản lý trực tiếp/`is_primary`, kiểm tra chu trình báo cáo).
- Mã lỗi chuẩn hóa `ORGANIZATION_BRANCH_HAS_MEMBERS`, `ORGANIZATION_DEPARTMENT_IN_USE`, `ORGANIZATION_DEPARTMENT_CYCLE_DETECTED`, `ORGANIZATION_REPORTING_CYCLE_DETECTED`, `ORGANIZATION_CROSS_TENANT_REFERENCE`; giới hạn độ sâu cây 5 cấp.
- Test `BranchApiTest`, `DepartmentTreeApiTest`, `MembershipApiTest`, `TenantIsolationOrgTest` trên PostgreSQL thật.
