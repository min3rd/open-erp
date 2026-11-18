import fs from 'node:fs';
import { parseXlsx } from '../src/app/core/office/xlsx.ts';

const bytes = fs.readFileSync(process.argv[2]);
const excel = await parseXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const sheet = excel.sheets[0];
console.log(JSON.stringify({
  sheets: excel.sheets.map((item) => item.name),
  a1: sheet.cells.get('A1'),
  b2: sheet.cells.get('B2')?.value,
}));
