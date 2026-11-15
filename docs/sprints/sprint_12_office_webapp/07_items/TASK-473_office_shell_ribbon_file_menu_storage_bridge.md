# TASK-473: Office Shell — Workspace, Title Bar, Ribbon Động, File Dropdown, Storage Bridge & i18n

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-473` |
| **Thuộc Feature** | [FEAT-49](./FEAT-49_office_shell_file_storage_drafts_i18n.md) |
| **Loại** | Frontend Shell & Integration (Angular ≥ 22 + Tailwind v4 + Web Component) |
| **Ưu tiên** | Critical |
| **Trạng thái** | `Open` — đặc tả chi tiết 0.2, chờ chủ dự án review |
| **Phụ thuộc** | [TASK-471](./TASK-471_office_backend_scaffold_schema_api.md), [TASK-472](./TASK-472_pure_ts_zero_third_party_binary_core.md) |
| **Owner** | Developer Agent |
| **Tài liệu nguồn** | [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md), [DES-ARCH-S12-001](../06_designs/arch/01_DES-ARCH-S12-001_components_and_flows.md), [BENCH-S12-002](../03_benchmarks/02_BENCH-S12-002_m365_live_ui_verification.md), [BENCH-S12-003](../03_benchmarks/03_BENCH-S12-003_m365_feature_matrix.md) |

---

## 0. Kết quả bàn giao

1. `<op-office-webapp-app>` chạy độc lập trong ERP, có Workspace + 4 editor mount point.
2. Shell đo đúng token: Title 48, Tabs 31/36, Ribbon 76/136, Formula Bar 32, Status 24 — kiểm bằng DevTools.
3. Mọi trạng thái điều hướng nằm trên URL, F5 giữ nguyên; mở file local không phát sinh HTTP.
4. 0 emoji, 0 template inline, 100% chuỗi qua `TranslatePipe`/`TranslateDirective`.
5. Command search `Alt+Q`, Accessibility/Comments panel host, Fullscreen hoạt động và giữ trạng thái URL.

## 1. Phạm vi file

| Đường dẫn | Nội dung |
| :--- | :--- |
| `.../web/src/plugin-main.ts` | `createCustomElement` → `op-office-webapp-app` |
| `.../ui/shell/office-shell.component.ts/.html/.css` | Khung tổng, layout token |
| `.../ui/shell/office-title-bar.component.*` | App icon, tên file inline, trạng thái lưu, Search, theme |
| `.../ui/shell/office-ribbon.component.*` | Tabs + command rows theo descriptor |
| `.../ui/shell/office-file-dropdown.component.*` | Menu `File` 9 mục + submenu Export |
| `.../ui/shell/office-status-bar.component.*` | Thông số theo app, zoom, chế độ xem |
| `.../ui/shell/office-mode-menu.component.*` | `Editing` / `Viewing` |
| `.../ui/workspace/office-workspace.component.*` | App cards + Recent (list, không phải table) |
| `.../ui/shell/ribbon-descriptors/` | `word-ribbon.ts`, `excel-ribbon.ts`, `ppt-ribbon.ts`, `pdf-toolbar.ts` |
| `.../ui/drawers/office-drawer-host.component.*` | Host cho `find`, `erp-picker`, `info`, `draft-recovery` |
| `.../core/persistence/file-system-access.service.ts` | Mở/lưu file local |
| `.../core/persistence/office-draft-idb.service.ts` | IndexedDB draft |
| `.../core/persistence/erp-storage.client.ts` | Gọi API ERP qua `HttpClient` |
| `.../core/state/office-route-state.service.ts` | Đọc/ghi query params |
| `src/frontend/shared/src/lib/i18n/vi.json`, `en.json` | Bổ sung key `office.*` |

## 2. Layout & token (bắt buộc)

| Token | Giá trị | Ghi chú |
| :--- | :--- | :--- |
| `--office-title-h` | `48px` | Đo từ M365 (BENCH-002) |
| `--office-tab-h-word-ppt` | `31px` | Tab strip Word/PPT |
| `--office-tab-h-excel` | `36px` | Tab strip Excel |
| `--office-ribbon-single` | `76px` | Tổng, gồm tab + hàng lệnh 45px |
| `--office-ribbon-classic` | `136px` | Tổng, Excel mặc định |
| `--office-formula-bar` | `32px` | Chỉ Excel |
| `--office-status-h` | `24px` | Dùng chung 1 giá trị cho 3 app |
| `--office-thumb-w` | `256px` | PPT, kéo được ±80px |
| `--office-page-w/h` | `816/1056px` | Word content-box |

Quy tắc: mọi chiều cao thanh dùng token, **cấm** hardcode `h-[48px]` rải rác; nền `bg-surface`, viền `border-neutral-200 dark:border-neutral-800`, bo góc `rounded-none`/`rounded-sm`.

## 3. Yêu cầu chức năng

### 3.1 Workspace (màn hình bắt đầu)

| Mã | Yêu cầu |
| :--- | :--- |
| 473-F01 | Route `/apps/office` không có `docId` hiển thị Workspace: 4 app card (`Word`, `Excel`, `PowerPoint`, `PDF`) + nút `Mở file từ máy` + `Mở từ ERP Storage`. |
| 473-F02 | `Recent` hiển thị tối đa 8 mục dạng **list card** (icon, tên, loại, thời gian tương đối); không phải bảng nên không áp dụng invariant table. Danh sách đầy đủ nằm trong Drawer `erp-picker`. |
| 473-F03 | Recent local đọc từ IndexedDB (`drafts`), recent ERP đọc trang 1 `GET /documents?size=8`; lỗi API hiển thị banner i18n, không chặn mở file local. |
| 473-F04 | Kéo-thả file vào Workspace hoặc vào editor đang mở đều mở file; vùng drop có viền nét đứt + nhãn i18n, không dùng modal. |
| 473-F05 | Card app điều hướng `?app=word\|excel\|ppt\|pdf&mode=edit&source=new` (PDF chỉ `view`). |

### 3.2 Title Bar

| Mã | Yêu cầu |
| :--- | :--- |
| 473-F06 | Trái: app icon + tên file inline editable (Enter xác nhận, Esc hủy, blur xác nhận); rỗng → khôi phục tên cũ + toast lỗi `OFFICE_TITLE_REQUIRED`. |
| 473-F07 | Trạng thái lưu dạng **text + icon**: `Đã lưu`, `Chưa lưu`, `Đang lưu`, `Đang lưu ERP`, `Lỗi lưu`; map enum `DocumentSaveState` (`SAVED/UNSAVED/SAVING/SAVING_ERP/ERROR`). |
| 473-F08 | Giữa: ô search lệnh `Alt+Q` placeholder i18n; gõ lọc command trong ribbon hiện tại; Enter chạy lệnh đầu tiên. |
| 473-F09 | Phải: nút chuyển theme sáng/tối + nút Help mở Drawer `?drawer=shortcuts` (không mở tab ngoài). |
| 473-F10 | Nút Back về Workspace giữ nháp: nếu `UNSAVED` mở Drawer `?drawer=leave-confirm` với 3 lựa chọn `Lưu`, `Bỏ thay đổi`, `Ở lại`. |

### 3.3 Ribbon

| Mã | Yêu cầu |
| :--- | :--- |
| 473-F11 | Descriptor mỗi app khai báo `tabs[]`, mỗi tab `groups[]`, mỗi group `commands[]`; command có `id`, `labelKey`, `icon`, `shortcut?`, `disabled?`, `active?`. |
| 473-F12 | Word/PPT mặc định `SINGLE_LINE` (76px); Excel mặc định `CLASSIC` (136px); chuyển đổi qua `Ribbon Display Options` lưu `?ribbon=single\|classic`. |
| 473-F13 | Menu `Ribbon Display Options` có 2 layout + 2 chế độ hiển thị: `Always show`, `Show tabs only` (ẩn hàng lệnh, click tab mở tạm). |
| 473-F14 | Tab thiếu chỗ → gom vào `More Tabs` (overflow), không cắt mất tab. Command thiếu chỗ → menu `...` cuối nhóm. |
| 473-F15 | Tab contextual: Word hiện `Table` khi con trỏ trong bảng; PPT hiện `Shape` khi chọn shape; ẩn khi thoát ngữ cảnh. |
| 473-F16 | Mọi nút có `title` + `aria-label` i18n; trạng thái active dùng `aria-pressed`; disabled dùng `aria-disabled` + tooltip lý do. |
| 473-F17 | Không render command `SERVICE` (ẩn hoặc disabled + tooltip `OFFICE_SERVICE_REQUIRED`), không có nút chết. |

### 3.4 Menu `File`

| Mã | Yêu cầu |
| :--- | :--- |
| 473-F18 | `File` mở dropdown neo trái dưới (rộng 264px), **không** phủ toàn màn hình, đóng bằng Esc/click ngoài. |
| 473-F19 | 9 mục: `New` (submenu Word/Excel/PowerPoint), `Open` (Local/ERP), `Save` (`Ctrl+S`), `Save As` (bản sao), `Share` (nội bộ ERP), `Export` (submenu theo app), `Print`, `Rename`, `Info`. |
| 473-F20 | `New` tạo model rỗng trong RAM (chưa ghi file), đặt `source=new`, tên mặc định `Untitled.docx` (i18n). |
| 473-F21 | `Open > Local` dùng `showOpenFilePicker` nếu có, fallback `<input type=file>`; `Open > ERP` mở Drawer `?drawer=erp-picker`. |
| 473-F22 | `Save`: local có handle → ghi đè; không có handle → mở `showSaveFilePicker`, fallback tải file; ERP → `PUT /content` kèm `expected_version`. |
| 473-F23 | `Export` theo app: Word `PDF`, `Markdown`; Excel `PDF`, `CSV UTF-8`; PPT `PDF`, `JPEG slide hiện tại`; PDF chỉ `Download`. |
| 473-F24 | `Print` gọi `window.print()` trên vùng tài liệu với `@media print` đã chuẩn bị; không mở cửa sổ lạ. |
| 473-F25 | `Rename` focus vào tên file ở Title Bar; `Info` mở Drawer `?drawer=info`. |
| 473-F26 | Menu hiển thị trạng thái lưu ở đầu: `Đã lưu cục bộ` / `Đã lưu lên ERP` / `Chưa lưu` (thay cho "Autosaved online to…" của Microsoft). |

### 3.5 Status Bar & chế độ xem

| Mã | Yêu cầu |
| :--- | :--- |
| 473-F27 | Word: `Trang X / Y`, `N từ`, ngôn ngữ, nút `Separate Pages`, zoom slider + `Fit`. |
| 473-F28 | Excel: `Workbook Statistics`, zoom combobox, `Full Screen`, chuyển sheet nhanh. |
| 473-F29 | PPT: `Slide X / Y`, toggle `Notes`, `Normal/Slide Sorter`, `Present`, zoom. |
| 473-F30 | PDF: `Trang X / Y`, zoom, tải xuống. |
| 473-F31 | Mode menu đổi `?mode=edit\|view`; ở `view` ẩn Ribbon soạn thảo, giữ zoom/print. |

### 3.6 Route-driven state

| Mã | Yêu cầu |
| :--- | :--- |
| 473-F32 | Query params chuẩn: `app`, `mode`, `source`, `docId`, `tab`, `ribbon`, `zoom`, `sheet`, `slide`, `drawer`, `page`, `size`, `q`. |
| 473-F33 | Mọi thay đổi tab/filter/drawer/zoom ghi bằng `router.navigate([], {queryParams, queryParamsHandling:'merge'})`; không dùng `signal()` làm nguồn sự thật duy nhất. |
| 473-F34 | F5/Back/Forward khôi phục đúng app, file (nếu local chưa có handle → hiện Drawer xác nhận chọn lại file), tab, drawer. |
| 473-F35 | Param không hợp lệ → fallback mặc định + `console.warn` (không `console.error`). |

### 3.7 Storage, draft & i18n

| Mã | Yêu cầu |
| :--- | :--- |
| 473-F36 | `ErpStorageClient` dùng `HttpClient` của `@shared`; mọi URL lấy từ config, không hardcode domain; request có `withCredentials` theo chuẩn ERP. |
| 473-F37 | Mở file ERP: `GET /documents/{id}/content` → `ArrayBuffer`; lưu: `PUT` multipart với `expected_version`; 409 mở Drawer xung đột (Tải bản mới / Ghi đè / Lưu thành bản sao). |
| 473-F38 | Draft IndexedDB: debounce 1500ms sau thay đổi; key `local:<name>:<size>` hoặc `erp:<docId>`; lưu `tenantId`, `source`, `docType`, `binaryData`, `isDirty`, `updatedAt`; TTL dọn 7 ngày. |
| 473-F39 | Mở lại file có draft mới hơn bản gốc → Drawer `?drawer=draft-recovery` (Khôi phục / Bỏ nháp), không tự động ghi đè. |
| 473-F40 | 100% chuỗi qua key `office.*`; cấm literal tiếng Việt/Anh trong `.html`/`.ts`; cấm emoji; icon là SVG component. |
| 473-F41 | Bổ sung đủ key `vi.json` + `en.json` cho mọi command/status/error; key thiếu → fail build (script kiểm tra). |
| 473-F42 | Drawer `erp-picker`: bảng dữ liệu đầy đủ theo invariant — filter, sort, ẩn/hiện cột, đổi thứ tự cột, số hàng/trang, phân trang, context menu chuột phải, sticky header/footer. |

### 3.8 Chia sẻ nội bộ ERP (AC-10)

| Mã | Yêu cầu |
| :--- | :--- |
| 473-F43 | `File > Share` mở Drawer `?drawer=share`, không dùng modal; chỉ hiện khi tài liệu có `docId` ERP (file local hiện disabled + tooltip "Chỉ chia sẻ tài liệu trên ERP"). |
| 473-F44 | Drawer hiển thị danh sách quyền hiện tại: avatar/tên, loại (`USER`/`ROLE`), mức (`READ`/`WRITE`), nút thu hồi; owner có nhãn `Chủ sở hữu`. |
| 473-F45 | Thêm quyền: ô tìm user/role trong tenant (debounce 300ms, gọi API Core), chọn mức READ/WRITE, nút `Thêm`; không cho thêm trùng (báo inline). |
| 473-F46 | Lưu bằng `PUT /documents/{id}/permissions` (thay thế danh sách); thành công cập nhật danh sách + toast `OFFICE_DOCUMENT_SHARED`; lỗi giữ nguyên trạng thái cũ. |
| 473-F47 | Người không có `office:document:share` hoặc không phải owner: mục `Share` disabled + tooltip; Drawer mở trực tiếp bằng URL cũng trả 403 và hiện thông báo. |
| 473-F48 | Tài liệu được share hiện badge `Được chia sẻ` trong Workspace Recent và `erp-picker`; không lộ danh sách người được share cho user chỉ có READ. |

### 3.9 Command search, panel hệ thống & fullscreen (theo AUDIT-S12-001)

| Mã | Yêu cầu |
| :--- | :--- |
| 473-F49 | `Alt+Q` mở command search: tìm theo nhãn + từ khóa phụ, điều hướng bằng mũi tên, Enter chạy lệnh, Esc đóng; phạm vi toàn bộ command của app hiện tại (Ribbon + File + View). |
| 473-F50 | Host panel Accessibility: nhận kết quả từ Word/Excel/PPT, hiển thị danh sách lỗi + nút nhảy tới vị trí; không modal. |
| 473-F51 | Full Screen: `requestFullscreen` vùng editor, ẩn chrome ERP, giữ status bar tối giản; Esc thoát; lưu `?fullscreen=1`. |
| 473-F52 | Host panel Comments: Drawer/panel phải cho Word/Excel/PPT, đồng bộ `?drawer=comments`, giữ trạng thái khi chuyển tab. |

## 4. i18n key bắt buộc (trích)

| Key | vi | en |
| :--- | :--- | :--- |
| `office.menu.file` | Tệp | File |
| `office.menu.new` | Tạo mới | New |
| `office.menu.open.local` | Mở từ máy tính | Open from this device |
| `office.menu.save` | Lưu | Save |
| `office.menu.saveAs` | Lưu bản sao | Save a copy |
| `office.menu.share` | Chia sẻ | Share |
| `office.share.title` | Chia sẻ tài liệu | Share document |
| `office.share.permission.read` | Chỉ xem | Can view |
| `office.share.permission.write` | Chỉnh sửa | Can edit |
| `office.share.revoke` | Thu hồi | Remove |
| `office.menu.export` | Xuất | Export |
| `office.menu.print` | In | Print |
| `office.menu.info` | Thông tin | Info |
| `office.status.saved` | Đã lưu | Saved |
| `office.status.unsaved` | Chưa lưu | Unsaved |
| `office.status.savingErp` | Đang lưu lên ERP | Saving to ERP |
| `office.ribbon.single` | Ribbon một dòng | Single line ribbon |
| `office.ribbon.classic` | Ribbon cổ điển | Classic ribbon |
| `office.drawer.erpPicker.title` | Tài liệu trên ERP | ERP documents |
| `office.error.OFFICE_VERSION_CONFLICT` | Tài liệu đã có phiên bản mới hơn | A newer version exists |

## 5. Acceptance checklist

- [ ] AC-473-01 Đo DevTools: Title 48, Tabs 31 (Word/PPT) / 36 (Excel), Ribbon 76/136, Formula 32, Status 24 (±1px).
- [ ] AC-473-02 Bấm `File` → dropdown 264px, không có overlay toàn màn hình; Esc đóng.
- [ ] AC-473-03 Chuyển `Single/Classic` → `?ribbon=` đổi, F5 giữ nguyên.
- [ ] AC-473-04 Mở tab/drawer/zoom → URL đổi; Back/Forward khôi phục đúng.
- [ ] AC-473-05 Mở file local: Network tab có **0 request** chứa bytes file; 0 gọi API.
- [ ] AC-473-06 Lưu ERP với `expected_version` cũ → Drawer xung đột, không mất dữ liệu đang sửa.
- [ ] AC-473-07 Draft: sửa → đợi 1.5s → IndexedDB có bản ghi; F5 → Drawer khôi phục hiện đúng.
- [ ] AC-473-08 `grep -R "<div" plugins/office-webapp/web/src/app/**/*.ts` → 0 template inline.
- [ ] AC-473-09 `grep -R "[😀-🙏]"` trong `.html`/`.ts` → 0 emoji.
- [ ] AC-473-10 Script kiểm i18n: 0 key thiếu trong `vi.json`/`en.json`; 0 literal tiếng Việt trong template.
- [ ] AC-473-11 `erp-picker` có đủ filter/sort/column toggle/column order/page size/context menu; header+footer cố định khi cuộn.
- [ ] AC-473-12 0 `console.error` khi mở/đóng mọi Drawer và menu.
- [ ] AC-473-13 Share Drawer: thêm user quyền `READ`, danh sách cập nhật; user đó mở được file nhưng không lưu được; thu hồi → mất quyền.
- [ ] AC-473-14 User không có quyền share: menu `Share` disabled + tooltip; mở `?drawer=share` trực tiếp nhận 403 và thông báo i18n.
- [ ] AC-473-15 `Alt+Q` tìm “pivot”/“track changes” ra đúng lệnh, Enter chạy, Esc đóng.
- [ ] AC-473-16 Fullscreen + Accessibility panel + Comments panel host hoạt động, URL giữ trạng thái, 0 `console.error`.

## 6. Bằng chứng bàn giao

| File | Nội dung |
| :--- | :--- |
| `08_testing/evidence/task-473-shell-1440.png` | Shell Word Single Line |
| `08_testing/evidence/task-473-shell-excel-1440.png` | Shell Excel Classic + Formula Bar |
| `08_testing/evidence/task-473-measure.json` | Số đo `getBoundingClientRect` từng vùng |
| `08_testing/evidence/task-473-network-local.md` | Ảnh/export Network khi mở file local (0 request) |
| `08_testing/evidence/task-473-url-state.md` | Bảng param → hành vi F5/Back |

## 7. Ngoài phạm vi (chỉ dịch vụ/ERP không thuộc client)

- `Add to favorites`, `Move file` kiểu OneDrive (thao tác dữ liệu ERP, ngoài phạm vi client).
- Catch up/activity feed, Help/Feedback, Add-ins (dịch vụ).
- Multi-tab tài liệu trong cùng một cửa sổ (Office web cũng mở theo tab trình duyệt).
- Offline-first sync (chỉ draft cục bộ).

## 8. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Phân rã task | Developer |
| 0.2 | 2026-11-15 | Đặc tả 42 FR, token đo thật, 12 AC và invariant bảng ERP picker | Architect; BENCH-S12-002/003 |
| 0.3 | 2026-11-15 | File menu lên 9 mục; thêm Drawer `share` (`F43–F48`, `AC-13–AC-14`) theo quyết định R2 | Chủ dự án; 8 câu hỏi tương tác |
| 0.4 | 2026-11-15 | Phủ sóng client: command search `Alt+Q`, Accessibility/Comments panel host, fullscreen (`F49–F52`, `AC-15–AC-16`) | Chủ dự án; AUDIT-S12-001 |
