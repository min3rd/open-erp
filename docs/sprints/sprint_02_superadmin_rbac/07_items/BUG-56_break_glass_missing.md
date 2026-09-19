# [BUG-56] Thiếu API/Task Cho Cơ Chế Break-Glass (Force Reset Mật Khẩu & Disable 2FA)

- **Mã Lỗi**: BUG-56
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Break-Glass Recovery là cam kết in-scope với Super Admin, đã có mã hành động trong enum `PlatformAction`, nhưng không tồn tại API, task hay AC nào hiện thực quy trình khẩn cấp này.

- **Môi trường**: Backend Quarkus (Local)
- **Bằng chứng (file:line)**:
  - `../04_confirmation/CONF-01_sprint_02_scope.md:19` — in-scope "cơ chế hỗ trợ phá kính (Break-Glass Recovery)".
  - `../02_analysis/ANL-01_superadmin_platform_management.md:96-99` — quy trình xác minh offline, vô hiệu hóa 2FA hoặc gửi link đặt lại mật khẩu đặc biệt, bắt buộc ticket + lý do.
  - `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md:121-122` — enum có `USER_FORCE_PASSWORD_RESET`, `USER_BREAK_GLASS_DISABLE_2FA` nhưng §3 không có endpoint tương ứng.
  - `FEAT-11_superadmin_global_user_and_impersonation.md` — không có AC/sub-task break-glass.
- **Tài Liệu Đối Chiếu**: ANL-01 §2.2; CONF-01 mục 1.2; BR-SA-04.

## 2. Tác Động
- Khi Tenant Owner mất thiết bị 2FA/backup codes, không có đường khôi phục hợp lệ; nguy cơ xử lý thủ công thủ công ngoài audit.

## 3. Kết Quả Kỳ Vọng
- API force-password-reset + disable-2FA yêu cầu `support_ticket` + `reason` + `confirm_password`, ghi `platform_audit_logs`, tuân thủ BR-SA-04.
- Có test integration cho luồng break-glass thành công và bị chặn khi thiếu điều kiện.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer đã hiện thực API (TASK-273).
- [ ] Audit log ghi nhận đầy đủ actor/target/ticket/reason.
- [ ] QA re-test luồng break-glass end-to-end.

- **Ghi chú QA (2026-09-18)**: Đặc tả Break-Glass đã bổ sung (TASK-273 + API spec); chờ thực thi mã.

## Ghi Chú Hoàn Thành (2026-09-18)
- API break-glass đã hiện thực: `POST /platform/users/{id}/force-password-reset` + `POST /platform/users/{id}/break-glass/disable-2fa` (bắt buộc `support_ticket` + `reason` + `confirm_password`) — TASK-273.
- Audit `USER_FORCE_PASSWORD_RESET` / `USER_BREAK_GLASS_DISABLE_2FA` đầy đủ actor/target/ticket/reason/IP; test `PlatformUserApiTest` trên PostgreSQL & Redis thật.
