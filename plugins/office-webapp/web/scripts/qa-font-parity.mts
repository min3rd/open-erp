import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const base = 'D:/Projects/open-erp/plugins/office-webapp/web';
for (const name of ['word-authored-large.docx', 'word-authored-sample.docx', 'sample-real-proposal.docx']) {
  const bytes = fs.readFileSync(`${base}/samples/${name}`);
  const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const paragraph = doc.blocks.find((block) => block.kind === 'paragraph')?.paragraph;
  console.log(name, JSON.stringify({
    font: paragraph?.fontFamily,
    sizePt: paragraph?.fontSizePt,
    lineSpacing: paragraph?.lineSpacing,
    lineHeightPx: paragraph?.lineHeightPx,
    spaceAfterPx: paragraph?.spaceAfterPx,
    pageMargins: doc.pageMargins,
    blocks: doc.blocks.length,
  }));
}
