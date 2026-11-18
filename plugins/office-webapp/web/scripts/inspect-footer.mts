import fs from 'node:fs';
import { readZip } from '../src/app/core/binary/zip.ts';

const bytes = fs.readFileSync('plugins/office-webapp/web/samples/sample-real-proposal.docx');
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const zip = await readZip(buffer);
for (const [name, data] of zip.entries) {
  if (!/footer\d*\.xml$/.test(name)) continue;
  const xml = new TextDecoder('utf-8').decode(data);
  console.log('=====', name, data.length);
  console.log(xml);
}
