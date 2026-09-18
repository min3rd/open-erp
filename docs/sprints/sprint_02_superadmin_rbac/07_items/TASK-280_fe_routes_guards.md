# [TASK-280] Route & Guard Frontend Web Cho Platform và Settings

- **Mã Công Việc**: TASK-280
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục [BUG-67](BUG-67_fe_mobile_nav_guard_missing.md) — route `/platform/*`, `/settings/*` chưa có guard và i18n.
- Mục tiêu: định nghĩa route, guard và các key i18n cho Web theo chuẩn Router-driven/Anti-Modal.
- Tài liệu thiết kế: [DES-02-UI](../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md) §2-3; [ANL-01](../02_analysis/ANL-01_superadmin_platform_management.md) §3.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Định nghĩa route `/platform/tenants`, `/platform/tenants/:id`, `/platform/users`, `/platform/health`, `/platform/audit-logs` với `platformRoleGuard` (kiểm tra claim `platform_role`).
- [ ] Định nghĩa route `/settings/roles` (Split-Screen 3 cột), `/settings/organization` với permission guard.
- [ ] Bổ sung i18n keys cho toàn bộ nhãn/menu/route (vi/en) — không hardcode.
- [ ] Chỉ tạo/bổ sung component dùng chung trong `src/frontend/shared/` khi cần (Drawer, Badge...); không viết ad-hoc.
- [ ] Kiểm thử browser thủ công (dual-mode) — không viết unit test FE.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Guard chặn đúng: user thường không vào được `/platform/*` hay `/settings/*`.
- [ ] 100% text qua i18n; build Web PASS; 0 console error.
- [ ] Layout đúng Industrial Sharp/Anti-Modal (Drawer/Split-Screen).

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA dual-mode browser test đạt yêu cầu.
- [ ] Không phát sinh regression.
