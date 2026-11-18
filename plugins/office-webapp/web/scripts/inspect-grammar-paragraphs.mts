import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { acceptedText } from '../src/app/core/office/word-markup.ts';

const bytes = fs.readFileSync('plugins/office-webapp/web/samples/sample-real-proposal.docx');
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const doc = await parseDocx(buffer);
for (const index of [106, 295, 373]) {
  const block = doc.blocks[index];
  const text = block?.kind === 'paragraph' ? acceptedText(block.paragraph) : '';
  console.log(index, JSON.stringify(text.slice(0, 160)));
}
