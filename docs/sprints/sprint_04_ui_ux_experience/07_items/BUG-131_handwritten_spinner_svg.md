# [BUG-131] Spinner vẽ tay bằng `<svg>` trong nút (vi phạm AC-07/AC-08)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-131 / Bug / Sprint 04 |
| Severity / trạng thái | Medium / **Resolved** (2026-10-05) — chờ QA xác nhận |
| Owner/agent / reviewer | Developer (agent) / QA người |
| Nguồn | QA tự động TC-08 (grep `<svg>` ngoài component icon) |
| depends_on / blocks / parent | TASK-361, TASK-362 / — / [FEAT-26](FEAT-26_feather_icon_system.md) |

## 1. Hiện tượng
`sharp-button.component.html` còn `<svg>` vẽ tay (spinner loading) — AC-07/AC-08 yêu cầu **mọi** icon lấy từ bộ chung `app-icon`, không vẽ SVG thủ công trong template màn hình/component.

## 2. Cách sửa
Thêm `LOADER = 'loader'` vào `IconName`; spinner dùng `<app-icon name="loader" [decorative]="true" class="me-2 -ms-1 h-3.5 w-3.5 animate-spin" />` (kích thước/xoay giữ nguyên, lớp hướng dùng logical).

## 3. Kiểm chứng
- Grep `<svg` toàn frontend: chỉ còn `shared/components/icon/icon.component.html` (khung SVG dùng chung) — PASS.
- Build web + mobile PASS (`5c2e0ca`).
