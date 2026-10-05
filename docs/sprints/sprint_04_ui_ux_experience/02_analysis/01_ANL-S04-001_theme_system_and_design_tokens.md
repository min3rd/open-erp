# [ANL-S04-001] Hệ Thống Theme & Design Tokens — Phân Tích Yêu Cầu

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S04-001 / Phân tích / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-05 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S04-001](../01_raw_notes/01_RAW-S04-001_ui_theming_motion_icons_ux.md) |
| Đọc trước / đọc tiếp | [RAW-S04-001](../01_raw_notes/01_RAW-S04-001_ui_theming_motion_icons_ux.md) · đọc tiếp [ANL-S04-002](02_ANL-S04-002_motion_and_animation_system.md) |

> Phân tích này chỉ chốt **cách hiểu yêu cầu** (R1) và các **góc nghiệm thu**. Số lượng/định danh theme, phạm vi áp theme và ngưỡng tương phản chính thức chỉ có hiệu lực tại Confirmation Gate.

## 1. Bối cảnh

Sprint 01–03 đã dựng xong Core IAM, phân quyền dữ liệu và Plugin Manager. Giao diện hiện tại là **một bộ mặt duy nhất**: người dùng chỉ đổi được sáng/tối bằng class `dark`. Yêu cầu R1 của chủ dự án là có **nhiều theme** (màu sắc, layout, cách thiết kế component) nhưng **mỗi theme vẫn phải giữ mật độ cao** và **có đủ cả Light lẫn Dark**.

Trước khi có thể bàn "nhiều theme", cần trả lời một câu hỏi nền tảng: hiện hệ thống quản lý màu/kích thước/hình dạng ở đâu, và nó có đủ chỗ để gắn theme hay không. Phân tích này kiểm kê hiện trạng đó rồi đề xuất một tầng token trung tâm; phần triển khai chi tiết thuộc bước Solution/Design.

## 2. Phạm vi & ngoại lệ

| Trong phạm vi (đề xuất) | Ngoài phạm vi (đề xuất) |
| :--- | :--- |
| Tầng token màu/kích thước/hình dạng dùng chung Web + Mobile. | Đổi cấu trúc layout, điều hướng, hay hệ thống component. |
| Cơ chế chọn theme + mode (SYSTEM/LIGHT/DARK) và lưu lựa chọn. | Sinh theme tự động / theme marketplace cho bên thứ ba. |
| Theme tối thiểu đủ Light + Dark, giữ nguyên mật độ thông tin. | Chỉnh sửa từng màn hình nghiệp vụ của plugin. |
| Tương thích ngược localStorage `openerp_theme` hiện có. | Đồng bộ theme xuyên thiết bị qua backend (nếu không được yêu cầu). |

## 3. Hiện trạng triển khai (đã kiểm chứng)

### 3.1. Màu sắc

- **Quy định**: hệ thống không có bảng màu động; màu được hardcode trực tiếp trong class string của từng component.
- **Đã triển khai**: nền tảng dùng `neutral-*` cho gần như toàn bộ surface/viền/chữ; một vài điểm ngữ nghĩa dùng `emerald`, `amber`, `rose`, `sky`, `red`, `indigo` (xem bảng).
- **Đã triển khai**: Tailwind CSS v4 theo hướng **CSS-first** — [styles.css](../../../../src/frontend/web/src/styles.css) chỉ có `@import 'tailwindcss'`, `@custom-variant dark (&:where(.dark, .dark *))`, `@source '../../shared'`. **Không có** `tailwind.config.js` định nghĩa palette. Vì vậy màu hiển thị chính là palette mặc định của Tailwind.
- **Đã triển khai**: Mobile Ionic có tiền lệ token cục bộ trong [styles.css](../../../../src/frontend/mobile/src/styles.css) với `--erp-shell-border`, `--erp-toolbar-bg`, `--erp-toolbar-color`, `--erp-content-bg`, đổi giá trị theo `.dark`/`.ion-palette-dark`. Đây là mầm mống của tầng token nhưng chỉ phủ shell, không phủ component.

| Nơi hardcode | Biến thể màu | Ghi chú |
| :--- | :--- | :--- |
| `badge` | `emerald/amber/rose/sky/neutral` | Chọn theo `ColorVariant` nhưng ánh xạ thẳng ra class Tailwind trong TS. |
| `notification-bell`, `user-menu` | `sky`, `emerald`, `red`, `indigo` | Link/hành động ngữ nghĩa. |
| `operation-progress` | `amber-500` | Chấm trạng thái đang chạy. |
| Toàn bộ component còn lại | `neutral-*` | Nền, viền, chữ, hover. |

### 3.2. Kích thước & typography

- Cỡ chữ: `text-xs` (12px), `text-sm` (13px), cùng nhiều ngoại lệ tự do `text-[11px]`, `text-[10px]`.
- Icon: `w-3.5`, `w-4`, `w-[18px]`, `w-5` không theo thang nào.
- Đệm/lề: `p-1`, `p-1.5`, `p-2`, `px-2.5`, `py-1.5`, `gap-1`, `space-y-1.5` — đúng tinh thần mật độ cao.
- **Đã triển khai**: [theme.enum.ts](../../../../src/frontend/shared/enums/theme.enum.ts) có `SizeVariant` (XS→XL) nhưng chỉ một số component dùng; phần lớn component tự chọn class cỡ.

### 3.3. Hình dạng

- `ShapeVariant` (SHARP/SOFT) tồn tại; `badge` và `sharp-button` map `SOFT → rounded-sm`, còn lại `rounded-none`.
- Nhiều component viết thẳng `rounded-none`, không đi qua `ShapeVariant`.
- **Đã triển khai**: không component nào bo tròn lớn — đúng quy chuẩn vuông vắn.

### 3.4. Cơ chế theme/mode hiện tại

- **Đã triển khai**: [theme.service.ts](../../../../src/frontend/shared/theme/theme.service.ts) quản lý `ThemeMode` = `SYSTEM | LIGHT | DARK`; lưu `openerp_theme` trong `localStorage`; bật/tắt class `dark`, `ion-palette-dark` và `colorScheme` trên `<html>`.
- **Đã triển khai**: [theme-switcher](../../../../src/frontend/shared/components/theme-switcher/theme-switcher.component.ts) chỉ có 3 lựa chọn SYSTEM/LIGHT/DARK.
- **Quy định (AGENTS.md)**: một bộ Design Token Enums dùng chung, cấm enum biến thể phân mảnh theo component ([AGENTS.md](../../../../AGENTS.md)); UI mật độ cao, vuông vắn, anti-modal ([ui_ux_standards.md](../../../../.agents/rules/ui_ux_standards.md)).

## 4. Vấn đề cốt lõi

1. **Nhị phân `dark` thay vì đa theme**: chỉ có một trục bật/tắt, không biểu diễn được "bộ mặt" khác ngoài sáng/tối. `ThemeMode` và "theme" đang bị gộp làm một.
2. **Màu nằm rải rác trong từng component**: đổi một theme đồng nghĩa sửa hàng chục file class string, dễ sót và không thể đảm bảo nhất quán. Không có một nguồn sự thật cho màu.
3. **`ColorVariant` chưa map về token trung tâm**: enum tồn tại nhưng ánh xạ trực tiếp ra class Tailwind cố định, nên thêm theme không có chỗ cắm.
4. **Ionic gắn cứng nhị phân dark**: `ion-palette-dark` là cơ chế của Ionic, cần lớp token bọc ngoài để theme không phá palette Ionic.
5. **Nguy cơ phá mật độ**: nếu theme được tự do đổi size/spacing, yêu cầu "mỗi theme vẫn nhiều diện tích nhất có thể" sẽ bị vi phạm ngay từ theme đầu tiên. (Bo góc được phép đổi có kiểm soát, nhưng chỉ theme mặc định bắt buộc vuông vắn.)

## 5. Định hướng giải pháp (BA-level, đề xuất)

### 5.1. Tách "Theme" khỏi "Mode"

| Khái niệm | Ý nghĩa | Ví dụ |
| :--- | :--- | :--- |
| **Theme** | Bộ nhận diện token (bảng màu, surface, accent) — bất biến theo mode. | `industrial`, `slate`, `ocean`. |
| **Mode** | Cách chọn nhánh giá trị sáng/tối: `SYSTEM`, `LIGHT`, `DARK`. | Người dùng chọn `LIGHT` + theme `ocean`. |

Mỗi cặp `(theme, mode)` phải có giá trị tương ứng: **một theme không hợp lệ nếu thiếu nhánh Light hoặc Dark**.

### 5.2. Ba tầng token

1. **Primitive token**: bảng giá trị thô (thang màu, kích thước) — ít khi đổi.
2. **Semantic token**: tên theo vai trò (`surface`, `border`, `text-muted`, `accent`, `danger`) — đây là lớp theme ghi đè.
3. **Component tiêu thụ**: component chỉ dùng `ColorVariant`/`SizeVariant`/`ShapeVariant`, không tự gọi primitive.

Cơ chế đề xuất: **CSS custom properties theo theme**, để Tailwind `@theme` đọc và sinh utility; chuyển theme = đổi bộ biến trên `<html>` (ví dụ gắn `data-theme`), **không đổi class trong từng component**.

> **Ví dụ minh họa (không phải thiết kế chốt)**
> `--erp-color-surface`, `--erp-color-text`, `--erp-color-accent`; theme `industrial` khai báo hai khối giá trị (Light/Dark), Tailwind `@theme` ánh xạ chúng thành utility mà component đang dùng.

### 5.3. Baseline mật độ bất biến (điều kiện tiên quyết của R1)

- Theme **được phép** đổi: màu, surface, accent, font family accent (hạn chế), độ đậm viền, và **hình dạng bo góc qua `ShapeVariant`**.
- Theme **không được phép** đổi: cỡ chữ nhỏ nhất, khoảng đệm/lề, thang chiều cao dòng, mật độ bảng.
- **Quy định (AGENTS.md, cập nhật)**: chỉ **theme mặc định bắt buộc vuông vắn** (`rounded-none`/`rounded-sm`); các theme thay thế được phép dùng hình dạng khác qua `ShapeVariant`, nhưng **mọi theme vẫn phải giữ mật độ cao** và **không dùng bo tròn lớn kiểu consumer** (`rounded-xl`, `rounded-full`).
- Hệ quả: mọi theme kế thừa cùng thang `SizeVariant`; `ShapeVariant` là trục được theme phép ghi đè (trong giới hạn trên).

## 6. Danh mục token cần có (đề xuất, để Design chốt)

| Nhóm | Token gợi ý | Ghi chú |
| :--- | :--- | :--- |
| Surface | `surface`, `surface-raised`, `surface-muted` | Nền trang, menu, header. |
| Viền | `border`, `border-strong` | Thay `neutral-200/800`. |
| Chữ | `text`, `text-muted`, `text-subtle` | Thay `neutral-900/500`. |
| Ngữ nghĩa | `accent`, `danger`, `success`, `warning`, `info` | Thay `sky/red/emerald/amber`. |
| Tương tác | `accent-soft`, `danger-soft` | Nền hover/selected. |
| Tập trung | `focus-ring` | Viền focus thống nhất. |
| Hình dạng | `radius` (map từ `ShapeVariant`) | Theme mặc định = vuông vắn; theme khác được đổi trong giới hạn, không bo tròn lớn. |

## 7. User Stories

- **US-S04-001**: Là người dùng, tôi muốn chọn một **theme** ngoài sáng/tối để giao diện hợp gu mà vẫn dễ đọc.
- **US-S04-002**: Là người dùng, tôi muốn đổi độ sáng/tối độc lập với theme, để mỗi theme đều dùng được cả ban ngày lẫn ban đêm.
- **US-S04-003**: Là quản trị tenant, tôi muốn biết theme đang áp là của tenant hay của cá nhân tôi, để không bị ghi đè ngoài ý muốn.

## 8. Quy tắc nghiệp vụ (đề xuất)

- **BR-S04-001**: Mọi theme bắt buộc định nghĩa đầy đủ giá trị cho **cả Light và Dark**; theme thiếu một nhánh bị coi là không hợp lệ và không được đăng ký.
- **BR-S04-002**: Theme **không được** thay đổi cỡ chữ tối thiểu, khoảng đệm hay chiều cao dòng — baseline mật độ cao là bất biến. Theme được phép đổi bo góc qua `ShapeVariant`, nhưng **theme mặc định bắt buộc vuông vắn** và **mọi theme cấm bo tròn lớn** (`rounded-xl`, `rounded-full`).
- **BR-S04-003**: Component chỉ tiêu thụ **semantic token**; cấm gọi trực tiếp palette primitive và cấm hardcode màu mới trong template.
- **BR-S04-004**: Bộ token dùng chung đặt tại `src/frontend/shared/`; Web và Mobile dùng chung một nguồn; cấm định nghĩa theme riêng trong Web hoặc Mobile.
- **BR-S04-005**: Tên theme là mã i18n, không hardcode văn bản hiển thị.
- **BR-S04-006**: Lựa chọn `(theme, mode)` phải khôi phục được sau khi tải lại trang và không gây nhấp nháy sai theme.
- **BR-S04-007**: Theme/Mode không được làm thay đổi ngữ nghĩa trạng thái hiện có (`danger` vẫn phải là "nguy hiểm", `success` vẫn là "thành công").
- **BR-S04-008**: Khi theme đang dùng bị gỡ/không tải được, hệ thống tự lùi về theme mặc định thay vì lỗi trắng màn hình.

## 9. Luồng áp dụng (đề xuất)

1. Tải ứng dụng → đọc `openerp_theme` (tương thích ngược) và lựa chọn theme đã lưu.
2. Xác định nhánh sáng/tối: nếu mode `SYSTEM`, theo `prefers-color-scheme`; nếu không, theo lựa chọn người dùng.
3. Gắn cặp `(theme, mode)` lên `<html>` **trước khi** vẽ nội dung để tránh nhấp nháy.
4. Component đọc semantic token; đổi theme/mode không dựng lại cây component.
5. Lưu lựa chọn; nếu áp theo tenant, backend là nguồn sự thật và client là bản sao.

## 10. Di trú & tương thích

| Hiện có | Hướng xử lý (đề xuất) |
| :--- | :--- |
| `localStorage` key `openerp_theme` giá trị `SYSTEM/LIGHT/DARK` | Giữ đọc được; coi là **mode**, theme kế thừa mặc định. Ghi thêm key theme mới, không phá key cũ. |
| Class `dark` trên `<html>` | Giữ nguyên (Tailwind `@custom-variant` phụ thuộc nó). |
| `ion-palette-dark` (Mobile) | Giữ, nhưng token ERP phải ghi đè trên nền palette Ionic. |
| `colorScheme` trên `<html>` | Giữ theo mode để thanh cuộn/native control đúng sáng/tối. |
| Component đang hardcode `neutral-*` | Chuyển dần sang semantic token; cần giai đoạn tương thích hai chiều. |

## 11. Rủi ro

| # | Rủi ro | Mức | Giảm thiểu (đề xuất) |
| :---: | :--- | :---: | :--- |
| 1 | **Nhấp nháy sai theme (FOUC/FOWT)** khi tải | High | Áp theme trước khi render; ưu tiên script/SSR nội tuyến. |
| 2 | Theme làm mất **tương phản WCAG AA** trên chữ | High | Ràng buộc ngưỡng tương phản tại Gate; kiểm thử bằng công cụ + trình duyệt. |
| 3 | Theme phá **mật độ cao** | High | BR-S04-002 + baseline bất biến. |
| 4 | Xung đột với **Ionic palette** trên Mobile | Medium | Token ERP phủ lên sau; kiểm thử 390×844. |
| 5 | Bề mặt **plugin bên thứ ba** không theo token | Medium | Khuyến nghị dùng design token chung; xem là phase sau. |
| 6 | Di trú localStorage sót gây lệch theme | Medium | Đọc key cũ làm mode mặc định + có test thủ công. |
| 7 | Số lượng theme phình to làm chậm bảo trì | Medium | Chỉ token khác nhau; chung cấu trúc; quản lý danh mục tập trung. |

## 12. Góc nghiệm thu (chuyển Confirmation)

1. Có ít nhất N theme (N và tên/nhận diện từng theme — **câu hỏi mở Q1**).
2. Mỗi theme hiển thị đúng ở cả Light lẫn Dark, không theme nào thiếu nhánh.
3. Theme không làm giảm mật độ: cùng cỡ chữ nhỏ nhất, cùng khoảng đệm. Theme mặc định vuông vắn; theme thay thế (nếu có) chỉ đổi bo góc trong giới hạn `ShapeVariant`, không bo tròn lớn.
4. Đổi theme không nhấp nháy sai và lựa chọn tồn tại sau tải lại.
5. Mọi cặp chữ/nền đạt **tối thiểu WCAG AA**; thống nhất cách đo.
6. Theme áp theo **tenant hay theo người dùng** — **✅ ĐÃ CHỐT 2026-10-05 (Q2): theo tenant**; `mode` (Light/Dark) vẫn theo người dùng trừ khi chốt khác.
7. Web và Mobile hiển thị nhất quán; Mobile không tràn ngang, touch target ≥ 40px.

### Câu hỏi mở (chốt tại Confirmation)

- Q1: Danh sách theme chính thức và nhận diện từng theme?
- Q2: Theme áp theo tenant (toàn workspace) hay theo từng người dùng? Cái nào thắng?
- Q3: Ngưỡng tương phản/kiểm thử chính thức (AA hay AAA cho một số cặp)?
- Q4: Có cần đồng bộ theme qua backend/tài khoản không, hay chỉ cục bộ trên thiết bị?

## 13. Chưa kiểm chứng

Toàn bộ phạm vi, danh mục theme, cách áp theo tenant/người dùng và ngưỡng AC nêu trên là **đề xuất phân tích**, chưa được khách hàng phê duyệt. Các kết luận chỉ có hiệu lực sau **Confirmation Gate (bước 04)** và trước đó mọi mục ở mục 12 được coi là **Chưa kiểm chứng**.
