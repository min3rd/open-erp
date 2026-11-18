import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { sectionAt } from '../src/app/core/office/word-section.ts';
import { descendants } from '../src/app/core/binary/xml.ts';

const bytes = fs.readFileSync(process.argv[2]);
const word = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const section = sectionAt(word);
console.log(JSON.stringify({
  pageColor: word.pageColor,
  pageBorder: section?.pageBorder,
  lineNumbering: section?.lineNumbering,
  xml: {
    background: descendants(word.xmlRoot!, 'w:background').map((node) => node.attrs),
    borders: descendants(word.xmlRoot!, 'w:pgBorders').map((node) => node.attrs),
    top: descendants(word.xmlRoot!, 'w:pgBorders')[0]?.children.find((child) => child.name === 'w:top')?.attrs,
    line: descendants(word.xmlRoot!, 'w:lnNumType').map((node) => node.attrs),
  },
}, null, 2));
