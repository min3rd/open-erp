import fs from 'node:fs';

const dirs = ['src/frontend/web/public/i18n', 'plugins/office-webapp/web/src/i18n'];
const en = {
  'office.word.mouseInk': 'Draw with mouse',
  'office.word.touchInk': 'Draw with touch',
  'office.word.lasso': 'Lasso select',
  'office.word.eraserSmall': 'Small eraser',
  'office.word.eraserMedium': 'Medium eraser',
  'office.word.lineStyle': 'Line style',
  'office.word.lineStyle.solid': 'Solid',
  'office.word.lineStyle.dashed': 'Dashed',
  'office.word.lineStyle.dotted': 'Dotted',
  'office.word.favoritePen': 'Favorite pen',
  'office.word.addFavorite': 'Add to favorites',
  'office.word.deleteSelectedInk': 'Delete selected ink',
};
const vi = {
  'office.word.mouseInk': 'Vẽ bằng chuột',
  'office.word.touchInk': 'Vẽ bằng cảm ứng',
  'office.word.lasso': 'Chọn bằng lasso',
  'office.word.eraserSmall': 'Tẩy nhỏ',
  'office.word.eraserMedium': 'Tẩy vừa',
  'office.word.lineStyle': 'Kiểu nét',
  'office.word.lineStyle.solid': 'Liền',
  'office.word.lineStyle.dashed': 'Đứt',
  'office.word.lineStyle.dotted': 'Chấm',
  'office.word.favoritePen': 'Bút yêu thích',
  'office.word.addFavorite': 'Thêm vào yêu thích',
  'office.word.deleteSelectedInk': 'Xóa nét đã chọn',
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
