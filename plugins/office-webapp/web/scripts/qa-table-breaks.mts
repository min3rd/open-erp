import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const pages = JSON.parse(fs.readFileSync('.tmp/word-block-pages.json', 'utf8'));
const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));

const span = new Map();
for (const entry of pages) {
  for (const block of entry.blocks) {
    const item = span.get(block) ?? { first: entry.page, last: entry.page, pages: 0 };
    item.last = entry.page;
    item.pages += 1;
    span.set(block, item);
  }
}

doc.blocks.forEach((block, index) => {
  if (block.kind !== 'table') return;
  // Word writes one w:lastRenderedPageBreak per cell at a page boundary, so the
  // largest hint count in a row is the number of breaks inside that row.
  const perRow = new Map();
  for (const hint of block.breakHints ?? []) {
    const set = perRow.get(hint.row) ?? new Set();
    set.add(`${hint.cell}:${hint.offset}`);
    perRow.set(hint.row, set);
  }
  let expected = 0;
  perRow.forEach((set) => { expected += set.size; });
  const actual = span.get(index);
  if (!actual || block.rows.length < 5) return;
  const ourBreaks = actual.pages - 1;
  console.log(`block ${index} rows=${block.rows.length} header=${block.headerRows ?? 0} pages=${actual.pages} (p${actual.first}-${actual.last}) ourBreaks=${ourBreaks} hintCells=${expected} hints/rows=${perRow.size} rowsWithHints=${perRow.size}/${block.rows.length} delta=${ourBreaks - expected}`);
});
