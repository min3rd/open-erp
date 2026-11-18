import fs from 'node:fs';
import { parseXlsx } from '../src/app/core/office/xlsx.ts';

const bytes = fs.readFileSync(process.argv[2]);
const excel = await parseXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
console.log(JSON.stringify({
  sheets: excel.sheets.map((sheet) => sheet.name),
  analysis: excel.analysis ?? null,
}, null, 2));
