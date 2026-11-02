# [ANL-S09-001] Phân tích: Plugin Chấm công & Bảng công — Attendance & Timesheet

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S09-001 / Phân tích / Sprint 09 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.2 / 2026-11-02 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S09-001](../01_raw_notes/01_RAW-S09-001_attendance_timesheet_plugin_requirements.md) 0.2, [BENCH-S09-001](../03_benchmarks/01_BENCH-S09-001_attendance_timesheet_benchmarks.md) 0.1 |
| Đọc trước / đọc tiếp | [RAW-S09-001](../01_raw_notes/01_RAW-S09-001_attendance_timesheet_plugin_requirements.md), [BENCH-S09-001](../03_benchmarks/01_BENCH-S09-001_attendance_timesheet_benchmarks.md) / [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) |

## 1. Mục đích và bối cảnh

Tài liệu phân tích yêu cầu thô R1–R4 của [RAW-S09-001](../01_raw_notes/01_RAW-S09-001_attendance_timesheet_plugin_requirements.md) thành user stories, quy tắc nghiệp vụ và ranh giới scope đề xuất, dựa trên bài học đối chuẩn tại [BENCH-S09-001](../03_benchmarks/01_BENCH-S09-001_attendance_timesheet_benchmarks.md). Chủ dự án đọc tài liệu này để trả lời 16 câu hỏi chốt scope tại [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md).

Đối tượng phục vụ: plugin `attendance` (đề xuất tên) — plugin HR thứ hai sau `employee`, cung cấp dữ liệu công cho các plugin lương sau này.

## 2. User Stories

Phân vai: **HR** (Tenant Admin/HR Admin — quản trị chấm công), **Manager** (quản lý trực tiếp của nhân viên), **Employee** (nhân viên có phân công active), **Kiosk** (thiết bị chung tại chi nhánh, không cần tài khoản).

### 2.1. Chấm công (ghi nhận)

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-A01 | As an **Employee**, I want **check in / check out từ web dashboard** so that **ghi nhận giờ làm của tôi mà không cần thiết bị thêm** | Metadata: IP, browser |
| US-A02 | As an **Employee**, I want **check in/out từ mobile app kèm vị trí GPS** so that **chấm công khi đi công tác/không ở văn phòng** | GPS tọa độ lưu vào log |
| US-A03 | As an **Employee**, I want **chấm công qua kiosk chung (mã NV/PIN hoặc QR)** so that **không cần thiết bị riêng** | Không cần tài khoản đăng nhập |
| US-A04 | As an **HR**, I want **chấm công hộ cho nhân viên (nhập log thay nhân viên) kèm lý do** so that **xử lý khi máy lỗi/nhân viên quên** | Audit đầy đủ |
| US-A05 | As an **HR**, I want **import log chấm công từ máy vân tay (file) và nhận log qua API push từ middleware** so that **tận dụng thiết bị hiện có của tenant** | ZKTeco qua BioTime |
| US-A06 | As an **Employee**, I want **thấy trạng thái đang check-in/out ngay trên dashboard + lịch sử chấm của mình** so that **biết mình đã chấm đúng chưa** | Widget chấm công |
| US-A07 | As a **System**, I want **phát hiện check-in treo (không check-out quá X giờ)** so that **đánh dấu lỗi cho HR xử lý** | Job định kỳ multi-tenant |

### 2.2. Ca làm việc & lịch

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-S01 | As an **HR**, I want **định nghĩa ca làm việc (giờ vào/ra, grace trước/sau, break, tính chất ca đêm)** so that **tính công theo đúng quy chế từng nhóm nhân viên** | Q3: cấu trúc ca ở đâu |
| US-S02 | As an **HR**, I want **gán ca cho nhân viên/phòng ban theo tuần hoặc lịch cố định** so that **hệ thống biết ai phải làm ca nào** | Kế thừa organization |
| US-S03 | As an **HR**, I want **khai báo ngày lễ/nghỉ của tenant** so that **hệ không tính vắng mặt vào ngày nghỉ** | Lịch nghỉ theo tenant/nước |
| US-S04 | As an **Employee**, I want **xem lịch làm việc của mình** so that **biết ca của mình tuần này** | Mobile + web |

### 2.3. Tính công (quy đổi)

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-C01 | As a **System**, I want **tự động quy đổi log + ca → công ngày (Present/Absent/Half Day/WFH/On Leave, giờ làm, muộn/về sớm, OT)** so that **HR không tổng hợp tay** | Tolerance cấu hình |
| US-C02 | As an **HR**, I want **chỉnh kết quả công ngày (ghi đè) kèm lý do** so that **xử lý ngoại lệ** | Audit + trạng thái chỉnh tay |
| US-C03 | As an **HR**, I want **cấu hình tolerance và quy tắc tính công (muộn bao nhiêu phút bị tính, OT tối thiểu)** so that **đúng chính sách từng tenant** | BENCH L04 |
| US-C04 | As an **HR**, I want **chọn cách tính công hưởng lương (chuẩn − nghỉ không lương hoặc tổng công thực tế)** so that **khớp quy chế lương** | MISA pattern |

### 2.4. Sửa công & duyệt (regularization)

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-R01 | As an **Employee**, I want **gửi yêu cầu bổ sung/sửa công (quên chấm, chấm sai) kèm lý do** so that **công của tôi đúng thực tế** | Có deadline/cửa sổ gửi |
| US-R02 | As a **Manager**, I want **duyệt/từ chối yêu cầu sửa công của nhân viên** so that **kiểm soát tính chính xác** | Inbox duyệt; có thể qua workflow engine |
| US-R03 | As an **HR**, I want **nhập hộ kết quả yêu cầu được duyệt vào công ngày** so that **dữ liệu nhất quán** | Tự động sau duyệt |

### 2.5. Bảng công kỳ & chốt

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-T01 | As an **HR**, I want **tạo bảng công tổng hợp theo kỳ (tháng) + đơn vị/phòng ban** so that **tổng hợp công phục vụ lương** | MISA/Base pattern |
| US-T02 | As an **HR**, I want **xem/chỉnh bảng công ở dạng grid nhân viên × ngày** so that **rà soát nhanh** | High-density ERP grid |
| US-T03 | As an **HR**, I want **gửi bảng công cho nhân viên xác nhận và theo dõi trạng thái xác nhận** so that **minh bạch với nhân viên trước khi chốt** | Q11 |
| US-T04 | As an **Employee**, I want **xác nhận/từ chối bảng công của mình kèm ghi chú** so that **bảo vệ quyền lợi của mình** | Từ chối → HR sửa lại |
| US-T05 | As an **HR**, I want **chốt bảng công (khóa dữ liệu)** so that **dữ liệu lương không bị thay đổi sau chốt** | Chỉ Admin mở khóa |
| US-T06 | As an **HR**, I want **xuất bảng công ra Excel/CSV với cột payroll-ready** so that **bàn giao cho phần mềm/kế toán lương** | Q12: cột cấu hình được |
| US-T07 | As a **Manager**, I want **xem báo cáo công của team (muộn/OT/nghỉ/theo thành viên)** so that **quản lý kỷ luật và năng suất** | Phạm vi data scope |
| US-T08 | As an **HR**, I want **báo cáo tổng hợp toàn tenant: attendance rate, top muộn, OT theo phòng ban, xu hướng** so that **ra quyết định chính sách** | Q12 |

### 2.6. Tích hợp & mobile

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-I01 | As an **Employee**, I want **nhận thông báo nhắc quên check-out, nhắc xác nhận bảng công, kết quả duyệt sửa công** so that **không bỏ sót thao tác bắt buộc** | Notification plugin |
| US-I02 | As an **Employee (Mobile Ionic)**, I want **chấm công GPS, xem lịch + công cá nhân, gửi yêu cầu sửa công, xác nhận bảng công** so that **thao tác trên điện thoại** | Q15 |
| US-I03 | As an **Employee**, I want **plugin nghỉ phép ghi trạng thái nghỉ vào công của tôi** so that **công đúng khi tôi nghỉ phép** | Q14 — phụ thuộc leave |

## 3. Ranh giới scope đề xuất (chờ CONF duyệt)

### 3.1. In-Scope đề xuất

- Plugin `attendance` độc lập: log chấm công (đa nguồn), công ngày, bảng công kỳ, chốt, xuất, báo cáo, cấu hình quy tắc.
- Chấm: web clock, mobile GPS (tọa độ), kiosk mã NV/PIN, chấm hộ, import file + API push từ middleware máy chấm công.
- Ca: cấu trúc ca đầy đủ trong plugin (giờ vào/ra, grace, break, ca đêm qua ngày) + gán ca theo nhân viên/phòng ban + ngày lễ tenant.
- Tính: auto quy đổi theo tolerance cấu hình; chỉnh tay có audit; 2 cách tính công hưởng lương.
- Regularization: yêu cầu sửa công → duyệt (manager/HR).
- Bảng công: tổng hợp theo kỳ + đơn vị; grid nhân viên × ngày; gửi xác nhận; chốt/khóa; xuất Excel payroll-ready.
- Báo cáo: cá nhân, team, toàn tenant.
- Thông báo: nhắc check-out, kết quả duyệt, chờ xác nhận công.
- Mobile Ionic: chấm GPS + xem lịch/công + gửi yêu cầu + xác nhận công.

### 3.2. Out-of-Scope đề xuất (backlog)

- **Tính lương / bảo hiểm / thuế** — plugin payroll sau này nhận dữ liệu xuất từ attendance.
- **Plugin nghỉ phép (leave) đầy đủ** — đề xuất xử lý theo câu trả lời Q14 (nếu để sau: attendance có "chỗ cắm" trạng thái nghỉ + nhập ngày nghỉ tay từ HR).
- Nhận diện khuôn mặt / sinh trắc học — cần hạ tầng ML riêng (backlog).
- Geofence chặn cứng (chỉ cho phép chấm trong bán kính) — v1 đề xuất chỉ **lưu GPS + hiển thị**, chặn cứng nếu khách duyệt (Q2).
- Quản lý ca kíp xoay vòng phức tạp / tối ưu lịch (scheduling optimization) — backlog.
- Chấm công qua lệnh thoại/Zalo — không phù hợp phạm vi.

## 4. Quy tắc nghiệp vụ đề xuất (BR)

| ID | Quy tắc | Nguồn |
| :--- | :--- | :--- |
| BR-A01 | Log chấm công là append-only: không sửa nội dung log; xóa/nhập hộ chỉ bởi HR/Manager kèm lý do, ghi audit | BENCH L01 |
| BR-A02 | Một nhân viên tại một thời điểm chỉ có **một check-in đang mở**; check-in mới khi chưa đóng → hệ tự đóng log treo trước đó và đánh dấu lỗi nếu vượt ngưỡng | Frappe/Odoo |
| BR-A03 | Công ngày duy nhất theo (nhân viên, ngày, ca); nhiều ca/ngày được phép nếu ca không chồng lấn | Frappe validation |
| BR-A04 | Tính muộn: giờ vào hiệu dụng − giờ vào ca, trừ grace "thiên về nhân viên"; tính về sớm tương tự; kết quả làm tròn theo cấu hình | Odoo/BENCH L04 |
| BR-A05 | OT = giờ làm vượt giờ ca, trừ grace "thiên về công ty"; chỉ tính khi log đủ cặp vào/ra; OT có thể yêu cầu duyệt riêng theo cấu hình | Odoo, Q8 |
| BR-A06 | Ngày lễ tenant + ngày trong lịch nghỉ → không tính vắng mặt; ca gán vào ngày lễ chỉ tính khi có làm thực tế | Frappe holiday |
| BR-A07 | Ca đêm qua ngày: ca có giờ ra nhỏ hơn giờ vào → công ngày gán về ngày bắt đầu ca | Frappe shift |
| BR-A08 | Công ngày có trạng thái chỉnh tay (override) thì auto job không ghi đè; chỉ update job theo cấu hình mới tính lại khi được yêu cầu | Base "cập nhật" |
| BR-A09 | Yêu cầu sửa công chỉ gửi trong cửa sổ thời gian cấu hình (số ngày lùi tối đa); sau khi bảng công chốt → không nhận yêu cầu nữa | Q9/Q10 |
| BR-A10 | Bảng công kỳ có chuỗi trạng thái 1 chiều: Draft → Đang xác nhận → Chốt; chốt sau đó chỉ Admin mở khóa (ghi audit); dữ liệu bị khóa không sửa được (trừ reopen có audit) | Base L09 |
| BR-A11 | Chuyển trạng thái bảng công không bắt buộc 100% nhân viên xác nhận (HR được chốt khi quá hạn xác nhận, đánh dấu ai chưa xác nhận) | MISA 2.5 |
| BR-A12 | Mọi dữ liệu plugin mang tenant_id đã xác thực; phân quyền đọc/ghi theo data scope (tenant/chi nhánh/phòng ban) + vai trò; employee của tenant khác không bao giờ thấy nhau | Guardrail |
| BR-A13 | Mọi thông báo đi qua notification plugin (Sprint 06); mọi sự kiện nghiệp vụ phát qua outbox cho plugin khác tiêu thụ (payroll sau này) | Sprint 06/08 pattern |
| BR-A14 | Kiosk không có tài khoản: xác thực bằng mã NV + PIN cấu hình; PIN không lưu plaintext; kiosk gắn vào chi nhánh | BENCH L02, bảo mật |

## 5. Edge cases cần thiết kế (bước 05–06)

| # | Tình huống | Đề xuất xử lý |
| :--- | :--- | :--- |
| E01 | Check-in 23:50 ngày 01, check-out 07:10 ngày 02 (ca đêm) | Công ngày 01 theo BR-A07 |
| E02 | Nhân viên có 2 log vào liên tiếp không có ra giữa | Hệ tự đóng log đầu tại thời điểm log sau; đánh dấu cần HR rà |
| E03 | Gán ca đổi giữa kỳ (từ 15/11 đổi ca) | Công ngày tính theo ca hiệu lực từng ngày; bảng công tổng hợp lại khi bấm "cập nhật" |
| E04 | Nhân viên nghỉ việc giữa kỳ | Công tính tới ngày nghỉ việc; bảng công vẫn hiển thị đến ngày đó |
| E05 | Import file máy vân tay trùng log đã có | Idempotent theo (nguồn, mã thiết bị, thời gian, mã NV); trùng bỏ qua, báo cáo số dòng bỏ |
| E06 | Check-in khi chưa được gán ca ngày đó | Dùng ca mặc định của tenant (nếu cấu hình); ngược lại đánh dấu "chưa xác định ca" chờ HR |
| E07 | Xóa/phục hồi phân công active của employee trong kỳ | Bảng công giữ lịch sử công đã tính; cảnh báo HR |
| E08 | Chốt bảng công rồi phát hiện sai | Admin mở khóa (audit) → sửa → chốt lại; version/audit đầy đủ |
| E09 | Hai yêu cầu sửa công cùng ngày trùng nhau | Chỉ 1 yêu cầu pending/ngày/người; cái sau bị chặn |
| E10 | Máy tenant chưa cấu hình ca nào | Wizard cấu hình ban đầu + ca mặc định seed; không cho bật plugin khi chưa có ca |

## 6. Câu hỏi chuyển sang CONF

16 câu hỏi tại [RAW-S09-001 §6](../01_raw_notes/01_RAW-S09-001_attendance_timesheet_plugin_requirements.md) được chuẩn hóa thành 16 câu tương tác tại [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md), chia 4 nhóm: (A) phương thức chấm & chống gian lận — Q1–Q4, (B) ca & tính công — Q5–Q8, (C) sửa công & bảng công kỳ — Q9–Q12, (D) tích hợp, mobile & thông báo — Q13–Q16.

**Cập nhật 0.2** — theo phản hồi chủ dự án *"sprint 9 còn thiếu phần tạo các loại đơn phù hợp cho nghiệp vụ"*, phân tích bổ sung **module Đơn từ** (chốt tại CONF Q17/Q18): loại đơn = bộ ba (định danh + form definition từ form builder Sprint 08 + workflow definition từ workflow engine Sprint 08); 6 loại chuẩn seed (LEAVE, OVERTIME, ATTENDANCE_FIX, LATE_EARLY, BUSINESS_TRIP, SHIFT_SWAP) + tenant tự tạo loại mới (không mapping tự động — chỉ duyệt + lưu kết quả); US bổ sung:

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-Đ01 | As an **HR**, I want **seed 6 loại đơn chuẩn gắn form + luồng duyệt mặc định** so that **tenant dùng ngay khi bật plugin** | Q17 |
| US-Đ02 | As an **HR**, I want **tạo loại đơn mới (form builder + luồng engine) và bật/tắt** so that **đáp ứng nghiệp vụ riêng** | Q17/Q18; loại mới không auto-mapping |
| US-Đ03 | As an **Employee**, I want **nộp đơn từ mẫu loại đơn và theo dõi tiến trình duyệt** so that **thủ tục minh bạch** | Trạng thái theo engine |
| US-Đ04 | As a **System**, I want **mapping kết quả duyệt loại chuẩn → dữ liệu attendance (công, dư phép, OT, ca)** so that **không nhập tay sau duyệt** | AC-Đ04 |

Các điểm rủi ro kiến trúc cần chủ dự án lưu ý khi trả lời:
- **Q3 (cấu trúc ca)**: nâng cấp danh mục SHIFT catalog thay đổi nghĩa của danh mục hiện có; tạo cấu trúc ca riêng trong plugin giữ catalog nguyên trạng nhưng sinh 2 nguồn sự thật về "ca".
- **Q9 (duyệt sửa công qua workflow engine)**: phụ thuộc Sprint 08 đang In Review design — nếu dùng phải chờ engine ổn định hoặc làm cơ chế duyệt đơn giản nội bộ plugin.
- **Q14 (nghỉ phép)**: làm leave trong sprint làm tăng đáng kể phạm vi (loại nghỉ, số dư, duyệt nghỉ); nếu để sau, attendance vẫn chạy được nhưng trạng thái "On Leave" phải nhập tay.

## 7. Lịch sử

| Phiên bản | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Bản nháp đầu tiên: 24 US, scope đề xuất, 14 BR, 10 edge case, ánh xạ 16 câu hỏi CONF |
| 0.2 | 2026-11-02 | Bổ sung module Đơn từ theo phản hồi chủ dự án: 4 US-Đ, ánh xạ Q17/Q18; dẫn CONF-S09-001 0.3 |
