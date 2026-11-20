import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
console.log('doc keys', Object.keys(doc).join(','));
const sheet = doc.styleSheet ?? doc.styles ?? null;
if (!sheet) {
  console.log('no style sheet exposed');
} else {
  console.log('defaults', JSON.stringify(sheet.defaults));
  console.log('default paragraph style', sheet.defaultParagraphStyle);
  console.log('table styles', [...sheet.tableStyles.keys()].join(','));
  console.log('TableGrid entry', JSON.stringify(sheet.tableStyles.get('TableGrid')));
  const paragraphStyles = [...sheet.styles.entries()].slice(0, 6).map(([id, entry]) => `${id}:${JSON.stringify(entry.own)}`);
  console.log('some paragraph styles', paragraphStyles.join('\n'));
}
const table = doc.blocks[541];
const paragraph = table.rows[2][1][0];
console.log('block 541 paragraph metrics', paragraph.fontSizePt, paragraph.fontFamily, paragraph.lineSpacing, paragraph.lineHeightPx);
