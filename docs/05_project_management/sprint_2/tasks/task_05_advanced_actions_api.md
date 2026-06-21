# Tài liệu kỹ thuật chi tiết: TSK-2.5 - API Duyệt đơn nâng cao hỗ trợ các hành động theo module
## Phân hệ: Lõi quy trình phê duyệt (Workflow Engine Core - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng tập hợp REST APIs xử lý các hành động xử lý đơn từ tại mỗi bước của quy trình dưới dạng các module độc lập. Người duyệt hoặc quản trị viên có thể thiết lập các tính năng khác nhau ở từng bước bao gồm: phê duyệt tiêu chuẩn (Approve), từ chối (Reject), xin ý kiến chuyên môn (Consult), điền form thông tin bổ sung (Dynamic Form injection), tự động sinh tài liệu (Document Generation), và sinh quy trình con (Spawn Subprocess).

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Thiết kế Module hóa hành động xử lý (Action Step Modules)
Khi luồng phê duyệt đi qua một bước, hệ thống sẽ thực thi các hành động tùy thuộc vào cấu hình bước đó:
1. **Approve (Phê duyệt):** Xác nhận thông qua bước hiện tại.
2. **Reject (Từ chối):** Hủy bỏ yêu cầu, dừng luồng hoặc trả đơn về bước trước đó (Return to Step).
3. **Consult (Xin ý kiến):**
   - Người duyệt hiện tại chuyển tiếp nội dung yêu cầu cho một `consultantId` (chuyên viên tư vấn) để xin ý kiến.
   - Trạng thái bước đổi thành `AWAITING_CONSULTATION`.
   - Tiến trình duyệt chính tạm đóng băng cho đến khi người được hỏi ý kiến gửi phản hồi (`action = PROVIDE_FEEDBACK`).
4. **Form Injection (Nhúng Form động):** Người duyệt bắt buộc phải điền thêm các thông tin nghiệp vụ cụ thể của bước này (ví dụ: Kế toán điền mã số thuế, hạn mức tín dụng).
5. **Document Generation (Sinh văn bản từ mẫu):** Tự động gọi API của TSK-2.4 lấy dữ liệu tổng hợp để sinh file PDF đính kèm đơn.
6. **Spawn Subprocess (Quy trình phụ):**
   - Kích hoạt một workflow con độc lập (ví dụ: Quy trình thẩm định tài sản phụ cho Đơn xin vay lớn).
   - Quy trình chính chuyển trạng thái `WAITING_SUBPROCESS` và tự động tiếp tục khi quy trình con kết thúc ở trạng thái `APPROVED`.

#### 2.2 Đặc tả API endpoint liên quan
Tham chiếu đầy đủ trong [api_overview.md](../../../03_functional/api_overview.md).

* **`POST /api/v1/workflow-instances/:instanceId/actions`** (Authorized: Assignee/Actor)
  - **Payload yêu cầu:**
    ```json
    {
      "stepId": "uuid-step-1234",
      "action": "CONSULT", // APPROVE, REJECT, CONSULT, PROVIDE_FEEDBACK, SPAWN_SUBPROCESS
      "comment": "Cần xin ý kiến phòng Pháp chế về điều khoản hợp đồng này",
      "consultantId": "uuid-user-legal-expert", // Bắt buộc khi action = CONSULT
      "formData": { // Bắt buộc nếu bước này yêu cầu điền form động
        "legalReviewNote": "Cần bổ sung phụ lục số 2"
      },
      "subWorkflowId": "uuid-sub-workflow-template-555" // Bắt buộc khi action = SPAWN_SUBPROCESS
    }
    ```
  - **Phản hồi thành công (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "status": "AWAITING_CONSULTATION",
        "currentStep": "Trưởng phòng ký duyệt",
        "nextStep": null
      }
    }
    ```

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: Thiết kế Lõi Hành động và Máy trạng thái (Finite State Machine - FSM)**
  - Viết logic chuyển trạng thái luồng xử lý (`workflow_instances.status`) tương ứng với từng loại hành động.
  - Cập nhật trạng thái xử lý thực tế của người duyệt tương ứng trong bảng `workflow_approvers` (cập nhật cột `status`, `action_at`, `comment`, `signature_id`).
  - Xây dựng bảng quan hệ `workflow_consultations` để quản lý các phiên xin ý kiến (người yêu cầu, người phản hồi, trạng thái hoàn tất). Khi xin ý kiến, hệ thống tự động sinh thêm bản ghi nhiệm vụ trong bảng `workflow_approvers` cho chuyên viên tư vấn đó.
* **Nhiệm vụ 2: Tích hợp Module Sinh luồng phụ (Sub-workflow Controller)**
  - Xây dựng trình quản lý liên kết quy trình cha - con (Parent-Child Workflow association). Lắng nghe sự kiện hoàn thành của luồng con để tự động mở khóa (resume) luồng cha.

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ: Cập nhật Giao diện Hộp thư phê duyệt**
  - Tích hợp các nút chức năng linh hoạt: Phê duyệt, Từ chối, Xin ý kiến (mở popup chọn nhân viên), Ký số.
  - Hiển thị form động bổ sung trực tiếp trên màn hình duyệt nếu bước hiện tại yêu cầu cập nhật thông tin.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* **Nhiệm vụ: Phê duyệt nâng cao trên Mobile**
  - Cung cấp các thao tác vuốt hoặc nhấn nút nổi bật trên Mobile để thực thi hành động duyệt nhanh hoặc từ chối nhanh.

#### 3.4 UI/UX Designer
* Thiết kế trải nghiệm xin ý kiến (Consultation flow dialog) và màn hình hiển thị danh sách quy trình phụ liên đới rõ ràng, tránh gây rối mắt cho người dùng.

#### 3.5 QA Engineer
* Viết kịch bản kiểm thử:
  - Kiểm tra luồng xin ý kiến: A xin ý kiến B -> A không thể duyệt cho đến khi B trả lời -> B phản hồi -> A tiếp tục có nút duyệt.
  - Kiểm tra luồng quy trình con: Quy trình cha tạo quy trình con -> Con bị Reject -> Cha tự động chuyển trạng thái Reject (hoặc theo cấu hình rẽ nhánh).

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Bước 1:** Chạy NestJS backend.
* **Bước 2 (Gỡ lỗi FSM):** Sử dụng Postman gọi trực tiếp endpoint hành động với các payload giả lập khác nhau. Xem log console chi tiết của tiến trình dịch chuyển trạng thái.

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* Hệ thống máy trạng thái (FSM) xử lý chính xác 100% các hành động chuyển đổi trạng thái của đơn từ.
* Các module Xin ý kiến và Quy trình con chạy độc lập và trả trạng thái chính xác.
* Unit test bao phủ FSM đạt tỷ lệ coverage trên 85%.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
*(Chưa bắt đầu)*
