# [TASK-445] Nâng cấp trường bảng lưới tính toán kiểu Excel (Excel-Style High-Density Grid với công thức & tổng kết hàng/cột)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-445 / TASK / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Done / 2.0 / 2026-11-10 — Hoàn tất nâng cấp toàn diện loại trường `GRID` thành bảng tính kiểu Excel mật độ cao: cấu hình kiểu trường riêng cho từng cột, cột `SELECT` hỗ trợ trọn vẹn 3 nguồn dữ liệu (`STATIC`, `CATALOG`, `EXTERNAL_API`) và quan hệ phân cấp cha-con nhiều tầng (`depends_on`, `parent_filter_key`) với cơ chế cô lập cấp dòng tuyệt đối (Row-level Isolation), thêm/xóa dòng động tại runtime điền form, an toàn 100% không dùng `eval()`, hỗ trợ công thức dòng số học và tổng kết cột (SUM, AVG, COUNT, MIN, MAX), lưu trữ cấu trúc JSON mảng dòng trong PostgreSQL thật |
| Owner | Developer Agent |
| Đầu vào | Yêu cầu trực tiếp của Chủ dự án: *"sửa loại field grid, để cấu hình kiểu field cho từng cột, người điền form tăng giảm được số dòng dữ liệu. Hãy là giống grid dạng excel, hỗ trợ cả các công thức cơ bản"* và *"thiếu rất nhiều label; loại field là select trong grid cũng cần hỗ trợ 3 loại dữ liệu và quan hệ cha con như ở form chứ"* |
| Phụ thuộc | [FEAT-39](FEAT-39_plugin_form_core.md) (Plugin Form core), `FormDocumentValidator`, `FormResponseService`, `@shared` design tokens |

---

## 1. Mục tiêu và phạm vi

Nâng cấp loại trường `GRID` (Bảng lưới) trong Form Builder từ dạng bảng nhập đơn giản thành **Bảng tính toán nghiệp vụ kiểu Excel mật độ cao (High-Density Excel-Style Grid)** phục vụ các bài toán thực tế như: bảng báo giá sản phẩm, bảng kê khai chi phí, danh sách vật tư/hàng hóa, yêu cầu thiết bị theo địa bàn hành chính:
1. **Cấu hình chi tiết từng cột trong Form Studio Inspector**:
   - Cho phép định nghĩa danh sách cột (`columns_def`): Mã cột (`key`), Nhãn hiển thị (`label`), Kiểu dữ liệu (`type`: `TEXT`, `NUMBER`, `DATE`, `SELECT`, `FORMULA`), Độ rộng (`width`), Placeholder, Bắt buộc (`required`).
   - **Đối với cột `SELECT` (Nâng cấp toàn diện hỗ trợ 3 nguồn dữ liệu & Phân cấp cha-con)**:
     - Hỗ trợ đầy đủ 3 nguồn dữ liệu (`option_source`):
       1. `STATIC`: Nhập danh sách tùy chọn tĩnh phân tách bằng dấu phẩy.
       2. `CATALOG`: Chọn loại danh mục dùng chung hệ thống (`catalog_type`), lấy qua Core Data Gateway gRPC `pageThrough`.
       3. `EXTERNAL_API`: Nạp tùy chọn từ endpoint REST API bên ngoài (`api_url`, `api_path`, `api_method`, `api_label_key`, `api_value_key`, `api_headers_json`).
     - **Quan hệ cha-con phân cấp nhiều tầng (`depends_on`, `parent_filter_key`)**:
       - Cấu hình cột cha phụ thuộc bên trong cùng bảng lưới Grid (ví dụ: Cột Huyện `district` phụ thuộc Cột Tỉnh `province`; Cột Xã `ward` phụ thuộc Cột Huyện `district`).
       - Nút **"Kiểm tra tải" (`Test Fetch`)** trực tiếp trong Inspector kèm thông báo trạng thái kết quả nạp tùy chọn.
   - Đối với cột `FORMULA`: Nhập biểu thức tính toán số học (ví dụ: `qty * price`), cung cấp các thẻ pill mã cột có thể nhấp để chèn nhanh.
   - Đối với từng cột số học/công thức: Cấu hình hàm tổng kết ở chân bảng (`summary`: `NONE`, `SUM`, `AVG`, `COUNT`, `MIN`, `MAX`).
   - Cấu hình số dòng mặc định (`default_rows`), số dòng tối thiểu (`min_rows`), quyền thêm dòng (`allow_add_row`), quyền xóa dòng (`allow_delete_row`).
2. **Trải nghiệm điền form công khai (Runtime Public Fill)**:
   - Giao diện Excel mật độ cao: Cột đánh số thứ tự dòng `# 1, 2, 3...`, huy hiệu công thức `fx`, viền sắc nét ERP (`border-neutral-300 dark:border-neutral-700`).
   - **Cơ chế Lọc Động Phân Cấp Cô Lập Cấp Dòng Tuyệt Đối (Strict Row-Level Isolation)**:
     - Dòng 1 chọn Tỉnh Hà Nội (`HN`): Chỉ ô Quận/Huyện của Dòng 1 được mở khóa (Ba Đình, Cầu Giấy...); ô Quận/Huyện của Dòng 2 vẫn giữ nguyên trạng thái khóa an toàn (`-- Please select parent field first --`).
     - Đổi Tỉnh ở Dòng 1 từ Hà Nội sang Đà Nẵng: Chỉ các ô Quận/Huyện và Phường/Xã của Dòng 1 bị xóa sạch (reset) và khóa lại; toàn bộ dữ liệu của Dòng 2 và các dòng khác hoàn toàn không bị ảnh hưởng chéo.
   - Thêm dòng mới (`+ Thêm dòng` / `+ Add Row`) và xóa dòng (`✕`), đảm bảo không thể xóa dưới mức `min_rows`.
   - Tính toán công thức dòng thời gian thực: Tự động cập nhật ngay khi người dùng gõ phím hoặc thay đổi giá trị trong các ô phụ thuộc.
   - Dòng tổng kết chân bảng (Footer Summary Row): Tự động tổng hợp dữ liệu toàn bộ các dòng theo thời gian thực (tổng số lượng `SUM: 6`, tổng thành tiền `SUM: 440,000,000`).
3. **Động cơ tính toán an toàn (Safe Formula Engine)**:
   - Thuật toán Dijkstra Shunting-Yard biến đổi biểu thức sang ký pháp nghịch đảo Ba Lan (RPN) và tính toán qua ngăn xếp (Stack-based evaluation).
   - **Tuyệt đối không dùng `eval()` hay `Function()`**, loại bỏ 100% rủi ro Script Injection / XSS.
4. **Tiêu chuẩn Accessibility & Tránh Thiếu Label (Accessibility & Label Completion)**:
   - Bổ sung 100% `[ariaLabel]`, `[attr.aria-label]`, placeholder chuẩn i18n cho toàn bộ các ô nhập, dropdown, filter và nút bấm.
   - Loại bỏ các subtitle/tooltip cam tĩnh thừa, thay bằng cơ chế disabled và placeholder trực quan theo chuẩn ERP.
5. **Xác thực Backend & Lưu trữ Database PostgreSQL thật**:
   - `FormDocumentValidator.java`: Kiểm tra `GRID` bắt buộc có `columns_def` hợp lệ; bổ sung unit test `acceptsExcelStyleGridWithColumnsDef` và `rejectsGridWithoutColumns` (12/12 test PASS).
   - `FormResponseService.java`: Bỏ qua kiểm tra câu hỏi bắt buộc đối với container types (`SECTION`, `PAGE`, `STEP`), xác thực mảng dòng không rỗng khi trường `GRID` là bắt buộc.
   - Lưu trữ dữ liệu dòng dạng mảng JSON `[ { "item_name": "...", "province": "HN", "district": "BA_DINH", "ward": "DOI_CAN", "qty": 2, "price": 150000000, "total": 300000000 }, ... ]` vào trường `answers` của bảng `tenant_<id8>_form.plg_form_responses`.

---

## 2. Checklist triển khai

- [x] **Backend Validation**:
  - `FormDocumentValidator.java`: Thêm `GRID` vào tập loại trường `ITEM_TYPES`, kiểm tra cấu hình cột hợp lệ.
  - `FormDocumentValidatorTest.java`: Thêm 2 unit test kiểm tra validator với `GRID` (PASS).
  - `FormResponseService.java`: Cập nhật `requireAnswers` hỗ trợ mảng dữ liệu dòng của `GRID`.
- [x] **Frontend Data Model**:
  - `form.model.ts`: Khai báo `GridColumnType`, `GridSummaryType`, `GridColumnDef` (mở rộng với `option_source`, `catalog_type`, `depends_on`, `parent_filter_key`, `api_url`, `api_path`, `api_method`, `api_label_key`, `api_value_key`, `api_headers_json`, `summary`, `required`, `placeholder`, `width`), bổ sung thuộc tính `columns_def`, `default_rows`, `min_rows`, `allow_add_row`, `allow_delete_row` vào `FormItem`.
- [x] **Safe Formula Engine**:
  - `grid-formula.util.ts`: Cài đặt Dijkstra Shunting-Yard RPN evaluator, `evaluateRowFormula`, `evaluateColumnSummary`, `formatGridNumber`.
- [x] **Form Studio Designer & Inspector**:
  - `form-screen.component.ts` & `form-screen.component.html`: Trình biên tập danh sách cột trong Inspector panel: cấu hình nguồn tùy chọn (`STATIC`, `CATALOG`, `EXTERNAL_API`), chọn loại danh mục, chọn cột cha phụ thuộc (`depends_on`), cấu hình API, nút "Kiểm tra tải" với thông báo trực tiếp, hiển thị bảng lưới Excel trực quan trên Canvas và Preview tab.
- [x] **Form Fill Runtime (Public Fill & Internal Fill)**:
  - `form-fill.component.ts` & `form-fill.component.html`: Quản lý state `gridRows`, `gridDynamicOptions`, tính toán công thức dòng và tổng kết cột trên sự kiện `onGridCellChange`, cơ chế `onGridSelectChange` xóa sạch các cấp con khi cha đổi, kiểm tra trạng thái khóa an toàn và nạp danh sách tùy chọn lọc theo dòng, nút thêm/xóa dòng, đóng gói mảng đối tượng dòng vào payload gửi đi.
- [x] **Đa ngôn ngữ i18n & Accessibility Labels**:
  - Bổ sung toàn bộ nhãn, aria-label, gợi ý liên quan đến Grid và Select Columns vào 13 ngôn ngữ (`npm run i18n:check:strict` 100.0% PASS).
- [x] **Build & Kiểm thử thực nghiệm (Dual-Mode Browser Testing)**:
  - Build Angular Web Component bundle (`npm run form:ui:build`) PASS.
  - Build Uber-Jar backend (`mvn package`) PASS.
  - Triển khai vào Docker container `openerp-plugin-form-1-0-8` và khởi động lại.
  - Tạo form kiểm thử phân cấp `grid-cascading-equipment-request-v1` và `quotation-excel-grid-v1`.
  - Kiểm thử cô lập cấp dòng: Dòng 1 chọn Hà Nội mở khóa Ba Đình, Cầu Giấy; Dòng 2 Quận/Huyện vẫn khóa an toàn. Đổi Dòng 1 sang Đà Nẵng lập tức reset Quận/Huyện và Phường/Xã của Dòng 1, Dòng 2 giữ nguyên.
  - Xác nhận tính toán công thức dòng (`total = qty * price`) và tổng kết cột (`SUM = 440,000,000 VNĐ`).
  - Nộp biểu mẫu thành công và kiểm tra dữ liệu JSON lưu trong PostgreSQL thật `tenant_d0bbcb6d_form.plg_form_responses`.
  - Chụp ảnh 10 màn hình thực tế minh chứng (G1 - G10).

---

## 3. Minh chứng kiểm thử thực tế

### A. Cấu hình Bảng Grid & Cột Dropdown Phân Cấp trong Form Studio Inspector
1. `grid_studio_inspector_cascading_select.png`: Bố cục 3 phân vùng Form Studio với trường Grid được chọn trong Inspector.
2. `grid_studio_inspector_col1_province.png`: Cấu hình Cột 1 Tỉnh / Thành phố (`province`: kiểu `SELECT`, nguồn `CATALOG`, loại danh mục `PROVINCE`).
3. `grid_studio_inspector_col2_district_cascading.png`: Cấu hình Cột 2 Quận / Huyện (`district`: kiểu `SELECT`, nguồn `CATALOG`, loại `DISTRICT`, phụ thuộc `province`, nút "Kiểm tra tải" đã nạp 30 tùy chọn).
4. `grid_studio_inspector_col7_formula_summary.png`: Cấu hình Cột 7 Thành tiền (`total`: kiểu `FORMULA`, công thức `qty * price`, hàm tổng kết `SUM`).

### B. Trải nghiệm Điền Form Công Khai & Lọc Động Phân Cấp Cấp Dòng
5. `grid_cascading_01_initial_locked.png`: Màn hình khởi tạo: Cột Tỉnh hiển thị tùy chọn, Cột Quận/Huyện và Phường/Xã bị khóa disabled kèm placeholder `-- Vui lòng chọn trường cha trước --`.
6. `grid_cascading_02_row1_unlocked.png`: Dòng 1 chọn Tỉnh Hà Nội (`HN`): Cột Quận/Huyện của Dòng 1 lập tức mở khóa (Ba Đình, Cầu Giấy...); Dòng 2 Cột Quận/Huyện vẫn tiếp tục bị khóa an toàn (Cô lập cấp dòng 100%).
7. `grid_cascading_03_both_rows_populated.png`: Người dùng điền hoàn tất cả 2 dòng với đầy đủ 3 cấp địa chỉ, số lượng, đơn giá; tự động tính thành tiền dòng và tổng kết chân bảng (Tổng SL: 6, Tổng tiền: 440,000,000 VNĐ).
8. `grid_cascading_04_reset_verification.png`: Kiểm tra đổi Tỉnh ở Dòng 1 sang Đà Nẵng (`DN`): Cột Quận/Huyện và Phường/Xã của Dòng 1 lập tức bị xóa sạch và khóa lại; Dòng 2 hoàn toàn không bị ảnh hưởng!
9. `grid_cascading_05_reselected_and_ready.png`: Dòng 1 chọn lại Quận Hải Châu, Phường Thạch Thang; bảng tính toán cập nhật sẵn sàng nộp bài.
10. `grid_cascading_06_submitted_success.png`: Nộp biểu mẫu thành công, cấp mã biên nhận duy nhất và lưu trọn vẹn dữ liệu JSON vào PostgreSQL thật.

