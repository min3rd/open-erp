# [REV-03] Biên Bản Nghiệm Thu Sprint 03 — Plugin Manager, Plugin CLI & Phân Phối Plugin

- **Mã Tài Liệu**: REV-03
- **Tên Sprint**: Sprint 03 - Plugin Manager, Plugin Scaffolding CLI & Cơ Chế Phân Phối/Cài Đặt Plugin Đa Kênh
- **Phụ Trách**: PM Agent
- **Ngày Lập Biên Bản**: 2026-10-04
- **Trạng Thái**: `[ ]` **CHƯA ĐÓNG — CHỜ KÝ DUYỆT** (DoD Gate **CHƯA PASS**)
- **Tài Liệu Liên Quan**: [00_READING_GUIDE](../00_READING_GUIDE.md) • [sprint_plan](../sprint_plan.md) • [QA-01 Test Report](../08_testing/QA-01_sprint_03_test_report.md) • [CONF-01](../04_confirmation/CONF-01_sprint_03_scope.md) • [UG-03 User Guide](../../../06_user_guides/sprint_03_plugin_manager_user_guide.md)

> **Lưu ý trạng thái**: Sprint 03 **CHƯA ĐỦ ĐIỀU KIỆN ĐÓNG**. Biên bản này tổng hợp kết quả và xác định rõ các điều kiện còn lại. Việc đóng Sprint chỉ được thực hiện sau khi **Reviewer ký các item `In Review`**, **User Guide được ban hành** và **Khách hàng sign-off Bước 7/8/9**. Không có mục nào trong tài liệu này được phép tự ký thay người thật.

---

## 1. Đánh Giá Mục Tiêu Sprint (Sprint Goal Review)

| Mục Tiêu Cam Kết Ban Đầu (theo `sprint_plan.md` mục 1) | Kết Quả | Ghi Chú Đánh Giá |
| :--- | :---: | :--- |
| **FEAT-21 — Plugin Manager & Vòng đời** | Đạt phần code + QA | Catalog + phiên bản trong DB; một bảng `tenant_plugins` (entitlement + vòng đời); cài/gỡ/bật/tắt/nâng cấp/rollback có bù trừ; soft uninstall giữ dữ liệu; cài mặc định hệ thống; plugin riêng tenant (`TENANT_PRIVATE`); khóa khẩn cấp 2 cấp + cưỡng chế gỡ + thông báo; Marketplace Web + Mobile read-only; audit. |
| **FEAT-22 — Plugin Scaffolding CLI (`@open-erp/cli`)** | Đạt phần code + QA | CLI Node/npm zero-dependency: `create`, `generate entity/menu/ui-contribution`, `validate`, `package` (checksum SHA-256), `link`, `inspect`, `dev`; template vertical slice; smoke test `node --test` PASS. |
| **FEAT-23 — Phân phối đa kênh & Plugin Host Runtime** | Đạt phần code + QA (còn 2 sub-task chờ hạ tầng) | 3 kênh (Docker Hub / Image Registry / JAR + Web bundle) → xác minh checksum → MinIO; build image; Deployer container-per-tenant (Docker local + K8s); Tenant Datasource Router (schema riêng, DB role least privilege); Plugin Host WC/MF/iframe. **TASK-331 và TASK-337 còn `In Progress`** (phần cần registry/hạ tầng thật để nghiệm thu). |
| **QA Dual-mode & Đo lường chất lượng** | Đạt | Browser QA thật **40/40 PASS, 0 console error**; backend suite trên PostgreSQL + Redis thật PASS; ảnh minh chứng lưu tại `08_testing/evidence/screenshots/`. |

**Kết luận tạm thời**: 3 trụ cột tính năng đã hoàn tất phần code và vượt qua QA browser; tuy nhiên còn **4 BUG `In Review` chưa được Reviewer ký**, **TASK-348 `In Review`**, **User Guide Sprint 03 chưa ban hành** và **Khách hàng chưa sign-off** → Sprint 03 **chưa đóng**.

---

## 2. Tổng Hợp Kết Quả Hạng Mục (Item Status)

### 2.1. Tổng hợp số liệu

| Hạng Mục | Số Lượng | Ghi Chú |
| :--- | :---: | :--- |
| **Tổng item Sprint 03** (feature + bug + task + sub-task inline) | **174** | Bao gồm FEAT-21/22/23 và dải TASK/BUG inline. |
| **Đã `Done` / `Resolved`** | **167** | Bao gồm toàn bộ bug do QA phát hiện (BUG-95→116). |
| **Chưa hoàn tất** | **7** | 4 `In Review` (chờ Reviewer ký) + 3 `Deferred → Sprint 04`. |
| — Trong đó `In Review` (chờ Reviewer ký) | **4** | BUG-86, BUG-92, BUG-93, BUG-94. |
| — Trong đó `Deferred → Sprint 04` | **3** | BUG-98, TASK-346, TASK-347. |

> **Ghi chú bổ sung**: **TASK-348** đang `In Review` (7/7 màn chính `Done`, phần danh sách phụ chuyển Sprint 04). TASK-348 nằm cùng nhóm **cần Reviewer ký trước khi đóng Sprint**. Trong `FEAT-23`, **TASK-331** và **TASK-337** vẫn `In Progress` (phần OCI token auth / backup-restore cần hạ tầng registry thật để nghiệm thu).

### 2.2. Feature chính

| Mã | Tên Tính Năng | Trọng Số | Trạng Thái Code | Kết Quả QA |
| :--- | :--- | :---: | :---: | :--- |
| **FEAT-21** | Plugin Manager — Danh mục, Vòng đời & Marketplace | Critical | Hoàn tất (chờ ký nghiệm thu) | Browser: marketplace 3 nhóm, install→ACTIVE, upgrade BREAKING, disable/enable, soft uninstall giữ schema, detail versions, credentials — `18/18 PASS`. |
| **FEAT-22** | Plugin Scaffolding CLI (`@open-erp/cli`) | High | Hoàn tất (chờ ký nghiệm thu) | CLI smoke `node --test` `3/3 PASS`; E2E `npm run e2e:plugin` (create → package → cài lên dev local) PASS 2026-10-04. |
| **FEAT-23** | Phân phối đa kênh, Deployer & Plugin Host | Critical | Hoàn tất phần chính (TASK-331/337 `In Progress`) | Platform `6/6 PASS`, route-state `8/8 PASS`, Ionic 390×844 `8/8 PASS`; container-per-tenant thật đạt `ACTIVE`; schema tenant giữ nguyên sau soft uninstall. |

### 2.3. Item chưa hoàn tất (cần theo dõi để đóng Sprint)

| Mã | Tiêu Đề | Mức Độ | Trạng Thái | Ghi Chú |
| :--- | :--- | :---: | :---: | :--- |
| **BUG-86** | Rollback image chưa có hợp đồng phục hồi dữ liệu sau migration | High | `In Review` | Đã bổ sung snapshot bắt buộc BREAKING + preservation snapshot + `rollback_strategy`; chờ Reviewer ký. |
| **BUG-92** | Seed Core UI Slot không khớp partial unique index | High | `In Review` | Đã sửa conflict target đúng partial index + xác nhận tĩnh theo PostgreSQL 16; chờ Reviewer ký. |
| **BUG-93** | Thiếu trạng thái khóa catalog & chốt chặn publish sau khóa | High | `In Review` | Đã thêm `catalog_status BLOCKED`, P25 unblock, trigger publish guard; chờ Reviewer ký. |
| **BUG-94** | Xung đột contract `GET /platform/plugins` (FEAT-20 vs P1) | Medium | `In Review` | Đã triển khai dual-mode (legacy + paginated); chờ Reviewer xác nhận phương án trước khi gỡ legacy ở Sprint 04. |
| **TASK-348** | Rollout Route-State cho màn hình dạng bảng Sprint 01/02 | High→Medium | `In Review` | 7/7 màn chính Done (12 màn chuyển path-segment, browser `9/9 PASS`); phần phụ (sessions, Mobile lists) → Sprint 04. |
| **BUG-98** | Thiếu Notification Bell TopBar, banner toàn cục & banner Dashboard Mobile | Medium | `Deferred → Sprint 04` | Có workaround (xem thông báo tại `/settings/plugins`). |
| **TASK-346** | Job phục hồi thao tác plugin + phát hiện chu trình dependency | Medium | `Deferred → Sprint 04` | Cải thiện độ bền vững, không chặn luồng chuẩn. |
| **TASK-347** | Hoàn thiện lệnh CLI `publish` (đẩy lên registry nội bộ) | Medium | `Deferred → Sprint 04` | Phụ thuộc hạ tầng registry nội bộ thực tế. |

### 2.4. Bug do QA phát hiện — đã xử lý

| Nhóm | Kết Quả | Nguồn |
| :--- | :--- | :--- |
| BUG-95 → BUG-108 (QA Bước 8) | `Resolved` (bao gồm **BUG-102/103 Critical** và BUG-95/96/101/104/105/106/107/108 High) | QA-01 mục 2 |
| BUG-109, BUG-110, BUG-112, BUG-113, BUG-115, BUG-116, BUG-99 (fix 2026-10-04) | `Resolved` (BUG-115 Critical route-shadowing, BUG-116 build ngoài transaction, BUG-112/113 CLI bundle+web, BUG-109 enum binding, BUG-110 NG01354, BUG-99 reason/confirm/S2) | `08_testing/evidence/BUG-109_116_fix_verification_2026-10-04.txt` |
| BUG-97, BUG-100, BUG-111, BUG-114 | `Resolved` | QA-01 mục 2 |

---

## 3. Số Liệu Kiểm Chứng Cuối

| Hạng Mục | Kết Quả | Nguồn |
| :--- | :--- | :--- |
| **Backend full suite** (`mvn test`, PostgreSQL + Redis thật, **không H2**) | **211/211 PASS** (0 failures/errors/skipped, 2026-09-20) | QA-01 mục 1; `00_READING_GUIDE` ghi nhận bổ sung 2 test class (Governance + Bundle Image) → **220/220 PASS** sau đó |
| **Migrations V3.0.0–V3.0.3 + rollback** | PASS trên PostgreSQL thật | `evidence/TASK-301_migration_pg_verify.txt` |
| **Web build** `ng build` | PASS | QA-01 mục 1 |
| **Mobile build** `ng build` | PASS | QA-01 mục 1 |
| **CLI smoke** `node --test` | 3/3 PASS | QA-01 mục 1 |
| **i18n parity vi↔en** | Web 864/864 · Mobile 535/535 — 0 lệch | QA-01 mục 1 |
| **QA Browser thật (dual-mode)** | **40/40 PASS, 0 console error** (tenant `18/18` + route-state `8/8` + platform `6/6` + Ionic 390×844 `8/8`) | QA-01 mục 2b |
| **QA bổ sung theo phản hồi khách hàng** | Support tenant-private `4/4`; route-state Sprint 01/02 `4/4`; cursor pointer `4/4` | QA-01 mục 2c |
| **Chuẩn path-segment + hotfix search** | Path `9/9 PASS`; search `5/5 PASS`; 0 console error | QA-01 mục 2d/2e |
| **E2E thật CLI → cài plugin** | PASS: container `Running`, schema + bảng `plg_sample_items`, ledger `ACTIVE\|1.0.0` | `evidence/TASK-344_cli_bundle_install_e2e_2026-10-04.txt` |
| **Ảnh minh chứng** | Lưu tại `08_testing/evidence/screenshots/` (`web_01→web_53`, `mobile_10/11/20/21`, các `qa_*_result.json`) | QA-01 mục 2b–2e |

---

## 4. Kiểm Tra Điều Kiện Đóng Sprint (Sprint DoD Gate Checklist)

> Đối chiếu với `sprint_plan.md` mục 6. Ô `[ ]` = **chưa thỏa** tại thời điểm lập biên bản.

### 4.1. Đã hoàn tất

- [x] Backend Quarkus có Unit/Integration Test (JUnit 5 + RestAssured) bao phủ vòng đời, entitlement, deploy/undeploy, phân quyền, cô lập tenant, xác minh artifact, đa phiên bản — chạy trên **PostgreSQL/Redis thật, không H2** (**211/211**, sau bổ sung **220/220**).
- [x] Nghiệm thu vòng đời đầy đủ **Cài → Nâng cấp → Tắt/Bật → Gỡ (giữ dữ liệu) → Cài lại** trên môi trường thật.
- [x] **Deployer tự động** hoạt động trên **Docker local**: container riêng theo tenant được tạo thật, đạt `ACTIVE`; schema tenant giữ nguyên sau soft uninstall.
- [x] Nghiệm thu **3 kênh phân phối**: Docker Hub, Image Registry (link + credentials), JAR + Web bundle (`package` sinh uber-jar + bundle.zip, checksum SHA-256; build image ngoài transaction).
- [x] **Đa phiên bản**: 2 tenant dùng 2 phiên bản khác nhau của cùng plugin.
- [x] **Khóa plugin**: cưỡng chế gỡ toàn bộ tenant + thông báo; dữ liệu giữ nguyên; badge "Đã khóa" + disable hành động (BUG-101 fix).
- [x] **Plugin riêng của Tenant** (`TENANT_PRIVATE`): đăng ký + cài cho chính tenant; tenant khác không thấy; Super Admin giám sát + khóa; artifact sai checksum bị từ chối.
- [x] **Cô lập dữ liệu tenant**: schema/DB riêng theo tenant, DB role least privilege; test chống rò rỉ chéo.
- [x] **CLI** sinh dự án plugin: `create` / `generate entity|menu|ui-contribution` / `validate` / `package` / `link` / `inspect` / `dev`; smoke `3/3 PASS`.
- [x] **Hai chế độ hiển thị Web**: màn hình riêng + UI Contribution nhúng (Web Components / Module Federation), iframe sandbox dự phòng; 0 console error.
- [x] **Frontend kiểm thử Dual-mode**: Web Desktop ≥1280px + Mobile Emulation 390×844px; **0 console error**; overflow 0; touch target ≥ 40px.
- [x] Tài liệu kỹ thuật: `docs/07_deployment_guides/plugin_manager_infrastructure_guide.md`, `docs/08_developer_guides/plugin_web_packaging_guide.md`, cập nhật Entity Registry + `create_new_plugin_guide.md`.

### 4.2. Chưa hoàn tất (điều kiện chặn đóng Sprint)

- [ ] **100% item mức `Critical`/`High` đạt `Done`** — còn **4 BUG `In Review` chưa được Reviewer ký** (BUG-86/92/93 High, BUG-94 Medium) và **TASK-348 `In Review`**.
- [ ] **Reviewer ký xác nhận** BUG-86/92/93/94 và TASK-348 (BUG-87 và BUG-95→108/109/110/112/113/115/116/99 đã `Resolved`/xác nhận triển khai kèm bằng chứng).
- [ ] **User Guide Sprint 03 (UG-03) kèm ảnh minh chứng** — đang được soạn song song tại [sprint_03_plugin_manager_user_guide.md](../../../06_user_guides/sprint_03_plugin_manager_user_guide.md); chưa ban hành.
- [ ] **Biên bản nghiệm thu `sprint_review.md` được lập** — *tài liệu này đang được lập (Bước 9).*
- [ ] **Khách hàng sign-off Bước 7/8/9** (chữ ký nghiệm thu cuối — xem mục 8).
- [ ] **Smoke K8s staging của Deployer** — chưa chạy do thiếu hạ tầng staging (Docker local đã PASS; ghi nhận theo dõi, xem mục 7).

> **KẾT LUẬN DoD**: `[ ]` **Sprint 03 CHƯA ĐỦ ĐIỀU KIỆN ĐÓNG**. Còn điều kiện chặn ở mục 4.2 chưa thỏa.

---

## 5. Điều Kiện Còn Lại Để Đóng Sprint

1. **Reviewer ký** các item `In Review`: **BUG-86, BUG-92, BUG-93, BUG-94** và **TASK-348** (kèm bằng chứng static/browser đã có).
2. **Ban hành User Guide Sprint 03 (UG-03) kèm ảnh minh chứng** — hiện đang được một agent khác soạn song song tại `docs/06_user_guides/sprint_03_plugin_manager_user_guide.md`.
3. **PM ban hành `sprint_review.md`** (Bước 9) — chính là tài liệu này, sau khi đã cập nhật Task Board / Work Log / Changelog.
4. **Khách hàng sign-off Bước 7/8/9** (chữ ký nghiệm thu cuối tại mục 8).

> Sau khi 4 điều kiện trên hoàn tất, PM sẽ cập nhật trạng thái Sprint 03 sang **ĐÓNG** theo DoD Gate. **Không có tài liệu nào trong Sprint 03 được phép tuyên bố đã đóng trước thời điểm đó.**

---

## 6. Danh Sách Hạng Mục Hoãn Sang Sprint 04 (Deferred Items)

> Chỉ áp dụng cho item mức `Medium`/`Low` đã thống nhất hoãn — không vi phạm điều kiện "0 item > Medium".

| Mã Định Danh | Tiêu Đề | Mức Độ | Lý Do Hoãn | Chuyển Sang |
| :--- | :--- | :---: | :--- | :--- |
| **BUG-98** | Notification Bell TopBar + banner toàn cục + banner Dashboard Mobile | Medium | Chỉ ảnh hưởng hiển thị/nhắc nhở (có workaround tại `/settings/plugins`); cần chỉnh shared TopBar dùng chung 2 nền tảng → gom cùng đợt Sprint 04. | Sprint 04 |
| **TASK-346** | Job phục hồi thao tác plugin (idempotent recovery) + phát hiện chu trình dependency | Medium | Cải thiện độ bền vững, không chặn luồng chuẩn; cần thiết kế thêm mã lỗi + job scheduler. | Sprint 04 |
| **TASK-347** | Hoàn thiện lệnh CLI `publish` (đẩy image/bundle lên registry nội bộ) | Medium | Phụ thuộc hạ tầng registry nội bộ thực tế của staging; dev hiện dùng `package` + upload trên UI. | Sprint 04 |
| **TASK-348 (phần phụ)** | Route-state cho `/account/sessions` + danh sách Mobile (roles, organization, sample-records, emergency) | Medium | Phần chính (7/7 màn Sprint 01/02 + 5 màn Plugin Manager) đã Done; phần phụ chuyển tiếp. | Sprint 04 |

### 6.1. Tồn Đọng Kỹ Thuật Khác (Follow-up, không phải item chặn)

| Hạng Mục | Ghi Chú | Đề Xuất |
| :--- | :--- | :--- |
| **TASK-331 — OCI token auth khi pull manifest/digest** | `credential_id` đã nhận/lưu (BUG-96); phần pull manifest/digest bằng credential còn `In Progress`, cần registry thật để nghiệm thu. | Hoàn tất khi có hạ tầng Image Registry Sprint 04. |
| **TASK-337 — script backup/restore theo tenant** | `ensureDatasource` + role/password + rotate đã code; script backup/restore còn lại. | Bổ sung cùng snapshot retention Sprint 04. |
| **Smoke K8s staging của Deployer** | Docker local PASS; K8s staging chưa chạy do thiếu hạ tầng. | Chạy khi có môi trường staging; không chặn DoD local. |
| **BUG-83 (tồn đọng Sprint 02)** | QA re-measure runtime `resp2.mjs` (`sharedTopbarSmall=[]`, `navSmall=[]`). | Chốt trong đợt chỉnh shared TopBar Sprint 04 (cùng BUG-98). |

---

## 7. Bài Học Kinh Nghiệm (Retrospective)

### 7.1. Điểm làm tốt

1. **QA browser thật bắt được lỗi nặng trước nghiệm thu**: phát hiện **BUG-102/103 (Critical)** và chuỗi BUG-104→108 (High) chỉ lộ khi chạy trình duyệt + Docker thật, khẳng định giá trị của Dual-mode Browser Testing.
2. **E2E khép kín CLI → cài plugin**: `npm run e2e:plugin` chạy thật từ sinh dự án plugin đến container `Running` + schema + ledger `ACTIVE`, đúng cam kết.
3. **Cô lập tenant được kiểm chứng bằng hạ tầng thật**: schema riêng theo tenant, DB role least privilege, container-per-tenant; dữ liệu giữ nguyên sau soft uninstall.
4. **Chuẩn hóa path-segment cho danh sách**: khách hàng chốt `/:filter/:sort/:pageSize/:page/:id/:mode`, helper dùng chung `PathListStateService` áp dụng 12 màn — deep-link/F5/Back hoạt động.

### 7.2. Điểm cần cải thiện

1. **Trạng thái item phải được cập nhật đồng thời với code**: một số dòng sub-task còn lệch trạng thái giữa file FEAT và báo cáo QA; cần quy tắc cập nhật item ngay khi fix xong để PM tổng hợp chính xác.
2. **Item `In Review` cần Reviewer ký đúng hạn**: 4 BUG `In Review` đang là điều kiện chặn đóng Sprint; cần chốt lịch ký sớm để không dồn về cuối sprint.
3. **Phụ thuộc hạ tầng thật (registry, K8s staging)**: TASK-331/337 và smoke K8s nên được đánh dấu rõ phụ thuộc hạ tầng trong Definition of Ready để không chặn nghiệm thu local.

### 7.3. Hành động cụ thể cho Sprint sau

1. Reviewer ký đóng BUG-86/92/93/94 + TASK-348 trước khi chuyển Sprint 04.
2. Gom nhóm chỉnh shared TopBar (BUG-98 + BUG-83) và route-state phần phụ (TASK-348) vào Sprint 04.
3. Đưa hạ tầng Image Registry + K8s staging vào Definition of Ready khi nghiệm thu TASK-331/337 và deployer K8s.
4. Duy trì chính sách test thực dụng: backend trên PostgreSQL/Redis thật, không H2; frontend Dual-mode browser.

---

## 8. Xác Nhận Của PM Agent

- Tổng item Sprint 03: **174** — **167 `Done`/`Resolved`**; **7 chưa hoàn tất** (4 `In Review` + 3 `Deferred`); ngoài ra **TASK-348 `In Review`** (7/7 màn chính Done).
- Backend full suite **211/211 PASS** (bổ sung sau → **220/220 PASS**) trên PostgreSQL + Redis thật, không H2; Web/Mobile build PASS.
- QA Dual-mode browser **40/40 PASS, 0 console error**; ảnh minh chứng lưu tại `08_testing/evidence/screenshots/`.
- **`[ ]` Sprint 03 CHƯA ĐÓNG.** Còn 4 điều kiện tại mục 5 chưa hoàn tất: Reviewer ký 4 BUG + TASK-348, ban hành User Guide UG-03, PM ban hành `sprint_review.md` (đang lập), và Khách hàng sign-off Bước 7/8/9.
- PM **không tự ký** thay Reviewer/Khách hàng; trạng thái đóng Sprint sẽ được cập nhật sau khi đủ 4 điều kiện.

---

## 9. Chữ Ký Phê Duyệt Nghiệm Thu Của Khách Hàng (Customer Acceptance Sign-Off)

> Các ô dưới đây **để trống**, do người thật (Reviewer/Khách hàng) ký. PM không tick thay.

- **Đại Diện Khách Hàng (Product Owner)**: ........................................ (Ngày ký: ..../..../2026)
- **Đại Diện Quản Trị Dự Án (PM Agent)**: ........................................ (Ngày ký: ..../..../2026)

> **Trạng thái sau ký duyệt**: (chưa đóng) — chỉ được đánh dấu ĐÓNG khi tất cả điều kiện tại mục 5 hoàn tất.
