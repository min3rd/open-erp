import fs from 'node:fs';

const dirs = ['src/frontend/web/public/i18n', 'plugins/office-webapp/web/src/i18n'];
const en = {
  'office.mailMerge.ruleNextUnsupported': 'Next Record is not supported yet; each record starts on a new page.',
  'office.mailMerge.ruleNextHint': 'Next Record is gated: records are merged with a page break per record.',
};
const vi = {
  'office.mailMerge.ruleNextUnsupported': 'Bản ghi kế tiếp chưa được hỗ trợ; mỗi bản ghi bắt đầu ở trang mới.',
  'office.mailMerge.ruleNextHint': 'Bản ghi kế tiếp đang được gate: mỗi bản ghi được trộn với một ngắt trang.',
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
