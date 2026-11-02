# [BENCH-S09-001] Đối chuẩn: Chấm công & Bảng công — Attendance & Timesheet

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BENCH-S09-001 / Đối chuẩn / Sprint 09 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S09-001](../01_raw_notes/01_RAW-S09-001_attendance_timesheet_plugin_requirements.md) 0.1 (R3 — nghiên cứu đối thủ) |
| Đọc trước / đọc tiếp | [RAW-S09-001](../01_raw_notes/01_RAW-S09-001_attendance_timesheet_plugin_requirements.md) / [ANL-S09-001](../02_analysis/01_ANL-S09-001_attendance_timesheet_plugin.md), [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) |

## 1. Mục đích và bối cảnh

Tài liệu trả lời câu hỏi R3 của chủ dự án: **các đối thủ xử lý chấm công (attendance) và bảng công (timesheet) như thế nào**, từ đó rút bài học để đề xuất scope Sprint 09. Phạm vi đối chuẩn gồm 2 nhóm: (a) ERP/HR quốc tế — mô hình dữ liệu và tính công; (b) HR Việt Nam + phần cứng — kỳ vọng thực tế của thị trường mục tiêu (đa phương thức chấm, máy vân tay ZKTeco, bảng công tháng xác nhận với nhân viên, chuyển tính lương).

Người đọc sau tài liệu này hiểu được: cấu trúc dữ liệu chuẩn của ngành, các phương thức chấm công, công thức tính công, và những gì cần/không cần đưa vào v1.

## 2. Danh sách sản phẩm đối chuẩn

| # | Sản phẩm | Phân khúc | Nguồn |
| :--- | :--- | :--- | :--- |
| 1 | Odoo Attendances (17/19) | ERP modular, phổ biến SME VN | [Odoo docs](https://www.odoo.com/documentation/17.0/applications/hr/attendances.html) |
| 2 | Frappe HR / ERPNext HRMS | HRM mã nguồn mở | [Frappe HR docs](https://docs.frappe.io/hr/attendance) |
| 3 | Zoho People | HRM SaaS trung | [Zoho](https://www.zoho.com/people/attendance-management-system.html) |
| 4 | Jibble | Time & attendance chuyên sâu, free tier | [Jibble](https://www.jibble.io/time-and-attendance-software) |
| 5 | BambooHR Time Tracking | HRM SaaS Mỹ, gắn payroll | [BambooHR](https://www.bamboohr.com/platform/time-and-attendance/) |
| 6 | MISA AMIS Chấm công | HRM Việt Nam #1 | [AMIS docs](https://helpamis.misa.vn/amis-cham-cong/kb/tinh-nang-cham-cong-tong-hop/) |
| 7 | Base.vn (Checkin/Schedule/Timesheet) | HRM Việt Nam | [Base help](https://help.base.vn/support/solutions/articles/63000268587-base-timesheet-c%C3%A1ch-th%E1%BB%B1c-hi%E1%BB%87n-v%C3%A0-ch%E1%BB%91t-b%E1%BA%A3ng-c%C3%B4ng-timesheet) |
| 8 | 1Office Công-Ca-Lương | HRM Việt Nam | [1Office](https://1office.vn/cong-ca-luong) |
| 9 | ZKTeco + BioTime | Phần cứng + middleware (~80% thị phần máy chấm công VN) | [Smartid](https://smartid.com.vn/huong-dan-ket-noi-may-cham-cong-khuon-mat-van-tay-zkteco-su-dung-api-va-phan-mem-chuan-biotime.html), [AZZA](https://www.azza.vn/gioi-thieu-zkteco-ta-push-sdk/) |
| 10 | Odoo kiosk/hardware module | Mô hình kiosk tham chiếu | [Odoo kiosks](https://www.odoo.com/documentation/17.0/applications/hr/attendances/kiosks.html) |

## 3. Phân tích theo chủ đề

### 3.1. Cấu trúc dữ liệu: 3 tầng chuẩn ngành

Cả MISA AMIS, Base.vn và Frappe HR đều tách 3 tầng dữ liệu (bài học ngược cho việc gộp chung):

| Tầng | Tên gọi | Bản chất | Ví dụ |
| :--- | :--- | :--- | :--- |
| 1 | Log chấm công (check-in event) | Sự kiện thô, append-only, không sửa được — chỉ thêm/xóa có audit | "08:52:31 - NV A - máy vân tay CN1", "09:05 - NV B - mobile GPS" |
| 2 | Công ngày (attendance record) | Kết quả quy đổi 1 ngày/1 ca: trạng thái, giờ vào/ra hiệu dụng, giờ làm, muộn/sớm/OT | "NV A, 02/11: Present, 8h, muộn 0'", "NV B: Half Day" |
| 3 | Bảng công kỳ (timesheet period) | Tổng hợp theo tháng/kỳ lương: tổng công hưởng lương, nghỉ, OT, muộn; khóa + chuyển lương | "Bảng công tháng 11 - phòng Kinh doanh" |

- Frappe: `Employee Checkin` (tầng 1) → `Attendance` (tầng 2, status Present/Absent/On Leave/Half Day/WFH) → payroll lấy attendance tính payable days (tầng 3).
- Base.vn: Base Checkin (1) → Bảng công Schedule (2) → Chu kỳ tính công Timesheet (3) với 4 bước chỉnh sửa + khóa.
- MISA AMIS: bảng chấm công chi tiết (1–2) → bảng chấm công tổng hợp (3) → gửi xác nhận → chuyển tính lương.
- Odoo gộp tầng 1–2 thành bản ghi attendance có check-in/check-out đa cặp, nhưng vẫn có report tổng hợp riêng.

### 3.2. Phương thức chấm công (check-in/out)

| Phương thức | Ai dùng | Ghi chú |
| :--- | :--- | :--- |
| Web dashboard (nút Check in/out) | Odoo, BambooHR, Frappe | Kèm metadata: IP, browser, vị trí IP |
| Mobile app + GPS | Odoo 19, Jibble, Zoho, 1Office | GPS coordinates lưu kèm log; Jibble/Zoho có **geofence** (chỉ chấm được trong bán kính) |
| Kiosk (thiết bị chung: tablet/PC) | Odoo kiosk mode, Jibble kiosk | Xác thực: badge/PIN/QR/**nhận diện khuôn mặt**; cho nhân viên không có tài khoản |
| Máy chấm công phần cứng | MISA, Base, 1Office, Zoho | VN: vân tay/thẻ/khuôn mặt; ZKTeco ~80% thị phần — thường qua **middleware (BioTime) push API** thay vì nối trực tiếp |
| Chấm công hộ (supervisor clock) | MISA ("chấm công hộ"), Frappe (bulk marking), Odoo (manual) | HR/quản lý nhập hộ kèm audit; Frappe cho mark bulk cả tháng |

### 3.3. Ca làm việc & lịch

- **Frappe** chuẩn hóa nhất: `Shift Type` (giờ vào/ra, grace, threshold, cho phép OT, auto attendance) + `Shift Assignment` gán ca cho nhân viên + cho phép nhiều ca/ngày nếu không chồng lấn.
- **Base Schedule**: chia kíp (kíp ca linh hoạt), thêm ca bổ sung, đồng bộ ngày lễ vào lịch làm việc.
- **1Office**: quản lý **đổi ca theo luồng duyệt**; ca làm gắn dữ liệu chấm công và OT.
- **Odoo 19**: shift rostering qua module cộng đồng (weekly template → scheduled shifts cron hằng ngày), core vẫn đơn giản.
- Ca **đêm qua ngày** (night shift crossing midnight) là bài toán ngầm của mọi sản phẩm — Frappe xử lý qua shift với thời gian bắt đầu trước 0h.

### 3.4. Tính công: muộn/về sớm/OT/tolerance

- **Odoo**: "Tolerance Time In Favor Of Company" (OT dưới X phút không tính) và "In Favor Of Employee" (thiếu dưới Y phút không phạt) — 2 chiều cấu hình được; OT và phạt muộn đều có tolerance.
- **Frappe**: Late Entry / Early Exit flag trên attendance; Working Hours dưới threshold của ca → Half Day hoặc Absent; OT tự tính khi ca cho phép (`Allow Overtime`), feeding Overtime Slip.
- **1Office**: công thức tính công **tùy chỉnh theo chính sách DN** (quy định đi muộn, làm thêm, nghỉ giữa ca) — "xây dựng công thức chấm công".
- **MISA**: cách tính số công hưởng lương chọn 1 trong 2: `Số công chuẩn − nghỉ không lương` hoặc `Cộng tổng công thực tế`; tách công theo địa điểm làm việc.
- **BambooHR**: automatic overtime calculations + approvals trước khi vào payroll.

### 3.5. Sửa công / bổ sung công (regularization)

- **Frappe**: `Attendance Request` (nhân viên/HR tạo yêu cầu sửa công cho khoảng ngày) → duyệt → tạo/cập nhật attendance; `Employee Checkin` bổ sung bằng tay.
- **Zoho/Jibble**: attendance regularization là tính năng mặc định của ngành (nhân viên quên chấm → gửi yêu cầu → quản lý duyệt).
- **Base**: sửa log ở Bước 1, sửa số công tay ở Bước 4, khóa bằng Done — sửa tay không qua luồng duyệt riêng nhưng có audit + quyền Owner mở khóa.
- **1Office**: đổi ca và OT **theo luồng duyệt** (quản lý duyệt, không phải HR sửa trực tiếp).

### 3.6. Xác nhận công & chốt kỳ (đặc thù VN)

Chuỗi luồng chuẩn thị trường VN (MISA + Base đều như nhau):

1. Tạo **chu kỳ/bảng công tổng hợp** theo đơn vị (phòng ban) — chọn cách tính công.
2. Hệ tổng hợp từ bảng chi tiết; HR rà soát, sửa.
3. **Gửi nhân viên xác nhận bảng công** — trạng thái xác nhận từng người quay về bảng tổng hợp.
4. **Chốt/khóa dữ liệu** (Base: Done — chỉ Owner mở khóa).
5. **Chuyển tính lương** (MISA: đẩy sang AMIS Tiền lương; Base: xuất Excel).

MISA cho phép chuyển tính lương ngay cả khi nhân viên **chưa xác nhận hết** (deadline xác nhận đã quá) — chi tiết thực dụng cho deadline lương.

### 3.7. Xuất dữ liệu & tính lương

- Không sản phẩm nào (trong phạm vi khảo sát) để plugin attendance tự tính lương — đều **xuất dữ liệu payroll-ready** hoặc đẩy sang module lương riêng: BambooHR (payroll integration), MISA (AMIS Tiền lương), Base/1Office (xuất Excel/Fast/Bravo).
- Cột xuất chuẩn: mã NV, phòng ban, ngày công chuẩn, công thực, nghỉ phép (loại), nghỉ không lương, OT (giờ), số lần/giờ muộn, ốm đau/thai sản.

### 3.8. Chống gian lận

| Biện pháp | Phạm vi |
| :--- | :--- |
| GPS capture (lưu tọa độ) | Odoo, Jibble, 1Office |
| Geofence (bán kính nơi làm việc) | Jibble, Zoho, 1Office |
| Chặn/ghi IP + subnet VPN | Odoo (ghi IP + city), Jibble (IP restriction) |
| Nhận diện khuôn mặt / selfie | Odoo kiosk, Jibble (AI facial recognition), Zoho, MISA |
| QR code động tại kiosk | Odoo, Jibble |
| Giới hạn 1 check-in đang mở (không chấm chồng) | Frappe (validation), Odoo (error khi >24h không checkout) |

## 4. Bảng tổng hợp tính năng

| Tính năng | Odoo | Frappe | Zoho | Jibble | Bamboo | MISA | Base | 1Office |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| Web clock | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mobile GPS/geofence | ✅ | ⭕ app | ✅ | ✅ | ⭕ | ✅ | ✅ | ✅ |
| Kiosk/PIN/QR | ✅ | ⭕ | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| Nhận diện khuôn mặt | ✅ | ⭕ | ✅ | ✅ | — | ✅ | ⭕ | ✅ |
| Máy vân tay (middleware) | ⭕ add-on | ✅ | ✅ | — | — | ✅ | ✅ | ✅ |
| Ca làm việc + gán ca | ⭕ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ca đêm qua ngày | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Đi muộn/về sớm | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| OT + tolerance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Duyệt OT/đổi ca | ⭕ | ⭕ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sửa công qua duyệt | ⭕ | ✅ | ✅ | ✅ | ✅ | ✅ | ⭕ | ✅ |
| Chấm công hộ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bảng công tháng tổng hợp | ✅ report | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Xác nhận công với NV | — | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chốt/khóa kỳ | — | ✅ submit | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Xuất payroll | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

(✅ có — ⭕ qua module/cấu hình thêm — — không có; tổng hợp từ nguồn mục 2, mức độ chi tiết khác nhau giữa sản phẩm.)

## 5. Bài học áp dụng vào open-erp

| # | Bài học | Nguồn | Áp dụng đề xuất |
| :--- | :--- | :--- | :--- |
| L01 | Tách 3 tầng dữ liệu: log thô (append-only) → công ngày → bảng công kỳ | Frappe, MISA, Base | Schema plugin 3 nhóm bảng; log không sửa, chỉ audit |
| L02 | Một lõi chấm công đa phương thức: web clock, mobile GPS, kiosk, import log máy — mọi nguồn đổ về cùng tầng log có `source` | Tất cả | Log entry có enum nguồn; kiosk không cần tài khoản dùng mã NV/PIN |
| L03 | Ca làm việc là cấu trúc dữ liệu riêng (giờ vào/ra, grace, threshold, OT), không phải item danh mục phẳng | Frappe Shift Type | Cần quyết định Q3: nâng cấp SHIFT catalog hay tạo cấu trúc ca trong plugin attendance |
| L04 | Tolerance 2 chiều (thiên về DN / thiên về NV) cấu hình theo ca hoặc toàn tenant | Odoo extra hours | Công thức muộn/OT có tham số cấu hình, không hardcode |
| L05 | Validation: không 2 attendance cùng ngày trùng ca; chặn check-in đang mở quá X giờ → trạng thái lỗi cần HR xử lý | Frappe, Odoo errors | Ràng buộc DB + job phát hiện "check-in treo" |
| L06 | Sửa công/bổ sung công phải qua yêu cầu duyệt có audit; không sửa trực tiếp dữ liệu đã tính | Frappe Attendance Request, 1Office | Luồng regularization; câu hỏi Q9: dùng workflow engine Sprint 08 |
| L07 | Chấm công hộ có lý do + audit (ai chấm hộ, vì sao) | MISA, Frappe | Quyền HR/manager chấm hộ, log đầy đủ |
| L08 | Chuỗi VN: bảng công tháng → gửi NV xác nhận → chốt → chuyển lương; cho phép chốt khi quá hạn xác nhận | MISA, Base | Xác nhận công là tính năng riêng; chốt là hành động có trạng thái |
| L09 | Chốt kỳ khóa dữ liệu, chỉ Owner/Admin mở khóa; chuyển trạng thái 1 chiều | Base (4 bước, Done) | State machine đơn giản: Draft → Confirmed → Locked |
| L10 | Không tự tính lương — chỉ xuất dữ liệu payroll-ready (Excel/CSV) cột chuẩn | MISA, Base, Bamboo | Out-of-scope lương; xuất Excel cấu hình cột |
| L11 | Máy chấm công phần cứng: nối qua middleware push API (BioTime/TA Push SDK) hoặc import file — không viết driver phần cứng trong plugin | ZKTeco, Smartid | Import file + API push đơn giản ở v1 nếu khách duyệt |
| L12 | Nghỉ phép là nguồn trạng thái công (On Leave/Half Day) nhưng là plugin nghiệp vụ khác | Frappe (Leave Application), Zoho | Attendance phải có chỗ cắm cho leave; câu hỏi Q14: làm ngay hay để sau |

## 6. Khoảng trống cần kiểm chứng thêm

1. Chi tiết pricing/giới hạn free tier của Jibble/Zoho — không ảnh hưởng scope open-erp (tự xây).
2. Hành vi cụ thể khi nhân viên quên check-out >24h ở từng sản phẩm — chỉ Odoo ghi rõ trạng thái lỗi; cần xác nhận kỳ vọng của chủ dự án (Q16 — nhắc tự động).
3. Mức độ chi tiết của geofence (bán kính theo chi nhánh hay theo điểm làm việc) — nguồn mô tả chung, chưa đủ để copy quy tắc; sẽ thiết kế ở bước 05–06 nếu khách duyệt geofence.
4. Chuẩn cột Excel lương của từng phần mềm kế toán VN (Fast, Bravo, MISA) — cần mẫu thực tế của tenant khi triển khai; v1 đề xuất export cấu hình được.

## 7. Nguồn đã đọc

- Odoo 17 Attendances + Kiosks docs (odoo.com/documentation/17.0) — đọc 2026-11-02.
- Frappe HR Attendance docs (docs.frappe.io/hr/attendance) — đọc 2026-11-02.
- MISA AMIS Chấm công — Tổng hợp công, xác nhận công, chuyển tính lương (helpamis.misa.vn) — đọc 2026-11-02.
- Base.vn — Base Timesheet: chốt bảng công (help.base.vn), Base Checkin/Schedule (base.vn) — đọc 2026-11-02.
- 1Office Công-Ca-Lương (1office.vn/cong-ca-luong, /cham-cong) — đọc 2026-11-02.
- Zoho People Attendance (zoho.com/people) — đọc 2026-11-02.
- Jibble Time & Attendance (jibble.io) — đọc 2026-11-02.
- BambooHR Time Tracking (bamboohr.com) — đọc 2026-11-02.
- ZKTeco TA Push SDK / BioTime (azza.vn, smartid.com.vn, zkteco.vn) — đọc 2026-11-02.

| Lịch sử | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Bản nháp đầu tiên: 10 sản phẩm/nhóm, 8 chủ đề, 12 bài học, 4 khoảng trống |
