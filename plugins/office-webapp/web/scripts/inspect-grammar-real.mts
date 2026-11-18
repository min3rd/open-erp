import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { checkWordSpelling } from '../src/app/core/office/word-spell.ts';

const bytes = fs.readFileSync('plugins/office-webapp/web/samples/sample-real-proposal.docx');
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const doc = await parseDocx(buffer);
const issues = checkWordSpelling(doc.blocks).filter((issue) => issue.kind === 'grammar');
console.log(JSON.stringify(issues.map((issue) => ({
  paragraph: issue.paragraphIndex,
  word: issue.word,
  suggestion: issue.suggestion,
})), null, 2));
