import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const table = doc.blocks[396];
const needle = 'Quản trị hệ thống chọn chức năng';
for (let row = 0; row < table.rows.length; row++) {
  const cell = table.rows[row][3] ?? [];
  const text = cell.map((paragraph) => paragraph.runs.map((run) => run.text ?? '').join('')).join('\n');
  if (text.includes(needle)) {
    console.log('row', row, 'chars', text.length, 'paragraphs', cell.length);
    console.log(JSON.stringify(text));
  }
}
