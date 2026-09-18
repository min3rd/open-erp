# [CONF-01] Biên Bản Xác Nhận Phạm Vi & Tiêu Chí Nghiệm Thu: Sprint 02

- **Mã Biên Bản**: CONF-01
- **Ngày Xác Nhận**: 2026-09-18
- **Đại Diện Khách Hàng**: Người dùng (User / Customer)
- **Đại Diện Đội Ngũ Dự Án**: BA Agent, Solution Architect, PM Agent
- **Trạng Thái**: [ ] CHỜ KHÁCH HÀNG PHÊ DUYỆT (kèm Phụ lục rà soát 2026-09-18)

---

## 1. Phạm Vi Thực Hiện Được Đề Xuất (In-Scope)

1. **FEAT-10: Quản Trị Vòng Đời Tenant & Hạn Mức Nền Tảng (Super Admin)**:
   - Danh sách và tìm kiếm Tenant toàn hệ thống (Active, Suspended, Trial, Expired).
   - Chi tiết tổ chức, gói dịch vụ, cấu hình hạn mức tài nguyên (`max_users`, `max_storage_mb`, `allowed_plugins`).
   - Thao tác khóa khẩn cấp / mở khóa Tenant (kèm lý do và ghi nhận audit log).
2. **FEAT-11: Quản Lý Người Dùng Toàn Cầu & Đăng Nhập Đại Diện (Impersonation)**:
   - Tra cứu danh sách người dùng trên toàn bộ các Tenant.
   - Khóa khẩn cấp tài khoản trên toàn nền tảng và cơ chế hỗ trợ phá kính (Break-Glass Recovery).
   - Cơ chế Super Admin Impersonation: Đăng nhập đại diện vào Tenant để hỗ trợ kỹ thuật với Token ngắn hạn (30 phút), lý do bắt buộc, thanh cảnh báo màu vàng đếm ngược trên UI, và lưu nhật ký bất biến.
3. **FEAT-12: Giám Sát Sức Khỏe Hạ Tầng & Nhật Ký Kiểm Toán Toàn Nền Tảng**:
   - Dashboard giám sát trạng thái PostgreSQL (Primary & Replicas), Redis và Kafka.
   - Thống kê tổng số Tenant, User, phiên hoạt động đồng thời.
   - Bảng nhật ký kiểm toán nền tảng (Platform Audit Trail) ghi lại mọi thao tác nhạy cảm của Super Admin.
4. **FEAT-13: Cơ Cấu Tổ Chức Doanh Nghiệp (Organizational Hierarchy)**:
   - Quản lý danh mục Chi nhánh (Branches / Locations) của Tenant.
   - Quản lý Cây Phòng Ban phân cấp (Hierarchical Department Tree cha/con).
   - Thiết lập mối quan hệ quản lý trực tiếp (Direct Manager / Reporting Lines) giữa các nhân viên.
5. **FEAT-14: Ma Trận Phân Quyền Chức Năng (Functional RBAC)**:
   - Danh mục quyền hạn chuẩn hóa theo cú pháp `domain:resource:action`.
   - Quản lý Vai trò hệ thống mặc định (`TENANT_OWNER`, `TENANT_ADMIN`, `GENERAL_MANAGER`, `STAFF`, `VIEWER`) và Vai trò tùy biến (Custom Roles).
   - Giao diện gán quyền chức năng dạng Switch Toggle mật độ cao.
   - Gán người dùng vào một hoặc nhiều Vai trò.
6. **FEAT-15: Phân Quyền Dữ Liệu Đa Phạm Vi & Ma Trận 6 Thao Tác Tác Động Dữ Liệu**:
   - 7 Phạm vi dữ liệu: `ALL`, `BRANCH`, `DEPARTMENT_AND_CHILDREN`, `DEPARTMENT`, `OWN_AND_SUBORDINATES`, `OWN_ONLY`, `NONE`.
   - 6 Thao tác dữ liệu độc lập: `CREATE`, `READ`, `UPDATE`, `DELETE`, `EXPORT`, `SHARE`.
   - Ma trận phân quyền 2 chiều trực quan (Dòng là Resource, Cột là 6 thao tác).
   - Nguyên tắc gộp quyền mở rộng nhất (Most Permissive / Union Rule) khi người dùng có nhiều vai trò.
7. **FEAT-16: Bộ Máy Thực Thi Phân Quyền Tự Động Ở Tầng Backend (Enforcement Engine)**:
   - Tự động bổ sung mệnh đề lọc SQL/JPA Filter dựa trên User Context, không cần viết WHERE thủ công.
   - Cơ chế Cache quyền và cơ cấu tổ chức trên Redis kèm cơ chế vô hiệu hóa tức thì khi có thay đổi.
8. **FEAT-17: Thực Thể Tham Chiếu Core Cho Data Permission Engine (Reference Entity)**:
   - Bảng `core_sample_records` + API `/api/v1/core/sample-records` để kiểm chứng Data Permission Engine (7 scopes & 6 thao tác) trên dữ liệu thật trước khi có Plugin nghiệp vụ.

---

## 2. Phạm Vi Chưa Thực Hiện Trong Sprint Này (Out-of-Scope)

- Tự động tích hợp cổng thanh toán trực tuyến quốc tế (Stripe, Paypal) để tự động trừ tiền gia hạn gói Tenant (chuyển sang Sprint Billing sau).
- Tính năng phân quyền dữ liệu theo thuộc tính động nâng cao phức tạp ABAC dạng biểu thức Regex tùy ý (Sprint 02 không hỗ trợ CUSTOM/ABAC; sẽ thiết kế ở sprint sau).
- Quản lý chấm công, tính lương và đánh giá KPI nhân sự (thuộc Plugin HRM độc lập).

---

## 3. Tiêu Chí Nghiệm Thu Từng Tính Năng (Acceptance Criteria dạng Given-When-Then)

### 3.1. Tiêu Chí Cho FEAT-10 & FEAT-11 (Super Admin & Impersonation)
- **Kịch bản Khóa Tenant**:
  - **Given**: Super Admin đang xem chi tiết Tenant "Công ty TNHH May Mặc A" trạng thái `ACTIVE`.
  - **When**: Super Admin bấm nút "Khóa Tenant", nhập lý do "Chưa thanh toán cước tháng 9" và xác nhận mật khẩu.
  - **Then**: Trạng thái Tenant chuyển sang `SUSPENDED`. Mọi nhân viên của Tenant khi gọi API đều nhận lỗi `TENANT_SUSPENDED`. Bản ghi được lưu vào `platform_audit_logs`.
- **Kịch bản Impersonation có kiểm toán**:
  - **Given**: Khách hàng Tenant B gửi ticket sự cố `TCK-1024`. Super Admin bấm "Truy cập đại diện".
  - **When**: Super Admin nhập ticket `TCK-1024`, nhập lý do "Kiểm tra lỗi hiển thị hóa đơn", nhập mật khẩu Super Admin.
  - **Then**: Hệ thống cấp Access Token tạm thời có `impersonator_id`, thời hạn 30 phút, không có refresh token. Trình duyệt chuyển sang giao diện Tenant B với thanh banner vàng đếm ngược. Nhật ký `platform_impersonation_logs` ghi nhận trạng thái `STARTED`.

### 3.2. Tiêu Chí Cho FEAT-13 (Cơ Cấu Tổ Chức & Cây Phòng Ban)
- **Kịch bản Phát Hiện Vòng Lặp Báo Cáo (Cycle Detection)**:
  - **Given**: Nhân viên A đang có quản lý trực tiếp là Nhân viên B; Nhân viên B có quản lý trực tiếp là Nhân viên C.
  - **When**: Người quản trị đổi quản lý trực tiếp của C thành Nhân viên A.
  - **Then**: Hệ thống chặn thao tác và trả về lỗi `ORGANIZATION_REPORTING_CYCLE_DETECTED`, thông báo không thể tạo vòng lặp quản lý.

### 3.3. Tiêu Chí Cho FEAT-14 & FEAT-15 (RBAC & Data Scopes)
- **Kịch bản Kiểm Soát Quyền Xuất File (Export Protection)**:
  - **Given**: Nhân viên Sales Nam được gán vai trò có quyền `READ` bản ghi mẫu (`SAMPLE_RECORD`) với scope `BRANCH`, nhưng quyền `EXPORT` bị đặt là `NONE`.
  - **When**: Nhân viên Nam bấm nút "Xuất file Excel bản ghi mẫu".
  - **Then**: Nút xuất file bị vô hiệu hóa trên giao diện; nếu gọi API trực tiếp `POST /api/v1/core/sample-records/export`, Backend trả về mã lỗi `403 Forbidden` kèm code `IAM_PERMISSION_DENIED_EXPORT`.
- **Kịch bản Giới Hạn Phạm Vi Sửa Bản Ghi (Update Scope Enforcement)**:
  - **Given**: Nhân viên Hùng có quyền `READ` bản ghi mẫu (`SAMPLE_RECORD`, thực thể kiểm chứng `core_sample_records` theo FEAT-17) scope `DEPARTMENT` (thấy bản ghi mẫu của đồng nghiệp Tuấn), nhưng quyền `UPDATE` có scope `OWN_ONLY`.
  - **When**: Nhân viên Hùng cố gắng chỉnh sửa bản ghi mẫu do đồng nghiệp Tuấn tạo ra.
  - **Then**: Backend chặn request và trả về lỗi `IAM_PERMISSION_DENIED_DATA_SCOPE` (Chỉ được sửa bản ghi mẫu do chính mình tạo).

---

## 4. Tiêu Chuẩn Kỹ Thuật Bắt Buộc (DoD Gate)

1. **Backend**:
   - 100% logic phân quyền và kiểm soát phạm vi có Unit Test / Integration Test chạy trên PostgreSQL & Redis thật.
   - Bắt buộc có kiểm thử cô lập rò rỉ dữ liệu chéo (Cross-tenant & Cross-scope test).
2. **Frontend**:
   - Tuyệt đối không viết unit test frontend.
   - QA/QC kiểm thử thủ công trực tiếp trên Trình duyệt Web Desktop ($\ge$ 1280px) và Mobile Emulation (390x844px), đảm bảo 0 console error.
3. **UI/UX Anti-Modal**:
   - Toàn bộ form cấu hình vai trò, gán phòng ban, xem audit log phải hiển thị qua Drawer trượt hoặc Split-Screen, không dùng Modal popup.

---

## 5. Chữ Ký Phê Duyệt Của Khách Hàng (Customer Sign-Off)

> [!IMPORTANT]
> Khách hàng vui lòng kiểm tra kỹ nội dung biên bản phạm vi trên. Bằng việc phê duyệt biên bản này, các bên thống nhất xác nhận phạm vi và Phụ lục rà soát; tài liệu thiết kế chi tiết (SOL/DES) đã hoàn thành và đính kèm để rà soát.

- **Đại diện Khách Hàng**: Người dùng (Customer / Product Owner) — Ngày ký: ....................
- **Đại diện Kỹ Thuật (Solution Architect)**: Đã ký
- **Đại diện Quản Lý (PM Agent)**: Đã ký

---

## 6. Phụ Lục Rà Soát Tài Liệu (2026-09-18) - Cần Khách Hàng Xác Nhận
1. **FEAT-17 (bổ sung)**: Thực thể tham chiếu Core `core_sample_records` + API `/api/v1/core/sample-records` để kiểm chứng Data Permission Engine trước khi có Plugin nghiệp vụ (xem `07_items/FEAT-17_core_reference_entity.md`).
2. **Break-Glass APIs**: bổ sung endpoint force-password-reset và disable-2FA cho Super Admin (không thay đổi phạm vi, chỉ đặc tả chi tiết để thực thi mục 2 In-Scope).
3. **Quota Enforcement**: làm rõ cơ chế chặn vượt `max_users`, `max_storage_mb`, `allowed_plugins` (hiện chỉ mới cấu hình).
4. **Role source migration**: `user_roles` trở thành nguồn vai trò chính; `user_tenants.role` (Sprint 01) được migrate và deprecate.
5. **Tenant states**: bổ sung `EXPIRED` vào state machine + job tự động hết hạn dùng thử.
6. **Scope set chốt 7 giá trị**: `ALL, BRANCH, DEPARTMENT_AND_CHILDREN, DEPARTMENT, OWN_AND_SUBORDINATES, OWN_ONLY, NONE` (không có `CUSTOM`; ABAC nâng cao thuộc Out-of-Scope).
7. **Quản lý đa chi nhánh (bổ sung)**: BRANCH scope = hợp của Chi nhánh thành viên và Chi nhánh được quản lý (bảng `user_branch_assignments`, primary branch per user); đáp ứng Giám đốc vùng phụ trách nhiều chi nhánh mà không cần membership giả.
8. **Audit Log Storage (chi tiết hóa FEAT-12)**: bảng audit dùng chung scope PLATFORM/TENANT, hash chain SHA-256 chống sửa, partition tháng, retention 24 tháng + cold archive MongoDB/S3 ở sprint sau; màn hình audit cho Tenant Admin deferred sprint sau.
9. **Vòng đời Super Admin & CLI (bổ sung)**: không cho tự đăng ký; bootstrap/API/CLI cấp quyền; disable/revoke có guard (không tự khóa, giữ tối thiểu 1 admin active); CLI offline khẩn cấp + remote CLI, mọi thao tác audit.
