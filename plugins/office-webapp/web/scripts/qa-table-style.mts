import fs from 'node:fs';
import { unzipSync } from 'node:zlib';
import { parseXml } from '../src/app/core/office/xml.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
// Minimal zip reader: reuse the app's own docx loader instead of a zip library.
const { parseDocx } = await import('../src/app/core/office/docx.ts');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const table = doc.blocks[541];
const tblPr = table.xmlNode.children.find((child) => child.name === 'w:tblPr');
const styleId = tblPr?.children.find((child) => child.name === 'w:tblStyle')?.attrs['w:val'];
console.log('table style id', styleId);
console.log('styles available', [...doc.styles.tableStyles.keys()].join(','));
const entry = doc.styles.tableStyles.get(styleId);
console.log('entry', JSON.stringify(entry));
