# [ANL-S07-003] Tách plugin Chi nhánh/Phòng ban khỏi Core

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S07-003 / Phân tích / Sprint 07 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-30 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | Yêu cầu trực tiếp 2026-10-30 (“thêm plugin chi nhánh/phòng ban tách ra khỏi core cho độc lập”), [RAW-S07-001](../01_raw_notes/01_RAW-S07-001_employee_plugin_requirements.md), [ANL-S07-001](01_ANL-S07-001_employee_identity_and_data_model.md), [ANL-S07-002](02_ANL-S07-002_admin_management_and_self_service.md) |
| Đọc trước / đọc tiếp | ANL-S07-001/002 / [CONF-S07-001](../04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md) |

## 1. Mục đích

Yêu cầu mới: **tách chi nhánh (branch) và phòng ban (department) ra khỏi Core thành plugin độc lập**. Tài liệu này phân tích:

1. Hiện Core đang sở hữu gì và ai đang phụ thuộc.
2. Tách ở mức nào: chỉ master data hay cả membership/assignment.
3. Data scope của Core sẽ lấy dữ liệu tổ chức từ đâu nếu không còn query trực tiếp.
4. Migration dữ liệu hiện hữu, quyền, API/UI, Entity Registry.
5. Quan hệ với plugin employee và các câu hỏi cần chốt.

> **Quyết định đã chốt (Q39–Q46, Q53–Q54):** một plugin `organization` sở hữu **branch/department master + access membership** cho mọi tenant member; **employee plugin sở hữu HR assignment** (chức danh/hiệu lực) cho employee; Core đọc **projection merge**; migration **big-bang**; **đổi namespace API/quyền/entity**; organization **always-on**.

> Đây là phân tích, chưa phải thiết kế cuối. Việc tách Core là thay đổi kiến trúc nền, cần chốt Q39–Q46 trước khi viết SOL/ADR.

## 2. Hiện trạng và điểm phụ thuộc

### 2.1. Core đang sở hữu gì?

| Thành phần | Vị trí | Vai trò |
| :--- | :--- | :--- |
| `branches` | `modules/organization/model/Branch.java`, migration V1/V2 | Chi nhánh: mã, tên, phone, address, default, status |
| `departments` | `modules/organization/model/Department.java` | Phòng ban: branch, parent, code, name, `manager_user_id`, status |
| `user_department_memberships` | `.../UserDepartmentMembership.java` | User ↔ branch/department; `direct_manager_user_id`, `title`, `is_primary`, `joined_at` |
| `user_branch_assignments` | `.../UserBranchAssignment.java` | User ↔ branch; `is_primary`, `can_manage` |
| API | `/api/v1/organization/branches`, `/departments`, `/memberships`, `/branch-assignments` | CRUD + phân quyền |
| Provisioning | `OrganizationProvisioningService` | Tạo `HQ` + `GENERAL` + membership/assignment cho tenant mới |
| Permissions | V2.0.0 migration | `core:organization:manage`, `core:branch:*`, `core:department:*`, `core:membership:*`, `core:branch-assignment:*` |
| Entity Registry | `@RegisterEntity(pluginId = "core-organization")` | 4 entity công khai |
| Frontend | `/settings/organization`, `/settings/members`, `/settings/branch-assignments` | Màn hình quản trị Core |

### 2.2. Ai đang phụ thuộc?

| Consumer | Cách phụ thuộc | Mức độ |
| :--- | :--- | :--- |
| **`SecurityContextService` (Core)** | Query trực tiếp `user_department_memberships`, `user_branch_assignments`, `departments` để tính `primaryBranchId`, `memberBranchIds`, `managedBranchIds`, `departmentIds`, `departmentAndChildIds`, `subordinateUserIds` | **Critical** — data scope/RLS không chạy nếu thiếu |
| **Tenant onboarding** | `OrganizationProvisioningService` tạo default branch/department/membership | **Critical** |
| **RBAC/data policy** | Data scope `BRANCH`, `OWN_AND_SUBORDINATES` dựa trên context trên | **Critical** |
| **Plugin employee (S07)** | Q5 hiện chốt: employee nhập phân công, đồng bộ primary membership xuống Core organization | **High** — cần đổi nguồn sự thật |
| **Catalog** | Seed “Phòng ban” một chiều từ cây tổ chức | Medium — cần cập nhật nguồn seed |
| **Frontend Core** | Route/menu/quyền `core:organization:manage` | High — cần chuyển UI |
| **Entity Registry consumers** | Tên entity `Branch`, `Department`, `UserDepartmentMembership`, `UserBranchAssignment` | Medium — giữ tên để không phá consumer |
| **Tests/QA** | Data scope, membership, branch assignment, onboarding | High — cần regression toàn bộ |

**Kết luận:** tách `branches`/`departments` không khó; tách **membership/assignment** mới là phần nặng vì Core data scope đang query trực tiếp. Nếu chỉ tách master data, Core vẫn giữ membership và ít rủi ro hơn, nhưng chưa “độc lập” hoàn toàn.

## 3. Phương án tách

### 3.1. Phạm vi tách

| Phương án | Nội dung | Ưu | Nhược | Đánh giá |
| :--- | :--- | :--- | :--- | :--- |
| **A. Tách toàn bộ** | Plugin `organization` sở hữu branch, department, membership, branch assignment; Core chỉ giữ projection data scope | Độc lập thật; plugin có thể nâng cấp/migrate riêng | Core phải có projection; migration lớn; rủi ro data scope | Đã chọn A cho master data; **Q53/Q54 chuyển assignment sang employee** |
| **B. Tách master data** | Plugin sở hữu branch/department; Core vẫn giữ membership/branch assignment (tham chiếu ID) | Ít rủi ro data scope; migration nhỏ | Core vẫn sở hữu nghiệp vụ tổ chức; chưa độc lập hoàn toàn | Phương án an toàn nếu ưu tiên RBAC |
| **C. Tách branch và department thành 2 plugin** | `branch` plugin + `department` plugin; department phụ thuộc branch | Có thể cài riêng | Hai plugin phụ thuộc chặt; migration/version phức tạp; ít giá trị | Không khuyến nghị |
| **D. Core gọi plugin mỗi request** | Core lấy org scope qua API plugin khi build security context | Không cần projection | Core phụ thuộc runtime plugin; chậm; plugin chết ⇒ toàn hệ thống mất scope | **Loại** |

**Đã chốt (Q39/Q40/Q53/Q54):** plugin `organization` sở hữu **branch/department master + access membership**; **employee plugin sở hữu HR assignment**; Core đọc projection merge. Mô hình hai lớp giúp Core data scope không phụ thuộc hoàn toàn vào employee plugin; non-employee vẫn có access membership trong organization.

### 3.2. Nguồn sự thật phân công sau khi tách

Nếu plugin `organization` sở hữu membership/assignment, câu trả lời Q5 cũ (“employee nhập phân công, đồng bộ Core”) **không còn đúng**. Cần chốt lại:

| Phương án | Nguồn sự thật | Hệ quả |
| :--- | :--- | :--- |
| **A. Organization plugin** | Plugin giữ branch/department/membership/manager; employee plugin tham chiếu assignment | Một nguồn; employee plugin nhẹ hơn; cần API liên kết employee ↔ assignment |
| **B. Employee plugin** | Employee plugin giữ phân công HR; organization plugin giữ đơn vị; đồng bộ membership | Hai nguồn gần nhau; dễ drift; không khuyến nghị sau khi tách |
| **C. Cả hai** | Mỗi bên giữ bản riêng | Loại |

**Đã chốt Q41 = A + Q53 = A + Q54 = A:** mô hình **hai lớp**. Organization plugin giữ **access membership** (user→branch/department/manager) cho mọi tenant member; employee plugin giữ **HR assignment** (employee→branch/department/title/manager/hiệu lực). Core projection merge cả hai; non-employee chỉ có access membership. Không dual-write; employee HR thay đổi thì gọi API organization để cập nhật access membership.

### 3.3. Core data scope sau khi tách

Core vẫn cần trả lời: user thuộc branch nào, quản lý branch nào, department nào, cấp dưới là ai. Ba cách:

| Phương án | Mô tả | Đánh giá |
| :--- | :--- | :--- |
| **A. Projection table trong Core** | Bảng `core_user_scope_projection` (tenant, user, primary_branch, member_branches, managed_branches, primary_department, department_ids, manager_user_id) do organization plugin cập nhật access + employee plugin cập nhật HR; Core đọc projection | **Đã chốt Q42 = A** — Core không query bảng plugin; merge hai nguồn; cần đồng bộ/rebuild |
| **B. Giữ membership trong Core** | Core vẫn sở hữu membership/assignment; plugin chỉ sở hữu branch/department master | An toàn; nhưng không tách triệt để |
| **C. Core gọi plugin runtime** | Mỗi request gọi plugin | Loại — coupling/perf |
| **D. JWT claim** | Nhét scope vào token | Token phình, stale, khó thu hồi; loại |

**Đã chốt Q42 = A.** Projection là **read model nội bộ Core**, không phải nguồn sự thật; được rebuild từ **organization access membership + employee HR assignment**. Nếu projection thiếu/stale, fail-safe: từ chối thao tác nhạy cảm hoặc refresh, không mở rộng quyền. Cần job rebuild và cảnh báo; hai plugin đều always-on.

### 3.4. Migration dữ liệu

| Phương án | Mô tả | Đánh giá |
| :--- | :--- | :--- |
| **A. Big-bang** | Copy toàn bộ branch/department/membership sang plugin schema, đổi reads, drop Core tables trong một release | Nhanh nhưng rủi ro cao; khó rollback |
| **A. Big-bang** | Copy toàn bộ branch/department/access membership/HR assignment sang plugin schema, đổi reads, drop Core tables trong một release | **Đã chốt Q43 = A** — nhanh nhưng rủi ro cao; cần freeze/backup/rollback drill |
| **B. Strangler/dual-write** | Tạo bảng plugin; dual-write/backfill; verify; chuyển reads; giữ Core tables read-only; drop sau | An toàn hơn; không chọn |
| **C. Giữ Core tables vĩnh viễn** | Không drop; plugin chỉ là UI/API facade | Không độc lập thật |

**Đã chốt A (big-bang)**. Vì Core data scope là critical, bắt buộc: freeze cửa sổ cutover, backup toàn bộ, count/checksum trước/sau, rollback script, QA regression data scope; không drop Core tables cho đến khi verify xong.

### 3.5. API, UI, quyền, Entity Registry

| Chủ đề | Phương án | Khuyến nghị |
| :--- | :--- | :--- |
| API path | Đổi namespace hoàn toàn sang `/api/v1/org/*` (organization) và `/api/v1/employee/*` | **Đã chốt Q45 = B** — frontend/consumer phải cập nhật; không giữ path cũ |
| UI | Màn hình WC của plugin; route mới, bỏ/redirect route cũ | **Plugin WC**; route mới, cập nhật menu/link |
| Permission | Đổi `core:branch:*` → `organization:branch:*`; không alias runtime, nhưng migration grant từ quyền cũ | **Đã chốt Q45 = B** — inventory role + migration grant |
| Entity Registry | Đổi tên entity mới theo plugin | **Đã chốt Q46 = B** — cập nhật consumer/registry; không giữ alias |
| Provisioning | Chuyển `OrganizationProvisioningService` sang plugin seeder; Core onboarding gọi event/API | **Plugin seeder**; tenant mới vẫn có HQ/GENERAL |
| Always-on | Organization plugin là nền cho employee/RBAC | **Đã chốt Q44 = A** |
| Uninstall | Không cho gỡ; nếu có sự cố, projection giữ nguyên | Không gỡ; backup/rollback |

## 4. Quan hệ với plugin employee

Nếu organization plugin giữ access membership và employee plugin giữ HR assignment:

1. Employee plugin **không** tự tạo branch/department; chỉ tham chiếu `branch_id`, `department_id`.
2. Organization plugin sở hữu **access membership** cho mọi tenant member (employee + non-employee): user thuộc branch/department nào, quản lý ai, primary.
3. Employee plugin sở hữu **HR assignment** của employee: chức danh, phân công công việc, hiệu lực; có thể nhiều assignment.
4. Khi HR assignment thay đổi, employee plugin gọi API organization để cập nhật access membership (một chiều, có audit); không dual-write.
5. Core projection merge access membership + HR assignment; access membership là nguồn chính cho branch/department/manager data scope.
6. Non-employee chỉ có access membership trong organization; không cần hồ sơ nhân viên.
7. Cả hai plugin always-on; nếu một plugin lỗi, projection vẫn có thể phục vụ phần còn lại và cần cảnh báo/rebuild.

## 5. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
| :--- | :--- | :--- |
| Core data scope sai/stale sau khi tách | **Critical** | Projection + rebuild + verify; test toàn bộ data scope; fail-safe |
| Mất quyền của role hiện hữu khi đổi permission namespace | **High** | Alias + migration grant; inventory role; test |
| Migration mất/trùng branch/department/membership | **High** | Backup, count/checksum, idempotent backfill, rollback |
| Tenant onboarding thiếu HQ/GENERAL | **High** | Plugin seeder idempotent; test tenant mới |
| Frontend route/menu gãy | Medium | Giữ route/API path; WC screen; redirect |
| Entity Registry consumer gãy | Medium | Giữ entity name; alias pluginId |
| Organization plugin không always-on | **High** | Q44; chặn cấu hình sai |
| Employee plugin và organization plugin tranh nguồn phân công | **High** | Q41; một nguồn; soft ref; không dual-write |
| Q31 all-at-once làm migration/QA quá tải | **High** | Migration nội bộ theo phase kỹ thuật; baseline/rollback; QA regression |
| **Core data scope dựa trên projection merge** | **Critical** | Organization access là nguồn chính; employee sync một chiều; rebuild/reconciliation; fail-safe; test drift |
| **Big-bang migration** | **High** | Freeze/backup/rollback drill; count/checksum; QA regression |
| **Đổi namespace API/quyền/entity** | **High** | Inventory consumer; migration grant; frontend/plugin test; không alias runtime |

## 6. Câu hỏi cần chốt (Q39–Q46)

| # | Câu hỏi | Chốt |
| :--- | :--- | :--- |
| Q39 | Một plugin `organization` hay tách `branch` + `department`? | **A — Một plugin organization** |
| Q40 | Tách master data hay toàn bộ membership/assignment? | **A — Toàn bộ** (được Q53/Q54 điều chỉnh: assignment thuộc employee) |
| Q41 | Nguồn sự thật phân công sau khi tách? | **A — Hai lớp (organization access + employee HR)** |
| Q42 | Core data scope lấy từ đâu? | **A — Projection table merge** |
| Q43 | Migration big-bang hay strangler? | **A — Big-bang** (rủi ro chấp nhận) |
| Q44 | Organization plugin always-on? | **A — Always-on** |
| Q45 | API/UI/quyền giữ tương thích hay đổi namespace? | **B — Đổi namespace hoàn toàn** |
| Q46 | Entity Registry giữ tên hay đổi? | **B — Đổi tên entity mới** |
| Q53 | Hai lớp phân công hay employee duy nhất? | **A — Hai lớp** |
| Q54 | Non-employee lấy scope từ đâu? | **A — Organization access membership** |

**Hệ quả kiến trúc:** organization plugin = branch/department master + access membership cho mọi tenant member; employee plugin = HR assignment; Core projection merge. Non-employee không cần hồ sơ nhân viên; Core data scope không phụ thuộc hoàn toàn vào employee.

Chi tiết phương án tại [CONF-S07-001 §4.8](../04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md).

## 7. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Phân tích hiện trạng/coupling, 4 phương án tách, projection data scope, migration, quan hệ employee, Q39–Q46 | BA Agent; yêu cầu trực tiếp chủ dự án |
| 0.2 | 2026-10-30 | Ghi nhận Q39–Q46 + Q53/Q54: một plugin organization giữ master data; employee giữ toàn bộ assignment; projection; big-bang; đổi namespace/entity | BA Agent; hội thoại interactive |
| 0.3 | 2026-10-30 | Đổi sang **2 lớp**: organization access membership + employee HR assignment; big-bang; full namespace/entity; Q55 offboarding guard | BA Agent; hội thoại interactive |
