# TASK-353 — Đối soát hồ sơ sprint theo workflow chuẩn

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint theo dõi | TASK-353 / Documentation reconciliation / Sprint 03 |
| Severity / trạng thái | Medium / **Done** (đối soát 2026-10-05) |
| Owner / reviewer / cập nhật | PM + QA / Reviewer xác nhận đối soát (ký ở `sprint_review.md` mục 9) / 2026-10-05 |
| Nguồn / dependency | [REV-S03-004](../09_review/04_REV-S03-004_sdlc_workflow_review.md) / Không chặn TASK-349; không thay các gate sản phẩm |
| Kết quả | Đối soát xong: Sprint 02 chữ ký nghiệm thu ghi **PENDING** (không tự ký); Sprint 03 số item/tổng hợp lại theo file (`183 item`, `181 Done/Resolved`, `0 code dở`, `5 chờ QA ký`, `0 Deferred`); AC coverage ghi rõ phần chưa kiểm chứng. |
| Write scope | CONF/reading guides/item/QA/REV/task board bị tác động; quyền ghi từng file do điều phối cấp trước xử lý |
| Baseline / đọc trước | Hồ sơ hiện hành 2026-10-05 / [chuẩn tài liệu](../../../../.agents/rules/documentation_standards.md) |

## 1. Công việc còn lại

1. Sprint 02: tìm nguồn xác nhận nghiệm thu khách hàng đúng phiên bản; phần chữ ký trong review còn trống. Nếu chưa có nguồn, ghi Pending rõ; không tự ký, không hồi tố ngày đóng.
2. Sprint 03: đối chiếu từng item In Review/Resolved với QA theo baseline; tách task inline còn mở thành file trước phân công, giữ IDs. Không đếm Resolved thành Done chỉ từ summary.
3. Đối soát số item trong các snapshots/closure và matrix AC→design→item→test→evidence; ghi coverage chưa kiểm chứng và nguồn thực tế. Những thiếu QA sản phẩm phải giữ gate chờ, không “sửa tài liệu” thành Pass.
4. Phần chuyển tiếp như TASK-348: tách scope còn lại/owner/đích rõ trước tiếp tục rollout. Task này chỉ đối soát hồ sơ, không tự code Mobile hoặc chạy lại toàn bộ QA.

## 2. Tiêu chí

- [x] Trạng thái/gate hiện hành có nguồn và thống nhất tại indexes — `sprint_review.md` Sprint 03 mục 2.1/4.2/5/6/8/9 đã đồng bộ; `00_READING_GUIDE` giữ snapshot lịch sử có ghi chú.
- [x] Mỗi việc quản lý còn mở có file/owner/dependency, IDs không trùng — follow-up TASK-348 phần phụ được ghi rõ là phải tách file trước khi phân công.
- [x] Totals và AC coverage có baseline/cách đếm; chưa kiểm chứng ghi đúng — baseline 2026-10-05, cách đếm theo file item trong `07_items/`.
- [ ] Reviewer xác nhận đối soát; khách hàng xác nhận riêng phần nghiệm thu nếu cần — **PENDING** (thuộc mục 9 `sprint_review.md`, không tự ký).

## 3. Bàn giao

Đối soát hoàn tất ngày 2026-10-05. Ghi nhận trung thực:
- **Sprint 02**: `CONF-01` (2026-09-18) chỉ là xác nhận **phạm vi**; chữ ký **nghiệm thu đóng sprint** (mục 8 REV-02) **không có nguồn** → đã ghi **PENDING** trong review, không tự ký, không hồi tố ngày đóng.
- **Sprint 03**: số item/tổng hợp đối chiếu lại theo file; 5 item `Medium` `Resolved`/`Implemented` tách riêng khỏi nhóm `Done` (chờ QA/Reviewer ký); 0 item `Deferred`.
- Việc còn lại (Reviewer + khách hàng ký) là **quy trình**, không phải lỗi sản phẩm.
