# [00] Sprint 08 — Plugin Form builder & Workflow (Biểu mẫu và Luồng công việc)

| Trường | Giá trị |
| :--- | :--- |
| ID / phiên bản / cập nhật | READ-S08-001 / 0.2 / 2026-11-02 |
| Trạng thái tài liệu / sprint | 🚧 **ĐANG THỰC HIỆN** — Bước 01–04 hoàn tất; **Scope & AC ✅ APPROVED 1.0** (CONF-S08-001, hội thoại tương tác 2026-11-02); bước 05–09 chờ Architect triển khai |
| Owner / reviewer | BA Agent / Chủ dự án (duyệt scope tại CONF) |
| Đầu vào / đọc trước | [RAW-S08-001](01_raw_notes/01_RAW-S08-001_form_workflow_plugin_requirements.md) — yêu cầu trực tiếp chủ dự án 2026-11-02 / [Sprint 07](../sprint_07_plugin_employee/00_READING_GUIDE.md) (đã đóng), [Sprint 06](../sprint_06_plugin_dev_platform/00_READING_GUIDE.md) |
| Đọc tiếp | [ANL-S08-001](02_analysis/01_ANL-S08-001_form_builder_plugin.md) → [ANL-S08-002](02_analysis/02_ANL-S08-002_workflow_plugin.md) → [BENCH-S08-001](03_benchmarks/01_BENCH-S08-001_form_builder_survey_benchmarks.md) → [BENCH-S08-002](03_benchmarks/02_BENCH-S08-002_workflow_engine_benchmark.md) → [CONF-S08-001](04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) |

## 1. Đọc để hiểu gì?

Sprint 08 xây **hai plugin nghiệp vụ độc lập** theo yêu cầu trực tiếp của chủ dự án:

1. **Plugin Form builder** (`form` — đề xuất) — tenant tự thiết kế biểu mẫu kiểu Google Forms: sections, nhiều loại câu hỏi, skip logic, phát hành link (nội bộ/công khai), thu và quản lý response, xuất dữ liệu, upload file.
2. **Plugin Workflow** (`workflow` — đề xuất) — tenant tự tạo luồng xử lý công việc: các bước phê duyệt/xử lý, điều kiện rẽ nhánh, người xử lý theo vai trò/quản lý trực tiếp, hạn xử lý-nhắc việc, task inbox "Việc của tôi", ghi vết toàn bộ luồng.

Hai plugin gắn chặt với nhau: **response của form là một nguồn kích hoạt tự nhiên của workflow** (đề xuất → duyệt nhiều cấp) — đúng mô hình Base.vn/MISA/JotForm mà [BENCH-S08-001](03_benchmarks/01_BENCH-S08-001_form_builder_survey_benchmarks.md) và [BENCH-S08-002](03_benchmarks/02_BENCH-S08-002_workflow_engine_benchmark.md) chỉ ra.

Sprint này **không** làm: chữ ký số (giữ chỗ trong mô hình hành động node), payment trong form, BPMN editor đồ thị tự do, single-use/login-required fill mode, mẫu in phiếu đề xuất (backlog). **Đã chốt tại CONF §2**: migration luồng duyệt employee sang workflow engine **làm ngay trong sprint** (phương án C — rủi ro cao nhất, điều kiện kiểm soát tại CONF §5).

### 1.1. Kiến thức nền cần có

| Chủ đề | Đọc trước | Vì sao cần |
| :--- | :--- | :--- |
| Nền tảng plugin | [Sprint 06](../sprint_06_plugin_dev_platform/00_READING_GUIDE.md) — zero-DB, soft ref, Entity Registry, WC/MF, event/outbox | Cả 2 plugin là plugin độc lập; trigger workflow phải đăng ký theo entity của plugin khác |
| Phân quyền & data scope | [Sprint 02](../sprint_02_superadmin_rbac/00_READING_GUIDE.md) | Response/quyền xử lý việc phải đi qua RBAC + data scope tenant/org/branch |
| Luồng duyệt hiện có | Sprint 07 — approval config, đề xuất cập nhật hồ sơ, sơ đồ node | Câu hỏi kiến trúc: luồng employee giữ riêng hay quy về engine chung (ANL-S08-002 §5) |
| Storage & signed URL | Sprint 07 — signed URL HMAC, ClamAV | Upload file trong form bắt buộc đi qua platform storage |
| Thông báo | Sprint 06/07 — notification plugin | Nhắc việc, thông báo response mới, CC người liên quan |

### 1.2. Kết quả nghiên cứu đối thủ (tóm tắt điều hướng)

- **[BENCH-S08-001 — Form builder]** 10 sản phẩm (Google, Microsoft, Typeform, JotForm, Formbricks, LimeSurvey, Odoo Survey, Frappe Web Form, NocoBase, MISA/Base). Bài học cốt lõi: một lõi form hai chế độ (survey tự do + form gắn entity qua Entity Registry); response lưu **JSONB + form_version** (bài học ngược LimeSurvey); question `ref` ổn định là hợp đồng tích hợp; logic kiểu Formbricks (operator theo loại câu hỏi, chống vòng lặp); responder tách user với single-use link; tích hợp outbox → webhook → workflow.
- **[BENCH-S08-002 — Workflow]** 10 nhóm sản phẩm (Odoo, Frappe, Camunda 8, Temporal, n8n, Zapier/Make, NocoBase, Appsmith/Budibase, Flowable, Base.vn/MISA/1Office). Bài học cốt lõi: tách definition/instance + versioning; trigger qua entity event là yêu cầu số 1; **state machine tự viết cho v1**, học semantics của Flowable, nhúng Flowable OSS chỉ khi cần BPMN thật; task inbox bắt buộc; assignment đa tầng (user/role/manager-of/query) + chặn self-approval; SLA = hạn + nhắc + quá hạn vẫn duyệt được (chuẩn kỳ vọng VN); event log append-only vẽ lại luồng đã đi; multi-tenant xuyên suốt.

## 2. Lộ trình đọc

Khách hàng đọc **01 → 03** (hiểu yêu cầu + đối chuẩn) rồi chờ CONF; developer đọc thêm 04–09 sau khi scope duyệt.

| Thứ tự | ID | Link file | Nội dung/câu hỏi được giải đáp | Owner |
| :--- | :--- | :--- | :--- | :--- |
| 01.01 | RAW-S08-001 | [Yêu cầu gốc 2 plugin](01_raw_notes/01_RAW-S08-001_form_workflow_plugin_requirements.md) | Nguyên văn yêu cầu, R1–R3, diễn giải BA, ràng buộc, 12 câu hỏi mở | BA |
| 02.01 | ANL-S08-001 | [Phân tích plugin form builder](02_analysis/01_ANL-S08-001_form_builder_plugin.md) | 14 US, scope in/out đề xuất, BR-F01…F10, edge case, câu hỏi CONF | BA |
| 02.02 | ANL-S08-002 | [Phân tích plugin workflow](02_analysis/02_ANL-S08-002_workflow_plugin.md) | 13 US, scope in/out đề xuất, BR-W01…W12, phương án quan hệ employee, edge case, câu hỏi CONF | BA |
| 03.01 | BENCH-S08-001 | [Đối chuẩn form builder](03_benchmarks/01_BENCH-S08-001_form_builder_survey_benchmarks.md) | 10 sản phẩm, 12 bài học, khoảng trống cần kiểm chứng thêm | BA |
| 03.02 | BENCH-S08-002 | [Đối chuẩn workflow engine](03_benchmarks/02_BENCH-S08-002_workflow_engine_benchmark.md) | 10 nhóm sản phẩm, bảng tổng hợp, 12 bài học, nguồn đã đọc | BA |
| 04.01 | CONF-S08-001 | [Scope, AC & câu trả lời](04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) | ✅ **APPROVED 1.0** — 16/16 câu; 15 AC-F + 15 AC-W + ma trận D/M; rủi ro Q2/Q3/Q4/Q12 | BA + Khách hàng |
| 05–09 | SOL/DES/ITEM/TP-TR/REV | *(chưa soạn — scope đã duyệt, Architect bắt đầu bước 05)* | Nghiên cứu giải pháp, thiết kế DB/API/UI, items, kiểm thử, nghiệm thu | Architect/Developer/QA/PM |

> Bảng đọc là snapshot. Không tạo link giả cho artifact chưa tồn tại; khi tạo file phải cập nhật index trước khi giao việc.

## 3. Gate riêng biệt

| Gate | Trạng thái | Người quyết định | Nguồn/phiên bản/ngày |
| :--- | :--- | :--- | :--- |
| Scope & AC (CONF-S08-001) | ✅ **APPROVED 1.0** — 16/16 câu trả lời; chủ dự án duyệt qua hội thoại tương tác (đã nhắc rõ rủi ro Q3) | Chủ dự án | CONF-S08-001 1.0, 2026-11-02 |
| Design ready (SOL/ADR/DES) | ⏳ Pending | Architect + Chủ dự án | — |
| Implementation | ⏳ Pending | Developer | — |
| QA sign-off | ⏳ Pending | QA | — |
| PM DoD / Customer acceptance | ⏳ Pending | Chủ dự án | — |
| Sprint closure | ⏳ Pending | PM | — |

## 4. Danh mục ID và việc chuyển tiếp

| TYPE/ID | File hoặc reservation | Owner | Tình trạng cấp số |
| :--- | :--- | :--- | :--- |
| READ-S08-001 | [00_READING_GUIDE.md](00_READING_GUIDE.md) | BA | Used — 0.1 |
| RAW-S08-001 | [01_raw_notes/](01_raw_notes/) | BA | Used — Draft 0.2 (16/16 câu đã trả lời) |
| ANL-S08-001, ANL-S08-002 | [02_analysis/](02_analysis/) | BA | Used — Draft 0.1 |
| BENCH-S08-001, BENCH-S08-002 | [03_benchmarks/](03_benchmarks/) | BA | Used — Draft 0.1 |
| CONF-S08-001 | [04_confirmation/](04_confirmation/) | BA + Khách hàng | Used — **APPROVED 1.0** (16/16 câu trả lời + duyệt scope) |
| FEAT/TASK/BUG | *(chưa cấp)* | Developer/QA | Không cấp số trước khi CONF duyệt scope |

## 5. Liên hệ với các Sprint trước

| Nguồn | Tài sản hiện có | Sprint 08 dùng thế nào |
| :--- | :--- | :--- |
| Sprint 01–02 | `users`, `user_tenants`, RBAC, data scope, `branches`, `departments`, `direct_manager_user_id` | Assignment "quản lý trực tiếp" đọc từ tổ chức; quyền xử lý việc theo role/scope; không tạo user mới trong plugin |
| Sprint 05 | Catalog (`catalog_item_id`) | Form câu hỏi tham chiếu danh mục khi cần (nếu khách duyệt) |
| Sprint 06 | Plugin scaffold, `plugin.json`, Entity Registry, soft ref, WC/MF slots, notification, event/outbox | Cả 2 plugin đóng gói theo platform; trigger workflow đăng ký theo entity đã đăng ký; response form phát event |
| Sprint 07 | Storage signed URL + ClamAV; approval config employee; mobile plugin host | Upload file form; câu hỏi A/B/C về thống nhất luồng duyệt; xử lý việc trên Mobile |

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Khởi tạo Sprint-Pack 08: RAW (R1–R3 + 12 câu hỏi mở), ANL-S08-001 (form builder), ANL-S08-002 (workflow), BENCH-S08-001 (10 sản phẩm form), BENCH-S08-002 (10 nhóm sản phẩm workflow); gate Pending; CONF reserved | BA Agent; yêu cầu trực tiếp chủ dự án 2026-11-02 |
| 0.2 | 2026-11-02 | Chủ dự án trả lời **16/16 câu** qua hội thoại tương tác (4 vòng); soạn CONF-S08-001 0.1 (scope + 30 AC + ma trận D/M + rủi ro Q2/Q3/Q4/Q12); RAW nâng 0.2 ghi nhận; gate vẫn Pending — chờ duyệt scope & AC | BA Agent; hội thoại tương tác chủ dự án |
| 0.3 | 2026-11-02 | **Scope & AC APPROVED 1.0** — chủ dự án chọn "Duyệt scope" sau khi được nhắc rủi ro Q3; CONF nâng 1.0; bước 05 (SOL) mở cho Architect | BA Agent; hội thoại tương tác chủ dự án |
