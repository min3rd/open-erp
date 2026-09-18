# [TASK-289] API CRUD Branch Assignments & Drawer Phân Công Quản Lý Chi Nhánh (Web)

- **Mã Công Việc**: TASK-289
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: sub-task của [FEAT-13](FEAT-13_organization_hierarchy_structure.md); khắc phục [BUG-71](BUG-71_multibranch_manager_design_gap.md).
- Mục tiêu: cung cấp API + UI phân công quản lý nhiều chi nhánh cho nhân sự.
- Tài liệu thiết kế: [DES-02-API](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md) §4.4, §6.2; [DES-02-UI](../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md) §4, §6.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Hiện thực `GET/POST/PUT/DELETE /api/v1/organization/branch-assignments` đúng 4 khuôn mẫu phản hồi.
- [ ] `POST is_primary = true` tự gỡ primary cũ của user; chặn xóa primary cuối → `409 ORGANIZATION_PRIMARY_BRANCH_REQUIRED`.
- [ ] Xây dựng `BranchAssignmentDrawer (Tenant)` trên Web: chọn nhân sự + tick nhiều Chi nhánh (cột `Quản lý` + radio `Chi nhánh chính`), lưu qua API branch-assignments.
- [ ] Hiển thị badge "Quản lý N chi nhánh" trong danh sách nhân sự màn Cơ cấu tổ chức.
- [ ] Bổ sung i18n `ORGANIZATION_BRANCH_ASSIGNMENT_*` (vi/en); phát invalidation cache sau khi lưu.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] 100% API trả đúng `code` i18n, không hardcode message hiển thị.
- [ ] Drawer anti-modal (không dùng Modal popup), thao tác được lưu và phản ánh ngay vào scope.
- [ ] QA dual-mode kiểm thử Web Desktop ≥ 1280px, 0 console error.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA xác nhận API + Drawer + badge đạt Acceptance Criteria.
- [ ] Không phát sinh regression.
