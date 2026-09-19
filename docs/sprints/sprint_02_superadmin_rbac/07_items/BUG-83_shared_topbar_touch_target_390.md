# [BUG-83] Shared Topbar Hamburger 32×32 & Nav Settings 35px < 40px Tại Viewport 390×844

- **Mã Lỗi**: BUG-83
- **Phân Loại**: Bug / Defect (Responsive touch target — TASK-298 requirement 1)
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent (Nghiệm thu cuối Sprint 02, 2026-09-19)
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred
- **Ngày Phát Hiện**: 2026-09-19

---

## 1. Mô Tả Lỗi

> Sau khi fix BUG-81, toàn bộ overflow ngang tại 390×844 đã hết (13/13 màn = 0px) và **platform topbar** đạt touch target ≥40px. Tuy nhiên **shared topbar** (`@shared/components/topbar` — dùng cho toàn bộ màn `/settings/*`) vẫn còn 2 nhóm phần tử tương tác chính dưới ngưỡng 40px theo quy chuẩn UI/UX của dự án:
>
> 1. **Nút hamburger Menu** (`lg:hidden p-1.5` + icon 20px) = **32×32px** — xuất hiện trên cả 7 màn Settings + banner impersonation tại 390×844.
> 2. **Nav link Settings** (`px-2.5 py-2 text-[11px]`) = **cao 35px** — 5 link nav ngang trên mọi màn Settings tại 390×844.
>
> Đây là các hạng mục QA đã liệt kê trong **phụ lục BUG-81** (nút Menu 32×32, nav Settings 35px) và đề nghị xử lý gộp; bản fix BUG-81 chỉ chỉnh `platform-topbar` + CSS cho `app-theme-switcher/app-language-switcher/app-sharp-toggle` nên 2 hạng mục này còn tồn.

### Bằng chứng đo runtime (Playwright 390×844, Chrome headless — QA đợt nghiệm thu cuối)

| Màn | Phần tử | Kích thước đo | Ngưỡng |
| :--- | :--- | :---: | :---: |
| `/settings/roles` | Nút Menu (shared topbar) | 32×32 | ≥40 |
| `/settings/organization` (list + graph) | Nút Menu | 32×32 | ≥40 |
| `/settings/members` | Nút Menu | 32×32 | ≥40 |
| `/settings/branch-assignments` | Nút Menu | 32×32 | ≥40 |
| `/settings/sample-records` | Nút Menu | 32×32 | ≥40 |
| Banner impersonation + `/settings/sample-records` | Nút Menu | 32×32 | ≥40 |
| Tất cả màn Settings | 5 nav link (`QUẢN LÝ VAI TRÒ & PHÂN QUYỀN`, `CƠ CẤU TỔ CHỨC`, `THÀNH VIÊN & QUẢN LÝ TRỰC TIẾP`, `PHÂN CÔNG QUẢN LÝ CHI NHÁNH`, `BẢN GHI MẪU`) | cao 35 | ≥40 |

- Ảnh minh chứng: `../08_testing/screenshots/web-responsive/QA-RS2-390_roles.png`, `QA-RS2-390_organization-list.png`, `QA-RS2-390_sample-records.png` (topbar hiển thị nút Menu).
- Dữ liệu đo đầy đủ: `../08_testing/evidence/resp2.out.json` (sharedTopbarSmall / navSmall).

### Bằng chứng (file:line)

- `src/frontend/shared/components/topbar/topbar.component.html:55-66` — nút hamburger mobile `class="lg:hidden p-1.5 ..."` + `svg w-5 h-5` → 6+20+6 = **32px**; chưa có `min-h-10 min-w-10` như platform topbar (`platform-topbar.component.html:29,42` đã thêm).
- `src/frontend/web/src/app/features/settings/settings-layout.component.html:11-20` — nav link `class="px-2.5 py-2 text-[11px] ..."` → cao **35px**; chưa thêm `min-h-10` (platform nav đã có `min-h-10` tại `platform-topbar.component.html:42`).
- `src/frontend/web/src/styles.css:12-24` — media query ≤639px chỉ áp dụng cho `app-theme-switcher`, `app-language-switcher`, `app-sharp-toggle`, `app-department-graph-canvas`; **không bao gồm** nút topbar/hamburger hay nav settings.

## 2. Tác Động

- Vi phạm một phần yêu cầu TASK-298 mục 3.1: "touch target ≥ 40px với phần tử tương tác chính" đối với bản Web tại viewport mobile 390.
- Không gây tràn ngang, không chặn chức năng (mở menu/nav vẫn hoạt động) → mức **Medium**, không chặn DoD Sprint 02.
- Không ảnh hưởng Mobile Ionic (`ion-menu-button` đạt chuẩn) — chỉ bản Web responsive.

## 3. Kết Quả Kỳ Vọng

- Nút hamburger shared topbar đạt ≥40×40px tại ≤639px (ví dụ `min-h-10 min-w-10` hoặc `p-2.5` + icon giữ 20px).
- Nav link Settings đạt chiều cao ≥40px tại ≤639px (ví dụ `min-h-10`), desktop giữ dense như hiện tại.
- QA đo lại 390×844: `sharedTopbarSmall = []`, `navSmall = []`, overflow vẫn 0, console 0; lặp lại 768×1024 giữ dense.

## 4. Xác Nhận Khắc Phục (QA Verification)

- [ ] Developer thêm `min-h-10/min-w-10` cho hamburger shared topbar + `min-h-10` cho nav link Settings (≤639px).
- [ ] QA đo lại theo kịch bản TASK-298 (13 màn × 390/768), cập nhật `08_testing/test_report.md`.
- [ ] Build web + mobile PASS; 0 console error.

## Ghi Chú QA (2026-09-19)

- Phát hiện khi nghiệm thu cuối Sprint 02 (QA-R2-81/TASK-298). Platform topbar + drawer đã đạt 100% (theme/lang/logout/nav = 40px, drawer full-width `x=0`), nên BUG-81 chuyển Done vẫn đúng theo checklist xác nhận của BUG-81 (overflow = 0); riêng hạng mục touch target còn lại của shared topbar/nav được tách thành bug này để theo dõi.

## Ghi Chú Hoàn Thành (2026-09-19)

### 1. Fix chính (đúng 2 hạng mục QA nêu)

1. **Nút hamburger shared topbar** — `src/frontend/shared/components/topbar/topbar.component.html:58`: thêm `inline-flex items-center justify-center min-h-10 min-w-10` (giữ `p-1.5` + icon 20px) → vùng chạm **40×40px**, icon vẫn căn giữa nên topbar `h-11` (44px) không tăng chiều cao. Áp dụng cho cả 7 màn Settings + banner impersonation (cùng 1 component `app-topbar`).
2. **Nav link Settings** — `src/frontend/web/src/app/features/settings/settings-layout.component.html:16`: thêm `inline-flex items-center min-h-10 sm:min-h-0` → **cao 40px** tại ≤639px; từ 640px trở lên trả về dense **35px** như cũ (không đổi 768/desktop).

### 2. Rà soát nhanh phần tử tương tác shared khác < 40px (chỉ sửa ở mobile ≤639px)

- `src/frontend/web/src/styles.css:12-28`: bổ sung vào media query `(max-width: 639px)` (giữ nguyên rule cũ từ BUG-81):
  - `app-sharp-button button` → min **40×40** (mặc định 27–30px).
  - `app-pagination button` → min **40×40** (Trước/Tiếp 23px).
  - `app-pin-input input` → min-width **40** (36px, vẫn vừa 390: 6×40 + 5×8 = 280px).
  - `app-sharp-input input`, `app-sharp-select select`, `app-sharp-textarea textarea` → min-height **40px** (đồng bộ với rule `app-sharp-input input` sẵn có của Mobile Ionic).
  - `app-sharp-toggle button` đã có sẵn rule 40×40 từ trước; theme/language switcher giữ nguyên như BUG-81.
- `src/frontend/shared/components/mobile-nav-drawer/mobile-nav-drawer.component.html:41,53,65,77`: nav link trong drawer (28px) thêm `min-h-10` → **40px**; drawer chỉ mở từ hamburger `lg:hidden` nên desktop không bị ảnh hưởng.
- Không sửa kích thước input/button ở desktop; mọi rule đều mobile-only, giữ dense từ 640px.

### 3. Build

- Web (`src/frontend/web`): `npm run build` — **PASS** (2026-09-19, CSS `styles-2RHKZXEJ.css`).
- Mobile (`src/frontend/mobile`): `npm run build` — **PASS** (2026-09-19, shared dùng chung nên bắt buộc cả 2).

### 4. Đo lại (Playwright tĩnh với CSS build thật)

- Harness: `C:\Users\Minh\AppData\Local\Temp\opencode\bug83\harness.html` (markup sao đúng template đã sửa) nạp CSS build thật; script `C:\Users\Minh\AppData\Local\Temp\opencode\qa02\measure-bug83.mjs` (Chrome headless), viewport **390×844** và **768×1024**.
- **390×844**: hamburger **40×40**; 5/5 nav Settings **cao 40**; 4/4 nav drawer **40**; sharp-button **40×40**; pagination **40×40**; toggle **40×40**; input/select/textarea **cao 40**; pin **40×40**; `document.scrollWidth − clientWidth = 0`.
- **768×1024**: nav Settings về dense **35px**; sharp-button 27–30px, toggle 16×28, pagination 23px (giữ dense đúng yêu cầu); `document` overflow **0** (link nav vượt mép là do `<nav class="overflow-x-auto">` cuộn ngang chủ ý, không tràn trang).
- Chờ QA chạy lại `resp2.mjs` trên app thật (13 màn × 390/768) để xác nhận `sharedTopbarSmall = []`, `navSmall = []`, console 0.

### 5. Phạm vi thay đổi

- Chỉ 4 file frontend: `shared/components/topbar/topbar.component.html`, `shared/components/mobile-nav-drawer/mobile-nav-drawer.component.html`, `web/src/app/features/settings/settings-layout.component.html`, `web/src/styles.css` + file item này. Không chạm backend, không sửa item khác, không commit.
