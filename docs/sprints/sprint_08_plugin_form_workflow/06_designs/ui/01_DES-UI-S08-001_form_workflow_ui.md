# [DES-UI-S08-001] Thiết kế UI/UX: Form builder, Fill public, Task inbox, Báo cáo

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-UI-S08-001 / Thiết kế UI / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.2 / 2026-11-02 — render response theo snapshot version; confirm tạo version khi sửa form đã publish |
| Owner / reviewer | Solution Architect / Chủ dự án (design review) |
| Đầu vào | [DES-ARCH-S08-001](../arch/01_DES-ARCH-S08-001_components_and_flows.md), [DES-API-S08-001](../api/01_DES-API-S08-001_form_workflow_api.md), [CONF-S08-001](../../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) ma trận D/M, [ui_ux_standards](../../../../../.agents/rules/ui_ux_standards.md) |
| Đọc trước / đọc tiếp | [DES-API-S08-001](../api/01_DES-API-S08-001_form_workflow_api.md) / [00_READING_GUIDE](../../00_READING_GUIDE.md) |

## 1. Nguyên tắc UI (guardrails)

- Mật độ cao (text-xs/sm, p-1/p-2, gap-1); **vuông vắn** (rounded-none/rounded-sm, viền neutral-200/800); **anti-modal** — mọi chi tiết bằng Drawer xếp tầng / Split-view / Router con; 100% i18n (mã `PLUGIN_FORM_*`, `PLUGIN_WORKFLOW_*` × 13 locale, bundle riêng từng plugin `META-INF/resources/i18n/`); shared components từ `@shared` (drawer, table, sharp-button/input/select, tab-strip, badge, pagination, section-nav, icon, skeleton) — cấm component ad-hoc trùng lặp; enum token `ColorVariant/SizeVariant/ShapeVariant`.

## 2. Plugin `form` — Web Component `op-form-app` (route `/apps/form`)

| Tab | Nội dung | Permission | D | M |
| :--- | :--- | :--- | :-: | :-: |
| `forms` | Bảng form (slug, trạng thái publish, số response, updated) + Drawer tạo/sửa | `form:definition:manage` | ✔ | — |
| `builder` | Split-view: trái = canvas sections/câu hỏi (kéo thứ tự), phải = panel thuộc tính câu hỏi (type, required, validation, options, logic, file limits, matrix, grading quiz); thanh trên: entity mapping (chọn plugin/entity/field từ Entity Registry qua API `entity-mapping-check`), preview | `form:definition:manage` | ✔ | — |
| `responses` | Split-view: bảng response + filter thời gian/trạng thái | trái, phải = chi tiết 1 response (answers render **theo document snapshot của `form_version` của response** — câu hỏi đã xoá vẫn hiện đúng label cũ; file download signed URL; entity_write_status) | `form:response:read` | ✔ | — |
| `summary` | Thẻ tổng hợp từng câu theo `ref` xuyên version (count/avg, mini-chart thuần CSS/SVG; ref không có trong version nào → không tính; label theo version mới nhất) + nút Export CSV | `form:response:read` | ✔ | — |

Builder chỉ Desktop (CONF Q13). Publish/close + captcha + close_at + response_limit đặt trong Drawer publish. Khi lưu thay đổi trên form đã PUBLISHED/đã có response → confirm "sẽ tạo version mới, dữ liệu cũ giữ nguyên theo version của nó"; sau lưu hiện version timeline (`version-timeline` từ `@shared`).

## 3. Public fill — `op-form-fill` (route `/public/forms/{slug}`, không đăng nhập)

- 1 trang cuộn theo sections (page-break); skip logic ẩn/hiện + nhảy section theo option; progress nhẹ; validation client + server; lưu nháp localStorage bị **cấm** (sandbox public) → lưu nháp phía server bằng draft response (status draft, TTL 24h).
- Upload file: chọn nhiều file theo giới hạn, hiện scan status; submit: nhập responder_email (tuỳ chọn), captcha nếu bật, nút gửi → màn xác nhận + mã tham chiếu.
- Mobile-first (390px ok), 0 console error; khong leak cấu hình (webhook, mapping).

## 4. Plugin `workflow` — Web Component `op-workflow-app` (route `/apps/workflow`)

| Tab | Nội dung | Permission | D | M |
| :--- | :--- | :--- | :-: | :-: |
| `inbox` (mặc định) | Task inbox: các mục chờ tôi / nhóm (claim) / quá hạn; mở task → Drawer xử lý: bối cảnh gốc (form response / entity) render trong drawer tầng 2, hành động Đồng ý/Từ chối (bắt buộc lý do)/Trả về (chọn bước)/Reassign | `workflow:task:action` | ✔ | ✔ |
| `flows` | Danh sách definition (key, version, trạng thái, số instance chạy) + builder | `workflow:definition:manage` | ✔ | — |
| `builder` | Split-view: trái = danh sách bước (thêm/sắp xếp, node song song gộp nhóm), phải = panel node (type, approval_mode + vote_ratio, assignment 4 kiểu + fallback, SLA hạn + nhắc, CC, auto webhook/entity); dựng điều kiện field–phép toán–giá trị (VÀ/HOẶC); publish version | `workflow:definition:manage` | ✔ | — |
| `runs` | Instance list + Split-view tiến trình: timeline từ event log (bước xong/đang chờ ai/bị trả về vì sao — AC-W10) | `workflow:instance:read` | ✔ | ✔ |
| `reports` | Thẻ KPI + bảng: instance theo trạng thái, quá hạn, thời gian TB từng bước / theo người duyệt (AC-W12) | `workflow:report:read` | ✔ | — |
| `webhooks` | Quản lý endpoint (tạo 1 lần xem secret, rotate, log gần nhất) | `workflow:definition:manage` | ✔ | — |

Contribution slot `core.layout.user-menu.items`: "Việc của tôi" (badge số task) — mở `/apps/workflow?tab=inbox`.

## 5. Employee sau migration (ADR-S08-004)

- Giữ nguyên tabs `requests`/`me`; drawer chi tiết đề xuất render steps từ workflow (timeline), action approve/reject gọi API employee (proxy engine) — người dùng không nhận biết đổi engine.
- Tab `config`: chuyển **read-only** hiển thị luồng hiện hành (từ definition) + nút mở `/apps/workflow` (builder).
- Mobile employee: không thêm màn duyệt mới (inbox workflow trên mobile đã phủ — CONF Q13).

## 6. Trạng thái màn hình & a11y

- Loading: skeleton từ `@shared`; Empty: thông điệp + nút hành động chính; Error: banner + retry; optimistic update chỉ cho claim, còn lại chờ API.
- Touch target ≥ 40px mobile; safe-area padding; focus-visible; contrast AA; drawerEsc/overlay đóng; bảng có sticky header.

## 7. Kiểm chứng UI

Browser 2 chế độ (Desktop ≥1280, Mobile 390×844 emulation) — 0 console error; chụp minh chứng: builder form/builder luồng/inbox/progress/public fill/quiz/matrix/upload; i18n đổi ≥ 2 ngôn ngữ.
