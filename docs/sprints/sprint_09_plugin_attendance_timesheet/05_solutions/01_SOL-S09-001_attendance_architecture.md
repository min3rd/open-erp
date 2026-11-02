# [SOL-S09-001] Giải pháp tổng thể: Plugin Chấm công & Bảng công & Đơn từ (attendance)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | SOL-S09-001 / Giải pháp tổng thể / Sprint 09 |
| Trạng thái / phiên bản / cập nhật | **✅ APPROVED 1.0 / 2026-11-02** — chủ dự án duyệt qua hội thoại tương tác (nội dung 0.1 giữ nguyên) |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) 1.0 (APPROVED), [BENCH-S09-001](../03_benchmarks/01_BENCH-S09-001_attendance_timesheet_benchmarks.md), [ANL-S09-001](../02_analysis/01_ANL-S09-001_attendance_timesheet_plugin.md), khảo sát codebase 2026-11-02 |
| Đọc trước / đọc tiếp | [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) / [ADR-S09-001](02_ADR-S09-001_shift_structure_in_plugin.md) |

## 1. Bối cảnh nền tảng (đã kiểm chứng trong code, 2026-11-02)

1. **Plugin là Maven module** trong `plugins/` (Java 21 + Quarkus 3.15.1, parent `plugins-parent`): `sdk`, `catalog`, `in-app-notification`, `organization`, `employee` (đã release), **`form` + `workflow` đã scaffold** (commit `e0f94963`) — engine thuần đã có: `FormDocumentValidator`, `WorkflowNodeTypes` (9 loại node, 3 chế độ duyệt ANY_ONE/ALL_APPROVE/VOTE_RATIO), `ExpressionEvaluator` (có test); Definition model dạng `document` JSON (form có `entity_mapping`, `publish_status`, `latest_version`; workflow có `key` + `version` + `status`).
2. **Event Hub đã implement trong Core** (`src/backend/.../modules/eventhub`): publish `POST /api/v1/internal/plugin-events` (service token, idempotency key), relay job fan-out theo `event_subscriptions` trong manifest, deliveries có retry; migration `V7.0.8__plugin_event_hub.sql` **đang trong working tree chưa commit** (phần việc đang chạy của Sprint 08 — Sprint 09 không đụng).
3. **Entity Write Proxy đã implement** (`InternalEntityWriteProxyResource`): plugin ghi record vào entity của plugin khác qua Core, chỉ nhận entity `TENANT` scope đã đăng ký Entity Registry.
4. **Employee là nguồn nhân sự**: `EmployeeAssignment` có `branch_id`, `department_id`, `manager_employee_id`, `is_primary`, `valid_from/valid_to`, `status` — đủ cho lịch theo đơn vị + manager duyệt; `Employee` có `exit_date`; descriptor queries READ/WRITE qua `PluginDataClient` (pattern `employee.list`).
5. **Employee change request vẫn chạy state machine riêng** (`plg_employee_change_requests.current_step`); Sprint 08 đang migrate runtime duyệt sang workflow engine (ADR-S08-004, In Review).
6. **Catalog có loại `SHIFT` FLAT tenant-tự-định-nghĩa** (`CatalogTenantSeeder.TypeSeed("SHIFT", ..., "FLAT")`) — không có cấu trúc thời gian.
7. **Plugin không đọc bảng plugin khác**; mọi giao tiếp chéo plugin qua Core internal REST + `X-Plugin-Service-Token`; scheduler đã có trong Core (Event Hub relay) và pattern Quarkus Scheduler sẽ có trong plugin workflow (ADR-S08-001).
8. **Notification plugin** (`in-app-notification`) sẵn sàng nhận thông báo; storage/ClamAV/signed URL đang nằm trong employee (chưa tách dùng chung).

## 2. Kiến trúc tổng thể

```
                ┌──────────────────────────── Core (src/backend) ────────────────────────────┐
                │ PluginRuntimeGateway │ EntityRegistry │ EventHub(publish/relay) │ WriteProxy │
                │ RateLimit/Secret cho push ingestion (bổ sung ADR-S09-005)                  │
                └───────┬──────────────────────────┬─────────────────────────┬───────────────┘
                        │ runtime (mTLS)           │ event fan-out           │ external push
            ┌───────────▼─────────┐    ┌───────────▼──────────┐   ┌──────────▼────────────┐
            │ plugin: employee     │    │ plugin: form          │   │ middleware máy chấm   │
            │ profile/assignment/  │    │ (mẫu đơn từ, Sprint08)│   │ công (BioTime/ZKTeco) │
            │ manager (nguồn NV)   │    └───────────┬───────────┘   └──────────┬────────────┘
            └───────────┬──────────┘                │                          │
                        │ internal READ             │ form definition          │ CSV/API push
            ┌───────────▼───────────────────────────▼──────────────────────────▼────────────┐
            │                          plugin: attendance (MỚI)                              │
            │  log ingestion (5 nguồn) → attendance_logs                                     │
            │  ca & lịch: shift_definitions / templates / assignments / holidays             │
            │  tính công: calc job → attendance_records (+ ot_windows từ đơn OT duyệt)       │
            │  đơn từ: request_types (seed 6) + requests → workflow engine (Sprint 08)       │
            │  nghỉ phép: leave_types + leave_ledger (grant/usage/adjust/expiry)             │
            │  bảng công: timesheets (4 bước Base) → confirmations → lock → export           │
            └───────────┬─────────────────────────────────────────────────────────────────── ┘
                        │ internal API duyệt + event subscription
            ┌───────────▼──────────┐
            │ plugin: workflow      │
            │ engine + task inbox   │
            │ (Sprint 08, In Review)│
            └───────────────────────┘
```

**Một plugin mới (`attendance`)** + **một mảnh Core bổ sung** (ingestion endpoint cho middleware máy chấm công — ADR-S09-005). Các quyết định kiến trúc:

| Quyết định | ADR | Tóm tắt |
| :--- | :--- | :--- |
| Ca làm việc là cấu trúc dữ liệu riêng trong plugin; catalog SHIFT giữ vai trò tên hiển thị | [ADR-S09-001](02_ADR-S09-001_shift_structure_in_plugin.md) | ShiftDefinition (giờ vào/ra, grace, break, ca đêm) + ShiftTemplate theo đơn vị + ShiftAssignment override từng nhân viên, effective-dated |
| Đơn từ = RequestType (seed 6) gắn form builder + workflow engine; fallback duyệt 1 cấp nội bộ | [ADR-S09-002](03_ADR-S09-002_request_forms_on_form_workflow.md) | Mẫu đơn = form definition; duyệt = workflow instance; approved → event → attendance mapping; engine chưa release thì chạy fallback giữ schema tương thích |
| Tính công = job engine idempotent, tolerance theo ca, OT đối chiếu window đã duyệt | [ADR-S09-003](04_ADR-S09-003_attendance_calculation_engine.md) | attendance_records (employee, work_date, shift); override có audit; phát hiện check-in treo; công thức muộn/về sớm/OT 2 chiều theo BENCH L04 |
| Số dư phép theo ledger (grant/usage/adjust/expiry entries) | [ADR-S09-004](05_ADR-S09-004_leave_balance_ledger.md) | Balance = tổng entries; cộng dồn/hạn dùng/cho phép âm cấu hình theo loại nghỉ; audit-safe |
| Ingestion log đa nguồn: web/mobile/kiosk/CSV/API push qua một lõi append-only | [ADR-S09-005](06_ADR-S09-005_multi_source_log_ingestion.md) | attendance_logs `source` enum; kiosk mã NV+PIN; idempotent theo (nguồn, thiết bị, thời gian, mã NV); endpoint push qua Core (secret + rate limit + anti-replay) |

## 3. Ranh giới plugin

| Hạng mục | plugin `attendance` | Core (bổ sung) | Plugin khác |
| :--- | :--- | :--- | :--- |
| Bảng | `plg_attendance_shift_definitions`, `plg_attendance_shift_templates`, `plg_attendance_shift_assignments`, `plg_attendance_holidays`, `plg_attendance_logs`, `plg_attendance_records`, `plg_attendance_ot_windows`, `plg_attendance_request_types`, `plg_attendance_requests`, `plg_attendance_leave_types`, `plg_attendance_leave_ledger`, `plg_attendance_timesheets`, `plg_attendance_timesheet_confirmations`, `plg_attendance_export_templates`, `plg_attendance_devices`, `plg_attendance_settings`, `plg_attendance_outbox` | Endpoint/secret push ingestion (ADR-S09-005) — chỉ auth/limit, không nghiệp vụ | form/workflow giữ form definitions + workflow instances (Sprint 08) |
| Trách nhiệm | Chấm, ca, tính công, đơn từ, leave, bảng công, xuất, báo cáo | Fan-out event, proxy ghi, ingestion auth | employee = nguồn hồ sơ/phân công; workflow = duyệt |
| Không được làm | Không đọc bảng plugin khác; không tự tính lương; không viết engine duyệt riêng khi engine có sẵn | Không chứa nghiệp vụ chấm công | — |

Dữ liệu nhân sự: attendance **không** giữ hồ sơ — đọc qua internal READ API của employee (descriptor `employee.list`/`employee.get_by_user` pattern) và cache projection tối thiểu trong plugin (mã NV, tên, đơn vị, manager, ngày vào/việc, trạng thái) cho job tính công và báo cáo; projection có cờ sync + job làm mới; event-driven sync là nâng cấp sau khi employee bắt đầu publish event lên hub.

## 4. Luồng chính

1. **Chấm công & tính công**: check-in/out (web/mobile/kiosk/push/import) → `attendance_logs` append-only → job tính công mỗi tenant (idempotent theo tenant+employee+ngày) quy đổi theo ca hiệu lực + tolerance → `attendance_records` (6 trạng thái, muộn/về sớm/OT) → check-in treo quá ngưỡng tự đóng + đánh dấu lỗi.
2. **Đơn từ & duyệt**: nhân viên nộp đơn (loại chuẩn/tùy chỉnh) → attendance lưu request + gọi workflow internal API mở instance theo `workflow_definition_key` → người duyệt xử lý trong task inbox engine → instance hoàn tất → event `workflow.instance.completed` → attendance consume → mapping theo `status_mapping` của loại đơn (LEAVE→On Leave + trừ ledger; OVERTIME→ghi `ot_windows`; ATTENDANCE_FIX→bổ sung log; LATE_EARLY→ghi chú record; BUSINESS_TRIP→Business Trip; SHIFT_SWAP→gán ca ngày đó) → audit.
3. **Nghỉ phép**: đơn LEAVE qua luồng 2 → khi duyệt, ledger ghi `usage` entry (kiểm tra số dư nếu loại không cho âm) → công ngày các ngày nghỉ chuyển On Leave/Half Day; hủy đơn → entry đảo ngược + khôi phục công.
4. **Bảng công tháng**: HR tạo timesheet theo kỳ + đơn vị + cách tính công → 4 bước (rà log → rà lịch → tính công thức → chỉnh số công + Done) → gửi xác nhận (confirmation rows) → chốt khóa → xuất Excel/template payroll-ready → phát event `attendance.timesheet.locked` (plugin lương sau tiêu thụ).
5. **Ingestion máy chấm công**: middleware BioTime push qua endpoint Core (secret + rate limit) hoặc HR import CSV → parse chuẩn hóa → ghi log idempotent → báo cáo dòng trùng/bỏ qua.
6. **Thông báo**: quên check-out (job phát hiện → notification), đơn chờ duyệt/kết quả (workflow + attendance), bảng công chờ xác nhận/trạng thái, chốt/mở khóa — qua `in-app-notification`.

## 5. Rủi ro và biện pháp

| Rủi ro | Mức | Biện pháp |
| :--- | :--- | :--- |
| Sprint 09 phụ thuộc contract form/workflow chưa duyệt (CONF §5.1) | Cao | Pin vào **hợp đồng**: document JSON của definition (đã thấy trong scaffold) + internal API + event `workflow.instance.completed`; Architect sprint 09 theo dõi review Sprint 08; fallback ADR-S09-002 (duyệt 1 cấp nội bộ, schema giữ `workflow_instance_id` nullable để migrate) — quyết định go/fallback trước khi code |
| Job tính công sai khi đổi ca giữa kỳ / override | Trung bình | Công thức thuần (không phụ thuộc DB) để unit test toàn diện; record có `calc_version` + cờ override; nút tính lại có audit; assignment/template effective-dated |
| Ledger phép cộng trừ sai (cộng dồn, chéo năm, hủy đơn) | Trung bình | Entries append-only, không UPDATE số dư; balance luôn derive lại được; snapshot cache có kiểm chứng (recompute đối chiếu); test biên dư 0/cộng dồn/hạn dùng |
| Ingestion endpoint bị lạm dụng | Trung bình | Secret theo thiết bị + rotate, rate limit per device, anti-replay (timestamp + nonce), không trả về dữ liệu nhạy cảm, log mọi request |
| Scheduler multi-tenant sai ngữ cảnh | Trung bình | Job lấy tenant list qua internal API Core, chạy từng tenant trong context riêng, idempotent theo (tenant, employee, date) |
| Phạm vi sprint lớn (CONF §5.6) | Trung bình | Thiết kế module tách bạch (5 ADR) để phân rã task độc lập; thứ tự code: ingestion/ca/tính công → bảng công → đơn từ → leave (đơn từ/leave cuối vì phụ thuộc Sprint 08) |

## 6. Bước tiếp theo

Thiết kế chi tiết DB/API/UI tại bước 06 (DES-DB-S09-001, DES-API-S09-001, DES-UI-S09-001, DES-ARCH-S09-001) — bắt đầu sau khi ADR được review; DES-API phải chốt hợp đồng internal API với form/workflow theo trạng thái review Sprint 08.
