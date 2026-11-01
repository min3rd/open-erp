# [DES-UI-S07-001] UI/UX: organization, employee & tenant switcher

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-UI-S07-001 / Thiết kế UI / Sprint 07 |
| Trạng thái / phiên bản / cập nhật | Approved / 1.0 / 2026-10-30 |
| Owner / reviewer | Architect Agent / Chủ dự án + BA |
| Đầu vào | [CONF-S07-001 1.0](../../04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md), [DES-API-S07-001](../api/01_DES-API-S07-001_employee_organization_auth_api.md), [ui_ux_standards.md](../../../../../.agents/rules/ui_ux_standards.md) |
| Đọc trước / đọc tiếp | DES-API-S07-001 / Item 07, QA 08 |

## 1. Nguyên tắc

- **High density**: `text-xs`/`text-sm`, `p-1`/`p-2`, `gap-1`, bảng nhiều cột.
- **Sharp**: `rounded-none`/`rounded-sm`, border mảnh; theme mặc định vuông vắn.
- **Anti-modal**: nested route + Drawer phải (stacked) + split-view; không modal cho form/danh sách.
- **Component-first**: component dùng chung đặt `src/frontend/shared/` trước; Web/Mobile dùng lại.
- **i18n 100%**: key namespace `org.*`, `employee.*`, `auth.tenant.*`; không hardcode.
- **Enum dùng chung**: `ColorVariant`, `SizeVariant`, `ShapeVariant`; enum nghiệp vụ mới trong `@shared/enums`.

## 2. Route map

### 2.0. Menu theo vai trò (U1)

| Vai trò | Menu chính |
| :--- | :--- |
| **HR Admin / Tenant Admin** | **Nhân sự**: Nhân viên, Duyệt đề xuất, Danh bạ, Org chart, Cấu hình. **Cơ cấu tổ chức**: Chi nhánh, Phòng ban, Thành viên, Branch access |
| **Branch Manager / Direct Manager** | **Nhân sự**: Nhân viên (read), Org chart, Danh bạ |
| **Employee** | **Hồ sơ của tôi**, Danh bạ, Org chart |

- Không hiển thị mục quản trị cho employee.
- Tenant switcher nằm trong user menu (U5), không phải menu chính.

### 2.1. Organization plugin

| Route | Màn hình | Desktop | Mobile |
| :--- | :--- | :---: | :---: |
| `/apps/organization/branches` | Danh sách/CRUD chi nhánh | ✅ | ❌ |
| `/apps/organization/departments` | Cây/danh sách phòng ban | ✅ | ❌ |
| `/apps/organization/members` | Access membership | ✅ | ❌ |
| `/apps/organization/branch-access` | Branch access | ✅ | ❌ |
| `/apps/organization/org-chart` | Org chart read-only | ✅ | ✅ |

### 2.2. Employee plugin

| Route | Màn hình | Desktop | Mobile |
| :--- | :--- | :---: | :---: |
| `/apps/employee/employees` | Danh sách nhân viên | ✅ | ❌ |
| `/apps/employee/employees/:id` | Chi tiết (tab) | ✅ | ❌ |
| `/apps/employee/approvals` | Hộp thư duyệt | ✅ | ❌ |
| `/apps/employee/me` | Hồ sơ của tôi | ✅ | ✅ |
| `/apps/employee/me/documents` | Tài liệu của tôi | ✅ | ✅ |
| `/apps/employee/me/requests` | Đề xuất của tôi | ✅ | ✅ |
| `/apps/employee/directory` | Danh bạ | ✅ | ✅ |
| `/apps/employee/org-chart` | Org chart | ✅ | ✅ |
| `/apps/employee/settings/fields` | Allowlist self-service | ✅ | ❌ |
| `/apps/employee/settings/approvals` | Chuỗi duyệt | ✅ | ❌ |
| `/apps/employee/settings/documents` | Loại tài liệu/retention | ✅ | ❌ |
| `/apps/employee/settings/privacy` | Consent/DSAR/breach | ✅ | ❌ |
| `/apps/employee/onboarding` | Link self-onboarding | ✅ | ❌ |
| `/apps/employee/campaigns` | Chiến dịch cập nhật | ✅ | ❌ |

## 3. HR Admin — danh sách & chi tiết

### 3.1. Danh sách

- Bảng cột: mã, họ tên, chức danh, phòng ban, chi nhánh, trạng thái, ngày vào làm, quản lý, sync scope.
- Filter: `q`, branch, department, status, employee_type; page size 20/50/100; sort server-side.
- Row actions: mở chi tiết, sửa, liên kết tài khoản, nghỉ việc; không inline quá nhiều.
- Empty state: “Chưa có nhân viên” + nút tạo; error state có retry.
- Loading: skeleton vùng bảng; không block toàn trang.

### 3.2. Chi tiết (tab)

| Tab | Nội dung |
| :--- | :--- |
| Tổng quan | Ảnh, mã, tên, trạng thái, assignment hiện tại, liên hệ nhanh, sync status |
| Công việc | Assignments (effective-dated), contract, manager, branch/department |
| Cá nhân | Định danh, giấy tờ, thuế/BHXH (mask theo quyền) |
| Liên hệ | Phone/email/address/emergency |
| Học vấn | Trình độ/trường/chuyên ngành |
| Tài liệu | Danh sách version, scan status, download |
| Đề xuất | Change requests của nhân viên |
| Lịch sử | Job history/status/audit |

- Tab giữ trạng thái qua query `?tab=`.
- Sửa: Drawer phải, section; mở drawer lồng cho assignment/contract/document; không modal.
- Sensitive field: mask `••••`; nút “Hiện” cần quyền; audit view.

### 3.3. Tạo/sửa

- Drawer 2 bước: “Thông tin cơ bản” → “Công việc” (có thể lưu nháp).
- Mã tự động `NV00001`; cho nhập tay; validate unique/tenant.
- Liên kết tài khoản: search tenant member; nếu chưa có → “Mời tài khoản”.
- Assignment: branch/department cascading; manager search; effective dates; cảnh báo overlap.

### 3.4. Nghỉ việc

- Drawer riêng: ngày/lý do, cảnh báo cấp dưới, last owner/admin/platform role.
- Checkbox “Khóa tài khoản + gỡ tenant membership” mặc định theo Q11; xác nhận lần 2.
- Không xóa hồ sơ; hiển thị retention.

## 4. Self-service

### 4.1. `/apps/employee/me`

- Header: ảnh, tên, mã, chức danh, phòng ban, trạng thái.
- Banner: đề xuất đang chờ, campaign deadline, sync status.
- Sections: Tổng quan, Liên hệ, Cá nhân (read-only/mask), Học vấn, Tài liệu, Đề xuất.
- Edit: Drawer; trường “áp dụng ngay” vs “gửi duyệt” có badge; lưu xong refresh.
- Pending request: hiển thị diff cũ/mới, trạng thái, nút rút (nếu chưa duyệt cấp nào).
- Nếu không có hồ sơ: empty state “Bạn chưa có hồ sơ nhân viên trong tenant này”.

### 4.2. Tài liệu

- Danh sách tài liệu của mình; upload (nếu Q37 bật) với loại/kích thước; scan status; download signed URL.
- Không hiển thị tài liệu người khác.

### 4.3. Mobile

- Chỉ self-service + directory/org chart read-only.
- Touch ≥40px; safe-area; không tràn ngang; drawer full-height.
- Tenant switcher trong header/drawer (shared component).
- 0 console error; test 390×844.

## 5. Approval inbox (U6 — split-view)

- `/apps/employee/approvals`: **split-view**.
  - Cột trái (320–380px): danh sách request (employee, field group, submitted, current step, SLA); search/filter status.
  - Cột phải: diff 2 cột (cũ/mới), step timeline, comment, approve/reject.
- Chọn request không reload trang; URL giữ `?request=`.
- Reject bắt buộc lý do; approve cấp cuối áp dụng.
- Conflict: banner đỏ, yêu cầu nhân viên gửi lại.
- Mobile: list + route chi tiết (split-view không khả thi); HR duyệt mobile chưa làm v1.
- Empty: “Không có đề xuất chờ duyệt”.

## 5A. Org chart (U7 — ma trận đầy đủ)

- `/apps/employee/org-chart` và `/apps/organization/org-chart`.
- Hiển thị:
  - Cây phòng ban (branch → department → sub-department).
  - Node nhân viên theo department; primary manager là cạnh chính.
  - **Dotted-line/matrix** từ `employee_reporting_relationship` (PRIMARY/DOTTED/MATRIX).
  - Legend màu/đường; filter branch/department/relationship type.
- Tương tác: zoom/pan, drill-down, click node mở Drawer tóm tắt (không modal), “Xem hồ sơ” nếu có quyền.
- Read-only với employee/manager; HR có thể mở hồ sơ.
- Hiệu năng: lazy load theo department/depth; cache; giới hạn node ban đầu; không tải toàn bộ tenant.
- Mobile: simplified tree (department + primary manager), ẩn matrix phức tạp; touch ≥40px.

## 6. Tenant switcher (U5 — trong user menu)

### 6.1. Vị trí & component

- Employee plugin đăng ký contribution vào slot **`core.layout.user-menu.items`**; Core `UserMenuComponent` render.
- Dùng shared `TenantSwitcherComponent` (Web/Mobile).
- User menu hiển thị item “Chuyển tenant” + tenant hiện tại; click mở dropdown/drawer:
  - Search nếu > 8 tenant.
  - Tenant hiện tại highlight; role/status; tenant gần nhất lên đầu.
  - Tenant suspended/locked disabled + lý do.
- Chỉ 1 tenant → ẩn item switcher; user menu vẫn hiển thị tenant hiện tại.
- Fallback host cũ: compact switcher trong `core.layout.header.actions`.

### 6.2. Hành vi

1. Click → mở dropdown.
2. Chọn tenant → guard unsaved (confirm).
3. Gọi `context.switchTenant(tenantId)`; loading; disable.
4. Host replace session/clear cache/reload; component nhận context mới.
5. Lỗi: giữ tenant cũ; toast theo `code`; retry.

### 6.3. A11y

- `aria-expanded`, keyboard arrow/enter/esc, focus visible; touch target ≥40px.

## 7. Component & i18n

### 7.1. Shared components mới

| Component | Dùng | Ghi chú |
| :--- | :--- | :--- |
| `TenantSwitcherComponent` | Web/Mobile user menu | Input `tenants`, `currentTenantId`; output `switchTenant`; item trong `core.layout.user-menu.items` |
| `OrgChartMatrixComponent` | Organization/Employee | Cây phòng ban + primary/dotted/matrix, lazy depth, zoom/drill |
| `EmployeeStatusBadge` | Web/Mobile | Map enum → ColorVariant |
| `ChangeRequestDiffComponent` | Web/Mobile | Diff 2 cột, mask sensitive |
| `DocumentCardGridComponent` | Web/Mobile | Card theo loại tài liệu; upload/download/scan status |

### 7.2. Enums mới (shared)

`EmployeeStatus`, `EmployeeType`, `EmploymentEventType`, `ChangeRequestStatus`, `ChangeRequestStepStatus`, `ApprovalApproverType`, `DocumentType`, `DocumentScanStatus`, `DocumentUploadSource`, `ScopeSyncStatus`, `TenantStatus`, `PrivacyRequestType`, `PrivacyRequestStatus`.

### 7.3. i18n keys

- `org.branch.*`, `org.department.*`, `org.membership.*`, `org.chart.*`
- `employee.profile.*`, `employee.assignment.*`, `employee.contract.*`, `employee.document.*`, `employee.request.*`, `employee.approval.*`, `employee.config.*`, `employee.onboarding.*`, `employee.campaign.*`, `employee.privacy.*`, `employee.directory.*`
- `auth.tenant.switch.*`, `auth.tenant.error.*`
- 13 locale parity; QA `npm run i18n:check:strict`.

## 8. States & errors

| State | UI |
| :--- | :--- |
| Loading | Skeleton theo vùng; không block toàn trang |
| Empty | Empty state + CTA phù hợp quyền |
| Error | Inline error + retry; giữ dữ liệu cũ nếu có |
| Conflict | Banner + diff; yêu cầu gửi lại |
| Scope sync pending | Badge “Chưa đồng bộ quyền” + retry (HR) |
| Sensitive masked | `••••` + nút hiện nếu có quyền |
| Tenant switch error | Giữ tenant cũ; toast theo code |

## 9. Traceability

AC-01…AC-37; UI chính: AC-06 self, AC-07/08 approval, AC-10 mask, AC-13 list, AC-18 import/export, AC-19 mobile, AC-23 org chart, AC-24 docs, AC-25/26 config, AC-27/28 onboarding/campaign, AC-29 privacy, AC-30 organization, AC-33/34/35 switcher.

## 10. UI decision log

| # | Quyết định | Nguồn |
| :--- | :--- | :--- |
| U1 | Menu tách theo vai trò; HR admin có nhóm Nhân sự + Cơ cấu tổ chức; employee chỉ hồ sơ/danh bạ/org chart | Interactive 2026-10-30 |
| U2 | Danh sách nhân viên full width + route chi tiết tab | Interactive |
| U3 | Tạo/sửa nhân viên bằng drawer nhiều bước | Interactive |
| U4 | Self-service tab theo nhóm | Interactive |
| U5 | Tenant switcher trong user menu (`core.layout.user-menu.items`) | Interactive |
| U6 | Approval inbox split-view list + detail | Interactive |
| U7 | Org chart ma trận đầy đủ (primary/dotted/matrix) | Interactive |
| U8 | Tài liệu dạng card grid | Interactive |

## 11. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Route map, admin/self UI, approval, switcher, shared components, states | Architect; CONF 1.0 |
| 0.2 | 2026-10-30 | U1–U8: menu theo vai trò, full-page tabs, drawer nhiều bước, tab self, switcher trong user menu, split-view approval, org chart matrix, document card grid | Architect; UI interactive 2026-10-30 |
| 1.0 | 2026-10-30 | Approved cùng Design review | Chủ dự án; design review 2026-10-30 |
