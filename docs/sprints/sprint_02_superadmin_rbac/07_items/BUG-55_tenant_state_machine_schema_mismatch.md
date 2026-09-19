# [BUG-55] Máy Trạng Thái Tenant Lệch Schema (Thiếu EXPIRED, Không Map SUSPENDED ↔ is_locked)

- **Mã Lỗi**: BUG-55
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> ANL-01 định nghĩa máy trạng thái Tenant đầy đủ gồm `TRIAL/ACTIVE/SUSPENDED/EXPIRED/PENDING_DELETION`, nhưng thiết kế DB chỉ thêm cờ `is_locked/trial_ends_at`, không định nghĩa trạng thái mới, không map `SUSPENDED ↔ is_locked` và không có job auto-EXPIRED.

- **Môi trường**: Backend Quarkus + PostgreSQL (Local)
- **Bằng chứng (file:line)**:
  - `../02_analysis/ANL-01_superadmin_platform_management.md:58-67` — state machine có `TRIAL→EXPIRED`, `SUSPENDED→PENDING_DELETION`.
  - `../02_analysis/ANL-01_superadmin_platform_management.md:70-77` — bảng trạng thái thiếu dòng `EXPIRED`.
  - `../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md:41-49` — chỉ `ALTER` thêm `is_locked`, `lock_reason`, `trial_ends_at`, `allowed_plugins`; không có cột/enum `status` mới, không quy tắc đồng bộ `SUSPENDED`.
  - `../02_analysis/ANL-01_superadmin_platform_management.md:183` — BR-SA-05 yêu cầu auto-EXPIRED + email + chặn thêm mới dữ liệu; chưa có task đảm nhận.
- **Tài Liệu Đối Chiếu**: ANL-01 §2.1; DES-02-DB §2.1; BR-SA-03/BR-SA-05.

## 2. Tác Động
- Trạng thái Tenant biểu diễn bằng hai nguồn (`status` cũ Sprint 1 + `is_locked` mới) dễ lệch; tenant hết hạn dùng thử không tự chuyển `EXPIRED`.

## 3. Kết Quả Kỳ Vọng
- Chốt cột `status` (hoặc enum) và quy tắc đồng bộ với `is_locked/locked_at/lock_reason`; bổ sung `EXPIRED` vào bảng trạng thái.
- Có scheduled job chuyển `TRIAL→EXPIRED` khi `trial_ends_at < NOW()` kèm email và chặn thêm mới dữ liệu (TASK-272).

## 4. Xác Nhận Khắc Phục (QA Verification)
- [ ] Thiết kế DB/state machine đã đồng bộ và map rõ `SUSPENDED`.
- [ ] Job auto-EXPIRED hoạt động đúng BR-SA-05.
- [ ] QA xác nhận bằng test trên PostgreSQL thật.

- **Ghi chú QA (2026-09-18)**: Đặc tả đã sửa (ANL-01 thêm EXPIRED; DES-DB quy tắc `is_locked ⇔ SUSPENDED`); job tự động theo TASK-272, chờ thực thi.

## Ghi Chú Hoàn Thành (2026-09-18)
- Enum `TenantStatus` (`TRIAL/ACTIVE/SUSPENDED/EXPIRED/PENDING_DELETION`) đồng bộ DB; quy tắc `is_locked ⇔ SUSPENDED` thực thi trong luồng lifecycle.
- `TenantLifecycleJob` tự động `TRIAL→EXPIRED` (BR-SA-05) và `PENDING_DELETION→DELETED`; test `TenantLifecycleJobTest` trên PostgreSQL thật.
