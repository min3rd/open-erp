# Tài liệu kỹ thuật chi tiết: TSK-2.3 - API Thiết kế & Quản lý Form động
## Phân hệ: Biểu mẫu động (Dynamic Form - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng phân hệ API quản lý Form động (Dynamic Form Builder) cho phép người yêu cầu hoặc quản trị doanh nghiệp tự định nghĩa cấu trúc trường dữ liệu, giao diện bố cục (layout), các quy tắc ràng buộc giá trị nhập (validation rules) cho từng biểu mẫu. Biểu mẫu này sẽ được nhúng động vào các bước khác nhau trong quy trình phê duyệt.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Cấu trúc định nghĩa Form động (JSON Schema)
Mỗi form động được định nghĩa bằng một cấu trúc mảng trường dữ liệu linh hoạt lưu ở cột `fields` (JSONB) của bảng `dynamic_forms`.

```json
[
  {
    "id": "field_reason",
    "name": "reason",
    "label": "Lý do mua sắm",
    "type": "TEXTAREA", // Kiểu dữ liệu: TEXT, TEXTAREA, NUMBER, DATE, SELECT, CHECKBOX, FILE
    "required": true,
    "defaultValue": "",
    "placeholder": "Nhập chi tiết lý do...",
    "validation": {
      "minLength": 10,
      "maxLength": 500
    }
  },
  {
    "id": "field_amount",
    "name": "totalAmount",
    "label": "Tổng kinh phí đề xuất (VNĐ)",
    "type": "NUMBER",
    "required": true,
    "validation": {
      "min": 1000,
      "max": 1000000000
    }
  },
  {
    "id": "field_category",
    "name": "category",
    "label": "Danh mục trang thiết bị",
    "type": "SELECT",
    "required": true,
    "options": [
      { "label": "Máy tính & Laptop", "value": "IT_EQUIPMENT" },
      { "label": "Bàn ghế văn phòng", "value": "FURNITURE" },
      { "label": "Văn phòng phẩm", "value": "STATIONERY" }
    ]
  }
]
```

#### 2.2 Đặc tả API endpoint liên quan
Tham chiếu đầy đủ trong [api_overview.md](../../../03_functional/api_overview.md).

* **`POST /api/v1/dynamic-forms`** (Authorized: Admin)
  - **Payload yêu cầu:**
    ```json
    {
      "name": "Đơn đề xuất mua sắm",
      "description": "Form thu thập nhu cầu mua sắm thiết bị của nhân viên",
      "fields": [
        // Danh sách định nghĩa trường JSON như ở mục 2.1
      ]
    }
    ```
  - **Phản hồi thành công (201 Created):**
    ```json
    {
      "success": true,
      "data": {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "Đơn đề xuất mua sắm",
        "createdAt": "2026-06-21T12:00:00Z"
      }
    }
    ```

* **`POST /api/v1/dynamic-forms/:id/validate`** (Public/Authorized)
  - Dùng để chạy thử nghiệm hoặc kiểm tra tính hợp lệ của dữ liệu người dùng điền vào form trước khi lưu vào luồng duyệt.
  - **Payload yêu cầu:**
    ```json
    {
      "reason": "Mua laptop mới phục vụ code dự án OpenERP",
      "totalAmount": 25000000,
      "category": "IT_EQUIPMENT"
    }
    ```
  - **Phản hồi thành công (200 OK):**
    ```json
    {
      "success": true,
      "message": "Dữ liệu hợp lệ"
    }
    ```
  - **Phản hồi lỗi validation (400 Bad Request):**
    ```json
    {
      "success": false,
      "errors": [
        {
          "field": "reason",
          "message": "Lý do mua sắm phải dài tối thiểu 10 ký tự"
        }
      ]
    }
    ```

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: CRUD Dynamic Form Template**
  - Viết APIs quản lý thiết kế form động (`dynamic_forms`).
  - Viết schema validator đảm bảo cấu hình trường JSON gửi lên hợp lệ (đúng kiểu `type`, các rule validate không mâu thuẫn).
* **Nhiệm vụ 2: Lõi thực thi Validation dữ liệu động (Data Validator)**
  - Viết service phân tích dữ liệu nhập vào của người dùng dựa trên định nghĩa JSON Schema tương ứng. Tự động kiểm tra tính `required`, độ dài chuỗi, khoảng giá trị số, định dạng ngày tháng, và tệp đính kèm.

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Component Render Form động**
  - Xây dựng component `DynamicFormRenderer` nhận vào cấu hình JSON và render ra các input tương ứng sử dụng form controls của Angular. Tích hợp hiển thị lỗi validate realtime.
* **Nhiệm vụ 2: Liên kết với API**
  - Gọi các API để lấy định nghĩa form động và chạy thử tính năng validate.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* **Nhiệm vụ: Component Render Form trên di động**
  - Phát triển component render form tương thích với Ionic/Cordova trên thiết bị di động, đảm bảo tối ưu hóa bàn phím nhập (number pad cho số, date picker cho ngày).

#### 3.4 UI/UX Designer
* Cung cấp thiết kế chuẩn cho các loại điều khiển nhập liệu khác nhau (Text, Select, File Upload, Date, Checkbox) đảm bảo tính dễ dùng, khoảng cách hợp lý và hiển thị thông báo lỗi rõ ràng.

#### 3.5 QA Engineer
* Viết bộ test suite cho API validator:
  - Trường hợp thành công (dữ liệu khớp schema).
  - Trường hợp lỗi (thiếu trường bắt buộc, sai định dạng số/ngày, vượt quá min/max).

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Bước 1:** Chạy server backend:
  ```bash
  npm run start:dev
  ```
* **Bước 2:** Chạy test kiểm thử logic validate form động:
  ```bash
  npm run test -- src/features/dynamic-form/form-validator.spec.ts
  ```

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* APIs quản lý form động và validate dữ liệu hoạt động ổn định.
* Dữ liệu form lưu trữ đúng định dạng JSONB trong database.
* Hoàn thành bộ unit test cho Dynamic Form Validator đạt độ bao phủ > 90%.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
*(Chưa bắt đầu)*
