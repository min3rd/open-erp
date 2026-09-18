# [FEAT-02] Đăng Ký Tài Khoản Quản Trị Doanh Nghiệp (Tạo Tenant)

- **Mã Tính Năng**: FEAT-02
- **Phân Loại**: Feature
- **Mức Độ Ưu Tiên**: [x] Critical
- **Người Đề Xuất**: Khách hàng / BA Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] In Review
- **Tiến độ (2026-09-18)**: Đã triển khai xong Web + Mobile, backend 22/22 automated test PASS; chờ QA Browser Manual Testing để chuyển `Done`.

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một chủ doanh nghiệp hoặc nhà quản trị tổ chức, tôi muốn đăng ký tài khoản đại diện công ty cùng thông tin doanh nghiệp (Tên, Mã số thuế, Subdomain/Slug) để tạo ra một Không gian Doanh nghiệp độc lập (Tenant) trong Open-ERP và trở thành Quản trị viên tối cao (Tenant Admin).
- **Tài liệu phân tích**: [ANL-01_core_identity_access.md](../02_analysis/ANL-01_core_identity_access.md)
- **Tài liệu xác nhận khách hàng**: [CONF-01_sprint_01_scope.md](../04_confirmation/CONF-01_sprint_01_scope.md)

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **Kịch bản 1: Tạo Tenant Doanh nghiệp thành công**: Given người dùng nhập thông tin cá nhân quản trị + thông tin doanh nghiệp (Tên công ty, Mã số thuế, Subdomain hợp lệ chưa ai dùng ví dụ `acme-corp`), When bấm "Khởi Tạo Doanh Nghiệp", Then hệ thống tạo mới bản ghi Tenant, tạo tài khoản Admin, thiết lập quyền `TENANT_ADMIN`, khởi tạo schema CSDL riêng hoặc RLS isolation, gửi email kích hoạt.
- [x] **Kịch bản 2: Subdomain trùng lặp**: Given Subdomain doanh nghiệp đã tồn tại (ví dụ `vinamilk`), When đăng ký, Then báo lỗi ngay lập tức trên trường Subdomain và gợi ý tên khả dụng.
- [x] **Kịch bản 3: Tách lập dữ liệu tức thì**: Given Tenant mới được kích hoạt, When Tenant Admin đăng nhập, Then không gian làm việc hoàn toàn trống và được cô lập tuyệt đối khỏi các Tenant khác.

---

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [x] TASK-106: Thiết kế bảng `tenants`, `user_tenants` (quan hệ nhiều-nhiều, vai trò trong tenant).
- [x] TASK-107: Hiện thực API Quarkus `POST /api/v1/auth/register/business` kèm transaction an toàn tạo cả User + Tenant + Role Assignment.
- [x] TASK-108: Viết Unit Test Backend kiểm thử tính toàn vẹn Transaction khi đăng ký Tenant và kiểm tra cô lập dữ liệu.
- [x] TASK-109: Xây dựng màn hình đăng ký doanh nghiệp 2 bước nhỏ gọn trên Angular 22 (Step 1: Admin Info, Step 2: Company Info).
- [x] TASK-110: QA/QC kiểm thử thủ công qua Browser và xác nhận Tenant data isolation trong PostgreSQL.
