# [DES-API-S08-001] API Contract: Form, Workflow, Event Hub, Public access

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-API-S08-001 / Thiết kế API / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | [DES-ARCH-S08-001](../arch/01_DES-ARCH-S08-001_components_and_flows.md), [DES-DB-S08-001](../db/01_DES-DB-S08-001_form_workflow_schema.md), chuẩn [api_standards](../../../../../.agents/rules/api_standards.md) |
| Đọc trước / đọc tiếp | [DES-DB-S08-001](../db/01_DES-DB-S08-001_form_workflow_schema.md) / [DES-UI-S08-001](../ui/01_DES-UI-S08-001_form_workflow_ui.md) |

## 1. Quy ước bắt buộc

- **4 khuôn mẫu response chuẩn**: single `{success, code, message, params, data}`; paged `data: {items, page, size, total_items, total_pages}` (bắt buộc tên `items`/`total_items`); list `data: {items:[...]}`; error `{success:false, code, message, params, errors:[{field, code, params}], timestamp}`.
- `code` UPPER_SNAKE_CASE; mỗi plugin có `FormErrorCode` / `WorkflowErrorCode` (mirror SDK `ApiResponse/ResponseKey/ErrorCode`); mọi key payload dùng `ResponseKey` enum — cấm string literal.
- Route plugin đi qua gateway `/{base}/api/v1/plugins/runtime/{plugin}{path}`; permission theo `@RequirePermission`; tenant từ header gateway (plugin không nhận tenant do client gửi).
- Cấm message địa phương cứng — Frontend hiển thị từ `code` + `params` qua i18n.

## 2. Plugin `form` — API quản trị (`/api/v1/form`, auth)

| Method | Path | Permission | Request | Response (mẫu) |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/forms?status&search&page&size` | `form:definition:manage` | — | Paged `FORM_LIST_SUCCESS` |
| POST | `/forms` | `form:definition:manage` | `{slug?, title, description, document}` | Single `FORM_CREATE_SUCCESS` |
| GET | `/forms/{id}` | `form:definition:manage` | — | Single |
| PUT | `/forms/{id}` | `form:definition:manage` | `{title?, document?, entity_mapping?}` — validate ref/logic; version++ nếu có response | Single `FORM_UPDATE_SUCCESS` |
| DELETE | `/forms/{id}` | `form:definition:manage` | — | Single `FORM_DELETE_SUCCESS` (chỉ khi chưa có response) |
| POST | `/forms/{id}/publish` / `/close` | `form:definition:manage` | `{captcha?, close_at?, response_limit?}` | Single `FORM_PUBLISH_SUCCESS` / `FORM_CLOSE_SUCCESS` |
| GET | `/forms/{id}/versions` | `form:definition:manage` | — | List `FORM_VERSIONS_SUCCESS` |
| GET | `/responses?form_id&from&to&status&page&size` | `form:response:read` | — | Paged `FORM_RESPONSE_LIST_SUCCESS` |
| GET | `/responses/{id}` | `form:response:read` | — | Single `FORM_RESPONSE_DETAIL_SUCCESS` |
| GET | `/forms/{id}/summary` | `form:response:read` | — | Single `FORM_RESPONSE_SUMMARY_SUCCESS` (per-question count/avg) |
| GET | `/forms/{id}/responses/export` | `form:response:export` | — | CSV stream (cột theo `ref`) |
| GET | `/forms/{id}/entity-mapping-check` | `form:definition:manage` | — | Single — kiểm tra registry + validate field |

## 3. Plugin `form` — API public (ẩn danh, không permission user)

| Method | Path | Ghi chú |
| :--- | :--- | :--- |
| GET | `/public/forms/{slug}` (Core route) | Trang fill WC; kèm cấp anonymous session (ADR-S08-003) |
| GET | `/api/v1/form/public/forms/{slug}` | Definition view: chỉ câu hỏi + option; 404 nếu không PUBLISHED |
| POST | `/api/v1/form/public/forms/{slug}/responses` | `{answers, responder_email?, idempotency_key, captcha_token?}` → `FORM_PUBLIC_SUBMIT_SUCCESS`; trùng key → trả response cũ (200); sai captcha → 400 `FORM_PUBLIC_CAPTCHA_INVALID`; rate limit → 429 |
| POST | `/api/v1/form/public/forms/{slug}/files` | Multipart; giới hạn theo câu hỏi; `FORM_PUBLIC_FILE_UPLOADED_SUCCESS`; INFECTED → 400 |
| GET | `/api/v1/form/public/files/{fileId}/signed-url` | Chỉ file thuộc response của chính phiên submit; HMAC TTL 300s |

## 4. Plugin `workflow` — API (`/api/v1/workflow`, auth)

| Method | Path | Permission | Ghi chú |
| :--- | :--- | :--- | :--- |
| GET/POST | `/definitions`, GET/PUT `/definitions/{id}` | `workflow:definition:manage` | PUT validate document (node graph, expression, chống vòng) |
| POST | `/definitions/{id}/publish` | `workflow:definition:manage` | `WORKFLOW_PUBLISH_SUCCESS` |
| POST | `/instances` | `workflow:definition:manage` | `{definition_key, context}` — trigger thủ công |
| GET | `/instances?status&definition&from&page&size`, GET `/instances/{id}` | `workflow:instance:read` | kèm timeline từ event log |
| GET | `/tasks/inbox?scope=MINE\|CANDIDATE&overdue&page&size` | `workflow:task:action` | Task inbox (AC-W08) |
| POST | `/tasks/{id}/claim` | `workflow:task:action` | claim từ candidate pool |
| POST | `/tasks/{id}/actions` | `workflow:task:action` | `{action: APPROVE\|REJECT\|RETURN\|REASSIGN, comment?, target_step_node_id?, target_user_id?}` — REJECT bắt buộc comment; engine chặn self-approval |
| GET | `/reports/overview?from&to`, `/reports/overdue`, `/reports/performance` | `workflow:report:read` | trạng thái instance, quá hạn, thời gian TB từng bước/theo người duyệt |
| GET/POST/PUT | `/webhook-endpoints`, `/webhook-endpoints/{id}/rotate` | `workflow:definition:manage` | secret không trả lại sau tạo (chỉ 1 lần) |

## 5. Plugin `workflow` — Webhook inbound (public, không bearer)

`POST /api/v1/plugins/runtime/workflow/webhook/{path_token}` — Core exempt bearer theo pattern signed passthrough; xác thực bằng `X-Webhook-Secret`; payload → mở instance theo cấu hình endpoint (bind definition); log mọi call vào `plg_workflow_events`; 429 khi rate limit.

## 6. Core — internal & public mới

| Method | Path | Auth | Ghi chú |
| :--- | :--- | :--- | :--- |
| POST | `/api/v1/internal/plugin-events` | Service token | Publish event (ADR-S08-002 §2.1): `{event_type, entity, aggregate_id, payload, idempotency_key}` |
| POST | `/api/v1/internal/entity-write/{pluginId}` | Service token | Proxy ghi entity đích sau khi tra `sys_entity_registry` |
| GET | `/api/v1/internal/tenants?plugin={key}` | Service token | Danh sách tenant ACTIVE có plugin — phục vụ scheduler |
| POST | `/api/v1/internal/workflow/instances` / `/tasks/{id}/actions` / GET `/instances/{id}` | Service token | Cho plugin gọi (employee — ADR-S08-004 §2.2) |
| POST | `/api/v1/plugins/public-session/{pluginKey}` | Không auth (rate-limited) | Token ẩn danh TTL 15 phút; chỉ plugin `public_access: true` |
| GET | `/public/forms/{slug}` | Không auth | Trang fill |

Plugin nhận event: `POST /api/v1/internal/events` (SDK convention) — payload `{event, source_plugin, tenant_id, aggregate_id, payload, event_delivery_id}`; plugin phải idempotent theo `event_delivery_id`.

## 7. Error codes chính (ví dụ — đầy đủ khi implement)

`FORM_DEFINITION_INVALID`, `FORM_SLUG_EXISTS`, `FORM_NOT_PUBLISHED`, `FORM_REF_IMMUTABLE`, `FORM_RESPONSE_CLOSED`, `FORM_PUBLIC_CAPTCHA_INVALID`, `FORM_FILE_TOO_LARGE`, `FORM_MAPPING_TARGET_INVALID`; `WORKFLOW_DEFINITION_INVALID_CYCLE`, `WORKFLOW_NOT_PUBLISHED`, `WORKFLOW_TASK_NOT_CURRENT`, `WORKFLOW_TASK_NOT_ASSIGNEE`, `WORKFLOW_SELF_APPROVAL_FORBIDDEN`, `WORKFLOW_REJECT_REASON_REQUIRED`, `WORKFLOW_RETURN_STEP_INVALID`, `WORKFLOW_WEBHOOK_SECRET_INVALID`.

## 8. Kiểm chứng

Contract test per endpoint (4 mẫu response + code + permission + tenant); idempotency (submit trùng, webhook trùng); 429 rate limit; anonymous token hết hạn → 401.
