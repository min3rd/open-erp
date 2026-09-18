# [BUG-24] Lệch Bộ Giá Trị Enum TenantType Giữa Backend, Migration Và Frontend

- **Mã Lỗi**: BUG-24
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Bộ giá trị `TenantType` không thống nhất giữa Backend, Migration và Frontend, đồng thời lệch so với thiết kế đã được khách hàng xác nhận (`BUSINESS | PERSONAL`).

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Core IAM — Tenant/Workspace (FEAT-01, FEAT-02).
- **File liên quan**:
  - `src/backend/src/main/java/com/vn9melody/openerp/core/enums/TenantType.java:3-5` khai báo `PERSONAL, ORGANIZATION`.
  - `src/backend/src/main/resources/db/migration/V1.0.0__init_core_iam_schema.sql:10` khai báo `type VARCHAR(32) NOT NULL DEFAULT 'ORGANIZATION'`.
  - `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/service/AuthService.java:143` gán `TenantType.ORGANIZATION` khi tạo tenant doanh nghiệp.
  - `src/frontend/shared/enums/auth.enum.ts:10-11` khai báo `PERSONAL | ORGANIZATION`.
- **Tài liệu đối chiếu**:
  - DES-01 mục 2.1 (`docs/sprints/sprint_01_core_iam/06_designs/database/CORE_IAM_DATABASE_SCHEMA.md:47`) quy định `type ... DEFAULT 'BUSINESS' -- BUSINESS, PERSONAL`.
  - CONF-01 mục 3 (`docs/sprints/sprint_01_core_iam/04_confirmation/CONF-01_sprint_01_scope.md:59`) chốt `tenants.type = 'PERSONAL' | 'BUSINESS'`.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Mở và đối chiếu 3 nguồn: `TenantType.java:3-5`, migration `V1.0.0__init_core_iam_schema.sql:10`, `auth.enum.ts:10-11`.
2. Gọi API `POST /api/v1/auth/register/business` để tạo tenant doanh nghiệp.
3. Truy vấn `SELECT slug, type FROM tenants;` sau khi tạo.

## 3. Kết Quả Thực Tế (Actual Result)
- Tenant doanh nghiệp được lưu với `type = 'ORGANIZATION'` (`AuthService.java:143`) thay vì `'BUSINESS'` theo thiết kế.
- Cột `tenants.type` có default `'ORGANIZATION'` (migration dòng 10), không có giá trị `'BUSINESS'` ở bất kỳ tầng nào.
- Frontend enum `TenantType` cũng chỉ có `PERSONAL | ORGANIZATION`, mọi so sánh/lọc theo `BUSINESS` trong tương lai sẽ sai.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Thống nhất một bộ giá trị duy nhất theo thiết kế đã confirm (ưu tiên `BUSINESS | PERSONAL`):
  - Cập nhật `TenantType.java` (thêm/xóa giá trị cho khớp) và các chỗ sử dụng như `AuthService.java:143`.
  - Cập nhật migration: default `'BUSINESS'` (ưu tiên tạo migration mới để chuyển đổi dữ liệu `'ORGANIZATION'` cũ nếu đã áp dụng).
  - Cập nhật `src/frontend/shared/enums/auth.enum.ts` đồng bộ 1-1 với Backend.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- **Ghi chú QA (2026-09-18)**: Đã chuẩn hóa TenantType = PERSONAL|BUSINESS + alias ORGANIZATION; migration V1.0.1 đổi dữ liệu/default; DB verify chỉ còn PERSONAL/BUSINESS.
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
