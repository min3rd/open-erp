# [ADR-S08-001] Workflow engine: tự viết state machine, không nhúng BPMN engine

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ADR-S08-001 / Quyết định kiến trúc / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | [BENCH-S08-002](../03_benchmarks/02_BENCH-S08-002_workflow_engine_benchmark.md) §2.3/§2.4/§2.9/§2.11, [CONF-S08-001](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) Q4/Q9/Q10/Q11 |
| Đọc trước / đọc tiếp | [SOL-S08-001](01_SOL-S08-001_form_workflow_architecture.md) / [ADR-S08-002](03_ADR-S08-002_event_hub_entity_write_proxy.md) |

## 1. Vấn đề

AC-W01…W13 yêu cầu engine có: tuần tự + điều kiện + **song song**, 3 chế độ duyệt, 4 kiểu assignment, SLA timer, versioned definition, event log. Lựa chọn: (a) nhúng BPMN engine Java (Flowable OSS), (b) Camunda 8, (c) **tự viết state machine trong plugin**.

## 2. Quyết định

**Tự viết state machine trong plugin `workflow`**, học semantics đặt tên từ BPMN/Flowable (node, transition, condition, boundary timer, fork/join) nhưng chỉ hiện thực tập con AC yêu cầu. Timer/SLA chạy bằng **Quarkus Scheduler riêng của plugin** (extension `quarkus-scheduler`) — nền tảng hiện **chưa có scheduler nào** (khảo sát 2026-11-02), job quét task mỗi phút.

Lý do:
- Camunda 8 cần cluster Zeebe + Elasticsearch; Flowable cần BPMN XML + editor — vượt nhu cầu v1 và lệch mô hình SaaS schema-per-tenant hiện có.
- Engine tự viết chạy **cùng transaction PostgreSQL** với dữ liệu nghiệp vụ (approve + ghi event + cập nhật instance trong 1 transaction) — Flowable nhúng cũng được điều này nhưng đánh đổi học BPMN + bảo trì hai dependency lớn.
- BENCH §3.3: Frappe chứng minh state machine trên document phủ đa số bài toán ERP; giữ đường nâng cấp — khi cần BPMN thật, nhúng Flowable cho process phức tạp thay vì tự dựng hết.

## 3. Mô hình engine

**Definition** (JSON, versioned — chi tiết schema tại DES-DB):

```json
{
  "key": "purchase-request",
  "version": 3,
  "status": "PUBLISHED",
  "nodes": [
    {"id": "start", "type": "START", "next": ["n1"]},
    {"id": "n1", "type": "APPROVAL", "name_key": "WF_NODE_MANAGER_APPROVAL",
     "approval_mode": "ANY_ONE",           // ANY_ONE | ALL_APPROVE | VOTE_RATIO
     "vote_ratio": null,                    // dùng khi VOTE_RATIO, vd 0.5
     "assignment": {"kind": "MANAGER_OF", "field_ref": "initiator_user_id"},
     "sla": {"due_hours": 24, "remind_before_hours": 4},
     "on_reject": "END_REJECTED", "next": ["c1"]},
    {"id": "c1", "type": "CONDITION",
     "branches": [
       {"when": {"all": [{"left": "entity.total", "op": "GTE", "right": {"value": 10000000}}]}, "next": ["p1"]},
       {"when": {"all": []}, "next": ["n2", "auto1"]}     // nhánh mặc định
     ]},
    {"id": "p1", "type": "PARALLEL", "branches": [["n2"], ["auto1"]], "join": "ALL_COMPLETE"},
    {"id": "n2", "type": "TASK", "assignment": {"kind": "ROLE", "role": "TENANT_ADMIN"}},
    {"id": "auto1", "type": "AUTO_WEBHOOK", "endpoint_id": "wh-1", "timeout_seconds": 30},
    {"id": "end", "type": "END", "outcome": "APPROVED"}
  ]
}
```

- **Node types (enum)**: `START, END, APPROVAL, TASK, CONDITION, PARALLEL, AUTO_WEBHOOK, AUTO_ENTITY_UPDATE, CC`.
- **Instance** pin `definition_version`; chuyển trạng thái ghi `plg_workflow_events` append-only trong cùng transaction.
- **Parallel**: node `PARALLEL` sinh các nhánh con; `join: ALL_COMPLETE | ANY_COMPLETE`; nhánh thất bại (từ chối) áp policy: `ALL_COMPLETE` → hủy các nhánh còn lại, `ANY_COMPLETE` → bỏ qua.
- **Condition**: expression DSL nhỏ (so sánh GTE/LTE/EQ/NEQ/GT/LT/IN/CONTAINS, AND/OR lồng 1 cấp) trên context `{entity, initiator, vars, previous_node_result}`; UI dựng field–phép toán–giá trị; kết quả đánh giá log vào event.
- **Assignment resolve lúc node kích hoạt**; `MANAGER_OF` đọc tổ chức từ data scope projection (`core_user_scope` / `direct_manager_user_id` — Sprint 02/07); resolve fail → fallback theo cấu hình definition (lên cây quản lý → quản lý tenant → đánh dấu chờ).
- **Scheduler**: mỗi 60s quét `plg_workflow_tasks` theo tenant: đến hạn nhắc (notification qua Core internal), quá hạn đánh dấu `overdue` (vẫn duyệt được — CONF Q11); idempotent theo `(tenant, task_id, reminder_slot)`.

## 4. Hệ quả

- (+) Không thêm cluster/deps; test state transition thuần không cần DB; đúng phạm vi AC.
- (−) Tự chịu trách nhiệm đúng đắn fork/join/idempotency — bù bằng bộ unit test transition toàn diện (bổ sung bắt buộc, xem DES-ARCH §6).
- Nâng cấp tương lai: nếu cần sub-workflow/message correlation → cân nhắc nhúng Flowable cho process đó, engine hiện tại giữ cho luồng duyệt.

## 5. Kiểm chứng

- 1 Open PostgreSQL + plugin schema thật; `mvn -f plugins/pom.xml -pl workflow -am test` với suite transition test.
- AC truy vết: AC-W01…W03, AC-W05…W09, AC-W11.
