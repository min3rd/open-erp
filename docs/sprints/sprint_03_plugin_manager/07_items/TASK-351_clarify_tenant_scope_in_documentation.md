# TASK-351 — Làm rõ phạm vi tenant và auth/platform toàn cục

| Trường | Giá trị |
| :--- | :--- |
| ID / scope / severity / trạng thái | TASK-351 / Sprint 03, workflow docs / Medium / Done |
| Owner / reviewer / cập nhật | Codex điều phối / Singer / 2026-10-05 |
| Parent / dependency | [TASK-349](TASK-349_standardize_sdlc_and_developer_documentation.md) / Không có |
| Input | Finding Medium của review độc lập: câu “mọi query phải tenant_id” mâu thuẫn auth trước workspace và User toàn cục |
| Write scope | AGENTS.md; Architect rules/Master Index; docs README; coding standards |
| Baseline / đọc tiếp | Working tree tài liệu 2026-10-05 / [REV-S03-004](../09_review/04_REV-S03-004_sdlc_workflow_review.md) |

## 1. Kết quả cần đạt

Phân loại dữ liệu tenant và auth/platform toàn cục; giữ tenant isolation cho đọc/ghi/cache/message, quyền/audit tương ứng cho platform. Thu hẹp yêu cầu test A/B theo dữ liệu được service xử lý. Không sửa source/contract hoặc tạo ngoại lệ cho truy vấn dữ liệu tenant.

## 2. Triển khai và kiểm chứng

Đã đồng bộ các nguồn trong write scope, dựa trên User/onboarding được dẫn trong walkthrough. Singer xác nhận 2026-10-05: Accepted, finding resolved mức tài liệu; tenant context/phân quyền/audit giữ nguyên, auth toàn cục không bị thêm filter sai. Link/ID checks tại REV-S03-004. Backend/browser N/A: docs-only clarification.

## 3. Bàn giao

Người nhận Singer đã document-reviewed và Accepted; đủ tiêu chí để Done. Re-test sản phẩm ngoài phạm vi, không quy kết document review thành product QA.
