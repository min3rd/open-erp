# [BENCH-S07-001] Đối chuẩn: Hồ sơ nhân viên, quản trị theo chi nhánh & tự phục vụ

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BENCH-S07-001 / Đối chuẩn / Sprint 07 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-29 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S07-001](../01_raw_notes/01_RAW-S07-001_employee_plugin_requirements.md), [ANL-S07-001](../02_analysis/01_ANL-S07-001_employee_identity_and_data_model.md), [ANL-S07-002](../02_analysis/02_ANL-S07-002_admin_management_and_self_service.md) |
| Đọc trước / đọc tiếp | ANL-S07-002 / [CONF-S07-001](../04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md) |

## 1. Mục đích và phương pháp

Sprint 07 cần quyết định bốn bài toán:

1. **Hồ sơ nhân viên quan hệ thế nào với tài khoản** — có bắt buộc tài khoản không, một người có nhiều hồ sơ không?
2. **Phân công tổ chức** — chi nhánh/phòng ban/chức danh/quản lý lấy từ đâu, có lịch sử không?
3. **Tự phục vụ** — nhân viên sửa được gì, áp dụng ngay hay qua duyệt, ai duyệt?
4. **Kiểm soát dữ liệu nhạy cảm** — ai xem CCCD/thuế/BHXH/ngân hàng, có audit không?

Tài liệu đối chuẩn 9 sản phẩm, chọn lọc theo mức độ phổ biến toàn cầu và thực tế Việt Nam. Quy ước nhãn:

- **Đã kiểm chứng**: đọc trực tiếp tài liệu sản phẩm trong phiên soạn tài liệu này.
- **Đã kiểm chứng một phần**: có nguồn chính thức nhưng chỉ xác nhận một phần hành vi.
- **Suy luận**: suy đoán từ kinh nghiệm/tài liệu thứ cấp, cần kiểm chứng thêm khi triển khai.

Giới hạn: đối chuẩn định tính từ tài liệu công khai, không đo hiệu năng/thử sản phẩm; tính năng thương mại có thể thay đổi theo phiên bản/gói. Không sao chép toàn bộ HR suite — chỉ lấy bài học cho phạm vi Sprint 07.

## 2. Bảng đối chuẩn

| Sản phẩm | Hồ sơ vs tài khoản | Tổ chức/phân công | Tự phục vụ | Duyệt/kiểm soát | Vòng đời/lịch sử | Bài học cho Open-ERP |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Open-ERP hiện tại** | `users` toàn cục + `user_tenants` (quyền truy cập); **chưa có employee** | `branches`, `departments`, `user_department_memberships`, `direct_manager_user_id`, data scope | Chưa có self-service HR; chỉ hồ sơ tài khoản | RBAC + data scope; chưa có duyệt thay đổi HR | Chưa có vòng đời lao động | Cần thêm lớp employee, không dựng lại org/RBAC |
| **Odoo 18** | `hr.employee` riêng; **nhân viên không cần là user**; “Related User” tùy chọn; loại Employee/Worker/Student/Trainee/Contractor/Freelancer (**Đã kiểm chứng**) | Department, Manager, Coach, Work Location; Job Position có text + dropdown, hai trường có thể khác nhau (**Đã kiểm chứng**) | Setting “Employee Editing” cho phép nhân viên sửa dữ liệu của mình (**Đã kiểm chứng**) | Không thấy duyệt từng trường trong Employee; payroll/time-off có approval riêng (**Suy luận**) | Contract, onboarding/offboarding, resume/skills; không nhấn mạnh mã nhân viên (**Đã kiểm chứng một phần**) | Tách employee khỏi user; job title text + ref; cho phép bật/tắt self-edit; không copy toàn bộ HR suite |
| **ERPNext / Frappe HR** | `Employee` master; `user_id` tùy chọn; tạo user tự động hoặc thủ công; “Create User Permission” giới hạn user chỉ thấy hồ sơ mình (**Đã kiểm chứng**) | Company, Department, Designation, Branch, Reports To, Employee Grade (**Đã kiểm chứng**) | Có ESS/role Employee; chủ yếu leave/attendance/payslip; sửa hồ sơ cần quyền (**Đã kiểm chứng một phần**) | Leave/Expense Approver; transfer/separation là module riêng (**Đã kiểm chứng một phần**) | Joining/confirmation/contract end/notice/retirement; status Active/Left/Suspended; exit/history (**Đã kiểm chứng**) | Mã nhân viên + ngày vào làm; user tùy chọn; tách separation; không nhồi lương vào hồ sơ |
| **SAP SuccessFactors Employee Central** | Employee profile; **multiple employments**; effective-dated; worker/employment records (**Đã kiểm chứng một phần**) | Job/position/org assignment; RBP target population theo employee/department/location (**Đã kiểm chứng**) | ESS với “approval guardrails” (**Đã kiểm chứng**) | Role-Based Permissions đến field; workflow duyệt; effective-dated entities (**Đã kiểm chứng**) | Hire/rehire/transfer/terminate; lịch sử theo ngày hiệu lực (**Đã kiểm chứng một phần**) | Target population + field-level permission là chuẩn; effective dating quá nặng cho v1; multiple employment để sau |
| **Workday HCM** | Worker (employee/contingent); business process là trung tâm (**Đã kiểm chứng một phần**) | Supervisory org + matrix; position/job; effective-dated (**Suy luận/Đã kiểm chứng một phần**) | “Change My Personal Information”, view/change photo/name/contact (**Đã kiểm chứng một phần**) | Business process routing/approval; personal info change có duyệt (**Đã kiểm chứng một phần**) | Effective dating, history, rehire (**Đã kiểm chứng một phần**) | Mọi thay đổi nên có “quy trình” + diff + duyệt; không cần mô hình Workday đầy đủ |
| **BambooHR** | Employee profile; access levels Employee/Manager/Custom/Full Admin (**Đã kiểm chứng**) | Job info: title, department, division, location, reporting, employee number (**Đã kiểm chứng một phần**) | “My Info” view + edit một số trường; field-level View Only/View+Edit/No Access (ví dụ direct deposit) (**Đã kiểm chứng**) | Access level kiểm soát xem/sửa; không thấy workflow nhiều cấp native (**Suy luận**) | Onboarding/offboarding, files, org chart (**Đã kiểm chứng một phần**) | Field-level access là đủ cho SME; approval workflow có thể thêm sau |
| **Personio** | Employee profile theo section; role Admin/employee (**Đã kiểm chứng một phần**) | Department, supervisor, custom attributes (**Đã kiểm chứng một phần**) | Quyền **Propose** (gửi thay đổi) vs **Edit** (sửa trực tiếp) (**Đã kiểm chứng**) | Approval workflow theo profile section; conditions/rules; delegation; một approver/bước (**Đã kiểm chứng**) | Onboarding/offboarding, probation, documents (**Đã kiểm chứng một phần**) | Tách “Propose” và “Edit” rất gọn; duyệt theo nhóm trường; delegation để sau |
| **Zoho People** | Employee profile; **employee không cần user** vẫn có hồ sơ (**Đã kiểm chứng một phần**) | Department, designation, reporting, location (**Đã kiểm chứng một phần**) | ESS; field-level permissions (**Đã kiểm chứng một phần**) | Approvals cho leave/timesheet; field-level permission theo profile (**Đã kiểm chứng một phần**) | Onboarding/exit, documents (**Đã kiểm chứng một phần**) | Hồ sơ không cần tài khoản; field permission theo form |
| **MISA AMIS HRM** | Hồ sơ nhân sự trong tenant; HR cấu hình trường nhân viên được cập nhật (**Đã kiểm chứng**) | Đơn vị/chi nhánh, phòng ban, chức danh, quản lý (**Đã kiểm chứng một phần**) | Nhân viên vào AMIS Nhân viên (Web/Mobile), sửa thông tin cơ bản/liên hệ, gửi HR duyệt (**Đã kiểm chứng**) | HR duyệt từng thông tin hoặc toàn bộ; từ chối có lý do; gửi thông báo yêu cầu cập nhật cho tất cả/nhóm (**Đã kiểm chứng**) | Thử việc/chính thức, nghỉ việc, hợp đồng, BHXH/thuế (**Đã kiểm chứng một phần**) | Cấu hình trường + duyệt theo từng thông tin + chiến dịch nhắc cập nhật là kỳ vọng thị trường VN |
| **Base HRM** | Hồ sơ nhân sự + tài khoản; “Đề xuất cập nhật thông tin” (**Đã kiểm chứng**) | Phòng ban, quản lý, chức danh (**Đã kiểm chứng một phần**) | Base Me: nhân viên tạo đề xuất cập nhật; theo dõi “Đề xuất của tôi” (**Đã kiểm chứng**) | Người duyệt mặc định là HRM admin có quyền Profile & Account; 1 người duyệt; xóa được trước duyệt; từ chối có thể duyệt lại; đã duyệt không từ chối/xóa (**Đã kiểm chứng**) | Hồ sơ/tài khoản, onboarding/offboarding (**Đã kiểm chứng một phần**) | Đề xuất + trạng thái rõ; mặc định HR duyệt; quy tắc “đã duyệt là bất biến” |

## 3. Bài học cho Open-ERP

### 3.1. Tách nhân viên khỏi tài khoản, nhưng vẫn liên kết được

- *Vấn đề*: yêu cầu nói “thân phận nhân viên của 1 tài khoản”; nếu đồng nhất employee với user, hệ thống không quản lý được nhân viên chưa có email/tài khoản, và mọi tenant member bị ép thành nhân viên.
- *Các hệ thống*: Odoo nói rõ “Employees do not need to be users”; ERPNext/Zoho cho tạo employee trước, user sau; SAP/Workday tách worker/employment khỏi user đăng nhập.
- *Khuyến nghị*: `employee` là entity riêng, `user_id` nullable; một user tối đa một employee/tenant; nhân viên chưa có tài khoản vẫn quản lý được; self-service mở khi liên kết.

### 3.2. Mã nhân viên là định danh nghiệp vụ

- *Vấn đề*: HR cần mã ổn định để đối chiếu hợp đồng, bảng lương, chấm công; email có thể đổi, user_id là kỹ thuật.
- *Các hệ thống*: ERPNext có Employee Number; BambooHR có Employee Number; Odoo dùng badge/PIN/registration number tùy nhu cầu.
- *Khuyến nghị*: mã duy nhất/tenant, auto + cho nhập tay, bất biến sau kích hoạt, không tái sử dụng.

### 3.3. Phân công hiện tại + lịch sử; effective dating để sau

- *Vấn đề*: cần biết nhân viên thuộc chi nhánh/phòng ban nào, báo cáo ai; HR cần xem quá trình chuyển bộ phận.
- *Các hệ thống*: SAP/Workday effective-dated đầy đủ; Odoo/ERPNext giữ hiện tại + contract/transfer documents; Personio/BambooHR thiên về hiện tại + lịch sử.
- *Khuyến nghị*: v1 lưu hiện tại trên employee + bảng lịch sử append-only cho thay đổi công việc/trạng thái; chưa future-dated/bitemporal.

### 3.4. Tự phục vụ nên có kiểm soát, không chỉ “sửa được”

- *Vấn đề*: dữ liệu HR ảnh hưởng lương, BHXH, thuế; cho sửa trực tiếp dễ sai lệch; bắt duyệt tất cả thì HR quá tải.
- *Các hệ thống*: Odoo cho bật/tắt self-edit; MISA/Base bắt buộc gửi HR duyệt; Personio tách Propose vs Edit; SAP có approval guardrails.
- *Khuyến nghị*: **hybrid** — trường liên hệ ít rủi ro áp dụng ngay; trường định danh/giấy tờ/thuế/BHXH gửi đề xuất; công việc/trạng thái HR-only.

### 3.5. Field-level permission là yêu cầu, không phải tùy chọn

- *Vấn đề*: CCCD, số BHXH, ngân hàng, ngày sinh là dữ liệu nhạy cảm; branch manager không nên thấy hết.
- *Các hệ thống*: BambooHR View Only/View+Edit/No Access; SAP RBP đến field; Zoho field-level permission; Personio section-based approval.
- *Khuyến nghị*: phân nhóm PUBLIC/INTERNAL/SENSITIVE/RESTRICTED; mask ở danh sách; `employee:sensitive:read` cho HR; audit khi xem.

### 3.6. Người duyệt mặc định là HR, một cấp

- *Vấn đề*: ai duyệt thay đổi hồ sơ? Manager hay HR?
- *Các hệ thống*: Base mặc định HRM admin; MISA HR duyệt; Personio cấu hình approver; SAP workflow.
- *Khuyến nghị*: v1 HR Admin có `employee:change-request:approve`; một người duyệt là đủ; manager duyệt để phase 2; không tự duyệt.

### 3.7. Trạng thái và quy tắc đề xuất phải rõ

- *Vấn đề*: đề xuất bị từ chối, bị rút, bị trùng, hồ sơ đổi giữa lúc chờ — nếu không có state machine sẽ sinh dữ liệu rác.
- *Các hệ thống*: Base cho xóa trước duyệt, từ chối có thể duyệt lại, đã duyệt không từ chối/xóa; Personio có approval task/delegation.
- *Khuyến nghị*: state `PENDING/APPROVED/REJECTED/WITHDRAWN/CONFLICT/EXPIRED`; đã duyệt bất biến; từ chối phải có lý do; conflict khi hồ sơ đổi.

### 3.8. Offboarding không đồng nghĩa xóa tài khoản/dữ liệu

- *Vấn đề*: nhân viên nghỉ việc nhưng dữ liệu HR còn nghĩa vụ lưu trữ; tài khoản có thể bị khóa ngay hoặc sau bàn giao.
- *Các hệ thống*: ERPNext có Employee Separation/Relieving Date; Odoo offboarding; SAP termination workflow.
- *Khuyến nghị*: offboard = status `LEFT` + exit date/reason + kết thúc phân công; khóa tài khoản là tùy chọn có xác nhận; chặn gỡ membership khi employee còn active.

### 3.9. Nhân viên không có tài khoản là ca thực tế, không phải ngoại lệ hiếm

- *Vấn đề*: nhà máy/chi nhánh có nhân viên không dùng email; HR vẫn cần hồ sơ, chấm công, lương.
- *Các hệ thống*: Odoo “Employees do not need to be users”; ERPNext tạo user sau; Zoho non-user employee profile.
- *Khuyến nghị*: cho tạo hồ sơ trước; hiển thị “Chưa có tài khoản”; mời sau; self-service chỉ mở khi liên kết.

### 3.10. Đừng gộp payroll/attendance vào plugin hồ sơ

- *Vấn đề*: hồ sơ nhân viên dễ phình thành HR suite.
- *Các hệ thống*: Odoo tách Employees/Payroll/Time Off; ERPNext tách Employee/Payroll/Attendance/Leave; SAP tách module.
- *Khuyến nghị*: Sprint 07 chỉ hồ sơ + quản trị + self-service; lương/chấm công/nghỉ phép là plugin sau, tham chiếu `employee_id`.

### 3.11. Đặc thù Việt Nam cần có trong mô hình dữ liệu

- CCCD/hộ chiếu, mã số thuế TNCN, số BHXH/BHYT, ngân hàng, người phụ thuộc, thử việc/chính thức, loại hợp đồng.
- MISA/Base đều có các nhóm này; HR Việt Nam kỳ vọng hồ sơ phục vụ được BHXH/thuế, dù Sprint 07 chưa tính lương.
- **Khuyến nghị**: v1 lưu các trường định danh/thuế/BHXH cần thiết; ngân hàng/người phụ thuộc/hợp đồng điện tử để phase 2 gắn payroll.

### 3.12. Tuân thủ bảo vệ dữ liệu cá nhân

- Luật Bảo vệ dữ liệu cá nhân **91/2025/QH15** và Nghị định **356/2025/NĐ-CP** có hiệu lực từ **01/01/2026**, thay Nghị định 13/2023/NĐ-CP.
- Hồ sơ HR chứa dữ liệu cá nhân cơ bản và nhạy cảm (CCCD, sức khỏe, tài chính). Cần: mục đích rõ, tối thiểu hóa, phân quyền, audit, thời hạn lưu, xử lý yêu cầu của chủ thể.
- **Khuyến nghị**: v1 có phân loại nhạy cảm + audit + retention; consent/DSAR đầy đủ để phase 2 hoặc khi có tư vấn pháp lý.

## 4. Điểm cần khách xác nhận

Các bài học trên dẫn tới câu hỏi tại [CONF-S07-001 §4](../04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md):

1. **Q1–Q2**: tách employee khỏi member; có nhân viên không tài khoản?
2. **Q5**: plugin hay Core là nơi nhập phân công?
3. **Q7–Q12**: mã, trạng thái, ngày tháng, lịch sử, nghỉ việc, rehire.
4. **Q13**: nhóm dữ liệu v1 (đặc biệt giấy tờ/thuế/BHXH/ngân hàng).
5. **Q20–Q22**: allowlist self-service; hybrid duyệt; HR duyệt.
6. **Q26–Q27**: branch manager read-only; trường nhạy cảm.
7. **Q29**: mức tuân thủ PDP Law trong Sprint 07.
8. **Q30**: must-have ngoài đề xuất.

## 5. Nguồn đã đọc

| Sản phẩm | Tài liệu | Dùng cho |
| :--- | :--- | :--- |
| Odoo 18 | [Employees](https://www.odoo.com/documentation/18.0/applications/hr/employees.html), [New employees](https://www.odoo.com/documentation/18.0/applications/hr/employees/new_employee.html) | Employee không cần user; Employee Editing; job position text + dropdown; private/emergency/education |
| Frappe HR | [Employee](https://docs.frappe.io/hr/employee) | Employee master; user tùy chọn; create user; joining/exit; education/work history; salary/bank |
| SAP SuccessFactors | [Using Self Service in Employee Central](https://learning.sap.com/courses/sap-successfactors-employee-central-core-academy/configuring-role-based-permissions-for-self-service-during-implementation_bfb869bd-b69c-4f29-a23b-e87138760682), [Latest People Profile](https://help.sap.com/docs/successfactors-employee-central/implementing-employee-central-core/latest-people-profile), [Permissions for Concurrent Employment](https://help.sap.com/docs/successfactors-employee-central/implementing-employee-central-core/permissions-for-concurrent-employment) | ESS + approval guardrails; multiple employments; target population |
| Workday | [Change personal information / active consent](https://doc.workday.com/admin-guide/en-us/human-capital-management/worker-information/contact-and-personal-information/active-consent-preferences-for-personal-informatio/setup-considerations--active-consent-preferences-f.html) | Change My Personal Information; approval |
| BambooHR | [My Info Tab](https://help.bamboohr.com/s/article/587803), [Employee Access Manual](https://help.bamboohr.com/s/article/639584), [Direct Deposit Information](https://help.bamboohr.com/s/article/1140569) | Access levels; view/edit personal info; field-level View Only/View+Edit/No Access |
| Personio | [Employee data change approval workflows](https://support.personio.de/hc/en-us/articles/21453114449053-Set-up-employee-data-change-approval-workflows) | Propose vs Edit; approval theo section; delegation |
| Zoho People | [Setting up permissions](https://help.zoho.com/portal/en/kb/people/administrator-guide/common-settings/articles/setting-up-permissions-zoho-people), [Manage accounts](https://help.zoho.com/portal/en/kb/people/administrator-guide/settings/manage-accounts/articles/manage-accounts-zoho-people) | Field-level permission; non-user employee profile |
| MISA AMIS HRM | [Phê duyệt nhân viên cập nhật hồ sơ](https://helpamis.misa.vn/amis-thong-tin-nhan-su/kb/phe-duyet-nhan-vien-cap-nhat-ho-so/), [Nhân viên tự cập nhật hồ sơ](https://helpamis.misa.vn/amis-thong-tin-nhan-su/kb/theo-doi-va-cap-nhat-ho-so-nhan-vien/) | Cấu hình trường; gửi HR duyệt; duyệt từng/tất cả; lý do từ chối; nhắc cập nhật |
| Base HRM | [Cho phép nhân sự cập nhật thay đổi thông tin](https://help.base.vn/support/solutions/articles/63000278925-base-hrm-c%C3%A0i-%C4%91%E1%BA%B7t-cho-ph%C3%A9p-nh%C3%A2n-s%E1%BB%B1-c%E1%BA%ADp-nh%E1%BA%ADt-thay-%C4%91%E1%BB%95i-th%C3%B4ng-tin-tr%C3%AAn-hrm) | Đề xuất cập nhật; approver mặc định; quy tắc trạng thái |
| Việt Nam | Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15; Nghị định 356/2025/NĐ-CP (hiệu lực 01/01/2026) | Phân loại nhạy cảm; audit; retention |

> URL chỉ để tra cứu; sản phẩm có thể đổi tài liệu/tính năng theo phiên bản. Không dùng benchmark làm cam kết tính năng.

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Bản nháp: đối chuẩn 9 sản phẩm + baseline Open-ERP; 12 bài học; nguồn đã đọc | BA Agent; chưa review |
