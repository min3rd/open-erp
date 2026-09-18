# Bảng Theo Dõi Nhiệm Vụ (Task Board)

Bảng này phản ánh tiến độ thực hiện các đầu việc theo quy trình SDLC 9 bước và mô hình Agile Sprint. Phụ trách quản lý: **PM Agent**.

---

## Sprint Hiện Tại: Sprint 02 - Super Admin & Phân Quyền Toàn Diện (RBAC & Multi-Scope Data Access)
- **Bản đồ đọc tuần tự**: [00_READING_GUIDE.md](../sprints/sprint_02_superadmin_rbac/00_READING_GUIDE.md)
- Kế hoạch Sprint: [sprint_plan.md](../sprints/sprint_02_superadmin_rbac/sprint_plan.md)
- Thời gian: 2026-10-05 đến 2026-10-19
- **Trạng thái**: [x] ĐÃ HOÀN THÀNH TÀI LIỆU THIẾT KẾ (Bước 1 - Bước 6) & CHỜ KHÁCH HÀNG PHÊ DUYỆT (CONFIRMATION GATE)

---

## Các Sprint Đã Hoàn Thành
- **Sprint 01 - Core Identity, Access & Account Management**: [00_READING_GUIDE.md](../sprints/sprint_01_core_iam/00_READING_GUIDE.md) — [x] ĐÃ ĐÓNG (2026-09-18).

---

## Trạng Thái Các Nhiệm Vụ Sprint 02

### 📥 1. Yêu Cầu Mới / Đang Tiếp Nhận (01_raw_notes)
> Nhận yêu cầu truyền miệng từ khách hàng (BA Agent)
- [x] **RAW-01**: Yêu cầu cơ chế Super Admin quản lý toàn bộ hệ thống ([Chi tiết](../sprints/sprint_02_superadmin_rbac/01_raw_notes/RAW-01_superadmin_platform_management.md)).
- [x] **RAW-02**: Yêu cầu phân quyền chức năng, cơ cấu tổ chức và phân quyền dữ liệu đa phạm vi ([Chi tiết](../sprints/sprint_02_superadmin_rbac/01_raw_notes/RAW-02_functional_rbac_and_data_scopes.md)).

---

### 🔍 2. Đang Phân Tích & Khảo Sát (02_analysis & 03_benchmarks)
> BA Agent lập phân tích nghiệp vụ & khảo sát các hệ thống ERP tương tự
- [x] **ANL-01**: Phân tích nghiệp vụ Super Admin, Tenant Quotas, Impersonation có kiểm toán ([Chi tiết](../sprints/sprint_02_superadmin_rbac/02_analysis/ANL-01_superadmin_platform_management.md)).
- [x] **ANL-02**: Phân tích nghiệp vụ Phân quyền chức năng, 7 phạm vi dữ liệu và 6 thao tác dữ liệu ([Chi tiết](../sprints/sprint_02_superadmin_rbac/02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md)).
- [x] **BENCH-01**: Khảo sát đối chuẩn Odoo Record Rules, Salesforce Sharing Model, SAP Authorization Objects ([Chi tiết](../sprints/sprint_02_superadmin_rbac/03_benchmarks/BENCH-01_superadmin_and_multi_scope_rbac.md)).

---

### 🤝 3. Chờ Khách Hàng Xác Nhận (04_confirmation)
> Đang chờ khách hàng xem xét và phê duyệt phạm vi / tiêu chí nghiệm thu
- [x] **CONF-01**: Biên bản xác nhận phạm vi & tiêu chí nghiệm thu Sprint 02 ([Chi tiết](../sprints/sprint_02_superadmin_rbac/04_confirmation/CONF-01_sprint_02_scope.md)) — *Đang mở chờ khách hàng ký duyệt (Confirmation Gate)*.

---

### 📐 4. Nghiên Cứu & Thiết Kế Giải Pháp (05_solutions & 06_designs)
> Solution Architect thiết kế DB, API, Architecture, UI
- [x] **SOL-01**: Nghiên cứu kiến trúc Super Admin, an toàn Impersonation và Audit Trail bất biến ([Chi tiết](../sprints/sprint_02_superadmin_rbac/05_solutions/SOL-01_superadmin_architecture_and_security.md)).
- [x] **SOL-02**: Nghiên cứu giải pháp Enforcement Engine tự động lọc dữ liệu trong Quarkus Java ([Chi tiết](../sprints/sprint_02_superadmin_rbac/05_solutions/SOL-02_rbac_and_data_scope_enforcement_engine.md)).
- [x] **DES-02-DB**: Thiết kế CSDL PostgreSQL 10 bảng mới cho Super Admin, Cơ cấu tổ chức & Phân quyền ([Chi tiết](../sprints/sprint_02_superadmin_rbac/06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md)).
- [x] **DES-02-API**: Đặc tả REST API chuẩn hóa 100% Code-based i18n contract ([Chi tiết](../sprints/sprint_02_superadmin_rbac/06_designs/api/SUPERADMIN_RBAC_API_SPEC.md)).
- [x] **DES-02-UI**: Thiết kế UI/UX Industrial Sharp, Ma trận phân quyền Split-Screen & Anti-Modal Drawer ([Chi tiết](../sprints/sprint_02_superadmin_rbac/06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md)).

---

### 💻 5. Phân Rã Nhiệm Vụ Triển Khai (07_items)
- [ ] **FEAT-10**: Quản trị Tenant & Hạn mức nền tảng ([Chi tiết](../sprints/sprint_02_superadmin_rbac/07_items/FEAT-10_superadmin_tenant_management.md)).
- [ ] **FEAT-11**: Quản lý User toàn cầu & Đăng nhập đại diện Impersonation ([Chi tiết](../sprints/sprint_02_superadmin_rbac/07_items/FEAT-11_superadmin_global_user_and_impersonation.md)).
- [ ] **FEAT-12**: Giám sát hạ tầng & Nhật ký nền tảng ([Chi tiết](../sprints/sprint_02_superadmin_rbac/07_items/FEAT-12_superadmin_system_health_and_audit.md)).
- [ ] **FEAT-13**: Cơ cấu tổ chức doanh nghiệp ([Chi tiết](../sprints/sprint_02_superadmin_rbac/07_items/FEAT-13_organization_hierarchy_structure.md)).
- [ ] **FEAT-14**: Ma trận Phân quyền chức năng ([Chi tiết](../sprints/sprint_02_superadmin_rbac/07_items/FEAT-14_functional_rbac_matrix.md)).
- [ ] **FEAT-15**: Phân quyền dữ liệu đa phạm vi & 6 thao tác ([Chi tiết](../sprints/sprint_02_superadmin_rbac/07_items/FEAT-15_multi_scope_data_access_control.md)).
- [ ] **FEAT-16**: Engine thực thi phân quyền dữ liệu tự động Backend ([Chi tiết](../sprints/sprint_02_superadmin_rbac/07_items/FEAT-16_data_permission_enforcement_engine.md)).

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
- [x] **QA Browser Manual Testing (Web + Mobile)**: bám theo [manual_test_guide.md](../sprints/sprint_01_core_iam/08_testing/manual_test_guide.md), kiểm tra Drawer/QR/i18n/Anti-Modal/Routing/Dark mode, không lỗi console; chuyển 13 item `In Review` sang `Done`; khách hàng nghiệm thu (2026-09-18).
- [x] **Tài liệu `docs/06_user_guides/`**: đã ban hành UG-01 Core IAM kèm 20 ảnh minh họa (Web light/dark + Mobile).
- [x] **FEAT-07 (yêu cầu bổ sung khi QA)**: tối ưu Web cho điện thoại (390px không tràn ngang), hamburger + Mobile Nav Drawer (tài khoản/menu/language/theme/logout), theme System/Light/Dark persist; puppeteer 40/40 + 11/11 PASS ([FEAT-07](../sprints/sprint_01_core_iam/07_items/FEAT-07_responsive_phone_and_mobile_nav.md)).
- [x] **FEAT-08 (yêu cầu bổ sung)**: Ionic Mobile side menu (tài khoản/menu/language/theme/logout), theme class-based Sáng/Tối/Hệ thống persist, toolbar gọn, auth pages có switcher; puppeteer 42/42 + 22/22 PASS ([FEAT-08](../sprints/sprint_01_core_iam/07_items/FEAT-08_ionic_mobile_menu_theme.md)).
- [x] **FEAT-09 (yêu cầu bổ sung)**: tối ưu 8 màn auth Ionic cho phone (touch target ≥40px, safe-area, không tràn ngang) + chuyển toàn bộ điều hướng sang NavController (forward/back/root, replaceUrl) để back/forward mượt; puppeteer 34/34 PASS ([FEAT-09](../sprints/sprint_01_core_iam/07_items/FEAT-09_ionic_auth_ux_and_navigation.md)).
- [x] **BUG-47 (hậu kiểm API)**: chuẩn hóa 4 khuôn mẫu API (validation errors, sessions items, data:null, errors typed); backend 34/34 test PASS, curl verify PASS ([BUG-47](../sprints/sprint_01_core_iam/07_items/BUG-47_api_contract_violations.md)).
- [x] **BUG-48 (hậu kiểm bảo mật)**: enforce mật khẩu mạnh (@Pattern) + VALIDATION_PASSWORD_TOO_WEAK; backend 36/36 test PASS ([BUG-48](../sprints/sprint_01_core_iam/07_items/BUG-48_password_complexity_not_enforced.md)).

---

### ✅ 7. Hoàn Thành & Đã Nghiệm Thu (Done)
- [x] **INIT-001**: Khởi tạo quy trình phát triển phần mềm chuẩn mực 9 bước và hệ thống tài liệu Docs-driven Multi-Agent SDLC.
- [x] **INIT-002**: Thiết lập môi trường Local Dev tối giản tài nguyên (Minimal Footprint Postgres Primary + Redis), bộ scripts điều phối tập trung và các tài liệu hướng dẫn bắt buộc.
- [x] **INIT-003**: Ban hành Chính Sách Kiểm Thử Thực Dụng (Zero-Unit-Test Frontend, Browser Manual QA) và Bộ Quy Chuẩn UI/UX ERP Hiện Đại (Nhỏ gọn, vuông vắn, ít margin, Anti-Modal).

---

## Sprint 01 - Kết Quả Đóng Sprint (2026-09-18)
- 46/46 BUG Done; FEAT-01 → FEAT-09 Done.
- `mvn test` 30/30 PASS (PostgreSQL + Redis thật); Web + Mobile build PASS.
- QA browser/mobile automation PASS; khách hàng nghiệm thu.
- Tài liệu: UG-01 (25 ảnh), TR-01 Test Report, Entity Registry Core IAM.
- **Sprint 02**: sẽ khởi tạo Sprint-Pack mới theo cùng quy trình.

---

## Sprint 02 - Super Admin & Phân Quyền Toàn Diện (2026-10-05 → 2026-10-19) - SẴN SÀNG LẬP TRÌNH
- **Bản đồ đọc tuần tự**: [00_READING_GUIDE.md](../sprints/sprint_02_superadmin_rbac/00_READING_GUIDE.md)
- **Kế hoạch Sprint**: [sprint_plan.md](../sprints/sprint_02_superadmin_rbac/sprint_plan.md)
- **Confirmation Gate**: [x] **ĐÃ ĐƯỢC KHÁCH HÀNG PHÊ DUYỆT ngày 2026-09-18** (gồm 9 mục Phụ lục rà soát) — [CONF-01](../sprints/sprint_02_superadmin_rbac/04_confirmation/CONF-01_sprint_02_scope.md)
- **Backlog**: **64 item** trong [07_items/](../sprints/sprint_02_superadmin_rbac/07_items/) — FEAT-10 → FEAT-18; BUG-49 → BUG-73; TASK-267 → TASK-296.
- **Ưu tiên triển khai**: Critical trước (FEAT-11 Impersonation, FEAT-15 Data Scopes, FEAT-16 Enforcement Engine + Reference Entity FEAT-17, RBAC runtime TASK-267) → High → Medium.
- **Trạng thái**: [x] Gate đã duyệt → **chuyển sang Bước 7 (Lập trình)**; 0 bug mở mức Critical/High trước khi bắt đầu (backlog hiện là các item cần thực thi, không phải bug tồn đọng).
- **DoD Gate Sprint 02**: 0 bug Critical/High; backend tests 100% PASS trên PostgreSQL + Redis thật; Dual-mode Browser QA 0 console error; UG-02 kèm ảnh; khách hàng ký `sprint_review.md`.
