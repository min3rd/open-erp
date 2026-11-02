# [ANL-S08-001] Phân tích yêu cầu: Plugin Form builder (kiểu Google Forms)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S08-001 / Phân tích / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S08-001](../01_raw_notes/01_RAW-S08-001_form_workflow_plugin_requirements.md) (R1), [BENCH-S08-001](../03_benchmarks/01_BENCH-S08-001_form_builder_survey_benchmarks.md) |
| Đọc trước / đọc tiếp | [RAW-S08-001](../01_raw_notes/01_RAW-S08-001_form_workflow_plugin_requirements.md) / [00_READING_GUIDE](../00_READING_GUIDE.md) — bước 04 CONF (chưa soạn) |

## 1. Vấn đề và phạm vi tài liệu

Plugin form builder trả lời câu hỏi: **tenant có thể tự thiết kế biểu mẫu thu thập dữ liệu — nội bộ lẫn công khai — mà không cần dev viết code, dữ liệu trả lời được quản lý an toàn theo tenant và gắn được vào nghiệp vụ ERP không?**

Tài liệu này phân tích R1 từ [RAW-S08-001](../01_raw_notes/01_RAW-S08-001_form_workflow_plugin_requirements.md) thành User Stories, quy tắc nghiệp vụ, ranh giới scope đề xuất và edge case, làm đầu vào cho CONF-S08-001 (chưa soạn). Đối chiếu đối thủ chi tiết tại [BENCH-S08-001](../03_benchmarks/01_BENCH-S08-001_form_builder_survey_benchmarks.md).

## 2. User Stories đề xuất

| US | Nội dung | Đối chuẩn tham chiếu |
| :--- | :--- | :--- |
| US-F01 | **Là Tenant Admin/Editor, tôi thiết kế form bằng builder trực quan** (sections, drag thứ tự, nhiều loại câu hỏi) để thu thập dữ liệu mà không cần dev | Google Forms, JotForm, Formbricks |
| US-F02 | **Là người soạn form, tôi cấu hình từng câu hỏi** (bắt buộc, placeholder, validation, mô tả trợ giúp) để dữ liệu thu về sạch | Tất cả |
| US-F03 | **Là người soạn form, tôi tạo skip logic** (option dẫn tới section/câu khác, hoặc kết thúc form) để form tự động phù hợp từng người điền | Google (option→section), Formbricks (operator theo type) |
| US-F04 | **Là Tenant Admin, tôi phát hành form theo 1 trong các chế độ truy cập**: anonymous link / yêu cầu đăng nhập / single-use link, kèm mở-đóng thu response | Google, Frappe (public/login/key), Formbricks (singleUse) |
| US-F05 | **Là người ngoài tenant (khách hàng, ứng viên), tôi điền form qua link công khai** mà không cần tài khoản, có chống lạm dụng (rate limit, tuỳ chọn captcha) | Google, Typeform |
| US-F06 | **Là người điền form, tôi được lưu nháp/tiếp tục**, thấy xác nhận sau khi gửi (và tuỳ chọn nhận email xác nhận) | Google receipts, Formbricks followUps |
| US-F07 | **Là chủ form, tôi xem danh sách response dạng bảng**, filter theo thời gian/trạng thái, xem chi tiết từng response | Tất cả |
| US-F08 | **Là chủ form, tôi xem summary tổng hợp từng câu hỏi** (count choice, avg rating/number) để ra quyết định nhanh | Google Summary, Odoo See results |
| US-F09 | **Là chủ form, tôi xuất CSV** (cột theo question `ref`) để phân tích ngoài | Tất cả |
| US-F10 | **Là chủ form, tôi nhận thông báo khi có response mới** (notification platform/email, bật-tắt được) | Google email notification |
| US-F11 | **Là người soạn form, tôi map câu hỏi tới trường của entity đã đăng ký trong Entity Registry** để response ghi thẳng vào nghiệp vụ (đề xuất, hồ sơ...) | Frappe (submission = DocType), NocoBase (form↔collection) |
| US-F12 | **Là Tenant Admin, tôi cấu hình upload file trong form** với giới hạn loại/kích thước; file đi qua storage platform có signed URL + virus scan | Google fileUpload, Sprint 07 storage |
| US-F13 | **Là chủ form, tôi bật chế độ quiz** (đáp án đúng, điểm, feedback) khi form dùng cho đào tạo/đánh giá | Google isQuiz, Odoo scoring |
| US-F14 | **Là Tenant Admin, tôi cấu hình form phát event khi có response** để trigger workflow plugin / webhook ra ngoài | NocoBase (form submit → workflow), Typeform webhook |

## 3. Ranh giới scope đề xuất (chờ CONF duyệt)

**In-Scope đề xuất (v1):** builder + 10–12 loại câu hỏi lõi (short/long text, single/multi choice, dropdown, date, number, rating, file upload, section, grid/matrix đơn giản); skip logic theo option; 3 chế độ truy cập (anonymous/login/single-use); response table + summary + CSV; notification; quiz cơ bản; event outbox để trigger workflow; phiên bản form (form_version) gắn từng response.

**Out-of-Scope đề xuất (làm sau nếu có nhu cầu):** cộng tác soạn form realtime nhiều editor; expression DSL phức hợp (LimeSurvey ExpressionScript); payment/e-sign trong form; chứng chỉ/certification email; survey targeting in-app kiểu Formbricks SDK; dử liệu phản hồi dạng bảng quan hệ per-survey (LimeSurvey) — dùng JSONB; template gallery lớn.

**Out-of-Scope tuyệt đối:** đưa form builder vào Core; response lưu thiếu tenant_id; public form tạo user/tenant member tự động.

## 4. Quy tắc nghiệp vụ đề xuất

| BR | Quy tắc | Nguồn bài học |
| :--- | :--- | :--- |
| BR-F01 | Form là document JSON có thứ tự (sections/questions), mỗi question có `ref` ổn định không trùng trong form; đổi `ref` chỉ cho phép khi form chưa có response | Typeform ref, BENCH §4.3 |
| BR-F02 | Response lưu: header (form_id, form_version, tenant, thời gian, responder_email, submitted_by_user_id nullable) + answers JSONB; không tạo bảng cột per-survey | BENCH §4.2 (bài học ngược LimeSurvey) |
| BR-F03 | Skip logic chỉ được tham chiếu câu hỏi phía trước; server-side validate kể cả vòng lặp; operator bó theo loại câu hỏi | Formbricks, Typeform, BENCH §4.4 |
| BR-F04 | Response của người ngoài tenant không tạo tài khoản; `responder_email` tách khỏi `submitted_by_user_id` | BENCH §4.6 |
| BR-F05 | Quyền response đi qua 2 lớp: RBAC plugin (form.manage / form.view_responses / response.export) + data scope tenant/org/branch như employee | BENCH §4.7 |
| BR-F06 | File upload: giới hạn theo câu hỏi (extension, số file, MB); bắt buộc qua storage + virus scan; link public là signed URL ngắn hạn; xoá response cần job dọn file | BENCH §4.8 |
| BR-F07 | Form sửa sau khi có response → sinh version mới; response cũ giữ nguyên form_version; đổi cấu trúc câu hỏi không phá dữ liệu cũ | Google revisionId, BENCH §4.2 |
| BR-F08 | Submit response là sự kiện idempotent: gửi trùng (double-click, retry) không sinh response nhân bản; phát event `form.response.submitted` qua outbox | Platform outbox, BENCH §4.10 |
| BR-F09 | Mọi nhãn form builder/i18n dùng mã dịch; nội dung câu hỏi là dữ liệu tenant (không thuộc từ điển i18n) | Guardrails dự án |
| BR-F10 | Form đóng/thu (manual + close date + response limit) vẫn hiển thị thông báo cho người điền muộn | Google, Formbricks surveyClosedMessage |

## 5. Dữ liệu nhạy cảm và phân quyền

- Response có thể chứa dữ liệu cá nhân (CCCD nếu tenant hỏi). Áp nguyên tắc: chỉ thu khi chủ form thiết kế câu hỏi; phân loại trường nhạy cảm để mask ở danh sách nếu cần; audit xem chi tiết response của người khác.
- Form public là **bề mặt tấn công**: rate limit theo IP, captcha tuỳ chọn, không leak danh sách response qua API public, single-use link có revoke.
- Chữ "anonymize" (không lưu IP, tách token khỏi response) là tuỳ chọn cấu hình form.

## 6. Edge case chính

1. Form đang có người điền thì chủ form sửa câu hỏi → response nào theo version nào (BR-F07).
2. Hai admin cùng sửa form → lost update (cần revision/concurrency check kiểu Google batchUpdate).
3. Option bị xoá nhưng logic còn tham chiếu → validate lúc lưu.
4. File upload hết hạn signed URL khi người điền đang tải lại.
5. Response submit ngay lúc form bị đóng → server quyết định theo thời điểm nhận, trả thông báo nhất quán.
6. Form map entity mà plugin bị gỡ/đổi schema → ghi response vẫn phải thành công (lưu JSON), mapping đánh dấu lỗi, không mất dữ liệu.

## 7. Câu hỏi cần khách xác nhận

1. Public form cho người ngoài tenant có phải yêu cầu bắt buộc v1? (US-F05)
2. Form↔Entity Registry mapping (US-F11) là bắt buộc v1 hay để sau?
3. Quiz/scoring (US-F13) cần ở v1 không?
4. Chế độ truy cập nào là đủ: anonymous / login / single-use? (US-F04)
5. Bộ loại câu hỏi lõi ở §3 có được chấp nhận không, cần thêm/bớt loại nào?
6. Mobile Ionic: chỉ điền form + xử lý việc, hay cả builder?

> Danh sách này dẫn sang [00_READING_GUIDE](../00_READING_GUIDE.md) bước 04 — CONF-S08-001 (chưa soạn) sẽ xin duyệt chính thức.
