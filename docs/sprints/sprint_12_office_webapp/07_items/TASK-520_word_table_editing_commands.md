# TASK-520: Sửa bảng Word như Office 365 — Tab Bảng theo ngữ cảnh, chèn/xóa hàng cột, chỉnh hàng tiêu đề và sửa chữ trong ô

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-520` |
| **Sprint** | Sprint 12 — `office-webapp` Plugin |
| **Loại** | Task (Word editor) |
| **Ưu tiên** | High |
| **Trạng thái** | `Done` (chờ QA xác nhận) |
| **Phụ thuộc** | [TASK-474](./TASK-474_word_fixed_page_ooxml_editor.md) |
| **Owner** | Developer Agent |
| **Bằng chứng** | [task-520-word-table-editing.json](../08_testing/evidence/task-520-word-table-editing.json), [word-table-tab.png](../08_testing/evidence/word-table-tab.png) |

## 1. Vấn đề

Bản Word trên web đã vẽ bảng và sửa được chữ nhưng thiếu hai phần so với Office 365:

1. **Chữ trong ô không vào model**: trang soạn thảo chỉ đồng bộ `.op-word-p[data-paragraph]` (đoạn thân văn), nên gõ trong ô bảng bị mất khi rời trang hoặc khi lưu.
2. **Không có lệnh cấu trúc bảng**: Word 365 có tab **Table** theo ngữ cảnh với chèn/xóa hàng cột, hàng tiêu đề lặp, chia đều cột, căn ô và căn bảng. Bản web chưa có.

Thêm vào đó, khi bảng bị chia trang, mỗi mảnh đánh số hàng lại từ 0, nên lệnh bảng trên trang tiếp theo sẽ sửa nhầm hàng.

## 2. Phạm vi đã làm

| Nhóm | Lệnh | Hành vi |
| :--- | :--- | :--- |
| Hàng & Cột | `tableInsertRowAbove`, `tableInsertRowBelow`, `tableInsertColumnLeft`, `tableInsertColumnRight` | Chèn hàng/cột mới giữ `w:tcPr`/`w:trPr`, ô rỗng; cập nhật `w:tblGrid` và `w:tcW` đều nhau |
| Hàng & Cột | `tableDeleteRow`, `tableDeleteColumn`, `tableDelete` | Xóa hàng/cột/bảng khỏi model + `w:tbl`; hàng cuối cùng xóa cả bảng |
| Bố cục | `tableHeaderRow` | Bật/tắt `w:tblHeader` cho hàng đầu, cập nhật `headerRows` để lặp đầu trang |
| Bố cục | `tableDistributeColumns` | Chia đều `w:gridCol` + `w:tcW` theo % |
| Căn chỉnh | `tableCellTop`, `tableCellCenter`, `tableCellBottom` | Ghi `w:vAlign` và cập nhật `cellStyles[row][cell].valign` |
| Căn chỉnh | `tableAlignLeft`, `tableAlignCenter`, `tableAlignRight` | Ghi `w:jc` trong `w:tblPr`, render `margin auto` |
| Sửa chữ | Ô bảng | Mỗi đoạn trong ô có `data-cell-block/row/col/p`, đồng bộ khi rời trang; `Enter` tách đoạn trong ô |
| Chia trang | `rowMap` | Mỗi mảnh bảng mang chỉ số hàng gốc, nên lệnh và sửa chữ luôn trỏ đúng hàng của model |

## 3. Tiêu chí nghiệm thu

- **AC-1**: Tab **Bảng** xuất hiện khi con trỏ ở trong bảng và biến mất khi rời bảng; tab có 3 nhóm, 15 lệnh, icon Fluent.
- **AC-2**: Chèn hàng dưới làm tổng số hàng của bảng thầu tăng 839 → 840, không đổi số trang ngoài phần nội dung tăng.
- **AC-3**: Xóa hàng trên trang bảng thứ 150+ xóa đúng hàng của model (không xóa hàng đầu bảng).
- **AC-4**: Gõ chữ trong ô rồi rời trang vẫn giữ chữ sau khi render lại; lưu file ghi đúng `w:t` trong `w:tc`.
- **AC-5**: Tài liệu thầu thực vẫn **546 trang**, 839 hàng bảng, 0 lỗi console.
- **AC-6**: Smoke 385/385, i18n 100% cho 13 locale, build UI thành công.

## 4. Kiểm chứng

| Hạng mục | Kết quả |
| :--- | :--- |
| Smoke | 385 passed, 0 failed (`npm run office:test`) |
| UI build | `main.js` 978.98 kB, `styles.css` 146.25 kB |
| UI probe (Edge headless) | 546 trang; 839 hàng; tab Bảng 3 nhóm/15 lệnh; sửa ô “Số CTKT” → “KIEM TRA BANG” giữ sau render; chèn hàng dưới → 840 hàng; xóa hàng ở trang 150+ → 839 hàng; 0 lỗi console |
| Ảnh | `word-table-tab.png` |

## 5. Còn lại (không chặn task)

- Ô của hàng đang bị cắt qua trang là **read-only** vì phần nhìn thấy chỉ là một lát của đoạn; muốn sửa cần ánh xạ lát cắt về khoảng ký tự gốc.
- Chưa có hộp thoại **Table Properties** đầy đủ (margin ô, chiều rộng bảng tự nhập, merge/split cells).
- Bố cục từng trang vẫn là W-A21 (task-514): tổng 546 trang khớp Word, vị trí từng hàng còn lệch.
