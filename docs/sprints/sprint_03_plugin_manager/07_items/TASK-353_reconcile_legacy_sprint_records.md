# TASK-353 — Đối soát hồ sơ sprint theo workflow chuẩn

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint theo dõi | TASK-353 / Documentation reconciliation / Sprint 03 |
| Severity / trạng thái | Medium / To Do |
| Owner / reviewer / cập nhật | PM + QA (cần phân công agent cụ thể trước xử lý) / Khách hàng cho phần nghiệm thu / 2026-10-05 |
| Nguồn / dependency | [REV-S03-004](../09_review/04_REV-S03-004_sdlc_workflow_review.md) / Không chặn TASK-349; không thay các gate sản phẩm |
| Write scope | CONF/reading guides/item/QA/REV/task board bị tác động; quyền ghi từng file do điều phối cấp trước xử lý |
| Baseline / đọc trước | Hồ sơ hiện hành 2026-10-05 / [chuẩn tài liệu](../../../../.agents/rules/documentation_standards.md) |

## 1. Công việc còn lại

1. Sprint 02: tìm nguồn xác nhận nghiệm thu khách hàng đúng phiên bản; phần chữ ký trong review còn trống. Nếu chưa có nguồn, ghi Pending rõ; không tự ký, không hồi tố ngày đóng.
2. Sprint 03: đối chiếu từng item In Review/Resolved với QA theo baseline; tách task inline còn mở thành file trước phân công, giữ IDs. Không đếm Resolved thành Done chỉ từ summary.
3. Đối soát số item trong các snapshots/closure và matrix AC→design→item→test→evidence; ghi coverage chưa kiểm chứng và nguồn thực tế. Những thiếu QA sản phẩm phải giữ gate chờ, không “sửa tài liệu” thành Pass.
4. Phần chuyển tiếp như TASK-348: tách scope còn lại/owner/đích rõ trước tiếp tục rollout. Task này chỉ đối soát hồ sơ, không tự code Mobile hoặc chạy lại toàn bộ QA.

## 2. Tiêu chí

- [ ] Trạng thái/gate hiện hành có nguồn và thống nhất tại indexes.
- [ ] Mỗi việc quản lý còn mở có file/owner/dependency, IDs không trùng.
- [ ] Totals và AC coverage có baseline/cách đếm; chưa kiểm chứng ghi đúng.
- [ ] Reviewer xác nhận đối soát; khách hàng xác nhận riêng phần nghiệm thu nếu cần.

## 3. Bàn giao

To Do, chưa kiểm chứng. Đây là housekeeping Medium; không hạ severity hoặc đóng các Critical/High sản phẩm hiện có. Item này ghi việc còn lại sau chuẩn hóa workflow, để PM/QA nhận theo quyền ghi được phân công.
