# [00] Sprint XX — <mục tiêu>

| Trường | Giá trị |
| :--- | :--- |
| ID / phiên bản / cập nhật | READ-SXX-001 / 0.1 / YYYY-MM-DD |
| Trạng thái tài liệu / sprint | Draft / Discovery |
| Owner / reviewer | <PM/BA cụ thể> / Chưa review |
| Đầu vào / đọc trước / đọc tiếp | <nguồn yêu cầu> / <sprint phụ thuộc> / <RAW link> |

## 1. Đọc để hiểu gì?

Mục tiêu, scope, dependency sprint, link Developer Reading Guide cho người mới. Giữ tên file 00_READING_GUIDE.md; tài liệu khác theo chuẩn đánh số.

## 2. Lộ trình đọc

Khách hàng đọc 01–04 và 08–09. Developer đọc scope CONF, SOL, DES, item, QA/review; muốn lịch sử đầy đủ đọc 01–09.

| Thứ tự | ID/alias | Link file | Nội dung/câu hỏi được giải đáp | Owner |
| :--- | :--- | :--- | :--- | :--- |
| 01.01 | <RAW> | <file> | Yêu cầu gốc | BA |
| 02.01 | <ANL> | <file> | Phân tích/rules | BA |
| 03.01 | <BENCH> | <file> | Đối chuẩn | BA |
| 04.01 | <CONF> | <file> | Scope/AC/nguồn approval | BA/khách hàng |
| 05.01 | <SOL> | <file> | Giải pháp/lý do | Architect |
| 06.01 | <DES-ARCH> | <file> | Kiến trúc/flow | Architect |
| 06.02 | <DES-DB> | <file> | DB/tenant/migration | Architect |
| 06.03 | <DES-API> | <file> | API/auth/errors | Architect |
| 06.04 | <DES-UI> | <file> | UI/Web-Mobile | Architect |
| 07.01 | <FEAT/TASK> | <file> | Dependency và scope code | Developer |
| 08.01 | <TP> | <file> | Test cases/truy vết AC | QA |
| 08.02 | <TR> | <file> | Kết quả có baseline/evidence | QA |
| 09.01 | <REV> | <file> | DoD/backlog/closure | PM |

Chưa có artifact ghi “Chưa tạo” với owner, không tạo link giả. Liệt kê từng file trong mỗi bước, không chỉ thư mục.

## 3. Gate riêng biệt

| Gate | Trạng thái | Người quyết định | Nguồn/phiên bản/ngày |
| :--- | :--- | :--- | :--- |
| Scope approval | Pending | Khách hàng | Chưa có |
| Design ready | Pending | Architect/reviewer | Chưa có |
| QA sign-off | Pending | QA | Chưa có |
| PM đánh giá DoD | Pending | PM | Chưa có |
| Customer acceptance | Pending | Khách hàng | Chưa có |
| Closure | Pending | PM sau nghiệm thu | Chưa có |

## 4. Danh mục ID và việc chuyển tiếp

| TYPE/ID | File hoặc reservation | Owner | Tình trạng cấp số |
| :--- | :--- | :--- | :--- |
| <ID> | <file/reserved> | <writer> | Reserved/Used/Cancelled |

Link backlog/traceability/handoff/guides; chưa có sprint đích thì backlog có owner tại review nguồn. Không tái sử dụng ID.
