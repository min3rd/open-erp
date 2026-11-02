# [SOL-S08-001] Giải pháp tổng thể: Plugin Form builder & Plugin Workflow

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | SOL-S08-001 / Giải pháp tổng thể / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | [CONF-S08-001](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) 1.0 (APPROVED), [BENCH-S08-001](../03_benchmarks/01_BENCH-S08-001_form_builder_survey_benchmarks.md), [BENCH-S08-002](../03_benchmarks/02_BENCH-S08-002_workflow_engine_benchmark.md), khảo sát codebase 2026-11-02 |
| Đọc trước / đọc tiếp | [CONF-S08-001](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) / [ADR-S08-001](02_ADR-S08-001_workflow_engine_state_machine.md) |

## 1. Bối cảnh nền tảng (đã kiểm chứng trong code)

1. **Plugin là Maven module** trong `plugins/` (parent `plugins-parent`, Java 21 + Quarkus 3.15.1): `sdk`, `catalog`, `in-app-notification`, `organization`, `employee`. Package chuẩn `com.vn9melody.openerp.plugins.<plugin>`.
2. **plugin.json 2.0** là nguồn sự thật: `entities[]`, `queries[]` (descriptor READ/WRITE qua `PluginDataClient`, tenant_id do gateway quản), `permissions[]`, `migrations[]` (checksum sha256, chạy bởi `PluginMigrationExecutor` — plugin **không** tự chạy Flyway), `ui_manifest` (screens `render_mode: WEB_COMPONENT`), `relations[]` soft-ref.
3. **Tenant isolation bằng schema-per-(tenant, plugin)** (`tenant_<8 ký tự>_<plugin>`, `TenantDatasourceService`); `PluginQueryCompiler` tự chèn `tenant_id`; **chưa có RLS**. Plugin không đọc bảng plugin khác.
4. **Event toàn hệ thống CHƯA CÓ**: outbox per plugin (`plg_*_outbox`) chỉ ghi, không có relay/consumer; `kafka_events` trong manifest là khai báo rỗng.
5. **Scheduler CHƯA CÓ** trong Core và plugins (grep `@Scheduled|quartz|io.quarkus.scheduler` = 0 match).
6. **Plugin ↔ plugin đi qua Core internal REST + `X-Plugin-Service-Token`** (pattern `InternalNotificationResource` → `OnboardingNotificationClient`).
7. **Storage/ClamAV/signed URL** hiện chỉ employee tự làm (socket ClamAV 3310, HMAC-SHA256 TTL 300s, Core signed passthrough) — chưa tách dùng chung.
8. **Employee approval hiện tại**: config quan hệ 1 row/step (`plg_employee_approval_config`), runtime state machine đơn giản trên `plg_employee_change_requests.current_step`, **chưa enforce identity người duyệt** (chỉ permission + chặn tự duyệt), không reminder/delegation; 18/18 test plugin + 254/254 test Core.

## 2. Kiến trúc tổng thể

```
                    ┌─────────────────────────── Core (src/backend) ───────────────────────────┐
                    │  PluginRuntimeGateway  │ PluginEventHubService (MỚI)  │ PublicSession(MỚI)│
                    │  PluginEntityRegistry  │ InternalPluginEventResource  │ PublicFormRoute   │
                    │  PluginTenantBootstrap │ InternalEntityWriteProxy(MỚI)│ IP RateLimit      │
                    └───────┬───────────────────────┬──────────────────────────┬────────────────┘
                            │ runtime (mTLS)        │ event fan-out            │ anonymous token
                ┌───────────▼────────┐   ┌──────────▼───────────┐   ┌──────────▼─────────┐
                │ plugin: form       │   │ plugin: workflow     │   │ public fill page   │
                │ plg_form_*         │   │ plg_workflow_*       │   │ /public/forms/slug │
                │ builder/fill/resp  │──▶│ engine + task inbox  │   │ op-form-fill WC    │
                │ entity mapping     │   │ scheduler (Quarkus)  │   └────────────────────┘
                └────────────────────┘   └──────────┬───────────┘
                                                     │ internal API
                                          ┌──────────▼───────────┐
                                          │ plugin: employee     │
                                          │ (migrate runtime duyệt│
                                          │  sang workflow - C)   │
                                          └───────────────────────┘
```

**Hai plugin mới** + **ba mảnh nền tảng bổ sung** (ADR-S08-002): Plugin Event Hub (event fan-out qua Core), Entity Write Proxy (ghi entity chéo plugin qua registry), Public Session (form public cho người ngoài tenant). Chi tiết từng quyết định:

| Quyết định | ADR | Tóm tắt |
| :--- | :--- | :--- |
| Engine workflow: tự viết state machine, KHÔNG nhúng BPMN | [ADR-S08-001](02_ADR-S08-001_workflow_engine_state_machine.md) | JSON definition + enum node; parallel fork/join; scheduler riêng của plugin (Quarkus Scheduler) cho SLA |
| Tích hợp chéo plugin: Event Hub + Entity Write Proxy qua Core | [ADR-S08-002](03_ADR-S08-002_event_hub_entity_write_proxy.md) | Form publish `form.response.submitted`; workflow subscribe; form ghi entity đích qua proxy; webhook in/out |
| Form public cho người ngoài tenant | [ADR-S08-003](04_ADR-S08-003_public_form_access.md) | Route `/public/forms/{slug}` không auth; anonymous runtime token; rate limit IP + captcha tuỳ chọn |
| Migration employee sang engine (phương án C) | [ADR-S08-004](05_ADR-S08-004_employee_migration_cutover.md) | UI employee giữ nguyên; runtime duyệt chuyển workflow; import config → definition; cutover backup/rollback |

## 3. Ranh giới plugin

| Hạng mục | plugin `form` | plugin `workflow` | Core (bổ sung) |
| :--- | :--- | :--- | :--- |
| Bảng | `plg_form_definitions`, `plg_form_responses`, `plg_form_files`, `plg_form_public_events` | `plg_workflow_definitions`, `plg_workflow_instances`, `plg_workflow_tasks`, `plg_workflow_events`, `plg_workflow_triggers`, `plg_workflow_webhook_endpoints` | `plugin_events`, `plugin_event_deliveries`, `plugin_public_sessions` |
| Trách nhiệm | Thiết kế form, fill, response, mapping, quiz, file | Định nghĩa/instance/task/SLA/audit/webhook | Relay event, proxy ghi entity, public route, rate limit |
| Không được làm | Không gọi bảng plugin khác; không tự duyệt | Không tự hỏi Core trong request path nóng (chỉ lúc trigger) | Không chứa nghiệp vụ form/workflow |

## 4. Luồng chính

1. **Form → entity + workflow**: người điền submit → form lưu response (JSONB, idempotent) → nếu có mapping: form gọi Entity Write Proxy ghi vào entity đích (một lần, idempotency key) → form publish event `form.response.submitted` (kèm cả hai trạng thái: đã ghi entity hay không) → Core Event Hub fan-out → workflow kích hoạt definition đã subscribe.
2. **Workflow chạy**: instance pin `definition_version` → task node → resolve assignee (USER/ROLE/MANAGER_OF/QUERY) → task vào inbox → người duyệt Đồng ý/Từ chối/Trả về/Reassign → condition node đánh giá expression → parallel fork/join → AUTO_WEBHOOK/AUTO_ENTITY_UPDATE → instance kết thúc → publish `workflow.instance.completed`.
3. **SLA**: scheduler của plugin workflow mỗi phút quét task đến hạn/nhắc/quá hạn (đánh dấu `overdue`, gửi notification) — quá hạn vẫn duyệt được.
4. **Employee (C)**: mở đề xuất → employee gọi workflow internal API mở instance theo definition `employee-profile-change` → duyệt trong UI employee nhưng action proxy sang engine → instance hoàn tất → event `workflow.instance.completed` → employee áp diff vào hồ sơ.
5. **Form public**: người ngoài mở `/public/forms/{slug}` → Core cấp anonymous session token → WC `op-form-fill` load definition view → submit qua API public (rate limit + captcha) → response ghi vào tenant schema của form.

## 5. Rủi ro và biện pháp

| Rủi ro | Mức | Biện pháp |
| :--- | :--- | :--- |
| Migration employee (C) phá behavior đang chạy | Cao | Import data hai chiều có kiểm chứng; giữ UI/API employee không đổi shape; regression E2E theo pattern Sprint 07 (backup/rollback drill); lùi về phương án B nếu blocker (theo CONF §5) |
| Event Hub trở thành điểm nghẽn/SPOF | Trung bình | Deliveries best-effort có retry + DLQ trạng thái FAILED; workflow lưu idempotency key chống nhân bản instance; Core không đồng bộ chờ plugin |
| Public form bị lạm dụng | Trung bình | Rate limit theo IP ở Core + captcha tuỳ chọn + response limit/đóng form; không leak response qua API public |
| State machine phức tạp (parallel + 3 chế độ duyệt) | Trung bình | Engine tách module thuần không phụ thuộc DB để unit test state transition toàn diện trước khi ghép API |
| Scheduler multi-tenant sai ngữ cảnh | Trung bình | Job lấy tenant list qua internal API của Core, chạy từng tenant trong context riêng, idempotent theo khóa (tenant, task) |

## 6. Bước tiếp theo

Thiết kế chi tiết DB/API/UI tại bước 06 (DES-DB-S08-001, DES-API-S08-001, DES-UI-S08-001, DES-ARCH-S08-001) — chỉ bắt đầu sau khi ADR được review.
