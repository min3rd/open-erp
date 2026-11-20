import fs from 'node:fs';

const dirs = ['src/frontend/web/public/i18n', 'plugins/office-webapp/web/src/i18n'];
const en = {
  'office.rb.group.ink': 'Ink',
  'office.word.highlighter': 'Highlighter',
  'office.word.inkStart': 'Start inking',
  'office.word.hideInk': 'Hide ink',
  'office.word.deleteAllInk': 'Delete all ink',
};
const vi = {
  'office.rb.group.ink': 'Mực',
  'office.word.highlighter': 'Bút dạ quang',
  'office.word.inkStart': 'Bắt đầu vẽ',
  'office.word.hideInk': 'Ẩn mực',
  'office.word.deleteAllInk': 'Xóa toàn bộ mực',
};
for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    const path = `${dir}/${file}`;
    const dict = JSON.parse(fs.readFileSync(path, 'utf8'));
    const values = file === 'vi.json' ? vi : en;
    for (const [key, value] of Object.entries(values)) {
      if (!dict[key]) dict[key] = value;
    }
    fs.writeFileSync(path, JSON.stringify(dict, null, 2) + '\n');
    console.log('updated', path);
  }
}
