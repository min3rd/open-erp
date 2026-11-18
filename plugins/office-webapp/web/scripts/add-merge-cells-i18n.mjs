import fs from 'node:fs';

const dirs = [
  'src/frontend/web/public/i18n',
  'plugins/office-webapp/web/src/i18n',
];
const en = {
  'office.rb.group.tableMerge': 'Merge',
  'office.word.table.mergeCells': 'Merge Cells',
  'office.word.table.splitCells': 'Split Cells',
  'office.word.table.splitCellsHint': 'Splits the selected cell into the number of rows and columns you choose.',
  'office.word.table.split': 'Split',
};
const vi = {
  'office.rb.group.tableMerge': 'Gộp ô',
  'office.word.table.mergeCells': 'Gộp ô',
  'office.word.table.splitCells': 'Tách ô',
  'office.word.table.splitCellsHint': 'Tách ô đang chọn thành số hàng và số cột bạn nhập.',
  'office.word.table.split': 'Tách',
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
