# [RAW-S08-001] Yêu cầu gốc: 2 plugin Sprint 08 — Form builder & Workflow

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | RAW-S08-001 / Yêu cầu gốc / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.2 / 2026-11-02 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | Hội thoại trực tiếp với chủ dự án 2026-11-02 |
| Đọc trước / đọc tiếp | [Sprint 07 — đã đóng](../../sprint_07_plugin_employee/00_READING_GUIDE.md) / [ANL-S08-001](../02_analysis/01_ANL-S08-001_form_builder_plugin.md), [ANL-S08-002](../02_analysis/02_ANL-S08-002_workflow_plugin.md) |

## 1. Nguồn yêu cầu

Nguồn duy nhất: hội thoại trực tiếp giữa chủ dự án và Agent điều phối, ngày 2026-11-02, ngay sau khi Sprint 07 được đóng ("ok đóng sprint 7 tại đây").

## 2. Nguyên văn lời khách hàng

> "bắt đầu cho sprint 8. mục tiêu sprint 8 là tạo ra 2 plugin: 1 là plugin tương tự google form, 2 là plugin tạo workflow và xử lý công việc theo workflow. Bạn thử tìm hiểu các đối khác đang xử lý 2 plugin kiểu như thế này như thế nào?"

Phần cuối của lời nhắn là chỉ định việc nghiên cứu đối thủ — đã thực hiện tại bước 03 ([BENCH-S08-001](../03_benchmarks/01_BENCH-S08-001_form_builder_survey_benchmarks.md), [BENCH-S08-002](../03_benchmarks/02_BENCH-S08-002_workflow_engine_benchmark.md)).

## 3. Bóc tách yêu cầu thô

| # | Yêu cầu thô | Nguồn |
| :--- | :--- | :--- |
| R1 | Tạo **plugin form builder tương tự Google Forms** — thiết kế biểu mẫu, thu thập câu trả lời | Hội thoại 2026-11-02 |
| R2 | Tạo **plugin workflow — tạo workflow và xử lý công việc theo workflow** | Hội thoại 2026-11-02 |
| R3 | Nghiên cứu cách các đối thủ xử lý 2 loại plugin này **trước khi** thiết kế | Hội thoại 2026-11-02 |

Mục tiêu sprint phát biểu bởi khách hàng là **"tạo ra 2 plugin"** — tức Sprint 08 dự kiến phải bàn giao sản phẩm chạy được cho cả hai plugin, không chỉ thiết kế. Phạm vi chi tiết từng tính năng chưa được phát biểu → thuộc trách nhiệm phân tích (bước 02) và xác nhận (bước 04).

## 4. Diễn giải BA (tách bạch khỏi lời khách hàng)

- "Tương tự Google Forms" hiểu là **form builder**: kéo-thảo/thiết kế form (sections, nhiều loại câu hỏi, logic điều kiện), phát hành link (nội bộ và/hoặc công khai), thu response, xem/tổng hợp/xuất response. **Chưa rõ** khách muốn sâu tới mức nào: quiz/scoring, payment, e-sign, form public cho người ngoài tenant, form gắn entity plugin khác.
- "Tạo workflow và xử lý công việc theo workflow" hiểu là **workflow engine**: tenant tự định nghĩa luồng (các bước, điều kiện rẽ nhánh, người xử lý), instance chạy theo luồng, người dùng nhận việc/xử lý (task inbox), có trạng thái/audit. **Chưa rõ**: cần BPMN hay state machine, SLA/nhắc việc, song song hay tuần tự, gắn với entity plugin nào.
- Nghiệp vụ giá trị cao nhất theo quan sát thị trường (và cả Sprint 07): **form là đầu vào → response đi qua luồng duyệt nhiều cấp** → 2 plugin này có quan hệ tích hợp chặt với nhau; bài học đối chuẩn (Base.vn, MISA, JotForm) cũng chỉ về hướng này.

## 5. Ràng buộc đã biết (từ guardrails dự án, không phải yêu cầu mới)

1. Plugin độc lập, schema riêng, đăng ký Entity Registry; không đưa nghiệp vụ vào Core.
2. Multi-tenant: mọi bảng/job/query phải mang tenant context đã xác thực; dữ liệu không rò rỉ chéo.
3. Backend Quarkus Java, frontend Angular 22 + Ionic 8; UI shared library, Drawer/Split-view, anti-modal; 100% i18n; 4 khuôn mẫu API; DTO/enum/ResponseKey chuẩn.
4. File upload phải qua storage platform có signed URL + virus scan (Sprint 07 đã có).
5. Không viết unit test frontend; backend test trên PostgreSQL/Redis thật.
6. Mobile Ionic là bản tối giản so với Web; plugin khai báo minh bạch chức năng Desktop/Mobile.

## 6. Câu hỏi mở cần làm rõ (chuyển sang ANL/CONF)

1. Form có cần **public cho người ngoài tenant** (khách hàng, ứng viên điền) hay chỉ nội bộ?
2. Form response có cần **ghi vào entity của plugin khác** (qua Entity Registry) hay lưu độc lập?
3. Cần **quiz/scoring/certification** không?
4. File upload trong form: cần không, giới hạn nào?
5. Workflow cần **rẽ nhánh theo dữ liệu** và **bước song song** ở v1 không?
6. Ai được phép tạo/sửa workflow — Tenant Admin hay rộng hơn?
7. Workflow có **thay thế/thống nhất luồng duyệt** mà Sprint 07 đã dựng riêng trong employee plugin không, hay song song?
8. Có cần **SLA — hạn xử lý, nhắc việc, escalation, báo cáo quá hạn** ở v1 không (đối chuẩn VN coi là mặc định)?
9. Có cần **webhook/API ngoài** kích hoạt workflow không?
10. Mobile Ionic cần hỗ trợ tới đâu: chỉ xem/xử lý việc, hay cả thiết kế form/luồng?
11. Kỳ vọng **số lượng luồng/độ phức tạp** để chọn engine (state machine tự viết vs BPMN engine Java)?
12. Chữ ký số trong luồng duyệt có nằm trong Sprint 08 không?

> Danh sách câu hỏi trên là đầu vào thô; [ANL-S08-001](../02_analysis/01_ANL-S08-001_form_builder_plugin.md) và [ANL-S08-002](../02_analysis/02_ANL-S08-002_workflow_plugin.md) phân tích, [CONF-S08-001](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) chuẩn hóa thành AC và xin duyệt.

## 7. Kết quả trả lời câu hỏi (cập nhật 0.2)

Cả 12 câu hỏi mở ở §6 (cùng 4 câu phát sinh thêm từ phân tích) đã được chủ dự án trả lời qua **hội thoại tương tác 16 câu, 2026-11-02**. Bảng trả lời đầy đủ tại [CONF-S08-001 §2](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md). Tóm tắt: anonymous link; map entity ngay v1; migrate employee ngay Sprint 08 (phương án C); có bước song song; lõi 10 loại + upload + matrix; có quiz; đủ 4 response UX; rate limit + captcha; cả 3 chế độ duyệt; đủ 3 nhóm assignment; SLA hạn + nhắc + ghi quá hạn; auto-action đầy đủ + webhook ngoài; mobile điền + xử lý việc; chữ ký số để sau; báo cáo có hiệu suất duyệt; mẫu in để sau.

| Lịch sử | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Khởi tạo: nguyên văn yêu cầu, R1–R3, diễn giải, ràng buộc, 12 câu hỏi mở |
| 0.2 | 2026-11-02 | Bổ sung §7: 12/12 câu hỏi mở đã trả lời qua hội thoại tương tác 16 câu; dẫn CONF-S08-001 |
