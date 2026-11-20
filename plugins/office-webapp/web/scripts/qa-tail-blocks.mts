import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
console.log('blocks', doc.blocks.length);
for (let index = 536; index < doc.blocks.length; index++) {
  const block = doc.blocks[index];
  const hints = block.breakHints ?? [];
  console.log(index, block.kind, 'rows', block.rows?.length ?? '-', 'hints', hints.length,
    hints.slice(0, 6).map((hint) => `r${hint.row}c${hint.cell}@${hint.offset}`).join(' '));
}
