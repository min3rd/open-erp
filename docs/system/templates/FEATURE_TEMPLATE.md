# [FEAT-n] Tính năng

| Trường | Giá trị |
| :--- | :--- |
| ID / sprint / severity / trạng thái | FEAT-n / Sprint XX / <mức> / To Do |
| Owner / reviewer / cập nhật | <cụ thể> / Chưa phân công / YYYY-MM-DD |
| Input / dependency | <ANL/CONF + version> / <ID> |

## 1. Nhu cầu và phạm vi

Là <vai trò>, tôi muốn <hành động> để <lợi ích>. In/out-scope, Desktop/Mobile, nguồn khách hàng và link confirmation. Gate Pending tới khi có bằng chứng.

## 2. AC và truy vết

| AC đầy đủ | Given/When/Then | Design/version | Test case/evidence |
| :--- | :--- | :--- | :--- |
| <CONF/AC-01> | <kịch bản> | <link> | Not Run |

## 3. Task con có file riêng

| ID/link file | Owner | depends_on | Write scope | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| <TASK file> | <agent> | <ID> | <paths> | To Do |

Không khai báo TASK quản lý độc lập chỉ trong checklist. FEAT Done khi task con cam kết và AC đã QA; không tính sub-task inline lịch sử là file mới.

## 4. Bàn giao

Baseline, output, test đã/chưa chạy, reviewer/người nhận, blockers. Link report/traceability thay vì sao chép kết quả.
