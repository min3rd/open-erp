# [BUG-06] Sai Key Response Giữa Frontend Và Backend (AuthUser / TenantInfo)

- **Mã Lỗi**: BUG-06
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Model frontend khai báo sai key so với response backend (`user_id`, `tenant_id`, `tenant_name`, `tenant_slug`), khiến dữ liệu tenant bị `undefined` và không thể chọn workspace.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Đăng nhập và chọn workspace tenant (FEAT-03 AC2).
- **File liên quan**:
  - `src/frontend/shared/models/api.model.ts:14-30`: `AuthUser.id` trong khi backend `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/dto/response/AuthUserInfo.java:6` trả `user_id`.
  - `TenantInfo.id/name/slug` trong khi `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/dto/response/TenantItemResponse.java:6-13` trả `tenant_id/tenant_name/tenant_slug`.
  - `src/frontend/web/src/app/features/auth/login/login.component.ts:123` gửi `tenant_id: tenant.id` → `undefined`.
- **Tài liệu đối chiếu**: DES-02 mục 2.4.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Đăng nhập bằng tài khoản thuộc từ 2 tenant trở lên.
2. Hệ thống hiển thị màn hình chọn Workspace (Workspace Picker).
3. Quan sát danh sách tenant và bấm chọn một tenant.

## 3. Kết Quả Thực Tế (Actual Result)
- Các trường `id/name/slug` của `TenantInfo` nhận giá trị `undefined` do backend trả `tenant_id/tenant_name/tenant_slug`.
- `login.component.ts:123` gửi `tenant_id: tenant.id` với giá trị `undefined` khiến chọn tenant thất bại; không thể vào workspace (FEAT-03 AC2 không đạt).

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Model frontend phải khớp key response backend theo DES-02 mục 2.4 và `AuthUserInfo.java:6` / `TenantItemResponse.java:6-13` (`user_id`, `tenant_id`, `tenant_name`, `tenant_slug`), chọn được tenant và đăng nhập vào workspace thành công.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer đã sửa xong.
- [ ] QA đã re-test và xác nhận không còn lỗi.
- [ ] Không gây lỗi phát sinh (Regression test pass).
