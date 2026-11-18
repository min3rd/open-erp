import fs from 'node:fs';
import { writeZip } from '../src/app/core/binary/zip.ts';

/** Small table document for the merged-cells QA probe (Word reads it too). */
const documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
  + '<w:p><w:r><w:t>Merged cells sample</w:t></w:r></w:p>'
  + '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>'
  + '<w:top w:val="single" w:sz="4" w:color="auto"/><w:left w:val="single" w:sz="4" w:color="auto"/>'
  + '<w:bottom w:val="single" w:sz="4" w:color="auto"/><w:right w:val="single" w:sz="4" w:color="auto"/>'
  + '<w:insideH w:val="single" w:sz="4" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:color="auto"/>'
  + '</w:tblBorders></w:tblPr>'
  + '<w:tblGrid><w:gridCol w:w="3120"/><w:gridCol w:w="3120"/><w:gridCol w:w="3120"/></w:tblGrid>'
  + '<w:tr>'
  + '<w:tc><w:tcPr><w:tcW w:w="3333" w:type="pct"/></w:tcPr><w:p><w:r><w:t>Alpha</w:t></w:r></w:p></w:tc>'
  + '<w:tc><w:tcPr><w:tcW w:w="3333" w:type="pct"/></w:tcPr><w:p><w:r><w:t>Beta</w:t></w:r></w:p></w:tc>'
  + '<w:tc><w:tcPr><w:tcW w:w="3333" w:type="pct"/></w:tcPr><w:p><w:r><w:t>Gamma</w:t></w:r></w:p></w:tc>'
  + '</w:tr>'
  + '<w:tr>'
  + '<w:tc><w:tcPr><w:tcW w:w="3333" w:type="pct"/><w:vMerge w:val="restart"/></w:tcPr>'
  + '<w:p><w:r><w:t>Tall</w:t></w:r></w:p></w:tc>'
  + '<w:tc><w:tcPr><w:tcW w:w="3333" w:type="pct"/></w:tcPr><w:p><w:r><w:t>One</w:t></w:r></w:p></w:tc>'
  + '<w:tc><w:tcPr><w:tcW w:w="3333" w:type="pct"/></w:tcPr><w:p><w:r><w:t>Two</w:t></w:r></w:p></w:tc>'
  + '</w:tr>'
  + '<w:tr>'
  + '<w:tc><w:tcPr><w:tcW w:w="3333" w:type="pct"/><w:vMerge/></w:tcPr><w:p/></w:tc>'
  + '<w:tc><w:tcPr><w:tcW w:w="3333" w:type="pct"/></w:tcPr><w:p><w:r><w:t>Three</w:t></w:r></w:p></w:tc>'
  + '<w:tc><w:tcPr><w:tcW w:w="3333" w:type="pct"/></w:tcPr><w:p><w:r><w:t>Four</w:t></w:r></w:p></w:tc>'
  + '</w:tr>'
  + '</w:tbl>'
  + '<w:p><w:r><w:t>After the table</w:t></w:r></w:p>'
  + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
  + '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>'
  + '</w:body></w:document>';

const encoder = new TextEncoder();
const zip = await writeZip([
  {
    name: '[Content_Types].xml',
    data: encoder.encode('<?xml version="1.0" encoding="UTF-8"?>'
      + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
      + '</Types>'),
  },
  {
    name: '_rels/.rels',
    data: encoder.encode('<?xml version="1.0" encoding="UTF-8"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
      + '</Relationships>'),
  },
  { name: 'word/document.xml', data: encoder.encode(documentXml) },
]);
fs.writeFileSync(new URL('../samples/sample-merged-cells.docx', import.meta.url), zip);
console.log('wrote samples/sample-merged-cells.docx', zip.length, 'bytes');
