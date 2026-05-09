# PRD-OVERVIEW — Tài liệu Yêu cầu Sản phẩm Tổng quan
# Open ERP — Nền tảng SaaS Quản trị và Vận hành Doanh nghiệp

**Phiên bản:** 1.1  
**Ngày tạo:** 09/05/2026  
**Ngày cập nhật:** 09/05/2026  
**Tác giả:** Product Owner  
**Trạng thái:** Đang soạn thảo  

---

## Mục lục

1. [Tầm nhìn sản phẩm](#1-tầm-nhìn-sản-phẩm)
2. [Mục tiêu kinh doanh](#2-mục-tiêu-kinh-doanh)
3. [Đối tượng khách hàng](#3-đối-tượng-khách-hàng)
4. [Phạm vi sản phẩm](#4-phạm-vi-sản-phẩm)
5. [Các phân hệ theo độ ưu tiên MoSCoW](#5-các-phân-hệ-theo-độ-ưu-tiên-moscow)
6. [Mô hình SaaS Multi-Tenant](#6-mô-hình-saas-multi-tenant)
7. [Yêu cầu phi chức năng](#7-yêu-cầu-phi-chức-năng)
8. [Lộ trình sản phẩm theo sprint](#8-lộ-trình-sản-phẩm-theo-sprint)
9. [Tiêu chí thành công](#9-tiêu-chí-thành-công)

---

## 1. Tầm nhìn sản phẩm

**Open ERP** là nền tảng SaaS quản trị và vận hành doanh nghiệp tích hợp, được thiết kế để:

> *"Số hóa toàn diện quy trình vận hành doanh nghiệp Việt Nam, tự động hóa nghiệp vụ bằng AI Agent, giúp doanh nghiệp vận hành hiệu quả hơn trên một hệ thống thống nhất."*

Nền tảng tập hợp tất cả phân hệ quản trị doanh nghiệp — từ nhân sự, bán hàng, kho vận, kế toán đến điều hành nội bộ — trong một giải pháp SaaS multi-tenant duy nhất, với AI Agent đóng vai trò trung tâm điều phối và hỗ trợ nghiệp vụ xuyên suốt toàn hệ thống.

### Điểm khác biệt cốt lõi

| Khác biệt | Mô tả |
|---|---|
| **AI Agent tích hợp sâu** | AI Agent không phải add-on mà là thành phần lõi chạy xuyên suốt tất cả phân hệ |
| **Phù hợp đặc thù Việt Nam** | Tích hợp MISA, eTax, hóa đơn điện tử theo quy định Việt Nam |
| **Cộng tác tích hợp** | ONLYOFFICE + Jitsi Meet + Chat nội bộ trong một nền tảng |
| **SaaS multi-tenant linh hoạt** | Mỗi doanh nghiệp độc lập hoàn toàn về dữ liệu và cấu hình |
| **Mở rộng không giới hạn** | Kiến trúc microservices cho phép scale từng phân hệ độc lập |

---

## 2. Mục tiêu kinh doanh

### 2.1 Mục tiêu ngắn hạn (6 tháng đầu)
- Ra mắt nền tảng SaaS với 3 phân hệ cốt lõi: System Admin, HR, và Office
- Đạt 50 tenant đăng ký sử dụng thử (trial)
- Hoàn thiện tích hợp MISA và hóa đơn điện tử

### 2.2 Mục tiêu trung hạn (12 tháng)
- Triển khai đầy đủ 7 phân hệ
- Đạt 200 tenant trả phí (paying tenants)
- Tích hợp hoàn chỉnh AI Agent vào tất cả phân hệ
- Đạt tỷ lệ giữ chân khách hàng (retention rate) > 85%

### 2.3 Mục tiêu dài hạn (24 tháng)
- Trở thành nền tảng ERP SaaS hàng đầu cho SMB Việt Nam
- Đạt 1.000+ tenant đang hoạt động
- Mở rộng sang thị trường Đông Nam Á

---

## 3. Đối tượng khách hàng

### 3.1 Phân khúc tenant mục tiêu

| Phân khúc | Mô tả | Quy mô | Nhu cầu chính |
|---|---|---|---|
| **SMB — Doanh nghiệp vừa và nhỏ** | Công ty thương mại, dịch vụ, sản xuất nhỏ | 10–200 nhân sự | Bán hàng, kho, HR, kế toán cơ bản |
| **Doanh nghiệp tăng trưởng nhanh** | Startup, scale-up | 20–500 nhân sự | Tự động hóa quy trình, AI insights |
| **Doanh nghiệp vừa** | Công ty có chuỗi chi nhánh | 200–2.000 nhân sự | Đa chi nhánh, phân quyền phức tạp |
| **Đơn vị hành chính — dịch vụ** | Văn phòng, công ty dịch vụ | 5–100 nhân sự | Office, văn bản, họp, công việc |

### 3.2 Personas người dùng

#### Super Admin (Quản trị viên nền tảng SaaS)
- **Vai trò:** Quản trị toàn bộ nền tảng, quản lý tenant
- **Mục tiêu:** Đảm bảo hệ thống vận hành ổn định, quản lý gói dịch vụ và billing
- **Đau điểm:** Cần theo dõi tất cả tenant, xử lý sự cố, quản lý quota

#### Tenant Admin (Quản trị viên Doanh nghiệp)
- **Vai trò:** Quản trị toàn bộ không gian làm việc của doanh nghiệp mình
- **Mục tiêu:** Cấu hình hệ thống phù hợp với tổ chức, quản lý người dùng và phân quyền
- **Đau điểm:** Cần thiết lập nhanh, cấu hình linh hoạt, không cần kiến thức kỹ thuật sâu

#### Manager (Trưởng phòng / Quản lý)
- **Vai trò:** Quản lý công việc, phê duyệt, theo dõi KPI của nhóm
- **Mục tiêu:** Nắm bắt tiến độ, ra quyết định nhanh, giảm tải hành chính
- **Đau điểm:** Quá tải báo cáo thủ công, thiếu visibility thực tế

#### Employee (Nhân viên)
- **Vai trò:** Thực hiện công việc hàng ngày, báo cáo tiến độ
- **Mục tiêu:** Thao tác nhanh, ít nhập liệu thủ công, nhận thông báo kịp thời
- **Đau điểm:** Dùng nhiều hệ thống rời rạc, thông tin không tập trung

#### Executive (Lãnh đạo / CEO/CFO)
- **Vai trò:** Điều hành, quyết định chiến lược
- **Mục tiêu:** Có góc nhìn tổng thể, báo cáo real-time, cảnh báo sớm
- **Đau điểm:** Phải đợi báo cáo thủ công, dữ liệu phân tán

---

## 4. Phạm vi sản phẩm

### 4.1 In-Scope (Trong phạm vi)

| # | Phân hệ | Phạm vi |
|---|---|---|
| 1 | **System Administration** | SaaS multi-tenant, auth JWT/OAuth2, quản lý tenant, người dùng, vai trò, phân quyền, danh mục, audit log |
| 2 | **Sale & Logistics** | Quản lý khách hàng, đơn hàng, sản phẩm, kho, mua hàng, vận chuyển, KPI vận hành |
| 3 | **HR** | Tuyển dụng, hồ sơ nhân viên, hợp đồng, chấm công, nghỉ phép, đánh giá KPI |
| 4 | **Office** | Công việc, văn bản, ONLYOFFICE, Jitsi Meet, chat nội bộ, thông báo |
| 5 | **Accounting** | Kế toán tổng hợp, công nợ, thu chi, hóa đơn điện tử, tích hợp MISA, eTax |
| 6 | **AI Agent** | AI Agent xuyên suốt tất cả phân hệ, tự động hóa workflow, phân tích dữ liệu |
| 7 | **Dashboard** | Dashboard điều hành tổng thể, KPI real-time, cảnh báo |
| 8 | **Mobile** | Ứng dụng Ionic Angular cho Android/iOS (các chức năng cốt lõi) |

### 4.2 Out-of-Scope (Ngoài phạm vi — phiên bản 1.0)

- Quản lý sản xuất (Manufacturing MRP)
- Quản lý dự án phức tạp (Project Management như Jira)
- Hệ thống POS (Point of Sale) tích hợp phần cứng
- Quản lý tài sản cố định đầy đủ (Fixed Assets)
- Payroll (Tính lương) tự động — chỉ hỗ trợ chấm công
- Tích hợp với hệ thống ngân hàng (Internet Banking API)
- Marketplace / E-commerce storefront
- Hệ thống học tập trực tuyến (LMS)

---

## 5. Các phân hệ theo độ ưu tiên MoSCoW

### Must Have (Phải có)
- Đăng ký, đăng nhập, xác thực JWT/OAuth2
- Quản lý tenant (multi-tenant isolation)
- Quản lý người dùng, vai trò, phân quyền RBAC
- Quản lý hồ sơ nhân viên cơ bản
- Quản lý sản phẩm và đơn hàng
- Quản lý kho và tồn kho
- Kế toán cơ bản: phiếu thu chi, công nợ
- Hóa đơn điện tử
- Dashboard tổng quan
- Audit log

### Should Have (Nên có)
- AI Agent gợi ý và tự động hóa cơ bản
- Tích hợp ONLYOFFICE
- Chat nội bộ và thông báo real-time
- Chấm công và nghỉ phép
- Tích hợp MISA
- Báo cáo và phân tích nâng cao
- Workflow phê duyệt đa cấp

### Could Have (Có thể có)
- Tích hợp Jitsi Meet đầy đủ
- AI Agent tự động điều phối workflow phức tạp
- Tích hợp eTax
- Mobile app đầy đủ chức năng
- Tuyển dụng và onboarding
- KPI và đánh giá nhân sự

### Won't Have (Không có trong phiên bản này)
- Manufacturing MRP
- POS phần cứng
- Payroll tự động
- Tích hợp ngân hàng
- Marketplace

---

## 6. Mô hình SaaS Multi-Tenant

### 6.1 Kiến trúc tenant

```
SaaS Platform (Open ERP)
├── Super Admin Layer
│   ├── Tenant Management
│   ├── Subscription & Billing
│   ├── Platform Config
│   └── Global Audit Log
└── Tenant Layer (mỗi tenant độc lập)
    ├── Tenant Config
    ├── User Management
    ├── Role & Permission (RBAC)
    ├── Data Isolation (MongoDB per-tenant schema)
    └── Module Access (theo gói dịch vụ)
```

### 6.2 Chiến lược Data Isolation
- **Mô hình:** Schema-per-tenant trên MongoDB (mỗi tenant có database riêng hoặc collection với prefix tenant ID)
- **Bảo mật:** Mọi truy vấn đều phải có `tenantId` trong context, middleware validation bắt buộc
- **Sao lưu:** Backup và restore độc lập theo từng tenant

### 6.3 Gói dịch vụ (Subscription Plans)

| Gói | Người dùng | Phân hệ | Storage | AI Agent |
|---|---|---|---|---|
| **Starter** | Tối đa 10 | System Admin + 2 phân hệ tự chọn | 5 GB | Cơ bản |
| **Business** | Tối đa 50 | System Admin + 5 phân hệ | 50 GB | Nâng cao |
| **Enterprise** | Không giới hạn | Tất cả phân hệ | Không giới hạn | Đầy đủ |
| **Custom** | Theo thỏa thuận | Tùy chỉnh | Tùy chỉnh | Tùy chỉnh |

### 6.4 Tenant Lifecycle
1. **Đăng ký:** Super Admin tạo hoặc tenant tự đăng ký qua trang landing
2. **Kích hoạt email:** Hệ thống gửi email kích hoạt; doanh nghiệp chủ động kích hoạt tenant qua link bảo mật trong email
3. **Onboarding:** Wizard thiết lập ban đầu (thông tin DN, phân hệ, người dùng đầu tiên)
4. **Trial:** 14 ngày dùng thử đầy đủ tính năng gói Business
5. **Active:** Tenant đang hoạt động, trả phí
6. **Suspended:** Tạm ngừng (quá hạn thanh toán, vi phạm điều khoản)
7. **Terminated:** Xóa tenant (sau 30 ngày suspended, hoặc yêu cầu xóa tài khoản)

---

## 7. Yêu cầu phi chức năng

### 7.1 Hiệu năng (Performance)
- API response time < 300ms cho 95th percentile
- Dashboard load time < 2 giây
- Hỗ trợ 1.000 concurrent users / tenant
- Throughput hệ thống: 10.000 requests/giây ở tải cao điểm

### 7.2 Khả năng mở rộng (Scalability)
- Kiến trúc microservices: scale từng service độc lập
- Horizontal scaling với Kubernetes
- Message broker (RabbitMQ) cho giao tiếp bất đồng bộ
- Caching với Redis để giảm tải database

### 7.3 Tính sẵn sàng (Availability)
- Uptime SLA: 99.9% (downtime tối đa ~8.7 giờ/năm)
- Zero-downtime deployment
- Tự động failover và recovery
- Backup dữ liệu: hàng ngày, lưu 30 ngày

### 7.4 Bảo mật (Security)
- Xác thực: JWT (access token 15 phút) + Refresh token (7 ngày)
- Hỗ trợ OAuth2 (Google, Microsoft)
- Multi-factor Authentication (MFA) tùy chọn
- Mã hóa dữ liệu at-rest (AES-256) và in-transit (TLS 1.3)
- Phân quyền RBAC + ABAC (Attribute-Based Access Control)
- Rate limiting và DDoS protection
- Audit log bất biến (immutable) cho mọi thao tác quan trọng
- OWASP Top 10 compliance
- Penetration testing định kỳ

### 7.5 Khả năng sử dụng (Usability)
- Thiết kế responsive (Desktop, Tablet, Mobile)
- Mobile app (iOS/Android) qua Ionic Angular + Capacitor
- Hỗ trợ ngôn ngữ: Tiếng Việt (mặc định), Tiếng Anh
- Onboarding wizard cho tenant mới
- Tài liệu hướng dẫn sử dụng tích hợp

### 7.6 Chuẩn Frontend và Đa ngôn ngữ
- **Web Angular dùng CSS:** Ứng dụng web Angular chuẩn hóa sử dụng CSS thay cho SCSS để đồng nhất quy ước styling và đơn giản hóa pipeline build.
- **Thư viện UI dùng chung Web/Mobile:** Xây dựng thư viện giao diện dùng chung (shared UI library) cho Angular Web và Ionic Angular Mobile nhằm tái sử dụng component, token giao diện, và hành vi UI cốt lõi.
- **Chuẩn i18n với Transloco:** Frontend sử dụng Transloco để quản lý đa ngôn ngữ; backend trả về `messageKey` và metadata (ví dụ: params, severity, domain) thay vì hardcode thông điệp hiển thị.
- **Phân tách trách nhiệm hiển thị ngôn ngữ:** Frontend chịu trách nhiệm render nội dung theo locale hiện tại từ key + metadata nhận từ backend.
- **Định hướng Screen Spec:** Đặc tả màn hình được tách theo từng màn hình với mã định danh riêng để tăng khả năng truy vết từ PRD → UX → phát triển → kiểm thử.

### 7.7 Khả năng tích hợp (Interoperability)
- REST API + WebSocket API
- Webhook outbound cho sự kiện quan trọng
- Import/Export: Excel, CSV, PDF
- Tích hợp: ONLYOFFICE, Jitsi Meet, MISA, eTax, hóa đơn điện tử
- API public cho bên thứ ba (v2 roadmap)

### 7.8 Tuân thủ (Compliance)
- Tuân thủ Luật An toàn thông tin mạng Việt Nam
- Tuân thủ quy định về hóa đơn điện tử (Nghị định 123/2020/NĐ-CP)
- Tuân thủ quy định về bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP)
- Hỗ trợ chữ ký số theo chuẩn Việt Nam

---

## 8. Lộ trình sản phẩm theo sprint

### Giai đoạn 1: Nền tảng SaaS (Sprint 01–02)
| Sprint | Mục tiêu | Phân hệ |
|---|---|---|
| Sprint 01 | SaaS Foundation: multi-tenant, auth, System Admin cơ bản | System Administration |
| Sprint 02 | System Admin nâng cao: phân quyền, danh mục, audit log, AI quản trị | System Administration |

### Giai đoạn 2: Quản lý Nhân sự (Sprint 03–04)
| Sprint | Mục tiêu | Phân hệ |
|---|---|---|
| Sprint 03 | HR cơ bản: tuyển dụng, hồ sơ nhân viên, hợp đồng | HR |
| Sprint 04 | HR vận hành: chấm công, nghỉ phép, đánh giá KPI | HR |

### Giai đoạn 3: Bán hàng và Kho vận (Sprint 05–08)
| Sprint | Mục tiêu | Phân hệ |
|---|---|---|
| Sprint 05 | Sản phẩm & Khách hàng: danh mục, CRM cơ bản | Sale & Logistics |
| Sprint 06 | Bán hàng & Đơn hàng: báo giá, hợp đồng, workflow | Sale & Logistics |
| Sprint 07 | Kho & Mua hàng: quản lý kho, nhập/xuất, nhà cung cấp | Sale & Logistics |
| Sprint 08 | Vận chuyển & KPI: giao hàng, tracking, COD, KPI | Sale & Logistics |

### Giai đoạn 4: Điều hành Nội bộ (Sprint 09–10)
| Sprint | Mục tiêu | Phân hệ |
|---|---|---|
| Sprint 09 | Công việc & Văn bản: giao việc, workflow, ONLYOFFICE | Office |
| Sprint 10 | Cộng tác & Họp: Jitsi Meet, chat, thông báo | Office |

### Giai đoạn 5: Tài chính (Sprint 11–12)
| Sprint | Mục tiêu | Phân hệ |
|---|---|---|
| Sprint 11 | Kế toán cơ bản: hạch toán, công nợ, thu chi | Accounting |
| Sprint 12 | Tích hợp & Báo cáo: hóa đơn điện tử, MISA, eTax | Accounting |

### Giai đoạn 6: AI và Hoàn thiện (Sprint 13–14)
| Sprint | Mục tiêu | Phân hệ |
|---|---|---|
| Sprint 13 | AI Agent trung tâm: tích hợp toàn hệ thống | AI Agent |
| Sprint 14 | Dashboard & Polish: điều hành, tối ưu, security audit | Dashboard |

---

## 9. Tiêu chí thành công

### 9.1 KPIs sản phẩm

| KPI | Mục tiêu 6 tháng | Mục tiêu 12 tháng |
|---|---|---|
| Số tenant đang hoạt động | 50 | 200 |
| Tỷ lệ chuyển đổi trial → trả phí | > 20% | > 30% |
| Tỷ lệ giữ chân (monthly retention) | > 85% | > 90% |
| NPS (Net Promoter Score) | > 30 | > 50 |
| Thời gian onboarding trung bình | < 2 giờ | < 1 giờ |
| API uptime | 99.5% | 99.9% |

### 9.2 Định nghĩa Done (Definition of Done)

**Cho mỗi User Story:**
- [ ] Tất cả Acceptance Criteria đã pass
- [ ] Unit test coverage ≥ 80%
- [ ] Integration test pass
- [ ] Code review được approve
- [ ] Không có bug Critical/Major chưa xử lý
- [ ] Tài liệu API cập nhật
- [ ] Multi-tenancy isolation đã được kiểm thử

**Cho mỗi Sprint:**
- [ ] Tất cả planned User Stories đạt Definition of Done
- [ ] Performance test không vượt ngưỡng
- [ ] Security scan không phát hiện lỗ hổng Critical
- [ ] QA sign-off
- [ ] Demo và Product Owner acceptance
