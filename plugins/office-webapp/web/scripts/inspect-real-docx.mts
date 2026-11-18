import fs from 'node:fs';
import path from 'node:path';
import { readZip } from '../src/app/core/binary/zip.ts';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { saveDocx } from '../src/app/core/office/docx-save.ts';
import { serializeXml, descendants, findChild } from '../src/app/core/binary/xml.ts';

const folder = 'C:\\Users\\Minh\\Documents\\btc\\Hồ sơ thầu';
const fileName = fs.readdirSync(folder).find((name) => name.endsWith('_v1.0.docx'));
const source = process.argv[2] ?? path.join(folder, fileName ?? '');
const copyTo = process.argv[3] ?? '';
const bytes = fs.readFileSync(source);
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const zip = await readZip(buffer);
const xml = new TextDecoder('utf-8').decode(zip.entries.get('word/document.xml') ?? new Uint8Array());
const counts = (tag: string) => (xml.match(new RegExp(`<${tag}[ >/]`, 'g')) ?? []).length;
const doc = await parseDocx(buffer);
const tables = doc.blocks.filter((block) => block.kind === 'table');
const paragraphs = doc.blocks.filter((block) => block.kind === 'paragraph');
const allParagraphs = doc.blocks.flatMap((block) => {
  if (block.kind === 'paragraph') return [block.paragraph];
  return block.rows.flatMap((row) => row.flatMap((cell) => cell));
});
const images = allParagraphs.flatMap((paragraph) => paragraph.runs).filter((run) => run.imagePath);
const textBoxes = allParagraphs.flatMap((paragraph) => paragraph.runs).filter((run) => run.textBox);
const links = allParagraphs.flatMap((paragraph) => paragraph.runs).filter((run) => run.link);
const videos = allParagraphs.flatMap((paragraph) => paragraph.runs).filter((run) => run.videoUrl);
console.log(JSON.stringify({
  entries: zip.entries.size,
  media: [...zip.entries.keys()].filter((name) => name.startsWith('word/media/')),
  features: {
    tables: counts('w:tbl'), paragraphs: counts('w:p'), drawings: counts('w:drawing'), anchors: counts('wp:anchor'),
    inline: counts('wp:inline'), sdt: counts('w:sdt'), sdtContent: counts('w:sdtContent'), math: counts('m:oMath'),
    hyperlinks: counts('w:hyperlink'), fldSimple: counts('w:fldSimple'), instrText: counts('w:instrText'),
    pageBreaks: (xml.match(/<w:br[^>]*w:type="page"/g) ?? []).length, sectPr: counts('w:sectPr'),
    textboxes: counts('w:txbxContent'), vml: counts('v:shape'), comments: counts('w:commentReference'),
    footnotes: counts('w:footnoteReference'), endnotes: counts('w:endnoteReference'),
    ins: counts('w:ins'), del: counts('w:del'), numPr: counts('w:numPr'),
  },
  parsed: {
    blocks: doc.blocks.length,
    paragraphs: paragraphs.length,
    allParagraphs: allParagraphs.length,
    tables: tables.length,
    tableRows: tables.map((block) => block.kind === 'table' ? block.rows.length : 0),
    images: images.length,
    textBoxes: textBoxes.map((run) => run.textBox),
    links: links.length,
    videos: videos.length,
    wordCount: doc.wordCount,
    warnings: doc.warnings,
    sections: doc.sections?.length ?? 0,
    comments: doc.comments?.length ?? 0,
    footnotes: doc.notes?.footnotes.length ?? 0,
    endnotes: doc.notes?.endnotes.length ?? 0,
    equations: doc.equations?.length ?? 0,
    sources: doc.sources?.length ?? 0,
    watermark: doc.watermark ?? null,
    protected: doc.protected ?? false,
    theme: doc.theme ?? null,
    styleSet: doc.styleSet ?? null,
    pageSize: doc.pageSize,
  },
  firstBlocks: doc.blocks.slice(0, 6).map((block) => block.kind === 'paragraph'
    ? { kind: 'p', text: block.paragraph.runs.map((run) => run.text).join('').slice(0, 80), style: block.paragraph.style ?? null }
    : { kind: 'table', rows: block.rows.length, cols: block.rows[0]?.length ?? 0 }),
}, null, 2));

if (copyTo) {
  fs.mkdirSync(path.dirname(copyTo), { recursive: true });
  fs.copyFileSync(source, copyTo);
  console.log('copied', copyTo);
}

const saved = await saveDocx(doc, buffer);
fs.writeFileSync('plugins/office-webapp/web/.tmp/real-roundtrip.docx', saved);
const reparsed = await parseDocx(saved);
const textOf = (document: typeof doc) => document.blocks.filter((block) => block.kind === 'paragraph')
  .map((block) => block.kind === 'paragraph' ? block.paragraph.runs.map((run) => run.text).join('') : '')
  .join('\n');
console.log(JSON.stringify({
  savedBytes: saved.length,
  originalEntries: zip.entries.size,
  savedEntries: (await readZip(saved)).entries.size,
  textPreserved: textOf(reparsed) === textOf(doc),
  paragraphs: reparsed.blocks.filter((block) => block.kind === 'paragraph').length,
  tables: reparsed.blocks.filter((block) => block.kind === 'table').length,
  images: reparsed.blocks.filter((block) => block.kind === 'paragraph')
    .flatMap((block) => block.kind === 'paragraph' ? block.paragraph.runs : []).filter((run) => run.imagePath).length,
}, null, 2));
