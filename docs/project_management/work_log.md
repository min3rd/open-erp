# Nhật Ký Hoạt Động & Cập Nhật Công Việc (Work Log)

Tài liệu này ghi nhận lại toàn bộ tiến độ thực hiện từng công đoạn của các Agent theo thời gian thực. Phụ trách: **PM Agent**.

---

## 2026-09-17
- **Người thực hiện**: Antigravity Agent
- **Giai đoạn**: Khởi tạo quy trình (Setup SDLC Foundation)
- **Nội dung công việc**:
  - Thiết lập quy tắc cốt lõi `sdlc_process.md` tại `.agents/rules/` yêu cầu tuân thủ nghiêm ngặt 9 bước phát triển phần mềm.
  - Thiết lập Playbook kỹ năng `sdlc-workflow` tại `.agents/skills/sdlc-workflow/SKILL.md` định nghĩa 5 Agent Personas (BA, Architect, Dev, QA, PM).
  - Khởi tạo toàn bộ cấu trúc thư mục tài liệu `docs/` gồm 5 giai đoạn chính và các template mẫu chuẩn cho từng bước.
  - Tạo file điều phối `AGENTS.md` tại thư mục gốc của dự án.
- **Tài liệu tham chiếu**:
  - [AGENTS.md](../../AGENTS.md)
  - [.agents/rules/sdlc_process.md](../../.agents/rules/sdlc_process.md)
  - [.agents/skills/sdlc-workflow/SKILL.md](../../.agents/skills/sdlc-workflow/SKILL.md)
  - [docs/README.md](../README.md)

- **Cập nhật mở rộng Agile**:
  - Bổ sung nguyên tắc phát triển theo mô hình Agile / Sprint.
  - Thiết lập cơ chế quản lý mọi task, bug, feature, refactor thành từng file độc lập để tránh bỏ sót.
  - Thiết lập ràng buộc nghiêm ngặt đóng Sprint (Sprint Closure DoD Gate): Không còn item nào > Medium (`Critical`, `High`) chưa giải quyết.
  - Tạo bộ biểu mẫu Agile trong `docs/system/templates/` (Task, Bug, Feature, Refactor, Sprint Plan, Sprint Review).

- **Thiết lập Kiến Trúc Cốt Lõi: Microservices, Multi-Tenant SaaS & Plugin hóa**:
  - Xác lập ranh giới Core tối giản: Chỉ gồm Auth, Account/Organization, Functional RBAC, Data RBAC, Plugin Registry & Engine.
  - Quy định toàn bộ tính năng nghiệp vụ khác bắt buộc xây dựng dưới dạng Plugin có thể cài/gỡ tự do cho từng Tenant.
  - Ban hành quy chuẩn Tenant Data Isolation chống rò rỉ dữ liệu chéo.
  - Thiết lập quy trình quản lý phiên bản (SemVer) và script migration dữ liệu (`up`/`down`) an toàn theo từng Tenant.
  - Khởi tạo tài liệu thiết kế nền tảng [SYSTEM_BLUEPRINT.md](../system/architecture/SYSTEM_BLUEPRINT.md) và mẫu đặc tả [PLUGIN_SPEC_TEMPLATE.md](../system/templates/PLUGIN_SPEC_TEMPLATE.md).

- **Ban hành Chuẩn Công Nghệ (Tech Stack) & Quy Tắc Giao Diện Dùng Chung**:
  - Xác định chuẩn Backend: **Quarkus** (ngôn ngữ chuẩn: **Java**, phiên bản Java LTS 21+).
  - Xác định chuẩn Frontend: **Angular >= 22** + **Tailwind CSS v4** (Web) và **Ionic 8 + Angular** (Mobile).
  - Ban hành quy tắc **Component-First** trong Thư viện dùng chung (`shared-ui-lib`): Mọi component mới phải làm vào thư viện dùng chung trước, sau đó Web và Mobile mới sử dụng. Hạn chế tối đa thư viện bên thứ 3.
  - Thiết lập cơ chế **Entity Registry**: Các module/plugin bắt buộc phải đăng ký Entity CSDL để chia sẻ tham chiếu an toàn.
  - Thiết lập Kiến trúc CSDL quy mô lớn & tối ưu hiệu năng:
    - **PostgreSQL**: Hỗ trợ Shared DB (RLS) hoặc **Database-per-Tenant** độc lập, cơ chế **Master - Slave / Read-Replicas** tách luồng đọc/ghi.
    - **MongoDB**: Cơ chế **Replica-Set** đảm bảo tính sẵn sàng cao (High Availability).
    - **Redis**: Caching phân tán, session store, distributed locks.
    - **Apache Kafka**: Message broker trục xương sống event-driven.
  - Phân định rõ ràng năng lực nền tảng: Desktop (đầy đủ) vs Mobile (tối giản, tác vụ nhanh).

- **Thiết Lập Hạ Tầng Local Dev, Script Điều Phối Tập Trung & Bộ 3 Tài Liệu Chuẩn Hóa**:
  - Xây dựng `docker-compose.yml` đầy đủ cho Local Dev: PostgreSQL Primary & Replica, MongoDB Replica-Set, Redis, Apache Kafka (KRaft), Kafka UI, MinIO (S3) và Mailpit.
  - Xây dựng bộ script điều phối tập trung đa nền tảng (`scripts/dev/` và `Makefile`): khởi động hạ tầng (`start_infra`), chạy Quarkus (`run_backend`), Angular (`run_web`), Ionic (`run_mobile`).
  - Xây dựng quy trình đóng gói & triển khai Staging/Production (`scripts/deploy/` và `deployments/`): Dockerfiles multi-stage cho Quarkus JRE 21 & Angular 22 Nginx Alpine, Docker Compose Prod, Kubernetes base & overlays qua Kustomize.
  - Bổ sung 3 bộ tài liệu bắt buộc vào quy trình dự án:
    - `docs/06_user_guides/`: Hướng dẫn sử dụng phần mềm chuẩn mực, bắt buộc có hình ảnh/screenshots/sơ đồ trực quan từ `assets/`.
    - `docs/07_deployment_guides/`: Hướng dẫn cài đặt & triển khai (Local Setup, Docker Staging, K8s Production).
    - `docs/08_developer_guides/`: Hướng dẫn phát triển phần mềm (Coding standards Quarkus/Angular 22, Plugin creation, Shared UI contribution).

- **Tối Ưu Hóa Tài Nguyên Local Dev (Minimal Service Footprint & Docker Profiles)**:
  - Thiết lập cơ chế phân tầng dịch vụ: Mặc định `docker-compose.yml` (`make infra`) chỉ chạy 2 dịch vụ tối thiểu: **PostgreSQL Primary** và **Redis** (~300MB RAM, khởi động < 5s).
  - Đóng gói các dịch vụ nặng vào Docker Compose Profiles (`kafka`, `mongo`, `replica`, `storage`, `mail`, `full`) để kích hoạt on-demand khi dev module tương ứng.
  - Cấu hình giới hạn bộ nhớ (`deploy.resources.limits.memory`) cho toàn bộ container local để bảo vệ máy trạm của lập trình viên.
  - Cập nhật quy tắc bắt buộc trong `AGENTS.md` (bổ sung điều cấm số 8) và `.agents/rules/sdlc_process.md` (Mục 7.1).
  - Cập nhật tài liệu `docs/07_deployment_guides/local_setup_guide.md` với bảng định mức RAM/CPU chi tiết.

- **Chính Sách Kiểm Thử Thực Dụng & Quy Chuẩn UI/UX ERP Nhỏ Gọn, Anti-Modal**:
  - Bãi bỏ hoàn toàn việc viết Unit Test cho Frontend (Angular/Ionic) nhằm tiết kiệm tài nguyên và loại bỏ các test case giòn gãy khi lập trình với AI.
  - Chuyển toàn bộ trọng tâm kiểm thử giao diện sang **Kiểm thử thủ công trên Trình duyệt (Browser Manual Testing)** do QA/QC thực hiện.
  - Giữ yêu cầu Unit Test nghiêm ngặt cho 100% logic nghiệp vụ phía Backend (Quarkus Java + Panache Mock + RestAssured).
  - Ban hành bộ quy chuẩn UI/UX ERP hiện đại:
    - Mật độ thông tin cao (font chữ nhỏ `text-xs`/`text-sm`, đệm hẹp `p-1`/`p-2`, chiều cao dòng bảng 28-32px).
    - Thiết kế vuông vắn sắc nét (`rounded-none`/`rounded-sm`, viền mảnh tinh tế).
    - Triết lý Anti-Modal: Hạn chế tối đa Modal pop-up, thay thế bằng Angular Router (nested routes), Drawer (side sheet trượt phải hỗ trợ xếp chồng đa tầng) và Split-Screen (chia 2-3 cột Master-Detail).
  - Đồng bộ các quy chuẩn vào `AGENTS.md` (bổ sung điều cấm 9 & 10), `.agents/rules/sdlc_process.md` (Mục 3.3, 3.4, Mục 8), `sdlc-workflow`, `coding_standards.md` và `shared_ui_contribution_guide.md`.

- **Khởi Động Sprint 01: Core Identity, Access & Account Management**:
  - **PM Agent**: Khởi tạo Sprint 01 (`sprints/sprint_01_core_iam/sprint_plan.md`), tạo 6 file quản lý tính năng độc lập trong `07_items/` (FEAT-01 đến FEAT-06), cập nhật `task_board.md`.
  - **BA Agent**: Hoàn thành trọn vẹn 4 bước yêu cầu:
    - Tiếp nhận yêu cầu thô: `docs/sprints/sprint_01_core_iam/01_raw_notes/RAW-01_sprint_01_core_identity.md`.
    - Phân tích nghiệp vụ chi tiết: `docs/sprints/sprint_01_core_iam/02_analysis/ANL-01_core_identity_access.md`.
    - Đối chuẩn kiến trúc IAM (Keycloak, Auth0, Odoo, Supabase): `docs/sprints/sprint_01_core_iam/03_benchmarks/BENCH-01_auth_identity_saas.md`.
    - Biên bản xác nhận phạm vi & tiêu chí nghiệm thu: `docs/sprints/sprint_01_core_iam/04_confirmation/CONF-01_sprint_01_scope.md`.
  - **Solution Architect Agent**: Hoàn thành giải pháp và thiết kế chi tiết:
    - Nghiên cứu giải pháp kỹ thuật: `docs/sprints/sprint_01_core_iam/05_solutions/SOL-01_core_identity_architecture.md`.
    - Thiết kế CSDL PostgreSQL Multi-Tenant: `docs/sprints/sprint_01_core_iam/06_designs/database/CORE_IAM_DATABASE_SCHEMA.md`.
    - Đặc tả kỹ thuật REST API: `docs/sprints/sprint_01_core_iam/06_designs/api/CORE_IAM_API_SPEC.md`.
    - Đặc tả UI/UX Anti-Modal (Drawer & Split-View): `docs/sprints/sprint_01_core_iam/06_designs/ui_ux/CORE_IAM_UI_SPEC.md`.

- **Chuẩn Hóa API Contract Đa Ngôn Ngữ (Code-Based i18n API Contract)**:
  - Bãi bỏ hoàn toàn việc hardcode chuỗi message tiếng Việt trong API responses.
  - Chuẩn hóa cấu trúc Envelope phản hồi qua `code` (`UPPER_SNAKE_CASE`), `params` nội suy, và `data`.
  - Frontend tự chủ quản lý từ điển đa ngôn ngữ (`i18n/{lang}.json`) dựa trên mã `code` nhận được mà không cần tinh chỉnh backend.
  - Cập nhật quy tắc vào `AGENTS.md` (bổ sung điều cấm số 11), `.agents/rules/sdlc_process.md` (Mục 9), `coding_standards.md` (Mục 1.4), và refactor toàn bộ `docs/sprints/sprint_01_core_iam/06_designs/api/CORE_IAM_API_SPEC.md`.

---

## 2026-09-18
- **Người thực hiện**: Antigravity Multi-Agent Team (BA, Solution Architect, PM)
- **Giai đoạn**: Hoàn thiện Yêu cầu & Thiết kế chi tiết cho Sprint 01
- **Nội dung công việc**:
  - **Tiếp nhận yêu cầu từ Khách hàng**: Bổ sung phân hệ Đăng ký (Kích hoạt) và Xóa/Tắt (Hủy) xác thực 2 yếu tố (2FA) trực tiếp trong Quản lý tài khoản (FEAT-06).
  - **BA Agent**:
    - Tạo ghi chú thô: `docs/sprints/sprint_01_core_iam/01_raw_notes/RAW-02_account_2fa_management.md`.
    - Cập nhật tài liệu phân tích nghiệp vụ `docs/sprints/sprint_01_core_iam/02_analysis/ANL-01_core_identity_access.md`: Bổ sung chi tiết quy trình Bật 2FA (quét QR, nhập mã kích hoạt, lưu 8 backup codes), quy trình Xóa 2FA (bảo mật kép bắt buộc nhập mật khẩu hiện tại + mã OTP/Backup code, gửi email cảnh báo bảo mật khẩn cấp) và tái tạo mã dự phòng.
    - Cập nhật biên bản xác nhận phạm vi Sprint 01 `docs/sprints/sprint_01_core_iam/04_confirmation/CONF-01_sprint_01_scope.md`.
  - **Solution Architect Agent**:
    - Cập nhật đặc tả REST API `docs/sprints/sprint_01_core_iam/06_designs/api/CORE_IAM_API_SPEC.md`: Chi tiết hóa các endpoint `/api/v1/account/2fa/status`, `/api/v1/account/2fa/setup`, `/api/v1/account/2fa/enable`, `/api/v1/account/2fa/disable`, `/api/v1/account/2fa/regenerate-backup-codes` với payload và mã lỗi i18n chuẩn hóa.
    - Cập nhật đặc tả UI/UX `docs/sprints/sprint_01_core_iam/06_designs/ui_ux/CORE_IAM_UI_SPEC.md`: Thiết kế chi tiết Tab Bảo Mật, hai Drawer con xếp chồng (`Setup2FaDrawerComponent`, `Disable2FaDrawerComponent`) đảm bảo triết lý Anti-Modal và tính đậm đặc thông tin (`text-xs`, `rounded-none`).
  - **PM Agent**:
    - Cập nhật `07_items/FEAT-06_account_management.md` với các kịch bản Acceptance Criteria và Sub-tasks kỹ thuật bổ sung.
    - Cập nhật kế hoạch Sprint `sprint_plan.md` và Task Board `task_board.md`.

- **Chuẩn Hóa Cấu Trúc Tài Liệu Theo Lệnh `/learn` (Sprint-Pack Sequential Documentation)**:
  - Khắc phục tình trạng tài liệu Sprint bị xé lẻ, rải rác và khó theo dõi thứ tự đọc phê duyệt.
  - Ban hành mô hình **Sprint-Pack Tuần Tự**: Gom toàn bộ tài liệu Sprint vào `docs/sprints/sprint_XX_<tên_sprint>/` đánh số thứ tự từ `00` đến `09`.
  - Thiết lập file điều hướng bắt buộc `00_READING_GUIDE.md` đóng vai trò bản đồ đọc tuần tự (Bước 1 đến Bước 4 cho Khách Hàng confirm, Bước 5 đến 7 cho Kỹ thuật, Bước 8 đến 9 cho QA/PM).
  - Cập nhật quy tắc vào `AGENTS.md` (bổ sung điều cấm số 12), `.agents/rules/sdlc_process.md` (Mục 2 & Mục 4), `SKILL.md` (Mục 2 & Mục 3), và `docs/README.md`.
  - Di chuyển và chuẩn hóa toàn bộ tài liệu Sprint 01 vào `docs/sprints/sprint_01_core_iam/`, dọn dẹp các thư mục rải rác cũ.

- **Rà Soát & Chuẩn Hóa Tài Liệu Sprint 01 (Documentation Review & Fix)**:
  - Sửa toàn bộ liên kết hỏng do tàn dư cấu trúc tài liệu cũ (`01_requirements/`, `03_designs/`, `items/`) trong Sprint-Pack, `docs/README.md`, bộ templates, `changelog.md`, `work_log.md`, `task_board.md`, `.agents/rules/sdlc_process.md` và `SKILL.md`.
  - Đồng bộ thiết kế 2FA giữa ANL-01, DES-01, DES-02 và FEAT-05: thống nhất lưu Backup Codes dạng `backup_codes_hash` JSONB trong bảng `user_two_factor` (bỏ bảng `user_backup_codes`), thống nhất endpoint `POST /api/v1/auth/2fa/verify-login` và nhóm `POST /api/v1/account/2fa/*`, chỉ trả 8 mã dự phòng tại bước `enable`, bổ sung quy tắc khóa sau 3 lần nhập sai kèm mã lỗi `AUTH_2FA_ATTEMPTS_EXCEEDED`.
  - Bổ sung thiết kế Personal Workspace (`tenants.type = 'PERSONAL'`) và bảng dữ liệu tạm thời lưu trong Redis (OTP xác thực email, pre-auth token, session, token blacklist).
  - Chốt quy tắc email trùng khi đăng ký doanh nghiệp (trả `AUTH_EMAIL_ALREADY_EXISTS`, không tự động liên kết), chốt thuật toán Argon2id, đồng bộ ERD/SQL bảng `user_credentials`.
  - Bổ sung endpoint còn thiếu vào đặc tả API: `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `POST /api/v1/auth/resend-verification` kèm mã i18n tương ứng.
  - Bổ sung test case TC-10, TC-11, TC-12 vào `08_testing/test_plan.md`.
  - Rà soát lại toàn bộ tài liệu Sprint 01 lần cuối: **ĐẠT YÊU CẦU**. Khách hàng phê duyệt xác nhận bổ sung tại `04_confirmation/CONF-01_sprint_01_scope.md` (Mục 3) và cập nhật checklist tại `00_READING_GUIDE.md`, chính thức chuyển Sprint 01 sang **Bước 7 - Lập trình**.
