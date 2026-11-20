import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const base = 'D:/Projects/open-erp/plugins/office-webapp/web';
const bytes = fs.readFileSync(`${base}/samples/word-authored-large.docx`);
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const paragraphs = doc.blocks.filter((block) => block.kind === 'paragraph').slice(0, 6);
paragraphs.forEach((block, index) => {
  if (block.kind !== 'paragraph') return;
  const paragraph = block.paragraph;
  console.log(index, JSON.stringify({
    style: paragraph.style,
    heading: paragraph.headingLevel,
    font: paragraph.fontFamily,
    sizePt: paragraph.fontSizePt,
    lineSpacing: paragraph.lineSpacing,
    lineHeightPx: paragraph.lineHeightPx,
    spaceBeforePx: paragraph.spaceBeforePx,
    spaceAfterPx: paragraph.spaceAfterPx,
    text: (paragraph.runs ?? []).map((run) => run.text ?? '').join('').slice(0, 30),
  }));
});
const firstTable = doc.blocks.find((block) => block.kind === 'table');
console.log('first table rows', firstTable?.kind === 'table' ? firstTable.rows.length : 0,
  'rowHeights', firstTable?.kind === 'table' ? JSON.stringify(firstTable.rowHeights?.slice(0, 3)) : '');
