import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { descendants, parseXml } from '../src/app/core/binary/xml.ts';
import type { WordParagraph } from '../src/app/core/office/types.ts';

const file = process.argv[2] ?? 'samples/sample-real-proposal.docx';
const bytes = new Uint8Array(fs.readFileSync(file));
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const doc = await parseDocx(buffer);

const markerOffsets = (paragraph: WordParagraph): number[] => {
  if (!paragraph.xmlNode) return [];
  const offsets: number[] = [];
  let cursor = 0;
  const walk = (node: ReturnType<typeof parseXml>): void => {
    if (node.name === 'w:t') { cursor += node.text.length; return; }
    if (node.name === 'w:tab' || node.name === 'w:br') { cursor += 1; return; }
    if (node.name === 'w:lastRenderedPageBreak') { offsets.push(cursor); return; }
    for (const child of node.children) walk(child);
  };
  walk(paragraph.xmlNode);
  return offsets;
};

const textOf = (paragraph: WordParagraph): string => paragraph.runs.map((run) => run.text).join('');
const hints: Array<{ blockIndex: number; rowStart?: number; offset: number; snippet: string }> = [];
doc.blocks.forEach((block, blockIndex) => {
  if (block.kind === 'paragraph') {
    const text = textOf(block.paragraph);
    for (const offset of markerOffsets(block.paragraph)) {
      hints.push({ blockIndex, offset, snippet: text.slice(offset, offset + 60) });
    }
    return;
  }
  block.rows.forEach((row, rowStart) => {
    row.forEach((cell) => {
      for (const paragraph of cell) {
        const text = textOf(paragraph);
        for (const offset of markerOffsets(paragraph)) {
          hints.push({ blockIndex, rowStart, offset, snippet: text.slice(offset, offset + 60) });
        }
      }
    });
  });
});

const appXml = new TextDecoder().decode(doc.packageEntries?.get('docProps/app.xml') ?? new Uint8Array());
const pages = /<Pages>(\d+)<\/Pages>/.exec(appXml)?.[1] ?? null;
fs.mkdirSync('.tmp', { recursive: true });
fs.writeFileSync('.tmp/word-hints.json', JSON.stringify({ pages: Number(pages), count: hints.length, hints }, null, 2));
console.log(JSON.stringify({ pages, blocks: doc.blocks.length, hints: hints.length, first: hints.slice(0, 5) }, null, 2));
