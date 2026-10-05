# Quy trình SDLC và điều kiện chuyển bước

Có 9 bước nghiệp vụ `01–09`; `00` là bản đồ đọc/điều phối. Đọc cùng [phối hợp agent](agent_collaboration.md) và [chuẩn tài liệu](documentation_standards.md).

## 1. Phạm vi và nguồn quyết định

- Tính năng mới phải có phân tích, khách hàng xác nhận scope/AC và thiết kế trước code. Xác nhận qua chat hợp lệ nếu lưu người, thời điểm, nội dung/nguồn và phiên bản được duyệt vào CONF; agent không ký thay khách hàng.
- Review, sửa link, chuẩn hóa docs/quy trình theo yêu cầu không cần mở gate sản phẩm. Sửa lỗi trong scope đã duyệt dùng gate hiện có. Đổi scope/AC/hành vi cam kết phải xác nhận phần thay đổi.
- Nguồn chính: scope tại `04_confirmation/`; contract tại `06_designs/`; trạng thái công việc tại file item; QA tại report có bằng chứng; closure tại `09_review/`. Reading guide/task board tổng hợp bằng link, không tạo quyết định mới.
- Mâu thuẫn nguồn: ghi xung đột, tìm bằng chứng gốc, làm phần độc lập. File mới sửa hoặc checkbox không tự chứng minh approval.

## 2. Sprint-Pack và Definition of Ready

Mỗi sprint tại `docs/sprints/sprint_XX_<slug>/`. Tài liệu sprint nằm trong pack; kiến trúc/hướng dẫn dùng chung đặt toàn cục, dẫn về sprint nguồn.

| Bước | Đầu ra | Owner | Điều kiện nhận việc |
| :--- | :--- | :--- | :--- |
| 00 | Reading guide, sprint plan | PM + BA | Mục tiêu, thứ tự đọc, owner, trạng thái, danh mục ID |
| 01 | 01_raw_notes/ | BA | Nguồn yêu cầu, tách lời khách hàng và diễn giải |
| 02 | 02_analysis/ | BA | Stories, scope, rules, câu hỏi/giả định |
| 03 | 03_benchmarks/ | BA | Nguồn, bài học áp dụng, lý do |
| 04 | 04_confirmation/ | BA + khách hàng | Scope/AC/Desktop-Mobile được duyệt có nguồn |
| 05 | 05_solutions/ | Architect | Phương án, trade-off, quyết định, dependency |
| 06 | 06_designs/ (architecture/DB/API/UI) | Architect | Contract, tenant/security, lỗi, migration, truy vết AC đủ code; review kỹ thuật có kết quả |
| 07 | 07_items/, code | Developer | File item riêng, dependency, input và write scope; đủ bước 04–06 trước code |
| 08 | 08_testing/ | QA | Baseline, môi trường/dữ liệu/cách tái hiện; có dev handoff |
| 09 | 09_review/ | PM | QA có bằng chứng, guides liên quan đủ, DoD đối soát |

Thay đổi chỉ có tài liệu kiểm tra phần liên quan; ghi N/A có lý do cho phần không áp dụng. Không tạo ERD/API hoặc browser result giả cho thay đổi chính sách.

## 3. Item và trạng thái

Mọi task/bug/feature/refactor quản lý độc lập có file trong `07_items/`. FEAT link task con; không dùng mã TASK chỉ trong checkbox rồi tính như file item Done. Task inline lịch sử giữ dấu vết; việc còn mở phải tách file trước phân công mới.

| Trạng thái | Ý nghĩa/quyền chuyển |
| :--- | :--- |
| To Do | Có scope/owner, chưa bắt đầu |
| In Progress | Owner đang làm |
| In Review / Testing | Owner bàn giao triển khai/bằng chứng, chờ reviewer/QA |
| Done | Reviewer/QA xác nhận tiêu chí bằng bằng chứng; docs dùng document review |
| Deferred | Chỉ Medium/Low; có lý do, đích backlog/sprint, owner nhận |
| Blocked | Blocker, người xử lý, điều kiện tiếp tục; không tính Done |

Resolved/Fixed/In Review/Testing trong tài liệu cũ không tự quy đổi thành Done; đối chiếu QA từng item. Mỗi item một severity hiện hành; tách phần scope khác mức độ, lưu lịch sử khi đổi severity. Critical: tê liệt/mất dữ liệu/rò rỉ nghiêm trọng. High: chức năng quan trọng sai/bị chặn không workaround. Medium: ảnh hưởng một phần có workaround hoặc cải tiến. Low: lỗi nhỏ. Thứ tự ưu tiên thực hiện ghi riêng nếu cần.

## 4. DoD và closure

PM chỉ ghi Closed sau khi có bằng chứng cho mọi điều kiện:

- Không có Critical/High khác Done, kể cả Blocked/Deferred trái quy tắc/task con cam kết.
- AC cam kết đã QA Pass: backend tests/suite yêu cầu trên PostgreSQL/Redis thật; Desktop và Ionic emulation cho UI. Build/static review không thay browser QA.
- Not Run/Blocked/thiếu ảnh-log/baseline chưa rõ không đánh Pass. N/A có lý do/reviewer, không bỏ kiểm tra bắt buộc.
- Medium/Low còn lại có lý do, owner, đích cụ thể. Chưa có sprint tiếp: bảng backlog tại review sprint nguồn; không chỉ ghi “để sprint sau”.
- User guide có ảnh, deployment/developer guides liên quan đồng bộ; link/truy vết đủ.
- Review ghi số item thực tế, QA nguồn, quyết định PM và xác nhận khách hàng riêng biệt.

PM đủ DoD dùng Ready for Closure; Closed sau xác nhận nghiệm thu khách hàng theo checklist sprint. Lịch sử ghi đóng nhưng thiếu xác nhận phải nêu khác biệt, không hồi tố chữ ký/tự mở hoặc đóng lại. Bug mới từ sprint đã đóng theo dõi trong sprint hiện hành, dẫn sprint nguồn.
