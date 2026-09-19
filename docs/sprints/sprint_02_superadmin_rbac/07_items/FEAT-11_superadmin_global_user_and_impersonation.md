# [FEAT-11] Quản Lý Người Dùng Toàn Cầu & Đăng Nhập Đại Diện (Impersonation)

- **Mã Tính Năng**: FEAT-11
- **Phân Loại**: Feature
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Đề Xuất**: Khách hàng / BA Agent
- **Người Phụ Trách**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred *(QA nghiệm thu cuối 2026-09-19 — TR-02 ĐẠT DoD Gate)*
- **Ghi Chú Wave 1 & 2 (2026-09-18)**: Wave 1 (Foundation/UI skeleton) hoàn tất 2026-09-18; Wave 2 backend APIs hoàn tất 2026-09-18; tích hợp/QA ở Wave 3.
- **Ghi Chú Wave 3 (2026-09-18)**: Wave 3 tích hợp xong (enforcement retrofit, quota call site, impersonation guard, plugin allowlist, must-change-password fix, guard SUPPORT_ENGINEER; backend 178/178 PASS, Web/Mobile build PASS); chờ QA dual-mode + sprint review để chuyển Done.

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một Platform Super Admin hoặc Kỹ sư hỗ trợ, tôi muốn tra cứu danh sách người dùng toàn cầu để hỗ trợ khẩn cấp; và có thể kích hoạt phiên Đăng nhập đại diện (Impersonation / "Login-As") vào không gian của khách hàng để tái hiện và xử lý sự cố kỹ thuật theo quy trình bảo mật nghiêm ngặt.
- **Tài liệu phân tích**: [ANL-01_superadmin_platform_management.md](../02_analysis/ANL-01_superadmin_platform_management.md)
- **Tài liệu giải pháp**: [SOL-01_superadmin_architecture_and_security.md](../05_solutions/SOL-01_superadmin_architecture_and_security.md)
- **Tài liệu thiết kế**: [SUPERADMIN_RBAC_DATABASE_SCHEMA.md](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md), [SUPERADMIN_RBAC_API_SPEC.md](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md), [SUPERADMIN_RBAC_UI_SPEC.md](../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md)

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **Kịch bản 1: Khóa tài khoản người dùng toàn cầu khẩn cấp**: Given phát hiện tài khoản user nghi ngờ gian lận hoặc bị rò rỉ thông tin, When Super Admin thực hiện lệnh khóa toàn cục, Then trạng thái user chuyển thành `LOCKED`, toàn bộ phiên đăng nhập trên Redis bị hủy, user bị đăng xuất khỏi tất cả các Tenant.
- [x] **Kịch bản 2: Khởi tạo phiên Impersonation hợp lệ**: Given khách hàng gửi ticket hỗ trợ, When Super Admin nhập mã ticket `TCK-1024`, lý do hỗ trợ hợp lệ và mật khẩu xác nhận, Then hệ thống cấp Token đại diện có thời hạn 30 phút (không có refresh token), ghi nhận vào bảng `platform_impersonation_logs` (trạng thái `STARTED`).
- [x] **Kịch bản 3: Hiển thị cảnh báo trực quan khi Impersonate**: Given phiên đại diện được kích hoạt thành công, When trình duyệt chuyển sang giao diện của Tenant khách hàng, Then trên cùng màn hình hiển thị thanh banner màu vàng cảnh báo liên tục kèm đồng hồ đếm ngược thời gian còn lại.
- [x] **Kịch bản 4: Chặn hành vi phá hoại trong phiên đại diện**: Given Super Admin đang trong phiên Impersonation, When cố gắng xóa Tenant, đổi mật khẩu của Tenant Admin hoặc xóa dữ liệu nhạy cảm, Then Backend chặn đứng thao tác và trả về lỗi `SUPERADMIN_IMPERSONATION_DESTRUCTIVE_ACTION_FORBIDDEN`.
- [x] **Kịch bản 5: Kết thúc phiên đại diện**: Given Super Admin hoàn thành hỗ trợ, When bấm nút "Kết thúc phiên", Then token đại diện bị xóa khỏi Redis, cập nhật log sang `ENDED`, giao diện đưa người dùng trở lại cổng Platform.

---

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [x] **TASK-211**: Tạo bảng `platform_super_admins` và `platform_impersonation_logs` trong PostgreSQL.
- [x] **TASK-212**: Xây dựng Service sinh JWT Impersonation Token trong Quarkus với claim `impersonator_id`, TTL 1800s và quản lý key trên Redis.
- [x] **TASK-213**: Hiện thực bộ lọc `DestructiveActionFilter` chặn các thao tác xóa vĩnh viễn dữ liệu khi mang token impersonate.
- [x] **TASK-214**: Hiện thực các API `POST /api/v1/platform/tenants/{id}/impersonate` và `POST /api/v1/platform/impersonate/exit`.
- [x] **TASK-215**: Viết Unit/Integration Test cho toàn bộ vòng đời phiên Impersonation và kiểm tra chặn refresh token.
- [x] **TASK-216**: Xây dựng UI `PersistentImpersonationBanner` và `ImpersonateConfirmDrawer` trên Angular Web.
- [x] (xem thêm item: BUG-56, BUG-57, TASK-273, TASK-274, BUG-68, TASK-277, FEAT-18, TASK-294, TASK-295).

---

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [x] Developer đã hoàn thành mã nguồn theo thiết kế.
- [x] QA đã kiểm thử và xác nhận đạt Acceptance Criteria.
- [x] Không gây lỗi phát sinh (Regression test pass).

---

## Ghi Chú Hoàn Thành (2026-09-19)
- **Mã nguồn**: Platform user list + lock/unlock/force-reset + Break-Glass APIs; Impersonation (JWT `act_sub`, TTL ≤1800s không refresh token, banner đếm ngược, exit, chặn thao tác phá hoại `SUPERADMIN_IMPERSONATION_DESTRUCTIVE_ACTION_FORBIDDEN`) trên Backend + Web; Mobile không hỗ trợ impersonation.
- **Kiểm thử tự động**: `mvn test` **193/193 PASS** — `PlatformUserApiTest`, `ImpersonationApiTest`, `ImpersonationTimeoutJobTest`, `PlatformPasswordChangeGuardTest` (TC-BE-19).
- **QA nghiệm thu cuối (TR-02)**: QA-W-03 (20 users + Break-Glass drawer), QA-W-04/QA-R-75 (banner đếm ngược giảm theo giây; API org/iam 200 trong phiên; Exit → token cũ 401), QA-R2-78/82 (phiên quá hạn tự đóng `TIMEOUT` trên worker thread + audit `IMPERSONATION_TIMEOUT`), QA-R-76 (đổi mật khẩu bắt buộc, token cũ bị chặn) PASS; console 0.
- **Bug liên quan đã đóng**: BUG-56, BUG-57, BUG-68, BUG-69, BUG-75, BUG-76, BUG-78, BUG-82.
