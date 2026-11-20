import fs from 'node:fs';

const sharedEn = {
  'office.word.unsupportedImage': 'Vector image not supported',
  'office.error.OFFICE_UNSUPPORTED_EXTENSION': 'This file extension is not supported.',
  'office.error.OFFICE_ENCRYPTED_FILE_UNSUPPORTED': 'Password-protected or encrypted files cannot be opened.',
  'office.error.OFFICE_MACRO_FILE_UNSUPPORTED': 'Macro-enabled Word documents (.docm, .dotm) are blocked for security.',
  'office.error.OFFICE_CORRUPT_ARCHIVE': 'The ZIP/OOXML package is corrupted or incomplete.',
  'office.error.OFFICE_ZIP_SLIP': 'Unsafe archive entry path detected.',
  'office.error.OFFICE_ZIP_UNSAFE_PATH': 'Unsafe archive entry path detected.',
  'office.error.OFFICE_ZIP_UNSUPPORTED': 'Unsupported or corrupted ZIP archive structure.',
  'office.error.OFFICE_ZIP_TOO_LARGE': 'Uncompressed archive contents exceed allowed size limits.',
  'office.error.OFFICE_XML_UNSAFE': 'Unsafe XML declaration detected.',
  'office.error.OFFICE_MAGIC_MISMATCH': 'File content signature does not match its extension.',
  'office.error.OFFICE_INVALID_MAGIC_BYTES': 'File content signature does not match its extension.',
  'office.error.OFFICE_FILE_TOO_LARGE': 'The file exceeds the maximum supported size.',
  'office.error.OFFICE_OLE2_CORRUPT': 'The legacy binary Compound File is corrupted.',
  'office.error.OFFICE_OLE2_TOO_LARGE': 'The legacy binary file exceeds the maximum supported size.',
  'office.error.OFFICE_DOC_CORRUPT': 'Could not decode this legacy Word (.doc) file.',
  'office.error.OFFICE_RTF_CORRUPT': 'Could not decode this Rich Text Format (.rtf) file.',
  'office.error.OFFICE_ODT_CORRUPT': 'Could not decode this OpenDocument Text (.odt) file.',
  'office.error.OFFICE_WORD_XML_CORRUPT': 'Could not decode this Word XML (.xml) file.',
  'office.error.OFFICE_PDF_EXPORT_FAILED': 'Could not export this document to PDF.',
  'office.error.OFFICE_OPEN_FAILED': 'Could not open the file.',
  'office.warning.OFFICE_LEGACY_FORMAT_READONLY': 'Opened legacy Word format in read-only compatibility mode.',
  'office.warning.OFFICE_TEMPLATE_OPENED_AS_DOCX': 'Template opened as a Word document for viewing and editing.',
  'office.warning.OFFICE_DOC_TABLE_HEURISTIC': 'Legacy .doc table layout was reconstructed using best-effort heuristics.',
  'office.warning.OFFICE_OLE2_DUPLICATE_ENTRY': 'Duplicate OLE2 directory entries detected; keeping primary stream.',
  'office.warning.DUPLICATE_ENTRY': 'Duplicate ZIP archive entries detected; keeping last entry.',
  'office.warning.OFFICE_VECTOR_IMAGE_UNSUPPORTED': 'Some legacy WMF/EMF vector graphics were replaced by placeholders.',
  'office.warning.OFFICE_LEGACY_EXPORT_AS_OOXML': 'Saved/converted to modern .docx format.',
  'office.warning.OFFICE_DOC_PARTIAL_RECOVERY': 'Recovered partial content from legacy Word document.',
  'office.warning.generic': 'Compatibility notice while opening this file.',
};

const sharedVi = {
  'office.word.unsupportedImage': 'Ảnh vector không hỗ trợ hiển thị',
  'office.error.OFFICE_UNSUPPORTED_EXTENSION': 'Định dạng tệp không được hỗ trợ.',
  'office.error.OFFICE_ENCRYPTED_FILE_UNSUPPORTED': 'Không hỗ trợ mở tệp được mã hóa hoặc đặt mật khẩu.',
  'office.error.OFFICE_MACRO_FILE_UNSUPPORTED': 'Tài liệu Word chứa macro (.docm, .dotm) bị chặn vì lý do an toàn.',
  'office.error.OFFICE_CORRUPT_ARCHIVE': 'Gói tệp ZIP/OOXML bị hỏng hoặc không hợp lệ.',
  'office.error.OFFICE_ZIP_SLIP': 'Phát hiện đường dẫn không an toàn trong tệp nén.',
  'office.error.OFFICE_ZIP_UNSAFE_PATH': 'Phát hiện đường dẫn không an toàn trong tệp nén.',
  'office.error.OFFICE_ZIP_UNSUPPORTED': 'Cấu trúc tệp nén ZIP không hợp lệ hoặc không được hỗ trợ.',
  'office.error.OFFICE_ZIP_TOO_LARGE': 'Dung lượng giải nén vượt quá giới hạn cho phép.',
  'office.error.OFFICE_XML_UNSAFE': 'Phát hiện khai báo XML không an toàn.',
  'office.error.OFFICE_MAGIC_MISMATCH': 'Nội dung thực tế của tệp không khớp phần mở rộng.',
  'office.error.OFFICE_INVALID_MAGIC_BYTES': 'Nội dung thực tế của tệp không khớp phần mở rộng.',
  'office.error.OFFICE_FILE_TOO_LARGE': 'Tệp vượt quá dung lượng cho phép.',
  'office.error.OFFICE_OLE2_CORRUPT': 'Cấu trúc tệp nhị phân OLE2 bị hỏng.',
  'office.error.OFFICE_OLE2_TOO_LARGE': 'Tệp nhị phân vượt quá giới hạn dung lượng xử lý.',
  'office.error.OFFICE_DOC_CORRUPT': 'Không thể giải mã tệp Word cũ (.doc).',
  'office.error.OFFICE_RTF_CORRUPT': 'Không thể giải mã tệp văn bản RTF (.rtf).',
  'office.error.OFFICE_ODT_CORRUPT': 'Không thể giải mã tệp OpenDocument (.odt).',
  'office.error.OFFICE_WORD_XML_CORRUPT': 'Không thể giải mã tệp Word XML (.xml).',
  'office.error.OFFICE_PDF_EXPORT_FAILED': 'Không thể xuất tài liệu ra PDF.',
  'office.error.OFFICE_OPEN_FAILED': 'Không mở được tệp.',
  'office.warning.OFFICE_LEGACY_FORMAT_READONLY': 'Đang mở định dạng Word cũ ở chế độ chỉ đọc tương thích.',
  'office.warning.OFFICE_TEMPLATE_OPENED_AS_DOCX': 'Đã mở mẫu Word dưới dạng tài liệu .docx.',
  'office.warning.OFFICE_DOC_TABLE_HEURISTIC': 'Bố cục bảng trong .doc cũ được khôi phục ở mức tương thích.',
  'office.warning.OFFICE_OLE2_DUPLICATE_ENTRY': 'Tệp OLE2 có mục trùng lặp; giữ lại luồng dữ liệu chính.',
  'office.warning.DUPLICATE_ENTRY': 'Tệp nén có mục trùng lặp; giữ lại mục sau cùng.',
  'office.warning.OFFICE_VECTOR_IMAGE_UNSUPPORTED': 'Một số ảnh vector WMF/EMF cũ đã được thay bằng khung giữ chỗ.',
  'office.warning.OFFICE_LEGACY_EXPORT_AS_OOXML': 'Đã lưu/chuyển đổi sang định dạng .docx hiện đại.',
  'office.warning.OFFICE_DOC_PARTIAL_RECOVERY': 'Đã khôi phục một phần nội dung từ tệp Word cũ.',
  'office.warning.generic': 'Lưu ý tương thích khi mở tài liệu này.',
};

const webOnlyEn = {
  'office.workspace.hint': 'Open or drop a .docx, .doc, .dotx, .rtf, .odt, .xml, .xlsx, .csv, .pptx, .pdf file',
  'office.action.saveAsDocx': 'Save As .docx',
  'office.action.convertToEditable': 'Convert to editable',
  ...sharedEn,
};

const webOnlyVi = {
  'office.workspace.hint': 'Mở hoặc kéo-thả tệp .docx, .doc, .dotx, .rtf, .odt, .xml, .xlsx, .csv, .pptx, .pdf',
  'office.action.saveAsDocx': 'Lưu thành .docx',
  'office.action.convertToEditable': 'Chuyển sang bản chỉnh sửa',
  ...sharedVi,
};

const mobileEn = {
  'office.viewer.hint': 'Pick a .docx, .doc, .dotx, .rtf, .odt, .xml, .xlsx, .pptx or .pdf file to view on this device',
  ...sharedEn,
};

const mobileVi = {
  'office.viewer.hint': 'Chọn tệp .docx, .doc, .dotx, .rtf, .odt, .xml, .xlsx, .pptx hoặc .pdf để xem trên thiết bị này',
  ...sharedVi,
};

for (const [dir, isMobile] of [
  ['plugins/office-webapp/web/src/i18n', false],
  ['src/frontend/web/public/i18n', false],
  ['src/frontend/mobile/public/i18n', true],
]) {
  if (!fs.existsSync(dir)) continue;
  const refPath = `${dir}/en.json`;
  const refDict = fs.existsSync(refPath) ? JSON.parse(fs.readFileSync(refPath, 'utf8').replace(/^\uFEFF/, '')) : {};
  const refValues = isMobile ? mobileEn : webOnlyEn;
  for (const [key, value] of Object.entries(refValues)) {
    refDict[key] = value;
  }
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    const filePath = `${dir}/${file}`;
    const dict = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
    const values = file === 'vi.json'
      ? (isMobile ? mobileVi : webOnlyVi)
      : (isMobile ? mobileEn : webOnlyEn);
    for (const [key, value] of Object.entries(values)) {
      dict[key] = value;
    }
    if (file !== 'en.json' && file !== 'vi.json' && dir === 'src/frontend/web/public/i18n') {
      for (const [key, value] of Object.entries(refDict)) {
        if (dict[key] === undefined && key.startsWith('office.')) {
          dict[key] = value;
        }
      }
    }
    fs.writeFileSync(filePath, JSON.stringify(dict, null, 2) + '\n');
  }
  console.log('updated', dir);
}
