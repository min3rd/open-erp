# [FEAT-28] Loading Progress & Skeleton Theo Vùng

| Trường | Giá trị |
| :--- | :--- |
| ID / sprint / severity / trạng thái | FEAT-28 / Sprint 04 / High / To Do |
| Owner / reviewer / cập nhật | Developer (chưa phân công) / Chưa phân công / 2026-10-05 |
| Input / dependency | [CONF-S04-001](../04_confirmation/01_CONF-S04-001_sprint_04_scope.md) (Draft) / [DES-UI-S04-002](../06_designs/ui_ux/02_DES-UI-S04-002_motion_icon_context_menu_skeleton.md) |

## 1. Nhu cầu và phạm vi

Là người dùng, tôi muốn thấy thanh loading trên cùng trang và các vùng hiển thị skeleton riêng, **không bị chặn bởi vùng chậm nhất**.

- In-scope: `LoadingService` + HTTP interceptor + `TopProgressBar`; `app-skeleton`/`app-skeleton-table`; mô hình trạng thái vùng `idle/loading/empty/error/loaded`; tách `forkJoin` gộp thành tải theo vùng ở các màn trọng yếu.
- Out-scope: spinner trong từng vùng (thay bằng skeleton); tách vùng gây N+1.

## 2. AC và truy vết

| AC đầy đủ | Given/When/Then | Design/version | Test case/evidence |
| :--- | :--- | :--- | :--- |
| CONF/AC-11 | Có hoạt động tải ⇒ thanh progress trên cùng trang | [DES-UI-S04-002](../06_designs/ui_ux/02_DES-UI-S04-002_motion_icon_context_menu_skeleton.md) §4.1 | Not Run |
| CONF/AC-12 | Mỗi vùng skeleton riêng, vùng nhanh hiện trước | DES-UI-002 §4.2/§4.3 | Not Run |
| CONF/AC-13 | Không nhảy layout; empty/error rõ ràng | DES-UI-002 §4.2/§4.3 | Not Run |

## 3. Task con đề xuất (Reserved)

| ID/dự kiến | Owner | depends_on | Write scope | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| TASK-365 `LoadingService` + interceptor + `TopProgressBar` (Web + Mobile) | Developer | FEAT-24 | `shared`, web/mobile layouts | Reserved |
| TASK-366 `app-skeleton`/`app-skeleton-table` | Developer | — | `shared/components/skeleton` | Reserved |
| TASK-367 tách vùng load độc lập (organization, roles, members, marketplace, sample-records, dashboard) | Developer | TASK-365, TASK-366 | web feature components | Reserved |

## 4. Bàn giao

Chưa có code. Ưu tiên màn đang gộp `forkJoin`; đo lại thời gian hiển thị vùng nhanh khi QA.
