# Kế Hoạch Tổng Thể Sprint 02: Super Admin & Phân Quyền Toàn Diện

- **Mã Sprint**: SPRINT-02
- **Tên Sprint**: Super Admin Platform Management, Functional RBAC & Multi-Scope Data Access Control
- **Thời Gian Thực Hiện**: 2026-10-05 đến 2026-10-19 (10 ngày làm việc)
- **Người Quản Lý**: PM Agent
- **Đội Ngũ Tham Gia**: BA Agent, Solution Architect Agent, Developer Agent, QA/QC Agent

---

## 1. Mục Tiêu Chiến Lược Của Sprint (Sprint Goal)

Thiết lập tầng quản trị vận hành tối cao của nền tảng SaaS (Super Admin) để kiểm soát các tổ chức khách thuê (Tenants), dung lượng tài nguyên và hỗ trợ kỹ thuật an toàn; đồng thời hoàn thiện hệ thống phân quyền kép của Open-ERP gồm:
1. **Phân quyền chức năng (Functional RBAC)**: Kiểm soát hành động trên từng tính năng/màn hình.
2. **Cơ cấu tổ chức (Organizational Hierarchy)**: Mô hình hóa Chi nhánh, Cây phòng ban phân cấp và Tuyến báo cáo quản lý.
3. **Phân quyền dữ liệu đa phạm vi (Multi-Scope Data Access Control)**: Giới hạn tầm nhìn dữ liệu theo 7 cấp độ và ma trận 6 thao tác tác động dữ liệu (Create, Read, Update, Delete, Export, Share), được bảo vệ tự động bằng Query Enforcement Engine ở tầng Backend Quarkus Java.

---

## 2. Phân Bổ Hạng Mục Công Việc (Scope Breakdown)

| Mã Hạng Mục | Tên Tính Năng | Mô Tả Tóm Tắt | Trọng Số | Người Phụ Trách |
| :--- | :--- | :--- | :---: | :---: |
| **FEAT-10** | Quản trị Tenant & Hạn mức | Quản lý danh sách Tenant, kích hoạt, khóa, cấu hình Quotas (Users, Storage, Plugins), gói dịch vụ | High | Dev Backend & Web |
| **FEAT-11** | Quản lý User toàn cục & Impersonation | Thư mục người dùng toàn hệ thống, khóa khẩn cấp, cưỡng chế reset, cơ chế Đăng nhập đại diện có Audit Log | Critical | Dev Backend & Web |
| **FEAT-12** | Giám sát hạ tầng & Nhật ký nền tảng | Dashboard theo dõi trạng thái DB Postgres (Master/Replica), Redis, Kafka; Audit trail hoạt động nhạy cảm | Medium | Dev Backend & Web |
| **FEAT-13** | Cơ cấu tổ chức doanh nghiệp | Quản lý Chi nhánh, Cây phòng ban cha/con, sơ đồ quản lý trực tiếp nhân viên | High | Dev Backend, Web & Mobile |
| **FEAT-14** | Ma trận Phân quyền chức năng | Danh mục quyền `domain:resource:action`, quản lý vai trò mặc định/tùy biến, gán vai trò người dùng | High | Dev Backend, Web & Mobile |
| **FEAT-15** | Phân quyền dữ liệu đa phạm vi & 6 thao tác | Ma trận dữ liệu theo 7 Scopes (All, Branch, Dept, Subordinates, Own...) và 6 thao tác (CRUD, Export, Share) | Critical | Dev Backend & Web |
| **FEAT-16** | Engine thực thi phân quyền dữ liệu tự động | Hibernate Filter / JPA Specification Interceptor tự động tiêm điều kiện SQL bảo mật chống rò rỉ | Critical | Dev Backend (Quarkus) |
| **FEAT-17** | Thực thể tham chiếu Core cho Data Permission Engine | Bảng core_sample_records + API demo/kiểm chứng 7 scopes & 6 operations | High | Dev Backend |

> **Quy ước sub-task**: `TASK-201..266` là sub-task inline trong từng file FEAT; `TASK-267..290` là task phát sinh có file riêng. Không nhảy cóc mã giữa các sprint (Sprint 01: 101–149).

---

## 3. Ràng Buộc Kỹ Thuật & Kiến Trúc (Guardrails)

1. **Phân tách ngữ cảnh Platform vs Tenant**:
   - `Super Admin` không gắn với bất kỳ `tenant_id` cụ thể nào (`tenant_id IS NULL`).
   - Token của Super Admin có claim `platform_role: "SUPER_ADMIN"`.
   - Các API `/api/v1/platform/*` chỉ chấp nhận token có `platform_role`.
2. **Quy tắc Impersonation an toàn**:
   - Thời gian tồn tại của Token Impersonate tối đa **30 phút**, không cho phép làm mới (Refresh Token bị vô hiệu hóa trong phiên impersonation).
   - Nhật ký `platform_impersonation_logs` ghi nhận bắt buộc: `super_admin_id`, `target_tenant_id`, `target_user_id`, `reason`, `ip_address`, `started_at`, `ended_at`.
   - UI hiển thị thanh banner cảnh báo cố định màu vàng: "ĐANG Ở CHẾ ĐỘ TRUY CẬP ĐẠI DIỆN HỖ TRỢ".
3. **Quy chuẩn UI Industrial Sharp & Anti-Modal**:
   - Bố cục ma trận phân quyền sử dụng thiết kế **Split-Screen** 3 cột: Cột 1 (Vai trò) $\rightarrow$ Cột 2 (Quyền chức năng) $\rightarrow$ Cột 3 (Ma trận phạm vi dữ liệu).
   - Mọi form biên tập (Tạo vai trò, Gán phòng ban, Thiết lập Quotas) mở trong **Drawer trượt cạnh phải**, hỗ trợ xếp tầng (Stacked Drawers).
4. **Chuẩn Mực API Contract Đa Ngôn Ngữ**:
   - 100% API responses trả về mã `code` dạng `UPPER_SNAKE_CASE` (ví dụ: `PLATFORM_TENANT_LOCK_SUCCESS`, `IAM_PERMISSION_DENIED_DATA_SCOPE`).
   - Dữ liệu trả về tuân thủ enum `ResponseKey`, không hardcode chuỗi tự do.
   - Token platform bắt buộc chứa claim `groups: ["SUPER_ADMIN"]` để nhận diện quyền vận hành nền tảng.
5. **Chính Sách Kiểm Thử Thực Dụng**:
   - Backend: Bắt buộc viết Unit/Integration Test (JUnit 5 + RestAssured) kết nối PostgreSQL & Redis thật.
   - Frontend: Không viết unit test; kiểm thử Dual-mode trên trình duyệt thực tế (Web Desktop $\ge$ 1280px và Mobile Emulation 390x844px).
6. **Quản lý đa chi nhánh**: BRANCH scope = union(`member_branch_ids`, `managed_branch_ids`) qua bảng `user_branch_assignments`; mỗi user có 1 primary branch dùng cho CREATE.

---

## 4. Quản Trị Rủi Ro & Giải Pháp Giảm Thiểu (Risk Management)

| Rủi Ro Nhận Diện | Mức Độ | Giải Pháp Giảm Thiểu |
| :--- | :---: | :--- |
| **Rò rỉ dữ liệu chéo khi thực thi phạm vi động** | Critical | Viết Unit Test cô lập dữ liệu chéo (Cross-Tenant & Cross-Scope Test Suite) với tối thiểu 3 tenants và 4 người dùng thuộc các cấp bậc khác nhau. |
| **Suy giảm hiệu năng khi tiêm mệnh đề WHERE phức tạp** | High | Đánh chỉ mục composite index trên PostgreSQL (`tenant_id, branch_id`, `tenant_id, department_id`, `tenant_id, created_by`), benchmark thời gian phản hồi query $< 50ms$. |
| **Lạm quyền Super Admin can thiệp dữ liệu doanh nghiệp** | High | Cơ chế Impersonation bắt buộc nhập lý do hỗ trợ, ghi log bất biến, cấm thao tác xóa vĩnh viễn dữ liệu khi đang impersonate. |
| **Xung đột khi một user thuộc nhiều vai trò có phạm vi khác nhau** | High | Áp dụng nguyên tắc **Quyền mở rộng nhất (Most Permissive / Union Rule)**: Nếu Role A cho scope `OWN_ONLY` nhưng Role B cho scope `DEPARTMENT` $\rightarrow$ Phạm vi áp dụng là `DEPARTMENT`. |

---

## 5. Tiêu Chuẩn Đóng Sprint (Definition of Done - DoD Gate)

Một Sprint chỉ được coi là hoàn thành và nghiệm thu khi:
- [ ] 100% các tính năng FEAT-10 đến FEAT-16 hoàn tất mã nguồn theo thiết kế.
- [ ] FEAT-17 (Reference Entity) hoàn tất để chứng minh Enforcement Engine hoạt động trên dữ liệu thật.
- [ ] 0 lỗi (Zero bugs) ở mức độ `Critical` và `High`.
- [ ] Bộ automated tests Backend chạy thành công 100% trên PostgreSQL và Redis thật (CẤM dùng H2).
- [ ] Kiểm thử thủ công trên trình duyệt Web Desktop và Mobile Responsive đạt 0 lỗi console (`console.error = 0`).
- [ ] Hoàn thành tài liệu Hướng dẫn sử dụng kèm hình ảnh minh họa thực tế (`docs/06_user_guides/sprint_02_superadmin_rbac_user_guide.md`).
- [ ] Khách hàng ký duyệt nghiệm thu tại `09_review/sprint_review.md`.
