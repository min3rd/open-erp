# TASK-SPRINT-02-SYSTEM_ADMIN-006: Notification Service — Hệ thống thông báo

## Thông tin

| Thuộc tính      | Giá trị                                                |
| --------------- | ------------------------------------------------------ |
| Task ID         | TASK-SPRINT-02-SYSTEM_ADMIN-006                        |
| Sprint          | Sprint 02                                              |
| Cluster         | system-admin                                           |
| Loại            | Backend                                                |
| Người phụ trách | Backend                                                |
| Story Points    | 8                                                      |
| Trạng thái      | ⬜ TODO                                                |
| Phụ thuộc       | TASK-SPRINT-01-FOUNDATION-003, TASK-SPRINT-01-USER-001 |

## Mô tả

Xây dựng `notification-service` — microservice gửi thông báo đa kênh (in-app, email, push notification). Subscribe các events từ RabbitMQ, map sang notification templates, và gửi đến đúng người nhận qua kênh phù hợp. Người dùng có thể tùy chỉnh kênh nhận thông báo cho từng loại sự kiện.

## Phạm vi kỹ thuật

### Backend (NestJS — `notification-service`, port 3007)

**Cấu trúc module:**

```
src/
├── notification.module.ts
├── main.ts
├── notifications/
│   ├── notifications.controller.ts
│   ├── notifications.service.ts
│   └── schemas/
│       └── notification.schema.ts
├── templates/
│   ├── template.service.ts
│   └── schemas/
│       └── notification-template.schema.ts
├── preferences/
│   ├── preferences.service.ts
│   └── schemas/
│       └── notification-preference.schema.ts
├── channels/
│   ├── email/
│   │   └── email.service.ts        ← Nodemailer + SendGrid
│   ├── push/
│   │   └── push.service.ts         ← Firebase FCM
│   └── websocket/
│       └── ws-gateway.ts           ← Socket.IO gateway (in-app)
└── events/
    └── event-consumers.ts          ← Subscribe business events
```

**Notification Pipeline:**

```
1. RabbitMQ Event: task.assigned { assigneeId, taskTitle, ... }
2. Event Consumer → map event type → Template Engine
3. Template Engine → render notification content (title, body)
4. Preference Service → kiểm tra user muốn nhận qua kênh nào
5. Channel Dispatcher → gửi song song qua các kênh đã chọn
6. Lưu notification record vào DB
7. Emit WebSocket event → frontend nhận realtime
```

**Events Subscribe (ví dụ):**

| Event Type         | Template Key              | Recipients       |
| ------------------ | ------------------------- | ---------------- |
| `task.assigned`    | `task-assigned`           | Assignee         |
| `task.completed`   | `task-completed`          | Creator, Manager |
| `order.created`    | `order-new`               | Sales Manager    |
| `leave.submitted`  | `leave-request-new`       | Manager          |
| `leave.approved`   | `leave-request-approved`  | Requester        |
| `invoice.issued`   | `invoice-new`             | Accountant       |
| `user.login`       | `login-alert` (nếu IP lạ) | User             |
| `quota.alert`      | `quota-warning`           | Tenant Admin     |
| `tenant.suspended` | `tenant-suspended`        | Tenant Admin     |

**Notification Template Engine:**

```typescript
interface NotificationTemplate {
  key: string;           // 'task-assigned'
  tenantId?: ObjectId;   // null = system default, ObjectId = custom per tenant
  channels: {
    inApp?: { title: string; body: string; };
    email?: { subject: string; htmlBody: string; textBody: string; };
    push?: { title: string; body: string; imageUrl?: string; };
  };
  variables: string[];   // ['taskTitle', 'assigneeName', 'dueDate']
}

// Render template với Handlebars hoặc tự implement:
renderTemplate(template: string, variables: Record<string, unknown>): string
// Ví dụ: "Bạn được giao task {{taskTitle}} - hạn {{dueDate}}"
```

**In-App Notifications (WebSocket):**

```typescript
@WebSocketGateway({
  namespace: "/notifications",
  cors: { origin: "*" },
})
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  // Emit notification đến user specific
  sendToUser(userId: string, notification: NotificationDto): void {
    this.server.to(`user:${userId}`).emit("notification", notification);
  }

  // Client join room khi kết nối
  @SubscribeMessage("join")
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    client.join(`user:${userId}`);
  }
}
```

**Email Channel (Nodemailer + SendGrid):**

```typescript
// Hỗ trợ cả SMTP (Nodemailer) và SendGrid API
// Cấu hình per-tenant (hoặc system default)
interface EmailConfig {
  provider: "smtp" | "sendgrid";
  from: string;
  fromName: string;
  // SMTP:
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  // SendGrid:
  apiKey?: string;
}
```

**Push Notification (Firebase FCM):**

```typescript
// Lưu FCM device token khi user đăng nhập mobile app
// Gửi push notification qua Firebase Admin SDK
async sendPush(userId: string, notification: PushPayload): Promise<void> {
  const tokens = await this.getDeviceTokens(userId);
  await admin.messaging().sendMulticast({ tokens, notification });
}
```

**Notification Preferences:**

```typescript
// User tự chọn kênh nhận thông báo cho từng event type
interface NotificationPreference {
  tenantId: ObjectId;
  userId: ObjectId;
  eventType: string; // '*' = tất cả, hoặc 'task.assigned'
  channels: {
    inApp: boolean; // default: true
    email: boolean; // default: true
    push: boolean; // default: true
  };
  muted: boolean; // Tắt hoàn toàn loại thông báo này
  mutedUntil?: Date; // Tạm tắt đến thời điểm này
}
```

### Database (MongoDB)

**Collection: `notifications`** (tenantId-scoped)

| Trường      | Kiểu     | Ràng buộc      | Mô tả                            |
| ----------- | -------- | -------------- | -------------------------------- |
| `_id`       | ObjectId | —              | Primary key                      |
| `tenantId`  | ObjectId | required       | Tenant                           |
| `userId`    | ObjectId | required       | Người nhận                       |
| `type`      | string   | required       | Event type gốc                   |
| `title`     | string   | required       | Tiêu đề thông báo                |
| `body`      | string   | required       | Nội dung                         |
| `link`      | string   | optional       | Deep link (URL trong app)        |
| `icon`      | string   | optional       | Icon name hoặc URL               |
| `isRead`    | boolean  | default: false | Đã đọc chưa                      |
| `readAt`    | Date     | optional       | Thời điểm đọc                    |
| `channels`  | array    | —              | Kênh đã gửi: ['in-app', 'email'] |
| `metadata`  | object   | optional       | Extra data (taskId, orderId...)  |
| `createdAt` | Date     | auto           | —                                |

**Indexes:**

```
{ tenantId: 1, userId: 1, isRead: 1, createdAt: -1 }
{ tenantId: 1, userId: 1, createdAt: -1 }
{ createdAt: 1 }    — TTL index (xóa sau 90 ngày)
```

**Collection: `notification_templates`** (System + per-tenant)

**Collection: `notification_preferences`** (tenantId-scoped)

**Collection: `device_tokens`** (tenantId-scoped — lưu FCM tokens)

## API Endpoints

| Method | Path                                         | Mô tả                         | Auth         |
| ------ | -------------------------------------------- | ----------------------------- | ------------ |
| GET    | `/api/v1/notifications`                      | Danh sách thông báo của user  | Any user     |
| GET    | `/api/v1/notifications/unread-count`         | Số thông báo chưa đọc         | Any user     |
| PATCH  | `/api/v1/notifications/:id/read`             | Đánh dấu đã đọc               | Owner        |
| POST   | `/api/v1/notifications/bulk-read`            | Đánh dấu tất cả đã đọc        | Any user     |
| DELETE | `/api/v1/notifications/:id`                  | Xoá thông báo                 | Owner        |
| GET    | `/api/v1/notifications/preferences`          | Lấy preferences của user      | Any user     |
| PATCH  | `/api/v1/notifications/preferences`          | Cập nhật preferences          | Any user     |
| POST   | `/api/v1/notifications/device-tokens`        | Đăng ký FCM device token      | Any user     |
| DELETE | `/api/v1/notifications/device-tokens/:token` | Xoá device token (logout)     | Any user     |
| GET    | `/api/v1/notification-templates`             | Danh sách templates           | Tenant Admin |
| PATCH  | `/api/v1/notification-templates/:key`        | Tùy chỉnh template cho tenant | Tenant Admin |

## Yêu cầu bảo mật

- [ ] User chỉ xem được notifications của mình
- [ ] WebSocket connection phải authenticate bằng JWT
- [ ] Device tokens lưu encrypted
- [ ] Email template XSS prevention (sanitize trước khi render)
- [ ] Rate limiting: max 100 emails/phút/tenant

## Acceptance Criteria

- [ ] Subscribe event `task.assigned` → gửi notification đến assignee qua tất cả kênh bật
- [ ] In-app: notification xuất hiện realtime qua WebSocket
- [ ] Email: email gửi thành công với template đúng
- [ ] Push: FCM push gửi đến device đã đăng ký
- [ ] Unread count API trả về đúng số
- [ ] Bulk read → tất cả notifications được đánh dấu đã đọc
- [ ] User tắt kênh email → không gửi email cho event đó
- [ ] Custom template per tenant hoạt động (ghi đè system template)
- [ ] Unit test coverage ≥ 80%
- [ ] Multi-tenancy: mọi DB query đều có tenantId filter

## Ghi chú kỹ thuật

- Socket.IO với `@nestjs/websockets` và `socket.io`.
- Hỗ trợ reconnect khi WebSocket mất kết nối.
- Email queue: không gửi trực tiếp trong consumer → push vào email queue (Bull/BullMQ) để retry.
- Handlebars templates compile và cache khi service khởi động.
- FCM batch send (sendMulticast) khi user có nhiều devices.
- Nodemailer với connection pool để tránh tạo SMTP connection mỗi email.
