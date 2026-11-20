import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const [docxPath, oursPath, wordPath = '.tmp/word-pdf-pages.json'] = process.argv.slice(2);
const squash = (text) => (text ?? '').normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
const ours = (JSON.parse(fs.readFileSync(oursPath, 'utf8')).pages ?? []).map((page) => squash(page.text ?? ''));
const word = JSON.parse(fs.readFileSync(wordPath, 'utf8')).pages.map((page) => squash(page.text ?? ''));
const bytes = fs.readFileSync(docxPath);
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));

const paraText = (paragraph) => (paragraph?.runs ?? []).map((run) => run.text ?? '').join('');
const blockText = (block) => block.kind === 'paragraph' ? paraText(block.paragraph) : block.rows.flat(3).map(paraText).join(' ');

function span(pages, needle, from, to) {
  const first = (() => { for (let i = Math.max(0, from); i < pages.length; i++) if (pages[i].includes(needle)) return i + 1; return 0; })();
  const last = (() => { for (let i = Math.min(pages.length - 1, to); i >= Math.max(0, from); i--) if (pages[i].includes(needle)) return i + 1; return 0; })();
  return { first, last };
}

let wordCursor = 1;
let ourCursor = 1;
doc.blocks.forEach((block, index) => {
  if (block.kind !== 'table') return;
  const firstRow = block.rows[0]?.flat(1).map(paraText).join(' ').slice(0, 40);
  const lastRow = block.rows[block.rows.length - 1]?.flat(1).map(paraText).join(' ').slice(-40);
  const needleFirst = squash(firstRow).slice(0, 40);
  const needleLast = squash(lastRow).slice(-40);
  if (needleFirst.length < 12 || needleLast.length < 12) return;
  const w = span(word, needleFirst, wordCursor - 1, word.length - 1);
  const o = span(ours, needleFirst, ourCursor - 1, ours.length - 1);
  const wEnd = span(word, needleLast, w.first - 1, w.first + 700);
  const oEnd = span(ours, needleLast, o.first - 1, o.first + 700);
  if (!w.first || !o.first) { console.log(`block ${index} rows=${block.rows.length} NOT FOUND word=${w.first} ours=${o.first}`); return; }
  wordCursor = w.first;
  ourCursor = o.first;
  console.log(`block ${index} rows=${block.rows.length} word p${w.first}-${wEnd.last} (${wEnd.last - w.first + 1}p) ours p${o.first}-${oEnd.last} (${oEnd.last - o.first + 1}p) delta ${o.first - w.first}`);
});
