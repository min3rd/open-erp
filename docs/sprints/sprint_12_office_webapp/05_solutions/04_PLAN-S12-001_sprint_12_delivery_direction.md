# [PLAN-S12-001] Hướng triển khai Sprint 12 — Plugin `office-webapp`

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | PLAN-S12-001 / Định hướng triển khai / Sprint 12 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.3 / 2026-11-15 — scope 1.2 (phủ sóng đầy đủ client) |
| Owner / reviewer | Solution Architect / Chưa review (chờ chủ dự án) |
| Đầu vào | [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) 1.0, [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md) 1.0, [BENCH-S12-002](../03_benchmarks/02_BENCH-S12-002_m365_live_ui_verification.md) 0.1 |
| Đọc trước / đọc tiếp | [BENCH-S12-002](../03_benchmarks/02_BENCH-S12-002_m365_live_ui_verification.md) / [FEAT-48](../07_items/FEAT-48_office_storage_and_pure_ts_binary_core.md) → [TASK-471](../07_items/TASK-471_office_backend_scaffold_schema_api.md) |

## 1. Mục tiêu và vị trí tài liệu

Sprint 12 đã có đủ bước 00–07: scope/AC được duyệt (`CONF-S12-001` 1.0), thiết kế được duyệt (`SOL/ADR/DES` 1.0), 4 Feature và 8 Task đang `Open`. Tài liệu này trả lời câu hỏi còn thiếu: **làm theo thứ tự nào, mỗi mốc dừng ở đâu, lấy bằng chứng gì, và cắt gì trước khi hết thời gian**.

Tài liệu **không thay đổi scope hay AC**. Các điểm lệch phát hiện từ kiểm chứng live được liệt kê tại §7 để chủ dự án quyết định trước khi viết code.

## 2. Nguyên tắc dẫn hướng

1. **Vertical slice trước, độ phủ sau**: mỗi engine phải đi trọn một vòng `mở → render → sửa → lưu → mở lại` trên một file thật, rồi mới mở rộng định dạng/tính năng.
2. **Số đo thật thay cho phỏng đoán**: dùng số đo tại [BENCH-S12-002](../03_benchmarks/02_BENCH-S12-002_m365_live_ui_verification.md) §3 làm token bố cục.
3. **Zero third-party là ràng buộc kiến trúc, không phải mục tiêu thẩm mỹ**: không thêm dependency nào cho Office/ZIP/PDF/editor; Web API chuẩn của trình duyệt là nền.
4. **Bằng chứng là sản phẩm bàn giao**: mỗi mốc phải để lại file fixture, ảnh chụp, log round-trip — không nhận "đã chạy được" bằng lời.
5. **Cắt ngang, không cắt dọc**: khi thiếu thời gian, bỏ một tính năng trọn vẹn (kèm thông báo i18n) thay vì làm nửa vời mọi tính năng.

## 3. Lộ trình 6 mốc

| Mốc | Task | Sản phẩm | Điều kiện hoàn thành (DoD) | Bằng chứng bắt buộc |
| :--- | :--- | :--- | :--- | :--- |
| **M0 — Nền tảng** | `TASK-471` | Scaffold plugin, migration `tenant_<id8>_office` (documents/versions/**permissions**), API 4 khuôn mẫu, **ACL Share nội bộ**, Entity Registry, quyền `office:document:*` | Migration chạy trên PostgreSQL thật; CRUD + version + **share/revoke** + tenant isolation test xanh; MinIO tùy chọn | Log test, `curl` mẫu 4 response, ảnh Drawer `erp-picker` + `share` |
| **M1 — Lõi nhị phân** | `TASK-472` | `crc32`, `magic-bytes`, `ooxml-zip-container`, `xml-model-bridge`, `csv-codec`, `legacy-ole2-reader`, `client-pdf-reader` | `tsc --noEmit` 0 lỗi; round-trip ZIP/CRC/CSV; chặn Zip Slip/Zip Bomb; OLE2 + PDF header parse | Script smoke + bộ fixture + hash trước/sau |
| **M2 — Shell** | `TASK-473` | Web Component `op-office-webapp`, Workspace màn hình bắt đầu (app card + Recent), Title/Tabs/Ribbon/File dropdown/Status bar, URL state, i18n, Storage Bridge, IndexedDB draft | Đo đúng token §4; 100% template `.html`; 0 emoji; local flow 0 HTTP; F5 giữ trạng thái | Ảnh desktop 1440 & 1280, ảnh mobile 390, bảng key i18n |
| **M3 — Word** | `TASK-474` | Page 816×1056, **toàn bộ client**: track changes, comment, header/footer, footnote/endnote/citation, TOC/bookmark/cross-ref, columns/breaks, equation, symbol/emoji, ink, online video, spellcheck/accessibility/immersive | Round-trip `.docx` giữ 100% part; mọi nhóm W-A01–A23 có ca test | Cặp file trước/sau + diff XML + 8 ảnh |
| **M4 — Excel** | `TASK-475` | Tiled canvas + worker, **toàn bộ catalogue hàm**, Pivot/Table/Slicer, full chart, CF/DV đầy đủ, protection, name manager, ink, sheet views | `implemented == catalogue`; pivot/chart/CF/DV lưu mở lại bằng Excel; 10.000 ô không giật | Catalogue + test matrix + ảnh |
| **M5 — PowerPoint** | `TASK-476` | Thumbnail/stage/overlay, **SmartArt/Icons/Chart/media/Cameo**, theme/master, 6 transition + 4 animation + Morph, Presenter View, comments/ink | Round-trip `.pptx` còn hiệu ứng/shape/media; slideshow đúng thứ tự | Ảnh stage + slideshow + file xuất |
| **M6 — PDF, Mobile, QA** | `TASK-477`, `TASK-478` | PDF viewer + annotation/rotate/thumbnail, mobile read-only, audit coverage, user guide | 78/78 nhóm client có ca test; mobile overflow 0; 0 console.error | Audit report + ảnh Dual-Mode + guide |

## 4. Token bố cục lấy từ đo đạc live

| Token | Giá trị đề xuất | Nguồn |
| :--- | :--- | :--- |
| `--office-title-bar` | `48px` | Word/Excel/PPT |
| `--office-tab-strip` | `31px` (Word/PPT), `36px` (Excel) | BENCH-002 §3 |
| `--office-ribbon-single` | `76px` tổng (31 tab + 45 lệnh) | Word/PPT |
| `--office-ribbon-classic` | `136px` tổng (36 tab + ~96 lệnh) | Excel |
| `--office-formula-bar` | `32px` | Excel |
| `--office-sheet-tabs` | `32px` | Excel |
| `--office-status-bar` | `23px` (Excel/PPT), `25px` (Word) | Cả 3 |
| `--office-thumb-pane` | `256px` + handle `10px` | PowerPoint |
| `--office-page` | content `816×1056`, viền ngoài 1px | Word |

Quy ước: chọn **một** giá trị dùng chung cho status bar (`24px`) để tránh 2 token lệch 2px không ai nhận ra; các token còn lại giữ đúng số đo.

## 5. Thứ tự và phụ thuộc

```
M0 ──► M1 ──► M2 ──┬──► M3 (Word) ──┐
                    ├──► M4 (Excel) ─┤
                    └──► M5 (PPT)  ──┴──► M6 (PDF + Mobile + QA/docs)
```

- **M0 và M1 độc lập** (backend vs frontend core) nhưng cùng một developer nên làm tuần tự; nếu có 2 dev thì chạy song song ngay từ đầu.
- **M2 chặn cả 3 engine** vì mọi engine dùng chung Shell, File mở/lưu và i18n.
- Sau M2, **M3/M4/M5 có thể chia cho 2–3 dev**. Thứ tự ưu tiên khi chỉ có 1 dev: **Word → Excel → PPT** (Word xác nhận vòng OOXML round-trip với ít biến số nhất; Excel là engine rủi ro cao nhất nên cần Shell ổn định; PPT dùng lại canvas + overlay đã chứng minh ở Excel/Word).
- **M6 không đợi M5 xong hoàn toàn**: PDF viewer có thể làm song song sau M2 vì chỉ phụ thuộc M1.

## 6. Chiến lược kiểm chứng

1. **Bộ fixture tối thiểu** đặt tại `plugins/office-webapp/web/test-fixtures/`:
   - `.docx`: 1 file 1 trang text, 1 file có bảng + ảnh, 1 file có header/footer.
   - `.xlsx`: 1 file 3 sheet có công thức, 1 file 10.000 ô, 1 file merge + freeze + filter.
   - `.pptx`: 1 file 3 slide text, 1 file có shape/ảnh, 1 file 16:9.
   - Legacy: 1 `.doc`, 1 `.xls`, 1 `.ppt`; PDF: 1 text, 1 có ảnh, 1 nhiều trang.
2. **Script round-trip** (`npm run office:roundtrip`): mở → serialize → mở lại → so sánh hash phần XML không sửa + so giá trị ô/text. In bảng PASS/FAIL, không tạo `.spec.ts`.
3. **Bằng chứng QA** lưu tại `docs/sprints/sprint_12_office_webapp/08_testing/evidence/` với tên `<app>-<mode>-<viewport>.png`.
4. **Ba phép khẳng định bắt buộc** ở mỗi mốc:
   - Mở file local: **0 request chứa nội dung file** (đếm request/bytes trong Network).
   - **0 `console.error`** trên luồng chính.
   - **F5 không mất trạng thái** `?app=&mode=&docId=&tab=&drawer=`.

## 7. Quyết định đã chốt (scope 1.1) và việc phải làm

| # | Điểm lệch | Đề xuất | Ảnh hưởng nếu không chốt |
| :--- | :--- | :--- | :--- |
| D1 | `AC-04`, `DES-UI-S12-001` §2 và `TASK-473` ghi Title ~36–44px, Ribbon ~40/90px; đo thật là **48 / 76 / 136** | Giữ nguyên tinh thần AC (single line vs classic), cập nhật số đo trong `DES-UI` §2 và `TASK-473` sau khi chủ dự án đồng ý | Dev tự chọn số → giao diện lệch chuẩn, QA đối chiếu AC không khớp |
| D2 | Menu `File` M365 có 13 mục; đã chốt **9 mục** (8 mục có hành vi thật + `Share nội bộ ERP`) | Giữ 9 mục; 4 mục OneDrive còn lại để backlog hoặc map ERP Storage | Làm nút không có hành vi hoặc giả lập SharePoint |
| D3 | `BENCH-S12-001` gọi overlay chọn shape là `selectionsvgggroup` | Chỉ sửa tài liệu: dùng `ShapeSelectionOverlay` + `selectionHandle-<id>-0..7` (10×10) làm mô tả | Không ảnh hưởng code; ảnh hưởng tài liệu tham chiếu |
| D4 | Excel tile `1920×560` là số đo trên viewport 1496px | Coi là **ví dụ**, không phải hằng số: tile rộng = `max(viewport, 1920)` làm tròn, tile cao 560 | Hardcode 1920 gây tràn/lãng phí trên màn 4K |
| D5 | Scope 1.1 tăng: Share ACL, Word Comment, Excel 60 hàm + CF/DV đầy đủ, PPT transition/animation/Morph | Architect cập nhật `DES-DB`/`DES-API`/`DES-UI`/`ADR` (P1–P6) trước khi code | Code lệch design, QA không có baseline để nghiệm thu |
| D6 | Scope 1.2: **toàn bộ 78 nhóm client** (track changes, field, equation, Pivot, SmartArt, media, PDF annotation…) | Architect cập nhật Design 1.2 (P1–P9); không cắt client | Thiếu tính năng so với Office 365 Web |

## 8. Cắt giảm có kiểm soát

**Không cắt chức năng client.** Khi thiếu thời gian, chỉ được:
1. Giãn tiến độ/chia sub-sprint theo `AUDIT-S12-001`, không đánh dấu `OUT`.
2. Với 13 nhóm `SERVICE`: ẩn nút hoặc disabled + tooltip `OFFICE_SERVICE_REQUIRED` (không giả lập).
3. Legacy `.doc/.xls/.ppt`: read-only + chuyển OOXML, cảnh báo rõ.
4. File mã hóa/quá lớn/PDF font lạ: báo mã lỗi i18n, không im lặng.

Mọi mục bị hoãn phải ghi trong `08_testing/02_TR-S12-001` và được chủ dự án chấp thuận; không tự cắt client.

## 9. Rủi ro chính và biện pháp

| Rủi ro | Mức | Biện pháp |
| :--- | :--- | :--- |
| Round-trip OOXML làm mất style ngoài vùng sửa | Cao | Giữ nguyên XML gốc, chỉ patch node đã đổi; test hash phần không sửa (M1, M3) |
| Gõ tiếng Việt (IME) trong `[contenteditable]` bị nhân đôi dấu | Cao | Test trên Chromium với Telex/VNI ngay M3; composition events trước `input` |
| Canvas grid 10.000 ô tụt FPS | Trung bình | Worker tính + tile theo viewport; đo bằng `cpu`/`trace` của trình duyệt (M4) |
| Selection overlay PPT lệch toạ độ khi zoom | Trung bình | Một hàm `toStagePoint()` duy nhất, test ở 50/88/150% (M5) |
| PDF nhúng font phức tạp không render đúng | Cao | Chỉ cam kết PDF text + ảnh; PDF scan/font lạ báo `OFFICE_PDF_UNSUPPORTED_FONT` |
| Bộ nhớ trình duyệt khi mở file lớn | Trung bình | Giới hạn mềm 50MB, cảnh báo trước khi mở, không giữ 2 bản byte array |
| Morph nội suy sai shape/không khớp | Cao | Khớp theo `name` → loại shape → thứ tự; fallback Fade; test 3 bộ slide |
| ACL share làm chậm list/filter | Trung bình | Index `(tenant_id, subject_id)`, query `OR` owner/ACL, test 10.000 document |
| PivotTable client-side sai aggregation | Cao | Test 4 vùng field + 5 aggregation + grouping; so với file Excel mẫu |
| SmartArt/Chart/media round-trip mất part | Cao | `part-coverage.json` + mở lại bằng PowerPoint; giữ nguyên XML không sửa |
| Track Changes làm mất revision khi lưu | Cao | Chỉ patch node đổi; test accept/reject từng phần; mở Word đối chiếu |
| Khối lượng client rất lớn (349 FR) | Cao | Chia sub-sprint theo M0–M6; freeze catalogue hàm; Pivot/Chart/CF/DV có AC riêng; không cắt client |

## 10. Việc làm ngay (đề xuất)

1. Chủ dự án chốt D1, D2 tại §7.
2. Tạo bộ fixture §6.1 và ghi hash baseline.
3. `TASK-471`: dựng migration + API + test tenant isolation trên PostgreSQL thật.
4. `TASK-472`: dựng ZIP/CRC/XML bridge + script round-trip trước khi làm UI.
5. `TASK-473`: dựng Shell bằng token §4, chụp ảnh 1440/1280 để khóa giao diện trước khi gắn engine.

## 11. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Định hướng triển khai 6 mốc, token bố cục từ đo đạc live, chiến lược fixture/round-trip, danh sách cắt giảm và 4 điểm lệch cần chốt | Solution Architect; tổng hợp CONF/DES và BENCH-S12-002 |
| 0.2 | 2026-11-15 | Áp scope 1.1: M0 thêm ACL, M4 60 hàm + CF/DV, M5 transition/animation/Morph; thêm D5 yêu cầu cập nhật Design 1.1 | Chủ dự án; 8 câu hỏi tương tác |
| 0.3 | 2026-11-15 | Scope 1.2: M3–M6 phủ sóng đầy đủ client; bỏ mọi cắt giảm client, chỉ giữ SERVICE/legacy; thêm D6 + rủi ro Pivot/SmartArt/Track Changes | Chủ dự án; AUDIT-S12-001 |
