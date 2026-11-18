import fs from 'node:fs';
import { parseXlsx } from '../src/app/core/office/xlsx.ts';
import { descendants } from '../src/app/core/binary/xml.ts';
import { stylesheetSummary } from '../src/app/core/office/excel-format.ts';

const bytes = fs.readFileSync(process.argv[2]);
const excel = await parseXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const sheet = excel.sheets[0];
console.log(JSON.stringify({
  b5: { value: sheet.cells.get('B5')?.value, formula: sheet.cells.get('B5')?.formula },
  a2: { value: sheet.cells.get('A2')?.value, style: sheet.cells.get('A2')?.style },
  merges: sheet.merges,
  xmlMerges: descendants(sheet.xmlRoot!, 'mergeCell').map((node) => node.attrs['ref']),
  rows: [2, 3, 4, 5, 6].map((row) => ({
    row, a: sheet.cells.get(`A${row}`)?.value ?? '', b: sheet.cells.get(`B${row}`)?.value ?? '',
  })),
  styles: stylesheetSummary(excel.packageEntries ?? new Map()),
}, null, 2));
