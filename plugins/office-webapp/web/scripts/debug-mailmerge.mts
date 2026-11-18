import { readZip, writeZip } from '../src/app/core/binary/zip.ts';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { saveDocx } from '../src/app/core/office/docx-save.ts';
import {
  emptyMailMergeState, finishMerge, parseMergeRows, type MailMergeState,
} from '../src/app/core/office/word-mailmerge.ts';
import type { WordBlock } from '../src/app/core/office/types.ts';

const enc = new TextEncoder();
const text = (value: string) => enc.encode(value);
const toBuffer = (bytes: Uint8Array) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

const mailDocx = await writeZip([
  { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>') },
  { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
    + '<w:p><w:r><w:t>Kính gửi </w:t></w:r><w:fldSimple w:instr=" MERGEFIELD Name "><w:r><w:t>«Name»</w:t></w:r></w:fldSimple></w:p>'
    + '<w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> MERGEFIELD Company </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>Cũ</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>'
    + '<w:tbl><w:tr><w:tc><w:p><w:fldSimple w:instr=" MERGEFIELD City "><w:r><w:t>«City»</w:t></w:r></w:fldSimple></w:p></w:tc></w:tr></w:tbl>'
    + '<w:sectPr/></w:body></w:document>') },
]);

const mailDoc = await parseDocx(mailDocx);
const mergeData = parseMergeRows([['Name', 'Company', 'City'], ['An', 'SOpen', 'Hà Nội'], ['Bình', 'VN9', 'Đà Nẵng']]);
const state: MailMergeState = { ...emptyMailMergeState(), fields: mergeData.fields, recipients: mergeData.recipients, selected: [0, 1] };
const textOf = (blocks: WordBlock[]) => blocks.map((block) => block.kind === 'paragraph'
  ? block.paragraph.runs.map((run) => run.text).join('')
  : block.rows.flatMap((row) => row.flatMap((cell) => cell.map((paragraph) =>
    paragraph.runs.map((run) => run.text).join('')))).join('')).join('\n');

console.log('count', finishMerge(mailDoc, state));
const mergedText = textOf(mailDoc.blocks);
const saved = await saveDocx(mailDoc, toBuffer(mailDocx));
const savedDoc = await parseDocx(saved);
const savedText = textOf(savedDoc.blocks);
console.log('merged', JSON.stringify(mergedText));
console.log('saved ', JSON.stringify(savedText));
console.log('equal', mergedText === savedText);
const savedXml = new TextDecoder().decode((await readZip(saved)).entries.get('word/document.xml'));
console.log(savedXml);
