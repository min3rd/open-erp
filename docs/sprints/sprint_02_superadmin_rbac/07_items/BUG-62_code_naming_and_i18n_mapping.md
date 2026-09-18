# [BUG-62] Mã Code Không Nhất Quán & Thiếu Bảng i18n Mapping Đầy Đủ

- **Mã Lỗi**: BUG-62
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Cùng một hành vi khóa Tenant nhưng API code và audit action dùng tên khác nhau; chưa có bảng mapping code → i18n key đầy đủ cho Frontend; bộ key UI spec quá ít so với số code API.

- **Môi trường**: Tài liệu Sprint (Local)
- **Bằng chứng (file:line)**:
  - `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md:19` + `../sprint_plan.md:49` — `SUPERADMIN_TENANT_LOCKED_SUCCESS` đã hết trong tài liệu live (hiện dùng `PLATFORM_TENANT_LOCK_SUCCESS`).
  - `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md:211` — `PLATFORM_TENANT_LOCK_SUCCESS` (§3.3).
  - `../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md:99` + `../05_solutions/SOL-01_superadmin_architecture_and_security.md:112` — audit action `TENANT_SUSPEND`, trong khi API:319 dùng `TENANT_LOCK`.
  - `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md` — không có bảng mapping `code` → i18n key cho 100% responses.
  - `../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md:135-153` — chỉ 17 key, không phủ hết code API.
- **Tài Liệu Đối Chiếu**: `.agents/rules/api_standards.md` (Code-based i18n Contract); `AGENTS.md` (Zero-Hardcode / ResponseKey).

## 2. Tác Động
- Frontend không dịch được một số code; audit/tra cứu log khó thống kê do action khác tên.

## 3. Kết Quả Kỳ Vọng
- Chốt một mã chuẩn duy nhất cho mỗi hành vi (success code + audit action) trên toàn bộ tài liệu.
- Bổ sung bảng mapping code → i18n key cho toàn bộ response/error của Sprint 02 (Web + Mobile).

## 4. Xác Nhận Khắc Phục (QA Verification)
- [x] Tài liệu đã thống nhất bộ mã code/audit action.
- [x] Bảng i18n mapping đầy đủ, không còn code thiếu key.
- [x] QA/PM xác nhận không còn xung đột mã.

- **Ghi chú QA (2026-09-18)**: Đã chuẩn hóa mã `PLATFORM_TENANT_LOCK_SUCCESS/UNLOCK_SUCCESS` + bảng i18n DES-API §6; xung đột action `TENANT_SUSPEND/TENANT_LOCK` đã sửa tại SOL-01 §3.2 và DES-DB; hoàn tất.
