/**
 * Compares the rendered page text of the Word editor against Word's own PDF
 * export, page by page, with Dice coefficients over word bigrams.
 *
 * Usage:
 *   node scripts/word-page-dice.mjs <our-pages.json> [word-pages.json] [--json <out>]
 *
 * our-pages.json: qa-parity-capture output (.tmp/parity-<tag>.json) with
 *   [{ page, start, text }].
 * word-pages.json: per-page PDF text ({ pages: [{ page, text }] }). Defaults to
 *   .tmp/word-pdf-pages.json, produced from evidence/word-real-proposal.pdf.
 */
import fs from 'node:fs';

const args = process.argv.slice(2);
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const positional = args.filter((value, index) => !value.startsWith('--') && args[index - 1] !== '--json');
const oursPath = positional[0];
const wordPath = positional[1] ?? '.tmp/word-pdf-pages.json';
if (!oursPath) {
  console.error('usage: node scripts/word-page-dice.mjs <our-pages.json> [word-pages.json] [--json out]');
  process.exit(2);
}

const normalize = (text) => (text ?? '')
  .normalize('NFC')
  .toLowerCase()
  // A TOC line glues its page number to the title ("nhà thầu5") while Word's
  // dot leader keeps them apart; split letter/digit boundaries so both sides
  // produce the same tokens.
  .replace(/(\p{L})(\p{N})/gu, '$1 $2')
  .replace(/(\p{N})(\p{L})/gu, '$1 $2')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

// PDF extractors split a word over a line ("Nhó m") or spell a heading out
// letter by letter ("M Ụ C L Ụ C"); the one-letter fragments carry no meaning
// and only add noise, so they are dropped from the token stream.
const tokens = (text) => normalize(text).split(' ').filter((word) => word.length > 1);
const compactMode = args.includes('--compact');
const compactTokens = (text) => (text ?? '').normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '').split('');
const compareTokens = (text) => (compactMode ? compactTokens(text) : tokens(text));

function bigrams(values) {
  const map = new Map();
  for (let index = 0; index < values.length - 1; index++) {
    const key = `${values[index]} ${values[index + 1]}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function dice(left, right) {
  if (!left.length || !right.length) return 0;
  const a = bigrams(left);
  const b = bigrams(right);
  let shared = 0;
  let totalA = 0;
  let totalB = 0;
  for (const count of a.values()) totalA += count;
  for (const count of b.values()) totalB += count;
  for (const [key, count] of a) shared += Math.min(count, b.get(key) ?? 0);
  return (2 * shared) / (totalA + totalB);
}

const oursRaw = JSON.parse(fs.readFileSync(oursPath, 'utf8'));
const wordRaw = JSON.parse(fs.readFileSync(wordPath, 'utf8'));
const ours = Array.isArray(oursRaw) ? oursRaw : oursRaw.pages;
const word = (Array.isArray(wordRaw) ? wordRaw : wordRaw.pages).map((entry) => ({
  page: entry.page,
  text: entry.text ?? entry.full ?? entry.start ?? '',
}));

const limit = Math.min(ours.length, word.length);
const rows = [];
for (let index = 0; index < limit; index++) {
  const ourText = ours[index].text ?? ours[index].start ?? '';
  const wordText = word[index].text;
  rows.push({
    page: index + 1,
    startDice: dice(compareTokens(ours[index].start ?? ourText.slice(0, 120)), compareTokens(wordText.slice(0, 160))),
    bodyDice: dice(compareTokens(ourText), compareTokens(wordText)),
  });
}

const mean = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
const percentile = (values, threshold) => values.filter((value) => value >= threshold).length;
const starts = rows.map((row) => row.startDice);
const bodies = rows.map((row) => row.bodyDice);
const worst = [...rows].sort((a, b) => a.bodyDice - b.bodyDice).slice(0, 10).map((row) => ({
  page: row.page,
  startDice: Number(row.startDice.toFixed(3)),
  bodyDice: Number(row.bodyDice.toFixed(3)),
  word: word[row.page - 1].text.slice(0, 140),
  ours: (ours[row.page - 1].text ?? ours[row.page - 1].start ?? '').slice(0, 140),
}));

const result = {
  source: oursPath,
  wordPages: word.length,
  ourPages: ours.length,
  startDice: {
    mean: Number(mean(starts).toFixed(4)),
    median: Number([...starts].sort((a, b) => a - b)[Math.floor(starts.length / 2)]?.toFixed(4)),
    ge_0_90: percentile(starts, 0.9),
    ge_0_80: percentile(starts, 0.8),
    ge_0_50: percentile(starts, 0.5),
    lt_0_50: starts.length - percentile(starts, 0.5),
  },
  bodyDice: {
    mean: Number(mean(bodies).toFixed(4)),
    median: Number([...bodies].sort((a, b) => a - b)[Math.floor(bodies.length / 2)]?.toFixed(4)),
    ge_0_90: percentile(bodies, 0.9),
    ge_0_80: percentile(bodies, 0.8),
    ge_0_50: percentile(bodies, 0.5),
    lt_0_50: bodies.length - percentile(bodies, 0.5),
  },
  worstPages: worst,
};

console.log(JSON.stringify({ ...result, worstPages: result.worstPages.slice(0, 5) }, null, 2));
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ ...result, pages: rows }, null, 2));
