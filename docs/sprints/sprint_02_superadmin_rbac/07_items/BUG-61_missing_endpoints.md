# [BUG-61] Thiếu Nhiều Endpoint Bắt Buộc (Platform, IAM, Organization)

- **Mã Lỗi**: BUG-61
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Đặc tả và FEAT thiếu nhiều endpoint bắt buộc để hoàn thành luồng nghiệp vụ in-scope; UI không thể hiển thị/thao tác dù AC đã cam kết.

- **Môi trường**: Backend Quarkus (Local)
- **Bằng chứng (file:line)**:
  - `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md:134-168` — chỉ có list tenant, thiếu `GET /platform/tenants/{id}` (tenant detail).
  - `../04_confirmation/CONF-01_sprint_02_scope.md:18-19` — cần user directory, global lock/unlock, force reset + disable 2FA: chưa có endpoint.
  - `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md:609-629` — §5.5 chỉ có gán role, thiếu GET user roles + DELETE role khỏi user + GET role users.
  - `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md:341-447` — thiếu `DELETE` branch/department, không có move department, membership chỉ có POST (thiếu GET/PUT/DELETE).
  - `../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md:72-92` — có bảng `platform_impersonation_logs` nhưng không có API list.
  - Ma trận data-policy cần catalog resource (`GET /api/v1/iam/data-resources`) — chưa có trong §5.
- **Tài Liệu Đối Chiếu**: CONF-01 mục 1; UI spec §2.1, §3.

## 2. Tác Động
- Không thể hoàn thiện UI/Audit/Quản trị theo cam kết Sprint; nhiều màn hình không có API tương ứng.

## 3. Kết Quả Kỳ Vọng
- Bổ sung đầy đủ endpoint: tenant detail; user directory/search; global lock/unlock; break-glass; impersonation logs list; user roles list/remove; branch delete; department delete/move; membership list/update/remove; data-resource catalog.
- Endpoint mới tuân thủ 4 khuôn mẫu response và `ResponseKey` enum.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer hoàn tất TASK-277, TASK-278, TASK-279, TASK-282.
- [ ] API spec được cập nhật tương ứng.
- [ ] QA kiểm thử contract từng endpoint mới.

- **Ghi chú QA (2026-09-18)**: Các endpoint thiếu đã được đặc tả (API §3.8-3.11, §4, §5); triển khai theo TASK-277/TASK-278/TASK-279/TASK-282.

## Ghi Chú Hoàn Thành (2026-09-18)
- Đã hiện thực đầy đủ nhóm endpoint còn thiếu: tenant detail, user directory + lock/unlock, break-glass, impersonation logs; user roles list/remove + role users + `GET /iam/users`; branch/department delete, department move, membership list/update/remove; data-resource catalog.
- TASK-277/278/279/282 hoàn tất; 100% endpoint dùng envelope 4 khuôn mẫu + `ResponseKey`/mã i18n; test API-level tương ứng trên PostgreSQL thật.
