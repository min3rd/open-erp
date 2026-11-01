# [RAW-S07-001] Yêu cầu gốc — Plugin Employee (Hồ sơ nhân viên & Tự phục vụ)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | RAW-S07-001 / Raw notes / Sprint 07 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-29 |
| Owner / reviewer | BA Agent / Chủ dự án (nguồn yêu cầu) |
| Nguồn | Chỉ đạo trực tiếp của chủ dự án trong phiên làm việc 2026-10-29 |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) / [ANL-S07-001](../02_analysis/01_ANL-S07-001_employee_identity_and_data_model.md), [CONF-S07-001](../04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md) |

> Ghi nguyên văn yêu cầu, **không diễn giải** ở bước này. Phân tích ở `02_analysis/`; chốt scope/AC ở `04_confirmation/`.

## 1. Nguyên văn yêu cầu

> bắt đầu viết tài liệu cho sprint 7: plugin employee. Plugin này định nghĩa thân phân nhân viên của 1 tài khoản với tenant. Plugin này quản lý các thông tin nhân viên của người dùng. Plugin cung cấp 2 giải pháp: 1 là quản ký nhân viên của tenant, chi nhánh; 2 là nhân viên tự quản lý thông tin của cá nhân mình. Hãy tham khảo các phần mềm khác và tạo các câu hỏi để mình làm rõ thiết kế plugin này

**Ghi chú nguyên văn:** “thân phân” = “thân phận”; “quản ký” = “quản lý”. Giữ nguyên lỗi chính tả trong quote để bảo toàn nguồn.

**Bổ sung 2026-10-30 (nguyên văn):**

> sprint 7 thêm cả plugin chi nhánh/phòng ban tách ra khỏi core cho độc lập

> plugin employee cần thêm tính năng switch tenant đang làm việc cho tài khoản ở header của giao diện

## 2. Bóc tách yêu cầu (chỉ liệt kê, chưa quyết)

| # | Yêu cầu nguyên văn | Loại | Ghi chú của BA |
| :--- | :--- | :--- | :--- |
| R1 | “định nghĩa thân phận nhân viên của 1 tài khoản với tenant” | Mô hình dữ liệu | Cần tách **tài khoản (user)**, **thành viên tenant (membership)** và **nhân viên (employee)**; cần chốt quan hệ 1–1/1–n và có bắt buộc tài khoản không |
| R2 | “quản lý các thông tin nhân viên của người dùng” | Chức năng/dữ liệu | Cần chốt nhóm trường v1: định danh, liên hệ, công việc, giấy tờ, thuế/BHXH, ngân hàng, học vấn, hợp đồng, tài liệu… |
| R3 | “quản lý nhân viên của tenant, chi nhánh” | Chức năng/phân quyền | Cần danh sách, tạo/sửa, gán tổ chức, trạng thái, tìm kiếm/lọc; phạm vi Tenant vs Chi nhánh dùng data scope Core |
| R4 | “nhân viên tự quản lý thông tin của cá nhân mình” | Chức năng/self-service | Cần xem/sửa hồ sơ của chính mình; cần chốt trường được sửa, có duyệt hay áp dụng ngay, Web/Mobile |
| R5 | “tham khảo các phần mềm khác” | Nghiên cứu | Đối chuẩn Odoo, ERPNext, SAP, Workday, BambooHR, Personio, Zoho, MISA, Base… |
| R6 | “tạo các câu hỏi để mình làm rõ thiết kế” | Quy trình | Câu hỏi phải quyết định được mô hình/scope, có khuyến nghị để chủ dự án trả lời nhanh |
| R7 | “2 giải pháp: 1 là quản lý…; 2 là nhân viên tự quản lý…” | Phạm vi | Hiểu là **hai chế độ vận hành** (HR Admin và Self-Service), không phải hai phương án loại trừ nhau |
| R8 | “sprint 7 thêm cả plugin chi nhánh/phòng ban tách ra khỏi core cho độc lập” (bổ sung 2026-10-30) | Kiến trúc/plugin | Tách `branches`, `departments` (và có thể cả membership/assignment) khỏi Core thành plugin `organization`; ảnh hưởng data scope/RBAC |
| R9 | “plugin employee cần thêm tính năng switch tenant đang làm việc cho tài khoản ở header của giao diện” (bổ sung 2026-10-30) | Chức năng/UX | Chuyển tenant ngay trên header; tác động JWT, session, quyền, cache, plugin runtime — không chỉ là đổi nhãn |

## 3. Hàm ý kiến trúc đã biết (không cần khách chốt lại)

- **Multi-tenant**: mọi dữ liệu nhân viên thuộc tenant phải dùng `tenant_id` từ context đã xác thực; không tin `tenant_id` client gửi. Một user có thể thuộc nhiều tenant nhưng hồ sơ HR không được rò rỉ chéo.
- **Core tối giản**: tài khoản, tenant membership, phân quyền, data scope, plugin manager, Entity Registry thuộc Core. Nghiệp vụ HR nằm trong plugin `employee`, không đưa vào Core.
- **Plugin độc lập zero-DB**: plugin sở hữu schema riêng, khai báo `plugin.json` 2.0, migration/checksum, Entity Registry; tham chiếu `users`, `branches`, `departments` bằng **soft ref**, không join xuyên schema.
- **Cơ cấu tổ chức hiện hữu**: `branches`, `departments`, `user_department_memberships` (branch, department, direct manager, title, primary), chống chu trình quản lý. Không tạo cây tổ chức thứ hai trong plugin.
- **Catalog hiện hữu**: đã seed Chức danh, Phòng ban, Loại hợp đồng, Ca làm việc, Trình độ học vấn từ Sprint 05. Catalog “Phòng ban” **không** phải cây tổ chức.
- **API**: 4 khuôn mẫu phản hồi, `code` UPPER_SNAKE_CASE, không message tiếng Việt trong payload; i18n ở frontend.
- **UI/UX**: Angular ≥22 + Tailwind 4, shared component-first, không modal (Drawer/route/split), mật độ cao, i18n 100%, enum dùng chung; Mobile Ionic tối giản.
- **Kiểm thử**: backend JUnit 5 + RestAssured trên PostgreSQL/Redis thật, cấm H2; frontend không viết unit test; QA browser desktop + mobile 390×844.

## 4. Câu hỏi mở (chuyển sang phân tích/xác nhận)

Các câu hỏi được nhóm và đánh số đầy đủ tại [CONF-S07-001 §4](../04_confirmation/01_CONF-S07-001_sprint_07_scope_and_questions.md). Ưu tiên chốt trước:

1. **Q1–Q2**: Mọi tài khoản tenant có phải nhân viên? Có hỗ trợ nhân viên không có tài khoản không?
2. **Q5**: Nguồn sự thật cho chi nhánh/phòng ban/chức danh/quản lý trực tiếp là Core organization hay plugin employee?
3. **Q13**: Nhóm dữ liệu nào thuộc v1 (định danh, liên hệ, công việc, giấy tờ, thuế/BHXH, ngân hàng, học vấn, hợp đồng…)?
4. **Q20–Q22**: Nhân viên được sửa trường nào; áp dụng ngay hay gửi HR duyệt; ai duyệt?
5. **Q26–Q27**: Vai trò/quyền theo tenant/chi nhánh; trường nhạy cảm ai được xem?
6. **Q30**: Danh sách must-have ngoài đề xuất, để chốt scope Sprint 07.
7. **Q39–Q46**: Tách plugin `organization` khỏi Core — phạm vi, nguồn phân công, data scope, migration, quyền/API/registry.
8. **Q47–Q52**: Switch tenant trên header — vị trí Core/shared, cơ chế token, session, UX, invalidate cache.
9. **Q53–Q55**: Hai lớp assignment, non-employee scope, offboarding guard owner/admin cuối.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Ghi nhận nguyên văn yêu cầu + bóc tách R1–R7; nêu ràng buộc và câu hỏi ưu tiên | BA Agent; nguồn: chỉ đạo trực tiếp chủ dự án |
| 0.2 | 2026-10-30 | Bổ sung R8 (tách plugin organization) + R9 (switch tenant header); câu hỏi Q39–Q52 | BA Agent; yêu cầu trực tiếp chủ dự án |
