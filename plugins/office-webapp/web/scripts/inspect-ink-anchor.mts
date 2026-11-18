import fs from 'node:fs';
import { readZip } from '../src/app/core/binary/zip.ts';

const bytes = fs.readFileSync(process.argv[2]);
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const zip = await readZip(buffer);
const xml = new TextDecoder().decode(zip.entries.get('word/document.xml'));
const index = xml.indexOf('w:contentPart');
console.log('contentPart index', index);
console.log(xml.slice(Math.max(0, index - 1200), index + 400));
console.log('---');
console.log('rels:', new TextDecoder().decode(zip.entries.get('word/_rels/document.xml.rels')));
console.log('---');
console.log('types tail:', new TextDecoder().decode(zip.entries.get('[Content_Types].xml')).slice(-600));
