# [BUG-68] BR-SA-02 & BR-SA-04 Chưa Có Tiêu Chí Nghiệm Thu/Task

- **Mã Lỗi**: BUG-68
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [x] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Hai quy tắc nghiệp vụ an toàn quan trọng chưa được chuyển hóa thành Acceptance Criteria/task nào: cấm Super Admin tự khóa tài khoản mình; cấm export dữ liệu bí mật khi đang impersonate.

- **Môi trường**: Tài liệu Sprint (Local)
- **Bằng chứng (file:line)**:
  - `../02_analysis/ANL-01_superadmin_platform_management.md:180` — BR-SA-02: không cho phép Super Admin tự khóa chính tài khoản mình.
  - `../02_analysis/ANL-01_superadmin_platform_management.md:182` — BR-SA-04: cấm tải về khóa bí mật 2FA/hash mật khẩu trong phiên Impersonation.
  - `FEAT-10_superadmin_tenant_management.md` và `FEAT-11_superadmin_global_user_and_impersonation.md` — không có AC/task tương ứng.
  - `../05_solutions/SOL-01_superadmin_architecture_and_security.md:69-81` — chỉ chặn destructive actions chung, chưa bao gồm export secrets.
- **Tài Liệu Đối Chiếu**: ANL-01 §4; CONF-01 mục 4 (DoD an toàn).

## 2. Tác Động
- Super Admin có thể tự khóa gây mất quyền vận hành; phiên impersonation có thể export secret khách hàng — lỗ hổng nghiêm trọng.

## 3. Kết Quả Kỳ Vọng
- Bổ sung AC/task: chặn self-lock (lỗi rõ ràng, có test) và chặn export secret khi impersonation (`SUPERADMIN_IMPERSONATION_DESTRUCTIVE_ACTION_FORBIDDEN`).
- Cập nhật FEAT-10/FEAT-11 và test plan tương ứng.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [ ] AC/task đã được bổ sung và hiện thực.
- [ ] QA test self-lock và export secret đều bị chặn.
- [ ] Có audit log cho các lần chặn.

- **Ghi chú QA (2026-09-18)**: AC đã bổ sung vào FEAT-10/FEAT-11 và guard secret-export tại SOL-01 §2.2; chờ thực thi.

## Ghi Chú Tiến Độ (2026-09-18)
- **BR-SA-02 đã hoàn tất**: guard self-lock/self-disable (`PLATFORM_SELF_LOCK_FORBIDDEN`, `PLATFORM_SELF_DISABLE_FORBIDDEN`) + last-admin protection, có test.
- **Giữ `In Progress` — BR-SA-04 chưa xong**: chưa có guard backend chặn export secret/2FA/hash khi đang trong phiên impersonation (chưa tồn tại mã `SUPERADMIN_IMPERSONATION_SECRET_EXPORT_FORBIDDEN`/`SUPERADMIN_IMPERSONATION_DESTRUCTIVE_ACTION_FORBIDDEN` trong `src/`).
- Chuyển **Wave 3**: hiện thực guard + audit các lần chặn + QA test export secret trong impersonation.
