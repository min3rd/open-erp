import fs from 'node:fs';

const dirs = [
  'src/frontend/web/public/i18n',
  'plugins/office-webapp/web/src/i18n',
];
const en = {
  'office.rb.showComments': 'Show Comments',
  'office.rb.filterComments': 'Filter',
  'office.rb.acceptPrev': 'Accept and Move to Previous',
  'office.rb.acceptNext': 'Accept and Move to Next',
  'office.rb.rejectPrev': 'Reject and Move to Previous',
  'office.rb.rejectNext': 'Reject and Move to Next',
  'office.rb.separatePages': 'Separate Pages',
  'office.rb.switchBackground': 'Switch Background',
  'office.rb.zoom100': 'Zoom to 100%',
  'office.rb.group.pageMovement': 'Page Movement',
  'office.comments.filter': 'Filter comments',
  'office.comments.filter.all': 'All',
  'office.comments.filter.unresolved': 'Unresolved',
  'office.comments.filter.resolved': 'Resolved',
  'office.arrange.wrapHint': 'Wrap is saved as OOXML; body text does not reflow around the object yet.',
  'office.arrange.groupHint': 'Groups are stored in customXml/arrange.xml, not wpg:wgp.',
  'office.info.nestedTables': 'Nested tables are flattened for display; the original XML is preserved.',
};
const vi = {
  'office.rb.showComments': 'Hiện bình luận',
  'office.rb.filterComments': 'Lọc',
  'office.rb.acceptPrev': 'Chấp nhận và lùi',
  'office.rb.acceptNext': 'Chấp nhận và tiến',
  'office.rb.rejectPrev': 'Từ chối và lùi',
  'office.rb.rejectNext': 'Từ chối và tiến',
  'office.rb.separatePages': 'Tách trang',
  'office.rb.switchBackground': 'Đổi nền',
  'office.rb.zoom100': 'Thu phóng 100%',
  'office.rb.group.pageMovement': 'Di chuyển trang',
  'office.comments.filter': 'Lọc bình luận',
  'office.comments.filter.all': 'Tất cả',
  'office.comments.filter.unresolved': 'Chưa giải quyết',
  'office.comments.filter.resolved': 'Đã giải quyết',
  'office.arrange.wrapHint': 'Cách bọc được lưu vào OOXML; văn bản chưa chảy quanh đối tượng.',
  'office.arrange.groupHint': 'Nhóm được lưu trong customXml/arrange.xml, không phải wpg:wgp.',
  'office.info.nestedTables': 'Bảng lồng được hiển thị phẳng; XML gốc vẫn được giữ nguyên.',
};

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    const path = `${dir}/${file}`;
    const dictionary = JSON.parse(fs.readFileSync(path, 'utf8'));
    const locale = file.replace(/\.json$/, '');
    const values = locale === 'vi' ? vi : en;
    for (const [key, value] of Object.entries(values)) {
      if (!dictionary[key]) dictionary[key] = value;
    }
    fs.writeFileSync(path, JSON.stringify(dictionary, null, 2) + '\n');
    console.log('updated', path);
  }
}
