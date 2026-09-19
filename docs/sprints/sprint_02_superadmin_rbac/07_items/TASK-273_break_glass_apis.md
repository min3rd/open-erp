# [TASK-273] API Break-Glass: Force Reset Mật Khẩu & Disable 2FA

- **Mã Công Việc**: TASK-273
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục [BUG-56](BUG-56_break_glass_missing.md) — quy trình Break-Glass in-scope nhưng chưa có API/task.
- Mục tiêu: cung cấp 2 API khẩn cấp cho Super Admin với đầy đủ ràng buộc an toàn và audit.
- Tài liệu thiết kế: [ANL-01](../02_analysis/ANL-01_superadmin_platform_management.md) §2.2; [DES-02-API](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md) §2.3 (`PlatformAction`); BR-SA-04.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] API force-password-reset: yêu cầu `support_ticket` + `reason` (≥ 10 ký tự) + `confirm_password`; gửi link reset đặc biệt, không lộ token.
- [ ] API disable-2FA: yêu cầu đầy đủ 3 trường như trên; vô hiệu hóa 2FA + thu hồi phiên liên quan.
- [ ] Ghi `platform_audit_logs` với action `USER_FORCE_PASSWORD_RESET` / `USER_BREAK_GLASS_DISABLE_2FA`.
- [ ] Tuân thủ BR-SA-04 (không cho export secret/2FA/hash); guard `platform_role` đúng.
- [ ] Integration test: thiếu trường bị 400; thành công có audit; token không bị lộ trong log.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] 2 API hoạt động đúng đặc tả, trả envelope chuẩn + i18n code.
- [ ] Audit log đầy đủ actor/target/ticket/reason/IP.
- [ ] `mvn test` pass 100%; API spec cập nhật endpoint + error codes.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA chạy luồng break-glass end-to-end trên môi trường thật.
- [ ] Không phát sinh regression.

## Ghi Chú Hoàn Thành (2026-09-18)
- `PlatformUserResource` + `PlatformUserService`: `POST /platform/users/{id}/force-password-reset` và `POST /platform/users/{id}/break-glass/disable-2fa` yêu cầu `support_ticket` + `reason` + `confirm_password`; không lộ token trong log.
- Audit `USER_FORCE_PASSWORD_RESET` / `USER_BREAK_GLASS_DISABLE_2FA` với actor/target/ticket/reason/IP; email cảnh báo gửi người dùng.
- Test `PlatformUserApiTest` (thiếu trường → 400; thành công có audit) trên PostgreSQL & Redis thật.
