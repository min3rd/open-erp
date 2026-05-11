# SRS-OVERVIEW — Đặc tả Yêu cầu Phần mềm Tổng quan

# Open ERP — Nền tảng SaaS Quản trị và Vận hành Doanh nghiệp

**Phiên bản:** 1.1  
**Ngày tạo:** 09/05/2026  
**Ngày cập nhật:** 09/05/2026  
**Tác giả:** Business Analyst  
**Trạng thái:** Hoàn chỉnh

---

## Mục lục

1. [Mục đích tài liệu](#1-mục-đích-tài-liệu)
2. [Phạm vi hệ thống](#2-phạm-vi-hệ-thống)
3. [Danh sách phân hệ và liên kết SRS](#3-danh-sách-phân-hệ-và-liên-kết-srs)
4. [Kiến trúc tổng quan](#4-kiến-trúc-tổng-quan)
5. [Mô hình SaaS Multi-Tenant](#5-mô-hình-saas-multi-tenant)
6. [Yêu cầu phi chức năng (Non-Functional Requirements)](#6-yêu-cầu-phi-chức-năng)
7. [Ràng buộc kỹ thuật (Constraints)](#7-ràng-buộc-kỹ-thuật)
8. [Giả định (Assumptions)](#8-giả-định)
9. [Định nghĩa và thuật ngữ](#9-định-nghĩa-và-thuật-ngữ)

---

## 1. Mục đích tài liệu

Tài liệu SRS (Software Requirements Specification) này mô tả đầy đủ và chính xác các yêu cầu kỹ thuật và nghiệp vụ của hệ thống **Open ERP** — nền tảng SaaS quản trị và vận hành doanh nghiệp tích hợp AI Agent.

**Đối tượng sử dụng tài liệu:**

| Đối tượng          | Mục đích sử dụng                                        |
| ------------------ | ------------------------------------------------------- |
| Technical Leader   | Thiết kế kiến trúc microservices, phân rã task kỹ thuật |
| Backend Developer  | Xây dựng API, business logic, data model                |
| Frontend Developer | Xây dựng giao diện web Angular và mobile Ionic          |
| QA Engineer        | Thiết kế test case, kiểm thử tính năng                  |
| DevOps Engineer    | Cấu hình hạ tầng, triển khai, monitoring                |
| Product Owner      | Xác nhận phạm vi và ưu tiên tính năng                   |

---

## 2. Phạm vi hệ thống

### 2.1 Tổng quan

Open ERP là nền tảng SaaS (Software as a Service) multi-tenant, cho phép nhiều doanh nghiệp (tenant) sử dụng cùng cơ sở hạ tầng với dữ liệu hoàn toàn cách ly theo logic (logical isolation thông qua `tenantId`).

Hệ thống cung cấp **7 phân hệ** quản trị doanh nghiệp tích hợp:

1. Quản trị hệ thống (System Administration)
2. Bán hàng và Kho vận (Sale & Logistics)
3. Quản lý Nhân sự (HR)
4. Điều hành Nội bộ (Office)
5. Kế toán Tài chính (Accounting)
6. AI Agent trung tâm
7. Dashboard điều hành

### 2.2 Ngoài phạm vi (v1.0)

- Quản lý sản xuất MRP
- Hệ thống POS tích hợp phần cứng
- Tính lương (Payroll) tự động
- Tích hợp Internet Banking API
- Marketplace và E-commerce storefront
- Hệ thống học tập LMS
- Quản lý dự án kiểu Jira (Gantt chart nâng cao)

---

## 3. Danh sách phân hệ và liên kết SRS

| #   | Phân hệ               | File SRS                                                             | Sprint       |
| --- | --------------------- | -------------------------------------------------------------------- | ------------ |
| 1   | System Administration | [modules/system-administration.md](modules/system-administration.md) | Sprint 01–02 |
| 2   | Sale & Logistics      | [modules/sale-logistics.md](modules/sale-logistics.md)               | Sprint 05–08 |
| 3   | HR                    | [modules/hr.md](modules/hr.md)                                       | Sprint 03–04 |
| 4   | Office                | [modules/office.md](modules/office.md)                               | Sprint 09–10 |
| 5   | Accounting            | [modules/accounting.md](modules/accounting.md)                       | Sprint 11–12 |
| 6   | AI Agent              | [modules/ai-agent.md](modules/ai-agent.md)                           | Sprint 13    |
| 7   | Dashboard             | [modules/dashboard.md](modules/dashboard.md)                         | Sprint 14    |

---

## 4. Kiến trúc tổng quan

### 4.1 Công nghệ

| Thành phần        | Công nghệ                                | Ghi chú                                                              |
| ----------------- | ---------------------------------------- | -------------------------------------------------------------------- |
| Backend           | NestJS Microservices                     | Node.js, TypeScript                                                  |
| Web Frontend      | Angular 21+                              | TypeScript, CSS (không sử dụng SCSS), Angular Material / TailwindCSS |
| Mobile            | Ionic Angular (Capacitor)                | Android, iOS                                                         |
| Shared UI Library | Angular library dùng chung Web/Mobile    | Chứa design tokens, component dùng chung, guideline nhất quán UI/UX  |
| Database          | MongoDB                                  | Multi-tenant, mỗi document có `tenantId`                             |
| Message Broker    | RabbitMQ                                 | Giao tiếp giữa microservices                                         |
| API Gateway       | NestJS API Gateway                       | Rate limiting, auth middleware                                       |
| Auth              | JWT + Refresh Token + OAuth2             | Google, Microsoft                                                    |
| Storage           | MinIO (S3-compatible)                    | Lưu file, tài liệu, ảnh                                              |
| Real-time         | Socket.IO                                | Notification, dashboard live update                                  |
| AI Agent          | OpenAI API + LangChain                   | Hoặc Local LLM                                                       |
| Document Editing  | ONLYOFFICE Docs Server                   | DOCX, XLSX, PPTX                                                     |
| Video Meeting     | Jitsi Meet                               | Self-hosted                                                          |
| Kế toán Việt Nam  | MISA AMIS API, eTax                      | Tích hợp bên ngoài                                                   |
| Hóa đơn điện tử   | MISA meInvoice, VNPT, Viettel, BKAV, FPT | Theo Nghị định 123/2020/NĐ-CP                                        |

### 4.2 Microservices

```
API Gateway
├── auth-service          (JWT, OAuth2, MFA)
├── tenant-service        (quản lý tenant, subscription)
├── user-service          (quản lý người dùng, phân quyền)
├── hr-service            (nhân sự, chấm công, tuyển dụng)
├── sale-service          (bán hàng, đơn hàng, khách hàng)
├── inventory-service     (kho, tồn kho, sản phẩm)
├── logistics-service     (vận chuyển, giao hàng, COD)
├── office-service        (công việc, văn bản, lịch họp)
├── accounting-service    (kế toán, phiếu thu/chi, công nợ)
├── invoice-service       (hóa đơn điện tử)
├── ai-agent-service      (AI orchestration, chatbot)
├── notification-service  (email, push, in-app)
├── audit-service         (audit log bất biến)
└── dashboard-service     (tổng hợp KPI, analytics)
```

---

## 5. Mô hình SaaS Multi-Tenant

### 5.1 Chiến lược cách ly dữ liệu

Open ERP sử dụng **Shared Database — Shared Schema** với cách ly logic:

- Mỗi document MongoDB đều có trường `tenantId` (kiểu `ObjectId` hoặc `string`)
- Tất cả query phải filter theo `tenantId` trích xuất từ JWT token
- Index composite bắt buộc: `(tenantId, <field_khác>)` cho mọi collection nghiệp vụ
- Middleware tầng API Gateway tự động inject `tenantId` vào mỗi request

### 5.2 Vòng đời Tenant

```
Trạng thái:
  PENDING_SETUP → PENDING_ACTIVATION → TRIAL → ACTIVE → SUSPENDED → TERMINATED

PENDING_SETUP : Tenant vừa được tạo, chưa hoàn thành onboarding
PENDING_ACTIVATION : Đã gửi email kích hoạt, chờ người đăng ký bấm activation link
TRIAL         : Đang dùng thử (mặc định 14 ngày)
ACTIVE        : Đang sử dụng, đã thanh toán gói dịch vụ
SUSPENDED     : Bị tạm ngưng (quá hạn thanh toán / vi phạm)
TERMINATED    : Đã hủy hợp đồng, dữ liệu sẽ xóa sau 30 ngày
```

**Quy tắc kích hoạt email (đăng ký doanh nghiệp):**

- Sau khi đăng ký hợp lệ, hệ thống gửi activation email chứa liên kết một lần (one-time link).
- Activation link có thời hạn hiệu lực tối đa 24 giờ; hết hạn thì chuyển trạng thái đăng ký sang `ACTIVATION_EXPIRED`.
- Registrant có thể yêu cầu gửi lại link tối đa 3 lần trong 24 giờ; mỗi lần gửi lại sẽ vô hiệu hóa link cũ.
- Chỉ sau khi link được bấm hợp lệ, tenant mới được chuyển sang `TRIAL` hoặc `PENDING_VERIFICATION` (nếu cần Manual Review).

### 5.3 Quy tắc Multi-Tenant bắt buộc

| Quy tắc | Mô tả                                                                              |
| ------- | ---------------------------------------------------------------------------------- |
| MT-001  | Mọi API endpoint (trừ auth public) đều yêu cầu JWT hợp lệ với `tenantId`           |
| MT-002  | `tenantId` trong JWT phải khớp với `tenantId` trong dữ liệu được truy cập          |
| MT-003  | Super Admin chỉ truy cập dữ liệu tenant qua giao diện quản trị riêng biệt          |
| MT-004  | Tenant bị SUSPENDED trả về lỗi HTTP 403 cho mọi API call                           |
| MT-005  | Audit log phải ghi đủ `tenantId` cho mọi thao tác                                  |
| MT-006  | File lưu trữ MinIO được tổ chức theo bucket riêng mỗi tenant: `tenant-{tenantId}/` |

---

## 6. Yêu cầu phi chức năng

### 6.1 Hiệu năng (Performance)

| Chỉ số                                              | Yêu cầu                                 |
| --------------------------------------------------- | --------------------------------------- |
| Thời gian phản hồi API thông thường                 | ≤ 200ms (P95)                           |
| Thời gian phản hồi API phức tạp (báo cáo, tổng hợp) | ≤ 2.000ms (P95)                         |
| Đồng thời người dùng trên một tenant                | 500 concurrent users                    |
| Tổng tải hệ thống                                   | 10.000 concurrent users (toàn platform) |
| Thông lượng (throughput)                            | 1.000 req/giây                          |
| Độ trễ WebSocket notification                       | ≤ 500ms                                 |
| Upload file tối đa                                  | 100MB / file                            |
| Dung lượng storage mỗi tenant (mặc định)            | 10GB (có thể nâng cấp)                  |

### 6.2 Bảo mật (Security)

| Hạng mục                        | Yêu cầu                                                                 |
| ------------------------------- | ----------------------------------------------------------------------- |
| Mã hóa truyền dẫn               | HTTPS/TLS 1.2+ cho tất cả kết nối                                       |
| Mã hóa mật khẩu                 | bcrypt, cost factor ≥ 12                                                |
| JWT                             | RS256, access token 15 phút, refresh token 7 ngày                       |
| Rate limiting                   | 100 req/phút/IP cho auth endpoints; 1.000 req/phút cho API thông thường |
| SQL Injection / NoSQL Injection | Sanitize tất cả input, dùng parameterized queries                       |
| XSS                             | Content Security Policy header, sanitize HTML output                    |
| CORS                            | Chỉ cho phép origin từ danh sách whitelist                              |
| Dữ liệu nhạy cảm                | Mã hóa AES-256 cho trường nhạy cảm (số CCCD, thông tin lương)           |
| Audit trail                     | Ghi log 100% thao tác CRUD, lưu ít nhất 2 năm                           |
| MFA                             | Hỗ trợ TOTP (Google Authenticator), email OTP                           |
| Penetration testing             | Thực hiện trước mỗi release lớn                                         |

### 6.3 Khả năng mở rộng (Scalability)

| Hạng mục           | Yêu cầu                                           |
| ------------------ | ------------------------------------------------- |
| Horizontal scaling | Mỗi microservice scale độc lập bằng Kubernetes    |
| Database scaling   | MongoDB Replica Set, có thể nâng lên Sharding     |
| Stateless services | Tất cả service không lưu state trong bộ nhớ       |
| Cache              | Redis cho session, cache dữ liệu thường xuyên đọc |
| CDN                | Static assets phân phối qua CDN                   |
| Message queue      | RabbitMQ với dead letter queue và retry mechanism |

### 6.4 Độ sẵn sàng (Availability)

| Hạng mục                       | Yêu cầu                                        |
| ------------------------------ | ---------------------------------------------- |
| SLA uptime                     | 99,9% (tương đương ~8,7 giờ downtime/năm)      |
| RPO (Recovery Point Objective) | ≤ 1 giờ (mất dữ liệu tối đa)                   |
| RTO (Recovery Time Objective)  | ≤ 4 giờ (thời gian khôi phục sau sự cố)        |
| Backup database                | Hàng ngày, lưu 30 ngày gần nhất                |
| Backup file (MinIO)            | Hàng ngày, lưu 7 ngày gần nhất                 |
| Maintenance window             | Cuối tuần 2:00–4:00 SA, thông báo trước 48 giờ |

### 6.5 Khả năng bảo trì (Maintainability)

- Test coverage: ≥ 80% cho unit test, ≥ 60% cho integration test
- Logging: Structured log (JSON) với các level: DEBUG, INFO, WARN, ERROR
- Monitoring: Health check endpoint `/health`, metrics Prometheus, dashboard Grafana
- API documentation: OpenAPI 3.0 (Swagger) tự động sinh từ code
- CI/CD: Pipeline tự động test và deploy

### 6.6 Khả năng sử dụng (Usability)

- Giao diện hỗ trợ tiếng Việt (mặc định) và tiếng Anh
- Responsive design: tương thích màn hình 1280px+, tablet, mobile
- Thời gian load trang đầu tiên: ≤ 3 giây (LCP)
- Accessibility: tuân thủ WCAG 2.1 Level AA

### 6.7 Frontend, Shared UI và Đa ngôn ngữ

| Hạng mục                    | Yêu cầu                                                                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Chuẩn style Web Angular     | Web bắt buộc dùng CSS; không dùng SCSS trong mã nguồn ứng dụng web                                                                              |
| Shared UI Library           | Xây dựng thư viện giao diện dùng chung cho Angular Web và Ionic Angular Mobile, bao gồm token màu, spacing, typography và component tái sử dụng |
| i18n Frontend               | Frontend sử dụng Transloco làm chuẩn quản lý đa ngôn ngữ                                                                                        |
| Contract thông điệp Backend | Backend chỉ trả `messageKey` + `metadata` (ví dụ: `params`, `severity`, `domain`, `traceId`) thay vì chuỗi thông điệp đã dịch                   |
| Render theo locale          | Frontend chịu trách nhiệm render thông điệp theo locale hiện tại dựa trên `messageKey` và `metadata`                                            |

---

## 7. Ràng buộc kỹ thuật

| Ràng buộc | Mô tả                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------- |
| **C-001** | Backend phải dùng NestJS (TypeScript), không dùng framework khác                                        |
| **C-002** | Database chính là MongoDB, không dùng SQL database cho business data                                    |
| **C-003** | Giao tiếp nội bộ giữa microservices qua RabbitMQ (không gọi HTTP trực tiếp)                             |
| **C-004** | Frontend web dùng Angular 21+, không dùng React hay Vue                                                 |
| **C-005** | Mobile dùng Ionic Angular + Capacitor, không dùng React Native                                          |
| **C-006** | Hóa đơn điện tử phải tuân thủ Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC                       |
| **C-007** | Chuẩn tài khoản kế toán theo Thông tư 200/2014/TT-BTC (hoặc 133/2016/TT-BTC)                            |
| **C-008** | File lưu trữ dùng MinIO (S3-compatible), không dùng local filesystem                                    |
| **C-009** | Mỗi document MongoDB phải có `tenantId`, `createdAt`, `updatedAt`                                       |
| **C-010** | AI Agent không được tự động thực thi tác vụ tài chính không có xác nhận người dùng                      |
| **C-011** | Angular Web chỉ dùng CSS; không dùng SCSS trong phạm vi ứng dụng web                                    |
| **C-012** | Frontend đa ngôn ngữ phải dùng Transloco; không hardcode thông điệp hiển thị trong component            |
| **C-013** | Backend không trả thông điệp đã dịch; chỉ trả `messageKey` và `metadata` cho frontend xử lý theo locale |

---

## 8. Giả định

| Giả định  | Mô tả                                                                                |
| --------- | ------------------------------------------------------------------------------------ |
| **A-001** | Hệ thống được triển khai trên cloud (AWS, GCP, hoặc Azure) với Kubernetes            |
| **A-002** | Tenant sử dụng trình duyệt hiện đại (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)  |
| **A-003** | Kết nối internet ổn định với băng thông tối thiểu 5Mbps cho người dùng web           |
| **A-004** | ONLYOFFICE Docs Server và Jitsi Meet được triển khai self-hosted trên cùng cụm       |
| **A-005** | Tenant đã có số đăng ký doanh nghiệp và MST hợp lệ khi sử dụng tính năng kế toán     |
| **A-006** | Nhà cung cấp hóa đơn điện tử (MISA, VNPT, Viettel...) cung cấp API sandbox để test   |
| **A-007** | Tích hợp MISA chỉ áp dụng với MISA AMIS Cloud và MISA SME.NET phiên bản mới          |
| **A-008** | Dữ liệu audit log được lưu riêng trong collection cách ly, không ảnh hưởng hiệu năng |
| **A-009** | Local LLM (nếu dùng) được triển khai trong cùng mạng nội bộ hoặc VPC                 |
| **A-010** | Máy chấm công sinh trắc học tích hợp qua API/SDK riêng, không trong phạm vi v1.0     |

---

## 9. Định nghĩa và thuật ngữ

| Thuật ngữ        | Định nghĩa                                                                    |
| ---------------- | ----------------------------------------------------------------------------- |
| **Tenant**       | Một doanh nghiệp đăng ký sử dụng nền tảng Open ERP                            |
| **Super Admin**  | Quản trị viên nền tảng SaaS, có quyền quản lý tất cả tenant                   |
| **Tenant Admin** | Quản trị viên của một doanh nghiệp cụ thể                                     |
| **tenantId**     | Định danh duy nhất của một tenant trong hệ thống                              |
| **RBAC**         | Role-Based Access Control — phân quyền dựa trên vai trò                       |
| **JWT**          | JSON Web Token — cơ chế xác thực stateless                                    |
| **OAuth2**       | Giao thức ủy quyền để đăng nhập bằng tài khoản bên thứ ba (Google, Microsoft) |
| **MFA**          | Multi-Factor Authentication — xác thực đa yếu tố                              |
| **TOTP**         | Time-based One-Time Password                                                  |
| **SLA**          | Service Level Agreement — thỏa thuận mức dịch vụ                              |
| **KPI**          | Key Performance Indicator — chỉ số đo lường hiệu suất                         |
| **COD**          | Cash on Delivery — thanh toán khi nhận hàng                                   |
| **VAS**          | Vietnamese Accounting Standards — chuẩn mực kế toán Việt Nam                  |
| **CQT**          | Cơ quan thuế                                                                  |
| **MST**          | Mã số thuế                                                                    |
| **SKU**          | Stock Keeping Unit — đơn vị lưu kho                                           |
| **PO**           | Purchase Order — đơn mua hàng                                                 |
| **RAG**          | Retrieval-Augmented Generation — kỹ thuật AI kết hợp tìm kiếm và sinh văn bản |
| **LLM**          | Large Language Model — mô hình ngôn ngữ lớn                                   |
| **OCR**          | Optical Character Recognition — nhận dạng ký tự quang học                     |
| **Microservice** | Kiến trúc phần mềm chia nhỏ ứng dụng thành các dịch vụ độc lập                |
| **Audit Log**    | Nhật ký ghi lại tất cả thao tác người dùng/hệ thống, bất biến                 |
