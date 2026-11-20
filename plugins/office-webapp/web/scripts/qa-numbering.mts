import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { parseXml, descendants, attr, findChild } from '../src/app/core/office/../binary/xml.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const xml = new TextDecoder('utf-8').decode(doc.packageEntries.get('word/numbering.xml'));
const root = parseXml(xml);

// numId 14 -> abstractNumId
const nums = descendants(root, 'w:num');
const target = nums.find((node) => attr(node, 'w:numId') === '14');
console.log('num 14 ->', target ? attr(findChild(target, 'w:abstractNumId'), 'w:val') : 'missing');
const abstractId = target ? attr(findChild(target, 'w:abstractNumId'), 'w:val') : null;
const abstract = descendants(root, 'w:abstractNum').find((node) => attr(node, 'w:abstractNumId') === abstractId);
if (abstract) {
  const lvl = descendants(abstract, 'w:lvl').find((node) => attr(node, 'w:ilvl') === '0');
  console.log('lvl0 fmt', attr(findChild(lvl, 'w:numFmt'), 'w:val'), 'text', attr(findChild(lvl, 'w:lvlText'), 'w:val'), 'start', attr(findChild(lvl, 'w:start'), 'w:val'));
}
// styles.xml: Heading1 numPr
const stylesXml = new TextDecoder('utf-8').decode(doc.packageEntries.get('word/styles.xml'));
const heading = parseXml(stylesXml);
const h1 = descendants(heading, 'w:style').find((node) => attr(node, 'w:styleId') === 'Heading1');
console.log('Heading1 pPr numPr:', h1 ? JSON.stringify(descendants(h1, 'w:numPr').map((node) => node)) .slice(0, 300) : 'none');
