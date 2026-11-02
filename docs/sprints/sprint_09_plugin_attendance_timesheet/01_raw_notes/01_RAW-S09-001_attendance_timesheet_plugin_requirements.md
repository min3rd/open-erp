# [RAW-S09-001] Yêu cầu gốc: Sprint 09 — Plugin Chấm công & Bảng công (Attendance & Timesheet)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | RAW-S09-001 / Yêu cầu gốc / Sprint 09 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.2 / 2026-11-02 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | Hội thoại trực tiếp với chủ dự án 2026-11-02 |
| Đọc trước / đọc tiếp | [Sprint 08 — đang thực hiện](../../sprint_08_plugin_form_workflow/00_READING_GUIDE.md) (Design In Review), [Sprint 07 — đã đóng](../../sprint_07_plugin_employee/00_READING_GUIDE.md) / [ANL-S09-001](../02_analysis/01_ANL-S09-001_attendance_timesheet_plugin.md), [BENCH-S09-001](../03_benchmarks/01_BENCH-S09-001_attendance_timesheet_benchmarks.md) |

## 1. Nguồn yêu cầu

Nguồn duy nhất: hội thoại trực tiếp giữa chủ dự án và Agent điều phối, ngày 2026-11-02, khi Sprint 08 đang ở giai đoạn Design In Review (chưa đóng).

## 2. Nguyên văn lời khách hàng

> "bắt đầu viết tài liệu sprint 9. tập trung vào plugin quản lý bẳng công và chấm công cho nhân viên. Hãy tìm hiểu các đối thủ và tạo các câu hỏi interact để mình quyết định chốt scope"

Phần cuối của lời nhắn là chỉ định: (a) nghiên cứu đối thủ trước khi đề xuất scope — đã thực hiện tại [BENCH-S09-001](../03_benchmarks/01_BENCH-S09-001_attendance_timesheet_benchmarks.md); (b) trình câu hỏi tương tác để chủ dự án chốt scope — thực hiện tại bước 04 ([CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md)).

## 3. Bóc tách yêu cầu thô

| # | Yêu cầu thô | Nguồn |
| :--- | :--- | :--- |
| R1 | Xây **plugin quản lý bảng công** — tổng hợp, quản lý công của nhân viên theo kỳ | Hội thoại 2026-11-02 |
| R2 | Xây **plugin chấm công** — ghi nhận giờ vào/ra của nhân viên | Hội thoại 2026-11-02 |
| R3 | Nghiên cứu cách **các đối thủ** xử lý chấm công/bảng công trước khi chốt scope | Hội thoại 2026-11-02 |
| R4 | Trình **câu hỏi tương tác** để chủ dự án quyết định scope | Hội thoại 2026-11-02 |

Mục tiêu sprint phát biểu bởi khách hàng là **plugin quản lý bảng công và chấm công cho nhân viên** — tức Sprint 09 bàn giao plugin nghiệp vụ độc lập chạy được trên tenant. Phạm vi chi tiết (phương thức chấm, tính công, duyệt, xuất lương…) chưa phát biểu → thuộc trách nhiệm phân tích (bước 02), đối chuẩn (bước 03) và xác nhận (bước 04).

## 4. Diễn giải BA (tách bạch khỏi lời khách hàng)

- "Chấm công" hiểu là **ghi nhận thời gian làm việc**: giờ vào/ra của từng nhân viên qua một hoặc nhiều phương thức (web, mobile có GPS, kiosk, máy chấm công phần cứng), kèm chống gian lận. **Chưa rõ**: bộ phương thức nào ở v1, mức chống gian lận (geofence, IP, selfie), chấm công hộ.
- "Bảng công" hiểu là **tính và tổng hợp công theo kỳ**: quy đổi log chấm công thành công ngày (đi muộn, về sớm, ngoài giờ, nửa ngày), tổng hợp thành bảng công tháng, chốt công, xuất phục vụ tính lương. **Chưa rõ**: chu kỳ chốt, luồng xác nhận công với nhân viên, công thức/tolerance, xuất Excel payroll-ready.
- Theo Sprint 07: plugin employee **tường minh không làm** lương, chấm công, nghỉ phép — các plugin HR sau này tham chiếu hồ sơ nhân viên qua Entity Registry. Sprint 09 chính là plugin HR tiếp theo đó.
- Nghiệp vụ gắn chặt thị trường VN (xem [BENCH-S09-001](../03_benchmarks/01_BENCH-S09-001_attendance_timesheet_benchmarks.md)): đa hình thức chấm (web/mobile/kiosk/máy vân tay ZKTeco), tính công theo ca (kể cả ca đêm qua ngày), đi muộn/về sớm/OT có tolerance, sửa công qua duyệt quản lý, **bảng công tổng hợp tháng → gửi nhân viên xác nhận → chốt → chuyển tính lương** (MISA AMIS, Base.vn đều theo mô hình này).
- Câu hỏi kiến trúc nổi bật (chuyển sang ANL/CONF): danh mục `SHIFT` hiện tại của catalog là FLAT không có giờ vào/ra — cần nâng cấp thành cấu trúc ca đầy đủ trong plugin hay giữ catalog; luồng duyệt sửa công có dùng workflow engine Sprint 08 không; nghỉ phép (leave) làm ngay hay để sprint sau.

## 5. Ràng buộc đã biết (từ guardrails dự án, không phải yêu cầu mới)

1. Plugin độc lập, schema riêng, đăng ký Entity Registry; không đưa nghiệp vụ vào Core.
2. Multi-tenant: mọi bảng/job/query phải mang tenant context đã xác thực; dữ liệu không rò rỉ chéo.
3. Backend Quarkus Java, frontend Angular 22 + Ionic 8; UI shared library, Drawer/Split-view, anti-modal; 100% i18n; 4 khuôn mẫu API; DTO/enum/ResponseKey chuẩn; Java enum đồng bộ TypeScript enum.
4. Employee plugin (Sprint 07) là nguồn hồ sơ: phân công (assignment), quản lý trực tiếp (manager), chi nhánh/phòng ban (organization); không tạo cây tổ chức thứ hai.
5. Catalog (Sprint 05) có danh mục `SHIFT` tenant-tự-định-nghĩa dạng FLAT (chưa có giờ vào/ra).
6. Workflow engine (Sprint 08, đang In Review) có thể được dùng làm cơ chế duyệt; notification plugin (Sprint 06) sẵn sàng cho thông báo.
7. Không viết unit test frontend; backend test trên PostgreSQL/Redis thật (No H2).
8. Mobile Ionic là bản tối giản so với Web; plugin khai báo minh bạch chức năng Desktop/Mobile.

## 6. Câu hỏi mở cần làm rõ (chuyển sang ANL/CONF)

1. **Bộ phương thức check-in/out ở v1**: web, mobile (GPS), kiosk (PIN/QR), máy chấm công phần cứng — chọn tổ hợp nào?
2. **Chống gian lận** cho chấm mobile/web: GPS bắt buộc, geofence theo chi nhánh, chặn theo IP/subnet, gì khác?
3. **Cấu trúc ca làm việc**: nâng cấp danh mục SHIFT thành ca đầy đủ (giờ vào/ra, grace, break, ca đêm qua ngày) trong plugin attendance, hay giữ catalog và tạo cấu trúc riêng?
4. **Lịch làm việc**: phân ca cố định theo tuần, lịch theo phòng ban/chi nhánh, hay cả hai?
5. **Chấm công hộ**: quản lý/HR chấm hộ nhân viên có cần ở v1 không, có cần lý do/audit không?
6. **Mô hình dữ liệu**: tách 3 tầng log chấm công → công ngày → bảng công tháng (chuẩn MISA/Base) hay đơn giản hơn?
7. **Bộ trạng thái công ngày**: Present/Absent/Half Day/WFH/On Leave/Business Trip — chọn bộ nào?
8. **Đi muộn/về sớm/OT**: tolerance cấu hình theo ca; OT tính tự động từ log hay cần đăng ký/duyệt OT riêng?
9. **Sửa công/bổ sung công (regularization)**: nhân viên tự gửi yêu cầu → quản lý duyệt; dùng workflow engine Sprint 08 hay cơ chế duyệt đơn giản?
10. **Chốt bảng công tháng**: chu kỳ tính công + khóa dữ liệu kiểu Base (4 bước) hay phiên bản gọn hơn?
11. **Xác nhận công**: gửi bảng công cho nhân viên xác nhận hàng tháng (norm MISA/Base) — cần không, cho phép xác nhận hộ không?
12. **Xuất dữ liệu lương**: Excel/CSV payroll-ready cần cột nào, có cần template cấu hình được không?
13. **Tích hợp máy chấm công phần cứng** (ZKTeco chiếm ~80% thị phần VN): v1 có không, qua middleware API push hay import file thủ công?
14. **Nghỉ phép (leave)**: làm plugin nghỉ phép ngay trong Sprint 09 hay attendance chỉ hiểu trạng thái nghỉ từ ngày lễ + dữ liệu để trống?
15. **Mobile Ionic**: phạm vi nào (tự chấm GPS, xem công cá nhân, duyệt sửa công, xác nhận bảng công)?
16. **Thông báo**: quên check-out nhắc tự động, có yêu cầu duyệt, chốt công — bộ thông báo nào cần ở v1?

> Danh sách câu hỏi trên là đầu vào thô; [ANL-S09-001](../02_analysis/01_ANL-S09-001_attendance_timesheet_plugin.md) phân tích, [BENCH-S09-001](../03_benchmarks/01_BENCH-S09-001_attendance_timesheet_benchmarks.md) đối chuẩn, [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) chuẩn hóa thành câu hỏi tương tác + AC và xin duyệt.

## 7. Kết quả trả lời câu hỏi (cập nhật 0.2)

16 câu hỏi mở ở §6 đã được chủ dự án trả lời qua **hội thoại tương tác, 2026-11-02** (4 vòng theo 4 nhóm A–D). Sau đó chủ dự án phản hồi *"sprint 9 còn thiếu phần tạo các loại đơn phù hợp cho nghiệp vụ"* → phát sinh thêm **2 câu (Q17/Q18) về module Đơn từ** — đã trả lời cùng ngày: **6 loại đơn chuẩn (nghỉ phép, OT, sửa công, đi muộn/về sớm, công tác, đổi ca) + tenant tự tạo loại mới, mẫu đơn qua form builder + duyệt qua workflow engine Sprint 08**. Bảng trả lời đầy đủ 18 câu tại [CONF-S09-001 §2](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md). Tóm tắt 16 câu gốc: đủ 4 phương thức chấm (web/mobile/kiosk/máy vân tay qua import + API push); GPS + geofence cảnh báo; cấu trúc ca trong plugin; HR + manager chấm hộ; lịch theo đơn vị + override nhân viên; 6 trạng thái công; tolerance theo ca + OT duyệt trước; cách tính công hưởng lương cấu hình 1 trong 2; duyệt sửa công dùng workflow engine Sprint 08; bảng công 4 bước kiểu Base.vn; xác nhận công mềm quá hạn vẫn chốt; xuất cột chuẩn + template; leave module đầy đủ; mobile full self-service; đủ 4 nhóm thông báo. Gate vẫn Pending — chờ duyệt scope & AC tại CONF.

| Lịch sử | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Khởi tạo: nguyên văn yêu cầu, R1–R4, diễn giải, ràng buộc, 16 câu hỏi mở |
| 0.2 | 2026-11-02 | Bổ sung §7: 16 câu gốc + 2 câu phát sinh module Đơn từ (Q17/Q18) đã trả lời qua hội thoại tương tác; dẫn CONF-S09-001 0.3 |
