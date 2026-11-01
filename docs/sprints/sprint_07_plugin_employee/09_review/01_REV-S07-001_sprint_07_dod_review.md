# [REV-S07-001] Nghiệm thu & đóng Sprint 07 — Plugin Employee

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | REV-S07-001 / Sprint review & DoD / Sprint 07 |
| Trạng thái / phiên bản / ngày | **Draft — Ready for PM/customer review** / 1.0 / 2026-11-01 |
| Owner / reviewer | PM / Chủ dự án (Product Owner) + Architect + QA |
| Phạm vi | 37 AC của [CONF-S07-001](../04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md) 1.0; FEAT-36…38 (TASK-426…438) + BUG-161…176 |
| Baseline | Working tree 2026-11-01 (cutover C6 + signed URL + catalog 1.0.10 manifest; chưa commit) |
| Evidence | [TR-S07-001](../08_testing/03_TR-S07-001_sprint_07_test_report.md) 1.17 (64 ảnh inline, 4 role); backend suite 254/254 PASS 2026-11-01; plugin employee 18/18 PASS |

## 1. Tóm tắt điều hành

- Sprint 07 bàn giao **plugin `employee` 1.1.19** (hồ sơ, phân công effective-dated, hợp đồng, self-service allowlist, duyệt nhiều cấp cấu hình dạng node, tài liệu + ClamAV scan + signed URL, org chart/danh bạ, self-onboarding, campaign, privacy DSAR), **plugin `org-structure` 1.1.3** (always-on) và **tenant switcher** web/mobile.
- **Organization đã tách hoàn toàn khỏi Core** (ADR-S07-002 C6, 2026-11-01): Core đọc projection duy nhất; `modules/organization` xóa; `V7.0.7` drop 4 bảng legacy + permission `core:*` cũ; org-structure trở thành locked default-install (always-on Q44).
- **Signed URL tải tài liệu** hoàn tất (TASK-433 0.3): HMAC-SHA256 + TTL ngắn hạn, 3 endpoint mới; plugin 18/18 test PASS.
- **Catalog `EMPLOYEE_DOCUMENT_TYPE` 1.0.10**: root + resource `plugin.json` đã sync; `open-erp validate` PASS.
- **0 bug Critical/High mở**; 16 bug BUG-161…176 đã Resolved (QA).
- Backend suite **254/254 PASS** (PostgreSQL + Redis thật, không H2) sau cutover C6; app thật desktop 12/12 + mobile Ionic 7/7 + tenant minhvv 4/4, 0 console error; 64 ảnh 4 role inline trong TR mục 8.

## 2. Trace AC (tóm tắt theo FEAT)

| Nhóm AC | Kết quả | Bằng chứng |
| :--- | :--- | :--- |
| FEAT-36: AC-15, AC-30…32, AC-36 | ✅ 5/5 PASS | Cutover C6: plugin CRUD + projection + branch scope app thật (TR 1.7/1.8/1.14); `ScopeProjectionServiceTest`; V7.0.7; backend 254/254 |
| FEAT-37: AC-01…14, AC-17…26, AC-27…29, AC-37 | ✅ PASS | App thật E2E 12/12 + 64 ảnh 4 role (TR mục 8); DSAR export/erase (TR 1.14); ClamAV EICAR (TR 1.15); signed URL (TASK-433 0.3); mobile 7/7 |
| FEAT-38: AC-19, AC-33…35 | ✅ 4/4 PASS | `AuthResourceApiTest` + app thật switch 2 chiều (TR 1.2); unsaved guard (TR 1.13); Ionic 390×844 |

Chi tiết truy vết từng AC: [FEAT-36](../07_items/FEAT-36_organization_extraction_projection.md) 0.5, [FEAT-37](../07_items/FEAT-37_employee_plugin_core.md) 0.6, [FEAT-38](../07_items/FEAT-38_tenant_switcher.md) 0.5.

## 3. DoD có bằng chứng

| Điều kiện | Kết quả thực tế | Bằng chứng | Đánh giá |
| :--- | :--- | :--- | :--- |
| Critical chưa Done | 0 | BUG-165/168 Resolved (QA); TASK-428 Critical Done (QA) | ✅ PASS |
| High chưa Done (kể cả task con) | 0 | TASK-426…438 Done (QA); BUG-161…164/166/167/169…176 Resolved | ✅ PASS |
| Backend tests PostgreSQL/Redis thật | **254/254 PASS** (2026-11-01, sau cutover C6) | `mvn -f src/backend/pom.xml test` BUILD SUCCESS; plugin employee 18/18 | ✅ PASS |
| Browser Web Desktop / Mobile Ionic | Desktop 12/12 + Ionic 7/7 + minhvv 4/4, 0 console error | TR-S07-001 1.17 mục 2.3/2.5/8 (64 ảnh) | ✅ PASS |
| AC coverage, docs/link | 37 AC PASS theo FEAT trace; `check-docs` chạy sau cập nhật | TR/TP; FEAT-36/37/38 | ✅ PASS (chạy check-docs lần cuối trước closure) |
| Medium/Low chuyển tiếp có owner/đích | 0 item deferred còn mở | Signed URL/legacy cutover/catalog manifest đã hoàn tất 2026-11-01 (TR mục 4) | ✅ PASS |
| PM DoD | Pending — chờ chủ dự án duyệt REV này | Mục 5 | ⏳ PENDING |
| Khách hàng nghiệm thu | Pending — chờ ký chủ dự án | Mục 5 | ⏳ PENDING |
| Sprint closure | Pending — sau PM DoD + nghiệm thu | Mục 5 | ⏳ PENDING |

## 4. Backlog chuyển tiếp

Không còn item Medium deferred mở. Ghi chú deployment (không phải item sprint):

- QA rebuild image `employee` 1.1.20 + `catalog` 1.0.10 để E2E runtime lần cuối (signed URL + document type UI) trước khi đóng Sprint.
- Production: cấu hình `EMPLOYEE_DOCUMENT_SIGNED_URL_SECRET` riêng; staging chạy `org-cutover.mjs backup/copy/verify` + rollback drill trước khi deploy (V7.0.7 tự drop bảng legacy khi deploy).

## 5. Quyết định và xác nhận

| Quyết định | Trạng thái | Người/ngày/nguồn |
| :--- | :--- | :--- |
| QA sign-off implementation | ✅ **PASS implementation + deferred closure** | QA / TR-S07-001 1.17 / 2026-11-01 |
| PM DoD | ⏳ **PENDING** — chờ chủ dự án duyệt | PM / REV-S07-001 1.0 |
| Customer acceptance | ⏳ **PENDING** — chờ chỉ đạo chủ dự án ("hoàn tất tất cả, không đẩy sprint sau" đã được ghi nhận làm đầu vào) | Chủ dự án |
| Sprint closure | ⏳ **PENDING** | PM |

> Theo quy trình SDLC, PM không tự ký nghiệm thu thay chủ dự án. Biên bản này sẵn sàng để chủ dự án duyệt — sau khi duyệt, PM cập nhật trạng thái CLOSED và cập nhật task board/reading guide.

## 6. Release notes

- **Plugin `employee` 1.1.19**: hồ sơ + phân công/contract drawer, self-service allowlist, duyệt nhiều cấp dạng node (BUG-176 fixed), tài liệu 9 loại catalog + ClamAV scan + **signed URL ngắn hạn**, org chart/danh bạ/import-export, self-onboarding + in-app notification, campaign, privacy consent/DSAR.
- **Plugin `org-structure` 1.1.3**: always-on, WC org CRUD/members/branch access, bootstrap HQ + 8 phòng ban + luồng duyệt 2 bước; outbox → Core projection.
- **Cutover C6**: Core projection-only; xóa `modules/organization`; `V7.0.7` drop legacy tables/permissions; org-structure locked default-install.
- **Tenant switcher**: shared component + employee header contribution + unsaved guard; `POST /auth/switch-tenant` + rate limit.
- **Catalog 1.0.10 manifest**: `EMPLOYEE_DOCUMENT_TYPE` + 9 loại; root/resource sync.
- **Docs**: TR-S07-001 1.17 self-contained 64 ảnh; runbook cutover; item FEAT/TASK đồng bộ Done (QA).

## 7. Retrospective

**Điểm tốt**
- Hai lớp assignment (org access vs employee HR) + projection giữ Core không biết plugin, QA branch scope PASS sạch.
- Cutover có runbook + script `backup/copy/verify/drop-legacy` — QA dev drop legacy an toàn có backup.
- 16 bug phát hiện trong QA đều được xử lý trước sign-off.

**Bài học**
- Catalog root/resource `plugin.json` lệch version làm plugin UI không khả dụng — cần check sync manifest trong CI/validate.
- Cutover C6 đụng chuỗi test Sprint 02 phụ thuộc bảng legacy — fixtures phải chuyển projection sớm hơn để tránh backtracking.
