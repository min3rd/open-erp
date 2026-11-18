import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { saveDocx } from '../src/app/core/office/docx-save.ts';
import { addInkStroke } from '../src/app/core/office/word-ink.ts';

const source = 'plugins/office-webapp/web/samples/sample-real-proposal.docx';
const target = 'plugins/office-webapp/web/samples/ink-line.docx';
const bytes = fs.readFileSync(source);
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const doc = await parseDocx(buffer);
addInkStroke(doc, doc.inkStrokes ?? [], {
  color: '#1d4ed8',
  width: 6,
  points: [{ x: 0.2, y: 0.5, pressure: 0.5 }, { x: 0.8, y: 0.5, pressure: 0.5 }],
});
const saved = await saveDocx(doc, buffer);
fs.writeFileSync(target, Buffer.from(saved));
console.log('wrote', target, saved.length);
