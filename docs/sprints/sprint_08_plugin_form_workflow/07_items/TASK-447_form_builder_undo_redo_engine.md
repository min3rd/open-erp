# [TASK-447] Tính năng Hoàn tác / Làm lại (Undo / Redo Engine) & Thanh Section 1 Dòng

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-447 / TASK / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Done / 1.0 / 2026-11-11 |
| Owner | Developer Agent / QA Agent |
| Cha | [FEAT-39](FEAT-39_plugin_form_core.md) |
| Đầu vào | Yêu cầu trực tiếp của chủ dự án (2026-11-11): "cần thêm tính năng undo/redo để tăng trải nghiệm người dùng" & tối ưu thanh chuyển section 1 dòng cuộn ngang |

---

## 1. Mục tiêu & Yêu cầu kỹ thuật

1. **Bộ máy Undo / Redo Engine toàn diện cho Form Builder Studio**:
   - Lưu trữ snapshot lịch sử mọi đột biến dữ liệu biểu mẫu:
     - Thêm, xóa, nhân bản trường (`addQuestion`, `deleteItem`, `duplicateItem`).
     - Di chuyển thứ tự và kéo thả (`moveItem`, `onDrop`, `onDropIntoContainer`).
     - Cập nhật thuộc tính thanh tra Inspector (nhãn, placeholder, bắt buộc, kiểu dữ liệu, các tùy chọn `options`, cấu hình bảng tính Excel `columns_def`, phân cấp `depends_on`, tiêu đề section...).
     - Thay đổi cấu trúc bố cục (chế độ Section / Page / Step, số cột Desktop / Mobile).
   - Cơ chế Coalescing (gom cụm gõ phím 700ms) cho các ô nhập liệu dạng văn bản để tránh tình trạng hoàn tác từng ký tự riêng lẻ.
   - Giới hạn tối đa 50 bản ghi lịch sử (`MAX_HISTORY = 50`), tự động dọn dẹp redo stack khi có thao tác mới.
   - Tự động xóa lịch sử khi chuyển đổi hoặc mở biểu mẫu khác (`clearHistory`).

2. **Nút bấm thanh công cụ & Phím tắt tiêu chuẩn**:
   - Cặp nút bấm trên thanh công cụ với biểu tượng feather-icons:
     - Hoàn tác (`corner-up-left`): Vô hiệu hóa (`disabled`) khi không còn bước hoàn tác; Tooltip: `PLUGIN_FORM_UNDO (Ctrl+Z)`.
     - Làm lại (`corner-up-right`): Vô hiệu hóa khi không có bước làm lại; Tooltip: `PLUGIN_FORM_REDO (Ctrl+Y)`.
   - Phím tắt toàn cục `@HostListener('window:keydown')`:
     - `Ctrl+Z` / `Cmd+Z`: Hoàn tác thao tác gần nhất.
     - `Ctrl+Y` / `Cmd+Y` hoặc `Ctrl+Shift+Z` / `Cmd+Shift+Z`: Làm lại thao tác vừa hoàn tác.
     - Tự động `blur` các ô input đang focus để đồng bộ giá trị trước khi áp dụng hoàn tác/làm lại.

3. **Tối ưu thanh chuyển Section thành 1 dòng cuộn ngang (`overflow-x-auto`)**:
   - Chuẩn hóa layout: `flex flex-nowrap items-center gap-1.5 overflow-x-auto whitespace-nowrap select-none scrollbar-thin`.
   - Tránh vỡ/ngắt dòng thành 4–6 hàng khi tiêu đề dài (`max-w-[220px] truncate`), hiển thị tooltip đầy đủ khi hover (`[title]`).
   - Chiều cao cố định $\le 48\text{px}$, cuộn ngang trực tiếp bằng con lăn chuột (`wheel` event).

4. **Đa ngôn ngữ i18n & Kiểm thử**:
   - Bổ sung 2 khóa dịch `PLUGIN_FORM_UNDO` và `PLUGIN_FORM_REDO` đồng bộ 100% trên 13 ngôn ngữ.
   - Kiểm thử thực tế trên Chrome CDP: 100% PASS, 0 console error.

---

## 2. Kết quả kiểm thử thực nghiệm

| Kịch bản | Mong đợi | Thực tế | Trạng thái |
| :--- | :--- | :--- | :---: |
| Trạng thái ban đầu | Undo = disabled, Redo = disabled | `undoDisabled: true, redoDisabled: true` | ✅ PASS |
| Thêm trường từ Palette | Undo = enabled, Redo = disabled | `undoDisabled: false, redoDisabled: true` | ✅ PASS |
| Nhấn nút Undo | Trường bị xóa, Redo = enabled | `itemCount: 39 -> 38, redoDisabled: false` | ✅ PASS |
| Nhấn nút Redo | Trường được phục hồi, Redo = disabled | `itemCount: 38 -> 39, undoDisabled: false` | ✅ PASS |
| Phím tắt `Ctrl+Z` | Hoàn tác thành công | `itemCount: 39 -> 38, redoDisabled: false` | ✅ PASS |
| Phím tắt `Ctrl+Y` | Làm lại thành công | `itemCount: 38 -> 39, undoDisabled: false` | ✅ PASS |
| Thanh Section 1 dòng | Chiều cao $\le 50\text{px}$, cuộn ngang | `height: 47.65px, scrollWidth: 1759px, isSingleRow: true` | ✅ PASS |
| Console errors | 0 lỗi console | `console.error = 0` | ✅ PASS |
