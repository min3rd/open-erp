# TASK-INDEX — Open ERP SaaS

Bảng theo dõi tổng hợp tất cả task trên toàn bộ dự án.

> Quy chiếu bắt buộc cho FE agent (open-erp-web): áp dụng mặc định cho mọi tác vụ frontend, không lặp lại ở từng task.

## Tổng quan tiến độ theo Sprint

| Sprint    | Tên                                    | Tổng Task | Tổng SP | TODO | IN PROGRESS | REVIEW | DONE | BLOCKED |
|-----------|----------------------------------------|-----------|---------|------|-------------|--------|------|---------|
| Sprint 01 | Foundation & Authentication            | 18        | 98 SP   | 18   | 0           | 0      | 0    | 0       |
| Sprint 02 | System Administration & Platform Core  | 14        | 87 SP   | 14   | 0           | 0      | 0    | 0       |
| Sprint 03 | HR Module Core                         | 12        | 76 SP   | 12   | 0           | 0      | 0    | 0       |
| Sprint 04 | Sale & Logistics Core                  | TBD       | TBD     | —    | —           | —      | —    | —       |
| Sprint 05 | Accounting Module                      | TBD       | TBD     | —    | —           | —      | —    | —       |
| Sprint 06 | Office & Meeting Module                | TBD       | TBD     | —    | —           | —      | —    | —       |
| Sprint 07 | Dashboard & Reporting                  | TBD       | TBD     | —    | —           | —      | —    | —       |
| Sprint 08+ | AI Agent nâng cao & Tối ưu hóa       | TBD       | TBD     | —    | —           | —      | —    | —       |
| **Tổng**  |                                        | **44**    | **261 SP** | **44** | **0**   | **0**  | **0**| **0**   |

---

## Sprint 01 — Foundation & Authentication (18 tasks / 98 SP)

| Task ID                          | Tiêu đề                                          | Cluster    | Loại     | SP | Trạng thái | Phụ thuộc                               | File task |
|----------------------------------|--------------------------------------------------|------------|----------|----|------------|-----------------------------------------|-----------|
| TASK-SPRINT-01-FOUNDATION-001    | Docker Compose — Hạ tầng local dev               | foundation | DevOps   | 5  | ⬜ TODO    | —                                       | [Link](sprints/SPRINT-01/foundation/TASK-SPRINT-01-FOUNDATION-001-docker-compose-setup.md) |
| TASK-SPRINT-01-FOUNDATION-002    | API Gateway Service                              | foundation | Backend  | 8  | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-001           | [Link](sprints/SPRINT-01/foundation/TASK-SPRINT-01-FOUNDATION-002-api-gateway-service.md) |
| TASK-SPRINT-01-FOUNDATION-003    | RabbitMQ & Redis — Shared Library                | foundation | Backend  | 3  | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-001           | [Link](sprints/SPRINT-01/foundation/TASK-SPRINT-01-FOUNDATION-003-rabbitmq-redis-config.md) |
| TASK-SPRINT-01-FOUNDATION-004    | MongoDB — Shared Library & Base Schema           | foundation | Backend  | 3  | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-001           | [Link](sprints/SPRINT-01/foundation/TASK-SPRINT-01-FOUNDATION-004-mongodb-setup.md) |
| TASK-SPRINT-01-FOUNDATION-006    | Root Workspace Node Scripts (install/update/format/build) | foundation | DevOps   | 3  | ⬜ TODO    | —                                       | [Link](sprints/SPRINT-01/foundation/TASK-SPRINT-01-FOUNDATION-006-root-workspace-node-scripts.md) |
| TASK-SPRINT-01-FOUNDATION-007    | VS Code Debug Launch Configurations              | foundation | DevOps   | 3  | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-006           | [Link](sprints/SPRINT-01/foundation/TASK-SPRINT-01-FOUNDATION-007-vscode-debug-launch-configs.md) |
| TASK-SPRINT-01-FOUNDATION-008    | Deploy Assets — Docker & Kubernetes              | foundation | DevOps   | 5  | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-001, TASK-SPRINT-01-FOUNDATION-006 | [Link](sprints/SPRINT-01/foundation/TASK-SPRINT-01-FOUNDATION-008-deploy-assets-docker-kubernetes.md) |
| TASK-SPRINT-01-FOUNDATION-009    | Cài đặt trực tiếp Linux/Windows Server           | foundation | DevOps   | 5  | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-006, TASK-SPRINT-01-FOUNDATION-008 | [Link](sprints/SPRINT-01/foundation/TASK-SPRINT-01-FOUNDATION-009-direct-install-linux-windows-server.md) |
| TASK-SPRINT-01-AUTH-001          | Auth Service — JWT & Local Auth                  | auth       | Backend  | 8  | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-002, -003, -004 | [Link](sprints/SPRINT-01/auth/TASK-SPRINT-01-AUTH-001-auth-service-jwt.md) |
| TASK-SPRINT-01-AUTH-002          | OAuth2 — Google & Microsoft                      | auth       | Backend  | 5  | ⬜ TODO    | TASK-SPRINT-01-AUTH-001                 | [Link](sprints/SPRINT-01/auth/TASK-SPRINT-01-AUTH-002-oauth2-social.md) |
| TASK-SPRINT-01-AUTH-003          | Multi-Factor Authentication (TOTP)               | auth       | Backend  | 5  | ⬜ TODO    | TASK-SPRINT-01-AUTH-001                 | [Link](sprints/SPRINT-01/auth/TASK-SPRINT-01-AUTH-003-mfa.md) |
| TASK-SPRINT-01-TENANT-001        | Tenant Service — Quản lý tenant & Tự đăng ký MST   | tenant     | Backend  | 8  | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-002, -003, -004 | [Link](sprints/SPRINT-01/tenant/TASK-SPRINT-01-TENANT-001-tenant-service.md) |
| TASK-SPRINT-01-TENANT-002        | Subscription & Quota Management                  | tenant     | Backend  | 5  | ⬜ TODO    | TASK-SPRINT-01-TENANT-001               | [Link](sprints/SPRINT-01/tenant/TASK-SPRINT-01-TENANT-002-subscription-quota.md) |
| TASK-SPRINT-01-USER-001          | User Service — CRUD & Department Management      | user       | Backend  | 8  | ⬜ TODO    | TASK-SPRINT-01-TENANT-001               | [Link](sprints/SPRINT-01/user/TASK-SPRINT-01-USER-001-user-service.md) |
| TASK-SPRINT-01-USER-002          | RBAC Service — Role & Permission Management      | user       | Backend  | 8  | ⬜ TODO    | TASK-SPRINT-01-USER-001                 | [Link](sprints/SPRINT-01/user/TASK-SPRINT-01-USER-002-rbac-service.md) |
| TASK-SPRINT-01-FRONTEND-001      | Angular Web — Auth UI + Đăng ký DN với Activation Email Link (Angular 21) (AC: Light/Dark mode + persistence openErp.colorMode) | frontend   | Frontend | 8  | ⬜ TODO    | TASK-SPRINT-01-AUTH-001, -002, -003     | [Link](sprints/SPRINT-01/frontend/TASK-SPRINT-01-FRONTEND-001-angular-auth-ui.md) |
| TASK-SPRINT-01-FRONTEND-002      | Angular Web — Tenant Admin Shell & User Mgmt UI (AC: Light/Dark mode + persistence openErp.colorMode)  | frontend   | Frontend | 8  | ⬜ TODO    | TASK-SPRINT-01-USER-001, -002           | [Link](sprints/SPRINT-01/frontend/TASK-SPRINT-01-FRONTEND-002-tenant-admin-ui.md) |

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

## Sprint 03 — HR Module Core (12 tasks / 76 SP)

| Task ID                                | Tiêu đề                                | Cluster        | Loại     | SP | Trạng thái | Phụ thuộc                                                                                                  | File task |
|----------------------------------------|----------------------------------------|----------------|----------|----|------------|------------------------------------------------------------------------------------------------------------|-----------|
| TASK-SPRINT-03-HR_RECRUITMENT-001      | Job Requisition Service                | hr-recruitment | Backend  | 8  | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-002, TASK-SPRINT-01-FOUNDATION-004, TASK-SPRINT-02-SYSTEM_ADMIN-005           | [Link](sprints/SPRINT-03/hr-recruitment/TASK-SPRINT-03-HR_RECRUITMENT-001-job-requisition-service.md) |
| TASK-SPRINT-03-HR_RECRUITMENT-002      | Candidate & Interview Pipeline         | hr-recruitment | Backend  | 8  | ⬜ TODO    | TASK-SPRINT-03-HR_RECRUITMENT-001, TASK-SPRINT-02-SYSTEM_ADMIN-006                                        | [Link](sprints/SPRINT-03/hr-recruitment/TASK-SPRINT-03-HR_RECRUITMENT-002-candidate-interview-pipeline.md) |
| TASK-SPRINT-03-HR_RECRUITMENT-003      | Offer & Onboarding Init                | hr-recruitment | Backend  | 5  | ⬜ TODO    | TASK-SPRINT-03-HR_RECRUITMENT-002, TASK-SPRINT-03-HR_EMPLOYEE-001, TASK-SPRINT-01-USER-001               | [Link](sprints/SPRINT-03/hr-recruitment/TASK-SPRINT-03-HR_RECRUITMENT-003-offer-onboarding-init.md) |
| TASK-SPRINT-03-HR_EMPLOYEE-001         | Employee Profile Service               | hr-employee    | Backend  | 8  | ⬜ TODO    | TASK-SPRINT-01-USER-001, TASK-SPRINT-01-FOUNDATION-004, TASK-SPRINT-02-SYSTEM_ADMIN-005                  | [Link](sprints/SPRINT-03/hr-employee/TASK-SPRINT-03-HR_EMPLOYEE-001-employee-profile-service.md) |
| TASK-SPRINT-03-HR_CONTRACT-001         | Employment Contract Lifecycle          | hr-contract    | Backend  | 8  | ⬜ TODO    | TASK-SPRINT-03-HR_EMPLOYEE-001, TASK-SPRINT-02-SYSTEM_ADMIN-006                                           | [Link](sprints/SPRINT-03/hr-contract/TASK-SPRINT-03-HR_CONTRACT-001-employment-contract-lifecycle.md) |
| TASK-SPRINT-03-HR_ORG-001              | HR Structure & Position Mapping        | hr-org         | Backend  | 5  | ⬜ TODO    | TASK-SPRINT-02-SYSTEM_ADMIN-003, TASK-SPRINT-02-SYSTEM_ADMIN-005                                          | [Link](sprints/SPRINT-03/hr-org/TASK-SPRINT-03-HR_ORG-001-hr-structure-position-mapping.md) |
| TASK-SPRINT-03-FRONTEND-001            | HR Recruitment Web UI                  | frontend       | Frontend | 8  | ⬜ TODO    | TASK-SPRINT-03-HR_RECRUITMENT-001, TASK-SPRINT-03-HR_RECRUITMENT-002, TASK-SPRINT-03-HR_RECRUITMENT-003, TASK-SPRINT-02-FRONTEND-004 | [Link](sprints/SPRINT-03/frontend/TASK-SPRINT-03-FRONTEND-001-hr-recruitment-web-ui.md) |
| TASK-SPRINT-03-FRONTEND-002            | Employee Profile Web UI                | frontend       | Frontend | 8  | ⬜ TODO    | TASK-SPRINT-03-HR_EMPLOYEE-001, TASK-SPRINT-03-HR_ORG-001, TASK-SPRINT-02-FRONTEND-004                   | [Link](sprints/SPRINT-03/frontend/TASK-SPRINT-03-FRONTEND-002-employee-profile-web-ui.md) |
| TASK-SPRINT-03-FRONTEND-003            | Employment Contract Web UI             | frontend       | Frontend | 5  | ⬜ TODO    | TASK-SPRINT-03-HR_CONTRACT-001, TASK-SPRINT-03-FRONTEND-002                                                | [Link](sprints/SPRINT-03/frontend/TASK-SPRINT-03-FRONTEND-003-employment-contract-web-ui.md) |
| TASK-SPRINT-03-FRONTEND-004            | HR Structure Web UI                    | frontend       | Frontend | 3  | ⬜ TODO    | TASK-SPRINT-03-HR_ORG-001, TASK-SPRINT-03-FRONTEND-002                                                     | [Link](sprints/SPRINT-03/frontend/TASK-SPRINT-03-FRONTEND-004-hr-structure-web-ui.md) |
| TASK-SPRINT-03-MOBILE-001              | Employee Self-Service HR Basic         | mobile         | Mobile   | 5  | ⬜ TODO    | TASK-SPRINT-02-MOBILE-001, TASK-SPRINT-03-HR_EMPLOYEE-001, TASK-SPRINT-03-HR_CONTRACT-001                | [Link](sprints/SPRINT-03/mobile/TASK-SPRINT-03-MOBILE-001-employee-self-service-hr-basic.md) |
| TASK-SPRINT-03-TESTING-001             | HR Core Test Plan                      | testing        | Testing  | 5  | ⬜ TODO    | TASK-SPRINT-03-HR_RECRUITMENT-003, TASK-SPRINT-03-HR_EMPLOYEE-001, TASK-SPRINT-03-HR_CONTRACT-001, TASK-SPRINT-03-FRONTEND-004, TASK-SPRINT-03-MOBILE-001 | [Link](sprints/SPRINT-03/testing/TASK-SPRINT-03-TESTING-001-hr-core-test-plan.md) |

Ghi chú readiness Sprint 03:
- Sprint index đã bổ sung mapping traceability rõ US-HR-001..012 -> F-HR -> SCR-HR -> task tại `docs/tasks/sprints/SPRINT-03/TASK-INDEX.md`.
- 12/12 task Sprint 03 đã có mục `Traceability/References` ngắn gọn, đồng bộ với SRS HR mục 7.1.2 và flow UI/UX Sprint 03.

---

## Thống kê theo loại công việc

| Loại     | Tổng Task | Tổng SP |
|----------|-----------|---------|
| Backend  | 24        | 149 SP  |
| Frontend | 10        | 67 SP   |
| Mobile   | 2         | 13 SP   |
| DevOps   | 5         | 21 SP   |
| Testing  | 1         | 5 SP    |
| **Tổng** | **44**    | **261 SP** |

---

## Links tài liệu liên quan

- [Sprint 01 TASK-INDEX](sprints/SPRINT-01/TASK-INDEX.md)
- [Sprint 02 TASK-INDEX](sprints/SPRINT-02/TASK-INDEX.md)
- [Sprint 03 TASK-INDEX](sprints/SPRINT-03/TASK-INDEX.md)
- [Kiến trúc hệ thống](../architecture/SYSTEM-ARCHITECTURE.md)
- [Microservice Map](../architecture/MICROSERVICE-MAP.md)
- [API Design](../architecture/API-DESIGN.md)
- [Database Design](../architecture/DATABASE-DESIGN.md)
- [SaaS Multi-tenancy](../architecture/SAAS-MULTITENANCY.md)
