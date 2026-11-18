import fs from 'node:fs';

const dirs = ['src/frontend/web/public/i18n', 'plugins/office-webapp/web/src/i18n'];
const en = { 'office.word.issue.whitespace': 'Extra space' };
const vi = { 'office.word.issue.whitespace': 'Khoảng trắng thừa' };
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
