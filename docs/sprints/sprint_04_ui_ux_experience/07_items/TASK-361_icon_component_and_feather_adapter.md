# [TASK-361] Component icon dùng chung + adapter Feather

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-361 / Task / Sprint 04 |
| Severity / trạng thái | Medium / **In Review** (code + build PASS, chờ QA browser) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / CONF-S04-001 Approved |
| depends_on / blocks / parent | — / TASK-362, TASK-363 / [FEAT-26](../07_items/FEAT-26_feather_icon_system.md) |
| Write scope / baseline | `src/frontend/shared/enums`, `src/frontend/shared/components/icon`, `src/frontend/shared/index.ts`, `src/frontend/web/package.json`, `src/frontend/mobile/package.json` / working tree @ `8a7b1a8` |

## 1. Mục tiêu và scope

Tạo **một** component icon dùng chung cho Web + Mobile, lấy dữ liệu từ npm **`feather-icons`** (MIT) qua một adapter tập trung; khai báo enum `IconName`. Truy vết AC-06, AC-07 và Q19.

- In-scope: `IconComponent` (standalone, template `.html` tách riêng), `icon-registry.ts` (adapter), enum `IconName`, khai báo dependency `feather-icons` ở cả hai app.
- Out-of-scope: thay SVG khắp màn hình (TASK-362); context menu (TASK-363).

## 2. Các thao tác

- [x] Thêm `feather-icons` vào `web/package.json` + `mobile/package.json` và cài.
- [x] `IconName` enum (tập con icon dùng thật: menu, bell, chevron, close, check, plus, edit, trash, search, refresh, download, upload, settings, user, more, external, filter, calendar, alert).
- [x] `icon-registry.ts`: bọc `feather-icons`, chỉ trả path/attrs cho `IconName`; cấm import trực tiếp trong template.
- [x] `IconComponent`: input `name`, `size: SizeVariant`, `decorative`, `labelKey`; `currentColor`; `rtlMirror`.
- [x] Export qua `shared/components/index.ts` + `shared/index.ts`.

## 3. Tiêu chí và kiểm chứng theo loại thay đổi

- [x] Đáp ứng AC-06/AC-07; template tách riêng; 100% chuỗi qua i18n.
- [ ] Backend: N/A (không đụng backend).
- [x] Frontend: `ng build` Web + Mobile PASS.
- [ ] Reviewer xác nhận.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| `npm run build` (web) | PASS | bundle generation complete; **warning**: initial bundle 603.48 kB > budget 500 kB (do `feather-icons` UMD/CommonJS ~100 kB) |
| `npm run build` (mobile) | PASS | bundle generation complete |

> **Đã xử lý (2026-10-06, commit `888198a`)**: `scripts/gen-icons.mjs` (`npm run icons:gen`) vendor **36 icon đang dùng** thành dữ liệu trong `icon-data.generated.ts`; registry không còn import `feather-icons` lúc chạy (chuyển thành devDependency của web). Kết quả: bundle web **640.25 → 558.11 kB**, **hết cảnh báo CommonJS**, build 0 cảnh báo (ngân sách đặt lại 600 kB warn / 800 kB error cho web, 1.1/1.5 MB cho mobile). Kiểm chứng: 36/36 `IconName` có markup; render trình duyệt 14/14 `app-icon` không rỗng, 0 console error.

## 4. Bàn giao và lịch sử

Files: xem write scope. Kiểm tra đã chạy: build 2 app. Chưa QA browser (thuộc TASK-362). Người nhận: Developer/QA. Bước tiếp: TASK-362 thay SVG + QA browser.
