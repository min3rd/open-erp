# Tài liệu kỹ thuật chi tiết: TSK-2.2 - API Cấu hình quy trình rẽ nhánh & Điều kiện phê duyệt phức tạp
## Phân hệ: Lõi quy trình phê duyệt (Workflow Engine Core - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng tập hợp REST APIs để định nghĩa và cấu hình quy trình phê duyệt động. Hỗ trợ cơ chế thiết lập sơ đồ quy trình rẽ nhánh (branching flow) dựa trên điều kiện dữ liệu của đơn từ và các quy tắc đồng thuận phức tạp (Consensus Rules) cho từng bước duyệt: tất cả đồng ý (ALL), tối thiểu một người đồng ý (ANY), hoặc tỉ lệ đồng ý vượt ngưỡng quy định (PERCENTAGE).

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Cơ chế rẽ nhánh, Xử lý song song & Điều kiện đồng thuận
* **Điều kiện rẽ nhánh (Branching Condition):** Sử dụng thư viện đánh giá biểu thức (ví dụ: `expr` hoặc `json-rules-engine`) để tính toán điều kiện tại runtime.
  - Ví dụ: `context_data.totalAmount > 50000000` -> Chuyển đến bước Duyệt của Giám đốc tài chính; ngược lại chuyển đến bước Trưởng phòng mua sắm.
* **Xử lý song song (Parallel Fork & Join):**
  - **Cơ chế Fork:** Cho phép từ một bước phân tách ra nhiều nhánh xử lý đồng thời. Ví dụ: Khi đơn hàng được duyệt qua bước sơ bộ, hệ thống sẽ kích hoạt song song 3 nhánh: Nhánh 1 (Quản lý kho duyệt tồn kho), Nhánh 2 (Quản lý Sale duyệt chính sách giá), Nhánh 3 (Bộ phận Chăm sóc khách hàng duyệt ưu đãi). Lúc này, cả 3 nhiệm vụ sẽ xuất hiện đồng thời trong bảng `workflow_approvers` của 3 nhóm người xử lý.
  - **Cơ chế Join:** Khi các nhánh song song hoàn thành, hệ thống sẽ hội tụ về một nút chung (`step_type = JOIN`). Nút `JOIN` này có vai trò đồng bộ hóa (Barrier): Chờ cho đến khi tất cả các nhánh song song hoặc tối thiểu số nhánh quy định hoàn thành (cấu hình qua `join_rules`), rồi mới tiếp tục chuyển luồng xử lý sang bước tiếp theo.
* **Quy tắc đồng thuận (Consensus Rules):**
  - **`ALL`:** Tất cả những người được gán quyền duyệt ở bước hiện tại bắt buộc phải phê duyệt (`action = APPROVE`) thì đơn mới được chuyển tiếp. Nếu 1 người từ chối (`REJECT`), đơn dừng ngay lập tức.
  - **`ANY`:** Chỉ cần ít nhất 1 người phê duyệt, đơn sẽ lập tức được chuyển sang bước tiếp theo mà không cần chờ những người còn lại.
  - **`PERCENTAGE`:** Xác định tỷ lệ phần trăm tối thiểu (ví dụ: `> 60%`). Khi số người duyệt đạt tỷ lệ này trên tổng số người được gán, đơn sẽ tự động thông qua.

#### 2.2 Đặc tả API endpoint liên quan
Tham chiếu đầy đủ trong [api_overview.md](../../../03_functional/api_overview.md).

* **`POST /api/v1/workflows`** (Authorized: Admin)
  - **Payload cấu hình quy trình song song & rẽ nhánh (Ví dụ Đơn Hàng):**
    ```json
    {
      "name": "Quy trình xử lý Đơn Hàng tổng hợp",
      "description": "Luồng phê duyệt rẽ nhánh song song kiểm kho, kiểm giá sale và kiểm CS",
      "steps": [
        {
          "id": "step_init",
          "name": "Khởi tạo đơn hàng",
          "stepOrder": 1,
          "stepType": "START",
          "nextStepIds": ["step_fork_1"]
        },
        {
          "id": "step_fork_1",
          "name": "Nút phân nhánh song song",
          "stepOrder": 2,
          "stepType": "FORK",
          "nextStepIds": ["step_warehouse", "step_sale", "step_cs"]
        },
        {
          "id": "step_warehouse",
          "name": "Quản lý kho duyệt tồn kho",
          "stepOrder": 3,
          "stepType": "APPROVAL",
          "nextStepIds": ["step_join_1"],
          "config": {
            "assignees": { "type": "ROLE", "value": "WAREHOUSE_MANAGER" },
            "consensusRule": "ANY"
          }
        },
        {
          "id": "step_sale",
          "name": "Quản lý Sale duyệt chính sách giá",
          "stepOrder": 4,
          "stepType": "APPROVAL",
          "nextStepIds": ["step_join_1"],
          "config": {
            "assignees": { "type": "ROLE", "value": "SALES_MANAGER" },
            "consensusRule": "ALL"
          }
        },
        {
          "id": "step_cs",
          "name": "Bộ phận CS kiểm tra ưu đãi",
          "stepOrder": 5,
          "stepType": "APPROVAL",
          "nextStepIds": ["step_join_1"],
          "config": {
            "assignees": { "type": "ROLE", "value": "CS_EXPERT" },
            "consensusRule": "ANY"
          }
        },
        {
          "id": "step_join_1",
          "name": "Nút gộp nhánh song song",
          "stepOrder": 6,
          "stepType": "JOIN",
          "nextStepIds": ["step_director_approve"],
          "config": {
            "joinRules": "ALL_BRANCHES" // Chờ cả 3 bước (step_warehouse, step_sale, step_cs) ở trên APPROVED
          }
        },
        {
          "id": "step_director_approve",
          "name": "Ban Giám Đốc phê duyệt cuối cùng",
          "stepOrder": 7,
          "stepType": "APPROVAL",
          "nextStepIds": ["step_end"],
          "config": {
            "assignees": { "type": "ROLE", "value": "DIRECTOR" },
            "consensusRule": "ANY"
          }
        },
        {
          "id": "step_end",
          "name": "Kết thúc quy trình",
          "stepOrder": 8,
          "stepType": "END",
          "nextStepIds": []
        }
      ]
    }
    ```
  - **Phản hồi thành công (201 Created):**
    ```json
    {
      "success": true,
      "data": {
        "workflowId": "uuid-workflow-12345"
      }
    }
    ```

* **`GET /api/v1/workflows/:id`** (Authorized)
  - Trả về cấu trúc quy trình bao gồm danh sách các bước và luật cấu hình chi tiết.

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: Xây dựng APIs quản lý cấu hình Workflow**
  - Viết các Controller và Service cho CRUD quy trình, lưu thông tin cấu hình bước (`workflow_steps`), đồng thời bóc tách và phân loại danh sách `assignees` từ payload để ghi vào bảng cấu hình gán việc `workflow_step_assignees`.
  - Thực hiện validate cấu trúc quy trình: kiểm tra tính tuần tự, không được có vòng lặp vô hạn (Cycle Detection) bằng thuật toán DFS.
* **Nhiệm vụ 2: Xây dựng Router Engine đánh giá điều kiện rẽ nhánh & Phân giải Assignees**
  - Tích hợp công cụ đánh giá biểu thức động để phân giải các quy tắc điều kiện (`condition`) dựa trên dữ liệu instance tại thời điểm chạy đơn.
  - Khi luồng đi tới một bước, thực hiện phân giải `workflow_step_assignees` (ví dụ: tìm tất cả user thuộc DEPT_MANAGER hoặc BOARD_MEMBER) để tạo các bản ghi nhiệm vụ tương ứng trong bảng `workflow_approvers`.
  - Viết logic tính toán consensus (ALL, ANY, PERCENTAGE) dựa trên trạng thái xử lý thực tế của các thành viên trong bảng `workflow_approvers` cho bước hiện tại để quyết định xem bước đó đã hoàn tất hay chưa.

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ: Tích hợp gọi API cấu hình quy trình**
  - Liên kết các APIs cấu hình này với màn hình Workflow Designer, xây dựng module chuyển đổi từ sơ đồ trực quan (kéo thả) thành cấu trúc JSON payload gửi lên server.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* *Không thuộc phạm vi task này (chỉ cần gọi API instance để hiển thị trạng thái).*

#### 3.4 UI/UX Designer
* Cung cấp mockup cho việc biểu diễn các điều kiện rẽ nhánh và cấu hình consensus rule trong trình thiết kế workflow.

#### 3.5 DevOps
* Thiết lập log monitor để theo dõi tốc độ biên dịch/đánh giá biểu thức điều kiện của Workflow Engine.

#### 3.6 QA Engineer
* Viết unit test cho các hàm đánh giá Consensus Rules:
  - Test case ALL: 3 người duyệt, 2 người APPROVE -> chưa hoàn thành bước.
  - Test case ANY: 3 người duyệt, 1 người APPROVE -> hoàn thành bước, chuyển tiếp.
  - Test case PERCENTAGE (ngưỡng 60%): 5 người duyệt, 3 người APPROVE -> đạt 60%, hoàn thành bước.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Bước 1 (NestJS):** Chạy backend NestJS ở chế độ phát triển:
  ```bash
  npm run start:dev
  ```
* **Bước 2 (Gỡ lỗi Router Engine):** Sử dụng các file test trong `src/features/workflow/workflow-engine.spec.ts` để kiểm thử logic đi luồng, rẽ nhánh và consensus.

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* APIs cấu hình quy trình được xây dựng đầy đủ, kiểm soát phân quyền chặt chẽ (chỉ Admin/Owner được tạo/sửa).
* Thuật toán DFS phát hiện vòng lặp vô hại trong cấu trúc workflow hoạt động chính xác.
* Unit test bao phủ các kịch bản rẽ nhánh phức tạp đạt tỷ lệ > 85%.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
**Hoàn thành (Đã cập nhật nâng cao)**
* **Logic kiểm soát và cấu hình quy trình (Workflow Engine Core):**
  - Đã triển khai [WorkflowService](../../../../open-erp-services/src/core/workflow/workflow.service.ts) để quản lý cấu hình các quy trình (`workflows`, `workflow_steps`, `workflow_step_assignees`).
  - Hỗ trợ phân tích, bóc tách `assignees` động (gồm vai trò `ROLE`, phòng ban `DEPARTMENT`, người dùng `USER`) từ cấu hình JSON payload và lưu trữ chuẩn hóa phục vụ tra cứu, tạo báo cáo.
  - Tích hợp kiểm thử tính tuần tự và phát hiện vòng lặp vô hạn (Cycle Detection) bằng thuật toán tìm kiếm theo chiều sâu (DFS) trước khi lưu quy trình vào DB.
  - Hỗ trợ tự động ánh xạ các ID bước tạm thời của luồng rẽ nhánh, song song (Fork/Join) từ giao diện thiết kế sang các UUID tương ứng trong cơ sở dữ liệu.
  - **Cập nhật nâng cao (TSK-2.17):** Hỗ trợ cấu hình `fallbackAssignee` trong trường `config` của bước duyệt. Nâng cấp logic phân giải người duyệt trong `WorkflowInstanceService` để tự động kích hoạt `fallbackAssignee` (hỗ trợ phân giải kiểu `USER`, `ROLE`, hoặc `DEPARTMENT`) khi danh sách người xử lý chính rỗng.
* **REST APIs:**
  - `POST /api/v1/workflows`: Nhận cấu hình quy trình mới, thực hiện kiểm tra vòng lặp vô hạn, ánh xạ ID bước và lưu trữ giao dịch (transactional) an toàn vào DB.
  - `GET /api/v1/workflows`: Liệt kê tất cả các quy trình phê duyệt thuộc tenant.
  - `GET /api/v1/workflows/:id`: Xem chi tiết cấu trúc các bước và cấu hình rẽ nhánh, gán việc của một quy trình theo ID.
  - Các APIs được thiết lập tại [WorkflowController](../../../../open-erp-services/src/features/workflow/workflow.controller.ts) và bảo vệ bằng `JwtAuthGuard`.
* **Kiểm thử tự động (Unit Tests):**
  - Đã viết unit test đầy đủ cho service tại [workflow.service.spec.ts](../../../../open-erp-services/src/core/workflow/workflow.service.spec.ts).
  - Đã viết unit test đầy đủ cho controller tại [workflow.controller.spec.ts](../../../../open-erp-services/src/core/workflow/workflow.controller.spec.ts).
  - Bổ sung unit test cho logic phân giải fallback assignee trong [workflow-instance.service.spec.ts](../../../../open-erp-services/src/core/workflow/workflow-instance.service.spec.ts). 100% test cases đã chạy thành công và đạt độ bao phủ code cao.
