# Project Guidelines & Agent Instructions

Dự án này áp dụng quy trình phát triển phần mềm chuẩn mực 9 bước với mô hình **Multi-Agent hướng tài liệu (Docs-driven SDLC)**.

Tất cả các Agent khi tham gia vào dự án này bắt buộc phải tuân thủ nghiêm ngặt các quy tắc trong:
- Quy tắc cốt lõi: [.agents/rules/sdlc_process.md](.agents/rules/sdlc_process.md)
- Playbook kỹ năng: [.agents/skills/sdlc-workflow/SKILL.md](.agents/skills/sdlc-workflow/SKILL.md)
- Cấu trúc tài liệu dự án: [docs/README.md](docs/README.md)

## Tóm Tắt Quy Trình Bắt Buộc:
1. **Nhận yêu cầu truyền miệng** (`docs/01_requirements/raw_notes/`) - Phụ trách: BA Agent
2. **Phân tích yêu cầu** (`docs/01_requirements/analysis/`) - Phụ trách: BA Agent
3. **Tham khảo phần mềm tương tự** (`docs/01_requirements/benchmarks/`) - Phụ trách: BA Agent
4. **Xác nhận với khách hàng** (`docs/01_requirements/confirmations/`) - Phụ trách: BA Agent
5. **Nghiên cứu giải pháp** (`docs/02_solutions/`) - Phụ trách: Solution Architect
6. **Thiết kế giải pháp chi tiết** (`docs/03_designs/`) - Phụ trách: Solution Architect
7. **Lập trình** (`src/`) - Phụ trách: Developer Agent
8. **Kiểm thử** (`docs/04_testing/`) - Phụ trách: QA/QC Agent
9. **Cập nhật công việc** (`docs/05_project_management/`) - Phụ trách: PM Agent

## Ràng Buộc Agile & Quản Lý Sprint (Agile Sprint Guardrails):
- **Phân kỳ theo Sprint**: Dự án được bóc tách và triển khai theo từng Sprint nhỏ với mục tiêu và phạm vi rõ ràng.
- **Quản lý Item dưới dạng file (File-based Tracking)**: Trong suốt quá trình phát triển, các agent luôn phải chủ động phát hiện và bổ sung các `task`, `bug`, `feature`, `refactor`... Mọi yêu cầu hay lỗi đều **phải được tạo thành file riêng** có trạng thái quản lý để tránh bỏ sót.
- **Điều kiện đóng Sprint (Sprint DoD Gate)**: **1 Sprint CHỈ CÓ THỂ ĐÓNG khi KHÔNG CÒN các task, bug, issue ở mức độ nghiêm trọng LỚN HƠN MEDIUM** (nghĩa là 100% item mức `Critical` và `High` phải được xử lý xong).

## Ràng Buộc Kiến Trúc Nền Tảng (Architectural Guardrails):
- **Nền tảng Microservices & Multi-tenant (SaaS)**: Phục vụ nhiều khách thuê (tenants), bắt buộc phân lập dữ liệu triệt để (Tenant Data Isolation), không được phép rò rỉ dữ liệu chéo.
- **Tech Stack Chuẩn Mực**:
  - **Backend**: **Quarkus** (ngôn ngữ chuẩn: **Java**, cloud-native microservices).
  - **Frontend Web/Desktop**: **Angular >= 22** + **Tailwind CSS v4**.
  - **Mobile App**: **Ionic 8 + Angular** (tối giản chức năng so với bản Web).
  - **Cơ sở dữ liệu & Quy mô**:
    - **PostgreSQL**: CSDL chính, quan hệ, hỗ trợ linh hoạt Shared DB (RLS) hoặc **Database-per-Tenant**, cơ chế **Master - Slave / Read-Replicas** tách luồng đọc/ghi để tối ưu hiệu năng.
    - **MongoDB**: Hỗ trợ cơ chế **Replica-Set** (High Availability), lưu trữ phi cấu trúc/audit logs khi cần.
  - **Bộ nhớ đệm (Cache)**: **Redis** (cache phân tán, session, lock).
  - **Message Broker**: **Apache Kafka** (truyền thông bất đồng bộ giữa các microservices/plugins).
- **Thư Viện Giao Diện Dùng Chung (Component-First Rule)**:
  - Phải xây dựng thư viện component dùng chung để đồng nhất giao diện Web và Mobile.
  - **Bắt buộc**: Nếu cần component mới, phải thêm vào thư viện dùng chung trước, sau đó Web và Mobile mới sử dụng từ thư viện.
  - **Hạn chế tối đa thư viện bên thứ 3**, ưu tiên tự xây dựng component trên nền Angular + Tailwind 4.
- **Phân Định Nền Tảng (Desktop vs. Mobile)**: Mọi Plugin phải khai báo minh bạch danh sách chức năng nào dùng được trên Desktop và chức năng nào dùng được trên Mobile.
- **Cơ Chế Entity Registry**: Mọi entity CSDL của module/plugin bắt buộc phải đăng ký vào Entity Registry chung để các plugin khác có thể tham chiếu an toàn.
- **Ranh giới Core vs. Plugins**:
  - **Hệ thống Core (Tối giản)**: Chỉ bao gồm Đăng ký/Đăng nhập, Quản lý tài khoản, Phân quyền chức năng, Phân quyền dữ liệu, và Quản lý Plugin.
  - **Plugin hóa toàn diện**: Mọi chức năng nghiệp vụ khác phải được đóng gói dạng Plugin độc lập. Khách hàng/Tenant có thể cài đặt hoặc gỡ bỏ tùy ý.
- **Môi Trường Local Dev Tối Giản Tài Nguyên & Scripts Quản Lý Tập Trung**:
  - Mặc định chỉ khởi chạy **dịch vụ tối thiểu** (Minimal Footprint): **PostgreSQL Primary** và **Redis** (~300MB RAM) thông qua `docker-compose.yml` (`make infra`).
  - Toàn bộ các dịch vụ nặng (Kafka, MongoDB, Read-Replica, MinIO, Mailpit) phải cấu hình dưới dạng **Docker Compose Profiles** (`kafka`, `mongo`, `storage`, `mail`, `full`), chỉ bật on-demand khi thực sự cần.
  - Đặt giới hạn bộ nhớ (`resources.limits.memory`) cho toàn bộ container local để tránh tràn RAM máy dev.
  - Bộ scripts quản lý tập trung trong thư mục `scripts/dev/` và `Makefile` (`make infra`, `make backend`, `make web`, `make mobile`).
- **Chính Sách Kiểm Thử Thực Dụng (Pragmatic Testing Policy)**:
  - **Backend**: Bắt buộc viết Unit Test (JUnit 5 + RestAssured) cho các logic nghiệp vụ, tính toán dữ liệu, và phân quyền Tenant trong Quarkus Java.
  - **Frontend**: **TUYỆT ĐỐI KHÔNG viết Unit Test / Component Test** cho Angular/Ionic (không viết file `.spec.ts`, tránh lãng phí tài nguyên và chi phí bảo trì vô ích khi phát triển cùng AI).
  - **QA/QC Frontend**: Bắt buộc thực hiện **Kiểm thử thủ công trên Trình duyệt (Browser Manual Testing)** để kiểm tra tính toàn vẹn giao diện, luồng tương tác, độ mượt của Drawer và responsive.
- **Quy Chuẩn UI/UX ERP Nhỏ Gọn, Vuông Vắn & Anti-Modal**:
  - **Mật độ thông tin cao (High Density)**: Sử dụng font chữ nhỏ (`text-xs`: 12px, `text-sm`: 13px), khoảng cách đệm và lề tối thiểu (`p-1`, `p-2`, `gap-1`, `space-y-1.5`) nhằm hiển thị nhiều thông tin nhất trên một màn hình, giảm thao tác cuộn trang.
  - **Thiết kế vuông vắn (Sharp/Square Aesthetic)**: Đường viền sắc nét, góc vuông hoặc bo góc siêu nhỏ (`rounded-none` hoặc `rounded-sm`), viền mỏng tinh tế (`border-neutral-200 dark:border-neutral-800`), mang lại phong cách ERP công nghiệp hiện đại, tinh gọn.
  - **Hạn chế tối đa Modal**: Nghiêm cấm lạm dụng Modal popup che khuất màn hình. Thay thế 100% bằng **Angular Router (Nested Routes)**, **Drawer (Side sheet trượt từ cạnh phải, hỗ trợ xếp chồng đa tầng - stacked drawers)** và **Split-Screen (chia màn hình thành nhiều phần/cột hiển thị đồng thời)** để giữ trọn vẹn ngữ cảnh làm việc.
- **Tiêu Chuẩn Triển Khai Staging & Production (Docker & Kubernetes)**:
  - Tất cả service phải có Multi-stage Dockerfile tối ưu kích thước.
  - Cấu hình Kubernetes theo chuẩn Base/Overlays cho Staging và Production trong thư mục `deployments/k8s/`.
- **Bộ Ba Tài Liệu Bắt Buộc Trong Thư Mục `docs/`**:
  - `docs/06_user_guides/`: Tài liệu hướng dẫn sử dụng phần mềm, **bắt buộc có hình ảnh trực quan (screenshots/flows)**.
  - `docs/07_deployment_guides/`: Tài liệu hướng dẫn cài đặt và triển khai trên Local, Docker, K8s.
  - `docs/08_developer_guides/`: Tài liệu hướng dẫn phát triển phần mềm, quy chuẩn code Quarkus Java/Angular/Ionic 8, tạo Plugin mới và mở rộng UI library.

> **NGHIÊM CẤM**:
> 1. Nhảy cóc trực tiếp sang bước Lập trình khi chưa có xác nhận từ khách hàng và tài liệu thiết kế chi tiết trong thư mục `docs/`.
> 2. Đóng Sprint hoặc bàn giao release khi vẫn còn tồn đọng task/bug ở mức `Critical` hoặc `High`.
> 3. Đưa mã nguồn nghiệp vụ chuyên biệt vào tầng Core hoặc viết câu truy vấn thiếu ngữ cảnh `tenant_id`.
> 4. Cài đặt/Nâng cấp/Gỡ bỏ Plugin làm phá vỡ cấu trúc CSDL hoặc làm mất dữ liệu của Tenant mà không qua Migration/Backup an toàn.
> 5. Viết UI component ad-hoc rải rác bên ngoài thư viện giao diện dùng chung hoặc tự ý cài đặt thư viện UI bên thứ 3.
> 6. Khai báo Entity CSDL trong Plugin mà không đăng ký vào Entity Registry chung của hệ thống.
> 7. Bàn giao tính năng hoặc đóng Sprint mà thiếu tài liệu hướng dẫn sử dụng (kèm hình ảnh minh họa) hoặc thiếu tài liệu triển khai liên quan.
> 8. Tự ý khởi chạy toàn bộ các dịch vụ phụ trợ nặng (Kafka, MongoDB, Read-Replica, MinIO) làm cạn kiệt tài nguyên máy dev khi chỉ thực hiện các tác vụ phát triển cơ bản.
> 9. Viết unit test cho Frontend (Angular/Ionic) làm lãng phí thời gian hoặc tự ý thêm thư viện kiểm thử frontend.
> 10. Lạm dụng pop-up Modal để hiển thị chi tiết hoặc biểu mẫu nhập liệu khi có thể sử dụng Drawer trượt, chia màn hình (Split-View) hoặc Router con.
