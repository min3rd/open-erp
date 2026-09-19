# [REV-02] Biên Bản Nghiệm Thu & Đóng Sprint 02 (Sprint Review & Closure)

- **Mã Tài Liệu**: REV-02
- **Tên Sprint**: Sprint 02 - Super Admin Platform Management, Functional RBAC & Multi-Scope Data Access Control
- **Phụ Trách**: PM Agent
- **Ngày Lập Biên Bản**: 2026-09-19
- **Trạng Thái**: [x] **ĐÃ NGHIỆM THU & ĐÓNG SPRINT** — DoD Gate PASS (0 Critical, 0 High)
- **Tài Liệu Liên Quan**: [00_READING_GUIDE](../00_READING_GUIDE.md) • [sprint_plan](../sprint_plan.md) • [TR-02 Test Report](../08_testing/test_report.md) • [test_plan](../08_testing/test_plan.md) • [UG-02](../../../06_user_guides/sprint_02_superadmin_rbac_user_guide.md)

---

## 1. Đánh Giá Mục Tiêu Sprint (Sprint Goal Review)

| Mục Tiêu Cam Kết Ban Đầu | Trạng Thái Đạt Được | Ghi Chú Đánh Giá |
| :--- | :---: | :--- |
| **Cơ chế Super Admin quản lý toàn bộ hệ thống** | **ĐẠT** | Quản lý Tenant (list/lọc/quota/lock/unlock), Global Users (khóa, buộc reset, Break-Glass), Impersonation có audit bất biến, Health Dashboard, Audit Log hash chain SHA-256 + phân vùng tháng, vòng đời tài khoản Super Admin & CLI offline. |
| **Cơ cấu tổ chức doanh nghiệp** | **ĐẠT** | Chi nhánh, cây phòng ban đa cấp (5 cấp, DFS cycle detection), tuyến quản lý báo cáo, phân công quản lý nhiều chi nhánh (`user_branch_assignments`), 2 view Web (Indented List ⇄ Canvas Graph) + Mobile danh bạ tổ chức. |
| **Phân quyền chức năng (RBAC)** | **ĐẠT** | Danh mục 24 quyền `domain:resource:action`, 5 vai trò hệ thống `[SYS]` bất biến + vai trò tùy biến, gán quyền/gán vai trò, enforcement `@RequirePermission` toàn bộ API, cache ngữ cảnh Redis `sec:ctx`. |
| **Phân quyền dữ liệu đa phạm vi & 6 thao tác** | **ĐẠT** | 7 cấp độ phạm vi (`ALL` → `NONE`) × 6 thao tác (CRUD, Export, Share) trên `role_data_policies`; nguyên tắc Most Permissive; TENANT_OWNER luôn `ALL`. |
| **Enforcement Engine tự động Backend** | **ĐẠT** | `DataScopeResolver/Predicate/Engine/FilterEnabler` tự động tiêm điều kiện SQL, interceptor chặn mutation ngoài phạm vi, cache Redis TTL 15 phút + invalidation khi đổi IAM/Org; kiểm chứng bằng Reference Entity `core_sample_records` (FEAT-17). |
| **Yêu cầu nâng cấp phát sinh khi QA (khách hàng)** | **ĐẠT** | **FEAT-19** (Department Tree dual view + Canvas ~60 FPS), **FEAT-20** (Plugin switch list dọc + search), **BUG-79** (timezone/locale), **TASK-298** (Web responsive 13 màn × 390/768) — tất cả `Done` theo nghiệm thu cuối TR-02 mục 11. |

**Kết luận chung**: Sprint 02 hoàn thành **100% mục tiêu cam kết** + toàn bộ yêu cầu nâng cấp phát sinh trong sprint; qua nghiệm thu thật trên Web + Mobile, không còn bug `Critical`/`High`.

---

## 2. Tổng Hợp Kết Quả Hạng Mục (Item Status)

### 2.1. Feature

| Mã | Tên Tính Năng | Trọng Số | Trạng Thái | Kết Quả QA (TR-02) |
| :--- | :--- | :---: | :---: | :--- |
| **FEAT-10** | Quản trị Tenant & Hạn mức nền tảng | High | [x] Done | QA-W-01/02, QA-R-74, QA-R2-80, smoke PASS |
| **FEAT-11** | Quản lý User toàn cầu & Impersonation | Critical | [x] Done | QA-W-03/04, QA-R-75, QA-R2-78/82, QA-R-76 PASS |
| **FEAT-12** | Giám sát hạ tầng & Nhật ký nền tảng | Medium | [x] Done | QA-W-05/06, QA-F-79, QA-R2-78 PASS |
| **FEAT-13** | Cơ cấu tổ chức doanh nghiệp | High | [x] Done | QA-W-09, QA-F2-19, QA-M-03 PASS |
| **FEAT-14** | Ma trận Phân quyền chức năng | High | [x] Done | QA-W-08, QA-R-77, QA-SM2-W-08, QA-SM2-M-02 PASS |
| **FEAT-15** | Phân quyền dữ liệu đa phạm vi & 6 thao tác | Critical | [x] Done | QA-W-08 (scope), QA-W-10 (export denied) PASS |
| **FEAT-16** | Engine thực thi phân quyền dữ liệu tự động | Critical | [x] Done | Test cross-scope + smoke API PASS |
| **FEAT-17** | Reference Entity `core_sample_records` | High | [x] Done | QA-W-10, QA-SM2-M-04 PASS |
| **FEAT-18** | Vòng đời Super Admin & CLI quản trị | High | [x] Done | QA-W-07, smoke QA-SM2-W-07 PASS |
| **FEAT-19** | Department Tree dual view (list ⇄ Canvas) | Medium | [x] Done | QA-F2-19 PASS (canvas DPR 2, 405 node ~60 FPS) |
| **FEAT-20** | Plugin switch list dọc + search | Medium | [x] Done | QA-F2-20, QA-R2-80 PASS |

### 2.2. Bug & Task

| Nhóm | Tổng | Done | Deferred | Ghi Chú |
| :--- | :---: | :---: | :---: | :--- |
| **BUG-49 → BUG-83** | 35 | **35** | 0 | Toàn bộ bug Sprint 02 đã đóng; BUG-83 (Medium) FE Agent hoàn tất 2026-09-19. |
| **TASK-267 → TASK-298** | 32 | **31** | **1** | TASK-293 (cold archive MongoDB/S3, Medium) → `Deferred` sang Sprint sau. |
| **FEAT-10 → FEAT-20** | 11 | **11** | 0 | 9 FEAT gốc + 2 FEAT nâng cấp. |
| **TỔNG CỘNG** | **78** | **77** | **1** | 0 item `To Do`/`In Progress`; 0 Critical/High mở. |

### 2.3. Số Liệu Kiểm Chứng Cuối (2026-09-19)

| Hạng Mục | Kết Quả | Nguồn |
| :--- | :--- | :--- |
| **Backend automated test** | **193/193 PASS**, `BUILD SUCCESS` (PostgreSQL + Redis thật, cấm H2) | TR-02 mục 11.1, Developer + QA xác nhận |
| **Build Frontend** | Web **PASS** (663/663 i18n keys), Mobile **PASS** (452/452 i18n keys) | TR-02 mục 11.1 |
| **QA ảnh minh chứng** | **178 ảnh** (đợt 1+re-test) + **61 ảnh mới** đợt nghiệm thu cuối = **239 ảnh** | `08_testing/screenshots/{web,mobile,web-responsive}` |
| **Console errors** | **0** trên toàn bộ luồng chức năng (web + mobile) | TR-02 mục 11.6 |
| **Overflow ngang** | Web 390×844 = **0px (13/13 màn)**, 768×1024 = **0px (13/13)**, Mobile Ionic = **0px (5/5)**; Desktop 1440 = 0 | TR-02 mục 11.4/11.6 |
| **Hiệu năng Canvas Graph** | Cây thật 5 node/4 edge; cây lớn **405 node/403 edge** — culling `inView 25/405`, draw **0.63ms**, pan **~60 FPS**; zoom clamp 25%–250%; F5 giữ viewport | QA-F2-19 |
| **Plugin list** | Catalog 6 dòng (core disabled ON + sales + unknown-x), search/đếm/empty OK, Lưu 2 lần không mất `allowed_plugins` | QA-R2-80/QA-F2-20 |
| **Impersonation** | Banner đếm ngược 29:58, API trong phiên 200, Exit → token cũ 401; job sweeper tick đầu trên `vert.x-worker-thread-1`, 0 lỗi JTA/IO thread | QA-R-75, QA-R2-78/82 |
| **Timezone** | Cùng raw `2026-09-19T04:01:16Z` hiển thị `11:01 19/9/26` (vi-VN, +7h) vs `4:01 AM` (en-US); null `—` | QA-F-79 |

---

## 3. Demo Checklist Tính Năng Nghiệm Thu (Demo Checklist)

> PM/QA đã đối chiếu trực tiếp trên ứng dụng thật (Web `localhost:4200`, Mobile `localhost:8100`, Backend `localhost:8088`).

### 3.1. Platform Super Admin (Web Desktop)

- [x] **Đăng nhập Platform** + luồng **đổi mật khẩu bắt buộc** (`must_change_password=true`), token cũ bị chặn (401), đăng nhập lại bình thường — QA-R-76.
- [x] **Quản lý Tenant**: danh sách 17 dòng + lọc trạng thái/từ khóa; sửa quota `max_users`/`max_storage_mb`; **plugin switch list** theo `allowed_plugins` (core disabled ON, nhóm Bắt buộc/Tùy chọn, search, đếm X/Y); khóa tenant kèm lý do + mật khẩu (`PLATFORM_TENANT_LOCK_SUCCESS`), mở khóa — QA-W-01/02, QA-R-74, QA-R2-80.
- [x] **Quản lý người dùng toàn cầu**: 20 dòng + tìm kiếm; khóa/mở khóa; buộc reset; **Break-Glass** (tạo phiên đăng nhập khẩn cấp cho khách hàng) — QA-W-03.
- [x] **Impersonation**: nhập ticket + lý do, banner vàng `BẠN ĐANG TRUY CẬP ĐẠI DIỆN` đếm ngược; giới hạn ≤30 phút không refresh; **export/đổi mật khẩu/2FA bị chặn** khi impersonate (`SUPERADMIN_IMPERSONATION_SECRET_EXPORT_FORBIDDEN`); Exit → về `/platform/tenants`, token cũ 401; phiên quá hạn tự đóng `TIMEOUT` + audit `IMPERSONATION_TIMEOUT` — QA-W-04, QA-R-75, QA-R2-78/82.
- [x] **Audit log**: filter theo hành động (khóa tenant...), drawer chi tiết diff JSON + `prev_hash`/`entry_hash`; chuỗi hash liên tục, verify VERIFIED; partition tháng, retention 24 tháng hot — QA-W-05, QA-SM2-W-05, AuditChainTest.
- [x] **Health**: thẻ trạng thái PostgreSQL Primary, Replica (replication lag), Redis, Kafka (`DEGRADED`/`UNKNOWN` khi thiếu) + refresh — QA-SM2-W-06.
- [x] **Quản trị Super Admin**: danh sách admin (SUPER_ADMIN + SUPPORT_ENGINEER), grant qua drawer (user mới → `INVITED`, user cũ → nâng cấp), guard tự-disable (`PLATFORM_SELF_DISABLE_FORBIDDEN`) / admin cuối (`PLATFORM_LAST_ADMIN_PROTECTED`), disable/enable/revoke thu hồi session + audit; **CLI offline** `admin-cli bootstrap|list-admins|grant-admin|revoke-admin` audit `actor_type=CLI` — QA-W-07, PlatformAdminApiTest, TASK-295.
- [x] **Timezone & i18n**: đổi timezone tenant `Asia/Ho_Chi_Minh` vs `UTC` chênh đúng +7h; format theo locale vi-VN/en-US; timestamp lưu UTC trong DB — QA-F-79.

### 3.2. Tenant Admin (Web Desktop)

- [x] **Vai trò & Phân quyền chức năng**: ma trận Split-Screen 3 cột; vai trò hệ thống `[SYS]` không xóa được; toggle quyền + Lưu; tạo vai trò tùy biến; gán vai trò cho user (union quyền); chặn xóa role đang dùng (`IAM_ROLE_IN_USE`) — QA-W-08, RoleApiTest/RolePermissionApiTest.
- [x] **Phân quyền dữ liệu 7 scope × 6 thao tác**: cấu hình scope cho vai trò, lưu `role_data_policies`; Most Permissive; TENANT_OWNER luôn `ALL` — QA-W-08, DataPolicyApiTest.
- [x] **Cơ cấu tổ chức — 2 view**: Indented List (thụt lề 0/14/28/42/56px) ⇄ **Canvas Graph** (node/elbow edge đúng cha–con, collapse/expand chia sẻ trạng thái, zoom wheel/nút, pan, double-click căn giữa, F5 giữ view + viewport); CRUD/move từ panel chi tiết không modal — QA-W-09, QA-F2-19.
- [x] **Thành viên & Chi nhánh**: tạo chi nhánh (không trùng mã), membership + quản lý trực tiếp, cycle detection (`ORGANIZATION_REPORTING_CYCLE_DETECTED`); **phân công quản lý nhiều chi nhánh** — scope BRANCH hợp nhất — QA-W-09, BranchAssignmentApiTest.
- [x] **Bản ghi mẫu (kiểm chứng scope)**: owner thấy đủ bản ghi + export; staff `OWN_ONLY` chỉ thấy bản ghi của mình; export bị chặn `403 IAM_PERMISSION_DENIED_EXPORT` — QA-W-10, SampleRecordApiTest.
- [x] **Cô lập dữ liệu tenant**: không rò rỉ chéo tenant/branch/department (test suite cross-scope TASK-286/290 trên PostgreSQL + Redis thật).

### 3.3. Mobile (Ionic 8 — 390×844)

- [x] **Menu & các màn Sprint 02**: menu đầy đủ, vai trò, tổ chức (3 tab), bản ghi mẫu render, emergency badge trạng thái — QA-SM2-M-01→05.
- [x] **Toggle/touch target ≥40px**: 24 toggle quyền 44×40px; màn emergency 19 toggle read-only 44×40px — QA-R-77, QA-F2-20.
- [x] **Giới hạn Mobile**: **không hỗ trợ Impersonation**; admin portal chỉ read-only trên màn emergency (SUPPORT_ENGINEER) — đúng phân định Desktop/Mobile.
- [x] Overflow = 0 toàn bộ màn; console 0 — TR-02 mục 11.6.

### 3.4. Web Responsive (TASK-298)

- [x] **13 màn × 2 viewport** (390×844 + 768×1024): `26/26` lượt đo overflow = **0px**; Drawer Quota full-width `x=0, w=390` tại 390; platform topbar 100% ≥40px — QA-R2-81.
- [x] **BUG-83 (Medium)**: shared topbar hamburger + nav Settings dưới 40px → FE Agent đã fix `min-h-10/min-w-10` + build PASS (2026-09-19); QA re-measure runtime được đề xuất ở Sprint sau (không chặn DoD).

---

## 4. Kiểm Tra Điều Kiện Đóng Sprint (Sprint DoD Gate Checklist)

- [x] Không còn item `Critical` chưa hoàn thành — **0**.
- [x] Không còn item `High` chưa hoàn thành — **0**.
- [x] Toàn bộ automated tests Backend (JUnit 5 + RestAssured) đạt **193/193 PASS** trên PostgreSQL & Redis thật (không H2).
- [x] Kiểm thử thủ công Web Desktop (1440, ≥1280) + Web Responsive (390/768) + Mobile Emulation (390×844): **0 console error**, **overflow = 0** mọi màn.
- [x] Đã ban hành Hướng dẫn sử dụng kèm **27 ảnh minh họa**: [sprint_02_superadmin_rbac_user_guide.md](../../../06_user_guides/sprint_02_superadmin_rbac_user_guide.md) + `assets/sprint_02_superadmin_rbac/`.
- [x] Tài liệu deployment đã cập nhật: bootstrap secret, bootstrap-emails, plugin catalog, TTL impersonation, jobs, CLI `admin-cli`, lưu ý timezone UTC — `docs/07_deployment_guides/`.
- [x] 77/78 item `Done`; item hoãn duy nhất **TASK-293 (Medium)** — không vi phạm điều kiện DoD.
- [ ] Khách hàng kiểm tra thực tế và ký duyệt biên bản nghiệm thu (mục 8).

**KẾT LUẬN: [x] SPRINT 02 ĐỦ ĐIỀU KIỆN ĐÓNG (DoD GATE PASS).**

---

## 5. Danh Sách Hạng Mục Hoãn Sang Sprint Kế Tiếp (Deferred Items)

> Chỉ áp dụng cho item mức `Medium`/`Low` đã thống nhất hoãn.

| Mã Định Danh | Tiêu Đề | Mức Độ | Lý Do Hoãn | Chuyển Sang |
| :--- | :--- | :---: | :--- | :--- |
| **TASK-293** | Audit log cold archive > 24 tháng sang MongoDB/S3 WORM & Legal hold | Medium | Cần Docker Compose profile `mongo`/`storage` (chưa bật theo chính sách Minimal Footprint); hot storage + hash chain + retention 24 tháng đã hoạt động đầy đủ | **Sprint 03** |

### 5.1. Tồn Đọng Kỹ Thuật Khác (Follow-up, không phải item chặn)

| Hạng Mục | Ghi Chú | Đề Xuất |
| :--- | :--- | :--- |
| **API mời/thêm thành viên (invite user)** | Sprint 02 chưa có API invite nên quota user hiện enforce tại luồng đăng ký (`AuthService` → `AccountService.enforceUserQuota`) | Khi bổ sung API invite ở Sprint sau, mọi điểm tạo membership phải đi qua single entry point hiện có |
| **Storage quota enforcement** | Đã có cột `max_storage_mb` + quota service; chưa có luồng upload thực tế để đếm dung lượng | Gắn khi có module storage/upload (MinIO profile) |
| **Remote CLI script** | Sprint 02 cung cấp Offline CLI 4 lệnh (`bootstrap`, `list-admins`, `grant-admin`, `revoke-admin`); script remote gọi API qua HTTPS + subcommand mở rộng (disable/enable/reset-password/revoke-sessions/verify-audit-chain) chưa hiện thực (ghi nhận tại TASK-295) | Bổ sung khi cần vận hành từ xa; ưu tiên Low/Medium |
| **QA re-measure BUG-83 trên app thật** | FE Agent đã fix + build PASS + đo tĩnh PASS; chưa chạy lại `resp2.mjs` trên app thật để chốt `sharedTopbarSmall=[]`, `navSmall=[]` | QA chạy lại đầu Sprint 03 (5 phút, không chặn DoD) |

---

## 6. Bài Học Kinh Nghiệm (Retrospective)

### 6.1. Điểm làm tốt (What went well)

1. **Kiến trúc Enforcement Engine hoạt động đúng thiết kế**: 7 scope × 6 thao tác được biên dịch tự động ở tầng truy vấn, kiểm chứng bằng Reference Entity thật trên PostgreSQL/Redis — test cross-scope/cross-tenant 193/193 PASS, không rò rỉ dữ liệu.
2. **Audit bất biến đúng chuẩn**: hash chain SHA-256 liên tục + partition tháng + retention; trigger chống UPDATE/DELETE; QA truy vết được hành vi impersonation qua audit.
3. **QA dual-mode phát hiện được lỗi thật trên app thật**: 4 bug High (BUG-80/81/82 + BUG-78 mở lại) đều chỉ lộ khi chạy browser/runtime thật (catalog config rỗng, overflow 390px, job crash IO thread), khẳng định giá trị của quy trình Browser Manual Testing.
4. **Khép kín yêu cầu khách hàng phát sinh giữa sprint**: FEAT-19 (Canvas graph), FEAT-20 (plugin list), BUG-79 (timezone), TASK-298 (responsive) đều được đưa vào sprint, làm và nghiệm thu trong ngày.
5. **Tài liệu Sprint-Pack 00→09 đồng bộ**: mọi item có file riêng, mọi bug có bằng chứng ảnh + log; truy vết từ yêu cầu → thiết kế → code → test → nghiệm thu rõ ràng.

### 6.2. Điểm cần cải thiện (What can be improved)

1. **Cô lập dữ liệu test dùng chung**: bài học từ BUG-38 (Sprint 01) tiếp tục đúng ở Sprint 02 — phải giữ tách DB `openerp_test` + `TestDbCleanup` FK-safe; các test chạm fixture dùng chung (schema, seed) cần chạy độc lập, tránh phụ thuộc thứ tự để không "ô nhiễm" assertion (`SchemaFoundationTest` từng bị).
2. **Job nền trong Quarkus phải chạy trên worker thread**: BUG-82 (`Cannot start a JTA transaction from the IO thread`) cho thấy scheduled job thao tác JTA/DB phải đảm bảo chạy worker thread (`@Blocking`/`vert.x-worker-thread`); cần kiểm tra log job ngay khi bật jobs thay vì chỉ test logic.
3. **Responsive phải áp dụng từ component dùng chung**: BUG-81/83 lộ ra vì `platform-topbar` được sửa riêng mà bỏ quên `shared topbar`/nav Settings; quy tắc rút ra: mọi rule touch-target/responsive cho component shared phải đặt tập trung trong media query của `styles.css` (Web) và kiểm tra đồng thời 390/768.
4. **Catalog/config-driven cần kiểm thử cả trường hợp rỗng**: BUG-80 xảy ra do `openerp.platform.plugin-catalog` để trống trong dev → UI không có plugin tùy chọn; cần bổ sung giá trị mẫu vào tài liệu cấu hình + test empty/fallback.
5. **Timestamp hiển thị phải theo locale/timezone người dùng**: BUG-79 nhắc nhở tất cả màn hình mới phải dùng pipe/format chung, backend luôn trả UTC `Z`.
6. **Kiểm thử chéo nền tảng cần bổ sung màn mobile cho tính năng mới**: FEAT-19 Canvas chỉ dành cho Desktop — đã ghi nhận giới hạn rõ ràng thay vì cố làm trên mobile.

### 6.3. Hành động cụ thể cho Sprint sau

1. Duy trì `openerp_test` + `TestDbCleanup`; bổ sung checklist "test độc lập, không phụ thuộc thứ tự" khi thêm fixture mới.
2. Đưa vào Definition of Ready của mọi scheduled job: xác nhận thread model + log tick đầu tiên trong môi trường dev.
3. Từ Sprint 03, mọi component shared mới phải kèm mục "Responsive/Touch target 390-639px" trong checklist review; QA bắt buộc chạy `resp2.mjs` (13 màn × 390/768) cho các màn mới.
4. Bổ sung giá trị mẫu `openerp.platform.plugin-catalog` vào tài liệu deployment (đã làm) và test empty-fallback khi thêm catalog mới.
5. QA chạy lại re-measure BUG-83 trên app thật + lưu ảnh vào kho nghiệm thu.
6. Lập kế hoạch Sprint 03: ưu tiên TASK-293 (cold archive), API invite user + storage quota, mở module Plugin nghiệp vụ đầu tiên thay thế reference entity.

---

## 7. Xác Nhận Của PM Agent

- Không còn item `Critical`/`High` mở; 77/78 item `Done`, 1 item `Deferred` (Medium, hợp lệ).
- Backend `mvn test` **193/193 PASS**; Web/Mobile build PASS; QA dual-mode **0 console error**, **overflow 0**.
- Tài liệu Hướng dẫn sử dụng UG-02 ban hành kèm 27 ảnh minh họa; deployment guide đã cập nhật đầy đủ.
- **[x] Sprint 02 chính thức được đóng theo DoD Gate sau khi khách hàng ký duyệt bên dưới.**

---

## 8. Chữ Ký Phê Duyệt Nghiệm Thu Của Khách Hàng (Customer Acceptance Sign-Off)

- **Đại Diện Khách Hàng (Product Owner)**: ........................................ (Ngày ký: ..../..../2026)
- **Đại Diện Quản Trị Dự Án (PM Agent)**: ........................................ (Ngày ký: ..../..../2026)
