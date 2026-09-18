# [BUG-45] Lệch Mã Lỗi DES-02 Cho API Tái Tạo Backup Codes

- **Mã Lỗi**: BUG-45
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [ ] Medium / [x] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Đặc tả DES-02 mục 3.1 ghi API `regenerate-backup-codes` trả mã lỗi `ACCOUNT_PASSWORD_REQUIRED`, nhưng code thực tế trả `ACCOUNT_OLD_PASSWORD_INCORRECT` — tài liệu và hành vi API không đồng bộ.

- **Môi trường**: Local
- **Tính Năng / Module Bị Ảnh Hưởng**: Quản lý tài khoản — Tái tạo bộ mã dự phòng 2FA (FEAT-06).
- **File Liên Quan**:
  - `docs/sprints/sprint_01_core_iam/06_designs/api/CORE_IAM_API_SPEC.md:387` — bảng 3.1 ghi mã lỗi `ACCOUNT_PASSWORD_REQUIRED`.
  - `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/service/TwoFactorService.java:190` — ném `ApiException(401, ErrorCode.ACCOUNT_OLD_PASSWORD_INCORRECT, ...)` khi mật khẩu sai.
- **Tài Liệu Đối Chiếu**: DES-02 mục 3.1 và 3.2.5; AGENTS.md — "Chuẩn Mực API Contract Đa Ngôn Ngữ".

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Gọi `POST /api/v1/account/2fa/regenerate-backup-codes` với `current_password` sai.
2. Đọc trường `code` trong response lỗi.
3. Đối chiếu với bảng tổng hợp endpoint tại DES-02 mục 3.1.

## 3. Kết Quả Thực Tế (Actual Result)
- Response trả `code = "ACCOUNT_OLD_PASSWORD_INCORRECT"` trong khi DES-02 mục 3.1 quy định `ACCOUNT_PASSWORD_REQUIRED`.
- Không có hằng số `ACCOUNT_PASSWORD_REQUIRED` được dùng trong luồng này, dễ gây nhầm lẫn khi FE map i18n.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Thống nhất một mã lỗi duy nhất giữa DES-02 và code:
  - Hoặc cập nhật DES-02 mục 3.1 sang `ACCOUNT_OLD_PASSWORD_INCORRECT` (khớp `TwoFactorService` và `change-password`), hoặc
  - Sửa code trả `ACCOUNT_PASSWORD_REQUIRED` nếu đó mới là thiết kế đúng.
- Đảm bảo cả Web/Mobile có key i18n cho mã được chốt.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
```
POST /api/v1/account/2fa/regenerate-backup-codes { "current_password": "wrong" }
-> 401 { "success": false, "code": "ACCOUNT_OLD_PASSWORD_INCORRECT" }
DES-02 3.1 expected: ACCOUNT_PASSWORD_REQUIRED
```

## 6. Xác Nhận Khắc Phục (QA Verification)
- **Ghi chú QA (2026-09-18)**: Cập nhật DES-02 mục 3.1 sang ACCOUNT_OLD_PASSWORD_INCORRECT (khớp code thực tế).
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
