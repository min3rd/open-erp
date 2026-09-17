# Bảng Theo Dõi Nhiệm Vụ (Task Board)

Bảng này phản ánh tiến độ thực hiện các đầu việc theo quy trình SDLC 9 bước và mô hình Agile Sprint. Phụ trách quản lý: **PM Agent**.

---

## Sprint Hiện Tại: Sprint 01 - Core Identity, Access & Account Management
- Kế hoạch Sprint: [sprint_plan.md](sprints/sprint_01/sprint_plan.md)
- Thời gian: 2026-09-18 đến 2026-10-02

---

## Trạng Thái Các Nhiệm Vụ Hiện Tại

### 📥 1. Yêu Cầu Mới / Đang Tiếp Nhận (Backlog / Raw Notes)
> Nhận yêu cầu truyền miệng từ khách hàng (BA Agent)
- [x] **RAW-01**: Nhận yêu cầu 6 tính năng Core IAM từ khách hàng ([Chi tiết](../01_requirements/raw_notes/RAW-01_sprint_01_core_identity.md)).

---

### 🔍 2. Đang Phân Tích & Khảo Sát (Analysis & Benchmarking)
> BA Agent lập phân tích nghiệp vụ & khảo sát các hệ thống ERP tương tự
- [x] **ANL-01**: Phân tích nghiệp vụ chi tiết 6 tính năng Core IAM ([Chi tiết](../01_requirements/analysis/ANL-01_core_identity_access.md)).
- [x] **BENCH-01**: Khảo sát kiến trúc Multi-Tenant IAM tương tự (Odoo, Keycloak, Auth0, Supabase) ([Chi tiết](../01_requirements/benchmarks/BENCH-01_auth_identity_saas.md)).

---

### 🤝 3. Chờ Khách Hàng Xác Nhận (Customer Confirmation Pending)
> Đang chờ khách hàng xem xét và phê duyệt phạm vi / tiêu chí nghiệm thu
- [x] **CONF-01**: Biên bản xác nhận phạm vi & tiêu chí nghiệm thu Sprint 01 ([Chi tiết](../01_requirements/confirmations/CONF-01_sprint_01_scope.md)) — *Đã được khách hàng phê duyệt*.

---

### 📐 4. Nghiên Cứu & Thiết Kế Giải Pháp (Solution & Detailed Design)
> Solution Architect thiết kế DB, API, Architecture, UI
- [ ] **SOL-01**: Nghiên cứu giải pháp kiến trúc Core IAM & Multi-Tenant ([Chi tiết](../02_solutions/SOL-01_core_identity_architecture.md)).
- [ ] **DES-01**: Thiết kế CSDL PostgreSQL Multi-Tenant cho Core IAM ([Chi tiết](../03_designs/database/CORE_IAM_DATABASE_SCHEMA.md)).
- [ ] **DES-02**: Đặc tả REST API cho Core IAM ([Chi tiết](../03_designs/api/CORE_IAM_API_SPEC.md)).
- [ ] **DES-03**: Thiết kế UI/UX Anti-Modal: Drawer trượt & Split-Screen ([Chi tiết](../03_designs/ui_ux/CORE_IAM_UI_SPEC.md)).

---

### 💻 5. Đang Lập Trình (In Development)
> Developer Agent lập trình theo đúng bản thiết kế đã duyệt (Backend Quarkus Java + Angular 22 / Ionic 8)
- [ ] **FEAT-01**: Đăng ký tài khoản cá nhân ([sprints/sprint_01/items/FEAT-01_personal_registration.md](sprints/sprint_01/items/FEAT-01_personal_registration.md)).
- [ ] **FEAT-02**: Đăng ký tài khoản quản trị doanh nghiệp (Tạo Tenant) ([sprints/sprint_01/items/FEAT-02_business_registration.md](sprints/sprint_01/items/FEAT-02_business_registration.md)).
- [ ] **FEAT-03**: Đăng nhập & Xác định ngữ cảnh Tenant ([sprints/sprint_01/items/FEAT-03_authentication_login.md](sprints/sprint_01/items/FEAT-03_authentication_login.md)).
- [ ] **FEAT-04**: Quên mật khẩu & Khôi phục tài khoản ([sprints/sprint_01/items/FEAT-04_forgot_password.md](sprints/sprint_01/items/FEAT-04_forgot_password.md)).
- [ ] **FEAT-05**: Xác thực 2 yếu tố (2FA - TOTP RFC 6238) ([sprints/sprint_01/items/FEAT-05_two_factor_auth.md](sprints/sprint_01/items/FEAT-05_two_factor_auth.md)).
- [ ] **FEAT-06**: Quản lý tài khoản (Profile, Sessions, Drawer) ([sprints/sprint_01/items/FEAT-06_account_management.md](sprints/sprint_01/items/FEAT-06_account_management.md)).

---

### 🧪 6. Đang Kiểm Thử (Testing & QA)
> QA/QC Agent thực hiện kiểm thử tự động Backend và kiểm thử thủ công Browser cho Frontend
- [ ] Kế hoạch kiểm thử Sprint 01 (`docs/04_testing/test_plans/`).

---

### ✅ 7. Hoàn Thành & Đã Nghiệm Thu (Done)
- [x] **INIT-001**: Khởi tạo quy trình phát triển phần mềm chuẩn mực 9 bước và hệ thống tài liệu Docs-driven Multi-Agent SDLC.
- [x] **INIT-002**: Thiết lập môi trường Local Dev tối giản tài nguyên (Minimal Footprint Postgres Primary + Redis), bộ scripts điều phối tập trung và các tài liệu hướng dẫn bắt buộc.
- [x] **INIT-003**: Ban hành Chính Sách Kiểm Thử Thực Dụng (Zero-Unit-Test Frontend, Browser Manual QA) và Bộ Quy Chuẩn UI/UX ERP Hiện Đại (Nhỏ gọn, vuông vắn, ít margin, Anti-Modal).
