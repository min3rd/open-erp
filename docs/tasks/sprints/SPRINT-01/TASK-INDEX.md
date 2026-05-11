# TASK-INDEX — Sprint 01: SaaS Foundation

**Sprint:** 01  
**Mục tiêu:** Xây dựng nền tảng SaaS cốt lõi — hạ tầng, xác thực, quản lý tenant, người dùng và phân quyền cơ bản.  
**Thời gian:** 2 tuần  
**Tổng Story Points:** 104 SP  
**Tổng Task:** 19

---

> **QA Final Retest — 2026-05-11**  
> Build: ✅ PASS | Tests: 22/22 suites, 89/89 PASS | Coverage: Lines **61.02%** (ngưỡng AC ≥ 80% chưa đạt)  
> Kết quả: FOUNDATION-002, FOUNDATION-003, FOUNDATION-004, TENANT-001 giữ nguyên **🟡 REVIEW**.  
> Điều kiện chung để close REVIEW: nâng coverage ≥ 80% và bổ sung integration tests khi môi trường (Docker/MongoDB/RabbitMQ) sẵn sàng.

> **QA Retest Tuần 2 Sprint 01 — 2026-05-11**  
> Build: ✅ PASS | Tests: **222/222 PASS**, **35/35 suites** | Coverage tổng: Lines **63.2%** (AC ≥ 80% chưa đạt)  
> Scope retest: **TENANT-002**, **USER-001**, **AUTH-003**  
> **AUTH-003:** `auth.service.ts` 75%, `auth.controller.ts` 74% — giữ **🟡 REVIEW**. Blocker: coverage < 80%, thiếu test backup code path, rate limit, tenant MFA policy.  
> **TENANT-002:** `tenant.service.ts` 38% (critical), `tenant-quota.middleware.ts` 0% — giữ **🟡 REVIEW**. Blocker: quota/usage functions hoàn toàn chưa được test.  
> **USER-001:** `users.service.ts` 45%, controller/avatar/handler đều 0% — giữ **🟡 REVIEW**. Blocker: phần lớn logic chưa có test coverage.

---

## Tổng quan tiến độ Sprint 01

| Cluster    | Tổng   | ⬜ TODO | 🔵 IN PROGRESS | 🟡 REVIEW | 🟢 DONE | 🔴 BLOCKED | ⏸️ HOLD |
| ---------- | ------ | ------- | -------------- | --------- | ------- | ---------- | ------- |
| foundation | 8      | 0       | 0              | 3         | 4       | 0          | 1       |
| auth       | 4      | 2       | 0              | 1         | 1       | 0          | 0       |
| tenant     | 3      | 1       | 0              | 2         | 0       | 0          | 0       |
| user       | 2      | 1       | 0              | 2         | 0       | 0          | 0       |
| frontend   | 2      | 2       | 0              | 0         | 0       | 0          | 0       |
| **Tổng**   | **19** | **5**   | **0**          | **8**     | **5**   | **0**      | **1**   |

---

## Danh sách Task Sprint 01

| Task ID                       | Tiêu đề                                                                                                                         | Cluster    | Loại     | Phụ trách | SP  | Trạng thái     | Phụ thuộc                                                                       | File                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------- | --------- | --- | -------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| TASK-SPRINT-01-FOUNDATION-001 | Thiết lập Docker Compose cho toàn bộ hệ thống                                                                                   | foundation | DevOps   | DevOps    | 5   | 🟢 DONE        | —                                                                               | `foundation/TASK-SPRINT-01-FOUNDATION-001-docker-compose-setup.md`                |
| TASK-SPRINT-01-FOUNDATION-002 | Triển khai API Gateway NestJS                                                                                                   | foundation | Backend  | Backend   | 8   | 🟡 REVIEW      | TASK-SPRINT-01-FOUNDATION-001                                                   | `foundation/TASK-SPRINT-01-FOUNDATION-002-api-gateway-service.md`                 |
| TASK-SPRINT-01-FOUNDATION-003 | Cấu hình RabbitMQ exchanges và Redis caching                                                                                    | foundation | Backend  | Backend   | 3   | 🟡 REVIEW      | TASK-SPRINT-01-FOUNDATION-001                                                   | `foundation/TASK-SPRINT-01-FOUNDATION-003-rabbitmq-redis-config.md`               |
| TASK-SPRINT-01-FOUNDATION-004 | Cấu hình MongoDB và Base Schema                                                                                                 | foundation | Backend  | Backend   | 3   | 🟡 REVIEW      | TASK-SPRINT-01-FOUNDATION-001                                                   | `foundation/TASK-SPRINT-01-FOUNDATION-004-mongodb-setup.md`                       |
| TASK-SPRINT-01-FOUNDATION-006 | Root workspace node scripts (install/update/format/build)                                                                       | foundation | DevOps   | DevOps    | 3   | 🟢 DONE        | —                                                                               | `foundation/TASK-SPRINT-01-FOUNDATION-006-root-workspace-node-scripts.md`         |
| TASK-SPRINT-01-FOUNDATION-007 | VS Code debug launch configurations cho hệ thống                                                                                | foundation | DevOps   | DevOps    | 3   | 🟢 DONE        | TASK-SPRINT-01-FOUNDATION-006                                                   | `foundation/TASK-SPRINT-01-FOUNDATION-007-vscode-debug-launch-configs.md`         |
| TASK-SPRINT-01-FOUNDATION-008 | Deploy assets cho Docker và Kubernetes                                                                                          | foundation | DevOps   | DevOps    | 5   | 🟢 DONE        | TASK-SPRINT-01-FOUNDATION-001, TASK-SPRINT-01-FOUNDATION-006                    | `foundation/TASK-SPRINT-01-FOUNDATION-008-deploy-assets-docker-kubernetes.md`     |
| TASK-SPRINT-01-FOUNDATION-009 | Hướng dẫn và cấu hình cài đặt trực tiếp Linux/Windows Server                                                                    | foundation | DevOps   | DevOps    | 5   | ⏸️ HOLD        | TASK-SPRINT-01-FOUNDATION-006, TASK-SPRINT-01-FOUNDATION-008                    | `foundation/TASK-SPRINT-01-FOUNDATION-009-direct-install-linux-windows-server.md` |
| TASK-SPRINT-01-AUTH-001       | Auth Service — JWT Authentication                                                                                               | auth       | Backend  | Backend   | 8   | 🟢 DONE        | TASK-SPRINT-01-FOUNDATION-002, TASK-SPRINT-01-FOUNDATION-004                    | `auth/TASK-SPRINT-01-AUTH-001-auth-service-jwt.md`                                |
| TASK-SPRINT-01-AUTH-002       | Auth Service — OAuth2 Social Login                                                                                              | auth       | Backend  | Backend   | 5   | 🔵 IN PROGRESS | TASK-SPRINT-01-AUTH-001                                                         | `auth/TASK-SPRINT-01-AUTH-002-oauth2-social.md`                                   |
| TASK-SPRINT-01-AUTH-003       | Auth Service — Multi-Factor Authentication (TOTP)                                                                               | auth       | Backend  | Backend   | 5   | 🟡 REVIEW      | TASK-SPRINT-01-AUTH-001                                                         | `auth/TASK-SPRINT-01-AUTH-003-mfa.md`                                             |
| TASK-SPRINT-01-AUTH-004       | Hardening Token Security & Coverage Evidence                                                                                    | auth       | Backend  | Backend   | 3   | ⬜ TODO        | TASK-SPRINT-01-AUTH-001                                                         | `auth/TASK-SPRINT-01-AUTH-004-token-security-hardening.md`                        |
| TASK-SPRINT-01-TENANT-001     | Tenant Service — Quản lý doanh nghiệp & Tự đăng ký MST                                                                          | tenant     | Backend  | Backend   | 8   | 🟡 REVIEW      | TASK-SPRINT-01-FOUNDATION-002, TASK-SPRINT-01-FOUNDATION-004                    | `tenant/TASK-SPRINT-01-TENANT-001-tenant-service.md`                              |
| TASK-SPRINT-01-TENANT-002     | Tenant Service — Subscription và Quota                                                                                          | tenant     | Backend  | Backend   | 5   | 🟡 REVIEW      | TASK-SPRINT-01-TENANT-001                                                       | `tenant/TASK-SPRINT-01-TENANT-002-subscription-quota.md`                          |
| TASK-SPRINT-01-TENANT-003     | Onboarding Integration Completion                                                                                               | tenant     | Backend  | Backend   | 3   | ⬜ TODO        | TASK-SPRINT-01-TENANT-001                                                       | `tenant/TASK-SPRINT-01-TENANT-003-onboarding-integration-completion.md`           |
| TASK-SPRINT-01-USER-001       | User Service — Quản lý người dùng và phòng ban                                                                                  | user       | Backend  | Backend   | 8   | 🟡 REVIEW      | TASK-SPRINT-01-AUTH-001, TASK-SPRINT-01-TENANT-001                              | `user/TASK-SPRINT-01-USER-001-user-service.md`                                    |
| TASK-SPRINT-01-USER-002       | RBAC Service — Role-Based Access Control                                                                                        | user       | Backend  | Backend   | 8   | ⬜ TODO        | TASK-SPRINT-01-USER-001                                                         | `user/TASK-SPRINT-01-USER-002-rbac-service.md`                                    |
| TASK-SPRINT-01-FRONTEND-001   | Angular Web — Auth UI + Đăng ký DN với Activation Email Link (Angular 21) (AC: Light/Dark mode + persistence openErp.colorMode) | frontend   | Frontend | Frontend  | 8   | ⬜ TODO        | TASK-SPRINT-01-AUTH-001, TASK-SPRINT-01-AUTH-002, TASK-SPRINT-01-AUTH-003       | `frontend/TASK-SPRINT-01-FRONTEND-001-angular-auth-ui.md`                         |
| TASK-SPRINT-01-FRONTEND-002   | Angular Web — Tenant Admin Dashboard (AC: Light/Dark mode + persistence openErp.colorMode)                                      | frontend   | Frontend | Frontend  | 8   | ⬜ TODO        | TASK-SPRINT-01-FRONTEND-001, TASK-SPRINT-01-USER-001, TASK-SPRINT-01-TENANT-001 | `frontend/TASK-SPRINT-01-FRONTEND-002-tenant-admin-ui.md`                         |

---

## Biểu đồ phụ thuộc Sprint 01

```
FOUNDATION-001 (Docker)
  ├──► FOUNDATION-002 (API Gateway) ──► AUTH-001 (JWT)
  │                                       ├──► AUTH-002 (OAuth)
  │                                       ├──► AUTH-003 (MFA)
  │                                       └──► USER-001 (Users)──► USER-002 (RBAC)
  ├──► FOUNDATION-003 (RabbitMQ/Redis)   └──► TENANT-001 (Tenant) ──► TENANT-002 (Quota)
  └──► FOUNDATION-004 (MongoDB) ──────────────┘

FOUNDATION-006 (Root Scripts)
  ├──► FOUNDATION-007 (VS Code Debug Launch)
  └──► FOUNDATION-008 (Deploy Docker/K8s) ──► FOUNDATION-009 (Direct Install Linux/Windows)

AUTH-001, AUTH-002, AUTH-003 ──► FRONTEND-001 (Auth UI)
FRONTEND-001, USER-001, TENANT-001 ──► FRONTEND-002 (Admin Dashboard)
```

---

## Thứ tự triển khai đề xuất

### Tuần 1

- **Ngày 1-2:** FOUNDATION-001 (Docker), FOUNDATION-003 (RabbitMQ), FOUNDATION-004 (MongoDB), FOUNDATION-006 (Root Scripts) — Song song
- **Ngày 3:** FOUNDATION-007 (VS Code Debug Launch)
- **Ngày 3-4:** FOUNDATION-002 (API Gateway), FOUNDATION-008 (Deploy Docker/K8s)
- **Ngày 4-5:** AUTH-001 (JWT), TENANT-001 (Tenant), FOUNDATION-009 (Direct Install Linux/Windows) — Song song

### Tuần 2

- **Ngày 6-7:** AUTH-002 (OAuth), AUTH-003 (MFA), TENANT-002 (Quota), USER-001 (Users) — Song song
- **Ngày 8-9:** USER-002 (RBAC), FRONTEND-001 (Auth UI) — Song song
- **Ngày 9-10:** FRONTEND-002 (Admin Dashboard)
- **Ngày 10:** Integration testing, bug fixes

---

## Ghi chú Sprint

### Deliverables Day 03 (DevOps)

- TASK-SPRINT-01-FOUNDATION-007: `.vscode/launch.json`, `.vscode/tasks.json`
- TASK-SPRINT-01-FOUNDATION-008: `deploy/docker/*`, `deploy/k8s/base/*`, `deploy/runbook/ROLLBACK.md`

- Ưu tiên FOUNDATION tasks — tất cả task khác phụ thuộc vào hạ tầng.
- Backend tasks AUTH-001, TENANT-001 có thể phát triển song song sau khi FOUNDATION xong.
- Frontend tasks có thể mock API để phát triển song song với backend.
- Quy chiếu FE được áp dụng mặc định ở cấp global cho mọi tác vụ frontend trong `open-erp-web`; không lặp lại ở từng task.
- Flow đăng ký doanh nghiệp dùng activation email link trước khi onboarding.
- Screen specs cho Auth/System Admin đã tách theo mã màn hình riêng, task frontend phải bám theo file spec tương ứng.
- Cuối Sprint: demo đăng nhập hoàn chỉnh (JWT + OAuth + MFA) và quản lý user/tenant.
