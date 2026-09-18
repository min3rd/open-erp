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
  - Mặc định sử dụng `rounded-none` hoặc tối đa `rounded-sm` (1px - 2px).
  - Nghiêm cấm phong cách bo tròn lớn (`rounded-xl`, `rounded-full`).
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
  3. **Chia Màn Hình Đa Phần (Split-Screen / Multi-Pane Layout)**:
     - Chia màn hình thành các cột hiển thị song song (Master-Detail).
