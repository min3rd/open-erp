# [FEAT-29] Mở Rộng Đa Ngôn Ngữ (Multilanguage i18n)

| Trường | Giá trị |
| :--- | :--- |
| ID / sprint / severity / trạng thái | FEAT-29 / Sprint 04 / High / To Do |
| Owner / reviewer / cập nhật | Developer (chưa phân công) / Chưa phân công / 2026-10-05 |
| Input / dependency | [CONF-S04-001](../04_confirmation/01_CONF-S04-001_sprint_04_scope.md) (Draft) / [DES-API-S04-001](../06_designs/api/01_DES-API-S04-001_theme_preferences_and_i18n.md) |

## 1. Nhu cầu và phạm vi

Là người dùng quốc tế, tôi muốn dùng hệ thống bằng ngôn ngữ của mình, không chỉ tiếng Việt/Anh.

- In-scope: `LangCode` + registry **13 locale** đã duyệt; lazy dictionary; fallback `en`; parity check; `Intl` cho ngày/số; **khung RTL** cho `ar`; lưu ngôn ngữ theo người dùng.
- Out-scope: dịch đủ 100% mọi locale ngay bản đầu (chỉ phát hành locale đạt ngưỡng Q5).
- Ngôn ngữ đã duyệt: vi, en, zh-CN, ja, ko, es, fr, de, pt-BR, ru, ar, th, id.

## 2. AC và truy vết

| AC đầy đủ | Given/When/Then | Design/version | Test case/evidence |
| :--- | :--- | :--- | :--- |
| CONF/AC-14 | Đổi ngôn ngữ ⇒ chuỗi đổi ngay, lưu, không lộ key thô | [DES-API-S04-001](../06_designs/api/01_DES-API-S04-001_theme_preferences_and_i18n.md) §4 | Not Run |
| CONF/AC-15 | Parity check báo thiếu/thừa; chỉ phát hành locale đạt ngưỡng | DES-API-001 §4.2 | Not Run |
| CONF/AC-16 | `ar` hiển thị RTL đúng, không tràn ngang | DES-API-001 §4.1 | Not Run |

## 3. Task con đề xuất (Reserved)

| ID/dự kiến | Owner | depends_on | Write scope | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| TASK-368 `LangCode` + language registry + `I18nService` lazy load | Developer | — | `shared/i18n`, `shared/enums` | Reserved |
| TASK-369 language switcher đa locale + lưu qua hồ sơ | Developer | TASK-368 | `shared/components/language-switcher`, web/mobile | Reserved |
| TASK-370 từ điển các locale mới (web + mobile) + parity check script | Developer | TASK-368 | `web/public/i18n`, `mobile/public/i18n`, script | Reserved |
| TASK-371 khung RTL (`dir`, logical properties, mirror icon) | Developer | TASK-368 | `web/src/styles.css`, shared templates | Reserved |

## 4. Bàn giao

Chưa có code. Ràng buộc: **không** hardcode chuỗi; mọi key mới thêm vào tất cả từ điển; baseline parity hiện tại web 884 / mobile 475.
