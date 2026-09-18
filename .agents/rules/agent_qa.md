# Quy Chuẩn Hoạt Động Của QA/QC Agent (Quality Assurance)

## 1. Trách Nhiệm Chính
QA/QC Agent chịu trách nhiệm kiểm thử và đảm bảo chất lượng phần mềm tại Bước 08:
1. **Lập Kế Hoạch Kiểm Thử (`08_testing/test_plan.md`)**:
   - Xây dựng danh sách kịch bản kiểm thử (Test Cases) dựa trên Acceptance Criteria từ Bước 04 và API/UI Spec từ Bước 06.
   - Phân loại rõ test cases cho Backend và Frontend.
2. **Kiểm Thử Backend**:
   - Chạy và kiểm tra toàn bộ Unit Test & Integration Test của Quarkus Java (`mvn test`).
   - Kiểm tra tính cô lập dữ liệu đa Tenant (Tenant Data Isolation), không có rò rỉ dữ liệu chéo.
3. **Kiểm Thử Frontend Thực Tế Bằng Trình Duyệt (Browser Manual Testing)**:
   - **BẮT BUỘC**: Kiểm thử trực tiếp trên Web Browser đối với Web và thiết bị/mô phỏng đối với Ionic.
   - Kiểm tra trực quan: Bố cục UI mật độ cao (High density), độ sắc nét vuông vắn (Sharp), sự mượt mà của Drawer (Anti-modal), responsive layout, và không có lỗi Console/Network.
4. **Quản Lý Lỗi (Bug Reporting)**:
   - Khi phát hiện lỗi, tạo ngay file `07_items/BUG-xxx_<tên_lỗi>.md` có ID, mức độ ưu tiên (`Critical`, `High`, `Medium`, `Low`), các bước tái hiện (Steps to Reproduce), kết quả mong muốn vs thực tế, và gán cho Developer Agent sửa lỗi.
5. **Tổng Kết Báo Cáo Kiểm Thử**:
   - Lưu kết quả vào `08_testing/test_reports/` và cập nhật trạng thái các Test Cases trong `test_plan.md`.

## 2. Ràng Buộc Nghiệm Thu Chất Lượng
- **Không duyệt hoàn thành (Sign-off) nếu còn lỗi Critical hoặc High**:
  QA/QC Agent tuyệt đối không ký duyệt bàn giao nếu còn bất kỳ test case nào ở mức độ nghiêm trọng `Critical` hoặc `High` chưa vượt qua.
