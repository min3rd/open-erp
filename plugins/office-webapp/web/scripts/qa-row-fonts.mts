import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const table = doc.blocks[396];
for (const index of [217, 218, 219, 220, 221]) {
  const row = table.rows[index];
  if (!row) continue;
  const summary = row.map((cell, cellIndex) => {
    const paragraph = cell[0];
    return `${cellIndex}:${paragraph?.fontSizePt ?? '-'}pt/${paragraph?.fontFamily ?? '-'}/${(paragraph?.runs[0]?.text ?? '').slice(0, 10)}`;
  });
  console.log(index, summary.join('  '));
}
