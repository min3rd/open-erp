# [CONF-S09-001] Scope, Acceptance Criteria & Câu hỏi — Sprint 09: Plugin Chấm công & Bảng công

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | CONF-S09-001 / Xác nhận / Sprint 09 |
| Trạng thái / phiên bản / cập nhật | **✅ APPROVED 1.0 / 2026-11-02** — chủ dự án duyệt scope & AC qua hội thoại tương tác (nội dung 0.3 giữ nguyên) |
| Owner / reviewer | BA Agent / Chủ dự án (người duyệt) |
| Đầu vào | [RAW-S09-001](../01_raw_notes/01_RAW-S09-001_attendance_timesheet_plugin_requirements.md) 0.1, [ANL-S09-001](../02_analysis/01_ANL-S09-001_attendance_timesheet_plugin.md) 0.1, [BENCH-S09-001](../03_benchmarks/01_BENCH-S09-001_attendance_timesheet_benchmarks.md) 0.1 |
| Đọc trước / đọc tiếp | [ANL-S09-001](../02_analysis/01_ANL-S09-001_attendance_timesheet_plugin.md) / [00_READING_GUIDE](../00_READING_GUIDE.md) — bước 05 SOL mở sau khi APPROVED |

## 1. Mục tiêu Sprint 09 (đề xuất)

Bàn giao **1 plugin nghiệp vụ chạy được trên tenant thật**, theo yêu cầu trực tiếp của chủ dự án:

**Plugin `attendance`** (đề xuất tên) — chấm công & bảng công & nghỉ phép:

1. **Chấm công** đa phương thức: web dashboard, mobile GPS (geofence cảnh báo), kiosk mã NV/PIN, import file + API push từ middleware máy chấm công (ZKTeco/BioTime); chấm công hộ có audit; phát hiện check-in treo.
2. **Ca làm việc & lịch**: cấu trúc ca đầy đủ trong plugin (giờ vào/ra, grace, break, ca đêm qua ngày), gán theo phòng ban/chi nhánh + override từng nhân viên, ngày lễ tenant.
3. **Tính công**: auto quy đổi log + ca → công ngày (6 trạng thái), muộn/về sớm theo tolerance của ca, OT phải **duyệt đăng ký trước** rồi đối chiếu log.
4. **Đơn từ & duyệt**: module đơn từ tổng hợp — mẫu đơn bằng **form builder Sprint 08**, luồng duyệt bằng **workflow engine Sprint 08**; seed luồng 1 cấp manager (fallback HR), tenant cấu hình thêm cấp.
5. **Nghỉ phép đầy đủ**: loại nghỉ có thuộc tính, số dư phép (cấp phát, cộng dồn, hạn dùng), đơn nghỉ → duyệt → công ngày tự chuyển.
6. **Bảng công kỳ**: vòng đời **4 bước kiểu Base.vn** (rà log → rà lịch → tính công thức → chỉnh số công + Done), gửi nhân viên xác nhận (quá hạn vẫn chốt được), chốt khóa dữ liệu, xuất payroll-ready (cột chuẩn + template cấu hình), báo cáo cá nhân/team/tenant.
7. **Đơn từ (request forms)**: **6 loại đơn chuẩn** seed sẵn (nghỉ phép, đăng ký OT, bổ sung/sửa công, đi muộn/về sớm, đi công tác, đổi ca) + **tenant tự tạo loại đơn mới** (tự định nghĩa trường + luồng duyệt); mẫu đơn thiết kế bằng **form builder Sprint 08**, luồng duyệt chạy trên **workflow engine Sprint 08**; đơn loại gắn nghiệp vụ tự cập nhật công ngày khi được duyệt.
8. **Mobile Ionic full self-service**: chấm GPS, xem lịch/công, nộp đơn, xác nhận công, manager duyệt.

Không làm: tính lương/thuế/bảo hiểm (plugin sau), nhận diện khuôn mặt, geofence chặn cứng, scheduling optimization.

## 2. Phạm vi đã chốt qua 18 câu hỏi tương tác

Nguồn: hội thoại tương tác giữa chủ dự án và Agent điều phối, **2026-11-02** (4 vòng, 16 câu gốc + 1 vòng phát sinh 2 câu module Đơn từ — tổng 18/18 câu trả lời đầy đủ). Kết quả:

| # | Câu hỏi | Câu trả lời của chủ dự án |
| :--- | :--- | :--- |
| Q1 | Bộ phương thức check-in/out v1 | **Web + Mobile + Kiosk + máy vân tay** (đủ 4 nguồn log) |
| Q2 | Chống gian lận mobile | **GPS + geofence cảnh báo** (lưu tọa độ, cờ cảnh báo ngoài bán kính — không chặn cứng) |
| Q3 | Cấu trúc ca làm việc | **Cấu trúc ca trong plugin attendance** (giữ catalog SHIFT nguyên trạng) |
| Q4 | Chấm công hộ | **HR + Manager trực tiếp** — kèm lý do + audit |
| Q5 | Lịch làm việc | **Theo phòng ban/chi nhánh + override từng nhân viên** (theo tuần) |
| Q6 | Trạng thái công ngày | **Đủ 6**: Present, Absent, Half Day, WFH, On Leave, Business Trip |
| Q7 | Muộn/về sớm/OT | **Tolerance theo ca + OT phải duyệt đăng ký trước** (đăng ký → duyệt → đối chiếu log) |
| Q8 | Tính công hưởng lương | **Cấu hình 1 trong 2**: số công chuẩn − nghỉ không lương / tổng công thực tế |
| Q9 | Duyệt sửa công | **Dùng workflow engine Sprint 08** (rủi ro phụ thuộc — xem §5) |
| Q10 | Vòng đời bảng công | **4 bước kiểu Base.vn** (rà log → rà lịch → công thức → số công + Done) |
| Q11 | Xác nhận công với NV | **Có — xác nhận mềm, quá hạn vẫn chốt** (đánh dấu ai chưa xác nhận) |
| Q12 | Xuất dữ liệu lương | **Cả hai**: bộ cột chuẩn payroll-ready + template cấu hình theo tenant |
| Q13 | Máy chấm công phần cứng | **Import file + API push middleware** (secret + rate limit + anti-replay) |
| Q14 | Nghỉ phép | **Làm đầy đủ leave module** (loại nghỉ, số dư, cộng dồn, duyệt — xem rủi ro §5) |
| Q15 | Mobile Ionic | **Full self-service**: chấm GPS + lịch/công + gửi yêu cầu + xác nhận + manager duyệt |
| Q16 | Thông báo v1 | **Đủ 4 nhóm**: nhắc quên check-out; duyệt sửa công/OT; xác nhận bảng công; chốt công |
| Q17 | Bộ đơn từ *(câu phát sinh sau phản hồi chủ dự án "sprint 9 còn thiếu phần tạo các loại đơn phù hợp cho nghiệp vụ")* | **6 loại chuẩn + tenant tự tạo loại mới**: nghỉ phép, đăng ký OT, bổ sung/sửa công, đi muộn/về sớm, đi công tác, đổi ca |
| Q18 | Cơ chế tạo/quản lý loại đơn | **Dùng form builder + workflow engine Sprint 08** (mẫu đơn = form definition; duyệt = workflow instance) |

### 2.1. Phạm vi In-Scope

**Chấm công:** log thô append-only đa nguồn (web metadata IP/browser, mobile GPS, kiosk mã NV+PIN gắn chi nhánh, import CSV, API push middleware có secret/rate limit/anti-replay); idempotent theo (nguồn, thiết bị, thời gian, mã NV); chấm hộ HR/manager kèm lý do + audit; phát hiện check-in treo (job multi-tenant idempotent, tự đóng + đánh dấu lỗi); xóa log HR kèm lý do + audit.

**Ca & lịch:** ShiftDefinition (giờ vào/ra, grace trước/sau, break, ca đêm qua ngày); gán ca theo phòng ban/chi nhánh theo tuần + override nhân viên (resolve xung đột); ngày lễ tenant; nhân viên xem lịch cá nhân.

**Tính công:** auto job quy đổi log + ca → công ngày, 6 trạng thái, giờ làm, muộn/về sớm, OT theo tolerance của ca; chỉnh tay kèm lý do + cờ override (job không ghi đè, có nút tính lại); cách tính công hưởng lương cấu hình 1 trong 2 theo bảng công.

**Đơn từ (request forms) — lõi duyệt chung:** loại đơn = bộ ba (định danh + form definition từ form builder Sprint 08 + workflow definition từ workflow engine Sprint 08); **6 loại chuẩn seed sẵn**: nghỉ phép (LEAVE), đăng ký OT (OVERTIME), bổ sung/sửa công (ATTENDANCE_FIX), đi muộn/về sớm (LATE_EARLY), đi công tác (BUSINESS_TRIP), đổi ca (SHIFT_SWAP); tenant tạo loại mới (chọn/soạn form, cấu hình luồng duyệt, bật/tắt); đơn lưu response JSONB pin version form + trạng thái theo workflow instance; loại đơn gắn nghiệp vụ attendance có **auto-mapping khi duyệt**: LEAVE → On Leave/Half Day + trừ số dư; OVERTIME → khung OT được duyệt đối chiếu log; ATTENDANCE_FIX → log/công ngày; LATE_EARLY → ghi chú công ngày; BUSINESS_TRIP → Business Trip; SHIFT_SWAP → gán ca ngày đó; loại tùy chỉnh không mapping → chỉ duyệt và lưu kết quả; đơn ảnh hưởng kỳ đã chốt bị chặn theo BR-A09; seed luồng duyệt 1 cấp manager (fallback HR).

**Nghỉ phép đầy đủ:** loại nghỉ cấu hình (có lương, tính công, trừ dư); số dư phép (cấp phát theo năm, cộng dồn, hạn sử dụng cấu hình); đơn nghỉ qua module đơn từ (loại LEAVE) → duyệt qua engine → trừ dư → công ngày tự chuyển On Leave/Half Day; kiểm tra số dư khi duyệt.

**Bảng công kỳ:** tạo theo kỳ + đơn vị + cách tính công; vòng đời 4 bước Base (bước sau tính lại ghi đè dữ liệu sửa tay có cảnh báo); grid nhân viên × ngày mật độ cao; gửi xác nhận từng người/toàn bảng, trạng thái quay về bảng, từ chối kèm ghi chú; chốt sau Done khóa dữ liệu (chỉ Admin mở khóa có audit; chốt được khi quá hạn xác nhận); xuất Excel/CSV cột chuẩn + template tenant; báo cáo cá nhân/team/tenant (attendance rate, muộn, OT, nghỉ).

**Mobile Ionic:** chấm GPS + lịch/công cá nhân + gửi yêu cầu sửa/OT + xác nhận bảng công + manager duyệt; không overflow, touch target ≥ 40px.

**Thông báo (4 nhóm):** nhắc quên check-out (nhân viên + cảnh báo HR); yêu cầu mới/kết quả duyệt (sửa công, OT, nghỉ); bảng công chờ xác nhận + trạng thái xác nhận về HR; chốt/mở khóa bảng công.

### 2.2. Phạm vi Out-of-Scope (backlog)

Tính lương/thuế/bảo hiểm; nhận diện khuôn mặt/sinh trắc học; geofence chặn cứng; selfie khi chấm; scheduling optimization/xoay ca tự động; ca luân phiên tự sinh; chứng từ công tác phí; tích hợp phần mềm kế toán cụ thể (Fast/Bravo — qua template xuất); sub-workflow; chữ ký số.

## 3. Luồng nghiệp vụ chính

1. **Chấm công hàng ngày**: nhân viên check-in (web/mobile/kiosk) → log append-only + GPS/IP metadata → check-out → job quy đổi theo ca hiệu lực ngày đó → công ngày Present/Half Day + muộn/về sớm/OT (chưa duyệt không tính).
2. **Đơn từ & duyệt chung**: nhân viên nộp đơn (6 loại chuẩn hoặc loại tenant tự tạo — mẫu đơn từ form builder) → đơn tạo workflow instance theo luồng loại đơn → người duyệt xử lý trong inbox → khi được duyệt, loại gắn mapping tự cập nhật dữ liệu attendance (công ngày, số dư phép, khung OT, gán ca) + audit; loại tùy chỉnh chỉ lưu kết quả duyệt.
3. **Đăng ký OT (loại OVERTIME)**: nhân viên đăng ký khung OT trước → manager duyệt → tính công đối chiếu log trong khung đã duyệt → OT tính vào công.
4. **Nghỉ phép (loại LEAVE)**: nhân viên gửi đơn nghỉ → engine duyệt → trừ số dư (kiểm tra dư khi duyệt) → công ngày các ngày nghỉ tự chuyển On Leave/Half Day.
5. **Bảng công tháng**: HR tạo bảng theo kỳ + đơn vị → Bước 1 rà log → Bước 2 rà lịch/ca → Bước 3 tính công thức → Bước 4 chỉnh số công + Done → gửi nhân viên xác nhận → HR chốt (quá hạn vẫn chốt, đánh dấu chưa xác nhận) → xuất Excel/template → plugin lương sau nhận dữ liệu.

## 4. Acceptance Criteria

Ma trận: **D** = Desktop (web ≥ 1280px), **M** = Mobile Ionic (390×844). Truy vết: AC-A…A (chấm công) ↔ US-A/BR-A; AC-S (ca/lịch) ↔ US-S; AC-C (tính công) ↔ US-C; AC-R (sửa công/OT) ↔ US-R; AC-L (nghỉ phép) ↔ ANL §2.6 US-I03; AC-Đ (đơn từ) ↔ Q17/Q18; AC-T (bảng công) ↔ US-T; AC-M (mobile) ↔ US-I02. Tổng 37 AC.

| AC | Nội dung | D | M |
| :--- | :--- | :-: | :-: |
| AC-A01 | Check in/out web dashboard kèm metadata (IP, browser); nút trạng thái real-time; lịch sử chấm cá nhân có filter | D | M |
| AC-A02 | Check in/out mobile lưu GPS tọa độ vào log; ngoài bán kính nơi làm việc (geofence theo chi nhánh) ghi cờ cảnh báo hiển thị cho HR, không chặn | — | M |
| AC-A03 | Kiosk: chấm bằng mã NV + PIN (hoặc QR); không cần tài khoản; kiosk gắn chi nhánh; PIN không lưu plaintext; chống brute force | D | — |
| AC-A04 | Chấm hộ: HR (theo data scope) + manager (team trực tiếp) nhập log thay nhân viên kèm lý do bắt buộc; audit ai nhập/vì sao | D | — |
| AC-A05 | Import file CSV log (mẫu chuẩn BioTime/ZKTeco) + API push middleware (secret + rotate + rate limit + anti-replay); idempotent theo (nguồn, thiết bị, thời gian, mã NV); báo cáo dòng trùng/bỏ qua | D | — |
| AC-A06 | Phát hiện check-in treo quá ngưỡng cấu hình → tự đóng log + đánh dấu lỗi công ngày chờ HR xử lý; job scheduler multi-tenant idempotent | — | — |
| AC-A07 | Log append-only; xóa log chỉ HR trong scope kèm lý do, ghi audit; không sửa nội dung log | — | — |
| AC-S01 | ShiftDefinition CRUD: giờ vào/ra, grace trước/sau, break, ca đêm qua ngày (giờ ra < giờ vào gán về ngày bắt đầu ca) | D | — |
| AC-S02 | Gán ca theo phòng ban/chi nhánh theo tuần + override từng nhân viên; resolve xung đột override; cảnh báo nhân viên không có ca ngày làm việc | D | — |
| AC-S03 | Ngày lễ tenant: khai báo theo năm; ngày lễ không tính vắng mặt; làm thực tế ngày lễ vẫn ghi nhận công | D | — |
| AC-S04 | Nhân viên xem lịch làm việc cá nhân (tuần/tháng) | D | M |
| AC-C01 | Auto tính công ngày từ log + ca: 6 trạng thái (Present/Absent/Half Day/WFH/On Leave/Business Trip), giờ làm, muộn/về sớm theo grace của ca; thiếu ca dùng ca mặc định hoặc đánh dấu chờ HR (E06) | — | — |
| AC-C02 | Chỉnh công ngày tay kèm lý do + cờ override; auto job không ghi đè bản override; nút tính lại có audit | D | — |
| AC-C03 | Cách tính công hưởng lương cấu hình 1 trong 2 theo bảng công: số công chuẩn − nghỉ không lương / tổng công thực tế | D | — |
| AC-R01 | Nhân viên gửi yêu cầu sửa/bổ sung công (chọn ngày + giờ đúng + lý do); cửa sổ số ngày lùi tối đa cấu hình; sau chốt bảng không nhận thêm | D | M |
| AC-R02 | Yêu cầu sửa công chạy trên module đơn từ (loại ATTENDANCE_FIX): form trường giờ đúng + lý do; luồng duyệt qua workflow engine seed 1 cấp manager (fallback HR); timeline trạng thái theo engine | D | M |
| AC-R03 | Đăng ký OT qua module đơn từ (loại OVERTIME): khung giờ OT nộp trước → duyệt qua engine → tính công đối chiếu log trong khung đã duyệt; OT chưa duyệt không tính vào công hưởng lương | D | M |
| AC-R04 | Yêu cầu được duyệt → tự động cập nhật công ngày (thêm log/đổi trạng thái) + audit; từ chối có lý do lưu lại | — | — |
| AC-L01 | Loại nghỉ cấu hình: tên, có lương/không lương, tính công/không, trừ số dư/không (phép năm, ốm, thai sản, không lương…) | D | — |
| AC-L02 | Số dư phép: cấp phát định kỳ theo năm, giá trị kỳ, cộng dồn tối đa, hạn sử dụng — cấu hình theo loại nghỉ | D | — |
| AC-L03 | Đơn nghỉ qua module đơn từ (loại LEAVE): khoảng ngày, lý do, file đính kèm qua storage signed URL; kiểm tra chồng lấn đơn | D | M |
| AC-L04 | Duyệt đơn nghỉ qua workflow engine (seed 1 cấp manager); trừ số dư sau duyệt; chặn duyệt khi không đủ dư (cấu hình cho phép âm nếu tenant muốn) | D | M |
| AC-L05 | Đơn nghỉ được duyệt → công ngày các ngày nghỉ tự chuyển On Leave (nửa ngày → Half Day + trạng thái nửa còn lại); hủy đơn khôi phục trạng thái cũ có audit | — | — |
| AC-Đ01 | 6 loại đơn chuẩn seed: LEAVE, OVERTIME, ATTENDANCE_FIX, LATE_EARLY, BUSINESS_TRIP, SHIFT_SWAP — mỗi loại gắn form definition + workflow definition mặc định (1 cấp manager, fallback HR); tenant bật/tắt từng loại | D | — |
| AC-Đ02 | Tenant tạo loại đơn mới: soạn/chọn form (form builder Sprint 08), cấu hình luồng duyệt (workflow engine), đặt tên/mã, bật/tắt; sửa mẫu đơn sau khi có đơn → version mới, đơn cũ pin version (pattern form versioning) | D | — |
| AC-Đ03 | Nộp đơn: điền form theo mẫu loại đơn, response JSONB pin version; validate bắt buộc; đơn tạo workflow instance và trạng thái đồng bộ 2 chiều | D | M |
| AC-Đ04 | Auto-mapping loại chuẩn khi duyệt: LEAVE→On Leave/Half Day + trừ dư; OVERTIME→khung OT được duyệt; ATTENDANCE_FIX→log/công ngày; LATE_EARLY→ghi chú công ngày; BUSINESS_TRIP→Business Trip; SHIFT_SWAP→gán ca ngày đó; loại tùy chỉnh không mapping chỉ lưu kết quả duyệt | — | — |
| AC-Đ05 | Inbox đơn từ: đơn của tôi + đơn chờ tôi duyệt (task inbox engine) + timeline tiến trình; mở bối cảnh bằng Drawer/Split-view, không modal | D | M |
| AC-Đ06 | Đơn ảnh hưởng kỳ đã chốt bị chặn nộp/xử lý theo BR-A09; đơn chéo kỳ chốt chỉ tác động phần chưa chốt | — | — |
| AC-T01 | Tạo bảng công theo kỳ (tháng) + đơn vị (phòng ban/chi nhánh) + cách tính công; tổng hợp tự động từ công ngày; xem lại theo data scope | D | — |
| AC-T02 | Vòng đời 4 bước Base.vn: (1) rà/chỉnh log, (2) rà lịch làm việc + đồng bộ lễ, (3) áp công thức tính, (4) chỉnh số công + Done; quay lại bước trước cảnh báo ghi đè dữ liệu sửa tay; grid nhân viên × ngày mật độ cao, mã trạng thái màu | D | — |
| AC-T03 | Gửi xác nhận: từng người/toàn bảng; nhân viên xác nhận/từ chối kèm ghi chú; trạng thái từng người quay về bảng tổng hợp; thông báo 2 chiều | D | M |
| AC-T04 | Chốt: sau Done khóa dữ liệu; chốt được khi quá hạn xác nhận (đánh dấu người chưa xác nhận); chỉ Tenant Admin mở khóa có audit; dữ liệu khóa không sửa được (trừ reopen) | D | — |
| AC-T05 | Xuất Excel/CSV: bộ cột chuẩn payroll-ready (mã NV, phòng ban, ngày công chuẩn, công thực, nghỉ theo loại, OT, muộn…) + template cấu hình theo tenant (chọn/bật-tắt cột, lưu template) | D | — |
| AC-T06 | Báo cáo: cá nhân; team cho manager (theo data scope); toàn tenant: attendance rate, top đi muộn, OT theo phòng ban, tổng hợp nghỉ | D | — |
| AC-T07 | Tenant isolation: mọi bảng/job/API mang tenant_id đã xác thực; test isolation là hạng mục nghiệm thu; không rò rỉ chéo tenant | — | — |
| AC-M01 | Mobile Ionic: chấm GPS, lịch/công cá nhân, gửi yêu cầu sửa/OT/nghỉ, xác nhận bảng công, manager duyệt; không tràn ngang, touch target ≥ 40px, safe-area, 0 console error | — | M |

M\* — không áp dụng trong bảng này. Backend test: JUnit 5 + RestAssured trên PostgreSQL/Redis thật (No H2); frontend không viết unit test; QA browser hai chế độ Desktop + Mobile emulation 390×844, 0 console error.

## 5. Rủi ro cần chủ dự án lưu ý (đã chọn ở Q9/Q10/Q12/Q14/Q17/Q18)

1. **Q9/Q18 — Phụ thuộc cả 2 plugin Sprint 08**: module Đơn từ dùng **form builder + workflow engine** — cả 2 đang **Design In Review chưa duyệt**. Đây là rủi ro lớn nhất của sprint: Sprint 09 phụ thuộc contract của 2 plugin chưa chốt. Điều kiện: Architect đánh giá khả thi khi làm bước 05; nếu Sprint 08 đổi contract phải đồng bộ thiết kế 2 sprint; nếu đến lúc code engine chưa release thì fallback: đơn từ lưu + duyệt 1 cấp nội bộ plugin, migrate sang engine sau khi Sprint 08 release (ghi nhận phụ thuộc, không tự viết engine riêng).
2. **Q14 — Leave đầy đủ trong sprint**: cộng dồn số dư/hạn dùng/chặn âm là nghiệp vụ phức tạp (các HRM lớn coi leave = 1 sprint riêng). Sprint 09 sẽ nặng hơn hẳn nếu giữ — Architect phải thiết kế số dư theo voucher/ledger để tránh cộng trừ sai; QA phải test đủ biên (dư 0, cộng dồn, chéo năm).
3. **Q17 — Tenant tự tạo loại đơn**: loại tùy chỉnh không có mapping tự động — cần giới hạn rõ loại mới chỉ "duyệt + lưu kết quả" cho đến khi có mapping engine; tránh kỳ vọng tenant tạo loại đơn tự động đổi công.
4. **Q10 — 4 bước Base.vn**: UX nặng hơn chuỗi 3 trạng thái; bước quay lại có ghi đè dữ liệu sửa tay — phải cảnh báo rõ (Base gặp sự cố mất dữ liệu sửa tay nếu không xuất trước).
5. **Q13 — API push middleware**: mở bề mặt integration — bắt buộc secret + rotate + rate limit + anti-replay (pattern webhook Sprint 08).
6. **Tổng thể**: 18/18 câu chọn phạm vi rộng (đủ 4 nguồn chấm + leave đầy đủ + đơn từ 6 loại + tạo loại mới + engine chung + 4 nhóm thông báo) — sprint lớn; nếu muốn gọn, có thể tách leave module (Q14) hoặc rút loại đơn tùy chỉnh (Q17) trước khi duyệt.

## 6. Confirmation Gate

| Mục | Trạng thái |
| :--- | :--- |
| 18/18 câu hỏi scope đã trả lời (16 gốc + 2 phát sinh) | ✅ (hội thoại tương tác 2026-11-02) |
| Duyệt scope & AC (bảng §1, §2.1, §4) | ✅ **APPROVED 1.0** — chủ dự án chọn "Duyệt toàn bộ scope" qua hội thoại tương tác 2026-11-02 (đã được nêu rõ rủi ro §5: phụ thuộc Sprint 08 Q9/Q18, leave đầy đủ Q14) |
| Chuyển sang bước 05 (SOL) | ✅ Đã mở — Architect nghiên cứu giải pháp, không tự thay đổi scope/AC; điều kiện theo §5.1: đánh giá phụ thuộc Sprint 08 trước khi thiết kế, blocker thì quay lại xác nhận fallback |

> Lịch sử: 0.1 (2026-11-02) — soạn CONF nháp với 16 câu hỏi chốt scope + đề xuất mục tiêu; **0.2 (2026-11-02)** — ghi nhận 16/16 câu trả lời tương tác; bổ sung In-Scope/Out-of-Scope, 5 luồng nghiệp vụ, 31 AC + ma trận D/M, 5 rủi ro; gate vẫn Pending — chờ duyệt scope & AC; **0.3 (2026-11-02)** — phản hồi chủ dự án "sprint 9 còn thiếu phần tạo các loại đơn phù hợp cho nghiệp vụ" → thêm module Đơn từ (Q17/Q18): 6 loại chuẩn + tenant tạo loại mới, dùng form builder + workflow Sprint 08; thêm 6 AC-Đ (tổng 37), cập nhật luồng + rủi ro; **1.0 (2026-11-02) — APPROVED bởi chủ dự án qua hội thoại tương tác, nội dung 0.3 giữ nguyên**. Đổi scope/AC sau này phải xác nhận phần thay đổi và tăng phiên bản.

| Lịch sử | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Bản nháp đầu tiên: mục tiêu đề xuất + 16 câu hỏi 4 nhóm + 4 rủi ro; chờ trả lời tương tác |
| 0.2 | 2026-11-02 | Ghi nhận 16/16 câu trả lời; soạn scope §2, luồng §3, AC §4 (31 AC), rủi ro §5; chờ duyệt |
| 0.3 | 2026-11-02 | Thêm module Đơn từ theo phản hồi chủ dự án (Q17/Q18): 6 loại chuẩn + loại tùy chỉnh qua form builder + workflow Sprint 08; 37 AC; gate Pending |
| 1.0 | 2026-11-02 | **APPROVED** — chủ dự án duyệt toàn bộ scope (18/18 câu + 37 AC) qua hội thoại tương tác |
