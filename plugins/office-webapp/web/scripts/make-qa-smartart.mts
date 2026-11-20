import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { saveDocx } from '../src/app/core/office/docx-save.ts';
import { insertWordSmartArt } from '../src/app/core/office/word-smartart.ts';

const source = fs.readFileSync(process.argv[2] ?? 'samples/sample.docx');
const target = process.argv[3] ?? 'C:/Users/Minh/AppData/Local/Temp/opencode/qa-smartart.docx';
const buffer = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
const doc = await parseDocx(buffer as ArrayBuffer);
insertWordSmartArt(doc, ['Chiến lược', 'Triển khai', 'Đo lường'], 520, 260);
const saved = await saveDocx(doc, buffer as ArrayBuffer);
fs.writeFileSync(target, saved);
console.log('wrote', target, fs.statSync(target).size);
