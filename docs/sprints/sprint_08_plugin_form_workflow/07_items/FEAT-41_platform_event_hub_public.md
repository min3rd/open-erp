# [FEAT-41] Nền tảng: Plugin Event Hub, Entity Write Proxy, Public Session, SDK storage-support

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-41 / FEAT / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | To Do / 0.1 / 2026-11-02 |
| Owner | Developer Agent |
| Đầu vào | [ADR-S08-002](../05_solutions/03_ADR-S08-002_event_hub_entity_write_proxy.md), [ADR-S08-003](../05_solutions/04_ADR-S08-003_public_form_access.md), [DES-ARCH-S08-001](../06_designs/arch/01_DES-ARCH-S08-001_components_and_flows.md) §1–4, [DES-DB-S08-001](../06_designs/db/01_DES-DB-S08-001_form_workflow_schema.md) §4 |
| Phụ thuộc | Không (nền tảng đi trước) |

## Phạm vi

Bổ sung **Core** (`src/backend`, Flyway V8.0.x) và **SDK** (`plugins/sdk`):

1. Plugin Event Hub: `InternalPluginEventResource` (publish), `PluginEventHubService` + `PluginEventRelayJob` (fan-out theo `event_publications`/`event_subscriptions` trong manifest), bảng `plugin_events` + `plugin_event_deliveries` (idempotency, retry, FAILED).
2. Entity Write Proxy: `POST /api/v1/internal/entity-write/{pluginId}` tra `sys_entity_registry` → forward; SDK convention `POST /api/v1/internal/entity-write` per plugin.
3. Public Session: `POST /api/v1/plugins/public-session/{pluginKey}` (chỉ plugin `public_access: true`), bảng `plugin_public_sessions`, route public `/public/forms/{slug}`, IP rate limit `openerp.public.rate-limit.*`.
4. Internal tenants API: `GET /api/v1/internal/tenants?plugin=` (phục vụ scheduler workflow).
5. SDK: `plugin-storage-support` (ClamAV INSTREAM + HMAC signed URL helpers), event client, entity-write base resource.

## Checklist

- [ ] Migration V8.0.x: 3 bảng Core + index
- [ ] Event Hub service + relay + test (publish → delivery → retry → FAILED)
- [ ] Entity Write Proxy + test registry validate
- [ ] Public Session + route + rate limit + test bảo mật (rỗng quyền, TTL)
- [ ] SDK additions + unit test

## AC truy vết

AC-F04, AC-F14, AC-W04, AC-W12, AC-W14 ([CONF-S08-001 §4](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md)).
