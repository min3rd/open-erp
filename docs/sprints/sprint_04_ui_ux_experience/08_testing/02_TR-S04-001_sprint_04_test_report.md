# [TR-S04-001] Báo Cáo Kiểm Thử Sprint 04

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TR-S04-001 / Test report / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | **Draft — QA tự chạy, chờ QA người ký** / 0.2 / 2026-10-05 |
| Owner / reviewer | QA Agent (agent chạy tự động) / **QA người — chưa ký** |
| Baseline | `888198a` (web + mobile build PASS, 0 cảnh báo), backend dev `:8088` + PostgreSQL/Redis thật, web `:4200`, mobile `:8100` |
| Đầu vào | [TP-S04-001](01_TP-S04-001_sprint_04_test_plan.md) (18 TC), [CONF-S04-001](../04_confirmation/01_CONF-S04-001_sprint_04_scope.md) (Approved, §5.1 thay đổi AC-17) |
| Đọc trước / đọc tiếp | [TP-S04-001](01_TP-S04-001_sprint_04_test_plan.md) / [09_review](../09_review/) |

> **Không tự ký gate**: báo cáo này ghi kết quả chạy thật + bằng chứng; **QA sign-off vẫn `Pending`** cho tới khi QA người xác nhận. Phương pháp: CDP headless (Chrome), đo bằng `getComputedStyle`/`getAnimations`/`scrollWidth`, ảnh lưu tại `08_testing/evidence/screenshots/`.

## 1. Kết Quả 18 Test Case

| TC | AC | Kết quả | Số liệu / bằng chứng |
| :--- | :--- | :--- | :--- |
| TC-01 | AC-01 | **PASS** | Đổi theme qua switcher (PUT `/account/ui-preferences`); xoá cache localStorage + F5 ⇒ theme lấy lại từ API (`emerald`), script FOUC trong `index.html` set `data-theme` trước khi Angular boot |
| TC-02 | AC-02 | **PASS** | 4 theme × 2 mode: text chính 16.30–17.93, text muted 4.74–7.58 — **tất cả ≥ 4.5 (AA)**. Ảnh `tc02-industrial-dark.png`, `tc02-amber-light.png` |
| TC-03 | AC-03 | **PASS** | Theme mặc định `data-shape=sharp`; font 12px, hàng bảng 28px (mật độ cao); overflow ngang **0** tại 390×844. Ảnh `tc03-roles-390.png`, `tc03-members-390-light/dark.png` |
| TC-04 | AC-01/AC-17 | **PASS** | AC-17 đã đổi theo CONF §5.1 (4 trục theo người dùng, tenant là mặc định): backend `UserUiPreferencesApiTest` 7/7 (gồm "tenant default surfaced" + tách biệt người dùng) |
| TC-05 | AC-04 | **PASS** | Mở panel: **6 CSS animation** đang chạy (`op-pop-in` 180ms, `op-row-in` 180ms, `op-route-in` 260ms); đổi route có `op-route-in` |
| TC-06 | AC-05 | **PASS** | Emulate `prefers-reduced-motion: reduce` ⇒ **0 animation** |
| TC-07 | AC-06 | **PASS** | 14 `app-icon` (0 icon rỗng), 3 nút icon-only — **0 nút thiếu aria-label/title** |
| TC-08 | AC-07 | **PASS** (sau sửa) | Ban đầu còn 1 `<svg>` spinner trong `sharp-button` → **BUG-131** đã sửa bằng `app-icon name="loader"`; grep lại chỉ còn `icon.component.html` |
| TC-09 | AC-08 | **PASS** | Menu mở tại con trỏ với 2 mục (309,159); nhánh **thiếu quyền** kiểm bằng menu thật qua directive instance: 1 mục `disabled` + lý do dịch sẵn ("Bạn không có quyền thực hiện thao tác này", không lộ key). Ảnh `tc09-context-menu.png`, `tc09-context-menu-disabled.png` |
| TC-10 | AC-09 | **PASS** | `Escape` đóng + **focus trả về hàng**; `Shift+F10` mở lại (`open: true`) |
| TC-11 | AC-10 | **PASS** | `contextmenu` với `pointerType='touch'` ⇒ **không mở menu** (BUG-132 đã chặn long-press); mobile Ionic 390×844: 0 touch target < 40px |
| TC-12 | AC-11 | **PASS** | Request chậm (latency 500ms): thanh progress hiện sau **950ms**, ẩn khi xong; thao tác không request: **không hiện** (không nhấp nháy < 150ms) |
| TC-13 | AC-12 | **PASS** | Chặn endpoint memberships ⇒ **chỉ vùng bảng** hiện lỗi, vùng tra cứu (chi nhánh/phòng ban) vẫn chạy; bỏ chặn + bấm **Thử lại** ⇒ lỗi biến mất, dữ liệu về. Ảnh `tc13-region-error.png` |
| TC-14 | AC-13 | **PASS** | Cùng lượt chạy TC-13: đúng **1 nút Thử lại** cho vùng lỗi, không nhảy layout, empty state vẫn đúng. Thêm: luồng **Xóa chi nhánh qua UI** đã xác minh (DELETE 200 → dòng biến mất khỏi bảng; soft-delete `INACTIVE` được lọc khỏi danh sách/cây — BUG-121 follow-up) |
| TC-15 | AC-14 | **PASS** | Đổi sang `en` áp ngay, `html lang=en`, **0 key thô `PERM_*`** (BUG-133 đã bổ sung 32 key × 13 locale), F5 vẫn `en`. Ảnh `tc15-english.png` |
| TC-16 | AC-15 | **PASS** | `npm run i18n:check:strict`: 13/13 locale 100% (web 944 key, mobile 494 key) |
| TC-17 | AC-16 | **PASS** | Web: `dir=rtl lang=ar`, overflow **0** tại 1440×900 và 390×844; sidebar/table/drawer/context-menu gương; toggle knob lật; icon hướng tự lật. **Mobile Ionic thật** (390×844, touch emulation): `dir=rtl lang=ar`, overflow **0** ở login + dashboard, 0 console error. Ảnh `%TEMP%/opencode/rtl/`, `mobile-ar-login.png`, `mobile-ar-dashboard.png` |
| TC-18 | — | **PASS** | `UserUiPreferencesApiTest` 7/7, `TenantUiPreferencesApiTest` 4/4 (PostgreSQL thật, không H2) |

**0 console.error** trên mọi lượt chạy (web 1440, web 390, mobile 390).

**Sau khi dọn code + vendor icon (`888198a`)**: `UserUiPreferencesApiTest` **7/7 PASS** (payload bỏ 4 trường `available_*`); icon render trên trình duyệt **14/14 `app-icon` có markup, 0 rỗng**, 0 console error; bundle web **640.25 → 558.11 kB** và build 0 cảnh báo.

## 2. Bug Phát Hiện Trong Đợt Này

| Bug | Mức | Nội dung | Trạng thái |
| :--- | :--- | :--- | :--- |
| [BUG-131](../07_items/BUG-131_handwritten_spinner_svg.md) | Medium | `<svg>` spinner vẽ tay trong `sharp-button` (vi phạm AC-07/AC-08) | Đã sửa (`5c2e0ca`) |
| [BUG-132](../07_items/BUG-132_touch_context_menu_gate.md) | High | Context menu mở cả khi long-press trên thiết bị cảm ứng (vi phạm AC-10) | Đã sửa (`5c2e0ca`) |
| [BUG-133](../07_items/BUG-133_permission_keys_missing.md) | High | 32 key `PERM_*` thiếu trong mọi từ điển ⇒ ma trận quyền lộ key thô (vi phạm AC-14) | Đã sửa (`5c2e0ca`) |
| [BUG-134](../07_items/BUG-134_context_menu_missing_screens.md) | High | Context menu thiếu ở danh sách credential + phiên (DES-UI-S04-002 §Q20) | Đã sửa (`5c2e0ca`) |

## 3. Chưa Kiểm Chứng (QA người cần chạy)

1. **FOUC trên máy thật**: đo first-paint (đợt này chỉ đo sau khi app boot).
2. **Skeleton khi mạng chậm** (TC-13 nhánh đang tải): đợt này chặn endpoint nên vùng lỗi hiện ngay, không quan sát được skeleton; xem thêm bằng chứng TASK-367.
3. **Mẫu lặp**: QA người chạy lại một mẫu TC bất kỳ và ký gate (kết quả dưới đây là đo tự động, CDP headless).
4. **`Escape`/mũi tên trong menu khi có mục disabled**: đã đo nhánh disabled hiển thị + lý do; điều hướng bàn phím qua mục disabled nên kiểm tay 1 lần.
5. Mọi kết quả trên là **đo tự động**; QA người cần chạy lại mẫu và ký gate.
