# [TASK-436] Employee Mobile self-service

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-436 / Task / Sprint 07 |
| Severity / trạng thái | High / **Done (QA)** — Ionic 390×844 7/7, drawer link/switcher PASS |
| Owner/agent / reviewer | Developer / Architect + QA |
| Cập nhật / input version | 2026-10-30 / DES-UI 0.2, CONF Q25 |
| depends_on / blocks / parent | TASK-435/438 / QA / FEAT-37 |
| Write scope / baseline | `src/frontend/mobile/**`, `plugins/employee/web/**`; working tree |

## 1. Mục tiêu

Mobile self-service: xem/sửa allowlist, gửi/rút đề xuất, tài liệu của mình, directory/org chart read-only, tenant switcher.

## 2. Thao tác

- [x] Mobile route `/apps/:pluginKey`; app list trong drawer; touch ≥40px (min-h-10); safe-area dùng shared drawer.
- [x] Self edit/submit/withdraw; document view/download qua plugin screen.
- [x] Directory simplified; switcher trong drawer/user menu.
- [x] Browser 390×844 harness PASS (overflow 0, touch ≥40px); app thật PASS 7/7.

## 3. Tiêu chí & kiểm chứng

- [x] AC-19/25/33/34/35 phần code; overflow 0 chờ browser.
- [x] Không lộ hồ sơ người khác (self API resolve JWT).
- [x] Mobile build PASS.

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run mobile:build` | **Pass** | 997.26 kB initial |
| Browser Ionic app thật 390×844 | **Pass** 7/7 | login/menu/app/deep link, touch ≥40px, 0 console; [evidence](../08_testing/evidence/s07_qa_real/mobile_ionic_employee_390x844.png) |

## 4. Bàn giao

Files: mobile/plugin. Blocker: TASK-435/438. Chuyển QA.

## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Tạo task; To Do | Architect/PM |
| 0.2 | 2026-10-30 | App link drawer, switcher, plugin screen; mobile build PASS; browser pending | Developer |
| 0.3 | 2026-10-30 | Ionic app thật 390×844 7/7; BUG-171/172 resolved | QA; TR-S07-001 1.3 |
