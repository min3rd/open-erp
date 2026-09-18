# Quy Trình Phát Triển Phần Mềm Chuẩn Mực & Ràng Buộc Phối Hợp Multi-Agent

## 1. Nguyên Tắc Cốt Lõi Bất Di Bất Dịch (Immutable Guardrails)

- **Cấm Nhảy Cóc (Strict Sequence - No Skipping)**:
  Tuyệt đối không được chuyển sang bước lập trình (Coding) khi chưa hoàn tất phân tích yêu cầu, chưa có xác nhận từ khách hàng, và chưa có tài liệu thiết kế chi tiết (Architecture, DB, API, UI/UX).
- **Giao Tiếp Hướng Tài Liệu (Docs-driven Handover)**:
  Các Agent chỉ giao tiếp và chuyển giao công việc thông qua hệ thống tài liệu chuẩn trong thư mục `docs/`. Mỗi Agent bắt buộc phải đọc tài liệu đầu vào (Input Artifacts) từ Agent trước và xuất ra tài liệu hoàn chỉnh (Output Artifacts) cho Agent sau.
- **Khách Hàng Là Trọng Tâm (Customer Alignment)**:
  Mọi yêu cầu nhận qua truyền miệng (lời nói, tin nhắn vắn tắt) phải được chuyển hóa thành văn bản rõ ràng, phân tích tính khả thi và được khách hàng xác nhận nghiệm thu phạm vi (Scope & Acceptance Criteria) trước khi nghiên cứu và thiết kế giải pháp.

---

## 2. Quy Trình 9 Bước Chuẩn Hóa & Cấu Trúc Gói Tài Liệu Sprint-Pack

Toàn bộ tài liệu của một Sprint được đóng gói trọn gói trong thư mục `docs/sprints/sprint_XX_<tên_sprint>/` theo thứ tự tuần tự từ 00 đến 09:

| Bước | Tên Bước | Vai Trò Phụ Trách | Đầu Vào (Input) | Thư Mục / File Đầu Ra (Trong `sprint_XX/`) |
| :--- | :--- | :--- | :--- | :--- |
| **00**| **Bản đồ đọc & Xác nhận** | **BA / PM Agent** | Kế hoạch & mục tiêu Sprint | `00_READING_GUIDE.md` *(Cổng bắt đầu duy nhất)* |
| **01**| **Nhận yêu cầu truyền miệng** | **BA Agent** | Lời nói, chat, ghi chú sơ bộ | `01_raw_notes/RAW-XX_...md` |
| **02**| **Phân tích yêu cầu** | **BA Agent** | Ghi chú thô bước 1 | `02_analysis/ANL-XX_...md` |
| **03**| **Tham khảo phần mềm tương tự** | **BA Agent** | Nghiệp vụ cần giải quyết | `03_benchmarks/BENCH-XX_...md` |
| **04**| **Xác nhận với khách hàng** | **BA Agent** | Phân tích & Benchmarks | `04_confirmation/CONF-XX_...md` *(Confirmation Gate)* |
| **05**| **Nghiên cứu giải pháp** | **Solution Architect** | Yêu cầu đã khách hàng duyệt | `05_solutions/SOL-XX_...md` |
| **06**| **Thiết kế giải pháp chi tiết** | **Solution Architect** | Nghiên cứu giải pháp bước 5 | `06_designs/` (`database/`, `api/`, `ui_ux/`) |
| **07**| **Phân rã nhiệm vụ & Code** | **Developer Agent** | Thiết kế chi tiết bước 6 | `07_items/` (`FEAT-`, `TASK-`, `BUG-`) & `src/` |
| **08**| **Kiểm thử chất lượng** | **QA/QC Agent** | Tiêu chí nghiệm thu & Code | `08_testing/` (`test_plan.md`, `test_reports/`) |
| **09**| **Nghiệm thu & Đóng Sprint** | **PM Agent** | Báo cáo QA & Kiểm tra DoD | `09_review/` (`sprint_review.md`) |

---

## 3. Quy Tắc Hoạt Động Cho Từng Agent

### 3.1. BA Agent (Business Analyst)
- Thu thập đầy đủ bối cảnh khi nhận yêu cầu bằng lời/chat. Đặt câu hỏi làm rõ các điểm mơ hồ (ambiguities).
- Khảo sát các hệ thống ERP hàng đầu (Odoo, ERPNext, SAP Business One, Salesforce...) xem họ giải quyết bài toán đó như thế nào.
- Soạn tài liệu xác nhận tóm tắt: Mục tiêu, Phạm vi trong/ngoài (In-scope / Out-of-scope), Luồng nghiệp vụ chính, và Tiêu chí nghiệm thu (Acceptance Criteria).
- **Điều kiện hoàn thành**: Phải có sự đồng thuận/xác nhận rõ ràng từ khách hàng.

### 3.2. Solution Architect Agent (SA / Tech Lead)
- Nghiên cứu công nghệ, thư viện, mô hình dữ liệu tối ưu nhất cho bài toán.
- Thiết kế chi tiết đến từng trường dữ liệu (DB schema/ERD), từng endpoint (Request/Response API Spec), luồng dữ liệu (Data Flow / Sequence Diagram) và cấu trúc component UI.
- Không để tồn tại các giả định ngầm (implicit assumptions) chưa được làm rõ trong tài liệu thiết kế.
- **Điều kiện hoàn thành**: Tài liệu thiết kế trong `docs/sprints/sprint_XX_<tên_sprint>/06_designs/` hoàn chỉnh để Developer chỉ cần đọc là code được ngay mà không cần đoán.

### 3.3. Developer Agent (Dev)
- Tuân thủ 100% tài liệu thiết kế trong `docs/sprints/sprint_XX_<tên_sprint>/06_designs/`.
- Nếu phát hiện vấn đề kỹ thuật phát sinh hoặc cần thay đổi CSDL/API, KHÔNG tự ý thay đổi mã nguồn mà phải chuyển ngược lại cho Solution Architect cập nhật tài liệu thiết kế trước.
- Viết code có cấu trúc rõ ràng, kèm comment và self-documenting.
- **Chính sách Unit Test thực dụng**:
  - **Backend (Quarkus Java)**: Bắt buộc viết Unit Test (JUnit 5 + RestAssured) cho 100% logic nghiệp vụ, tính toán tài chính/số liệu và phân quyền Tenant.
  - **Frontend (Angular/Ionic)**: **TUYỆT ĐỐI KHÔNG viết Unit Test** (không tạo file `.spec.ts`). Tránh lãng phí thời gian và chi phí bảo trì giòn gãy khi code bằng AI.

### 3.4. QA/QC Agent (Tester)
- Xây dựng Test Plan và Test Cases dựa trên Acceptance Criteria từ bước BA và API/UI Spec từ bước Architect.
- **Kiểm thử Frontend thực tế bằng Trình duyệt (Browser Manual Testing)**:
  - QA/QC bắt buộc kiểm thử trực tiếp trên Web Browser đối với Angular và thiết bị/mô phỏng đối với Ionic 8.
  - Kiểm tra trực quan bố cục UI, độ đậm đặc thông tin (dense/compact), sự mượt mà của Drawer, responsive và không có lỗi Console/Network.
- **Kiểm thử Backend**: Chạy tự động bộ Unit/Integration Test của Quarkus Java, kiểm thử chống rò rỉ dữ liệu đa Tenant.
- Nếu phát hiện lỗi (Bug), ghi nhận bug report cụ thể và chuyển lại cho Developer Agent xử lý.

### 3.5. PM Agent (Project Manager)
- Sau mỗi công đoạn hoặc mỗi tính năng hoàn thành, cập nhật ngay `docs/project_management/task_board.md`, `work_log.md` và `changelog.md`.
- Đảm bảo tính minh bạch, ghi rõ ai làm gì, trạng thái ra sao, liên kết đến tài liệu liên quan.

---

## 4. Quy Tắc Agile Sprints: Mô Hình Sprint-Pack Tuần Tự & Quản Lý Dạng File

### 4.1. Mô Hình Gói Tài Liệu Sprint Tuần Tự (Sprint-Pack Sequential Documentation)
- **Tập trung hóa theo Sprint**: Toàn bộ tài liệu liên quan đến một Sprint **bắt buộc phải nằm trọn vẹn trong một thư mục duy nhất**:
  `docs/sprints/sprint_XX_<tên_nghiệp_vụ>/`
- **Quy tắc đánh số thứ tự tuần tự (00 - 09)**: Từng thư mục con và file bên trong phải có tiền tố số thứ tự để người đọc (Khách hàng, Architect, Dev, QA, PM) luôn biết chính xác **phải đọc tài liệu nào trước, tài liệu nào sau**.
- **Tiêu chuẩn file điều hướng bắt buộc `00_READING_GUIDE.md`**:
  - Mỗi Sprint **bắt buộc phải có file `00_READING_GUIDE.md`** ngay tại gốc thư mục của Sprint đó.
  - File này là **cổng giao tiếp duy nhất** giữa Agent và Khách hàng khi bắt đầu hoặc cập nhật Sprint.
  - Phải chia rõ 3 chặng đọc:
    1. *Chặng 1 - Nghiệp vụ (Dành cho Khách hàng/PO)*: Đọc lần lượt `01_raw_notes` $\rightarrow$ `02_analysis` $\rightarrow$ `03_benchmarks` $\rightarrow$ Ký xác nhận tại `04_confirmation`.
    2. *Chặng 2 - Kỹ thuật (Dành cho Solution Architect & Dev)*: Đọc `05_solutions` $\rightarrow$ `06_designs` $\rightarrow$ `07_items` để triển khai.
    3. *Chặng 3 - Nghiệm thu (Dành cho QA & PM)*: Đọc `08_testing` $\rightarrow$ Tổng kết tại `09_review`.
- **Nghiêm cấm**: Tuyệt đối không lưu trữ tài liệu sprint rải rác ngoài thư mục Sprint-Pack.

### 4.2. Quản Lý Mọi Yêu Cầu, Lỗi & Công Việc Dưới Dạng File (File-based Item Tracking)
- Trong suốt quá trình phát triển, các Agent **bắt buộc tạo file riêng** cho mọi công việc phát sinh, lưu tại `docs/sprints/sprint_XX_<tên_nghiệp_vụ>/07_items/`:
  - **Task kỹ thuật**: `TASK-xxx_<tên>.md`
  - **Bug / Lỗi**: `BUG-xxx_<tên>.md`
  - **Feature bổ sung**: `FEAT-xxx_<tên>.md`
  - **Refactor / Tối ưu mã nguồn**: `REFACTOR-xxx_<tên>.md`
- **Quy tắc bắt buộc đối với mỗi file Item**:
  - Phải có mã định danh duy nhất (ID).
  - Phải xác định rõ mức độ ưu tiên: `Critical`, `High`, `Medium`, hoặc `Low`.
  - Phải gán người phụ trách (Assignee) và tài liệu thiết kế/nghiệp vụ liên quan.
  - Phải quản lý trạng thái vòng đời: `To Do` $\rightarrow$ `In Progress` $\rightarrow$ `In Review / Testing` $\rightarrow$ `Done`.

### 4.3. Ràng Buộc Nghiêm Ngặt Khi Đóng Sprint (Sprint Closure DoD Gate)
> **ĐIỀU KIỆN ĐÓNG SPRINT BẮT BUỘC**:
> Một Sprint **CHỈ ĐƯỢC PHÉP ĐÓNG** khi:
> 1. **KHÔNG CÒN BẤT KỲ task, bug, feature, refactor nào ở mức độ ưu tiên LỚN HƠN MEDIUM (`Critical`, `High`) chưa hoàn thành**. 100% item ở mức `Critical` và `High` phải ở trạng thái `Done` và được QA kiểm thử đạt chuẩn.
> 2. Các item ở mức `Medium` hoặc `Low` nếu chưa kịp hoàn thành trong Sprint hiện tại thì phải được ghi nhận rõ ràng lý do và chuyển giao (rollover) sang backlog của Sprint tiếp theo.
> 3. Phải lập biên bản tổng kết Sprint tại `docs/sprints/sprint_XX_<tên_nghiệp_vụ>/09_review/sprint_review.md` xác nhận hoàn thành trước khi bắt đầu Sprint mới.

---

## 5. Quy Chuẩn Kiến Trúc Microservices, Multi-Tenancy & Hệ Thống Plugin

### 5.1. Ranh Giới Tối Giản Của Tầng Core (Core Invariant)
- Tầng Core của hệ thống được giới hạn nghiêm ngặt, **chỉ phụ trách các nghiệp vụ nền tảng**:
  1. **Authentication & Onboarding**: Đăng ký, đăng nhập, xác thực đa yếu tố, khởi tạo Tenant.
  2. **Account & Organization Management**: Quản trị người dùng, cơ cấu tổ chức/phòng ban của Tenant.
  3. **Functional RBAC**: Phân quyền chức năng theo vai trò (Roles, Permissions, Policies).
  4. **Data RBAC & Scoping**: Phân quyền dữ liệu (Row-Level Security, Data Ownership theo Tenant/Chi nhánh/Phòng ban).
  5. **Plugin Manager & Registry**: Quản lý vòng đời plugin, khám phá plugin, điều phối cài đặt, kích hoạt, nâng cấp và gỡ bỏ.
- **NGHIÊM CẤM**: Đưa mã nguồn xử lý nghiệp vụ bán hàng, kế toán, kho, nhân sự... vào tầng Core.

### 5.2. Nguyên Tắc Phân Lập Dữ Liệu Đa Khách Thuê (Tenant Isolation Invariant)
- Hệ thống hoạt động theo mô hình SaaS phục vụ đa doanh nghiệp/khách thuê (Multiple Tenants).
- **Tuyệt đối không để rò rỉ dữ liệu chéo**: Mọi truy vấn CSDL, cache hay event message đều bắt buộc phải gắn ngữ cảnh `tenant_id`.
- Tầng API Gateway / Interceptor bắt buộc trích xuất và validate `Tenant Context` trước khi chuyển tiếp request vào các dịch vụ bên trong.

### 5.3. Tiêu Chuẩn Plugin Hóa (Pluggable Architecture)
- Mọi tính năng nghiệp vụ ngoài Core đều phải được đóng gói thành một **Plugin độc lập**.
- Tenant Admin có quyền cài đặt (install), gỡ bỏ (uninstall), bật (activate) hoặc tắt (deactivate) bất kỳ plugin nào tùy ý mà không ảnh hưởng đến hoạt động của Core và các Plugin khác.
- Mỗi Plugin phải có file đặc tả `plugin.json` (Manifest) quy định: mã định danh, tên hiển thị, phiên bản, quyền hạn yêu cầu, dependencies, và endpoints/hooks.

### 5.4. Quản Lý Phiên Bản (SemVer) & Migration Dữ Liệu An Toàn
- **Semantic Versioning**: Mọi Plugin phải được đánh phiên bản theo chuẩn `vMAJOR.MINOR.PATCH`. Phải kiểm tra tương thích phụ thuộc (Dependency Compatibility) trước khi cho phép cài đặt/nâng cấp.
- **Cơ Chế Migration Theo Từng Tenant**:
  - Mỗi Plugin phải chứa các kịch bản migration schema độc lập gồm cả chiều `up` (nâng cấp) và `down` (rollback).
  - **Khi cài đặt Plugin cho Tenant**: Chạy migration khởi tạo bảng/dữ liệu trong không gian dữ liệu của Tenant đó.
  - **Khi nâng cấp Plugin**: Chạy migration tuần tự từ version cũ lên version mới theo từng bước an toàn.
  - **Khi gỡ bỏ Plugin**: Bắt buộc tạo snapshot sao lưu dữ liệu của Tenant trước khi thực hiện dọn dẹp hoặc archive, đảm bảo khả năng phục hồi dữ liệu khi cần.

---

## 6. Quy Chuẩn Tech Stack, Thư Viện UI Dùng Chung & Cơ Chế Entity Registry

### 6.1. Tech Stack Chuẩn Mực Bắt Buộc
- **Backend**: **Quarkus** (Ngôn ngữ lập trình chính thức và bắt buộc: **Java**, phiên bản Java LTS 21+). Sử dụng RESTEasy Reactive, Hibernate ORM with Panache, SmallRye Reactive Messaging Kafka, và Quarkus Redis Client.
- **Frontend Web / Desktop**: **Angular >= 22** + **Tailwind CSS v4**. Tận dụng Standalone Components, Signals, và control flow mới nhất.
- **Frontend Mobile**: **Ionic 8 + Angular**. Tối giản chức năng, tối ưu hóa cho màn hình cảm ứng, thao tác nhanh hiện trường.
- **Cơ sở dữ liệu**:
  - **PostgreSQL**: CSDL chính, dữ liệu quan hệ có cấu trúc, giao dịch tài chính/bán hàng/kho, phân lập dữ liệu đa khách thuê (RLS).
  - **MongoDB**: CSDL NoSQL, sử dụng khi có nhu cầu lưu trữ tài liệu phi cấu trúc, nhật ký kiểm toán (audit trail), dynamic form schemas, log hệ thống.
  - **Redis**: Caching phân tán, quản lý phiên làm việc (session), distributed locks, rate limiting.
- **Message Broker**: **Apache Kafka**. Đảm nhận toàn bộ luồng sự kiện bất đồng bộ (Domain Events, Integration Events, Migration Events).

### 6.2. Quy Tắc Thư Viện Giao Diện Dùng Chung (Component-First Invariant)
- **Đồng nhất giao diện**: Để đảm bảo trải nghiệm người dùng nhất quán giữa Web và Mobile, toàn bộ UI components phải được quản lý tập trung trong một **Thư viện giao diện dùng chung (Shared UI Library)**.
- **Quy tắc Component-First (Bắt buộc)**:
  - Bất kỳ khi nào phát sinh một component giao diện mới (Button, Modal, Table, Input, FilterBar, StatCard, Badge, Dropdown...), **bắt buộc phải xây dựng và hoàn thiện component đó trong Thư viện dùng chung trước**.
  - Ứng dụng Web và ứng dụng Mobile sau đó chỉ việc import component từ thư viện dùng chung để sử dụng.
- **Hạn Chế Tối Đa Thư Viện Bên Thứ 3**:
  - Tuyệt đối hạn chế cài đặt các thư viện UI bên ngoài (Material, PrimeNG, AntDesign...).
  - Ưu tiên tự hiện thực các component chuẩn mực, gọn nhẹ, hiệu năng cao dựa trên Angular primitives và Tailwind CSS 4.

### 6.3. Quy Tắc Phân Định Nền Tảng (Platform Capability Invariant)
- Bản Mobile được định hướng tối giản hơn Web, chỉ phục vụ các tác vụ nhanh gọn (xem báo cáo nhanh, duyệt đơn hàng, kiểm kho mã vạch...).
- Mọi Plugin bắt buộc phải phân định minh bạch tính năng theo nền tảng:
  - `platforms.desktop`: Danh sách tính năng, màn hình và quyền thao tác trên Web/Desktop.
  - `platforms.mobile`: Danh sách tính năng, màn hình và quyền thao tác trên Mobile App.

### 6.4. Cơ Chế Đăng Ký Thực Thể (Entity Registry Invariant)
- Mọi module và Plugin khi định nghĩa thực thể CSDL (PostgreSQL JPA Entity hoặc MongoDB Panache Entity) **bắt buộc phải đăng ký thông tin thực thể vào Entity Registry chung**.
- **Thông tin đăng ký bao gồm**: Tên thực thể, Plugin sở hữu, Khóa chính, Danh sách trường công khai (Public Fields), và các điểm neo quan hệ (Extension Points / Foreign Key anchors).
- Nhờ Entity Registry, các Plugin khác có thể khám phá và liên kết dữ liệu mà không cần phụ thuộc mã nguồn trực tiếp vào nhau.

### 6.5. Kiến Trúc CSDL Quy Mô Lớn: Multi-Database, Master-Slave & Replica-Set
- **Hỗ Trợ Multi-Database (Database-per-Tenant)**:
  - Hệ thống hỗ trợ kiến trúc linh hoạt: mô hình Shared Database (RLS) cho các tenant vừa/nhỏ và mô hình **Database-per-Tenant** (mỗi Tenant một database vật lý riêng biệt) cho các khách hàng lớn/enterprise nhằm cô lập dữ liệu tuyệt đối và tối đa hóa hiệu năng.
- **Cơ Chế Phân Tải Đọc/Ghi (Master - Slave / Read-Replicas)**:
  - Hỗ trợ kiến trúc Master - Slave cho PostgreSQL: Mọi tác vụ ghi (Insert, Update, Delete) đi vào node Master (Primary); các truy vấn đọc (Select, Report, Analytics) được tự động phân tải sang các node Slave (Read-Replicas).
- **Cơ Chế Replica-Set Đảm Bảo Tính Sẵn Sàng Cao (High Availability - HA)**:
  - Áp dụng Replica-Set cho MongoDB và PostgreSQL streaming replication để đảm bảo hệ thống không có điểm lỗi đơn (No Single Point of Failure) và tự động failover khi có sự cố.
- **Định Tuyến Nguồn Dữ Liệu Động (Dynamic Datasource Routing)**:
  - Backend Quarkus sử dụng cơ chế Dynamic Datasource Routing để tự động chọn đúng Database Connection Pool dựa trên Tenant ID và tính chất giao dịch (Read-Only vs Read-Write).

---

## 7. Môi Trường Local Dev, Bộ Scripts Điều Phối, Triển Khai K8s & Bộ Tài Liệu Mở Rộng

### 7.1. Môi Trường Local Dev Tối Giản Tài Nguyên (Minimal Service Footprint)
- Do tài nguyên máy trạm (RAM/CPU) của lập trình viên có hạn, môi trường Local Dev **bắt buộc tuân thủ nguyên tắc tối giản**:
  - **Mặc định tối thiểu (Minimal Baseline)**: Khi chạy `make infra` hoặc `docker compose up -d`, hệ thống **CHỈ khởi chạy 2 dịch vụ thiết yếu**:
    1. **PostgreSQL Primary** (Cơ sở dữ liệu quan hệ, multi-tenancy, giới hạn RAM: 512MB).
    2. **Redis** (Cache phân tán, auth token, session, giới hạn RAM: 256MB).
    *(Tổng mức tiêu thụ RAM chỉ khoảng ~300MB, khởi động dưới 5 giây)*.
  - **Kích hoạt theo nhu cầu (On-Demand Profiles)**: Các dịch vụ nặng được cấu hình qua Docker Compose Profiles, chỉ bật khi làm việc với module tương ứng:
    - Profile `kafka`: Apache Kafka (KRaft) + Kafka UI (chỉ bật khi dev messaging/events).
    - Profile `mongo`: MongoDB Replica-Set (chỉ bật khi dev audit logs / schema động).
    - Profile `replica`: PostgreSQL Read-Replica (chỉ bật khi test tách luồng đọc/ghi).
    - Profile `storage`: MinIO S3 Object Storage.
    - Profile `mail`: Mailpit SMTP.
    - Profile `full`: Khởi chạy toàn bộ khi máy có RAM dồi dào (>= 8GB) hoặc kiểm thử tích hợp.
  - **Giới hạn tài nguyên nghiêm ngặt**: Toàn bộ container trong `docker-compose.yml` bắt buộc phải có thông số `deploy.resources.limits.memory` để ngăn chặn container chiếm dụng cạn kiệt RAM hệ điều hành máy host.

### 7.2. Quản Lý Tập Trung Bộ Scripts Phát Triển (Centralized Scripts)
- Toàn bộ các script khởi chạy dev cho Backend Quarkus Java, Web Angular 22, Mobile Ionic 8 được đặt trong thư mục `scripts/dev/` và quản lý tập trung qua `Makefile`:
  - `make infra` (hoặc `make infra-minimal`): Khởi động cụm dịch vụ tối thiểu (Postgres Primary + Redis).
  - `make infra-kafka`: Khởi động tối thiểu + Kafka & Kafka UI.
  - `make infra-mongo`: Khởi động tối thiểu + MongoDB.
  - `make infra-full`: Khởi động toàn bộ dịch vụ (yêu cầu RAM >= 8GB).
  - `make infra-down`: Dừng và giải phóng toàn bộ containers Docker.
  - `make backend`: Khởi chạy Quarkus Dev Mode (hỗ trợ live-reload tại cổng 8088).
  - `make web`: Khởi chạy Angular 22 Dev Server (cổng 4200).
  - `make mobile`: Khởi chạy Ionic 8 Dev Server (cổng 8100).
  - `make dev`: Khởi động hạ tầng tối thiểu và hướng dẫn chạy ứng dụng.

### 7.3. Tiêu Chuẩn Đóng Gói & Triển Khai Staging/Production (Docker & Kubernetes)
- Mọi dịch vụ Backend và Web phải có Multi-stage Dockerfile tối ưu kích thước, tách biệt tầng build và tầng runtime, tuân thủ nguyên tắc bảo mật non-root user.
- Thư mục `deployments/k8s/` tổ chức theo Kustomize (base, overlays/staging, overlays/production) đầy đủ Deployment, Service, Ingress, HPA, ConfigMap, Secret.
- Có bộ script tự động hóa triển khai trong `scripts/deploy/` (`build_images.sh`, `deploy_docker.sh`, `deploy_k8s.sh`).

### 7.4. Quy Chuẩn Bộ Ba Tài Liệu Bắt Buộc Trong `docs/`
Bất kỳ tính năng hoặc release nào khi hoàn thành đều bắt buộc phải cập nhật/bổ sung đủ 3 bộ tài liệu:
1. **`docs/06_user_guides/` - Tài liệu Hướng Dẫn Sử Dụng (Bắt buộc có hình ảnh trực quan)**:
   - Mô tả chi tiết từng bước thao tác từ góc nhìn người dùng cuối (Tenant Admin, Nhân viên).
   - **BẮT BUỘC**: Phải có hình ảnh chụp màn hình (screenshots), biểu đồ luồng thao tác trực quan minh họa từng bước. Nghiêm cấm viết tài liệu sử dụng thuần text.
2. **`docs/07_deployment_guides/` - Tài liệu Hướng Dẫn Cài Đặt & Triển Khai**:
   - Hướng dẫn setup môi trường Local Dev.
   - Hướng dẫn cấu hình biến môi trường, container hóa Docker cho Staging.
   - Hướng dẫn triển khai cụm Kubernetes cho Production (Scaling, Backup, Monitoring).
3. **`docs/08_developer_guides/` - Tài liệu Hướng Dẫn Phát Triển Phần Mềm**:
   - Quy chuẩn lập trình Quarkus Java & Angular 22 / Ionic 8.
   - Hướng dẫn tạo mới một Plugin theo đúng kiến trúc hệ thống.
   - Hướng dẫn tạo và đóng góp component mới vào `shared-ui-lib`.
   - Hướng dẫn viết migration dữ liệu cho Plugin theo từng Tenant.

---

## 8. Quy Chuẩn Thiết Kế UI/UX ERP Nhỏ Gọn, Vuông Vắn & Điều Hướng Anti-Modal

### 8.1. Mật Độ Thông Tin Cao (High-Density & Compact Design)
- Đặc thù của phần mềm ERP là xử lý khối lượng lớn dữ liệu tài chính, kho vận, bán hàng. Giao diện phải ưu tiên **hiển thị tối đa thông tin hữu ích trong một khung hình**:
  - **Typography nhỏ gọn**: Font chữ chuẩn cho nội dung bảng và form là `text-xs` (12px) hoặc `text-sm` (13px); tiêu đề nhóm là `text-sm font-semibold`.
  - **Khoảng cách và lề thu gọn (Tight Spacing)**: Sử dụng padding và margin nhỏ: `p-1` đến `p-2.5`, `gap-1` đến `gap-2`, `space-y-1.5`. Hạn chế tối đa các khoảng trắng dư thừa (empty whitespace).
  - **Bảng dữ liệu đậm đặc (Dense Data Tables)**: Chiều cao mỗi dòng bảng từ `28px` đến `34px`, căn chỉnh dữ liệu số sang phải, text sang trái, badge trạng thái nhỏ gọn.

### 8.2. Thiết Kế Vuông Vắn & Hiện Đại (Sharp / Squared Aesthetic)
- Tạo phong cách công nghiệp hiện đại, nghiêm túc và hiệu quả:
  - **Góc cạnh sắc nét**: Sử dụng `rounded-none` hoặc tối đa `rounded-sm` (1px - 2px). Tuyệt đối tránh phong cách bo tròn bong bóng lớn (`rounded-xl`, `rounded-full`).
  - **Đường viền mảnh tinh tế**: Sử dụng viền sắc sảo: `border border-neutral-200 dark:border-neutral-800`.
  - **Phân cách trực quan**: Sử dụng divider mỏng phân tách rõ các khu vực làm việc.

### 8.3. Triết Lý Điều Hướng Không Dùng Modal (Anti-Modal Architecture)
- Modal (Popup che giữa màn hình) làm đứt gãy mạch suy nghĩ, che khuất dữ liệu đối chiếu và không thể chia sẻ đường dẫn (URL state). **Nghiêm cấm lạm dụng Modal**.
- **Ba giải pháp thay thế bắt buộc**:
  1. **Angular Router (Nested Routes / Child Outlets)**:
     - Biểu thị trạng thái qua URL (ví dụ: `/sales/orders/123/edit`).
     - Cho phép bookmark, chia sẻ link trực tiếp và điều hướng Back/Forward tự nhiên.
  2. **Drawer (Side Sheet / Slide-over Panel trượt từ cạnh phải)**:
     - Dùng cho các thao tác xem nhanh chi tiết, tạo nhanh hoặc chỉnh sửa biểu mẫu.
     - Giữ nguyên tầm nhìn vào bảng danh sách bên trái.
     - Hỗ trợ **xếp chồng đa tầng (Stacked Drawers)**: Khi đang ở Drawer A bấm xem chi tiết khách hàng thì Drawer B trượt ra đè một phần lên Drawer A với độ lệch z-index và shadow trực quan.
  3. **Chia Màn Hình Đa Phần (Split-Screen / Multi-Pane Layout)**:
     - Chia màn hình thành 2 hoặc 3 cột cố định/resizable (ví dụ: Master-Detail view — danh sách bên trái chiếm 30-40%, chi tiết phiếu và thao tác bên phải chiếm 60-70%).
     - Người dùng có thể duyệt từng dòng danh sách và xem ngay thông tin cập nhật ở cột bên cạnh mà không cần rời trang.

---

## 9. Quy Chuẩn API Contract Code-Driven & Đa Ngôn Ngữ Độc Lập Frontend

### 9.1. Triết Lý Code-Driven i18n
- Để hệ thống Open-ERP đáp ứng đa ngôn ngữ (Tiếng Việt, Tiếng Anh...) mà không làm phức tạp hóa backend hay phá vỡ tính phân tách (separation of concerns):
  - **Cấm hardcode văn bản thông điệp trong API response**: Backend không trả về các chuỗi text tiếng Việt/địa phương cứng để hiển thị cho người dùng cuối.
  - **Mã hóa kết quả bằng thuộc tính `code`**: Mọi phản hồi bắt buộc có thuộc tính `code` dạng hằng số `UPPER_SNAKE_CASE`.
  - **Frontend làm chủ việc hiển thị (Client-Side Localization)**: Frontend duy trì từ điển `i18n/{lang}.json`. Khi nhận `code`, Frontend tự tra cứu và render đúng ngôn ngữ của người dùng.
  - **Nội suy tham số linh hoạt (`params`)**: Backend trả về các tham số động qua object `params` (ví dụ: `{ "field": "email", "retry_after": 900 }`) để Frontend nội suy vào chuỗi bản dịch mà không cần ghép chuỗi ở server.

### 9.2. Khung Phản Hồi Chuẩn Mực (Standardized Envelope)
- **Phản hồi Thành Công (HTTP 2xx)**:
  ```json
  {
    "success": true,
    "code": "AUTH_REGISTER_SUCCESS",
    "message": "User registered successfully", // Fallback / Dev debug
    "data": { ... }
  }
  ```
- **Phản hồi Thất Bại (HTTP 4xx / 5xx)**:
  ```json
  {
    "success": false,
    "code": "AUTH_EMAIL_ALREADY_EXISTS",
    "message": "Email is already taken",       // Fallback / Dev debug
    "params": { "field": "email" },
    "errors": [
      {
        "field": "email",
        "code": "VALIDATION_EMAIL_DUPLICATE"
      }
    ],
    "timestamp": "2026-09-17T15:30:00Z"
  }
  ```

### 9.3. Quy Tắc Đặt Tên Mã `code` (Naming Convention)
- **Cấu trúc chuẩn**: `<MODULE>_<ENTITY/TOPIC>_<STATUS/RESULT>`
- **Ví dụ chuẩn mực**:
  - Thành công: `AUTH_LOGIN_SUCCESS`, `AUTH_EMAIL_VERIFIED`, `AUTH_2FA_ENABLED`, `ACCOUNT_PROFILE_UPDATED`.
  - Thất bại / Lỗi: `AUTH_INVALID_CREDENTIALS`, `AUTH_ACCOUNT_LOCKED`, `AUTH_OTP_INVALID_OR_EXPIRED`, `AUTH_2FA_CODE_INVALID`, `VALIDATION_FAILED`, `TENANT_NOT_FOUND`.
