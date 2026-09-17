# Project Guidelines & Agent Instructions

Dự án này áp dụng quy trình phát triển phần mềm chuẩn mực 9 bước với mô hình **Multi-Agent hướng tài liệu (Docs-driven SDLC)**.

Tất cả các Agent khi tham gia vào dự án này bắt buộc phải tuân thủ nghiêm ngặt các quy tắc trong:
- Quy tắc cốt lõi: [.agents/rules/sdlc_process.md](.agents/rules/sdlc_process.md)
- Playbook kỹ năng: [.agents/skills/sdlc-workflow/SKILL.md](.agents/skills/sdlc-workflow/SKILL.md)
- Cấu trúc tài liệu dự án: [docs/README.md](docs/README.md)

## Tóm Tắt Quy Trình Bắt Buộc:
1. **Nhận yêu cầu truyền miệng** (`docs/01_requirements/raw_notes/`) - Phụ trách: BA Agent
2. **Phân tích yêu cầu** (`docs/01_requirements/analysis/`) - Phụ trách: BA Agent
3. **Tham khảo phần mềm tương tự** (`docs/01_requirements/benchmarks/`) - Phụ trách: BA Agent
4. **Xác nhận với khách hàng** (`docs/01_requirements/confirmations/`) - Phụ trách: BA Agent
5. **Nghiên cứu giải pháp** (`docs/02_solutions/`) - Phụ trách: Solution Architect
6. **Thiết kế giải pháp chi tiết** (`docs/03_designs/`) - Phụ trách: Solution Architect
7. **Lập trình** (`src/`) - Phụ trách: Developer Agent
8. **Kiểm thử** (`docs/04_testing/`) - Phụ trách: QA/QC Agent
9. **Cập nhật công việc** (`docs/05_project_management/`) - Phụ trách: PM Agent

## Ràng Buộc Agile & Quản Lý Sprint (Agile Sprint Guardrails):
- **Phân kỳ theo Sprint**: Dự án được bóc tách và triển khai theo từng Sprint nhỏ với mục tiêu và phạm vi rõ ràng.
- **Quản lý Item dưới dạng file (File-based Tracking)**: Trong suốt quá trình phát triển, các agent luôn phải chủ động phát hiện và bổ sung các `task`, `bug`, `feature`, `refactor`... Mọi yêu cầu hay lỗi đều **phải được tạo thành file riêng** có trạng thái quản lý để tránh bỏ sót.
- **Điều kiện đóng Sprint (Sprint DoD Gate)**: **1 Sprint CHỈ CÓ THỂ ĐÓNG khi KHÔNG CÒN các task, bug, issue ở mức độ nghiêm trọng LỚN HƠN MEDIUM** (nghĩa là 100% item mức `Critical` và `High` phải được xử lý xong).

> **NGHIÊM CẤM**:
> 1. Nhảy cóc trực tiếp sang bước Lập trình khi chưa có xác nhận từ khách hàng và tài liệu thiết kế chi tiết trong thư mục `docs/`.
> 2. Đóng Sprint hoặc bàn giao release khi vẫn còn tồn đọng task/bug ở mức `Critical` hoặc `High`.
