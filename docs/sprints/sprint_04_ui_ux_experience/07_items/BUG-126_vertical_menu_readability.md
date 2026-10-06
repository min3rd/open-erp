# [BUG-126] Menu dọc khó nhìn; hình thái hiển thị phải là action trong menu (tham khảo Fuse)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-126 / Bug / Sprint 04 |
| Severity / trạng thái | High / **Done** (TR-S04-001 v0.3 verified 2026-10-06) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / phản hồi chủ dự án: "các cách hiển thị menu dọc chưa đạt, rất khó nhìn và theo dõi… chỉ phân biệt layout menu dọc, ngang, còn hình thái hiển thị của menu thì nên để các icon action ở menu cho dễ thao tác. tham khảo fuse của angular" |
| depends_on / blocks / parent | TASK-374, BUG-123 / — / [FEAT-24](FEAT-24_theme_system_and_design_tokens.md) |

## 1. Hiện tượng và nguyên nhân

- Bốn biến thể dọc (`side`, `right`, `narrow`, `compact`) chia nhau **cùng một kiểu rail** nhưng khác kích thước ⇒ khó nhìn, không rõ cấp bậc; nhóm bị thu gọn mặc định nên chỉ thấy 4 dòng, mục con thụt lề nhưng nhãn dài bị cắt/xuống dòng.
- Trục "bố cục" đang trộn hai thứ khác nhau: **vị trí menu** (dọc/ngang) và **hình thái hiển thị** (đầy đủ/thu gọn) — trong khi hình thái nên là thao tác ngay trong menu (Fuse: nút collapse ở header, rail tự thu còn icon).

## 2. Cách sửa

**Chỉ còn 2 hướng bố cục** (`LayoutId`): `side`/`right` = **dọc**, `top` = **ngang**, thêm `drawer`. Bỏ `narrow`, `compact` khỏi enum, registry frontend và `available_layouts` của backend (giá trị cũ trong DB/localStorage tự rơi về mặc định của theme).

**Menu dọc làm lại cho dễ theo dõi** (kiểu Fuse):
- Header menu: tiêu đề + **icon action thu gọn/mở rộng** (`chevrons-left/right`), có `aria-expanded` + tooltip.
- Nhóm = **caption in hoa** (10px, tracking rộng, mờ) kèm chevron xoay — khác hẳn mục thường.
- **Nhóm mở sẵn toàn bộ** (thấy hết menu trong một lần nhìn); người dùng thu từng nhóm; nhóm chứa trang đang mở luôn được mở.
- Mục con thụt lề + icon riêng, nhãn 1 dòng (`truncate` + `title`), mục đang mở có gạch accent.
- Rail rộng 256px khi mở, **48px chỉ icon** khi thu (tooltip giữ nhãn) — trạng thái nhớ theo trình duyệt.

## 3. Kiểm chứng

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| Rail mở | **PASS** | aside **256px**, 7/7 nhãn, 3 nhóm đều mở, action "Thu gọn menu" |
| Rail thu gọn | **PASS** | aside **48px**, 0 nhãn (chỉ icon), action "Mở rộng menu" |
| Thu rồi mở lại | **PASS** | về 256px, đủ nhãn |
| Menu ngang | **PASS** | 3 nhóm dropdown đóng mặc định, 7 mục bên trong |
| Backend `available_layouts` | **PASS** | còn 4 giá trị; `UserUiPreferencesApiTest` **7/7 PASS** trên PostgreSQL |
| Build web + mobile, i18n | **PASS** | 0 error; parity 13/13 (web 918, mobile 494 key) |

Ảnh: `%TEMP%/opencode/menu-redesign/rail-expanded.png`, `rail-collapsed.png`, `bar.png`. Commit `4e4a4f8`.
