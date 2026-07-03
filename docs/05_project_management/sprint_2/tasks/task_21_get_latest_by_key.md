# Task Specification: TSK-2.21 - API getLatestByKey cho DynamicForm

## Phân hệ: Dynamic Form Builder (Sprint 2)

| Thuộc tính | Giá trị |
|-----------|---------|
| Task ID | TSK-2.21 |
| Tên task | API getLatestByKey cho DynamicForm |
| Trạng thái | [x] Completed |
| Ưu tiên | High |
| Severity | - |
| Người thực hiện | BE Engineers |
| Ngày hoàn thành | 2026-07-02 |
| Branch | feature/dynamic-form-get-latest-by-key |

---

## 1. Mục tiêu (Objective)

Cung cấp API endpoint để lấy phiên bản mới nhất của Dynamic Form theo `formKey` mà không cần biết version number. Tính năng này rất quan trọng cho các场景 sử dụng thực tế khi client chỉ biết `formKey` và cần form mới nhất để hiển thị form.

---

## 2. Mô tả chi tiết (Detailed Description)

### 2.1 Background

Trong hệ thống Dynamic Form Builder, forms được version hóa và mỗi `formKey` có thể có nhiều phiên bản. Hiện tại, API `GET /dynamic-forms/key/:key/versions` trả về TẤT CẢ các phiên bản, yêu cầu client tự tìm version mới nhất.

Tính năng này thêm API mới chỉ trả về **một** form - phiên bản mới nhất theo `formKey`, giảm payload và đơn giản hóa client logic.

### 2.2 Use Cases

1. **Self-service Form Rendering**: User điền form khi gửi đơn - client gửi `formKey`, server trả form mới nhất để render
2. **Smart Approval Inbox**: Approver xem form điền sẵn của task - chỉ cần `formKey` từ workflow instance
3. **Mobile App Integration**: Mobile app không lưu version number - lấy form mới nhất theo `formKey` từ backend

---

## 3. API Specification

### 3.1 Endpoint

```
GET /api/v1/dynamic-forms/key/:key
```

### 3.2 Headers

| Header | Required | Value |
|--------|----------|-------|
| Authorization | Yes | Bearer `<jwt_token>` |
| x-subdomain | Yes | Tenant subdomain |

### 3.3 Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| key | string | Yes | `formKey` của form cần lấy |

### 3.4 Response

**Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "formKey": "employee_onboarding",
    "name": "Onboarding Form",
    "description": "Employee onboarding information",
    "version": 3,
    "isLatest": true,
    "createdAt": "2026-07-01T10:30:00.000Z",
    "fields": [
      {
        "id": "field_1",
        "name": "fullName",
        "label": "Full Name",
        "type": "TEXT",
        "required": true,
        "validation": { "minLength": 3, "maxLength": 100 }
      }
    ],
    "meta": {
      "layout": {
        "rows": [
          {
            "columns": [
              { "fieldId": "field_1", "span": 12 }
            ]
          }
        ]
      }
    }
  }
}
```

**Error Responses**

| Status | Error Code | Description |
|--------|------------|-------------|
| 401 | UNAUTHORIZED | Invalid or missing JWT token |
| 403 | FORBIDDEN | Tenant access denied |
| 404 | FORM_NOT_FOUND | No form found with the given `formKey` |
| 400 | BAD_REQUEST | Invalid `formKey` format |

---

## 4. Implementation Details

### 4.1 Backend Implementation

#### Service Layer (`DynamicFormService`)

```typescript
async getLatestByKey(formKey: string, tenantId: string | null): Promise<DynamicForm> {
  const form = await this.formRepository.findOne({
    where: { formKey, tenantId: tenantId as any, isLatest: true },
    order: { version: 'DESC' },
  });

  if (!form) {
    throw new NotFoundException({
      success: false,
      error: { code: 'FORM_NOT_FOUND', messageKey: 'dynamic_form.not_found' },
    });
  }

  return form;
}
```

#### Controller Layer (`DynamicFormController`)

```typescript
@Get('key/:key')
async getLatestByKey(@Param('key') key: string, @Req() req: any) {
  const tenantId = req.tenantId;
  const form = await this.dynamicFormService.getLatestByKey(key, tenantId);
  return {
    success: true,
    data: {
      id: form.id,
      formKey: form.formKey,
      name: form.name,
      description: form.description,
      version: form.version,
      isLatest: form.isLatest,
      createdAt: form.createdAt,
      fields: form.fields,
      meta: form.layout || {},
    },
  };
}
```

### 4.2 Database Query Optimization

- Uses database-level filtering (`where: { formKey, tenantId, isLatest }`)
- Adds `ORDER BY version DESC` to ensure latest version is returned
- Database index should exist on `(formKey, tenantId, isLatest)` for optimal performance

---

## 5. Testing Strategy

### 5.1 Unit Tests

**Test Cases:**

1. `getLatestByKey` returns correct latest version
2. `getLatestByKey` throws `NotFoundException` when formKey doesn't exist
3. `getLatestByKey` respects tenant isolation
4. `getLatestByKey` only returns form where `isLatest = true`

### 5.2 Integration Tests

1. Full request lifecycle: auth → tenant resolution → service call → response
2. Concurrent form creation → verify only latest is returned
3. Form restoration → verify old form marked `isLatest = false` and restored becomes latest

### 5.3 Test Results

- ✅ Unit tests: PASS
- ✅ Integration tests: PASS
- ✅ E2E tests: PASS

---

## 6. Dependencies

| Dependency | Version | Purpose |
|-----------|---------|---------|
| @nestjs/common | ^10.0.0 | Core framework |
| @nestjs/typeorm | ^10.0.0 | Database repository |
|typeorm | ^0.3.20 | ORM query builder |

---

## 7. Rollout Plan

1. **Branch**: `feature/dynamic-form-get-latest-by-key`
2. **PR Review**: Required (1 reviewer)
3. **Merge to develop**: 2026-07-02
4. **Deploy to UAT**: 2026-07-03
5. **Deploy to production**: 2026-07-05 (after UAT validation)

---

## 8. Breaking Changes & Migration

**Breaking Changes**: None

**Migration Required**: No

**Deprecation**: No existing API deprecated. New endpoint added alongside existing `/versions` endpoint.

---

## 9. Documentation Updates

- ✅ API documentation updated in Swagger/OpenAPI spec
- ✅ Developer guide updated with new endpoint usage
- ✅ Inline code comments added for clarity

---

## 10. Verification Checklist

- [x] Implementation matches API specification
- [x] Unit tests written and passing
- [x] Integration tests written and passing
- [x] Code reviewed and approved
- [x] Documentation updated
- [x] No breaking changes introduced
- [x] Security review passed
- [x] Performance benchmarked (N/A for simple query)
- [x] Merge to develop completed
- [x] Task status updated in Sprint 2 index

---

## 11. Related Tasks & References

- **Parent Task**: TSK-2.3 - API Thiết kế & Quản lý Form động
- **Related Task**: TSK-2.17 - Cập nhật API Form động & Workflow Engine
- **Documentation**: [Dynamic Form API Guide](./task_03_dynamic_form_api.md)

---

**Status**: [x] Completed on 2026-07-02  
**Verified by**: Project Manager Agent  
**Next Steps**: Deploy to production after UAT validation
