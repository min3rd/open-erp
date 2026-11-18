# TASK-521: Gộp ô và tách ô Word như Office 365 — đọc/ghi `w:gridSpan` + `w:vMerge`, chọn vùng ô bằng chuột

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-521` |
| **Sprint** | Sprint 12 — `office-webapp` Plugin |
| **Loại** | Task (Word editor) |
| **Ưu tiên** | High |
| **Trạng thái** | `Done` (chờ QA xác nhận) |
| **Phụ thuộc** | [TASK-520](./TASK-520_word_table_editing_commands.md) |
| **Owner** | Developer Agent |
| **Bằng chứng** | [task-521-word-merged-cells.json](../08_testing/evidence/task-521-word-merged-cells.json), [word-merged-cells.png](../08_testing/evidence/word-merged-cells.png) |

## 1. Vấn đề

Bản web trước task này đọc mỗi `w:tc` như một ô riêng:

1. **Ô gộp ngang** (`w:tcPr/w:gridSpan`) bị vẽ thành nhiều ô rời, nên bảng có ô gộp của Word hiện sai số cột.
2. **Ô gộp dọc** (`w:vMerge w:val="restart"` + các ô `w:vMerge` tiếp theo) bị vẽ thành hai ô chồng, chữ nằm ở ô đầu và ô dưới trống.
3. Không có lệnh **Merge Cells / Split Cells** trong tab **Bảng** theo ngữ cảnh, trong khi Office 365 đặt hai lệnh này ở nhóm Merge.

Tài liệu thầu thực dùng 1 ô gộp ngang và 2 cặp gộp dọc, nên lỗi hiện ra ngay trên trang bảng.

## 2. Phạm vi đã làm

| Nhóm | Nội dung | Hành vi |
| :--- | :--- | :--- |
| Đọc file | `readTableSpans` | Mỗi `w:tc` đọc `w:gridSpan` (colSpan) và `w:vMerge` (restart/continue) vào `WordBlock.cellSpans`, giữ 1:1 với `rows`; bảng lồng cũng có `cellSpans` |
| Vẽ | `tableCellLayout` | Gộp ngang → `<td colspan>`; ô restart gộp dọc → `<td rowspan>` theo số ô continue; ô continue bị ẩn. Nếu trang bắt đầu giữa vùng gộp (không có restart trong mảnh), ô continue vẽ như ô thường để không mất nội dung |
| Chọn ô | Chuột + Shift | Kéo qua các ô hoặc click ô đầu rồi Shift+click ô cuối; ô trong vùng chọn có nền xanh nhạt (box-shadow nên vẫn thấy trên ô có nền riêng) |
| Tab Bảng | Nhóm **Merge** | `tableMergeCells` (Gộp ô) và `tableSplitCells` (Tách ô), icon Fluent riêng; nhóm nằm sau Hàng & Cột, đúng thứ tự tab Layout của Word |
| Gộp ô | `mergeTableCells` | Gộp vùng chữ nhật thành 1 ô: ghi `w:gridSpan`, gộp nhiều hàng thì ghi `w:vMerge val="restart"` + các ô `w:vMerge` trống; chữ của mọi ô dồn vào ô đầu (giống Word); cập nhật `rows`, `cellStyles`, `cellSpans` |
| Tách ô | `splitTableCells` | Panel nhập số hàng × số cột (mặc định 1×1 = bỏ gộp); chữ giữ ở ô đầu, ô mới rỗng; xoá `w:gridSpan`/`w:vMerge`; tách nhiều hàng hơn vùng gộp thì thêm hàng trống bên dưới |
| Lệnh cột | `insertTableColumn`/`deleteTableColumn` | Chèn/xoá theo **cột lưới**: ô gộp là một ranh giới cột, `w:tcW` chia theo `gridSpan`; `block.grid` tính theo tổng `gridSpan` chứ không theo số `w:tc` |
| Đo trang | Đo theo `data-cell` | Ô continue bị ẩn làm lệch thứ tự ô trong DOM, nên đo dòng phải theo chỉ số ô của model; trước khi sửa, hàng ngay sau ô gộp dọc bị cắt chữ lệch một ô ("Three" thành "Thre") |

## 3. Tiêu chí nghiệm thu

- **AC-1**: Mở file có `w:gridSpan`/`w:vMerge` thấy đúng số ô: ô gộp ngang 1 ô với `colspan`, ô gộp dọc 1 ô với `rowspan`, ô continue không vẽ.
- **AC-2**: Kéo chọn 2 ô rồi bấm **Gộp ô** → 1 ô `colspan=2`, chữ hai ô nối trong ô gộp; file lưu ra có `w:gridSpan w:val="2"`.
- **AC-3**: Bấm **Tách ô** → panel mở, mặc định 1×1, áp dụng thì ô trở lại nhiều ô và mất `w:gridSpan`/`w:vMerge`.
- **AC-4**: Tài liệu thầu thực vẫn **546 trang**, ô gộp dọc vẽ `rowspan="2"`, 0 lỗi console.
- **AC-5**: Smoke 394/394, i18n 13 locale 100%, build UI thành công.

## 4. Kiểm chứng

| Hạng mục | Kết quả |
| :--- | :--- |
| Smoke | 394 passed, 0 failed (`npm run office:test`) — thêm 9 ca: parse gộp ô, gộp ghi `w:gridSpan`, gộp dồn chữ, tách ô, chèn cột trên bảng có ô gộp, lưu/mở lại vẫn gộp, hàng/cột mới có `w:p` để lưu chữ |
| UI build | `main.js` 994.88 kB, `styles.css` 146.45 kB |
| UI probe (Edge headless) | Mẫu `sample-merged-cells.docx`: trước khi gộp `Tall` có `rowspan=2`, hàng dưới còn 2 ô; kéo chọn 2 ô → 2 ô được tô; bấm **Gộp ô** → ô `Alpha Beta` `colspan=2`; **Tách ô** → mở panel, áp dụng trả lại ô thường; tài liệu thầu: 546 trang, 4 ô `rowspan=2`, 2 ô `colspan=6`, 0 lỗi console |
| Ảnh | `word-merged-cells.png` |

## 5. Còn lại (không chặn task)

- Ô của hàng bị cắt qua trang vẫn **read-only** (task-520, chờ ánh xạ lát cắt về khoảng ký tự).
- Gộp ô chứa **bảng lồng** bị từ chối (model chưa chuyển bảng lồng khi gộp); Word vẫn cho gộp.
- Bố cục từng trang vẫn là W-A21 (task-514): tổng 546 trang khớp Word, vị trí từng hàng còn lệch.
- Chưa có **Table Properties** đầy đủ (margin ô, chiều rộng tự nhập, viền bảng) và **Split Table**.
