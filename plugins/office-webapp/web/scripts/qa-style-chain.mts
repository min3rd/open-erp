import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { parseWordStyles, resolveTableStyle, resolveParagraphStyle } from '../src/app/core/office/word-styles.ts';
import { parseXml } from '../src/app/core/office/xml.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const sheet = parseWordStyles(doc.packageEntries);
console.log('default paragraph style', sheet.defaultParagraphStyle);
console.log('defaults', JSON.stringify(sheet.defaults));
for (const id of ['Normal', 'TableNormal', 'TableGrid']) {
  console.log(id, 'paragraph:', JSON.stringify(sheet.styles.get(id)?.own), 'table:', JSON.stringify(sheet.tableStyles.get(id)?.own), 'basedOn:', sheet.tableStyles.get(id)?.basedOn ?? sheet.styles.get(id)?.basedOn);
}
console.log('resolve Normal', JSON.stringify(resolveParagraphStyle(sheet)));
console.log('resolve TableGrid', JSON.stringify(resolveTableStyle(sheet, 'TableGrid')));
const xml = new TextDecoder('utf-8').decode(doc.packageEntries.get('word/styles.xml'));
const tableNormal = xml.indexOf('w:styleId="TableNormal"');
console.log('TableNormal xml:', xml.slice(tableNormal - 60, tableNormal + 420).replace(/\s+/g, ' '));
