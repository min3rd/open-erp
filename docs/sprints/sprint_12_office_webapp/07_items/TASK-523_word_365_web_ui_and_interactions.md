# TASK-523: Chuẩn hóa giao diện & tương tác Word Web đạt 100% tương đương Office 365 Web (trừ dịch vụ Microsoft)

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-523` |
| **Sprint** | Sprint 12 — `office-webapp` Plugin |
| **Loại** | Task (Word 365 Web UI & UX Parity) |
| **Ưu tiên** | High |
| **Trạng thái** | `Done` (chờ QA xác nhận) |
| **Phụ thuộc** | [TASK-522](./TASK-522_word_multiformat_reader_and_rendering_parity.md) |
| **Owner** | Developer Agent |
| **Bằng chứng** | [word-web-365-parity-report.json](../08_testing/evidence/word-web-365-parity-report.json), [word-web-365-home-light.png](../08_testing/evidence/word-web-365-home-light.png), [word-web-365-home-dark.png](../08_testing/evidence/word-web-365-home-dark.png), [word-web-365-file-export.png](../08_testing/evidence/word-web-365-file-export.png), [word-web-365-table-grid.png](../08_testing/evidence/word-web-365-table-grid.png), [word-web-365-color-styles.png](../08_testing/evidence/word-web-365-color-styles.png), [word-web-365-find-replace.png](../08_testing/evidence/word-web-365-find-replace.png), [word-web-365-comment-card.png](../08_testing/evidence/word-web-365-comment-card.png), [word-web-365-classic-ribbon.png](../08_testing/evidence/word-web-365-classic-ribbon.png), [word-web-365-context-mini.png](../08_testing/evidence/word-web-365-context-mini.png), [word-web-365-mobile-390x844.png](../08_testing/evidence/word-web-365-mobile-390x844.png) |

## 1. Mục tiêu & phạm vi tương đương Word for the Web (Office 365 Web)

Đưa giao diện và tương tác của trình soạn thảo Word trong plugin `office-webapp` về đúng **Microsoft Word for the Web (`word-edit.officeapps.live.com`)** theo bộ số đo live trong [BENCH-S12-002](../03_benchmarks/02_BENCH-S12-002_m365_live_ui_verification.md), giữ nguyên toàn bộ định dạng/phân trang tài liệu 546 trang và **loại trừ minh bạch các tính năng đòi hỏi dịch vụ đám mây/AI của Microsoft**:

- **Hạng mục loại trừ (dịch vụ Microsoft / cloud ngoài client)**: `Dictate`, `Editor AI` (Editor Suggestions / Text Predictions), `Add-ins` (Office Store), `Translate` (dịch đám mây), `Catch up`, `Give Feedback to Microsoft`, OneDrive AutoSave và Real-time Co-authoring.

## 2. Phạm vi đã thực hiện

| Nhóm | Tệp / Thành phần chính | Nội dung |
| :--- | :--- | :--- |
| Shell & Ribbon Word Web | `word-ribbon.ts`, `office-webapp.component.ts`, `office-webapp.component.html`, `styles.css` | Căn chuẩn chiều cao Word Web: Title Bar `48px` (badge `W`, tên tệp bỏ ` - Word`, pill trạng thái lưu mở popover `fileStatus`, thanh `Alt+Q` căn giữa, nút chuyển theme Sáng/Tối), Tab Strip `31px` với 7 tab chuẩn Simplified (`Trang chủ`, `Chèn`, `Bố cục`, `Tham chiếu`, `Xem lại`, `Xem`, `Trợ giúp`) + gạch chân dưới tab active + cụm `[Bình luận (badge)]`, `[Đang chỉnh sửa ▾]`, `[Chia sẻ ▾]` màu xanh nổi bật; **Simplified Single-Line Ribbon `45px`** là mặc định, chuyển mượt sang **Classic Ribbon `104px`** (10 tab + tab ngữ cảnh `Thiết kế bảng`/`Bố cục bảng`/`Ảnh`/`Hình`) qua nút `Ribbon Display Options`; Ruler mặc định tắt, bật/tắt tức thì |
| Menu Tệp & Xuất клиент thuần TS | `odt-save.ts`, `office-webapp.component.ts`, `office-webapp.component.html` | Dropdown gọn `268px` (`.op-word-file-dropdown`) với header trạng thái + flyout `New`, `Open`, `Share`, `Create a Copy`, `Export` (4 xuất thuần client: **PDF**, **PDF kèm bình luận** dùng trang tóm tắt bình luận raster hóa, **ODT 1.2** qua `saveOdt()`, **Markdown**), `Print`, `Rename`, `Info`, `Close` |
| Popover & Picker trực quan | `office-webapp.component.*`, `styles.css` | Bộ chọn tương tác: lưới chèn bảng **10×8** (`tableGrid`), bảng màu Theme 6×10 + Standard 10 (`fontColor`, `shading`, `pageColor`), màu tô sáng (`highlight`), thư viện Kiểu (`styles` 11 mục), Căn lề + phím tắt (`align`), Giãn dòng (`spacing`), Lề / Hướng / Khổ giấy / Cột / Ngắt trang-section (`margins`, `orientation`, `pageSize`, `columns`, `breaks`), Chế độ đánh dấu (`markup`), Thu phóng (`zoom`), Chuyển nhanh trang (`goToPage`), Liên kết (`link`), Đổi tên & Thuộc tính tệp (`rename`, `fileStatus`) |
| Navigation Pane, Comments & Dark Mode | `office-webapp.component.*`, `styles.css` | Nút nổi mở Navigation bên trái; Pane `280px` với tiêu đề `← Navigation`, 3 tab `Headings` / `Find` / `Replace` (Match case, Whole word, Prev/Next, Replace/Replace All) + phím tắt `Ctrl+F`, `Ctrl+H`; **Thẻ bình luận nổi lề phải** (`>= 1180px`, tạo/trả lời/đánh dấu xong/xóa, phím tắt `Ctrl+Alt+M`); **Dark Mode** đồng bộ chrome + trang và nút **Đổi nền** (`Switch Background`) trên Status Bar `25px` kèm nút **Vừa khung (`Fit`)**; Mini Toolbar & Context Menu Fluent đủ icon + phím tắt |
| Responsive Mobile, i18n & Kiểm thử E2E | `i18n/*.json` (plugin, web, mobile × 13 locale), `qa-word-web-365-parity.mjs`, `smoke.mts` | Mobile `<= 640px` (`390×844`): ẩn cụm chrome desktop, cuộn ngang tab mượt 1 dòng, flyout menu Tệp xếp dọc trong `280px`, clamp Mini Toolbar, touch target `>= 40px`, `overflow = 0`; thêm 38 khóa i18n zero-emoji đồng bộ `13/13` locale; round-trip test `saveOdt` → `parseOdt` |

## 3. Tiêu chí nghiệm thu

- **AC-1**: Hình học Word Shell khớp Office 365 Web (`titlebar = 48px`, `tabstrip = 31px`, Single-Line Ribbon `= 45px`, Classic Ribbon `= 104px`, `statusbar = 25px`, `navPane = 280px`, `fileDropdown = 268px`).
- **AC-2**: Hỗ trợ đầy đủ cả Single-Line & Classic Ribbon, Light & Dark theme + Switch Background độc lập, Navigation Find/Replace (`Ctrl+F`/`Ctrl+H`), Floating Comment Cards (`Ctrl+Alt+M`), 10×8 Table Grid, bảng màu 70 ô, Style Gallery, Status Bar `Fit`, Mini Toolbar & Fluent Context Menu không bị cắt mép viewport.
- **AC-3**: Xuất tệp thuần client hoạt động thật (`.odt` mở lại qua `parseOdt` có tiêu đề/danh sách/bảng/màu; `-comments.pdf` sinh file `%PDF-` hợp lệ).
- **AC-4**: Không hồi quy các tính năng Word/Excel/PPT/PDF, Mobile Ionic, Backend Java và chuẩn phân trang tài liệu thầu 546 trang (`546 = 546`, Dice body ≥ `0.976` / compact ≥ `0.991`, `0` trang `< 0.50`, `80/80` bảng 5, `16/16` bảng 8).
- **AC-5**: Smoke `office:test`, UI/Mobile/Server builds, i18n strict 13/13 locale, `qa-word-formats.mjs`, `qa-word-views.mjs`, `qa-ribbon-gaps.mjs` và `qa-word-web-365-parity.mjs` đều pass với `0 console.error` / exception.

## 4. Kết quả kiểm chứng

| Hạng mục | Kết quả |
| :--- | :--- |
| Parity Office 365 Web (`qa-word-web-365-parity.mjs`) | **PASS (exit 0)** — `titleH=48`, `tabH=31`, `ribbonH=45` (`ribbonSingle=true`), `statusH=25`, `dropWidth=268`, `navW=280`, `classicH=104`; `odtMagicOk=true`, `pdfMagicOk=true`; `swatches=70`, `styleItems=11`, `gridCells=80`, `cards=1`, `fitZoom=1.71`, `miniBtns=9`, `ctxItems=17`, `ctxShortcuts=9`; Mobile `390×844` `overflow=0`, `minTouchH=40`; **0 `pageErrors`, 0 `consoleErrors`** |
| Smoke (`npm run office:test`) | **447 passed, 0 failed** (gồm test mới `odt export round-trip heading/lists/table/fill`), manifest check 0 lỗi |
| Builds (`office:ui:build`, `mobile:build`, `office:server:build`) | **PASS 3/3** — Plugin UI `24.51s` (`1.78 MB`), Mobile Ionic `29.17s` (`office-viewer-page` lazy chunk `201.68 kB`), Quarkus Maven `BUILD SUCCESS` |
| Dual-Mode Word Formats (`qa-word-formats.mjs`) | **PASS** — 10 Desktop `1440×1000` + 5 Mobile `390×844` (`overflowX=0`, `smallTargets=0`, **0 `console.error`**) |
| Regression Views & Ribbon (`qa-word-views.mjs`, `qa-ribbon-gaps.mjs`) | **PASS** — `webOn=true`, `printActive=true`, `hyphenClass=true` (`errors=[]`), `continuous=true`, `dark=true`, `tocInserted=true`, `commentsPanel=true`, `filterSelect=true` (`exceptions=[]`) |
| Parity tài liệu thầu 546 trang | **546 = 546 trang** (`settled="true"`, `errors=0`), word `bodyDice=0.9766` (`median=0.9826`, `536 >= 0.90`, `0 < 0.50`), compact `bodyDice=0.9916` (`median=0.997`, `546/546 >= 0.90`, `0 < 0.50`) |
| i18n (`i18n:check:strict` & `qa-i18n-keys.mjs`) | Web 13/13 locale (`3532` khóa **100.0%**), Mobile 13/13 locale (`1997` khóa **100.0%**), plugin `vi/en` **948 khóa / 0 thiếu** |
