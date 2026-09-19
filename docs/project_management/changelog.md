# Lịch Sử Thay Đổi Dự Án (Changelog)

Tất cả các thay đổi quan trọng trong dự án sẽ được ghi nhận tại file này theo định dạng chuẩn [Keep a Changelog](https://keepachangelog.com/). Phụ trách: **PM Agent**.

---

## [Unreleased]

### Sprint 01 - ĐÃ ĐÓNG (2026-09-18)
- Core IAM hoàn chỉnh: Đăng ký cá nhân/doanh nghiệp, Đăng nhập & chọn Workspace, Quên mật khẩu, 2FA TOTP, Quản lý tài khoản trên Web (Angular 22) + Mobile (Ionic 8).
- Chất lượng: 46/46 BUG Done; backend 30/30 test PASS; Web/Mobile build PASS; Theme Sáng/Tối/Hệ thống; responsive điện thoại.
- Tài liệu: UG-01 User Guide (25 ảnh), TR-01 Test Report, Entity Registry.

### Sprint 02 - CONFIRMATION GATE ĐÃ ĐƯỢC PHÊ DUYỆT (2026-09-18) - SẴN SÀNG LẬP TRÌNH
- Khách hàng đã ký duyệt `CONF-01` + toàn bộ **9 mục Phụ lục rà soát**; Confirmation Gate chính thức ĐÓNG, Sprint 02 chuyển sang Bước 7 (Lập trình).
- Tài liệu đã rà soát & đồng bộ: 22+ tài liệu BA/PM + Kiến trúc (7 Data Scopes, RBAC runtime `@RequirePermission`, quota enforcement, Break-Glass APIs, role-source migration, Tenant state machine + EXPIRED, Multi-Branch Manager, Audit Log Storage hash chain/partition, Super Admin Lifecycle + CLI, endpoint/i18n mapping/test cases, Flyway V2 + integrity constraints, guard FE/Mobile).
- Backlog: **65 item** trong `07_items/` (`BUG-49→73`, `TASK-267→297`, `FEAT-10→18`) — TASK-297 (guard SUPPORT_ENGINEER) bổ sung đầu Wave 3.
- **Wave 1 (Foundation) hoàn tất 2026-09-18**: Flyway `V2.0.0` + `V2.0.1` (13 bảng mới + partition audit tháng; seed 24 permissions, 5 system roles, 16 user_roles, 14 primary branch assignments); Entity Registry 20 entity; `/q/health` UP (Database + Redis); backend `mvn test` 51/51 PASS; Web + Mobile build PASS (i18n 578/316 key parity).
- **Wave 2 (Backend APIs + Enforcement Engine) hoàn tất 2026-09-18**: Enforcement Engine (`UserSecurityContext` Redis `sec:ctx` TTL 15 phút, `@RequirePermission` + `PermissionEnforcementFilter`, 7 Data Scope, `TenantQuotaService`, Reference Entity `/api/v1/core/sample-records`); Platform APIs (login `platform_role`, impersonation ≤30 phút, tenants/users/health, audit hash chain SHA-256 + verifier + partition/retention, admins lifecycle + CLI, tenant lifecycle job); Organization/IAM APIs (cây tổ chức, memberships/branch assignments, roles CRUD, role-permissions, user-role, data-resources/data-policies, cross-tenant guards). Full `mvn test` **157/157 PASS** (PostgreSQL + Redis thật); Web + Mobile build PASS; **48/64 item Done** (12 In Progress, 4 To Do).
- **Wave 3 (Tích hợp enforcement + sửa vòng lặp mật khẩu + guard SUPPORT_ENGINEER) hoàn tất 2026-09-18**: retrofit `@RequirePermission` toàn bộ IAM/Organization + API legacy (`PermissionRetrofitApiTest`, `AuditWiringTest`); quota call site thật `AuthService.registerBusiness/verifyEmail/resolveTenantAndIssueToken` → `AccountService.enforceUserQuota` (409 `PLATFORM_TENANT_QUOTA_EXCEEDED`); guard `@BlockDuringImpersonation` (403 `SUPERADMIN_IMPERSONATION_SECRET_EXPORT_FORBIDDEN`) cho export/change-password/2FA; plugin allowlist `TenantPluginAllowlistService` (403 canonical `PLATFORM_PLUGIN_NOT_ALLOWED`); fix vòng lặp `PLATFORM_PASSWORD_CHANGE_REQUIRED` (clear cờ + allowlist + audit `PLATFORM_ADMIN_PASSWORD_CHANGED`); guard SUPPORT_ENGINEER đồng bộ Web/Mobile; FE role matrix dùng GET thật, user picker `GET /iam/users`, guard đọc claim `permissions`, trang must-change-password. Full `mvn test` **178/178 PASS** (PostgreSQL + Redis thật); Web + Mobile build PASS; **55/65 item Done** (10 In Progress, 0 To Do).

### Sprint 02 - ĐÃ ĐÓNG (2026-09-19) - DoD Gate PASS
- **Nghiệm thu cuối (TR-02)**: fix & xác nhận PASS toàn bộ bug High còn lại — **BUG-78/82** (job sweeper impersonation chạy worker thread, phiên quá hạn tự đóng `TIMEOUT` + audit, 0 lỗi JTA/IO thread), **BUG-80** (catalog plugin tùy chọn + switch sales/unknown-x, không mất dữ liệu khi lưu), **BUG-81** (Web Platform hết tràn ngang 54px, Drawer full-width 390); nâng cấp **FEAT-19** (Canvas graph ~60 FPS, cây 405 node, zoom/pan/F5), **FEAT-20** (plugin list dọc + search + đếm X/Y), **TASK-298** (13 màn × 390/768 overflow 0) → Done. Phát sinh **BUG-83** (Medium, touch target shared topbar/nav) — FE đã fix + build PASS.
- **Kiểm chứng**: full `mvn test` **193/193 PASS** (PostgreSQL + Redis thật, không H2); Web + Mobile build PASS; **239 ảnh QA**, **0 console error**, overflow 0 toàn bộ; **0 Critical/High** mở.
- **Đóng gói tài liệu**: **REV-02** sprint review (demo checklist, retrospective, tồn đọng); **UG-02** User Guide kèm **27 ảnh** (`docs/06_user_guides/sprint_02_superadmin_rbac_user_guide.md`); cập nhật deployment guide (bootstrap secret/emails, plugin catalog, TTL impersonation, jobs nền, CLI `admin-cli`, timezone UTC); chuyển FEAT-10→18 sang `Done`, TASK-293 → `Deferred`.
- **Kết quả item**: **77/78 Done** (BUG-49→83: 35; FEAT-10→20: 11; TASK-267→298: 31), **1 Deferred** (TASK-293 Medium), 0 `To Do`/`In Progress`.

### Known Issues
- Không còn issue mở cho Sprint 01 (đã đóng 2026-09-18).
- Sprint 02: **77/78 item Done**; **1 `Deferred`** (TASK-293 — cold archive audit MongoDB/S3 WORM + legal hold, Medium, cần Docker Compose profile `mongo`/`storage`); **0 `To Do`/`In Progress`**; **0 bug mở mức Critical/High** (toàn bộ BUG-49→83 đã Done). Sprint 02 đã **ĐÓNG theo DoD Gate ngày 2026-09-19**, chờ chữ ký nghiệm thu khách hàng tại REV-02.
- Tồn đọng chuyển Sprint 03: TASK-293 (cold archive); API mời/thêm thành viên (quota hiện enforce ở luồng đăng ký); storage quota (chờ module upload); Remote CLI script + subcommand mở rộng; QA re-measure BUG-83 runtime.

### Fixed
- BUG-51/TASK-267: Enforce quyền chức năng runtime toàn bộ IAM/Organization + API legacy (403 `IAM_PERMISSION_DENIED_FUNCTIONAL`); self-profile `GET/PUT /account/profile` default-allow có chủ đích.
- BUG-53: Wire quota call site thật trong luồng đăng ký (409 `PLATFORM_TENANT_QUOTA_EXCEEDED`, params `{limit, current}`).
- BUG-68: Chặn export secret/đổi mật khẩu/2FA trong phiên impersonation (403 `SUPERADMIN_IMPERSONATION_SECRET_EXPORT_FORBIDDEN`).
- TASK-270: Enforce plugin allowlist (403 canonical `PLATFORM_PLUGIN_NOT_ALLOWED`, audit `PLUGIN_ACCESS_DENIED`).
- Sửa vòng lặp `PLATFORM_PASSWORD_CHANGE_REQUIRED`: clear cờ sau đổi mật khẩu + allowlist `POST /account/change-password`/`GET /account/profile`, audit `PLATFORM_ADMIN_PASSWORD_CHANGED`.
- TASK-297: Đồng bộ guard platform Web/Mobile cho SUPPORT_ENGINEER (read-only, `/platform/admins` chỉ SUPER_ADMIN).
- BUG-74: Bổ sung `allowed_plugins` vào danh sách tenant để Drawer Hạn mức không ghi đè mất plugin.
- BUG-75: Impersonation token mang `session_id`, gọi được API org/iam trong phiên.
- BUG-76: Token cũ bị chặn sau đổi mật khẩu bắt buộc + tự điều hướng về `/login`.
- BUG-77: Toggle mobile đạt touch target ≥40px (44×40).
- BUG-78: Sửa vòng lặp phiên impersonation quá hạn chặn khóa tenant (đóng lại sau fix BUG-82).
- BUG-79: Timestamp hiển thị theo timezone/locale người dùng (+7h với `Asia/Ho_Chi_Minh`, null `—`).
- BUG-80: Catalog plugin config-driven `openerp.platform.plugin-catalog` + merge catalog, switch tùy chọn hoạt động.
- BUG-81: Web Platform hết tràn ngang tại 390×844 (+54px → 0), Drawer full-width.
- BUG-82: `ImpersonationTimeoutJob` chạy worker thread, phiên quá hạn tự đóng `TIMEOUT` + audit, hết lỗi JTA IO thread.
- BUG-83: Shared topbar hamburger + nav Settings đạt touch target ≥40px tại ≤639px (FE fix, build PASS; QA re-measure runtime Sprint 03).
- BUG-48: Enforce độ phức tạp mật khẩu (hoa+thường+số+đặc biệt) cho đăng ký cá nhân/doanh nghiệp và đặt lại mật khẩu; trả VALIDATION_PASSWORD_TOO_WEAK.
- BUG-47: Chuẩn hóa API contract 4 khuôn mẫu - validation errors[{field,code,params}], sessions data.items, envelope luôn có data (null), malformed JSON code.
- Sửa toàn bộ liên kết hỏng và chuẩn hóa đường dẫn theo cấu trúc Sprint-Pack (00-09) trong `docs/`, templates, changelog, work log và file quy tắc `.agents/`.
- Đồng bộ thiết kế 2FA (nơi lưu Backup Codes, endpoint, thời điểm trả mã dự phòng, khóa sau 3 lần nhập sai) giữa ANL-01, DES-01, DES-02 và FEAT-05.
- Bổ sung thiết kế Personal Workspace, dữ liệu tạm thời trong Redis và các endpoint auth còn thiếu (`refresh`, `logout`, `resend-verification`).

### Added
- Khởi tạo quy trình phát triển phần mềm chuẩn mực 9 bước Docs-driven Multi-Agent SDLC.
- Cấu hình quy tắc dự án trong `.agents/rules/sdlc_process.md` và `AGENTS.md`.
- Playbook kỹ năng đa vai trò trong `.agents/skills/sdlc-workflow/SKILL.md`.
- Bộ khung tài liệu giao tiếp và biểu mẫu trong thư mục `docs/`.
- Tích hợp mô hình Agile Sprints: Quản lý task, bug, feature, refactor dưới dạng từng file độc lập.
- Thiết lập quy tắc đóng Sprint nghiêm ngặt (Không còn item > Medium).
- Bộ biểu mẫu Agile trong `docs/system/templates/`.
- Ban hành quy chuẩn Kiến trúc Microservices và Multi-Tenant SaaS.
- Thiết lập ranh giới Core tối giản (Auth, Account, RBAC, Data RBAC, Plugin Manager) và hệ sinh thái Plugin nghiệp vụ độc lập.
- Thiết lập cơ chế Semantic Versioning và Data Migration hai chiều (`up`/`down`) an toàn theo từng Tenant.
- Ban hành bản thiết kế kiến trúc [SYSTEM_BLUEPRINT.md](../system/architecture/SYSTEM_BLUEPRINT.md) và mẫu [PLUGIN_SPEC_TEMPLATE.md](../system/templates/PLUGIN_SPEC_TEMPLATE.md).
- Ban hành Tech Stack chuẩn mực: Backend **Quarkus (Java)**, Web **Angular >= 22 + Tailwind CSS v4**, Mobile **Ionic 8 + Angular**.
- Ban hành quy tắc Component-First cho Thư viện giao diện dùng chung (Shared UI Library) và hạn chế tối đa thư viện bên thứ 3.
- Ban hành cơ chế Entity Registry cho các thực thể CSDL của module/plugin.
- Tích hợp hạ tầng lưu trữ & messaging quy mô lớn: PostgreSQL (hỗ trợ Shared DB, Database-per-Tenant, Master - Slave / Read-Replicas), MongoDB Replica-Set, Redis và Apache Kafka.
- Ban hành ma trận phân định tính năng Desktop (đầy đủ) vs Mobile (tối giản).
- Tích hợp `docker-compose.yml` cho toàn bộ hệ sinh thái dịch vụ Local Dev (PostgreSQL Primary/Replica, MongoDB, Redis, Kafka, Kafka UI, MinIO, Mailpit).
- Cung cấp bộ công cụ điều phối tập trung đa nền tảng (`Makefile`, `scripts/dev/*.sh`, `scripts/dev/*.bat`) cho Backend Quarkus, Web Angular và Mobile Ionic.
- Xây dựng cấu hình đóng gói & triển khai Staging/Production (`deployments/docker/` và `deployments/k8s/` qua Kustomize) kèm script tự động (`scripts/deploy/`).
- Bổ sung 3 bộ tài liệu cốt lõi vào hệ thống tài liệu dự án:
  - `docs/06_user_guides/`: Hướng dẫn sử dụng phần mềm chuẩn mực, bắt buộc có hình ảnh trực quan (`assets/`).
  - `docs/07_deployment_guides/`: Hướng dẫn cài đặt & triển khai (Local, Docker Staging, K8s Production).
  - `docs/08_developer_guides/`: Hướng dẫn phát triển phần mềm (Coding standards Quarkus/Angular, Plugin guide, Shared UI guide).
- Tối ưu hóa tài nguyên Local Dev: Chuyển đổi `docker-compose.yml` sang cơ chế phân tầng Profiles. Mặc định chỉ chạy tối thiểu PostgreSQL Primary + Redis (~300MB RAM); các dịch vụ nặng (Kafka, MongoDB, Read-Replica, MinIO, Mailpit) chạy on-demand theo từng module. Bổ sung giới hạn memory cho toàn bộ local containers.
- Ban hành Chính Sách Kiểm Thử Thực Dụng: Bãi bỏ viết Unit Test cho Frontend (Angular/Ionic), chuyển sang Kiểm thử thủ công trên Trình duyệt (Browser Manual Testing) cho QA/QC; tập trung Unit Test tự động cho 100% logic Backend Quarkus Java.
- Ban hành Quy Chuẩn UI/UX ERP Hiện Đại: Mật độ thông tin cao (font chữ nhỏ `text-xs`/`text-sm`, đệm hẹp `p-1`/`p-2`), thiết kế vuông vắn sắc nét (`rounded-none`/`rounded-sm`), và triết lý Anti-Modal (thay thế Modal bằng Angular Router, Drawer trượt từ cạnh phải hỗ trợ xếp chồng, và Chia màn hình đa cột).
- Khởi động Sprint 01: Core Identity, Access & Account Management:
  - Thiết lập kế hoạch Sprint 01 (`sprint_plan.md`) và 6 Feature tracking files (FEAT-01 đến FEAT-06).
  - Hoàn tất tài liệu phân tích nghiệp vụ (RAW-01, ANL-01, BENCH-01, CONF-01).
  - Ban hành bản thiết kế giải pháp và chi tiết kỹ thuật (SOL-01, CORE_IAM_DATABASE_SCHEMA, CORE_IAM_API_SPEC, CORE_IAM_UI_SPEC).
- Ban hành Quy Chuẩn API Contract Đa Ngôn Ngữ (i18n Code-Driven): Bãi bỏ hardcode message văn bản trong API responses, chuẩn hóa envelope bằng mã định danh `code` và `params` nội suy cho Frontend tự chủ chuyển ngữ.
- Khách hàng phê duyệt xác nhận bổ sung tài liệu Sprint 01 sau rà soát nhất quán (CONF-01 Mục 3), chính thức chuyển sang Bước 7 - Lập trình.
- FEAT-07: Web responsive cho điện thoại + Mobile Navigation Drawer (menu/language/theme/logout) và Theme Switcher System/Light/Dark (class-based dark mode, persist localStorage).
- FEAT-08: Ionic Mobile Side Menu (thông tin tài khoản, menu, ngôn ngữ, theme, đăng xuất) + Theme Switcher class-based Sáng/Tối/Hệ thống (Ionic dark.class.css + Tailwind class strategy, persist localStorage).
- FEAT-09: Ionic Mobile - tối ưu màn hình Auth cho điện thoại (touch target, safe-area) và chuẩn hóa điều hướng NavController (forward/back/root, replaceUrl) cho back/forward mượt mà.
- **UG-02**: Hướng dẫn sử dụng Sprint 02 (Super Admin, RBAC & phân quyền dữ liệu) kèm **27 ảnh chụp thật** tại `docs/06_user_guides/sprint_02_superadmin_rbac_user_guide.md` + `assets/sprint_02_superadmin_rbac/`.
- **REV-02**: Biên bản nghiệm thu & đóng Sprint 02 với demo checklist, bài học kinh nghiệm và danh sách tồn đọng chuyển Sprint 03 (`docs/sprints/sprint_02_superadmin_rbac/09_review/sprint_review.md`).
- **Deployment config Sprint 02**: tài liệu hóa `OPENERP_ADMIN_BOOTSTRAP_SECRET`, `openerp.platform.bootstrap-emails`, `openerp.platform.plugin-catalog`, TTL impersonation, các job nền (partition/retention/lifecycle/impersonation-timeout), CLI `admin-cli` (bootstrap/list-admins/grant-admin/revoke-admin) và lưu ý timezone UTC trong bộ tài liệu `docs/07_deployment_guides/`.
