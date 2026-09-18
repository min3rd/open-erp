# Lịch Sử Thay Đổi Dự Án (Changelog)

Tất cả các thay đổi quan trọng trong dự án sẽ được ghi nhận tại file này theo định dạng chuẩn [Keep a Changelog](https://keepachangelog.com/). Phụ trách: **PM Agent**.

---

## [Unreleased]

### Added
- Khởi tạo quy trình phát triển phần mềm chuẩn mực 9 bước Docs-driven Multi-Agent SDLC.
- Cấu hình quy tắc dự án trong `.agents/rules/sdlc_process.md` và `AGENTS.md`.
- Playbook kỹ năng đa vai trò trong `.agents/skills/sdlc-workflow/SKILL.md`.
- Bộ khung tài liệu giao tiếp và biểu mẫu trong thư mục `docs/`.
- Tích hợp mô hình Agile Sprints: Quản lý task, bug, feature, refactor dưới dạng từng file độc lập.
- Thiết lập quy tắc đóng Sprint nghiêm ngặt (Không còn item > Medium).
- Bộ biểu mẫu Agile trong `docs/05_project_management/templates/`.
- Ban hành quy chuẩn Kiến trúc Microservices và Multi-Tenant SaaS.
- Thiết lập ranh giới Core tối giản (Auth, Account, RBAC, Data RBAC, Plugin Manager) và hệ sinh thái Plugin nghiệp vụ độc lập.
- Thiết lập cơ chế Semantic Versioning và Data Migration hai chiều (`up`/`down`) an toàn theo từng Tenant.
- Ban hành bản thiết kế kiến trúc [SYSTEM_BLUEPRINT.md](../03_designs/architecture/SYSTEM_BLUEPRINT.md) và mẫu [PLUGIN_SPEC_TEMPLATE.md](../03_designs/templates/PLUGIN_SPEC_TEMPLATE.md).
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
