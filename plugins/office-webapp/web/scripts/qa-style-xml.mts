import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const entries = doc.packageEntries;
const key = [...entries.keys()].filter((name) => name.includes('styles'));
console.log('entries with styles', key.join(','));
const xml = new TextDecoder('utf-8').decode(entries.get('word/styles.xml'));
const start = xml.indexOf('<w:docDefaults');
console.log('docDefaults:', xml.slice(start, start + 600).replace(/\s+/g, ' '));
const tableIndex = xml.indexOf('w:styleId="TableGrid"');
console.log('TableGrid:', xml.slice(tableIndex - 120, tableIndex + 500).replace(/\s+/g, ' '));
const normalIndex = xml.indexOf('w:styleId="Normal"');
console.log('Normal:', xml.slice(normalIndex - 120, normalIndex + 700).replace(/\s+/g, ' '));
