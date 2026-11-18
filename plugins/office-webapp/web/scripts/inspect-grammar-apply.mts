import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { applySpellSuggestion, checkWordSpelling } from '../src/app/core/office/word-spell.ts';
import { acceptedText } from '../src/app/core/office/word-markup.ts';

const bytes = fs.readFileSync('plugins/office-webapp/web/samples/grammar-sample.docx');
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const doc = await parseDocx(buffer);
for (let step = 0; step < 8; step++) {
  const issues = checkWordSpelling(doc.blocks);
  console.log('step', step, JSON.stringify(issues.map((issue) => ({
    p: issue.paragraphIndex, start: issue.start, end: issue.end, word: issue.word, suggestion: issue.suggestion, kind: issue.kind,
  }))));
  if (!issues.length) break;
  const issue = issues[0];
  console.log('apply', applySpellSuggestion(doc, issue, issue.suggestion));
  console.log('texts', doc.blocks.map((block) => block.kind === 'paragraph' ? acceptedText(block.paragraph) : ''));
}
