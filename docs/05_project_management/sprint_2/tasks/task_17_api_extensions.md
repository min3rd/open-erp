# Tài liệu kỹ thuật chi tiết: TSK-2.17 - Cập nhật API Form động & Workflow Engine đáp ứng yêu cầu nâng cao
## Phân hệ: Hệ thống lõi & API (Backend Services - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Cập nhật và mở rộng hệ thống APIs hiện tại của Dynamic Form (TSK-2.3) và Workflow Engine (TSK-2.2) để đáp ứng các yêu cầu nghiệp vụ mới:
1. **Dynamic Form API:** Hỗ trợ loại trường thông tin đặc biệt dạng bảng/lưới (Grid/Table) cho phép định nghĩa các cột con, kiểm tra tính hợp lệ dữ liệu con (nested validation) phục vụ soạn thảo kiểu Excel. Cập nhật cấu trúc JSON Schema lưu trữ layout đa thiết bị và các quy tắc điều kiện động (visibility, cascading query).
2. **Workflow Engine API:** Bổ sung cấu hình gán người duyệt mở rộng bao gồm gán theo Đơn vị/Phòng ban xử lý, gán danh sách cụ thể nhiều người dùng trực tiếp, và đặc biệt là cấu hình gán cho Người nhận mặc định (Fallback Assignee) khi danh sách người duyệt chính thức rỗng (tránh tắc nghẽn luồng phê duyệt).

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Cập nhật Dynamic Form Schema (JSONB) cho Grid/Table & Layout
* **Hỗ trợ trường kiểu Grid/Table:**
  - Kiểu dữ liệu mới: `GRID`
  - Chứa thuộc tính `columns` để định nghĩa danh sách cột con trong bảng. Mỗi cột con có: `id`, `name`, `label`, `type` (TEXT, NUMBER, DATE, SELECT), `required`, `validation`.
  - Cấu trúc ví dụ trong schema JSON:
    ```json
    {
      "id": "field_items_table",
      "name": "proposalItems",
      "label": "Danh sách trang thiết bị mua sắm",
      "type": "GRID",
      "required": true,
      "columns": [
        { "name": "itemName", "label": "Tên mặt hàng", "type": "TEXT", "required": true },
        { "name": "quantity", "label": "Số lượng", "type": "NUMBER", "required": true, "validation": { "min": 1 } },
        { "name": "unitPrice", "label": "Đơn giá", "type": "NUMBER", "required": true },
        { "name": "category", "label": "Phân loại", "type": "SELECT", "required": false, "options": [...] }
      ]
    }
    ```
* **Bổ dung Layout & Grid responsive vào Schema:**
  - Mỗi linh kiện trong schema được bổ sung cấu trúc `layout` (ví dụ: `colSpanDesktop: 6`, `colSpanTablet: 6`, `colSpanMobile: 12`, `panelId: "panel_1"`).
* **Bổ sung quy tắc logic động (rules):**
  - Mở rộng JSON Schema để lưu trữ mảng `rules` định nghĩa visibility logic, cascading API configs và calculated fields.

#### 2.2 Cập nhật Workflow Node Assignees Configuration
* Bổ sung cấu hình trong `workflow_steps` (cột `config` JSONB):
  - **`assigneeDepartments`**: Mảng UUID phòng ban nhận việc.
  - **`assigneeUsers`**: Mảng UUID danh sách người nhận việc cụ thể.
  - **`fallbackAssignee`**: UUID của người/vai trò/phòng ban nhận việc mặc định khi danh sách người duyệt chính thức rỗng (tránh tắc nghẽn luồng phê duyệt).
  - Cấu trúc `config` ví dụ:
    ```json
    {
      "consensusRule": "ALL",
      "assignees": {
        "type": "DEPARTMENT_AND_USERS",
        "departments": ["uuid-dept-hr", "uuid-dept-admin"],
        "users": ["uuid-user-direct-1", "uuid-user-direct-2"]
      },
      "fallbackAssignee": {
        "type": "USER",
        "value": "uuid-admin-user" 
      }
    }
    ```

#### 2.3 Cơ chế phân giải người duyệt dự phòng (Fallback Evaluation Flow)
```text
[Bắt đầu duyệt bước] ──► [Phân giải Assignees chính]
                               │
                               ├──► Có người xử lý? ──► [Tạo nhiệm vụ duyệt]
                               │
                               └──► Rỗng/Không tìm thấy? ──► [Phân giải Fallback Assignee] ──► [Gán mặc định]
```

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: Cập nhật DB Schema & TypeORM Entities (TSK-2.17.1)**
  - Cập nhật định nghĩa thực thể `DynamicForm` để lưu trữ và validate schema phức tạp hơn (hỗ trợ nested GRID và rules).
  - Cập nhật thực thể cấu hình bước duyệt `WorkflowStep` để bổ sung cấu hình gán việc mở rộng và gán dự phòng (`fallbackAssignee`).
* **Nhiệm vụ 2: Nâng cấp Dynamic Form Data Validator cho GRID field (TSK-2.17.2)**
  - Nâng cấp `FormValidatorService` hỗ trợ validate dữ liệu con trong mảng (nested validation). Khi validate trường `GRID`, hệ thống lặp qua các phần tử của mảng dữ liệu và validate từng cell tương ứng với cấu hình cột con.
* **Nhiệm vụ 3: Nâng cấp Workflow Step Router & Assignee Resolver (TSK-2.17.3)**
  - Cập nhật logic phân giải người duyệt trong `WorkflowService` để hỗ trợ gán theo danh sách phòng ban kết hợp danh sách người dùng.
  - Xây dựng cơ chế kiểm tra và kích hoạt Fallback Assignee khi kết quả tìm kiếm danh sách người duyệt chính trả về trống (ví dụ: phòng ban được gán chưa có nhân sự, vị trí vai trò bị khuyết).

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ: Đồng bộ hóa Client Models (TSK-2.17.4)**
  - Cập nhật các interface TypeScript, API service classes để đồng bộ cấu trúc Schema JSON mới với Backend.

#### 3.3 QA Engineer
* Viết kịch bản kiểm thử API:
  - Gửi dữ liệu validation chứa trường GRID hợp lệ và không hợp lệ -> Đảm bảo trả về mã lỗi 400 và chỉ rõ cell/cột lỗi.
  - Tạo instance quy trình phê duyệt gửi đơn vào phòng ban trống -> Đảm bảo luồng tự động chuyển việc cho Fallback Assignee.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* Đảm bảo NestJS Service đang chạy ở chế độ dev.
* Sử dụng Postman để kiểm thử API `POST /api/v1/dynamic-forms/:id/validate` với payload chứa GRID.
* Chạy unit tests:
  ```bash
  npm run test -- src/features/workflow/assignee-resolver.spec.ts
  ```

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* Hỗ trợ lưu trữ, validate cấu trúc trường GRID và rules động trong form.
* Validate dữ liệu bảng con (GRID) hoạt động chính xác ở backend.
* Logic gán người duyệt nâng cao (Department + Users + Fallback) được cài đặt và hoạt động trơn tru.
* Đạt độ bao phủ test > 85% cho các file sửa đổi.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
**Hoàn thành**

* **Cập nhật Dynamic Form Service & Controller:**
  - Cấu hình và hỗ trợ kiểu linh kiện đặc biệt `GRID` (bảng/lưới Excel) tại [DynamicFormService](../../../../open-erp-services/src/core/dynamic-form/dynamic-form.service.ts).
  - Tích hợp kiểm tra schema GRID cột con (columns validation) và options của SELECT columns trong hàm `validateFieldSchemas`.
  - Triển khai thành công logic `runValidation` hỗ trợ duyệt qua mảng đối tượng của trường `GRID` để validate dữ liệu từng ô (nested data validation) và lưu trữ lỗi theo đường dẫn chỉ mục (ví dụ: `proposalItems[0].itemName`).

* **Cập nhật Workflow Instance Service:**
  - Nâng cấp phương thức gán người xử lý và gán người mặc định tại `resolveStepAssignees` của [WorkflowInstanceService](../../../../open-erp-services/src/core/workflow/workflow-instance.service.ts).
  - Khi danh sách người duyệt chính thức rỗng (do chưa gán hoặc không thể phân giải được vai trò/phòng ban), hệ thống tự động đọc cấu hình `fallbackAssignee` trong `step.config` và phân giải người gán mặc định (hỗ trợ các kiểu `USER`, `ROLE`, hoặc `DEPARTMENT`).

* **Kiểm thử tự động (Unit Tests):**
  - Viết 5 test cases chi tiết kiểm thử tính năng GRID schema/data validation tại [dynamic-form.service.spec.ts](../../../../open-erp-services/src/core/dynamic-form/dynamic-form.service.spec.ts).
  - Viết test case chi tiết kiểm thử logic phân giải fallback assignee tại [workflow-instance.service.spec.ts](../../../../open-erp-services/src/core/workflow/workflow-instance.service.spec.ts).
  - 100% test cases đã PASS thành công khi chạy `npm test`.

