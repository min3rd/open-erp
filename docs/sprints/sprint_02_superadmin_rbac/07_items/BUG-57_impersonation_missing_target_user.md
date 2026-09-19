# [BUG-57] API Impersonation Thiếu `target_user_id` & Quy Tắc Chọn Người Dùng Đích

- **Mã Lỗi**: BUG-57
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Schema bắt buộc `platform_impersonation_logs.target_user_id NOT NULL` và token impersonation mang `sub` = user đích, nhưng API khởi tạo phiên không nhận `target_user_id` cũng không định nghĩa quy tắc chọn user đích.

- **Môi trường**: Backend Quarkus + PostgreSQL (Local)
- **Bằng chứng (file:line)**:
  - `../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md:78` — `target_user_id UUID NOT NULL REFERENCES users(id)`.
  - `../05_solutions/SOL-01_superadmin_architecture_and_security.md:52` — token có `"sub": "user-uuid-of-tenant-admin-or-target"`.
  - `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md:226-231` — request body §3.4 chỉ có `support_ticket`, `reason`, `confirm_password`.
  - `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md:240-246` — response không trả `target_user_id`.
- **Tài Liệu Đối Chiếu**: ANL-01 §2.3; DES-02-DB §2.3; SOL-01 §2.1.

## 2. Tác Động
- Backend không biết gán `target_user_id` nào để ghi log và ký token; nếu tự chọn ngầm sẽ không minh bạch, dễ sai ngữ cảnh hỗ trợ.

## 3. Kết Quả Kỳ Vọng
- Bổ sung `target_user_id` (tùy chọn) vào request và quy tắc mặc định rõ ràng (ví dụ Tenant Owner/Admin đang hoạt động) khi bỏ trống.
- Response trả `target_user_id`; audit log khớp `target_tenant_id` + `target_user_id`.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [ ] API spec + implementation đã bổ sung `target_user_id` và quy tắc chọn.
- [ ] Audit log ghi đúng target user.
- [ ] QA xác nhận token `sub` khớp `target_user_id`.

- **Ghi chú QA (2026-09-18)**: Đặc tả đã cập nhật (API §3.4 nhận `target_user_id`, SOL-01 quy tắc mặc định TENANT_OWNER); chờ thực thi mã.

## Ghi Chú Hoàn Thành (2026-09-18)
- `ImpersonationService` nhận `target_user_id` (bỏ trống → mặc định Tenant Owner/Admin đang hoạt động), token impersonation mang `sub` = user đích + claim `act_sub`; response trả `target_user_id`.
- Audit `platform_impersonation_logs` khớp `target_tenant_id` + `target_user_id`; giới hạn ≤30 phút, log start/exit; test `ImpersonationApiTest`.
