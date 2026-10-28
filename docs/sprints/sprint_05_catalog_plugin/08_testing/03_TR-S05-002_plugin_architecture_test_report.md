# [TR-S05-002] Báo Cáo Kiểm Thử Kiến Trúc Plugin Độc Lập (Sprint 05)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TR-S05-002 / Test Report / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | **QA PASS** — backend/runtime/web/mobile; còn EVD ảnh + PM DoD / 0.2 / 2026-10-28 |
| Owner / reviewer | QA/QC Agent / PM + Architect |
| Baseline mã nguồn | `13452fe` (P5 zero-DB + mTLS) + commit QA mobile/i18n kế tiếp |
| Đầu vào | [TP-S05-001](01_TP-S05-001_sprint_05_test_plan.md), [TASK-402](../07_items/TASK-402_plugin_data_gateway_grpc.md), [BUG-135](../07_items/BUG-135_catalog_not_independent_plugin.md) |
| Môi trường | Backend `:8088` (gRPC mTLS `:9090`), Web `:4200`, Mobile `:8100`; PostgreSQL 16 + Redis thật (không H2); tenant `e2e-tenant@example.com`, platform `e2e-platform@example.com` |

> TR-S05-001 là baseline kiến trúc in-process đã bị thu hồi; báo cáo này thay thế cho nghiệm thu kiến trúc plugin độc lập.

## 1. Tổng hợp

| Hạng mục | Kết quả |
| :--- | :--- |
| Backend tự động (PostgreSQL thật) | **266 PASS, 0 fail, 1 skip** (60 test class) |
| Gateway gRPC (read/write/batch/idempotency/TREE/import) | PASS — P3/P3.1/P4/P4.1 |
| Zero DB plugin | PASS — không còn datasource/Flyway/Panache; `docker inspect` không có `QUARKUS_DATASOURCE_*` |
| Core-owned migration | PASS — `PluginSchemaBootstrap` tạo schema + apply `V1.0.0` cho 4 ledger; `plugin_schema_history` ghi nhận |
| Fan-out system catalog | PASS — 2 tenant `SYNCED`: `types=5, items=3355, edges=3321, skipped=0` |
| mTLS | PASS — plaintext bị từ chối; tenant cert OK; tenant cert + SYSTEM scope → `PLUGIN_DATA_MTLS_IDENTITY_MISMATCH`; system cert + SYSTEM scope → rows |
| BUG-136 locked uninstall | PASS — `PluginLifecycleApiTest` 403 `PLUGIN_LOCKED_DEFAULT`; plugin không locked vẫn uninstall |
| Web plugin host | PASS — `/settings/apps/catalog`, 20 rows, overflow 0, 0 console error; token hết hạn tự refresh (BUG-143) |
| Pagination danh sách | PASS — `page=0` → `1..48`, `page=1` → `51..96`; browser `Trang 2/2` dòng đầu `51` ([BUG-145](../07_items/BUG-145_catalog_pagination_page2_repeats.md)) |
| Mobile plugin host | PASS — iframe + `readonly=1`; 390×844: 20 rows, overflow 0, touch min 40px, 0 console error; token refresh PASS |
| Docs check | PASS — 0 lỗi link/ID |

## 2. Bằng chứng chính

- `PluginLifecycleApiTest` (install/enable/disable/uninstall/upgrade/rollback/locked) — full suite PASS.
- `PluginDataGatewayTest` 16 test (tenant isolation, system_row, idempotency, batch) PASS.
- Migration log: `Plugin migrations: catalog@1.0.0 applied 1 migration(s) to tenant_<...>_catalog` cho 4 schema, gồm schema `tenant_cdba7d62_catalog` trước đó chưa có bảng.
- `GET /api/v1/catalog/types` → **404**; gateway thiếu token → **401**; plugin runtime API → 200.
- `information_schema.tables`: 0 bảng `catalog_*` trong `public`; đủ 5 bảng ở từng schema `tenant_*_catalog`.
- gRPC: `grpcurl -plaintext` → handshake fail; `grpcurl` + tenant cert + `SYSTEM` scope → PermissionDenied; system cert → success.
- Fan-out platform API: `PLUGIN_CATALOG_FANOUT_SUCCESS` với 2 tenant ACTIVE.

## 3. Chưa đạt / rủi ro

1. **Ảnh evidence mới**: cần lưu ảnh web sáng/tối + mobile 390×844 vào `08_testing/evidence/` trước PM ký.
2. **PM DoD + khách hàng nghiệm thu** chưa thực hiện.

## 4. Kết luận

- Kiến trúc plugin độc lập đạt trên backend/runtime/web/mobile; BUG-135 **Resolved (dev+QA)**, BUG-136 PASS.
- Sprint 05 sẵn sàng cho PM DoD sau khi bổ sung ảnh evidence và khách hàng nghiệm thu.
