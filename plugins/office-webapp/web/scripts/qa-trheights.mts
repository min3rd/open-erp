import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const table = doc.blocks[392];
const rows = table.xmlNode.children.filter((child) => child.name === 'w:tr');
for (const rowIndex of [1, 28, 29, 30, 45, 46, 47, 50, 51, 70, 71, 72, 74, 75]) {
  const trPr = rows[rowIndex]?.children.find((child) => child.name === 'w:trPr');
  const height = trPr?.children.find((child) => child.name === 'w:trHeight');
  const twips = Number(height?.attrs['w:val'] ?? 0);
  console.log(`row ${rowIndex}: trHeight=${height ? twips : '-'} rule=${height?.attrs['w:hRule'] ?? '-'} → ${Math.round((twips / 15) * 10) / 10} px | model rowHeights=${table.rowHeights?.[rowIndex]}`);
}
