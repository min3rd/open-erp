import fs from 'node:fs';
import { parseXlsx } from '../src/app/core/office/xlsx.ts';
import { cellDisplayValue, parseCellStyleMap, stylesheetSummary } from '../src/app/core/office/excel-format.ts';
import { descendants } from '../src/app/core/binary/xml.ts';

const bytes = fs.readFileSync(process.argv[2]);
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const excel = await parseXlsx(buffer);
const sheet = excel.sheets[0];
const rows: Array<{ row: number; a: string; b: string }> = [];
for (let row = 2; row <= Math.min(sheet.maxRow, 6); row++) {
  rows.push({
    row,
    a: sheet.cells.get(`A${row}`)?.value ?? '',
    b: cellDisplayValue(sheet.cells.get(`B${row}`) ?? { ref: '', row, col: 2, value: '', type: 'empty' }),
  });
}
const styled = sheet.cells.get('B2');
console.log(JSON.stringify({
  freeze: sheet.freeze,
  pane: descendants(sheet.xmlRoot!, 'pane').map((node) => node.attrs),
  b2: {
    ref: styled?.ref, value: styled?.value, styleIndex: styled?.styleIndex, style: styled?.style,
    display: styled ? cellDisplayValue(styled) : null,
    cellS: styled?.xmlNode?.attrs['s'],
  },
  rows,
  styles: stylesheetSummary(excel.packageEntries ?? new Map()),
  styledCells: [...sheet.cells.values()].filter((cell) => cell.styleIndex !== undefined).map((cell) => ({
    ref: cell.ref, value: cell.value, styleIndex: cell.styleIndex, display: cellDisplayValue(cell), style: cell.style,
  })),
  styleMap: [...parseCellStyleMap(excel.packageEntries ?? new Map()).entries()].slice(0, 10),
}, null, 2));
