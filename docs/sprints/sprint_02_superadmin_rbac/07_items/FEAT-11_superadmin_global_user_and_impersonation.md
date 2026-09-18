# [FEAT-11] Quản Lý Người Dùng Toàn Cầu & Đăng Nhập Đại Diện (Impersonation)

- **Mã Tính Năng**: FEAT-11
- **Phân Loại**: Feature
- **Mức Độ Ưu Tiên**: [x] Critical
- **Người Đề Xuất**: Khách hàng / BA Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một Platform Super Admin hoặc Kỹ sư hỗ trợ, tôi muốn tra cứu danh sách người dùng toàn cầu để hỗ trợ khẩn cấp; và có thể kích hoạt phiên Đăng nhập đại diện (Impersonation / "Login-As") vào không gian của khách hàng để tái hiện và xử lý sự cố kỹ thuật theo quy trình bảo mật nghiêm ngặt.
- **Tài liệu phân tích**: [ANL-01_superadmin_platform_management.md](../02_analysis/ANL-01_superadmin_platform_management.md)
- **Tài liệu giải pháp**: [SOL-01_superadmin_architecture_and_security.md](../05_solutions/SOL-01_superadmin_architecture_and_security.md)
- **Tài liệu thiết kế**: [SUPERADMIN_RBAC_DATABASE_SCHEMA.md](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md), [SUPERADMIN_RBAC_API_SPEC.md](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md), [SUPERADMIN_RBAC_UI_SPEC.md](../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md)

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] **Kịch bản 1: Khóa tài khoản người dùng toàn cầu khẩn cấp**: Given phát hiện tài khoản user nghi ngờ gian lận hoặc bị rò rỉ thông tin, When Super Admin thực hiện lệnh khóa toàn cục, Then trạng thái user chuyển thành `LOCKED`, toàn bộ phiên đăng nhập trên Redis bị hủy, user bị đăng xuất khỏi tất cả các Tenant.
- [ ] **Kịch bản 2: Khởi tạo phiên Impersonation hợp lệ**: Given khách hàng gửi ticket hỗ trợ, When Super Admin nhập mã ticket `TCK-1024`, lý do hỗ trợ hợp lệ và mật khẩu xác nhận, Then hệ thống cấp Token đại diện có thời hạn 30 phút (không có refresh token), ghi nhận vào bảng `platform_impersonation_logs` (trạng thái `STARTED`).
- [ ] **Kịch bản 3: Hiển thị cảnh báo trực quan khi Impersonate**: Given phiên đại diện được kích hoạt thành công, When trình duyệt chuyển sang giao diện của Tenant khách hàng, Then trên cùng màn hình hiển thị thanh banner màu vàng cảnh báo liên tục kèm đồng hồ đếm ngược thời gian còn lại.
- [ ] **Kịch bản 4: Chặn hành vi phá hoại trong phiên đại diện**: Given Super Admin đang trong phiên Impersonation, When cố gắng xóa Tenant, đổi mật khẩu của Tenant Admin hoặc xóa dữ liệu nhạy cảm, Then Backend chặn đứng thao tác và trả về lỗi `SUPERADMIN_IMPERSONATION_DESTRUCTIVE_ACTION_FORBIDDEN`.
- [ ] **Kịch bản 5: Kết thúc phiên đại diện**: Given Super Admin hoàn thành hỗ trợ, When bấm nút "Kết thúc phiên", Then token đại diện bị xóa khỏi Redis, cập nhật log sang `ENDED`, giao diện đưa người dùng trở lại cổng Platform.

---

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [ ] **TASK-211**: Tạo bảng `platform_super_admins` và `platform_impersonation_logs` trong PostgreSQL.
- [ ] **TASK-212**: Xây dựng Service sinh JWT Impersonation Token trong Quarkus với claim `impersonator_id`, TTL 1800s và quản lý key trên Redis.
- [ ] **TASK-213**: Hiện thực bộ lọc `DestructiveActionFilter` chặn các thao tác xóa vĩnh viễn dữ liệu khi mang token impersonate.
- [ ] **TASK-214**: Hiện thực các API `POST /api/v1/platform/tenants/{id}/impersonate` và `POST /api/v1/platform/impersonate/exit`.
- [ ] **TASK-215**: Viết Unit/Integration Test cho toàn bộ vòng đời phiên Impersonation và kiểm tra chặn refresh token.
- [ ] **TASK-216**: Xây dựng UI `PersistentImpersonationBanner` và `ImpersonateConfirmDrawer` trên Angular Web.
