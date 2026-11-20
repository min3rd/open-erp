import { parseXml } from '../src/app/core/binary/xml.ts';
import { parseWordBlocks } from '../src/app/core/office/docx.ts';
import { applyTableStyle } from '../src/app/core/office/word-tables.ts';
import type { WordDocument } from '../src/app/core/office/types.ts';

const xml = parseXml(
  '<w:document><w:body><w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/></w:tblPr>'
  + '<w:tblGrid><w:gridCol w:w="3120"/><w:gridCol w:w="3120"/></w:tblGrid>'
  + '<w:tr><w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc></w:tr>'
  + '<w:tr><w:tc><w:p><w:r><w:t>C</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>D</w:t></w:r></w:p></w:tc></w:tr>'
  + '</w:tbl><w:sectPr/></w:body></w:document>');
const doc = { blocks: parseWordBlocks(xml, new Map()), wordCount: 0, pageSize: { width: 816, height: 1056 }, warnings: [], xmlRoot: xml } as WordDocument;
applyTableStyle(doc, 0, 'firstCol', { accent: '#2F5496' });
const block = doc.blocks[0];
console.log(JSON.stringify(block.kind === 'table' ? block.cellStyles : null, null, 1));
