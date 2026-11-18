import fs from 'node:fs';

const dirs = [
  'src/frontend/web/public/i18n',
  'plugins/office-webapp/web/src/i18n',
];
const en = {
  'office.mailMerge.title': 'Mail Merge',
  'office.mailMerge.target': 'Document type',
  'office.mailMerge.letters': 'Letters',
  'office.mailMerge.envelopes': 'Envelopes',
  'office.mailMerge.labels': 'Labels',
  'office.mailMerge.choose': 'Choose recipients (CSV/XLSX)',
  'office.mailMerge.recipients': 'recipients',
  'office.mailMerge.insertField': 'Insert merge field',
  'office.mailMerge.addressBlock': 'Address block',
  'office.mailMerge.greetingLine': 'Greeting line',
  'office.mailMerge.greetingField': 'Greeting name field',
  'office.mailMerge.highlight': 'Highlight merge fields',
  'office.mailMerge.preview': 'Preview results',
  'office.mailMerge.checkErrors': 'Check for errors',
  'office.mailMerge.finish': 'Finish & Merge',
  'office.mailMerge.prev': 'Previous record',
  'office.mailMerge.next': 'Next record',
  'office.mailMerge.rules': 'Rules',
  'office.mailMerge.ruleNext': 'Next record',
  'office.mailMerge.ruleIf': 'If...Then...Else',
  'office.mailMerge.ruleField': 'Field name',
  'office.mailMerge.ruleOperator': 'Comparison',
  'office.mailMerge.ruleValue': 'Value',
  'office.mailMerge.ruleTrue': 'True text',
  'office.mailMerge.ruleFalse': 'False text',
  'office.mailMerge.insertRule': 'Insert rule',
  'office.mailMerge.find': 'Find recipient',
  'office.mailMerge.selectAll': 'Select all',
  'office.mailMerge.clearAll': 'Clear all',
  'office.mailMerge.noMatches': 'No matching recipients',
  'office.mailMerge.noData': 'Choose a CSV/XLSX file with a header row',
  'office.mailMerge.invalidData': 'Could not read the data source',
  'office.mailMerge.done': 'Merged document created',
  'office.mailMerge.noErrors': 'No merge errors found',
};
const vi = {
  'office.mailMerge.title': 'Trộn thư',
  'office.mailMerge.target': 'Loại tài liệu',
  'office.mailMerge.letters': 'Thư',
  'office.mailMerge.envelopes': 'Phong bì',
  'office.mailMerge.labels': 'Nhãn',
  'office.mailMerge.choose': 'Chọn danh sách người nhận (CSV/XLSX)',
  'office.mailMerge.recipients': 'người nhận',
  'office.mailMerge.insertField': 'Chèn trường trộn',
  'office.mailMerge.addressBlock': 'Khối địa chỉ',
  'office.mailMerge.greetingLine': 'Dòng chào',
  'office.mailMerge.greetingField': 'Trường tên để chào',
  'office.mailMerge.highlight': 'Tô sáng trường trộn',
  'office.mailMerge.preview': 'Xem trước kết quả',
  'office.mailMerge.checkErrors': 'Kiểm tra lỗi',
  'office.mailMerge.finish': 'Hoàn tất & trộn',
  'office.mailMerge.prev': 'Bản ghi trước',
  'office.mailMerge.next': 'Bản ghi sau',
  'office.mailMerge.rules': 'Quy tắc',
  'office.mailMerge.ruleNext': 'Bản ghi kế tiếp',
  'office.mailMerge.ruleIf': 'Nếu...Thì...Ngược lại',
  'office.mailMerge.ruleField': 'Tên trường',
  'office.mailMerge.ruleOperator': 'So sánh',
  'office.mailMerge.ruleValue': 'Giá trị',
  'office.mailMerge.ruleTrue': 'Nội dung đúng',
  'office.mailMerge.ruleFalse': 'Nội dung sai',
  'office.mailMerge.insertRule': 'Chèn quy tắc',
  'office.mailMerge.find': 'Tìm người nhận',
  'office.mailMerge.selectAll': 'Chọn tất cả',
  'office.mailMerge.clearAll': 'Bỏ chọn tất cả',
  'office.mailMerge.noMatches': 'Không có người nhận phù hợp',
  'office.mailMerge.noData': 'Chọn tệp CSV/XLSX có dòng tiêu đề',
  'office.mailMerge.invalidData': 'Không đọc được nguồn dữ liệu',
  'office.mailMerge.done': 'Đã tạo tài liệu trộn',
  'office.mailMerge.noErrors': 'Không phát hiện lỗi trộn',
};

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    const path = `${dir}/${file}`;
    const dictionary = JSON.parse(fs.readFileSync(path, 'utf8'));
    const locale = file.replace(/\.json$/, '');
    const values = locale === 'vi' ? vi : en;
    for (const [key, value] of Object.entries(values)) {
      if (!dictionary[key]) dictionary[key] = locale === 'vi' ? value : en[key];
    }
    fs.writeFileSync(path, JSON.stringify(dictionary, null, 2) + '\n');
    console.log('updated', path);
  }
}
