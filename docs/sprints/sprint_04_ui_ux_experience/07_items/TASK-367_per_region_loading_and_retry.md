# [TASK-367] Tách vùng tải độc lập + retry theo vùng

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-367 / Task / Sprint 04 |
| Severity / trạng thái | High / **In Progress** (organization xong; các màn khác còn lại) |
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
- [ ] Role-matrix, members, plugin-marketplace, sample-records, dashboard (thẻ số liệu).
- [x] Mỗi vùng: skeleton khi tải, thông báo + Thử lại khi lỗi, empty state rõ (organization).

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` (web) | PASS | dev server :4300 rebuild sạch |
| QA browser organization (list + graph) | PASS | cây gốc→chi nhánh→phòng ban vẫn đúng sau khi tách vùng |

## 4. Bàn giao và lịch sử

Đã làm cho **organization**: tách `forkJoin` gộp thành `loadBranches()`/`loadDepartments()`/`loadMemberships()` với signal trạng thái riêng (`*Loading`/`*Error`); cây hiện `app-skeleton-table` khi tải + nút **Thử lại** khi lỗi; bảng chi nhánh dùng `branchesLoading` + retry; memberships lỗi không chặn cây. Drawer state áp khi vùng chi nhánh/phòng ban xong.

Còn lại: role-matrix, members, plugin-marketplace, sample-records, dashboard. Phụ thuộc TASK-365/366 (đã xong).
