# TASK-SPRINT-02-SYSTEM_ADMIN-008: Chuẩn hóa contract i18n message key + metadata

## Thông tin

| Thuộc tính       | Giá trị                                                                            |
|------------------|------------------------------------------------------------------------------------|
| Task ID          | TASK-SPRINT-02-SYSTEM_ADMIN-008                                                    |
| Sprint           | Sprint 02                                                                          |
| Cluster          | system-admin                                                                       |
| Loại             | Backend                                                                            |
| Người phụ trách  | Backend                                                                            |
| Story Points     | 5                                                                                  |
| Trạng thái       | ⬜ TODO                                                                            |
| Phụ thuộc        | TASK-SPRINT-01-AUTH-001, TASK-SPRINT-01-TENANT-001, TASK-SPRINT-02-SYSTEM_ADMIN-006 |

## Mô tả

Chuẩn hóa toàn bộ response thông điệp từ backend theo định dạng `message.key + params + metadata` để frontend (Web/Mobile) dùng Transloco tự dịch. Loại bỏ dần các response trả text cứng theo ngôn ngữ cụ thể.

## Phạm vi kỹ thuật

### Backend (api-gateway + các service cốt lõi)

- Ban hành chuẩn response dùng chung cho `success message` và `error message`.
- Áp dụng trước cho nhóm endpoint ưu tiên:
  - Auth (`/api/v1/auth/*`)
  - Register/Tenant onboarding (`/api/v1/register/*`)
  - Notification preferences (`/api/v1/notifications/*`)
- Thêm helper/exception mapper để chuẩn hóa format message.

### Response contract chuẩn

```json
{
  "message": {
    "key": "auth.login.invalid_credentials",
    "params": {},
    "defaultMessage": "Thông tin đăng nhập không hợp lệ"
  },
  "i18n": {
    "namespace": "auth",
    "severity": "error",
    "action": "retry"
  }
}
```

### Rule bắt buộc

- Không trả HTML trong `message.params`.
- `key` theo quy ước `domain.context.intent`.
- `defaultMessage` chỉ dùng fallback, không làm nguồn hiển thị chính.
- Có mapping giữa `error.code` và `message.key` cho từng nhóm lỗi.

## API Endpoints sử dụng

Không tạo endpoint mới; chuẩn hóa response của endpoint hiện có.

## Acceptance Criteria

- [ ] Có tài liệu contract i18n message dùng chung cho backend.
- [ ] Ít nhất các endpoint Auth, Register, Notification trả đúng format key + params + metadata.
- [ ] Có middleware/helper dùng chung để tránh mỗi service tự định nghĩa khác nhau.
- [ ] Có test xác nhận response format không bị phá vỡ.
- [ ] Không còn response text cứng tiếng Việt/tiếng Anh ở các endpoint nằm trong phạm vi task.
- [ ] Tương thích ngược cho client cũ qua `defaultMessage` trong giai đoạn chuyển đổi.

## Ghi chú kỹ thuật

- Dùng shared package nội bộ hoặc common module để khai báo kiểu `I18nMessage`.
- Ưu tiên triển khai theo hướng non-breaking change trước khi loại bỏ hoàn toàn text cũ.
- Cần phối hợp frontend để thống nhất namespace Transloco.
