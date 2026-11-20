import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
for (const [blockIndex, label] of [[392, 'table 80'], [396, 'table 839'], [538, 'table 16'], [541, 'table 15']]) {
  const table = doc.blocks[blockIndex];
  const hints = table.breakHints ?? [];
  const byRow = new Map();
  for (const hint of hints) {
    const entry = byRow.get(hint.row) ?? { zero: 0, inner: 0 };
    if (hint.offset === 0) entry.zero += 1; else entry.inner += 1;
    byRow.set(hint.row, entry);
  }
  const pageStartCandidates = [...byRow.entries()].filter(([, entry]) => entry.zero > 0 && entry.inner === 0).map(([row]) => row);
  console.log(`${label}: rows=${table.rows.length} hints=${hints.length} offset0OnlyRows=${pageStartCandidates.length}`);
  console.log('  rows:', pageStartCandidates.slice(0, 15).join(','));
}
