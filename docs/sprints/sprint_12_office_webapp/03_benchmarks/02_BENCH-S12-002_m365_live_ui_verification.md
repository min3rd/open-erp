# [BENCH-S12-002] Kiểm chứng Live UI Microsoft 365 Web (Đo đạc DOM & Ảnh chụp)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BENCH-S12-002 / Đối chuẩn (kiểm chứng lại) / Sprint 12 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-11-15 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [BENCH-S12-001](01_BENCH-S12-001_office_webapp_benchmarks.md) 0.4 §2 và §5 |
| Đọc trước / đọc tiếp | [BENCH-S12-001](01_BENCH-S12-001_office_webapp_benchmarks.md) / [PLAN-S12-001](../05_solutions/04_PLAN-S12-001_sprint_12_delivery_direction.md), [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md) |

## 1. Mục đích

`BENCH-S12-001` ghi nhận quan sát Microsoft 365 Web ngày 2026-11-15 nhưng không lưu ảnh chụp và một số con số chiều cao không khớp với thiết kế `DES-UI-S12-001` (36px/40px/90px). Tài liệu này **đo lại trực tiếp** trên phiên Microsoft 365 Web đã đăng nhập của chủ dự án, lưu ảnh chụp làm bằng chứng, và tách rõ:

1. Số đo **quan sát được** (DOM geometry, class name, ảnh chụp).
2. Điểm **đính chính** so với `BENCH-S12-001`.
3. Điểm **chưa kiểm chứng** — không kết luận.

## 2. Phương pháp và giới hạn

| Hạng mục | Giá trị |
| :--- | :--- |
| Thời điểm | 2026-11-15, trình duyệt nhúng của OpenCode desktop (Chromium), theme tối, UI `en-US` |
| Tài khoản | Phiên Microsoft 365 doanh nghiệp đã đăng nhập sẵn của chủ dự án (không nhập mật khẩu mới trong phiên này) |
| Ứng dụng | Word Web (`word-edit.officeapps.live.com`), Excel Web (`excel.officeapps.live.com`), PowerPoint Web (`powerpoint.officeapps.live.com`), mở từ `m365.cloud.microsoft/apps` |
| Cách đo | Đọc `getBoundingClientRect()`, `id`, `className`, `role` trong iframe editor bằng DevTools của trình duyệt; chụp ảnh màn hình từng trạng thái |
| Kiểm chứng chéo (REA) | `capture_browser_scenario` (REA, Edge headless, profile tạm) mở `https://word.cloud.microsoft/en-us/` trả về trang marketing "Welcome to Word for free on the web" với nút `Create blank document` / `Upload a file`, **không** có editor. Xác nhận editor chỉ tồn tại trong phiên đăng nhập/WOPI; trình duyệt nhúng của OpenCode không mở CDP nên REA không attach trực tiếp được vào tab đã đăng nhập. Evidence: `ev_512423693f57fed897f534b456a96d9dae298dd55bda98932611e4461a1c75c4` |
| Không làm | Không sửa nội dung tài liệu, không lưu, không tải file, không đọc Network payload, không thực thi mã trên máy chủ Microsoft |
| Giới hạn | Chỉ đo trên tài liệu trống có sẵn (`Document 2.docx`, `Book 2.xlsx`, `Presentation.pptx`); hành vi với file phức tạp, co-authoring và file mã hóa không thuộc phạm vi |

## 3. Số đo Shell (CSS px, quan sát trực tiếp)

| Vùng | Word | Excel | PowerPoint |
| :--- | :--- | :--- | :--- |
| Viewport lúc đo | 1296×894 | 1496×894 | 1496×894 |
| Title Bar | 48 (`#DocumentTitle_container`) | 48 | 48 |
| Tab strip | 31 (`[role=tablist]`) | 36 (`ms-OverflowSet`) | 31 (`[role=tablist]`) |
| Ribbon tổng | 76 (`#RibbonContainer`, top 48) | 136 (`#RibbonContainer`, top 48) | 76 (`#RibbonContainer`, top 48) |
| Hàng lệnh Ribbon | 45 (76 − 31) | ~96 (136 − 36 − 4) | 45 (76 − 31) |
| Formula Bar | — | 32 (`m_formulaBar`, top 184) | — |
| Vùng làm việc | top 124, cao 745 | lưới bắt đầu top 216 | stage top 124, cao 743 |
| Sheet Tab Bar | — | 32 (top 839) | — |
| Status Bar | 25 (`#StatusBar`) | 23 | 23 |
| Nội dung chính | `div.Page` 818×1058 (viền 1px → content 816×1056) | canvas lưới | stage 1240×743 (≈16:9) tại x=256 |

Bố cục dọc giống nhau ở cả 3 app: **Title 48 → Tabs 31–36 → Ribbon → Workspace → Status 23–25**. Không app nào dùng Title Bar 36px.

## 4. Đính chính so với `BENCH-S12-001`

| # | Tuyên bố cũ | Quan sát live | Kết luận |
| :--- | :--- | :--- | :--- |
| 1 | Title Bar 36–40px | 48px ở cả 3 app | **Đính chính** số đo |
| 2 | Single Line Ribbon ~40px | Tổng 76px: 31px tab + 45px hàng lệnh | **Đính chính cách đo**: 40px chỉ là hàng lệnh, không phải cả khối |
| 3 | Classic Ribbon ~90px (Excel) | 136px: 36px tab + ~96px hàng lệnh 2 tầng | **Đính chính** số đo |
| 4 | Tên file + trạng thái `Saved` dạng text trên Title Bar | Chỉ có icon cloud, `aria-label="Saved — Click the cloud icon to view file location"`; text `Autosaved online to Documents` nằm ở đầu menu `File` | **Bổ sung** hành vi |
| 5 | Menu `File`: New, Open, Create a Copy, Export, Print, Rename, Info | 13 mục: `Autosaved online to Documents`, New, Open, Share, Create a Copy, Export, Print, Add to favorites, Rename, Move File, Version History, Delete, Info | **Mở rộng** danh sách |
| 6 | Word Export: PDF, ODT, Markdown | Đúng, và có thêm `Download as PDF with comments` | **Bổ sung** |
| 7 | `div.Page` 816×1056 | Phần tử đo được 818×1058 do cộng viền 1px; content-box vẫn 816×1056 | **Làm rõ** |
| 8 | Mỗi đoạn là `<canvas class="CanvasParagraph">` + text layer `opacity:0` | Xác nhận `canvas.CanvasParagraph` (816×23 cho đoạn trống) và 24 phần tử `[contenteditable=true]` gồm `EditingSurfaceBody`. Không kiểm tra `opacity` của lớp text | **Xác nhận một phần** |
| 9 | Excel: 5 canvas `ewr-sheettable` (1920×30; 43×560 ×2; 1920×560 ×2) | Đúng 5 canvas hiển thị theo đúng kích thước trên, cộng 1 canvas ẩn `#chmc` 1×1 | **Xác nhận** |
| 10 | Formula Bar dùng Quill `div.ql-editor` | Ô nhập có `id=formulaBarTextDivId_textElement`, class `ql-editor ewa-rteTextElement`, cao 18px trong khung 24px; cả thanh 32px | **Xác nhận** |
| 11 | PowerPoint: `#webgl-canvas` 1920×1080 + SVG overlay `selectionsvgggroup` | `#webgl-canvas` 1920×1080 xác nhận (offscreen tại 0,0). Overlay thực tế: `div.ShapeSelectionOverlay`, `div.ModernSelectionViewAnchor`, `svg.pointer-events-none` chứa **8 handle** `g#selectionHandle-<shapeId>-0..7` kích thước 10×10 + tay nắm xoay. Không tìm thấy class `selectionsvgggroup` | **Đính chính tên class** |
| 12 | PowerPoint phụ thuộc server rất nặng (`images.ashx`, `GetThumbs`, `PowerPoint.ashx`) | Không đo lại trong lần này (không đọc Network) | **Chưa kiểm chứng lại** |

## 5. Chi tiết PowerPoint (bằng chứng cho `AC-07`)

| Quan sát | Giá trị |
| :--- | :--- |
| Thumbnail pane | `#pptonline-sorter-view-id` rộng **256px**, cao 747, có `ThumbnailResizeHandle` rộng 10px để kéo |
| Stage | `#WACViewPanel` 1240×743 tại (256, 124) — tỉ lệ 1.669 |
| WebGL buffer | `#webgl-canvas` 1920×1080 tại (0,0) |
| Selection | 2 shape được chọn đồng thời → 2 bộ 8 handle (`selectionHandle-2-*`, `selectionHandle-3-*`), mỗi handle `rect` 10×10 |
| Tab | Home, Insert, Draw, Design, Transitions, Animations, Slide Show, Review, View, Help |
| Thanh phải tab strip | `Comments`, `Catch up`, `Present`, `Editing` (mode menu), `Share` |
| Status Bar | `Slide 1 of 1`, `Notes`, zoom `88%`, `Add Notes` |

## 6. Chi tiết Excel (bằng chứng cho `AC-06`)

| Quan sát | Giá trị |
| :--- | :--- |
| Canvas | `1920×30` header cột; `43×560` header hàng (2 tile dọc); `1920×560` lưới ô (2 tile dọc) |
| Vì sao chia tile | Viewport 1496px < canvas 1920px → tile rộng hơn viewport để cuộn ngang không repaint toàn lưới; tile dọc 560px lặp theo trục Y |
| Formula Bar | Name Box `A1` (rộng ~108px), nút `×`, `✓`, `fx`, ô nhập rộng 1253px |
| Ô đang sửa | `[contenteditable=true]` do engine Quill quản lý, đặt đè đúng vị trí ô |
| Sheet tab | `Sheet1` cao 32px, nút `+` cuối dải, mũi tên cuộn trái/phải |

## 7. Danh mục bằng chứng

| Ảnh chụp | Nội dung |
| :--- | :--- |
| [word-editor-home.jpeg](evidence/word-editor-home.jpeg) | Title 48 + 7 tab + ribbon 76 + page 818×1058 + status 25 |
| [word-file-menu.jpeg](evidence/word-file-menu.jpeg) | Menu `File` compact dropdown 13 mục, mở đè lên workspace (không phải backstage toàn màn hình) |
| [word-file-export-submenu.jpeg](evidence/word-file-export-submenu.jpeg) | Submenu Export: PDF, PDF with comments, ODT, Markdown |
| [excel-editor-grid.jpeg](evidence/excel-editor-grid.jpeg) | Ribbon classic 136 + formula bar 32 + lưới canvas + sheet tab 32 + status 23 |
| [excel-start-page-recent-files.jpeg](evidence/excel-start-page-recent-files.jpeg) | Trang bắt đầu: bảng `Recent` có cột Name/Opened/Owner/Activity — mẫu bảng dữ liệu tham chiếu |
| [m365-apps-shell.jpeg](evidence/m365-apps-shell.jpeg) | Shell M365 Web: rail trái (New chat, Search, Library, Agents, Notebooks), lưới app card, account/workspace ở đáy |
| [powerpoint-editor-stage.jpeg](evidence/powerpoint-editor-stage.jpeg) | Thumbnail 256 + stage 1240×743 + status 23 |
| [powerpoint-shape-selection.jpeg](evidence/powerpoint-shape-selection.jpeg) | 8 handle chọn shape + tay nắm xoay trên SVG overlay |
| [shell-metrics.json](evidence/shell-metrics.json) | Toàn bộ số đo dạng máy đọc được (viewport, id, class, kích thước) để tái lập kiểm chứng |

## 8. Kết luận đầu vào cho Sprint 12

1. **Dùng số đo thật làm design token**: Title 48, Tab 31–36, Ribbon Word/PPT 76, Ribbon Excel 136, Formula Bar 32, Status 23–25. Đề xuất cập nhật bảng bố cục trong `DES-UI-S12-001` (§2) và câu chữ `AC-04` trước khi code — cần chủ dự án chốt vì `DES/AC` đã APPROVED.
2. **Menu `File` là dropdown 13 mục**: bản v1 chỉ nên làm 8 mục có hành vi thật (`New`, `Open`, `Save`, `Save As/Create a Copy`, `Export`, `Print`, `Rename`, `Info`); các mục `Share`, `Add to favorites`, `Move File`, `Version History`, `Delete` gắn với OneDrive/SharePoint — nếu đưa vào phải map sang ERP Storage, không giả lập. *(Đã chốt R2 ngày 2026-11-15: làm 9 mục, thêm `Share nội bộ ERP` — xem BENCH-003.)*
3. **PowerPoint selection**: dựng đúng mô hình `ShapeSelectionOverlay` + 8 handle 10px + tay nắm xoay; không cần bám tên class của Microsoft.
4. **Word page**: content 816×1056, phần tử cha 818×1058 do viền — kiểm thử pixel nên so content-box.
5. **Excel tiling**: tile rộng 1920 cố định theo vùng nhìn, tile dọc 560; header cột/hàng là canvas riêng.
6. **Điểm chưa kiểm chứng**: phụ thuộc server của PowerPoint và chi tiết lớp text `opacity:0` của Word — giữ nguyên trong `BENCH-S12-001` nhưng đánh dấu "chưa xác minh lại" thay vì trích dẫn như dữ kiện.
7. **Màn hình bắt đầu**: M365 dùng rail dọc (New chat, Search, Library, Agents, Notebooks) + lưới app card + bảng `Recent` có cột Name/Opened/Owner/Activity. Plugin nên có một `OfficeWorkspaceComponent` tối giản theo mẫu này (mở gần đây + chọn Word/Excel/PPT/PDF), thay vì nhảy thẳng vào một editor trống.

## 9. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Đo lại live Word/Excel/PowerPoint Web, lưu 8 ảnh chụp, đính chính 3 số đo shell + tên class selection overlay | BA Agent; phiên trình duyệt đã đăng nhập của chủ dự án |
