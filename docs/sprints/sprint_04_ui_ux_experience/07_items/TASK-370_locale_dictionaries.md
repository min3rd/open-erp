# [TASK-370] Từ điển các locale mới (web + mobile)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-370 / Task / Sprint 04 |
| Severity / trạng thái | High / **In Progress** (batch 1: zh-CN, ja, es) |
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

- [ ] Batch 1: zh-CN, ja, es.
- [ ] Batch 2: ko, fr, de, pt-BR.
- [ ] Batch 3: ru, ar, th, id.
- [ ] Bật `released: true` trong `language-registry.ts` cho locale đạt 100% (sau khi `i18n:check:strict` PASS).

## 3. Tiêu chí và kiểm chứng

- [ ] Mỗi locale: `missing=0 extra=0` cho cả web và mobile.
- [ ] Build web + mobile PASS (JSON hợp lệ).
- [ ] Switcher hiển thị locale đã phát hành; đổi ngôn ngữ áp ngay, không lộ key thô.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run i18n:check:strict` | Not Run | — |
| QA browser đổi ngôn ngữ | Not Run | — |

## 4. Bàn giao và lịch sử

Đang chạy batch 1. Locale chưa đủ 100% **không** được bật trong registry (không phát hành bản dịch dở).
