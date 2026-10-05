# [FEAT-24] Theme System & Design Tokens

| Trường | Giá trị |
| :--- | :--- |
| ID / sprint / severity / trạng thái | FEAT-24 / Sprint 04 / High / To Do |
| Owner / reviewer / cập nhật | Developer (chưa phân công) / Chưa phân công / 2026-10-05 |
| Input / dependency | [CONF-S04-001](../04_confirmation/01_CONF-S04-001_sprint_04_scope.md) (Draft) / [SOL-S04-001](../05_solutions/01_SOL-S04-001_ui_platform_architecture.md), [DES-UI-S04-001](../06_designs/ui_ux/01_DES-UI-S04-001_theme_tokens_and_layout.md), [DES-API-S04-001](../06_designs/api/01_DES-API-S04-001_theme_preferences_and_i18n.md) |

## 1. Nhu cầu và phạm vi

Là chủ workspace, tôi muốn đổi "bộ mặt" giao diện của tenant (màu sắc, layout, hình dạng component) để phù hợp nhận diện, nhưng **vẫn hiển thị nhiều thông tin nhất** và **mỗi theme đủ Light/Dark**.

- In-scope: 3 tầng token; registry **4 theme** (industrial mặc định, slate-blue, emerald, amber); theme **theo tenant**; **mode Light/Dark theo người dùng**; shape do theme quyết định (mặc định sharp); plugin kế thừa token chung.
- Out-scope: theme do plugin tự định nghĩa màu; tuỳ biến token tự do bởi người dùng cuối.
- Web + Mobile cùng dùng token chung.

## 2. AC và truy vết

| AC đầy đủ | Given/When/Then | Design/version | Test case/evidence |
| :--- | :--- | :--- | :--- |
| CONF/AC-01 | Đổi theme tenant ⇒ toàn UI đổi, không FOUC | [DES-UI-S04-001](../06_designs/ui_ux/01_DES-UI-S04-001_theme_tokens_and_layout.md) §2.3/§4 | Not Run |
| CONF/AC-02 | Mỗi theme đủ Light/Dark, tương phản AA | DES-UI-001 §2.1/§6 | Not Run |
| CONF/AC-03 | Không giảm mật độ; chỉ mặc định sharp | DES-UI-001 §2.2 | Not Run |
| CONF/AC-17 | Người dùng khác trong tenant nhận đúng theme | DES-UI-001 §4, DES-API-001 §3 | Not Run |

## 3. Task con đề xuất (Reserved — tạo file ở bước 07)

| ID/dự kiến | Owner | depends_on | Write scope | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| TASK-355 token 3 tầng + `@theme` Tailwind | Developer | FEAT-24 | `shared/theme`, `web/src/styles.css`, `mobile/src/global.scss` | Reserved |
| TASK-356 registry theme + `ThemeId` + theme switcher theo tenant | Developer | TASK-355 | `shared/enums`, `shared/theme`, `shared/components/theme-switcher` | Reserved |
| TASK-357 API tenant ui-preferences + migration `ui_theme` | Developer | DES-API-001 | backend `modules/iam`, migration `V4.0.0` | Reserved |
| TASK-358 rà soát `neutral-*` → semantic utility + regression mật độ | Developer | TASK-356 | toàn bộ template shared/web/mobile | Reserved |

> Danh sách là **đề xuất phân rã**, chưa phải file item. FEAT Done khi các task được tạo file, hoàn tất và AC đã QA browser.

## 4. Bàn giao

Baseline (commit/working tree), output, test đã/chưa chạy, reviewer. Chưa có code; xem kế hoạch tại [sprint_plan](../sprint_plan.md).
