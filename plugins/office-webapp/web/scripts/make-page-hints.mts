import fs from 'node:fs';
import { readZip, writeZip } from '../src/app/core/binary/zip.ts';
import { parseDocx } from '../src/app/core/office/docx.ts';
import type { WordBlock, WordNestedTable, WordParagraph } from '../src/app/core/office/types.ts';

const sample = 'plugins/office-webapp/web/samples/sample-real-proposal.docx';
const bytes = fs.readFileSync(sample);
const buffer = bytes.buffer.byteOffset === 0 && bytes.buffer.byteLength === bytes.byteLength
  ? bytes.buffer as ArrayBuffer
  : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const doc = await parseDocx(buffer);

interface Unit { blockIndex: number; rowStart?: number; text: string; }
const textOf = (paragraph: WordParagraph): string => paragraph.runs.map((run) => run.text).join('');
const units: Unit[] = [];
doc.blocks.forEach((block, blockIndex) => {
  if (block.kind === 'paragraph') {
    units.push({ blockIndex, text: textOf(block.paragraph) });
    return;
  }
  for (let r = 0; r < block.rows.length; r++) {
    block.rows[r].forEach((cellParagraphs) => {
      for (const paragraph of cellParagraphs) units.push({ blockIndex, rowStart: r, text: textOf(paragraph) });
    });
  }
});

const norm = (value: string): string => value.toLowerCase().replace(/[^a-z0-9à-ỹ]+/gi, ' ').trim();
const wordMap = JSON.parse(fs.readFileSync('plugins/office-webapp/web/.tmp/word-page-map.json', 'utf8'));
const hints: Array<{ page: number; blockIndex: number; rowStart?: number }> = [];
let cursor = 0;
let missed = 0;
for (const entry of wordMap) {
  if (entry.page === 1) continue;
  const snippet = norm(entry.text).slice(0, 20);
  if (!snippet) { missed++; continue; }
  let found = -1;
  for (let i = cursor; i < units.length; i++) {
    if (norm(units[i].text).startsWith(snippet)) { found = i; break; }
  }
  if (found < 0) {
    for (let i = 0; i < cursor; i++) {
      if (norm(units[i].text).startsWith(snippet)) { found = i; break; }
    }
  }
  if (found < 0) { missed++; continue; }
  cursor = found + 1;
  hints.push({ page: entry.page, blockIndex: units[found].blockIndex, rowStart: units[found].rowStart });
}

const unique = hints.filter((hint, index) => index === 0
  || hint.blockIndex !== hints[index - 1].blockIndex
  || hint.rowStart !== hints[index - 1].rowStart);

fs.writeFileSync('plugins/office-webapp/web/.tmp/page-hints.json', JSON.stringify(unique.map(({ blockIndex, rowStart }) => ({ blockIndex, rowStart }))));
console.log(JSON.stringify({ units: units.length, wordPages: wordMap.length, matched: hints.length, unique: unique.length, missed, first: unique.slice(0, 6) }, null, 2));

const zip = await readZip(buffer);
const entries = [...zip.entries.entries()].map(([name, data]) => ({ name, data }));
entries.push({ name: 'word/pageHints.json', data: new TextEncoder().encode(JSON.stringify(unique.map(({ blockIndex, rowStart }) => ({ blockIndex, rowStart })))) });
const output = await writeZip(entries);
fs.writeFileSync('plugins/office-webapp/web/samples/sample-real-proposal-hinted.docx', Buffer.from(output));
console.log('wrote hinted docx', output.length);
