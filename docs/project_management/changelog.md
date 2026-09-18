# Lịch Sử Thay Đổi Dự Án (Changelog)

Tất cả các thay đổi quan trọng trong dự án sẽ được ghi nhận tại file này theo định dạng chuẩn [Keep a Changelog](https://keepachangelog.com/). Phụ trách: **PM Agent**.

---

## [Unreleased]

### Sprint 01 - ĐÃ ĐÓNG (2026-09-18)
- Core IAM hoàn chỉnh: Đăng ký cá nhân/doanh nghiệp, Đăng nhập & chọn Workspace, Quên mật khẩu, 2FA TOTP, Quản lý tài khoản trên Web (Angular 22) + Mobile (Ionic 8).
- Chất lượng: 46/46 BUG Done; backend 30/30 test PASS; Web/Mobile build PASS; Theme Sáng/Tối/Hệ thống; responsive điện thoại.
- Tài liệu: UG-01 User Guide (25 ảnh), TR-01 Test Report, Entity Registry.

### Known Issues
- Không còn issue mở cho Sprint 01 (đã đóng 2026-09-18).

### Fixed
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
