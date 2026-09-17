# Nhật Ký Hoạt Động & Cập Nhật Công Việc (Work Log)

Tài liệu này ghi nhận lại toàn bộ tiến độ thực hiện từng công đoạn của các Agent theo thời gian thực. Phụ trách: **PM Agent**.

---

## 2026-09-17
- **Người thực hiện**: Antigravity Agent
- **Giai đoạn**: Khởi tạo quy trình (Setup SDLC Foundation)
- **Nội dung công việc**:
  - Thiết lập quy tắc cốt lõi `sdlc_process.md` tại `.agents/rules/` yêu cầu tuân thủ nghiêm ngặt 9 bước phát triển phần mềm.
  - Thiết lập Playbook kỹ năng `sdlc-workflow` tại `.agents/skills/sdlc-workflow/SKILL.md` định nghĩa 5 Agent Personas (BA, Architect, Dev, QA, PM).
  - Khởi tạo toàn bộ cấu trúc thư mục tài liệu `docs/` gồm 5 giai đoạn chính và các template mẫu chuẩn cho từng bước.
  - Tạo file điều phối `AGENTS.md` tại thư mục gốc của dự án.
- **Tài liệu tham chiếu**:
  - [AGENTS.md](../../AGENTS.md)
  - [.agents/rules/sdlc_process.md](../../.agents/rules/sdlc_process.md)
  - [.agents/skills/sdlc-workflow/SKILL.md](../../.agents/skills/sdlc-workflow/SKILL.md)
  - [docs/README.md](../README.md)

- **Cập nhật mở rộng Agile**:
  - Bổ sung nguyên tắc phát triển theo mô hình Agile / Sprint.
  - Thiết lập cơ chế quản lý mọi task, bug, feature, refactor thành từng file độc lập để tránh bỏ sót.
  - Thiết lập ràng buộc nghiêm ngặt đóng Sprint (Sprint Closure DoD Gate): Không còn item nào > Medium (`Critical`, `High`) chưa giải quyết.
  - Tạo bộ biểu mẫu Agile trong `docs/05_project_management/templates/` (Task, Bug, Feature, Refactor, Sprint Plan, Sprint Review).

