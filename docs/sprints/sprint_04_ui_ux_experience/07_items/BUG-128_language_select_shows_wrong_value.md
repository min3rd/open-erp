# [BUG-128] Select ngôn ngữ không hiển thị đúng ngôn ngữ đang chọn

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-128 / Bug / Sprint 04 |
| Severity / trạng thái | High / **Done** (TR-S04-001 v0.3 verified 2026-10-06) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / phản hồi chủ dự án: "cả chỗ chọn ngôn ngữ, đang không hiển thị đúng ngôn ngữ đang chọn" |
| depends_on / blocks / parent | TASK-368, FEAT-29 / — / [FEAT-29](FEAT-29_multilanguage_i18n_expansion.md) |

## 1. Hiện tượng và nguyên nhân

`<select>` của `language-switcher` bind `[value]="i18n.currentLang()"` ở cấp select, còn `<option>` do `@for` render **sau** lần gán value đầu tiên. Trình duyệt reset `select.value` về option đầu khi value trỏ tới option chưa tồn tại, và Angular không gán lại (giá trị binding không đổi) ⇒ select luôn hiện ngôn ngữ **đầu danh sách** (Tiếng Việt) dù UI đã đổi sang ngôn ngữ khác.

## 2. Cách sửa

Chuyển sang `[selected]` trên từng `<option>` (giống cách `theme-switcher` đang làm, đã đúng): `[selected]="language.code === i18n.currentLang()"`.

## 3. Kiểm chứng (trình duyệt)

| Bước | Kết quả |
| :--- | :--- |
| Mở panel khi đang ở `vi` | select `value=vi`, hiện "Tiếng Việt", `<html lang=vi>` |
| Chọn English | select `value=en`, hiện "English", `<html lang=en` |
| **Reload trang** | vẫn `value=en`, hiện "English" (không nhảy về option đầu) |

Ảnh: `%TEMP%/opencode/align-lang-motion/panel-en-reloaded.png`.
