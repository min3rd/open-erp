# [TASK-n] Công việc kỹ thuật

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-n / Task / Sprint XX |
| Severity / trạng thái | <Critical/High/Medium/Low> / To Do |
| Owner/agent / reviewer | <cụ thể> / Chưa phân công |
| Cập nhật / input version | YYYY-MM-DD / <CONF/DES hoặc yêu cầu docs-only> |
| depends_on / blocks / parent | <ID hoặc không có> / <ID> / <FEAT link> |
| Write scope / baseline | <file paths> / <commit hoặc working tree + files> |

## 1. Mục tiêu và scope

Vấn đề, kết quả cần đạt, giới hạn; link AC/thiết kế đầu vào. Cấp ID toàn dự án qua điều phối.

## 2. Các thao tác

- [ ] <bước thực hiện; không gán TASK khác chỉ trong checkbox>

## 3. Tiêu chí và kiểm chứng theo loại thay đổi

- [ ] Đáp ứng AC/thiết kế, có diff và docs liên quan.
- [ ] Backend: tests nghiệp vụ/tenant trên PostgreSQL/Redis thật, không H2.
- [ ] Frontend: build và browser QA Desktop/Mobile Ionic; không viết unit/component test.
- [ ] Docs-only: kiểm tra nội dung/link/ID/thứ tự và document review.
- [ ] Reviewer xác nhận; phần không áp dụng ghi N/A có lý do.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| <lệnh/bước> | Not Run | Chưa có |

## 4. Bàn giao và lịch sử

Files đổi, kiểm tra đã/chưa chạy, rủi ro/blocker, người nhận, bước tiếp. Dev chuyển In Review / Testing; chỉ Done khi tiêu chí được review/QA xác nhận. Người nhận ghi Accepted/Returned kèm lý do.
