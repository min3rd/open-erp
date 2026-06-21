# Tài liệu kỹ thuật chi tiết: TSK-2.2 - API Cấu hình quy trình rẽ nhánh & Điều kiện phê duyệt phức tạp
## Phân hệ: Lõi quy trình phê duyệt (Workflow Engine Core - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng tập hợp REST APIs để định nghĩa và cấu hình quy trình phê duyệt động. Hỗ trợ cơ chế thiết lập sơ đồ quy trình rẽ nhánh (branching flow) dựa trên điều kiện dữ liệu của đơn từ và các quy tắc đồng thuận phức tạp (Consensus Rules) cho từng bước duyệt: tất cả đồng ý (ALL), tối thiểu một người đồng ý (ANY), hoặc tỉ lệ đồng ý vượt ngưỡng quy định (PERCENTAGE).

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Cơ chế rẽ nhánh & Điều kiện đồng thuận
* **Điều kiện rẽ nhánh (Branching Condition):** Sử dụng thư viện đánh giá biểu thức (ví dụ: `expr` hoặc `json-rules-engine`) để tính toán điều kiện tại runtime.
  - Ví dụ: `context_data.totalAmount > 50000000` -> Chuyển đến bước Duyệt của Giám đốc tài chính; ngược lại chuyển đến bước Trưởng phòng mua sắm.
* **Quy tắc đồng thuận (Consensus Rules):**
  - **`ALL`:** Tất cả những người được gán quyền duyệt ở bước hiện tại bắt buộc phải phê duyệt (`action = APPROVE`) thì đơn mới được chuyển tiếp. Nếu 1 người từ chối (`REJECT`), đơn dừng ngay lập tức.
  - **`ANY`:** Chỉ cần ít nhất 1 người phê duyệt, đơn sẽ lập tức được chuyển sang bước tiếp theo mà không cần chờ những người còn lại.
  - **`PERCENTAGE`:** Xác định tỷ lệ phần trăm tối thiểu (ví dụ: `> 60%`). Khi số người duyệt đạt tỷ lệ này trên tổng số người được gán, đơn sẽ tự động thông qua.

#### 2.2 Đặc tả API endpoint liên quan
Tham chiếu đầy đủ trong [api_overview.md](../../../03_functional/api_overview.md).

* **`POST /api/v1/workflows`** (Authorized: Admin)
  - **Payload yêu cầu:**
    ```json
    {
      "name": "Quy trình Đề xuất Mua sắm Thiết bị",
      "description": "Luồng phê duyệt dành riêng cho việc mua sắm trang thiết bị văn phòng",
      "steps": [
        {
          "name": "Trưởng phòng ký duyệt",
          "stepOrder": 1,
          "formId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "config": {
            "assignees": {
              "type": "ROLE",
              "value": "DEPT_MANAGER"
            },
            "consensusRule": "ANY"
          }
        },
        {
          "name": "Rẽ nhánh dựa trên ngân sách",
          "stepOrder": 2,
          "config": {
            "branching": {
              "rules": [
                {
                  "condition": "context.totalAmount >= 50000000",
                  "targetStepOrder": 4 // Nhảy thẳng tới bước duyệt của Ban Giám Đốc
                },
                {
                  "condition": "context.totalAmount < 50000000",
                  "targetStepOrder": 3 // Qua bước kế toán kiểm tra
                }
              ]
            }
          }
        },
        {
          "name": "Kế toán kiểm duyệt ngân sách",
          "stepOrder": 3,
          "config": {
            "assignees": {
              "type": "USER_IDS",
              "value": ["usr-acct-1", "usr-acct-2"]
            },
            "consensusRule": "ALL"
          }
        },
        {
          "name": "Ban Giám Đốc phê duyệt cuối",
          "stepOrder": 4,
          "config": {
            "assignees": {
              "type": "ROLE",
              "value": "BOARD_MEMBER"
            },
            "consensusRule": "PERCENTAGE",
            "thresholdPercentage": 66.6
          }
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
*(Chưa bắt đầu)*
