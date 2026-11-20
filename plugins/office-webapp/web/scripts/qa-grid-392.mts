import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
for (const index of [392, 396]) {
  const table = doc.blocks[index];
  console.log(`block ${index}: width ${table.tableWidthPx} cols ${JSON.stringify(table.colWidthsPx)}`);
  const row = table.xmlNode.children.filter((child) => child.name === 'w:tr')[1];
  const cells = row.children.filter((child) => child.name === 'w:tc');
  console.log('  row1 tcW:', cells.map((cell) => {
    const tcPr = cell.children.find((child) => child.name === 'w:tcPr');
    const tcW = tcPr?.children.find((child) => child.name === 'w:tcW');
    const span = tcPr?.children.find((child) => child.name === 'w:gridSpan');
    return `${tcW?.attrs['w:w']}/${tcW?.attrs['w:type']}${span ? `*${span.attrs['w:val']}` : ''}`;
  }).join(' '));
  if (index === 392) {
    const texts = [30, 46, 71].map((rowIndex) => table.rows[rowIndex].map((cell) => cell.map((p) => p.runs.map((r) => r.text ?? '').join('')).join(' ')));
    texts.forEach((cells, position) => console.log('  row', [30, 46, 71][position], JSON.stringify(cells)));
  }
}
