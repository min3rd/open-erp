import fs from 'node:fs';
import { readZip } from '../src/app/core/binary/zip.ts';

const bytes = fs.readFileSync('plugins/office-webapp/web/samples/ink-anchor-new-paragraph.docx');
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const zip = await readZip(buffer);
const settings = new TextDecoder().decode(zip.entries.get('word/settings.xml'));
const index = settings.indexOf('compatibilityMode');
console.log(settings.slice(Math.max(0, index - 300), index + 200));
