# Nguyên tắc chung cho toàn bộ agent

## Quy tắc bắt buộc — Luồng làm việc

**Mọi luồng làm việc của tất cả agent đều phải tuân thủ:**

1. **Đọc tài liệu trước**: Trước khi thực hiện bất kỳ hành động nào (làm rõ yêu cầu, code, thiết kế, kiểm thử, triển khai), phải đọc đầy đủ tài liệu liên quan (SRS, task, architecture, design specs, PRD...).

2. **Viết hoặc cập nhật tài liệu đáp ứng yêu cầu**: Sau khi hiểu yêu cầu, phải tạo mới hoặc cập nhật tài liệu cần thiết để phản ánh rõ phạm vi, cách tiếp cận, phân rã công việc, và tiêu chí hoàn thành.

3. **Thực hiện công việc**: Chỉ thực thi sau khi tài liệu ở bước 2 đã được cập nhật đầy đủ và nhất quán với yêu cầu người dùng.

4. **Cập nhật tài liệu sau khi có kết quả**: Sau khi hoàn thành, phải cập nhật tài liệu phản ánh kết quả thực hiện, trạng thái task, thay đổi thiết kế/kiến trúc/nghiệp vụ, và các việc cần theo dõi tiếp theo.

> Không được bắt đầu triển khai khi chưa đọc tài liệu.
> Không được thực hiện công việc khi chưa viết/cập nhật tài liệu đáp ứng yêu cầu.
> Không được kết thúc công việc khi chưa cập nhật tài liệu sau khi có kết quả.

## Quy tắc tổ chức dữ liệu tài liệu (Docs Data Organization)

Áp dụng cho toàn bộ agent khi làm việc với hệ thống tài liệu trong `docs/`:

1. **Task phải là file riêng**: Mỗi task (hoặc hạng mục tương đương như bug fix, refactor, spike) phải được lưu thành **một file `.md` riêng biệt**, không gom nhiều task vào một file.

2. **Phân tầng thư mục theo sprint và cụm chức năng**:
	- Task lưu theo cấu trúc:
	  - `docs/tasks/sprints/SPRINT-<NN>/<cluster>/TASK-SPRINT-<NN>-<CLUSTER>-<NNN>-<slug>.md`
	- Trong đó:
	  - `<NN>`: số sprint 2 chữ số (ví dụ: `01`, `02`)
	  - `<cluster>`: cụm chức năng dạng kebab-case (ví dụ: `auth`, `order-management`, `reporting`)
	  - `<CLUSTER>`: mã cụm chức năng dạng UPPER_SNAKE_CASE (ví dụ: `AUTH`, `ORDER_MANAGEMENT`)
	  - `<NNN>`: số thứ tự task 3 chữ số trong cụm chức năng/sprint (ví dụ: `001`, `002`)
	  - `<slug>`: mô tả ngắn dạng kebab-case

3. **Bổ sung hệ thống index để tổng quát trạng thái**:
	- Cấp toàn bộ dự án: `docs/tasks/TASK-INDEX.md`
	- Cấp sprint: `docs/tasks/sprints/SPRINT-<NN>/TASK-INDEX.md`
	- Cấp cụm chức năng: `docs/tasks/clusters/<cluster>/TASK-INDEX.md`
	- Mỗi khi tạo/cập nhật task file, bắt buộc cập nhật tối thiểu index cấp sprint và cấp toàn bộ dự án; nếu có index cụm chức năng thì cập nhật đồng thời.

4. **Chuẩn cột index tối thiểu** (áp dụng cho mọi file `TASK-INDEX.md`):
	- `Task ID`
	- `Tiêu đề`
	- `Sprint`
	- `Cluster`
	- `Loại`
	- `Người phụ trách`
	- `Trạng thái`
	- `Phụ thuộc`
	- `File task`

5. **Định danh task thống nhất**:
	- `Task ID` theo format: `TASK-SPRINT-<NN>-<CLUSTER>-<NNN>`
	- `Task ID` trong index phải khớp tuyệt đối với tên file task.

## Ràng buộc bắt buộc cho Project Manager

Khi agent ở vai trò **Project Manager** nhận yêu cầu:

1. Chỉ được thực hiện các hoạt động: làm rõ yêu cầu, phân tích phạm vi, lập kế hoạch, phân rã task, điều phối và theo dõi tiến độ.
2. **Không được tự ý thực hiện công việc chuyên môn một mình** (không tự code, không tự thiết kế chi tiết, không tự kiểm thử thay cho agent chuyên trách) trừ khi người dùng yêu cầu rõ ràng PM phải tự làm.
3. Bắt buộc giao việc cho agent phù hợp (Senior Backend Programmer, Senior Frontend Programmer, Senior QA, Senior DevOps, Technical Leader, UI/UX Designer, Business Analyst, Product Owner...) để thực thi.
4. Trước khi giao việc và sau khi nhận kết quả từ các agent, Project Manager vẫn phải tuân thủ đầy đủ quy trình 4 bước ở mục "Quy tắc bắt buộc — Luồng làm việc".
