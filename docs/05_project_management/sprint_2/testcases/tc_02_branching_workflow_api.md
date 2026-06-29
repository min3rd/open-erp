# Testcase: TC-2.02 - API Cấu hình quy trình rẽ nhánh (Workflow API)
## Liên kết: TSK-2.2 | US-WF-001 | US-WF-004

| Môi trường | Dev local — `open-erp-services` |
|------------|-----------------------------------|
| Base URL | `http://localhost:3000/api/v1` |
| Auth | JWT + Header `X-Tenant-ID` |
| Tester | QA |
| Ngày | 2026-06-29 |

---

## Kịch bản kiểm thử

### TC-2.02-001: Tạo workflow Fork/Join — Happy path
| # | Bước | Dữ liệu | Kết quả mong đợi |
|---|------|---------|------------------|
| 1 | POST `/workflows` với steps START → FORK → 3 APPROVAL → JOIN → END | Payload mẫu trong [task_02_branching_workflow_api.md](../tasks/task_02_branching_workflow_api.md) §2.2 | `201`, `success: true`, trả `workflowId` |
| 2 | GET `/workflows/:id` | workflowId từ bước 1 | Trả đủ steps, stepType FORK/JOIN |
| 3 | GET `/workflows` | — | Danh sách chứa workflow vừa tạo |

**Kết quả:** [ ] PASS / [ ] FAIL

---

### TC-2.02-002: Consensus ALL — cần tất cả approver
| # | Bước | Dữ liệu | Kết quả mong đợi |
|---|------|---------|------------------|
| 1 | POST `/workflow-instances` | `workflowId`, `contextData` | `instanceId`, status IN_PROGRESS |
| 2 | User A POST `.../actions` APPROVE | stepId, action APPROVE | Vẫn ở cùng bước (chưa đủ ALL) |
| 3 | User B POST `.../actions` APPROVE | — | Chuyển sang bước tiếp theo |

**Kết quả:** [ ] PASS / [ ] FAIL

---

### TC-2.02-003: Consensus ANY — một approver đủ
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 1 | Cấu hình step `consensusRule: ANY`, 3 assignees | — |
| 2 | Một user APPROVE | Bước hoàn thành ngay, không chờ user còn lại |

**Kết quả:** [ ] PASS / [ ] FAIL

---

### TC-2.02-004: Consensus PERCENTAGE — ngưỡng 60%
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 1 | 5 approvers, ngưỡng 60% | — |
| 2 | 3/5 APPROVE | Đạt 60%, bước hoàn thành |
| 3 | 2/5 APPROVE | Chưa đạt ngưỡng, giữ bước |

**Kết quả:** [ ] PASS / [ ] FAIL

---

### TC-2.02-005: REJECT dừng luồng
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 1 | Một approver POST REJECT | Instance status REJECTED/CANCELLED |
| 2 | Approver khác APPROVE sau REJECT | 400 hoặc từ chối — instance đã kết thúc |

**Kết quả:** [ ] PASS / [ ] FAIL

---

### TC-2.02-006: Hash-chain log integrity
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 1 | Thực hiện ≥2 actions trên instance | Logs được ghi |
| 2 | GET `/workflows/logs/:instanceId/verify` | `valid: true`, chuỗi hash liên kết hợp lệ |

**Kết quả:** [ ] PASS / [ ] FAIL

---

### TC-2.02-007: Security — thiếu token
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 1 | POST `/workflows` không Authorization | `401 Unauthorized` |
| 2 | POST với tenant_id khác | `403` hoặc empty — RLS cô lập |

**Kết quả:** [ ] PASS / [ ] FAIL

---

## Tổng hợp

| TC ID | Mô tả | Kết quả |
|-------|-------|---------|
| TC-2.02-001 | Tạo Fork/Join workflow | |
| TC-2.02-002 | Consensus ALL | |
| TC-2.02-003 | Consensus ANY | |
| TC-2.02-004 | Consensus PERCENTAGE | |
| TC-2.02-005 | REJECT dừng luồng | |
| TC-2.02-006 | Hash-chain verify | |
| TC-2.02-007 | Auth / tenant isolation | |
| **Tổng** | | **_/7 PASS** |

## Ghi chú audit code (2026-06-29)
- API controller: `open-erp-services/src/features/workflow/workflow.controller.ts`
- Unit tests: `workflow.service.spec.ts`, `workflow-instance.service.spec.ts`
- **Gap:** `WorkflowAction.FORWARD` khai báo enum nhưng chưa xử lý trong `executeAction` — không nằm trong scope TC trên.
