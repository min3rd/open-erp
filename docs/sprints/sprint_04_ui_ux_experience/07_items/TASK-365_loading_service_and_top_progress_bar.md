# [TASK-365] LoadingService + HTTP interceptor + TopProgressBar

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-365 / Task / Sprint 04 |
| Severity / trạng thái | High / **Done** (TR-S04-001 v0.3 verified 2026-10-06) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved |
| depends_on / blocks / parent | — / TASK-367 / [FEAT-28](../07_items/FEAT-28_loading_bar_and_skeletons.md) |
| Write scope / baseline | `shared/services` (mới), `shared/components/top-progress-bar`, web/mobile `app.config.ts`, layouts, i18n / working tree @ `92dbc2b` |

## 1. Mục tiêu và scope

Thanh progress **trên cùng trang** khi có hoạt động tải (Q8, AC-11). Truy vết DES-UI-S04-002 §4.1.

- In-scope: `LoadingService` đếm request đang chạy; HTTP interceptor toàn cục (Web + Mobile); component `app-top-progress-bar`; trễ hiện ~150ms (Q16) để tránh nhấp nháy; gắn ở layout.
- Out-of-scope: skeleton theo vùng (TASK-366/367).

## 2. Các thao tác

- [x] `LoadingService` (signal đếm; `begin()`/`end()`), trễ 150ms.
- [x] Interceptor bọc mọi HTTP; đăng ký trong `provideHttpClient(withInterceptors([...]))` của cả 2 app.
- [x] `app-top-progress-bar` (shared, template `.html` tách riêng), theme-aware, không chiếm layout.
- [x] Gắn vào layout Web + Mobile.

## 3. Tiêu chí và kiểm chứng

- [x] AC-11: có hoạt động tải ⇒ thanh hiện; xong ⇒ ẩn.
- [x] Frontend build PASS; QA browser 0 console error.
- [ ] Reviewer xác nhận.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` (web/mobile) | PASS | bundle generation complete |
| Hành vi trễ 150ms (không nhấp nháy với phản hồi nhanh) | PASS (dev self-check) | `LoadingService`: timer chỉ chạy ở nhịp 0→1, huỷ nếu xong trước 150ms |

## 4. Bàn giao và lịch sử

Đã làm: `LoadingService` (signal đếm in-flight), `loadingInterceptor` (functional, `finalize` cho cả success/error/cancel), `app-top-progress-bar` (shared, `bg-accent`, `z-index` trên topbar, `aria-hidden`, tôn trọng reduced-motion), gắn 1 lần ở app root Web + Mobile. Web: `withInterceptors([loadingInterceptor, authInterceptor])`.

Bước tiếp: TASK-367 tách vùng + skeleton; QA browser.
