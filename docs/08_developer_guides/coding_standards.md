| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | DEV-CODE-001 |
| Loại / phạm vi | Developer guide — Java Core/plugin, Angular Web/Ionic Mobile |
| Trạng thái / phiên bản | Reviewed / 1.0 |
| Cập nhật | 2026-10-05 |
| Owner / reviewer | Codex — Developer documentation / Self-reviewed |
| Đầu vào | [Developer rules](../../.agents/rules/agent_developer.md), [API standards](../../.agents/rules/api_standards.md), [UI/UX standards](../../.agents/rules/ui_ux_standards.md), source được dẫn bên dưới |
| Đọc trước | [Reading guide](00_READING_GUIDE.md), [walkthrough](01_project_walkthrough.md) |
| Đọc tiếp | [Shared UI contribution](shared_ui_contribution_guide.md), thiết kế và item của Sprint được giao |

# Quy Chuẩn Lập Trình Dự Án (Coding Standards & Best Practices)

Tài liệu này bắt buộc áp dụng cho tất cả Developer Agent và lập trình viên khi tham gia viết mã nguồn trong dự án `open-erp`.

Quy tắc quy trình và tài liệu lấy từ [Core SDLC](../../.agents/rules/core_sdlc.md), [chuẩn tài liệu](../../.agents/rules/documentation_standards.md), [phối hợp agent](../../.agents/rules/agent_collaboration.md) và [SDLC workflow](../../.agents/skills/sdlc-workflow/SKILL.md). Các ví dụ dưới đây là hướng dẫn theo source tại ngày cập nhật, không phải kết quả runtime QA; source có thể đổi đồng thời, cần đối chiếu baseline trước khi implement.

---

## 1. Quy Chuẩn Backend: Quarkus (Java 21+)

### 1.1. Kiến Trúc & Cấu Trúc Gói (Package Structure)
```
com.vn9melody.openerp.modules.<module>/
├── model/             # JPA/Panache entities
├── repository/        # Panache Repositories
├── service/           # Business Logic & Interfaces
├── resource/          # REST endpoints
├── dto/               # Request & Response DTOs
└── events/            # Nếu module có domain events theo thiết kế
```

Đây là cấu trúc tham chiếu của module Core, ví dụ [modules/organization](../../src/backend/src/main/java/com/vn9melody/openerp/modules/organization/). Không tạo đủ mọi tầng chỉ để khớp cây: IAM còn dùng Panache Active Record trực tiếp trên [User](../../src/backend/src/main/java/com/vn9melody/openerp/modules/iam/model/User.java). API/security/enums/registry dùng chung ở [core](../../src/backend/src/main/java/com/vn9melody/openerp/core/); plugin độc lập giữ package gốc `com.vn9melody.openerp` và cấu trúc theo thiết kế/CLI của plugin. Nghiệp vụ chuyên biệt không đưa vào Core.

### 1.2. Quy Tắc Lập Trình Cốt Lõi
- **Bắt buộc ngữ cảnh `tenant_id`**: Entity và truy vấn dữ liệu tenant phải thể hiện tenant context đã xác thực; điều kiện tenant áp dụng cả đọc và mutation. Theo [BranchRepository](../../src/backend/src/main/java/com/vn9melody/openerp/modules/organization/repository/BranchRepository.java) và [SecurityContextService](../../src/backend/src/main/java/com/vn9melody/openerp/core/context/SecurityContextService.java). Checkout không có lớp nền `TenantBaseEntity` bắt buộc cho mọi entity; auth toàn cục như `User` liên kết workspace qua `UserTenant`.
- **Ranh giới giao dịch đọc / ghi**:
  - Dùng `jakarta.transaction.Transactional` cho transaction, đặc biệt thao tác ghi nhiều entity; xem [AuthService](../../src/backend/src/main/java/com/vn9melody/openerp/modules/iam/service/AuthService.java). Truy vấn đọc có thể cần transaction để đảm bảo tính nhất quán theo thiết kế, nhưng annotation này không có thuộc tính `readOnly`.
  - [application.properties](../../src/backend/src/main/resources/application.properties) hiện cấu hình datasource PostgreSQL primary. Định tuyến sang read-replica cần datasource/routing và thiết kế nhất quán riêng; annotation transaction không tự thực hiện routing. Chỉ áp dụng khi có thiết kế và implementation đã được kiểm chứng.
- **Sử dụng DTO**: Tuyệt đối không trả Entity trực tiếp ra API Response. Luôn ánh xạ qua DTO để bảo vệ thông tin nội bộ.
- **Dependency Injection**: Ưu tiên Constructor Injection hoặc `@Inject` trên field của bean `@ApplicationScoped`.

### 1.3. Tiêu Chuẩn Unit Test Backend (Bắt Buộc)
- **Công nghệ**: JUnit 5, RestAssured, `@QuarkusTest`; PostgreSQL và Redis thật, cấm H2/in-memory mock DB. Xem [test config](../../src/backend/src/test/resources/application.properties): database `openerp_test`, Redis index `/1`. Không dùng mock database để thay bằng chứng tenant isolation.
- **Bao phủ**: 100% logic nghiệp vụ tính toán (giá cả, thuế, chiết khấu), quy trình duyệt đơn, và phân quyền cô lập dữ liệu giữa các Tenant.
- **Kiểm thử Multi-Tenant**: Service xử lý dữ liệu tenant phải có case xác nhận Tenant A không thể đọc/sửa dữ liệu Tenant B. Service auth/onboarding hoặc platform toàn cục kiểm thử danh tính, phạm vi quyền và ranh giới user/workspace/platform tương ứng; không thêm tenant filter giả vào dữ liệu toàn cục. Platform thao tác tenant vẫn phải kiểm tenant đích, quyền và audit theo thiết kế.

### 1.4. Chuẩn Mực API Response Envelope & Mã Thông Điệp / Mã Lỗi (i18n Ready)
- **Không hardcode message tiếng Việt trong backend**: Mọi controller/resource REST của Quarkus bắt buộc đóng gói phản hồi qua `ApiResponse<T>` hoặc `ApiErrorResponse`.
- **Dùng envelope có sẵn**: [ApiResponse](../../src/backend/src/main/java/com/vn9melody/openerp/core/api/ApiResponse.java), [ApiErrorResponse](../../src/backend/src/main/java/com/vn9melody/openerp/core/api/ApiErrorResponse.java), [ApiFieldError](../../src/backend/src/main/java/com/vn9melody/openerp/core/api/ApiFieldError.java). Không khai báo thêm envelope khác trong module.
- **Ví dụ từ resource đăng ký** (các import/field nằm trong [AuthResource.java](../../src/backend/src/main/java/com/vn9melody/openerp/modules/iam/resource/AuthResource.java)):

```java
@POST
@Path("/register/personal")
public Response registerPersonal(@Valid PersonalRegisterRequest req) {
    PersonalRegisterResponse data = authService.registerPersonal(req);
    return Response.status(Response.Status.CREATED).entity(
        ApiResponse.success(ErrorCode.AUTH_REGISTER_SUCCESS,
            "Registration successful. Please verify your email.", data)
    ).build();
}
```

- **Contract bắt buộc**: Single Resource có `success/code/message/params/data`; list phân trang dùng `items/page/size/total_items/total_pages` (page API bắt đầu 0); list không phân trang bọc `{ items: [...] }`; lỗi có `errors: [{ field, code, params }]` và `timestamp`. Theo [API standards](../../.agents/rules/api_standards.md), service trả DTO cố định; payload keys đồng bộ `ResponseKey`, các `@JsonProperty` đúng snake_case; frontend dịch theo `code/params`.
- **Quy tắc Enum mã lỗi**: Toàn bộ mã phản hồi phải được quản lý bằng Java Enum theo chuẩn. Hiện [ErrorCode](../../src/backend/src/main/java/com/vn9melody/openerp/core/api/ErrorCode.java) là lớp hằng số `String`, còn [ResponseKey](../../src/backend/src/main/java/com/vn9melody/openerp/core/enums/ResponseKey.java) là enum; không có các lớp `AuthMessageCode`/`AuthErrorCode` trong ví dụ này. Đây là khác biệt implementation cần theo dõi bằng item/thiết kế và kiểm tra consumer, không tự thay contract trong một module.

---

## 2. Quy Chuẩn Frontend: Angular 22 & Ionic 8

### 2.1. Kiến Trúc Hướng Component (Standalone & Signals)
- **100% Standalone Components**: Không sử dụng `NgModule`.
- **Quản lý trạng thái bằng Signals**: Sử dụng `signal()`, `computed()`, và `effect()` thay vì biến cục bộ thông thường hoặc lạm dụng `BehaviorSubject`.
- **Control Flow Mới**: Bắt buộc dùng `@if`, `@for`, `@switch` thay cho `*ngIf`, `*ngFor`.
- **Template và i18n**: Component dùng `templateUrl` tới file `.html`, mọi nhãn/title/placeholder/thông báo qua `TranslateDirective`/`TranslatePipe` và từ điển vi/en. Dùng chung `ColorVariant`, `SizeVariant`, `ShapeVariant` từ `@shared/enums`, không tạo variant enum riêng cho từng component.
- **Shared-first**: Component tái sử dụng đặt tại `src/frontend/shared/components/`; export qua `components/index.ts` rồi `shared/index.ts`. Web/Mobile import `@shared`/`@shared/*` theo mapping trong [Web tsconfig](../../src/frontend/web/tsconfig.json) và [Mobile tsconfig](../../src/frontend/mobile/tsconfig.json). Ví dụ tách `.ts`/`.html` ở [Shared UI guide](shared_ui_contribution_guide.md).

### 2.2. Quy Chuẩn UI/UX ERP: Nhỏ Gọn, Vuông Vắn & Mật Độ Cao
- **Typography Nhỏ Gọn (Compact Typography)**:
  - Dữ liệu bảng, form nhập liệu: `text-xs` (12px) hoặc `text-sm` (13px).
  - Tiêu đề cột / nhãn form: `text-xs font-medium text-neutral-500`.
  - Tiêu đề section: `text-sm font-semibold`.
- **Đệm & Lề Tối Thiểu (Tight Spacing)**:
  - Hạn chế tối đa khoảng trống dư thừa.
  - Dùng `p-1`, `p-1.5`, `p-2`, `gap-1`, `gap-2`, `space-y-1.5`.
  - Chiều cao dòng bảng (table row): `h-7` (28px) đến `h-8` (32px).
- **Thiết Kế Vuông Vắn (Sharp & Square Aesthetic)**:
  - Sử dụng góc vuông hoặc bo góc siêu nhỏ: `rounded-none` hoặc `rounded-sm` (1px - 2px).
  - Không sử dụng bo tròn lớn (`rounded-lg`, `rounded-xl`, `rounded-full`).
  - Viền mỏng, sắc nét: `border border-neutral-200 dark:border-neutral-800`.
- **Hạn chế thư viện bên thứ 3**: Tự xây dựng component trên nền HTML5 + Tailwind 4, không cài thư viện UI nặng nề từ npm.

### 2.3. Triết Lý Điều Hướng Không Dùng Modal (Anti-Modal Pattern)
- **Hạn chế tối đa Modal**: Nghiêm cấm sử dụng Modal pop-up nổi giữa màn hình che khuất dữ liệu làm việc.
- **Cơ chế thay thế bắt buộc**:
  1. **Angular Router (Nested Routes)**: Dùng route con để mở chi tiết mà vẫn giữ URL và breadcrumb điều hướng.
  2. **Drawer (Side Sheet trượt từ cạnh phải)**:
     - Dùng cho tác vụ tạo mới nhanh, xem chi tiết hoặc chỉnh sửa.
     - Hỗ trợ **xếp chồng đa tầng (Stacked Drawers)** khi mở thêm dữ liệu liên quan từ trong drawer hiện tại.
  3. **Split-Screen (Chia màn hình đa cột)**:
     - Chia layout thành 2 hoặc 3 cột cố định (ví dụ: Master-Detail — danh sách bên trái 35%, chi tiết bên phải 65%).

### 2.4. Chuẩn Route Cho Màn Hình Dạng Bảng (Path-Segment List State)

**Quy định cho màn Web dạng danh sách/bảng khi tạo mới hoặc rollout theo item**: lưu trạng thái thao tác vào **path segments** theo khuôn mẫu dưới đây. **Hiện trạng**: helper và routes được mô tả ở mục này nằm trong Web; Mobile Ionic có routes riêng và phần rollout được theo dõi tại [TASK-348](../sprints/sprint_03_plugin_manager/07_items/TASK-348_route_state_rollout_sprint01_02.md). Không coi mô tả này là xác nhận Mobile đã áp dụng contract hoặc yêu cầu import source Web vào Mobile.

```
/<module>/:filter/:sort/:pageSize/:page/:id/:mode
```

| Segment | Ý nghĩa | Giá trị mặc định |
| :--- | :--- | :--- |
| `:filter` | Bộ lọc chính (trạng thái/scope/result) | `all` |
| `:sort` | Sắp xếp (`field` hoặc `-field` cho giảm dần) | `-` |
| `:pageSize` | Số dòng/trang | `20` |
| `:page` | Trang, **1-based** trên URL | `1` |
| `:id` | Bản ghi đang chọn | `-` (không chọn) |
| `:mode` | Ngữ cảnh Drawer/Chi tiết: `list`, `detail`, `create`, `edit`, `delete`, … | `list` |

- URL ngắn (`/platform/plugins`) **redirect** về dạng canonical đầy đủ (`/platform/plugins/all/-/20/1/-/list`).
- Từ khóa tìm kiếm tự do giữ ở query param `q`; các tham số phụ (ví dụ `scope/version/tenant` của Drawer khóa) cũng dùng query param.
- Trong Web, dùng `PathListStateService` + `parsePathListState`/`buildPathListCommands` tại `src/frontend/web/src/app/core/utils/path-list-state.ts`; đây là helper dùng chung giữa các màn Web, chưa phải thư viện `@shared` cho cả hai app. Component khai báo `providers: [PathListStateService]` và chỉ ghi state qua `set()/updateState()`.
- F5, deep-link và Back của trình duyệt phải khôi phục đúng filter/trang/dòng chọn/Drawer.
- Routes khai báo qua helper `listState(loadComponent)` trong `app.routes.ts` (children component-less với redirect tiến dần).

**Mobile rollout**: trước khi triển khai phải chốt contract và navigation với Architect, cập nhật item/thiết kế và QA 390×844. Nếu chia sẻ helper giữa hai app, đặt logic độc lập nền tảng trong `src/frontend/shared/` rồi tích hợp từng consumer; không import xuyên `src/frontend/web`. Phần này cần triển khai/kiểm chứng theo item, không phát sinh thay đổi source từ việc sửa guide. TASK-348 còn mô tả query params cho Mobile trong lịch sử; khi nhận phần Mobile, đối soát với quyết định path-segment hiện hành trước code.

### 2.5. Chính Sách Không Viết Unit Test Frontend (Zero-Unit-Test Policy)
- **Tuyệt đối KHÔNG viết Unit Test cho Frontend**: Không tạo các file `.spec.ts` cho Angular components hay Ionic pages (tránh lãng phí thời gian và chi phí bảo trì giòn gãy khi code bằng AI).
- **Quy trình Kiểm thử QA/QC**: Bắt buộc thực hiện **Kiểm thử thủ công trên Trình duyệt (Browser Manual Testing)** để kiểm tra tính toàn vẹn giao diện, sự mượt mà của Drawer, font chữ nhỏ gọn và tính đáp ứng đa màn hình.

---

## 3. Quy Chuẩn Git & Commit Message
Tuân thủ chuẩn [Conventional Commits](https://www.conventionalcommits.org/):
- `feat(<scope>): <mô tả>` (Tính năng mới)
- `fix(<scope>): <mô tả>` (Sửa lỗi)
- `refactor(<scope>): <mô tả>` (Tái cấu trúc mã nguồn)
- `docs(<scope>): <mô tả>` (Cập nhật tài liệu)
- `test(<scope>): <mô tả>` (Bổ sung test case Backend)
