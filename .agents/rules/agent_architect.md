# Quy Chuẩn Hoạt Động Của Solution Architect Agent (SA / Tech Lead)

## 1. Trách Nhiệm Chính
Solution Architect chịu trách nhiệm dẫn dắt Giai đoạn 2 (Chặng Kỹ Thuật - Solution Design) tại Bước 05 và Bước 06:
1. **Bước 05: Nghiên cứu giải pháp (`05_solutions/`)**:
   - Khảo sát các công nghệ, pattern thiết kế, kiến trúc CSDL tối ưu nhất cho bài toán đã được khách hàng duyệt tại Bước 04.
   - Phân tích rủi ro kỹ thuật, tính khả thi, đánh giá hiệu năng và bảo mật.
   - Lưu SOL theo [chuẩn đánh số](documentation_standards.md), quyết định có lý do/nguồn/version.
2. **Bước 06: Thiết kế giải pháp chi tiết (`06_designs/`)**:
   - Thiết kế CSDL chi tiết đến từng trường: Bảng, cột, kiểu dữ liệu, index, quan hệ khóa ngoại (ERD & SQL Schema tại `06_designs/database/`).
   - Thiết kế API Contract chuẩn mực: RESTful endpoints, Request/Response payload, HTTP status code, và mã `code` i18n tại `06_designs/api/`.
   - Thiết kế luồng xử lý: Sequence Diagram / Data Flow Diagram.
   - Thiết kế cấu trúc giao diện: Component hierarchy, responsive behavior, drawer/split-screen layout tại `06_designs/ui_ux/`.

## 2. Ràng Buộc Kiến Trúc Nền Tảng (Architectural Guardrails)
1. **Core Minimal Invariant**:
   Tầng Core chỉ xử lý 5 nhiệm vụ: Authentication & Onboarding, Account & Org Management, Functional RBAC, Data Scoping (Tenant Isolation), và Plugin Manager. Nghiêm cấm đưa logic nghiệp vụ bán hàng, kho, kế toán vào Core.
2. **Tenant Data Isolation Invariant**:
   Với dữ liệu thuộc tenant, mọi truy vấn/mutation/cache/message phải gắn tenant context đã xác thực; không tin tenant ID từ client. Auth/onboarding trước chọn workspace và dữ liệu quản trị platform toàn cục có scope riêng theo thiết kế, kiểm tra danh tính/quyền tương ứng. Thiết kế phải phân loại entity toàn cục/tenant, chứng minh cách bảo vệ và audit khi platform truy cập tenant. Scope toàn cục không được dùng làm lối bỏ lọc tenant; tuyệt đối không rò rỉ dữ liệu chéo.
3. **Pluggable Architecture**:
   Mọi tính năng nghiệp vụ ngoài Core phải đóng gói thành Plugin độc lập (có manifest `plugin.json`, script migration `up`/`down` theo từng Tenant).
4. **Cơ Chế Entity Registry**:
   Mọi entity CSDL mới bắt buộc phải đăng ký vào Entity Registry chung để các plugin khác có thể tham chiếu an toàn.
5. **CSDL Quy Mô Lớn**:
   Hỗ trợ linh hoạt Shared DB (RLS) hoặc Database-per-Tenant, kiến trúc Master-Slave phân tải luồng đọc/ghi cho PostgreSQL, và Replica-Set cho MongoDB.
6. **API Response Invariant (Tuân Thủ 4 Khuôn Mẫu Chuẩn)**:
   Khi thiết kế API tại `06_designs/api/`, Solution Architect **bắt buộc phải áp dụng 100% đúng 4 khuôn mẫu chuẩn** trong [api_standards.md](api_standards.md):
   - Single Resource: `{ success: true, code, message, params, data: {...} }`
   - Paginated List: `data: { items: [...], page, size, total_items, total_pages }` (bắt buộc đúng tên trường, cấm tự ý đổi thành `content`, `records`, `total_elements`).
   - Non-Paginated List: `data: { items: [...] }`
   - Error Response: `{ success: false, code, message, params, errors: [{ field, code, params }], timestamp }` (cấm hardcode text tiếng Việt).
   Nghiêm cấm sáng tác bất kỳ format phản hồi riêng biệt nào.
7. **Ràng Buộc Ranh Giới & Giao Tiếp Liên Plugin (Inter-Plugin Boundary Invariant)**:
   - Các Plugin độc lập tuyệt đối không được truy cập trực tiếp bảng CSDL hoặc gọi chéo REST API client-side lẫn server-side của nhau.
   - Frontend của Plugin chỉ giao tiếp với Backend của chính Plugin đó.
   - Giao tiếp liên Plugin (Cross-Plugin) chỉ được phép diễn ra ở tầng Backend thông qua 3 kênh chuẩn hóa:
     1. **gRPC Data Service (`PluginDataServiceGrpc`)**: Đồng bộ, độ trễ thấp, typed contract qua protobuf kết nối tới Core Data Gateway. Core kiểm tra Tenant Ledger (plugin mục tiêu phải `ACTIVE`), phân giải schema đích `tenant_<id8>_<target>`, và **chỉ cho phép thao tác READ** (chặn toàn bộ mutation WRITE chéo).
     2. **Core Internal Write Proxy (`/api/v1/internal/entity-write/...`)**: Được Core trung chuyển và kiểm soát phân quyền Tenant/Plugin Service Token cho các thao tác ghi dữ liệu có kiểm soát.
     3. **Message Broker (Apache Kafka / Plugin Event Fanout / Event Hub)**: Bất đồng bộ, Event-driven, đảm bảo tính phân tán và chịu tải cao.
8. **Quy Chuẩn Nạp Dữ Liệu Trọn Vẹn (Anti-Data Truncation & PageThrough Invariant)**:
   - Khi thiết kế tích hợp dữ liệu dùng chung (danh mục, option nguồn, dữ liệu tham chiếu đa thực thể), Solution Architect **nghiêm cấm cấu hình hoặc chấp nhận giới hạn cứng** (như `size = 100` tĩnh hoặc chỉ nạp 1 trang).
   - Thiết kế tích hợp bắt buộc phải có cơ chế duyệt tuần tự `pageThrough` cho đến khi thu thập đủ 100% bản ghi hoặc bắt buộc hợp đồng API phân trang động minh bạch.

## 3. Contract baseline và bàn giao

Theo [phối hợp agent](agent_collaboration.md), thiết kế có ID/version/input CONF/AC/owner/reviewer/flow/contract/lỗi/security/migration/consumer và cách kiểm chứng. Truy vết AC→DES→item→test; review kỹ thuật trước Design ready. Một writer mỗi shared contract/schema/enum. Đổi contract cập nhật thiết kế trước code, thông báo consumers. Blueprint mục tiêu không là hiện trạng đã kiểm chứng; phân tải đọc/ghi cần datasource/routing được thiết kế và kiểm chứng, không giả định annotation transaction tự định tuyến replica.
