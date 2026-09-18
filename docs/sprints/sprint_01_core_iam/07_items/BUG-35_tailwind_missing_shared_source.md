# [BUG-35] Tailwind Không Quét Thư Viện Shared - Thiếu Class UI Nghiêm Trọng

- **Mã Lỗi**: BUG-35
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent (browser manual test)
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> `src/frontend/web/src/styles.css` chỉ có `@import 'tailwindcss';` mà thiếu `@source '../../shared';`, nên Tailwind v4 chỉ quét trong Vite root (`src/frontend/web`) và **bỏ qua toàn bộ class chỉ xuất hiện trong `src/frontend/shared`**.

- **Môi trường**: Local (browser manual test, `prefers-color-scheme: dark`)
- **Tính Năng Bị Ảnh Hưởng**: Toàn bộ UI dùng shared component (Drawer, Button, Badge, Input, PinInput...).
- **File Liên Quan**:
  - `src/frontend/web/src/styles.css` (thiếu `@source`).
  - Bằng chứng: CSS dev server dài 23.801 bytes, thiếu `.fixed`, `.right-0`, `.inset-y-0`, `.inset-0`, `.translate-x-0`, `.w-screen`, `.pl-10`, `.shadow-2xl`... Sau khi thêm `@source '../../shared'` → CSS 34.713 bytes, các class trên đều FOUND.
- **Tài Liệu Đối Chiếu**: AGENTS.md (thư viện dùng chung bắt buộc), `06_designs/ui_ux/CORE_IAM_UI_SPEC.md` (Drawer trượt từ cạnh phải, Stacked Drawer).

## 2. Các Bước Tái Hiện
1. Mở http://localhost:4200/dashboard, bấm Avatar/mở "Quản lý tài khoản".
2. Quan sát: Drawer **không nổi lên trên** mà nằm trong luồng trang ở mép trái, không có backdrop mờ, thiếu bóng đổ.
3. Kiểm tra `http://localhost:4200/styles.css` → tìm `.fixed`, `.shadow-2xl` đều không có.

## 3. Kết Quả Thực Tế
- Drawer hiển thị sai vị trí (góc trái, bắt đầu từ giữa trang), không overlay, không backdrop; dark mode các class chỉ có trong shared bị thiếu → màu sắc không đồng nhất.

## 4. Kết Quả Kỳ Vọng
- `styles.css` có `@source '../../shared';`; Tailwind sinh đủ class dùng trong shared; Drawer trượt đúng từ cạnh phải, có backdrop, bóng đổ; dark mode đầy đủ. (Mobile đã có `@source` từ trước, Web bị thiếu.)

## 5. Log Lỗi / Hình Ảnh Đính Kèm
```
MISSING .fixed .right-0 .inset-y-0 .translate-x-0 .w-screen .pl-10 .max-w-full .inset-0 .shadow-2xl
(CSS length before: 23801, after @source: 34713)
```

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong (`@source` được thêm vào `web/src/styles.css`, browser re-test xác nhận Drawer overlay đúng).
- [x] QA đã re-test và xác nhận không còn lỗi (CSS tăng 23.801 → 34.713 bytes; browser audit thấy drawer overlay + backdrop + shadow đúng).
- [x] Không gây lỗi phát sinh (Regression test pass; Web/Mobile build PASS).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng puppeteer browser test; ảnh tại `%TEMP%\opencode\browser-qa\shots-routes2\`.
