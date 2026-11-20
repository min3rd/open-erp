import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const table = doc.blocks[392];
for (const rowIndex of [4, 5, 7]) {
  console.log(`\n--- our row ${rowIndex}`);
  table.rows[rowIndex].forEach((cell, cellIndex) => {
    const text = cell.map((paragraph) => paragraph.runs.map((run) => run.text ?? '').join('')).join('\\n');
    console.log(`cell ${cellIndex}: chars=${text.length} paragraphs=${cell.length} '${text.slice(0, 60).replace(/\n/g, ' ')}'`);
  });
}
