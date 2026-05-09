# TASK-SPRINT-02-AI-001: AI Agent — Phát hiện hành vi bất thường và gợi ý phân quyền

## Thông tin

| Thuộc tính       | Giá trị                                                      |
|------------------|--------------------------------------------------------------|
| Task ID          | TASK-SPRINT-02-AI-001                                        |
| Sprint           | Sprint 02                                                    |
| Cluster          | ai                                                           |
| Loại             | Backend                                                      |
| Người phụ trách  | Backend                                                      |
| Story Points     | 5                                                            |
| Trạng thái       | ⬜ TODO                                                      |
| Phụ thuộc        | TASK-SPRINT-02-SYSTEM_ADMIN-002, TASK-SPRINT-01-USER-002     |

## Mô tả

Xây dựng skeleton cho `ai-agent-service` (port 3018) với module phát hiện hành vi bất thường dựa trên rule-based engine (không cần ML ở sprint này). Subscribe các audit events, phân tích pattern bất thường (đăng nhập từ IP lạ, giờ bất thường, nhiều lần thất bại), tạo cảnh báo và publish đến notification-service. Bổ sung tính năng gợi ý phân quyền dựa trên phân tích role của người dùng cùng vị trí.

## Phạm vi kỹ thuật

### Backend (NestJS — `ai-agent-service`, port 3018)

**Cấu trúc module:**
```
src/
├── main.ts
├── ai-agent.module.ts
├── anomaly/
│   ├── anomaly.module.ts
│   ├── anomaly.service.ts
│   ├── anomaly-detector.ts          ← Rule engine
│   ├── rules/
│   │   ├── suspicious-ip.rule.ts
│   │   ├── off-hours-login.rule.ts
│   │   ├── brute-force.rule.ts
│   │   ├── unusual-data-export.rule.ts
│   │   └── mass-delete.rule.ts
│   └── schemas/
│       └── anomaly-alert.schema.ts
├── permission-suggestion/
│   ├── permission-suggestion.module.ts
│   ├── permission-suggestion.service.ts
│   └── schemas/
│       └── permission-suggestion.schema.ts
├── events/
│   └── audit-event.consumer.ts      ← Subscribe audit events
└── shared/
    └── ip-geolocation.service.ts    ← IP lookup (ip-api.com hoặc MaxMind)
```

**Rule-Based Anomaly Engine:**

```typescript
interface AnomalyRule {
  name: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evaluate(event: AuditEvent, context: RuleContext): Promise<AnomalyResult | null>;
}

interface AnomalyResult {
  ruleId: string;
  severity: string;
  message: string;
  details: object;
}

interface RuleContext {
  tenantId: string;
  userId: string;
  recentEvents: AuditEvent[];  // Events của user trong 24h
  userHistory: UserLoginHistory;
  knownIPs: string[];
}
```

**Các Rule phát hiện bất thường:**

**1. SuspiciousIpRule:**
```
Trigger: user.login event
Logic:
  - Lấy danh sách IP đã login trong 30 ngày gần nhất
  - Nếu IP mới chưa từng xuất hiện → MEDIUM alert
  - Nếu IP từ quốc gia khác bình thường → HIGH alert
  - Dùng ip-api.com free tier để geo-lookup
Message: "Đăng nhập từ IP mới: 185.x.x.x (Hà Nội, Việt Nam)"
```

**2. OffHoursLoginRule:**
```
Trigger: user.login event
Logic:
  - Phân tích giờ đăng nhập bình thường (histogram từ 90 ngày)
  - Nếu đăng nhập vào 0:00-5:00 AND chưa từng đăng nhập giờ này → LOW alert
  - Dùng timezone của tenant để tính giờ địa phương
Message: "Đăng nhập ngoài giờ làm việc thông thường"
```

**3. BruteForceRule:**
```
Trigger: user.login_failed event
Logic:
  - Đếm login failures của user trong 15 phút
  - >= 5 failures → HIGH alert
  - >= 10 failures → CRITICAL alert + đề xuất lock
Message: "7 lần đăng nhập thất bại trong 15 phút"
```

**4. UnusualDataExportRule:**
```
Trigger: audit events với action='export' hoặc 'bulk_download'
Logic:
  - Nếu export > 5000 records trong 1 giờ → MEDIUM
  - Nếu export ngoài giờ làm việc → HIGH
Message: "Export dữ liệu bất thường: 8,500 records lúc 02:15"
```

**5. MassDeleteRule:**
```
Trigger: audit events với action='delete'
Logic:
  - Nếu xóa > 50 records trong 5 phút → HIGH alert
Message: "Xóa hàng loạt: 75 records trong 3 phút"
```

**Anomaly Detection Flow:**
```
1. AuditEventConsumer nhận event từ RabbitMQ queue 'ai-agent.audit'
2. Với mỗi event → chạy qua tất cả rules (parallel Promise.all)
3. Rule có kết quả → tạo AnomalyAlert record
4. Publish event: ai.alert → notification-service
5. Notification-service gửi cảnh báo đến Tenant Admin (+ Super Admin nếu CRITICAL)
```

**Permission Suggestion Module:**

```typescript
// Gợi ý phân quyền dựa trên peers analysis
// "Những người có cùng chức danh X trong tenant thường có role Y"

interface PermissionSuggestion {
  targetUserId: ObjectId;
  targetTenantId: ObjectId;
  suggestedRoles: {
    roleId: ObjectId;
    roleName: string;
    confidence: number;     // 0.0 - 1.0
    reason: string;         // "85% người cùng chức vụ có role này"
    peerCount: number;      // Số peers được phân tích
  }[];
  generatedAt: Date;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

// Cron job: chạy hàng ngày phân tích users mới tạo hoặc chưa có role
// Hoặc trigger khi user.created event
```

**Permission Suggestion Algorithm (Rule-based):**
```
1. Lấy user mới: chức danh (positionId), phòng ban (departmentId)
2. Tìm peers: users có cùng positionId trong cùng tenant
3. Thống kê roles của peers
4. Nếu role X có >= 70% peers → suggest với confidence cao
5. Nếu role X có 50-70% peers → suggest với confidence trung bình
6. Dưới 50% → không suggest
```

### Database (MongoDB)

**Collection: `anomaly_alerts`** (tenantId-scoped)

| Trường         | Kiểu     | Ràng buộc     | Mô tả                                    |
|----------------|----------|---------------|------------------------------------------|
| `_id`          | ObjectId | —             | —                                        |
| `tenantId`     | ObjectId | required      | Tenant                                   |
| `userId`       | ObjectId | required      | User bị phát hiện bất thường             |
| `ruleId`       | string   | required      | Tên rule: 'suspicious-ip', 'brute-force' |
| `severity`     | string   | required      | LOW / MEDIUM / HIGH / CRITICAL           |
| `message`      | string   | required      | Mô tả bất thường                         |
| `details`      | object   | —             | Raw data (IP, count, timestamps...)      |
| `triggeredBy`  | object   | —             | AuditEvent gốc (id, action, resource)    |
| `status`       | string   | default: NEW  | NEW / ACKNOWLEDGED / RESOLVED / FALSE_POSITIVE |
| `resolvedAt`   | Date     | optional      | —                                        |
| `resolvedBy`   | ObjectId | optional      | Admin nào đã resolve                     |
| `createdAt`    | Date     | auto          | —                                        |

**Indexes:**
```
{ tenantId: 1, status: 1, createdAt: -1 }
{ tenantId: 1, userId: 1, createdAt: -1 }
{ tenantId: 1, severity: 1, status: 1 }
{ createdAt: 1 }   — TTL 90 ngày
```

**Collection: `permission_suggestions`** (tenantId-scoped)

**Collection: `anomaly_rules`** — cấu hình rule per tenant (enable/disable, threshold)

## API Endpoints

| Method | Path                                              | Mô tả                                    | Auth         |
|--------|---------------------------------------------------|------------------------------------------|--------------|
| GET    | `/api/v1/anomaly-alerts`                          | Danh sách cảnh báo bất thường            | Tenant Admin |
| GET    | `/api/v1/anomaly-alerts/:id`                      | Chi tiết cảnh báo                        | Tenant Admin |
| PATCH  | `/api/v1/anomaly-alerts/:id/acknowledge`          | Đánh dấu đã xem                          | Tenant Admin |
| PATCH  | `/api/v1/anomaly-alerts/:id/resolve`              | Đánh dấu đã xử lý                        | Tenant Admin |
| PATCH  | `/api/v1/anomaly-alerts/:id/false-positive`       | Đánh dấu cảnh báo giả                    | Tenant Admin |
| GET    | `/api/v1/anomaly-alerts/stats`                    | Thống kê (count by severity, trend)      | Tenant Admin |
| GET    | `/api/v1/anomaly-rules`                           | Danh sách rules và trạng thái            | Tenant Admin |
| PATCH  | `/api/v1/anomaly-rules/:ruleId`                   | Enable/disable rule, sửa threshold       | Tenant Admin |
| GET    | `/api/v1/permission-suggestions`                  | Gợi ý phân quyền chưa xử lý             | Tenant Admin |
| POST   | `/api/v1/permission-suggestions/:id/accept`       | Chấp nhận gợi ý (gán role)              | Tenant Admin |
| POST   | `/api/v1/permission-suggestions/:id/reject`       | Từ chối gợi ý                            | Tenant Admin |

## Acceptance Criteria

- [ ] Subscribe audit events thành công
- [ ] Rule SuspiciousIp: login từ IP mới → tạo alert MEDIUM
- [ ] Rule BruteForce: 5+ login failures trong 15 phút → alert HIGH
- [ ] Alert được publish sang notification-service → Tenant Admin nhận email + in-app
- [ ] API GET /anomaly-alerts trả về đúng danh sách (tenantId-scoped)
- [ ] Acknowledge / Resolve / FalsePositive hoạt động
- [ ] Permission Suggestion: user mới tạo → gợi ý sau 5 phút
- [ ] Accept suggestion → role được gán vào user
- [ ] Anomaly rule có thể disable per tenant
- [ ] Unit test coverage ≥ 80%
- [ ] Multi-tenancy: tất cả queries có tenantId filter

## Ghi chú kỹ thuật

- Sprint này KHÔNG dùng Machine Learning — chỉ rule-based để đơn giản và dễ kiểm thử.
- AI/ML (anomaly detection model, LLM integration) sẽ được thêm ở Sprint sau khi có đủ dữ liệu lịch sử.
- IP Geo-lookup: `ip-api.com` free tier (45 req/phút) — cache kết quả trong Redis 24h.
- Consumer RabbitMQ: subscribe pattern `#` của `audit.events` exchange nhưng dùng topic queue riêng `ai-agent.audit` để không ảnh hưởng audit-service.
- Rule engine chạy trong worker thread (nếu cần tránh block event loop) với `@nestjs/bull` job queue.
- False positive feedback được dùng để tự động điều chỉnh threshold (Sprint sau).
- Tên service trong microservice map: `ai-agent-service` port 3018.
