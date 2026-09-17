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
  - Tạo bộ biểu mẫu Agile trong `docs/05_project_management/templates/` (Task, Bug, Feature, Refactor, Sprint Plan, Sprint Review).

- **Thiết lập Kiến Trúc Cốt Lõi: Microservices, Multi-Tenant SaaS & Plugin hóa**:
  - Xác lập ranh giới Core tối giản: Chỉ gồm Auth, Account/Organization, Functional RBAC, Data RBAC, Plugin Registry & Engine.
  - Quy định toàn bộ tính năng nghiệp vụ khác bắt buộc xây dựng dưới dạng Plugin có thể cài/gỡ tự do cho từng Tenant.
  - Ban hành quy chuẩn Tenant Data Isolation chống rò rỉ dữ liệu chéo.
  - Thiết lập quy trình quản lý phiên bản (SemVer) và script migration dữ liệu (`up`/`down`) an toàn theo từng Tenant.
  - Khởi tạo tài liệu thiết kế nền tảng [SYSTEM_BLUEPRINT.md](../03_designs/architecture/SYSTEM_BLUEPRINT.md) và mẫu đặc tả [PLUGIN_SPEC_TEMPLATE.md](../03_designs/templates/PLUGIN_SPEC_TEMPLATE.md).

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
