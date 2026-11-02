# [ADR-S08-003] Form public cho người ngoài tenant: anonymous session + public route

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ADR-S08-003 / Quyết định kiến trúc / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-02 |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | [CONF-S08-001](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) Q1/Q8 (anonymous link; rate limit + captcha), [BENCH-S08-001](../03_benchmarks/01_BENCH-S08-001_form_builder_survey_benchmarks.md) §4.6, khảo sát codebase (signed passthrough `PluginRuntimeGatewayResource`) |
| Đọc trước / đọc tiếp | [SOL-S08-001](01_SOL-S08-001_form_workflow_architecture.md) / [ADR-S08-004](05_ADR-S08-004_employee_migration_cutover.md) |

## 1. Vấn đề

CONF Q1 chốt v1 chỉ có **anonymous link**; Q8 chốt **rate limit + captcha tuỳ chọn**. Người ngoài tenant không có tài khoản, không có cookie phiên Core, nhưng vẫn phải: load giao diện điền form (WC), upload file (storage + ClamAV), submit (idempotent) — mà tenant isolation vẫn tuyệt đối (response ghi vào schema tenant của plugin `form`).

## 2. Quyết định

1. **Route công khai ở Core**: `GET /public/forms/{slug}` (không auth) — trang public tối giản nhúng WC `op-form-fill` của plugin form, không nằm trong layout đăng nhập. Host route mới tách khỏi `/apps/:pluginKey` (route đó yêu cầu đăng nhập).
2. **Anonymous plugin session**: Core endpoint mới `POST /api/v1/plugins/public-session/{pluginKey}` — cấp JWT `PLUGIN_RUNTIME` ngắn hạn (TTL 15 phút) **gắn tenant của form + user ẩn danh, permissions rỗng**; WC fill dùng token này gọi qua runtime gateway như bình thường. Endpoint chỉ cấp token cho plugin khai báo `public_access: true` trong manifest (mặc định từ chối) — không mở đường cấp token cho plugin khác.
3. **API public của plugin form** (đi qua gateway như mọi request, header tenant từ token ẩn danh):
   - `GET /api/v1/form/public/forms/{slug}` — definition view (chỉ trường cần fill, không leak cấu hình nhạy cảm/webhook).
   - `POST /api/v1/form/public/forms/{slug}/responses` — submit; bắt buộc `idempotency_key` (chống double-submit); trả response id + mã tham chiếu.
   - `POST /api/v1/form/public/forms/{slug}/files` — upload multipart; lưu qua pattern storage của form, `scan_status: PENDING` → ClamAV; download qua signed URL ngắn hạn (HMAC TTL 300s, exempt path như employee).
4. **Chống lạm dụng** (Q8): rate limit theo IP tại Core cho mọi path `/public/**` và `/api/v1/plugins/runtime/form/public/**` (bucket cố định, cấu hình `openerp.public.rate-limit.*`); captcha tuỳ chọn theo form (v1: `none` | `recaptcha-v3`, verify server-side bằng secret cấu hình; form bật captcha → submit kèm `captcha_token`).
5. **Giới hạn anonymous**: không xem response (API public không có endpoint đọc response); single-use link / login-required **không làm** (CONF Q1 — backlog).

## 3. Phương án loại trừ

| Phương án | Lý do loại |
| :--- | :--- |
| Serve trang HTML riêng từ container plugin | Phá mô hình WC/host hiện có; không có context theme/i18n; khó rate-limit nhất quán |
| anonymous tạo tenant member ẩn | Nghiêm cấm theo guardrail (không tự tạo tài khoản) |
| Form public lưu response ngoài tenant (bảng chung) | Phá tenant isolation |

## 4. Hệ quả và kiểm chứng

- (+) Reuse WC loader + runtime gateway + signed passthrough; tenant isolation giữ nguyên; token TTL ngắn hạn chế lạm dụng.
- (−) Core thêm 1 route public + 1 endpoint session + rate limit config — điểm công khai mới, phải có test bảo mật (token rỗng quyền, không đọc được response, hết hạn 401).
- Kiểm chứng: E2E ẩn danh trên tenant QA (mở link → điền → upload → submit → response xuất hiện trong tenant schema); rate limit chặn khi vượt; captcha bật/tắt; token hết hạn buộc refresh. AC truy vết: AC-F05, AC-F06, AC-F07, AC-W14.
