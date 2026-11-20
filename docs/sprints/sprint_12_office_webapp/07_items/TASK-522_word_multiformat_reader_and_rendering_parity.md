# TASK-522: Hoàn thiện đọc mọi định dạng tệp Word và hiển thị Web/Mobile qua plugin `office-webapp`

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-522` |
| **Sprint** | Sprint 12 — `office-webapp` Plugin |
| **Loại** | Task (Word Multi-Format Reader & Rendering) |
| **Ưu tiên** | High |
| **Trạng thái** | `Done` (chờ QA xác nhận) |
| **Phụ thuộc** | [TASK-521](./TASK-521_word_merged_cells.md) |
| **Owner** | Developer Agent |
| **Bằng chứng** | [qa-word-formats-evidence.json](../08_testing/evidence/qa-word-formats-evidence.json), [qa-desktop-doc.png](../08_testing/evidence/qa-desktop-doc.png), [qa-desktop-rtf.png](../08_testing/evidence/qa-desktop-rtf.png), [qa-desktop-odt.png](../08_testing/evidence/qa-desktop-odt.png), [qa-desktop-rich.png](../08_testing/evidence/qa-desktop-rich.png), [qa-desktop-macro-error.png](../08_testing/evidence/qa-desktop-macro-error.png), [qa-mobile-doc-390x844.png](../08_testing/evidence/qa-mobile-doc-390x844.png), [qa-mobile-rtf-390x844.png](../08_testing/evidence/qa-mobile-rtf-390x844.png), [qa-mobile-odt-390x844.png](../08_testing/evidence/qa-mobile-odt-390x844.png) |

## 1. Vấn đề cần hoàn thiện

Trước nhiệm vụ này, plugin `office-webapp` chủ yếu tập trung cho `.docx`, trong khi người dùng ERP cần mở và hiển thị chính xác toàn bộ hệ sinh thái định dạng Word trên cả Desktop Web và Mobile Ionic:

1. Một số tính năng OOXML trong `.docx` chưa được tái hiện đầy đủ: `theme1.xml` (màu/font), `w:rStyle`, toggle ba trạng thái, `w:u="none"`, `w:color="auto"`, `w:ind` trái/phải/thụt đầu dòng/hanging, `w:pageBreakBefore`, viền từng cạnh `w:pBdr`, `w:rPr/w:shd`, `w:smallCaps`, `mc:AlternateContent`, hộp thoại VML `w:pict`, biểu đồ `<c:chart>` SVG, công thức nội dòng OMML `<m:oMath>` MathML, bảng điều kiện/viền `w:tblBorders`, section đa cột, header/footer có bảng (`titlePg` `first`, `evenAndOddHeaders` `even`, `NUMPAGES`), chú thích cuối trang theo trang, danh sách nhiều cấp và cảnh báo giữ chỗ cho `.emf`/`.wmf`.
2. Thiếu hoặc chưa hoàn chỉnh bộ đọc thuần TypeScript (Zero-Third-Party) cho `.doc` (OLE2 CFBF + sniffing tệp ZIP/RTF/XML/HTML giả `.doc`), `.dotx`, `.rtf`, `.odt`, Word `.xml` (Flat OPC `<pkg:package>` & Word 2003 `<w:wordDocument>`), cũng như chặn an toàn tệp chứa macro `.docm`/`.dotm` (`OFFICE_MACRO_FILE_UNSUPPORTED`).
3. Thiếu luồng chuyển đổi định dạng cũ sang `.docx` có thể chỉnh sửa (`convertLegacyToEditable()` / `Save As .docx` xuất package OOXML sạch mở được bằng Word 16), URL deep-link (`?docId=&version=&mode=view`), kéo-thả trên toàn root `.op-office-root`, tương thích Mobile Ionic (bao gồm lỗi trùng `@angular/core` `NG0203` qua root `node_modules` junction) và đồng bộ danh sách định dạng ở Backend Java.

## 2. Phạm vi đã thực hiện

| Nhóm | Tệp / Thành phần chính | Nội dung |
| :--- | :--- | :--- |
| Lõi nhị phân & `.docx` | `ole2.ts`, `parser.ts`, `docx.ts`, `word-styles.ts`, `word-section.ts`, `word-notes.ts`, `word-format.ts` | Sửa vòng đọc `readFatChain` OLE2 với miniStream nhiều sector; đọc động `_rels/.rels`; đầy đủ `theme1.xml`, `w:rStyle`, OMML → MathML, DrawingML `<c:chart>` SVG, VML `w:pict`, `w:pBdr`, `w:shd`, `w:ind`, đa cột, `titlePg`/`evenAndOddHeaders`/header-footer bảng/`NUMPAGES`, giữ chỗ `.emf`/`.wmf` (`OFFICE_VECTOR_IMAGE_UNSUPPORTED`), mở `.dotx` (`OFFICE_TEMPLATE_OPENED_AS_DOCX`), chặn `.docm`/`.dotm` (`OFFICE_MACRO_FILE_UNSUPPORTED`) |
| `.doc` (MS-DOC Binary) | `doc.ts` | Đọc FIB, PieceTable, `PAPX`/`CHPX` FKPs, Font/Style table, `PICF` ảnh PNG/JPEG đúng kích thước (`+28/+30/+32/+34` + fallback IHDR), `sprmTDefTable` (`0xd608`) tạo lưới cột & `colSpan`, tách hàng qua `fTtp`/`cp`, header/footer/footnote, sniffing tệp `.doc` dạng ZIP/RTF/XML/HTML và chặn `.doc` mã hóa |
| `.rtf` & `.odt` & `.xml` | `rtf.ts`, `odt.ts`, `word-xml.ts` | `.rtf`: `\fcharset`/`\cpg` (`CP1258`, `CP1250` kể cả trong footnote/header/footer cho ký tự `đ`), `IGNORED_DESTINATIONS`, `\colortbl` đúng chỉ số, `\nonshppict`, guard nhóm lồng cho `footnote`/`pict`/`fldinst`, `.normalize('NFC')`, lưới `\cellx` + `colSpan`; `.odt`: sửa regex `<text:s/>`, `<table:table-columns>`, `horizCoverRemaining` cho `table:number-columns-spanned`; `.xml`: Flat OPC & Word 2003 XML |
| Xuất `.docx` & UI Web | `docx-save.ts`, `office-storage.service.ts`, `office-webapp.component.*`, `styles.css` | Tổng hợp OOXML package sạch cho định dạng kế thừa (`word-synthetic.ts`), banner cảnh báo bản địa hóa + `Save As .docx` + `convertLegacyToEditable()`, kéo-thả toàn màn hình, `?docId=&version=&mode=view`, fix tràn bảng trong `.op-word-columns`, `OfficeStorageService.get()` |
| Mobile Ionic Viewer | `office-viewer.page.*`, `src/frontend/mobile/tsconfig.json`, `src/frontend/mobile/src/shims/*` | Shim giải quyết xung đột `@angular/common/http` & `@angular/core/rxjs-interop` (`NG0203`), hiển thị đầy đủ bảng gộp ô/màu nền, ảnh, liên kết, MathML, chart SVG, thông báo `.emf`/`.wmf`, footnote/endnote với `overflow = 0` trên `390x844` và touch target `>= 40px` |
| Backend Java & i18n | `OfficeDocumentService.java`, `OfficeErrorCode.java`, `OfficeDocumentValidationTest.java`, `plugin.json`, `i18n/*.json` | Mở rộng `EXTENSIONS` + `validateMagic`, chặn `.docm`/`.dotm` (`OFFICE_MACRO_FILE_UNSUPPORTED`), cập nhật metadata `plugin.json`, thêm unit test thuần JUnit 5 và đồng bộ key i18n cho cả 13 locale Web/Mobile + plugin |

## 3. Tiêu chí nghiệm thu

- **AC-1**: Mở và hiển thị đúng nội dung tiếng Việt có dấu, bảng gộp ô, ảnh, liên kết, footnote/header/footer từ mẫu Word 16 thật: `.docx`, `.doc`, `.rtf`, `.odt`, `.dotx`, Flat OPC `.xml`, Word 2003 `.xml`, plus mẫu OOXML giàu tính năng (`qa-formats-rich.docx`).
- **AC-2**: Chặn `.docm`/`.dotm` (`OFFICE_MACRO_FILE_UNSUPPORTED`) và `.doc` mã hóa (`OFFICE_ENCRYPTED_FILE_UNSUPPORTED`) với thông báo đa ngôn ngữ rõ ràng trên cả Web & Mobile & Backend.
- **AC-3**: Cho phép chuyển đổi `.doc`/`.rtf`/`.odt` sang `.docx` chỉnh sửa được (`convertLegacyToEditable`) và file `.docx` xuất ra mở sạch bằng Microsoft Word 16 COM.
- **AC-4**: Không hồi quy chuẩn phân trang tài liệu thầu 546 trang (`sample-real-proposal.docx`: `546 = 546`, Dice body ≥ `0.976` / compact ≥ `0.991`, `0` trang `start < 0.50`, `80/80` bảng 5, `16/16` bảng 8).
- **AC-5**: Smoke `office:test`, UI/Mobile builds, Java tests, i18n parity 13/13 locale và Dual-Mode Edge CDP E2E (Desktop `1440x1000` & Mobile `390x844`, `0 console.error`, `overflow = 0`, touch target `>= 40px`) đều đạt.

## 4. Kết quả kiểm chứng

| Hạng mục | Kết quả |
| :--- | :--- |
| Smoke (`npm run office:test`) | **446 passed, 0 failed** (bao gồm `qa-formats-real.{docx,doc,rtf,odt,dotx,xml}`, `qa-formats-word2003.xml`, `qa-formats-rich.docx`, `qa-formats-macro.docm`, `.dotm`, RTF/HTML giả `.doc`, `.doc` mã hóa) |
| Xác nhận Word 16 COM (`verify-exported-docx-word.ps1`) | **PASS 3/3**: `export-from-doc.docx`, `export-from-rtf.docx`, `export-from-odt.docx` đều mở sạch bằng `WINWORD.EXE` (`paras=20 tables=1 len=398`) |
| Dual-Mode Edge CDP E2E (`qa-word-formats.mjs`) | **PASS**: 10 ca Desktop `1440x1000` (kể cả chuyển `.doc` → `.docx` & `.docm` lỗi) + 5 ca Mobile `390x844` (`overflowX=0`, `smallTargets=0`, **0 `console.error` / exceptions**) |
| Parity tài liệu thầu 546 trang | **546 = 546 trang**, `settled=true`, `errors=0`, `bodyDice=0.9766` (`median=0.9826`, `536 >= 0.90`, `0 < 0.50`), compact `0.9916` (`546/546 >= 0.90`), bảng 5 `80/80`, bảng 8 `16/16` |
| Backend (`npm run office:server:test` & `office:server:build`) | **Tests run: 14, Failures: 0, Errors: 0** (`OfficeDocumentValidationTest` + unit tests); **BUILD SUCCESS**. Lưu ý trung thực: `OfficeDocumentServicePostgresTest` bỏ qua qua `Assumptions.abort` (`POSTGRES_IT_SKIP`) do dịch vụ Docker/PostgreSQL trên môi trường Windows đang tắt và cần quyền quản trị để khởi động |
| i18n (`i18n:check:strict` & `qa-i18n-keys.mjs`) | Web 13/13 locale **100%**, Mobile 13/13 locale **100%**, plugin `vi/en` **914 khóa / 0 thiếu** |
