# Database Design — Open ERP

# Thiết kế Cơ sở dữ liệu MongoDB

**Phiên bản:** 1.0  
**Ngày tạo:** 09/05/2026  
**Tác giả:** Technical Leader  
**Trạng thái:** Hoàn chỉnh

---

## Mục lục

1. [Naming Conventions](#1-naming-conventions)
2. [Core Collections (Tenant & Auth)](#2-core-collections-tenant--auth)
3. [User & RBAC Collections](#3-user--rbac-collections)
4. [HR Collections](#4-hr-collections)
5. [Sale & Logistics Collections](#5-sale--logistics-collections)
6. [Office Collections](#6-office-collections)
7. [Accounting Collections](#7-accounting-collections)
8. [AI Agent Collections](#8-ai-agent-collections)
9. [Dashboard Collections](#9-dashboard-collections)
10. [Cross-collection Relationships](#10-cross-collection-relationships)
11. [Sharding Strategy](#11-sharding-strategy)

---

## 1. Naming Conventions

| Quy tắc                                                                    | Ví dụ                                |
| -------------------------------------------------------------------------- | ------------------------------------ |
| Collection names: `snake_case`, số nhiều                                   | `sales_orders`, `journal_entries`    |
| Field names: `camelCase`                                                   | `tenantId`, `createdAt`, `fullName`  |
| ObjectId references: suffix `Id`                                           | `tenantId`, `userId`, `departmentId` |
| Timestamps: `createdAt`, `updatedAt` (Mongoose timestamps: true)           |                                      |
| Soft delete: `isDeleted: boolean`, `deletedAt: Date`                       |                                      |
| Status enum: `UPPER_SNAKE_CASE`                                            | `ACTIVE`, `PENDING_SETUP`            |
| **Bắt buộc**: `tenantId` là trường đầu tiên trong mọi collection nghiệp vụ |                                      |

---

## 2. Core Collections (Tenant & Auth)

### 2.1 `tenants`

```typescript
{
  _id: ObjectId,
  companyName: string,           // required
  subdomain: string,             // required, unique, 3-30 chars
  slug: string,                  // = subdomain
  taxCode: string,               // MST Việt Nam, 10 hoặc 13 số
  address: {
    street: string,
    ward: string,
    district: string,
    province: string,
    country: string              // default: 'VN'
  },
  logo: string,                  // MinIO URL
  status: enum ['PENDING_SETUP','TRIAL','ACTIVE','SUSPENDED','TERMINATED'],
  plan: enum ['TRIAL','STARTER','BUSINESS','ENTERPRISE'],
  trialEndsAt: Date,
  subscriptionEndsAt: Date,
  quotas: {
    maxUsers: number,
    maxStorageBytes: number,     // bytes
    maxApiCallsPerDay: number
  },
  usageStats: {
    currentUsers: number,
    usedStorageBytes: number,
    apiCallsToday: number,
    lastCalculatedAt: Date
  },
  config: TenantConfig,          // embedded document (xem SAAS-MULTITENANCY.md)
  adminEmail: string,            // Email của Tenant Admin đầu tiên
  createdBy: ObjectId,           // Super Admin userId
  isDeleted: boolean,            // default: false
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { subdomain: 1 }            — unique
  { status: 1 }
  { plan: 1 }
  { 'config.enabledModules': 1 }
```

### 2.2 `subscription_plans` (System-level, không có tenantId)

```typescript
{
  _id: ObjectId,
  code: string,                  // 'STARTER', 'BUSINESS', 'ENTERPRISE'
  name: string,
  price: number,                 // VNĐ/tháng
  quotas: {
    maxUsers: number,
    maxStorageBytes: number,
    maxApiCallsPerDay: number
  },
  enabledFeatures: string[],
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 2.3 `refresh_tokens`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,            // required
  userId: ObjectId,              // required
  tokenHash: string,             // SHA-256(token), required
  sessionId: string,             // UUID, liên kết với JWT
  deviceInfo: {
    userAgent: string,
    ipAddress: string,
    deviceName: string
  },
  expiresAt: Date,               // now + 7 ngày
  revokedAt: Date,               // null nếu còn hạn
  createdAt: Date
}

Indexes:
  { tenantId: 1, userId: 1 }
  { tokenHash: 1 }               — unique
  { userId: 1, sessionId: 1 }
  { expiresAt: 1 }               — TTL index (auto cleanup)
```

### 2.4 `password_resets`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  userId: ObjectId,
  tokenHash: string,             // SHA-256(resetToken)
  expiresAt: Date,               // now + 1 giờ
  usedAt: Date,
  createdAt: Date
}

Indexes:
  { tokenHash: 1 }               — unique
  { expiresAt: 1 }               — TTL index
```

### 2.5 `mfa_configs`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  userId: ObjectId,
  method: enum ['TOTP', 'EMAIL_OTP'],
  totpSecret: string,            // encrypted AES-256, chỉ cho TOTP
  isEnabled: boolean,
  backupCodes: string[],         // hashed backup codes
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, userId: 1 }    — unique
```

---

## 3. User & RBAC Collections

### 3.1 `users`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,            // required, FIRST FIELD
  email: string,                 // required
  passwordHash: string,          // bcrypt, cost 12
  fullName: string,              // required
  phone: string,
  avatar: string,                // MinIO URL
  position: string,              // Chức danh
  departmentId: ObjectId,        // ref: departments
  managerId: ObjectId,           // ref: users (quản lý trực tiếp)
  roleIds: ObjectId[],           // ref: roles
  status: enum ['PENDING_ACTIVATION','ACTIVE','INACTIVE','LOCKED'],
  oauthProviders: [{
    provider: enum ['google','microsoft'],
    providerId: string,
    email: string
  }],
  lastLoginAt: Date,
  loginCount: number,
  failedLoginAttempts: number,
  lockedUntil: Date,
  activationToken: string,       // hash, null sau khi kích hoạt
  activationTokenExpiresAt: Date,
  passwordChangedAt: Date,
  passwordHistory: string[],     // hashed passwords, max 5
  isSuperAdmin: boolean,         // default: false
  isDeleted: boolean,
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, email: 1 }     — unique
  { tenantId: 1, status: 1 }
  { tenantId: 1, departmentId: 1 }
  { tenantId: 1, roleIds: 1 }
  { activationToken: 1 }         — sparse
```

### 3.2 `departments`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,            // required
  name: string,                  // required
  code: string,                  // unique trong tenant
  parentId: ObjectId,            // ref: departments (null = root)
  managerId: ObjectId,           // ref: users
  type: enum ['DEPARTMENT','BRANCH','DIVISION','TEAM'],
  level: number,                 // tính tự động (1 = root)
  path: string,                  // '/root-id/parent-id/this-id' (materialized path)
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, code: 1 }      — unique
  { tenantId: 1, parentId: 1 }
  { tenantId: 1, path: 1 }      — prefix query cho subtree
```

### 3.3 `roles`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,            // required
  name: string,                  // required, unique trong tenant
  description: string,
  isSystem: boolean,             // true = không xóa được
  permissionIds: ObjectId[],     // ref: permissions
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, name: 1 }      — unique
  { tenantId: 1, isSystem: 1 }
```

### 3.4 `permissions`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,            // null = system-wide permission template
  module: string,                // 'user', 'hr', 'sale', 'inventory', ...
  action: enum ['CREATE','READ','UPDATE','DELETE','APPROVE','EXPORT','IMPORT','MANAGE'],
  scope: enum ['ALL','OWN_DEPARTMENT','OWN'],
  name: string,                  // 'Tạo người dùng'
  description: string,
  createdAt: Date
}

Indexes:
  { tenantId: 1, module: 1, action: 1, scope: 1 } — unique
```

### 3.5 `api_keys`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  name: string,
  keyHash: string,               // SHA-256(rawKey)
  keyPrefix: string,             // Hiển thị 8 ký tự đầu (openErp_xxxx...)
  permissions: string[],         // ['sale:READ', 'inventory:READ']
  allowedIPs: string[],
  rateLimit: number,             // req/phút
  expiresAt: Date,
  lastUsedAt: Date,
  createdBy: ObjectId,           // ref: users
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1 }
  { keyHash: 1 }                 — unique
```

---

## 4. HR Collections

### 4.1 `employees`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,            // required
  userId: ObjectId,              // ref: users (null nếu chưa có account)
  employeeCode: string,          // unique trong tenant
  fullName: string,
  dateOfBirth: Date,
  gender: enum ['MALE','FEMALE','OTHER'],
  nationalId: string,            // CCCD/CMND, encrypted AES-256
  nationalIdIssueDate: Date,
  nationalIdIssuePlace: string,
  email: string,
  phone: string,
  address: { street, ward, district, province },
  emergencyContact: { name: string, phone: string, relationship: string },
  departmentId: ObjectId,
  positionId: ObjectId,          // ref: catalog_items (type: POSITION)
  managerId: ObjectId,           // ref: employees
  startDate: Date,
  endDate: Date,                 // null nếu còn làm
  status: enum ['ACTIVE','PROBATION','ON_LEAVE','RESIGNED','TERMINATED'],
  photo: string,                 // MinIO URL
  documents: [{
    type: string,                // 'CV', 'DEGREE', 'CONTRACT', ...
    fileUrl: string,
    uploadedAt: Date
  }],
  bankAccount: {
    bankName: string,
    accountNumber: string,       // encrypted AES-256
    accountHolder: string
  },
  taxCode: string,               // MST cá nhân
  socialInsuranceNumber: string,
  isDeleted: boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, employeeCode: 1 }  — unique
  { tenantId: 1, userId: 1 }        — sparse
  { tenantId: 1, departmentId: 1 }
  { tenantId: 1, status: 1 }
  { tenantId: 1, managerId: 1 }
```

### 4.2 `contracts`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  employeeId: ObjectId,
  contractNumber: string,        // unique trong tenant
  contractType: enum ['PROBATION','DEFINITE','INDEFINITE','SEASONAL'],
  startDate: Date,
  endDate: Date,                 // null nếu INDEFINITE
  salary: number,                // Lương cơ bản, encrypted
  allowances: [{
    type: string,
    amount: number
  }],
  fileUrl: string,               // MinIO URL
  status: enum ['DRAFT','ACTIVE','EXPIRED','TERMINATED'],
  signedByEmployee: boolean,
  signedByCompany: boolean,
  notes: string,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, employeeId: 1 }
  { tenantId: 1, status: 1 }
  { tenantId: 1, endDate: 1 }   — Nhắc gia hạn
```

### 4.3 `job_requisitions`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  jobTitle: string,
  departmentId: ObjectId,
  numberOfPositions: number,
  jobDescription: string,
  requirements: string,
  salaryRange: { min: number, max: number },
  deadline: Date,
  requestedBy: ObjectId,         // ref: users
  status: enum ['PENDING_APPROVAL','APPROVED','OPEN','CLOSED','CANCELLED'],
  approvedBy: ObjectId,
  approvedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, status: 1 }
  { tenantId: 1, departmentId: 1 }
```

### 4.4 `candidates`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  jobRequisitionId: ObjectId,
  fullName: string,
  email: string,
  phone: string,
  cvFileUrl: string,
  source: enum ['EMAIL','WALK_IN','REFERRAL','WEBSITE','LINKEDIN'],
  status: enum ['NEW','SCREENING','INTERVIEW','OFFER','HIRED','REJECTED'],
  aiScore: number,               // 0-100, AI sàng lọc
  aiNotes: string,               // Nhận xét AI
  interviews: [{
    scheduledAt: Date,
    type: enum ['PHONE','ONLINE','IN_PERSON'],
    interviewers: ObjectId[],
    result: enum ['PASS','FAIL','PENDING'],
    notes: string
  }],
  notes: string,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, jobRequisitionId: 1 }
  { tenantId: 1, status: 1 }
  { tenantId: 1, email: 1 }
```

### 4.5 `attendance_records`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  employeeId: ObjectId,
  date: Date,                    // Ngày làm việc (chỉ date, không time)
  shiftId: ObjectId,             // ref: catalog_items (type: SHIFT)
  checkInAt: Date,
  checkOutAt: Date,
  checkInLocation: { lat: number, lng: number },
  checkOutLocation: { lat: number, lng: number },
  workingMinutes: number,        // Tính tự động
  overtimeMinutes: number,
  status: enum ['PRESENT','ABSENT','LATE','HALF_DAY','ON_LEAVE'],
  note: string,
  approvedBy: ObjectId,
  approvedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, employeeId: 1, date: 1 } — unique
  { tenantId: 1, date: 1 }
  { tenantId: 1, status: 1 }
```

### 4.6 `leave_requests`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  employeeId: ObjectId,
  leaveType: string,             // ref: catalog_items (type: LEAVE_TYPE)
  startDate: Date,
  endDate: Date,
  totalDays: number,
  reason: string,
  status: enum ['PENDING','APPROVED','REJECTED','CANCELLED'],
  approvedBy: ObjectId,
  approvedAt: Date,
  rejectionReason: string,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, employeeId: 1 }
  { tenantId: 1, status: 1 }
  { tenantId: 1, startDate: 1, endDate: 1 }
```

---

## 5. Sale & Logistics Collections

### 5.1 `customers`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  customerType: enum ['INDIVIDUAL','BUSINESS'],
  name: string,
  taxCode: string,               // Bắt buộc nếu BUSINESS
  email: string,
  phone: string,
  address: { street, ward, district, province },
  groupId: ObjectId,             // ref: catalog_items (type: CUSTOMER_GROUP)
  creditLimit: number,
  totalDebt: number,             // Tính từ accounting
  status: enum ['ACTIVE','INACTIVE'],
  notes: string,
  createdBy: ObjectId,
  isDeleted: boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, taxCode: 1 }   — sparse
  { tenantId: 1, status: 1 }
  { tenantId: 1, groupId: 1 }
  { tenantId: 1, name: 'text' } — text search
```

### 5.2 `product_categories`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  name: string,
  code: string,
  parentId: ObjectId,
  level: number,                 // max 3
  path: string,                  // materialized path
  image: string,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, code: 1 }      — unique
  { tenantId: 1, parentId: 1 }
```

### 5.3 `products`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  sku: string,                   // unique trong tenant
  barcode: string,
  name: string,
  categoryId: ObjectId,
  unit: string,                  // 'cái', 'kg', 'thùng'
  costPrice: number,             // Giá vốn
  salePrice: number,             // Giá bán mặc định
  vatRate: number,               // 0, 5, 10
  description: string,
  images: string[],              // MinIO URLs
  attributes: [{
    name: string,
    values: string[]
  }],
  variants: [{                   // SKU variants
    sku: string,
    attributes: { [key: string]: string },
    costPrice: number,
    salePrice: number,
    barcode: string
  }],
  isActive: boolean,
  isDeleted: boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, sku: 1 }       — unique
  { tenantId: 1, barcode: 1 }   — sparse
  { tenantId: 1, categoryId: 1 }
  { tenantId: 1, isActive: 1 }
  { tenantId: 1, name: 'text' } — text search
```

### 5.4 `sales_orders`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  orderNumber: string,           // SO-{YYYY}-{NNNNN}, unique trong tenant
  customerId: ObjectId,
  assignedTo: ObjectId,          // Sales Staff
  quotationId: ObjectId,         // ref: quotations (nếu từ báo giá)
  orderDate: Date,
  deliveryDate: Date,            // Ngày giao hàng yêu cầu
  items: [{
    productId: ObjectId,
    productName: string,          // snapshot
    sku: string,
    quantity: number,
    unitPrice: number,
    discount: number,             // %
    vatRate: number,
    lineTotal: number
  }],
  subtotal: number,
  discountAmount: number,
  vatAmount: number,
  totalAmount: number,
  currency: string,              // 'VND'
  paymentTerms: string,
  paymentStatus: enum ['UNPAID','PARTIAL','PAID'],
  status: enum ['DRAFT','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','RETURNED'],
  notes: string,
  warehouseId: ObjectId,
  deliveryOrderId: ObjectId,
  invoiceId: ObjectId,
  createdBy: ObjectId,
  isDeleted: boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, orderNumber: 1 }  — unique
  { tenantId: 1, customerId: 1 }
  { tenantId: 1, status: 1 }
  { tenantId: 1, orderDate: -1 }
  { tenantId: 1, assignedTo: 1 }
```

### 5.5 `warehouses`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  name: string,
  code: string,                  // unique trong tenant
  address: string,
  managerId: ObjectId,
  isDefault: boolean,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, code: 1 }      — unique
```

### 5.6 `stock_items`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  warehouseId: ObjectId,
  productId: ObjectId,
  variantSku: string,
  quantity: number,              // Tồn kho hiện tại
  reservedQuantity: number,      // Đã đặt nhưng chưa xuất
  availableQuantity: number,     // quantity - reservedQuantity
  minStockLevel: number,         // Cảnh báo tồn kho thấp
  lastUpdatedAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, warehouseId: 1, productId: 1 } — unique
  { tenantId: 1, productId: 1 }
  { tenantId: 1, quantity: 1 }  — cảnh báo tồn thấp
```

---

## 6. Office Collections

### 6.1 `tasks`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  projectId: ObjectId,
  parentTaskId: ObjectId,        // Sub-task
  title: string,
  description: string,
  assigneeIds: ObjectId[],
  creatorId: ObjectId,
  priority: enum ['LOW','MEDIUM','HIGH','URGENT'],
  status: enum ['TODO','IN_PROGRESS','IN_REVIEW','DONE','CANCELLED'],
  progress: number,              // 0-100%
  startDate: Date,
  dueDate: Date,
  completedAt: Date,
  labels: string[],
  attachments: [{ fileUrl: string, fileName: string, uploadedAt: Date }],
  comments: [{
    userId: ObjectId,
    content: string,
    createdAt: Date
  }],
  estimatedHours: number,
  actualHours: number,
  isDeleted: boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, projectId: 1 }
  { tenantId: 1, assigneeIds: 1 }
  { tenantId: 1, status: 1 }
  { tenantId: 1, dueDate: 1 }
```

### 6.2 `documents` (Văn bản)

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  documentNumber: string,        // VB-{YYYY}-{NNNNN}
  documentType: string,          // ref: catalog_items
  direction: enum ['INCOMING','OUTGOING','INTERNAL'],
  title: string,
  issuedBy: string,              // Cơ quan ban hành (cho incoming)
  issuedDate: Date,
  receivedDate: Date,
  content: string,
  fileUrl: string,               // MinIO URL
  onlyOfficeKey: string,         // ONLYOFFICE document key
  status: enum ['DRAFT','PENDING_APPROVAL','APPROVED','ISSUED','ARCHIVED'],
  approvalWorkflowId: ObjectId,
  currentApprovalStep: number,
  tags: string[],
  relatedDocumentIds: ObjectId[],
  createdBy: ObjectId,
  isDeleted: boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, documentNumber: 1 }  — unique
  { tenantId: 1, status: 1 }
  { tenantId: 1, direction: 1 }
  { tenantId: 1, issuedDate: -1 }
  { tenantId: 1, title: 'text', content: 'text' }  — text search
```

### 6.3 `meetings`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  title: string,
  agenda: string,
  startTime: Date,
  endTime: Date,
  location: string,              // Phòng họp hoặc URL
  meetingType: enum ['IN_PERSON','ONLINE','HYBRID'],
  jitsiRoomName: string,         // Tên phòng Jitsi
  jitsiRoomToken: string,        // JWT cho Jitsi
  organizerId: ObjectId,
  attendeeIds: ObjectId[],
  status: enum ['SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED'],
  minutesFileUrl: string,        // Biên bản họp
  recordingUrl: string,          // Ghi âm/video Jitsi
  aiSummary: string,             // AI tóm tắt biên bản
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, startTime: -1 }
  { tenantId: 1, organizerId: 1 }
  { tenantId: 1, attendeeIds: 1 }
  { tenantId: 1, status: 1 }
```

---

## 7. Accounting Collections

### 7.1 `account_charts`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  accountCode: string,           // '111', '131', '511', ...
  accountName: string,
  parentCode: string,
  type: enum ['ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE','CONTRA'],
  isDetailAccount: boolean,      // Có thể nhập bút toán
  isSystem: boolean,             // Tài khoản hệ thống, không xóa
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, accountCode: 1 }  — unique
  { tenantId: 1, type: 1 }
  { tenantId: 1, parentCode: 1 }
```

### 7.2 `journal_entries`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  entryNumber: string,           // NKC-{YYYY}-{NNNNN}
  journalDate: Date,
  period: string,                // 'YYYY-MM'
  description: string,
  reference: string,             // Số chứng từ gốc
  sourceType: string,            // 'MANUAL','SALE_ORDER','PAYMENT',...
  sourceId: ObjectId,            // ref đến document gốc
  lines: [{
    lineNumber: number,
    accountCode: string,
    accountName: string,         // snapshot
    debit: number,
    credit: number,
    note: string,
    costCenterId: ObjectId       // Trung tâm chi phí
  }],
  totalDebit: number,
  totalCredit: number,
  status: enum ['DRAFT','POSTED','REVERSED'],
  reversalEntryId: ObjectId,     // Nếu bị đảo
  attachments: string[],
  createdBy: ObjectId,
  postedBy: ObjectId,
  postedAt: Date,
  aiSuggested: boolean,          // AI gợi ý
  isDeleted: boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, entryNumber: 1 }  — unique
  { tenantId: 1, period: 1 }
  { tenantId: 1, journalDate: -1 }
  { tenantId: 1, 'lines.accountCode': 1 }
  { tenantId: 1, status: 1 }
```

### 7.3 `invoices` (Hóa đơn điện tử)

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  invoiceNumber: string,         // Số hóa đơn
  series: string,                // Ký hiệu mẫu hóa đơn (C23TTT)
  invoiceType: enum ['VAT','SALE','ADJUSTMENT','CANCELLATION'],
  invoiceDate: Date,
  customerId: ObjectId,
  customerName: string,          // snapshot
  customerTaxCode: string,
  customerAddress: string,
  items: [{
    description: string,
    unit: string,
    quantity: number,
    unitPrice: number,
    vatRate: number,
    lineAmount: number,
    vatAmount: number
  }],
  subtotal: number,
  vatAmount: number,
  totalAmount: number,
  currency: string,
  exchangeRate: number,
  paymentMethod: string,
  status: enum ['DRAFT','ISSUED','SENT','CANCELLED','REPLACED'],
  provider: enum ['MISA','VNPT','VIETTEL','BKAV','FPT'],
  providerInvoiceId: string,     // ID từ provider
  providerStatus: string,
  providerXmlUrl: string,
  providerPdfUrl: string,
  salesOrderId: ObjectId,
  journalEntryId: ObjectId,
  createdBy: ObjectId,
  isDeleted: boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, invoiceNumber: 1, series: 1 }  — unique
  { tenantId: 1, status: 1 }
  { tenantId: 1, customerId: 1 }
  { tenantId: 1, invoiceDate: -1 }
```

---

## 8. AI Agent Collections

### 8.1 `ai_sessions`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  userId: ObjectId,
  sessionTitle: string,          // Tự động đặt tên từ câu đầu
  messages: [{
    role: enum ['user','assistant','system','tool'],
    content: string,
    toolCalls: [{               // Function calls
      name: string,
      arguments: object,
      result: object
    }],
    tokens: number,
    createdAt: Date
  }],
  totalTokens: number,
  model: string,                 // 'gpt-4o', 'gpt-3.5-turbo'
  context: object,               // { module, currentPage, ... }
  isArchived: boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, userId: 1, createdAt: -1 }
  { tenantId: 1, isArchived: 1 }
```

### 8.2 `automation_rules`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  name: string,
  description: string,
  triggerType: enum ['EVENT','SCHEDULE','CONDITION'],
  triggerConfig: {
    eventName: string,           // Tên RabbitMQ event
    cronExpression: string,      // Cron schedule
    conditionFormula: string     // JavaScript expression
  },
  actions: [{
    type: string,                // 'SEND_NOTIFICATION','CREATE_TASK','CALL_API'
    config: object
  }],
  isActive: boolean,
  lastRunAt: Date,
  runCount: number,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, isActive: 1 }
  { tenantId: 1, triggerType: 1 }
```

---

## 9. Dashboard Collections

### 9.1 `kpi_snapshots`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  snapshotDate: Date,            // Ngày chụp snapshot
  period: string,                // 'YYYY-MM' hoặc 'YYYY-WW' hoặc 'YYYY'
  module: string,                // 'sale', 'hr', 'inventory', 'accounting'
  metrics: {
    // Tùy theo module
    // Sale:
    totalRevenue: number,
    orderCount: number,
    newCustomers: number,
    // HR:
    headcount: number,
    newHires: number,
    resignations: number,
    // Inventory:
    stockValue: number,
    lowStockCount: number,
    // Accounting:
    totalAR: number,
    totalAP: number,
    cashBalance: number,
  },
  computedAt: Date,
  createdAt: Date
}

Indexes:
  { tenantId: 1, period: 1, module: 1 }  — unique
  { tenantId: 1, snapshotDate: -1 }
```

### 9.2 `dashboard_configs`

```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  userId: ObjectId,              // null = default cho role
  roleId: ObjectId,              // Default dashboard theo role
  dashboardName: string,
  layout: [{
    widgetId: string,
    widgetType: string,
    position: { x: number, y: number, w: number, h: number },
    config: object               // Widget-specific config
  }],
  isDefault: boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { tenantId: 1, userId: 1 }
  { tenantId: 1, roleId: 1 }
```

---

## 10. Cross-collection Relationships

### 10.1 Sơ đồ quan hệ chính

```
tenants ──────────────────────────────────────────┐
   │                                              │
   ├── users (tenantId)                           │ (tất cả collections
   │    └── departments (tenantId)                │  đều có tenantId)
   │         └── employees (tenantId, userId)     │
   │              └── contracts                   │
   │              └── attendance_records          │
   │              └── leave_requests              │
   │                                              │
   ├── roles (tenantId)                           │
   │    └── permissions (tenantId)               │
   │                                              │
   ├── catalog_items (tenantId)                  │
   │                                              │
   ├── sales_orders (tenantId, customerId)       │
   │    └── customers (tenantId)                 │
   │    └── products (tenantId)                  │
   │         └── stock_items (tenantId)          │
   │         └── product_categories              │
   │                                              │
   ├── journal_entries (tenantId)                │
   │    └── account_charts (tenantId)            │
   │    └── invoices (tenantId)                  │
   │                                              │
   ├── tasks (tenantId)                          │
   │    └── projects (tenantId)                  │
   │                                             │
   └── ai_sessions (tenantId, userId) ──────────┘
```

### 10.2 Event-driven Data Consistency

Khi không dùng foreign key (MongoDB), consistency được đảm bảo qua:

- **Event sourcing**: Khi sale_order hoàn thành → emit event → inventory cập nhật stock
- **Eventual consistency**: KPI snapshots được tính lại định kỳ (không real-time)
- **Snapshot pattern**: Lưu snapshot thông tin quan trọng trong document (tránh N+1 query)

---

## 11. Sharding Strategy

### 11.1 Giai đoạn hiện tại (Single Replica Set)

- MongoDB ReplicaSet 3 nodes: 1 Primary + 2 Secondary
- Read preference: `secondaryPreferred` cho reports
- Chưa cần sharding cho quy mô < 1.000 tenants

### 11.2 Kế hoạch Sharding (khi cần)

| Collection           | Shard Key                 | Lý do                                 |
| -------------------- | ------------------------- | ------------------------------------- |
| `sales_orders`       | `{ tenantId, orderDate }` | Phân tán đều theo tenant và thời gian |
| `journal_entries`    | `{ tenantId, period }`    | Truy vấn theo kỳ kế toán              |
| `attendance_records` | `{ tenantId, date }`      | Truy vấn theo ngày                    |
| `audit_logs`         | `{ tenantId, createdAt }` | Volume lớn, ít sửa                    |
| `ai_sessions`        | `{ tenantId, userId }`    | Phân tán theo user                    |

### 11.3 TTL Indexes (Auto-cleanup)

| Collection        | Field          | TTL                     |
| ----------------- | -------------- | ----------------------- |
| `refresh_tokens`  | `expiresAt`    | 0 (expire at expiresAt) |
| `password_resets` | `expiresAt`    | 0                       |
| `audit_logs`      | `createdAt`    | 730 ngày (2 năm)        |
| `kpi_snapshots`   | `snapshotDate` | 1095 ngày (3 năm)       |
