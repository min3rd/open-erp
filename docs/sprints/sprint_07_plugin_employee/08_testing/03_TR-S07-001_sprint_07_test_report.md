# [TR-S07-001] Sprint 07 test report

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TR-S07-001 / Test Report / Sprint 07 |
| Trạng thái / phiên bản / cập nhật | **Reviewed — QA PASS implementation + runtime E2E deferred closure (employee 1.1.22 + catalog 1.0.10 + signed URL 9/9 + WC signed URL download 2026-11-02)** / 1.19 / 2026-11-02 |
| Owner / reviewer | QA/QC / Architect + PM |
| Đầu vào | QA report self-contained — ảnh nhúng trực tiếp trong mục 2.5 và mục 8 |
| Baseline | commit `52fee05c` + runtime E2E 2026-11-01 |

## 1. Kết luận điều hành

**QA PASS phần implementation Sprint 07.** Đã chạy **app thật** trên Docker local: backend `http://localhost:8088`, web `http://localhost:4200`, plugin `org-structure` 1.1.3, `employee` 1.1.19, `in-app-notification` 1.0.10 và `catalog` 1.0.9 ACTIVE. Không còn bug Critical/High mở; 16 bug phát sinh trong QA đều đã Resolved. Đã chụp **64 ảnh chức năng** cho 4 role tại mục 8. Organization plugin có màn hình quản trị copy từ Core; Core đã bỏ menu/màn hình organization; onboarding invite gửi được thông báo in-app cho tài khoản đã đăng ký; tenant có sẵn phòng ban + luồng duyệt cơ bản.

| Nhóm | Kết quả |
| :--- | :--- |
| Backend Core | **PASS** 280/280 |
| Plugin employee | **PASS** 18/18 |
| Plugin organization | **PASS** 3/3 |
| Plugin notification | **PASS** 1/1 |
| Tổng test Java | **PASS** 302/302 |
| Build web/mobile/plugin | **PASS** |
| i18n strict 13 locale | **PASS** (web 1464, mobile 1153) |
| Browser app thật desktop 1440×900 | **PASS** 12/12, 0 console error, 0 failed request |
| Toàn bộ màn hình chức năng | **PASS** 64 ảnh, 4 role |
| Document type catalog | **PASS** 9 loại + select |
| Change request diff table | **PASS** field/old/new |
| Tenant defaults departments + approval | **PASS** 8 phòng, 2 bước duyệt |
| Organization plugin CRUD | **PASS** branch/department/member/branch-access |
| Onboarding in-app notification | **PASS** registered + unregistered |
| Phân công + hợp đồng (tạo/sửa) | **PASS** 3/3 API 200 |
| Role matrix 4 role | **PASS** admin/manager/staff/viewer đúng quyền |
| Role chip header | **PASS** hiển thị RBAC role (`GENERAL_MANAGER`), không còn `MEMBER` |
| Notification link | **PASS** link onboarding trong body mở được từ drawer |
| Branch data scope | **PASS** admin 8, manager/viewer 4 (HQ branch) |
| DSAR export/erase | **PASS** JSON export + anonymize PII |
| Drop-legacy trên QA dev | **PASS** backup + verify + drop + smoke |
| ClamAV document scan | **PASS** EICAR → 422, clean → `scan_status=CLEAN` |
| Browser responsive mobile 390×844 | **PASS** overflow 0 |
| Mobile Ionic host 390×844 | **PASS** 7/7, touch ≥40px, 0 console error |
| Tenant switch 2 tenant | **PASS** 2 chiều |
| Offboarding last-admin guard | **PASS** 409 đúng |
| Cutover `copy`/`verify` trên tenant dev | **PASS** |
| QA sign-off | **PASS implementation**; PM/customer review pending |

## 2. Kết quả chi tiết

### 2.1. Backend / plugin (PostgreSQL + Redis thật)

| TC | Lệnh / test | Kết quả |
| :--- | :--- | :--- |
| TC-01 | `mvn -q -f src/backend/pom.xml test` | **PASS** 280 tests |
| TC-02 | `ScopeProjectionServiceTest` | **PASS** projection + cross-tenant |
| TC-03 | `SchemaFoundationTest` | **PASS** 12/12 — permission V7.0.1/V7.0.2/V7.0.4 |
| TC-04 | `PluginPermissionSeederTest` | **PASS** role defaults manager/staff/viewer |
| TC-05 | `mvn -q -f plugins/pom.xml -pl employee -am test` | **PASS** 18 tests |
| TC-06 | `mvn -q -f plugins/pom.xml test` | **PASS** org 3 + notification 1 |
| TC-07 | `open-erp validate` | **PASS** employee 1.1.19, org-structure 1.1.3, catalog 1.0.10 |
| TC-08 | `OrganizationService.emit` outbox JSON | **PASS** BUG-175 fixed; CRUD app thật |
| TC-09 | Tenant defaults bootstrap | **PASS** 8 phòng + 2 bước duyệt |
| TC-21 | `InternalEmployeeGovernanceResourceTest` | **PASS** 4/4 owner/admin/platform/mismatch |
| TC-22 | `EmployeeGovernanceClientTest` | **PASS** parse/validation |
| TC-25 | `TenantSwitchRateLimiterTest` | **PASS** 10/60s + 429 |

### 2.2. Build / static

| Lệnh | Kết quả | Kích thước |
| :--- | :--- | :--- |
| `ng build employee-plugin` | **PASS** | 526.92 kB initial (1.1.19) |
| `ng build organization-plugin` | **PASS** | 499.30 kB initial (1.1.3) |
| `npm run web:build` | **PASS** | 560.19 kB initial |
| `npm run mobile:build` | **PASS** | 997.26 kB initial |
| `npm run i18n:check:strict` | **PASS** | web 1464 / mobile 1153 |
| `check-docs.mjs` sprint 07 | **PASS** | 0 lỗi |

### 2.3. App thật E2E (Docker local)

Backend image `open-erp/backend:dev` (Temurin 21 glibc), web `open-erp/web:dev`, plugin containers:

- `openerp-plugin-org-structure-1-1-3` ACTIVE
- `openerp-plugin-employee-1-1-19` ACTIVE
- `openerp-plugin-in-app-notification-1-0-10` ACTIVE
- `openerp-plugin-catalog-1-0-9` ACTIVE

| TC | Kịch bản | Kết quả | Ảnh |
| :--- | :--- | :--- | :--- |
| TC-30.1 | Login tenant admin (2 tenant, chọn tenant) | **PASS** | — |
| TC-30.2 | Employee plugin screen qua gateway/JWT | **PASS** | [desktop_employee_list.png](evidence/s07_qa_real/desktop_employee_list.png) |
| TC-30.3 | Tạo nhân viên bằng API thật + reload list | **PASS** | [desktop_employee_create_drawer.png](evidence/s07_qa_real/desktop_employee_create_drawer.png) |
| TC-30.4 | Edit drawer assignments/contracts/documents | **PASS** | [desktop_employee_edit_drawer.png](evidence/s07_qa_real/desktop_employee_edit_drawer.png) |
| TC-30.5 | HR tools: field config tự seed 15 trường, nhãn tiếng Việt, onboarding link, campaign, privacy | **PASS** | [desktop_hr_tools.png](evidence/s07_qa_real/desktop_hr_tools.png), [desktop_hr_onboarding.png](evidence/s07_qa_real/desktop_hr_onboarding.png) |
| TC-30.6 | Org chart từ reporting data | **PASS** | — |
| TC-30.7 | Organization plugin screen | **PASS** | [desktop_organization.png](evidence/s07_qa_real/desktop_organization.png) |
| TC-30.8 | 0 console error / 0 failed API request | **PASS** | `qa_real_summary.json` |
| TC-30.9 | Desktop 1440×900 overflow 0 | **PASS** | — |
| TC-30.10 | Mobile responsive 390×844, overflow 0 | **PASS** | [mobile_employee_390x844.png](evidence/s07_qa_real/mobile_employee_390x844.png) |
| TC-30.11 | Phân công: mở tab, chọn chi nhánh/phòng ban, tạo mới | **PASS** `EMPLOYEE_ASSIGNMENT_CREATED` | [desktop_assignment_form.png](evidence/s07_qa_real/desktop_assignment_form.png), [desktop_assignment_saved.png](evidence/s07_qa_real/desktop_assignment_saved.png) |
| TC-30.12 | Hợp đồng: tạo mới + sửa trạng thái | **PASS** `CREATED` → `UPDATED` | [desktop_contract_saved.png](evidence/s07_qa_real/desktop_contract_saved.png), [desktop_contract_edited.png](evidence/s07_qa_real/desktop_contract_edited.png) |
| TC-30.13 | Role `GENERAL_MANAGER` chỉ đọc | **PASS** list 200, write/fields 403, UI không nút thêm/sửa | [role_manager_assignments.png](evidence/s07_qa_real/role_manager_assignments.png), [role_manager_readonly.png](evidence/s07_qa_real/role_manager_readonly.png) |
| TC-30.14 | Role `STAFF` self-service | **PASS** list 403, self 200, UI chỉ Hồ sơ của tôi + Danh bạ | [role_staff_self.png](evidence/s07_qa_real/role_staff_self.png), [role_staff_self_mobile_390x844.png](evidence/s07_qa_real/role_staff_self_mobile_390x844.png) |
| TC-30.15 | Role `VIEWER` chỉ đọc | **PASS** list 200, self/write 403, banner chỉ xem | [role_viewer_readonly.png](evidence/s07_qa_real/role_viewer_readonly.png) |
| TC-30.16 | Role matrix API 4 role | **PASS** 28/28 status đúng | [role_api_matrix.json](evidence/s07_qa_full/role_api_matrix.json) |
| TC-30.17 | Organization plugin UI copy Core: sơ đồ, chi nhánh, phòng ban | **PASS** tạo QA2/QATEAM, xóa 200 | [admin_org_structure.png](evidence/s07_qa_full/admin_org_structure.png), [admin_org_branch_created.png](evidence/s07_qa_full/admin_org_branch_created.png) |
| TC-30.18 | Organization members + branch access CRUD | **PASS** gán QA Người xem, branch access | [admin_org_member_created.png](evidence/s07_qa_full/admin_org_member_created.png), [admin_org_branch_access_created.png](evidence/s07_qa_full/admin_org_branch_access_created.png) |
| TC-30.19 | Core organization UI/menu removed; redirect route cũ | **PASS** `/settings/organization` → `/settings/apps/org-structure` | [admin_settings_menu_no_core_org.png](evidence/s07_qa_full/admin_settings_menu_no_core_org.png), [legacy_org_redirect.png](evidence/s07_qa_full/legacy_org_redirect.png) |
| TC-30.20 | Onboarding invite → in-app notification email đã đăng ký | **PASS** `in_app_notified=true`, staff nhận thông báo | [onboarding_registered_email.png](evidence/s07_qa_full/onboarding_registered_email.png), [staff_notification_drawer.png](evidence/s07_qa_full/staff_notification_drawer.png) |
| TC-30.21 | Onboarding invite email chưa đăng ký | **PASS** `USER_NOT_IN_TENANT`, UI hướng dẫn gửi tay | [onboarding_unregistered_email.png](evidence/s07_qa_full/onboarding_unregistered_email.png) |
| TC-30.22 | Toàn bộ ảnh chức năng 4 role | **PASS** 64 ảnh, 0 console error | mục 8 |
| TC-30.23 | Catalog `EMPLOYEE_DOCUMENT_TYPE` + 9 items | **PASS** QA + minhvv | [admin_catalog_document_type_items.png](evidence/s07_qa_full/admin_catalog_document_type_items.png) |
| TC-30.24 | Employee document type select | **PASS** self + admin | [admin_document_type_select.png](evidence/s07_qa_full/admin_document_type_select.png) |
| TC-30.25 | Change request diff table | **PASS** field/old/new | [admin_request_change_table.png](evidence/s07_qa_full/admin_request_change_table.png) |
| TC-30.26 | Tenant defaults departments + approval chain | **PASS** 8 phòng, 2 bước | [admin_org_default_departments.png](evidence/s07_qa_full/admin_org_default_departments.png), [admin_approval_flow.png](evidence/s07_qa_full/admin_approval_flow.png) |
| TC-30.27 | Dropdown nhãn thân thiện thay mã | **PASS** status/type/contract/approval | [admin_create_status_type_friendly.png](evidence/s07_qa_full/admin_create_status_type_friendly.png), [admin_approval_flow.png](evidence/s07_qa_full/admin_approval_flow.png) |
| TC-30.28 | Sơ đồ node luồng duyệt: Đề xuất → bước → Hoàn tất | **PASS** node sắp theo step_no, chọn node giữ đúng bước, panel chi tiết, phạm vi chọn từ danh sách | [admin_approval_flow.png](evidence/s07_qa_full/admin_approval_flow.png), [admin_approval_flow_second_step.png](evidence/s07_qa_full/admin_approval_flow_second_step.png) |
| TC-30.29 | Paging danh sách nhân viên / onboarding / hợp đồng | **PASS** server-side + client-side | [admin_employee_list_pager_visible.png](evidence/s07_qa_full/admin_employee_list_pager_visible.png), [admin_onboarding_pager.png](evidence/s07_qa_full/admin_onboarding_pager.png), [admin_contract_pager.png](evidence/s07_qa_full/admin_contract_pager.png) |
| TC-30.30 | Bảng hiển thị text thay mã danh mục | **PASS** loại tài liệu, trạng thái, request type | [admin_onboarding_pager.png](evidence/s07_qa_full/admin_onboarding_pager.png), [admin_contract_friendly_selects.png](evidence/s07_qa_full/admin_contract_friendly_selects.png) |
| TC-30.31 | Cấu hình duyệt mobile 390×844 | **PASS** node dọc, 0 overflow ngang, touch ≥40px | [admin_approval_flow_mobile.png](evidence/s07_qa_full/admin_approval_flow_mobile.png), [admin_approval_flow_mobile_editor.png](evidence/s07_qa_full/admin_approval_flow_mobile_editor.png) |
| TC-30.32 | Regression: đổi field group không đảo node; swap step 1↔2 lưu đúng | **PASS** order 1→2 giữ nguyên, panel giữ node, DB swap đúng, 0 HTTP 500 | [approval_config_regression.txt](evidence/s07_qa_full/approval_config_regression.txt) |
| TC-30.33 | Role chip header hiển thị RBAC role | **PASS** manager `GENERAL_MANAGER`, viewer `VIEWER` | [manager_topbar_rbac_role.png](evidence/s07_qa_full/manager_topbar_rbac_role.png) |
| TC-30.34 | Link onboarding trong notification drawer | **PASS** anchor `https://openerp.9ms.io.vn/apps/employee/onboarding?token=…`, 0 console | [staff_notification_link.png](evidence/s07_qa_full/staff_notification_link.png) |
| TC-30.35 | Unsaved guard khi switch tenant lúc drawer mở | **PASS** `op:before-tenant-switch` bị cancel, banner nhắc đóng biểu mẫu | [admin_unsaved_tenant_guard.png](evidence/s07_qa_full/admin_unsaved_tenant_guard.png) |
| TC-30.36 | Branch data scope manager/viewer | **PASS** admin 8, manager/viewer 4 (HQ); 0 console/500 | [manager_branch_scope.png](evidence/s07_qa_full/manager_branch_scope.png), [branch_scope_qa.txt](evidence/s07_qa_full/branch_scope_qa.txt) |
| TC-30.37 | DSAR export/erase | **PASS** JSON export, anonymize PII, request COMPLETED | [admin_dsar_privacy.png](evidence/s07_qa_full/admin_dsar_privacy.png), [dsar_qa.txt](evidence/s07_qa_full/dsar_qa.txt) |
| TC-30.38 | Drop-legacy QA dev | **PASS** backup + verify + drop + smoke 4 màn | [drop_legacy_qa.txt](evidence/s07_qa_full/drop_legacy_qa.txt) |
| TC-30.39 | ClamAV scan tài liệu | **PASS** EICAR 422 `EMPLOYEE_DOCUMENT_INFECTED`; clean `scan_status=CLEAN` | [clamav_qa.txt](evidence/s07_qa_full/clamav_qa.txt) |
| TC-34 | Mobile Ionic host 390×844: login/menu/app/deep link | **PASS** 7/7 | [mobile_ionic_employee_390x844.png](evidence/s07_qa_real/mobile_ionic_employee_390x844.png) |
| TC-35 | Tenant `minhvv`: cài 2 plugin + mở employee/organization | **PASS** 4/4, 0 console | [minhvv_employee.png](evidence/s07_qa_real/minhvv_employee.png), [minhvv_organization.png](evidence/s07_qa_real/minhvv_organization.png) |
| TC-31 | Tenant switch sang tenant 2 rồi quay lại | **PASS** | [desktop_tenant_switcher.png](evidence/s07_qa_real/desktop_tenant_switcher.png) |
| TC-32 | Offboard last tenant admin | **PASS** 409 `EMPLOYEE_LAST_ADMIN_FORBIDDEN` | — |
| TC-33 | Cutover `status`/`backup`/`copy`/`verify` trên tenant dev | **PASS** 1/1/1/1, projection 1, closure OK | `evidence/s07_qa_real/cutover_backup/` |

Chi tiết log: [qa_real_e2e_summary.txt](evidence/s07_qa_real/qa_real_e2e_summary.txt).

### 2.5. Ảnh minh chứng

**Toàn bộ 64 ảnh chức năng/4 role:** mục 8 bên dưới

**Organization plugin (copy từ Core):**

![Org structure](evidence/s07_qa_full/admin_org_structure.png)

![Org branch created](evidence/s07_qa_full/admin_org_branch_created.png)

![Org members](evidence/s07_qa_full/admin_org_members.png)

**Catalog loại tài liệu + chọn loại khi upload:**

![Catalog document types](evidence/s07_qa_full/admin_catalog_document_type_items.png)

![Document type select](evidence/s07_qa_full/admin_document_type_select.png)

**Đề xuất — bảng giá trị cũ/mới:**

![Change request diff](evidence/s07_qa_full/admin_request_change_table.png)

**Tenant defaults — phòng ban + luồng duyệt dạng node:**

![Default departments](evidence/s07_qa_full/admin_org_default_departments.png)

![Approval flow](evidence/s07_qa_full/admin_approval_flow.png)

![Approval flow - chọn bước 2](evidence/s07_qa_full/admin_approval_flow_second_step.png)

![Approval flow - mobile 390x844](evidence/s07_qa_full/admin_approval_flow_mobile.png)

**Dropdown nhãn thân thiện:**

![Friendly filters](evidence/s07_qa_full/admin_filters_friendly.png)

![Friendly status/type](evidence/s07_qa_full/admin_create_status_type_friendly.png)

![Friendly contract selects](evidence/s07_qa_full/admin_contract_friendly_selects.png)

**Paging:**

![Employee pager](evidence/s07_qa_full/admin_employee_list_pager_visible.png)

![Onboarding pager](evidence/s07_qa_full/admin_onboarding_pager.png)

![Contract pager](evidence/s07_qa_full/admin_contract_pager.png)

**Onboarding → in-app notification:**

![Registered email](evidence/s07_qa_full/onboarding_registered_email.png)

![Staff notification](evidence/s07_qa_full/staff_notification_drawer.png)

![Staff notification link](evidence/s07_qa_full/staff_notification_link.png)

**Employee WC desktop (tenant QA):**

![Employee list](evidence/s07_qa_real/desktop_employee_list.png)

![HR tools](evidence/s07_qa_real/desktop_hr_tools.png)

![DSAR privacy](evidence/s07_qa_full/admin_dsar_privacy.png)

![HR onboarding](evidence/s07_qa_real/desktop_hr_onboarding.png)

**Phân công & hợp đồng (tenant QA):**

![Assignment form](evidence/s07_qa_real/desktop_assignment_form.png)

![Assignment saved](evidence/s07_qa_real/desktop_assignment_saved.png)

![Contract edited](evidence/s07_qa_real/desktop_contract_edited.png)

**Role trên app thật:**

![Role chip RBAC](evidence/s07_qa_full/manager_topbar_rbac_role.png)

![Manager branch scope](evidence/s07_qa_full/manager_branch_scope.png)

![Manager read-only](evidence/s07_qa_real/role_manager_readonly.png)

![Manager employee list](evidence/s07_qa_full/manager_employee_list.png)

![Manager profile](evidence/s07_qa_full/manager_profile_readonly.png)

![Staff self-service](evidence/s07_qa_real/role_staff_self.png)

![Staff self-service full](evidence/s07_qa_full/staff_self.png)

![Viewer read-only](evidence/s07_qa_real/role_viewer_readonly.png)

![Viewer employee list](evidence/s07_qa_full/viewer_employee_list.png)

![Viewer profile](evidence/s07_qa_full/viewer_profile_readonly.png)

![Manager contracts](evidence/s07_qa_full/manager_contracts.png)

![Viewer directory](evidence/s07_qa_full/viewer_directory.png)

![Tenant switcher](evidence/s07_qa_real/desktop_tenant_switcher.png)

**Mobile Ionic 390×844:**

![Mobile employee](evidence/s07_qa_real/mobile_ionic_employee_390x844.png)

**Tenant `minhvv` sau khi cài 2 plugin:**

![minhvv employee](evidence/s07_qa_real/minhvv_employee.png)

![minhvv HR tools](evidence/s07_qa_real/minhvv_hr_tools.png)

![minhvv organization](evidence/s07_qa_real/minhvv_organization.png)

### 2.4. Browser harness (bổ sung, trước E2E thật)

- Desktop 9/9, mobile 3/3, 0 console error, overflow 0, touch ≥40px; ảnh `evidence/s07_qa/`.

## 3. Bug phát hiện & xử lý

| ID | Mức độ | Mô tả | Trạng thái |
| :--- | :--- | :--- | :--- |
| [BUG-161](../07_items/BUG-161_mobile_employee_touch_targets.md) | High | Touch target 32px mobile | **Resolved (QA)** |
| [BUG-162](../07_items/BUG-162_employee_header_tab_context.md) | Low | Header subtitle sai tab | **Resolved (QA)** |
| [BUG-163](../07_items/BUG-163_org_cutover_drop_command.md) | High | `drop-legacy` sai handler key | **Resolved (QA)** |
| [BUG-164](../07_items/BUG-164_tenant_switcher_after_login.md) | High | Switcher thiếu sau login + sai shape tenant | **Resolved (QA)** |
| [BUG-165](../07_items/BUG-165_offboarding_last_admin_bypass.md) | **Critical** | Last admin guard bỏ qua `TENANT_ADMIN` | **Resolved (QA)** |
| [BUG-166](../07_items/BUG-166_plugin_permissions_tenant_admin.md) | High | Plugin install không grant TENANT_ADMIN | **Resolved (QA)** |
| [BUG-167](../07_items/BUG-167_missing_user_menu_slot.md) | High | Thiếu slot `core.layout.user-menu.items` | **Resolved (QA)** |
| [BUG-168](../07_items/BUG-168_backend_docker_argon2_crash.md) | **Critical** | Backend Docker SIGSEGV Argon2/JNA Alpine | **Resolved (QA)** |
| [BUG-169](../07_items/BUG-169_cutover_bootstrap_code_conflict.md) | High | Cutover unique code conflict với bootstrap HQ | **Resolved (QA)** |
| [BUG-170](../07_items/BUG-170_employee_self_calls_without_profile.md) | Medium | Self API 404 cho tài khoản không có hồ sơ | **Resolved (QA)** |
| [BUG-171](../07_items/BUG-171_mobile_manifest_before_auth.md) | High | Mobile manifest 401 trước login gây logout | **Resolved (QA)** |
| [BUG-172](../07_items/BUG-172_mobile_plugin_route_nested.md) | High | Mobile `/apps/:pluginKey` nằm sai dưới `/settings` | **Resolved (QA)** |
| [BUG-173](../07_items/BUG-173_backend_artifact_storage_ephemeral.md) | High | Artifact mất sau recreate backend, cài minhvv fail | **Resolved (QA)** |
| BUG-174 | High | Manager/staff/viewer thiếu quyền employee | **Resolved (QA)** |
| BUG-175 | High | Org CRUD fail vì outbox payload JSON | **Resolved (QA)** |
| BUG-176 | High | Cấu hình duyệt đảo/đổi bước do list sort theo field_group, chọn theo index, swap step trùng unique key | **Resolved (QA)** — employee 1.1.11 |

## 4. Not Run / giới hạn còn lại

| Hạng mục | Trạng thái | Ghi chú |
| :--- | :--- | :--- |
| Signed URL tải tài liệu | **PASS runtime 2026-11-01** | E2E 9/9 trên app thật (employee 1.1.22 + gateway signed passthrough): tạo NV → upload → signed-url → tải không cần Bearer → tampered sig 403 → forged/expired exp 403 → replay 200 (TR mục 2.6) |
| Core organization backend legacy | **Hoàn tất 2026-11-01** | Cutover C6: `modules/organization` xóa; V7.0.7 drop 4 bảng legacy + permission `core:*` cũ; Core projection-only; backend suite 254/254 PASS (PostgreSQL thật); V7.0.7 apply thật trên `openerp_dev` khi deploy backend mới |
| Catalog `EMPLOYEE_DOCUMENT_TYPE` trên runtime | **PASS runtime 2026-11-01** | catalog 1.0.10 publish + upgrade tenant QA ACTIVE; UI browser hiển thị `Loại tài liệu nhân sự` + danh sách loại, 0 console error (`catalog_1010_document_types.png`) |
| Signed URL UI tải file từ trình duyệt | **PASS runtime 2026-11-02** | WC employee 1.1.23 tải tài liệu qua signed URL cả 2 nhánh HR + self-service, không Bearer, 0 console error (TR mục 2.7; TASK-442) |

### 2.6. Runtime E2E — deferred closure (2026-11-01, employee 1.1.22 + catalog 1.0.10)

Môi trường: backend `open-erp/backend:dev` (cutover C6 + signed passthrough), employee 1.1.22 + catalog 1.0.10 ACTIVE tenant QA `s7qa-mvv0ge5r`; web dev `:4200`.

| TC | Kịch bản | Kết quả | Evidence |
| :--- | :--- | :--- | :--- |
| TC-40.1 | Backend mới deploy: Flyway `V7.0.7` apply thật, `plugin_catalog.org-structure` locked+default-install, 0 permission `core:*` legacy còn lại | **PASS** | backend log `Migrating schema "public" to version 7.0.7` |
| TC-40.2 | employee 1.1.22 package/publish/upgrade tenant QA — 7 bước lifecycle OK | **PASS** | `PLUGIN_UPGRADE_SUCCESS ACTIVE 1.1.22` |
| TC-40.3 | catalog 1.0.10 publish + upgrade tenant QA ACTIVE; UI hiển thị `Loại tài liệu nhân sự` | **PASS** | `catalog_1010_document_types.png` |
| TC-40.4 | Signed URL E2E 9/9 (xem mục 4 hàng 1): upload → signed-url → download không Bearer → tampered 403 → forged/expired 403 → replay 200 | **PASS 9/9** | `signed-url-results.txt` (scratchpad QA) |
| TC-40.5 | Employee screen 1.1.22 render + 0 overflow + 0 console error | **PASS** | `employee_122_list.png` |
| TC-40.6 | Catalog screen 1.0.10 render + 0 console error | **PASS** | `catalog_1010_loaded.png`, `catalog_1010_document_types.png` |

> Lưu ý thiết kế (đã verify): gateway có nhánh **signed passthrough** — GET `…/signed-documents/**` với query `sig` + `tenant_id` được forward không cần Bearer; plugin tự verify HMAC + TTL + quyền sở hữu theo tenant context gateway gửi, nên link rò rỉ không vượt tenant và không sống quá TTL. Production bắt buộc cấu hình `EMPLOYEE_DOCUMENT_SIGNED_URL_SECRET` riêng.

### 2.7. Runtime E2E — WC signed URL download (2026-11-02, employee 1.1.23, TASK-442)

Môi trường: Docker local (backend `:8088`, web `:4200`), employee **1.1.23** publish + install tenant QA
`s7-signed-mvv02` — `PLUGIN_INSTALL_SUCCESS ACTIVE` đủ 9 bước (PRE_FLIGHT, LEDGER, PROVISION_DATASOURCE,
MIGRATE, DEPLOY, HEALTH, TENANT_BOOTSTRAP, SEED_PERMISSIONS, ACTIVATE). Desktop ≥1280px.

| TC | Kịch bản | Kết quả | Evidence |
| :--- | :--- | :--- | :--- |
| TC-41.1 | Bundle WC mới build (`ng build employee-plugin`) → package 1.1.23 | **PASS** | `dist/bundle.zip` 35,756,362 bytes; checksums.txt |
| TC-41.2 | employee 1.1.23 upload artifact + đăng ký version + PUBLISH + install tenant QA | **PASS** | `PLUGIN_INSTALL_SUCCESS status=ACTIVE` 9 bước |
| TC-41.3 | WC nhánh HR: drawer Nhân sự → Tài liệu → Tải xuống | **PASS** | network: `POST /documents/{id}/signed-url` 200 → `GET /signed-documents/{id}?exp&sig&tenant_id` (Document) 200 mở PDF viewer, không kèm Bearer |
| TC-41.4 | WC nhánh self-service: Hồ sơ của tôi → Tải xuống | **PASS** | network: `POST /me/documents/{id}/signed-url` 200 → signed download (Document) 200 |
| TC-41.5 | Signed URL tạo bằng API rồi tải không Bearer | **PASS** | `EMPLOYEE_DOCUMENT_SIGNED_URL_CREATED`; GET 200 `application/pdf`, nội dung khớp file upload |
| TC-41.6 | Console browser trong toàn bộ phiên | **0 error** | chỉ vite debug + Angular dev mode log |
| TC-41.7 | Ảnh minh chứng | — | [evidence/s07_qa_signed_url/](evidence/s07_qa_signed_url/) — `wc_hr_documents_before_download.png`, `wc_self_signed_url_download.png` |

> Ghi chú môi trường (không phải bug của TASK-442): trên web dev Vite, chuyển tab giữa các màn plugin đôi khi
> remount iframe ở trạng thái Error — full reload hoạt động chuẩn, đã xuất hiện ở các lần QA trước. Thay đổi
> TASK-442 chỉ nằm ở handler download trong plugin component.

## 5. Rủi ro / khuyến nghị

1. `drop-legacy` đã chạy trên QA dev sau backup/verify; staging/prod vẫn cần maintenance window + rollback drill (V7.0.7 sẽ tự drop khi deploy code mới).
2. Plugin local storage dùng signed URL HMAC với secret mặc định dev; production bắt buộc cấu hình secret riêng.
3. Tenant test QA `s7qa-mvv0ge5r` và container plugin còn chạy trên Docker local; dọn sau review nếu cần.
4. `subordinates` sau cutover resolve duy nhất từ `core_user_manager_edge` (org plugin là nguồn duy nhất của reporting line); rule cũ "manager phòng ban ⇒ cấp dưới" không còn ở Core — plugin ghi manager edge khi tạo phân công có quản lý.

## 6. Đề nghị

1. PM/customer review TR-S07-001 1.17.
2. Không còn Medium deferred chặn: legacy cutover C6 + signed URL đã hoàn tất; QA rebuild image plugin (1.1.20) + catalog 1.0.10 để E2E runtime lần cuối trước khi đóng Sprint.
3. Trước production: chạy cutover `backup/copy/verify` trên staging, drill rollback, rồi mới `drop-legacy` (V7.0.7 đã có sẵn migration drop khi deploy).
4. Production phải cấu hình `EMPLOYEE_DOCUMENT_SIGNED_URL_SECRET` riêng (không dùng secret mặc định dev).

## 7. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | QA lần 1: 294 test, harness 11/11, BUG-161/162; E2E/cutover blocked | TP-S07-001 1.0 |
| 1.1 | 2026-10-30 | Re-test: 300 test, harness 12/12, cutover E2E DB tạm, BUG-163 | TP-S07-001 1.1 |
| 1.2 | 2026-10-30 | App thật Docker E2E PASS 12/12; tenant switch, last-admin guard, cutover dev; BUG-164…170 resolved; QA PASS implementation | TP-S07-001 1.2 |
| 1.3 | 2026-10-30 | Mobile Ionic 390×844 7/7 PASS; BUG-171/172 resolved; QA PASS implementation desktop+mobile | TP-S07-001 1.3 |
| 1.4 | 2026-10-30 | Tenant minhvv cài 2 plugin + screen PASS; ảnh inline; BUG-173 artifact volume resolved | TP-S07-001 1.3 |
| 1.5 | 2026-10-30 | UI Nhân sự + Công cụ HR thiết kế lại thân thiện; nhãn field đa ngôn ngữ; tự seed 15 field config; employee 1.0.6; chụp lại ảnh desktop + minhvv, 0 console error | TP-S07-001 1.3 |
| 1.6 | 2026-10-31 | Thêm màn phân công/hợp đồng; kiểm thử 4 role; BUG-174 role defaults + V7.0.5 + seeder; employee 1.0.8; 302 test Java; 0 console error | TP-S07-001 1.5 |
| 1.7 | 2026-10-31 | Org plugin UI parity + bỏ Core org UI; 59 ảnh 4 role; onboarding in-app notification; BUG-175; employee 1.1.3/org 1.1.3/notification 1.0.9 | TP-S07-001 1.6 |
| 1.8 | 2026-10-31 | Catalog loại tài liệu + 9 mẫu; bảng diff đề xuất; tenant defaults 8 phòng + luồng duyệt 2 bước; dropdown nhãn thân thiện thay mã; employee 1.1.3/org 1.1.3/catalog 1.0.9; 59 ảnh | TP-S07-001 1.7 |
| 1.9 | 2026-10-31 | Cấu hình duyệt dạng card; paging nhân viên/onboarding/hợp đồng; bảng danh mục hiển thị text; employee 1.1.3; QA chụp lại UI mới nhất | TP-S07-001 1.8 |
| 1.10 | 2026-10-31 | Cấu hình duyệt thiết kế lại thành sơ đồ node (Đề xuất → bước → Hoàn tất) có mũi tên, chọn node + panel chi tiết, phạm vi chọn từ chi nhánh/phòng ban; ảnh desktop + mobile + minhvv; employee 1.1.8 | QA; ảnh chụp app thật 2026-10-31 |
| 1.11 | 2026-10-31 | BUG-176: sửa đảo/đổi bước cấu hình duyệt — node sort theo step_no, chọn theo object, backend two-phase swap step; employee 1.1.11; regression PASS | QA; app thật + approval_config_regression.txt |
| 1.12 | 2026-10-31 | Role chip header dùng RBAC role; notification drawer mở link onboarding clickable; notification 1.0.10; 61 ảnh | QA; app thật 2026-10-31 |
| 1.13 | 2026-10-31 | Unsaved guard switch tenant khi drawer mở; employee 1.1.12; 62 ảnh | QA; app thật 2026-10-31 |
| 1.14 | 2026-10-31 | Branch data scope manager/viewer; DSAR export/erase; drop-legacy QA dev; employee 1.1.17; 64 ảnh | QA; app thật 2026-10-31 |
| 1.15 | 2026-10-31 | ClamAV scan PASS: EICAR 422, clean CLEAN; compose profile `av` TCP 3310; employee 1.1.18 | QA; app thật 2026-10-31 |
| 1.16 | 2026-10-31 | Giới hạn node cấu hình duyệt `sm:max-w-48`; hết kéo rộng canvas; employee 1.1.19 | QA; app thật 2026-10-31 |
| 1.17 | 2026-11-01 | Hoàn tất các mục deferred theo chỉ đạo chủ dự án: cutover C6 (V7.0.7 drop legacy + org-structure always-on, Core projection-only, backend **254/254 PASS**), signed URL HMAC + 3 endpoint (plugin 18/18 PASS), catalog root/resource plugin.json sync 1.0.10 (validate PASS); ScopeProjectionServiceTest/SecurityContextServiceTest/SampleRecordApiTest/SchemaFoundationTest/EntityRegistryServiceTest/ImpersonationApiTest/AuditWiringTest cập nhật theo kiến trúc projection | Developer; chỉ đạo chủ dự án 2026-11-01 |
| 1.18 | 2026-11-01 | **Runtime E2E deferred closure PASS**: backend mới deploy với V7.0.7 apply thật; employee **1.1.22** (signed URL trả gateway prefix + tenant_id) và catalog **1.0.10** (bundle JAR, UI document types render) upgrade tenant QA ACTIVE; **signed URL E2E 9/9** (tải không Bearer, tampered/forged/expired 403, replay 200) qua gateway signed passthrough (`PluginRuntimeGatewayResource`); browser employee/catalog 0 console error, 0 overflow, ảnh `evidence/s07_qa_real/{employee_122_list,catalog_1010_loaded,catalog_1010_document_types}.png`; plugin 18/18 test lại PASS | QA/QC + Developer; app thật 2026-11-01 |
| 1.19 | 2026-11-02 | **WC signed URL download PASS (TASK-442)**: employee **1.1.23** publish + install tenant QA mới đủ 9 bước; WC desktop tải tài liệu qua signed URL cả 2 nhánh HR + self-service, không Bearer, 0 console error; mục 4 cập nhật; ảnh `evidence/s07_qa_signed_url/` | QA/QC + Developer; app thật 2026-11-02; chỉ đạo chủ dự án |





## 8. Full screenshot gallery (64 ảnh)

![admin_approval_flow](evidence/s07_qa_full/admin_approval_flow.png)

![admin_approval_flow_mobile](evidence/s07_qa_full/admin_approval_flow_mobile.png)

![admin_approval_flow_mobile_editor](evidence/s07_qa_full/admin_approval_flow_mobile_editor.png)

![admin_approval_flow_second_step](evidence/s07_qa_full/admin_approval_flow_second_step.png)

![admin_catalog_document_type_items](evidence/s07_qa_full/admin_catalog_document_type_items.png)

![admin_catalog_document_types](evidence/s07_qa_full/admin_catalog_document_types.png)

![admin_contract_friendly_selects](evidence/s07_qa_full/admin_contract_friendly_selects.png)

![admin_contract_pager](evidence/s07_qa_full/admin_contract_pager.png)

![admin_create_status_type_friendly](evidence/s07_qa_full/admin_create_status_type_friendly.png)

![admin_directory](evidence/s07_qa_full/admin_directory.png)

![admin_document_type_select](evidence/s07_qa_full/admin_document_type_select.png)

![admin_dsar_privacy](evidence/s07_qa_full/admin_dsar_privacy.png)

![admin_employee_assignments](evidence/s07_qa_full/admin_employee_assignments.png)

![admin_employee_contracts](evidence/s07_qa_full/admin_employee_contracts.png)

![admin_employee_create_drawer](evidence/s07_qa_full/admin_employee_create_drawer.png)

![admin_employee_documents](evidence/s07_qa_full/admin_employee_documents.png)

![admin_employee_list](evidence/s07_qa_full/admin_employee_list.png)

![admin_employee_list_pager](evidence/s07_qa_full/admin_employee_list_pager.png)

![admin_employee_list_pager_visible](evidence/s07_qa_full/admin_employee_list_pager_visible.png)

![admin_employee_profile](evidence/s07_qa_full/admin_employee_profile.png)

![admin_filters_friendly](evidence/s07_qa_full/admin_filters_friendly.png)

![admin_onboarding_pager](evidence/s07_qa_full/admin_onboarding_pager.png)

![admin_org_branch_access](evidence/s07_qa_full/admin_org_branch_access.png)

![admin_org_branch_access_created](evidence/s07_qa_full/admin_org_branch_access_created.png)

![admin_org_branch_created](evidence/s07_qa_full/admin_org_branch_created.png)

![admin_org_branch_drawer](evidence/s07_qa_full/admin_org_branch_drawer.png)

![admin_org_default_departments](evidence/s07_qa_full/admin_org_default_departments.png)

![admin_org_department_created](evidence/s07_qa_full/admin_org_department_created.png)

![admin_org_department_drawer](evidence/s07_qa_full/admin_org_department_drawer.png)

![admin_org_member_created](evidence/s07_qa_full/admin_org_member_created.png)

![admin_org_members](evidence/s07_qa_full/admin_org_members.png)

![admin_org_structure](evidence/s07_qa_full/admin_org_structure.png)

![admin_request_change_table](evidence/s07_qa_full/admin_request_change_table.png)

![admin_request_detail](evidence/s07_qa_full/admin_request_detail.png)

![admin_requests_list](evidence/s07_qa_full/admin_requests_list.png)

![admin_self](evidence/s07_qa_full/admin_self.png)

![admin_settings_menu_no_core_org](evidence/s07_qa_full/admin_settings_menu_no_core_org.png)

![admin_tools_campaigns](evidence/s07_qa_full/admin_tools_campaigns.png)

![admin_tools_fields](evidence/s07_qa_full/admin_tools_fields.png)

![admin_tools_onboarding](evidence/s07_qa_full/admin_tools_onboarding.png)

![admin_tools_privacy](evidence/s07_qa_full/admin_tools_privacy.png)

![admin_unsaved_tenant_guard](evidence/s07_qa_full/admin_unsaved_tenant_guard.png)

![legacy_org_redirect](evidence/s07_qa_full/legacy_org_redirect.png)

![manager_assignments](evidence/s07_qa_full/manager_assignments.png)

![manager_branch_scope](evidence/s07_qa_full/manager_branch_scope.png)

![manager_contracts](evidence/s07_qa_full/manager_contracts.png)

![manager_directory](evidence/s07_qa_full/manager_directory.png)

![manager_employee_list](evidence/s07_qa_full/manager_employee_list.png)

![manager_profile_readonly](evidence/s07_qa_full/manager_profile_readonly.png)

![manager_self](evidence/s07_qa_full/manager_self.png)

![manager_topbar_rbac_role](evidence/s07_qa_full/manager_topbar_rbac_role.png)

![minhvv_approval_flow](evidence/s07_qa_full/minhvv_approval_flow.png)

![minhvv_employee_1_0_9](evidence/s07_qa_full/minhvv_employee_1_0_9.png)

![minhvv_org_plugin_1_1_2](evidence/s07_qa_full/minhvv_org_plugin_1_1_2.png)

![onboarding_registered_email](evidence/s07_qa_full/onboarding_registered_email.png)

![onboarding_unregistered_email](evidence/s07_qa_full/onboarding_unregistered_email.png)

![role_staff_self_mobile_390x844](evidence/s07_qa_full/role_staff_self_mobile_390x844.png)

![staff_directory](evidence/s07_qa_full/staff_directory.png)

![staff_notification_drawer](evidence/s07_qa_full/staff_notification_drawer.png)

![staff_notification_link](evidence/s07_qa_full/staff_notification_link.png)

![staff_self](evidence/s07_qa_full/staff_self.png)

![viewer_directory](evidence/s07_qa_full/viewer_directory.png)

![viewer_employee_list](evidence/s07_qa_full/viewer_employee_list.png)

![viewer_profile_readonly](evidence/s07_qa_full/viewer_profile_readonly.png)

