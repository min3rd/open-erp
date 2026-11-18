import fs from 'node:fs';
import { readZip } from '../src/app/core/binary/zip.ts';

const bytes = fs.readFileSync('plugins/office-webapp/web/samples/sample-real-proposal.docx');
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const zip = await readZip(buffer);
const xml = new TextDecoder('utf-8').decode(zip.entries.get('word/document.xml'));
const needle = 'Giới thiệu về nhà thầu';
const index = xml.indexOf(needle);
console.log('index', index);
console.log(xml.slice(Math.max(0, index - 2200), index + 900));
