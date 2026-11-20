import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const base = 'D:/Projects/open-erp/plugins/office-webapp/web';
const pdf = JSON.parse(fs.readFileSync(`${base}/.tmp/word-pdf-pages.json`, 'utf8'));
const pages = Array.isArray(pdf) ? pdf : pdf.pages;
const bytes = fs.readFileSync(`${base}/samples/sample-real-proposal.docx`);
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));

const normalize = (text) => (text ?? '').normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const blockText = (block) => {
  if (block.kind !== 'paragraph') return '';
  return normalize((block.paragraph.runs ?? []).map((run) => run.text ?? '').join(''));
};

function pageStart(pageNumber) {
  const entry = pages.find((item) => Number(item.page) === pageNumber);
  if (!entry) return null;
  const words = normalize(entry.text).split(' ').filter(Boolean);
  return words.slice(1, 9).join(' ');
}

const targets = [18, 22, 23, 26, 3];
const found = {};
for (const pageNumber of targets) {
  const prefix = pageStart(pageNumber);
  if (!prefix) continue;
  const candidates = [];
  doc.blocks.forEach((block, index) => {
    const text = blockText(block);
    if (!text) return;
    const position = text.indexOf(prefix);
    if (position >= 0) candidates.push({ index, position, text: text.slice(0, 60) });
  });
  candidates.sort((a, b) => b.position - a.position);
  found[pageNumber] = { prefix, matches: candidates.slice(0, 3).map((entry) => `#${entry.index}${entry.position > 0 ? `@${entry.position}` : ''}`), best: candidates[0] };
  console.log(`page ${pageNumber}: prefix "${prefix.slice(0, 50)}" ->`, candidates.length ? candidates.slice(0, 3).map((entry) => `block ${entry.index} pos ${entry.position} "${entry.text.slice(0, 40)}"`) : 'NO MATCH');
}
fs.writeFileSync(`${base}/.tmp/paragraph-targets.json`, JSON.stringify(found, null, 2));
