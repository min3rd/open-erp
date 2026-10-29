# [TR-S06-001] Sprint 06 test report

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TR-S06-001 / Test Report / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **PASSED — QA sign-off (Q19/Q20 + post-closure)** / 1.6 / 2026-10-29 |
| Owner / reviewer | QA/QC / Architect + PM |
| Đầu vào | [TP-S06-001](01_TP-S06-001_sprint_06_test_plan.md), working tree build 2026-10-29 |
| Đọc tiếp | [REV-S06-001](../09_review/01_REV-S06-001_sprint_06_dod_review.md) — PM DoD + customer acceptance + closure |

## 1. Môi trường & baseline

| Thành phần | Giá trị |
| :--- | :--- |
| Backend | `openerp-backend-dev`, `:8088`, PostgreSQL 16 + Redis thật (không H2) |
| Web | `http://localhost:4200` — desktop 1440×900 |
| Mobile | `http://localhost:8100` — Ionic, 390×844, DPR 2, touch |
| Tenant / tài khoản | `e2e-tenant@example.com` (TENANT_ADMIN); viewer tạm đã xoá sau AC-10 |
| Plugin | catalog 1.0.9 ACTIVE; in-app-notification **1.0.7** ACTIVE (4 scope: 2 tenant + system + e2e); qa-crud 1.0.6 chỉ dùng test AC-05 (đã gỡ) |
| Build | Working tree 2026-10-29; catalog/notification/backend images rebuilt |
| Trình duyệt | Chromium headless (Playwright), screenshot tại `evidence/sprint_06_retest/` |

## 2. Kết quả thực thi

| Hạng mục | Kết quả | Bằng chứng |
| :--- | :--- | :--- |
| CLI suite (create/entity/field/relation/CRUD/validate/upgrade/package) | **PASS 11/11** | [`cli-test.log`](evidence/sprint_06_q19/cli-test.log) |
| Backend lifecycle (gồm plugin-hosted slot) | **PASS 13/13** | [`backend-test.log`](evidence/sprint_06_q19/backend-test.log) |
| Backend data gateway | **PASS 18/18** | [`backend-datagateway-test.log`](evidence/sprint_06_final/backend-datagateway-test.log) |
| Manifest 2.0 parse | **PASS 1/1** | `PluginManifestParsingTest` |
| Backend tổng targeted | **PASS 32/32** | lifecycle 13 + gateway 18 + manifest 1 |
| Web build | **PASS** | [`web-build.log`](evidence/sprint_06_q19/web-build.log) |
| Mobile build | **PASS** | [`mobile-build.log`](evidence/sprint_06_q19/mobile-build.log) |
| i18n parity web/mobile | **PASS** | 13 locale × 100%, không thiếu key |
| Catalog template upgrade | **PASS** | `upgrade --check` → up to date; [`catalog-upgrade-check.log`](evidence/sprint_06_final/catalog-upgrade-check.log) |
| Desktop header contribution | **PASS** | plugin bell duy nhất (Core bell đã bỏ), 0 iframe, 0 console error |
| Desktop notification screen | **PASS** | 2 bản ghi render từ bell |
| Settings system plugin tab | **PASS** | `?tab=notification-settings`, reload giữ tab |
| Plugin Manager i18n | **PASS** | "Thông báo trong ứng dụng", không còn raw key |
| Catalog desktop WC | **PASS** | `op-catalog-app`, tree + reload, 0 iframe |
| AC-05 generated CRUD | **PASS** | list → drawer → tạo `QA-INV-001` → dòng hiển thị; 0 console error |
| AC-09 disable/enable | **PASS** | tắt → bell mất; bật → bell trở lại |
| AC-10 user thiếu quyền | **PASS** | không thấy contribution; API 403 `IAM_PERMISSION_DENIED_FUNCTIONAL` |
| AC-11 error boundary | **PASS** | contract 9.0 + entry 404 bị skip, log warn, layout còn hoạt động |
| AC-16 plugin-hosted slot | **PASS** | host `PLUGIN` + contributor resolve qua UI manifest |
| Mobile header contribution | **PASS** | 390×844: plugin bell 1 (Core bell cũ đã bỏ), touch 40×40 |
| AC-20 old notification removed | **PASS** | Web/Mobile `app-notification-bell` = 0, `app-notification-banner` = 0; plugin bell là chuông duy nhất |
| AC-21 platform defaults + tenant override | **PASS** | Platform admin lưu defaults; tenant thấy defaults; bật inherit → API trả null; tắt inherit → lưu riêng |
| Mobile notification screen | **PASS** | click bell → `op-in-app-notification-app`, 2 bản ghi, 0 console error |
| Mobile catalog records | **PASS** | table top 577px, type list 320px, overflow 0 |
| Mobile catalog i18n/touch | **PASS** | không còn `COMMON_*`, không target < 40px |
| Console errors | **PASS** | 0 lỗi ở toàn bộ flow desktop/mobile (viewer 403 là lỗi chủ đích của test permission) |
| **Final QA re-check** | **PASS 11/11** | Chạy lại 2026-10-29 sau sign-off: desktop 8/8 + mobile 3/3; [`qa-recheck-results.json`](evidence/sprint_06_final/qa-recheck-results.json) |
| **Q19 notification** | **PASS 6/6** | Platform defaults, tenant inherit, old bell/banner removed, mobile plugin screen; [`q19-results.json`](evidence/sprint_06_q19/q19-results.json) |
| **Q20 bell drawer** | **PASS 19/19** | Desktop + mobile 390×844: bell mở drawer không đổi route; Escape đóng; “Xem tất cả” mới sang trang; full-height drawer; overflow 0; touch 40px; 0 console error; [`drawer-results.json`](evidence/sprint_06_drawer/drawer-results.json) |
| **Post-closure plugin host header** | **PASS** | Bỏ header Core trên mọi plugin screen; `/settings/apps/in-app-notification` chỉ còn nội dung plugin, 0 console error; [TASK-425](../07_items/TASK-425_remove_plugin_screen_host_header.md), ảnh `evidence/sprint_06_post_closure/` |
| **Old notification table removed** | **PASS** | `V6.2.0__drop_tenant_notifications.sql`; `to_regclass('public.tenant_notifications')` = null; không còn API `tenant/notifications` |

## 3. Bằng chứng hình ảnh

### 3.1. Desktop 1440×900

![Header có chuông plugin duy nhất](evidence/sprint_06_final/01_desktop_header.png)

![Màn hình thông báo do plugin render](evidence/sprint_06_final/02_desktop_notification.png)

![Tab Cấu hình thông báo — URL giữ ?tab=notification-settings](evidence/sprint_06_final/03_desktop_settings_tab.png)

![Plugin Manager đã dịch tên/mô tả](evidence/sprint_06_final/04_desktop_plugin_manager.png)

![Catalog Web Component — không iframe](evidence/sprint_06_final/05_desktop_catalog.png)

![Catalog chế độ Cây — reload giữ ?view=tree](evidence/sprint_06_retest/06_desktop_catalog_tree_fixed.png)

![Dark theme](evidence/sprint_06/08_desktop_catalog_dark.png)

### 3.2. English

![Dashboard tiếng Anh](evidence/sprint_06_final/06_desktop_english.png)

### 3.3. AC-05 generated CRUD

![CRUD Invoice — list + drawer + bản ghi vừa tạo](evidence/sprint_06_retest/08_qa_crud_invoice_fixed.png)

### 3.4. AC-11 error boundary

![Contribution sai contract/entry bị skip, layout vẫn hoạt động](evidence/sprint_06_final/07_ac11_error_boundary.png)

### 3.5. AC-09 disable/enable

![Tắt plugin — contribution biến mất](evidence/sprint_06_retest/10_disabled_fixed.png)

![Bật lại — contribution trở lại](evidence/sprint_06_retest/11_enabled_fixed.png)

### 3.6. Mobile Ionic 390×844

![Header mobile — chuông plugin duy nhất, touch 40px](evidence/sprint_06_final/08_mobile_header.png)

![Màn hình thông báo mobile](evidence/sprint_06_final/09_mobile_notification.png)

![Catalog mobile — danh sách loại + bảng bản ghi cùng truy cập được](evidence/sprint_06_final/10_mobile_catalog.png)

![Viewer không thấy plugin contribution; API 403](evidence/sprint_06/11_viewer_no_plugin_permission.png)

### 3.7. Platform defaults + tenant override (Q19 / AC-20/21)

![Platform admin — cấu hình thông báo mặc định toàn hệ thống](evidence/sprint_06_final/11_platform_defaults.png)

![Tenant admin — kế thừa hoặc ghi đè cấu hình riêng](evidence/sprint_06_final/12_tenant_override.png)

### 3.8. Bell drawer + “Xem tất cả” (Q20 / AC-22)

![Desktop — bell mở drawer, route vẫn là dashboard](evidence/sprint_06_drawer/01_desktop_bell_drawer.png)

![Desktop — “Xem tất cả” mới mở trang danh sách đầy đủ](evidence/sprint_06_drawer/02_desktop_full_list.png)

![Mobile 390×844 — drawer full-height, không tràn ngang](evidence/sprint_06_drawer/03_mobile_bell_drawer.png)

![Mobile — trang danh sách sau khi bấm “Xem tất cả”](evidence/sprint_06_drawer/04_mobile_full_list.png)

## 4. Trace AC

| AC | Kết quả | Ghi chú / bằng chứng |
| :--- | :--- | :--- |
| AC-01 | PASS | CLI create zero-DB; 11/11 |
| AC-02 | PASS | Entity manifest/migration/POJO/permission |
| AC-03 | PASS | Field/validator/migration |
| AC-04 | PASS | FK + soft-ref; validate offline/core-url |
| AC-05 | PASS | Generated CRUD install ACTIVE; browser list/drawer/create PASS |
| AC-06 | PASS | Validate offline + `--core-url` |
| AC-07 | PASS | Header bell desktop |
| AC-08 | PASS | Tab + URL + reload |
| AC-09 | PASS | Disable/enable ảnh 10/11 |
| AC-10 | PASS | Viewer không thấy contribution; API 403 |
| AC-11 | PASS | Contract mismatch + entry lỗi bị skip/log, layout PASS |
| AC-12 | PASS | Desktop + mobile 0 console error, overflow 0, i18n đúng |
| AC-13 | PASS | UG-S06-001 1.4 + 13 ảnh desktop/mobile |
| AC-14 | PASS | Catalog WC desktop + mobile |
| AC-15 | PASS | Không còn IFRAME trong code/runtime |
| AC-16 | PASS | Plugin-hosted slot test trong `PluginLifecycleApiTest` |
| AC-17 | PASS | Notification 1.0.7 header/drawer/tab/list |
| AC-18 | PASS | Catalog 1.0.9 WC/zero-DB; template metadata 2.0.0 |
| AC-19 | PASS | Mobile header + catalog + i18n + touch target |
| AC-20 | PASS | Old bell/banner removed; plugin notification là nguồn duy nhất |
| AC-21 | PASS | Platform defaults API/UI + tenant inherit/override; độc lập, lưu bền |
| AC-22 | PASS | Bell mở drawer (route không đổi); “Xem tất cả” mới mở trang danh sách; Escape/overlay đóng; mobile full-height |

## 5. Bug đã xử lý

| Bug | Mức | Trạng thái | Cách sửa chính |
| :--- | :--- | :--- | :--- |
| [BUG-154](../07_items/BUG-154_mobile_header_contribution_missing.md) | High | **Resolved** | Mobile plugin slot + absolute API base + notification screen |
| [BUG-155](../07_items/BUG-155_mobile_catalog_records_clipped.md) | High | **Resolved** | Mobile catalog block/scroll layout |
| [BUG-156](../07_items/BUG-156_mobile_catalog_i18n_raw_keys.md) | Medium | **Resolved** | Bổ sung `COMMON_*` cho 13 locale mobile |
| [BUG-157](../07_items/BUG-157_mobile_catalog_touch_targets.md) | Low | **Resolved** | `min-h-10 min-w-10` cho nút API/view/pagination |
| [BUG-158](../07_items/BUG-158_catalog_template_metadata_outdated.md) | Medium | **Resolved** | `schema_version 2.0`, `template_version 2.0.0` |
| [BUG-159](../07_items/BUG-159_plugin_manager_raw_name_keys.md) | Medium | **Resolved** | i18n tên/mô tả plugin cho web + mobile |
| [BUG-160](../07_items/BUG-160_generated_crud_bundle_end_to_end.md) | High | **Resolved** | Bundle migrations, static UI resource, tenant-scope không `tenant_id`, API base/token, route screen |

## 6. Ghi chú kiểm thử

- Fixture `qa-crud` chỉ dùng cho AC-05, đã uninstall + revoke entitlement + xoá catalog/permission sau test.
- Backend test có cảnh báo gRPC test server không bind `:9001` do MinIO đang dùng; 32/32 test vẫn PASS, không ảnh hưởng kết quả.
- Ảnh desktop dùng light theme; ảnh dark theme lấy từ cùng build trước khi fix (không đổi layout).
- Mobile catalog cuộn dọc trong plugin; bảng rộng hơn viewport nhưng cuộn ngang trong khung, không tràn trang.
- **Final re-check 2026-10-29:** chạy lại desktop 8/8 + mobile 3/3; 0 console error; backend 32/32, CLI 11/11; ảnh tại `evidence/sprint_06_final/`.
- **Q19:** platform defaults/tenant override 6/6 PASS; plugin 1.0.5; ảnh tại `evidence/sprint_06_q19/` và `evidence/sprint_06_final/11-13`.
- **Q20:** bell drawer 19/19 PASS; plugin 1.0.7; ảnh tại `evidence/sprint_06_drawer/`; bảng `tenant_notifications` đã drop (V6.2.0).
- **Post-closure:** plugin screen không còn header host Core (TASK-425); QA web build + browser PASS, TR-S06-001 1.6.

## 7. Kết luận

QA **PASS và sign-off Sprint 06** tại baseline 2026-10-29:

- 0 Critical/High mở; 7 bug đã Resolved và có re-test.
- Toàn bộ **22/22 AC** đạt PASS; backend 32/32, CLI 11/11, web/mobile build PASS, 0 console error.
- Đủ điều kiện chuyển PM DoD / khách hàng nghiệm thu.

## 8. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-10-29 | Báo cáo execution ban đầu | QA; TASK-423 |
| 1.1 | 2026-10-29 | QA re-test thật; phát hiện BUG-154…159; sign-off BLOCKED | QA; TASK-423 |
| 1.2 | 2026-10-29 | Fix toàn bộ bug + AC-05/11/16; backend 32/32, CLI 11/11, browser desktop/mobile PASS; QA sign-off | QA/Developer; TASK-423 |
| 1.3 | 2026-10-29 | Final QA re-check 11/11 PASS; backend 32/32, CLI 11/11; ảnh final `evidence/sprint_06_final/` | QA; yêu cầu chủ dự án |
| 1.4 | 2026-10-29 | Q19: hoàn thiện in-app-notification 1.0.5, bỏ bell/banner Core, platform defaults + tenant override; 21/21 AC PASS | Chủ dự án; CONF-S06-001 1.1 |
| 1.5 | 2026-10-29 | Q20: bell drawer 19/19 PASS, “Xem tất cả” mới sang trang; plugin 1.0.7; bỏ bảng `tenant_notifications`; 22/22 AC PASS | Chủ dự án; CONF-S06-001 1.2 |
| 1.6 | 2026-10-29 | Post-closure TASK-425: bỏ header host khỏi mọi plugin screen; build/browser PASS, 0 console error | Chủ dự án; TASK-425 |
