# TASK-475: Bảng tính Excel `<canvas>` Ảo hóa + Web Worker Formula Engine & Xuất `.xlsx`/`.csv`/Print-PDF

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-475` |
| **Thuộc Feature** | [FEAT-50](./FEAT-50_word_excel_powerpoint_editors.md) |
| **Loại** | Frontend Domain Editor (Excel `.xlsx`/`.xls`/`.csv`) |
| **Ưu tiên** | Critical |
| **Trạng thái** | `Open` |
| **Phụ thuộc** | [TASK-472](./TASK-472_pure_ts_zero_third_party_binary_core.md), [TASK-473](./TASK-473_office_shell_ribbon_file_menu_storage_bridge.md) |
| **Owner** | Developer Agent |
| **Tài liệu nguồn** | [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md), [ADR-S12-002](../05_solutions/03_ADR-S12-002_m365_hybrid_canvas_dom_rendering.md), [DES-ARCH-S12-001](../06_designs/arch/01_DES-ARCH-S12-001_components_and_flows.md), [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md) |

---

## 1. Phạm vi Công việc

1. Xây dựng `spreadsheetml` codec trên `OoxmlZipContainer` + `XmlModelBridge`:
   - Đọc/ghi `xl/workbook.xml`, `xl/sharedStrings.xml`, `xl/styles.xml`, `xl/worksheets/sheet*.xml` (hỗ trợ đa sheet, ngày tháng serial date, kiểu số, chuỗi chia sẻ, công thức `<f>` và giá trị cache `<v>`, merge cells, độ rộng cột, freeze panes).
   - Hỗ trợ nạp `.csv` trực tiếp qua `CsvCodec` và đọc `.xls` cơ bản qua `LegacyOle2Reader`.
2. Xây dựng bộ kết xuất lưới `<canvas>` ảo hóa theo vùng nhìn (Tiled Virtual Grid, DPR-aware HiDPI) kết hợp `<input>` / inline cell editor phủ đúng tọa độ ô đang nhập và Formula Bar (`Name Box` + `fx` input).
3. Xây dựng `excel-calc.worker.ts` (`Web Worker`) với parser biểu thức Recursive Descent & đồ thị phụ thuộc ô (DAG + chống circular reference) hỗ trợ 30–50 hàm Excel cốt lõi (`SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, `COUNTA`, `COUNTIF`, `SUMIF`, `IF`, `IFS`, `AND`, `OR`, `NOT`, `VLOOKUP`, `XLOOKUP`, `INDEX`, `MATCH`, `ROUND`, `ABS`, `CONCAT`, `LEFT`, `RIGHT`, `LEN`, `TRIM`, `UPPER`, `LOWER`, `TODAY`, `NOW`, `DATE`, v.v.).
4. Hỗ trợ định dạng ô (font, màu nền, viền, căn lề, định dạng số/tiền tệ), merge/unmerge, sắp xếp A-Z/Z-A, bộ lọc nhanh, cố định dòng/cột (Freeze Panes) và thanh chuyển Sheet cuối trang.
5. Xuất ngược `.xlsx`, `.csv` (UTF-8 BOM) và in/xuất PDF qua `@media print`.

---

## 2. Tiêu chí Nghiệm thu & Kiểm chứng

- Mở `.xlsx` / `.csv` >= 5.000 dòng, cuộn mượt mà, công thức `=SUM(...)`, `=IF(...)`, `=VLOOKUP(...)` tự động cập nhật lại trên `Web Worker`.
- Xuất lại `.xlsx` giữ công thức và mở được bằng Microsoft Excel / LibreOffice.
