import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
for (const index of [538, 540]) {
  const block = doc.blocks[index];
  console.log(`block ${index}: kind=${block.kind} rows=${block.rows?.length} hints=${block.breakHints?.length ?? 0}`);
  const hints = block.breakHints ?? [];
  const byRow = new Map();
  for (const hint of hints) {
    if (!byRow.has(hint.row)) byRow.set(hint.row, []);
    byRow.get(hint.row).push(`c${hint.cell}@${hint.offset}`);
  }
  console.log('  hints by row:', [...byRow.entries()].map(([row, list]) => `${row}:[${list.join(' ')}]`).join(' ').slice(0, 400));
}
