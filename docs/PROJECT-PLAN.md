# Kế hoạch dự án: Open ERP — Nền tảng SaaS Quản trị và Vận hành Doanh nghiệp

## Tổng quan

| Thuộc tính | Nội dung |
|---|---|
| **Tên dự án** | Open ERP — SaaS Enterprise Management Platform |
| **Mục tiêu** | Xây dựng nền tảng SaaS tích hợp AI Agent phục vụ quản trị, vận hành và điều hành doanh nghiệp |
| **Đối tượng** | Doanh nghiệp vừa và nhỏ (SMB), doanh nghiệp lớn tại Việt Nam |
| **Nền tảng** | Web (Angular), Mobile (Ionic Angular) |
| **Mô hình triển khai** | SaaS multi-tenant |
| **Ngày bắt đầu** | 09/05/2026 |

## Kiến trúc tổng quan

| Thành phần | Công nghệ |
|---|---|
| Backend | NestJS (Microservices — giao tiếp qua message broker) |
| Web Frontend | Angular 21+ |
| Mobile | Ionic Angular 8 (Capacitor 6) |
| Database | MongoDB (multi-tenant, schema per-tenant) |
| Message Broker | RabbitMQ / Redis Pub/Sub |
| API Gateway | NestJS API Gateway |
| Auth | JWT + OAuth2 (multi-tenant) |
| Storage | MinIO / S3-compatible |
| Real-time | WebSocket / Socket.IO |
| Tích hợp | ONLYOFFICE, Jitsi Meet, MISA, eTax, e-Invoice providers |
| AI Agent | LangChain / OpenAI API / Local LLM |

## Các phân hệ chính

| # | Phân hệ | Mô tả |
|---|---|---|
| 1 | **System Administration** | Quản trị SaaS: doanh nghiệp, người dùng, phân quyền, danh mục, audit log |
| 2 | **Sale & Logistics** | Bán hàng, đơn hàng, kho vận, mua hàng, giao hàng, KPI |
| 3 | **HR** | Tuyển dụng, quản lý nhân sự, chấm công, đánh giá |
| 4 | **Office** | Công việc, văn bản, ONLYOFFICE, họp Jitsi, chat nội bộ |
| 5 | **Accounting** | Kế toán, công nợ, hóa đơn điện tử, tích hợp MISA, eTax |
| 6 | **AI Agent** | Trung tâm AI Agent điều phối nghiệp vụ toàn hệ thống |
| 7 | **Dashboard** | Dashboard điều hành tổng thể, KPI realtime |

## Kế hoạch Sprint

| Sprint | Phân hệ | Mục tiêu chính | Trạng thái |
|---|---|---|---|
| **Sprint 01** | SaaS Foundation | Nền tảng multi-tenant, Auth, System Admin cơ bản | ⬜ Chưa bắt đầu |
| **Sprint 02** | System Admin nâng cao | Phân quyền, danh mục động, audit log, AI Agent quản trị | ⬜ Chưa bắt đầu |
| **Sprint 03** | HR — Nhân sự cơ bản | Tuyển dụng, hồ sơ nhân viên, hợp đồng | ⬜ Chưa bắt đầu |
| **Sprint 04** | HR — Vận hành nhân sự | Chấm công, nghỉ phép, đánh giá KPI | ⬜ Chưa bắt đầu |
| **Sprint 05** | Sale — Sản phẩm & Khách hàng | Danh mục sản phẩm, quản lý khách hàng, lead | ⬜ Chưa bắt đầu |
| **Sprint 06** | Sale — Bán hàng & Đơn hàng | Đơn bán, báo giá, hợp đồng, workflow đơn hàng | ⬜ Chưa bắt đầu |
| **Sprint 07** | Logistics — Kho & Mua hàng | Quản lý kho, nhập/xuất tồn, mua hàng, nhà cung cấp | ⬜ Chưa bắt đầu |
| **Sprint 08** | Logistics — Vận chuyển & KPI | Giao hàng, tracking, COD, KPI vận hành | ⬜ Chưa bắt đầu |
| **Sprint 09** | Office — Công việc & Văn bản | Giao việc, workflow, văn bản, ONLYOFFICE | ⬜ Chưa bắt đầu |
| **Sprint 10** | Office — Cộng tác & Họp | Jitsi Meet, chat nội bộ, thông báo, dashboard | ⬜ Chưa bắt đầu |
| **Sprint 11** | Accounting — Kế toán cơ bản | Hạch toán, công nợ, thu chi, dòng tiền | ⬜ Chưa bắt đầu |
| **Sprint 12** | Accounting — Tích hợp & Báo cáo | Hóa đơn điện tử, MISA, eTax, báo cáo tài chính | ⬜ Chưa bắt đầu |
| **Sprint 13** | AI Agent trung tâm | Tích hợp AI Agent toàn hệ thống, workflow tự động | ⬜ Chưa bắt đầu |
| **Sprint 14** | Dashboard & Polish | Dashboard điều hành, tối ưu hiệu năng, security audit | ⬜ Chưa bắt đầu |

## Các giai đoạn tài liệu hóa

| Giai đoạn | Agent thực hiện | Trạng thái | Đầu ra |
|---|---|---|---|
| 1. Phân tích yêu cầu | Product Owner | � Hoàn thành | `docs/prd/`, `docs/user-stories/` |
| 2. Đặc tả kỹ thuật | Business Analyst | 🟢 Hoàn thành | `docs/srs/` |
| 3. Kiến trúc & task kỹ thuật | Technical Leader | 🟢 Hoàn thành | `docs/architecture/`, `docs/tasks/` |
| 4. Triển khai | Backend + Frontend + DevOps | ⬜ Chưa bắt đầu | Source code |
| 5. Kiểm thử | Senior QA | ⬜ Chưa bắt đầu | `docs/testcases/`, `docs/evidence/` |

## Cổng kiểm soát chất lượng (Quality Gates)

- **Giai đoạn 1 → 2**: PRD được xác nhận, user story đủ cho ít nhất Sprint 01–02
- **Giai đoạn 2 → 3**: SRS có đủ feature specs, flow, data model & validation cho tất cả phân hệ
- **Giai đoạn 3 → 4**: TASK-INDEX đa cấp đầy đủ, mỗi task 1 file riêng, thiết kế DB/API/tech stack rõ ràng
- **Giai đoạn 4 → 5**: Tất cả task sprint có trạng thái 🟡 REVIEW
- **Hoàn thành**: Không còn bug Critical/Major, QA xác nhận đủ điều kiện release

## Cấu trúc thư mục tài liệu

```
docs/
├── PROJECT-PLAN.md                  ← File này
├── request/                         ← Yêu cầu gốc
├── prd/                             ← Product Requirements Document
│   ├── PRD-OVERVIEW.md
│   └── modules/
├── user-stories/                    ← User Stories theo phân hệ
├── srs/                             ← Software Requirements Specification
│   └── modules/
├── architecture/                    ← Kiến trúc hệ thống
│   ├── SYSTEM-ARCHITECTURE.md
│   ├── SAAS-MULTITENANCY.md
│   ├── DATABASE-DESIGN.md
│   ├── API-DESIGN.md
│   ├── MICROSERVICE-MAP.md
│   └── INTEGRATION-DESIGN.md
├── tasks/                           ← Task breakdown
│   ├── TASK-INDEX.md
│   └── sprints/
│       ├── SPRINT-01/
│       ├── SPRINT-02/
│       └── ...
├── testcases/                       ← Test cases
└── evidence/                        ← Test evidence
```

## Rủi ro và giảm thiểu

| Rủi ro | Mức độ | Giảm thiểu |
|---|---|---|
| Tích hợp MISA/eTax phức tạp | Cao | Thiết kế adapter pattern, có cơ chế fallback |
| Multi-tenancy data isolation | Cao | Thiết kế tenant-aware từ đầu, index composite có tenantId |
| AI Agent latency | Trung bình | Xử lý async, queue-based, streaming response |
| ONLYOFFICE/Jitsi self-hosted | Trung bình | Tài liệu hóa deployment, Docker Compose sẵn sàng |
| Hiệu năng MongoDB với lượng lớn | Trung bình | Sharding strategy, index optimization từ thiết kế |
