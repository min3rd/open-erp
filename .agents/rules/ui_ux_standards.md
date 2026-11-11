# Quy Chuẩn Thiết Kế UI/UX ERP (High-Density, Sharp & Anti-Modal)

## 1. Mật Độ Thông Tin Cao (High-Density & Compact Design)
- **Typography nhỏ gọn**:
  - Font chữ chuẩn cho nội dung bảng và form: `text-xs` (12px) hoặc `text-sm` (13px).
  - Tiêu đề nhóm / Section headers: `text-sm font-semibold uppercase tracking-wider`.
- **Khoảng cách & Lề thu gọn (Tight Spacing)**:
  - Sử dụng padding và margin nhỏ: `p-1`, `p-1.5`, `p-2`, `gap-1`, `space-y-1.5`.
  - Hạn chế tối đa các khoảng trắng dư thừa (empty whitespace).
- **Bảng dữ liệu đậm đặc (Dense Data Tables)**:
  - Chiều cao dòng chuẩn: `28px` đến `34px`.
  - Căn số sang phải, text sang trái, badge trạng thái nhỏ gọn.

## 2. Thiết Kế Vuông Vắn & Hiện Đại (Sharp / Squared Aesthetic)
- **Góc cạnh sắc nét**:
  - Mặc định (và **bắt buộc cho giao diện mặc định**) sử dụng `rounded-none` hoặc tối đa `rounded-sm` (1px - 2px).
  - Nghiêm cấm phong cách bo tròn lớn (`rounded-xl`, `rounded-full`).
  - **Ngoại lệ theo theme**: từ Sprint 04, các theme thay thế (không phải mặc định) được phép dùng hình dạng bo góc khác qua bộ token dùng chung `ShapeVariant` (ví dụ `SOFT` với `rounded-md`), miễn **không dùng bo tròn lớn kiểu consumer** và **vẫn giữ mật độ thông tin cao**. Theme mặc định luôn là `SHARP`.
- **Đường viền mỏng tinh tế**:
  - Sử dụng viền sắc nét: `border border-neutral-200 dark:border-neutral-800`.
  - Tương phản rõ ràng giữa nền và viền.

## 3. Triết Lý Điều Hướng Không Dùng Modal (Anti-Modal Architecture)
- **Nghiêm cấm lạm dụng Modal popup che khuất màn hình**. Thay thế 100% bằng 3 giải pháp:
  1. **Angular Router (Nested Routes / Child Outlets)**:
     - URL biểu thị trạng thái (ví dụ: `/sales/orders/123/edit`). Hỗ trợ bookmark và chia sẻ link.
  2. **Drawer (Side Sheet / Slide-over trượt từ cạnh phải)**:
     - Dùng xem nhanh chi tiết hoặc nhập biểu mẫu mà vẫn giữ trọn vẹn ngữ cảnh bảng danh sách bên trái.
     - Hỗ trợ **xếp chồng đa tầng (Stacked Drawers)**.
     - **Quy chuẩn chân Drawer (Drawer Footer Invariant)**: Thùng chứa footer của component `app-drawer` đã có sẵn style nền và viền chuẩn (`px-4 py-2.5 border-t border-default bg-surface-muted flex justify-end gap-2`). Thẻ chiếu nội dung `<div drawer-footer>` bắt buộc phải trong suốt (`bg-transparent`), chỉ chứa các lớp bố cục (`flex items-center gap-2`). **Tuyệt đối cấm gán thêm `bg-surface`, `bg-*`, `border-t`, `p-*`** bên trong `[drawer-footer]` vì sẽ tạo ra khối hộp màu đen/2 lớp viền lồng nhau kỳ dị xung quanh nút bấm.
  3. **Chia Màn Hình Đa Phần (Split-Screen / Multi-Pane Layout)**:
     - Chia màn hình thành các cột hiển thị song song (Master-Detail).

## 4. Quy Chuẩn Nhãn Thuần Khiết & Tách Biệt Biểu Tượng (Pure Semantic Labels & Icon Separation)
- **Cấm Emoji Unicode trong chuỗi văn bản**:
  - Tuyệt đối không nhúng các ký tự emoji (`⚠️`, `✓`, `✕`, `🔒`, `📍`, `⏱️`, `➕`, `📌`, `💡`...) vào bên trong chuỗi nhãn (label), văn bản nút bấm, thẻ form, tiêu đề hoặc badge.
  - Chuỗi văn bản hiển thị phải trang trọng, cô đọng, đúng chuẩn ngôn ngữ nghiệp vụ ERP sắc nét.
- **Biểu tượng (Icon) phải tách biệt hoàn toàn**:
  - Khi cần biểu tượng minh họa cạnh nhãn (ví dụ icon xác nhận, cảnh báo, vị trí, khóa), bắt buộc phải sử dụng icon component hoặc SVG độc lập, được định kiểu kích thước và màu sắc qua Design Tokens (`inline-flex items-center gap-1.5`).
  - Biểu tượng đồ họa không bao giờ được nằm lẫn bên trong chuỗi dịch i18n hoặc ghép thủ công cạnh chuỗi i18n trong template.

## 5. 100% Đa Ngôn Ngữ Cho Toàn Bộ Nhãn & Mọi Giá Trị Hiển Thị (Zero-Raw Display Values)
- **Nguyên tắc không có ngoại lệ (Zero Exceptions)**:
  - 100% nhãn nút bấm, nhãn input, tiêu đề cột của bảng, tab menu.
  - **100% giá trị trạng thái enum hiển thị**: Tạo mapping từ điển cho từng trạng thái (`enum.order_status.pending`, `enum.timesheet_status.locked`, `attendance.status.in_office`). Tuyệt đối không để text tiếng Anh thô như `LOCKED`, `ACTIVE`.
  - **100% chuỗi nội suy tham số**: Đưa toàn bộ định dạng chuỗi vào từ điển kèm `{param}` (ví dụ: `attendance.gps.outside_with_distance`), không dùng phép cộng chuỗi hoặc ghép text cứng trong template HTML / component TypeScript.
  - **100% thuộc tính ngữ cảnh & trợ năng**: `aria-label`, `title`, tooltip, placeholder và thông báo xác nhận (confirm popup).
