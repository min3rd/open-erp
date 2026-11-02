# [ADR-S08-002] Tích hợp chéo plugin: Plugin Event Hub + Entity Write Proxy qua Core

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ADR-S08-002 / Quyết định kiến trúc / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | Khảo sát codebase 2026-11-02 (outbox per plugin không có consumer; `kafka_events` khai báo rỗng; pattern `InternalNotificationResource`), [CONF-S08-001](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) Q2/Q12, [BENCH-S08-002](../03_benchmarks/02_BENCH-S08-002_workflow_engine_benchmark.md) §3.2 |
| Đọc trước / đọc tiếp | [SOL-S08-001](01_SOL-S08-001_form_workflow_architecture.md) / [ADR-S08-003](04_ADR-S08-003_public_form_access.md) |

## 1. Vấn đề

Workflow cần kích hoạt từ **event của plugin khác** (AC-W04: form response, entity created/updated/status_changed); form cần **ghi response vào entity của plugin khác** (AC-F04). Hiện tại: không plugin nào đọc được bảng plugin khác; outbox per plugin chỉ ghi không có consumer; Kafka đã khai báo trong manifest nhưng không chạy trong môi trường tối thiểu.

## 2. Quyết định

**Thêm vào Core hai mảnh nền tảng nhỏ, đi qua Core như mọi giao tiếp chéo plugin hiện có** (pattern `InternalNotificationResource` + `X-Plugin-Service-Token`):

### 2.1. Plugin Event Hub (publish/subscribe, manifest-driven)

- **Publish**: plugin POST `POST /api/v1/internal/plugin-events` (service token): `{event_type, source_plugin, entity, aggregate_id, payload, idempotency_key}` → Core lưu bảng `plugin_events` (unique `idempotency_key` — chống nhân bản khi retry).
- **Subscribe**: khai báo trong `plugin.json` (manifest là nguồn sự thật — nhất quán `PluginEntityRegistrar`):
  - form: `"event_publications": [{"event": "form.response.submitted", "entity": "FormResponse"}]`
  - workflow: `"event_subscriptions": [{"source": "form", "event": "form.response.submitted"}, {"source": "*", "event": "entity.changed"}]`
- **Fan-out**: Core scheduler mới (`quarkus-scheduler` trong Core) mỗi 10s quét `plugin_events` chưa xử lý, so khớp subscription của các plugin ACTIVE (đọc từ manifest + `tenant_plugins`), ghi `plugin_event_deliveries` và đẩy qua runtime gateway tới endpoint nội bộ của plugin nhận `POST /api/v1/internal/events` (service token, TTL session như hiện có). Retry backoff; quá hạn → trạng thái `FAILED` (DLQ logic, xem lại trong report Core).
- **Không dùng Kafka** trong v1 — giữ môi trường dev tối thiểu (`npm run infra`); hợp đồng payload ổn định để sau thay relay bằng Kafka mà không đổi API.

### 2.2. Entity Write Proxy (ghi chéo plugin qua Entity Registry)

- SDK bổ sung convention endpoint nội bộ chuẩn mà **mọi plugin đều implement**: `POST /api/v1/internal/entity-write` nhận `{entity_name, record {field: value}, idempotency_key}`; plugin tự validate theo `entities[]` manifest của chính mình (bắt buộc field, enum, max_length) rồi ghi qua `PluginDataClient`.
- Core thêm `POST /api/v1/internal/entity-write/{pluginId}` (service token): tra `sys_entity_registry` (`EntityRegistryService.lookup`) xác nhận entity tồn tại + storage `TENANT` → forward sang plugin đích. Form gọi proxy này để ghi response vào entity đích (AC-F04); node `AUTO_ENTITY_UPDATE` của workflow dùng cùng đường.
- **Không**: cho form/workflow đọc bảng plugin khác; không tạo generic SQL proxy.

### 2.3. Webhook (AC-W12, Q12)

- Inbound: workflow quản `plg_workflow_webhook_endpoints` (URL path riêng theo tenant + secret, rotate, log payload vào `plg_workflow_events`); Core exempt bearer cho path `/api/v1/plugins/runtime/workflow/webhook/**` theo pattern signed passthrough (`PluginRuntimeGatewayResource`).
- Outbound: node `AUTO_WEBHOOK` gọi URL cấu hình (timeout 30s, retry 3 lần backoff, log vào event log); secret header `X-Open-ERP-Signature` (HMAC).

## 3. Phương án loại trừ

| Phương án | Lý do loại |
| :--- | :--- |
| Kafka trực tiếp (dùng `kafka_events` sẵn có) | Phá môi trường tối thiểu; chưa có broker trong `npm run infra`; hợp đồng event vẫn giữ để nâng cấp sau |
| Plugin gọi plugin trực tiếp (HTTP service-to-service) | Phá nguyên tắc điều phối qua Core; khó quản token/audit; pattern hiện có đều qua Core |
| Workflow poll bảng form | Vi phạm "no plugin reads another plugin's tables" |
| Form ghi thẳng DB plugin đích | Không thể — schema riêng + descriptor gateway |

## 4. Hệ quả và kiểm chứng

- (+) Reuse pattern auth/forward hiện có; manifest-driven; idempotency tại cả hai đầu; không thêm hạ tầng.
- (−) Core thêm 1 bảng + 1 scheduler + 2 endpoint nội bộ — phạm vi Core tăng, cần test riêng.
- Kiểm chứng: integration test Core (publish → delivery mock plugin nhận); form submit → event → workflow instance mở (E2E tenant QA); mapping ghi entity đích thành công + idempotent khi retry. AC truy vết: AC-F04, AC-F14, AC-W04, AC-W12, AC-W14.
