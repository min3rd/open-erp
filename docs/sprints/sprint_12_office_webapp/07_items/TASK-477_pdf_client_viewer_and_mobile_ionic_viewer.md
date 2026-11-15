# TASK-477: PDF Viewer Thuần TS/Canvas & Mobile Ionic Read-Only (`390×844`)

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-477` |
| **Thuộc Feature** | [FEAT-51](./FEAT-51_pdf_viewer_mobile_ionic_viewer_e2e_docs.md) |
| **Loại** | Frontend Viewer (PDF) & Mobile Ionic (Angular 8 + Ionic 8) |
| **Ưu tiên** | High |
| **Trạng thái** | `Open` — đặc tả chi tiết 0.2, chờ chủ dự án review |
| **Phụ thuộc** | [TASK-472](./TASK-472_pure_ts_zero_third_party_binary_core.md), [TASK-473](./TASK-473_office_shell_ribbon_file_menu_storage_bridge.md) |
| **Owner** | Developer Agent |
| **Tài liệu nguồn** | [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md), [BENCH-S12-003](../03_benchmarks/03_BENCH-S12-003_m365_feature_matrix.md) |

---

## 0. Kết quả bàn giao

1. Mở `.pdf` thật bằng `ClientPdfReader` + `<canvas>`, không dùng PDF.js; chuyển trang, zoom, tìm text, tải xuống.
2. Mobile Ionic 390×844 xem được Word/Excel/PPT/PDF ở chế độ read-only, không tràn ngang, touch ≥ 40px.
3. Không duplicate parser: mobile dùng lại core của plugin qua alias build, không copy code.
4. Phủ đủ 3 nhóm `D-A*` client: rotate/fullscreen/thumbnail, annotation (highlight/ink/note/erase), mobile rotate/search.

## 1. Phạm vi file

| Đường dẫn | Nội dung |
| :--- | :--- |
| `.../ui/pdf/pdf-viewer.component.*` | Toolbar + page canvas + text layer |
| `.../core/pdf/pdf-renderer.ts` | Vẽ page lên canvas: text runs, ảnh, nền |
| `.../core/pdf/pdf-text-layer.ts` | Text layer trong suốt, chọn/copy, search highlight |
| `.../core/pdf/pdf-annotation.ts` | Highlight/ink/text note/eraser + serialize annotation |
| `.../core/pdf/pdf-thumbnails.ts` | Render thumbnail trang |
| `.../core/pdf/pdf-transform.ts` | Rotate 90/180/270, fullscreen state |
| `.../ui/pdf/pdf-annotation-layer.component.*` | Lớp annotation + toolbar |
| `.../ui/pdf/pdf-thumbnail-panel.component.*` | Sidebar thumbnails |
| `.../ui/mobile/office-mobile-viewer.component.*` | Khung mobile dùng chung 4 định dạng |
| `.../ui/mobile/mobile-word-view.component.*` | Fit width, zoom, trang |
| `.../ui/mobile/mobile-excel-view.component.*` | Canvas readonly, chuyển sheet |
| `.../ui/mobile/mobile-ppt-view.component.*` | Stage + chuyển slide |
| `.../ui/mobile/mobile-pdf-view.component.*` | Page + zoom |
| `src/frontend/mobile/src/app/pages/office-viewer/` | Route `/office/viewer`, lazy load component plugin |
| `src/frontend/mobile/tsconfig.json` | Alias `@plugins/office-webapp/*` |

## 2. PDF viewer (Desktop)

| Mã | Yêu cầu |
| :--- | :--- |
| 477-F01 | Render trang theo `MediaBox` + `Rotate`, scale = `zoom × devicePixelRatio`; canvas backing store đúng DPR. |
| 477-F02 | Chỉ render trang trong viewport + 1 trang đệm; trang khác dùng placeholder cùng kích thước; không render toàn bộ file. |
| 477-F03 | Toolbar: `Trang X / Y`, Prev/Next, nhập số trang, zoom 50–200%, `Fit width`, `Tải xuống`, `In`. |
| 477-F04 | Text layer: mỗi `textRun` → `<span>` định vị tuyệt đối, `color: transparent`, `user-select: text`; copy được, giữ dấu tiếng Việt. |
| 477-F05 | Search `Ctrl+F`: nhập từ khóa, highlight tất cả, Next/Prev cuộn tới; không có kết quả → “0 kết quả”. |
| 477-F06 | PDF mã hóa → `OFFICE_ENCRYPTED_FILE_UNSUPPORTED` + nút chọn file khác. |
| 477-F07 | PDF scan (không có text layer): vẫn render ảnh trang; search trả “Tài liệu không có lớp văn bản”. |
| 477-F08 | Tải xuống giữ nguyên bytes gốc, không re-encode. |
| 477-F09 | In: `@media print` mỗi trang PDF là 1 trang giấy, ẩn toolbar. |

## 3. Mobile Ionic (`390×844`)

| Mã | Yêu cầu |
| :--- | :--- |
| 477-F10 | Route `/office/viewer?app=&docId=` (ERP) hoặc chọn file local; chỉ `mode=view`, không hiện Ribbon soạn thảo. |
| 477-F11 | Top bar `44px`: nút chọn file, tên file truncate, nút tải xuống; safe-area top/bottom. |
| 477-F12 | Word/PDF: fit width 390px, zoom +/- (50–200%), chuyển trang bằng nút và swipe ngang; không tràn ngang. |
| 477-F13 | Excel: canvas readonly, vuốt 2 chiều, chuyển sheet bằng segmented control; ô không sửa được. |
| 477-F14 | PPT: ẩn thumbnail, chuyển slide bằng nút `< X / Y >` + swipe; nút fullscreen ngang. |
| 477-F15 | Touch target mọi nút ≥ 40×40px; khoảng cách ≥ 8px; không hover-only. |
| 477-F16 | `document.documentElement.scrollWidth <= window.innerWidth` ở cả 4 định dạng; `overflow-x: hidden` chỉ là phòng vệ, không che lỗi layout. |
| 477-F17 | Xoay ngang: layout vẫn không tràn; top bar giữ. |
| 477-F18 | Tải xuống dùng Blob + anchor; iOS Safari không hỗ trợ `showSaveFilePicker` → fallback chia sẻ/tải. |
| 477-F19 | Không duplicate parser: mobile import `@plugins/office-webapp/core/*`; build fail nếu copy file parser vào mobile. |

### 3.4 Đầy đủ chức năng client còn lại (theo AUDIT-S12-001)

| Mã | Yêu cầu |
| :--- | :--- |
| 477-F20 | Rotate 90/180/270 + fullscreen; giữ đúng trang/vị trí scroll sau khi xoay. |
| 477-F21 | Sidebar thumbnails từng trang, click nhảy trang, highlight trang hiện tại; ẩn/hiện được. |
| 477-F22 | Annotation client: highlight text, ink (pen/màu/độ dày), text note, eraser; lưu vào lớp annotation riêng (JSON cạnh file hoặc embedded), mở lại còn; xuất bản sao kèm annotation. |
| 477-F23 | Mobile: xoay ngang, search text trong PDF/Word, thumbnail drawer; vẫn read-only. |

## 4. Acceptance checklist

- [ ] AC-477-01 3 PDF fixture (text, image, multipage): đúng số trang, zoom 50/100/200 không mờ, chuyển trang đúng.
- [ ] AC-477-02 Copy text từ PDF giữ dấu tiếng Việt; search “tài liệu” highlight đúng.
- [ ] AC-477-03 PDF mã hóa báo đúng mã lỗi, không treo.
- [ ] AC-477-04 Mobile 390×844: Word/Excel/PPT/PDF `scrollWidth <= innerWidth` (ghi số đo).
- [ ] AC-477-05 Mobile touch target: mọi nút ≥ 40px (liệt kê trong biên bản).
- [ ] AC-477-06 Mobile chuyển sheet/slide/trang bằng cả nút và swipe.
- [ ] AC-477-07 Mobile xoay ngang 844×390: không tràn, không che nội dung.
- [ ] AC-477-08 Mobile tải file về thành công trên Chromium; fallback hoạt động khi không có FS Access.
- [ ] AC-477-09 Desktop PDF: chỉ render trang trong viewport (kiểm bằng DOM canvas count ≤ 3).
- [ ] AC-477-10 0 `console.error` trên cả 2 chế độ.
- [ ] AC-477-11 Rotate 90/180/270 + fullscreen + thumbnails hoạt động, giữ trang hiện tại.
- [ ] AC-477-12 Annotation highlight/ink/text note/eraser lưu và mở lại còn; xuất bản sao kèm annotation.
- [ ] AC-477-13 Mobile xoay ngang + search text + thumbnail drawer hoạt động, vẫn overflow 0.

## 5. Bằng chứng bàn giao

| File | Nội dung |
| :--- | :--- |
| `08_testing/evidence/mobile-word-390x844.png` | Word mobile |
| `08_testing/evidence/mobile-excel-390x844.png` | Excel mobile |
| `08_testing/evidence/mobile-ppt-390x844.png` | PPT mobile |
| `08_testing/evidence/mobile-pdf-390x844.png` | PDF mobile |
| `08_testing/evidence/task-477-measure.json` | `scrollWidth/innerWidth`, kích thước touch target |
| `08_testing/evidence/task-477-pdf-search.md` | Kết quả search + copy text |

## 6. Ngoài phạm vi (chỉ dịch vụ/không khả thi client)

- PDF form điền/ký số (viewer web không có), chỉnh sửa PDF gốc.
- PDF font shaping phức tạp (chỉ text run cơ bản + ảnh).
- Mobile editing (theo Q9 chỉ view).
- Offline cache toàn bộ tài liệu.
- OCR/scan (dịch vụ).

## 7. Rủi ro & cách xử lý

| Rủi ro | Cách xử lý |
| :--- | :--- |
| PDF nhiều trang gây OOM | Chỉ render viewport + 1 trang đệm, giải phóng canvas ngoài vùng |
| Text layer lệch do font | Định vị theo `x,y` từ content stream; test 3 PDF khác nguồn |
| Mobile Safari chặn download | Fallback anchor + `target=_blank`; ghi rõ trong guide |
| Swipe xung đột scroll dọc | Chỉ nhận swipe khi deltaX > 1.5×deltaY |

## 8. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Phân rã task | Developer |
| 0.2 | 2026-11-15 | Đặc tả 19 FR, 10 AC, đo mobile và chiến lược tái dùng core | Architect; BENCH-S12-003 |
| 0.3 | 2026-11-15 | Phủ sóng client: rotate/fullscreen, thumbnails, annotation, mobile rotate/search (`F20–F23`, `AC-11–AC-13`) | Chủ dự án; AUDIT-S12-001 |
