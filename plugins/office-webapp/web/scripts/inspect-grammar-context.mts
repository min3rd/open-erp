import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { checkWordSpelling } from '../src/app/core/office/word-spell.ts';
import { acceptedText } from '../src/app/core/office/word-markup.ts';

const bytes = fs.readFileSync('plugins/office-webapp/web/samples/sample-real-proposal.docx');
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const doc = await parseDocx(buffer);
const issues = checkWordSpelling(doc.blocks);
console.log(JSON.stringify(issues.map((issue) => {
  const block = doc.blocks[issue.paragraphIndex];
  const text = block?.kind === 'paragraph' ? acceptedText(block.paragraph) : '';
  return {
    paragraph: issue.paragraphIndex,
    kind: issue.kind,
    word: issue.word,
    suggestion: issue.suggestion,
    context: text.slice(Math.max(0, issue.start - 30), issue.end + 30),
  };
}), null, 2));
