import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const block = doc.blocks[541];
console.log('rows', block.rows.length, 'headerRows', block.headerRows);
block.rows.forEach((row, index) => {
  if (index < 9) return;
  console.log(`row ${index}:`, row.map((cell, cellIndex) => {
    const text = cell.map((paragraph) => paragraph.runs.map((run) => run.text ?? '').join('')).join(' ');
    return `c${cellIndex}:${text.length}`;
  }).join(' '));
});
console.log('hints', JSON.stringify(block.breakHints));
