import fs from 'node:fs';

const dirs = ['src/frontend/web/public/i18n', 'plugins/office-webapp/web/src/i18n'];
for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    const path = `${dir}/${file}`;
    const dict = JSON.parse(fs.readFileSync(path, 'utf8'));
    if (!dict['office.arrange.groupHint']) continue;
    dict['office.arrange.groupHint'] = file === 'vi.json'
      ? 'Nhóm được lưu dưới dạng wpg:wgp chuẩn OOXML.'
      : 'Groups are stored as real wpg:wgp shape groups.';
    fs.writeFileSync(path, JSON.stringify(dict, null, 2) + '\n');
    console.log('updated', path);
  }
}
