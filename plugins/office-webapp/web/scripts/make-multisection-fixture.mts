import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { saveDocx } from '../src/app/core/office/docx-save.ts';
import {
  ensureHeaderFooter, insertSectionBreak, sectionAt, setHeaderFooterText,
} from '../src/app/core/office/word-section.ts';

const bytes = new Uint8Array(fs.readFileSync('samples/sample.docx'));
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const doc = await parseDocx(buffer);
insertSectionBreak(doc);
// A section break needs content after it, otherwise the paginator folds both
// sections into one page. Append a body paragraph before the final sectPr.
const body = doc.xmlRoot ? doc.xmlRoot.children.find((child) => child.name === 'w:body') : undefined;
if (body) {
  const paragraph = {
    name: 'w:p', attrs: {}, text: '',
    children: [{
      name: 'w:r', attrs: {}, text: '',
      children: [{ name: 'w:t', attrs: { 'xml:space': 'preserve' }, text: 'Second section body', children: [] }],
    }],
  };
  body.children.splice(Math.max(0, body.children.length - 1), 0, paragraph);
}
const entries = doc.packageEntries ?? new Map();
for (const [index, label] of [[0, 'Header section 1'], [1, 'Header section 2']] as const) {
  const section = sectionAt(doc, index);
  if (!section) throw new Error(`missing section ${index}`);
  const header = ensureHeaderFooter(doc, section, 'header', 'default', entries);
  setHeaderFooterText(header, label);
  const footer = ensureHeaderFooter(doc, section, 'footer', 'default', entries);
  setHeaderFooterText(footer, label.replace('Header', 'Footer'));
}
const saved = await saveDocx(doc, buffer);
fs.writeFileSync('samples/qa-multisection.docx', Buffer.from(saved));
console.log('sections', doc.sections?.length, 'bytes', saved.length);
