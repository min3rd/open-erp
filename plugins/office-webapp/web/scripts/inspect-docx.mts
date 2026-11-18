import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const file = process.argv[2];
if (!file) throw new Error('missing file');
const bytes = fs.readFileSync(file);
const word = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const first = word.blocks[0];
console.log(JSON.stringify({
  words: word.wordCount,
  firstText: first?.kind === 'paragraph' ? first.paragraph.runs.map((run) => run.text).join('') : null,
  heading: first?.kind === 'paragraph' ? first.paragraph.headingLevel : null,
  blocks: word.blocks.length,
}));
