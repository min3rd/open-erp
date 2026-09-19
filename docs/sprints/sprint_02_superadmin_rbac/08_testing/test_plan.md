# [TEST-02] Kế Hoạch Kiểm Thử Chất Lượng: Sprint 02 - Super Admin & Phân Quyền Toàn Diện

- **Mã Kế Hoạch**: TEST-02
- **Phụ Trách**: QA/QC Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Chính Sách Bắt Buộc**:
  - **Backend**: Kiểm thử tự động trên PostgreSQL & Redis thật (**CẤM SỬ DỤNG H2**).
  - **Frontend**: **TUYỆT ĐỐI KHÔNG VIẾT UNIT TEST**. Bắt buộc kiểm thử thủ công trên trình duyệt hai chế độ (Dual-Mode Browser Testing).
- **Ngày Lập Kế Hoạch**: 2026-09-18

---

## 1. Mục Tiêu & Phạm Vi Kiểm Thử

Đảm bảo 100% các tính năng của Sprint 02 hoạt động chuẩn xác, tuyệt đối không có lỗi bảo mật rò rỉ dữ liệu chéo giữa các Tenant (Cross-Tenant Leakage) hoặc giữa các Phạm vi dữ liệu (Cross-Scope Leakage).

---

## 2. Chiến Lược Kiểm Thử Backend Tự Động (Quarkus Java)

### 2.1. Ma Trận Dữ Liệu Thử Nghiệm Bắt Buộc (Test Data Fixtures)
> **Môi trường kiểm thử**: Chạy trên CSDL `openerp_test` (không dùng chung `openerp_dev`) với migration Flyway V2.x; dữ liệu fixture sử dụng bảng `core_sample_records` làm thực thể nghiệp vụ chuẩn để kiểm chứng Data Permission Engine.

Để kiểm tra phân quyền dữ liệu toàn diện, môi trường kiểm thử thiết lập sẵn một mô hình doanh nghiệp giả lập:
1. **Tenant 1 (Công ty Alpha)**:
   - **Chi nhánh Hà Nội (BR-HN)**:
     - *Phòng Kinh Doanh Dự Án (KD-B2B)*:
       - User 1: Giám đốc kinh doanh (Role: `GENERAL_MANAGER`, Scope: `ALL`).
       - User 2: Trưởng nhóm B2B (Role: `SALES_LEAD`, Scope: `OWN_AND_SUBORDINATES`).
       - User 3: Nhân viên B2B 1 (Role: `STAFF`, Scope: `OWN_ONLY`, Quản lý trực tiếp: User 2).
       - User 4: Nhân viên B2B 2 (Role: `STAFF`, Scope: `OWN_ONLY`, Quản lý trực tiếp: User 2).
     - *Phòng Bán Lẻ (KD-RETAIL)*:
       - User 5: Nhân viên bán lẻ (Role: `STAFF`, Scope: `OWN_ONLY`).
     - User 8: Giám đốc vùng (Role: `REGIONAL_MANAGER`, Scope: `BRANCH`, `managed_branch_ids = [BR-HN, BR-HCM]`, `primary_branch = BR-HN`; không có membership tại BR-DN).
   - **Chi nhánh TP.HCM (BR-HCM)**:
     - User 6: Nhân viên chi nhánh HCM (Role: `STAFF`, Scope: `BRANCH`).
   - **Chi nhánh Đà Nẵng (BR-DN)**:
     - User 9: Nhân viên chi nhánh Đà Nẵng (Role: `STAFF`, Scope: `OWN_ONLY`).
2. **Tenant 2 (Công ty Beta - Đối thủ cạnh tranh)**:
   - User 7: Tenant Admin công ty Beta.

> **Ghi chú audit (BUG-72)**: Mọi thay đổi RBAC/Cơ cấu tổ chức trong fixtures (tạo/sửa/xóa vai trò, cập nhật quyền chức năng, cập nhật ma trận data policy, gán/gỡ vai trò người dùng, thao tác chi nhánh/phòng ban/membership/branch-assignment) bắt buộc sinh bản ghi `platform_audit_logs` với `scope = 'TENANT'` + `tenant_id` tương ứng; các hành động Platform của Super Admin sinh `scope = 'PLATFORM'`.

---

### 2.2. Danh Sách Ca Kiểm Thử Tự Động Bắt Buộc (Automated Test Cases)

| Mã TC | Phân Hệ | Mô Tả Kịch Bản Kiểm Thử | Kỳ Vọng Kết Quả |
| :--- | :--- | :--- | :--- |
| **TC-BE-01** | Super Admin | Kiểm tra truy cập API `/api/v1/platform/*` với token thường (không có `platform_role`). | Trả về `403 Forbidden` (`PLATFORM_ACCESS_DENIED`). |
| **TC-BE-02** | Super Admin | Khóa Tenant 1 qua API `POST /platform/tenants/{id}/lock`. | Trạng thái chuyển `SUSPENDED`. Mọi request từ User 1-6 đều bị chặn với mã `TENANT_SUSPENDED`. |
| **TC-BE-03** | Impersonation | Khởi tạo phiên đại diện vào Tenant 1, kiểm tra claim `impersonator_id`, TTL 1800s, không có refresh token. | Tạo token thành công, ghi log `platform_impersonation_logs`. |
| **TC-BE-04** | Impersonation | Thực hiện thao tác phá hoại (gọi API xóa Tenant) khi mang token impersonate. | Bị chặn đứng với lỗi `SUPERADMIN_IMPERSONATION_DESTRUCTIVE_ACTION_FORBIDDEN`. |
| **TC-BE-05** | Impersonation | Gọi API `POST /platform/impersonate/exit`. | Key phiên bị xóa khỏi Redis, token impersonate không còn dùng được nữa. |
| **TC-BE-06** | Cơ Cấu TC | Thử tạo vòng lặp quản lý: User 3 quản lý User 2 (trong khi User 2 đang quản lý User 3). | Bị chặn với lỗi `ORGANIZATION_REPORTING_CYCLE_DETECTED`. |
| **TC-BE-07** | Scope OWN_ONLY | User 3 (Scope `OWN_ONLY`) gọi API lấy danh sách `core_sample_records`. | Chỉ nhận được các bản ghi do chính User 3 tạo. Không thấy bản ghi của User 4. |
| **TC-BE-08** | Scope SUBORDINATES | User 2 (Scope `OWN_AND_SUBORDINATES`) lấy danh sách `core_sample_records`. | Thấy bản ghi của chính mình + của User 3 + của User 4. Không thấy bản ghi của User 5 (phòng bán lẻ). |
| **TC-BE-09** | Scope BRANCH | User 6 (Scope `BRANCH` tại HCM) lấy danh sách `core_sample_records`. | Chỉ thấy bản ghi của chi nhánh HCM. Tuyệt đối không thấy bản ghi của chi nhánh Hà Nội (User 1-5). |
| **TC-BE-10** | Cross-Tenant | User 7 (Tenant Beta) cố tình truyền ID bản ghi `core_sample_records` của Tenant Alpha để xem/sửa. | Nhận mã lỗi `404 Not Found` hoặc `403 Forbidden`. Không rò rỉ bất kỳ byte dữ liệu nào của Tenant khác. |
| **TC-BE-11** | Export Guard | User có quyền `READ` nhưng `export_scope = NONE` gọi API `POST /api/v1/core/sample-records/export`. | Nhận lỗi `403 Forbidden` (`IAM_PERMISSION_DENIED_EXPORT`). |
| **TC-BE-12** | Redis Cache | Đổi vai trò của User 3 từ `STAFF` lên `SALES_LEAD`. | Redis Pub/Sub phát tin vô hiệu hóa, request tiếp theo của User 3 tự động cập nhật quyền mới ngay lập tức. |
| **TC-BE-13** | Audit Anti-Tamper | Chạy UPDATE/DELETE trực tiếp trên platform_audit_logs. | Trigger chặn với lỗi CANNOT MODIFY OR DELETE AUDIT TRAIL LOG RECORD. |
| **TC-BE-14** | Quota | Tạo user vượt max_users. | 409 PLATFORM_TENANT_QUOTA_EXCEEDED kèm params {limit,current}. |
| **TC-BE-15** | Functional RBAC | User thiếu quyền gọi API core:role:manage. | 403 IAM_PERMISSION_DENIED_FUNCTIONAL. |
| **TC-BE-16** | Break-Glass | Super Admin force-reset/disable-2FA user với ticket+reason. | Thành công + audit log + email thông báo. |
| **TC-BE-17** | Tenant EXPIRED | trial_ends_at < NOW khi job chạy. | Tenant chuyển EXPIRED, chặn thêm mới dữ liệu. |
| **TC-BE-18** | Department Tree Cycle | Đặt phòng ban con làm cha của chính tổ tiên nó. | 400 ORGANIZATION_DEPARTMENT_CYCLE_DETECTED. |
| **TC-BE-19** | Impersonation TTL | Chờ/hết 1800s hoặc gọi refresh. | Token hết hiệu lực, refresh bị từ chối, log TIMEOUT/ENDED. |
| **TC-BE-20** | Export Scope Matrix | Với export_scope khác NONE. | File export chỉ chứa bản ghi trong phạm vi scope. |
| **TC-BE-21** | Multi-Branch Manager | User 8 (BRANCH, quản lý HN+HCM) lấy danh sách core_sample_records. | Thấy dữ liệu BR-HN và BR-HCM; KHÔNG thấy BR-DN. |
| **TC-BE-22** | Multi-Branch CREATE | User 8 tạo bản ghi không truyền branch_id. | Bản ghi gán primary_branch = BR-HN; gửi branch BR-DN → 403 IAM_PERMISSION_DENIED_DATA_SCOPE. |
| **TC-BE-23** | Branch Assignment Cache | Xóa phân công quản lý BR-HCM của User 8. | Request kế tiếp chỉ còn thấy BR-HN (cache invalidated ngay). |
| **TC-BE-24** | Audit Hash Chain | Ghi 3 log liên tiếp rồi sửa trực tiếp 1 dòng bằng SQL superuser (bypass trigger). | Job AuditChainVerifier phát hiện đứt chuỗi tại bản ghi bị sửa (FAILED). |
| **TC-BE-25** | Audit Immutable | UPDATE/DELETE platform_audit_logs bằng role ứng dụng. | Trigger/REVOKE chặn, lỗi CANNOT MODIFY OR DELETE AUDIT TRAIL LOG RECORD. |
| **TC-BE-26** | Audit Partition & Retention | Kiểm tra routing bản ghi vào partition tháng hiện tại + job tạo partition trước 3 tháng. | Bản ghi nằm đúng partition; partition tương lai tồn tại; log > 24 tháng thuộc diện archive. |
| **TC-BE-27** | Tenant-scope Audit | Tenant Admin đổi quyền vai trò. | Sinh bản ghi audit scope=TENANT, tenant_id đúng, result=SUCCESS; Platform API lọc theo scope trả đúng. |
| **TC-BE-28** | Bootstrap Super Admin | Chạy backend lần đầu khi platform_super_admins rỗng với bootstrap-emails. | Tạo/nâng cấp user, gán SUPER_ADMIN, must_change_password=true, two_factor_required=true, audit PLATFORM_ADMIN_BOOTSTRAPPED. |
| **TC-BE-29** | Self-disable Guard | SUPER_ADMIN gọi disable chính mình. | 403 PLATFORM_SELF_DISABLE_FORBIDDEN; trạng thái không đổi. |
| **TC-BE-30** | Last-admin Guard | Disable SUPER_ADMIN active cuối cùng. | 409 PLATFORM_LAST_ADMIN_PROTECTED; vẫn còn 1 admin active. |
| **TC-BE-31** | Disable Revocation | Disable một admin khác. | Session Redis bị xóa, token vào blacklist, email cảnh báo, audit PLATFORM_ADMIN_DISABLED. |
| **TC-BE-32** | Admin CLI | Chạy offline CLI bootstrap/list/disable + remote CLI. | Lệnh thực thi đúng; audit actor_type=CLI; không nhận mật khẩu qua arg. |

---

## 3. Chiến Lược Kiểm Thử Thủ Công Trình Duyệt Hai Chế Độ (Dual-Mode Browser QA)

### 3.1. Chế Độ 1: Web Desktop Testing ($\ge$ 1280px)
- **Môi trường**: Chrome / Firefox trên màn hình Full HD (1920x1080) và HD (1366x768).
- **Trọng tâm kiểm tra**:
  - Bố cục **Industrial Sharp**: Font chữ nhỏ gọn (`text-xs`/`text-sm`), góc vuông mỏng viền, không có khoảng trắng thừa lãng phí.
  - Ma trận **Split-Screen 3 Cột**: Bấm đổi vai trò ở Cột 1 $\rightarrow$ Cột 2 (Quyền) và Cột 3 (Phạm vi dữ liệu) cập nhật mượt mà không nhấp nháy toàn trang.
  - **Stacked Drawers Anti-Modal**: Mở Drawer cấp 1 $\rightarrow$ Mở tiếp Drawer cấp 2 xếp chồng $\rightarrow$ Đóng tuần tự không bị kẹt backdrop.
  - **Banner Impersonation**: Hiển thị dải băng màu vàng cố định trên cùng màn hình khi đang đóng vai trò hỗ trợ, đồng hồ đếm ngược chạy đúng từng giây.
  - **Chế độ Sáng / Tối**: Kiểm tra độ tương phản văn bản đạt chuẩn WCAG AA trên cả Light Mode và Dark Mode.
  - **Console Log**: Đảm bảo **0 lỗi đỏ (`console.error = 0`)** trong suốt quá trình thao tác.

### 3.2. Chế Độ 2: Mobile Responsive Emulation (Viewport 390x844px)
- **Môi trường**: Trình duyệt kích hoạt chế độ Mobile Device Emulation (iPhone 14 / Samsung Galaxy S20).
- **Trọng tâm kiểm tra**:
  - **Tuyệt đối không tràn ngang**: `document.documentElement.scrollWidth <= window.innerWidth` (overflow-x = 0).
  - **Kích thước vùng chạm (Touch Targets)**: Tất cả nút bấm, danh sách chọn, toggle switch có kích thước tối thiểu **$\ge$ 40px**.
  - **Safe-area padding**: Không bị che khuất bởi tai thỏ / Dynamic Island và thanh điều hướng ảo đáy màn hình.
  - **Màn hình Super Admin Khẩn Cấp**: Thao tác Khóa Tenant nhanh từ điện thoại hoạt động trơn tru kèm hộp thoại xác nhận an toàn.
  - **Console Log**: Đảm bảo **0 lỗi đỏ (`console.error = 0`)**.

---

## 4. Tiêu Chuẩn Phê Duyệt & Đóng Kế Hoạch Kiểm Thử
- Bộ automated test Backend: 100% Passed.
- Báo cáo kiểm thử trình duyệt: Chụp ảnh minh chứng đầy đủ cho Web Desktop và Mobile Phone.
- Số lượng Bug mức `Critical` và `High` còn tồn đọng: **0 bug**.

---

## 5. Kết Quả Thực Thi Dual-Mode Browser QA (2026-09-19)

> Báo cáo đầy đủ: [test_report.md](test_report.md) (TR-02). Ảnh minh chứng: `screenshots/web/` (75 ảnh) + `screenshots/mobile/` (25 ảnh). Công cụ: Playwright 1.63 (Chrome), Web 1440×900, Mobile 390×844 device emulation.

| Nhóm | Case | Kết Quả |
| :--- | :--- | :---: |
| Web Desktop | QA-W-01 → QA-W-10 | 9 PASS / 1 FAIL (QA-W-04 — BUG-75) |
| Mobile | QA-M-01 → QA-M-05 | 4 PASS / 1 FAIL (QA-M-02 — BUG-77 touch target) |

**Ánh xạ nhanh sang Test Case trong mục 2.2/3:**
- QA-W-01/W-02/W-06 ↔ TC-BE-02, TC-BE-14 (quota/lock/health); QA-W-03 ↔ TC-BE-16 (break-glass); QA-W-04 ↔ TC-BE-03/04/05/19 (impersonation/export guard).
- QA-W-05 ↔ TC-BE-24/25/27 (audit hash chain, immutable, tenant-scope); QA-W-08 ↔ TC-BE-15/27 (functional RBAC + data scope); QA-W-09 ↔ TC-BE-06/18/21/22 (cycle, multi-branch); QA-W-10 ↔ TC-BE-07/08/10/11/20 (scope isolation + export).
- Kết quả **không đạt DoD**: còn 4 bug High (BUG-74, BUG-75, BUG-76, BUG-78) + 1 Medium (BUG-77) — xem mục 4 của TR-02.

---

## 6. Re-test Sau Sửa Bug + Yêu Cầu Mới (2026-09-19)

> Báo cáo đầy đủ: [test_report.md](test_report.md) (TR-02, mục 3→9). Ảnh mới: `screenshots/web/` (+41), `screenshots/mobile/` (+11), `screenshots/web-responsive/` (+26).

### 6.1. Bổ Sung Danh Sách Ca Re-test (Regression & Tính Năng Mới)

| Mã TC | Nhóm | Mô Tả | Kỳ Vọng | Kết Quả |
| :--- | :--- | :--- | :--- | :---: |
| QA-R-74 | Regression BUG-74 | Drawer Hạn mức tenant `["core","sales"]`: switch `sales` ON; Lưu không mất plugin | Switch ON đúng; DB giữ sales | **FAIL** (API/DB đạt; thiếu switch → BUG-80) |
| QA-R-75 | Regression BUG-75 | Impersonation → `/settings/organization` + `/settings/roles`; exit | Không 401; banner đếm ngược; token cũ 401 | **PASS** |
| QA-R-76 | Regression BUG-76 | Đổi mật khẩu bắt buộc → token cũ bị chặn; re-login | Token cũ 401/đẩy login; re-login vào portal | **PASS** |
| QA-R-78 | Regression BUG-78 | Phiên quá hạn → lock OK; job sweeper đóng TIMEOUT | Lock 200; log job TIMEOUT | **FAIL một phần** (lock PASS; job crash → BUG-82) |
| QA-R-77 | Regression BUG-77 | Mobile toggle + expand ≥40px; overflow 0 | ≥40px | **PASS** |
| QA-F-19 | FEAT-19 | 2 view cây phòng ban, graph ≤5 cấp, zoom, F5 giữ view | Đạt tiêu chí FEAT-19 | **PASS** |
| QA-F-20 | FEAT-20 | Switch list plugin (core disabled ON + Tùy chọn); SUPPORT read-only; mobile read-only | Bật/tắt + Lưu đúng DB | **FAIL** (thiếu switch tùy chọn → BUG-80) |
| QA-F-79 | BUG-79 | 2 timezone (+7h) + locale vi/en; null `—` | Chênh đúng 7h; format locale | **PASS** |
| QA-RS-390 | TASK-298 | 13 màn Web @390×844: overflow, touch, console | Overflow = 0 | **FAIL 6/13** (Platform + Drawer +54px → BUG-81) |
| QA-RS-768 | TASK-298 | 13 màn Web @768×1024 | Overflow = 0 | **PASS 13/13** |
| QA-SM-W/M | Smoke | 10 màn web + 5 màn mobile (1 ảnh/màn) | Render OK, console 0 | **PASS 15/15** |

### 6.2. Trạng Thái Sau Re-test

- Đạt: BUG-75, BUG-76, BUG-77, BUG-79, FEAT-19 (Done); TASK-298 coverage hoàn tất (việc sửa responsive còn lại).
- Chưa đạt (High): **BUG-78** (mở lại một phần), **BUG-80**, **BUG-81**, **BUG-82** → Sprint 02 chưa thể đóng; xem kết luận DoD tại mục 9 TR-02.
- Console errors chức năng: **0** (1 ca âm 401 chủ đích ở QA-R-76).

---

## 7. Nghiệm Thu Cuối Sprint 02 (2026-09-19)

> Báo cáo đầy đủ: [test_report.md](test_report.md) (TR-02, mục 11). Ảnh mới: `screenshots/web/` (+29), `screenshots/mobile/` (+6), `screenshots/web-responsive/` (+26).

| Mã TC | Nhóm | Mô Tả | Kỳ Vọng | Kết Quả |
| :--- | :--- | :--- | :--- | :---: |
| QA-R2-78/82 | Regression BUG-78/82 | Job sweeper dev tick định kỳ tự đóng phiên quá hạn (TIMEOUT + audit SYSTEM); 0 lỗi JTA/IO thread; lock path giữ đúng | Log không lỗi; phiên TIMEOUT; lock 409/200 đúng | **PASS** |
| QA-R2-80 | Regression BUG-80 | Drawer tenant `["core","sales","unknown-x"]`: đủ switch đúng trạng thái, search/empty/count/scroll, Lưu 2 lần không mất plugin | Nhóm Tùy chọn không trống; DB giữ nguyên | **PASS** |
| QA-R2-81 | Regression BUG-81 | 13 màn Platform+Settings @390: overflow, drawer full-width, touch topbar; @768 giữ 0 | Overflow = 0; drawer `x=0` | **PASS** (touch shared topbar → BUG-83 Medium) |
| QA-F2-19 | FEAT-19 (nâng cấp Canvas) | App thật: DPR, zoom 25–250, pan, dblclick center, collapse, đổi view giữ trạng thái, F5 viewport; seed 400 dept đo culling/FPS | Tất cả tương tác đúng; cây lớn mượt | **PASS** |
| QA-F2-20 | FEAT-20 (nâng cấp list+search) | List dọc + search + đếm X/Y + scroll + empty + key lạ cảnh báo; mobile read-only ≥40px | Đầy đủ hành vi; mobile 44×40 | **PASS** |
| QA-RS2-390 | TASK-298 | 13 màn Web @390×844 | Overflow = 0 | **PASS 13/13 (0px)** |
| QA-RS2-768 | TASK-298 | 13 màn Web @768×1024 | Overflow = 0 | **PASS 13/13 (0px)** |
| QA-SM2-W/M | Smoke | QA-W-01→10 + QA-M-01→05 (1 ảnh/màn) | Render OK, console 0 | **PASS 15/15** |

**Kết luận**: 0 Critical / 0 High còn tồn; FEAT-19, FEAT-20, TASK-298 **Done**; BUG-83 (Medium) theo dõi thêm → **Sprint 02 đạt DoD Gate**.
