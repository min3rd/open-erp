# [TASK-409] Template web Web Component + contribution entry

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-409 / Task / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — template web WC + header contribution; `ng build` PASS / 0.2 / 2026-10-29 |
| Owner / reviewer | Developer / Architect + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, design tương ứng |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) |


## 1. Mục tiêu

Template web sinh Angular 22 standalone, screen entry WC và contribution entry mẫu; Tailwind entry riêng; không iframe.

## 2. Việc phải làm

- [x] Sinh `web/src/plugin-main.ts` dùng `createApplication` + `createCustomElement` (WC).
- [x] Sinh contribution mẫu `header-action` component + custom element.
- [x] Sinh `styles.css` plugin-owned Tailwind entry; i18n vi/en; screen mẫu.
- [x] Sinh manifest `ui_manifest.screens/contributions` tương ứng; render mode WC.
- [x] README hướng dẫn build; smoke `npm run build` PASS (`main.js` 109.90 kB).

## 3. Tiêu chí nghiệm thu

- Plugin web build PASS; custom element đăng ký đúng tag.
- Contribution entry tải được và render trong slot Core (test fixture).
- Không sinh iframe/IFRAME trong template hoặc manifest.

## 4. Phụ thuộc & phạm vi

- Thuộc feature: [FEAT-33](FEAT-33_plugin_template_and_cli.md) — Plugin template 2.0 & CLI tương tác
- depends_on: TASK-408
- Write scope: `tools/open-erp-cli/src/lib/templates.js`, `tools/open-erp-cli/src/lib/template-v2/web/**`
- Mức độ: **High**

- Design đã duyệt; chưa bắt đầu theo lịch triển khai.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
