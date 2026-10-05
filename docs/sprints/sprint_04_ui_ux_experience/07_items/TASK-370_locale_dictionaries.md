# [TASK-370] Từ điển các locale mới (web + mobile)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-370 / Task / Sprint 04 |
| Severity / trạng thái | High / **In Review** (13/13 locale đạt 100%, `i18n:check:strict` PASS) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved |
| depends_on / blocks / parent | TASK-368 / TASK-371 / [FEAT-29](../07_items/FEAT-29_multilanguage_i18n_expansion.md) |
| Write scope / baseline | `web/public/i18n/<code>.json`, `mobile/public/i18n/<code>.json` |

## 1. Mục tiêu và scope

Bổ sung từ điển cho 11 locale đã duyệt (zh-CN, ja, ko, es, fr, de, pt-BR, ru, ar, th, id) — **đủ 100% key** so với `en` (Q5) mới được `released: true` trong registry.

- Nguồn: `en.json` (web 899 key, mobile 486 key).
- Giữ nguyên placeholder `{name}`/`{count}`/`{code}`; không dịch tên thương hiệu/kỹ thuật; key không đổi.
- Kiểm bằng `npm run i18n:check:strict`.

## 2. Các thao tác

- [x] Batch 1: zh-CN, ja, es.
- [x] Batch 2: ko, fr, de, pt-BR.
- [x] Batch 3: ru, ar, th, id.
- [x] Bật `released: true` trong `language-registry.ts` cho locale đạt 100% (sau khi `i18n:check:strict` PASS).

## 3. Tiêu chí và kiểm chứng

- [x] Mỗi locale: `missing=0 extra=0` cho cả web và mobile.
- [x] Build web + mobile PASS (JSON hợp lệ).
- [ ] Switcher hiển thị locale đã phát hành; đổi ngôn ngữ áp ngay, không lộ key thô. *(chờ QA browser — TC-15)*

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run i18n:check:strict` | **PASS** — 13/13 locale 100% (web 918 key, mobile 494 key) | chạy 2026-10-05 |
| QA browser đổi ngôn ngữ | Not Run | TC-15 của TP-S04-001 |

## 4. Bàn giao và lịch sử

Hoàn tất 13/13 locale đạt 100% key (web 918, mobile 494) và đã bật `released: true` cho tất cả; parity strict PASS. Key phát sinh sau đó (shape/layout/menu) đã bổ sung đồng thời cho cả 26 từ điển. Locale chưa đủ 100% **không** được bật trong registry.
