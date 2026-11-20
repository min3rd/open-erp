import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const base = 'D:/Projects/open-erp/plugins/office-webapp/web';
const bytes = fs.readFileSync(`${base}/samples/sample-real-proposal.docx`);
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const needle = 'Các chức năng sau khi phát triển phải được kiểm thử theo kịch bản';
let found = null;
doc.blocks.forEach((block, index) => {
  if (found || block.kind !== 'paragraph') return;
  const text = (block.paragraph.runs ?? []).map((run) => run.text ?? '').join('');
  const position = text.indexOf(needle);
  if (position >= 0) found = { index, position, length: text.length };
});
console.log('block', JSON.stringify(found));
