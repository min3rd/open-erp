# Tài liệu báo cáo lỗi: BUG-2.1 - Lỗi FORWARD trong WorkflowApproverStatus
## Phân hệ: Workflow (Sprint 2)

| Liên quan Task | TSK-2.2 - Xử lý Forward Task |
|----------------|------------------------------|
| Severity | 🔴 Critical |
| Trạng thái | [x] Completed |

---

### 1. Mô tả lỗi (Bug Description)

Task forwarding functionality không hoạt động do thiếu giá trị FORWARDED trong enum WorkflowApproverStatus.

**Steps to reproduce:**

1. Đăng nhập với vai trò approver
2. Chọn task đang ở trạng thái PENDING
3. Click nút "Forward" để chuyển task cho approver khác
4. Hệ thống không xử lý được trạng thái FORWARDED

**Expected:** Task được chuyển thành công và trạng thái thay đổi thành FORWARDED

**Actual:** 
- Backend trả về lỗi validation hoặc internal error
- Task không được chuyển
- Approver current không nhận được notification

---

### 2. Nguyên nhân lỗi (Root Cause)

Thiếu giá trị `FORWARDED` trong enum `WorkflowApproverStatus` được định nghĩa trong backend service.

**Chi tiết:**
- Enum `WorkflowApproverStatus` chỉ có các giá trị: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`
- Không có giá trị `FORWARDED` để xử lý trường hợp task được chuyển tiếp
- Service `workflow-instance.service.ts` không xử lý transition sang trạng thái FORWARDED
- Code cố gắng convert string "FORWARDED" sang enum mà không tồn tại → runtime error

---

### 3. Giải pháp khắc phục (Resolution Design)

1. **Cập nhật enum WorkflowApproverStatus**
   - Thêm giá trị `FORWARDED` vào enum
   - Xác nhận thứ tự giá trị không làm ảnh hưởng các transition hiện tại

2. **Cập nhật workflow-instance.service.ts**
   - Thêm xử lý logic cho transition `PENDING → FORWARDED`
   - Update approver current và gán task cho approver mới
   - Tạo workflow history record với action `FORWARD`
   - Gửi notification cho approver mới

3. **Validation & Error Handling**
   - Kiểm tra approver mới tồn tại và có quyền approve
   - Validate không cho forward task đã được approver khác xử lý

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)

1. [ ] Task đang ở trạng thái PENDING có thể được forward sang approver khác
2. [ ] Sau khi forward, task của approver cũ chuyển sang trạng thái FORWARDED
3. [ ] Task mới được gán cho approver được forward đến, trạng thái PENDING
4. [ ] Approver mới nhận được notification về task được forward
5. [ ] Workflow history ghi lại action FORWARD với timestamp và user thực hiện
6. [ ] Error handling đúng khi approver không hợp lệ
7. [ ] Unit test và integration test cho functionality forward đã được thêm
8. [ ] Không có regression test cases failures

---

### 5. Kết quả thực hiện (Resolution & Deliverables)

- **Trạng thái:** [x] Completed
- **Thay đổi:**

| File | Thay đổi |
|------|----------|
| `open-erp-shared/src/enums/workflow-approver-status.ts` | Thêm `FORWARDED = 'FORWARDED'` vào enum |
| `open-erp-services/src/workflow/workflow-instance.service.ts` | Thêm method `forwardTask()` xử lý chuyển tiếp task, bao gồm: validate approver, update task status, create history record, send notification |
| `open-erp-services/src/workflow/workflow-instance.service.spec.ts` | Thêm test cases cho `forwardTask()` method |

---

**Verification Notes:**
- Fix đã được merge vào branch `develop` vào ngày 2026-07-02
- All test cases liên quan đến workflow forwarding đã PASS
- Integration test với full workflow đã xác nhận không có regression
