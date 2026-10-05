# [BUG-n] Lỗi phát hiện

| Trường | Giá trị |
| :--- | :--- |
| ID / sprint theo dõi / sprint nguồn | BUG-n / Sprint XX / <nếu khác> |
| Severity / trạng thái | <mức và lý do hệ quả> / To Do |
| Reporter / owner-agent / reviewer | <cụ thể> / <cụ thể> / <QA> |
| Cập nhật / baseline / môi trường | YYYY-MM-DD / <commit/working tree> / <môi trường> |
| Input / dependency / write scope | <AC/DES link/version> / <ID> / <paths> |

## 1. Hiện tượng và hệ quả

Module bị ảnh hưởng, tính tái hiện, workaround nếu có. Phân biệt lỗi đã xác nhận và phần thiếu bằng chứng.

## 2. Tái hiện

1. <điều kiện đầu vào, tài khoản/tenant test không có bí mật>
2. <thao tác/request>
3. <quan sát>

## 3. Actual và expected

Actual kèm log/ảnh; expected dẫn AC/contract. Bug sprint đã đóng theo dõi sprint hiện hành, giữ link nguồn.

## 4. Sửa và re-test

| Lần / baseline / môi trường / lệnh-bước | Actual / expected | Kết quả | Evidence / QA / ngày |
| :--- | :--- | :--- | :--- |
| <lần 1> | <quan sát> | Not Run | Chưa có |

Developer sửa xong chuyển In Review / Testing; Resolved/Fixed không tự là Done. QA re-test và regression liên quan xác nhận trước Done. Re-test Fail → In Progress; giữ kết quả cũ. Frontend không viết unit test; backend không H2.

## 5. Bàn giao

File đổi, người nhận, blockers và bước tiếp. Nếu Deferred: chỉ Medium/Low, ghi lý do/đích/owner nhận.
