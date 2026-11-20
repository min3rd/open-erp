import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const base = 'D:/Projects/open-erp/plugins/office-webapp/web';
const bytes = fs.readFileSync(`${base}/samples/sample-real-proposal.docx`);
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const normalize = (text) => text.normalize('NFC');
const textOf = (index) => {
  const block = doc.blocks[index];
  if (block.kind !== 'paragraph') return '';
  return normalize((block.paragraph.runs ?? []).map((run) => run.text ?? '').join(''));
};
for (const [block, needle] of [
  [339, 'sẽ tạo ra các file tĩnh gồm HTML'],
  [350, 'Guide cho Oracle Database 19c'],
  [385, 'cụ thể của chủ đầu tư; đồng thời'],
]) {
  const text = textOf(block);
  const position = text.indexOf(needle);
  console.log(`block ${block}: needle at ${position} of ${text.length}`);
  if (position > 0) {
    console.log('  before:', JSON.stringify(text.slice(Math.max(0, position - 24), position)));
    console.log('  after :', JSON.stringify(text.slice(position, position + 32)));
  }
}
