import fs from 'node:fs';

const dirs = [
  'src/frontend/web/public/i18n',
  'plugins/office-webapp/web/src/i18n',
];
const en = {
  'office.index.title': 'Index',
  'office.index.term': 'Entry term',
  'office.index.mark': 'Mark entry',
  'office.index.insert': 'Insert index',
  'office.index.update': 'Update index',
  'office.index.empty': 'No marked entries',
  'office.index.hint': 'Mark terms in the text, then insert an index.',
};
const vi = {
  'office.index.title': 'Chỉ mục',
  'office.index.term': 'Từ khóa mục',
  'office.index.mark': 'Đánh dấu mục',
  'office.index.insert': 'Chèn chỉ mục',
  'office.index.update': 'Cập nhật chỉ mục',
  'office.index.empty': 'Chưa có mục nào được đánh dấu',
  'office.index.hint': 'Đánh dấu từ khóa trong văn bản, sau đó chèn chỉ mục.',
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
