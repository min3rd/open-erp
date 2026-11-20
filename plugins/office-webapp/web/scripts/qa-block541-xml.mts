import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const block = doc.blocks[541];
const xmlNode = block.xmlNode;
const rows = xmlNode.children.filter((child) => child.name === 'w:tr');
const row = rows[2];
const cells = row.children.filter((child) => child.name === 'w:tc');
const dump = (node, depth = 0, out = []) => {
  if (depth > 5) return out;
  const attrs = Object.entries(node.attrs ?? {}).map(([key, value]) => `${key}=${value}`).join(' ');
  out.push(`${'  '.repeat(depth)}<${node.name} ${attrs}>${node.text ? ` «${node.text.slice(0, 40)}»` : ''}`);
  for (const child of node.children ?? []) dump(child, depth + 1, out);
  return out;
};
for (const cellIndex of [1, 2]) {
  console.log(`--- cell ${cellIndex}`);
  console.log(dump(cells[cellIndex]).join('\n').slice(0, 1400));
}
const modelParagraph = block.rows[2][1][0];
console.log('model font', modelParagraph.fontSizePt, modelParagraph.fontFamily);
console.log('model run style', JSON.stringify(modelParagraph.runs[0]?.style ?? null));
