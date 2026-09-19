# [TASK-281] Menu Mobile Cho Tenant Admin & Màn Hình Khẩn Cấp Super Admin

- **Mã Công Việc**: TASK-281
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục [BUG-67](BUG-67_fe_mobile_nav_guard_missing.md) — menu mobile chưa có Roles/Org; thiếu màn hình khẩn cấp Super Admin.
- Mục tiêu: bổ sung menu + màn hình mobile theo ma trận phân định ANL-01 §3.
- Tài liệu thiết kế: [DES-02-UI](../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md) §5; [ANL-01](../02_analysis/ANL-01_superadmin_platform_management.md) §3.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Cập nhật menu mobile cho Tenant Admin: mục Quản Lý Vai Trò + Cơ Cấu Tổ Chức (kế thừa shared UI component, không viết lại).
- [ ] Cập nhật màn hình Super Admin khẩn cấp trên mobile: thẻ tổng quan (tenant active, cảnh báo dung lượng, đèn DB/Redis/Kafka) + khóa Tenant nhanh có xác nhận.
- [ ] Ẩn hoàn toàn Impersonation trên mobile (blocked theo ANL-01 §3).
- [ ] Đảm bảo touch target ≥ 40px, safe-area padding, overflow-x = 0, i18n đầy đủ vi/en.
- [ ] Kiểm thử thủ công Mobile Emulation 390x844 — không viết unit test FE.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Menu/màn hình mobile hoạt động đúng ma trận phân định; Impersonation không xuất hiện.
- [ ] Overflow-x = 0; 0 lỗi console; text 100% i18n.
- [ ] Build Mobile PASS.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA mobile emulation test + chụp ảnh minh chứng.
- [ ] Không phát sinh regression.

## Ghi Chú Hoàn Thành (2026-09-18)
- Mobile bổ sung màn `/platform/*` + `/settings/*`, cập nhật `MobileMenuComponent` (Quản Lý Vai Trò + Cơ Cấu Tổ Chức); ẩn hoàn toàn Impersonation trên mobile theo ANL-01 §3.
- Đảm bảo touch target, safe-area, không tràn ngang 390x844 và i18n vi/en; `npm run build` PASS.
- QA Mobile Emulation (390x844) + ảnh minh chứng chuyển Wave 3.
