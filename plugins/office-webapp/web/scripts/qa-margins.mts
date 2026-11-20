import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
console.log('pageSize', JSON.stringify(doc.pageSize));
console.log('pageMargins', JSON.stringify(doc.pageMargins));
console.log('sections', JSON.stringify(doc.sections?.map((section) => ({
  pageHeight: section.pageHeight,
  pageWidth: section.pageWidth,
  margins: section.margins,
})), null, 1));
