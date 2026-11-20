/**
 * Regenerates the layout calibration for a document from the Word instance that
 * has it open. Each page's start text is matched inside the parsed blocks
 * (content matching, not character offsets: Word counts cell and paragraph
 * marks differently, which made absolute offsets drift).
 *
 *   node scripts/calibrate-document.mts <sample.docx> [out.json]
 */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { parseDocx } from '../src/app/core/office/docx.ts';

const sample = process.argv[2] ?? 'sample-real-proposal.docx';
const out = process.argv[3] ?? `samples/${sample.replace(/\.[^.]+$/, '')}-calibration.json`;
const samplePath = `${process.cwd().replace(/\\/g, '/')}/samples/${sample}`;
const offsetsPath = `${process.cwd().replace(/\\/g, '/')}/.tmp/word-page-starts-generated.json`;

const script = `
$word = [Runtime.InteropServices.Marshal]::GetActiveObject('Word.Application')
if ($word.Documents.Count -eq 0) {
  $null = $word.Documents.Open('${samplePath}', $false, $true)
}
$doc = $word.ActiveDocument
if ($doc.Name -ne '${sample}') { throw "Word has '$($doc.Name)' open, not '${sample}'" }
$doc.Repaginate()
$pages = $doc.ComputeStatistics(2)
$rows = New-Object System.Collections.Generic.List[object]
foreach ($page in 1..$pages) {
  $selection = $word.Selection
  $selection.HomeKey(6) | Out-Null
  $selection.GoTo(1, 1, $page) | Out-Null
  $start = $selection.Start
  $range = $doc.Range($start, [Math]::Min($start + 90, $doc.Content.End))
  $text = ($range.Text -replace "[\`r\`n\`a\`t]", ' ')
  $rows.Add([pscustomobject]@{ page = $page; start = $start; text = $text })
}
$rows | ConvertTo-Json -Depth 3 | Set-Content '${offsetsPath}' -Encoding utf8
Write-Output ("pages={0}" -f $pages)
`;
const run = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], { encoding: 'utf8' });
if (run.status !== 0) {
  console.error(run.stderr || run.stdout);
  process.exit(1);
}
console.log(run.stdout.trim());

const pages = JSON.parse(fs.readFileSync(offsetsPath, 'utf8').replace(/^\uFEFF/, ''));
const bytes = fs.readFileSync(`samples/${sample}`);
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));

const normalize = (text: string): string => (text ?? '')
  .normalize('NFC')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();
const blockText = (index: number): string => {
  const block = doc.blocks[index];
  if (!block) return '';
  if (block.kind === 'paragraph') return normalize((block.paragraph.runs ?? []).map((run) => run.text ?? '').join(''));
  return normalize(block.rows.flatMap((row) => row.flatMap((cell) => cell.map((paragraph) => (paragraph.runs ?? []).map((run) => run.text ?? '').join('')))).join(' '));
};

const paragraphBreaks: Record<number, number> = {};
const paragraphStarts: number[] = [];
let cursor = 0;
let matchedPages = 0;
for (const entry of pages) {
  if (Number(entry.page) === 1) continue;
  // A 24-character prefix is unique enough inside the document when the search
  // starts at the block already reached by the previous page.
  let prefix = normalize(String(entry.text ?? '')).slice(0, 40);
  let found: { index: number; position: number } | null = null;
  for (let attempt = 0; attempt < 3 && !found && prefix.length >= 10; attempt++) {
    // Prefer the first match at or after the block reached by the previous page
    // (the same sentence repeats per chapter); if that finds nothing, fall back
    // to the whole document because an earlier page may have skipped ahead.
    for (const from of [cursor, 0]) {
      for (let index = from; index < doc.blocks.length; index++) {
        const text = blockText(index);
        const position = text.indexOf(prefix);
        if (position >= 0) { found = { index, position }; break; }
      }
      if (found) break;
    }
    if (!found) prefix = prefix.slice(0, prefix.length - 10).trim();
  }
  if (!found) { console.log(`page ${entry.page}: no match ("${prefix.slice(0, 24)}")`); continue; }
  cursor = found.index;
  matchedPages++;
  if (found.position <= 0) paragraphStarts.push(found.index);
  else paragraphBreaks[found.index] = found.position;
}

const payload = {
  // The calibration only applies to the exact file it was measured from: the
  // editor compares this hash and ignores a stale file after any edit.
  documentSha256: createHash('sha256').update(bytes).digest('hex'),
  paragraphBreaks,
  paragraphStarts: [...new Set(paragraphStarts)].sort((a, b) => a - b),
};
// Row floors come from scripts/make-row-floors.ps1 (per-character scan): Word's
// Row.Range.ComputeStatistics(1) counts lines differently and gave row heights
// 3-20x too large, so nothing is derived here.
fs.writeFileSync(out, JSON.stringify(payload, null, 1));
console.log(`wrote ${out}: breaks=${Object.keys(paragraphBreaks).length} starts=${payload.paragraphStarts.length} (pages matched ${matchedPages}/${pages.length - 1})`);
