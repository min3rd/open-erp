# TASK-INDEX — Open ERP SaaS

Bảng theo dõi tổng hợp tất cả task trên toàn bộ dự án.

> Quy chiếu bắt buộc cho FE agent (open-erp-web): áp dụng mặc định cho mọi tác vụ frontend, không lặp lại ở từng task; FE agent phải đọc và tuân thủ file rule tại `open-erp-web/.github/copilot-instructions.md` trước khi implement.

## Tổng quan tiến độ theo Sprint

| Sprint    | Tên                                    | Tổng Task | Tổng SP | TODO | IN PROGRESS | REVIEW | DONE | BLOCKED |
|-----------|----------------------------------------|-----------|---------|------|-------------|--------|------|---------|
| Sprint 01 | Foundation & Authentication            | 14        | 82 SP   | 14   | 0           | 0      | 0    | 0       |
| Sprint 02 | System Administration & Platform Core  | 14        | 87 SP   | 14   | 0           | 0      | 0    | 0       |
| Sprint 03 | HR Module Core                         | TBD       | TBD     | —    | —           | —      | —    | —       |
| Sprint 04 | Sale & Logistics Core                  | TBD       | TBD     | —    | —           | —      | —    | —       |
| Sprint 05 | Accounting Module                      | TBD       | TBD     | —    | —           | —      | —    | —       |
| Sprint 06 | Office & Meeting Module                | TBD       | TBD     | —    | —           | —      | —    | —       |
| Sprint 07 | Dashboard & Reporting                  | TBD       | TBD     | —    | —           | —      | —    | —       |
| Sprint 08+ | AI Agent nâng cao & Tối ưu hóa       | TBD       | TBD     | —    | —           | —      | —    | —       |
| **Tổng**  |                                        | **28**    | **169 SP** | **28** | **0**   | **0**  | **0**| **0**   |

---

## Sprint 01 — Foundation & Authentication (14 tasks / 82 SP)

| Task ID                          | Tiêu đề                                          | Cluster    | Loại     | SP | Trạng thái | Phụ thuộc                               | File task |
|----------------------------------|--------------------------------------------------|------------|----------|----|------------|-----------------------------------------|-----------|
| TASK-SPRINT-01-FOUNDATION-001    | Docker Compose — Hạ tầng local dev               | foundation | DevOps   | 5  | ⬜ TODO    | —                                       | [Link](sprints/SPRINT-01/foundation/TASK-SPRINT-01-FOUNDATION-001-docker-compose-setup.md) |
| TASK-SPRINT-01-FOUNDATION-002    | API Gateway Service                              | foundation | Backend  | 8  | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-001           | [Link](sprints/SPRINT-01/foundation/TASK-SPRINT-01-FOUNDATION-002-api-gateway-service.md) |
| TASK-SPRINT-01-FOUNDATION-003    | RabbitMQ & Redis — Shared Library                | foundation | Backend  | 3  | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-001           | [Link](sprints/SPRINT-01/foundation/TASK-SPRINT-01-FOUNDATION-003-rabbitmq-redis-config.md) |
| TASK-SPRINT-01-FOUNDATION-004    | MongoDB — Shared Library & Base Schema           | foundation | Backend  | 3  | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-001           | [Link](sprints/SPRINT-01/foundation/TASK-SPRINT-01-FOUNDATION-004-mongodb-setup.md) |
| TASK-SPRINT-01-AUTH-001          | Auth Service — JWT & Local Auth                  | auth       | Backend  | 8  | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-002, -003, -004 | [Link](sprints/SPRINT-01/auth/TASK-SPRINT-01-AUTH-001-auth-service-jwt.md) |
| TASK-SPRINT-01-AUTH-002          | OAuth2 — Google & Microsoft                      | auth       | Backend  | 5  | ⬜ TODO    | TASK-SPRINT-01-AUTH-001                 | [Link](sprints/SPRINT-01/auth/TASK-SPRINT-01-AUTH-002-oauth2-social.md) |
| TASK-SPRINT-01-AUTH-003          | Multi-Factor Authentication (TOTP)               | auth       | Backend  | 5  | ⬜ TODO    | TASK-SPRINT-01-AUTH-001                 | [Link](sprints/SPRINT-01/auth/TASK-SPRINT-01-AUTH-003-mfa.md) |
| TASK-SPRINT-01-TENANT-001        | Tenant Service — Quản lý tenant & Tự đăng ký MST   | tenant     | Backend  | 8  | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-002, -003, -004 | [Link](sprints/SPRINT-01/tenant/TASK-SPRINT-01-TENANT-001-tenant-service.md) |
| TASK-SPRINT-01-TENANT-002        | Subscription & Quota Management                  | tenant     | Backend  | 5  | ⬜ TODO    | TASK-SPRINT-01-TENANT-001               | [Link](sprints/SPRINT-01/tenant/TASK-SPRINT-01-TENANT-002-subscription-quota.md) |
| TASK-SPRINT-01-USER-001          | User Service — CRUD & Department Management      | user       | Backend  | 8  | ⬜ TODO    | TASK-SPRINT-01-TENANT-001               | [Link](sprints/SPRINT-01/user/TASK-SPRINT-01-USER-001-user-service.md) |
| TASK-SPRINT-01-USER-002          | RBAC Service — Role & Permission Management      | user       | Backend  | 8  | ⬜ TODO    | TASK-SPRINT-01-USER-001                 | [Link](sprints/SPRINT-01/user/TASK-SPRINT-01-USER-002-rbac-service.md) |
| TASK-SPRINT-01-FRONTEND-001      | Angular Web — Auth UI + Đăng ký DN với Activation Email Link (Angular 21) (AC: Light/Dark mode + persistence openErp.colorMode) | frontend   | Frontend | 8  | ⬜ TODO    | TASK-SPRINT-01-AUTH-001, -002, -003     | [Link](sprints/SPRINT-01/frontend/TASK-SPRINT-01-FRONTEND-001-angular-auth-ui.md) |
| TASK-SPRINT-01-FRONTEND-002      | Angular Web — Tenant Admin Shell & User Mgmt UI (AC: Light/Dark mode + persistence openErp.colorMode)  | frontend   | Frontend | 8  | ⬜ TODO    | TASK-SPRINT-01-USER-001, -002           | [Link](sprints/SPRINT-01/frontend/TASK-SPRINT-01-FRONTEND-002-tenant-admin-ui.md) |

> **Lưu ý:** Sprint 01 có 14 tasks trong danh sách index nhưng tổng task file là 13 (TASK-SPRINT-01-FOUNDATION-001 đến FRONTEND-002). File index sprint có đủ 14 entries — xem chi tiết tại [Sprint 01 TASK-INDEX](sprints/SPRINT-01/TASK-INDEX.md).

---

## Sprint 02 — System Administration & Platform Core (14 tasks / 87 SP)

| Task ID                          | Tiêu đề                                              | Cluster       | Loại     | SP | Trạng thái | Phụ thuộc                                                              | File task |
|----------------------------------|------------------------------------------------------|---------------|----------|----|------------|-------------------------------------------------------------------------|-----------|
| TASK-SPRINT-02-SYSTEM_ADMIN-001  | RBAC nâng cao — CASL Policy Engine                   | system-admin  | Backend  | 8  | ⬜ TODO    | TASK-SPRINT-01-USER-002                                                | [Link](sprints/SPRINT-02/system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-001-advanced-rbac.md) |
| TASK-SPRINT-02-SYSTEM_ADMIN-002  | Audit Log Service                                    | system-admin  | Backend  | 5  | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-003                                          | [Link](sprints/SPRINT-02/system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-002-audit-log.md) |
| TASK-SPRINT-02-SYSTEM_ADMIN-003  | Catalog Service                                      | system-admin  | Backend  | 5  | ⬜ TODO    | TASK-SPRINT-01-TENANT-001                                              | [Link](sprints/SPRINT-02/system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-003-catalog-service.md) |
| TASK-SPRINT-02-SYSTEM_ADMIN-004  | Dynamic Forms Engine                                 | system-admin  | Backend  | 8  | ⬜ TODO    | TASK-SPRINT-02-SYSTEM_ADMIN-003                                        | [Link](sprints/SPRINT-02/system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-004-dynamic-forms.md) |
| TASK-SPRINT-02-SYSTEM_ADMIN-005  | Org Chart & Vị trí công việc                         | system-admin  | Backend  | 3  | ⬜ TODO    | TASK-SPRINT-01-USER-001                                                | [Link](sprints/SPRINT-02/system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-005-org-chart.md) |
| TASK-SPRINT-02-SYSTEM_ADMIN-006  | Notification Service (In-App, Email, Push)           | system-admin  | Backend  | 8  | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-003, TASK-SPRINT-01-USER-001                 | [Link](sprints/SPRINT-02/system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-006-notification-service.md) |
| TASK-SPRINT-02-SYSTEM_ADMIN-007  | Subscription nâng cao — Quản lý gói dịch vụ         | system-admin  | Backend  | 5  | ⬜ TODO    | TASK-SPRINT-01-TENANT-002                                              | [Link](sprints/SPRINT-02/system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-007-subscription-management.md) |
| TASK-SPRINT-02-SYSTEM_ADMIN-008  | Chuẩn hóa contract i18n message key + metadata      | system-admin  | Backend  | 5  | ⬜ TODO    | TASK-SPRINT-01-AUTH-001, TASK-SPRINT-01-TENANT-001, TASK-SPRINT-02-SYSTEM_ADMIN-006 | [Link](sprints/SPRINT-02/system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-008-i18n-message-key-metadata-contract.md) |
| TASK-SPRINT-02-FRONTEND-001      | Angular Web — RBAC UI nâng cao (AC: Light/Dark mode + persistence openErp.colorMode)                       | frontend      | Frontend | 8  | ⬜ TODO    | TASK-SPRINT-01-FRONTEND-002, TASK-SPRINT-02-SYSTEM_ADMIN-001           | [Link](sprints/SPRINT-02/frontend/TASK-SPRINT-02-FRONTEND-001-rbac-ui.md) |
| TASK-SPRINT-02-FRONTEND-002      | Angular Web — Audit Log UI (AC: Light/Dark mode + persistence openErp.colorMode)                           | frontend      | Frontend | 3  | ⬜ TODO    | TASK-SPRINT-01-FRONTEND-002, TASK-SPRINT-02-SYSTEM_ADMIN-002           | [Link](sprints/SPRINT-02/frontend/TASK-SPRINT-02-FRONTEND-002-audit-log-ui.md) |
| TASK-SPRINT-02-FRONTEND-003      | Angular Web — Catalog và Dynamic Form Builder UI (AC: Light/Dark mode + persistence openErp.colorMode)     | frontend      | Frontend | 8  | ⬜ TODO    | TASK-SPRINT-01-FRONTEND-002, TASK-SPRINT-02-SYSTEM_ADMIN-003, -004     | [Link](sprints/SPRINT-02/frontend/TASK-SPRINT-02-FRONTEND-003-catalog-dynamic-form-ui.md) |
| TASK-SPRINT-02-FRONTEND-004      | Thư viện UI dùng chung cho Web + Mobile             | frontend      | Frontend | 8  | ⬜ TODO    | TASK-SPRINT-01-FRONTEND-001, TASK-SPRINT-02-MOBILE-001                 | [Link](sprints/SPRINT-02/frontend/TASK-SPRINT-02-FRONTEND-004-shared-ui-library-web-mobile.md) |
| TASK-SPRINT-02-MOBILE-001        | Ionic Angular — Thiết lập mobile và màn hình Auth (AC: Light/Dark mode + persistence openErp.colorMode)   | mobile        | Mobile   | 8  | ⬜ TODO    | TASK-SPRINT-01-AUTH-001                                                | [Link](sprints/SPRINT-02/mobile/TASK-SPRINT-02-MOBILE-001-ionic-auth-setup.md) |
| TASK-SPRINT-02-AI-001            | AI Agent — Phát hiện bất thường & gợi ý phân quyền  | ai            | Backend  | 5  | ⬜ TODO    | TASK-SPRINT-02-SYSTEM_ADMIN-002, TASK-SPRINT-01-USER-002               | [Link](sprints/SPRINT-02/ai/TASK-SPRINT-02-AI-001-ai-anomaly-detection.md) |

---

## Thống kê theo loại công việc

| Loại     | Tổng Task | Tổng SP |
|----------|-----------|---------|
| Backend  | 18        | 115 SP  |
| Frontend | 6         | 43 SP   |
| Mobile   | 1         | 8 SP    |
| DevOps   | 1         | 5 SP    |
| Testing  | 0         | 0       |
| **Tổng** | **28**    | **169 SP** |

---

## Links tài liệu liên quan

- [Sprint 01 TASK-INDEX](sprints/SPRINT-01/TASK-INDEX.md)
- [Sprint 02 TASK-INDEX](sprints/SPRINT-02/TASK-INDEX.md)
- [Kiến trúc hệ thống](../architecture/SYSTEM-ARCHITECTURE.md)
- [Microservice Map](../architecture/MICROSERVICE-MAP.md)
- [API Design](../architecture/API-DESIGN.md)
- [Database Design](../architecture/DATABASE-DESIGN.md)
- [SaaS Multi-tenancy](../architecture/SAAS-MULTITENANCY.md)
