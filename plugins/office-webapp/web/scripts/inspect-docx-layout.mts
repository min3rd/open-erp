import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { scanAccessibility } from '../src/app/core/office/word-accessibility.ts';
import { descendants } from '../src/app/core/binary/xml.ts';

const bytes = fs.readFileSync(process.argv[2]);
const word = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
console.log(JSON.stringify({
  sections: (word.sections ?? []).map((section) => ({
    columns: section.columns,
    columnSpace: section.columnSpace,
    pageWidth: section.pageWidth,
    pageHeight: section.pageHeight,
    orientation: section.orientation,
    margins: section.margins,
  })),
  imageAlt: descendants(word.xmlRoot!, 'pic:cNvPr').map((node) => node.attrs['descr'] ?? null),
  tableHeader: descendants(word.xmlRoot!, 'w:tblHeader').length,
  issues: scanAccessibility(word).map((issue) => issue.code),
}, null, 2));
