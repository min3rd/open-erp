# [TASK-401] Gom runtime dùng chung + Tailwind entry riêng cho plugin

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-401 / Refactor / Sprint 05 |
| Severity / trạng thái | Medium / **To Do** — nợ kiến trúc sau khi plugin UI tách iframe |
| Owner / reviewer | Developer / Architect |
| depends_on / blocks | TASK-399, TASK-400 / không chặn QA |
| Write scope | `src/frontend/shared/services/**`, `src/frontend/shared/utils/**`, `src/frontend/web/src/styles.css`, `plugins/catalog/web/src/**` |

## 1. Vấn đề

Plugin đã dùng `@shared` cho component/enum/model/i18n, nhưng vẫn copy một số runtime của core web:

- `plugins/catalog/web/src/app/core/services/api.service.ts`
- `plugins/catalog/web/src/app/core/utils/path-list-state.ts`
- `plugins/catalog/web/src/app/core/utils/query.util.ts`
- `plugins/catalog/web/src/app/core/interceptors/auth.interceptor.ts` (bản rút gọn)

Ngoài ra plugin build đang dùng chung `src/frontend/web/src/styles.css`; core phải thêm `@source '../../../../plugins/catalog/web/src'` để Tailwind sinh class cho plugin. Đây là coupling core → plugin, không đúng hướng plugin độc lập.

## 2. Hướng làm

- Chuyển `PathListStateService` + `buildPathListCommands` và `buildQuery` vào `@shared`.
- Tạo `API_BASE_URL` injection token + `ApiService` dùng chung; core provide `environment.apiBaseUrl`, plugin provide `''`. Plugin giữ `CatalogAdminService` (nghiệp vụ riêng).
- Tách auth interceptor phần gắn token/session thành shared; core giữ phần refresh/redirect đặc thù.
- Tạo `plugins/catalog/web/src/styles.css` sở hữu Tailwind entry + `@source` plugin/shared; tách theme tokens dùng chung khỏi core nếu cần. Xoá `@source` plugin khỏi core styles.
- Xoá `plugins/catalog/web/src/app/core` trừ service nghiệp vụ catalog.

## 3. Tiêu chí nghiệm thu

- `grep plugins/catalog` trong core `styles.css`/tsconfig = 0.
- Plugin `core` chỉ còn `catalog-admin.service.ts` (và adapter thật sự đặc thù).
- Web, plugin, mobile build PASS; route-state/context-menu vẫn hoạt động.
- Không đổi API contract hay DB.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Tạo task sau phản hồi "đã có thư viện chung sao plugin vẫn viết riêng core/CSS" | Chủ dự án |
