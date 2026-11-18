import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { descendants } from '../src/app/core/binary/xml.ts';
import { acceptedText } from '../src/app/core/office/word-markup.ts';

const bytes = fs.readFileSync(process.argv[2]);
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const paragraphs = doc.blocks.filter((block) => block.kind === 'paragraph')
  .map((block) => block.kind === 'paragraph' ? acceptedText(block.paragraph) : '');
const boxRun = doc.blocks.flatMap((block) => block.kind === 'paragraph' ? block.paragraph.runs : []).find((run) => run.textBox);
const headerBytes = doc.sections?.[0]?.headers[0]?.path ? doc.packageEntries?.get(doc.sections[0].headers[0].path) : undefined;
console.log(JSON.stringify({
  paragraphs: paragraphs.filter(Boolean),
  coverTitleStyle: doc.blocks[0]?.kind === 'paragraph' ? doc.blocks[0].paragraph.style : null,
  pageBreaks: descendants(doc.xmlRoot!, 'w:br').filter((node) => node.attrs['w:type'] === 'page').length,
  textBox: boxRun?.textBox ?? null,
  textBoxParts: descendants(doc.xmlRoot!, 'wps:txbx').length,
  captions: descendants(doc.xmlRoot!, 'w:fldSimple').map((node) => node.attrs['w:instr']),
  watermark: doc.watermark,
  headerWatermark: headerBytes ? new TextDecoder().decode(headerBytes).includes('CONFIDENTIAL') : false,
  headerPath: doc.sections?.[0]?.headers[0]?.path ?? null,
}, null, 2));
