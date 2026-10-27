# [TASK-401] Gom runtime dùng chung + Tailwind entry riêng cho plugin

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-401 / Refactor / Sprint 05 |
| Severity / trạng thái | Medium / **Done (dev)** — frontend runtime + API/security SDK + declarative backend manifest; Flyway DDL vẫn plugin-owned |
| Owner / reviewer | Developer / Architect |
| depends_on / blocks | TASK-399, TASK-400 / không chặn QA |
| Write scope | `src/frontend/shared/services/**`, `src/frontend/shared/utils/**`, `src/frontend/web/src/styles.css`, `plugins/catalog/web/src/**`, `plugins/sdk/**`, `plugins/catalog/src/main/**` |

## 1. Vấn đề

Plugin đã dùng `@shared` cho component/enum/model/i18n, nhưng vẫn copy một số runtime của core web:

- `plugins/catalog/web/src/app/core/services/api.service.ts`
- `plugins/catalog/web/src/app/core/utils/path-list-state.ts`
- `plugins/catalog/web/src/app/core/utils/query.util.ts`
- `plugins/catalog/web/src/app/core/interceptors/auth.interceptor.ts` (bản rút gọn)

Ngoài ra plugin build đang dùng chung `src/frontend/web/src/styles.css`; core phải thêm `@source '../../../../plugins/catalog/web/src'` để Tailwind sinh class cho plugin. Đây là coupling core → plugin, không đúng hướng plugin độc lập.

## 2. Hướng làm

- [x] Chuyển `PathListStateService` + `buildPathListCommands` và `buildQuery` vào `@shared`.
- [x] Tạo `API_BASE_URL` + `ApiService` dùng chung; core provide environment URL, plugin provide `''`.
- [x] Tách auth interceptor phần gắn token/session thành `authHeaderInterceptor` dùng chung cho plugin.
- [x] Tạo `plugins/sdk` Maven module chứa `ApiResponse`, `ApiErrorResponse`, `ApiException`, `ApiFieldError`, `ErrorCode`, `ResponseKey`, `ListData`, `PagedData`, `EnumParser`; plugin dùng dependency `plugin-sdk`.
- [x] Tạo `plugins/catalog/web/src/styles.css` sở hữu Tailwind entry + `@source` plugin; core không còn scan plugin.
- [x] Chuyển nốt runtime filters (`TenantContext`, `TenantContextFilter`, `PermissionEnforcementFilter`, `RequirePermission`) + exception mappers sang SDK; plugin bật `quarkus.index-dependency.plugin-sdk`.
- [x] Khai báo backend trong `plugin.json`: `storage_scope`, `relations` (core/plugin), `repositories`, `apis`, `websockets`.
- [x] Core deployer/compose cấp `QUARKUS_DATASOURCE_*` + schema; plugin `application.properties` không còn DB/security config.
- [ ] Đưa DDL/Flyway migration vào manifest để core thi hành hoàn toàn (hiện Flyway vẫn chạy trong plugin).
- [ ] Xoá `plugins/catalog/web/src/app/core` trừ `catalog-admin.service.ts` (hiện còn `plugin-permission-checker.ts`).

## 3. Tiêu chí nghiệm thu

- `grep plugins/catalog` trong core `styles.css`/tsconfig = 0.
- Plugin `core` chỉ còn service nghiệp vụ catalog.
- Backend plugin chỉ còn entity/DTO/service/resource nghiệp vụ; API envelope/runtime lấy từ `plugin-sdk`.
- Web, plugin, mobile build PASS; route-state/context-menu vẫn hoạt động.
- Không đổi API contract hay DB.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Tạo task sau phản hồi "đã có thư viện chung sao plugin vẫn viết riêng core/CSS" | Chủ dự án |
| 0.2 | 2026-10-27 | Frontend: `ApiService`/`API_BASE_URL`, `PathListState`, `query`, `authHeaderInterceptor`, plugin-owned Tailwind entry. Backend: `plugins/sdk` + `plugin-sdk` dependency cho API envelope/enums. Plugin build reactor PASS; API direct 200. Runtime filters giữ plugin-local | Developer Agent |
| 0.3 | 2026-10-27 | Runtime filters + mappers sang SDK (Quarkus index dependency PASS); plugin.json khai báo relations/repositories/apis/websockets; core cấp datasource env; plugin app properties tối giản; API direct 200 | Chủ dự án chỉ đạo |
