# [RAW-S05-001] Yêu cầu gốc — Plugin core "Danh mục & quản trị danh mục"

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | RAW-S05-001 / Raw notes / Sprint 05 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-06 |
| Owner / reviewer | BA Agent / Chủ dự án (nguồn yêu cầu) |
| Nguồn | Chỉ đạo trực tiếp của chủ dự án trong phiên làm việc 2026-10-06 ("Viết tài liệu cho sprint 5 — Sprint 5 Tạo Plugin core đầu tiên là Danh mục và quản trị danh mục") |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) / [ANL-S05-001](../02_analysis/01_ANL-S05-001_catalog_data_model_problems.md) |

> Ghi nguyên văn yêu cầu, **không diễn giải** ở bước này. Phân tích ở `02_analysis/`; chốt scope/AC ở `04_confirmation/`.

## 1. Nguyên văn yêu cầu

> **Sprint 5** — Tạo Plugin core đầu tiên là **Danh mục và quản trị danh mục**:
> - Thiết kế cấu trúc dữ liệu để giải quyết các bài toán sau:
> - Các danh mục có quan hệ cha con như tỉnh - huyện - xã.
> - Có quan hệ cha con nhiều chiều như Tỉnh -> huyện -> xã, cũng hỗ trợ cả Tỉnh -> xã. Danh mục công việc là con của danh mục Ngành, cũng là con của danh mục phân bổ.
> - Danh mục có nhiều cha như Nghề nghiệp Lập trình viên thì là con của chuyên ngành giáo dục Công nghệ thông tin, cũng là con của chuyên ngành Khoa học dữ liệu.
> - Danh mục có tính version và thời điểm, điều kiện hiệu lực theo thời gian.
> - Plugin có các chức năng quản trị danh mục: CRUD, quản trị phân quyền chức năng, dữ liệu cho từng loại danh mục.
> - Thiết kế thêm các API để hỗ trợ cho form động. Để form có thể lazy load danh mục của tenant hoặc hệ thống.
> - Tạo các danh mục cố định cho doanh nghiệp như: Chức danh; Phòng ban (để hỗ trợ người dùng autocomplete vừa nhập từ danh mục hoặc nhập tự do),...
> - Triển khai thì plugin này luôn bật và cài cho tất cả tenant khi đăng ký.

## 2. Bóc tách yêu cầu (chỉ liệt kê, chưa quyết)

| # | Yêu cầu nguyên văn | Loại | Ghi chú của BA |
| :--- | :--- | :--- | :--- |
| R1 | Quan hệ cha–con nhiều cấp (tỉnh → huyện → xã) | Dữ liệu | Cây phân cấp cơ bản |
| R2 | Nhảy cấp: tỉnh → xã (không bắt buộc qua huyện) | Dữ liệu | Cạnh tường minh, không suy diễn theo độ sâu |
| R3 | Một danh mục là con của **nhiều** danh mục khác (công việc ⊂ ngành **và** ⊂ phân bổ; Lập trình viên ⊂ CNTT **và** ⊂ KHDL) | Dữ liệu | Đồ thị có hướng không chu trình (DAG), không phải cây |
| R4 | Version + thời điểm hiệu lực theo thời gian | Dữ liệu | Cả bản ghi danh mục **và** quan hệ cha–con |
| R5 | CRUD danh mục + phân quyền **chức năng** và **dữ liệu** theo **từng loại danh mục** | Chức năng | Phân quyền 2 tầng: quyền module + quyền theo loại |
| R6 | API cho **form động**: lazy load danh mục tenant hoặc hệ thống | API | Endpoint options + schema cho form renderer |
| R7 | Danh mục cố định cho doanh nghiệp: **Chức danh**, **Phòng ban**, … | Nghiệp vụ | Autocomplete **hoặc** nhập tự do |
| R8 | Plugin **luôn bật**, cài cho **mọi tenant khi đăng ký** | Triển khai | Core plugin + provisioning + backfill tenant cũ |

## 3. Ràng buộc dự án đã biết (không cần khách chốt lại)

- Multi-tenant: dữ liệu tenant phải lấy `tenant_id` từ context đã xác thực; danh mục **hệ thống** dùng chung, danh mục **tenant** riêng.
- Plugin hoá toàn diện: nghiệp vụ nằm trong plugin; Core chỉ có auth/tài khoản/phân quyền/quản lý plugin.
- Entity Registry: mọi entity CSDL của plugin phải đăng ký.
- API: 4 khuôn mẫu phản hồi, `code` UPPER_SNAKE_CASE, không message tiếng Việt trong payload; i18n ở frontend.
- Frontend: Angular ≥22 + Tailwind 4, component dùng chung ở `src/frontend/shared/`, không modal (Drawer/Router/Split), không unit test frontend.
- Test backend trên PostgreSQL/Redis thật; QA browser Desktop + Mobile emulation.

## 4. Câu hỏi mở (chuyển sang phân tích/xác nhận)

1. Danh mục **hệ thống** (tỉnh/huyện/xã, ngành, chuyên ngành) do ai quản trị — platform admin, và tenant có được phép ẩn/ghi đè không?
2. "Phòng ban" đã tồn tại ở module tổ chức (Core IAM) — danh mục Phòng ban là **bản sao**, **cầu nối** sang dữ liệu tổ chức, hay chuyển hẳn sang plugin?
3. Version: cần xem lịch sử (as-of) trên UI hay chỉ API? Giữ bao nhiêu phiên bản?
4. Nhập tự do: lưu text thuần hay tự tạo item trong danh mục?
5. Có cần import/export (Excel/CSV) danh mục không?
6. Có cần quy trình duyệt (approval) khi sửa danh mục hệ thống không?

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Người review/phê duyệt và nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-06 | Ghi nhận nguyên văn yêu cầu + bóc tách R1–R8 | BA Agent; nguồn: chỉ đạo trực tiếp chủ dự án |
