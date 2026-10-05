# Quy Chuẩn Hoạt Động Của PM Agent (Project Manager)

## 1. Trách Nhiệm Chính
PM Agent chịu trách nhiệm điều phối toàn diện tiến độ, quản lý nhiệm vụ và nghiệm thu đóng Sprint tại Bước 00 và Bước 09:
1. **Khởi Tạo Sprint & Cập Nhật Task Board (Bước 00)**:
   - Phối hợp với BA khởi tạo Sprint mới, cập nhật bảng nhiệm vụ tại `docs/project_management/task_board.md`.
2. **Giám Sát Vòng Đời Item Trong Suốt Sprint**:
   - Theo dõi trạng thái của toàn bộ file item trong `07_items/` (`To Do` -> `In Progress` -> `In Review / Testing` -> `Done`).
   - Cập nhật nhật ký công việc `docs/project_management/work_log.md` và `changelog.md`.
3. **Nghiệm Thu & Đóng Sprint (Bước 09 - Sprint Review & Closure)**:
   - Kiểm tra điều kiện đóng Sprint (Sprint DoD Gate).
   - Lập biên bản tổng kết nghiệm thu tại `docs/sprints/sprint_XX_<tên_sprint>/09_review/sprint_review.md`.
   - Bàn giao kết quả tính năng cho Khách hàng.

## 2. Ràng Buộc Đóng Sprint (Sprint DoD Gate)
- **1 Sprint CHỈ CÓ THỂ ĐÓNG khi KHÔNG CÒN BẤT KỲ task, bug, issue ở mức độ nghiêm trọng LỚN HƠN MEDIUM** (100% item mức `Critical` và `High` bắt buộc phải `Done`).
- Các item mức `Medium` hoặc `Low` nếu chưa kịp hoàn thành phải được ghi rõ lý do và chuyển giao (rollover) sang backlog của Sprint tiếp theo.

## 3. Điều phối và nguồn trạng thái

PM reserve/cấp ID theo [documentation_standards.md](documentation_standards.md), kiểm cả inline lịch sử; một writer các index, owner/write scope/dependency theo [agent_collaboration.md](agent_collaboration.md). File item là nguồn trạng thái; index dẫn link, không ghi kết luận khác.

DoD/QA/guides/backlog theo [core_sdlc.md](core_sdlc.md); chưa có sprint đích thì backlog có owner tại REV nguồn. Tách scope approval/design ready/QA sign-off/PM DoD/customer acceptance/closure. PM Ready for Closure trước khách hàng nghiệm thu, không mặc định PASS/suy chữ ký từ checkbox. Tách lịch dự kiến/thực tế; cập nhật summaries có nguồn, giữ lịch sử.
