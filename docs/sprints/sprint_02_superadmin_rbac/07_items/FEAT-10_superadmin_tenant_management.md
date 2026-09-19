# [FEAT-10] Quản Trị Vòng Đời Tenant & Hạn Mức Nền Tảng (Super Admin)

- **Mã Tính Năng**: FEAT-10
- **Phân Loại**: Feature
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Đề Xuất**: Khách hàng / BA Agent
- **Người Phụ Trách**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred *(QA nghiệm thu cuối 2026-09-19 — TR-02 ĐẠT DoD Gate)*
- **Ghi Chú Wave 1 & 2 (2026-09-18)**: Wave 1 (Foundation/UI skeleton) hoàn tất 2026-09-18; Wave 2 backend APIs hoàn tất 2026-09-18; tích hợp/QA ở Wave 3.
- **Ghi Chú Wave 3 (2026-09-18)**: Wave 3 tích hợp xong (enforcement retrofit, quota call site, impersonation guard, plugin allowlist, must-change-password fix, guard SUPPORT_ENGINEER; backend 178/178 PASS, Web/Mobile build PASS); chờ QA dual-mode + sprint review để chuyển Done.

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một Platform Super Admin, tôi muốn xem danh sách toàn bộ các doanh nghiệp khách thuê (Tenants), trạng thái hoạt động, hạn mức người dùng/dung lượng, và có thể khóa/mở khóa hoặc điều chỉnh gói dịch vụ để kiểm soát vận hành nền tảng SaaS.
- **Tài liệu phân tích**: [ANL-01_superadmin_platform_management.md](../02_analysis/ANL-01_superadmin_platform_management.md)
- **Tài liệu thiết kế**: [SUPERADMIN_RBAC_DATABASE_SCHEMA.md](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md), [SUPERADMIN_RBAC_API_SPEC.md](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md), [SUPERADMIN_RBAC_UI_SPEC.md](../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md)

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **Kịch bản 1: Xem và lọc danh sách Tenant**: Given Super Admin đăng nhập vào cổng quản trị, When truy cập `/platform/tenants`, Then hệ thống hiển thị danh sách tenant kèm slug, gói dịch vụ, số user hiện tại / tối đa, dung lượng đã dùng / tối đa và trạng thái (Active, Trial, Suspended).
- [x] **Kịch bản 2: Cập nhật Quotas**: Given Super Admin mở Drawer chi tiết của Tenant A, When cập nhật `max_users = 50`, `max_storage_mb = 20480` và lưu, Then hạn mức được cập nhật ngay lập tức và ghi nhận vào `platform_audit_logs`.
- [x] **Kịch bản 3: Khóa khẩn cấp Tenant**: Given Super Admin chọn khóa Tenant B do nợ cước, When nhập lý do "Chưa thanh toán cước tháng 9" và xác nhận mật khẩu, Then trạng thái Tenant chuyển thành `SUSPENDED`, mọi API nghiệp vụ từ người dùng của Tenant B đều bị chặn với mã lỗi `TENANT_SUSPENDED`.
- [x] **Kịch bản 4: Mở khóa Tenant**: Given Tenant B đã hoàn thành thanh toán, When Super Admin thực hiện mở khóa, Then trạng thái chuyển lại `ACTIVE`, người dùng tiếp tục làm việc bình thường.

---

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [x] **TASK-201**: Bổ sung các cột hạn mức (`plan_tier`, `max_users`, `max_storage_mb`, `is_locked`, `lock_reason`) vào bảng `tenants` trong PostgreSQL.
- [x] **TASK-202**: Hiện thực API Quarkus `GET /api/v1/platform/tenants`, `PUT /api/v1/platform/tenants/{id}/quotas`, `POST /api/v1/platform/tenants/{id}/lock`.
- [x] **TASK-203**: Viết Unit/Integration Test Quarkus cho logic khóa tenant và kiểm tra chặn quyền người dùng khi tenant bị suspended.
- [x] **TASK-204**: Xây dựng màn hình danh sách Tenant trên Angular Web (`/platform/tenants`) với thiết kế Industrial Sharp, bảng mật độ cao và `TenantQuotaDrawer` trượt cạnh phải.
- [x] **TASK-205**: Tích hợp danh sách thẻ Tenant và thao tác khóa nhanh trên ứng dụng Ionic Mobile.
- [x] (xem thêm item: BUG-53, TASK-269, TASK-270, BUG-68, TASK-272, TASK-277).

---

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [x] Developer đã hoàn thành mã nguồn theo thiết kế.
- [x] QA đã kiểm thử và xác nhận đạt Acceptance Criteria.
- [x] Không gây lỗi phát sinh (Regression test pass).

---

## Ghi Chú Hoàn Thành (2026-09-19)
- **Mã nguồn**: `PlatformTenantResource` + `TenantQuotaService` + `TenantLifecycleJob` (Backend), màn `/platform/tenants` + `TenantQuotaDrawer` (Web), `/platform/emergency` read-only (Mobile) — hoàn tất qua Wave 1-3.
- **Kiểm thử tự động**: full `mvn test` **193/193 PASS** (PostgreSQL + Redis thật, không H2) — `PlatformTenantApiTest`, `TenantLifecycleJobTest`, `TenantPluginAllowlistServiceTest`, `QuotaCallSiteTest`.
- **QA nghiệm thu cuối (TR-02)**: QA-W-01/QA-W-02 (list 17 dòng, lọc trạng thái/từ khóa, quota, lock có lý do + mật khẩu, unlock), QA-R-74 + QA-R2-80 (switch plugin theo `allowed_plugins`, Lưu 2 lần không mất dữ liệu), smoke QA-SM2-W-01/W-02 PASS; console 0; overflow 0 tại 390/768.
- **Bug liên quan đã đóng**: BUG-53 (quota enforce), BUG-74/BUG-80 (plugin catalog + switch list), BUG-78/BUG-82 (lock khi còn phiên impersonation quá hạn), BUG-81 (responsive Platform).
