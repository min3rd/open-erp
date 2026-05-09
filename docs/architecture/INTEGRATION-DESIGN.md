# Integration Design — Open ERP
# Thiết kế Tích hợp Hệ thống bên ngoài

**Phiên bản:** 1.0  
**Ngày tạo:** 09/05/2026  
**Tác giả:** Technical Leader  
**Trạng thái:** Hoàn chỉnh  

---

## Mục lục

1. [Tổng quan tích hợp](#1-tổng-quan-tích-hợp)
2. [ONLYOFFICE Document Server](#2-onlyoffice-document-server)
3. [Jitsi Meet](#3-jitsi-meet)
4. [MISA AMIS](#4-misa-amis)
5. [eTax / Cổng GDT](#5-etax--cổng-thuế-gdt)
6. [Nhà cung cấp Hóa đơn điện tử](#6-nhà-cung-cấp-hóa-đơn-điện-tử)
7. [Circuit Breaker & Resilience](#7-circuit-breaker--resilience)
8. [Audit Log Tích hợp](#8-audit-log-tích-hợp)
9. [Email Activation cho Đăng ký Doanh nghiệp](#9-email-activation-cho-đăng-ký-doanh-nghiệp)

---

## 1. Tổng quan tích hợp

| Hệ thống | Loại | Phương thức | Service xử lý | Ghi chú |
|---|---|---|---|---|
| ONLYOFFICE Document Server | Văn phòng | REST + Webhook | office-service | Tự host |
| Jitsi Meet | Video call | REST + JWT | meeting-service | Tự host |
| MISA AMIS | Kế toán | OAuth2 REST | accounting-service | SaaS API |
| Cổng thuế GDT (eTax) | Thuế điện tử | Certificate + SOAP/REST | invoice-service | Gov API |
| MISA meInvoice | Hóa đơn ĐT | REST API | invoice-service | Provider 1 |
| VNPT Invoice | Hóa đơn ĐT | REST API | invoice-service | Provider 2 |
| Viettel Invoice | Hóa đơn ĐT | REST API | invoice-service | Provider 3 |
| BKAV eHoadon | Hóa đơn ĐT | REST API | invoice-service | Provider 4 |
| FPT eSign | Hóa đơn ĐT | REST API | invoice-service | Provider 5 |
| Google OAuth2 | SSO | OAuth2 | auth-service | Đăng nhập MXH |
| Microsoft Azure AD | SSO | OAuth2 OIDC | auth-service | Đăng nhập MXH |
| SendGrid / SMTP | Email | REST / SMTP | notification-service | Gửi thông báo |
| Activation Email Provider | Email | REST / SMTP | notification-service + tenant-service | Gửi link kích hoạt đăng ký DN |
| Firebase FCM | Push notification | REST | notification-service | Mobile push |

---

## 2. ONLYOFFICE Document Server

### 2.1 Cấu hình

```
ONLYOFFICE_SERVER_URL=https://docs.openErp.vn
ONLYOFFICE_JWT_SECRET=<secret_key>
ONLYOFFICE_JWT_HEADER=Authorization
ONLYOFFICE_JWT_PREFIX=Bearer
```

- ONLYOFFICE Document Server được deploy riêng, không share giữa các tenants
- Mỗi tenant có thể cấu hình server riêng (Enterprise) hoặc dùng server chung (Free/Starter/Professional)

### 2.2 Callback Endpoint

```
POST /api/v1/documents/onlyoffice/callback
Auth: JWT signed bởi ONLYOFFICE
```

ONLYOFFICE gọi endpoint này khi trạng thái document thay đổi:

| Status | Mô tả | Hành động |
|---|---|---|
| 0 | Đang chỉnh sửa | Không làm gì |
| 1 | Không có người chỉnh sửa | Không làm gì |
| 2 | Sẵn sàng lưu | Tải về + lưu MinIO |
| 3 | Lỗi khi lưu | Ghi log lỗi |
| 4 | Đã đóng, không có thay đổi | Không làm gì |
| 6 | Đang chỉnh sửa + lưu bản nháp | Không làm gì |
| 7 | Lỗi khi lưu bản nháp | Ghi log lỗi |

### 2.3 Luồng mở tài liệu

```
Client                  office-service          ONLYOFFICE Server
  |                           |                        |
  | GET /documents/:id/edit   |                        |
  |-------------------------->|                        |
  |                           | Tạo JWT config         |
  |                           | (fileUrl, callbackUrl) |
  |                           |                        |
  |  { config: {...} }        |                        |
  |<--------------------------|                        |
  |                           |                        |
  | Load ONLYOFFICE Editor    |                        |
  | (iFrame với config)       |                        |
  |-------------------------------------------->|      |
  |                           |  Load file từ MinIO    |
  |                           |<-----------------------|
  |                           |  trả file stream       |
  |                           |----------------------->|
```

### 2.4 Permission Matrix

| Vai trò | Xem | Sửa | Comment | Tải xuống | In |
|---|---|---|---|---|---|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ✅ | ✅ | ✅ |
| Commenter | ✅ | ❌ | ✅ | ❌ | ❌ |
| Viewer | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Jitsi Meet

### 3.1 Cấu hình

```
JITSI_SERVER_URL=https://meet.openErp.vn
JITSI_APP_ID=openErp-platform
JITSI_APP_SECRET=<secret>
JITSI_JWT_EXPIRY=3600   // 1 giờ
```

### 3.2 Room Naming Convention

```
Room name: {tenantId}-{meetingId}
Ví dụ: 6645a2b3c4d5-MTG-2026-0001
```

Đảm bảo isolation giữa các tenants — không thể đoán phòng của tenant khác.

### 3.3 JWT Payload cho Jitsi

```json
{
  "context": {
    "user": {
      "id": "userId",
      "name": "Nguyễn Văn A",
      "email": "user@company.com",
      "avatar": "https://..."
    },
    "group": "tenantId"
  },
  "aud": "jitsi",
  "iss": "openErp-platform",
  "sub": "meet.openErp.vn",
  "room": "{tenantId}-{meetingId}",
  "moderator": false,
  "exp": 1699999999,
  "iat": 1699996399
}
```

### 3.4 Quy tắc Moderator

- Người tạo cuộc họp: `moderator = true`
- Người được chỉ định làm host: `moderator = true`
- Tất cả người tham gia khác: `moderator = false`
- Moderator có thể: kick, mute all, kết thúc cuộc họp, bật recording

### 3.5 Recording Webhook

```
POST /api/v1/meetings/jitsi/recording-webhook
Payload: { "meetingId", "tenantId", "recordingUrl", "duration" }
Hành động: Lưu URL recording vào meetings collection
```

---

## 4. MISA AMIS

### 4.1 Cấu hình kết nối

```
MISA_AMIS_BASE_URL=https://amis.misa.vn/api
MISA_AMIS_CLIENT_ID=<client_id>
MISA_AMIS_CLIENT_SECRET=<client_secret>
MISA_AMIS_GRANT_TYPE=client_credentials
MISA_AMIS_SCOPE=api
```

### 4.2 Danh sách endpoint đồng bộ

| Endpoint MISA AMIS | Mục đích | Tần suất |
|---|---|---|
| `GET /api/v1/accounts` | Lấy danh mục tài khoản kế toán | Mỗi ngày 01:00 |
| `GET /api/v1/journals` | Đồng bộ bút toán | Thời gian thực (event-driven) |
| `POST /api/v1/journals` | Đẩy bút toán sang MISA | Khi journal_entry được duyệt |
| `GET /api/v1/payables` | Công nợ phải trả | Mỗi ngày 02:00 |
| `GET /api/v1/receivables` | Công nợ phải thu | Mỗi ngày 02:00 |
| `GET /api/v1/inventory-value` | Giá trị tồn kho | Mỗi ngày 03:00 |

### 4.3 Data Mapping

| Open ERP | MISA AMIS | Ghi chú |
|---|---|---|
| `journal_entries.debitAccount` | `AccountDebit` | Mã tài khoản theo TT133/200 |
| `journal_entries.creditAccount` | `AccountCredit` | |
| `journal_entries.amount` | `Amount` | VND |
| `journal_entries.description` | `Description` | Max 255 chars |
| `journal_entries.date` | `PostingDate` | yyyy-MM-dd |
| `orders.id` | `RefNo` | Số chứng từ tham chiếu |

### 4.4 Error Handling & Retry

```
Chiến lược retry với exponential backoff:
  Lần 1: retry sau 30 giây
  Lần 2: retry sau 2 phút
  Lần 3: retry sau 10 phút
  Lần 4: retry sau 1 giờ
  Lần 5+: alert admin + lưu vào DLQ

Ghi log mọi lần gọi API vào integration_logs collection
```

---

## 5. eTax / Cổng Thuế GDT

### 5.1 Cấu hình

```
GDT_GATEWAY_URL=https://hddt.gdt.gov.vn/etax-services
GDT_CERT_PATH=/certs/gdt-client.p12
GDT_CERT_PASSWORD=<password>
GDT_TAX_CODE=<ma_so_thue>
GDT_USERNAME=<username>
GDT_PASSWORD=<password>
```

### 5.2 Luồng nộp hóa đơn điện tử

```
Bước 1: Tạo hóa đơn XML theo chuẩn Nghị định 123/2020/NĐ-CP
Bước 2: Ký số XML bằng USB Token / HSM với chứng thư số của doanh nghiệp
Bước 3: Mã hóa + gửi lên Cổng GDT
Bước 4: Nhận mã CQT (mã cơ quan thuế)
Bước 5: Lưu mã CQT + XML + PDF vào MinIO và invoices collection
```

### 5.3 Error Codes GDT

| Mã lỗi | Ý nghĩa | Xử lý |
|---|---|---|
| `MTT-001` | Hóa đơn đã tồn tại | Không retry, log lỗi |
| `MTT-002` | Mã số thuế không hợp lệ | Kiểm tra cấu hình |
| `MTT-003` | Chứng thư số hết hạn | Alert admin ngay |
| `MTT-004` | Lỗi kết nối GDT | Retry với backoff |
| `MTT-005` | XML không đúng schema | Fix XML, không retry |

---

## 6. Nhà cung cấp Hóa đơn điện tử

### 6.1 Abstract Interface (TypeScript)

```typescript
interface EInvoiceProvider {
  issueInvoice(data: InvoiceData): Promise<InvoiceResult>;
  cancelInvoice(invoiceId: string, reason: string): Promise<void>;
  replaceInvoice(oldId: string, data: InvoiceData): Promise<InvoiceResult>;
  getStatus(invoiceId: string): Promise<InvoiceStatus>;
  downloadPdf(invoiceId: string): Promise<Buffer>;
  downloadXml(invoiceId: string): Promise<string>;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceSeries: string;
  invoiceDate: Date;
  seller: PartyInfo;
  buyer: PartyInfo;
  items: LineItem[];
  taxAmount: number;
  totalAmount: number;
  currency: string;
  tenantId: string;
}

interface InvoiceResult {
  transactionId: string;       // ID giao dịch với nhà cung cấp
  signedXml: string;           // XML đã ký số
  pdfUrl: string;              // URL PDF lưu trên MinIO
  taxAuthorityCode?: string;   // Mã CQT (sau khi thông báo lên GDT)
  issuedAt: Date;
}
```

### 6.2 Các nhà cung cấp được hỗ trợ

| Provider | Class | Base URL |
|---|---|---|
| MISA meInvoice | `MisaEInvoiceProvider` | `https://api.meinvoice.vn` |
| VNPT Invoice | `VnptEInvoiceProvider` | `https://einvoice.vnpt.vn/api` |
| Viettel Invoice | `ViettelEInvoiceProvider` | `https://sinvoice.viettel.vn` |
| BKAV eHoadon | `BkavEInvoiceProvider` | `https://ehoadon.bkav.com.vn` |
| FPT eSign | `FptEInvoiceProvider` | `https://einvoice.fpt.com.vn` |

### 6.3 Provider Selection Pattern

```typescript
// Cấu hình per-tenant trong platform_tenants.config.invoiceProvider
const provider: EInvoiceProvider = EInvoiceProviderFactory.create(
  tenant.config.invoiceProvider  // 'MISA' | 'VNPT' | 'VIETTEL' | 'BKAV' | 'FPT'
);

await provider.issueInvoice(invoiceData);
```

### 6.4 Cấu hình per-tenant

```json
{
  "invoiceProvider": "MISA",
  "invoiceProviderConfig": {
    "username": "company@email.com",
    "password": "encrypted_password",
    "taxCode": "0123456789",
    "invoiceSeries": "1C25TAA",
    "templateCode": "1/001",
    "apiKey": "encrypted_api_key"
  }
}
```

---

## 7. Circuit Breaker & Resilience

### 7.1 Circuit Breaker cho tích hợp bên ngoài

```
Trạng thái Circuit Breaker:
  CLOSED   → Hoạt động bình thường, cho phép request
  OPEN     → Đang lỗi, từ chối ngay lập tức (fallback)
  HALF-OPEN → Thử một request để kiểm tra

Cấu hình:
  failureThreshold: 5            // 5 lỗi liên tiếp → OPEN
  successThreshold: 2            // 2 thành công liên tiếp → CLOSED
  openTimeout: 60000             // 60s ở trạng thái OPEN trước khi HALF-OPEN
  requestTimeout: 10000          // timeout cho mỗi request (ms)
```

### 7.2 Fallback Strategy

| Hệ thống | Fallback khi lỗi |
|---|---|
| ONLYOFFICE | Thông báo "Tính năng chỉnh sửa trực tuyến tạm thời không khả dụng" |
| Jitsi Meet | Gửi link phòng họp Zoom/Google Meet (nếu cấu hình) hoặc thông báo |
| MISA AMIS | Lưu bút toán vào queue, đồng bộ khi hệ thống phục hồi |
| GDT / Invoice | Lưu hóa đơn ở trạng thái PENDING, retry tự động |

---

## 8. Audit Log Tích hợp

### 8.1 Schema collection `integration_logs`

```json
{
  "tenantId": "ObjectId",
  "service": "invoice-service",
  "provider": "MISA",
  "action": "issueInvoice",
  "requestPayload": { ... },
  "responsePayload": { ... },
  "statusCode": 200,
  "success": true,
  "errorCode": null,
  "errorMessage": null,
  "durationMs": 1250,
  "retryCount": 0,
  "createdAt": "2026-05-09T10:00:00Z"
}
```

### 8.2 Index cho integration_logs

```javascript
// Tìm log theo tenant + service + thời gian
db.integration_logs.createIndex({ tenantId: 1, service: 1, createdAt: -1 })

// TTL: Tự động xóa log sau 90 ngày
db.integration_logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 })

// Tìm log lỗi
db.integration_logs.createIndex({ tenantId: 1, success: 1, createdAt: -1 })
```

---

## 9. Email Activation cho Đăng ký Doanh nghiệp

### 9.1 Mục tiêu

- Bổ sung bước xác thực email bằng activation link trước khi cho phép verify tax code và onboarding.
- Token kích hoạt là token một lần (single-use), có TTL ngắn, chống replay.
- Nội dung email chỉ chứa key template + metadata, frontend render thông điệp bằng Transloco.

### 9.2 Luồng tích hợp activation email

```
Client                    tenant-service               notification-service         Email Provider
  |                             |                               |                         |
  | POST /api/v1/register       |                               |                         |
  |---------------------------->|                               |                         |
  |                             | Tạo activationToken (TTL 30m) |                         |
  |                             | Emit event: tenant.activation.requested                |
  |                             |------------------------------>|                         |
  |                             |                               | Render template + send  |
  |                             |                               |------------------------>|
  |                             |                               | Delivery status         |
  |                             |<------------------------------|                         |
  | 200 + message.key           |                               |                         |
  |<----------------------------|                               |                         |
  |                             |                               |                         |
  | User click link /register/activate?token=...                 |
  |---------------------------->|                               |                         |
  |                             | Verify token + mark used      |                         |
  | 200 EMAIL_VERIFIED          |                               |                         |
  |<----------------------------|                               |                         |
```

### 9.3 Contract sự kiện

`tenant.activation.requested`

```json
{
  "tenantId": null,
  "registrationId": "reg_123",
  "email": "owner@company.vn",
  "activationUrl": "https://app.openErp.vn/register/activate?token=...",
  "message": {
    "key": "tenant.register.activation_email_sent",
    "params": {
      "expiresInMinutes": 30
    }
  },
  "metadata": {
    "source": "self-register",
    "localeHint": "vi-VN"
  }
}
```

### 9.4 Yêu cầu bảo mật và vận hành

- Token ký bằng HMAC hoặc JWT, chứa `registrationId`, `exp`, `jti`.
- Token chỉ dùng 1 lần: lưu trạng thái `usedAt` trong `tenant_registrations`.
- TTL mặc định 30 phút; quá hạn trả `410 TOKEN_EXPIRED`.
- Rate limit resend activation email: tối đa 3 lần trong 30 phút.
- Ghi `integration_logs` cho các hành vi gửi email, verify token, resend.
