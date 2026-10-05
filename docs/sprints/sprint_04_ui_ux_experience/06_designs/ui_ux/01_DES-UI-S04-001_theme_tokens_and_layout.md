# [DES-UI-S04-001] Thiết Kế Theme Tokens & Layout

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-UI-S04-001 / Thiết kế UI/UX / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-05 |
| Owner / reviewer | Solution Architect / Chưa review |
| Đầu vào | [CONF-S04-001](../../04_confirmation/01_CONF-S04-001_sprint_04_scope.md) (Draft), [SOL-S04-001](../../05_solutions/01_SOL-S04-001_ui_platform_architecture.md) |
| Đọc trước / đọc tiếp | [SOL-S04-001](../../05_solutions/01_SOL-S04-001_ui_platform_architecture.md) / [DES-UI-S04-002](02_DES-UI-S04-002_motion_icon_context_menu_skeleton.md) |

## 1. Phạm Vi

Đặc tả tầng token, registry theme, cách áp theme theo tenant, và ràng buộc mật độ/hình dạng. Không mô tả code thật (sẽ ở bước 07). Truy vết: AC-01, AC-02, AC-03, AC-17.

## 2. Kiến Trúc Token

### 2.1. Ba tầng

| Tầng | Ví dụ tên | Vai trò |
| :--- | :--- | :--- |
| Primitive | `--op-slate-500`, `--op-sky-600` | Bảng màu thô, không dùng trực tiếp trong component |
| Semantic | `--op-surface`, `--op-surface-muted`, `--op-text`, `--op-text-muted`, `--op-border`, `--op-accent`, `--op-accent-contrast`, `--op-danger`, `--op-warning`, `--op-success` | Component **chỉ** dùng tầng này (qua utility Tailwind) |
| Theme | `[data-theme="industrial"][data-mode="light"] { --op-surface: … }` | Gán giá trị primitive ⇒ semantic cho từng theme × mode |

### 2.2. Shape & density token (quan trọng)

| Token | Mặc định (`industrial`) | Theme thay thế (đề xuất) |
| :--- | :--- | :--- |
| `--op-radius-control` | `0` (sharp) | `2px`–`6px` (soft) |
| `--op-radius-container` | `0` | `4px`–`8px` |
| `--op-radius-pill` | `0` | `2px`–`9999px` **chỉ cho badge/toggle**, cấm cho nút/khung lớn |

**Bất biến áp cho MỌI theme** (không theme nào được vi phạm):

| Bất biến | Giá trị |
| :--- | :--- |
| Cỡ chữ nội dung | `text-xs` (12px) / `text-sm` (13px) |
| Chiều cao dòng bảng | 28–34px |
| Padding/lề | `p-1`, `p-1.5`, `p-2`, `gap-1`, `space-y-1.5` |
| Bo góc lớn kiểu consumer | **Cấm** (`rounded-xl`, `rounded-full` cho nút/khung) |
| Theme mặc định | **Bắt buộc sharp** (`rounded-none` / `rounded-sm`) |

> Nguồn: chủ dự án chốt 2026-10-05 — "vuông vắn chỉ cho giao diện mặc định"; đã cập nhật [ui_ux_standards](../../../../../.agents/rules/ui_ux_standards.md) mục 2 và [AGENTS.md](../../../../../AGENTS.md).

### 2.3. Tích hợp Tailwind v4

- `styles.css` khai báo `@theme` map semantic token ⇒ utility: `bg-surface`, `text-muted`, `border-default`, `bg-accent`…
- Component chuyển dần từ `neutral-*` cứng sang semantic utility. Có **checklist rà soát** để không còn `neutral-*` trong template sau khi hoàn tất (cho phép ngoại lệ: nền overlay `bg-neutral-950/40`).
- Theme áp bằng thuộc tính trên `<html>`:

```html
<!-- ví dụ minh hoạ -->
<html data-theme="industrial" data-mode="dark" class="dark">
```

## 3. Registry Theme

| Mã (`ThemeId`) | Tên | Hình dạng | Trạng thái |
| :--- | :--- | :--- | :--- |
| `industrial` | Industrial (**mặc định**) | `SHARP` | Bắt buộc |
| `slate-blue` | Slate Blue | `SOFT` | Bắt buộc |
| `emerald` | Emerald | `SOFT` | Bắt buộc |
| `amber` | Amber | `SOFT` | Tùy chọn |

- Registry là dữ liệu TS (id, nameKey, shape, light/dark token set) trong `src/frontend/shared/theme/`.
- `ThemeId` thêm vào `shared/enums` (cạnh `ThemeMode` hiện có), không tạo enum phân mảnh.
- Mỗi entry **bắt buộc** có đủ token Light và Dark; thiếu ⇒ lỗi build (kiểm tra bằng script).

## 4. Áp Theme Theo Tenant (AC-01, AC-17)

| Bước | Hành vi |
| :--- | :--- |
| Trước đăng nhập | Dùng theme đã cache ở `localStorage` (tránh FOUC) hoặc `industrial` mặc định. |
| Sau đăng nhập | Gọi API lấy UI preferences của tenant → áp `data-theme`/`data-mode`; ghi cache. |
| Khi tenant đổi theme | Mọi người dùng của tenant nhận theme mới ở lần tải/kế tiếp; theme switcher chỉ hiển thị cho người có quyền quản trị tenant. |
| Mode Light/Dark | Vẫn là lựa chọn **của người dùng** (như hiện tại) trừ khi chốt khác; theme là của tenant, mode là của người dùng. |

> Ghi chú thiết kế: Q2 chốt **theme theo tenant**; **mode** giữ theo người dùng để không phá thói quen sáng/tối. Nếu khách muốn mode cũng theo tenant, cập nhật CONF + tài liệu này.

## 5. Hình Dạng Theo Theme

- `ShapeVariant` (`SHARP`/`SOFT`) đã có trong `shared/enums`; theme ánh xạ tới token radius.
- Component dùng utility bán kính theo token (`rounded-control`), **không** hardcode `rounded-sm`/`rounded-md`.
- Theme `SOFT` vẫn cấm bo tròn lớn trên nút/khung; chỉ badge/toggle được phép pill.

## 6. Mobile (Ionic)

- Áp cùng `data-theme`/`data-mode`; đồng bộ biến Ionic cần thiết (nền, chữ, accent) từ semantic token.
- Giữ lớp `ion-palette-dark` cho dark mode; theme mới thêm override màu Ionic.
- Kiểm thử 390×844: không tràn ngang, touch target ≥ 40px.

## 7. Truy Vết & Chưa Kiểm Chứng

| AC | Phần thiết kế |
| :--- | :--- |
| AC-01 | §2.3, §3, §4 |
| AC-02 | §2.1, §3, §6 |
| AC-03 | §2.2 (bất biến) |
| AC-17 | §4 |

**Chưa kiểm chứng**: chưa có mã nguồn/token thật, chưa đo tương phản, chưa kiểm FOUC. Số theme > 3 và quyết định mode theo tenant hay người dùng chờ khách chốt (CONF §5).
