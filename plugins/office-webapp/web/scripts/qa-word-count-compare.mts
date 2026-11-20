import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('D:/Projects/open-erp/plugins/office-webapp/web/samples/sample-real-proposal.docx');
const word = await parseDocx(bytes);
const texts = [];
const walkBlocks = (blocks) => {
  for (const block of blocks) {
    if (block.kind === 'paragraph') texts.push(block.paragraph.runs.map((run) => run.text ?? '').join(''));
    else for (const row of block.rows) for (const cell of row) walkParagraphs(cell);
  }
};
const walkParagraphs = (paragraphs) => {
  for (const paragraph of paragraphs) texts.push(paragraph.runs.map((run) => run.text ?? '').join(''));
};
walkBlocks(word.blocks);
const joined = texts.join('\n');
const bySpace = joined.split(/\s+/).filter(Boolean).length;
const byWord = (joined.match(/[\p{L}\p{N}]+(?:['’\u2019-][\p{L}\p{N}]+)*/gu) ?? []).length;
console.log(JSON.stringify({
  paragraphs: texts.length,
  wordCount: word.wordCount,
  bySpace,
  byWord,
  chars: joined.replace(/\s/g, '').length,
}));
