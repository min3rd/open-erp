import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const table = doc.blocks[396];
const cellText = (row, cell) => (table.rows[row][cell] ?? [])
  .map((paragraph) => paragraph.runs.map((run) => run.text ?? '').join('')).join('\n');
const probes = [
  { label: 'row 203 col3', text: cellText(203, 3), width: 97.6, lines: 10 },
  { label: 'row 205 col3', text: cellText(205, 3), width: 97.6 },
  { label: 'row 206 col3', text: cellText(206, 3), width: 97.6 },
  { label: 'row 200 col5', text: cellText(200, 5), width: 97.6 },
  { label: 'row 205 col5', text: cellText(205, 5), width: 97.6 },
];
fs.writeFileSync('D:/Projects/open-erp/plugins/office-webapp/web/.tmp/cell-probes.json', JSON.stringify(probes, null, 1));
for (const probe of probes) console.log(probe.label, 'chars', probe.text.length, '||', probe.text.slice(0, 60));
