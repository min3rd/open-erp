# [RAW-01] Yêu cầu gốc Sprint 04 — Trải nghiệm giao diện: Theme, Animation, Icon, Context Menu, Loading/Skeleton, Đa ngôn ngữ

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | RAW-S04-001 / Yêu cầu gốc / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-05 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | Yêu cầu trực tiếp của chủ dự án (phiên làm việc 2026-10-05) |
| Đọc trước / đọc tiếp | [Sprint 03 reading guide](../../sprint_03_plugin_manager/00_READING_GUIDE.md) / [ANL-S04-001](../02_analysis/01_ANL-S04-001_theme_system_and_design_tokens.md) |

## 1. Bối cảnh

Sprint 01–03 đã dựng xong Core IAM, phân quyền dữ liệu và Plugin Manager. Giao diện hiện tại chạy được nhưng:

- **Một giao diện duy nhất** (chỉ đổi sáng/tối bằng class `dark`), bảng màu `neutral-*` cố định, người dùng không chọn được "bộ mặt" khác.
- **Chuyển trạng thái rất thô**: ẩn/hiện tức thời, gần như không có animation.
- **Icon vẽ tay rải rác** dưới dạng inline SVG, không có bộ icon thống nhất.
- **Danh sách chỉ có nút thao tác**, chưa có context menu chuột phải như desktop.
- **Tải dữ liệu chỉ có text "Đang tải..."**, không có thanh tiến trình và không có skeleton; một vùng chậm làm cả màn hình chờ.
- **Chỉ hỗ trợ tiếng Việt và tiếng Anh**.

## 2. Yêu cầu gốc (nguyên văn, đã chuẩn hóa)

| # | Yêu cầu của chủ dự án |
| :---: | :--- |
| R1 | **Theme giao diện cho hệ thống**: nhiều theme về màu sắc, layout, cách thiết kế component. Mỗi theme vẫn phải đảm bảo hiển thị **nhiều diện tích nhất có thể** (mật độ cao) và mỗi theme phải có **đủ 2 mode Light/Dark**. |
| R2 | **Animation cho component**: hiện tại chỉ ẩn/hiện rất nhàm chán; cần chuyển động cho các trạng thái (mở/đóng, xuất hiện, chuyển trang, phản hồi tương tác). |
| R3 | **Dùng thư viện icon Feather**: các chức năng dễ hiểu và độc lập nên dùng icon để hiển thị. |
| R4 | **Context menu ở danh sách** để tối đa trải nghiệm như desktop (chuột phải). |
| R5 | **Thanh loading + skeleton** cho từng vùng giao diện; mỗi vùng **load độc lập** để tăng trải nghiệm. |
| R6 | **Đa ngôn ngữ**: ngoài tiếng Việt và tiếng Anh, hỗ trợ thêm **các ngôn ngữ phổ biến trên thế giới**. |

## 3. Ràng buộc kế thừa (không thương lượng)

- Mật độ cao, vuông vắn, anti-modal (Drawer/Router/Split-Screen thay Modal) — [ui_ux_standards](../../../../.agents/rules/ui_ux_standards.md).
- Thư viện component **dùng chung Web + Mobile** đặt tại `src/frontend/shared/`; component mới phải vào thư viện chung trước khi Web/Mobile dùng.
- Bộ **Design Token Enums** dùng chung (`ColorVariant`, `SizeVariant`, `ShapeVariant`) — không tạo enum phân mảnh theo component.
- **100% chuỗi qua i18n**, tách template `.html`, không test frontend tự động (kiểm thử trình duyệt).
- Hạn chế tối đa thư viện bên thứ ba; Tailwind v4 + Angular cho Web, Ionic 8 cho Mobile.

## 4. Điểm cần làm rõ (chuyển sang bước Confirmation)

1. Số lượng theme cụ thể và tên/nhận diện từng theme (ví dụ: Industrial, Slate, Ocean…).
2. Theme áp theo **tenant** (toàn workspace) hay theo **từng người dùng**.
3. Danh sách ngôn ngữ ưu tiên cho bản phát hành (gợi ý: vi, en, zh-CN, ja, ko, es, fr, de, pt-BR, ru, ar, th, id).
4. Mức độ animation mong muốn và ngưỡng hiệu năng chấp nhận (FPS, thời lượng).
5. Context menu: hành vi trên Mobile (long-press) có bắt buộc không.
6. Thanh loading: dạng thanh trên cùng trang (top progress bar) hay trong từng vùng.

## 5. Chưa kiểm chứng

Đây là ghi nhận yêu cầu thô, **chưa** phải scope/AC được duyệt. Mọi kết luận phạm vi nằm ở [CONF-S04-001](../04_confirmation/01_CONF-S04-001_sprint_04_scope.md) và chỉ có hiệu lực khi khách hàng xác nhận.
