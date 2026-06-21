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
  - Khởi tạo form mới hoặc cập nhật thiết kế (tạo phiên bản mới). Nếu gửi kèm `formKey` đã có, hệ thống tự động sinh bản ghi mới với `version` tăng thêm 1 và cập nhật lại cờ `is_latest` của các bản ghi liên quan.
  - **Payload yêu cầu:**
    ```json
    {
      "formKey": "purchase_proposal_form",
      "name": "Đơn đề xuất mua sắm (Cập nhật)",
      "description": "Form thu thập nhu cầu mua sắm thiết bị - Version mới",
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
        "id": "4ab95f64-5717-4562-b3fc-2c963f66bbb7",
        "formKey": "purchase_proposal_form",
        "name": "Đơn đề xuất mua sắm (Cập nhật)",
        "version": 2,
        "isLatest": true,
        "createdAt": "2026-06-21T12:00:00Z"
      }
    }
    ```

* **`GET /api/v1/dynamic-forms/key/:key/versions`** (Authorized)
  - Lấy danh sách lịch sử tất cả các phiên bản của một form.
  - **Phản hồi thành công (200 OK):**
    ```json
    {
      "success": true,
      "data": [
        { "id": "4ab95f64-5717-4562-b3fc-2c963f66bbb7", "version": 2, "isLatest": true, "createdAt": "2026-06-21T12:00:00Z" },
        { "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "version": 1, "isLatest": false, "createdAt": "2026-06-20T10:00:00Z" }
      ]
    }
    ```

* **`POST /api/v1/dynamic-forms/:id/restore`** (Authorized: Admin)
  - Khôi phục (restore) lại một phiên bản cũ trong lịch sử. Hệ thống sẽ clone cấu trúc trường của phiên bản được chỉ định bởi `id` và sinh ra một version mới nhất (`is_latest = true`).
  - **Phản hồi thành công (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "id": "5cd95f64-5717-4562-b3fc-2c963f66ccc8",
        "formKey": "purchase_proposal_form",
        "version": 3,
        "isLatest": true,
        "restoredFromVersion": 1
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
**Hoàn thành**

* **TypeORM Entity (Cấu trúc DB Schema):**
  - [DynamicForm entity](file:///c:/Users/Minh/Documents/open-erp/open-erp-services/src/core/dynamic-form/entities/dynamic-form.entity.ts) - Bảng `dynamic_forms` với các cột: `id`, `tenant_id`, `form_key`, `name`, `description`, `version`, `is_latest`, `fields` (JSONB), `created_at`, `updated_at`. Ràng buộc unique `(tenant_id, form_key, version)` được đảm bảo qua logic nghiệp vụ.

* **Core Service Logic:**
  - [DynamicFormService](file:///c:/Users/Minh/Documents/open-erp/open-erp-services/src/core/dynamic-form/dynamic-form.service.ts) cung cấp các hàm:
    - `createOrUpdateForm`: Tạo form mới hoặc sinh phiên bản mới tự động khi `formKey` đã tồn tại (tăng version, chuyển `is_latest = false` cho bản cũ).
    - `getVersionsByKey`: Lấy lịch sử tất cả phiên bản của một form theo `formKey`.
    - `restoreVersion`: Khôi phục phiên bản cũ bằng cách clone cấu trúc `fields` và sinh version mới nhất.
    - `validateData`: Thực thi kiểm tra dữ liệu người dùng nhập theo JSON schema của form (required, minLength/maxLength, min/max number, date format, SELECT options).
    - `validateFieldSchemas` (private): Kiểm tra tính hợp lệ của cấu hình trường JSON do admin gửi lên (đúng type, không trùng id, SELECT phải có options).

* **REST APIs** (bảo vệ bởi `JwtAuthGuard`):
  - `POST /api/v1/dynamic-forms` — Tạo form mới hoặc phiên bản mới.
  - `GET /api/v1/dynamic-forms/key/:key/versions` — Lịch sử tất cả phiên bản theo formKey.
  - `POST /api/v1/dynamic-forms/:id/restore` — Khôi phục phiên bản cũ.
  - `POST /api/v1/dynamic-forms/:id/validate` — Validate dữ liệu nhập theo schema.
  - Thiết lập tại [DynamicFormController](file:///c:/Users/Minh/Documents/open-erp/open-erp-services/src/features/dynamic-form/dynamic-form.controller.ts).

* **Kiểm thử tự động (Unit Tests):**
  - [dynamic-form.service.spec.ts](file:///c:/Users/Minh/Documents/open-erp/open-erp-services/src/core/dynamic-form/dynamic-form.service.spec.ts) — 20 test cases bao phủ toàn bộ luồng versioning, restore, validate schema và validate data.
  - [dynamic-form.controller.spec.ts](file:///c:/Users/Minh/Documents/open-erp/open-erp-services/src/features/dynamic-form/dynamic-form.controller.spec.ts) — 8 test cases bao phủ toàn bộ 4 endpoints.
  - Tổng cộng **28 test cases**, tất cả PASS, build không có lỗi TypeScript.
