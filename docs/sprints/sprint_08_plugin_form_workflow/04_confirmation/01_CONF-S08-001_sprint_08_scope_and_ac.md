# [CONF-S08-001] Scope, Acceptance Criteria & Câu hỏi — Sprint 08: Plugin Form builder & Workflow

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | CONF-S08-001 / Xác nhận / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | **✅ APPROVED 1.0 / 2026-11-02** — chủ dự án duyệt scope & AC qua hội thoại tương tác |
| Owner / reviewer | BA Agent / Chủ dự án (người duyệt) |
| Đầu vào | [RAW-S08-001](../01_raw_notes/01_RAW-S08-001_form_workflow_plugin_requirements.md) 0.2, [ANL-S08-001](../02_analysis/01_ANL-S08-001_form_builder_plugin.md), [ANL-S08-002](../02_analysis/02_ANL-S08-002_workflow_plugin.md), [BENCH-S08-001](../03_benchmarks/01_BENCH-S08-001_form_builder_survey_benchmarks.md), [BENCH-S08-002](../03_benchmarks/02_BENCH-S08-002_workflow_engine_benchmark.md) |
| Đọc trước / đọc tiếp | [ANL-S08-002](../02_analysis/02_ANL-S08-002_workflow_plugin.md) / [00_READING_GUIDE](../00_READING_GUIDE.md) — bước 05 SOL (chưa soạn, mở sau khi APPROVED) |

## 1. Mục tiêu Sprint 08

Bàn giao **2 plugin độc lập chạy được trên tenant thật**, theo yêu cầu trực tiếp của chủ dự án:

1. **Plugin `form`** — form builder kiểu Google Forms: thiết kế form, phát hành link công khai, thu response, map response vào entity plugin khác, quiz, upload file, quản trị response.
2. **Plugin `workflow`** — workflow engine: tenant tự tạo luồng (tuần tự + điều kiện + song song), trigger từ event của plugin khác + webhook ngoài, xử lý việc qua task inbox, SLA hạn + nhắc + ghi quá hạn, audit truy vết.
3. **Migration kiến trúc**: luồng duyệt đề xuất của plugin employee (Sprint 07) chuyển sang dùng workflow engine chung trong sprint này (phương án C).

## 2. Phạm vi đã chốt qua 16 câu hỏi tương tác

Nguồn: hội thoại tương tác giữa chủ dự án và Agent điều phối, **2026-11-02** (4 vòng, 16 câu, trả lời đầy đủ). Kết quả:

| # | Câu hỏi | Câu trả lời của chủ dự án |
| :--- | :--- | :--- |
| Q1 | Chế độ truy cập form v1 | **Anonymous link** (chỉ chế độ này) |
| Q2 | Map response vào entity plugin khác | **Map entity ngay v1** |
| Q3 | Quan hệ luồng duyệt employee | **C — Migrate ngay Sprint 08** |
| Q4 | Cấu trúc luồng | **Có bước song song** (song song + tuần tự + điều kiện) |
| Q5 | Bộ loại câu hỏi | **Lõi 10 loại + upload file + matrix** |
| Q6 | Quiz/scoring | **Có quiz cơ bản** |
| Q7 | Response UX | **Đủ cả 4**: summary biểu đồ, export CSV, thông báo response mới, đóng/mở + hạn thu |
| Q8 | Chống lạm dụng form public | **Rate limit + captcha tuỳ chọn** |
| Q9 | Chế độ duyệt node | **Cả 3**: 1 người là qua / tất cả (countersign) / tỉ lệ vote |
| Q10 | Kiểu assignment | **Cả 3 nhóm**: user cụ thể + RBAC role, quản lý trực tiếp (manager-of), query động theo dữ liệu |
| Q11 | SLA | **Hạn xử lý + nhắc trước hạn + quá hạn vẫn duyệt được, ghi dấu vào báo cáo** (không escalation chuyển cấp) |
| Q12 | Auto-action & tích hợp | **Đầy đủ + webhook ngoài** (node tự động gọi API + cập nhật entity; hệ ngoài khởi tạo luồng qua webhook có secret) |
| Q13 | Mobile Ionic | **Điền form + xử lý việc** (duyệt/trả về/reassign + xem tiến trình); builder chỉ trên Web |
| Q14 | Chữ ký số | **Để sau** (giữ chỗ trong mô hình hành động node) |
| Q15 | Báo cáo workflow | **Thêm hiệu suất duyệt** (quá hạn + tiến trình + thời gian trung bình từng bước/theo người duyệt) |
| Q16 | Mẫu in phiếu đề xuất | **Để sau** (backlog) |

### 2.1. Phạm vi In-Scope

**Plugin form:** builder Web (sections, kéo thứ tự, 12 loại câu hỏi lõi + section); `ref` ổn định; skip logic theo option; **map câu hỏi → trường entity qua Entity Registry, submit ghi thẳng vào entity đích**; anonymous link + đóng/mở/hạn thu/limit; fill page public (nhập email, lưu nháp, captcha + rate limit); upload file qua storage signed URL + ClamAV; quiz cơ bản; response table + summary + CSV + notification; form versioning; event `form.response.submitted` qua outbox.

**Plugin workflow:** definition JSON versioned (Draft/Published/Archived); instance pin version; node: START/END, APPROVAL, TASK, CONDITION, PARALLEL, AUTO_WEBHOOK, AUTO_ENTITY_UPDATE, CC; trigger: thủ công + API nội bộ + webhook ngoài (secret + rotate + log) + Entity Registry event; assignment 4 kiểu (USER/ROLE/MANAGER_OF/QUERY); duyệt 3 chế độ (anyone/countersign/vote); hành động Đồng ý/Từ chối (bắt buộc lý do)/Trả về/Reassign + chặn self-approval; task inbox; SLA hạn + nhắc + ghi quá hạn; timeline tiến trình; event log append-only; báo cáo quá hạn + hiệu suất duyệt; **migration luồng duyệt employee sang engine**.

**Mobile Ionic:** điền form public + task inbox (duyệt/trả về/reassign) + xem tiến trình luồng.

### 2.2. Phạm vi Out-of-Scope (backlog sprint sau)

Single-use link và chế độ yêu cầu đăng nhập khi điền form; certification/chứng chỉ; payment trong form; **chữ ký số** (giữ chỗ mô hình); **mẫu in phiếu đề xuất**; escalation tự chuyển cấp trên; BPMN editor đồ thị tự do; sub-workflow/call activity; dry-run luồng trong UI; template gallery.

## 3. Luồng nghiệp vụ chính

1. **Tạo & phát hành form**: Admin tạo form (builder) → cấu hình câu hỏi/logic/map entity → phát hành link anonymous → người ngoài điền (có captcha/rate limit) → response ghi vào entity đích (nếu map) + JSONB → event outbox.
2. **Tạo & chạy luồng**: Admin tạo luồng (bước, điều kiện, assignment, hạn) → phát hành → trigger (event entity/form response, webhook ngoài, thủ công) → instance chạy theo version pin → task đổ inbox → người xử lý duyệt/trả về/reassign → luồng kết thúc + event log.
3. **Tích hợp 2 plugin**: response form mới → event → workflow instance → luồng duyệt nhiều cấp → kết quả cập nhật entity.
4. **Migration employee**: luồng duyệt đề xuất hồ sơ nhân viên chạy trên workflow engine; hành vi + quyền giữ nguyên so với Sprint 07; cutover qua migration/backup an toàn.

## 4. Acceptance Criteria

Ma trận: **D** = Desktop (web ≥ 1280px), **M** = Mobile Ionic (390×844).

| AC | Nội dung | D | M |
| :--- | :--- | :-: | :-: |
| AC-F01 | Builder thiết kế form: sections, kéo thứ tự, câu hỏi thuộc bộ 12 loại (text ngắn/dài, single/multi choice, dropdown, date, number, rating, file upload, matrix, section), cấu hình bắt buộc/validation/placeholder | D | — |
| AC-F02 | Mỗi question có `ref` ổn định; hệ thống chặn đổi `ref` khi form đã có response | D | — |
| AC-F03 | Skip logic gắn theo option của choice; chỉ tham chiếu câu hỏi phía trước; server-side validate chống vòng lặp | D | M* |
| AC-F04 | Map câu hỏi → trường entity đã đăng ký Entity Registry; submit ghi vào entity đích qua API plugin đích; mapping lỗi không mất response (lưu JSON + đánh dấu lỗi) | D | — |
| AC-F05 | Phát hành anonymous link; đóng/mở thu, ngày đóng, giới hạn số response, thông báo đóng | D | M* |
| AC-F06 | Fill page public: không cần đăng nhập, nhập responder_email, lưu nháp, xác nhận sau submit; rate limit theo IP + captcha tuỳ chọn | D | M |
| AC-F07 | Upload file: giới hạn loại/số lượng/dung lượng theo câu hỏi; qua storage signed URL + ClamAV; download bằng signed URL ngắn hạn | D | M |
| AC-F08 | Quiz cơ bản: flag quiz + grading từng câu (đáp án đúng, điểm, feedback) + tổng điểm khi submit | D | M* |
| AC-F09 | Response table filter thời gian/trạng thái + chi tiết từng response | D | — |
| AC-F10 | Summary tổng hợp từng câu (count choice, avg rating/number) | D | — |
| AC-F11 | Export CSV, cột theo `ref` | D | — |
| AC-F12 | Thông báo response mới cho chủ form (bật/tắt) | D | M |
| AC-F13 | Form versioning: sửa sau khi có response → version mới; response pin `form_version` | D | — |
| AC-F14 | Submit idempotent; event `form.response.submitted` qua outbox (consumer: workflow/webhook) | — | — |
| AC-W01 | Builder thiết kế luồng: bước tuần tự + điều kiện rẽ nhánh (field–phép toán–giá trị, VÀ/HOẶC) + bước song song fork/join | D | — |
| AC-W02 | Node types: START/END, APPROVAL, TASK, CONDITION, PARALLEL, AUTO_WEBHOOK, AUTO_ENTITY_UPDATE, CC | D | — |
| AC-W03 | Definition Draft/Published/Archived; chỉ Published khởi tạo được; instance pin `definition_version` | D | — |
| AC-W04 | Trigger: thủ công, API nội bộ, webhook ngoài (secret + rotate + log payload), Entity Registry event (created/updated/status_changed, form response) | D | — |
| AC-W05 | Assignment: USER, ROLE, MANAGER_OF (từ tổ chức Sprint 02), QUERY động; resolve lúc kích hoạt; candidate pool + claim | D | — |
| AC-W06 | Chế độ duyệt theo node: anyone / countersign / vote (tỉ lệ %) | D | M |
| AC-W07 | Hành động: Đồng ý / Từ chối (bắt buộc lý do) / Trả về bước đã đi / Reassign (scope + audit); chặn self-approval mặc định | D | M |
| AC-W08 | Task inbox "Việc của tôi": chờ/quá hạn, claim, mở bối cảnh gốc (form/entity) bằng Drawer/Split-view, không modal | D | M |
| AC-W09 | SLA: hạn từng bước (thời gian hoặc từ trường dữ liệu), nhắc trước hạn, quá hạn vẫn duyệt + ghi dấu overdue; scheduler multi-tenant idempotent | D | M* |
| AC-W10 | Tiến trình luồng cho người theo dõi: bước xong/đang chờ ai/bị trả về vì sao; timeline từ event log | D | M |
| AC-W11 | Event log append-only mọi thao tác (actor, trước/sau, comment; hệ thống actor=SYSTEM) | — | — |
| AC-W12 | Báo cáo: instance theo trạng thái, việc quá hạn, hiệu suất duyệt (thời gian trung bình từng bước, theo người duyệt/theo luồng) | D | — |
| AC-W13 | **Migration employee**: luồng duyệt đề xuất hồ sơ chạy trên workflow engine, hành vi giữ nguyên so với Sprint 07; cutover qua migration/backup an toàn; test backend hiện có vẫn PASS | D | M |
| AC-W14 | Tenant isolation: mọi bảng/job mang `tenant_id` đã xác thực; test isolation là hạng mục nghiệm thu | — | — |
| AC-W15 | Multi-platform: builder chỉ Desktop; điền form + inbox duyệt + tiến trình trên Mobile | D | M |

M\* = hiển thị đúng trạng thái trên Mobile (không cấu hình). Backend test: JUnit 5 + RestAssured trên PostgreSQL/Redis thật (No H2); frontend không viết unit test; QA browser hai chế độ Desktop + Mobile emulation, 0 console error.

## 5. Rủi ro cần chủ dự án lưu ý (đã chọn ở Q2/Q3/Q4/Q12)

1. **Q3 — Migrate employee ngay (C)**: rủi ro cao nhất của sprint — hệ đang production với 254 test PASS. Điều kiện bắt buộc: giữ 100% hành vi hiện có, migration/backup/rollback drill (pattern Sprint 07), nếu phát sinh blocker thì Architect đề xuất lùi về phương án B trước khi sửa scope.
2. **Q2 — Map entity ngay (v1)**: phụ thuộc schema ổn định của plugin đích qua Entity Registry; khi plugin đích đổi schema cần hợp đồng version cho mapping (thiết kế ở bước 05–06).
3. **Q4 + Q9 — song song + 3 chế độ duyệt + Q10 query động**: làm state machine v1 phức tạp hơn đáng kể so với tuần tự thuần; Architect phải thiết kế kỹ parallel fork/join và resolve assignment.
4. **Q12 — Webhook ngoài khởi tạo luồng**: mở bề mặt public — bắt buộc secret + rotate + log payload + rate limit.

## 6. Confirmation Gate

| Mục | Trạng thái |
| :--- | :--- |
| 16/16 câu hỏi scope đã trả lời | ✅ (hội thoại tương tác 2026-11-02) |
| Duyệt scope & AC (bảng §2, §4) | ✅ **APPROVED 1.0** — chủ dự án chọn "Duyệt scope" qua hội thoại tương tác 2026-11-02 (đã được nhắc rõ rủi ro Q3 — migrate employee ngay) |
| Chuyển sang bước 05 (SOL) | ✅ Đã mở — Architect nghiên cứu giải pháp, không tự thay đổi scope/AC |

> Lịch sử: 0.1 (2026-11-02) — soạn từ 16 câu trả lời tương tác; **1.0 (2026-11-02) — APPROVED bởi chủ dự án qua hội thoại tương tác, nội dung 0.1 giữ nguyên**. Đổi scope/AC sau này phải xác nhận phần thay đổi và tăng phiên bản.
