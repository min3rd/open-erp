import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
for (const index of [392, 396, 541]) {
  const table = doc.blocks[index];
  const rows = (table.xmlNode?.children ?? []).filter((child) => child.name === 'w:tr');
  const flags = rows.map((row, rowIndex) => {
    const trPr = (row.children ?? []).find((child) => child.name === 'w:trPr');
    const cantSplit = (trPr?.children ?? []).some((child) => child.name === 'w:cantSplit');
    const header = (trPr?.children ?? []).some((child) => child.name === 'w:tblHeader');
    return cantSplit ? `${rowIndex}${header ? '(h)' : ''}` : null;
  }).filter(Boolean);
  console.log(`block ${index}: rows=${rows.length} cantSplit rows: ${flags.join(' ') || 'none'}`);
}
