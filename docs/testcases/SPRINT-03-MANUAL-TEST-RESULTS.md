# Kết quả Manual Test Sprint 03 — 08/05/2026

## Môi trường test
- **Platform Service:** http://localhost:3007 — ⚠️ Không chạy tại thời điểm test
- **WMS Service:** http://localhost:3008 — ⚠️ Không chạy tại thời điểm test
- **WorkDoc Service:** http://localhost:3009 — ✅ Đang chạy
- **HR Service:** http://localhost:3010 — ✅ Đang chạy
- **Ngày thực hiện:** 08/05/2026 17:48–17:50 (local time)
- **Người thực hiện:** Senior QA
- **Task liên quan:** TASK-SPRINT-03-DOMAIN_MIGRATION-003

---

## Vấn đề phát hiện trước khi test

### BUG-001: TypeScript compile error trong workdoc-service
- **Mức độ:** Major (ngăn service khởi động)
- **File:** `apps/workdoc-service/src/workflow/schemas/workflow-request.schema.ts`
- **Mô tả:** Field `rejectionReason` khai báo kiểu `string` trong Mongoose schema nhưng service gán giá trị kiểu `string | undefined` (tham số `reason?: string` trong `WorkflowService.reject()`), gây lỗi TS2322.
- **Sửa:** Đổi thành `rejectionReason?: string` (optional field).
- **Trạng thái:** 🟢 Đã sửa và verify — service khởi động thành công

---

## Kết quả Manual Test

| ID | Test Case | Service | Endpoint | HTTP Method | Expected | Actual (Status + Body) | Kết quả |
|---|---|---|---|---|---|---|---|
| TC-001 | Health check workdoc-service | workdoc | `/api/v1/workdoc/health` | GET | 200 OK, `status=ok`, `service=workdoc-service` | `200 {"status":"ok","service":"workdoc-service","timestamp":"2026-05-08T10:48:57.052Z"}` | ✅ PASS |
| TC-002 | Health check hr-service | hr | `/api/v1/hr/health` | GET | 200 OK, `status=ok`, `service=hr-service` | `200 {"status":"ok","service":"hr-service","timestamp":"2026-05-08T10:49:01.604Z"}` | ✅ PASS |
| TC-003 | 401 khi gọi /documents không có token | workdoc | `/api/v1/workdoc/documents` | GET | 401 Unauthorized | `401 {"message":"Bearer token is required","error":"Unauthorized","statusCode":401}` | ✅ PASS |
| TC-004 | 401 khi gọi /employees không có token | hr | `/api/v1/hr/employees` | GET | 401 Unauthorized | `401 {"message":"Bearer token is required","error":"Unauthorized","statusCode":401}` | ✅ PASS |
| TC-005 | 401 khi gọi /leave-requests không có token | hr | `/api/v1/hr/leave-requests` | GET | 401 Unauthorized | `401 {"message":"Bearer token is required","error":"Unauthorized","statusCode":401}` | ✅ PASS |
| TC-006 | 401 khi gọi /departments không có token | hr | `/api/v1/hr/departments` | GET | 401 Unauthorized | `401 {"message":"Bearer token is required","error":"Unauthorized","statusCode":401}` | ✅ PASS |
| TC-007 | 401 khi gọi /workflows không có token | workdoc | `/api/v1/workdoc/workflows` | GET | 401 Unauthorized | `401 {"message":"Bearer token is required","error":"Unauthorized","statusCode":401}` | ✅ PASS |
| TC-008 | Health check platform-service | platform | `/api/v1/platform/health` | GET | 200 OK, `status=ok` | `Connection refused` — service chưa chạy | ⚠️ BLOCKED |
| TC-009 | Health check wms-service | wms | `/api/v1/wms/health` | GET | 200 OK, `status=ok` | `Connection refused` — service chưa chạy | ⚠️ BLOCKED |

---

## Tóm tắt

| Tổng TC | PASS | FAIL | BLOCKED | Coverage |
|---|---|---|---|---|
| 9 | 7 | 0 | 2 | 78% |

**Bug tìm được:**

| Mã bug | Mức độ | Mô tả | Trạng thái |
|---|---|---|---|
| BUG-001 | Major | TS compile error: `rejectionReason: string` không accept `undefined` | 🟢 Đã sửa |

---

## Ghi chú

### TC-008, TC-009 — BLOCKED
Platform-service (3007) và wms-service (3008) không chạy trong phiên test này mặc dù task mô tả chúng "đã đang chạy". Cần khởi động lại hoặc kiểm tra lý do không kết nối được trước khi re-test.

### Về contract test (scope đầy đủ của task)
Phần contract test (JSON Schema validation, CI contract test producer/consumer, OpenTelemetry tracing) thuộc scope lớn hơn của TASK-SPRINT-03-DOMAIN_MIGRATION-003 và yêu cầu:
- Triển khai `POST /api/v1/platform/event-schemas` (chưa có endpoint)
- Tích hợp AJV schema validation
- Cấu hình OpenTelemetry

Kết quả manual test này chỉ cover phần **service startup, health check, và auth guard verification** — là điều kiện tiên quyết để tiến hành contract test.

---

## Kết luận

✅ **workdoc-service** và **hr-service** khởi động thành công, health endpoint hoạt động đúng, JWT guard bảo vệ đúng các protected endpoints.  
⚠️ **platform-service** và **wms-service** cần được khởi động lại để hoàn thành test đầy đủ.  
🔴 **Contract test schema / OpenTelemetry** chưa được triển khai — cần Sprint tiếp theo hoặc task backend bổ sung.
