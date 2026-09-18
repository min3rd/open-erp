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
