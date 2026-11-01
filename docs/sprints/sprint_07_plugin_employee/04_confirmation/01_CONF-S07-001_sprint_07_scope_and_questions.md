# [CONF-S07-001] Biên bản xác nhận phạm vi, AC nháp & câu hỏi thiết kế — Sprint 07

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | CONF-S07-001 / Scope, AC & câu hỏi / Sprint 07 |
| Trạng thái / phiên bản / cập nhật | **APPROVED — scope/AC 1.0** / 1.0 / 2026-10-30 |
| Owner / reviewer | BA Agent / **Chủ dự án (Product Owner)** |
| Đầu vào | [RAW-S07-001](../01_raw_notes/01_RAW-S07-001_employee_plugin_requirements.md), [ANL-S07-001](../02_analysis/01_ANL-S07-001_employee_identity_and_data_model.md), [ANL-S07-002](../02_analysis/02_ANL-S07-002_admin_management_and_self_service.md), [BENCH-S07-001](../03_benchmarks/01_BENCH-S07-001_employee_profile_and_self_service.md) |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) / Sau khi APPROVED: `05_solutions/`, `06_designs/` |

> **Gate: APPROVED (2026-10-30).** Chủ dự án duyệt scope/AC 0.6 và chỉ đạo “ok duyệt nhé. tiếp tục bước tiếp theo đi”. **Sprint 07 được phép chuyển Architect (05–06).** Chưa cấp task/code cho đến khi Design ready.

## 1. Tóm tắt để chủ dự án quyết nhanh

Sprint 07 xây plugin `employee` với **hai chế độ**:

1. **HR Admin** quản lý nhân viên của tenant/chi nhánh.
2. **Nhân viên tự phục vụ** hồ sơ của chính mình.

**38/38 câu đã chốt** (30 gốc + 8 phát sinh; chi tiết §4–§5). Các lựa chọn làm scope rộng hơn đề xuất ban đầu:

- **Đa phân công** trong cùng tenant, có phân công chính; quản lý theo từng phân công (Q3/Q33).
- **Effective-dated đầy đủ**: future-dated + as-of + sửa hồi tố có lý do (Q10/Q32).
- **Plugin always-on**, không gỡ, được ẩn menu (Q6/Q35).
- **Tenant tự cấu hình** trường nhân viên được tự sửa (Q20).
- **Duyệt nhiều cấp tuần tự** theo nhóm trường/phòng ban (Q22/Q36).
- **Self-onboarding** + **chiến dịch yêu cầu cập nhật hàng loạt** (Q23/Q24).
- **Danh bạ + org chart đầy đủ**; **tài liệu đầy đủ**, nhân viên được upload (Q16/Q17/Q37/Q30).
- **Privacy đầy đủ** (consent/DSAR/breach/retention) (Q29/Q38).
- **Tự động khóa tài khoản + gỡ quyền** khi nghỉ việc, chặn nếu còn cấp dưới (Q11/Q34).
- **Làm tất cả cùng lúc**, không chia phase (Q31).
- **Plugin `organization`** tách branch/department khỏi Core; **always-on**; organization giữ **master data + access membership** cho mọi tenant member; employee giữ **HR assignment**; Core projection merge; **big-bang migration**; **đổi namespace API/quyền/entity** (R8/Q39–Q46/Q53–Q54).
- **Tenant switcher** trên header: UI là header contribution của employee, auth endpoint Core, thu hồi session cũ, clear toàn bộ tenant state (R9/Q47–Q52).
- **Offboarding guard**: chặn nếu là owner/admin cuối cùng hoặc có platform role; chuyển quyền trước (Q55).

> **Cảnh báo:** đây là khối lượng rất lớn cho một sprint. Q31 = B nghĩa là một release duy nhất; thêm extraction organization và tenant switcher làm tăng rủi ro kiến trúc/data scope. Cần baseline/AC rõ, QA đầy đủ và chấp nhận rủi ro tiến độ.

## 2. Phạm vi đã chọn

### 2.1. Trong phạm vi Sprint 07 (theo 30 câu đã trả lời)

| # | Nội dung | Nguồn |
| :--- | :--- | :--- |
| S1 | Hồ sơ nhân viên theo tenant: định danh, liên hệ, công việc, liên hệ khẩn cấp, giấy tờ, thuế/BHXH/BHYT, học vấn, hợp đồng tối thiểu | Q13 |
| S2 | Nhân viên tách khỏi tenant member; liên kết tài khoản tùy chọn; hỗ trợ nhân viên chưa có tài khoản | Q1/Q2 |
| S3 | Đa phân công: một hồ sơ + nhiều phân công, có phân công chính; chức danh/quản lý theo phân công | Q3 |
| S4 | Vòng đời: Draft/Probation/Active/Suspended/Left, ngày vào làm/thử việc/chính thức/nghỉ, ngày hợp đồng | Q8/Q9 |
| S5 | Effective-dated: future-dated + as-of + sửa hồi tố có lý do/audit | Q10/Q32 |
| S6 | HR Admin: danh sách/tìm kiếm/lọc/tạo/sửa/gán phân công/nghỉ việc/lịch sử | R3/Q26 |
| S7 | Self-service: xem hồ sơ của mình, sửa theo allowlist tenant cấu hình, gửi/rút đề xuất | Q20/Q21/Q25 |
| S8 | Duyệt đề xuất: hybrid áp dụng ngay/gửi duyệt; **duyệt nhiều cấp tuần tự** cấu hình được | Q21/Q22/Q36 |
| S9 | Tự động khóa tài khoản + gỡ quyền khi nghỉ việc; chặn/xử lý cấp dưới | Q11 |
| S10 | Rehire dùng lại hồ sơ/mã, tạo giai đoạn mới | Q12 |
| S11 | Always-on: cài cho mọi tenant, không gỡ; provisioning tenant mới/backfill tenant cũ | Q6 |
| S12 | Danh bạ nhân viên + org chart đầy đủ (phòng ban/quản lý, dotted-line nếu chốt) | Q16/Q30 |
| S13 | Tài liệu: HR upload + **nhân viên upload có duyệt**, version, phân loại, quyền xem/tải, virus scan, retention | Q17/Q37 |
| S14 | Import/export CSV; export cần quyền riêng, mặc định bỏ trường nhạy cảm | Q19/Q28/Q30 |
| S15 | Self-onboarding: link mời nhân viên tự điền trước ngày vào làm | Q23 |
| S16 | Chiến dịch yêu cầu cập nhật hàng loạt + theo dõi tiến độ | Q24 |
| S17 | Privacy đầy đủ: consent, DSAR, breach, retention, audit truy cập | Q29/Q38 |
| S18 | Phân quyền: Tenant/HR full; Branch/Manager read; Employee self; trường nhạy cảm mask + audit | Q26/Q27 |
| S19 | Mobile self-service: xem + sửa allowlist + gửi/rút đề xuất + trạng thái; HR duyệt mobile chưa làm v1 | Q25 |
| S20 | Manifest 2.0 + Entity Registry; zero-DB; catalog/Core soft ref; **always-on, ẩn menu được** | Q6/Q35 |
| S21 | **Một release duy nhất trong Sprint 07** (không chia phase) | Q31 |
| S22 | **Plugin `organization`** always-on: branch/department master + **access membership** cho mọi tenant member; employee giữ **HR assignment**; Core projection merge; big-bang migration; đổi namespace/entity | R8/Q39–Q46/Q53–Q54 |
| S23 | **Tenant switcher**: header contribution của employee + shared component; auth endpoint Core; revoke session; clear tenant state; desktop/mobile | R9/Q47–Q52 |
| S24 | **Offboarding guard**: chặn owner/admin cuối cùng hoặc platform role; chuyển quyền trước khi khóa/gỡ | Q55 |

### 2.2. Ngoài phạm vi Sprint 07

- Lương, phụ cấp, thuế TNCN, tính BHXH, phiếu lương.
- Chấm công, ca làm việc, nghỉ phép, làm thêm giờ.
- Tuyển dụng, đánh giá hiệu suất, đào tạo, kỹ năng.
- Hợp đồng điện tử/chữ ký số; quản lý ngân hàng/người phụ thuộc (phase 2).
- Custom fields (Q18 = không).
- HR cấp platform (quản trị xuyên tenant).

> **Cảnh báo scope:** S1–S21 là khối lượng rất lớn cho một sprint. **Q31 = B: làm tất cả cùng lúc, không chia phase**, nên QA/DoD phải có baseline rõ; rủi ro tiến độ được ghi nhận, không tự cắt scope khi chưa có xác nhận.

## 3. Tiêu chí nghiệm thu nháp

> AC dưới đây là **nháp**, phụ thuộc Q31–Q38. AC đánh dấu “nếu” chỉ áp dụng khi câu hỏi tương ứng được chốt.

| AC | Nội dung | Nguồn |
| :--- | :--- | :--- |
| **AC-01** | Given tenant A và user U là tenant member, When HR tạo employee mã `NV00001` và liên kết U, Then HR tenant A thấy hồ sơ; U thấy hồ sơ của mình; user tenant B không thấy dữ liệu | Q1/Q4 |
| **AC-02** | Given HR tạo employee **không có tài khoản**, Then hồ sơ được quản lý bình thường; self-service bị vô hiệu; khi liên kết phải là tenant member | Q2 |
| **AC-03** | Given mã `NV00001` đã tồn tại trong tenant, When tạo trùng, Then từ chối `EMPLOYEE_CODE_EXISTS`; tenant khác được dùng cùng mã | Q7 |
| **AC-04** | Given user U đã liên kết employee E1 trong tenant, When liên kết E2, Then từ chối `EMPLOYEE_USER_ALREADY_LINKED` | Q1 |
| **AC-05** | Given HR tạo **nhiều phân công** cho một employee, Then đúng một phân công chính; mỗi phân công có chi nhánh/phòng ban/chức danh/quản lý riêng; lọc theo chi nhánh trả đúng | Q3 |
| **AC-06** | Given employee U gọi self endpoint, Then chỉ trả hồ sơ của U; `employee_id` client gửi bị bỏ qua; không bao giờ trả hồ sơ người khác | Q4/BR-12 |
| **AC-07** | Given tenant cấu hình allowlist, When employee sửa trường được phép áp dụng ngay, Then lưu + audit; When sửa trường cần duyệt, Then tạo đề xuất `PENDING`, hồ sơ chưa đổi | Q20/Q21 |
| **AC-08** | Given đề xuất `PENDING`, When chuỗi duyệt cấu hình chạy, Then đúng thứ tự cấp; cấp cuối duyệt ⇒ áp dụng; từ chối ⇒ `REJECTED` + lý do; không tự duyệt | Q22 |
| **AC-09** | Given người gửi cũng có quyền duyệt, When tự duyệt, Then từ chối `EMPLOYEE_SELF_APPROVAL_FORBIDDEN` | Q22 |
| **AC-10** | Given Branch Manager xem danh sách/chi tiết, Then CCCD/BHXH (và ngân hàng nếu có) bị mask; HR có `employee:sensitive:read` xem đầy đủ; lượt xem được audit | Q27 |
| **AC-11** | Given `hire_date = 2026-01-01`, When `exit_date = 2025-12-31`, Then từ chối; When đổi công việc có `effective_date`, Then trạng thái tại ngày đó đúng; không xóa cứng | Q9/Q10 |
| **AC-12** | Given employee còn cấp dưới, When offboard, Then chặn/yêu cầu chuyển quản lý; sau xác nhận, tài khoản bị khóa và quyền tenant bị gỡ; hồ sơ giữ lại | Q11 |
| **AC-13** | Given 50 nhân viên, When lọc chi nhánh/trạng thái/từ khóa + phân trang, Then trả khuôn mẫu Paginated List đúng `items/page/size/total_items/total_pages` | R3 |
| **AC-14** | Given employee thuộc tenant A, When user tenant B truy cập theo id, Then 404/403, không lộ dữ liệu | Ràng buộc tenant |
| **AC-15** | Given user thiếu `employee:profile:read` gọi endpoint quản trị, Then 403; Given Branch Manager, Then chỉ thấy nhân viên chi nhánh mình | Q26 |
| **AC-16** | Given create/update/status/link/approve/offboard, Then history ghi actor, source, before/after, thời điểm, hiệu lực | Q10 |
| **AC-17** | Given plugin cài, Then manifest khai báo entity/permission/platform/always-on; Entity Registry có `Employee`, `EmployeeAssignment`, `EmployeeJobHistory`, `EmployeeChangeRequest` | Ràng buộc plugin/Q6 |
| **AC-18** | Given CSV đúng/sai mẫu, When import, Then dry-run báo lỗi theo dòng; dòng hợp lệ được tạo, dòng lỗi bị bỏ; export cần quyền riêng, mặc định bỏ trường nhạy cảm | Q19/Q28 |
| **AC-19** | Given mobile 390×844, Then self-service xem/sửa/gửi/rút đề xuất được; overflow = 0; touch ≥40px; 0 console error | Q25 |
| **AC-20** | Given mọi màn hình, Then 100% chuỗi qua i18n; không dùng modal cho form/danh sách; component dùng chung; enum chuẩn hóa | Ràng buộc UI |
| **AC-21** | Given employee có nhiều phân công, Then không cho xóa phân công chính khi chưa chọn phân công khác; mọi phân công cùng tenant và department thuộc branch | Q3 |
| **AC-22** | Given thay đổi có `effective_date` tương lai, Then không áp dụng trước ngày; xem as-of quá khứ trả đúng trạng thái; sửa hồi tố có audit/lý do | Q10/Q32 |
| **AC-23** | Given mở danh bạ/org chart, Then thấy cây phòng ban + quản lý trực tiếp; nhân viên chỉ thấy thông tin công khai; không lộ trường nhạy cảm | Q16/Q30 |
| **AC-24** | Given upload tài liệu, Then kiểm tra loại/kích thước/virus; lưu version; phân quyền xem/tải; xóa/retention theo chính sách | Q17 |
| **AC-25** | Given HR Admin mở cấu hình self-service, Then bật/tắt trường theo nhóm; lưu template/tenant; nhân viên chỉ thấy trường được bật | Q20 |
| **AC-26** | Given cấu hình duyệt nhiều cấp, Then chọn được cấp/người duyệt theo nhóm trường/phòng ban; đề xuất đi đúng chuỗi; có delegation/reminder nếu chốt | Q22 |
| **AC-27** | Given HR gửi link self-onboarding, Then nhân viên điền trước ngày vào làm; HR duyệt/tạo hồ sơ; link hết hạn; không trùng mã/email | Q23 |
| **AC-28** | Given HR tạo chiến dịch cập nhật, Then chọn tất cả/nhóm, gửi thông báo, theo dõi ai đã cập nhật/chưa | Q24 |
| **AC-29** | Given yêu cầu privacy, Then có consent, DSAR export/delete, breach notification, retention policy, audit truy cập; không log dữ liệu nhạy cảm | Q29 |
| **AC-30** | Given plugin `organization` cài, Then branch/department master + **access membership** thuộc organization; employee plugin giữ **HR assignment**; Core projection merge; không query trực tiếp bảng plugin | R8/Q39–Q42/Q53–Q54 |
| **AC-31** | Given big-bang migration từ Core sang plugin, Then backfill đủ branch/department/access membership/HR assignment, count/checksum khớp; có backup/rollback; không mất quyền data scope | R8/Q43 |
| **AC-32** | Given đổi namespace API/quyền/entity, Then frontend/consumer/role được migrate; quyền cũ được map; route cũ redirect; không gãy luồng chính | R8/Q45–Q46 |
| **AC-33** | Given user thuộc ≥2 tenant, When switch tenant, Then server validate membership, cấp token mới, thu hồi session cũ; token cũ không dùng được | R9/Q48–Q49 |
| **AC-34** | Given switch tenant, Then cache/tenant state/plugin session/UI manifest được clear; dữ liệu employee/notification/quyền reload theo tenant mới; không rò rỉ dữ liệu tenant cũ | R9/Q52 |
| **AC-35** | Given header desktop/mobile, Then hiển thị tenant hiện tại + switcher (ẩn nếu chỉ 1 tenant); có guard unsaved changes; keyboard/a11y; 0 console error | R9/Q47/Q50–Q51 |
| **AC-36** | Given tenant member không phải nhân viên, Then có **access membership** branch/department/manager trong organization plugin để data scope hoạt động; không cần hồ sơ nhân viên | R8/Q54 |
| **AC-37** | Given offboard owner/admin cuối cùng hoặc user có platform role, Then chặn khóa/gỡ quyền; yêu cầu chuyển quyền trước; audit | Q55 |

### 3.1. Ma trận Desktop/Mobile đã chọn

| Chức năng | Desktop | Mobile | Ghi chú |
| :--- | :---: | :---: | :--- |
| HR Admin: danh sách/tạo/sửa/gán phân công/nghỉ việc | ✅ | ❌ | Mobile HR Admin phase 2 |
| HR Admin: duyệt đề xuất | ✅ | ❌ | Desktop trước |
| HR Admin: cấu hình allowlist/duyệt/tài liệu/chiến dịch | ✅ | ❌ | Desktop |
| Nhân viên: xem hồ sơ của mình | ✅ | ✅ | |
| Nhân viên: sửa allowlist + gửi/rút đề xuất | ✅ | ✅ | Q25 |
| Danh bạ/org chart | ✅ | ✅ (read-only) | Q16/Q30 |
| Import/export CSV | ✅ | ❌ | |
| Tài liệu | ✅ | ✅ (xem/tải của mình) | Q17/Q25 |
| Trường nhạy cảm | ✅ | ✅ | Mask theo quyền; self thấy của mình |

## 4. Câu hỏi và câu trả lời

Cách trả lời: ghi **A/B/C** hoặc mô tả ngắn vào cột “Trả lời”. 30 câu gốc đã trả lời; Q31–Q38 là câu phát sinh.

### 4.1. Ranh giới & mô hình (Q1–Q6)

| # | Câu hỏi | Phương án & khuyến nghị | Trả lời |
| :--- | :--- | :--- | :--- |
| **Q1** (P1) | Mọi tài khoản trong tenant có phải là nhân viên không? | A. Tách, liên kết tùy chọn.<br>B. Gộp — mọi tenant member là employee.<br>C. Hybrid. | **A — Tách, liên kết tùy chọn** |
| **Q2** (P1) | Có hỗ trợ nhân viên không có tài khoản đăng nhập không? | A. Có, tạo trước rồi mời.<br>B. Không, phải có tenant member.<br>C. Có nhưng hồ sơ tối thiểu. | **A — Có, tạo trước rồi mời** |
| **Q3** (P1) | Một người có thể có nhiều phân công/hợp đồng đồng thời trong cùng tenant không? | A. Một hồ sơ + nhiều phân công, một chính.<br>B. Một phân công chính.<br>C. Mỗi phân công một hồ sơ. | **A — Một hồ sơ, nhiều phân công** |
| **Q4** (P2) | Một user thuộc nhiều tenant thì hồ sơ nhân viên thế nào? | A. Mỗi tenant một hồ sơ/mã riêng.<br>B. Một hồ sơ global.<br>C. Chỉ một tenant. | **A — Mỗi tenant hồ sơ riêng** |
| **Q5** (P1) | Nguồn sự thật cho chi nhánh/phòng ban/chức danh/quản lý trực tiếp? | A. Core canonical.<br>B. Plugin nhập, đồng bộ Core.<br>C. Hai nguồn độc lập. | **B — Plugin nhập, đồng bộ Core** |
| **Q6** (P1) | Plugin cài mặc định hay tùy chọn? | A. Optional marketplace.<br>B. Default install, unlocked.<br>C. Always-on, không gỡ. | **C — Always-on** |

### 4.2. Vòng đời & phân công (Q7–Q12)

| # | Câu hỏi | Phương án & khuyến nghị | Trả lời |
| :--- | :--- | :--- | :--- |
| **Q7** (P1) | Mã nhân viên tạo thế nào? | A. Auto `NV` + 5 số/tenant.<br>B. Nhập tay.<br>C. Auto mặc định + cho nhập tay; bất biến sau kích hoạt. | **C — Auto + cho nhập tay** |
| **Q8** (P1) | Bộ trạng thái lao động v1? | A. `DRAFT → PROBATION → ACTIVE → SUSPENDED → LEFT` (+ `RETIRED`).<br>B. Chỉ `ACTIVE/INACTIVE`.<br>C. Tenant tự định nghĩa. | **A — Draft/Probation/Active/Suspended/Left** |
| **Q9** (P1) | Có quản lý các mốc ngày nào? | A. `hire_date`, `probation_end_date`, `official_date`, `exit_date`, `exit_reason`.<br>B. Chỉ hire/exit.<br>C. Thêm `contract_start_date`/`contract_end_date`. | **C — Thêm ngày hợp đồng** |
| **Q10** (P2) | Lịch sử thay đổi công việc/trạng thái? | A. Chỉ hiện tại + audit.<br>B. Hiện tại + lịch sử append-only.<br>C. Effective-dated/future-dated đầy đủ. | **C — Effective-dated đầy đủ** |
| **Q11** (P1) | Nghỉ việc xử lý tài khoản thế nào? | A. Offboard + tùy chọn khóa.<br>B. Tự động khóa tài khoản + gỡ quyền.<br>C. Không liên quan tài khoản. | **B — Tự động khóa + gỡ quyền** |
| **Q12** (P2) | Rehire xử lý thế nào? | A. Dùng lại hồ sơ/mã cũ.<br>B. Tạo hồ sơ/mã mới.<br>C. Không hỗ trợ v1. | **A — Dùng lại hồ sơ/mã** |

### 4.3. Dữ liệu nhân viên (Q13–Q19)

**Q13 (P1) — Nhóm dữ liệu v1: “Đúng đề xuất”.**

| Nhóm | Ví dụ | v1 | Độ nhạy cảm |
| :--- | :--- | :--- | :--- |
| Định danh | Họ tên, ảnh, ngày sinh, giới tính, quốc tịch, hôn nhân | Có | Trung bình |
| Liên hệ | Email công ty/cá nhân, phone, địa chỉ hiện tại/thường trú | Có | Trung bình |
| Công việc | Chi nhánh, phòng ban, chức danh, quản lý, loại lao động, ngày tháng | Có | Thấp |
| Liên hệ khẩn cấp | Tên, quan hệ, phone | Có | Trung bình |
| Giấy tờ | CCCD/hộ chiếu, ngày cấp, nơi cấp | Có | **Cao** |
| Thuế/BHXH/BHYT | Mã số thuế, số BHXH, số BHYT | Có | **Cao** |
| Học vấn | Trình độ, trường, chuyên ngành, năm tốt nghiệp | Có | Thấp |
| Hợp đồng | Loại, số, ngày hiệu lực/hết hạn (tối thiểu) | Có | Trung bình |
| Ngân hàng | Ngân hàng, số tài khoản, chủ tài khoản | Phase 2 | **Cao** |
| Gia đình/người phụ thuộc | Vợ/chồng, con, người phụ thuộc | Phase 2 | **Cao** |
| Kinh nghiệm/chứng chỉ | Quá trình làm việc, chứng chỉ | Phase 2 | Thấp |
| Tài liệu | Scan CCCD/hợp đồng/bằng cấp | **Có** (Q17) | **Cao** |
| Kỹ năng | Kỹ năng, đánh giá | Phase 2 | Thấp |
| Lương/phụ cấp | Lương, phụ cấp, BHXH | Ngoài scope | **Rất cao** |

| # | Câu hỏi | Phương án & khuyến nghị | Trả lời |
| :--- | :--- | :--- | :--- |
| **Q14** (P1) | Có đồng bộ họ tên/phone/avatar giữa hồ sơ HR và `user_profiles`? | A. Không tự đồng bộ.<br>B. Một chiều HR → tài khoản.<br>C. Hai chiều. | **A — Không tự đồng bộ** |
| **Q15** (P1) | Chức danh và phòng ban lấy từ đâu? | A. Core dept + text/catalog `JOB_TITLE`.<br>B. Cả hai từ catalog.<br>C. Tất cả nhập tay. | **A — Core dept + text/catalog** |
| **Q16** (P2) | Danh bạ/org chart mức nào? | A. Danh bạ + org chart cơ bản.<br>B. Chỉ danh bạ.<br>C. Org chart đầy đủ. | **C — Org chart đầy đủ** |
| **Q17** (P2) | Tài liệu đính kèm trong v1? | A. Không, phase 2.<br>B. Upload cơ bản.<br>C. Đầy đủ phân loại/quyền/version/scan/retention. | **C — Đầy đủ phân loại/quyền** |
| **Q18** (P2) | Trường tùy chỉnh theo tenant? | A. Không, schema cố định.<br>B. JSONB custom fields.<br>C. Dynamic form đầy đủ. | **A — Không, schema cố định** |
| **Q19** (P2) | Import/export CSV mức nào? | A. Import + export cơ bản.<br>B. Chỉ import.<br>C. Import/export đầy đủ. | **A — Import + export cơ bản** |

### 4.4. Tự phục vụ (Q20–Q25)

| # | Câu hỏi | Phương án & khuyến nghị | Trả lời |
| :--- | :--- | :--- | :--- |
| **Q20** (P1) | Nhân viên được sửa trường nào? | A. Allowlist cố định.<br>B. Tenant tự cấu hình allowlist.<br>C. Tất cả trừ job/status. | **B — Tenant tự cấu hình** |
| **Q21** (P1) | Áp dụng ngay hay gửi duyệt? | A. Áp dụng ngay tất cả.<br>B. Tất cả gửi HR duyệt.<br>C. Hybrid: ngay + duyệt. | **C — Hybrid: ngay + duyệt** |
| **Q22** (P1) | Ai duyệt đề xuất? | A. HR Admin, một cấp.<br>B. Quản lý → HR.<br>C. Cấu hình nhiều cấp. | **C — Cấu hình nhiều cấp** |
| **Q23** (P2) | Self-onboarding trước ngày vào làm? | A. Không v1.<br>B. Có, link mời tự điền. | **B — Có, link mời tự điền** |
| **Q24** (P2) | Chiến dịch yêu cầu cập nhật hàng loạt? | A. Không v1.<br>B. Có, thông báo + theo dõi. | **B — Có, thông báo + theo dõi** |
| **Q25** (P1) | Mobile hỗ trợ gì? | A. Xem + sửa + gửi đề xuất.<br>B. Chỉ xem.<br>C. Không làm mobile v1. | **A — Xem + sửa + gửi đề xuất** |

### 4.5. Phân quyền & bảo mật (Q26–Q29)

| # | Câu hỏi | Phương án & khuyến nghị | Trả lời |
| :--- | :--- | :--- | :--- |
| **Q26** (P1) | Vai trò và phạm vi quản trị? | A. Tenant/HR full; Branch/Manager read; Employee self.<br>B. Branch Manager được sửa.<br>C. Chỉ HR cấp tenant. | **A — Tenant/HR full, branch read** |
| **Q27** (P1) | Trường nhạy cảm ai được xem? | A. Phân nhóm + mask + audit.<br>B. Ai có quyền read xem hết.<br>C. Chỉ self + Tenant Owner. | **A — Phân nhóm + mask + audit** |
| **Q28** (P2) | Xuất dữ liệu có quyền riêng? | A. Quyền riêng, bỏ nhạy cảm.<br>B. Dùng chung quyền read.<br>C. Không cho xuất. | **A — Quyền riêng, bỏ nhạy cảm** |
| **Q29** (P1) | Mức tuân thủ bảo vệ dữ liệu cá nhân? | A. Cơ bản.<br>B. Đầy đủ ngay Sprint 07.<br>C. Chưa làm gì. | **B — Đầy đủ ngay Sprint 07** |

### 4.6. Phạm vi & ưu tiên (Q30)

| # | Câu hỏi | Phương án & khuyến nghị | Trả lời |
| :--- | :--- | :--- | :--- |
| **Q30** (P1) | Chốt phạm vi Sprint 07 | A. Tập trung v1.<br>B. Thêm danh bạ/org chart/import.<br>C. Có must-have khác. | **B — Thêm danh bạ/org chart/import** |

### 4.7. Câu hỏi phát sinh do scope mở rộng (Q31–Q38)

Các câu này cần trả lời trước khi chuyển Architect. Chưa có câu trả lời.

| # | Câu hỏi | Phương án & khuyến nghị | Trả lời |
| :--- | :--- | :--- | :--- |
| **Q31** (P1) | Cách chia phase cho scope đã mở rộng? | A. Hai phase trong Sprint 07.<br>B. **Làm tất cả cùng lúc trong Sprint 07.**<br>C. Tách extended sang Sprint 08. | **B — Làm tất cả cùng lúc** |
| **Q32** (P1) | Effective-dated cần những gì? | A. **Future-dated + as-of + sửa hồi tố có lý do/audit.**<br>B. Future-dated + as-of, không sửa hồi tố.<br>C. Chỉ as-of/lịch sử, không future-dated. | **A — Future + as-of + hồi tố** |
| **Q33** (P1) | Quy tắc đa phân công? | A. **Quản lý theo từng phân công; hợp đồng chung; một phân công chính.**<br>B. Một quản lý chung; hợp đồng chung.<br>C. Quản lý + hợp đồng theo phân công. | **A — Quản lý theo phân công** |
| **Q34** (P1) | Offboarding tự động khóa/gỡ quyền xử lý thế nào? | A. **Chặn nếu còn cấp dưới; xác nhận rồi khóa tài khoản + gỡ tenant membership/roles; hồ sơ giữ; rehire mời lại.**<br>B. Tự chuyển cấp dưới lên quản lý kế cấp.<br>C. Chỉ khóa tài khoản, giữ membership read-only. | **A — Chặn nếu còn cấp dưới** |
| **Q35** (P1) | Always-on ở mức nào? | A. **Không gỡ/tắt; tenant được ẩn menu; text fallback nếu thiếu catalog.**<br>B. Luôn hiện menu, không cho ẩn.<br>C. Always-on nhưng được tắt runtime. | **A — Không gỡ, được ẩn menu** |
| **Q36** (P1) | Mô hình duyệt nhiều cấp? | A. **Tuần tự theo nhóm trường/phòng ban; một người duyệt mỗi cấp; delegation/reminder.**<br>B. Song song, một người duyệt là đủ.<br>C. Tự do theo employee. | **A — Tuần tự theo nhóm trường** |
| **Q37** (P1) | Phạm vi tài liệu? | A. HR upload + version + scan; nhân viên chỉ xem/tải của mình.<br>B. **Nhân viên được upload tài liệu của mình (có duyệt).**<br>C. Chỉ upload, không version/scan. | **B — Nhân viên được upload** |
| **Q38** (P1) | Privacy đầy đủ trong Sprint 07 hay tách? | A. **Giữ đầy đủ trong Sprint 07** (consent, DSAR, breach, retention); cần legal review.<br>B. Core privacy trong S07; DSAR/breach sprint riêng.<br>C. Tách toàn bộ compliance. | **A — Giữ đầy đủ trong Sprint 07** |

### 4.8. Tách plugin Chi nhánh/Phòng ban khỏi Core (Q39–Q46, Q53–Q54)

Phân tích chi tiết: [ANL-S07-003](../02_analysis/03_ANL-S07-003_organization_plugin_extraction.md). Đã trả lời; **Q53/Q54 điều chỉnh Q40/Q41**.

| # | Câu hỏi | Phương án & khuyến nghị | Trả lời |
| :--- | :--- | :--- | :--- |
| **Q39** (P1) | Một plugin `organization` hay tách `branch` + `department`? | A. **Một plugin `organization`.**<br>B. Hai plugin `branch` và `department`.<br>C. Chỉ tách branch. | **A — Một plugin organization** |
| **Q40** (P1) | Tách ở mức nào? | A. **Toàn bộ**: branch, department, access membership; employee giữ HR assignment.<br>B. Chỉ master data branch/department.<br>C. Chỉ branch. | **A — Tách toàn bộ**, chốt lại bởi Q53/Q54: organization giữ access membership, employee giữ HR assignment |
| **Q41** (P1) | Nguồn sự thật phân công sau khi tách? | A. **Hai lớp: organization giữ access membership; employee giữ HR assignment.**<br>B. Employee sở hữu toàn bộ assignment.<br>C. Cả hai. | **A — Hai lớp (org access + employee HR)** |
| **Q42** (P1) | Core data scope lấy dữ liệu tổ chức từ đâu? | A. **Projection table trong Core, merge organization access + employee HR.**<br>B. Core giữ membership/assignment.<br>C. Core gọi plugin mỗi request.<br>D. Nhét scope vào JWT. | **A — Projection table** |
| **Q43** (P1) | Migration dữ liệu hiện hữu? | A. Big-bang cutover.<br>B. **Strangler/dual-write.**<br>C. Giữ Core tables. | **A — Big-bang** (đã chấp nhận rủi ro; cần backup/rollback) |
| **Q44** (P1) | Organization plugin cài thế nào? | A. **Always-on**, không gỡ.<br>B. Default install, unlocked.<br>C. Optional marketplace. | **A — Always-on** |
| **Q45** (P1) | API/UI/quyền tương thích? | A. Giữ API path + alias quyền.<br>B. **Đổi namespace hoàn toàn.**<br>C. Giữ UI Core. | **B — Đổi namespace hoàn toàn** |
| **Q46** (P1) | Entity Registry? | A. Giữ tên entity + alias.<br>B. **Đổi tên entity mới.**<br>C. Đăng ký cả hai. | **B — Đổi tên entity mới** |
| **Q53** (P1) | Q40/Q41 chồng nhau: hai lớp phân công hay employee duy nhất? | A. **Hai lớp: organization access; employee HR assignment.**<br>B. Employee assignment duy nhất.<br>C. Organization sở hữu tất cả. | **A — Hai lớp phân công** |
| **Q54** (P1) | Tenant member không phải nhân viên lấy scope từ đâu? | A. **Organization giữ access membership cho non-employee.**<br>B. Non-employee không có scope.<br>C. Employee giữ tất cả assignment. | **A — Organization giữ access membership** |

**Mô hình chốt:** `organization` plugin = branch/department **master data**; `employee` plugin = **assignment duy nhất** cho mọi tenant member (kể cả non-employee); Core = projection read model do employee plugin cập nhật. Employee plugin phải always-on; Core data scope phụ thuộc employee plugin.

### 4.9. Switch tenant trên header (Q47–Q52)

Phân tích chi tiết: [ANL-S07-004](../02_analysis/04_ANL-S07-004_tenant_switcher_header.md). Đã trả lời.

| # | Câu hỏi | Phương án & khuyến nghị | Trả lời |
| :--- | :--- | :--- | :--- |
| **Q47** (P1) | Đặt switcher ở đâu? | A. Core/shared TopBar.<br>B. **Header contribution của plugin employee.**<br>C. Cả hai. | **B — Trong plugin employee** (dùng shared component + auth Core) |
| **Q48** (P1) | Cơ chế switch? | A. **Endpoint mới `POST /api/v1/auth/switch-tenant`.**<br>B. Quay lại `select-tenant`.<br>C. Chỉ đổi tenant_id ở client. | **A — Endpoint switch-tenant** |
| **Q49** (P1) | Session policy khi switch? | A. **Thu hồi session cũ; một tenant active/device.**<br>B. Nhiều tab nhiều tenant session.<br>C. Giữ token cũ đến hết hạn. | **A — Thu hồi session cũ** |
| **Q50** (P2) | UX danh sách tenant? | A. **Dropdown + search + tenant gần nhất + trạng thái.**<br>B. Dropdown đơn giản.<br>C. Trang riêng. | **A — Dropdown + search + gần nhất** |
| **Q51** (P2) | Unsaved changes khi switch? | A. **Guard + confirm.**<br>B. Auto-save draft.<br>C. Discard ngay. | **A — Guard + confirm** |
| **Q52** (P1) | Invalidate gì sau switch? | A. **Clear cache/tenant state/plugin session/UI manifest, reload quyền + employee.**<br>B. Chỉ thay token.<br>C. Chỉ reload trang. | **A — Clear toàn bộ tenant state** |

### 4.10. Offboarding guard (Q55)

| # | Câu hỏi | Phương án & khuyến nghị | Trả lời |
| :--- | :--- | :--- | :--- |
| **Q55** (P1) | Tự động khóa/gỡ quyền khi nghỉ có thể khóa owner/admin cuối cùng. Chặn thế nào? | A. **Chặn nếu là owner/admin cuối cùng hoặc có platform role; yêu cầu chuyển quyền trước.**<br>B. Cho phép, chỉ cảnh báo.<br>C. Không tự gỡ membership; chỉ khóa tài khoản. | **A — Chặn last owner/admin + platform role** |

## 5. Tổng hợp quyết định

| # | Quyết định | Chốt | Ngày/nguồn |
| :--- | :--- | :--- | :--- |
| Q1 | Employee tách khỏi tenant member, liên kết tùy chọn | **A** | 2026-10-29, interactive |
| Q2 | Hỗ trợ nhân viên không tài khoản | **A** | 2026-10-29, interactive |
| Q3 | Một hồ sơ, nhiều phân công | **A** | 2026-10-29, interactive |
| Q4 | Mỗi tenant hồ sơ riêng | **A** | 2026-10-29, interactive |
| Q5 | Plugin nhập phân công, đồng bộ Core | **B** | 2026-10-29, interactive |
| Q6 | Always-on | **C** | 2026-10-29, interactive |
| Q7 | Auto + cho nhập mã tay | **C** | 2026-10-29, interactive |
| Q8 | Draft/Probation/Active/Suspended/Left | **A** | 2026-10-29, interactive |
| Q9 | Thêm ngày hợp đồng | **C** | 2026-10-29, interactive |
| Q10 | Effective-dated đầy đủ | **C** | 2026-10-29, interactive |
| Q11 | Tự động khóa tài khoản + gỡ quyền | **B** | 2026-10-29, interactive |
| Q12 | Rehire dùng lại hồ sơ/mã | **A** | 2026-10-29, interactive |
| Q13 | Nhóm dữ liệu đúng đề xuất | **Đúng đề xuất** | 2026-10-29, interactive |
| Q14 | Không tự đồng bộ hồ sơ tài khoản | **A** | 2026-10-29, interactive |
| Q15 | Core dept + text/catalog job title | **A** | 2026-10-29, interactive |
| Q16 | Org chart đầy đủ | **C** | 2026-10-29, interactive |
| Q17 | Tài liệu đầy đủ | **C** | 2026-10-29, interactive |
| Q18 | Không custom fields | **A** | 2026-10-29, interactive |
| Q19 | Import + export cơ bản | **A** | 2026-10-29, interactive |
| Q20 | Tenant tự cấu hình allowlist | **B** | 2026-10-29, interactive |
| Q21 | Hybrid áp dụng ngay + duyệt | **C** | 2026-10-29, interactive |
| Q22 | Duyệt nhiều cấp cấu hình | **C** | 2026-10-29, interactive |
| Q23 | Self-onboarding | **B** | 2026-10-29, interactive |
| Q24 | Chiến dịch cập nhật hàng loạt | **B** | 2026-10-29, interactive |
| Q25 | Mobile xem + sửa + gửi đề xuất | **A** | 2026-10-29, interactive |
| Q26 | Tenant/HR full; Branch/Manager read | **A** | 2026-10-29, interactive |
| Q27 | Phân nhóm + mask + audit | **A** | 2026-10-29, interactive |
| Q28 | Quyền export riêng, bỏ nhạy cảm | **A** | 2026-10-29, interactive |
| Q29 | Privacy đầy đủ ngay Sprint 07 | **B** | 2026-10-29, interactive |
| Q30 | Thêm danh bạ/org chart/import | **B** | 2026-10-29, interactive |
| Q31 | Làm tất cả cùng lúc, không chia phase | **B** | 2026-10-30, interactive |
| Q32 | Future-dated + as-of + sửa hồi tố | **A** | 2026-10-30, interactive |
| Q33 | Quản lý theo từng phân công | **A** | 2026-10-30, interactive |
| Q34 | Chặn offboard nếu còn cấp dưới | **A** | 2026-10-30, interactive |
| Q35 | Always-on, được ẩn menu | **A** | 2026-10-30, interactive |
| Q36 | Duyệt tuần tự theo nhóm trường | **A** | 2026-10-30, interactive |
| Q37 | Nhân viên được upload tài liệu | **B** | 2026-10-30, interactive |
| Q38 | Privacy đầy đủ trong Sprint 07 | **A** | 2026-10-30, interactive |
| Q39 | Một plugin organization | **A** | 2026-10-30, interactive |
| Q40 | Tách toàn bộ | **A** (Q53/Q54 điều chỉnh assignment) | 2026-10-30, interactive |
| Q41 | Hai lớp: organization access + employee HR | **A** | 2026-10-30, interactive |
| Q42 | Core dùng projection table | **A** | 2026-10-30, interactive |
| Q43 | Migration big-bang | **A** | 2026-10-30, interactive (rủi ro chấp nhận) |
| Q44 | Organization always-on | **A** | 2026-10-30, interactive |
| Q45 | Đổi namespace hoàn toàn | **B** | 2026-10-30, interactive |
| Q46 | Đổi tên entity mới | **B** | 2026-10-30, interactive |
| Q47 | Switcher trong plugin employee | **B** | 2026-10-30, interactive |
| Q48 | Endpoint switch-tenant | **A** | 2026-10-30, interactive |
| Q49 | Thu hồi session cũ | **A** | 2026-10-30, interactive |
| Q50 | Dropdown + search + gần nhất | **A** | 2026-10-30, interactive |
| Q51 | Guard + confirm | **A** | 2026-10-30, interactive |
| Q52 | Clear toàn bộ tenant state | **A** | 2026-10-30, interactive |
| Q53 | Hai lớp phân công | **A** | 2026-10-30, interactive |
| Q54 | Organization giữ access membership cho non-employee | **A** | 2026-10-30, interactive |
| Q55 | Chặn last owner/admin + platform role khi offboard | **A** | 2026-10-30, interactive |

## 6. Rủi ro & giảm thiểu

> **Rủi ro đã được chấp nhận (2026-10-30):** làm tất cả cùng lúc (Q31), big-bang migration (Q43), đổi namespace/entity hoàn toàn (Q45/Q46), privacy đầy đủ trong Sprint 07 (Q38), tài liệu full (Q37), switcher trong employee header (Q47). Đây **không còn là blocker quyết định**, nhưng phải có mitigation/QA tương ứng.

| Rủi ro | Mức | Giảm thiểu |
| :--- | :--- | :--- |
| Scope mở rộng + Q31 all-at-once | **Critical** | Baseline/AC rõ; phase kỹ thuật nội bộ; QA regression; báo cáo rủi ro tiến độ |
| Effective-dated sai logic (overlap, future-dated, hồi tố) | **High** | Ràng buộc khoảng hiệu lực ở DB; test as-of/future/overlap; audit lý do sửa hồi tố |
| Offboarding tự động gỡ quyền làm mất báo cáo/cấp dưới | **High** | Q34/Q55; chặn nếu còn cấp dưới hoặc last owner/admin/platform role; chuyển quản lý/quyền trước; audit |
| Tài liệu nhạy cảm bị lộ/không scan | **High** | Virus scan, quyền tải, version, retention, storage profile; test IDOR |
| Duyệt nhiều cấp rối (thứ tự, delegation, conflict) | **High** | Q36; state machine; một người duyệt/cấp; test chuỗi/từ chối/ủy quyền |
| Privacy đầy đủ cần pháp lý | **High** | Q38; legal review; data map; consent/DSAR/breach test; không log nhạy cảm |
| Always-on + catalog dependency | Medium | Q35; text fallback; provisioning/backfill idempotent; chặn gỡ |
| Org chart đầy đủ hiệu năng/đa quan hệ | Medium | Q16; giới hạn độ sâu; lazy load; cache; test tenant lớn |
| Tenant tự cấu hình allowlist sai | Medium | Q20; template mặc định; preview; audit thay đổi cấu hình |
| Mobile write phụ thuộc plugin host | Medium | Xác nhận host trước; fallback read-only; test 390×844 |
| **Lệch hai lớp assignment (org access vs employee HR)** | **High** | Q53/Q54; một chiều sync/API rõ; reconciliation job; audit; test drift |
| Rò rỉ dữ liệu nhạy cảm | **High** | Field-level permission, mask, audit view, test IDOR; không log |
| **Tách organization khỏi Core làm sai/stale data scope** | **Critical** | Q39–Q46; projection + rebuild + test toàn bộ data scope; fail-safe; big-bang backup/rollback |
| **Mất quyền/API/UI do đổi namespace hoàn toàn** | **High** | Q45/Q46; inventory consumer; migration grant; cập nhật frontend/plugin; không alias runtime |
| **Tenant switcher rò rỉ dữ liệu chéo tenant** | **Critical** | Q47–Q52; cấp token mới, thu hồi session cũ, clear cache/plugin; test multi-tab/IDOR |
| **Tenant switcher phụ thuộc employee header** | Medium | Q47; employee always-on; fallback/Core toggle; test plugin lỗi/ẩn |
| **Migration organization big-bang** | **High** | Q43; freeze + backup + rollback drill; count/checksum; QA regression |

## 7. Xác nhận của khách hàng

> **Trạng thái: APPROVED (2026-10-30).** Chủ dự án duyệt scope/AC 0.6; cho phép chuyển Architect. Chưa cấp task/code.

| Vai trò | Xác nhận | Nguồn/ngày |
| :--- | :--- | :--- |
| Khách hàng (Product Owner) | ✅ **ĐÃ DUYỆT scope/AC 1.0** | Chỉ đạo trực tiếp 2026-10-30: “ok duyệt nhé. tiếp tục bước tiếp theo đi” |
| BA Agent (soạn thảo) | Đã ghi nhận, chuyển Architect | 2026-10-30 |

## 8. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Đề xuất scope, 20 AC nháp, 30 câu hỏi; gate Pending | BA Agent; chưa có xác nhận khách hàng |
| 0.2 | 2026-10-29 | Ghi nhận **30/30 câu trả lời**; mở rộng scope/AC; thêm Q31–Q38; gate Pending | BA Agent; hội thoại interactive chủ dự án |
| 0.3 | 2026-10-30 | Ghi nhận **Q31–Q38**: all-at-once, effective-dated đầy đủ, employee upload, privacy đầy đủ; 29 AC; gate Pending | BA Agent; hội thoại interactive |
| 0.4 | 2026-10-30 | Bổ sung **R8 organization plugin** + **R9 tenant switcher**; Q39–Q52; scope S22/S23; AC-30…35; gate Pending | BA Agent; yêu cầu trực tiếp chủ dự án |
| 0.5 | 2026-10-30 | Ghi nhận Q39–Q54: organization master data, employee assignment duy nhất, projection, strangler, đổi namespace/entity; switcher trong employee header; 36 AC; gate Pending | BA Agent; hội thoại interactive |
| 0.6 | 2026-10-30 | Đổi sang **2 lớp assignment** (org access + employee HR); Q53/Q54 revised; thêm **Q55 offboarding guard**; 37 AC; gate Pending | BA Agent; hội thoại interactive |
| **1.0** | 2026-10-30 | **Gate APPROVED** — chủ dự án duyệt scope/AC 0.6; chuyển Architect 05–06 | Chủ dự án; chỉ đạo trực tiếp |
