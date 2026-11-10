# [TASK-446] Tích hợp đầy đủ 32 loại trường nhập liệu Form Builder qua 6 nhóm nghiệp vụ chuẩn ERP

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-446 / TASK / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Done / 1.0 / 2026-11-10 — Hoàn tất tích hợp đầy đủ 32 loại trường nhập liệu trải dài trên 6 nhóm nghiệp vụ chuẩn ERP (Nhập liệu cơ bản, Lựa chọn, Chuyên biệt, Đa phương tiện, Nâng cao & Khảo sát, Cấu trúc & Bố cục), phân nhóm bảng điều khiển kéo thả (Palette) kèm huy hiệu số lượng, thanh thuộc tính (Right Inspector) tùy biến sâu, runtime điền form công khai (Public Fill) tương tác thực tế với chữ ký Canvas, bảng tính Excel, địa chỉ phân cấp 3 cấp, thẻ tags Multi-Select, mảng lặp Repeater, và xác thực lưu trữ PostgreSQL thật |
| Owner | Developer Agent |
| Đầu vào | Yêu cầu trực tiếp của Chủ dự án: *"1. Nhóm nhập liệu cơ bản (Basic Inputs) ... 2. Nhóm lựa chọn (Choice & Selection) ... 3. Nhóm dữ liệu định dạng chuyên biệt (Specialized Inputs) ... 4. Nhóm tệp & Đa phương tiện (Media & Upload) ... 5. Nhóm nâng cao & Khảo sát (Advanced & Interactive) ... 6. Nhóm cấu trúc & Bố cục (Layout & Structural Components) ... Bổ sung các loại field theo danh sách này để đảm bảo form builder đầy đủ theo nghiệp vụ"* |
| Phụ thuộc | [FEAT-39](FEAT-39_plugin_form_core.md) (Plugin Form core), [TASK-445](TASK-445_form_excel_style_grid_field.md) (Excel-style Grid), `FormDocumentValidator`, `FormResponseService`, `@shared/enums/icon.enum.ts` |

---

## 1. Danh mục 32 loại trường theo 6 nhóm nghiệp vụ

Hệ thống Form Builder của Open-ERP được trang bị bộ công cụ thiết kế biểu mẫu toàn diện theo chuẩn ERP mật độ cao (High-Density & Sharp Aesthetic), bao gồm 32 loại trường phân chia rõ ràng thành 6 nhóm danh mục:

| Nhóm | Tên nhóm | Số loại | Danh sách loại trường (`type`) | Mô tả nghiệp vụ |
| :---: | :--- | :---: | :--- | :--- |
| **1** | **Nhóm nhập liệu cơ bản (Basic Inputs)** | 5 | `SHORT_TEXT`<br>`LONG_TEXT`<br>`NUMBER`<br>`PASSWORD`<br>`HIDDEN` | • `SHORT_TEXT`: Văn bản ngắn (họ tên, tiêu đề).<br>• `LONG_TEXT`: Văn bản nhiều dòng (ghi chú, mô tả).<br>• `NUMBER`: Số nguyên/thập phân (min, max, step).<br>• `PASSWORD`: Mật khẩu kèm nút mắt ẩn/hiện ký tự.<br>• `HIDDEN`: Lưu giá trị ngầm (metadata, token, tham chiếu). |
| **2** | **Nhóm lựa chọn (Choice & Selection)** | 6 | `CHECKBOX`<br>`MULTI_CHOICE`<br>`SINGLE_CHOICE`<br>`DROPDOWN`<br>`MULTI_SELECT`<br>`SWITCH` | • `CHECKBOX`: Xác nhận điều khoản / cam kết đơn lẻ.<br>• `MULTI_CHOICE`: Nhóm hộp kiểm chọn nhiều giá trị.<br>• `SINGLE_CHOICE`: Nhóm nút tròn (Radio) chọn 1 giá trị duy nhất.<br>• `DROPDOWN`: Danh sách thả xuống chọn 1 giá trị.<br>• `MULTI_SELECT`: Thả xuống chọn nhiều mục với thẻ tags và tìm kiếm.<br>• `SWITCH`: Nút gạt bật/tắt trạng thái hiện đại. |
| **3** | **Nhóm dữ liệu chuyên biệt (Specialized Inputs)** | 8 | `EMAIL`<br>`PHONE`<br>`URL`<br>`CURRENCY`<br>`DATE`<br>`TIME`<br>`DATE_RANGE`<br>`COLOR` | • `EMAIL`: Kiểm tra định dạng hòm thư điện tử.<br>• `PHONE`: Số điện thoại di động kèm tiền tố quốc gia.<br>• `URL`: Liên kết trang web (kiểm tra http/https).<br>• `CURRENCY`: Số tiền tệ có tiền tố/hậu tố đơn vị (VND, USD) và định dạng phân tách.<br>• `DATE`: Chọn ngày theo lịch chuẩn DD/MM/YYYY.<br>• `TIME`: Chọn giờ, phút làm việc (12h/24h).<br>• `DATE_RANGE`: Chọn khoảng thời gian (Từ ngày - Đến ngày).<br>• `COLOR`: Hộp chọn mã màu trực quan HEX/RGBA. |
| **4** | **Nhóm tệp & Đa phương tiện (Media & Upload)** | 3 | `FILE_UPLOAD`<br>`IMAGE_UPLOAD`<br>`SIGNATURE` | • `FILE_UPLOAD`: Đính kèm tệp hồ sơ (PDF, DOCX) kèm giới hạn dung lượng/số lượng.<br>• `IMAGE_UPLOAD`: Tải ảnh chân dung với khung xem trước (Live Preview) và xóa nhanh.<br>• `SIGNATURE`: Bảng vẽ chữ ký số cảm ứng (HTML5 Canvas Signature Pad) hỗ trợ chuột và ngón tay cảm ứng, xuất chuỗi dữ liệu ảnh Base64 PNG. |
| **5** | **Nhóm nâng cao & Khảo sát (Advanced & Interactive)** | 5 | `RICH_TEXT`<br>`SLIDER`<br>`RATING`<br>`MATRIX`<br>`ADDRESS` | • `RICH_TEXT`: Soạn thảo định dạng văn bản (In đậm B, nghiêng I, gạch chân U, danh sách).<br>• `SLIDER`: Thanh trượt chọn thang điểm/tỷ lệ % kèm nhãn hiển thị trực tiếp.<br>• `RATING`: Đánh giá xếp hạng sao (1 - 5 sao tương tác).<br>• `MATRIX`: Bảng ma trận khảo sát Likert Scale hàng/cột đánh giá năng lực.<br>• `ADDRESS`: Chọn địa chỉ phân cấp 3 cấp hành chính Việt Nam (Tỉnh/Thành -> Quận/Huyện -> Phường/Xã) kèm ô nhập số nhà/đường phố cụ thể. |
| **6** | **Nhóm cấu trúc & Bố cục (Layout & Structural)** | 5 | `STATIC_TEXT`<br>`DIVIDER`<br>`SECTION`<br>`GRID`<br>`REPEATER`<br>*(kèm `PAGE`, `STEP`)* | • `STATIC_TEXT`: Khối văn bản tĩnh (Tiêu đề H1/H2/H3, Đoạn văn, Cảnh báo Alert thông tin/cảnh báo/thành công).<br>• `DIVIDER`: Đường kẻ phân cách (Nét liền, nét đứt, khoảng trống căn lề Spacer).<br>• `SECTION`: Khối nhóm trường có thể đóng/mở (Collapsible).<br>• `GRID`: Bảng tính toán nghiệp vụ kiểu Excel mật độ cao có công thức tự động.<br>• `REPEATER`: Mảng lặp dữ liệu động (+ Thêm dòng) cho danh sách lịch sử công tác/người phụ thuộc.<br>• `PAGE` / `STEP`: Phân trang biểu mẫu và Wizard từng bước. |

---

## 2. Checklist triển khai kỹ thuật

- [x] **Backend Validation & Engine (`plugins/form`)**:
  - `FormDocumentValidator.java`: Cập nhật tập hợp 32 loại trường vào `ITEM_TYPES`. Khai báo tập các trường cấu trúc phi giá trị `NON_VALUE_TYPES = Set.of("SECTION", "PAGE", "STEP", "STATIC_TEXT", "DIVIDER")`.
  - `FormResponseService.java`: Bỏ qua các trường thuộc `NON_VALUE_TYPES` khi xác thực danh sách câu hỏi bắt buộc (`missing.filter(...)`).
  - `FormDocumentValidatorTest.java`: Bổ sung và cập nhật bộ kiểm thử tự động cho toàn bộ 32 loại trường qua 6 nhóm nghiệp vụ; 13/13 unit test PASS.
- [x] **Shared Design Tokens & Vendored Icons (`src/frontend/shared`)**:
  - `icon.enum.ts`: Bổ sung định danh 8 icon mới: `shield`, `toggle-left`, `globe`, `dollar-sign`, `image`, `sliders`, `map-pin`, `minus`.
  - `scripts/generate-feather-icons.mjs` (`npm run icons:gen`): Tự động sinh mã SVG tối ưu cho 53 biểu tượng trong `icon-data.generated.ts`.
- [x] **Frontend Data Model (`plugins/form/web/src/app/form.model.ts`)**:
  - Mở rộng union type `FormItemType` bao gồm đầy đủ 32 loại trường.
  - Định nghĩa interface `RepeaterFieldDef` với các thuộc tính `key`, `label`, `type`, `required`.
  - Bổ sung các thuộc tính mở rộng cho `FormItem`: `min_value`, `max_value`, `step_value`, `currency_code`, `currency_symbol`, `static_text_type`, `divider_style`, `repeater_fields`, `default_value`.
- [x] **Đa ngôn ngữ nghiêm ngặt (Strict i18n 100% trên cả 13 ngôn ngữ)**:
  - Bổ sung 53 khóa bản dịch cho 6 nhóm trường và 32 loại input vào từ điển i18n tại:
    - `src/frontend/web/public/i18n/{locale}.json`
    - `src/frontend/mobile/public/i18n/{locale}.json`
    - `plugins/form/web/src/i18n/{locale}.json`
    - `plugins/form/src/main/resources/META-INF/resources/i18n/{locale}.json`
  - Thực thi kiểm tra nghiêm ngặt `npm run i18n:check:strict`: Đạt 100% khớp tuyệt đối trên toàn bộ 13 ngôn ngữ (`vi`, `en`, `zh`, `ja`, `ko`, `es`, `fr`, `de`, `id`, `th`, `hi`, `ar`, `ru`).
- [x] **Form Studio Designer (`plugins/form/web/src/app/form-screen.component.*`)**:
  - Tái cấu trúc Left Palette thành 6 nhóm danh mục có icon nhận diện và huy hiệu số lượng trường (`FIELD_CATEGORIES`).
  - Xây dựng giá trị mặc định cho từng loại trường khi kéo thả hoặc nhấp thêm (`buildNewField`).
  - Ánh xạ biểu tượng 32 loại trường thông qua `itemIcon(type)`.
  - Bổ sung các điều khiển tùy biến chuyên sâu trên Right Inspector:
    - `STATIC_TEXT`: Chọn kiểu hiển thị (H1, H2, H3, Đoạn văn, Alert Info, Alert Warn, Alert Success).
    - `DIVIDER`: Chọn kiểu đường kẻ (Nét liền, nét đứt, khoảng trống Spacer).
    - `CURRENCY`: Chọn mã tiền tệ (VND, USD, EUR) và ký hiệu đơn vị tiền tệ.
    - `SLIDER`: Cấu hình giá trị tối thiểu (`min`), tối đa (`max`), bước nhảy (`step`).
    - `IMAGE_UPLOAD`: Cấu hình dung lượng ảnh tối đa (MB).
    - `REPEATER`: Trình quản lý cấu hình danh sách trường con (Thêm/xóa/sửa cột mảng lặp).
- [x] **Form Fill Runtime (`plugins/form/web/src/app/form-fill.component.*`)**:
  - Hỗ trợ ẩn/hiện mật khẩu tương tác (`isPasswordVisible`, `togglePasswordVisibility`).
  - Hộp chọn thẻ nhiều mục `MULTI_SELECT`: Lọc tìm kiếm động, gắn thẻ tags và xóa tag nhanh.
  - Chọn khoảng ngày `DATE_RANGE` (Từ ngày - Đến ngày).
  - Địa chỉ phân cấp 3 cấp Việt Nam `ADDRESS`: Bộ dữ liệu chuẩn 5 thành phố trực thuộc trung ương (Hà Nội, TP.HCM, Đà Nẵng, Hải Phòng, Cần Thơ), tự động mở khóa Quận/Huyện theo Tỉnh, mở khóa Phường/Xã theo Huyện, và ô nhập địa chỉ chi tiết.
  - Tải ảnh chân dung `IMAGE_UPLOAD`: Tự động nạp FileReader, xem trước ảnh tức thì (Live Preview) và xóa ảnh.
  - Bảng ký chữ ký số `SIGNATURE`: Vẽ chữ ký mượt mà trên Canvas HTML5 bằng chuột hoặc cảm ứng tay, lưu trữ ảnh Base64 PNG an toàn, nút xóa chữ ký (`Clear signature`).
  - Bảng mảng lặp `REPEATER`: Thêm dòng (+ Add item), xóa dòng, quản lý trạng thái mảng động.
  - Xác thực bỏ qua trường cấu trúc: Phương thức `isNonValue(item)` đảm bảo các khối tiêu đề, alert, vạch kẻ không gây nghẽn quá trình nộp biểu mẫu.
- [x] **Xác minh thực tế & Tích hợp PostgreSQL**:
  - Tạo biểu mẫu toàn diện `comprehensive-field-palette-showcase` tích hợp đầy đủ 32 loại trường thuộc 6 nhóm.
  - Thực thi kiểm thử tự động bằng trình duyệt CDP (`scratch/test_all_fields_flow.js`).
  - Lưu trữ thành công bản ghi nộp biểu mẫu vào bảng `tenant_d0bbcb6d_form.plg_form_responses` (ID: `6769b331-5b13-4ce3-a831-2a569fb51435`).

---

## 3. Minh chứng kiểm thử thực tế (Evidence Screenshots)

Toàn bộ 6 ảnh chụp màn hình minh chứng quá trình kiểm thử đã được lưu trữ tại `brain/screenshots/` và thư mục nghiệm thu sprint `docs/sprints/sprint_08_plugin_form_workflow/08_testing/evidence/s08_qa_real/screenshots/`:

| Thứ tự | Tên ảnh minh chứng | Mô tả nội dung kiểm thử |
| :---: | :--- | :--- |
| **01** | `all_fields_01_builder_palette_6_categories.png` | Giao diện Form Studio Designer với bảng điều khiển Left Palette phân chia thành 6 nhóm nghiệp vụ chuẩn ERP kèm huy hiệu số lượng và canvas xem trước trực quan. |
| **02** | `all_fields_02_builder_inspector_repeater_slider.png` | Thanh thuộc tính Right Inspector hiển thị cấu hình chi tiết cho loại trường `REPEATER` (Mảng lặp lịch sử công tác) với các cột con định kiểu riêng. |
| **03** | `all_fields_03_fill_basic_and_choice.png` | Màn hình điền form công khai phần đầu: Nhóm Nhập liệu cơ bản (Văn bản ngắn, Mật khẩu có mắt ẩn/hiện, Số lượng, Văn bản dài) và Nhóm Lựa chọn (Radio, Checkbox group, Multi-Select tags, Dropdown, Cam kết). |
| **04** | `all_fields_04_fill_specialized_and_address.png` | Màn hình điền form công khai phần giữa: Nhóm Dữ liệu chuyên biệt (Email, Điện thoại, URL, Mức lương tiền tệ VND, Ngày, Giờ, Khoảng ngày, Mã màu) và Nhóm Đa phương tiện (File upload, Image upload live preview). |
| **05** | `all_fields_05_fill_signature_and_grid.png` | Màn hình điền form công khai phần cuối: Bảng ký số điện tử (Canvas Signature Pad đã ký), Địa chỉ phân cấp 3 cấp (Hà Nội -> Ba Đình -> Điện Biên), Thanh trượt Slider, Đánh giá sao, Ma trận Likert, Mảng lặp Repeater và Bảng tính Excel có tính toán công thức. |
| **06** | `all_fields_06_submission_success.png` | Màn hình xác nhận nộp biểu mẫu thành công với mã tham chiếu nộp bài `6769b331-5b13-4ce3-a831-2a569fb51435`, đồng bộ dữ liệu vào PostgreSQL thật. |

