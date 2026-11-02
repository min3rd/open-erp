# [RAW-S11-001] Yêu cầu gốc: Sprint 11 — Plugin KPI (Quản lý & xử lý KPI)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | RAW-S11-001 / Yêu cầu gốc / Sprint 11 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.2 / 2026-11-02 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | Hội thoại trực tiếp với chủ dự án 2026-11-02 |
| Đọc trước / đọc tiếp | [Sprint 10 — đang thực hiện](../../sprint_10_plugin_payroll/00_READING_GUIDE.md) (Scope APPROVED, bước 05 mở), [Sprint 09](../../sprint_09_plugin_attendance_timesheet/00_READING_GUIDE.md) (đang code bước 07) / [ANL-S11-001](../02_analysis/01_ANL-S11-001_kpi_plugin.md), [BENCH-S11-001](../03_benchmarks/01_BENCH-S11-001_kpi_okr_benchmarks.md) |

## 1. Nguồn yêu cầu

Nguồn duy nhất: hội thoại trực tiếp giữa chủ dự án và Agent điều phối, ngày 2026-11-02, khi Sprint 10 vừa APPROVED scope và Sprint 09 đang code bước 07. Chủ dự án yêu cầu chạy phân tích BA của Sprint 11 song song.

## 2. Nguyên văn lời khách hàng

> "tiếp tục phân tích để viết bài toàn cho sprint 11: plugin quản lý và xử lý KPI"

*Ghi chú BA: "viết bài toàn" hiểu là "viết bản phân tích" (bóc tách yêu cầu) — nguồn ngữ cảnh hội thoại.*

Phần yêu cầu không kèm chỉ định nghiên cứu đối thủ tường minh, nhưng theo quy trình SDLC và pattern 2 sprint trước, bước 03 đối chuẩn được thực hiện tại [BENCH-S11-001](../03_benchmarks/01_BENCH-S11-001_kpi_okr_benchmarks.md) trước khi chốt scope.

## 3. Bóc tách yêu cầu thô

| # | Yêu cầu thô | Nguồn |
| :--- | :--- | :--- |
| R1 | Xây **plugin quản lý KPI** — thư viện chỉ tiêu, gán KPI cho nhân viên/phòng ban, chu kỳ | Hội thoại 2026-11-02 |
| R2 | Xây **plugin xử lý KPI** — cập nhật số liệu, tính điểm, chấm đánh giá, duyệt kết quả | Hội thoại 2026-11-02 |
| R3 | Đối chuẩn các hệ thống KPI/OKR trước khi chốt scope | Theo quy trình SDLC |

Mục tiêu sprint phát biểu bởi khách hàng là **plugin KPI chạy được**. Chuỗi giá trị tự nhiên với các sprint trước: **employee (S07) gán KPI theo chức danh/phòng ban → theo dõi tiến độ kỳ → chấm điểm cuối kỳ → duyệt → kết quả KPI là nguồn cho kênh KPI mà payroll (S10) đã chốt** (CONF-S10-001 Q2/K01) và có thể tự nhận số liệu từ attendance (S09).

## 4. Diễn giải BA (tách bạch khỏi lời khách hàng)

- "Quản lý KPI" hiểu là **quản trị chỉ tiêu**: thư viện KPI (mẫu theo chức danh), định lượng (target/actual, đơn vị, hướng tốt hơn = cao hơn/thấp hơn) và định tính (rating), trọng số, chu kỳ đánh giá (tháng/quý/năm), gán cho nhân viên/phòng ban, cascade công ty → phòng ban → cá nhân. **Chưa rõ**: thư viện seed hay tenant tự tạo; cascade bao sâu; thang điểm.
- "Xử lý KPI" hiểu là **vận hành chu kỳ**: mở kỳ → nhân viên cập nhật actual (check-in) → chấm (self + manager) → tính điểm weighted → duyệt → khóa kết quả → xuất/publish. **Chưa rõ**: nguồn actual tự động từ đâu, luồng duyệt nhiều cấp hay 1 cấp, 360 feedback có cần không, xếp loại cuối kỳ.
- Gắn kết hệ thống: kết quả KPI chốt kỳ → **event qua outbox cho payroll tiêu thụ** (kênh KPI đã thiết kế ở Sprint 10 — CONF-S10-001 AC-K01); số liệu đầu vào có thể tự nhận từ attendance (VD: tỷ lệ đi muộn) qua cùng cơ chế event.
- Câu hỏi kiến trúc nổi bật: form builder (S08) có thể làm bản câu hỏi đánh giá định tính; công thức tính điểm KPI là **engine thuần** (pattern ADR-S09-003/004); duyệt KPI/kết quả qua workflow engine.

## 5. Ràng buộc đã biết (từ guardrails dự án, không phải yêu cầu mới)

1. Plugin độc lập, schema riêng, đăng ký Entity Registry; không đưa nghiệp vụ vào Core.
2. Multi-tenant: mọi bảng/job/query mang tenant context đã xác thực.
3. Backend Quarkus Java, frontend Angular 22 + Ionic 8; UI shared library, Drawer/Split-view, anti-modal; 100% i18n; 4 khuôn mẫu API; DTO/enum/ResponseKey chuẩn; engine công thức thuần test được.
4. Employee (S07) là nguồn nhân sự (chức danh, manager); organization giữ phòng ban; attendance (S09, đang code) là nguồn số liệu tự động tiềm năng; payroll (S10, approved) tiêu thụ kết quả KPI; workflow (S08, In Review) là cơ chế duyệt; notification (S06) là kênh thông báo.
5. Không viết unit test frontend; backend test trên PostgreSQL/Redis thật (No H2).
6. Mobile Ionic tối giản; plugin khai báo minh bạch Desktop/Mobile.

## 6. Câu hỏi mở cần làm rõ (chuyển sang ANL/CONF)

1. **Mô hình chỉ tiêu**: KPI định lượng (target/actual + hướng) và định tính (rating) đều cần? Thang điểm nào (100 điểm, 1–5, % hoàn thành)?
2. **Thư viện KPI**: seed mẫu theo nhóm chức danh (sales/HC/văn phòng…) hay tenant tự tạo hết?
3. **Phân cấp**: gán theo cá nhân là đủ, hay cần cascade công ty → phòng ban → cá nhân với kế thừa trọng số?
4. **Chu kỳ đánh giá**: cấu hình tự do (tháng/quý/năm) hay cố định; nhiều chu kỳ song song được không?
5. **Ai cập nhật actual**: nhân viên tự cập nhật (check-in) kèm minh chứng? Manager nhập hộ? Nguồn tự động từ plugin khác (attendance…)?
6. **Chấm điểm**: self-assessment + manager? Tỷ trọng cấu hình? Có cần 360 feedback (đồng nghiệp/phụ thuộc) ở v1?
7. **Công thức tính điểm**: achievement % theo target/actual × trọng số; công thức tùy chỉnh theo chỉ tiêu (như 1Office)? Kịch bản dạng "càng thấp càng tốt"?
8. **Duyệt**: KPI đầu kỳ cần duyệt trước khi chạy? Kết quả cuối kỳ duyệt qua workflow engine hay 1 cấp manager?
9. **Appraisal tổng hợp**: có cần đánh giá định kỳ tổng hợp nhiều nguồn (KPI + định tính + kỹ năng) như Odoo Appraisal, hay chỉ KPI thuần ở v1?
10. **KPI gắn lương**: kết quả kỳ chốt → event cho payroll (kênh đã mở ở Sprint 10)? Có cần quy tắc thưởng theo mức KPI ngay?
11. **Xếp loại cuối kỳ**: xếp loại (A/B/C/D) từ điểm tổng có cần không, có quy định phân bổ (distribution/forced curve) không?
12. **Dashboard & báo cáo**: tiến độ realtime, heatmap đơn vị, top/bottom performer — bộ nào ở v1?
13. **Cảnh báo & nhắc**: nhắc cập nhật actual định kỳ, cảnh báo KPI chậm tiến độ, quá hạn chấm — bộ nào?
14. **Mobile Ionic**: xem KPI + cập nhật actual + chấm + duyệt?
15. **Quyền riêng tư điểm số**: ai thấy điểm ai (self/manager/HR/all-company)? Điểm có công khai nội bộ không?
16. **Tích hợp form builder**: câu hỏi đánh giá định tính dùng form builder (S08) hay tự định nghĩa trong plugin?

> Danh sách câu hỏi trên là đầu vào thô; [ANL-S11-001](../02_analysis/01_ANL-S11-001_kpi_plugin.md) phân tích, [BENCH-S11-001](../03_benchmarks/01_BENCH-S11-001_kpi_okr_benchmarks.md) đối chuẩn, [CONF-S11-001](../04_confirmation/01_CONF-S11-001_sprint_11_scope_and_ac.md) chuẩn hóa thành câu hỏi tương tác + AC và xin duyệt.

## 7. Kết quả trả lời câu hỏi (cập nhật 0.2)

Toàn bộ 16 câu hỏi mở ở §6 đã được chủ dự án trả lời qua **hội thoại tương tác, 2026-11-02** (4 vòng theo 4 nhóm A–D). Bảng trả lời đầy đủ tại [CONF-S11-001 §2](../04_confirmation/01_CONF-S11-001_sprint_11_scope_and_ac.md). Tóm tắt: cả 2 loại chỉ tiêu + **thang tùy chọn per tenant**; seed thư viện theo nhóm chức danh; **cascade 3 tầng**; Σ=100% + self 30/manager 70; actual self + manager + đường tự động sẵn sàng; append-log; chu kỳ tự do tự kích hoạt; duyệt qua **workflow engine Sprint 08**; weighted + cap chuẩn; xếp loại theo ngưỡng; **chỉ publish kết quả** cho payroll; minh chứng text/link + **file signed URL**; dashboard + cảnh báo + heatmap + ranking; visibility self/manager/HR; mobile full self-service; câu hỏi định tính qua **form builder Sprint 08**. Gate vẫn Pending — chờ duyệt scope & AC tại CONF.

| Lịch sử | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Khởi tạo: nguyên văn yêu cầu, R1–R3, diễn giải, ràng buộc, 16 câu hỏi mở |
| 0.2 | 2026-11-02 | Bổ sung §7: 16/16 câu đã trả lời qua hội thoại tương tác 4 vòng; dẫn CONF-S11-001 0.2 |
