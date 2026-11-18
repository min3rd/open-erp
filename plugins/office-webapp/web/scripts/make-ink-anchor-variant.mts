import fs from 'node:fs';
import { readZip, writeZip } from '../src/app/core/binary/zip.ts';

const source = 'plugins/office-webapp/web/samples/ink-no-anchor.docx';
const bytes = fs.readFileSync(source);
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const zip = await readZip(buffer);
const decode = (name: string) => new TextDecoder().decode(zip.entries.get(name) ?? new Uint8Array());
const encode = (value: string) => new TextEncoder().encode(value);
const entries = [...zip.entries.entries()].map(([name, data]) => ({ name, data }));

const documentXml = decode('word/document.xml');
const marker = '<w:sectPr';
const bodyEnd = documentXml.lastIndexOf(marker);
if (bodyEnd < 0) throw new Error('body sectPr not found');
const anchor = '<w:p><w:r><w:contentPart r:id="rIdInk"></w:contentPart></w:r></w:p>';
const next = `${documentXml.slice(0, bodyEnd)}${anchor}${documentXml.slice(bodyEnd)}`;
entries[entries.findIndex((entry) => entry.name === 'word/document.xml')] = {
  name: 'word/document.xml', data: encode(next),
};
const output = await writeZip(entries);
fs.writeFileSync('plugins/office-webapp/web/samples/ink-anchor-new-paragraph.docx', Buffer.from(output));
console.log('wrote ink-anchor-new-paragraph.docx', output.length);
