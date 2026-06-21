# Tài liệu kỹ thuật chi tiết: TSK-2.7 - Hệ thống thông báo đa kênh thời gian thực
## Phân hệ: Truyền thông & Thông báo (Communication & Notifications - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng cơ sở hạ tầng thông báo đa kênh để đảm bảo quy trình phê duyệt vận hành trôi chảy. Phát triển Gateway WebSocket (Socket.io) phục vụ việc đẩy tin thời gian thực in-app cho người dùng Web & Mobile Client, đồng thời tích hợp dịch vụ Nodemailer (qua SMTP/AWS SES) gửi thư cảnh báo tự động về hòm thư cá nhân khi xuất hiện yêu cầu cần phê duyệt.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Kiến trúc Thông báo đa kênh
* **Kênh In-app (WebSocket Gateway):**
  - NestJS sử dụng `@nestjs/websockets` và `@nestjs/platform-socket.io`.
  - Khách hàng kết nối, gửi Token JWT ở bước Handshake để xác thực.
  - Client đăng ký nhận tin nhắn thông qua room chuyên biệt: `tenant_${tenantId}_user_${userId}`.
* **Kênh Email (Nodemailer / AWS SES):**
  - Chạy bất đồng bộ qua hàng đợi BullMQ để không chặn luồng xử lý chính.
  - Biên dịch nội dung email từ mẫu `.hbs` hoặc `.ejs` tương ứng với ngôn ngữ của user.
  - Hỗ trợ dịch tự động tiêu đề và nội dung dựa trên cấu hình đa ngôn ngữ.

```text
[Sự kiện Workflow] ──► [Notification Service]
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
   [WebSocket Gateway]                  [BullMQ Email Queue]
            │                                   │
            ▼                                   ▼
  [Đẩy tin Realtime App]               [Gửi Email qua Nodemailer]
```

#### 2.2 Đặc tả API & WebSocket Events
Tham chiếu đầy đủ trong [api_overview.md](../../../03_functional/api_overview.md).

* **WebSocket Event (Server -> Client):**
  - Event: `notification:received`
  - Payload:
    ```json
    {
      "id": "uuid-notification-7777",
      "title": "Yêu cầu phê duyệt mới",
      "body": "Đơn xin nghỉ phép của Nguyễn Văn A đang chờ bạn duyệt.",
      "type": "WORKFLOW_PENDING",
      "link": "/approvals/inbox?id=uuid-instance-111",
      "createdAt": "2026-06-21T12:05:00Z"
    }
    ```

* **`GET /api/v1/notifications`** (Authorized)
  - **Tham số query:** `?page=1&limit=10`
  - **Phản hồi thành công (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "items": [
          {
            "id": "uuid-notification-7777",
            "title": "Yêu cầu phê duyệt mới",
            "body": "Đơn xin nghỉ phép của Nguyễn Văn A đang chờ bạn duyệt.",
            "isRead": false,
            "createdAt": "2026-06-21T12:05:00Z"
          }
        ],
        "meta": { "totalItems": 15, "totalPages": 2 }
      }
    }
    ```

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: Thiết lập WebSocket Gateway & Bảo mật**
  - Viết WebSocket Gateway trong NestJS, chặn và xác thực Token JWT tại handshake.
  - Quản lý vòng đời kết nối (connection/disconnection), gán user vào đúng phòng (room).
* **Nhiệm vụ 2: Tích hợp Email Worker (BullMQ + Nodemailer)**
  - Cấu hình MailerModule để kết nối SMTP.
  - Viết Worker lắng nghe job hàng đợi để gửi email bất đồng bộ, thực hiện cơ chế tự động gửi lại (retry) tối đa 3 lần nếu gặp lỗi kết nối SMTP.

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ: Client WebSocket Integration**
  - Tải thư viện `socket.io-client` và xây dựng service quản lý kết nối Socket dùng chung.
  - Hiển thị Toast thông báo nổi lên góc màn hình thời gian thực khi có event và cập nhật số lượng tin chưa đọc trên thanh Header (Bell Icon badge).

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* **Nhiệm vụ: WebSocket & Push Notification di động**
  - Kết nối Socket.io Client trên ứng dụng di động. Khi ứng dụng đang chạy nền (background), tích hợp Firebase Cloud Messaging (FCM) để nhận Push Notification.

#### 3.4 UI/UX Designer
* Thiết kế mẫu Email sang trọng (branding OpenERP, màu nhấn Rose Gold) và các component hiển thị thông báo góc màn hình (Toast Notifications) đẹp mắt.

#### 3.5 QA Engineer
* Viết kịch bản kiểm thử:
  - Mở 2 trình duyệt với 2 user khác nhau, User A gửi đơn duyệt -> User B nhận được thông báo in-app realtime tức thì (dưới 1 giây).
  - Kiểm tra nội dung email hiển thị đúng mẫu thiết kế, đầy đủ thông tin tiếng Việt.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Bước 1 (SMTP Server giả lập):** Chạy MailDev hoặc MailHog qua Docker để hứng thử email:
  ```bash
  docker run -d -p 1025:1025 -p 8025:8025 maildev/maildev
  ```
* **Bước 2 (Gỡ lỗi Websocket):** Sử dụng các công cụ như Postman WebSocket client để kết nối thử vào cổng `localhost:3000/ws` và gửi token xác thực.

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* Gateway WebSocket xác thực thành công JWT và phân quyền room chính xác.
* Email được gửi bất đồng bộ thông qua BullMQ, hoạt động tốt với máy chủ mail local (MailDev).
* Unit test cho Notification Service đạt tỷ lệ bao phủ > 80%.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
*(Chưa bắt đầu)*
