| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | DEV-OVERVIEW-001 |
| Trạng thái | Reviewed |
| Phiên bản | 1.0 |
| Cập nhật | 2026-10-05 |
| Owner | Codex — Developer documentation |
| Reviewer | Codex kiểm tra tích hợp; Singer review độc lập theo phạm vi TASK-349; không phải phê duyệt của khách hàng |
| Phạm vi | Hiện trạng source, quy trình đọc/nhận việc và lệnh local; không phải báo cáo runtime QA |
| Đầu vào | [Docs index](../README.md), [Blueprint](../system/architecture/SYSTEM_BLUEPRINT.md), source/package/config/scripts và Sprint evidence được dẫn ở từng mục |
| Đọc trước | [DEV-READ-001 v1.0](00_READING_GUIDE.md) — lộ trình và cách chọn nguồn |
| Đọc tiếp | [Local setup](../07_deployment_guides/local_setup_guide.md) — môi trường; [coding standards](coding_standards.md) — implementation; [shared UI guide](shared_ui_contribution_guide.md) — đóng góp UI |

# Đi một vòng dự án Open-ERP trước khi viết mã

Đọc sau [developer reading guide](00_READING_GUIDE.md). Tài liệu giúp dev mới hiểu hệ thống đang có gì, tìm code ở đâu và nhận việc thế nào. Hiện trạng được đối chiếu với source/config/scripts và tài liệu trong checkout; lần biên soạn này không chạy infra, build, tests hay browser QA. Metadata `Reviewed` chỉ áp dụng cho tài liệu. Source/config có thể đang được cập nhật song song: trước khi chạy hoặc nhận việc, mở lại các link nguồn và kiểm tra baseline của item. Viết và bàn giao docs theo [chuẩn tài liệu](../../.agents/rules/documentation_standards.md), [phối hợp agent](../../.agents/rules/agent_collaboration.md) và [SDLC workflow](../../.agents/skills/sdlc-workflow/SKILL.md).

## 1. Lộ trình thực hành cho dev mới

1. Đọc mục 2–3 để xác định Core, plugin, tenant và các thư mục chính.
2. Mở từng link code ở mục 4, lần theo luồng đăng ký cá nhân từ form tới dữ liệu và response.
3. Đọc mục 5 cùng [local setup guide](../07_deployment_guides/local_setup_guide.md) trước khi tự thiết lập môi trường.
4. Đọc mục 6 để chọn item có confirmation/thiết kế và chuẩn bị bàn giao.
5. Sau đó đọc mục 7 và các Sprint index để hiểu lịch sử, trạng thái và giới hạn QA.

## 2. Core, plugin và tenant là gì?

**Core** là nền tảng dùng chung: đăng ký/đăng nhập, tài khoản và cơ cấu tổ chức, phân quyền chức năng, phạm vi dữ liệu, quản trị nền tảng và Plugin Manager/Entity Registry. **Plugin** chứa nghiệp vụ bổ sung như bán hàng, kho, kế toán; tenant có thể cài riêng theo quyền và phiên bản cho phép. Các plugin nghiệp vụ trong [Blueprint](../system/architecture/SYSTEM_BLUEPRINT.md) là ví dụ kiến trúc, không phải danh sách tính năng đã triển khai trong checkout.

**Tenant** là không gian làm việc của khách thuê. User là tài khoản hệ thống; liên kết user–tenant cho biết user thuộc workspace nào. Vai trò platform admin có phạm vi quản trị nền tảng riêng, khác vai trò trong tenant. Vì vậy không được coi một UUID client gửi lên là bằng chứng quyền truy cập tenant.

### Kiến trúc mục tiêu và implementation hiện tại

| Nội dung | Chính sách / thiết kế | Hiện trạng đối chiếu source |
| :--- | :--- | :--- |
| Phân tách dịch vụ | Kiến trúc microservices, nghiệp vụ nằm trong plugin độc lập. | Core hiện được build từ **một Maven project Quarkus**; các package `modules/iam`, `platform`, `organization`, `plugin`, `core` cùng nằm trong backend này. Không có một service triển khai riêng cho từng package Core. Xem [pom.xml](../../src/backend/pom.xml). |
| Tenant data isolation | Mọi truy cập dữ liệu theo tenant phải được phân lập; Blueprint nêu Shared DB/RLS hoặc Database-per-Tenant. | Core dùng PostgreSQL chung, JWT/security context và truy vấn có điều kiện tenant; ví dụ [SecurityContextService](../../src/backend/src/main/java/com/vn9melody/openerp/core/context/SecurityContextService.java) và [BranchRepository](../../src/backend/src/main/java/com/vn9melody/openerp/modules/organization/repository/BranchRepository.java). Không suy ra toàn bộ bảng đã được bảo vệ bằng PostgreSQL RLS từ sơ đồ mục tiêu. |
| Dữ liệu toàn cục | Tenant-scoped data cần tenant context; auth/onboarding có đường xử lý trước khi chọn tenant. | [User](../../src/backend/src/main/java/com/vn9melody/openerp/modules/iam/model/User.java) là tài khoản toàn cục; [UserTenant](../../src/backend/src/main/java/com/vn9melody/openerp/modules/iam/model/UserTenant.java) là liên kết workspace. Không tự thêm `tenant_id` vào mọi bảng auth chỉ vì một ví dụ legacy. |
| Plugin runtime | Plugin tách khỏi Core, migration/backup an toàn theo tenant. | [ProcessPluginRuntimeDeployer](../../src/backend/src/main/java/com/vn9melody/openerp/modules/plugin/deployer/ProcessPluginRuntimeDeployer.java) có các nhánh Docker/Kubernetes/noop; [TenantDatasourceService](../../src/backend/src/main/java/com/vn9melody/openerp/modules/plugin/datasource/TenantDatasourceService.java) tạo schema/role theo tenant×plugin trong PostgreSQL hiện có. Đây không phải bằng chứng Database-per-Tenant đã được triển khai toàn diện. |
| Đăng ký entity | Entity của module/plugin phải đăng ký để tham chiếu an toàn. | [RegisterEntity](../../src/backend/src/main/java/com/vn9melody/openerp/core/registry/RegisterEntity.java) + [EntityRegistryService](../../src/backend/src/main/java/com/vn9melody/openerp/core/registry/EntityRegistryService.java) quét annotation khi startup; plugin còn khai báo entities trong manifest theo thiết kế Sprint 03. |
| Read replicas, MongoDB, Kafka | Là khả năng kiến trúc và dịch vụ bật theo nhu cầu. | Cấu hình mặc định backend trỏ một datasource PostgreSQL primary. Compose có profile bổ sung; không coi việc có container replica/Mongo/Kafka là bằng chứng đã có replication, read/write routing hay đầy đủ event flows. |

Khi sửa dữ liệu tenant, theo request đã xác thực tới resource/service/repository, kiểm tra điều kiện tenant và data scope cho cả đọc lẫn mutation. Entity mẫu [CoreSampleRecord](../../src/backend/src/main/java/com/vn9melody/openerp/modules/core/model/CoreSampleRecord.java) phục vụ kiểm chứng engine phân quyền trong Sprint 02; không phải giấy phép đưa nghiệp vụ mới vào Core.

## 3. Bản đồ repository và stack thực tế

Các link dưới đây tính từ file này; có thể mở trực tiếp trong repository.

| Đường dẫn | Dùng để làm gì |
| :--- | :--- |
| [AGENTS.md](../../AGENTS.md), [.agents/rules](../../.agents/rules/), [SDLC skill](../../.agents/skills/sdlc-workflow/SKILL.md) | Quy tắc, vai trò và quy trình bàn giao. |
| [docs/README.md](../README.md), [docs/sprints](../sprints/), [docs/system](../system/) | Bản đồ tài liệu; Sprint-Pack 00–09; kiến trúc, registry và templates toàn cục. |
| [src/backend/pom.xml](../../src/backend/pom.xml) | Java release **21**, Quarkus BOM **3.15.1**, Maven build/test. Package nguồn chuẩn `com.vn9melody.openerp`. |
| [backend/core](../../src/backend/src/main/java/com/vn9melody/openerp/core/) | API envelope/error handling, enums, security/context, data scope, registry, audit và hạ tầng dùng chung. |
| [backend/modules](../../src/backend/src/main/java/com/vn9melody/openerp/modules/) | Resource/service/model/repository/DTO của các chức năng nền tảng; mỗi module không nhất thiết có đủ mọi tầng. |
| [application.properties](../../src/backend/src/main/resources/application.properties), [db/migration](../../src/backend/src/main/resources/db/migration/) | Datasource/Redis/JWT/mail/plugin config và Flyway SQL V1/V2/V3. |
| [backend tests](../../src/backend/src/test/), [test config](../../src/backend/src/test/resources/application.properties) | JUnit/RestAssured và cấu hình DB thật riêng cho test. |
| [Web](../../src/frontend/web/), [Web routes](../../src/frontend/web/src/app/app.routes.ts), [Web package](../../src/frontend/web/package.json) | Angular **^22.0.0**, Tailwind **^4.1.12**; features và client services. |
| [Mobile](../../src/frontend/mobile/), [Mobile routes](../../src/frontend/mobile/src/app/app.routes.ts), [Mobile package](../../src/frontend/mobile/package.json) | Ionic Angular **^8.8.19** + Angular **^22.0.0**; ứng dụng có phạm vi chức năng riêng. |
| [shared](../../src/frontend/shared/), [shared/index.ts](../../src/frontend/shared/index.ts) | Components, enums, models, i18n, theme, plugin host dùng chung. Mapping [Web](../../src/frontend/web/tsconfig.json) / [Mobile](../../src/frontend/mobile/tsconfig.json) đều có `@shared` và `@shared/*`. |
| [Web i18n](../../src/frontend/web/public/i18n/), [Mobile i18n](../../src/frontend/mobile/public/i18n/) | Từ điển `vi.json`, `en.json` riêng cho hai app; implementation dịch dùng chung trong `shared/i18n`. |
| [tools/open-erp-cli](../../tools/open-erp-cli/), [CLI package](../../tools/open-erp-cli/package.json) | CLI local `@open-erp/cli` **0.1.0**, Node, zero-dependency; scaffold/validate/package plugin. Package đang có `private: true`. |
| [package.json root](../../package.json), [scripts/run.mjs](../../scripts/run.mjs), [Makefile](../../Makefile) | Lệnh điều phối chạy/build/test; Node runner dùng đa nền tảng. Makefile chỉ có tập target riêng, không bao phủ mọi npm script. |
| [docker-compose.yml](../../docker-compose.yml), [docker](../../docker/), [deployments](../../deployments/) | Local infra/profiles/init SQL; Dockerfile và K8s base/overlays staging/production. |

Phiên bản có dấu `^` là khai báo dependency trong package, không phải kết quả kiểm tra runtime đang cài. Khi cài mới, dùng lockfile tương ứng. Root chỉ khai báo Node `>=20`, nhưng Angular 22 trong [Web lockfile](../../src/frontend/web/package-lock.json) yêu cầu `^22.22.3 || ^24.15.0 || >=26.0.0`; không dùng mức tối thiểu của root để kết luận Node 20 chạy được toàn bộ frontend.

## 4. Lần theo một request thật: đăng ký tài khoản cá nhân

Request được chọn là **`POST /api/v1/auth/register/personal`**. Đây là bước onboarding công khai, trước khi có tenant context; workspace cá nhân được tạo ở bước verify email tiếp theo.

```mermaid
sequenceDiagram
    participant UI as RegisterPersonalComponent
    participant HTTP as AuthService / ApiService (Angular)
    participant REST as AuthResource (Java)
    participant SVC as AuthService (Java)
    participant PG as PostgreSQL
    participant R as Redis / Mailer
    UI->>HTTP: handleRegister / registerPersonal
    HTTP->>REST: POST /api/v1/auth/register/personal
    REST->>SVC: DTO đã validate
    SVC->>PG: Kiểm tra email; persist user/credential/profile
    SVC->>R: Lưu hash OTP; gửi email
    SVC-->>REST: PersonalRegisterResponse
    REST-->>UI: HTTP 201 + AUTH_REGISTER_SUCCESS
    UI->>UI: Chuyển tới /verify-email
```

Đọc code theo thứ tự sau; tên `AuthService` xuất hiện cả ở Angular lẫn Java nhưng là hai lớp khác nhau.

| Bước | Mở file thật | Điều cần theo dõi |
| :--- | :--- | :--- |
| 1. Form | [register-personal.component.html](../../src/frontend/web/src/app/features/auth/register-personal/register-personal.component.html), [component.ts](../../src/frontend/web/src/app/features/auth/register-personal/register-personal.component.ts) | Template tách riêng; `handleRegister()` gom `full_name/email/phone/password`, bật loading và gọi service. |
| 2. Client API | [Angular AuthService](../../src/frontend/web/src/app/core/services/auth.service.ts), [ApiService](../../src/frontend/web/src/app/core/services/api.service.ts), [environment](../../src/frontend/web/src/environments/environment.ts) | `registerPersonal()` gọi `api.post`; `ApiService` ghép `apiBaseUrl` với path. Dev environment trỏ backend `http://localhost:8088`. |
| 3. Resource | [AuthResource.java](../../src/backend/src/main/java/com/vn9melody/openerp/modules/iam/resource/AuthResource.java), [PersonalRegisterRequest](../../src/backend/src/main/java/com/vn9melody/openerp/modules/iam/dto/PersonalRegisterRequest.java) | `@POST`, `@Path`, `@Valid` nhận JSON; resource gọi `authService.registerPersonal(req)`. |
| 4. Logic / transaction | [Java AuthService](../../src/backend/src/main/java/com/vn9melody/openerp/modules/iam/service/AuthService.java), [PasswordHashService](../../src/backend/src/main/java/com/vn9melody/openerp/core/security/PasswordHashService.java) | `@Transactional`: kiểm tra trùng email, tạo user `PENDING_VERIFICATION`, hash mật khẩu, persist credential và profile. |
| 5. Truy cập DB | [User](../../src/backend/src/main/java/com/vn9melody/openerp/modules/iam/model/User.java), [UserCredential](../../src/backend/src/main/java/com/vn9melody/openerp/modules/iam/model/UserCredential.java), [UserProfile](../../src/backend/src/main/java/com/vn9melody/openerp/modules/iam/model/UserProfile.java) | Panache Active Record: `User.findByEmail()` và `persist()` ngay trên entity. Luồng này **không có `UserRepository`** trung gian. Các bảng là `users`, `user_credentials`, `user_profiles`. |
| 6. Schema / kết nối | [V1.0.0 migration](../../src/backend/src/main/resources/db/migration/V1.0.0__init_core_iam_schema.sql), [V1.0.3 alignment](../../src/backend/src/main/resources/db/migration/V1.0.3__align_iam_schema.sql), [config backend](../../src/backend/src/main/resources/application.properties) | Flyway quản lý schema; cấu hình dev dùng PostgreSQL `localhost:5432/openerp_dev`, ORM không tự sinh schema thay migration. |
| 7. OTP / email | [VerificationOtpService](../../src/backend/src/main/java/com/vn9melody/openerp/core/security/VerificationOtpService.java), [EmailNotificationService](../../src/backend/src/main/java/com/vn9melody/openerp/modules/iam/service/EmailNotificationService.java) | OTP được lưu dạng hash trong Redis, TTL 900 giây; mail service gọi gửi OTP và bắt/log lỗi SMTP, nên response thành công không chứng minh mail đã tới người dùng. Redis/mail là tác động ngoài DB, không tự coi chúng cùng một transaction PostgreSQL. URL frontend cho email chứa liên kết lấy qua config. |
| 8. Response / lỗi | [PersonalRegisterResponse](../../src/backend/src/main/java/com/vn9melody/openerp/modules/iam/dto/response/PersonalRegisterResponse.java), [ApiResponse](../../src/backend/src/main/java/com/vn9melody/openerp/core/api/ApiResponse.java), [GlobalExceptionMapper](../../src/backend/src/main/java/com/vn9melody/openerp/core/api/GlobalExceptionMapper.java), [api-message.ts](../../src/frontend/shared/i18n/api-message.ts) | HTTP 201, `code=AUTH_REGISTER_SUCCESS`, DTO `user_id/email/status`. Email trùng gây 409 với `AUTH_EMAIL_ALREADY_EXISTS`. Frontend chuyển `/verify-email` khi thành công; khi lỗi dịch theo `code/params`. |
| 9. Đối chiếu thiết kế / test | [Core IAM API spec](../sprints/sprint_01_core_iam/06_designs/api/CORE_IAM_API_SPEC.md), [AuthServiceTest](../../src/backend/src/test/java/com/vn9melody/openerp/modules/iam/service/AuthServiceTest.java), [AuthResourceApiTest](../../src/backend/src/test/java/com/vn9melody/openerp/modules/iam/resource/AuthResourceApiTest.java) | Xem input/AC, response contract, negative cases và bằng chứng kiểm thử liên quan trước khi sửa luồng. |

Khi đọc request đã đăng nhập, mở thêm [auth.interceptor.ts](../../src/frontend/web/src/app/core/interceptors/auth.interceptor.ts), security filters và [SecurityContextService](../../src/backend/src/main/java/com/vn9melody/openerp/core/context/SecurityContextService.java). Quyền được quyết định ở backend; route guard/frontend chỉ hỗ trợ trải nghiệm.

## 5. Build, chạy local và kiểm thử đúng môi trường

Các lệnh dưới đây **để dev thực hiện khi cần** tại root repository; không phải log đã chạy trong lần viết hướng dẫn. Chuẩn bị JDK phù hợp Java release 21, Maven có trong PATH (root test/build gọi `mvn`), Node đáp ứng Angular lockfile, npm (packageManager khai báo `npm@11.12.1`), Docker Compose khi chạy DB thật. Backend runner ưu tiên Maven wrapper nếu tồn tại, sau đó mới dùng `mvn`.

### Cài dependencies và chuẩn bị local

```powershell
npm ci --prefix src/frontend/web
npm ci --prefix src/frontend/mobile
npm run keys:jwt
```

Hai app có dependency/lockfile riêng; root không cài thay cả hai bằng một `npm ci`. `keys:jwt` sinh khóa dev vào main/test resources; khóa bị gitignore. `backend`/`dev` tự gọi sinh khóa khi thiếu private key main, nhưng `backend:test` không làm bootstrap này.

### Chạy từng phần với footprint tối thiểu

```powershell
npm run infra
npm run backend
npm run web
npm run mobile
```

Chạy ba app ở terminal riêng. `infra` bật PostgreSQL primary + Redis, tạo `openerp_test` nếu thiếu và hiển thị trạng thái Compose. Backend/Web/Mobile lần lượt ở cổng **8088/4200/8100**. `npm run mobile` dùng `npm run serve` trong package mobile (`ng serve --port 8100`); không phải script `start` gọi Ionic CLI.

Khi cần email thật trong local, dùng `npm run infra:mail` và Mailpit UI cổng 8025. Có thể dùng `npm run dev` để chạy ba tiến trình nền và ghi log trong `logs/`, nhưng mặc định runner chọn **profile mail** (PostgreSQL + Redis + Mailpit). Nó khác `infra` tối thiểu. Dừng app bằng `npm run dev:stop`; dừng containers bằng `npm run infra:down`.

Kafka, MongoDB, MinIO chỉ bật theo nhu cầu bằng `infra:kafka`, `infra:mongo`, `infra:storage`; `infra:full`/`dev:full` bật các dịch vụ nặng. Compose cũng khai báo profile `replica`, còn root không có script `infra:replica`. Con số khoảng 300 MB trong guide là ước tính sử dụng, không phải tổng memory limits: [Compose hiện tại](../../docker-compose.yml) đặt primary 512M và Redis 256M.

### Build và test: hai mục đích khác nhau

| Lệnh từ root | Tác dụng theo package/scripts | Điều kiện / cách đọc kết quả |
| :--- | :--- | :--- |
| `npm run backend:build` | `mvn -f src/backend/pom.xml -DskipTests package` | Đóng gói backend, **bỏ qua chạy test**. |
| `npm run web:build` / `npm run mobile:build` | `ng build` qua package app | Kiểm tra compilation/build assets, chưa chứng minh hành vi browser. |
| `npm run build` | Backend → Web → Mobile build | Không bao gồm chạy backend test hoặc browser QA. |
| `npm run backend:test` | `mvn -f src/backend/pom.xml test` | PostgreSQL và Redis thật phải sẵn sàng; DB/khóa test đã chuẩn bị. |
| `npm run cli:test` | Node `--test` trong CLI package | Smoke tests CLI; không phải frontend unit/component tests. |
| `npm test` | Backend tests → CLI tests | Không thực hiện QA browser cho Web/Ionic. |
| `npm run e2e:plugin` | [plugin-cli-e2e.mjs](../../scripts/e2e/plugin-cli-e2e.mjs): tạo/build/cài plugin trên dev local | Cần Docker/backend/DB thật, có tác động tạo tenant/artifact/container/schema. Đọc [local setup mục E2E](../07_deployment_guides/local_setup_guide.md) trước khi chạy; chưa thay thế smoke K8s staging. |

[Test config](../../src/backend/src/test/resources/application.properties) trỏ **PostgreSQL `openerp_test`**, cùng primary cổng 5432, và **Redis database index `/1`**. Dev dùng `openerp_dev` và Redis mặc định. Giữ các cấu hình tách biệt, đọc [TestDbCleanup](../../src/backend/src/test/java/com/vn9melody/openerp/support/TestDbCleanup.java) để hiểu dữ liệu test có thể bị dọn. Theo chính sách, cấm H2/in-memory mock DB; cần test logic và tenant isolation trên DB thật.

Test config có mock mailer; [main application.properties](../../src/backend/src/main/resources/application.properties) đặt `%test.openerp.plugin.deployer.runtime=noop` và `%test.openerp.plugin.image-builder=noop`. Do đó suite PASS trên DB thật không chứng minh Docker/Kubernetes deploy hoặc OCI registry authentication thật đã PASS.

Frontend không viết `.spec.ts` hay component/unit tests. QA phải kiểm tra Web desktop **≥1280px** và Ionic với **device emulation 390×844**, touch events: không overflow ngang, touch target ≥40px, safe-area, menu/điều hướng, drawer, i18n, theme, **0 console.error**; lưu ảnh/bằng chứng trong Sprint `08_testing/`. Đọc [QA rules](../../.agents/rules/agent_qa.md) và [manual guide Sprint 01](../sprints/sprint_01_core_iam/08_testing/manual_test_guide.md).

## 6. Nhận item, implement và bàn giao tài liệu

1. **Chọn đúng Sprint và file item.** Tra [task board](../project_management/task_board.md), rồi mở Sprint index và `07_items/`. Item phải có ID, loại FEAT/TASK/BUG/REFACTOR, severity, assignee, trạng thái, phạm vi, AC/DoD và link thiết kế. Mẫu: [Feature](../system/templates/FEATURE_TEMPLATE.md), [Task](../system/templates/TASK_TEMPLATE.md), [Bug](../system/templates/BUG_TEMPLATE.md), [Refactor](../system/templates/REFACTOR_TEMPLATE.md).
2. **Kiểm tra đầu vào.** Theo index đọc 01 raw notes → 02 analysis → 03 benchmarks → 04 confirmation; kiểm tra sign-off cho phạm vi được giao. Sau đó đọc 05 solutions → 06 designs DB/API/UI. Confirmation không thay cho thiết kế. Thiếu đầu vào cần hoàn thiện tài liệu và xác nhận tương ứng trước khi implement.
3. **Nhận việc và truy vết.** Cập nhật assignee/trạng thái `To Do` → `In Progress`; ghi kế hoạch kỹ thuật, đường dẫn code dự kiến và cách kiểm chứng. Sub-task inline trong feature phải được đọc cùng file item liên quan; không chỉ nhìn checkbox feature tổng.
4. **Implement theo ranh giới đã chọn.** Thay đổi schema qua migration; sửa API bằng DTO/envelope chuẩn, enums và keys đồng bộ. Mọi response có `code`; list dùng `items`, phân trang `page/size/total_items/total_pages` (API page bắt đầu 0). UI dùng shared components trước, `.html` riêng, dịch vi/en, `ColorVariant/SizeVariant/ShapeVariant`. Nếu đổi thiết kế/contract/schema, phối hợp cập nhật `06_designs/` trước.
5. **Ghi phát sinh thành item.** Tạo file độc lập trong Sprint `07_items/` cho yêu cầu/lỗi/refactor mới; bug có cách tái hiện, expected/actual, severity và owner. Không chôn phần việc mới trong log hay ghi chú PR. Giữ tài liệu từng bước 01–09 trong Sprint-Pack; kiến trúc toàn cục và guide dùng chung nằm ở nhóm docs tương ứng.
6. **Kiểm chứng và ghi giới hạn.** Backend test trên DB thật, kiểm tra chéo ít nhất hai tenant khi thay đổi isolation; frontend build rồi QA browser hai chế độ. Ghi lệnh, thời điểm, môi trường, kết quả và link evidence vào item/report. Chưa chạy hoặc bị chặn bởi registry/K8s phải ghi rõ, không đánh PASS từ đọc code.
7. **Bàn giao review/QA.** Chuyển `In Review / Testing`, dẫn commit/diff, thiết kế, test/evidence và guide liên quan. Chỉ chuyển `Done` khi được xác nhận; nhãn legacy `Resolved` cần đọc bằng chứng và reviewer, không tự đồng nhất với nghiệm thu.
8. **Hoàn thiện docs theo tác động.** Hành vi người dùng: [user guides](../06_user_guides/) có ảnh/flows; cấu hình/chạy/deploy: [deployment guides](../07_deployment_guides/); coding/plugin/shared UI: [developer guides](./). Kết quả kiểm thử nằm trong Sprint `08_testing/`, nghiệm thu trong `09_review/`. PM cập nhật [task board](../project_management/task_board.md), [work log](../project_management/work_log.md), [changelog](../project_management/changelog.md) và index Sprint.

Tên guide legacy được giữ nguyên. [Coding standards](coding_standards.md) và [shared UI guide](shared_ui_contribution_guide.md) đã chỉnh ví dụ theo package, transaction API, exports/mappings và component contract hiện có. Xem [reading guide mục 2](00_READING_GUIDE.md#2-phân-biệt-quy-tắc-thiết-kế-và-implementation) để phân biệt chuẩn bắt buộc, implementation và bằng chứng kiểm chứng.

## 7. Trạng thái Sprint và giới hạn bằng chứng QA

Phần này là lịch sử đọc sau lộ trình dev mới. **Trạng thái tài liệu/item, QA và đóng Sprint là ba việc riêng.** Báo cáo cũ mô tả lần kiểm chứng được ghi nhận; không chứng minh checkout hiện tại vẫn PASS sau mọi sửa đổi.

| Sprint | Trạng thái quản lý được ghi nhận | Bằng chứng QA đã có / giới hạn |
| :--- | :--- | :--- |
| [01 — Core IAM](../sprints/sprint_01_core_iam/00_READING_GUIDE.md) | [Biên bản](../sprints/sprint_01_core_iam/09_review/sprint_review.md) ghi đóng ngày 2026-09-18. | Biên bản/re-test ghi 30/30 backend tests và browser verification. Đọc [report gốc](../sprints/sprint_01_core_iam/08_testing/test_reports/test_report_sprint_01.md) cùng [re-test](../sprints/sprint_01_core_iam/09_review/QA_RETEST_SPRINT_01.md); số liệu khác thời điểm không phải kết quả mới. |
| [02 — Super Admin/RBAC](../sprints/sprint_02_superadmin_rbac/00_READING_GUIDE.md) | [Biên bản](../sprints/sprint_02_superadmin_rbac/09_review/sprint_review.md) ghi đóng ngày 2026-09-19; TASK-293 Medium cold archive còn Deferred. | [Report](../sprints/sprint_02_superadmin_rbac/08_testing/test_report.md) và biên bản ghi 193/193 backend tests, browser Web/Mobile, ảnh minh chứng. Không suy ra hạng mục Deferred đã hoàn tất. |
| [03 — Plugin Manager](../sprints/sprint_03_plugin_manager/00_READING_GUIDE.md) | Đã qua confirmation, đã có thiết kế/code/QA; **chưa có quyết định closure được ký, chưa đóng — chờ ký duyệt**. | [QA report](../sprints/sprint_03_plugin_manager/08_testing/QA-01_sprint_03_test_report.md) ghi 211/211 regression và 40/40 browser matrix; đọc riêng [REV-02 review tài liệu](../sprints/sprint_03_plugin_manager/09_review/REV-02_document_rereview_2026-09-20.md) và [REV-03 bằng chứng seed PostgreSQL](../sprints/sprint_03_plugin_manager/09_review/REV-03_postgresql_seed_evidence.md). Index/evidence có mốc test khác; đây là số liệu từ tài liệu, không phải suite được chạy lại khi viết walkthrough. |

Để nhận việc Sprint 03, đọc [FEAT-21](../sprints/sprint_03_plugin_manager/07_items/FEAT-21_plugin_manager_lifecycle.md), [FEAT-22](../sprints/sprint_03_plugin_manager/07_items/FEAT-22_plugin_scaffolding_cli.md), [FEAT-23](../sprints/sprint_03_plugin_manager/07_items/FEAT-23_plugin_distribution_runtime_and_host.md). FEAT-23 còn ghi TASK-331/TASK-337 `In Progress` cho phần OCI token auth / hạ tầng datasource-backup cần nghiệm thu thật, cùng các sub-task `In Review`; [TASK-348](../sprints/sprint_03_plugin_manager/07_items/TASK-348_route_state_rollout_sprint01_02.md) là ví dụ rollout còn chờ review. Kết quả E2E Docker local được tài liệu ghi nhận không bao phủ toàn bộ registry/K8s staging.

Đóng Sprint cần DoD theo [core_sdlc.md](../../.agents/rules/core_sdlc.md): không còn Critical/High chưa `Done` và được QA xác nhận; Medium/Low hoãn phải có lý do và nơi tiếp nhận; có user guide với ảnh, tài liệu triển khai liên quan, biên bản và sign-off. Một báo cáo có chữ PASS hoặc metadata `Reviewed` không tự thỏa các điều kiện này.

Quay lại [00_READING_GUIDE.md](00_READING_GUIDE.md) để chọn tài liệu chuyên sâu theo item được giao.
