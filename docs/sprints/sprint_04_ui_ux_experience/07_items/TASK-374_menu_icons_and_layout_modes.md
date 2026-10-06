# [TASK-374] Icon cho menu + 4 kiểu bố cục menu mới (narrow, compact, top nhiều cấp)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-374 / Task / Sprint 04 |
| Severity / trạng thái | High / **Done** (TR-S04-001 v0.3 verified 2026-10-06) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân phối |
| Cập nhật / input version | 2026-10-05 / chỉ đạo chủ dự án: "menu cần có icon, các menu còn có chế độ narrow với menu trái, phải, compact, top với nhiều level nữa" |
| depends_on / blocks / parent | TASK-372, TASK-373 / — / [FEAT-24](FEAT-24_theme_system_and_design_tokens.md) |
| Write scope / baseline | `shared/components/section-nav/*`, `shared/enums/theme.enum.ts`, `shared/theme/theme-registry.ts`, `web/features/settings/settings-layout.*`, `web/features/platform/platform-layout.component.ts` |

## 1. Mục tiêu và scope

- [x] `SectionNavItem` thêm `icon` (IconName dùng chung) và `children` (cấp 2).
- [x] Menu settings chuyển thành cây: Vai trò (leaf) + nhóm **Tổ chức / Dữ liệu / Hệ thống**; menu platform cũng có icon.
- [x] `app-section-nav` có 4 biến thể render: `rail` (icon + nhãn), `compact` (icon + nhãn nhỏ, hàng thấp hơn), `icons` (chỉ icon, nhãn = tooltip + aria-label), `bar` (ngang, nhóm mở dropdown).
- [x] `LayoutId` thêm `narrow` (rail 48px chỉ icon) và `compact` (rail 160px) — tổng 6 bố cục: `side · right · narrow · compact · top · drawer`.
- [x] `top` nhiều cấp: cấp 1 là nhóm có chevron, mở dropdown cấp 2 bằng thẻ `<details>` gốc trình duyệt (bàn phím dùng được, không cần JS state); chọn mục thì tự đóng.
- [x] Switcher: thêm 2 lựa chọn bố cục mới; key i18n `LAYOUT_NARROW`, `LAYOUT_COMPACT` + 3 key tên nhóm, đủ 13 locale cho cả web và mobile (thư viện dùng chung).

## 2. Tiêu chí và kiểm chứng

| Bố cục | Đo được (1440px) | Icon |
| :--- | :--- | :--- |
| side | aside 224px, left=0, 7 nhãn | 7/7 |
| **narrow** | aside **48px**, **0 nhãn** (chỉ icon) | 7/7 |
| **compact** | aside **160px**, 7 nhãn nhỏ | 7/7 |
| right | aside 224px, left=**1216** | 7/7 |
| **top** | không aside, **3 nhóm `<details>`**, 7 mục trong dropdown | 7/7 |
| drawer | không aside, nút Menu + drawer chứa menu | 7/7 |

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` web + mobile | **PASS**, 0 error | log build |
| `npm run i18n:check` | **PASS** 13/13 locale 100% (web 918, mobile 494 key) | parity script |
| QA trình duyệt 6 bố cục + icon | **PASS** | bảng trên; ảnh `%TEMP%/opencode/icons-layouts/layout-*.png` |
| QA bàn phím dropdown `top` (Tab/Enter) | Not Run | thuộc đợt QA TP-S04-001 |

## 3. Bàn giao và lịch sử

Commit `7aa7213`. Chi tiết: mọi mục menu đều có icon (kể cả rail icon-only nên vẫn nhận diện được); `top` hỗ trợ 2 cấp qua `<details>` — nếu sau này cần 3 cấp thì phải chuyển sang component đệ quy (ghi chú để không hiểu nhầm là không giới hạn cấp).

> **Cập nhật 2026-10-05 (BUG-126, phản hồi "menu dọc chưa đạt, tham khảo Fuse")**: hai bố cục `narrow`/`compact` đã **bị bỏ** — trục bố cục giờ chỉ còn **dọc** (`side`, `right`) và **ngang** (`top`) + `drawer`; hình thái hiển thị (thu gọn/mở rộng) chuyển thành **icon action ngay trong menu** (nút collapse ở header, kiểu Fuse). Menu dọc được làm lại cho dễ theo dõi: tiêu đề nhóm in hoa, nhóm **mở sẵn toàn bộ**, mục con thụt lề + icon, nhãn cắt gọn một dòng. Chi tiết: [BUG-126](BUG-126_vertical_menu_readability.md).
