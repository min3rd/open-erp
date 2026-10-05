# [REV-SXX-NNN] Review và quyết định đóng Sprint XX

| Trường | Giá trị |
| :--- | :--- |
| ID / scope / trạng thái / phiên bản | REV-SXX-NNN / Sprint XX / Draft / 0.1 |
| Cập nhật / owner / reviewer | YYYY-MM-DD / <PM cụ thể> / Chưa review |
| Input / đọc trước / đọc tiếp | <CONF+TR baseline> / <QA report> / <backlog hoặc sprint tiếp> |

## 1. Mục tiêu và kết quả

Đối chiếu scope/AC đã duyệt với traceability. Không dùng số test/build thay coverage AC.

## 2. DoD có bằng chứng

| Điều kiện | Số/kết quả thực tế | Bằng chứng/baseline | Đánh giá |
| :--- | :--- | :--- | :--- |
| Critical chưa Done | Chưa đối soát | Chưa có | Not Run |
| High chưa Done (kể cả task con) | Chưa đối soát | Chưa có | Not Run |
| Backend tests PostgreSQL/Redis thật | Chưa chạy | Chưa có | Not Run |
| Browser Web Desktop / Mobile Ionic | Chưa chạy | Chưa có | Not Run |
| AC coverage, guides có ảnh, docs/link | Chưa đối soát | Chưa có | Not Run |
| Medium/Low chuyển tiếp có owner/đích | Chưa đối soát | Chưa có | Not Run |

N/A chỉ khi không áp dụng, có lý do/reviewer; không điền sẵn PASS hoặc 0 item.

## 3. Backlog chuyển tiếp

| ID/link nguồn | Severity | Lý do | Owner nhận | Đích cụ thể | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| <item> | Medium/Low | <lý do> | <owner> | <sprint hoặc backlog trong review này> | Deferred |

Giữ ID khi rollover, không tính bản sao/link là item thứ hai.

## 4. Quyết định và xác nhận

| Quyết định | Trạng thái | Người/ngày/nguồn |
| :--- | :--- | :--- |
| QA sign-off | Pending | Chưa có |
| PM DoD | Pending | Chưa có |
| Customer acceptance | Pending | Chưa có |
| Sprint closure | Pending | Chưa có |

PM Ready for Closure khi đủ DoD; Closed sau xác nhận khách hàng. Chưa đủ ghi nguyên nhân và bước tiếp.

## 5. Retrospective

Điểm tốt, vấn đề và hành động có owner.
