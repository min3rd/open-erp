# [BUG-70] Tổng Hợp Lỗi Nhất Quán Tài Liệu Mức Thấp (Bảng, Link, DB User, HTTP, Thuật Ngữ)

- **Mã Lỗi**: BUG-70
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [ ] Medium / [x] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Nhiều lỗi nhỏ về số liệu, link, tên DB user, mã HTTP, thuật ngữ và trùng mã tài liệu gây khó theo dõi/nghiệm thu.

- **Môi trường**: Tài liệu Sprint + Source (Local)
- **Bằng chứng (file:line)**:
  - `../00_READING_GUIDE.md:45` — đã sửa thành "11 bảng mới", khớp 11 `CREATE TABLE` của DES-DB.
  - `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md:13` — link `../../../../.agents/rules/api_standards.md` thiếu 1 cấp thư mục (link hỏng).
  - `../05_solutions/SOL-01_superadmin_architecture_and_security.md:92` — dùng DB user `openerp_app_user` không tồn tại; thực tế `openerp` (`docker-compose.yml:9`).
  - `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md:367-369` — API tạo mới trả 200, nên chuẩn hóa 201.
  - `../05_solutions/SOL-02_rbac_and_data_scope_enforcement_engine.md:171` — "Pub/Sub hoặc Kafka" chưa chốt; `:114` OWN_ONLY thiếu `assignee_id` (ANL-02:122 có); `:119-121` CREATE thiếu rule NONE/OWN/ALL; `:137` ghi "DFS" nhưng code dùng Queue (BFS).
  - Mã tài liệu trùng trong cùng sprint (SOL-01/02, REV-02, TEST-02, DES-02-*) cần ghi chú phạm vi.
  - `../09_review/sprint_review_template.md` thiếu mục Deferred items/Retrospective.
- **Tài Liệu Đối Chiếu**: `AGENTS.md`; `.agents/rules/api_standards.md`; DES-02-DB.

## 2. Tác Động
- Sai số liệu/hướng dẫn gây nhầm lẫn khi implement và nghiệm thu; link hỏng làm mất khả năng tra cứu chuẩn API.

## 3. Kết Quả Kỳ Vọng
- Sửa toàn bộ điểm trên: đúng 11 bảng, link hợp lệ, DB user `openerp`, 201 cho tạo mới, chốt Redis Pub/Sub, bổ sung `assignee_id`/CREATE rules, sửa thuật ngữ BFS, ghi chú phạm vi mã tài liệu, bổ sung mục Deferred/Retrospective.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [x] Toàn bộ điểm nêu trên đã được sửa.
- [x] Link markdown kiểm tra không còn hỏng.
- [x] QA/PM xác nhận tài liệu nhất quán.

- **Ghi chú QA (2026-09-18)**: Đã sửa toàn bộ điểm low (11 bảng tại 00_READING_GUIDE:45, link 5 cấp, 201 Created, Redis Pub/Sub, assignee_id/CREATE rules, BFS, `sprint_review.md` + Deferred/Retrospective); DB role `openerp` (dev) / `openerp_app` (prod khuyến nghị) đã ghi rõ tại SOL-01; hoàn tất.
