import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const table = doc.blocks[396];
for (let row = 0; row < table.rows.length; row++) {
  const cells = table.rows[row];
  cells.forEach((cell, cellIndex) => {
    const text = cell.map((paragraph) => paragraph.runs.map((run) => run.text ?? '').join('')).join('\n');
    if (/Khóa dữ liệu theo đơn vị/.test(text)) {
      const paragraph = cell[0];
      console.log(`row ${row} cell ${cellIndex}: fontSizePt=${paragraph.fontSizePt} lineSpacing=${paragraph.lineSpacing} runs=${JSON.stringify(paragraph.runs.map((run) => run.sizePt))} text='${text.slice(0, 40)}'`);
    }
  });
}
