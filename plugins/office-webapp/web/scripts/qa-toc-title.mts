import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const tocs = doc.blocks
  .map((block, index) => ({ block, index }))
  .filter((entry) => entry.block.kind === 'paragraph' && /MỤC LỤC/i.test((entry.block.paragraph.runs ?? []).map((run) => run.text ?? '').join('')));
for (const { block, index } of tocs.slice(0, 2)) {
  const paragraph = block.kind === 'paragraph' ? block.paragraph : null;
  console.log('index', index, JSON.stringify({
    style: paragraph?.style,
    align: paragraph?.align,
    fontSizePt: paragraph?.fontSizePt,
    spaceBeforePx: paragraph?.spaceBeforePx,
    spaceAfterPx: paragraph?.spaceAfterPx,
    lineSpacing: paragraph?.lineSpacing,
    lineHeightPx: paragraph?.lineHeightPx,
    text: (paragraph?.runs ?? []).map((run) => run.text ?? '').join('').slice(0, 20),
  }));
  const previous = doc.blocks[index - 1];
  console.log('  previous:', previous?.kind, previous?.kind === 'paragraph'
    ? JSON.stringify({
      style: previous.paragraph.style,
      spaceAfterPx: previous.paragraph.spaceAfterPx,
      text: (previous.paragraph.runs ?? []).map((run) => run.text ?? '').join('').slice(0, 20),
    })
    : '');
  console.log('  next:', doc.blocks[index + 1]?.kind === 'paragraph'
    ? JSON.stringify({
      style: (doc.blocks[index + 1] as any).paragraph.style,
      spaceBeforePx: (doc.blocks[index + 1] as any).paragraph.spaceBeforePx,
      text: ((doc.blocks[index + 1] as any).paragraph.runs ?? []).map((run: any) => run.text ?? '').join('').slice(0, 24),
    })
    : '-');
}
