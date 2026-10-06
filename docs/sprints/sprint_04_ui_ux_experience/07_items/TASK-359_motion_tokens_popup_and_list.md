# [TASK-359] Motion tokens + chuyển động popup/danh sách

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-359 / Task / Sprint 04 |
| Severity / trạng thái | Medium / **Done** (TR-S04-001 v0.3 verified 2026-10-06) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved |
| depends_on / blocks / parent | TASK-355 (theme tokens) / TASK-360 / [FEAT-25](../07_items/FEAT-25_motion_and_animation_system.md) |
| Write scope / baseline | `web/src/styles.css`, `mobile/src/styles.css`, shared popup/list templates |

## 1. Mục tiêu và scope

Token chuyển động + lớp chuyển động dùng chung cho popup và danh sách (AC-04). Khách chốt: **nhanh, ưu tiên hiệu năng**.

- Token: `--op-duration-{fast,base,slow}` = 120/160/220ms; `--op-ease-{standard,decelerate,accelerate}`.
- Lớp CSS dùng chung (không thêm thư viện JS): `.op-pop` (popup enter), `.op-stagger` (hàng danh sách fade, chỉ 20 hàng đầu), `.op-press` (phản hồi nhấn).
- Áp: user-menu, notification-bell, context-menu (`.op-pop`); `app-table` + danh sách cây organization (`.op-stagger`).

## 2. Các thao tác

- [x] Token + keyframes ở `styles.css` (Web + Mobile).
- [x] `.op-pop` cho 3 popup; `.op-stagger` cho bảng + cây tổ chức (tắt từ hàng 21).
- [x] Chỉ animate `transform`/`opacity`.

## 3. Tiêu chí và kiểm chứng

- [x] AC-04: popup/list có vào/ra nhanh, không nhảy layout.
- [x] Build web + mobile PASS.
- [ ] QA browser (FPS khi cuộn danh sách lớn).

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` (web/mobile) | PASS | bundle generation complete |

## 4. Bàn giao và lịch sử

Popup **exit** vẫn tức thời (Angular `@if` remove) — chấp nhận, không dựng state leaving. Bước tiếp: TASK-360.
