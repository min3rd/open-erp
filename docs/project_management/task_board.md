# Bảng Theo Dõi Nhiệm Vụ (Task Board)

Bảng này phản ánh tiến độ thực hiện các đầu việc theo quy trình SDLC 9 bước và mô hình Agile Sprint. Phụ trách quản lý: **PM Agent**.

---

## Sprint Hiện Tại: Sprint 01 - Core Identity, Access & Account Management
- **Bản đồ đọc tuần tự**: [00_READING_GUIDE.md](../sprints/sprint_01_core_iam/00_READING_GUIDE.md)
- Kế hoạch Sprint: [sprint_plan.md](../sprints/sprint_01_core_iam/sprint_plan.md)
- Thời gian: 2026-09-18 đến 2026-10-02

---

## Trạng Thái Các Nhiệm Vụ Hiện Tại

### 📥 1. Yêu Cầu Mới / Đang Tiếp Nhận (01_raw_notes)
> Nhận yêu cầu truyền miệng từ khách hàng (BA Agent)
- [x] **RAW-01**: Nhận yêu cầu 6 tính năng Core IAM từ khách hàng ([Chi tiết](../sprints/sprint_01_core_iam/01_raw_notes/RAW-01_sprint_01_core_identity.md)).
- [x] **RAW-02**: Nhận yêu cầu bổ sung Đăng ký & Xóa 2FA trong Quản lý tài khoản ([Chi tiết](../sprints/sprint_01_core_iam/01_raw_notes/RAW-02_account_2fa_management.md)).

---

### 🔍 2. Đang Phân Tích & Khảo Sát (02_analysis & 03_benchmarks)
> BA Agent lập phân tích nghiệp vụ & khảo sát các hệ thống ERP tương tự
- [x] **ANL-01**: Phân tích nghiệp vụ chi tiết 6 tính năng Core IAM ([Chi tiết](../sprints/sprint_01_core_iam/02_analysis/ANL-01_core_identity_access.md)).
- [x] **BENCH-01**: Khảo sát kiến trúc Multi-Tenant IAM tương tự (Odoo, Keycloak, Auth0, Supabase) ([Chi tiết](../sprints/sprint_01_core_iam/03_benchmarks/BENCH-01_auth_identity_saas.md)).

---

### 🤝 3. Chờ Khách Hàng Xác Nhận (04_confirmation)
> Đang chờ khách hàng xem xét và phê duyệt phạm vi / tiêu chí nghiệm thu
- [x] **CONF-01**: Biên bản xác nhận phạm vi & tiêu chí nghiệm thu Sprint 01 ([Chi tiết](../sprints/sprint_01_core_iam/04_confirmation/CONF-01_sprint_01_scope.md)) — *Đã được khách hàng phê duyệt*.

---

### 📐 4. Nghiên Cứu & Thiết Kế Giải Pháp (05_solutions & 06_designs)
> Solution Architect thiết kế DB, API, Architecture, UI
- [x] **SOL-01**: Nghiên cứu giải pháp kiến trúc Core IAM & Multi-Tenant ([Chi tiết](../sprints/sprint_01_core_iam/05_solutions/SOL-01_core_identity_architecture.md)).
- [x] **DES-01**: Thiết kế CSDL PostgreSQL Multi-Tenant cho Core IAM ([Chi tiết](../sprints/sprint_01_core_iam/06_designs/database/CORE_IAM_DATABASE_SCHEMA.md)).
- [x] **DES-02**: Đặc tả REST API cho Core IAM ([Chi tiết](../sprints/sprint_01_core_iam/06_designs/api/CORE_IAM_API_SPEC.md)).
- [x] **DES-03**: Thiết kế UI/UX Anti-Modal: Drawer trượt & Split-Screen ([Chi tiết](../sprints/sprint_01_core_iam/06_designs/ui_ux/CORE_IAM_UI_SPEC.md)).

---

### 💻 5. Đang Lập Trình (07_items & src/)
> Developer Agent lập trình theo đúng bản thiết kế đã duyệt (Backend Quarkus Java + Angular 22 / Ionic 8)
- [x] **FEAT-01**: Đăng ký tài khoản cá nhân ([Chi tiết](../sprints/sprint_01_core_iam/07_items/FEAT-01_personal_registration.md)).
- [x] **FEAT-02**: Đăng ký tài khoản quản trị doanh nghiệp (Tạo Tenant) ([Chi tiết](../sprints/sprint_01_core_iam/07_items/FEAT-02_business_registration.md)).
- [x] **FEAT-03**: Đăng nhập & Xác định ngữ cảnh Tenant ([Chi tiết](../sprints/sprint_01_core_iam/07_items/FEAT-03_authentication_login.md)).
- [x] **FEAT-04**: Quên mật khẩu & Khôi phục tài khoản ([Chi tiết](../sprints/sprint_01_core_iam/07_items/FEAT-04_forgot_password.md)).
- [x] **FEAT-05**: Xác thực 2 yếu tố (2FA - TOTP RFC 6238) ([Chi tiết](../sprints/sprint_01_core_iam/07_items/FEAT-05_two_factor_auth.md)).
- [x] **FEAT-06**: Quản lý tài khoản (Profile, 2FA Management, Sessions qua Drawer Anti-Modal) ([Chi tiết](../sprints/sprint_01_core_iam/07_items/FEAT-06_account_management.md)).

---

### 🧪 6. Đang Kiểm Thử (Testing & QA)
> QA/QC Agent thực hiện kiểm thử tự động Backend và kiểm thử thủ công Browser cho Frontend
- [x] Kế hoạch kiểm thử Sprint 01 ([test_plan.md](../sprints/sprint_01_core_iam/08_testing/test_plan.md)).
- [x] **Code Review Sprint 01 (REV-02)**: [Báo cáo review mã nguồn](../sprints/sprint_01_core_iam/09_review/CODE_REVIEW_SPRINT_01.md) — kết quả `mvn test` PASS 10/10 (PostgreSQL thật), `ng build` PASS; phát hiện **9 Critical + 14 High + 8 Medium**.
- [x] **Xử lý BUG-01 → BUG-23 (Critical/High)**: đã sửa toàn bộ; backend 22/22 automated test PASS, Web + Mobile build PASS ([QA_RETEST_SPRINT_01.md](../sprints/sprint_01_core_iam/09_review/QA_RETEST_SPRINT_01.md)).
- [x] **BUG-32, BUG-33 (High phát sinh khi QA)**: sửa hủy session chéo người dùng + lỗi 4xx thành 500; test TC-14b/TC-16 PASS.
- [x] **Triển khai môi trường Local cho QA**: Backend 8088 + Web 4200 + Mobile 8100 + Mailpit 8025 đang chạy; smoke E2E PASS (đăng ký → OTP Mailpit → xác thực → login → profile → refresh → logout). Hướng dẫn: [manual_test_guide.md](../sprints/sprint_01_core_iam/08_testing/manual_test_guide.md).
- [x] **BUG-35 → BUG-37 (từ manual test khách hàng)**: thiếu `@source` Tailwind cho thư viện shared (BUG-35), dark mode chưa đồng nhất (BUG-36), trạng thái UI chưa route hóa (BUG-37) - đã sửa + browser verify (Web 7/7, Mobile 18/18). Chi tiết: [manual_test_guide.md](../sprints/sprint_01_core_iam/08_testing/manual_test_guide.md).
- [x] **BUG-38 → BUG-40 (sự cố môi trường dev)**: test tách DB `openerp_test` (không còn xóa dữ liệu dev), script `.bat` không tạo file rác, login với token cũ hiển thị đúng lỗi i18n; thêm `dev.bat`/`stop-dev.bat`. Chi tiết: [work_log.md](work_log.md).
- [x] **Xử lý toàn bộ tồn đọng Medium/Low (BUG-24→31, 34, 42→45)**: chuẩn hóa TenantType, ResponseKey, Entity Registry, schema JSONB V1.0.3, 401 envelope, CORS prod, i18n mã lỗi, test 30/30, form 2 bước + live slug check; browser verify 6/6.
- [ ] **QA Browser Manual Testing (Web + Mobile)**: bám theo [manual_test_guide.md](../sprints/sprint_01_core_iam/08_testing/manual_test_guide.md), kiểm tra Drawer/QR/i18n/Anti-Modal/Routing/Dark mode, không lỗi console → chuyển 13 item `In Review` sang `Done`.
- [x] **Tài liệu `docs/06_user_guides/`**: đã ban hành UG-01 Core IAM kèm 20 ảnh minh họa (Web light/dark + Mobile).
- [x] **FEAT-07 (yêu cầu bổ sung khi QA)**: tối ưu Web cho điện thoại (390px không tràn ngang), hamburger + Mobile Nav Drawer (tài khoản/menu/language/theme/logout), theme System/Light/Dark persist; puppeteer 40/40 + 11/11 PASS ([FEAT-07](../sprints/sprint_01_core_iam/07_items/FEAT-07_responsive_phone_and_mobile_nav.md)).
- [x] **FEAT-08 (yêu cầu bổ sung)**: Ionic Mobile side menu (tài khoản/menu/language/theme/logout), theme class-based Sáng/Tối/Hệ thống persist, toolbar gọn, auth pages có switcher; puppeteer 42/42 + 22/22 PASS ([FEAT-08](../sprints/sprint_01_core_iam/07_items/FEAT-08_ionic_mobile_menu_theme.md)).
- [x] **FEAT-09 (yêu cầu bổ sung)**: tối ưu 8 màn auth Ionic cho phone (touch target ≥40px, safe-area, không tràn ngang) + chuyển toàn bộ điều hướng sang NavController (forward/back/root, replaceUrl) để back/forward mượt; puppeteer 34/34 PASS ([FEAT-09](../sprints/sprint_01_core_iam/07_items/FEAT-09_ionic_auth_ux_and_navigation.md)).

---

### ✅ 7. Hoàn Thành & Đã Nghiệm Thu (Done)
- [x] **INIT-001**: Khởi tạo quy trình phát triển phần mềm chuẩn mực 9 bước và hệ thống tài liệu Docs-driven Multi-Agent SDLC.
- [x] **INIT-002**: Thiết lập môi trường Local Dev tối giản tài nguyên (Minimal Footprint Postgres Primary + Redis), bộ scripts điều phối tập trung và các tài liệu hướng dẫn bắt buộc.
- [x] **INIT-003**: Ban hành Chính Sách Kiểm Thử Thực Dụng (Zero-Unit-Test Frontend, Browser Manual QA) và Bộ Quy Chuẩn UI/UX ERP Hiện Đại (Nhỏ gọn, vuông vắn, ít margin, Anti-Modal).
