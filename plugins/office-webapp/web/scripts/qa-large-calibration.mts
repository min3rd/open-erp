import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const base = 'D:/Projects/open-erp/plugins/office-webapp/web';
const starts = JSON.parse(fs.readFileSync(`${base}/.tmp/word-large-page-starts.json`, 'utf8').replace(/^\uFEFF/, ''));
const bytes = fs.readFileSync(`${base}/samples/word-authored-large.docx`);
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));

const blockText = (index) => {
  const block = doc.blocks[index];
  if (block?.kind !== 'paragraph') return '';
  return (block.paragraph.runs ?? []).map((run) => run.text ?? '').join('');
};
const blocks = doc.blocks.map((_, index) => index).filter((index) => blockText(index).length > 0);

const paragraphs = {};
let cursor = 0;
for (const entry of starts) {
  const prefix = String(entry.text ?? '').slice(0, 40).trim();
  if (!prefix) continue;
  let matched = null;
  for (const index of blocks) {
    if (index < cursor) continue;
    const text = blockText(index);
    const position = text.indexOf(prefix);
    if (position >= 0) { matched = { index, position }; break; }
  }
  if (!matched) { console.log(`page ${entry.page}: no match for "${prefix.slice(0, 30)}"`); continue; }
  cursor = matched.index;
  // A break at offset 0 means "the page starts at this paragraph".
  if (matched.position > 0) paragraphs[matched.index] = matched.position;
  console.log(`page ${entry.page}: block ${matched.index} offset ${matched.position}`);
}

const output = { paragraphBreaks: paragraphs };
fs.writeFileSync(`${base}/samples/word-authored-large-calibration.json`, JSON.stringify(output, null, 1));
console.log('wrote samples/word-authored-large-calibration.json', JSON.stringify(paragraphs));
