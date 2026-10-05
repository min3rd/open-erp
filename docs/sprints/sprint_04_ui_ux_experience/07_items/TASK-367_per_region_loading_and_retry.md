# [TASK-367] Tách vùng tải độc lập + retry theo vùng

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-367 / Task / Sprint 04 |
| Severity / trạng thái | High / To Do |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved |
| depends_on / blocks / parent | TASK-365, TASK-366 / — / [FEAT-28](../07_items/FEAT-28_loading_bar_and_skeletons.md) |
| Write scope / baseline | web feature components (organization, roles, members, marketplace, sample-records, dashboard) / working tree |

## 1. Mục tiêu và scope

Mỗi vùng tải độc lập: vùng nhanh hiện nội dung trước, vùng chậm hiện skeleton; lỗi cô lập theo vùng + nút **Thử lại** (AC-12, AC-13, Q17). Truy vết DES-UI-S04-002 §4.3.

- In-scope: chuyển `forkJoin` gộp thành signal trạng thái theo vùng (`idle/loading/empty/error/loaded`); skeleton/retry từng vùng; `aria-busy`/`aria-live`.
- Out-of-scope: tách vùng gây N+1 (chỉ tách khi thực sự độc lập).

## 2. Các thao tác

- [ ] Organization: branches / departments / memberships độc lập.
- [ ] Role-matrix, members, plugin-marketplace, sample-records, dashboard (thẻ số liệu).
- [ ] Mỗi vùng: skeleton khi tải, thông báo + Thử lại khi lỗi, empty state rõ.

## 3. Tiêu chí và kiểm chứng

- [ ] AC-12: vùng nhanh không chờ vùng chậm.
- [ ] AC-13: không nhảy layout, empty/error rõ.
- [ ] Frontend build PASS; QA browser (đo thời điểm hiện vùng nhanh).
- [ ] Reviewer xác nhận.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` (web/mobile) | Not Run | — |
| QA browser tải chậm giả lập | Not Run | — |

## 4. Bàn giao và lịch sử

Chưa triển khai. Phụ thuộc TASK-365/366. Bước tiếp: QA dual-mode.
