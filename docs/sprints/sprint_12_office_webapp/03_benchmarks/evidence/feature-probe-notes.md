# Biên bản dùng thử Microsoft 365 Web — 2026-11-15

Nguồn: phiên trình duyệt nhúng của OpenCode desktop, tài khoản Microsoft 365 doanh nghiệp của chủ dự án (đã đăng nhập sẵn). Theme tối/lần sau sáng theo phiên; UI `en-US`.
Mục đích: ghi lại **nhãn lệnh và hành vi quan sát trực tiếp** làm bằng chứng cho [BENCH-S12-003](../03_BENCH-S12-003_m365_feature_matrix.md).

## 1. Word Web

### Ribbon (nhãn đọc từ DOM, đã lược nút hệ thống)

- Home: Undo, Undo Show More Options, Clipboard, Format Painter, Font Name, Font Size, Grow Font Size, Shrink Font Size, Bold, Italic, Underline, Text Highlight Color Yellow, Font Color Red, Clear Formatting, Bullets, Numbering, Checklist, Decrease Indent, Increase Indent, Text Alignment, Border Options, Paragraph Shading, Line Spacing, Paragraph Options, Styles (Normal, No Spacing, Heading 1, Headings and Other Styles), Find, Dictate, Editor, Add-ins.
- Insert: Page Break, Table, Picture, Drawing, Link, Table of Contents, Bookmarks, Online Video, New Comment, Header & Footer, Page Numbers, Equation, Symbol, Emoji.
- Layout: Margins, Orientation, Size, Columns, Breaks, Line Numbers, Page Breaks, Page Borders, Page Color.
- References: Table of Contents, Insert Footnote, Insert Endnote, Citations.
- Review: Editor, Spelling & Grammar, Word Count, Check Accessibility, Mark All as Read, Translate, New Comment, Delete, Previous/Next Comment, Show Comments, Filter, Markup view, Track Changes, Accept, Reject, Previous, Next.
- View: Separate Pages, Reading View, Immersive Reader, Zoom to 100%, Ruler, View Navigation Pane, Header & Footer, Footnotes, Endnotes, Dark Mode, Switch Background.
- Help: Contact Support, Feedback, Keyboard Shortcuts, What's New.

### Hành vi đã thao tác

| Thao tác | Kết quả quan sát |
| :--- | :--- |
| Gõ text vào trang | Text vào document, status bar đổi `0 words` → `12 words` sau ~1s |
| Chèn bảng | Dropdown `Insert Table` dạng lưới 10×8, mỗi ô `aria-label="NxM Table"`, có link `Choose row and column` |
| Bảng vừa chèn | Xuất hiện tab contextual `Table`; ribbon có Cell Shading, Height `0.208"`, Width `3.25"` (đơn vị inch) |
| New Comment | Thẻ nổi bên phải ~344px: avatar, `@mention or comment`, `Cancel`, `Comment` |
| Ctrl+F | Mở Navigation pane trái rộng **280px**, 3 tab `Headings / Find / Replace`, input `Search in document`, icon filter |
| File > Version History | Overlay toàn màn hình `VersionHistoryOverlay`, nút `Back to document`, danh sách mốc `10 minutes ago / 9 hours ago`, cột tác giả, toggle `Show edits` |
| File > Print | Không mở tab mới trong 2.5s (môi trường nhúng chặn cửa sổ in); không kết luận |
| File menu | `Autosaved online to Documents`, New, Open, Share, Create a Copy, Export, Print, Add to favorites, Rename, Move File, Version History, Delete, Info |
| Export submenu | Download as PDF, Download as PDF with comments, Download as ODT, Download as Markdown |
| Title bar | Nút cloud `aria-label="Saved — Click the cloud icon to view file location"`; tên file sửa inline |

## 2. Excel Web

### Ribbon (nhãn đọc từ DOM)

- Home: Paste, Cut, Copy, Format Painter, Font Name/Size, Grow/Shrink, Bold/Italic/Underline/Double Underline/Strikethrough, Borders, Fill Color, Font Color, Align Top/Middle/Bottom, Align Left/Center/Right, Decrease/Increase Indent, Orientation, Wrap Text, Merge & Center, Number Format, Accounting, Percentage, Comma, Decrease/Increase Decimal, Conditional Formatting, Format As Table, Cell Styles, Insert, Delete, Format, AutoSum, Clear, Sort & Filter, Find & Select, Add-ins.
- Insert: PivotTable, Table, Forms, Pictures, Shapes, Checkbox, Recommended Charts, Column, Line, Scatter, Pie, Bar, Statistical, Combo, Other Charts, Slicer, Link, New Comment, Text Box.
- Page Layout: Page Setup, Print Area, Breaks, Sheet Right-to-Left.
- Formulas: Insert Function, AutoSum, Financial, Logical, Text, Date & Time, Lookup & Reference, Math & Trig, More Functions, Insert Python, Name Manager, Show Formulas, Calculation Options, Calculate Workbook, Calculate Sheet, Editor.
- Data: Get Data, From Table/Range, Data from Picture, Data from Power BI, Refresh, Refresh All, Queries & Connections, Workbook Links, Convert to Data Type, Stocks, Currencies, Geography, Sort Ascending, Sort Descending, Custom Sort, Filter, Clear, Reapply, Split Text to Columns, Flash Fill, Remove Duplicates, Data Validation, Analyze Data, Group, Ungroup.
- Review: New Comment, Show Comments, Previous/Next Comment, Delete Comment, Show Changes, Version History, Spelling, Accessibility, Performance, Workbook Statistics, Manage Protection, Pause Protection, Notes.
- View: Save, New Sheet View, Options, Exit View, Zoom to 100%, New Window, Freeze Panes, Full Screen, Navigation, Headings, Gridlines, Formula Bar, Data Type Icons, Focus Cell, Immersive Reader.
- Automate: New Script, View Scripts, More Scripts, Unhide All Rows and Columns, Freeze Selection, Make a Subtable from a Selection, Remove Hyperlinks, Count Empty Rows, Return Table Data as JSON, Automation Templates.
- Draw: Select, Draw with Touch, Eraser, Pen, Highlighter, Action Pen.
- Ribbon Display Options (menu): `Ribbon Layout`, `Classic Ribbon`, `Single Line Ribbon`, `Show Ribbon`, `Always show ribbon`, `Show tabs only`, `Adjust automatically`.

### Hành vi đã thao tác

| Thao tác | Kết quả quan sát |
| :--- | :--- |
| Home > Conditional Formatting | Menu: Highlight Cell Rules, Top/Bottom Rules, Data Bars, Color Scales, Icon Sets, New Rule, Clear Rules, Manage Rules |
| View > Freeze Panes | Menu: `Freeze at selection`, `Top Row` (Up to Row 1), `First Column` (Up to Column A) |
| Data > Data Validation | Hộp thoại rộng **404px**, tab `Settings / Input Message / Error Alert`, dropdown `Allow`, checkbox `Ignore blank`, `Clear All / Apply / Cancel` |
| Insert > Column | Gallery mở nhóm `2-D Column` (thumbnail), không tự chèn khi chưa chọn |
| Formula bar | Name Box `A1` rộng ~108px; ô nhập `contenteditable` class `ql-editor` cao 18px trong khung 24px; nút `×`, `✓`, `fx`, expand |
| Lưới | 5 canvas `ewr-sheettable`: header cột 1920×30, header hàng 43×560 ×2, lưới 1920×560 ×2 + canvas ẩn 1×1 |

## 3. PowerPoint Web

### Ribbon (nhãn đọc từ DOM)

- Home: Undo, Clipboard, Format Painter, Delete, New Slide, Slide Layout, Hide Slide, Font Name/Size, Increase/Decrease Font Size, Bold, Italic, Underline, Highlight Color, Font Color, Bulleted Library, Numbering Library, Text Alignment, Decrease/Increase List Level, Line Spacing, Shapes, Shape Fill, Shape Outline, Shape Styles, Arrange, Find, Dictate, Add-ins, Designer.
- Insert: New Slide, Text Box, Table, Pictures, Cameo, Video, Audio, Shapes, Insert From M365 Stock Images, Icons, SmartArt, Chart, Link, New Comment, Footer, Symbol.
- Design: More Themes, Archway, Axis, Bjorn, Dark Gradient, Dune, Editorial, Film Burn, More Variants, Slide Layout, Slide Size, Background, Visualize Slide, Design Suggestions.
- Transitions: Transition Preview, None, Morph, Cut, Fade, Push, Wipe, More Styles, Options, Apply Transition to All; ghi chú UI: "This object has a transition that can't be added by the web version of PowerPoint".
- Animations: Animation Preview, None, Appear, Fade, Fly In, Options, Move Earlier, Move Later, Animation Pane; ghi chú UI: "This object has an animation that can't be added by the PowerPoint".
- Slide Show: Play Slides from Beginning, Play Slides from Current Slide, Presenter View, Present in Teams, Custom Slideshow, Always Use Subtitles, Rehearse with Coach.
- Review: Review Presentation, Proofing, Check Accessibility, Mark All as Read, Show Changes, New Comment, Delete, Previous/Next, Show Comments.
- View: Notes, Ruler, Slide Sorter, Normal (Tri-pane) View, Immersive Reader, Zoom, Fit To Window.
- Draw: Select, Draw with Touch, Lasso Select, Eraser, Pen, Highlighter, Ruler.

### Hành vi đã thao tác

| Thao tác | Kết quả quan sát |
| :--- | :--- |
| Chọn placeholder title | Xuất hiện 8 handle `selectionHandle-2-0..7` (10×10) + tay nắm xoay; host `div.ShapeSelectionOverlay`, `div.ModernSelectionViewAnchor`, `svg.pointer-events-none` |
| Chọn thêm placeholder subtitle | Bộ handle thứ 2 `selectionHandle-3-0..7`; 2 SVG host kích thước 854×260 và 844×156 |
| View > Slide Sorter | Lưới thumbnail toàn khung 1496×747; ribbon View thu gọn thành toolbar; status `1%` |
| Slide Show > From Beginning | Cửa sổ trình chiếu mở riêng, môi trường nhúng không đưa lên foreground; Esc quay lại editor; không kết luận về fullscreen |
| File menu | New, Open, Share, Create a copy, Export, Print, Add to favorites, Rename, Move file, Version history, Info (không có Delete) |

## 4. Kết luận sử dụng cho Task

- Các nhãn trên là **danh sách chức năng tham chiếu**, không phải danh sách phải làm.
- Quyết định `IMPL/SIMPLE/ERP/OUT` và mã `W-*`/`X-*`/`P-*` nằm tại BENCH-S12-003.
- Hành vi nào ghi "không kết luận" thì không dùng làm acceptance test.
