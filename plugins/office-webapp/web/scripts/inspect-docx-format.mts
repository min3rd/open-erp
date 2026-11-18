import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { descendants } from '../src/app/core/binary/xml.ts';

const bytes = fs.readFileSync(process.argv[2]);
const word = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const target = word.blocks[1];
const p = target.kind === 'paragraph' ? target.paragraph : null;
const xml = p?.xmlNode;
const numbering = word.packageEntries?.get('word/numbering.xml');
const rels = word.packageEntries?.get('word/_rels/document.xml.rels');
const types = word.packageEntries?.get('[Content_Types].xml');
console.log(JSON.stringify({
  paragraph: p ? {
    text: p.runs.map((run) => run.text).join(''),
    style: p.style,
    headingLevel: p.headingLevel,
    align: p.align,
    indent: p.indent,
    lineSpacing: p.lineSpacing,
    listType: p.listType,
    hasJc: descendants(xml!, 'w:jc').map((node) => node.attrs['w:val']),
    hasInd: descendants(xml!, 'w:ind').map((node) => node.attrs['w:left']),
    hasSpacing: descendants(xml!, 'w:spacing').map((node) => node.attrs['w:line']),
    hasNumPr: descendants(xml!, 'w:numPr').map((node) => descendants(node, 'w:numId')[0]?.attrs['w:val']),
    hasStyle: descendants(xml!, 'w:pStyle').map((node) => node.attrs['w:val']),
  } : null,
  pageBreak: word.blocks.some((block) => block.kind === 'paragraph'
    && block.paragraph.runs.some((run) => run.pageBreak)),
  pageBreakXml: descendants(word.xmlRoot!, 'w:br').filter((node) => node.attrs['w:type'] === 'page').length,
  numberingBytes: numbering?.length ?? 0,
  numberingRel: rels ? new TextDecoder().decode(rels).includes('numbering.xml') : false,
  numberingContentType: types ? new TextDecoder().decode(types).includes('/word/numbering.xml') : false,
}, null, 2));
