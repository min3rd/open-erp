# [BUG-58] Thiếu Cơ Chế Bootstrap Tài Khoản Super Admin Đầu Tiên (BR-SA-01)

- **Mã Lỗi**: BUG-58
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> BR-SA-01 quy định quyền `SUPER_ADMIN` được cấp qua cấu hình máy chủ hoặc bảng `platform_super_admins`, nhưng không có seed/config/CLI nào tạo Super Admin đầu tiên — hệ thống không thể truy cập cổng `/platform/*`.

- **Môi trường**: Backend Quarkus + PostgreSQL (Local/Staging)
- **Bằng chứng (file:line)**:
  - `../02_analysis/ANL-01_superadmin_platform_management.md:179` — BR-SA-01: cấp qua cấu hình máy chủ hoặc `platform_super_admins`.
  - `../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md:56-70` — bảng `platform_super_admins` tồn tại nhưng không có dữ liệu khởi tạo.
  - `src/backend/src/main/resources/application.properties` — không có cấu hình bootstrap email/platform admin.
  - Không có migration seed hay tài liệu deployment mô tả cách cấp Super Admin.
- **Tài Liệu Đối Chiếu**: ANL-01 §4 (BR-SA-01); `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md` §3 (guard `platform_role`).

## 2. Tác Động
- Không thể vận hành portal nền tảng sau triển khai mới; phải sửa DB thủ công, không an toàn và không có audit.

## 3. Kết Quả Kỳ Vọng
- Seed idempotent khi startup từ config `openerp.platform.bootstrap-emails`.
- Có tài liệu deployment hướng dẫn cấu hình và xác minh quyền Super Admin.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer đã hiện thực bootstrap (TASK-274).
- [ ] Bootstrap idempotent — chạy lại không sinh bản ghi trùng.
- [ ] QA xác nhận tài khoản bootstrap đăng nhập được portal platform.

- **Ghi chú QA (2026-09-18)**: Cơ chế bootstrap đã đặc tả (SOL-01 §1.2, TASK-274); chờ thực thi.

## Ghi Chú Hoàn Thành (2026-09-18)
- `PlatformBootstrapService` seed idempotent từ `openerp.platform.bootstrap-emails` + `OPENERP_ADMIN_BOOTSTRAP_SECRET`; chạy lại không sinh bản ghi trùng, email tồn tại thì nâng cấp tài khoản hiện hữu.
- Tài khoản bootstrap đăng nhập được portal platform (test `PlatformAuthApiTest`); hướng dẫn cấu hình/secret đã ghi trong tài liệu deployment.
