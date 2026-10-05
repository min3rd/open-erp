# [TP-S04-001] Kế Hoạch Kiểm Thử Sprint 04

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TP-S04-001 / Test plan / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-05 |
| Owner / reviewer | QA Agent / Chưa review |
| Đầu vào | [CONF-S04-001](../04_confirmation/01_CONF-S04-001_sprint_04_scope.md) (Approved), [DES-UI-S04-001](../06_designs/ui_ux/01_DES-UI-S04-001_theme_tokens_and_layout.md), [DES-UI-S04-002](../06_designs/ui_ux/02_DES-UI-S04-002_motion_icon_context_menu_skeleton.md), [DES-API-S04-001](../06_designs/api/01_DES-API-S04-001_theme_preferences_and_i18n.md) |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) / TR-S04-001 (chưa tạo) |

## 1. Phạm Vi & Môi Trường

- Web: `http://localhost:4200` (Desktop ≥1280px), Mobile Ionic: `http://localhost:8100` (viewport 390×844, device emulation).
- Backend + PostgreSQL + Redis thật (`npm run infra`, `npm run backend`); **không** H2.
- Không viết unit test frontend; kiểm thử bằng trình duyệt thật (CDP headless được chấp nhận nếu đo được số liệu).
- Ghi ảnh minh chứng cho mỗi TC PASS; lưu tại `08_testing/evidence/screenshots/`.

## 2. Ma Trận Tổ Hợp (lấy mẫu)

| Chiều | Giá trị | Cách lấy mẫu |
| :--- | :--- | :--- |
| Theme | industrial, slate-blue, emerald, amber | Đủ 4 (mỗi theme 1 lần) |
| Mode | light, dark | Đủ 2 cho industrial; 1 mode cho 3 theme còn lại |
| Ngôn ngữ | vi, en, zh-CN, ja, es (+ các locale phát hành sau) | Đủ locale `released`; RTL riêng cho `ar` |
| Nền tảng | Web 1280×900, Mobile 390×844 | Đủ 2 |
| Reduced motion | bật/tắt | 1 lần cho toàn hệ |

## 3. Test Case Theo AC

| TC | AC | Kịch bản | Cách kiểm | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| TC-01 | AC-01 | Đổi theme tenant (PUT) ⇒ mọi màn đổi màu; F5 không flash sai theme | Browser + API | Not Run |
| TC-02 | AC-02 | Mỗi theme có đủ Light/Dark; text đạt AA | Browser + đo contrast | Not Run |
| TC-03 | AC-03 | Theme không giảm mật độ; overflow 0 tại 390px; chỉ mặc định vuông vắn | Browser (đo) | Not Run |
| TC-04 | AC-01/AC-17 | Người dùng khác trong tenant nhận đúng theme sau đăng nhập | Browser (2 tài khoản) | Not Run |
| TC-05 | AC-04 | Popup/drawer/list/route có chuyển động nhanh, không nhảy layout | Browser (quan sát + FPS) | Not Run |
| TC-06 | AC-05 | Bật `prefers-reduced-motion` ⇒ chuyển động không thiết yếu tắt | Browser (emulate) | Not Run |
| TC-07 | AC-06 | Hành động phổ biến có icon Feather; icon-only có aria-label | Browser + DOM | Not Run |
| TC-08 | AC-07 | Không còn `<svg>` vẽ tay ngoài component icon | Static grep | Not Run |
| TC-09 | AC-08 | Chuột phải hàng ⇒ menu tại con trỏ; mục thiếu quyền disable kèm lý do | Browser | Not Run |
| TC-10 | AC-09 | `Escape`/`Shift+F10`/mũi tên điều hướng đúng `role="menu"`; focus trả về hàng | Browser (bàn phím) | Not Run |
| TC-11 | AC-10 | Mobile **không** có context menu | Browser 390×844 | Not Run |
| TC-12 | AC-11 | Thanh progress trên cùng hiện khi có request, ẩn khi xong, không nhấp nháy <150ms | Browser (network throttle) | Not Run |
| TC-13 | AC-12 | Vùng nhanh hiện trước, vùng chậm skeleton riêng (organization + các màn đã tách) | Browser (throttle) | Not Run |
| TC-14 | AC-13 | Không nhảy layout; empty/error + nút Thử lại theo vùng | Browser | Not Run |
| TC-15 | AC-14 | Đổi ngôn ngữ áp ngay; không lộ key thô; lưu sau F5 | Browser | Not Run |
| TC-16 | AC-15 | `npm run i18n:check:strict` PASS cho mọi locale `released` | CLI | Not Run |
| TC-17 | AC-16 | `ar`: layout gương, overflow 0 tại 390px, icon hướng lật | Browser `ar` | Not Run |
| TC-18 | — | Backend: `TenantUiPreferencesApiTest`, `AccountTenantIsolationApiTest` (language) | `mvn test` | Not Run |

## 4. Tiêu Chí Đạt (Exit Criteria)

- 100% TC PASS (hoặc Fail có bug riêng + mức độ).
- 0 `console.error` trên mọi lượt chạy; overflow ngang = 0 tại 390×844.
- Mỗi TC PASS có ảnh/log minh chứng; TC chưa chạy ghi `Not Run`, không suy diễn.
- Bug phát hiện phải có file item riêng trước khi đóng sprint.

## 5. Chưa Kiểm Chứng

Kế hoạch Draft; chưa chạy TC nào. Số liệu sẽ ghi tại TR-S04-001 (chưa tạo) kèm baseline/commit.
