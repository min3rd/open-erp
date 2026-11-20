import fs from 'node:fs';

const dirs = ['src/frontend/web/public/i18n', 'plugins/office-webapp/web/src/i18n'];
const en = {
  'office.word.margin.custom': 'Custom margins',
  'office.word.margin.top': 'Top',
  'office.word.margin.bottom': 'Bottom',
  'office.word.margin.left': 'Left',
  'office.word.margin.right': 'Right',
  'office.word.hyphenation': 'Hyphenation',
  'office.word.hyphenation.none': 'None',
  'office.word.hyphenation.automatic': 'Automatic',
};
const vi = {
  'office.word.margin.custom': 'Lề tùy chỉnh',
  'office.word.margin.top': 'Trên',
  'office.word.margin.bottom': 'Dưới',
  'office.word.margin.left': 'Trái',
  'office.word.margin.right': 'Phải',
  'office.word.hyphenation': 'Ngắt từ',
  'office.word.hyphenation.none': 'Không',
  'office.word.hyphenation.automatic': 'Tự động',
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
