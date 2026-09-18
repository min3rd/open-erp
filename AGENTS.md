# Project Guidelines & Agent Instructions

Dự án này áp dụng quy trình phát triển phần mềm chuẩn mực 9 bước với mô hình **Multi-Agent hướng tài liệu (Docs-driven SDLC)**.

Tất cả các Agent khi tham gia vào dự án này bắt buộc phải tuân thủ nghiêm ngặt các quy tắc trong:
- Quy tắc cốt lõi & Master Index: [.agents/rules/sdlc_process.md](.agents/rules/sdlc_process.md)
- Bộ quy tắc chuyên biệt theo vai trò & lĩnh vực:
  - Quy trình Agile & DoD Gate: [.agents/rules/core_sdlc.md](.agents/rules/core_sdlc.md)
  - BA Agent: [.agents/rules/agent_ba.md](.agents/rules/agent_ba.md)
  - Solution Architect: [.agents/rules/agent_architect.md](.agents/rules/agent_architect.md)
  - Developer Agent: [.agents/rules/agent_developer.md](.agents/rules/agent_developer.md)
  - QA/QC Agent: [.agents/rules/agent_qa.md](.agents/rules/agent_qa.md)
  - PM Agent: [.agents/rules/agent_pm.md](.agents/rules/agent_pm.md)
  - Quy chuẩn UI/UX ERP: [.agents/rules/ui_ux_standards.md](.agents/rules/ui_ux_standards.md)
  - Quy chuẩn API & i18n: [.agents/rules/api_standards.md](.agents/rules/api_standards.md)
- Playbook kỹ năng: [.agents/skills/sdlc-workflow/SKILL.md](.agents/skills/sdlc-workflow/SKILL.md)
- Cấu trúc tài liệu dự án: [docs/README.md](docs/README.md)

## Tóm Tắt Quy Trình Bắt Buộc & Cấu Trúc Tài Liệu Sprint-Pack:
Mỗi Sprint được đóng gói trọn gói trong `docs/sprints/sprint_XX_<tên_sprint>/` với thứ tự đọc tuần tự từ 00 đến 09:
- **00. Bản đồ đọc & Xác nhận** (`00_READING_GUIDE.md`) - Cổng giao tiếp bắt đầu duy nhất cho Khách hàng & Reviewer
- **01. Nhận yêu cầu truyền miệng** (`01_raw_notes/`) - Phụ trách: BA Agent
- **02. Phân tích yêu cầu** (`02_analysis/`) - Phụ trách: BA Agent
- **03. Tham khảo phần mềm tương tự** (`03_benchmarks/`) - Phụ trách: BA Agent
- **04. Xác nhận với khách hàng** (`04_confirmation/`) - Phụ trách: BA Agent & Khách hàng ký duyệt (Confirmation Gate)
- **05. Nghiên cứu giải pháp** (`05_solutions/`) - Phụ trách: Solution Architect
- **06. Thiết kế giải pháp chi tiết** (`06_designs/`) - Phụ trách: Solution Architect (DB, API, UI)
- **07. Phân rã nhiệm vụ & Lập trình** (`07_items/` & `src/`) - Phụ trách: Developer Agent
- **08. Kiểm thử** (`08_testing/`) - Phụ trách: QA/QC Agent
- **09. Nghiệm thu & Đóng Sprint** (`09_review/`) - Phụ trách: PM Agent

## Ràng Buộc Agile & Quản Lý Sprint (Agile Sprint Guardrails):
- **Mô Hình Sprint-Pack Tuần Tự (Sprint-Pack Sequential Documentation)**: Toàn bộ tài liệu từ bước 1 đến bước 9 của một Sprint được đóng gói trọn gói trong thư mục `docs/sprints/sprint_XX_<tên_sprint>/`. Tuyệt đối không xé lẻ tài liệu Sprint ra các thư mục toàn cục. Mỗi Sprint bắt buộc có file `00_READING_GUIDE.md` dẫn dắt thứ tự đọc và chứa bảng xác nhận (Confirmation Checklist).
- **Phân kỳ theo Sprint**: Dự án được bóc tách và triển khai theo từng Sprint nhỏ với mục tiêu và phạm vi rõ ràng.
- **Quản lý Item dưới dạng file (File-based Tracking)**: Trong suốt quá trình phát triển, các agent luôn phải chủ động phát hiện và bổ sung các `task`, `bug`, `feature`, `refactor`... Mọi yêu cầu hay lỗi đều **phải được tạo thành file riêng trong `07_items/`** có trạng thái quản lý để tránh bỏ sót.
- **Điều kiện đóng Sprint (Sprint DoD Gate)**: **1 Sprint CHỈ CÓ THỂ ĐÓNG khi KHÔNG CÒN các task, bug, issue ở mức độ nghiêm trọng LỚN HƠN MEDIUM** (nghĩa là 100% item mức `Critical` và `High` phải được xử lý xong).

## Ràng Buộc Kiến Trúc Nền Tảng (Architectural Guardrails):
- **Định Danh Hệ Thống & Domain Chuẩn**:
  - Tên Package Backend chuẩn mực: `com.vn9melody.openerp`.
  - Tên miền chính thức của hệ thống: `openerp.9ms.io.vn`.
- **Nền tảng Microservices & Multi-tenant (SaaS)**: Phục vụ nhiều khách thuê (tenants), bắt buộc phân lập dữ liệu triệt để (Tenant Data Isolation), không được phép rò rỉ dữ liệu chéo.
- **Tech Stack Chuẩn Mực**:
  - **Backend**: **Quarkus** (ngôn ngữ chuẩn: **Java**, cloud-native microservices, package chuẩn `com.vn9melody.openerp`).
  - **Frontend Web/Desktop**: **Angular >= 22** + **Tailwind CSS v4**.
  - **Mobile App**: **Ionic 8 + Angular** (tối giản chức năng so với bản Web).
  - **Cơ sở dữ liệu & Quy mô**:
    - **PostgreSQL**: CSDL chính, quan hệ, hỗ trợ linh hoạt Shared DB (RLS) hoặc **Database-per-Tenant**, cơ chế **Master - Slave / Read-Replicas** tách luồng đọc/ghi để tối ưu hiệu năng.
    - **MongoDB**: Hỗ trợ cơ chế **Replica-Set** (High Availability), lưu trữ phi cấu trúc/audit logs khi cần.
  - **Bộ nhớ đệm (Cache)**: **Redis** (cache phân tán, session, lock).
  - **Message Broker**: **Apache Kafka** (truyền thông bất đồng bộ giữa các microservices/plugins).
- **Thư Viện Giao Diện Dùng Chung Độc Lập Cho Cả Web & Mobile**:
  - Thư mục shared UI components, shared enums và models phải được đặt tại thư mục dùng chung `src/frontend/shared/` độc lập với Web và Mobile.
  - Cấu hình TypeScript path mapping (`@shared/*`) để cả Angular Web (`src/frontend/web`) và Ionic Mobile (`src/frontend/mobile`) đều dùng chung 1 nguồn component duy nhất.
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
- **Chính Sách Kiểm Thử Thực Dụng & Cấm H2 (No H2 Policy)**:
  - **Backend**: Bắt buộc viết Unit Test (JUnit 5 + RestAssured) cho các logic nghiệp vụ, tính toán dữ liệu, và phân quyền Tenant trong Quarkus Java.
  - **CẤM SỬ DỤNG H2 / In-Memory Mock DB**: Môi trường dev local luôn có sẵn PostgreSQL và Redis qua `make infra`. Mọi Unit/Integration Test phải kết nối và thực thi trực tiếp trên PostgreSQL và Redis thật nhằm đảm bảo tính đồng nhất 100% với môi trường Staging/Production.
  - **Frontend**: **TUYỆT ĐỐI KHÔNG viết Unit Test / Component Test** cho Angular/Ionic (không viết file `.spec.ts`, tránh lãng phí tài nguyên và chi phí bảo trì vô ích khi phát triển cùng AI).
  - **QA/QC Frontend**: Bắt buộc thực hiện **Kiểm thử thủ công trên Trình duyệt (Browser Manual Testing)** để kiểm tra tính toàn vẹn giao diện, luồng tương tác, độ mượt của Drawer và responsive.
- **Quy Chuẩn UI/UX ERP Nhỏ Gọn, Vuông Vắn & Anti-Modal**:
  - **Mật độ thông tin cao (High Density)**: Sử dụng font chữ nhỏ (`text-xs`: 12px, `text-sm`: 13px), khoảng cách đệm và lề tối thiểu (`p-1`, `p-2`, `gap-1`, `space-y-1.5`) nhằm hiển thị nhiều thông tin nhất trên một màn hình, giảm thao tác cuộn trang.
  - **Thiết kế vuông vắn (Sharp/Square Aesthetic)**: Đường viền sắc nét, góc vuông hoặc bo góc siêu nhỏ (`rounded-none` hoặc `rounded-sm`), viền mỏng tinh tế (`border-neutral-200 dark:border-neutral-800`), mang lại phong cách ERP công nghiệp hiện đại, tinh gọn.
  - **Hạn chế tối đa Modal**: Nghiêm cấm lạm dụng Modal popup che khuất màn hình. Thay thế 100% bằng **Angular Router (Nested Routes)**, **Drawer (Side sheet trượt từ cạnh phải, hỗ trợ xếp chồng đa tầng - stacked drawers)** và **Split-Screen (chia màn hình thành nhiều phần/cột hiển thị đồng thời)** để giữ trọn vẹn ngữ cảnh làm việc.
- **Quy Chuẩn Viết Component, Đa Ngôn Ngữ & Design Tokens Dùng Chung**:
  - **Tách riêng template HTML**: 100% component Angular phải tách riêng file template `.html`. Tuyệt đối không viết inline template trong file `.ts`.
  - **Bắt buộc 100% Đa Ngôn Ngữ (Zero-Hardcode Strings)**: Mọi chuỗi văn bản hiển thị trên giao diện (nhãn, nút, tiêu đề, placeholder, thông báo...) bắt buộc phải sử dụng mã dịch i18n từ file từ điển (`vi.json`, `en.json`). Nghiêm cấm hardcode tiếng Việt hoặc tiếng Anh trực tiếp trong template hay component code.
  - **Directive & Pipe i18n**: Hỗ trợ `TranslateDirective` (`[appTranslate]="'KEY'"`) và `TranslatePipe` (`{{ 'KEY' | translate }}`) để áp dụng đa ngôn ngữ thuận tiện trên template.
  - **Bộ Design Token Enums Dùng Chung (Unified Design Tokens)**: Tuyệt đối không phân mảnh enum style cho từng component riêng biệt (cấm tạo `ButtonVariant`, `BadgeVariant` riêng gây trùng lặp). Chuẩn hóa thành bộ Design Token Enums chung trong `@shared/enums`: `ColorVariant`, `SizeVariant`, `ShapeVariant` để toàn bộ components (`SharpButton`, `Badge`, `SharpInput`, `Card`...) dùng chung một nguồn token nhất quán.
  - **Đóng Gói Component Giao Diện Dùng Chung (Component Reusability Rule)**: Mọi cụm giao diện có tính tái sử dụng hoặc xuất hiện từ 2 nơi trở lên (bộ chuyển ngôn ngữ `LanguageSwitcher`, thanh điều hướng `TopBar`, menu `NavBar`, breadcrumbs...) bắt buộc phải đóng gói thành component độc lập trong `src/frontend/shared/components/` để chia sẻ giữa Web và Mobile.
- **Cấm Hardcode URL & Cấu Hình Động Backend (Config-Driven URL Invariant)**:
  - Tuyệt đối nghiêm cấm hardcode các chuỗi URL frontend (`http://localhost:4200`, `http://...`) trong mã nguồn Backend Java.
  - Mọi liên kết URL gửi email (xác thực email, đặt lại mật khẩu, lời mời tenant...) phải được nạp động từ cấu hình Quarkus `@ConfigProperty(name = "openerp.frontend.url", defaultValue = "https://openerp.9ms.io.vn")`.
- **Chuẩn Hóa Java Enums Backend Đồng Bộ Với Frontend (Type-Safe Domain Enums)**:
  - Toàn bộ các giá trị phân loại (Roles, Tenant Types, Company Sizes, Account Statuses, Two-Factor Methods) trong DTO, Entity, Service của Backend Java bắt buộc phải khai báo dưới dạng Java `Enum`, đồng bộ 1-1 với TypeScript Enums của Frontend.
- **Chuẩn Mực API Contract Đa Ngôn Ngữ (Code-Based i18n API Contract)**:
  - Mọi phản hồi API (thành công lẫn thất bại) **bắt buộc phải trả về thuộc tính `code` dạng hằng số `UPPER_SNAKE_CASE`** (ví dụ: `AUTH_REGISTER_SUCCESS`, `AUTH_EMAIL_ALREADY_EXISTS`, `AUTH_INVALID_CREDENTIALS`).
  - **Tuyệt đối không hardcode message văn bản địa phương/tiếng Việt trong API contract** làm nguồn hiển thị duy nhất cho người dùng.
  - Frontend (Angular/Ionic) tự quản lý từ điển đa ngôn ngữ (`i18n/{lang}.json`) dựa trên `code` và `params` nhận từ API để hiển thị ngôn ngữ người dùng mà hoàn toàn không cần can thiệp backend.
- **Chuẩn Hóa ResponseKey Enum (Zero-Hardcode Payload Keys)**:
  - Mọi key trong `data` map của Backend hoặc DTO payload của Frontend bắt buộc phải dùng enum `ResponseKey` (ví dụ: `ResponseKey.TENANT_ID.getKey()`, `ResponseKey.USER_ID.getKey()`).
  - Tuyệt đối nghiêm cấm gõ chuỗi tự do (string literal) cho các thuộc tính payload trả về.
- **Dịch Vụ Backend Trả Về DTO Cố Định (Strict Response DTO Pattern)**:
  - Toàn bộ các service backend phải trả về Response DTO có định kiểu mạnh (`PersonalRegisterResponse`, `AuthResponse`, `UserProfileResponse`...), tuyệt đối không trả về `Map<String, Object>` tự do cho dữ liệu nghiệp vụ.
- **Quản Lý Phiên Bản & Bảo Vệ Mã Nguồn (.gitignore)**:
  - Mọi thư mục dự án con (`src/backend`, `src/frontend/web`, `src/frontend/mobile`, root) bắt buộc phải có file `.gitignore` riêng biệt, loại trừ triệt để thư mục build (`target/`, `dist/`, `.angular/`), cache, node_modules, log và các file bí mật (`*.pem`, `.env`, keystore).
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
> 11. Thiết kế hoặc trả về API response chứa message văn bản cứng đại diện cho kết quả nghiệp vụ mà không có mã định danh `code` chuẩn hóa cho Frontend đa ngôn ngữ.
> 12. Lưu trữ tài liệu Sprint rải rác ngoài thư mục Sprint-Pack (`docs/sprints/sprint_XX/`) hoặc thiếu file điều hướng `00_READING_GUIDE.md` dẫn đến việc người đọc không biết thứ tự tuần tự và bỏ sót bước xác nhận của khách hàng.
> 13. Sử dụng CSDL H2 hoặc các in-memory mock DB để kiểm thử backend thay vì kết nối trực tiếp PostgreSQL và Redis thật của môi trường dev.
> 14. Viết inline template HTML trong file component `.ts` của Frontend hoặc hardcode văn bản tĩnh mà không qua hệ thống đa ngôn ngữ i18n.
> 15. Sử dụng chuỗi tự do (string literal) cho các thuộc tính style, option, status, role thay vì khai báo và sử dụng Enum chuẩn hóa.
> 16. Đặt mã nguồn UI component dùng chung vào bên trong riêng thư mục Web hoặc Mobile làm mất khả năng tái sử dụng giữa hai nền tảng.
> 17. Hardcode URL frontend hoặc đường dẫn liên kết trong mã nguồn Backend thay vì nạp qua cấu hình Quarkus `@ConfigProperty`.
> 18. Tạo enum style/variant riêng biệt phân mảnh cho từng component thay vì dùng chung bộ Design Token Enums (`ColorVariant`, `SizeVariant`).
> 19. Viết trực tiếp mã markup lặp lại cho các thành phần giao diện dùng chung (như bộ chọn ngôn ngữ, topbar) thay vì đóng gói component dùng chung.
> 20. Hardcode chuỗi string literals tự do cho các key trong response data payload thay vì sử dụng Java/TypeScript enum `ResponseKey`.
> 21. Viết service backend trả về Map<String, Object> tự do cho dữ liệu nghiệp vụ thay vì định nghĩa class DTO cố định.
