# Sprint 2 — Code Audit Report (Task Done vs Implementation)
## Dự án: Enterprise SaaS Platform | Ngày audit: 2026-06-29

Báo cáo đối chiếu **15 task Done** (TSK-2.1–2.10, 2.15, 2.17–2.20) với codebase thực tế tại `open-erp-services`, `open-erp-web`, `open-erp-mobile`, `open-erp-shared`.

**Tổng kết:** 12 FULL · 3 PARTIAL · 0 MISSING

---

## Bảng audit chi tiết

| Task | Deliverable | Code evidence | Tests | Verdict | Ghi chú |
|------|-------------|---------------|-------|---------|---------|
| **TSK-2.1** | Hash-chain workflow logs | `workflow-log.entity.ts`, `workflow-log.service.ts`, `GET workflows/logs/:id/verify` | ~10 spec | **FULL** | SHA-256 chain write + verify |
| **TSK-2.2** | Branching workflow API | `workflow.controller.ts`, FORK/JOIN trong entities + services | ~17 spec | **FULL** | ALL/ANY/PERCENTAGE runtime |
| **TSK-2.3** | Dynamic form API | `dynamic-form.controller.ts`, versioning + validate | ~38 spec | **PARTIAL** | Thiếu `GET /dynamic-forms/key/:key` (latest) |
| **TSK-2.4** | OnlyOffice templates | `document-template.controller.ts`, `files.controller.ts` | ~26 spec | **FULL** | Chưa có Template Designer UI |
| **TSK-2.5** | Advanced instance actions | `workflow-instance.controller.ts`, CONSULT/SPAWN_SUBPROCESS | ~14 spec | **PARTIAL** | `FORWARD` enum chưa implement |
| **TSK-2.6** | Deadlines & BullMQ | `workflow-deadline.consumer.ts`, `deadlineAt` entity | ~5+ spec | **FULL** | Email + queue reminder |
| **TSK-2.7** | Multi-channel notify | `notification.gateway.ts`, WS + email | ~14 spec | **FULL** | In-app + Socket.io + mail |
| **TSK-2.8** | Internal CA | `ca.controller.ts`, `ca.service.ts` | ~8 integration | **FULL** | Root CA + issue cert |
| **TSK-2.9** | Digital signature | `signature.controller.ts`, sign/verify | ~4 integration | **FULL** | Tamper detection test có |
| **TSK-2.10** | Form Builder UI | `dynamic-form-builder/` (~900 LOC), route `/admin/form-builder` | 0 UI spec | **PARTIAL** | Load-by-key broken (API gap) |
| **TSK-2.15** | MinIO storage | `storage.controller.ts`, S3 SDK | ~19 spec | **FULL** | Pre-signed URLs |
| **TSK-2.17** | Grid/layout API ext | GRID trong entity + `validateData` | trong TSK-2.3 specs | **FULL** | Renderer GRID trong shared-ui |
| **TSK-2.18** | shared-ui form lib | `form-renderer`, `form-*` components | 0 | **FULL** | Exported `public-api.ts` |
| **TSK-2.19** | shared-ui DnD lib | `dnd/` directives + components | 0 | **FULL** | Dùng bởi Form Builder |
| **TSK-2.20** | shared-ui canvas lib | `canvas/` components + engine | 0 | **FULL** | Chưa consume bởi web app |

---

## 5 Task Todo — readiness

| Task | Spec + Traceability | Dependencies Done | Blocker |
|------|---------------------|-------------------|---------|
| TSK-2.16 Workflow Designer | ✅ URS, mockup §2.6, trace matrix | TSK-2.19, 2.20, 2.2 | Canvas lib chưa wired vào web |
| TSK-2.11 Template Designer | ✅ §2.7 | TSK-2.4, 2.18 | OnlyOffice UI chưa có |
| TSK-2.12 Cert Manager | ✅ §2.8 | TSK-2.8, 2.9 | UI chưa có |
| TSK-2.13 Approval Inbox | ✅ §2.9 | TSK-2.5, 2.7, 2.10 | UI chưa có |
| TSK-2.14 Mobile Self-service | ✅ §2.10 | TSK-2.3, 2.5 | Mobile zero Sprint 2 code |

---

## Gap cần fix trước khi đóng Sprint 2

### P0 — Integration
1. **TSK-2.3:** Thêm `GET /dynamic-forms/key/:key` trả bản `isLatest` — unblock TSK-2.10 load.
2. **TSK-2.5:** Implement `FORWARD` trong `workflow-instance.service.ts` hoặc gỡ khỏi enum.

### P1 — UI Todo (5 task)
3. Wire `CanvasComponent` vào TSK-2.16 (library đã sẵn TSK-2.20).
4. Mobile parity theo `project_principles.md` §4 cho TSK-2.14.

### P2 — QA & docs
5. Chạy đầy đủ [tc_02_branching_workflow_api.md](./testcases/tc_02_branching_workflow_api.md) và [tc_10_dynamic_form_builder_ui.md](./testcases/tc_10_dynamic_form_builder_ui.md).
6. Backfill § Kết quả thực hiện cho 15 task Done.

---

## Mobile (`open-erp-mobile`) — Sprint 2

Không có module dynamic-form, workflow, approval inbox, canvas. **Toàn bộ Sprint 2 deliverable hiện tại = backend + web admin + shared-ui.**

---

## Test coverage snapshot

| Layer | .spec.ts | Ghi chú |
|-------|----------|---------|
| open-erp-services (workflow/form/storage) | ✅ Phong phú | ~171 tests toàn dự án (theo task docs) |
| open-erp-shared | ❌ Không có | TSK-2.18–2.20 chưa unit test |
| open-erp-web form-builder | ❌ Không có | Chỉ manual test report TSK-2.10 |
| open-erp-mobile | Sprint 1 only | — |

---

## Tài liệu đã backfill (cùng đợt)

- [urs.md](../../02_user_requirements/urs.md) — §2.11 mở rộng, US-WF/FORM/DOC/CA/ESS
- [sitemap_and_wireframes.md](../../02_user_requirements/sitemap_and_wireframes.md) — §2.6–2.10
- [api_overview.md](../../03_functional/api_overview.md) — §5 Sprint 2 APIs
- Traceability matrix — 5 task Todo (TSK-2.11, 2.12, 2.13, 2.14, 2.16)
- [testcases/](./testcases/) — TC Workflow API + Form Builder
