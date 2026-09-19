# [BUG-81] Web Platform Tràn Ngang 54px Tại Viewport 390×844 — Topbar & Quota Drawer Bị Đẩy Lệch

- **Mã Lỗi**: BUG-81
- **Phân Loại**: Bug / Defect (Responsive layout — TASK-298 acceptance)
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent (Re-test Sprint 02 / TASK-298, 2026-09-19)
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred
- **Ngày Phát Hiện**: 2026-09-19

---

## 1. Mô Tả Lỗi

> Trên bản **Web** ở viewport mobile **390×844**, toàn bộ 5 màn Platform (`/platform/tenants`, `/platform/users`, `/platform/audit-logs`, `/platform/health`, `/platform/admins`) bị **tràn ngang 54px**: `document.documentElement.scrollWidth = 444` so với `clientWidth = 390`. Nguồn tràn là hàng trên của `platform-topbar` (theme switcher + language switcher + nút Đăng xuất) không đủ chỗ, buộc nhãn wrap dọc và đẩy chiều rộng tài liệu lên 444px. Hệ quả kéo theo Drawer Hạn mức (`position: fixed; right-0` + `pl-10`) bị đẩy sang phải: dialog đo được `x=40, width=390` → mép phải vượt viewport 40px.

### Bằng chứng đo runtime (Playwright 390×844, Chrome headless)

| Màn | docScrollWidth / clientWidth | Overflow |
| :--- | :---: | :---: |
| `/platform/tenants` | 444 / 390 | **+54px** |
| `/platform/users` | 444 / 390 | **+54px** |
| `/platform/audit-logs` | 444 / 390 | **+54px** |
| `/platform/health` | 444 / 390 | **+54px** |
| `/platform/admins` | 444 / 390 | **+54px** |
| Drawer Hạn mức (mở trên tenants) | 444 / 390 | **+54px**; dialog `x=40, w=390` (mép phải 430) |
| `/settings/*` (owner) cùng viewport | 390 / 390 | 0px (đạt) |
| Toàn bộ 768×1024 | 768 / 768 | 0px (đạt) |

- Đo trực tiếp: `header.scrollWidth = 444`, `header.clientWidth = 390` → phần tử chứa topbar tự tràn.
- Ảnh minh chứng: `../08_testing/screenshots/web-responsive/QA-RS-390_tenants.png`, `QA-RS-390_users.png`, `QA-RS-390_audit-logs.png`, `QA-RS-390_health.png`, `QA-RS-390_admins.png`, `QA-RS-390_quota-drawer.png`.

### Bằng chứng (file:line)

- `src/frontend/web/src/app/features/platform/platform-topbar/platform-topbar.component.html:2` — hàng topbar `px-3 py-1.5 flex items-center justify-between gap-3` chứa badge + `app-theme-switcher` + `app-language-switcher` + nút Đăng xuất **không có wrap/ẩn theo breakpoint** (`hidden sm:...`, `hidden md:...` chỉ áp dụng cho title/email).
- `src/frontend/shared/components/drawer/drawer.component.html:13` — wrapper `fixed inset-y-0 right-0 pl-10 max-w-full flex`; panel Drawer đặt `w-[460px] max-w-[100vw]` (`tenant-quota-drawer.component.html:5`) → tổng bề rộng `40px (pl-10) + 390px (100vw)` = 430px > viewport 390px → panel lệch phải 40px.

### Các bước tái hiện (Reproduction Steps)

1. Mở Chrome DevTools → Device Emulation, viewport **390×844**.
2. Đăng nhập SUPER_ADMIN → mở lần lượt 5 màn `/platform/*`.
3. Chạy `document.documentElement.scrollWidth` → **444** (> `clientWidth` 390). Cuộn ngang thấy topbar/nội dung bị cắt.
4. Tại `/platform/tenants`, bấm "Hạn mức" → Drawer mở lệch phải 40px (đo `document.querySelector('[role="dialog"]').getBoundingClientRect()` → `x=40`).
5. So sánh `/settings/roles` (owner) tại cùng viewport → không tràn (0px).

## 2. Tác Động

- Vi phạm tiêu chí nghiệm thu TASK-298: "đo `scrollWidth <= clientWidth` (overflow = 0) cho từng màn" — 6/6 màn Platform đo được +54px tại 390.
- Topbar bị wrap nhãn dọc, nút Đăng xuất/theme/language chen chúc, khó thao tác.
- Drawer Hạn mức (thao tác quan trọng) bị đẩy lệch, mép phải nằm ngoài viewport.

## 3. Kết Quả Kỳ Vọng

- Topbar Platform responsive tại 390: ẩn/wrap hợp lý badge và email, cho phép theme/language switcher thu gọn (icon) hoặc wrap có kiểm soát; `scrollWidth <= clientWidth`.
- Drawer wrapper bỏ/đổi `pl-10` theo breakpoint (ví dụ `pl-0 sm:pl-10`) và panel dùng `max-w-full` theo container thay vì `100vw` → Drawer full-width đúng tại 390.
- Toàn bộ màn Platform + Drawer đạt overflow = 0 ở cả 390×844 và 768×1024.

## 4. Xác Nhận Khắc Phục (QA Verification)

- [ ] Developer sửa topbar + drawer responsive.
- [ ] QA đo lại 6 màn Platform + Drawer tại 390×844 và 768×1024 → overflow = 0; chụp ảnh bổ sung.
- [ ] Cập nhật `08_testing/test_report.md` (mục responsive TASK-298).

## Ghi Chú QA (2026-09-19)

- Phát hiện trong TASK-298. Màn Settings (owner) đã đạt overflow 0 tại 390 — lỗi khu trú ở Platform layout/topbar + Drawer.
- **Touch target (phụ)**: nhiều vùng chạm tại 390 < 40px (theme switcher 34-47×37, VI/EN 28×21, Đăng xuất 44×39, nút Menu 32×32, nav settings 35px cao). Các phần tử này nằm trong nhóm "phần tử chính" cần xem xét khi sửa topbar; đề nghị Developer xử lý gộp trong cùng lần sửa BUG-81 (chưa tách bug riêng).

## Ghi Chú Triển Khai (Developer) — 2026-09-19

> **FE đã sửa xong, chờ QA đo lại 6 màn Platform + Drawer tại 390×844 / 768×1024.** Không chạm backend.

### Vị trí đã sửa (file:line)

- `src/frontend/web/.../platform-topbar/platform-topbar.component.html:2-42` — hàng topbar đổi sang `px-2 sm:px-3 ... gap-2`; nhóm trái `shrink-0` (logo + badge không bị ép tràn); nhóm phải `flex-1 flex-wrap justify-end min-w-0` → theme/language/logout tự wrap trong topbar thay vì đẩy `scrollWidth` tài liệu (bỏ tràn 54px). Logout `min-h-10 sm:min-h-0`.
- `platform-topbar.component.html:37-47` — nav link `inline-flex items-center min-h-10 sm:min-h-0` (touch ≥40px mobile, desktop giữ dense) + nav giữ `overflow-x-auto [scrollbar-width:thin]`.
- `src/frontend/shared/components/drawer/drawer.component.html:13` — wrapper đổi `pl-10` → `pl-0 sm:pl-10` + `w-full sm:w-auto justify-end`; Drawer full-width tại mobile (`x=0`), desktop giữ peek 40px như cũ. Áp dụng chung cho `TenantQuotaDrawer`, `AuditLogDetailDrawer`, `GrantAdminDrawer`, `BreakGlassDrawer`, `ImpersonateConfirmDrawer` (tất cả panel đã có `max-w-[100vw]`).
- `drawer.component.html:37` — nút Đóng `min-h-10 min-w-10 sm:min-h-0 sm:min-w-0`; footer `:52` thêm `[&_button]:min-h-10 sm:[&_button]:min-h-0`.
- `src/frontend/web/src/styles.css:12-24` — scope web `@media (max-width: 639px)`: button của `app-theme-switcher`, `app-language-switcher`, `app-sharp-toggle` đạt tối thiểu 40×40px; ẩn nhãn caption "Giao diện:/Ngôn ngữ:" (không đổi desktop ≥640px).
- Bảng dense (`app-table`) đã có sẵn `overflow-x-auto` trong container, không tràn body — giữ nguyên.

### Cách đo lại (đúng như QA đã làm)

1. Chrome DevTools Device Emulation 390×844, đăng nhập SUPER_ADMIN, lần lượt mở 5 màn `/platform/*` + mở Drawer Hạn mức tại `/platform/tenants`.
2. Đo `document.documentElement.scrollWidth` và `clientWidth` → kỳ vọng bằng nhau (0px); `document.querySelector('[role="dialog"]').getBoundingClientRect()` → `x=0`, `right<=390`.
3. Touch target: `app-theme-switcher button`, `app-language-switcher button`, nút Đăng xuất, nav link, nút Đóng Drawer, toggle plugin → `getBoundingClientRect()` ≥40px ở 390.
4. Lặp lại toàn bộ tại 768×1024 → overflow = 0; kiểm tra theme/language switcher vẫn hiển thị dense như desktop.

### Kiểm chứng sơ bộ của Developer (harness tĩnh dùng chính CSS build + markup topbar/drawer, Playwright 390×844 & 768×1024)

| Viewport | docScrollWidth / clientWidth | Drawer rect | Touch target chính |
| :--- | :---: | :--- | :---: |
| 390×844 | 390 / 390 (**0px**) | `x=0, right=390, w=390` | 40×40 (theme/lang/logout/nav/close/toggle) |
| 768×1024 | 768 / 768 (**0px**) | `x=308, right=768, w=460` (peek 40px) | giữ dense desktop (28×21…) |

- `npm run build` Web + Mobile **PASS** (2026-09-19). QA cần xác nhận lại trên app thật (harness không thay thế nghiệm thu).

## Ghi Chú QA Nghiệm Thu Cuối (2026-09-19) — QA-R2-81: PASS → Done

- **App thật, 13 màn/trạng thái × 2 viewport** (390×844 + 768×1024): `scrollWidth <= clientWidth` **= 0px toàn bộ** (26/26 lượt đo) — hết tràn +54px tại 5 màn Platform.
- **Drawer Hạn mức** tại 390: `x=0, w=390, right=390` (full-width đúng viewport, hết lệch 40px); tại 768: `x=308, w=460` (peek 40px giữ như thiết kế).
- **Touch target platform topbar** tại 390 đạt 100%: theme 64×40, Sáng/Tối 40×40, VI/EN 40×40, Đăng xuất 68×40, 5 nav link cao 40px.
- Tồn dư (ngoài phạm vi High của bug): shared topbar hamburger 32×32 + nav Settings 35px tại 390 → đã tách **BUG-83 (Medium)**; không chặn DoD.
- Ảnh: `screenshots/web-responsive/QA-RS2-{390,768}_*.png` (26 ảnh); số liệu: `../08_testing/evidence/resp2.out.json`. Kết luận: **Done** (checklist QA Verification của bug đạt).
