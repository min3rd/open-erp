import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { descendants } from '../src/app/core/binary/xml.ts';

const bytes = fs.readFileSync(process.argv[2]);
const word = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const tables = word.blocks.filter((block) => block.kind === 'table');
const lastTable = tables.at(-1);
const imageRun = word.blocks
  .flatMap((block) => block.kind === 'paragraph' ? block.paragraph.runs : [])
  .find((run) => run.imagePath);
const rels = word.packageEntries?.get('word/_rels/document.xml.rels');
const types = word.packageEntries?.get('[Content_Types].xml');
console.log(JSON.stringify({
  paragraphs: word.blocks.filter((b) => b.kind === 'paragraph').map((b) => b.kind === 'paragraph' ? b.paragraph.runs.map((r) => r.text).join('') : ''),
  tableCount: tables.length,
  lastTable: lastTable?.kind === 'table' ? { rows: lastTable.rows.length, cells: lastTable.rows[0]?.length } : null,
  xmlTables: descendants(word.xmlRoot!, 'w:tbl').length,
  gridColumns: descendants(word.xmlRoot!, 'w:gridCol').length,
  imageRun,
  media: [...(word.packageEntries ?? new Map()).entries()]
    .filter(([name]) => name.startsWith('word/media/'))
    .map(([name, data]) => ({ name, bytes: data.length })),
  relsImage: rels ? new TextDecoder().decode(rels).includes('image1.png') : false,
  contentTypePng: types ? new TextDecoder().decode(types).includes('Extension="png"') : false,
}, null, 2));
