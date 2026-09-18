# [BUG-73] Thiếu Quy Định Vòng Đời & CLI Quản Trị Tài Khoản Super Admin

- **Mã Lỗi**: BUG-73
- **Phân Loại**: Bug / Defect (Design Gap)
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Thiếu quy định khi nào tạo/vô hiệu hóa tài khoản Super Admin, chưa chốt cơ chế self-registration qua API công khai, và chưa có CLI quản trị (kể cả đường thoát hiểm khi mất toàn bộ admin).

- **Môi trường**: Tài liệu thiết kế Sprint 02 (giai đoạn chưa lập trình)
- **Bằng chứng (file:line)**:
  - `../05_solutions/SOL-01_superadmin_architecture_and_security.md` §1.2 — chỉ đặc tả bootstrap từ config, chưa có vòng đời (disable/enable/revoke), chưa chốt self-registration, chưa có CLI.
  - `../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md` §2.2 — bảng `platform_super_admins` chỉ có `is_active`; thiếu `status`, `must_change_password`, `two_factor_required`, `last_login_at`, `disabled_at`, `disabled_by` và CHECK ràng buộc `role`.
  - `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md` — không có endpoint grant/list/disable/enable/revoke/reset-password/disable-2FA tài khoản platform admin.
  - Không có CLI `admin-cli` hay script `scripts/platform/platform-admin-cli.bat|sh` trong thiết kế.
- **Tài Liệu Đối Chiếu**: ANL-01 §4 (BR-SA-01); SOL-01 §1.2; `.agents/rules/api_standards.md`.

## 2. Tác Động
- Không thể luân chuyển hoặc thu hồi quyền Super Admin khi nhân sự thay đổi hay tài khoản bị xâm phạm.
- Không có đường thoát hiểm khi mất quyền truy cập admin cuối cùng (lock-out) → buộc sửa CSDL thủ công, không audit, rủi ro cao.
- Mơ hồ về self-registration: nguy cơ hiện thực sai, cho phép tự nâng quyền qua API công khai.

## 3. Kết Quả Kỳ Vọng
- Chốt 3 con đường cấp Super Admin: bootstrap first-run từ config / Platform API bởi SUPER_ADMIN hiện hữu / CLI quản trị; **cấm tự đăng ký**.
- Vòng đời `INVITED → ACTIVE → DISABLED → REVOKED` với guard self-disable + last-admin.
- Bắt buộc đổi mật khẩu lần đầu + bật 2FA trước khi dùng portal.
- CLI 2 chế độ (offline command mode + remote script); mọi thao tác audit `actor_type = 'CLI'`.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [x] Solution Architect đã bổ sung thiết kế: SOL-01 §1.2 (1.2.1 → 1.2.7), DES-DB §2.2, DES-API §3.12, DES-UI §4.7, test_plan TC-BE-28 → TC-BE-32.
- [x] Đã tạo FEAT-18 + TASK-294/295/296 để theo dõi hiện thực.
- [ ] QA xác nhận sau khi hiện thực mã nguồn đạt các AC của FEAT-18 (chờ lập trình).

- **Ghi chú QA (2026-09-18)**: Đã bổ sung thiết kế đầy đủ; mã hiện thực theo TASK-294 → TASK-296. Đóng BUG ở góc độ thiết kế; QA sẽ kiểm chứng lại khi có mã nguồn.
