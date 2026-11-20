import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const table = doc.blocks[396];
const xml = (node, depth = 0, out = []) => {
  if (depth > 5) return out;
  out.push(`${'  '.repeat(depth)}<${node.name} ${Object.entries(node.attrs ?? {}).map(([key, value]) => `${key}=${value}`).join(' ')}>${node.text ? ` [${node.text.slice(0, 30)}]` : ''}`);
  for (const child of node.children ?? []) xml(child, depth + 1, out);
  return out;
};
const row = table.xmlNode.children.filter((child) => child.name === 'w:tr')[199];
const cells = row.children.filter((child) => child.name === 'w:tc');
console.log(xml(cells[3]).join('\n').slice(0, 1800));
