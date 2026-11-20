import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));

function flagIn(cell: any, name: string): boolean {
  const walk = (node: any): boolean => {
    if (!node) return false;
    if (node.name === name) return true;
    return (node.children ?? []).some(walk);
  };
  return walk(cell);
}

for (const [index, watch] of [[392, [1, 2, 3, 9, 10, 11, 29, 30, 46, 47, 50, 51, 71, 72, 74, 75, 77, 78]], [396, [185, 190, 195, 204]]]) {
  const table = doc.blocks[index];
  const rows = (table.xmlNode?.children ?? []).filter((child) => child.name === 'w:tr');
  console.log(`block ${index}`);
  for (const row of watch as number[]) {
    const tr = rows[row];
    if (!tr) continue;
    const cells = (tr.children ?? []).filter((child) => child.name === 'w:tc');
    const keepLines = cells.map((cell, cellIndex) => {
      const pPr = cell.children?.find((child: any) => child.name === 'w:p')?.children?.find((child: any) => child.name === 'w:pPr');
      const kl = pPr?.children?.some((child: any) => child.name === 'w:keepLines');
      const kn = pPr?.children?.some((child: any) => child.name === 'w:keepNext');
      return `${cellIndex}:${kl ? 'keepLines' : ''}${kn ? 'keepNext' : ''}`;
    }).filter((entry) => !entry.endsWith(':'));
    console.log(`  row ${row}: ${keepLines.join(' ') || 'none'}`);
  }
}
