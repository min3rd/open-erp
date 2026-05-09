---
name: ui-mockup
description: 'Tạo mockup hình ảnh UI qua browser của người dùng để minh họa nhanh màn hình/flow và hỗ trợ chốt yêu cầu trước khi triển khai.'
argument-hint: 'Mô tả màn hình hoặc luồng cần mockup (mục tiêu, phong cách, nền tảng)'
user-invocable: true
disable-model-invocation: false
---

# UI Mockup

Skill này giúp agent tạo mockup nhanh qua browser của người dùng, xuất ảnh, và gắn ảnh vào task/docs để tăng hiệu quả trao đổi yêu cầu.

## Khi nào nên dùng

- Cần hình minh họa nhanh cho task frontend hoặc UX flow.
- Cần thống nhất kỳ vọng giao diện trước khi code.
- Cần bổ sung mockup vào task để PM, BA, FE, QA cùng hiểu giống nhau.

## Không nên dùng

- Cần thiết kế production-ready hoặc pixel-perfect theo design system đầy đủ.
- Chứa dữ liệu nhạy cảm hoặc tài sản thương hiệu chưa được phép dùng.
- Yêu cầu bản quyền hình ảnh mà nguồn sinh ảnh chưa đáp ứng chính sách nội bộ.

## Đầu ra bắt buộc

- 1 hoặc nhiều ảnh mockup theo yêu cầu.
- Prompt đã dùng (phiên bản cuối).
- Ghi chú quyết định thiết kế chính (layout, component, trạng thái).
- Đoạn markdown nhúng ảnh vào file task.

## Quy trình chuẩn

1. Chuẩn hóa đầu bài mockup
- Xác định loại màn hình: landing, dashboard, form, table, wizard, mobile app screen.
- Xác định mục tiêu: mô tả tính năng, luồng, hay trạng thái lỗi.
- Xác định ràng buộc: nền tảng, màu, style, mức độ chi tiết.

2. Soạn prompt nền
- Viết prompt theo cấu trúc: bối cảnh, bố cục, thành phần chính, trạng thái UI, phong cách thị giác.
- Thêm ràng buộc chất lượng: readable typography, spacing rõ, ưu tiên usability.

3. Tạo ảnh mockup bằng công cụ phù hợp qua browser
- Mở browser và truy cập công cụ tạo ảnh phù hợp.
- Dán prompt nền và sinh bản nháp đầu tiên.

4. Đánh giá nhanh và rẽ nhánh
- Nếu ảnh đạt >= 80% kỳ vọng: chuyển bước 5.
- Nếu chưa đạt bố cục: chỉnh prompt theo bố cục (hierarchy, grid, alignment) rồi sinh lại.
- Nếu chưa đạt phong cách: chỉnh prompt theo style (tone, color, density, visual weight) rồi sinh lại.
- Nếu chưa đạt tính dùng được: yêu cầu rõ trạng thái UI (default, loading, error, empty) và sinh lại.

5. Chốt ảnh cuối và lưu evidence
- Chọn 1-3 ảnh tốt nhất.
- Lưu ảnh vào thư mục evidence/docs của dự án theo chuẩn tên.
- Lưu prompt cuối cùng để tái sử dụng.

6. Chèn vào task cho người dùng
- Cập nhật file task markdown với:
  - Mục "Mockup tham chiếu"
  - Ảnh nhúng
  - Ghi chú phạm vi: mockup định hướng, không thay thế design system chi tiết.

7. Kiểm tra hoàn tất
- Xác nhận ảnh hiển thị đúng trong markdown.
- Xác nhận người dùng hiểu rõ mục đích và giới hạn của mockup.

## Tiêu chí chất lượng

- Mockup phản ánh đúng mục tiêu nghiệp vụ của task.
- Thành phần chính dễ đọc, cấu trúc rõ, không rối thị giác.
- Có ít nhất một trạng thái quan trọng được thể hiện (ví dụ lỗi hoặc empty).
- Có đường dẫn ảnh và markdown nhúng hợp lệ trong task.
- Prompt cuối đủ rõ để tái tạo.

## Checklist hoàn thành

- [ ] Đã chuẩn hóa đầu bài và ràng buộc.
- [ ] Đã generate mockup qua browser người dùng.
- [ ] Đã tinh chỉnh tối đa 3 vòng và chốt ảnh phù hợp.
- [ ] Đã lưu ảnh vào thư mục docs/evidence hoặc vị trí được yêu cầu.
- [ ] Đã chèn ảnh vào task markdown với ghi chú phạm vi sử dụng.
- [ ] Đã lưu prompt cuối để tái sử dụng.

## Mẫu prompt nhanh

Mẫu 1 (web dashboard):
"Tạo mockup màn hình web dashboard cho hệ thống quản lý đơn hàng. Bố cục gồm: top bar, bộ lọc, bảng danh sách đơn, panel chi tiết bên phải. Thể hiện trạng thái empty và error nhẹ. Phong cách hiện đại, dễ đọc, màu trung tính, nhấn màu xanh. Typography rõ ràng, spacing thoáng, ưu tiên usability."

Mẫu 2 (form flow):
"Tạo mockup màn hình form tạo người dùng mới cho ứng dụng enterprise. Bao gồm: thông tin cơ bản, phân quyền, nút lưu/hủy, thông báo validate lỗi dưới từng trường. Giao diện desktop, sạch, chuyên nghiệp, tập trung vào tính dễ dùng và khả năng quét thông tin nhanh."

## Mẫu markdown chèn vào task

### Mockup tham chiếu

![Mockup man hinh](../../evidence/TASK-<ID>-mockup-main.png)

Ghi chú:
- Mockup dùng để định hướng trao đổi yêu cầu và phạm vi UI.
- Khi triển khai thực tế, ưu tiên theo DESIGN-SYSTEM và SCREEN-SPECS mới nhất.

## Gợi ý gọi skill

- /ui-mockup "Tạo mockup màn hình đăng nhập có trạng thái lỗi và quên mật khẩu"
- /ui-mockup "Tạo 2 phương án A/B cho dashboard báo cáo bán hàng"
- /ui-mockup "Tạo mockup mobile cho flow checkout 3 bước"
