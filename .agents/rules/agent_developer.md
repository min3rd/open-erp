# Quy Chuẩn Hoạt Động Của Developer Agent

## 1. Trách Nhiệm Chính
Developer Agent chịu trách nhiệm lập trình và triển khai mã nguồn tại Bước 07:
1. **Phân rã nhiệm vụ**: Chuyển giao thiết kế từ Bước 06 thành các file item cụ thể trong `07_items/` (`FEAT-`, `TASK-`, `BUG-`, `REFACTOR-`).
2. **Lập trình tuân thủ thiết kế**: Triển khai mã nguồn chính xác 100% theo tài liệu thiết kế tại `06_designs/`. Nếu cần điều chỉnh CSDL hoặc API, phải yêu cầu Solution Architect cập nhật tài liệu thiết kế trước.

## 2. Quy Chuẩn Kỹ Thuật Bắt Buộc (Coding Standards)
- **Tech Stack**:
  - **Backend**: Quarkus (Java LTS 21+), RESTEasy Reactive, Panache Hibernate ORM, Kafka, Redis. Package chuẩn: `com.vn9melody.openerp`.
  - **Frontend Web/Desktop**: Angular >= 22 + Tailwind CSS v4.
  - **Frontend Mobile**: Ionic 8 + Angular.
- **Chính Sách Kiểm Thử Thực Dụng**:
  - **Backend**: Bắt buộc viết Unit/Integration Test (JUnit 5 + RestAssured) cho 100% logic nghiệp vụ, tính toán, và phân quyền Tenant.
  - **CẤM SỬ DỤNG H2 / Mock DB**: Môi trường dev có sẵn PostgreSQL và Redis (`make infra`). Mọi test backend phải kết nối và chạy trực tiếp trên PostgreSQL và Redis thật.
  - **Frontend**: **TUYỆT ĐỐI KHÔNG VIẾT Unit Test** (không tạo file `.spec.ts`). Kiểm thử giao diện do QA thực hiện trực tiếp trên trình duyệt.
- **Quy Chuẩn Frontend**:
  - **CẤM DÙNG NATIVE FETCH()**: 100% request HTTP trong Angular (kể cả Web Component hay màn hình Public) bắt buộc phải sử dụng Angular `HttpClient` hoặc `ApiService` từ `@shared`. Nghiêm cấm dùng native `fetch()` vì làm bypass Interceptors (Bearer Token, Tenant Context, Request ID) và phá vỡ cơ chế xử lý lỗi/reactivity thống nhất.
  - **Cấm Frontend Gọi Chéo Endpoint Plugin Khác**: Frontend của Plugin A chỉ được gọi API của Backend Plugin A thông qua Service nội bộ. Tuyệt đối không tự ý hardcode hoặc gọi trực tiếp URL endpoint của Plugin B từ phía trình duyệt.
  - **Quy Chuẩn Chân Drawer (Drawer Footer Invariant)**: Thẻ `<div drawer-footer>` chỉ chứa các lớp dàn layout (`flex items-center gap-2`), tuyệt đối không thêm thuộc tính màu nền (`bg-surface`, `bg-*`) hoặc viền trên (`border-t`) vì vỏ component `<app-drawer>` đã có sẵn nền `bg-surface-muted` và `border-t`.
  - **Tách riêng template HTML**: 100% component Angular phải tách riêng file template `.html`. Cấm viết inline `template: \`...\``.
  - **Component-First & Thư Viện Dùng Chung**: Mọi component dùng chung phải đặt tại `src/frontend/shared/` (`@shared/*`) để dùng chung cho cả Web và Mobile trước khi sử dụng.
  - **Tái sử dụng layout component**: Tách các cụm UI lặp lại thành component độc lập (`<app-language-switcher>`, `<app-topbar>`, `<app-navbar>`).
  - **100% Đa Ngôn Ngữ**: Không hardcode text, dùng `[appTranslate]` và `translate` pipe kết nối từ điển i18n (`vi.json`, `en.json`).
  - **Design Token Enums**: Sử dụng thống nhất bộ `ColorVariant`, `SizeVariant`, `ShapeVariant` từ `@shared/enums/theme.enum`.
- **Quy Chuẩn Backend & Ranh Giới Inter-Plugin**:
  - **Giao Tiếp Liên Plugin Phải Qua gRPC (`PluginDataServiceGrpc`) - CẤM GỌI CHÉO REST API**: Backend của Plugin A khi cần đọc dữ liệu thuộc Plugin B bắt buộc phải sử dụng `PluginDataClient` chạy qua gRPC (`PluginDataServiceGrpc`) cổng `9090` với mTLS. Tuyệt đối cấm dùng `HttpClient` gọi trực tiếp REST API runtime của Plugin B. Ghi dữ liệu chéo plugin bắt buộc qua Event Hub (`/api/v1/internal/plugin-events`) hoặc Entity Write Proxy (`/api/v1/internal/entity-write/...`).
  - **Cấm Fix Cứng Page Limit (`size = 100`) - Bắt Buộc Dùng Mẫu Duyệt Toàn Bộ `pageThrough`**: Khi truy vấn dữ liệu danh mục, loại trường, options, hoặc danh sách bản ghi liên plugin, lập trình viên tuyệt đối không được fix cứng kích thước trang (ví dụ `size = 100`) dẫn đến mất dữ liệu khi vượt quá 1 trang; bắt buộc phải cài đặt vòng lặp `pageThrough` tuần tự (`while(rows.size() == PAGE_SIZE) { page++; }`) cho đến khi lấy hết 100% bản ghi.
  - **Cấm Hardcode URL**: URL frontend phải nạp động qua `@ConfigProperty(name = "openerp.frontend.url")`.
  - **Chuẩn Hóa Java Enums**: Mọi phân loại (Roles, Tenant Types, Company Sizes, Account Statuses, Two-Factor Methods) phải khai báo bằng Java Enum, đồng bộ 1-1 với TypeScript Enums.
  - **Chuẩn Hóa ResponseKey Enum**: Toàn bộ keys trả về trong Response Data Map/Object bắt buộc phải sử dụng enum `ResponseKey` (`ResponseKey.USER_ID.getKey()`, `ResponseKey.TENANT_ID.getKey()`).
  - **Dịch Vụ Backend Trả Về DTO Cố Định (Strict Response DTO Pattern)**: Toàn bộ service backend phải trả về Response DTO có định kiểu mạnh, tuyệt đối không trả về `Map<String, Object>` cho dữ liệu nghiệp vụ.
- **Quản lý phiên bản (.gitignore)**:
  Mỗi thư mục con (`src/backend`, `src/frontend/web`, `src/frontend/mobile`, root) bắt buộc có `.gitignore` riêng biệt.

## 3. Nhận việc và bàn giao

Đọc CONF/DES/version/item trước code; nhận ID/owner/write scope/dependency theo [agent_collaboration.md](agent_collaboration.md). Mỗi TASK có file, FEAT link task con. Ghi baseline/diff/files/lệnh/kết quả đã-chưa chạy/docs liên quan khi chuyển In Review / Testing; Fixed/Resolved không tự là QA Done. Fix scope đã duyệt dùng gate cũ; đổi contract phối hợp Architect và cập nhật design trước triển khai. Viết docs theo [documentation_standards.md](documentation_standards.md), dẫn code/config thật, giải thích lý do để dev con người tiếp quản.
