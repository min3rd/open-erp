import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { saveDocx } from '../src/app/core/office/docx-save.ts';
import { addInkStroke } from '../src/app/core/office/word-ink.ts';

const source = 'plugins/office-webapp/web/samples/sample-real-proposal.docx';
const target = 'plugins/office-webapp/web/samples/ink-verified2.docx';
const bytes = fs.readFileSync(source);
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const doc = await parseDocx(buffer);
const strokes = doc.inkStrokes ?? [];
const points = [];
for (let step = 0; step < 13; step++) {
  points.push({
    x: 0.2 + step * 0.03,
    y: 0.25 + Math.sin(step / 2) * 0.05,
    pressure: 0.35 + step * 0.04,
  });
}
addInkStroke(doc, strokes, { color: '#dc2626', width: 4, points, paragraphIndex: 0 });
const saved = await saveDocx(doc, buffer);
fs.writeFileSync(target, Buffer.from(saved));
console.log('wrote', target, saved.length, 'strokes', doc.inkStrokes?.length);
const text = new TextDecoder().decode(saved);
console.log('anchor AlternateContent', text.includes('mc:AlternateContent'));
