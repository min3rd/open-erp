import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { saveDocx } from '../src/app/core/office/docx-save.ts';
import { addInkStroke } from '../src/app/core/office/word-ink.ts';

const source = 'plugins/office-webapp/web/samples/sample-real-proposal.docx';
const target = 'plugins/office-webapp/web/samples/ink-calibration.docx';
const bytes = fs.readFileSync(source);
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const doc = await parseDocx(buffer);
const strokes = doc.inkStrokes ?? [];
const line = (color, points) => addInkStroke(doc, strokes, {
  color, width: 8, points: points.map(([x, y]) => ({ x, y, pressure: 0.5 })),
});
line('#00ffff', [[0.1, 0.25], [0.9, 0.25]]);
line('#ff8000', [[0.1, 0.75], [0.9, 0.75]]);
line('#8000ff', [[0.25, 0.1], [0.25, 0.9]]);
line('#80ff00', [[0.75, 0.1], [0.75, 0.9]]);
const saved = await saveDocx(doc, buffer);
fs.writeFileSync(target, Buffer.from(saved));
console.log('wrote', target, saved.length, 'strokes', strokes.length);
