# [00] Sprint 07 — Plugin Employee (Hồ sơ nhân viên & Tự phục vụ)

| Trường | Giá trị |
| :--- | :--- |
| ID / phiên bản / cập nhật | READ-S07-001 / 1.1 / 2026-11-01 |
| Trạng thái tài liệu / sprint | **Scope APPROVED 1.0; Design APPROVED 1.0; Implementation Done (QA); Deferred closure hoàn tất — Ready for PM/customer review (REV-S07-001)** |
| Owner / reviewer | BA + Architect / Chủ dự án (review design) |
| Đầu vào / đọc trước | Yêu cầu trực tiếp của chủ dự án 2026-10-29 / [Sprint 06](../sprint_06_plugin_dev_platform/00_READING_GUIDE.md) (đã đóng), [Sprint 05](../sprint_05_catalog_plugin/00_READING_GUIDE.md), [Sprint 02](../sprint_02_superadmin_rbac/00_READING_GUIDE.md) |
| Đọc tiếp | [RAW-S07-001](01_raw_notes/01_RAW-S07-001_employee_plugin_requirements.md) → [CONF-S07-001](04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md) |

> **Trạng thái 2026-11-01 — Deferred closure + runtime E2E PASS (Ready for PM/customer review):** backend **254/254 PASS** sau cutover C6 (V7.0.7 apply thật khi deploy backend mới); **employee 1.1.22** + **catalog 1.0.10** upgrade tenant QA ACTIVE; **signed URL E2E 9/9** (tải không Bearer, tampered/forged 403, replay 200) qua gateway signed passthrough; browser employee/catalog 0 console error (TR 1.18 mục 2.6). BUG-161…176 resolved. PM/customer review [REV-S07-001 1.1](09_review/01_REV-S07-001_sprint_07_dod_review.md) — **Sprint chưa đóng, chờ chủ dự án duyệt**.

## 1. Đọc để hiểu gì?

Sprint 07 xây **plugin nghiệp vụ `employee`** (đề xuất `open-erp-employee`) — plugin nhân sự đầu tiên của Open-ERP. Plugin trả lời một câu hỏi nền tảng:

> **Một tài khoản trong tenant là “nhân viên” theo nghĩa nào, hồ sơ nhân sự của người đó gồm những gì, và ai được xem/sửa?**

Sprint có **hai chế độ vận hành**, không phải hai phương án loại trừ nhau:

1. **Quản trị nhân viên (HR Admin)** — Tenant Admin/HR xem danh sách, tạo hồ sơ, gán chi nhánh/phòng ban/chức danh/quản lý, theo dõi trạng thái, xử lý nghỉ việc, duyệt đề xuất cập nhật; phạm vi dữ liệu theo tenant hoặc chi nhánh.
2. **Tự phục vụ (Employee Self-Service)** — nhân viên đăng nhập, xem hồ sơ của chính mình, cập nhật các trường được phép và gửi đề xuất để HR duyệt; không thấy hồ sơ người khác.

Plugin này **không** làm lương, chấm công, nghỉ phép, tuyển dụng hay đánh giá hiệu suất. Nó là **nguồn hồ sơ nhân sự** để các plugin HR sau này (attendance, payroll, leave) tham chiếu qua Entity Registry.

### 1.1. Kiến thức nền cần có

| Chủ đề | Đọc trước | Vì sao cần |
| :--- | :--- | :--- |
| Tài khoản, tenant, phân quyền | [Sprint 01](../sprint_01_core_iam/00_READING_GUIDE.md), [Sprint 02](../sprint_02_superadmin_rbac/00_READING_GUIDE.md) | `users` là danh tính toàn cục; `user_tenants` là quyền truy cập tenant; dữ liệu HR phải tách khỏi hai thứ này |
| Cơ cấu tổ chức | Sprint 02 — `branches`, `departments`, `user_department_memberships`, `direct_manager_user_id`, data scope | Plugin phải dùng lại chi nhánh/phòng ban/quản lý trực tiếp, không tạo cây tổ chức thứ hai |
| Danh mục | [Sprint 05](../sprint_05_catalog_plugin/00_READING_GUIDE.md) — Chức danh, Loại hợp đồng, Ca làm việc, Trình độ học vấn | Hồ sơ nhân viên tham chiếu danh mục thay vì hardcode |
| Nền tảng plugin | [Sprint 06](../sprint_06_plugin_dev_platform/00_READING_GUIDE.md) — zero-DB, soft ref, Entity Registry, WC/MF | Plugin độc lập, schema riêng, không join xuyên plugin |

## 2. Lộ trình đọc

Khách hàng đọc **01 → 04**; developer đọc **01–04** trước, sau khi scope duyệt mới đọc 05–09.

| Thứ tự | ID/alias | Link file | Nội dung/câu hỏi được giải đáp | Owner |
| :--- | :--- | :--- | :--- | :--- |
| 01.01 | RAW-S07-001 | [Yêu cầu gốc](01_raw_notes/01_RAW-S07-001_employee_plugin_requirements.md) | Nguyên văn yêu cầu, bóc tách R1–R9, ràng buộc đã biết, câu hỏi mở | BA |
| 02.01 | ANL-S07-001 | [Thân phận nhân viên & mô hình dữ liệu](02_analysis/01_ANL-S07-001_employee_identity_and_data_model.md) | User vs member vs employee; nguồn sự thật cho phân công; vòng đời; dữ liệu nhạy cảm; BR/edge case | BA |
| 02.02 | ANL-S07-002 | [Quản trị & tự phục vụ](02_analysis/02_ANL-S07-002_admin_management_and_self_service.md) | Vai trò, ma trận quyền, luồng HR Admin, luồng nhân viên, duyệt thay đổi, UI Web/Mobile | BA |
| 02.03 | ANL-S07-003 | [Tách plugin Chi nhánh/Phòng ban](02_analysis/03_ANL-S07-003_organization_plugin_extraction.md) | Coupling Core, phương án tách, data scope projection, migration, Q39–Q46 | BA |
| 02.04 | ANL-S07-004 | [Switch tenant trên header](02_analysis/04_ANL-S07-004_tenant_switcher_header.md) | Hiện trạng auth/header, vị trí Core/shared, API switch, session/cache/plugin, Q47–Q52 | BA |
| 03.01 | BENCH-S07-001 | [Đối chuẩn hồ sơ nhân viên & self-service](03_benchmarks/01_BENCH-S07-001_employee_profile_and_self_service.md) | Odoo, ERPNext, SAP, Workday, BambooHR, Personio, Zoho, MISA, Base; bài học cho Open-ERP | BA |
| 04.01 | CONF-S07-001 | [Scope, AC & câu hỏi](04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md) | ✅ **APPROVED 1.0** — 55/55 câu; 37 AC | BA + Khách hàng |
| 05.01 | SOL-S07-001 | [Giải pháp tổng thể](05_solutions/01_SOL-S07-001_employee_organization_architecture.md) | Employee + organization + tenant switcher; ranh giới, luồng, quyết định, rủi ro | Architect |
| 05.02 | ADR-S07-001 | [Hai lớp assignment & projection](05_solutions/02_ADR-S07-001_two_layer_assignment_projection.md) | Organization access vs employee HR; Core projection/fail-safe | Architect |
| 05.03 | ADR-S07-002 | [Tách organization & big-bang](05_solutions/03_ADR-S07-002_organization_extraction_cutover.md) | Plugin organization, cutover, namespace/entity mới | Architect |
| 05.04 | ADR-S07-003 | [Tenant switcher header](05_solutions/04_ADR-S07-003_tenant_switcher_header.md) | UI employee header + host callback + auth Core | Architect |
| 06.01 | DES-ARCH-S07-001 | [Kiến trúc thành phần & luồng](06_designs/arch/01_DES-ARCH-S07-001_components_and_flows.md) | Thành phần, request flow, projection, security, test | Architect |
| 06.02 | DES-DB-S07-001 | [Schema organization/employee/projection](06_designs/db/01_DES-DB-S07-001_employee_organization_schema.md) | Bảng/cột/index/constraint, migration, retention | Architect |
| 06.03 | DES-API-S07-001 | [API contract](06_designs/api/01_DES-API-S07-001_employee_organization_auth_api.md) | Auth switch, org, employee, internal projection, 4 mẫu, lỗi/quyền | Architect |
| 06.04 | DES-UI-S07-001 | [UI/UX](06_designs/ui/01_DES-UI-S07-001_employee_organization_ui.md) | Route map, admin/self, approval, switcher, shared components, mobile | Architect |
| 07.01 | FEAT-36 | [Organization extraction & projection](07_items/FEAT-36_organization_extraction_projection.md) | Plugin organization, cutover, projection; TASK-426…429 | Developer |
| 07.02 | FEAT-37 | [Employee plugin core](07_items/FEAT-37_employee_plugin_core.md) | Hồ sơ, self-service, duyệt, tài liệu, privacy; TASK-430…436 | Developer |
| 07.03 | FEAT-38 | [Tenant switcher](07_items/FEAT-38_tenant_switcher.md) | Auth switch + user-menu UI; TASK-437…438 | Developer |
| 08.03 | TR-S07-001 | [Test report Sprint 07](08_testing/03_TR-S07-001_sprint_07_test_report.md) | QA report tự chứa: kết quả, bug, 64 ảnh inline | QA |
| 09.01 | REV-S07-001 | [Nghiệm thu & DoD Sprint 07](09_review/01_REV-S07-001_sprint_07_dod_review.md) | PM DoD + nghiệm thu chủ dự án + closure | PM |

> Bảng đọc là snapshot. Không tạo link giả cho artifact chưa tồn tại; khi tạo file phải cập nhật index trước khi giao việc.

## 3. Gate riêng biệt

| Gate | Trạng thái | Người quyết định | Nguồn/phiên bản/ngày |
| :--- | :--- | :--- | :--- |
| Scope & AC (CONF-S07-001) | ✅ **APPROVED 1.0** — 55/55 câu; chủ dự án duyệt | Chủ dự án | CONF-S07-001 1.0, 2026-10-30 |
| Design ready (SOL/ADR/DES) | ✅ **APPROVED 1.0** — 1 SOL, 3 ADR, 4 DES; UI U1–U8 | Architect + Chủ dự án | Design review 2026-10-30 |
| Implementation | ✅ **Done (QA)** — app thật E2E + cutover C6 | Developer + QA | HANDOFF/TR 1.17, 2026-11-01 |
| QA sign-off | ✅ **PASS implementation + runtime E2E deferred closure** — backend 254/254; signed URL 9/9; 0 Critical/High | QA | TR-S07-001 1.18, 2026-11-01 |
| PM DoD / Customer acceptance | ⏳ **Pending** — REV-S07-001 1.1 Draft ready | PM + Chủ dự án | REV-S07-001 1.1, 2026-11-01 |
| Sprint closure | ⏳ **Pending** | PM | Chưa có |

## 4. Danh mục ID và việc chuyển tiếp

| TYPE/ID | File hoặc reservation | Owner | Tình trạng cấp số |
| :--- | :--- | :--- | :--- |
| READ-S07-001 | [00_READING_GUIDE.md](00_READING_GUIDE.md) | BA | Used |
| RAW-S07-001 | [01_raw_notes/](01_raw_notes/) | BA | Used |
| ANL-S07-001…004 | [02_analysis/](02_analysis/) | BA | Used |
| BENCH-S07-001 | [03_benchmarks/](03_benchmarks/) | BA | Used |
| CONF-S07-001 | [04_confirmation/](04_confirmation/) | BA + Khách hàng | Used — Draft 0.6/Pending duyệt |
| SOL-S07-001 | [05_solutions/](05_solutions/) | Architect | Used — Draft/In Review |
| ADR-S07-001…003 | [05_solutions/](05_solutions/) | Architect | Used — Draft/In Review |
| DES-ARCH-S07-001 | [06_designs/arch/](06_designs/arch/) | Architect | Used — Draft/In Review |
| DES-DB-S07-001 | [06_designs/db/](06_designs/db/) | Architect | Used — Draft/In Review |
| DES-API-S07-001 | [06_designs/api/](06_designs/api/) | Architect | Used — Draft/In Review |
| DES-UI-S07-001 | [06_designs/ui/](06_designs/ui/) | Architect | Used — Draft/In Review |
| FEAT-36…38 | [07_items/](07_items/) | Developer | Used — Done (QA) |
| TASK-426…438 | [07_items/](07_items/) | Developer | Used — Done (QA) |
| TR-S07-001 | [08_testing/](08_testing/) | QA | Used — TR-S07-001 1.18 (self-contained + runtime E2E) |
| BUG-161…176 | [07_items/](07_items/) | QA/Developer | Used — Resolved (QA) |
| REV-S07-001 | [09_review/](09_review/) | PM | Used — Draft 1.1, Ready for PM/customer review |

> Không dùng số task/bug dự kiến trước khi scope được duyệt; tránh cấp số cho item chưa tồn tại.

## 5. Liên hệ với các Sprint trước

| Nguồn | Tài sản hiện có | Sprint 07 dùng thế nào |
| :--- | :--- | :--- |
| Sprint 01–02 | `users`, `user_profiles`, `user_tenants`, vai trò/quyền, data scope | Danh tính đăng nhập và phạm vi dữ liệu; không tạo user mới trong plugin |
| Sprint 02 | `branches`, `departments`, `user_department_memberships`, `direct_manager_user_id`, chống chu trình quản lý | **Sẽ tách branch/department sang plugin organization (R8)**; employee giữ assignment cho mọi member; Core đọc projection; Q39–Q54 |
| Sprint 05 | Catalog: Chức danh, Loại hợp đồng, Ca làm việc, Trình độ học vấn; `catalog_item_id` | Tham chiếu danh mục cho chức danh/học vấn/loại hợp đồng; **không** dùng catalog “Phòng ban” làm cây tổ chức |
| Sprint 06 | Plugin zero-DB, `plugin.json` 2.0, soft ref, Entity Registry, WC/MF, notification plugin | Đóng gói plugin độc lập, schema riêng, UI slot/screen, thông báo đề xuất |
| Sprint 06 | Mobile plugin host (catalog đang read-only) | Cần xác nhận khả năng ghi trên mobile trước khi cam kết Q25 |

## 6. Quyết định đã chốt

**30/30 câu gốc đã trả lời (CONF-S07-001 0.2).** Tóm tắt các quyết định định hình kiến trúc:

| # | Chốt | Hệ quả chính |
| :--- | :--- | :--- |
| Q1 | Employee tách khỏi tenant member, liên kết tùy chọn | Có hồ sơ không tài khoản; không ép mọi member thành nhân viên |
| Q2 | Hỗ trợ nhân viên không tài khoản | Cần trạng thái “chưa liên kết”; self-service mở sau |
| Q3 | Một hồ sơ, nhiều phân công | Cần bảng assignment, phân công chính, quản lý theo phân công |
| Q5 | Plugin nhập phân công, đồng bộ Core | **Đã bị thay bởi Q41/Q53/Q54**: employee sở hữu assignment, organization giữ master data |
| Q6 | Always-on | Provisioning mọi tenant, không gỡ; cần text fallback nếu thiếu catalog |
| Q9/Q10 | Ngày hợp đồng + effective-dated đầy đủ | Cần mô hình hiệu lực, as-of, future-dated, audit hồi tố |
| Q11/Q34 | Tự động khóa tài khoản + gỡ quyền khi nghỉ; chặn nếu còn cấp dưới | Cần xử lý bàn giao, rehire mời lại |
| Q13 | Nhóm dữ liệu đúng đề xuất | Có giấy tờ/thuế/BHXH/học vấn/hợp đồng tối thiểu |
| Q16/Q30 | Org chart đầy đủ + danh bạ + import/export | Thêm màn hình/lưu trữ/kiểm thử đáng kể |
| Q17/Q37 | Tài liệu đầy đủ, nhân viên được upload | Storage, virus scan, version, quyền, duyệt, retention |
| Q20 | Tenant tự cấu hình allowlist | Cần màn cấu hình trường + template |
| Q21/Q22/Q36 | Hybrid + duyệt nhiều cấp tuần tự | State machine, cấu hình chuỗi duyệt, delegation |
| Q23/Q24 | Self-onboarding + chiến dịch cập nhật | Cần link mời, theo dõi tiến độ, thông báo |
| Q26/Q27 | HR full, branch read; mask + audit | Data scope Core + field-level permission |
| Q29/Q38 | Privacy đầy đủ trong Sprint 07 | Consent/DSAR/breach/retention + legal review |
| Q31 | **Làm tất cả cùng lúc**, không chia phase | Một release; rủi ro tiến độ cao |
| Q32 | Future + as-of + sửa hồi tố | Mô hình hiệu lực đầy đủ, audit lý do |
| Q33 | Quản lý theo từng phân công | Assignment có manager riêng; hợp đồng chung |
| Q35 | Always-on, được ẩn menu | Không gỡ; text fallback |
| Q39/Q40 | Một plugin organization; tách toàn bộ (điều chỉnh bởi Q53/Q54) | Organization giữ branch/department master |
| Q41/Q53/Q54 | **Hai lớp**: organization access membership; employee HR assignment | Core projection merge; non-employee vẫn có scope; không dual-write |
| Q42 | Core dùng projection table | Core không query bảng plugin; rebuild/fail-safe |
| Q43 | Big-bang migration | Freeze/backup/rollback drill; rủi ro cao |
| Q44 | Organization always-on | Provisioning/backfill; không gỡ |
| Q45/Q46 | Đổi namespace API/quyền/entity | Migration consumer/role/route; rủi ro cao |
| Q47–Q52 | Switcher trong employee header; endpoint Core; revoke session; clear state | Cross-tenant isolation; guard unsaved; UX dropdown |
| Q55 | Chặn offboard last owner/admin/platform role | Chuyển quyền trước; audit |

Chi tiết đầy đủ tại [CONF-S07-001 §5](04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md). Không suy ra approval từ việc đã trả lời câu hỏi.

## 7. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Khởi tạo Sprint-Pack 07: RAW, 2 ANL, BENCH, CONF nháp với 30 câu hỏi; gate Pending | BA Agent; yêu cầu trực tiếp chủ dự án |
| 0.2 | 2026-10-29 | Ghi nhận 30/30 câu trả lời; scope mở rộng; thêm Q31–Q38; gate vẫn Pending | BA Agent; hội thoại interactive chủ dự án |
| 0.3 | 2026-10-30 | Ghi nhận Q31–Q38: all-at-once, effective-dated đầy đủ, employee upload, privacy đầy đủ | BA Agent; hội thoại interactive |
| 0.4 | 2026-10-30 | Bổ sung R8 organization plugin + R9 tenant switcher; ANL-003/004; Q39–Q52; gate Pending | BA Agent; yêu cầu trực tiếp chủ dự án |
| 0.5 | 2026-10-30 | Ghi nhận Q39–Q54; 54/54 câu đã trả lời; gate chờ duyệt scope/AC | BA Agent; hội thoại interactive |
| 0.6 | 2026-10-30 | Đổi sang 2 lớp assignment (org access + employee HR); thêm Q55 offboarding guard; 55/55 câu | BA Agent; hội thoại interactive |
| 0.7 | 2026-10-30 | **Scope APPROVED**; thêm SOL/ADR/DES 05–06; Design In Review | Architect; CONF 1.0 |
| 0.8 | 2026-10-30 | UI U1–U8: menu theo vai trò, full-page tabs, drawer nhiều bước, switcher user menu, split-view approval, org chart matrix, document card grid | Architect; UI interactive |
| 0.9 | 2026-10-30 | **Design APPROVED**; cấp FEAT-36…38 + TASK-426…438; Implementation To Do | Architect/PM; design review |
| 1.0 | 2026-10-30 | TASK-426 scaffold plugin org-structure + schema + bootstrap; validate/Maven PASS; seed runtime pending | Developer; working tree |
| 1.1 | 2026-10-30 | Org CRUD/UI, Core projection/auth switch, employee backend/WC vertical slice; HANDOFF QA; full scope chưa xong | Developer; build/test/validate |
| 1.2 | 2026-10-30 | Employee full backend + WC admin/self/approval/config/docs, tenant switcher web/mobile, cutover script/runbook; HANDOFF 0.2 | Developer; build/test/validate |
| 1.3 | 2026-10-30 | QA TP/TR-S07-001: 294 test PASS, browser harness desktop/mobile PASS, BUG-161/162 resolved; E2E/cutover blocked, không sign-off | QA; TR-S07-001 |
| 1.4 | 2026-10-30 | Hoàn thiện last-owner guard, org chart/import-export, HR tools UI, cutover E2E DB tạm, audit/rate limit switch; QA re-test 300 test + harness 12/12, BUG-163 resolved | Developer/QA; TR-S07-001 1.1 |
| 1.5 | 2026-10-30 | App thật Docker E2E PASS 12/12; tenant switch + last-admin guard + cutover dev; BUG-164…170 resolved; QA PASS implementation | QA; TR-S07-001 1.2 |
| 1.6 | 2026-10-30 | Mobile Ionic 390×844 7/7 PASS; BUG-171/172 resolved; QA PASS desktop+mobile | QA; TR-S07-001 1.3 |
| 1.7 | 2026-10-30 | Tenant minhvv cài 2 plugin + screen PASS; ảnh inline trong TR; BUG-173 artifact volume | QA; TR-S07-001 1.4 |
| 1.8 | 2026-10-30 | Thiết kế lại UI Nhân sự + Công cụ HR thân thiện; nhãn field đa ngôn ngữ; tự seed field config; employee 1.0.6; QA PASS lại desktop + minhvv | QA; TR-S07-001 1.5 |
| 1.9 | 2026-10-31 | Màn phân công + hợp đồng; 4 role PASS; BUG-174 role defaults + V7.0.5 + seeder; employee 1.0.8; 302 test Java | QA; TR-S07-001 1.6 |
| 1.10 | 2026-10-31 | Org UI copy Core + bỏ Core org UI; 59 ảnh 4 role; onboarding in-app notification; BUG-175; employee 1.1.3/org 1.1.3/notification 1.0.9 | QA; TR-S07-001 1.7 |
| 1.11 | 2026-10-31 | Catalog loại tài liệu 9 mẫu; bảng diff đề xuất; tenant defaults 8 phòng + luồng duyệt 2 bước; catalog 1.0.9 | QA; TR-S07-001 1.8 |
| 1.12 | 2026-10-31 | Cấu hình duyệt card; paging nhân viên/onboarding/hợp đồng; bảng danh mục text; employee 1.1.3; QA chụp lại 59 ảnh | QA; TR-S07-001 1.9 |
| 1.13 | 2026-10-31 | Cấu hình duyệt thành sơ đồ node; panel chi tiết theo node; phạm vi chọn từ danh sách; employee 1.1.8; QA chụp desktop/mobile/minhvv | QA; TR-S07-001 1.10 |
| 1.14 | 2026-10-31 | BUG-176: sửa đảo/đổi bước cấu hình duyệt; node sort theo step_no, chọn theo object, backend two-phase swap step; employee 1.1.11; regression PASS | QA; TR-S07-001 1.11 |
| 1.15 | 2026-10-31 | Role chip header dùng RBAC role; notification drawer mở link onboarding clickable; notification 1.0.10; 61 ảnh | QA; TR-S07-001 1.12 |
| 1.16 | 2026-10-31 | Unsaved guard switch tenant khi drawer mở; employee 1.1.12; 62 ảnh | QA; TR-S07-001 1.13 |
| 1.17 | 2026-10-31 | Branch data scope manager/viewer; DSAR export/erase; drop-legacy QA dev; employee 1.1.17; 64 ảnh | QA; TR-S07-001 1.14 |
| 1.18 | 2026-10-31 | ClamAV INSTREAM scan + profile `av`; image local socket nên chưa e2e; employee 1.1.18 | QA; TR-S07-001 1.15 |
| 1.19 | 2026-11-01 | **Deferred closure hoàn tất** theo chỉ đạo chủ dự án: cutover C6 (V7.0.7 drop legacy + permission cũ, Core projection-only, xóa modules/organization; backend 254/254 PASS), signed URL HMAC + 3 endpoint (TASK-433 0.3, plugin 18/18), catalog 1.0.10 manifest sync validate PASS; FEAT-36…38 + TASK-426…438 Done (QA); TR 1.17; REV-S07-001 1.0 Draft ready | Developer/PM; chỉ đạo chủ dự án |
| 1.20 | 2026-11-01 | **Runtime E2E PASS**: commit `52fee05c`; backend mới deploy (V7.0.7 apply thật); employee **1.1.22** + catalog **1.0.10** upgrade tenant QA ACTIVE; **signed URL E2E 9/9** qua gateway signed passthrough; browser 0 console error; TR **1.18**; REV **1.1** | QA/QC + Developer; app thật |
