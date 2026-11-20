/**
 * Where does our pagination drift from Word's? For every top-level block this
 * finds the page where the block's text first appears in Word's PDF export and
 * in our captured pages, then prints the running delta so the block that starts
 * a drift is visible.
 *
 *   node scripts/qa-block-drift.mts <sample.docx> <our-pages.json> [word-pages.json]
 */
import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { acceptedText } from '../src/app/core/office/word-markup.ts';

const [docxPath, oursPath, wordPath = '.tmp/word-pdf-pages.json'] = process.argv.slice(2);
if (!docxPath || !oursPath) {
  console.error('usage: node scripts/qa-block-drift.mts <sample.docx> <our-pages.json> [word-pages.json]');
  process.exit(2);
}

const squash = (text: string) => (text ?? '')
  .normalize('NFC')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, '');

const ours = (JSON.parse(fs.readFileSync(oursPath, 'utf8')).pages ?? []).map((page: { text?: string }) => squash(page.text ?? ''));
const word = JSON.parse(fs.readFileSync(wordPath, 'utf8')).pages.map((page: { text?: string }) => squash(page.text ?? ''));

const bytes = fs.readFileSync(docxPath);
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));

function blockText(block: { kind: string; paragraph?: { runs: { text?: string }[] }; rows?: { runs: { text?: string }[] }[][][] }): string {
  if (block.kind === 'paragraph') return acceptedText(block.paragraph as never) ?? '';
  return (block.rows ?? []).slice(0, 3).flat(3).map((paragraph) => paragraph?.runs?.map((run) => run.text ?? '').join('') ?? '').join(' ');
}

const findPage = (pages: string[], needle: string, from: number): number => {
  for (let index = Math.max(0, from); index < pages.length; index++) {
    if (pages[index].includes(needle)) return index + 1;
  }
  return 0;
};

let wordCursor = 0;
let ourCursor = 0;
const rows: Array<{ block: number; kind: string; wordPage: number; ourPage: number; delta: number; snippet: string }> = [];
doc.blocks.forEach((block: { kind: string }, index: number) => {
  const text = blockText(block as never);
  const needle = squash(text).slice(0, 50);
  if (needle.length < 20) return;
  const wordPage = findPage(word, needle, wordCursor);
  const ourPage = findPage(ours, needle, ourCursor);
  if (!wordPage || !ourPage) return;
  wordCursor = wordPage - 1;
  ourCursor = ourPage - 1;
  rows.push({ block: index, kind: block.kind, wordPage, ourPage, delta: ourPage - wordPage, snippet: text.replace(/\s+/g, ' ').slice(0, 80) });
});

let previous = 0;
for (const row of rows) {
  if (row.delta !== previous) {
    console.log(`\nblock ${row.block} ${row.kind}: word p${row.wordPage} ours p${row.ourPage} delta ${row.delta > 0 ? '+' : ''}${row.delta}  "${row.snippet}"`);
    previous = row.delta;
  }
}
const last = rows[rows.length - 1];
console.log(`\nblocks matched ${rows.length}/${doc.blocks.length}; final delta ${last ? last.delta : 0}`);
const byKind = new Map<string, { count: number; delta: number }>();
for (const row of rows) {
  const entry = byKind.get(row.kind) ?? { count: 0, delta: 0 };
  entry.count += 1;
  entry.delta += row.delta;
  byKind.set(row.kind, entry);
}
for (const [kind, entry] of byKind) console.log(kind, entry.count, 'avg delta', (entry.delta / entry.count).toFixed(2));
