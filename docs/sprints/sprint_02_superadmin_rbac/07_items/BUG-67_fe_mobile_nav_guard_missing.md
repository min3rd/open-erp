# [BUG-67] Thiếu Menu/Guard Route Cho Tenant Admin & Platform Trên Web/Mobile

- **Mã Lỗi**: BUG-67
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Chưa cập nhật menu mobile (FEAT-08) cho Tenant Admin (Roles/Org); các route `/settings/*` và `/platform/*` chưa có guard theo quyền chức năng/platform_role, người dùng thường có thể điều hướng trực tiếp bằng URL.

- **Môi trường**: Frontend Web Angular & Mobile Ionic (Local)
- **Bằng chứng (file:line)**:
  - `../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md:30-35` — menu platform `/platform/tenants|users|health|audit-logs`; `:51` — `/settings/roles`; chưa định nghĩa route/guard tương ứng.
  - `../02_analysis/ANL-01_superadmin_platform_management.md:163-173` — ma trận phân định Web/Mobile (Impersonation blocked on mobile).
  - `docs/sprints/sprint_01_core_iam/07_items/FEAT-08_ionic_mobile_menu_theme.md` — menu mobile hiện tại chưa có mục Roles/Organization.
  - `../sprint_plan.md:44-46` — yêu cầu Split-Screen và Drawer, cần route thật thay vì popup.
- **Tài Liệu Đối Chiếu**: `AGENTS.md` (Router-driven, Anti-Modal; không hardcode); SOL-01 §5 (route `/platform/*` + guard).

## 2. Tác Động
- Người dùng không có quyền vẫn vào được màn hình cấu hình; menu thiếu chức năng khiến FEAT-13/14 không dùng được trên mobile.

## 3. Kết Quả Kỳ Vọng
- Route `/platform/*` có `platformRoleGuard`; `/settings/roles|organization` có permission guard; i18n key đầy đủ.
- Menu mobile có mục Roles/Organization cho Tenant Admin; cập nhật shared UI nếu cần.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer hoàn tất TASK-280 (Web) — guard + route.
- [ ] Menu mobile cập nhật theo TASK-281.
- [ ] QA dual-mode test: 0 console error, guard chặn đúng.

- **Ghi chú QA (2026-09-18)**: Routes/guard đã đặc tả (DES-UI §7, TASK-280/TASK-281); chờ thực thi FE/Mobile.
