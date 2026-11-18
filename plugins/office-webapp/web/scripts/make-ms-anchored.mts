import fs from 'node:fs';
import { readZip, writeZip } from '../src/app/core/binary/zip.ts';

const source = 'plugins/office-webapp/web/samples/ink-verified.docx';
const bytes = fs.readFileSync(source);
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const zip = await readZip(buffer);
const microsoft = fs.readFileSync('plugins/office-webapp/web/.tmp/ink1-sample.xml');
const entries = [...zip.entries.entries()].map(([name, data]) => (
  name === 'word/ink/ink1.xml' ? { name, data: microsoft } : { name, data }
));
const output = await writeZip(entries);
fs.writeFileSync('plugins/office-webapp/web/samples/ink-ms-anchored.docx', Buffer.from(output));
console.log('wrote ink-ms-anchored.docx', output.length);
