# TASK-SPRINT-02-SYSTEM_ADMIN-004: Dynamic Forms Engine — Biểu mẫu tùy chỉnh

## Thông tin

| Thuộc tính      | Giá trị                         |
| --------------- | ------------------------------- |
| Task ID         | TASK-SPRINT-02-SYSTEM_ADMIN-004 |
| Sprint          | Sprint 02                       |
| Cluster         | system-admin                    |
| Loại            | Backend                         |
| Người phụ trách | Backend                         |
| Story Points    | 8                               |
| Trạng thái      | ⬜ TODO                         |
| Phụ thuộc       | TASK-SPRINT-02-SYSTEM_ADMIN-003 |

## Mô tả

Xây dựng Dynamic Forms Engine — cho phép Tenant Admin tạo biểu mẫu tùy chỉnh (JSON-schema-based) mà không cần code. Hỗ trợ nhiều loại trường dữ liệu, validation rules, phiên bản form, và lưu trữ form submissions. Được dùng cho các nghiệp vụ linh hoạt: đơn xin nghỉ, phiếu đề xuất mua sắm, báo cáo tùy chỉnh.

## Phạm vi kỹ thuật

### Backend (NestJS — `catalog-service`, bổ sung module DynamicForms)

**Cấu trúc bổ sung:**

```
src/
├── dynamic-forms/
│   ├── dynamic-forms.controller.ts
│   ├── dynamic-forms.service.ts
│   ├── form-submissions/
│   │   ├── form-submissions.controller.ts
│   │   └── form-submissions.service.ts
│   ├── schemas/
│   │   ├── dynamic-form.schema.ts
│   │   └── form-submission.schema.ts
│   ├── dto/
│   │   ├── create-form.dto.ts
│   │   └── submit-form.dto.ts
│   └── validation/
│       └── form-validator.service.ts    ← Server-side validation
```

**Form Schema (JSON):**

```typescript
interface DynamicFormSchema {
  id: string;
  name: string;
  description?: string;
  version: number;
  fields: FormField[];
  settings: {
    allowMultipleSubmissions: boolean;
    requiresApproval: boolean;
    notifyOnSubmit: string[]; // userIds to notify
    successMessage: string;
    redirectUrl?: string;
  };
}

interface FormField {
  id: string; // Unique trong form
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  order: number;
  width: "full" | "half" | "third"; // Layout
  validation?: FieldValidation;
  options?: SelectOption[]; // Cho select, multi-select, radio, checkbox
  conditionalDisplay?: ConditionalRule; // Hiện field khi điều kiện khác thỏa mãn
  dataSource?: string; // catalogType để load options động
}

type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date"
  | "date-range"
  | "time"
  | "datetime"
  | "select"
  | "multi-select"
  | "radio"
  | "checkbox"
  | "toggle"
  | "file"
  | "image"
  | "rich-text"
  | "user-picker"
  | "department-picker"
  | "section-header"
  | "divider";
```

**FieldValidation:**

```typescript
interface FieldValidation {
  min?: number; // Số tối thiểu / độ dài tối thiểu
  max?: number; // Số tối đa / độ dài tối đa
  minLength?: number;
  maxLength?: number;
  pattern?: string; // Regex pattern
  patternMessage?: string; // Thông báo lỗi khi không khớp pattern
  allowedFileTypes?: string[]; // ['image/jpeg', 'application/pdf']
  maxFileSizeMb?: number;
  customMessage?: string; // Override default error message
}
```

**ConditionalDisplay:**

```typescript
interface ConditionalRule {
  fieldId: string; // Field cần kiểm tra
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "in";
  value: unknown;
}
// Ví dụ: chỉ hiện field "reason" khi "leaveType" = "sick"
```

**Form Versioning:**

- Mỗi lần publish form tạo version mới
- Form cũ vẫn giữ, submissions link với version cụ thể
- Draft → Published → Archived

**Form Validation Engine (Server-side):**

```typescript
@Injectable()
export class FormValidatorService {
  async validate(
    formId: string,
    version: number,
    data: Record<string, unknown>,
  ): Promise<ValidationResult> {
    const form = await this.getFormVersion(formId, version);
    const errors: FieldError[] = [];

    for (const field of form.fields) {
      const value = data[field.id];

      if (field.required && !value) {
        errors.push({
          fieldId: field.id,
          message: `${field.label} là bắt buộc`,
        });
        continue;
      }

      if (value && field.validation) {
        errors.push(...this.validateField(field, value));
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
```

### Database (MongoDB)

**Collection: `dynamic_forms`** (tenantId-scoped)

| Trường            | Kiểu     | Ràng buộc                | Mô tả                     |
| ----------------- | -------- | ------------------------ | ------------------------- |
| `_id`             | ObjectId | —                        | Primary key               |
| `tenantId`        | ObjectId | required                 | Tenant                    |
| `name`            | string   | required                 | Tên form                  |
| `description`     | string   | optional                 | Mô tả                     |
| `category`        | string   | optional                 | Nhóm form (HR, Sale, ...) |
| `status`          | enum     | DRAFT/PUBLISHED/ARCHIVED | Trạng thái                |
| `currentVersion`  | number   | default: 1               | Phiên bản đang active     |
| `schema`          | object   | required                 | JSON form schema          |
| `settings`        | object   | —                        | Form settings             |
| `submissionCount` | number   | default: 0               | Số submissions            |
| `isDeleted`       | boolean  | default: false           | Soft delete               |
| `createdBy`       | ObjectId | required                 | Người tạo                 |
| `publishedAt`     | Date     | optional                 | —                         |
| `createdAt`       | Date     | auto                     | —                         |
| `updatedAt`       | Date     | auto                     | —                         |

**Collection: `form_versions`** (tenantId-scoped)

| Trường      | Kiểu     | Mô tả                                 |
| ----------- | -------- | ------------------------------------- |
| `_id`       | ObjectId | —                                     |
| `tenantId`  | ObjectId | Tenant                                |
| `formId`    | ObjectId | Reference đến dynamic_forms           |
| `version`   | number   | Số phiên bản                          |
| `schema`    | object   | Snapshot schema tại thời điểm publish |
| `createdBy` | ObjectId | Ai publish                            |
| `createdAt` | Date     | Thời điểm publish                     |

**Collection: `form_submissions`** (tenantId-scoped)

| Trường            | Kiểu     | Ràng buộc                 | Mô tả                        |
| ----------------- | -------- | ------------------------- | ---------------------------- |
| `_id`             | ObjectId | —                         | Primary key                  |
| `tenantId`        | ObjectId | required                  | Tenant                       |
| `formId`          | ObjectId | required                  | Form                         |
| `formVersion`     | number   | required                  | Phiên bản form khi submit    |
| `submittedBy`     | ObjectId | required                  | User submit                  |
| `data`            | object   | required                  | Dữ liệu form đã submit       |
| `status`          | enum     | PENDING/APPROVED/REJECTED | Trạng thái (nếu cần approve) |
| `approvedBy`      | ObjectId | optional                  | Người duyệt                  |
| `approvedAt`      | Date     | optional                  | Thời điểm duyệt              |
| `rejectionReason` | string   | optional                  | Lý do từ chối                |
| `attachments`     | array    | optional                  | MinIO URLs                   |
| `submittedAt`     | Date     | required                  | Thời điểm submit             |
| `createdAt`       | Date     | auto                      | —                            |

**Indexes:**

```
{ tenantId: 1, formId: 1, submittedAt: -1 }
{ tenantId: 1, submittedBy: 1, submittedAt: -1 }
{ tenantId: 1, status: 1 }
```

## API Endpoints

| Method | Path                                           | Mô tả                          | Auth               |
| ------ | ---------------------------------------------- | ------------------------------ | ------------------ |
| GET    | `/api/v1/forms`                                | Danh sách forms                | Tenant Admin       |
| POST   | `/api/v1/forms`                                | Tạo form mới (DRAFT)           | Tenant Admin       |
| GET    | `/api/v1/forms/:id`                            | Chi tiết form + schema         | Any user           |
| PATCH  | `/api/v1/forms/:id`                            | Cập nhật form (DRAFT only)     | Tenant Admin       |
| POST   | `/api/v1/forms/:id/publish`                    | Publish form (tạo version mới) | Tenant Admin       |
| DELETE | `/api/v1/forms/:id`                            | Archive/xoá form               | Tenant Admin       |
| POST   | `/api/v1/forms/:id/submit`                     | Submit form data               | Any user           |
| GET    | `/api/v1/forms/:id/submissions`                | Danh sách submissions          | Tenant Admin       |
| GET    | `/api/v1/forms/:id/submissions/:subId`         | Chi tiết submission            | Tenant Admin/Owner |
| PATCH  | `/api/v1/forms/:id/submissions/:subId/approve` | Duyệt submission               | Tenant Admin       |
| PATCH  | `/api/v1/forms/:id/submissions/:subId/reject`  | Từ chối submission             | Tenant Admin       |

## Yêu cầu bảo mật

- [ ] User chỉ xem được submissions của mình (trừ Admin)
- [ ] File upload trong form submission: validate MIME type, max size
- [ ] Form schema không được chứa code thực thi (XSS prevention)
- [ ] Sanitize rich-text input để tránh XSS

## Acceptance Criteria

- [ ] Tạo form với JSON schema đầy đủ các field types
- [ ] Publish form → tạo version snapshot
- [ ] Submit form → validate server-side → lưu submission
- [ ] Required field bị bỏ trống → 400 với field-level errors
- [ ] File upload trong submission → lưu MinIO, URL trong data
- [ ] Conditional field: ẩn/hiện trường theo điều kiện
- [ ] Approve/reject submission → notification
- [ ] Danh sách submissions filter theo status, submittedBy, dateRange
- [ ] Unit test coverage ≥ 80%
- [ ] Multi-tenancy: mọi DB query đều có tenantId filter

## Ghi chú kỹ thuật

- JSON schema validation dùng `ajv` (Ajv) hoặc custom validator.
- Rich-text sanitization: `dompurify` (server-side với `jsdom`).
- File upload trong form submission: stream trực tiếp lên MinIO.
- Conditional logic evaluate ở server khi validate (không chỉ client).
- Form schema preview API: trả về rendered HTML/JSON cho frontend form builder.
- Liên kết với workflow engine ở Sprint sau: submission → trigger workflow.
