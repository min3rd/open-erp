import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { saveDocx } from '../src/app/core/office/docx-save.ts';

const source = 'plugins/office-webapp/web/samples/sample-real-proposal.docx';
const target = 'plugins/office-webapp/web/samples/roundtrip-plain.docx';
const bytes = fs.readFileSync(source);
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const doc = await parseDocx(buffer);
const saved = await saveDocx(doc, buffer);
fs.writeFileSync(target, Buffer.from(saved));
console.log('wrote', target, saved.length);
