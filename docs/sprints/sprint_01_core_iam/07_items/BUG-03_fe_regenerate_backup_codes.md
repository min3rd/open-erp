# [BUG-03] Sai Endpoint Và Sai Kiểu Dữ Liệu Khi Tạo Lại Mã Dự Phòng 2FA

- **Mã Lỗi**: BUG-03
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Chức năng tạo lại mã dự phòng 2FA gọi sai endpoint và parse sai kiểu dữ liệu trả về, gây lỗi runtime.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Quản lý tài khoản — Tạo lại mã dự phòng 2FA (FEAT-06 AC5).
- **File liên quan**:
  - `src/frontend/web/src/app/core/services/account.service.ts:44` gọi `/api/v1/account/2fa/backup-codes/regenerate` — sai so với backend.
  - Backend đúng: `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/resource/AccountResource.java:111` (`/api/v1/account/2fa/regenerate-backup-codes`), DES-02 mục 3.2.5.
  - Model khai báo `ApiResponse<string[]>` nhưng backend trả `BackupCodesResponse { backup_codes: [...] }`.
  - `src/frontend/web/src/app/features/dashboard/account-drawer/account-drawer.component.ts:188` gọi `res.data.join('\n')` → lỗi runtime.
- **Tài liệu đối chiếu**: DES-02 mục 3.2.5, FEAT-06 AC5.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Đăng nhập và mở Drawer Quản lý tài khoản.
2. Bật 2FA cho tài khoản.
3. Bấm nút "Tạo lại mã dự phòng" và nhập mật khẩu hiện tại.

## 3. Kết Quả Thực Tế (Actual Result)
- Request trả `404 Not Found` do sai endpoint `/api/v1/account/2fa/backup-codes/regenerate`.
- Khi backend trả dữ liệu, `res.data.join('\n')` tại `account-drawer.component.ts:188` gây lỗi runtime vì `res.data` là object `{ backup_codes: [...] }` chứ không phải mảng chuỗi.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Frontend gọi đúng `POST /api/v1/account/2fa/regenerate-backup-codes` theo DES-02 mục 3.2.5 và `AccountResource.java:111`.
- Frontend khai báo kiểu trả về tương ứng `BackupCodesResponse { backup_codes: string[] }` và hiển thị đúng danh sách mã dự phòng mới.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng automated browser test (puppeteer: routing/deep-link 7/7, login + token cũ 3/3, form 2 bước + live slug check + 2FA redirect 6/6, console 0 lỗi), Mobile smoke 18/18 PASS, Web/Mobile build PASS; ảnh minh chứng tại docs/06_user_guides/assets/sprint_01_core_iam/. Nghiệm thu cuối của khách hàng thực hiện khi đóng Sprint.
