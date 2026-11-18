import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { descendants } from '../src/app/core/binary/xml.ts';

const bytes = fs.readFileSync(process.argv[2]);
const word = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const summary = word.blocks.map((block, index) => {
  if (block.kind !== 'paragraph') return { index, kind: 'table' };
  return {
    index,
    text: block.paragraph.runs.map((run) => run.text).join(''),
    style: block.paragraph.style ?? null,
    runs: block.paragraph.runs.map((run) => ({
      text: run.text,
      bold: run.bold ?? false,
      italic: run.italic ?? false,
      underline: run.underline ?? false,
      strike: run.strike ?? false,
      font: run.font ?? null,
      sizePt: run.sizePt ?? null,
      color: run.color ?? null,
      highlight: run.highlight ?? null,
    })),
  };
});
const rPrCount = descendants(word.xmlRoot!, 'w:rPr').length;
const rFonts = descendants(word.xmlRoot!, 'w:rFonts').map((node) => node.attrs['w:ascii']);
const sizes = descendants(word.xmlRoot!, 'w:sz').map((node) => node.attrs['w:val']);
const colors = descendants(word.xmlRoot!, 'w:color').map((node) => node.attrs['w:val']);
const highlights = descendants(word.xmlRoot!, 'w:highlight').map((node) => node.attrs['w:val']);
const noSpacing = descendants(word.xmlRoot!, 'w:pStyle').filter((node) => node.attrs['w:val'] === 'NoSpacing').length;
console.log(JSON.stringify({ summary, rPrCount, rFonts, sizes, colors, highlights, noSpacing }, null, 2));
