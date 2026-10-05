# Đánh số và viết tài liệu cho người đọc

## 1. Thứ tự đọc, ID và phiên bản

Thứ tự đọc giúp hiểu dự án; ID dùng truy vết và giữ ổn định; phiên bản xác định nội dung được review/duyệt. Không đổi ID vì đổi thứ tự/sửa nội dung/rollover item.

Sprint-Pack giữ bước 00–09, tên cố định `00_READING_GUIDE.md`. Trong mỗi bước, file tài liệu mới: `<NN>_<ID>_<slug>.md`; NN là thứ tự đọc 01, 02…, slug ASCII snake_case. ID: `<TYPE>-S<XX>-<NNN>`; NNN tăng trong từng TYPE/sprint, không tái sử dụng. Ví dụ `06_designs/api/01_DES-API-S04-001_inventory_api.md`: bước 06, đọc 01, ID DES-API-S04-001. Ngày/phiên bản ghi metadata; một report của lần chạy mới có ID riêng.

| Bước | TYPE | Nội dung |
| :--- | :--- | :--- |
| 00 | READ, PLAN | Reading guide, kế hoạch |
| 01 | RAW | Yêu cầu gốc |
| 02 | ANL | Phân tích; US/BR là ID nội bộ |
| 03 | BENCH | Đối chuẩn |
| 04 | CONF | Scope, AC, approval |
| 05 | SOL, ADR | Phương án, quyết định |
| 06 | DES-ARCH, DES-DB, DES-API, DES-UI | Thiết kế |
| 07 | FEAT, TASK, BUG, REFACTOR | Quy tắc item bên dưới |
| 08 | TP, TR | Plan/report; TC là ID nội bộ |
| 09 | REV | Review/closure |

HANDOFF/TRACE đặt ở bước phát sinh, dùng cùng namespace sprint. ID nội bộ đầy đủ: `CONF-S04-001/AC-01`, `TP-S04-001/TC-01`; ngoài tài liệu luôn kèm ID cha/link. Số sprint tối thiểu 2 chữ số, không tạo pack trùng số. Thứ tự đọc không thay dependency triển khai.

NN được cấp trong thư mục chứa file (ví dụ API và DB mỗi thư mục bắt đầu 01). Reading guide ghép các thư mục thành lộ trình 06.01, 06.02… và là thứ tự chuẩn khi có file legacy. Khi chèn tài liệu, cập nhật thứ tự đọc tại index; chỉ đổi tên NN nếu cần và phải cập nhật toàn bộ caller, không đổi ID. Số thứ tự không giới hạn dải nghiệp vụ; trên 99 tài liệu dùng 3 chữ số nhất quán trong thư mục.

## 2. ID item và cấp số song song

Giữ mã toàn dự án `FEAT-<n>`, `TASK-<n>`, `BUG-<n>`, `REFACTOR-<n>`; tên `<ID>_<slug>.md`. Item đọc theo dependency/priority, không thêm NN. Số tăng theo TYPE toàn repo, không reset sprint, không cấp theo dải ngầm 1xx/2xx/3xx.

Điều phối kiểm tra cả ID file và task inline lịch sử, ghi reservation trong “Danh mục ID” của reading guide trước phân công. Agent nhận ID cụ thể/dải không trùng. ID bỏ dùng ghi Cancelled trong danh mục, không tái dùng; đây là reservation, không phải trạng thái item hoặc cách đóng High bug. FEAT chỉ link task con, mỗi task quản lý có file riêng.

## 3. Tương thích lịch sử

Không đổi mã item/rename hàng loạt/viết lại sign-off. Các tên `RAW-01_...`, `CORE_IAM_API_SPEC.md`, `test_plan.md`, `sprint_plan.md`, `sprint_review.md` giữ làm tên legacy hợp lệ qua reading guide.

Tham chiếu legacy xuyên sprint ghi `S03/RAW-01`, `S02/DES-02-API` kèm link. Đây là alias phạm vi, không phải ID mới. Index dùng 01.01, 06.02… làm thứ tự; QA-01 plan/report ghi loại/đường dẫn riêng. Template cũ trong sprint không được tính artifact đã hoàn thành.

Migration tên nếu được yêu cầu: mapping old→new, cập nhật link/anchor, giữ ID/lịch sử, kiểm tra tham chiếu trước bỏ path cũ. Có quy tắc mới không đồng nghĩa đã migrate lịch sử.

Docs toàn cục mới dùng `<NN>_<slug>.md`, metadata `<AREA>-<TYPE>-<NNN>` như DEV-OVERVIEW-001. Guide cũ giữ tên, đánh thứ tự tại reading guide. Templates/rules/skill không cần ID sprint.

## 4. Metadata và trạng thái

Tài liệu mới/viết lại đáng kể có bảng đầu trang:

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint hoặc phạm vi | Định danh, nơi áp dụng |
| Trạng thái / phiên bản / cập nhật | Draft, In Review, Reviewed, Approved, Superseded; 1.0; ngày ISO |
| Owner / reviewer | Vai trò và người/agent cụ thể; tự review ghi Self-reviewed |
| Đầu vào | Link + ID/phiên bản |
| Đọc trước / đọc tiếp | Link có nhãn mục đích |

Reviewed là kiểm tra nội dung; Approved cần người có quyền/nguồn/phiên bản cụ thể. Trạng thái tài liệu/item/test/sprint/handoff riêng biệt: TR được Reviewed vẫn có test Fail. Template mặc định Draft, test Not Run, gate Pending, không điền sẵn PASS/0 lỗi.

Đổi scope/contract tăng phiên bản và lịch sử; sửa link/chính tả ghi update/bản nhỏ, không xin lại scope. Approval bản cũ không duyệt scope mới. Dùng Superseded + link bản thay thế khi có quyết định thay thế.

## 5. Cách viết cho developer con người

Mở đầu giải thích vấn đề, phạm vi, kiến thức cần trước và người đọc làm được gì sau. Tiếng Việt rõ ràng, giải thích thuật ngữ lần đầu; giữ tên code/API/enum để tra repo.

Trình tự: bối cảnh → scope/ngoại lệ → nghiệp vụ/flow → quyết định/lý do → contract → ví dụ → lỗi/rủi ro → triển khai/kiểm chứng → vấn đề mở/bước tiếp. Giữ mục áp dụng, N/A có lý do; không coi dấu “...” trong template là thiết kế đủ code.

Phân biệt **Quy định**, **Đã triển khai**, **Đã kiểm chứng**, **Đề xuất**, **Chưa kiểm chứng**. Blueprint là kiến trúc mục tiêu, không tự là hệ thống chạy thật. Dẫn code/config/evidence cạnh nhận định; người mới không phải đọc toàn bộ log để tìm quyết định hiện hành.

- DB: bảng/cột/ràng buộc, tenant/RLS, index, migration/backup/rollback/registry.
- API: method/path/auth/permission/tenant, request, 4 response chuẩn, code/params, side effects, ví dụ.
- UI: hành trình/loading/empty/error, shared/i18n/enums, Drawer/routes, Web/Mobile và tiêu chí browser.
- Dev guide: repo map, một request qua code, môi trường/lệnh thật/kết quả kỳ vọng, nhận item/bàn giao.
- Report: baseline/môi trường/thời điểm/lệnh, actual/expected, Pass/Fail/Blocked/Not Run và link ảnh/log. Smoke check không chứng minh sprint Pass.

Heading dài đánh 1, 1.1…; bảng cho mapping/contract, sơ đồ cho flow; hình có nguồn/chú thích. Repo links relative từ file chứa link, không dùng path máy cá nhân. Snippet có nhãn ví dụ, không thay đặc tả; không token/mật khẩu thật/dữ liệu cá nhân.

## 6. Lộ trình và review

docs/README dẫn theo đối tượng. Dev mới: Developer Reading Guide → walkthrough → môi trường → quy chuẩn → sprint mục tiêu (CONF→SOL→DES→item→QA/review). Lịch sử: Sprint 01→02→03, từng pack 00→09. Khách hàng: 01→04, 08→09.

Reading guide có bảng thứ tự/link file thật/ID hoặc alias/mục đích/owner; gate có nguồn; dependency sprint; ID reservations; backlog/QA/review. Thêm file cập nhật index trước giao, không chỉ link thư mục để người đọc tự đoán.

Reviewer kiểm tra link/ID/bản hiện hành/nguồn gate, truy vết scope→design→item→test, nhãn chưa kiểm chứng, lệnh trùng config; người không biết chat vẫn đọc hiểu. Document review không thay product acceptance.

Kiểm tra tự động: `node .agents/skills/sdlc-workflow/scripts/check-docs.mjs` quét entrypoints và reading guides tất cả sprint. Truyền file/thư mục để quét phạm vi khác; kiểm local links/anchors, ID metadata chuẩn trong phạm vi và trùng file item toàn repo. Không thay đối soát task inline, approval/QA hay tính đúng nội dung.
