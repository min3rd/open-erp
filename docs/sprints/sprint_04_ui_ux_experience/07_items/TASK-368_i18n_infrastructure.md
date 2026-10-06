# [TASK-368] Hạ tầng i18n: LangCode + registry + lazy load + switcher + RTL frame

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-368 / Task / Sprint 04 |
| Severity / trạng thái | High / **Done** (TR-S04-001 v0.3 verified 2026-10-06) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved |
| depends_on / blocks / parent | — / TASK-369/370/371 / [FEAT-29](../07_items/FEAT-29_multilanguage_i18n_expansion.md) |
| Write scope / baseline | `shared/enums/lang.enum.ts`, `shared/i18n/*`, `shared/components/language-switcher`, `scripts/check-i18n-parity.mjs`, `package.json` |

## 1. Mục tiêu và scope

Thay union `'vi' | 'en'` bằng `LangCode` + registry 13 locale; nạp từ điển **lazy**; fallback `locale → en`; đặt `lang`/`dir` trên `<html>` (khung RTL); switcher chỉ hiện locale đã phát hành. Truy vết AC-14, AC-16.

- In-scope: `LangCode` (đồng bộ 1-1 backend `LanguageCode`); `LANGUAGES` (nativeName, dir, `released`); `I18nService` lazy + fallback; switcher dropdown tên bản ngữ; script parity + lệnh npm.
- Out-of-scope: nội dung dịch (TASK-370); RTL đầy đủ cho mọi màn (TASK-371).

## 2. Các thao tác

- [x] `LangCode` + registry 13 locale (ar = rtl).
- [x] `I18nService`: `Map<LangCode, dict>`, lazy `fetch('/i18n/<code>.json')`, fallback `en`, giữ `openerp_lang`, áp `document.documentElement.lang/dir`.
- [x] Switcher: `<select>` tên bản ngữ, chỉ liệt kê locale `released`.
- [x] `scripts/check-i18n-parity.mjs` + `npm run i18n:check` / `i18n:check:strict` (đối chiếu với `en`, báo thiếu/thừa + coverage).

## 3. Tiêu chí và kiểm chứng

- [x] AC-14: đổi ngôn ngữ áp ngay, không lộ key thô (fallback en).
- [ ] AC-16 (RTL đầy đủ): thuộc TASK-371.
- [x] Build web PASS; script parity chạy đúng (web 899 key, mobile 486 key, vi 100%).

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` (web) | PASS | bundle generation complete |
| `npm run i18n:check` | PASS | web/mobile vi 100% |

## 4. Bàn giao và lịch sử

**Trạng thái phát hành locale**: hiện chỉ `vi`, `en` được `released` (switcher chỉ hiện 2 locale này). 11 locale còn lại đã có trong registry nhưng `released: false` cho tới khi từ điển đủ **100%** (TASK-370). Đây là hệ quả của quyết định Q5.

Bước tiếp: TASK-370 (từ điển), TASK-371 (RTL), TASK-369 (lưu qua hồ sơ).
