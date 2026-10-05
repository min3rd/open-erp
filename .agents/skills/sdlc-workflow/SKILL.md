---
name: sdlc-workflow
description: Thực hiện hoặc review SDLC hướng tài liệu của open-erp, điều phối BA/Architect/Developer/QA/PM, quản lý sprint, bàn giao và nghiệm thu; dùng khi phát triển hoặc chuẩn hóa quy trình của dự án.
---

# SDLC workflow cho Open-ERP

Skill hướng dẫn thực thi; quy định được duy trì trong `.agents/rules/`. Không sao chép tech stack, API contract và UI standards vào skill thành nhiều nguồn khác nhau.

## 1. Đọc đầu vào và chọn phạm vi

1. Đọc [Master Index](../../rules/sdlc_process.md), [Core SDLC](../../rules/core_sdlc.md), [Phối hợp agent](../../rules/agent_collaboration.md), [Chuẩn tài liệu](../../rules/documentation_standards.md).
2. Xác định việc: tính năng mới, sửa lỗi trong phạm vi đã duyệt, review, tài liệu/quy trình. Review và chỉnh tài liệu theo yêu cầu làm ngay; không tự tạo approval hoặc đóng sprint sản phẩm.
3. Chọn Sprint-Pack, đọc `00_READING_GUIDE.md`, confirmation, thiết kế và item. Sửa lỗi sprint đã đóng theo dõi trong sprint hiện hành, link sprint nguồn; không tạo sprint mới chỉ để đọc lịch sử.
4. Đọc quy tắc vai trò/lĩnh vực cần dùng từ Master Index. Kiểm tra nguồn gốc/bằng chứng, không coi summary cũ là trạng thái hiện tại.

## 2. Điều phối và bàn giao

Một agent điều phối giữ quyền ghi index, task board, nhật ký và cấp ID. Phân công gói việc có input, output, phạm vi file và tiêu chí riêng. Dự án cho phép giao agent phần việc độc lập. Nếu không có subagent, làm tuần tự theo vai trò và ghi `Self-reviewed` đúng thực tế, không giả lập reviewer độc lập.

Làm việc trên đường găng tại agent điều phối; giao phần độc lập chạy song song. Không giao hai agent cùng sửa file/cấp ID/đổi contract. Chat thông báo tiến độ; tài liệu repo là đầu vào bàn giao có thể kiểm chứng.

| Chặng | Vai trò | Artifact bàn giao | Điều kiện chuyển |
| :--- | :--- | :--- | :--- |
| 00–04 | BA, PM | Reading guide, RAW/ANL/BENCH/CONF | Scope/AC được khách hàng xác nhận có nguồn |
| 05–06 | Architect | SOL, quyết định, thiết kế DB/API/UI | Đủ triển khai, review kỹ thuật, không còn blocker |
| 07 | Developer | Item riêng, code, kiểm tra dev, docs | Chuyển In Review / Testing; có baseline và cách kiểm chứng |
| 08 | QA | Test plan/report, bằng chứng, bug riêng | AC được kiểm chứng; chưa chạy ghi Not Run/Blocked |
| 09 | PM | Review, backlog, guides, quyết định | Đạt DoD; tách quyết định PM và nghiệm thu khách hàng |

Dùng [HANDOFF_TEMPLATE](../../../docs/system/templates/HANDOFF_TEMPLATE.md) cho bàn giao nhiều artifact; gói nhỏ ghi mục bàn giao trong item. Dùng [READING_GUIDE_TEMPLATE](../../../docs/system/templates/READING_GUIDE_TEMPLATE.md), [DOCUMENT_TEMPLATE](../../../docs/system/templates/DOCUMENT_TEMPLATE.md), [TRACEABILITY_TEMPLATE](../../../docs/system/templates/TRACEABILITY_TEMPLATE.md) khi tạo tài liệu tương ứng.

## 3. Triển khai và thay đổi

- Mỗi việc quản lý độc lập có file item, ID, owner, severity, dependency. FEAT dẫn link TASK; checklist thao tác trong TASK không phải item khác.
- Sửa lỗi đã có AC/thiết kế dùng gate hiện có. Đổi scope/AC: BA cập nhật confirmation và xác nhận phần thay đổi, Architect cập nhật thiết kế bị tác động trước code.
- Developer báo thay đổi contract dùng chung, không tự đổi trong gói được giao mà bỏ qua consumer.
- Backend tests chạy PostgreSQL/Redis thật, không H2. Frontend không viết unit/component test; QA browser Desktop và Mobile Ionic emulation theo [QA rules](../../rules/agent_qa.md).
- Hạ tầng tối thiểu: `npm run infra`; bật profile phụ trợ theo nhu cầu. Lệnh/cấu hình cụ thể lấy từ root `package.json`, `scripts/run.mjs` và deployment guides.

## 4. Review và kết thúc phiên

1. Findings có nguồn, mức độ, hệ quả, hành động; phân biệt lỗi xác nhận với phần thiếu bằng chứng.
2. Ghi từng việc cần xử lý thành item, tránh trùng item có sẵn. Review docs không thay QA sản phẩm.
3. Kiểm tra file/link/ID, trạng thái và truy vết AC; cập nhật reading guide/task board/work log/changelog đúng phạm vi.
   Chạy `node .agents/skills/sdlc-workflow/scripts/check-docs.mjs` cho entrypoints/templates/onboarding; có thể truyền đường dẫn Markdown/thư mục để kiểm tra phạm vi khác. Script kiểm local links/heading anchors và trùng ID file item; không xác nhận approval, test Pass hoặc task inline đã đủ file.
4. Bàn giao baseline (commit hoặc working tree + danh sách file), kiểm tra đã/chưa chạy, hạn chế và việc tiếp theo. Không dùng Done/PASS/Approved/Closed chỉ vì đã viết code.

Developer mới bắt đầu tại [docs/README.md](../../../docs/README.md) → [Developer Reading Guide](../../../docs/08_developer_guides/00_READING_GUIDE.md). Sprint-Pack lưu lịch sử/thiết kế từng sprint; developer guides giải thích dự án xuyên sprint.



