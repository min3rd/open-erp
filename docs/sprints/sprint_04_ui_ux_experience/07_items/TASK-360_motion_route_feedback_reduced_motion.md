# [TASK-360] Chuyển động route + phản hồi hành động + reduced-motion

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-360 / Task / Sprint 04 |
| Severity / trạng thái | Medium / **In Review** (code + build PASS, chờ QA browser) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved |
| depends_on / blocks / parent | TASK-359 / — / [FEAT-25](../07_items/FEAT-25_motion_and_animation_system.md) |
| Write scope / baseline | `web/src/styles.css`, `mobile/src/styles.css`, `sharp-button`, `sharp-toggle` |

## 1. Mục tiêu và scope

Chuyển động đổi route (nhẹ) + phản hồi nhấn + tôn trọng `prefers-reduced-motion` (AC-04, AC-05, Q18).

- Route: `router-outlet + *` fade + 2px translate 220ms (Web; bao cả outlet lồng nhau).
- Phản hồi: `sharp-button` + `sharp-toggle` `.op-press` (scale .97 + màu, 120ms).
- `prefers-reduced-motion: reduce` tắt `.op-pop`, `.op-stagger > *`, route rule, `.op-press` (giữ trạng thái tức thời).

## 2. Các thao tác

- [x] Route rule (web-only).
- [x] `.op-press` cho nút/toggle.
- [x] Khối reduced-motion (kèm rule sẵn có cho progress bar/skeleton).

## 3. Tiêu chí và kiểm chứng

- [x] AC-05: reduced-motion tắt chuyển động không thiết yếu, chức năng không đổi.
- [x] Build web + mobile PASS.
- [ ] QA browser: bật reduced-motion và kiểm lại.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` (web/mobile) | PASS | bundle generation complete |
| QA browser reduced-motion | Not Run | chờ đợt QA |

## 4. Bàn giao và lịch sử

Không thêm enum `MotionVariant` (lớp CSS dùng chung đã đủ; tránh trùng với enum do task i18n đang sửa). Bước tiếp: QA dual-mode.
