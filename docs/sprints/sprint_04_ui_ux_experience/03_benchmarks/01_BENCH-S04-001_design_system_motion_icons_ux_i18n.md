# [BENCH-S04-001] Nghiên Cứu Đối Chuẩn: Design System, Motion, Icon, Context Menu, Loading & Đa Ngôn Ngữ

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BENCH-S04-001 / Đối chuẩn / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-05 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S04-001](../01_raw_notes/01_RAW-S04-001_ui_theming_motion_icons_ux.md) — R1–R6 |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md), [ANL-S04-004](../02_analysis/04_ANL-S04-004_list_context_menu.md) / [ANL-S04-005](../02_analysis/05_ANL-S04-005_loading_bar_and_skeletons.md), [ANL-S04-006](../02_analysis/06_ANL-S04-006_i18n_language_expansion.md) |

## 1. Mục đích

Khảo sát cách các sản phẩm/design system hàng đầu giải sáu vấn đề của Sprint 04 (R1–R6), rút ra bài học áp dụng cho Open-ERP (Web + Mobile, thư viện chung `src/frontend/shared/`, Angular 22 + Tailwind v4, hạn chế thư viện ngoài). Chỉ nêu sản phẩm, **không** nêu URL. Thông tin không chắc chắn được đánh dấu **Chưa kiểm chứng**.

## 2. Design system & theming (R1)

| Sản phẩm | Cách tiếp cận | Học được gì cho Open-ERP |
| :--- | :--- | :--- |
| Material 3 (Google) | Theme từ **seed color** sinh bảng tonal (dynamic color); tách vai trò màu (primary/container/surface) | Mô hình phân tầng token: **seed → semantic → component**; theme đổi ở tầng semantic, không hardcode |
| Radix Colors / shadcn | Token bằng **CSS variables** + thuộc tính `data-theme`; light/dark là hai bộ biến | Theme = bộ biến CSS (Tailwind v4 hỗ trợ trực tiếp); thêm theme không đụng component |
| Ant Design v5 | Hệ token 3 tầng: **seed / map / alias** | Ba tầng token rõ ràng, tránh phân mảnh; alias dùng chung `ColorVariant`/`SizeVariant`/`ShapeVariant` |
| Salesforce Lightning (SLDS) | Design tokens cho phép theme trên nền tảng lớn, nhiều "brand" | Token hoá toàn diện là điều kiện để đa theme ở quy mô lớn |
| Atlassian Design System | Token + nhiều theme cao cấp, đảm bảo tương phản | Theme phải kèm kiểm tương phản (WCAG AA), không chỉ đổi màu |
| Odoo | Theme cộng đồng/backend; biến SCSS | **Chưa kiểm chứng** chi tiết cơ chế hiện tại; tham chiếu tinh thần "theme tách khỏi nghiệp vụ" |

**Học được gì cho Open-ERP**
- Xây **tầng token** trước (đã có `ColorVariant`, `SizeVariant`, `ShapeVariant`, `ThemeMode`) rồi mới tới registry theme.
- Quy định AGENTS cập nhật: **chỉ theme mặc định bắt buộc vuông vắn**; theme thay thế được dùng hình dạng khác qua `ShapeVariant` nhưng vẫn giữ **mật độ cao** và cấm bo tròn consumer (`rounded-xl`/`rounded-full`).
- Mỗi theme phải có **đủ Light/Dark** và đạt tương phản AA — kiểm như một phần DoD.

## 3. Motion (R2)

| Sản phẩm | Cách tiếp cận | Học được gì cho Open-ERP |
| :--- | :--- | :--- |
| Material Motion | Bộ **duration/easing token** (standard/decelerate/accelerate), chuyển tiếp theo ngữ nghĩa | Token hoá thời lượng/easing; dùng chung một bộ, không rải số ms tuỳ hứng |
| Microsoft Fluent | Motion có mục đích, ưu tiên phản hồi tương tác và định hướng | Animation để **định hướng & phản hồi**, không trang trí |
| Radix / Headless UI | Chuyển tiếp mở/đóng component, có thời gian thoát (exit) | Component chung phải có trạng thái enter/exit nhất quán |
| CSS `prefers-reduced-motion` | Chuẩn nền tảng để tắt chuyển động | **Bắt buộc** tôn trọng; tắt chuyển động không thiết yếu (đã nêu trong sprint_plan DoD) |

**Học được gì cho Open-ERP**: bộ motion token + ngân sách hiệu năng (tránh stagger hàng loạt, FPS/ thời lượng chốt ở Confirmation); tắt theo `prefers-reduced-motion`. Chi tiết thuộc ANL-S04-002.

## 4. Icons (R3)

| Sản phẩm | Cách tiếp cận | Học được gì cho Open-ERP |
| :--- | :--- | :--- |
| Feather | Bộ icon **stroke** đồng nhất (lưới 24px, nét mảnh), giấy phép mở | Kiểu stroke hợp mật độ cao; vendor **dạng dữ liệu**, không thêm runtime dep |
| Lucide | Bộ mở rộng dựa trên phong cách Feather, nhiều icon hơn | Nếu cần thêm icon, giữ **cùng bộ style**; tránh trộn nhiều họ icon |
| Nguyên tắc icon-only vs icon+label | Icon quen thuộc (thùng rác, bút chì) dùng icon-only; hành động mơ hồ cần nhãn | Có `aria-label`/`title`; trong menu mật độ cao ưu tiên icon+nhãn ngắn |

**Học được gì cho Open-ERP**: một component icon chung (Feather vendored), quy tắc dùng icon rõ ràng, không trộn họ icon. Chi tiết thuộc ANL-S04-003.

## 5. Context menu trong data grid (R4)

| Sản phẩm | Cách tiếp cận | Học được gì cho Open-ERP |
| :--- | :--- | :--- |
| Excel / Google Sheets | Chuột phải ô/hàng mở menu theo ngữ cảnh, song song với ribbon/menu trên | Context menu là **lối tắt**, luôn còn lối vào hiển thị |
| Notion | Chuột phải block/hàng database mở menu thao tác | Menu ngữ cảnh + giữ bề mặt chuẩn (Drawer/route) |
| Linear | Menu ngữ cảnh + command palette; chuột phải như tăng tốc | Kết hợp hiển thị + accelerator; bàn phím là công dân hạng nhất |
| GitHub | Menu "kebab" hiển thị, có hành động theo ngữ cảnh | Với người dùng không quen chuột phải, vẫn có nút ⋮ |
| Jira | Menu hàng có phân quyền theo vai trò | Mục menu **ẩn/disable theo quyền** |

**Học được gì cho Open-ERP**
- Context menu **không thay** kiến trúc anti-modal: xem/sửa/tạo mở Drawer/router (BR-S04-403).
- Phân quyền mục menu nhất quán `RequirePermissionDirective` (ẩn trước).
- Hỗ trợ bàn phím (Shift+F10, phím ContextMenu) với `role="menu"`/`menuitem`; render **ngoài** vùng cuộn để không bị cắt.
- Mobile: **không dùng context menu** (khách chốt 2026-10-05, Q7) — giữ nút thao tác hiển thị.

## 6. Loading & skeleton (R5)

| Sản phẩm | Cách tiếp cận | Học được gì cho Open-ERP |
| :--- | :--- | :--- |
| YouTube / GitHub | **Top progress bar** (mảnh, trên cùng) báo hoạt động điều hướng/tải | Thanh toàn cục cho biết "đang có hoạt động" |
| Facebook / Slack / Notion | **Skeleton** đúng hình dạng nội dung (feed, list, card) | Skeleton khớp hình dạng thật, giới hạn nhảy layout |
| Dashboard nhiều widget | Mỗi widget **load độc lập**, widget nhanh hiện trước | Nguyên tắc vùng độc lập (R5) |
| NProgress (pattern phổ biến) | Thanh trên cùng + ngưỡng trễ để tránh nháy | Trễ hiển thị cho response nhanh |

**Học được gì cho Open-ERP**
- Tách `forkJoin` thành vùng độc lập (đã có tiền lệ tốt ở role-matrix: 3 tín hiệu riêng).
- Skeleton cố định chiều cao khớp nội dung; `aria-busy` cho vùng đang nạp, `aria-live` cho lỗi.
- Tránh "double spinner" (bar + skeleton) bằng ngưỡng trễ và quy ước vai trò.

## 7. Đa ngôn ngữ & i18n (R6)

| Sản phẩm / chuẩn | Cách tiếp cận | Học được gì cho Open-ERP |
| :--- | :--- | :--- |
| ICU MessageFormat / CLDR | Cú pháp thông điệp có **plural/select**, dữ liệu chuẩn hoá | Dùng `Intl.PluralRules`/CLDR cho đa ngôn ngữ phức tạp |
| `Intl` (nền tảng web) | `DateTimeFormat`/`NumberFormat`/`RelativeTimeFormat` sẵn trong trình duyệt | Định dạng ngày/số/tiền theo locale **không cần thư viện ngoài** |
| Material / Apple HIG (RTL) | Hướng dẫn mirror layout, thuộc tính logic, phản chiếu icon chỉ hướng | Dựng khung `dir` + CSS logic trước, bật RTL khi có locale RTL |
| Runtime i18n (mẫu phổ biến) | Từ điển JSON nạp theo locale, fallback key | Lazy-load theo locale; không bundle tất cả; fallback chain |

**Học được gì cho Open-ERP**
- Language registry + `LangCode` thay union `'vi' | 'en'`; lazy-load từ điển.
- Fallback chain chốt (đề xuất `locale → en → key`); parity check tự động (Web 884 / Mobile 475 baseline).
- API đã trả `code`+`params`: giữ nguyên, chỉ cần từ điển đủ key.
- Dựng khung RTL bằng CSS logic; **Chưa kiểm chứng** thời điểm bật RTL (chờ Confirmation).

## 8. Bảng quyết định R1–R6 → đề xuất & câu hỏi mở

| # | Yêu cầu | Cách tiếp cận đề xuất (tham chiếu bài học) | Câu hỏi mở cho Confirmation |
| :---: | :--- | :--- | :--- |
| R1 | Theme đa giao diện | Token 3 tầng + registry theme, mỗi theme đủ Light/Dark; **chỉ theme mặc định bắt buộc vuông vắn**, theme khác qua `ShapeVariant`, luôn giữ mật độ cao (Material/Radix/Ant/SLDS) | ~~Số lượng & tên theme; tenant hay người dùng~~ **Đã chốt: 4 theme; theo tenant (mode theo người dùng)** |
| R2 | Animation | Motion token + ngân sách hiệu năng, tắt theo `prefers-reduced-motion` (Material/Fluent/CSS) | ~~Mức độ & ngưỡng FPS/thời lượng~~ **Đã chốt: nhanh, ưu tiên hiệu năng cao; route transition nhẹ** |
| R3 | Icon Feather | Một component icon chung, Feather **npm package qua adapter**, không thêm UI framework (Feather/Lucide) | ~~Phạm vi icon-only vs icon+label~~ **Đã chốt: npm `feather-icons`; chính = icon+nhãn, hàng/menu = icon-only + aria** |
| R4 | Context menu | Component/service chung; menu là lối tắt, mở Drawer/router; phân quyền; bàn phím; render ngoài vùng cuộn (Excel/Notion/Linear/GitHub/Jira) | ~~Bắt buộc long-press Mobile?~~ **Đã chốt: không**; ~~ẩn hay disable~~ **Đã chốt: disable kèm lý do; áp tất cả màn danh sách Desktop** |
| R5 | Loading + skeleton vùng độc lập | Top progress bar + skeleton theo hình dạng + mô hình trạng thái vùng; trễ tránh nháy (YouTube/Facebook/Slack/Notion) | ~~Dạng thanh loading; ngưỡng trễ~~ **Đã chốt: top progress bar, trễ 150ms, thử lại theo vùng**; còn: màn ưu tiên tách vùng |
| R6 | Đa ngôn ngữ mở rộng | Language registry + `LangCode`, lazy dictionary, fallback, parity check, `Intl`; RTL (ICU/CLDR/Material/Apple) | ~~Danh sách & số ngôn ngữ~~ **Đã chốt: 13 locale (vi, en, zh-CN, ja, ko, es, fr, de, pt-BR, ru, ar, th, id)**; ~~RTL đợt này hay sau~~ **Đã chốt: RTL đầy đủ ngay**; ~~ngưỡng dịch~~ **Đã chốt: 100%**; ~~múi giờ~~ **Đã chốt: theo người dùng**; còn: source of truth |

## 9. Chưa kiểm chứng

Một số chi tiết phiên bản/thời điểm của sản phẩm bên ngoài có thể thay đổi và **chưa được kiểm chứng** trong phiên này (ví dụ cơ chế theme cụ thể của Odoo, số lượng icon chính xác của Feather/Lucide, thời điểm bật RTL). Các bài học ở trên là **định hướng đề xuất**, chưa phải scope/AC đã duyệt. Mọi kết luận chỉ có hiệu lực sau khi khách hàng xác nhận tại [Confirmation Gate](../00_READING_GUIDE.md#3-gate-riêng-biệt) (CONF-S04-001).
