# Bảng theo dõi Task — Sprint 02

## Thông tin Sprint

| Thuộc tính          | Giá trị                                  |
|---------------------|------------------------------------------|
| Sprint              | Sprint 02                                |
| Tên                 | System Administration & Platform Core   |
| Thời gian           | 2 tuần (10 ngày làm việc)               |
| Tổng Story Points   | 87 SP                                    |
| Tổng số Task        | 14                                       |
| Mục tiêu            | Hoàn thiện platform core: nâng cao RBAC, audit, catalog, dynamic forms, org-chart, notifications, subscription; xây dựng frontend admin UI đầy đủ; khởi động mobile app và AI agent |

## Tổng quan tiến độ

| Cluster       | Tổng Task | Story Points | TODO | IN PROGRESS | REVIEW | DONE | BLOCKED |
|---------------|-----------|--------------|------|-------------|--------|------|---------|
| system-admin  | 8         | 47 SP        | 8    | 0           | 0      | 0    | 0       |
| frontend      | 4         | 27 SP        | 4    | 0           | 0      | 0    | 0       |
| mobile        | 1         | 8 SP         | 1    | 0           | 0      | 0    | 0       |
| ai            | 1         | 5 SP         | 1    | 0           | 0      | 0    | 0       |
| **Tổng**      | **14**    | **87 SP**    | **14** | **0**     | **0**  | **0**| **0**   |

## Danh sách Task

| Task ID                        | Tiêu đề                                              | Cluster       | Loại     | SP | Người nhận | Trạng thái | Phụ thuộc                                                              | File task |
|--------------------------------|------------------------------------------------------|---------------|----------|----|------------|------------|-------------------------------------------------------------------------|-----------|
| TASK-SPRINT-02-SYSTEM_ADMIN-001 | RBAC nâng cao — CASL Policy Engine                  | system-admin  | Backend  | 8  | —          | ⬜ TODO    | TASK-SPRINT-01-USER-002                                                | [Link](system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-001-advanced-rbac.md) |
| TASK-SPRINT-02-SYSTEM_ADMIN-002 | Audit Log Service                                    | system-admin  | Backend  | 5  | —          | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-003                                          | [Link](system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-002-audit-log.md) |
| TASK-SPRINT-02-SYSTEM_ADMIN-003 | Catalog Service                                      | system-admin  | Backend  | 5  | —          | ⬜ TODO    | TASK-SPRINT-01-TENANT-001                                              | [Link](system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-003-catalog-service.md) |
| TASK-SPRINT-02-SYSTEM_ADMIN-004 | Dynamic Forms Engine                                 | system-admin  | Backend  | 8  | —          | ⬜ TODO    | TASK-SPRINT-02-SYSTEM_ADMIN-003                                        | [Link](system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-004-dynamic-forms.md) |
| TASK-SPRINT-02-SYSTEM_ADMIN-005 | Org Chart & Vị trí công việc                        | system-admin  | Backend  | 3  | —          | ⬜ TODO    | TASK-SPRINT-01-USER-001                                                | [Link](system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-005-org-chart.md) |
| TASK-SPRINT-02-SYSTEM_ADMIN-006 | Notification Service                                 | system-admin  | Backend  | 8  | —          | ⬜ TODO    | TASK-SPRINT-01-FOUNDATION-003, TASK-SPRINT-01-USER-001                 | [Link](system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-006-notification-service.md) |
| TASK-SPRINT-02-SYSTEM_ADMIN-007 | Subscription nâng cao — Quản lý gói dịch vụ        | system-admin  | Backend  | 5  | —          | ⬜ TODO    | TASK-SPRINT-01-TENANT-002                                              | [Link](system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-007-subscription-management.md) |
| TASK-SPRINT-02-SYSTEM_ADMIN-008 | Chuẩn hóa contract i18n message key + metadata     | system-admin  | Backend  | 5  | —          | ⬜ TODO    | TASK-SPRINT-01-AUTH-001, TASK-SPRINT-01-TENANT-001, TASK-SPRINT-02-SYSTEM_ADMIN-006 | [Link](system-admin/TASK-SPRINT-02-SYSTEM_ADMIN-008-i18n-message-key-metadata-contract.md) |
| TASK-SPRINT-02-FRONTEND-001    | Angular Web — RBAC UI nâng cao (AC: Light/Dark mode + persistence openErp.colorMode)                       | frontend      | Frontend | 8  | —          | ⬜ TODO    | TASK-SPRINT-01-FRONTEND-002, TASK-SPRINT-02-SYSTEM_ADMIN-001           | [Link](frontend/TASK-SPRINT-02-FRONTEND-001-rbac-ui.md) |
| TASK-SPRINT-02-FRONTEND-002    | Angular Web — Audit Log UI (AC: Light/Dark mode + persistence openErp.colorMode)                           | frontend      | Frontend | 3  | —          | ⬜ TODO    | TASK-SPRINT-01-FRONTEND-002, TASK-SPRINT-02-SYSTEM_ADMIN-002           | [Link](frontend/TASK-SPRINT-02-FRONTEND-002-audit-log-ui.md) |
| TASK-SPRINT-02-FRONTEND-003    | Angular Web — Catalog và Dynamic Form Builder UI (AC: Light/Dark mode + persistence openErp.colorMode)     | frontend      | Frontend | 8  | —          | ⬜ TODO    | TASK-SPRINT-01-FRONTEND-002, TASK-SPRINT-02-SYSTEM_ADMIN-003, TASK-SPRINT-02-SYSTEM_ADMIN-004 | [Link](frontend/TASK-SPRINT-02-FRONTEND-003-catalog-dynamic-form-ui.md) |
| TASK-SPRINT-02-FRONTEND-004    | Thư viện UI dùng chung cho Web + Mobile             | frontend      | Frontend | 8  | —          | ⬜ TODO    | TASK-SPRINT-01-FRONTEND-001, TASK-SPRINT-02-MOBILE-001                 | [Link](frontend/TASK-SPRINT-02-FRONTEND-004-shared-ui-library-web-mobile.md) |
| TASK-SPRINT-02-MOBILE-001      | Ionic Angular — Thiết lập mobile và màn hình Auth (AC: Light/Dark mode + persistence openErp.colorMode)   | mobile        | Mobile   | 8  | —          | ⬜ TODO    | TASK-SPRINT-01-AUTH-001                                                | [Link](mobile/TASK-SPRINT-02-MOBILE-001-ionic-auth-setup.md) |
| TASK-SPRINT-02-AI-001          | AI Agent — Phát hiện bất thường & gợi ý phân quyền | ai            | Backend  | 5  | —          | ⬜ TODO    | TASK-SPRINT-02-SYSTEM_ADMIN-002, TASK-SPRINT-01-USER-002               | [Link](ai/TASK-SPRINT-02-AI-001-ai-anomaly-detection.md) |

## Sơ đồ phụ thuộc

```
Sprint 01 (hoàn thành trước)
  TASK-SPRINT-01-FOUNDATION-003 ──→ TASK-SPRINT-02-SYSTEM_ADMIN-002
                                      └──→ TASK-SPRINT-02-AI-001
  TASK-SPRINT-01-USER-001 ─────────→ TASK-SPRINT-02-SYSTEM_ADMIN-005
                                      └──→ TASK-SPRINT-02-SYSTEM_ADMIN-006
  TASK-SPRINT-01-USER-002 ─────────→ TASK-SPRINT-02-SYSTEM_ADMIN-001
                                      └──→ TASK-SPRINT-02-AI-001
  TASK-SPRINT-01-TENANT-001 ───────→ TASK-SPRINT-02-SYSTEM_ADMIN-003
  TASK-SPRINT-01-TENANT-002 ───────→ TASK-SPRINT-02-SYSTEM_ADMIN-007
  TASK-SPRINT-01-AUTH-001 ─────────→ TASK-SPRINT-02-MOBILE-001
  TASK-SPRINT-01-FRONTEND-002 ─────→ TASK-SPRINT-02-FRONTEND-001
                                      └──→ TASK-SPRINT-02-FRONTEND-002
                                      └──→ TASK-SPRINT-02-FRONTEND-003
  TASK-SPRINT-01-FRONTEND-001 ─────→ TASK-SPRINT-02-FRONTEND-004

Sprint 02 nội bộ
  TASK-SPRINT-02-SYSTEM_ADMIN-003 → TASK-SPRINT-02-SYSTEM_ADMIN-004
  TASK-SPRINT-02-SYSTEM_ADMIN-006 → TASK-SPRINT-02-SYSTEM_ADMIN-008
  TASK-SPRINT-02-SYSTEM_ADMIN-001 → TASK-SPRINT-02-FRONTEND-001
  TASK-SPRINT-02-SYSTEM_ADMIN-002 → TASK-SPRINT-02-FRONTEND-002
  TASK-SPRINT-02-SYSTEM_ADMIN-003 → TASK-SPRINT-02-FRONTEND-003
  TASK-SPRINT-02-SYSTEM_ADMIN-004 → TASK-SPRINT-02-FRONTEND-003
  TASK-SPRINT-02-MOBILE-001 ──────→ TASK-SPRINT-02-FRONTEND-004
```

## Kế hoạch triển khai (2 tuần)

### Tuần 1 — Backend Core

| Ngày    | Task                                                                    | Người thực hiện     |
|---------|-------------------------------------------------------------------------|---------------------|
| Ngày 1  | TASK-SPRINT-02-SYSTEM_ADMIN-001 (Advanced RBAC — CASL)                 | Backend Dev 1       |
| Ngày 1  | TASK-SPRINT-02-SYSTEM_ADMIN-002 (Audit Log Service)                    | Backend Dev 2       |
| Ngày 1  | TASK-SPRINT-02-SYSTEM_ADMIN-005 (Org Chart)                            | Backend Dev 3       |
| Ngày 2  | TASK-SPRINT-02-SYSTEM_ADMIN-003 (Catalog Service)                      | Backend Dev 2       |
| Ngày 2  | TASK-SPRINT-02-SYSTEM_ADMIN-007 (Subscription nâng cao)                | Backend Dev 3       |
| Ngày 3  | TASK-SPRINT-02-SYSTEM_ADMIN-004 (Dynamic Forms) — tiếp SYSTEM_ADMIN-003| Backend Dev 2       |
| Ngày 3  | TASK-SPRINT-02-SYSTEM_ADMIN-006 (Notification Service)                 | Backend Dev 1       |
| Ngày 4  | TASK-SPRINT-02-SYSTEM_ADMIN-008 (i18n message key contract)            | Backend Dev 2       |
| Ngày 4  | TASK-SPRINT-02-AI-001 (AI Agent skeleton + anomaly detection)           | Backend Dev 3       |
| Ngày 4  | Review + fix backend tasks                                              | Tất cả              |
| Ngày 5  | Integration testing backend services                                    | QA + Backend        |

### Tuần 2 — Frontend, Mobile

| Ngày    | Task                                                                    | Người thực hiện     |
|---------|-------------------------------------------------------------------------|---------------------|
| Ngày 6  | TASK-SPRINT-02-FRONTEND-001 (RBAC UI)                                  | Frontend Dev 1      |
| Ngày 6  | TASK-SPRINT-02-FRONTEND-002 (Audit Log UI)                             | Frontend Dev 2      |
| Ngày 6  | TASK-SPRINT-02-MOBILE-001 (Ionic Auth setup)                           | Mobile Dev          |
| Ngày 7  | TASK-SPRINT-02-FRONTEND-003 (Catalog + Form Builder UI)                | Frontend Dev 1 + 2  |
| Ngày 7  | TASK-SPRINT-02-FRONTEND-004 (Shared UI library Web + Mobile)           | Frontend Dev 1 + Mobile Dev |
| Ngày 8  | Continue FRONTEND-003, RBAC UI refinement                              | Frontend Dev 1 + 2  |
| Ngày 9  | Integration frontend ↔ backend                                         | Full team           |
| Ngày 10 | QA, bug fix, sprint review, documentation                              | Full team           |

## Definition of Done cho Sprint 02

- [ ] Tất cả 14 tasks có trạng thái DONE hoặc REVIEW
- [ ] Unit test coverage ≥ 80% trên tất cả services mới
- [ ] Tất cả API endpoints được test với Postman/curl
- [ ] Swagger documentation cập nhật
- [ ] Docker Compose chạy thành công với tất cả services mới
- [ ] Multi-tenancy: mọi business data query có tenantId filter
- [ ] Không có critical security issues
- [ ] Frontend responsive trên desktop (≥ 1280px)
- [ ] Mobile app build thành công trên Android
