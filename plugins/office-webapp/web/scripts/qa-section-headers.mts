import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
doc.sections?.forEach((section, index) => {
  console.log(`section ${index}: page=${section.pageWidth}x${section.pageHeight}`,
    'headers:', section.headers.map((header) => `${header.type}:${header.path}${header.imagePath ? '' : ''}`).join(' '),
    '| footers:', section.footers.map((footer) => `${footer.type}:${footer.path}`).join(' '));
});
console.log('blocks in sections:', doc.blocks.reduce((map, block) => {
  const key = block.sectionIndex ?? 0;
  map[key] = (map[key] ?? 0) + 1;
  return map;
}, {}));
