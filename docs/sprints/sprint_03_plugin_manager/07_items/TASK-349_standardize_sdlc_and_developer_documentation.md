# TASK-349 — Chuẩn hóa SDLC và tài liệu cho developer

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-349 / Documentation & Process / Sprint 03 |
| Severity / trạng thái | Medium / Done |
| Owner / reviewer | Codex điều phối / Singer (review độc lập), Anscombe (review rules ban đầu) |
| Ngày / nguồn | 2026-10-04 / User yêu cầu review workflow, phối hợp agent, đánh số và viết docs cho dev con người |
| depends_on / blocks | TASK-351, TASK-352 (đã document-reviewed) / Không thay đổi gate sản phẩm |
| Write scope | AGENTS.md; .agents/rules và skill sdlc-workflow; docs indexes/templates/developer guides/project_management; báo cáo review này |
| Baseline | Working tree sạch trước phiên; diff tài liệu của phiên này |
| Đọc trước / đọc tiếp | [Core SDLC](../../../../.agents/rules/core_sdlc.md) / [Workflow review](../09_review/04_REV-S03-004_sdlc_workflow_review.md) |

## 1. Phạm vi

Review và sửa quy tắc, templates, indexing/onboarding. Duy trì guardrails kỹ thuật, IDs/paths và sign-off lịch sử; không audit/QA lại sản phẩm hoặc đóng Sprint 03.

## 2. Tiêu chí

- [x] Một nguồn chuẩn cho phối hợp, IDs, trạng thái/gate và cách viết.
- [x] Input/output, owner/write scope, dependencies, baseline, handoff, người nhận rõ ràng.
- [x] Template không mặc định PASS hoặc yêu cầu frontend unit test.
- [x] Dev mới có lộ trình đọc và repo/request walkthrough bám source.
- [x] Sprint 01–03 có thứ tự đọc file rõ, aliases legacy và nguồn gate.
- [x] Kiểm tra link/IDs, skill validator và review tình huống độc lập; ghi giới hạn.

## 3. Kiểm chứng và bàn giao

Hoàn tất 2026-10-05. Singer review độc lập bốn tình huống và ví dụ Java/Angular; hai finding Medium được sửa tại TASK-351/352, reviewer xác nhận resolved mức tài liệu. Checker links/anchors/IDs, skill validator và diff checks có evidence tại [REV-S03-004](../09_review/04_REV-S03-004_sdlc_workflow_review.md). Backend/UI checks N/A: chỉ sửa tài liệu/quy trình. Việc đối soát hồ sơ lịch sử riêng tại TASK-353, không thuộc tiêu chí tạo mới workflow của item này.
