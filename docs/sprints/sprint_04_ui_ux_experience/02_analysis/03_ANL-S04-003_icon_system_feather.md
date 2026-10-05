# [ANL-S04-003] Hệ Thống Icon Feather — Phân Tích Yêu Cầu

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S04-003 / Phân tích / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-05 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S04-001](../01_raw_notes/01_RAW-S04-001_ui_theming_motion_icons_ux.md) |
| Đọc trước / đọc tiếp | [ANL-S04-002](02_ANL-S04-002_motion_and_animation_system.md) · đọc tiếp [CONF-S04-001](../04_confirmation/01_CONF-S04-001_sprint_04_scope.md) |

> Phân tích này chỉ chốt **cách hiểu yêu cầu** (R3) và các **góc nghiệm thu**. Bộ icon chính thức, nguồn dữ liệu Feather và quy tắc RTL chỉ có hiệu lực tại Confirmation Gate.

## 1. Bối cảnh

Yêu cầu R3: dùng **thư viện icon Feather**; các chức năng dễ hiểu và độc lập nên hiển thị icon. Hiện tại icon được **vẽ tay rải rác** dưới dạng inline SVG trong template, mỗi nơi tự khai báo `viewBox`, `stroke-width`, đường `d`, kích thước và đôi khi cả màu. Hệ quả: trùng lặp, khó đồng bộ phong cách, khó đổi theme (icon phải theo `currentColor`), và dễ lệch ngữ nghĩa khi các nơi tự chọn hình.

## 2. Phạm vi & ngoại lệ

| Trong phạm vi (đề xuất) | Ngoài phạm vi (đề xuất) |
| :--- | :--- |
| Một component icon dùng chung Web + Mobile, render bộ Feather tập trung. | Bộ icon thương hiệu/logo của từng plugin. |
| Danh mục `IconName` dùng chung + quy tắc accessibility (`aria`). | Vẽ illustration hoặc icon đa sắc phức tạp. |
| Quy tắc nơi bắt buộc có icon (hành động độc lập, dễ hiểu). | Thay đổi layout/nghiệp vụ của màn hình ngoài việc gắn icon. |
| Kích thước mặc định theo `SizeVariant`, màu theo `currentColor`. | Bộ icon động do người dùng tự tải lên. |

## 3. Hiện trạng — kiểm kê inline SVG (đã kiểm chứng)

Tổng cộng **17 inline SVG** nằm trong 7 template của thư viện shared:

| # | File | Mục đích | Feather tương ứng (gợi ý) |
| :---: | :--- | :--- | :--- |
| 1 | [topbar](../../../../src/frontend/shared/components/topbar/topbar.component.html) | Hamburger menu | `menu` |
| 2 | [drawer](../../../../src/frontend/shared/components/drawer/drawer.component.html) | Đóng | `x` |
| 3 | [user-menu](../../../../src/frontend/shared/components/user-menu/user-menu.component.html) | Chevron mở menu | `chevron-down` |
| 4 | [notification-bell](../../../../src/frontend/shared/components/notification-bell/notification-bell.component.html) | Chuông thông báo | `bell` |
| 5 | [notification-bell](../../../../src/frontend/shared/components/notification-bell/notification-bell.component.html) | Đánh dấu đã đọc | `check` |
| 6 | [notification-banner](../../../../src/frontend/shared/components/notification-banner/notification-banner.component.html) | Trạng thái banner | `info` / `alert-*` |
| 7 | [notification-banner](../../../../src/frontend/shared/components/notification-banner/notification-banner.component.html) | Đóng banner | `x` |
| 8 | [sharp-button](../../../../src/frontend/shared/components/sharp-button/sharp-button.component.html) | Spinner khi tải | `loader` |
| 9–17 | [mobile-nav-drawer](../../../../src/frontend/shared/components/mobile-nav-drawer/mobile-nav-drawer.component.html) | 9 icon mục điều hướng + đóng | `home`, `grid`, `settings`, `log-out`… |

Đặc điểm chung (đã kiểm chứng): `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="square"`, `stroke-linejoin="miter"`. Kích thước rời rạc: `w-3.5`, `w-4`, `w-[18px]`, `w-5`. **Không có** component icon và **không có** thư viện icon nào được cài (chỉ Mobile có `ionicons` phục vụ Ionic; Web không có). Đây là nền tảng phù hợp với phong cách Feather (stroke 2px) nhưng đang bị sao chép thủ công.

## 4. Vấn đề cốt lõi

1. **Trùng lặp & không nhất quán**: cùng một icon (`x`, `check`) được vẽ lại ở nhiều nơi; lệch `viewBox`/độ dày stroke chỉ là vấn đề thời gian.
2. **Không đổi được theo theme/màu**: mặc dù đã dùng `currentColor`, nhưng vì nằm rải rác trong template nên không thể áp token trung tâm; không có chỗ để giảm/đổi độ dày theo theme.
3. **Ngữ nghĩa dễ sai**: mỗi nơi tự chọn hình, không có danh mục chuẩn nên khó kiểm soát.
4. **Không có quy tắc accessibility/nơi dùng**: lúc thì `aria-label`, lúc thì icon trang trí; icon-only đôi khi thiếu nhãn.
5. **Khó mở rộng**: thêm icon mới = copy thêm SVG; không tận dụng được bộ Feather sẵn có.

## 5. Đề xuất: component icon dùng chung

### 5.1. Nguyên tắc

- Một component **presentational** (không nghiệp vụ) đặt tại `src/frontend/shared/components/` và export trong [index.ts](../../../../src/frontend/shared/components/index.ts), tuân thủ quy định thư viện dùng chung Web + Mobile (AGENTS.md).
- Icon chọn bằng **enum `IconName`** khai báo trong `src/frontend/shared/enums/` — không dùng string literal rời rạc (đồng bộ quy tắc `ResponseKey`/Design Token Enums).
- Render từ **registry dữ liệu Feather tập trung** keyed theo `IconName`; template chỉ gọi component, không chứa `<svg>` thủ công cho các icon trong danh mục.

### 5.2. Thuộc tính component (đề xuất)

| Input | Kiểu | Mặc định | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `name` | `IconName` | (bắt buộc) | Chọn icon từ danh mục. |
| `size` | `SizeVariant` | `SM`/`MD` | Ánh xạ ra kích thước px; mặc định nhỏ để hợp mật độ cao. |
| `label` | `string` (i18n key) | `null` | Nếu có → icon mang nghĩa, cần `aria-label`; nếu không → icon trang trí. |
| `mirrorRtl` | `boolean` | `false` | Tự lật cho icon định hướng khi ngôn ngữ RTL. |
| `strokeWidth` | (tùy chọn) | theo token | Cho phép theme tinh chỉnh độ dày nếu cần. |

Màu: kế thừa `currentColor` — **không** nhận màu trực tiếp, để theme/token quyết định.

> **Ví dụ minh họa (không phải thiết kế chốt)**
> Template shared chỉ còn: `<app-icon [name]="iconClose" [label]="'COMMON_CLOSE'" />` thay cho khối `<svg>…</svg>` ở drawer.

### 5.3. Kích thước & mật độ

- Kích thước phải lấy từ `SizeVariant` dùng chung, không tự khai `w-3.5`/`w-[18px]` rời rạc.
- Vì sản phẩm ưu tiên mật độ cao, thang icon nên nghiêng về nhỏ (ví dụ 12/14/16/20/24 px) và giữ stroke 2px đặc trưng Feather.
- Theme được phép tinh chỉnh độ dày/màu qua token nhưng **không** được phá mật độ (đồng bộ ANL-S04-001).

### 5.4. Accessibility (bắt buộc)

- **BR-S04-019**: Icon **trang trí** (đứng cạnh nhãn chữ) mặc định `aria-hidden="true"`, không thêm nhiễu cho trình đọc màn hình.
- **BR-S04-020**: Icon **mang nghĩa** (icon-only) bắt buộc có `aria-label` từ i18n (qua input `label`); **cấm** icon-only không nhãn.
- **BR-S04-021**: Không hardcode chữ trong `aria-label`; dùng mã i18n (100% chuỗi qua i18n).

## 6. Vendor Feather dạng dữ liệu hay cài npm package?

| Tiêu chí | Vendor dữ liệu (khuyến nghị) | npm package |
| :--- | :--- | :--- |
| Thêm dependency runtime | Không | Có |
| Kiểm soát bundle | Cao — chỉ nhúng icon thực dùng | Phụ thuộc package (thường hỗ trợ tree-shake) |
| Đồng bộ quy định "hạn chế tối đa thư viện bên thứ ba" | Tốt nhất | Cần biện luận |
| Cập nhật icon mới | Thủ công có chủ đích | Theo phiên bản package |
| License | Feather là MIT — cần ghi nguồn | Tương tự |
| Đa nền tảng Web + Mobile | Dùng chung một registry | Dùng chung được, nhưng tăng dependency cả hai |

**Đề xuất phân tích**: vendor bộ Feather như dữ liệu (path data) trong shared, chỉ chứa tập con icon cần dùng — không thêm dependency runtime, kiểm soát bundle, hợp quy định thư viện.

> **✅ ĐÃ CHỐT 2026-10-05 (Q19): dùng npm package `feather-icons`** — khách chọn **khác** đề xuất phân tích. `feather-icons` là **gói dữ liệu SVG (MIT)**, không phải UI component library, nên vẫn không thêm framework; vẫn **bọc qua adapter** `icon-registry.ts` (không import trực tiếp trong template) và giữ attribution MIT. Ghi nhận đây là exception có chủ đích với chủ trương "hạn chế thư viện bên thứ ba".

> **Ghi chú license**: khi vendor phải giữ thông báo bản quyền/nguồn Feather (MIT) trong repo (LICENSE/attribution).

## 7. Nơi bắt buộc / không bắt buộc icon

| Ngữ cảnh | Kiểu hiển thị | Bắt buộc? |
| :--- | :--- | :---: |
| Hành động chính (Lưu, Tạo, Xóa, Gửi) | **Icon + nhãn chữ** | Có icon + nhãn |
| Hành động trên dòng bảng / context menu / nút thu gọn | **Icon-only + tooltip/aria** | Có |
| Điều hướng (menu, section-nav) | Icon + nhãn (nhãn ẩn ở mobile) | Cân nhắc |
| Trạng thái (thành công, cảnh báo, lỗi) | Icon + màu (không chỉ màu) | Có |
| Nút đóng menu/drawer, chevron, hamburger | Icon-only + `aria-label` | Có |
| Nội dung văn bản thuần | Không icon | Không |

Nguyên tắc: icon phải **dễ hiểu và độc lập** (đúng R3) — nếu nghĩa không rõ nếu thiếu nhãn, phải đi kèm chữ.

## 8. User Stories

- **US-S04-007**: Là người dùng, tôi muốn các hành động quen thuộc có icon nhất quán để quét màn hình nhanh hơn.
- **US-S04-008**: Là người dùng đổi theme, tôi muốn icon tự đổi màu theo theme mà không bị lệch tông.
- **US-S04-009**: Là người dùng trình đọc màn hình, tôi muốn icon-only luôn có nhãn rõ nghĩa.

## 9. Quy tắc nghiệp vụ (đề xuất)

- **BR-S04-022**: Component icon dùng chung đặt trong `src/frontend/shared/components/`; Web và Mobile dùng chung; cấm vẽ lại inline SVG cho icon thuộc danh mục.
- **BR-S04-023**: Icon chọn bằng enum `IconName` dùng chung; cấm string literal tự do cho tên icon.
- **BR-S04-024**: Icon kế thừa `currentColor` và kích thước từ `SizeVariant`; cấm nhận màu/kích thước tùy ý phá token.
- **BR-S04-025**: Icon định hướng (chevron/arrow/undo) bật `mirrorRtl` theo ngôn ngữ; icon không định hướng (`check`, `play`) **không** lật.
- **BR-S04-026**: Bộ Feather chỉ thêm icon khi thực sự dùng; giữ ghi nguồn/license.

## 10. Rủi ro

| # | Rủi ro | Mức | Giảm thiểu (đề xuất) |
| :---: | :--- | :---: | :--- |
| 1 | **Bundle phình** do nhúng quá nhiều icon | Medium | Chỉ vendor tập con đang dùng; thêm khi cần. |
| 2 | **Sai ngữ nghĩa** do chọn icon không đúng hành động | High | Danh mục `IconName` có mô tả/chú thích; review UI; icon-only phải có nhãn. |
| 3 | **RTL sai** (icon định hướng không lật hoặc lật nhầm) | Medium | Cờ `mirrorRtl` tường minh + kiểm thử ngôn ngữ RTL (liên quan R6). |
| 4 | Icon-only **thiếu nhãn** cho trợ năng | High | BR-S04-020 + kiểm thử trình đọc màn hình. |
| 5 | Icon **lệch phong cách** với Feather (stroke khác) | Medium | Registry tập trung, một mức stroke mặc định. |
| 6 | Trộn lẫn `ionicons` (Mobile) với Feather gây hai hệ icon | Medium | Quy ước rõ: shell Ionic dùng ionicons, nội dung ERP dùng `app-icon`. |
| 7 | Vi phạm license khi vendor | Low | Giữ attribution Feather (MIT). |

## 11. Góc nghiệm thu (chuyển Confirmation)

1. Icon dùng chung render đúng, đồng nhất về stroke và kích thước theo `SizeVariant`.
2. Không còn inline SVG thủ công cho các icon thuộc danh mục (7 template hiện tại được thay).
3. Icon tự đổi màu theo theme/mode, không hardcode màu.
4. Icon-only luôn có `aria-label`; icon trang trí `aria-hidden`.
5. Icon định hướng lật đúng trong ngôn ngữ RTL, không lật nhầm.
6. Web (≥1280px) và Mobile (390×844) hiển thị nhất quán, không tràn, không lỗi console.

### Câu hỏi mở (chốt tại Confirmation)

- Q1: Bộ icon khởi điểm chính thức gồm những icon nào (danh mục `IconName`)?
- Q2: Vendor dữ liệu Feather tập con hay chấp nhận cài npm package? — **✅ ĐÃ CHỐT 2026-10-05: npm package `feather-icons`** (qua adapter).
- Q3: Có bắt buộc icon cho mọi hành động ở context menu không, hay chỉ khuyến nghị?
- Q4: Quy ước giữa `ionicons` (shell Ionic) và Feather ERP cần chốt tường minh?

## 12. Chưa kiểm chứng

Danh mục icon, nguồn Feather (vendor/package) và quy tắc RTL/accessibility là **đề xuất phân tích**, chưa được khách hàng phê duyệt. Mọi kết luận chỉ có hiệu lực sau **Confirmation Gate (bước 04)**; trước đó các mục ở mục 11 được coi là **Chưa kiểm chứng**.
