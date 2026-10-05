# TASK-352 — Làm rõ route list-state Web và rollout Mobile

| Trường | Giá trị |
| :--- | :--- |
| ID / scope / severity / trạng thái | TASK-352 / Sprint 03, developer docs / Medium / Done |
| Owner / reviewer / cập nhật | Codex điều phối / Singer / 2026-10-05 |
| Parent / dependency | [TASK-349](TASK-349_standardize_sdlc_and_developer_documentation.md) / Không có |
| Input | Finding Medium: quy định routes cho mọi màn nhưng helper chỉ trong Web; Mobile có routes riêng |
| Write scope | docs/08_developer_guides/coding_standards.md |
| Baseline / đọc tiếp | Working tree tài liệu 2026-10-05 / [REV-S03-004](../09_review/04_REV-S03-004_sdlc_workflow_review.md) |

## 1. Kết quả cần đạt

Phân biệt quy định Web, helper dùng giữa màn Web và hiện trạng/rollout Mobile. Dẫn TASK-348, yêu cầu thiết kế/item trước rollout; logic chia sẻ phải ở @shared, không import xuyên Web. Không tự đổi routes/source hoặc nghiệm thu phần Mobile.

## 2. Triển khai và kiểm chứng

Đã cập nhật mục 2.4 với nhãn Quy định/Hiện trạng/Mobile rollout. Singer xác nhận 2026-10-05: Accepted, finding resolved mức tài liệu; khớp source helper/routes, chỉ rõ query-param legacy và không import xuyên Web. Link checks tại REV-S03-004. Backend/browser N/A: thay đổi guide, không đổi sản phẩm.

## 3. Bàn giao

Người nhận Singer đã document-reviewed và Accepted; đủ tiêu chí để Done. TASK-348 vẫn quản lý rollout source thực tế; item này chỉ sửa cách hướng dẫn.
