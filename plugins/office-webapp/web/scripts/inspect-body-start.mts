import fs from 'node:fs';
import { readZip } from '../src/app/core/binary/zip.ts';
import { attr, descendants, findChild, parseXml } from '../src/app/core/binary/xml.ts';

const bytes = fs.readFileSync('plugins/office-webapp/web/samples/sample-real-proposal.docx');
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const zip = await readZip(buffer);
const root = parseXml(new TextDecoder().decode(zip.entries.get('word/document.xml')));
const documentNode = findChild(root, 'w:document') ?? root;
const body = findChild(documentNode, 'w:body');
if (!body) throw new Error('no body');
const textOf = (node) => descendants(node, 'w:t').map((item) => item.text).join('').slice(0, 60);
console.log(body.children.slice(0, 12).map((child, index) => ({
  index,
  name: child.name,
  text: textOf(child),
  hasSectPr: descendants(child, 'w:sectPr').length > 0,
  hasDrawing: descendants(child, 'w:drawing').length,
  hasPict: descendants(child, 'w:pict').length,
  hasTxbx: descendants(child, 'w:txbxContent').length,
})));
