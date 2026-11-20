import fs from 'node:fs';

const enKeys = {
  'office.action.cancel': 'Cancel',
  'office.rb.group.undo': 'Undo',
  'office.rb.moreOptions': 'More options',
  'office.word.alignment': 'Text Alignment',
  'office.word.colors.automatic': 'Automatic',
  'office.word.colors.theme': 'Theme Colors',
  'office.word.colors.standard': 'Standard Colors',
  'office.word.colors.more': 'More Colors...',
  'office.word.commentAction': 'Comment',
  'office.word.export.pdf': 'Download as PDF',
  'office.word.export.pdfComments': 'Download as PDF with comments',
  'office.word.export.odt': 'Download as ODT',
  'office.word.export.markdown': 'Download as Markdown',
  'office.word.file.createCopy': 'Create a Copy',
  'office.word.file.downloadCopy': 'Download a Copy',
  'office.word.fit': 'Fit',
  'office.word.goToPage': 'Go to Page',
  'office.word.location': 'Location',
  'office.word.mode.editingDesc': 'Make direct edits and format content.',
  'office.word.mode.suggestingDesc': 'Track edits as reviewable suggestions.',
  'office.word.mode.viewingDesc': 'Read-only preview with markup intact.',
  'office.word.navFind': 'Find',
  'office.word.navReplace': 'Replace',
  'office.word.replaceWith': 'Replace with...',
  'office.word.ribbonLayout': 'Ribbon Layout',
  'office.word.ribbonSingleLine': 'Single-line ribbon',
  'office.word.ribbonClassic': 'Classic ribbon',
  'office.word.savedErp': 'Saved in Open-ERP',
  'office.word.savedLocal': 'Saved locally',
  'office.word.searchToolsPlaceholder': 'Search for tools, help, and more (Alt + Q)',
  'office.word.share.copied': 'Document link copied',
  'office.word.share.copyLink': 'Copy link',
  'office.word.share.saveToErpHint': 'Save this document to Open-ERP to manage tenant permissions and sharing.',
  'office.word.showRibbon': 'Show Ribbon',
  'office.word.showRibbonAlways': 'Always show ribbon',
  'office.word.showRibbonTabs': 'Show tabs only',
  'office.word.table.customInsert': 'Insert Table...',
  'office.word.table.gridLabel': 'Table',
};

const viKeys = {
  'office.action.cancel': 'Hủy',
  'office.rb.group.undo': 'Hoàn tác',
  'office.rb.moreOptions': 'Tùy chọn khác',
  'office.word.alignment': 'Căn lề',
  'office.word.colors.automatic': 'Tự động',
  'office.word.colors.theme': 'Màu chủ đề',
  'office.word.colors.standard': 'Màu chuẩn',
  'office.word.colors.more': 'Thêm màu...',
  'office.word.commentAction': 'Bình luận',
  'office.word.export.pdf': 'Tải xuống dạng PDF',
  'office.word.export.pdfComments': 'Tải xuống PDF kèm bình luận',
  'office.word.export.odt': 'Tải xuống dạng ODT',
  'office.word.export.markdown': 'Tải xuống dạng Markdown',
  'office.word.file.createCopy': 'Tạo bản sao',
  'office.word.file.downloadCopy': 'Tải về bản sao',
  'office.word.fit': 'Vừa khung',
  'office.word.goToPage': 'Chuyển tới trang',
  'office.word.location': 'Vị trí',
  'office.word.mode.editingDesc': 'Chỉnh sửa và định dạng trực tiếp tài liệu.',
  'office.word.mode.suggestingDesc': 'Theo dõi mọi thay đổi để duyệt trước khi áp dụng.',
  'office.word.mode.viewingDesc': 'Chế độ đọc an toàn, không chỉnh sửa nội dung.',
  'office.word.navFind': 'Tìm kiếm',
  'office.word.navReplace': 'Thay thế',
  'office.word.replaceWith': 'Thay thế bằng...',
  'office.word.ribbonLayout': 'Bố cục dải công cụ',
  'office.word.ribbonSingleLine': 'Dải công cụ một dòng',
  'office.word.ribbonClassic': 'Dải công cụ cổ điển',
  'office.word.savedErp': 'Đã lưu trên Open-ERP',
  'office.word.savedLocal': 'Đã lưu cục bộ',
  'office.word.searchToolsPlaceholder': 'Tìm công cụ, trợ giúp và tính năng (Alt + Q)',
  'office.word.share.copied': 'Đã sao chép liên kết tài liệu',
  'office.word.share.copyLink': 'Sao chép liên kết',
  'office.word.share.saveToErpHint': 'Lưu tài liệu lên Open-ERP để phân quyền và chia sẻ theo tenant.',
  'office.word.showRibbon': 'Hiển thị dải công cụ',
  'office.word.showRibbonAlways': 'Luôn hiển thị dải công cụ',
  'office.word.showRibbonTabs': 'Chỉ hiển thị các tab',
  'office.word.table.customInsert': 'Chèn bảng...',
  'office.word.table.gridLabel': 'Bảng',
};

for (const dir of [
  'plugins/office-webapp/web/src/i18n',
  'src/frontend/web/public/i18n',
  'src/frontend/mobile/public/i18n',
]) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    const filePath = `${dir}/${file}`;
    const dict = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
    const entries = file === 'vi.json' ? viKeys : enKeys;
    for (const [k, v] of Object.entries(entries)) {
      dict[k] = v;
    }
    fs.writeFileSync(filePath, JSON.stringify(dict, null, 2) + '\n');
  }
  console.log('updated', dir);
}
