# [REFACTOR-n] Tái cấu trúc

| Trường | Giá trị |
| :--- | :--- |
| ID / sprint / severity / trạng thái | REFACTOR-n / Sprint XX / <mức> / To Do |
| Owner-agent / reviewer / cập nhật | <cụ thể> / Chưa phân công / YYYY-MM-DD |
| Input / dependency / write scope | <design/version> / <ID> / <paths> |
| Baseline / đọc tiếp | <commit/working tree> / <handoff hoặc QA report> |

## 1. Hiện trạng và mục tiêu

Source/module, vấn đề có bằng chứng, phạm vi hành vi giữ nguyên. Nếu đổi contract/scope, cập nhật thiết kế/confirmation theo phần bị tác động trước code.

## 2. Phương án và tác động

Before/after, consumer, migration/backup nếu cần; dependency và thứ tự tích hợp.

## 3. Kiểm chứng

| Loại / lệnh-bước / baseline | Kết quả | Evidence |
| :--- | :--- | :--- |
| Backend: regression trên PostgreSQL/Redis thật | Not Run | Chưa có |
| Frontend: build/browser Desktop/Mobile, không unit test | Not Run | Chưa có |
| Docs/contract review nếu liên quan | Not Run | Chưa có |

N/A có lý do cho phần không áp dụng; không mặc định tất cả Pass.

## 4. Bàn giao

Files, kiểm tra đã/chưa chạy, rủi ro, người nhận, step tiếp. In Review / Testing khi giao; Done sau reviewer/QA xác nhận.
