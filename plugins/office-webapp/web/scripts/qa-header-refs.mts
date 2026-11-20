import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const xml = new TextDecoder('utf-8').decode(doc.packageEntries.get('word/document.xml'));
const refs = [...xml.matchAll(/<w:headerReference[^>]*\/>/g)].map((match) => match[0]);
const footers = [...xml.matchAll(/<w:footerReference[^>]*\/>/g)].map((match) => match[0]);
console.log('headerReference count', refs.length, refs.join(' | '));
console.log('footerReference count', footers.length, footers.join(' | '));
const sectPrs = [...xml.matchAll(/<w:sectPr[\s\S]*?<\/w:sectPr>/g)].map((match) => match[0]);
console.log('sectPr count', sectPrs.length);
sectPrs.forEach((node, index) => {
  const header = [...node.matchAll(/<w:headerReference[^>]*\/>/g)].map((m) => m[0]).join(' ');
  console.log(`  sectPr ${index}: ${header || '(no header)'}`);
});
