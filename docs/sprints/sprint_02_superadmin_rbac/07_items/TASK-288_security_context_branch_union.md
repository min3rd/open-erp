# [TASK-288] Mở Rộng `UserSecurityContext` & Compiler BRANCH Theo Union (Member ∪ Managed)

- **Mã Công Việc**: TASK-288
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: sub-task của [FEAT-15](FEAT-15_multi_scope_data_access_control.md) & [FEAT-16](FEAT-16_data_permission_enforcement_engine.md); khắc phục [BUG-71](BUG-71_multibranch_manager_design_gap.md).
- Mục tiêu: BRANCH scope lọc theo hợp của Chi nhánh thành viên và Chi nhánh được quản lý.
- Tài liệu thiết kế: [SOL-02](../05_solutions/SOL-02_rbac_and_data_scope_enforcement_engine.md) §3, §4, §4.1; [ANL-02](../02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md) BR-RBAC-08 → 11.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Cập nhật `UserSecurityContext`: thay `branch_ids` bằng `member_branch_ids`, `managed_branch_ids`, `effective_branch_ids`, `primary_branch_id`.
- [ ] Cache Redis `sec:ctx:{tenant_id}:{user_id}` (TTL 10 phút) lưu 4 trường mới; `effective_branch_ids = union(member, managed)`.
- [ ] Nâng cấp Scope SQL Compiler cho `BRANCH`: `tenant_id = :currentTenantId AND branch_id IN (:effectiveBranchIds)`.
- [ ] CREATE rule: branch mặc định = `primary_branch_id`; branch gửi lên bắt buộc ∈ `effective_branch_ids`, nếu không → `403 IAM_PERMISSION_DENIED_DATA_SCOPE`.
- [ ] Auto-sync membership từ `departments.manager_user_id` (BR-RBAC-11) — không tạo nguồn scope thứ hai.
- [ ] Phát `BranchAssignmentChangedEvent` khi phân công thay đổi để vô hiệu hóa cache tức thì.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Compiler BRANCH dùng đúng `:effectiveBranchIds`; không còn tham chiếu `userBranchId`/`branch_ids` cũ.
- [ ] `primary_branch_id` được chọn khi CREATE thiếu `branch_id`.
- [ ] Unit/Integration test union scope + auto-sync pass trên PostgreSQL & Redis thật.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA review context/cache invalidation theo TC-BE-21 → 23.
- [ ] Không phát sinh regression.

## Ghi Chú Hoàn Thành (2026-09-18)
- `UserSecurityContext` mở rộng `member_branch_ids`, `managed_branch_ids`, `effective_branch_ids`, `primary_branch_id`; cache Redis `sec:ctx:{tenant}:{user}` TTL 15 phút + invalidation qua event.
- `DataScopeEngine` compile `BRANCH` theo `effective_branch_ids = union(member, managed)`; CREATE mặc định `primary_branch_id`, branch ngoài effective → 403 `IAM_PERMISSION_DENIED_DATA_SCOPE`.
- Auto-sync membership từ `departments.manager_user_id`; test `SecurityContextServiceTest` + `DataScopeEngineTest` trên PostgreSQL & Redis thật.
