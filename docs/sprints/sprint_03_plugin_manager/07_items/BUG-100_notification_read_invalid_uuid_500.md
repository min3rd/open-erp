# BUG-100: `POST /tenant/notifications/{id}/read` với id sai định dạng trả 500

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-100 |
| **Mức độ** | Low |
| **Phát hiện bởi** | QA/QC Agent (Bước 8) |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Resolved (Dev fix 2026-09-20) |
| **Liên quan** | TASK-311, `TenantNotificationResource` |

## Mô tả

`UUID.fromString(notificationId)` không được bọc try/catch → id không phải UUID gây `IllegalArgumentException` → GlobalExceptionMapper trả 500 thay vì 400 (vi phạm chuẩn lỗi 4 khuôn mẫu: lỗi client phải là 4xx + `code`).

## Hướng sửa (đã thực hiện)

- Bọc parse UUID, ném `ApiException(400, PLUGIN_NOTIFICATION_NOT_FOUND)` với thông điệp "Invalid notification id".
- (Tính cô lập tenant của `markRead` đã đúng: update theo `tenantId = ? and id = ?`.)

## Tiêu chí kiểm tra sau sửa

- [ ] `POST /tenant/notifications/abc/read` → 400 `{success:false, code:PLUGIN_NOTIFICATION_NOT_FOUND}` (kiểm thử thủ công QA bổ sung trong QA-01).
