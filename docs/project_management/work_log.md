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

- **Code Review Sprint 01 (REV-02)**:
  - Chạy xác thực: `mvn test` backend **PASS 10/10** trên PostgreSQL thật (không dùng H2); `ng build` frontend **PASS**.
  - Phát hiện **9 lỗi `Critical`, 14 lỗi `High`, 8 lỗi `Medium`**; đã lập 31 file item `BUG-01` → `BUG-31` trong `docs/sprints/sprint_01_core_iam/07_items/` (mỗi lỗi một file theo quy trình quản lý dạng file).
  - Ban hành báo cáo tổng hợp [CODE_REVIEW_SPRINT_01.md](sprints/sprint_01_core_iam/09_review/CODE_REVIEW_SPRINT_01.md) (REV-02) kèm danh sách lỗi `Low` chưa lập file và đánh giá DoD Gate.
  - **Kết luận**: Sprint 01 **CHƯA ĐỦ ĐIỀU KIỆN ĐÓNG** (DoD Gate FAIL do toàn bộ item Critical/High đang `To Do`); chuyển danh sách BUG cho Developer Agent xử lý.

- **Xử Lý BUG Critical/High & QA Re-test (2026-09-18)**:
  - **Backend**: chuyển mật khẩu sang Argon2id; mã hóa TOTP secret AES-256-GCM; chuyển session/brute-force/OTP/pre-auth/token blacklist sang Redis (TTL, cửa sổ brute-force 10 phút); hash SHA-256 reset token; khóa 2FA sau 3 lần sai; thêm API `refresh`/`logout`/`resend-verification`; `@Authenticated` + kiểm tra jti/session; IP thật; email chào mừng doanh nghiệp. Bổ sung 9 test API-level (RestAssured) + tenant isolation.
  - **Frontend Web**: sửa endpoint/payload/model theo API contract; QR thật cho Setup 2FA; backup codes chỉ hiển thị sau enable; environment config; Auth Guard + Interceptor refresh 401; i18n hóa toàn bộ + Anti-Modal (bỏ 15 chỗ `alert/prompt/confirm`).
  - **Mobile**: khởi tạo ứng dụng Ionic 8 + Angular đầy đủ màn hình Core IAM, tái sử dụng thư viện shared.
  - **QA phát sinh**: phát hiện và xử lý BUG-32 (hủy session chéo người dùng - High), BUG-33 (lỗi 4xx thành 500 - High); BUG-34 (401 body rỗng - Medium) chuyển Sprint 02.
  - **Kết quả re-test**: `mvn test` **PASS 22/22** (PostgreSQL + Redis thật); Web `npm run build` PASS; Mobile `npm run build` + `ionic serve` PASS. Báo cáo [QA_RETEST_SPRINT_01.md](sprints/sprint_01_core_iam/09_review/QA_RETEST_SPRINT_01.md) (REV-03).
  - **Còn lại trước khi đóng Sprint**: QA Browser Manual Testing (Web + Mobile) và bổ sung `docs/06_user_guides/` kèm hình ảnh; các item Medium chuyển Sprint 02.

- **Triển Khai Môi Trường Local Phục Vụ QA Manual Test (2026-09-18)**:
  - Hạ tầng Docker: PostgreSQL Primary + Redis (đang chạy) + bật thêm Mailpit (profile `mail`) tại http://localhost:8025 để đọc email OTP/khôi phục mật khẩu.
  - Backend Quarkus dev mode: http://localhost:8088 (lưu ý Java 25 cần `JAVA_TOOL_OPTIONS=-Dnet.bytebuddy.experimental=true`; log tại `%TEMP%\opencode\backend-dev2.log`).
  - Web Angular dev server: http://localhost:4200. Mobile Ionic 8 dev server: http://localhost:8100.
  - Bật CORS backend cho `localhost:4200/8100` (phục vụ QA gọi API trực tiếp trên local).
  - **Smoke test E2E PASS**: đăng ký cá nhân → nhận OTP qua Mailpit → xác thực email (Personal Workspace) → đăng nhập → lấy profile → liệt kê phiên → refresh token → logout và token cũ bị từ chối 401.
  - Ban hành hướng dẫn QA thao tác từng bước: [manual_test_guide.md](sprints/sprint_01_core_iam/08_testing/manual_test_guide.md) kèm checklist regression BUG-02 → BUG-19.

- **Sửa Lỗi Phát Hiện Từ Manual Test Khách Hàng (2026-09-18)**:
  - **BUG-35 (Critical)**: Tailwind v4 không quét `src/frontend/shared` (thiếu `@source`) làm mất các class chỉ dùng trong shared (`.fixed`, `.shadow-2xl`, nhiều `dark:*`) khiến Drawer không overlay. Đã thêm `@source '../../shared';` vào `web/src/styles.css` (CSS 23.801 → 34.713 bytes).
  - **BUG-36 (High)**: Rà soát dark mode toàn bộ Web + Mobile (login/register/forgot/reset/dashboard/account/2FA), bổ sung cặp `dark:` còn thiếu; Mobile bổ sung Ionic `dark.system.css`. Browser audit xác nhận màu sắc đồng nhất.
  - **BUG-37 (High)**: Route hóa trạng thái UI: `/account/detail|security|sessions`, nested `/account/security/2fa/setup|disable`, các route xác thực `/verify-email`, `/auth/2fa`, `/select-tenant` (sessionStorage cho pre-auth); Drawer/Tab điều khiển bằng Angular Router, F5/deep-link hoạt động; guard chặn `/account/**`.
  - **Xác thực**: Puppeteer browser test Web **7/7 PASS** (deep-link, reload, Escape đóng stacked drawer, guard) + Mobile smoke **18/18 PASS**; Web/Mobile build PASS; console 0 lỗi.

- **Sự Cố Môi Trường Dev & Khởi Chạy Từ Root (2026-09-18)**:
  - **BUG-39**: Script `.bat` dùng `echo ==>` bị CMD hiểu là redirect, tạo file rác `Khoi ...`. Đã đổi sang tiền tố `[Open-ERP]`/`[Infra]`; verify chạy `start_infra.bat` không còn file rác.
  - **Khởi chạy từ root**: Thêm `dev.bat` (Docker infra Postgres+Redis+Mailpit → mở 3 cửa sổ Backend/Web/Mobile) và `stop-dev.bat`; các script `run_backend/web/mobile.bat` tự xác định thư mục gốc. `mvn quarkus:dev` chạy được không cần set biến môi trường nhờ `jvm.args=-Dnet.bytebuddy.experimental=true` trong `pom.xml` (Java 25 + ByteBuddy).
  - **BUG-38 (Critical)**: Phát hiện nguyên nhân login trả 401 — bộ test backend dùng chung `openerp_dev` và xóa sạch dữ liệu dev mỗi lần chạy. Đã tách sang database riêng `openerp_test`; `start_infra` tự tạo DB test; `docker/postgres/init/01-create-test-database.sql` cho volume mới. Verify: `mvn test` 22/22 PASS, tài khoản dev vẫn đăng nhập được.
  - **BUG-40 (High)**: Login khi trình duyệt còn token cũ bị tầng security chặn → 401 body rỗng → FE hiển thị "Internal Server Error". Đã bật `quarkus.http.auth.proactive=false`, FE không gửi token tới các endpoint public, map lỗi theo HTTP status + bổ sung i18n. Verify puppeteer 3/3 PASS.
  - Lưu ý: dữ liệu dev trước đó đã bị test xóa (không khôi phục được) — cần đăng ký lại tài khoản local khi test.

- **Re-review Sprint 01 & Ban Hành Hướng Dẫn Sử Dụng (2026-09-18)**:
  - Kiểm chứng nền tảng: `mvn test` **22/22 PASS** (DB `openerp_test`), Web/Mobile build PASS, HTTP 8088/4200/8100/8025 đều 200, git không track secret/build.
  - Review tồn đọng: BUG-24 → BUG-31 chuyển `Deferred` Sprint 02 kèm ghi chú Partial/Open; BUG-34 giữ Deferred.
  - Phát hiện & xử lý mới:
    - **BUG-41 (High)**: fresh clone không chạy được do thiếu khóa JWT → thêm `scripts/dev/generate_jwt_keys.js` (RSA 2048, PKCS#8/SPKI) + tự động sinh trong `run_backend.bat|sh`, tài liệu mục 3.5.
    - **BUG-46 (Medium)**: drawer Tắt 2FA hiển thị sai cảnh báo "đang TẮT" → thêm key `ACCOUNT_2FA_DISABLE_WARNING` + chụp lại ảnh minh họa.
    - Ghi nhận BUG-42 (CORS prod), BUG-43 (thiếu i18n mã lỗi hệ thống), BUG-44 (khoảng trống test), BUG-45 (lệch mã lỗi DES-02) — chuyển Sprint 02.
  - **Ban hành Hướng dẫn sử dụng UG-01** `docs/06_user_guides/sprint_01_core_iam_user_guide.md` (đặt tên theo thứ tự Sprint) kèm **20 ảnh chụp thật** (Web light/dark + Mobile) tại `assets/sprint_01_core_iam/`; cập nhật index `docs/06_user_guides/README.md` kèm quy ước tên `sprint_XX_<tên>_user_guide.md`.
  - Ban hành báo cáo kiểm thử `08_testing/test_reports/test_report_sprint_01.md` (TR-01) tổng hợp 19 test case.

- **Xử Lý Toàn Bộ Tồn Đọng Sprint 01 (BUG-24 → BUG-31, BUG-34, BUG-42 → BUG-45) - Đợt Sửa 2026-09-18**:
  - **Chuẩn hóa dữ liệu & schema**: TenantType = `PERSONAL | BUSINESS` + alias `ORGANIZATION` (migration V1.0.1 đổi dữ liệu/default); triển khai Entity Registry `@RegisterEntity` + `EntityRegistryService` + migration V1.0.2 (7 entity `core-iam` đăng ký, tài liệu `docs/system/entity_registry/`); migration V1.0.3 (`backup_codes_hash` → JSONB, thêm `idx_tenants_type`, xóa 2 cột OTP khỏi `users`).
  - **Chuẩn hóa API & bảo mật**: dùng enum `ResponseKey` thay toàn bộ string literal (`FIELD`/`SLUG`/`LOCKED_SECONDS`/`RETRY_AFTER`/`AVAILABLE`); JWT issuer + cặp khóa config-driven kèm `%prod`/`%staging` (`OPENERP_JWT_PUBLIC_KEY`/`OPENERP_JWT_PRIVATE_KEY`); CORS production/staging với env override `OPENERP_CORS_ORIGINS`; mọi 401 trả envelope `code=UNAUTHORIZED` qua `AccessTokenVerifier`; bổ sung `GET /api/v1/auth/check-slug`.
  - **Frontend**: chuẩn hóa envelope `ApiResponse` `{success,code,message?,params?,data,errors?}` (bỏ `meta`) và kiểm tra `success`; đồng bộ TopBar sau lưu profile; gỡ checkbox điều khoản chết ở login; form doanh nghiệp 2 bước + live slug check (debounce 400ms, preview URL) + nút gửi lại OTP 60s; bổ sung i18n `BAD_REQUEST`/`METHOD_NOT_ALLOWED`/`UNSUPPORTED_MEDIA_TYPE` (vi/en parity web 189/189, mobile 202/202).
  - **Tài liệu**: cập nhật DES-02 mục 3.1 sang `ACCOUNT_OLD_PASSWORD_INCORRECT`, bổ sung mục 2.11 check-slug + bảng i18n; ban hành `docs/system/entity_registry/{README,CORE_IAM_REGISTRY}.md`.
  - **Kết quả kiểm chứng**: `mvn test` **30/30 PASS** (PostgreSQL + Redis thật; thêm `EntityRegistryServiceTest` + 8 test tồn đọng BUG-44); Web build PASS; Mobile build PASS; browser puppeteer verify **6/6 PASS**, console 0 lỗi.
  - Đóng toàn bộ 13 item Medium/Low (BUG-24 → BUG-31, BUG-34, BUG-42 → BUG-45) sang `Done`; còn lại duy nhất **QA Browser Manual Testing ký xác nhận cuối và commit** để đóng Sprint 01.
  - **Sửa bổ sung sau verify browser**: `slugPreviewUrl` ở form doanh nghiệp dùng `computed` nhưng đọc biến không phải signal → preview URL không cập nhật khi sửa slug; đã chuyển sang method (Web build PASS). Chụp lại 2 ảnh hướng dẫn theo UI mới: `01-login.png` (đã bỏ checkbox điều khoản) và `19-register-business.png` (form 2 bước + live slug check).

- **FEAT-07: Web Responsive Điện Thoại & Mobile Nav Drawer (2026-09-18)**:
  - **Theme hệ thống**: chuyển dark variant của Tailwind v4 sang class strategy (`@custom-variant dark`) + `ThemeService` (SYSTEM/LIGHT/DARK, persist `localStorage`, lắng nghe `matchMedia`) và component shared `ThemeSwitcherComponent`.
  - **MobileNavDrawer**: hamburger trên TopBar (<lg) mở Drawer chứa thông tin tài khoản (avatar/tên, email, workspace, badge vai trò), 4 menu điều hướng (Dashboard, Hồ sơ, Bảo mật & 2FA, Phiên đăng nhập), `LanguageSwitcherComponent`, `ThemeSwitcherComponent` và nút Đăng xuất.
  - **TopBar responsive**: ẩn cụm điều khiển bên phải dưới `lg`, chỉ còn logo + hamburger, truncate brand/tenant; desktop 1600px giữ nguyên bố cục + theme switcher.
  - **Auth screens & Dashboard**: login/register/forgot/reset chuyển 1 cột full-width trên điện thoại; dashboard gọn padding, welcome banner xếp dọc, grid tính năng 1 cột (điện thoại) → 2 cột (tablet) → 3 cột (desktop).
  - **Kết quả kiểm chứng**: Web `npm run build` PASS, Mobile build PASS; puppeteer viewport 390x844 đạt **40/40 + 11/11 assert PASS** (overflow 0 trên 7 trang, hamburger + drawer đầy đủ, theme Dark/Light đổi class `.dark` + `colorScheme` và persist qua reload, desktop không hồi quy), console 0 lỗi. Ảnh minh chứng: `docs/06_user_guides/assets/sprint_01_core_iam/` (21-phone-dashboard.png, 22-phone-nav-drawer.png, 23-phone-dark-theme.png).

- **FEAT-08: Ionic Mobile Side Menu & Theme (2026-09-18)**:
  - **Theme class-based trên Mobile**: chuyển `dark.system.css` → `dark.class.css` + `@custom-variant dark` (Tailwind class strategy); shared `ThemeService` toggle thêm class `ion-palette-dark`, persist localStorage, mặc định theo hệ thống.
  - **MobileMenuComponent**: `ion-menu` (contentId) chứa thông tin tài khoản (avatar/tên/email/workspace/badge vai trò), 4 menu điều hướng (Dashboard, Hồ sơ, Bảo mật & 2FA, Phiên đăng nhập - bấm tự đóng menu), language switcher, theme switcher và Đăng xuất.
  - **Toolbar gọn**: dashboard/account dùng `ion-menu-button`, bỏ các nút rải rác trên toolbar/card; 8 trang auth thêm language/theme switcher gọn góc trên, không tràn ngang 390px.
  - **i18n**: bổ sung key theme/menu, vi/en parity **208/208**; Mobile + Web `npm run build` PASS.
  - **Kiểm chứng**: puppeteer viewport 390x844 đạt **42/42 PASS** (menu đầy đủ, điều hướng tự đóng, theme Tối → `html.dark` + `ion-palette-dark`, `--background` ion-content `#0a0a0a`/toolbar `#171717`, persist qua reload, EN đổi nhãn, không tràn ngang, console 0 lỗi) + sweep **22/22 PASS** (8 trang auth không tràn ngang + có switcher, setup/disable 2FA có menu button).
  - Cập nhật ảnh 16/17/18 và thêm `24-mobile-menu.png`, `25-mobile-dark.png` tại `docs/06_user_guides/assets/sprint_01_core_iam/`.

- **FEAT-09: Ionic Auth UX & Điều Hướng (2026-09-18)**:
  - **Điều hướng chuẩn Ionic**: refactor toàn bộ `router.navigate` → `NavController` (`navigateForward`/`navigateBack`/`navigateRoot` + `replaceUrl` cho `navigateRoot`) trên `auth.service`, login, register, verify, reset, select-tenant, two-factor, account 2FA và dashboard.
  - **Tối ưu UI 8 màn auth cho phone**: input/button ≥40px, font 13px, padding safe-area `env()`, gỡ tiêu đề trùng, nút chính full-width, không tràn ngang 390px.
  - **Kiểm chứng**: Mobile `npm run build` PASS; puppeteer 390x844 **34/34 PASS** (forward/back `/login ↔ /register/personal`, sau login/logout browser-back không về màn trước, back trong luồng quên mật khẩu OK, overflow 0 trên 8 trang auth, console 0 lỗi); cập nhật ảnh `16-mobile-login.png`.

- **ĐÓNG SPRINT 01 (2026-09-18)**:
  - Khách hàng xác nhận nghiệm thu và đồng ý đóng Sprint 01.
  - Chốt kết quả: 46/46 BUG Done; FEAT-01 → FEAT-09 Done; `mvn test` 30/30 PASS; Web/Mobile build PASS; QA browser/mobile automation PASS.
  - Ban hành Hướng dẫn sử dụng UG-01 (25 ảnh), TR-01 Test Report, Entity Registry Core IAM.
  - Cập nhật `sprint_review.md` trạng thái ĐÃ ĐÓNG; `sprint_plan.md` DoD đạt 100%; `00_READING_GUIDE.md` chốt trạng thái đóng.
  - Retrospective ghi nhận 3 bài học (Tailwind `@source`, test DB isolation, NavController) và hành động cho Sprint 02.
