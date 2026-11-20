import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
for (const index of [392, 396]) {
  const block = doc.blocks[index];
  const hints = block.breakHints ?? [];
  const rows = new Map();
  for (const hint of hints) {
    const entry = rows.get(hint.row) ?? { zero: 0, inner: 0, cells: [] };
    if (hint.offset === 0) entry.zero += 1; else entry.inner += 1;
    entry.cells.push(`c${hint.cell}@${hint.offset}`);
    rows.set(hint.row, entry);
  }
  const watch = index === 392 ? [0, 1, 2, 3, 9, 10, 11, 29, 30, 31, 46, 47, 48, 50, 51, 52, 71, 72, 73, 74, 75, 76, 77, 78, 79] : [185, 186, 187, 190, 195, 204];
  console.log(`block ${index} rows=${block.rows.length} hints=${hints.length}`);
  for (const row of watch) {
    const entry = rows.get(row);
    console.log(`  row ${row}:`, entry ? `zero=${entry.zero} inner=${entry.inner} [${entry.cells.join(' ')}]` : 'no hints');
  }
}
