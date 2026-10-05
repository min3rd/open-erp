# [TASK-362] Thay SVG vẽ tay bằng icon chung + a11y

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-362 / Task / Sprint 04 |
| Severity / trạng thái | Medium / **In Review** (code + build PASS, chờ QA browser) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved |
| depends_on / blocks / parent | TASK-361 / TASK-363 / [FEAT-26](../07_items/FEAT-26_feather_icon_system.md) |
| Write scope / baseline | template/TS của shared components + web/mobile feature templates đang có SVG vẽ tay / working tree @ `8a7b1a8` |

## 1. Mục tiêu và scope

Loại bỏ SVG vẽ tay rải rác, dùng `app-icon`; bổ sung `aria-label`/`aria-hidden` đúng chỗ. Truy vết AC-06.

- In-scope: topbar (hamburger), user-menu (chevron), notification-bell (bell/check), drawer (close), section-nav, pagination, theme/language switcher, mobile dashboard bell, các nút icon-only.
- Out-of-scope: đổi hành vi; context menu.

## 2. Các thao tác

- [x] Thay SVG trong các shared component liệt kê trên bằng `<app-icon>`.
- [x] Icon-only: `labelKey` (aria-label i18n); icon kèm chữ: `decorative=true`.
- [x] Thêm key i18n còn thiếu vào 4 từ điển (vi/en web + mobile).
- [x] Build Web + Mobile PASS; QA browser xác nhận không vỡ layout.

## 3. Tiêu chí và kiểm chứng theo loại thay đổi

- [x] Đáp ứng AC-06; không còn `<svg>` vẽ tay trong các template thuộc scope.
- [ ] Backend: N/A.
- [x] Frontend: build PASS; QA browser Desktop + Mobile 390×844.
- [ ] Reviewer xác nhận.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` (web) | PASS | 0 error; 1 warning budget (feather-icons) |
| `npm run build` (mobile) | PASS | 0 error |
| QA browser (1280×900 + 390×844) | Not Run | chờ đợt QA |
| Không còn `<svg>` vẽ tay | PASS | chỉ còn `icon.component.html` (khung) + spinner `sharp-button` |

## 4. Bàn giao và lịch sử

Files: shared + feature templates trong scope. Kiểm tra đã chạy: build. Chưa QA browser (Not Run). Người nhận: QA. Bước tiếp: QA dual-mode.
