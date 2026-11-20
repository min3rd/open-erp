import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const base = 'D:/Projects/open-erp/plugins/office-webapp/web';
const com = JSON.parse(fs.readFileSync(`${base}/.tmp/word-cells-rows-b.json`, 'utf8').replace(/^\uFEFF/, ''));
const bytes = fs.readFileSync(`${base}/samples/sample-real-proposal.docx`);
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const table = doc.blocks[392];

for (const rowIndex of [29, 30, 46, 47, 50, 51, 71, 72, 74, 75]) {
  const wordCells = com.filter((entry) => entry.row === rowIndex);
  const ourCells = table.rows[rowIndex].map((cell) => cell.map((paragraph) => paragraph.runs.map((run) => run.text ?? '').join('')).join(' '));
  const report = wordCells.map((entry) => {
    const text = ourCells[entry.cell] ?? '';
    return `c${entry.cell}: word chars=${entry.chars} lines=${entry.lines} | ours chars=${text.length}`;
  });
  console.log(`row ${rowIndex}: ${report.join('  ')}`);
}
