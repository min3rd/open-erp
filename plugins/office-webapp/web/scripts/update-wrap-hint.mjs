import fs from 'node:fs';

const dirs = ['src/frontend/web/public/i18n', 'plugins/office-webapp/web/src/i18n'];
for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    const path = `${dir}/${file}`;
    const dict = JSON.parse(fs.readFileSync(path, 'utf8'));
    if (!dict['office.arrange.wrapHint']) continue;
    dict['office.arrange.wrapHint'] = file === 'vi.json'
      ? 'Bọc vuông/sát/xuyên qua làm văn bản chảy quanh đối tượng; trên-dưới chiếm chỗ đúng y; sau/trước vẫn là lớp phủ.'
      : 'Square/tight/through wraps reflow body text; top-and-bottom occupies flow at its exact y; behind/front remain overlays.';
    fs.writeFileSync(path, JSON.stringify(dict, null, 2) + '\n');
    console.log('updated', path);
  }
}
