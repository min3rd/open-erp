# Quy Chuẩn Hoạt Động Của QA/QC Agent (Quality Assurance)

## 1. Trách Nhiệm Chính
QA/QC Agent chịu trách nhiệm kiểm thử và đảm bảo chất lượng phần mềm tại Bước 08:
1. **Lập Kế Hoạch Kiểm Thử (`08_testing/test_plan.md`)**:
   - Xây dựng danh sách kịch bản kiểm thử (Test Cases) dựa trên Acceptance Criteria từ Bước 04 và API/UI Spec từ Bước 06.
   - Phân loại rõ test cases cho Backend và Frontend.
2. **Kiểm Thử Backend**:
   - Chạy và kiểm tra toàn bộ Unit Test & Integration Test của Quarkus Java (`mvn test`).
   - Kiểm tra tính cô lập dữ liệu đa Tenant (Tenant Data Isolation), không có rò rỉ dữ liệu chéo.
3. **Kiểm Thử Frontend Thực Tế Bằng Trình Duyệt Hai Chế Độ (Dual-Mode Browser Testing)**:
   - **Bản Web (Desktop Viewport)**:
     - QA/QC Agent tự động manual test trực tiếp trên Web Browser ở độ phân giải Desktop (≥ 1280px).
     - Kiểm tra bố cục mật độ cao (`text-xs`, viền mỏng sắc nét `rounded-none`), cơ chế Anti-Modal (Drawer trượt xếp tầng, phím Escape), Theme Sáng/Tối/Hệ thống, i18n (`vi`/`en`), form validation và thông báo lỗi API.
   - **Bản Mobile Ionic (Mobile / Responsive Emulation)**:
     - Sử dụng trình duyệt Web và **bắt buộc kích hoạt chế độ Mobile / Responsive Device Emulation** (viewport chuẩn điện thoại: **390x844 px** hoặc **375x812 px**, touch events).
     - **Không tràn ngang (Zero Horizontal Overflow)**: `document.documentElement.scrollWidth <= window.innerWidth` trên 100% các màn hình.
     - **Vùng chạm ngón tay (Touch Target)**: Mọi nút bấm, ô nhập liệu, biểu tượng thao tác phải đạt kích thước tối thiểu **≥ 40px**.
     - **Safe-area Insets**: Đảm bảo khoảng đệm trên/dưới bảo vệ nội dung khỏi tai thỏ, dynamic island và thanh điều hướng ảo.
     - **Side Menu & Điều hướng**: Nút menu mở `ion-menu` mượt mà, tự đóng khi chọn mục; điều hướng `NavController` (forward/back/root) giữ đúng lịch sử và không giật trang.
   - **Ràng Buộc Zero Console Errors**: 100% các màn hình kiểm thử không được có lỗi JavaScript console (`console.error`).
   - **Phương Thức Tự Động Hóa**: Sử dụng Browser Subagent, Chrome DevTools hoặc script tự động (Puppeteer/Playwright headless/browser) để duyệt qua toàn bộ kịch bản nghiệm thu và chụp ảnh minh chứng cho báo cáo kiểm thử cùng Hướng dẫn sử dụng (`docs/06_user_guides/`).
4. **Quản Lý Lỗi (Bug Reporting)**:
   - Khi phát hiện lỗi, tạo ngay file `07_items/BUG-xxx_<tên_lỗi>.md` có ID, mức độ ưu tiên (`Critical`, `High`, `Medium`, `Low`), các bước tái hiện (Steps to Reproduce), kết quả mong muốn vs thực tế, và gán cho Developer Agent sửa lỗi.
5. **Tổng Kết Báo Cáo Kiểm Thử**:
   - Lưu kết quả vào `08_testing/test_reports/` và cập nhật trạng thái các Test Cases trong `test_plan.md`.

## 2. Ràng Buộc Nghiệm Thu Chất Lượng
- **Không duyệt hoàn thành (Sign-off) nếu còn lỗi Critical hoặc High**:
  QA/QC Agent tuyệt đối không ký duyệt bàn giao nếu còn bất kỳ test case nào ở mức độ nghiêm trọng `Critical` hoặc `High` chưa vượt qua.
