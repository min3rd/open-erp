# [BUG-65] Guard Xác Thực Platform Chưa Khớp Claim `platform_role` & Chưa Guard Token Impersonation

- **Mã Lỗi**: BUG-65
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Giải pháp dùng `@RolesAllowed("SUPER_ADMIN")` nhưng Quarkus SmallRye JWT mặc định đọc nhóm quyền từ claim `groups`, trong khi token platform chỉ mang claim `platform_role`; chưa cấu hình ánh xạ claim. Endpoint `/platform/impersonate/exit` nhận token impersonation cũng chưa được định nghĩa guard.

- **Môi trường**: Backend Quarkus (Local)
- **Bằng chứng (file:line)**:
  - `../05_solutions/SOL-01_superadmin_architecture_and_security.md:42` — yêu cầu `@RolesAllowed("SUPER_ADMIN")` hoặc `@PlatformAdminOnly`.
  - `src/backend/src/main/resources/application.properties:24-33` — không có `smallrye.jwt.path.groups.claim=platform_role` hay cấu hình tương đương.
  - `../sprint_plan.md:37-39` — token Super Admin có claim `platform_role`, API `/platform/*` chỉ chấp nhận token này.
  - `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md:250-262` — §3.5 xác thực bằng impersonation token nhưng không mô tả guard.
- **Tài Liệu Đối Chiếu**: SOL-01 §1.1; ANL-01 §2.3.

## 2. Tác Động
- `@RolesAllowed` không hoạt động với token platform (403 oan) hoặc lọt qua nếu guard khác thiếu; token impersonation có thể gọi sai endpoint.

## 3. Kết Quả Kỳ Vọng
- Cấu hình ánh xạ claim `platform_role` (hoặc custom filter/guard) đảm bảo `/platform/*` chỉ SUPER_ADMIN vào được.
- Định nghĩa guard riêng cho `/platform/impersonate/exit` chấp nhận impersonation token hợp lệ.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [ ] Cấu hình claim/guard hoàn tất và được kiểm thử.
- [ ] Token thường → 403 `PLATFORM_ACCESS_DENIED` (khớp TC-BE-01).
- [ ] QA xác nhận exit impersonation hoạt động đúng.

- **Ghi chú QA (2026-09-18)**: Đặc tả đã chốt claim `groups: ["SUPER_ADMIN"]` + guard exit (SOL-01 §1.1/§2.1, API header §3); cần thực thi trong token service/filter.
