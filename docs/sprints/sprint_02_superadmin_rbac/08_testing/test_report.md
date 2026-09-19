# [TR-02] Báo Cáo Kiểm Thử Sprint 02 - Super Admin & Phân Quyền Toàn Diện (Dual-Mode Browser QA + Re-test)

- **Mã Báo Cáo**: TR-02
- **Thuộc Sprint**: Sprint 02 - Super Admin Platform Management, Functional RBAC & Multi-Scope Data Access Control
- **Người Thực Hiện**: QA/QC Agent
- **Ngày Lập Kế Hoạch (TEST-02)**: 2026-09-18
- **Ngày Thực Thi (đợt 1)**: 2026-09-19 — phát hiện BUG-74/75/76/77/78
- **Ngày Re-test (đợt 2)**: 2026-09-19 — sau khi sửa 4 bug High + 4 yêu cầu mới (FEAT-19, FEAT-20, BUG-79, TASK-298)
- **Kết Luận Re-test**: **KHÔNG ĐẠT điều kiện đóng Sprint** — phát hiện và/hoặc còn tồn **4 mức High**: BUG-78 (mở lại một phần — job sweeper crash), BUG-80 (catalog plugin thiếu tùy chọn), BUG-81 (web Platform tràn ngang 390px), BUG-82 (ImpersonationTimeoutJob crash IO thread).
- **Ngày Nghiệm Thu Cuối**: 2026-09-19 — sau fix BUG-78/80/81/82 + nâng cấp FEAT-19 (Canvas graph) / FEAT-20 (plugin list) / TASK-298 (web responsive).
- **Kết Luận Nghiệm Thu Cuối**: **ĐẠT điều kiện đóng Sprint 02** — **0 Critical, 0 High**; tất cả bug High đã xác nhận PASS trên app thật/dev; FEAT-19, FEAT-20, TASK-298 **Done**; 1 bug mới **BUG-83 (Medium)** touch target shared topbar/nav (không chặn DoD). Chi tiết đợt cuối: xem **mục 11** bên dưới.

---

## 1. Môi Trường & Công Cụ Kiểm Thử

| Thành Phần | Thông Tin |
| :--- | :--- |
| Web Angular 22 | `http://localhost:4200` — Chrome (Playwright `channel=chrome`, headless); Desktop 1440×900; Re-test responsive: **390×844** và **768×1024** |
| Mobile Ionic 8 | `http://localhost:8100` — Device Emulation **390×844**, `isMobile`, `hasTouch`, DPR 2 (UA iPhone) |
| Backend Quarkus (dev) | `http://localhost:8088` — `JAVA_TOOL_OPTIONS=-Dnet.bytebuddy.experimental=true`; jobs bật (`impersonation.jobs-enabled=true`, interval 300s) |
| Hạ tầng | PostgreSQL 16 `openerp-postgres-primary` (db `openerp_dev`), Redis thật, Mailpit (đọc email reset để thiết lập mật khẩu test) |
| Công cụ | **Playwright 1.63.0** cài tạm tại `%TEMP%\opencode\qa02` (KHÔNG thêm dependency vào dự án) |
| Tài khoản test (không commit) | `qa.sa02@example.com` (SUPER_ADMIN), `qa.owner02@example.com` (TENANT_ADMIN — tenant `qa-test-corp-02`), `qa.staff02a/b@example.com` (STAFF), `qa.support02@example.com` (SUPPORT_ENGINEER — mật khẩu do QA đổi trong phiên test, lưu ngoài repo) |
| Ảnh minh chứng đợt 1 | `screenshots/web/` 75 ảnh + `screenshots/mobile/` 25 ảnh = **100 ảnh** |
| Ảnh minh chứng re-test | **78 ảnh mới**: `web/` 41, `mobile/` 11, `web-responsive/` 26 → tổng kho: web 116, mobile 36, web-responsive 26 = **178 ảnh** |
| Backend automated | `mvn test` **187/187 PASS** (PostgreSQL + Redis thật, không H2) — do Developer Agent xác nhận trước re-test |
| Build | `npm run build` Web + Mobile PASS (Web 663/663, Mobile 452/452 i18n keys) |

---

## 2. Kết Quả Đợt 1 (2026-09-19) — Tóm Tắt Lịch Sử

| Nhóm | Case | Kết Quả |
| :--- | :--- | :---: |
| Web Desktop | QA-W-01 → QA-W-10 | 9 PASS / 1 FAIL (QA-W-04 — BUG-75) |
| Mobile | QA-M-01 → QA-M-05 | 4 PASS / 1 FAIL (QA-M-02 — BUG-77 touch target) |

Chi tiết đợt 1 giữ nguyên trong lịch sử git của tài liệu này; các phát hiện: BUG-74 (High), BUG-75 (High), BUG-76 (High), BUG-77 (Medium), BUG-78 (High).

---

## 3. Re-test A — Regression 4 Bug High + 1 Medium (2026-09-19)

| Case | Kịch Bản | Kết Quả | Bằng Chứng & Ghi Chú |
| :---: | :--- | :---: | :--- |
| **QA-R-74** | `/platform/tenants` → Hạn mức tenant `allowed_plugins=["core","sales"]` → switch `sales` ON đúng trạng thái; Lưu lại không mất plugin | **FAIL** | **PASS phần fix BUG-74**: API list trả `allowed_plugins=["core","sales"]`; Lưu 2 lần liên tiếp DB vẫn `["core","sales"]` (không ghi đè). **FAIL phần UI**: Drawer **không render switch `sales`** (nhóm Tùy chọn trống — catalog `/platform/plugins` chỉ có `core`) → **BUG-80 (High)**. Ảnh `QA-R-74_a..c` |
| **QA-R-75** | Impersonate → mở `/settings/organization` + `/settings/roles` (không 401), banner đếm ngược; Exit → token vô hiệu | **PASS** | Banner `CÒN LẠI 29:58` giảm theo giây; các API org/iam đều **200** (không còn 401); token impersonation gọi `organization/branches` + `iam/roles` 200; Exit → `/platform/tenants`; token cũ → **401 UNAUTHORIZED**. Console 0. Ảnh `QA-R-75_a..d` |
| **QA-R-76** | Platform admin `must_change_password=true` → đổi mật khẩu → token cũ bị chặn; login lại bình thường | **PASS** | Token trước đổi 403 `PLATFORM_PASSWORD_CHANGE_REQUIRED`; sau đổi token cũ **401**; session localStorage cleared; tự về `/login`; login lại vào `/platform/tenants` render bảng, không lặp đổi mật khẩu. 1 console 401 **là ca âm chủ đích**. Ảnh `QA-R-76_a..d`, `QA-R-76b_a..d` |
| **QA-R-78** | Phiên impersonation hết hạn → lock tenant thành công; log job sweeper đóng TIMEOUT | **FAIL (một phần)** | **PASS lock-path**: phiên còn hạn → 409 `PLATFORM_TENANT_IMPERSONATION_ACTIVE`; phiên backdate quá TTL → lock **200 `PLATFORM_TENANT_LOCK_SUCCESS`**, log `TIMEOUT|ended_at`, audit `IMPERSONATION_TIMEOUT`, unlock về `ACTIVE`. **FAIL job sweeper**: log `ERROR ... Cannot start a JTA transaction from the IO thread` mỗi 300s; phiên `02e720b2-...` vẫn `STARTED` sau >10 phút → **BUG-82 (High)**, mở lại BUG-78 một phần |
| **QA-R-77** | Mobile 390×844 role-detail: toggle ≥40px, không tràn ngang | **PASS** | 24 toggle tab Quyền chức năng + 1 toggle tab Người dùng = **44×40px** (100%); nút expand cây phòng ban **40×40px**; overflow-x = 0 cả 3 màn; console 0. Ảnh `QA-R-77_a..e` |

---

## 4. Re-test B — Tính Năng Mới (2026-09-19)

| Case | Kịch Bản | Kết Quả | Bằng Chứng & Ghi Chú |
| :---: | :--- | :---: | :--- |
| **QA-F-19** | Web `/settings/organization`: 2 view cây phòng ban (indented list ⇄ graph), collapse/expand, selection, đường nối ≤5 cấp, zoom, panel chi tiết; F5 giữ view | **PASS** | Tạo chuỗi 5 cấp; list thụt lề `0/14/28/42/56px`; graph **5 node + 4 elbow edge** đúng cha–con (top `24→128→232→336→440px`); collapse chia sẻ trạng thái giữa 2 view; zoom `100→110→90%`; F5 giữ `graph` qua localStorage; console 0. Ảnh `QA-F-19_a..g` |
| **QA-F-20** | TenantQuotaDrawer switch list (Bắt buộc core disabled ON + Tùy chọn); bật/tắt + Lưu → DB; `GET /platform/plugins`; SUPPORT không thấy action ghi; Mobile read-only ≥40px | **FAIL** | **PASS**: catalog API 200; SUPPORT 403 trên plugins + PATCH quotas; SUPPORT web chỉ-xem (không nút Hạn mức/Truy cập/Khóa); core disabled ON; backend round-trip `allowed_plugins` đúng; mobile 2 toggle read-only 44×40, overflow 0. **FAIL**: nhóm Tùy chọn **trống** — không có switch `sales` → **BUG-80 (High)**. Ảnh `QA-F-20_a..d` |
| **QA-F-79** | Timezone: `Asia/Ho_Chi_Minh` vs `UTC` cùng dữ liệu → chênh +7h, format theo locale `vi-VN`/`en-US`; null = `—` | **PASS** | Cùng raw `2026-09-19T04:01:16.392580Z`: audit hiển thị `11:01 19/9/26` vs `9/19/26, 4:01 AM` = **+420 phút**; tenants `created_at` cũng +420; null `last_login_at` = `—` (10 ô); backend UTC `Z`. Console 0. Ảnh `QA-F-79_a..f` |

---

## 5. Re-test C — TASK-298 Web Responsive (26 lượt đo / 2 viewport)

### 5.1. Tổng hợp Overflow & Console

| Viewport | Số màn đo | Overflow = 0 | Overflow > 0 | Console errors |
| :---: | :---: | :---: | :---: | :---: |
| **390×844** | 13 | 7 (Settings + banner) | **6** (5 màn Platform + Quota Drawer, +54px) | 0 |
| **768×1024** | 13 | 13 | 0 | 0 |

> Nguồn tràn 390: `platform-topbar` hàng trên (theme/language/logout) đẩy `document.scrollWidth = 444` so với `clientWidth = 390`; Drawer Hạn mức bị đẩy `x=40, w=390` (mép phải 430). → **BUG-81 (High)**.

### 5.2. Chi Tiết Từng Màn

| Màn | 390×844 | 768×1024 | Ghi Chú |
| :--- | :---: | :---: | :--- |
| `/platform/tenants` | **FAIL +54px** | PASS 0 | Topbar wrap nhãn dọc; bảng scroll trong container |
| `/platform/users` | **FAIL +54px** | PASS 0 | idem |
| `/platform/audit-logs` | **FAIL +54px** | PASS 0 | idem |
| `/platform/health` | **FAIL +54px** | PASS 0 | idem |
| `/platform/admins` | **FAIL +54px** | PASS 0 | idem |
| Quota Drawer (từ tenants) | **FAIL +54px**, dialog `x=40` | PASS 0 (dialog 460px) | `pl-10 + max-w-[100vw]` vượt viewport |
| Impersonation banner + `/settings/sample-records` | PASS 0 | PASS 0 | Banner hiển thị đủ, không tràn |
| `/settings/roles` (3 cột xếp dọc) | PASS 0 | PASS 0 | Dùng được; toggle 16×28 (desktop size) |
| `/settings/organization` (list) | PASS 0 | PASS 0 | Cây 5 cấp |
| `/settings/organization` (graph) | PASS 0 | PASS 0 | Scroll/zoom nội bộ, không vỡ |
| `/settings/members` | PASS 0 | PASS 0 | |
| `/settings/branch-assignments` | PASS 0 | PASS 0 | |
| `/settings/sample-records` | PASS 0 | PASS 0 | |

### 5.3. Touch Target tại 390 (phụ lục BUG-81)

Nhiều phần tử "chính" <40px: theme switcher 34-47×37, VI/EN 28×21, Đăng xuất 44×39, nút Menu mobile 32×32, nav Settings cao 35px. Đề nghị sửa gộp khi xử lý BUG-81 (ảnh `QA-RS-390_*`).

---

## 6. Re-test D — Smoke Regression QA-W-01→10 / QA-M-01→05 (2026-09-19)

| Case | Màn | Kết Quả | Ghi Chú / Ảnh |
| :---: | :--- | :---: | :--- |
| QA-W-01 | `/platform/tenants` | **PASS** | 17 dòng render; `QA-SM-W-01_tenants` |
| QA-W-02 | Quota Drawer | **PASS** | Drawer mở/lưu; `QA-SM-W-02_quota_drawer` (nội dung switch: xem QA-R-74/BUG-80) |
| QA-W-03 | `/platform/users` + Break-glass drawer | **PASS** | 20 dòng; drawer mở; `QA-SM-W-03_break_glass_drawer` |
| QA-W-04 | Impersonation | **PASS** | Chi tiết tại QA-R-75; `QA-R-75_b/c` |
| QA-W-05 | `/platform/audit-logs` + detail drawer | **PASS** | 20 dòng; drawer diff/hash mở; `QA-SM-W-05_audit_detail_drawer` |
| QA-W-06 | `/platform/health` | **PASS** | Cards render; `QA-SM-W-06_health` |
| QA-W-07 | `/platform/admins` | **PASS** | 2 admin (SUPER_ADMIN + SUPPORT); `QA-SM-W-07_admins` |
| QA-W-08 | `/settings/roles` (owner) | **PASS** | Matrix 3 cột; `QA-SM-W-08_roles_matrix` |
| QA-W-09 | `/settings/organization` (owner) | **PASS** | 5 phòng ban; `QA-SM-W-09_organization` |
| QA-W-10 | `/settings/sample-records` (owner) | **PASS** | 3 dòng; nút Xuất hiện; `QA-SM-W-10_sample_records` |
| QA-M-01 | Mobile menu | **PASS** | Menu mở, đủ mục; `QA-SM-M-01_menu` |
| QA-M-02 | Mobile role detail | **PASS** | 24 toggle; chi tiết QA-R-77; `QA-SM-M-02_role_detail` |
| QA-M-03 | Mobile organization | **PASS** | 3 tab; `QA-SM-M-03_organization` |
| QA-M-04 | Mobile sample records | **PASS** | Danh sách render; `QA-SM-M-04_sample_records` |
| QA-M-05 | Mobile emergency | **PASS** | Badge DEGRADED, plugin read-only; `QA-SM-M-05_emergency` |

- **Console errors smoke: 0** (web + mobile).

---

## 7. Tổng Hợp Console Errors & Overflow Toàn Re-test

- **Console errors chức năng: 0** trên toàn bộ luồng hợp lệ (QA-R-74/75/77, QA-F-19/20/79, TASK-298, smoke).
- **1 console 401 dự kiến (ca âm)**: QA-R-76 lúc token cũ bị backend chặn sau đổi mật khẩu — chính là bằng chứng bảo mật của fix.
- **Overflow**:
  - Desktop 1440: không phát sinh tràn ngang.
  - Web 768×1024: **0px** toàn bộ 13 màn.
  - Web 390×844: **+54px tại 6/13 màn** (Platform + Drawer) → BUG-81; Settings + banner = 0.
  - Mobile app 390×844: 0px toàn bộ.

---

## 8. Bug Phát Hiện / Còn Tồn Đọng

| Mã | Mức Độ | Tóm Tắt | Trạng Thái | Ghi Chú |
| :--- | :---: | :--- | :--- | :--- |
| [BUG-74](../07_items/BUG-74_tenant_list_missing_allowed_plugins.md) | High | List thiếu `allowed_plugins` | **Done** | Re-test xác nhận fix đạt (API + không mất dữ liệu khi Lưu); phần switch UI tách BUG-80 |
| [BUG-75](../07_items/BUG-75_impersonation_token_missing_session_id.md) | High | Impersonation token thiếu `session_id` | **Done** | QA-R-75 PASS toàn bộ |
| [BUG-76](../07_items/BUG-76_platform_change_password_stale_token_redirect.md) | High | Token cũ sau đổi mật khẩu bắt buộc | **Done** | QA-R-76 PASS (401 + clear session + re-login OK) |
| [BUG-77](../07_items/BUG-77_mobile_toggle_touch_target.md) | Medium | Toggle mobile <40px | **Done** | QA-R-77 PASS (44×40; expand 40×40) |
| [BUG-78](../07_items/BUG-78_impersonation_timeout_never_closed.md) | High | Phiên hết hạn chặn lock | **In Progress (mở lại một phần)** | Lock-path PASS; job sweeper crash → BUG-82 |
| [BUG-79](../07_items/BUG-79_timestamp_display_local_timezone.md) | High | Timestamp theo locale/timezone | **Done** | QA-F-79 PASS (+7h, vi/en, null `—`) |
| [BUG-80](../07_items/BUG-80_plugin_catalog_missing_optional_plugins.md) | **High** | Catalog plugin chỉ có `core` → Drawer không có switch tùy chọn (`sales`) | **To Do** | Chặn QA-R-74/QA-F-20 |
| [BUG-81](../07_items/BUG-81_web_platform_390_overflow.md) | **High** | Web Platform tràn ngang 54px tại 390×844; Drawer lệch 40px | **To Do** | Chặn TASK-298 |
| [BUG-82](../07_items/BUG-82_impersonation_timeout_job_io_thread_crash.md) | **High** | `ImpersonationTimeoutJob` crash IO thread mỗi tick; phiên quá hạn không tự đóng | **To Do** | Chặn BUG-78/TC-BE-19 |

### Tính Năng / Task

| Mã | Mức Độ | Kết Quả QA | Trạng Thái |
| :--- | :---: | :--- | :--- |
| [FEAT-19](../07_items/FEAT-19_department_tree_dual_view.md) | Medium | **PASS** (QA-F-19) | **Done** |
| [FEAT-20](../07_items/FEAT-20_plugin_config_list_switches.md) | Medium | **FAIL** phần switch tùy chọn (BUG-80); phần còn lại PASS | **In Progress** |
| [TASK-298](../07_items/TASK-298_web_responsive_mobile_qa.md) | High | **FAIL** overflow tại 390 (BUG-81); 768 + Settings PASS; console 0 | **In Progress** |

---

## 9. Kết Luận DoD Gate

- **Critical còn tồn: 0.**
- **High còn tồn: 4** → **Sprint 02 CHƯA THỂ ĐÓNG** theo quy định "0 bug Critical/High":
  1. **BUG-80** — Plugin catalog thiếu plugin tùy chọn (FEAT-20/QA-R-74 không đạt).
  2. **BUG-81** — Web Platform tràn ngang 390px + Drawer lệch (TASK-298 không đạt).
  3. **BUG-82** — Job sweeper impersonation crash (BUG-78/TC-BE-19 không đạt).
  4. **BUG-78** — mở lại một phần, đóng khi BUG-82 được xác nhận PASS.
- Medium/Low mở: không (BUG-77 đã Done).
- Đề xuất thứ tự sửa: **BUG-82 (1 dòng thread model)** → **BUG-80 (bổ sung catalog)** → **BUG-81 (topbar/drawer responsive)**; sau đó QA re-test QA-R-74/78 + đo lại TASK-298.

---

## 10. Ghi Nhận Bổ Sung & Dọn Dẹp

- **Không sửa mã nguồn nghiệp vụ** trong toàn bộ đợt test; script Playwright nằm ở thư mục tạm `%TEMP%\opencode\qa02\retest` (không commit).
- Dữ liệu test giữ lại theo yêu cầu:
  - Tenant `qa-test-corp-02`: `ACTIVE`, unlocked, `allowed_plugins=["core","sales"]`, plan `ENTERPRISE`, 25 users/2048MB.
  - Thêm 3 phòng ban chuỗi 5 cấp: `QA-KD-B2B-L3/L4/L5` (phục vụ QA-F-19, giữ nguyên).
  - `qa.support02@example.com`: platform admin `ACTIVE`, `must_change_password=false`; mật khẩu mới do QA đặt (lưu `state.json` ngoài repo, **không commit**).
  - Phiên impersonation `02e720b2-...` (ticket `TCK-QA-R78-SWEEP`) **cố ý giữ `STARTED`** làm bằng chứng BUG-82 *(đã được job sweeper tự đóng `TIMEOUT` trong đợt nghiệm thu cuối — xem mục 11.2)*.
- Server dev (backend/web/mobile) đã dừng sau khi QA xong; hạ tầng Docker (Postgres/Redis/Mailpit) dừng theo quy trình.

---

## 11. Nghiệm Thu Cuối Sprint 02 (2026-09-19) — Sau Fix BUG-78/80/81/82 + Nâng Cấp FEAT-19/20 + TASK-298

### 11.1. Môi Trường & Phạm Vi

| Thành Phần | Thông Tin |
| :--- | :--- |
| Backend Quarkus (dev) | `http://localhost:8088` — jobs bật (`impersonation.jobs-enabled=true`, interval 300s), plugin catalog config-driven (dev để trống → FE merge fallback) |
| Web Angular 22 | `http://localhost:4200` — Chrome headless; Desktop 1440×900 (DPR 2 cho canvas); responsive **390×844** + **768×1024** |
| Mobile Ionic 8 | `http://localhost:8100` — Device Emulation 390×844, isMobile/hasTouch, DPR 2 |
| Dữ liệu | Tenant `qa-test-corp-02` (`20cced6a-...`), users/roles/departments giữ từ đợt trước; tài khoản `qa.sa02`, `qa.owner02`, `qa.staff02a/b`, `qa.support02` |
| Công cụ | Playwright 1.63.0 tại `%TEMP%\opencode\qa02` (không thêm dependency dự án); Angular dev-mode `window.ng` để đo canvas chính xác |
| Backend automated | Full `mvn test` **193/193 PASS** (PostgreSQL + Redis thật, không H2) — nguồn Developer, QA xác nhận lại qua runtime dev |
| Ảnh minh chứng đợt cuối | **61 ảnh mới**: `web/` 29 (`QA-R2-*`, `QA-F2-*`, `QA-SM2-*`), `mobile/` 6, `web-responsive/` 26 (`QA-RS2-*`) |

### 11.2. Bảng A — Bug High Còn Lại (đợt re-test trước)

| Case | Kịch Bản | Kết Quả | Bằng Chứng & Ghi Chú |
| :---: | :--- | :---: | :--- |
| **QA-R2-78/82** | Backend dev chạy; job sweeper tick định kỳ; phiên impersonation hết hạn không gọi exit → job tự đóng; log không còn lỗi JTA/IO thread; lock tenant OK | **PASS** | Tick đầu `14:31:53` trên **`vert.x-worker-thread-1`**: `Impersonation timeout: 3 overdue session(s) moved to TIMEOUT`; phiên mới `TCK-QA-R2-SWEEP-2` backdate → auto `TIMEOUT` + `ended_at` + audit `IMPERSONATION_TIMEOUT` (actor SYSTEM, count=1); phiên bằng chứng cũ `02e720b2-...` (BUG-82) cũng `TIMEOUT`; grep log **0 dòng** `Cannot start a JTA transaction from the IO thread` / job failed. Guard: phiên còn hạn → lock **409**; exit **200 ENDED**; phiên quá hạn → lock **200**, log TIMEOUT + audit, unlock về **ACTIVE**. Ảnh `QA-R2-78_a`; log `evidence/QA-R2-82_backend_log_evidence.txt` |
| **QA-R2-80** | Tenant `allowed_plugins=["core","sales","unknown-x"]` → Drawer đủ switch đúng trạng thái; nhóm Tùy chọn không trống; tìm kiếm/đếm/empty; Lưu 2 lần không mất plugin | **PASS** | 6 dòng: `core` disabled ON; `sales` ON; `unknown-x` ON + nhãn "Không có trong danh mục plugin"; đếm `Đã bật 3/6`; scroll `298>254`; search "sales" → 1 dòng; empty state riêng; tắt sales/unknown-x hiện banner cảnh báo + đếm 2/6 → 1/6; **Lưu 2 lần DB vẫn `["core","sales","unknown-x"]`**, mở lại 3/6; khôi phục `["core","sales"]`. Console 0. Ảnh `QA-R2-80_a..f` |
| **QA-R2-81** | Web 390×844: 13/13 màn Platform+Settings overflow = 0; drawer full-width x=0; touch target topbar ≥40; 768 giữ 0 | **PASS** | **26/26 lượt đo overflow = 0px** (390 + 768); Drawer 390 `x=0, w=390, right=390`; 768 `x=308, w=460`; platform topbar 100% ≥40 (theme 64×40, Sáng/Tối 40×40, VI/EN 40×40, Đăng xuất 68×40, nav 40px). Tồn dư shared topbar hamburger 32×32 + nav Settings 35px → **BUG-83 (Medium)**. Console 0. Ảnh `QA-RS2-*` (26) |

### 11.3. Bảng B — Tính Năng Nâng Cấp

| Case | Kịch Bản | Kết Quả | Bằng Chứng & Ghi Chú |
| :---: | :--- | :---: | :--- |
| **QA-F2-19** | `/settings/organization` view Graph trên app thật: canvas nét (DPR), zoom wheel/nút/Fit, pan, double-click center, click node panel, collapse/expand, đổi view giữ trạng thái, F5 giữ viewport; seed ~400 department giả đo mượt/culling | **PASS** | Cây thật 5 node/4 edge; canvas `1686×1000` = CSS 843×500 × **DPR 2**; click node mở panel; collapse 5→2→5 node; zoom wheel 0.92→1.15→0.73, nút ±/Đặt lại/Vừa khung, **clamp đúng 25%–250%**; pan đổi viewport; double-click căn giữa **dx=0/dy=0**; đổi view giữ collapse + selection; **F5 giữ viewport + view graph**. Cây lớn **405 node/403 edge** (seed SQL 400 `QZ-G-*`): fit → **0.25**, culling `inView 25/405`, draw **0.63ms** (cây nhỏ 0.14ms), pan **~60 FPS**; đã xóa 400 department giả, DB về 5. Console 0. Ảnh `QA-F2-19_a..j` (10) |
| **QA-F2-20** | Plugin list dọc + search + đếm X/Y; scroll; empty; core disabled ON; key lạ cảnh báo; mobile read-only ≥40px | **PASS** | Xem QA-R2-80; bổ sung: nhóm Bắt buộc/Tùy chọn sticky; container cuộn thật; mobile `/platform/emergency` **19 toggle read-only 44×40px**, nhãn `Bán hàng`/`unknown-x`, overflow 0. Console 0. Ảnh `QA-F2-20_a..b`, `mobile/QA-F2-20_c` |

### 11.4. Bảng C — TASK-298 Web Responsive (13 màn × 390×844 + 768×1024)

| # | Màn | 390×844 Overflow | 768×1024 Overflow | Touch target 390 | Console |
| :---: | :--- | :---: | :---: | :---: | :---: |
| 1 | `/platform/tenants` | **PASS 0px** | PASS 0px | Platform topbar 100% ≥40 | 0 |
| 2 | `/platform/users` | **PASS 0px** | PASS 0px | idem | 0 |
| 3 | `/platform/audit-logs` | **PASS 0px** | PASS 0px | idem | 0 |
| 4 | `/platform/health` | **PASS 0px** | PASS 0px | idem | 0 |
| 5 | `/platform/admins` | **PASS 0px** | PASS 0px | idem | 0 |
| 6 | Quota Drawer (từ tenants) | **PASS 0px**, dialog `x=0, w=390` | PASS 0px, `x=308, w=460` | Toggle/drawer OK | 0 |
| 7 | Impersonation banner + `/settings/sample-records` | **PASS 0px** | PASS 0px | Hamburger 32×32 → BUG-83 | 0 |
| 8 | `/settings/roles` (3 cột xếp dọc) | **PASS 0px** | PASS 0px | Hamburger 32×32 + nav 35px → BUG-83 | 0 |
| 9 | `/settings/organization` (list) | **PASS 0px** | PASS 0px | idem | 0 |
| 10 | `/settings/organization` (graph) | **PASS 0px** | PASS 0px | idem | 0 |
| 11 | `/settings/members` | **PASS 0px** | PASS 0px | idem | 0 |
| 12 | `/settings/branch-assignments` | **PASS 0px** | PASS 0px | idem | 0 |
| 13 | `/settings/sample-records` | **PASS 0px** | PASS 0px | idem | 0 |

- **Tổng hợp**: `13/13` màn đạt overflow = 0 tại cả 2 viewport (26/26 lượt đo, so với 6 màn +54px trước fix); **console errors = 0** toàn bộ.
- Ảnh: `screenshots/web-responsive/QA-RS2-{390,768}_<màn>.png` (26 ảnh). Số liệu chi tiết: `evidence/resp2.out.json`.
- **BUG-83 (Medium)**: shared topbar hamburger 32×32 + nav Settings 35px tại 390 (2 hạng mục phụ lục BUG-81 chưa xử lý); không chặn DoD.

### 11.5. Bảng D — Smoke Regression QA-W-01→10 / QA-M-01→05

| Case | Màn | Kết Quả | Ghi Chú / Ảnh |
| :---: | :--- | :---: | :--- |
| QA-W-01 | `/platform/tenants` | **PASS** | 17 dòng; `QA-SM2-W-01` |
| QA-W-02 | Quota Drawer | **PASS** | Mở đúng tenant, có plugin switch list; `QA-SM2-W-02` |
| QA-W-03 | `/platform/users` + Break-glass | **PASS** | 20 dòng; drawer mở; `QA-SM2-W-03` |
| QA-W-04 | Impersonation | **PASS** | Banner `BẠN ĐANG TRUY CẬP ĐẠI DIỆN` hiển thị; Exit → `/platform/tenants`; `QA-SM2-W-04` |
| QA-W-05 | `/platform/audit-logs` + detail | **PASS** | 20 dòng; drawer diff/hash; `QA-SM2-W-05` |
| QA-W-06 | `/platform/health` | **PASS** | Cards CSDL/Redis/Kafka; `QA-SM2-W-06` |
| QA-W-07 | `/platform/admins` | **PASS** | 2 admin (SUPER_ADMIN + SUPPORT); `QA-SM2-W-07` |
| QA-W-08 | `/settings/roles` (owner) | **PASS** | Matrix 3 cột; `QA-SM2-W-08` |
| QA-W-09 | `/settings/organization` (owner) | **PASS** | 5 phòng ban; `QA-SM2-W-09` |
| QA-W-10 | `/settings/sample-records` (owner) | **PASS** | 3 dòng + nút Xuất; `QA-SM2-W-10` |
| QA-M-01 | Mobile menu | **PASS** | Menu mở, overflow 0; `QA-SM2-M-01` |
| QA-M-02 | Mobile role detail | **PASS** | 24 toggle, overflow 0; `QA-SM2-M-02` |
| QA-M-03 | Mobile organization | **PASS** | overflow 0; `QA-SM2-M-03` |
| QA-M-04 | Mobile sample records | **PASS** | render list, overflow 0; `QA-SM2-M-04` |
| QA-M-05 | Mobile emergency | **PASS** | Badge trạng thái + plugin read-only; `QA-SM2-M-05` |

- **Console errors smoke: 0** (web + mobile); mobile overflow = 0 toàn bộ 5 màn.

### 11.6. Tổng Hợp Console Errors & Overflow Đợt Cuối

- **Console errors chức năng: 0** trên toàn bộ luồng (QA-R2-78/80/81, QA-F2-19/20, TASK-298 26 lượt đo, smoke web/mobile 15 màn).
- **Overflow**: Desktop 1440 = 0; Web 390×844 = **0px toàn bộ 13 màn** (hết +54px); Web 768×1024 = **0px toàn bộ 13 màn**; Mobile Ionic 390×844 = **0px toàn bộ 5 màn**.

### 11.7. Bug Phát Hiện Mới Đợt Cuối

| Mã | Mức Độ | Tóm Tắt | Trạng Thái |
| :--- | :---: | :--- | :--- |
| [BUG-83](../07_items/BUG-83_shared_topbar_touch_target_390.md) | **Medium** | Shared topbar hamburger 32×32 + nav Settings 35px < 40px tại 390×844 (2 hạng mục phụ lục BUG-81) | **To Do** — không chặn DoD |

### 11.8. Trạng Thái Item Cuối

| Item | Trước | Sau | Ghi Chú |
| :--- | :---: | :---: | :--- |
| BUG-78 | Done (chờ QA) | **Done** | QA-R2-78/82 PASS (job sweeper thật + lock path) |
| BUG-80 | Done (chờ QA) | **Done** | QA-R2-80/QA-F2-20 PASS (switch sales/unknown-x, Lưu x2) |
| BUG-81 | Done (chờ QA) | **Done** | QA-R2-81 PASS overflow 13/13 + drawer full-width; touch tồn dư → BUG-83 Medium |
| BUG-82 | Done (chờ QA) | **Done** | QA-R2-82 PASS 0 lỗi IO thread, phiên tự đóng TIMEOUT |
| BUG-83 | — | **To Do (Medium)** | Touch target shared topbar/nav |
| FEAT-19 | In Progress | **Done** | QA-F2-19 PASS (canvas thật + seed 405 node, đã dọn) |
| FEAT-20 | In Progress | **Done** | QA-F2-20 PASS (list dọc + search + mobile read-only) |
| TASK-298 | In Progress | **Done** | 13 màn × 390/768, overflow 0, console 0, đủ ảnh |

### 11.9. Kết Luận DoD Gate (Nghiệm Thu Cuối)

- **Critical còn tồn: 0.**
- **High còn tồn: 0** — BUG-78, BUG-80, BUG-81, BUG-82 đều đã xác nhận PASS trên app thật/dev.
- **Medium còn tồn: 1** (BUG-83 — touch target shared topbar/nav) → **không chặn** điều kiện đóng Sprint ("không còn item > Medium").
- **KẾT LUẬN: Sprint 02 ĐẠT điều kiện đóng (DoD Gate PASS)** — 3 yêu cầu nâng cấp FEAT-19/FEAT-20/TASK-298 đạt toàn bộ tiêu chí nghiệm thu.

### 11.10. Ghi Nhận Bổ Sung & Dọn Dẹp Đợt Cuối

- **Không sửa mã nguồn nghiệp vụ** trong toàn bộ đợt nghiệm thu; script Playwright đặt tại `%TEMP%\opencode\qa02\final` (không commit).
- **Seed SQL tạm đã xóa sạch**: 400 department `QZ-G-*` đã xóa; `departments` của tenant về **5** (chuỗi QA-KD giữ nguyên).
- **Dữ liệu test giữ lại đúng chuẩn**: tenant `qa-test-corp-02` = `["core","sales"]`, `ACTIVE`, unlocked; không còn phiên impersonation `STARTED` tồn đọng (tất cả `ENDED`/`TIMEOUT`).
- **Sự cố nhỏ trong lúc test (đã khôi phục)**: thao tác mở Drawer lần đầu khi bộ lọc tenant chưa kịp áp dụng khiến một tenant cá nhân (`u-2b454277`) bị Lưu tạm `["core","sales"]`; QA đã khôi phục về `["core"]` qua API và xác minh DB — không ảnh hưởng tenant test chính.
- Server dev (backend/web/mobile) đã dừng sau khi QA xong.
