import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const block = doc.blocks[396];
const node = block.xmlNode;
const find = (parent: any, name: string) => (parent?.children ?? []).find((child: any) => child.name === name);
const all = (parent: any, name: string) => (parent?.children ?? []).filter((child: any) => child.name === name);

console.log('table px width', block.tableWidthPx, 'cols', JSON.stringify(block.colWidthsPx));
const grid = find(node, 'w:tblGrid');
console.log('gridCols', JSON.stringify(all(grid, 'w:gridCol').map((col: any) => col.attrs['w:w'])));
console.log('tblW', JSON.stringify(find(find(node, 'w:tblPr'), 'w:tblW')?.attrs));

const rows = all(node, 'w:tr');
const seen = new Map<string, number>();
rows.forEach((row, index) => {
  const key = all(row, 'w:tc')
    .map((cell: any) => {
      const tcPr = find(cell, 'w:tcPr');
      const tcW = find(tcPr, 'w:tcW');
      const span = find(tcPr, 'w:gridSpan');
      return `${tcW?.attrs['w:w']}/${tcW?.attrs['w:type']}${span ? `*${span.attrs['w:val']}` : ''}`;
    })
    .join(' ');
  seen.set(key, (seen.get(key) ?? 0) + 1);
  if (index < 3 && key !== seen.keys().next().value) console.log('row', index, key);
});
for (const [key, count] of [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
  console.log(String(count).padStart(4), key);
}
