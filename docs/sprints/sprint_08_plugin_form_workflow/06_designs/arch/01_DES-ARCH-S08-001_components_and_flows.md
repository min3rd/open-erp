# [DES-ARCH-S08-001] Thiết kế kiến trúc thành phần & luồng: Form, Workflow, nền tảng bổ sung

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-ARCH-S08-001 / Thiết kế / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.2 / 2026-11-02 — bổ sung §6 version semantics theo phản hồi chủ dự án |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | [SOL-S08-001](../../05_solutions/01_SOL-S08-001_form_workflow_architecture.md), [ADR-S08-001…004](../../05_solutions/02_ADR-S08-001_workflow_engine_state_machine.md) |
| Đọc trước / đọc tiếp | [DES-DB-S08-001](../db/01_DES-DB-S08-001_form_workflow_schema.md) / [DES-API-S08-001](../api/01_DES-API-S08-001_form_workflow_api.md) |

## 1. Cấu trúc module mới

```
plugins/
├── sdk/                          # bổ sung: plugin-storage-support, entity-write base, event client
├── form/
│   ├── plugin.json               # entities, permissions, migrations, ui_manifest, event_publications, public_access
│   ├── migrations/V1.0.0__form_schema.sql
│   └── src/main/java/com/vn9melody/openerp/plugins/form/
│       ├── resource/   FormResource, FormPublicResource
│       ├── service/    FormDefinitionService, FormResponseService, FormEntityMappingService,
│       │               FormFileService (dùng sdk storage-support), FormCaptchaVerifier
│       ├── engine/     FormDefinitionValidator (logic/skip validate thuần)
│       └── model/ dto/
│   └── web/                      # Angular WC: builder + fill + response
└── workflow/
    ├── plugin.json               # event_subscriptions, dependencies: [employee? no — form optional]
    ├── migrations/V1.0.0__workflow_schema.sql
    └── src/main/java/com/vn9melody/openerp/plugins/workflow/
        ├── resource/   WorkflowResource, WorkflowPublicWebhookResource
        ├── service/    WorkflowDefinitionService, WorkflowInstanceService, WorkflowTaskService,
        │               WorkflowTriggerService, WorkflowWebhookService, WorkflowSlaService
        ├── engine/     WorkflowEngine (state transition thuần, không DB), ExpressionEvaluator,
        │               AssigneeResolver, ParallelJoinTracker
        ├── scheduler/  SlaScanJob (@Scheduled every 60s)
        └── model/ dto/
```

**Core bổ sung** (`src/backend`):
- `modules/eventhub/`: `InternalPluginEventResource` (publish), `PluginEventHubService` (fan-out theo manifest `event_publications`/`event_subscriptions`), `PluginEventRelayJob` (@Scheduled 10s), bảng `plugin_events` + `plugin_event_deliveries`.
- `modules/plugin/`: `InternalEntityWriteProxyResource`, `PluginPublicSessionResource`, public route host + rate limiter (`openerp.public.rate-limit.*`).
- Migration Core V8.0.x (tiếp nối chuỗi V7.0.x): bảng event hub + seed slot (nếu cần).

## 2. Luồng request chính (sequence)

### 2.1. Submit form → ghi entity → trigger workflow

```
Responder (ẩn danh)          Core                          form plugin               workflow plugin
   │  GET /public/forms/slug   │                                │                          │
   │──────────────────────────▶│ render op-form-fill + anon token                          │
   │  POST /runtime/form/public/forms/slug/responses             │                          │
   │──────────────────────────▶│ forward (token ẩn danh)        │                          │
   │                           │───────────────────────────────▶│ 1. validate + save JSONB  │
   │                           │                                │ 2. if mapping: POST Core  │
   │                           │◀───────────────────────────────┤    /internal/entity-write │
   │                           │ forward sang plugin đích        │ 3. publish event          │
   │                           │◀───────────────────────────────┤ (idempotency_key)         │
   │                           │ [relay 10s] fan-out ───────────────────────────────────────▶│
   │                           │                                │      4. open instance     │
```

Điểm quan trọng: bước 2 (ghi entity) **thất bại không chặn** lưu response — response luôn ghi JSONB, trạng thái mapping ghi kèm (`entity_write_status: OK|FAILED|SKIPPED`) để retry; bước 3–4 bất đồng bộ qua Event Hub, workflow tự chống nhân bản bằng `idempotency_key = form:{response_id}`.

### 2.2. Duyệt task (engine)

```
Approver → Core gateway → workflow: POST /tasks/{id}/actions
  engine (1 transaction): load instance + definition version → verify actor ∈ assignee/candidates
  → ghi task action → đánh giá join/chế độ duyệt (ANY_ONE|ALL_APPROVE|VOTE_RATIO)
  → chuyển node kế (condition/parallel) → ghi plg_workflow_events (append-only)
  → nếu instance hoàn tất: publish workflow.instance.completed qua Event Hub
```

### 2.3. SLA scheduler (workflow nội bộ)

`SlaScanJob` mỗi 60s: `GET /api/v1/internal/tenants?plugin=workflow` (Core, service token) → với từng tenant: mở transaction theo schema tenant → quét task `due_date` sắp đến (nhắc qua Core internal notification, pattern `InternalNotificationResource` mở rộng topic `workflow-task-reminder`) → quá hạn: đánh dấu `overdue` + event (không chặn duyệt — CONF Q11). Idempotent theo `(tenant, task_id, reminder_slot)`.

### 2.4. Employee migration runtime (ADR-S08-004)

Employee giữ API shape; nội bộ: `openChangeRequest` → internal `POST /api/v1/internal/workflow/instances` (kèm changes + initiator + manager) → trả `workflow_instance_id`; approve/reject endpoint → proxy internal task action; UI render steps từ `GET /internal/workflow/instances/{id}`; khi nhận event `workflow.instance.completed` → `applyChangeRequest` như cũ.

## 3. Phân quyền

| Permission | Plugin | Dùng cho |
| :--- | :--- | :--- |
| `form:definition:manage` | form | Tạo/sửa/xoá/publish form |
| `form:response:read` / `form:response:export` | form | Xem response / CSV |
| `workflow:definition:manage` | workflow | Tạo/sửa/publish luồng, webhook endpoints |
| `workflow:instance:read` | workflow | Xem instance/tiến trình/báo cáo |
| `workflow:task:action` | workflow | Duyệt/trả về/reassign trong inbox |
| `workflow:report:read` | workflow | Báo cáo vận hành |

Data scope: response/report lọc theo tenant (gateway); branch scope áp cho report theo pattern `branchScope()` của employee. Task không lọc branch — task gắn assignee cá nhân/candidate.

## 4. SDK bổ sung (dùng chung backend)

- `plugin-storage-support`: ClamAV INSTREAM client + HMAC signed URL helper (tách từ `EmployeeService.scanWithClamAv/signedUrl` — employee **không refactor trong sprint này** để giảm rủi ro Q3; form dùng SDK mới).
- `entity-write` base resource + client (ADR-S08-002 §2.2).
- Event client: `publishEvent(tenant, event...)` — retry best-effort, ghi log khi fail.

## 5. Multi-tenant checklist

Mọi bảng có `tenant_id` + descriptor `tenant_scope: TENANT`; scheduler chạy từng tenant trong context riêng; webhook inbound xác định tenant từ endpoint record (không từ header client); event hub delivering theo `tenant_id` của event; test isolation là hạng mục nghiệm thu (AC-W14).

## 6. Version semantics của form — an toàn dữ liệu khi form thay đổi (AC-F02, AC-F13)

Nguyên tắc gốc: **response luôn tự đóng gói (self-contained) theo snapshot form mà nó sinh ra** — form đổi bao nhiêu lần thì dữ liệu cũ vẫn đọc/hiểu/xuất được.

1. **Snapshot bất biến**: mỗi lần lưu thay đổi trên form đã PUBLISHED (hoặc đã có ≥1 response) → sinh version mới: ghi nguyên `document + entity_mapping` vào `plg_form_definitions_versions` (append-only), `latest_version++`. Sửa khi DRAFT và chưa có response không sinh version.
2. **Pin khi fill**: người điền bắt đầu draft → draft pin `form_version` ngay lúc tạo; publish version mới giữa chừng **không ảnh hưởng** draft đang đi (draft submit thành công theo version của nó — validate theo snapshot đã pin).
3. **Response pin**: `plg_form_responses.form_version` bắt buộc; mọi đường đọc (detail, CSV, summary, drawer trong workflow task) resolve document từ **snapshot của version đó**, tuyệt đối không render theo document mới nhất.
4. **Câu hỏi bị xoá/việc đổi label**: answer cũ vẫn render đúng vì label/option lấy từ snapshot version của response; xoá câu hỏi chỉ ảnh hưởng fill sau này.
5. **`ref` bất biến, `type` bất biến sau publish**: đổi `ref` bị chặn khi có response (AC-F02); **đổi type của một `ref` đã publish cũng bị chặn** (`FORM_REF_TYPE_IMMUTABLE`) — muốn khác loại phải dùng `ref` mới. Nhờ đó CSV (cột theo `ref`) và summary (group by `ref`) ổn định xuyên version; label hiển thị lấy từ version mới nhất chứa ref đó.
6. **Entity mapping theo version**: submit chạy mapping của snapshot version của response; đổi mapping sau đó không tái áp lên response cũ (trạng thái `entity_write_status` giữ nguyên — retry tay nếu cần).
7. **Logic/skip**: chỉ áp dụng lúc fill theo snapshot của version đang đi; không tái đánh giá trên dữ liệu cũ.

Điểm 1–7 trở thành test case bắt buộc của `FormDefinitionValidator` + integration test (đổi form sau khi có response → response cũ render/export đúng; draft xuyên version submit thành công).

## 7. Chiến lược kiểm thử (design-level)

1. **Engine unit thuần** (không DB): transition matrix toàn diện — tuần tự/điều kiện/fork-join/3 chế độ duyệt/return/reassign/fallback assignment — đây là bộ test bắt buộc trước khi ghép resource.
2. **Integration plugin**: PostgreSQL thật (No H2) — REST + DB theo pattern employee (`quarkus-junit5` + rest-assured).
3. **Core**: test Event Hub (publish → delivery → retry → FAILED), public session (rỗng quyền, TTL), entity write proxy (validate registry).
4. **E2E tenant QA**: submit form public → instance → duyệt 2 bước → entity cập nhật; employee regression checklist (ADR-S08-004 §2.4).
5. Browser 2 chế độ Desktop ≥1280px + Mobile 390×844, 0 console error (guardrails QA).
