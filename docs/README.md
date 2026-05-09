# Mục lục Tài liệu Sản phẩm — Open ERP
# Nền tảng SaaS Quản trị và Vận hành Doanh nghiệp

**Ngày cập nhật:** 09/05/2026  
**Giai đoạn hiện tại:** Thiết kế UI/UX (UI/UX Designer)

---

## Tài liệu Thiết kế (Design)

### Design System & Guidelines
| Tài liệu | Mô tả | Trạng thái |
|---|---|---|
| [DESIGN-SYSTEM.md](design/DESIGN-SYSTEM.md) | Design System chính thức: màu sắc, typography, spacing, components đầy đủ | ✅ Hoàn thành |
| [SCREEN-SPECS.md](design/SCREEN-SPECS.md) | Screen Specs Sprint 01–02: Auth, Onboarding, System Admin (11 màn hình) | ✅ Hoàn thành |
| [FRONTEND-GUIDELINES.md](design/FRONTEND-GUIDELINES.md) | Hướng dẫn bắt buộc cho Angular 21 Web và Ionic 8 Mobile | ✅ Hoàn thành |

---

## Tài liệu Yêu cầu Sản phẩm (PRD)

### Tổng quan
- [PRD-OVERVIEW — Tổng quan sản phẩm, mục tiêu, phạm vi, lộ trình](prd/PRD-OVERVIEW.md)

### PRD từng phân hệ

| Phân hệ | File PRD | Sprint | Trạng thái |
|---|---|---|---|
| System Administration | [system-administration.md](prd/modules/system-administration.md) | Sprint 01–02 | ✅ Hoàn thành |
| Sale & Logistics | [sale-logistics.md](prd/modules/sale-logistics.md) | Sprint 05–08 | ✅ Hoàn thành |
| HR | [hr.md](prd/modules/hr.md) | Sprint 03–04 | ✅ Hoàn thành |
| Office | [office.md](prd/modules/office.md) | Sprint 09–10 | ✅ Hoàn thành |
| Accounting | [accounting.md](prd/modules/accounting.md) | Sprint 11–12 | ✅ Hoàn thành |
| AI Agent | [ai-agent.md](prd/modules/ai-agent.md) | Sprint 13 | ✅ Hoàn thành |
| Dashboard | [dashboard.md](prd/modules/dashboard.md) | Sprint 14 | ✅ Hoàn thành |

---

## User Stories

### Index tổng hợp
- [USER-STORY-INDEX.md — Toàn bộ danh sách User Stories](user-stories/USER-STORY-INDEX.md)

### User Stories theo phân hệ

#### System Administration (Sprint 01–02) — 24 US / 116 SP

| US ID | Tiêu đề | Sprint | Ưu tiên |
|---|---|---|---|
| [US-SA-001](user-stories/system-administration/US-SA-001.md) | Đăng ký Tenant mới | Sprint 01 | Cao |
| [US-SA-002](user-stories/system-administration/US-SA-002.md) | Quản lý trạng thái Tenant | Sprint 01 | Cao |
| [US-SA-003](user-stories/system-administration/US-SA-003.md) | Đăng nhập email/mật khẩu | Sprint 01 | Cao |
| [US-SA-004](user-stories/system-administration/US-SA-004.md) | Refresh token và duy trì phiên | Sprint 01 | Cao |
| [US-SA-005](user-stories/system-administration/US-SA-005.md) | Quên mật khẩu | Sprint 01 | Cao |
| [US-SA-006](user-stories/system-administration/US-SA-006.md) | Onboarding Wizard | Sprint 01 | Cao |
| [US-SA-007](user-stories/system-administration/US-SA-007.md) | Quản lý người dùng | Sprint 01 | Cao |
| [US-SA-008](user-stories/system-administration/US-SA-008.md) | Cơ cấu tổ chức | Sprint 01 | Cao |
| [US-SA-009](user-stories/system-administration/US-SA-009.md) | Quản lý Role (RBAC) | Sprint 02 | Cao |
| [US-SA-010](user-stories/system-administration/US-SA-010.md) | Gán quyền người dùng | Sprint 02 | Cao |
| [US-SA-011](user-stories/system-administration/US-SA-011.md) | Audit Log | Sprint 02 | Cao |
| [US-SA-012](user-stories/system-administration/US-SA-012.md) | Danh mục dùng chung | Sprint 02 | Cao |
| [US-SA-013](user-stories/system-administration/US-SA-013.md) | Xác thực hai yếu tố (MFA) | Sprint 02 | Trung bình |
| [US-SA-014](user-stories/system-administration/US-SA-014.md) | Quản lý phiên đăng nhập | Sprint 02 | Trung bình |
| [US-SA-015](user-stories/system-administration/US-SA-015.md) | AI phát hiện hành vi bất thường | Sprint 02 | Trung bình |
| [US-SA-016](user-stories/system-administration/US-SA-016.md) | AI gợi ý phân quyền | Sprint 02 | Thấp |
| [US-SA-017](user-stories/system-administration/US-SA-017.md) | Hồ sơ cá nhân | Sprint 01 | Cao |
| [US-SA-018](user-stories/system-administration/US-SA-018.md) | Chính sách mật khẩu | Sprint 02 | Trung bình |
| [US-SA-019](user-stories/system-administration/US-SA-019.md) | Quota và gói dịch vụ | Sprint 01 | Cao |
| [US-SA-020](user-stories/system-administration/US-SA-020.md) | Đăng nhập OAuth2 | Sprint 02 | Trung bình |
| [US-SA-021](user-stories/system-administration/US-SA-021.md) | Cấu hình thông báo | Sprint 02 | Trung bình |
| [US-SA-022](user-stories/system-administration/US-SA-022.md) | Phân quyền dữ liệu theo phòng ban | Sprint 02 | Cao |
| [US-SA-023](user-stories/system-administration/US-SA-023.md) | Platform monitoring | Sprint 02 | Trung bình |
| [US-SA-024](user-stories/system-administration/US-SA-024.md) | Biểu mẫu động | Sprint 02 | Trung bình |

*User Stories cho các phân hệ khác (HR, Sale, Office, Accounting, AI Agent, Dashboard) sẽ được tạo trong giai đoạn tiếp theo.*

---

## Tài liệu gốc (Request)

- [01. Tổng quan hệ thống](request/01.%20Tổng%20quan%20hệ%20thống.md) — Yêu cầu nghiệp vụ đầy đủ

---

## Kế hoạch dự án

- [PROJECT-PLAN.md](PROJECT-PLAN.md) — Kế hoạch tổng thể, kiến trúc, các giai đoạn

---

## Đặc tả Yêu cầu Phần mềm (SRS)

### Tổng quan SRS
- [SRS-OVERVIEW — Tổng quan kiến trúc, NFR, ràng buộc, giả định](srs/SRS-OVERVIEW.md)

### SRS từng phân hệ

| Phân hệ | File SRS | Sprint | Trạng thái |
|---|---|---|---|
| System Administration | [system-administration.md](srs/modules/system-administration.md) | Sprint 01–02 | ✅ Hoàn thành |
| HR | [hr.md](srs/modules/hr.md) | Sprint 03–04 | ✅ Hoàn thành |
| Sale & Logistics | [sale-logistics.md](srs/modules/sale-logistics.md) | Sprint 05–08 | ✅ Hoàn thành |
| Office | [office.md](srs/modules/office.md) | Sprint 09–10 | ✅ Hoàn thành |
| Accounting | [accounting.md](srs/modules/accounting.md) | Sprint 11–12 | ✅ Hoàn thành |
| AI Agent | [ai-agent.md](srs/modules/ai-agent.md) | Sprint 13 | ✅ Hoàn thành |
| Dashboard | [dashboard.md](srs/modules/dashboard.md) | Sprint 14 | ✅ Hoàn thành |

---

## Tài liệu Kiến trúc Kỹ thuật (Technical Architecture)

### Tài liệu tổng quan kiến trúc

| Tài liệu | Mô tả | Trạng thái |
|---|---|---|
| [SYSTEM-ARCHITECTURE.md](architecture/SYSTEM-ARCHITECTURE.md) | Kiến trúc tổng thể, 20 microservices, sơ đồ hệ thống, ADR, tech stack | ✅ Hoàn thành |
| [SAAS-MULTITENANCY.md](architecture/SAAS-MULTITENANCY.md) | Chiến lược multi-tenancy, TenantMiddleware, onboarding, quota | ✅ Hoàn thành |
| [DATABASE-DESIGN.md](architecture/DATABASE-DESIGN.md) | Schema MongoDB toàn bộ phân hệ, index strategy | ✅ Hoàn thành |
| [MICROSERVICE-MAP.md](architecture/MICROSERVICE-MAP.md) | Bản đồ 20 services, RabbitMQ exchanges, Event Catalog, startup order | ✅ Hoàn thành |
| [API-DESIGN.md](architecture/API-DESIGN.md) | Chuẩn REST API, auth headers, response format, endpoint Sprint 01 | ✅ Hoàn thành |
| [INTEGRATION-DESIGN.md](architecture/INTEGRATION-DESIGN.md) | Tích hợp ONLYOFFICE, Jitsi, MISA AMIS, eTax, hóa đơn điện tử | ✅ Hoàn thành |

---

## Tài liệu Kỹ thuật — Task Breakdown

### Bảng theo dõi tổng hợp
- [TASK-INDEX.md — Tất cả task theo sprint](tasks/TASK-INDEX.md)

### Task Index theo Sprint
- [Sprint 01 TASK-INDEX](tasks/sprints/SPRINT-01/TASK-INDEX.md) — Foundation & Authentication (14 tasks / 81 SP)
- [Sprint 02 TASK-INDEX](tasks/sprints/SPRINT-02/TASK-INDEX.md) — System Administration & Platform Core (12 tasks / 74 SP)

Ghi chú cập nhật 09/05/2026: 6 task FE/Mobile (TASK-SPRINT-01-FRONTEND-001, TASK-SPRINT-01-FRONTEND-002, TASK-SPRINT-02-FRONTEND-001, TASK-SPRINT-02-FRONTEND-002, TASK-SPRINT-02-FRONTEND-003, TASK-SPRINT-02-MOBILE-001) đã bổ sung AC hỗ trợ Light/Dark mode và lưu lựa chọn tại openErp.colorMode.

Ghi chú cập nhật 09/05/2026: các task Frontend Sprint 01-02 và task phối hợp backend i18n contract tuân thủ rule Angular 21 Best Practices được định nghĩa tại cấp agent.

### Task chi tiết — Sprint 01

#### Foundation (4 tasks)
- [TASK-SPRINT-01-FOUNDATION-001](tasks/sprints/SPRINT-01/foundation/TASK-SPRINT-01-FOUNDATION-001-docker-compose-setup.md) — Docker Compose Hạ tầng Local Dev
- [TASK-SPRINT-01-FOUNDATION-002](tasks/sprints/SPRINT-01/foundation/TASK-SPRINT-01-FOUNDATION-002-api-gateway-service.md) — API Gateway Service
- [TASK-SPRINT-01-FOUNDATION-003](tasks/sprints/SPRINT-01/foundation/TASK-SPRINT-01-FOUNDATION-003-rabbitmq-redis-config.md) — RabbitMQ & Redis Shared Library
- [TASK-SPRINT-01-FOUNDATION-004](tasks/sprints/SPRINT-01/foundation/TASK-SPRINT-01-FOUNDATION-004-mongodb-setup.md) — MongoDB Shared Library & Base Schema

#### Auth (3 tasks)
- [TASK-SPRINT-01-AUTH-001](tasks/sprints/SPRINT-01/auth/TASK-SPRINT-01-AUTH-001-auth-service-jwt.md) — Auth Service JWT & Local Auth
- [TASK-SPRINT-01-AUTH-002](tasks/sprints/SPRINT-01/auth/TASK-SPRINT-01-AUTH-002-oauth2-social.md) — OAuth2 Google & Microsoft
- [TASK-SPRINT-01-AUTH-003](tasks/sprints/SPRINT-01/auth/TASK-SPRINT-01-AUTH-003-mfa.md) — Multi-Factor Authentication (TOTP)

#### Tenant (2 tasks)
- [TASK-SPRINT-01-TENANT-001](tasks/sprints/SPRINT-01/tenant/TASK-SPRINT-01-TENANT-001-tenant-service.md) — Tenant Service
- [TASK-SPRINT-01-TENANT-002](tasks/sprints/SPRINT-01/tenant/TASK-SPRINT-01-TENANT-002-subscription-quota.md) — Subscription & Quota Management

#### User (2 tasks)
- [TASK-SPRINT-01-USER-001](tasks/sprints/SPRINT-01/user/TASK-SPRINT-01-USER-001-user-service.md) — User Service & Department Management
- [TASK-SPRINT-01-USER-002](tasks/sprints/SPRINT-01/user/TASK-SPRINT-01-USER-002-rbac-service.md) — RBAC Service

#### Frontend (2 tasks)
- [TASK-SPRINT-01-FRONTEND-001](tasks/sprints/SPRINT-01/frontend/TASK-SPRINT-01-FRONTEND-001-angular-auth-ui.md) — Angular Web Auth UI
- [TASK-SPRINT-01-FRONTEND-002](tasks/sprints/SPRINT-01/frontend/TASK-SPRINT-01-FRONTEND-002-tenant-admin-ui.md) — Angular Web Tenant Admin Shell UI

### Task chi tiết — Sprint 02

#### System Admin (7 tasks)
- [TASK-SPRINT-02-SYSTEM_ADMIN-001](tasks/sprints/SPRINT-02/system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-001-advanced-rbac.md) — RBAC nâng cao CASL Policy Engine
- [TASK-SPRINT-02-SYSTEM_ADMIN-002](tasks/sprints/SPRINT-02/system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-002-audit-log.md) — Audit Log Service
- [TASK-SPRINT-02-SYSTEM_ADMIN-003](tasks/sprints/SPRINT-02/system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-003-catalog-service.md) — Catalog Service
- [TASK-SPRINT-02-SYSTEM_ADMIN-004](tasks/sprints/SPRINT-02/system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-004-dynamic-forms.md) — Dynamic Forms Engine
- [TASK-SPRINT-02-SYSTEM_ADMIN-005](tasks/sprints/SPRINT-02/system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-005-org-chart.md) — Org Chart & Vị trí công việc
- [TASK-SPRINT-02-SYSTEM_ADMIN-006](tasks/sprints/SPRINT-02/system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-006-notification-service.md) — Notification Service (In-App, Email, Push)
- [TASK-SPRINT-02-SYSTEM_ADMIN-007](tasks/sprints/SPRINT-02/system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-007-subscription-management.md) — Subscription nâng cao

#### Frontend (3 tasks)
- [TASK-SPRINT-02-FRONTEND-001](tasks/sprints/SPRINT-02/frontend/TASK-SPRINT-02-FRONTEND-001-rbac-ui.md) — Angular Web RBAC UI nâng cao
- [TASK-SPRINT-02-FRONTEND-002](tasks/sprints/SPRINT-02/frontend/TASK-SPRINT-02-FRONTEND-002-audit-log-ui.md) — Angular Web Audit Log UI
- [TASK-SPRINT-02-FRONTEND-003](tasks/sprints/SPRINT-02/frontend/TASK-SPRINT-02-FRONTEND-003-catalog-dynamic-form-ui.md) — Angular Web Catalog & Dynamic Form Builder UI

#### Mobile (1 task)
- [TASK-SPRINT-02-MOBILE-001](tasks/sprints/SPRINT-02/mobile/TASK-SPRINT-02-MOBILE-001-ionic-auth-setup.md) — Ionic Angular Mobile Auth Setup

#### AI (1 task)
- [TASK-SPRINT-02-AI-001](tasks/sprints/SPRINT-02/ai/TASK-SPRINT-02-AI-001-ai-anomaly-detection.md) — AI Agent Phát hiện bất thường & Gợi ý phân quyền

---

## Tài liệu sắp tạo (Giai đoạn tiếp theo)

| Giai đoạn | Tài liệu | Agent | Trạng thái |
|---|---|---|---|
| Kiến trúc hệ thống | `docs/architecture/` | Technical Leader | ✅ Hoàn thành |
| Phân rã Task Sprint 01-02 | `docs/tasks/` | Technical Leader | ✅ Hoàn thành |
| Phân rã Task Sprint 03+ | `docs/tasks/sprints/SPRINT-03+/` | Technical Leader | ⬜ Chưa bắt đầu |
| Test Cases | `docs/testcases/` | Senior QA | ⬜ Chưa bắt đầu |
