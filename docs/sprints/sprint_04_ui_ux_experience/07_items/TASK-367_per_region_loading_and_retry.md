# [TASK-367] Tách vùng tải độc lập + retry theo vùng

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-367 / Task / Sprint 04 |
| Severity / trạng thái | High / **Done** (TR-S04-001 v0.3 verified 2026-10-06) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved |
| depends_on / blocks / parent | TASK-365, TASK-366 / — / [FEAT-28](../07_items/FEAT-28_loading_bar_and_skeletons.md) |
| Write scope / baseline | web feature components (organization, roles, members, marketplace, sample-records, dashboard) / working tree |

## 1. Mục tiêu và scope

Mỗi vùng tải độc lập: vùng nhanh hiện nội dung trước, vùng chậm hiện skeleton; lỗi cô lập theo vùng + nút **Thử lại** (AC-12, AC-13, Q17). Truy vết DES-UI-S04-002 §4.3.

- In-scope: chuyển `forkJoin` gộp thành signal trạng thái theo vùng (`idle/loading/empty/error/loaded`); skeleton/retry từng vùng; `aria-busy`/`aria-live`.
- Out-of-scope: tách vùng gây N+1 (chỉ tách khi thực sự độc lập).

## 2. Các thao tác

- [x] Organization: branches / departments / memberships độc lập.
- [x] Role-matrix (4 vùng), members (bảng vs lookups), plugin-marketplace (list/detail/notifications), sample-records (list vs lookups).
- [x] Mỗi vùng: skeleton khi tải, thông báo + Thử lại khi lỗi, empty state rõ; `aria-busy` trên vùng đang tải.
- [x] Dashboard: chỉ tải 1 thứ (notifications cho topbar) → không có gì để tách (ghi N/A có lý do).

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` (web/mobile) | PASS | 0 error |
| QA browser organization (list + graph) | PASS | cây gốc→chi nhánh→phòng ban vẫn đúng sau khi tách vùng |
| QA browser 4 màn còn lại (throttle mạng) | Not Run | chờ đợt QA |

## 4. Bàn giao và lịch sử

Đã làm: tách `forkJoin` gộp thành loader theo vùng với signal `*Loading`/`*Error`; skeleton (`app-skeleton-table`/`app-skeleton-card`/`app-skeleton`); retry chỉ chạy lại vùng lỗi (`retryPermissions`/`retryDataScopes`/`retryDetail`/`loadNotifications`).

Giữ gộp có lý do: lookups của members/sample-records (phụ trợ, all-or-nothing cho select của drawer) và dashboard (1 nguồn dữ liệu).

Phụ thuộc TASK-365/366 (đã xong). Commit `c2c8d1d` (8 file, frontend web).
