# [BUG-31] Migration Lệch Thiết Kế DES-01 (JSONB, Index, OTP Trong Redis)

- **Mã Lỗi**: BUG-31
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Migration khởi tạo schema lệch so với thiết kế DES-01 ở 3 điểm: kiểu dữ liệu `backup_codes_hash`, thiếu index `idx_tenants_type`, và lưu OTP xác thực email trong PostgreSQL thay vì Redis.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Core IAM — Schema CSDL (FEAT-01, FEAT-05).
- **File liên quan**:
  - `src/backend/src/main/resources/db/migration/V1.0.0__init_core_iam_schema.sql:65` — `backup_codes_hash TEXT DEFAULT '[]'`; trong khi DES-01 mục 2.5 quy định `backup_codes_hash JSONB DEFAULT '[]'::jsonb`.
  - `src/backend/src/main/resources/db/migration/V1.0.0__init_core_iam_schema.sql:19-20` — chỉ có `idx_tenants_slug`, `idx_tenants_status`; thiếu `idx_tenants_type` mà DES-01 mục 2.1 yêu cầu.
  - `src/backend/src/main/resources/db/migration/V1.0.0__init_core_iam_schema.sql:28-29` — bảng `users` chứa `verification_otp`, `verification_otp_expires_at`; trong khi DES-01 mục 4 quy định OTP xác thực email lưu trong Redis (`otp:verify:{user_id}`, TTL 15 phút), và DES-01 mục 2.2 không khai báo 2 cột này.
- **Tài liệu đối chiếu**:
  - DES-01 mục 2.1, 2.2, 2.5 và mục 4 (`docs/sprints/sprint_01_core_iam/06_designs/database/CORE_IAM_DATABASE_SCHEMA.md:47,58,63-73,107,151-160`).
  - CONF-01 mục 3 — mục 4 "Bảo mật nền tảng": chốt lưu trữ tạm thời (OTP xác thực email, pre-auth token, session, token blacklist) trong Redis.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Khởi chạy `make infra` và để Flyway chạy migration `V1.0.0__init_core_iam_schema.sql`.
2. Kiểm tra cấu trúc: `\d user_two_factor`, `\d tenants`, `\d users` trên PostgreSQL.
3. Đối chiếu từng điểm với DES-01 mục 2.1, 2.2, 2.5 và mục 4.

## 3. Kết Quả Thực Tế (Actual Result)
- `user_two_factor.backup_codes_hash` là `TEXT` (migration dòng 65), không phải `JSONB` như DES-01 mục 2.5.
- Không tồn tại index `idx_tenants_type` trên bảng `tenants`.
- OTP xác thực email (`verification_otp`, `verification_otp_expires_at`, migration dòng 28-29) lưu trực tiếp trong PostgreSQL, trái với quy định OTP lưu Redis kèm TTL của DES-01 mục 4.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Cập nhật migration để đồng bộ với DES-01: chuyển `backup_codes_hash` sang `JSONB`, bổ sung `idx_tenants_type`, loại bỏ 2 cột OTP khỏi bảng `users` và chuyển logic OTP sang Redis.
- Nếu `V1.0.0` đã được áp dụng tại môi trường nào đó, phải tạo migration phiên bản mới để chuyển đổi an toàn (không sửa migration đã chạy).
- Nếu có quyết định thiết kế mới khác DES-01, phải cập nhật lại DES-01 tương ứng — thiết kế và migration bắt buộc đồng bộ.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- **Ghi chú QA (2026-09-18)**: Migration V1.0.3: backup_codes_hash → JSONB, thêm idx_tenants_type, xóa 2 cột OTP khỏi users; DB verify đúng.
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
