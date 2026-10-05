# [ANL-S04-006] Phân Tích Nghiệp Vụ: Mở Rộng Đa Ngôn Ngữ (Language Registry, Lazy Dictionary, RTL)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S04-006 / Phân tích / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-05 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S04-001](../01_raw_notes/01_RAW-S04-001_ui_theming_motion_icons_ux.md) — R6 |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md), [ANL-S04-005](05_ANL-S04-005_loading_bar_and_skeletons.md) / [BENCH-S04-001](../03_benchmarks/01_BENCH-S04-001_design_system_motion_icons_ux_i18n.md) |

## 1. Bối cảnh

Yêu cầu gốc **R6**: "Đa ngôn ngữ: ngoài tiếng Việt và tiếng Anh, hỗ trợ thêm các ngôn ngữ phổ biến trên thế giới". Hệ thống i18n hiện tại hoạt động tốt cho 2 ngôn ngữ nhưng bị **khoá cứng** ở kiểu `'vi' | 'en'` và chỉ nạp 2 file cố định, nên không thể mở rộng mà không sửa mã nguồn service, component switcher và mọi chỗ khai báo kiểu.

## 2. Phạm vi

| Loại | Nội dung |
| :--- | :--- |
| **In-scope (đề xuất)** | Language registry; `LangCode` enum/type thay union; lazy-load từ điển theo locale; fallback chain; parity check tự động; định dạng theo locale (`Intl`); khung RTL. |
| **Out-of-scope** | Dịch đầy đủ ngay mọi ngôn ngữ (chỉ phát hành locale đủ ngưỡng); dịch nội dung nghiệp vụ do khách hàng cung cấp; bật RTL cho tới khi có ngôn ngữ RTL được duyệt. |

## 3. Hiện trạng triển khai (Đã triển khai)

| Hạng mục | Hiện trạng | Nguồn |
| :--- | :--- | :--- |
| Kiểu ngôn ngữ | Union cứng `'vi' \| 'en'` | `src/frontend/shared/i18n/i18n.service.ts` |
| Nạp từ điển | `Promise.all([fetch('/i18n/vi.json'), fetch('/i18n/en.json')])` — nạp cả hai ngay khi khởi tạo | `i18n.service.ts` |
| Lưu lựa chọn | `localStorage['openerp_lang']`, chỉ chấp nhận `'vi'`/`'en'` | `i18n.service.ts` |
| Tra cứu `t(code, params)` | Fallback: dict hiện tại → `vi` → `en` → trả về chính `code`; nội suy `{key}` bằng regex | `i18n.service.ts` |
| Template | `TranslatePipe` (`pure: false`), `TranslateDirective` (target text/placeholder/title) | `src/frontend/shared/i18n/` |
| Thông điệp API | `api-message.ts`: lấy `errors[0].code` → `code` gốc → `INTERNAL_SERVER_ERROR` | `src/frontend/shared/i18n/api-message.ts` |
| Bộ chuyển ngôn ngữ | `language-switcher` hardcode 2 nút VI/EN | `src/frontend/shared/components/language-switcher/` |
| Từ điển | Web `vi.json`/`en.json` **884 key** mỗi file; Mobile **475 key** mỗi file — **đặt riêng trong `web/public` và `mobile/public`** | `src/frontend/web/public/i18n/`, `src/frontend/mobile/public/i18n/` |

Ghi chú: hai bộ từ điển Web/Mobile tách rời là **nguồn trôi dạt (drift)** tiềm ẩn cần chính sách parity.

## 4. Language Registry (đề xuất)

Thay union bằng `LangCode` (enum/type) + registry mô tả:

```text
LangCode: vi | en | zh-CN | ja | ko | es | fr | de | pt-BR | ru | ar | th | id
```

| Code | Tên bản ngữ | dir | Ưu tiên | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| `vi` | Tiếng Việt | ltr | P0 | Ngôn ngữ nguồn hiện tại |
| `en` | English | ltr | P0 | Fallback mặc định |
| `zh-CN` | 简体中文 | ltr | P1 | |
| `ja` | 日本語 | ltr | P1 | |
| `ko` | 한국어 | ltr | P1 | |
| `es` | Español | ltr | P1 | |
| `fr` | Français | ltr | P1 | Text nở ~15–20% |
| `de` | Deutsch | ltr | P1 | Text nở ~30–35% |
| `pt-BR` | Português (Brasil) | ltr | P1 | |
| `ru` | Русский | ltr | P2 | Text nở ~10–15% |
| `ar` | العربية | **rtl** | P2 | **Bắt buộc mirror layout** |
| `th` | ไทย | ltr | P2 | Không xuống dòng theo từ |
| `id` | Bahasa Indonesia | ltr | P2 | |

**ĐÃ CHỐT 2026-10-05 (Q3)**: khách hàng đồng ý danh sách **13 locale** trên. Do `ar` nằm trong phạm vi, **khung RTL là bắt buộc** (Q4 còn chốt thời điểm bật đầy đủ).

## 5. Từ điển lazy-load, fallback chain (đề xuất)

| Hạng mục | Đề xuất |
| :--- | :--- |
| Nạp | Chỉ nạp từ điển locale được chọn + `en` làm fallback; **không bundle cả bộ** |
| Cache | Giữ trong bộ nhớ service; tránh nạp lại khi đổi qua lại |
| Fallback chain | `locale` → `en` → `code` (chốt nguồn gốc; hiện tại là `vi` → `en` → `code`) |
| Locale chưa hoàn thiện | Vẫn dùng được nhờ fallback; hiển thị nhãn "chưa đủ 100%" ở switcher (cần chốt) |
| Khi nạp lỗi | Giữ locale hiện tại, thử lại; không vỡ UI |
| Khởi tạo | Đọc `openerp_lang`; nếu không hợp lệ → dùng `en` |

## 6. Bản địa hoá thông điệp API (đề xuất)

- API trả `code` + `params` (theo `api_standards`); frontend tra từ điển theo `code` và nội suy `params` — **không** trả message tiếng Việt từ backend.
- `api-message.ts` đã làm đúng luồng (`errors[0].code` → `code` → `INTERNAL_SERVER_ERROR`); khi mở rộng chỉ cần từ điển có key cho mọi `code`.
- Khuyến nghị: parity check phải bao gồm cả **key thông điệp API** (ví dụ `AUTH_*`, `ORGANIZATION_*`) để không lộ key.

## 7. Quản trị key & parity (đề xuất)

| Hạng mục | Đề xuất |
| :--- | :--- |
| Nguồn sự thật (source of truth) | Một ngôn ngữ chuẩn (đề xuất `en`), các locale khác suy ra — cần chốt |
| Baseline hiện tại | Web 884 key/locale; Mobile 475 key/locale |
| Kiểm tra parity | Script Node (không phải unit test frontend) so khớp key giữa các file: thiếu/thừa/đổi tên |
| Ngưỡng phát hành | Chỉ phát hành locale đạt ngưỡng dịch (ví dụ ≥ 95% key) — cần chốt |
| Chống trôi dạt Web/Mobile | Chính sách chung: key dùng chung phải trùng tên; kiểm tra chéo hai bộ |
| Key động | `TranslatePipe` ghép chuỗi (ví dụ `'PLUGIN_STATUS_' + status`) cần đảm bảo key đầy đủ |

## 8. Định dạng theo locale (đề xuất)

| Nội dung | Hiện trạng | Đề xuất |
| :--- | :--- | :--- |
| Ngày/giờ | Angular `date: 'short'` không truyền locale (ví dụ plugin-marketplace) | `Intl.DateTimeFormat` theo locale người dùng |
| Số | Mặc định | `Intl.NumberFormat` |
| Tiền tệ | Chưa chuẩn hoá | `Intl.NumberFormat` + mã tiền tệ tenant |
| Số nhiều (plural) | Nội suy `{key}` đơn giản | `Intl.PluralRules` (một số ngôn ngữ có nhiều dạng số nhiều) |
| Thời gian tương đối | Không có | `Intl.RelativeTimeFormat` nếu cần |
| Múi giờ | Mặc định giờ trình duyệt | Chốt: theo người dùng / theo tenant / UTC hiển thị |

## 9. Phạm vi RTL (đề xuất)

| Giai đoạn | Nội dung |
| :--- | :--- |
| **Bây giờ (khung)** | Đặt `dir` trên root theo locale; dùng thuộc tính CSS logic (`margin-inline`, `padding-inline`, `border-inline`) ở component chung; kiểm tra Drawer/table/progress bar phản chiếu đúng |
| **Sau (bật)** | Chỉ bật đầy đủ RTL khi có ngôn ngữ RTL (ví dụ `ar`) trong scope phát hành |
| Điểm dễ vỡ | Drawer trượt cạnh phải, căn phải số, hướng thanh progress, icon chỉ hướng (`arrow-*`) |

## 10. Tác động QA & chiến lược lấy mẫu (đề xuất)

Ma trận tổ hợp: **locale × mode (Light/Dark) × theme (≥ 2) × platform (Web/Mobile)** bùng nổ nhanh. Chiến lược:

| Mẫu | Phạm vi | Mức |
| :--- | :--- | :--- |
| Locale đủ 100% (vi, en) | Mọi theme × mode × Web/Mobile | Đầy đủ |
| Locale P1 khác | 1 theme mặc định × Light/Dark × Web (smoke Mobile) | Smoke |
| Locale RTL (`ar`) | 1 theme × Light/Dark × Web + Mobile, kiểm mirror/overflow | Trọng tâm |
| Ngôn ngữ dài (de) | Kiểm tràn/mật độ ở màn mật độ cao | Trọng tâm |

QA vẫn theo `ui_ux_standards`: Web desktop ≥1280px; Mobile 390×844, không tràn ngang, touch target ≥40px, 0 lỗi console.

## 11. Rủi ro & giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
| :--- | :--- | :--- |
| Dịch thiếu lộ key/tiếng Anh lẫn | Medium | Fallback chain + parity check + chỉ phát hành đủ ngưỡng |
| Text nở (de/ru/fi) vỡ layout mật độ cao | Medium | Kiểm locale dài; cho phép co giãn/ellipsis; tránh chiều rộng cứng |
| RTL hồi quy toàn bộ layout | Medium | Làm khung trước, bật sau; CSS logic; test riêng `ar` |
| Trôi dạt từ điển Web/Mobile | Medium | Parity script chéo hai bộ |
| Đổi union `'vi'\|'en'` sót chỗ | Low | Thay bằng `LangCode` một nguồn; grep kiểm tra |
| Số nhiều/tham số nội suy sai | Low | Dùng `Intl.PluralRules`; rà param theo code |

## 12. Quyết định cần chốt (Confirmation)

| # | Câu hỏi mở | Nguồn |
| :---: | :--- | :--- |
| Q1 | Danh sách ngôn ngữ và số lượng cho bản phát hành? | RAW §4 Q3 |
| Q2 | Ngôn ngữ nguồn (source of truth): `vi`, `en`, hay khác? | Mới |
| Q3 | Fallback chain chính thức: locale → `en` → key? | Mới |
| Q4 | Ngưỡng dịch tối thiểu để phát hành một locale? | Mới |
| Q5 | Có ngôn ngữ RTL trong scope đợt này hay chỉ dựng khung? | Mới — **✅ ĐÃ CHỐT 2026-10-05: `ar` trong scope ⇒ dựng khung RTL; thời điểm bật đầy đủ chờ chốt** |
| Q6 | Múi giờ hiển thị theo người dùng, tenant hay UTC? | Mới |
| Q7 | Bộ chuyển ngôn ngữ: dropdown tên bản ngữ thay 2 nút cứng? | Mới |

## 13. Chưa kiểm chứng

Đây là **phân tích Draft**, chưa phải scope/AC đã duyệt; danh sách ngôn ngữ và phạm vi RTL là **đề xuất**, chưa được khách hàng chốt, và **chưa có mã nguồn Sprint 04 nào được viết**. Mọi kết luận chỉ có hiệu lực sau khi khách hàng xác nhận tại [Confirmation Gate](../00_READING_GUIDE.md#3-gate-riêng-biệt) (CONF-S04-001).
