import fs from 'node:fs';
import path from 'node:path';
import { writeZip } from '../src/app/core/binary/zip.ts';

const text = (value: string): Uint8Array => new TextEncoder().encode(value);

const themeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1><a:srgbClr val="112233"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:accent1><a:srgbClr val="1F4E79"/></a:accent1>
      <a:accent2><a:srgbClr val="C00000"/></a:accent2>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont><a:latin typeface="Calibri"/></a:majorFont>
      <a:minorFont><a:latin typeface="Times New Roman"/></a:minorFont>
    </a:fontScheme>
  </a:themeElements>
</a:theme>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="character" w:styleId="StrongBlue">
    <w:rPr><w:b/><w:color w:val="1F4E79"/><w:smallCaps/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Normal">
    <w:rPr><w:rFonts w:asciiTheme="minorHAnsi"/><w:sz w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="table" w:styleId="AccentGrid">
    <w:tblPr>
      <w:tblBorders>
        <w:top w:val="single" w:sz="12" w:color="1F4E79"/>
        <w:bottom w:val="single" w:sz="12" w:color="1F4E79"/>
        <w:left w:val="none"/>
        <w:right w:val="none"/>
        <w:insideH w:val="single" w:sz="6" w:color="93C5FD"/>
        <w:insideV w:val="none"/>
      </w:tblBorders>
    </w:tblPr>
    <w:tblStylePr w:type="firstRow">
      <w:tcPr><w:shd w:val="clear" w:fill="DBEAFE"/></w:tcPr>
    </w:tblStylePr>
  </w:style>
</w:styles>`;

const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="10">
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:pPr><w:ind w:left="360"/></w:pPr></w:lvl>
    <w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1.%2."/><w:pPr><w:ind w:left="720"/></w:pPr></w:lvl>
  </w:abstractNum>
  <w:num w:numId="10"><w:abstractNumId w:val="10"/></w:num>
</w:numbering>`;

const chartXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <c:chart>
    <c:title><c:tx><c:rich><a:bodyPr/><a:p><a:r><a:t>Doanh thu theo quý</a:t></a:r></a:p></c:rich></c:tx></c:title>
    <c:plotArea>
      <c:barChart>
        <c:barDir val="col"/>
        <c:ser>
          <c:idx val="0"/><c:order val="0"/>
          <c:tx><c:v>2026</c:v></c:tx>
          <c:cat><c:strRef><c:strCache><c:ptCount val="3"/><c:pt idx="0"><c:v>Q1</c:v></c:pt><c:pt idx="1"><c:v>Q2</c:v></c:pt><c:pt idx="2"><c:v>Q3</c:v></c:pt></c:strCache></c:strRef></c:cat>
          <c:val><c:numRef><c:numCache><c:ptCount val="3"/><c:pt idx="0"><c:v>120</c:v></c:pt><c:pt idx="1"><c:v>180</c:v></c:pt><c:pt idx="2"><c:v>240</c:v></c:pt></c:numCache></c:numRef></c:val>
        </c:ser>
      </c:barChart>
    </c:plotArea>
  </c:chart>
</c:chartSpace>`;

const headerFirstXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:tbl><w:tr><w:tc><w:p><w:r><w:t>BIỂU MẪU TRANG ĐẦU</w:t></w:r></w:p></w:tc><w:tc><w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:t>MÃ: QA-RICH</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
</w:hdr>`;

const headerEvenXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:r><w:t>ĐẦU TRANG CHẴN OPEN-ERP</w:t></w:r></w:p>
</w:hdr>`;

const headerDefaultXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:r><w:t>ĐẦU TRANG LẺ MẶC ĐỊNH</w:t></w:r></w:p>
</w:hdr>`;

const footerDefaultXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:r><w:t>Trang </w:t></w:r><w:fldSimple w:instr=" PAGE "><w:r><w:t>1</w:t></w:r></w:fldSimple><w:r><w:t> / </w:t></w:r><w:fldSimple w:instr=" NUMPAGES "><w:r><w:t>2</w:t></w:r></w:fldSimple></w:p>
</w:ftr>`;

const footnotesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:footnote w:id="1"><w:p><w:r><w:t>Chú thích cuối trang số 1 trên trang đầu.</w:t></w:r></w:p></w:footnote>
</w:footnotes>`;

const endnotesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:endnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:endnote w:id="1"><w:p><w:r><w:t>Ghi chú cuối tài liệu (Endnote 1).</w:t></w:r></w:p></w:endnote>
</w:endnotes>`;

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
  xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:v="urn:schemas-microsoft-com:vml">
  <w:body>
    <w:p>
      <w:pPr><w:pBdr><w:bottom w:val="single" w:sz="12" w:color="1F4E79"/></w:pBdr></w:pPr>
      <w:r><w:rPr><w:rStyle w:val="StrongBlue"/><w:u w:val="none"/><w:color w:val="auto"/><w:shd w:val="clear" w:fill="FEF08A"/></w:rPr><w:t>Character Style + Theme Color + SmallCaps</w:t></w:r>
      <w:r><w:sym w:font="Symbol" w:char="F0B7"/><w:t>Symbol</w:t><w:noBreakHyphen/><w:t>Break</w:t><w:footnoteReference w:id="1"/></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Công thức toán: </w:t></w:r>
      <m:oMath><m:r><m:t>E</m:t></m:r><m:r><m:t>=</m:t></m:r><m:f><m:num><m:r><m:t>a+b</m:t></m:r></m:num><m:den><m:r><m:t>c</m:t></m:r></m:den></m:f><m:sSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sup><m:r><m:t>2</c:t></m:r></m:sup></m:sSup></m:oMath>
    </w:p>
    <w:p>
      <w:r>
        <mc:AlternateContent>
          <mc:Choice Requires="wps"><w:drawing><wp:inline><wp:extent cx="3810000" cy="2095500"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart r:id="rIdChart1"/></a:graphicData></a:graphic></wp:inline></w:drawing></mc:Choice>
          <mc:Fallback><w:r><w:t>Fallback ignored</w:t></w:r></mc:Fallback>
        </mc:AlternateContent>
      </w:r>
    </w:p>
    <w:p>
      <w:r><w:pict><v:shape style="width:120pt;height:40pt"><v:textbox><w:txbxContent><w:p><w:r><w:t>Hộp VML cổ điển</w:t></w:r></w:p></w:txbxContent></v:textbox></v:shape></w:pict></w:r>
      <w:r><w:drawing><wp:inline><wp:extent cx="914400" cy="914400"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:blipFill><a:blip r:embed="rIdEmf1"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>
    </w:p>
    <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="10"/></w:numPr></w:pPr><w:r><w:t>Mục cấp một</w:t></w:r></w:p>
    <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="10"/></w:numPr></w:pPr><w:r><w:t>Mục cấp hai A</w:t></w:r></w:p>
    <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="10"/></w:numPr></w:pPr><w:r><w:t>Mục cấp hai B</w:t></w:r></w:p>
    <w:tbl>
      <w:tblPr><w:tblStyle w:val="AccentGrid"/></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Cột 1</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="4000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Cột 2</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:p><w:r><w:t>Giá trị A</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Giá trị B</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p>
      <w:pPr><w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/><w:cols w:num="2" w:space="720"/></w:sectPr></w:pPr>
      <w:r><w:t>Đoạn bố cục 2 cột cột trái và cột phải.</w:t></w:r>
    </w:p>
    <w:p><w:pPr><w:pageBreakBefore/></w:pPr><w:r><w:t>Trang thứ hai do pageBreakBefore mở đầu.</w:t><w:endnoteReference w:id="1"/></w:r></w:p>
    <w:sectPr>
      <w:headerReference w:type="first" r:id="rIdHdrFirst"/>
      <w:headerReference w:type="even" r:id="rIdHdrEven"/>
      <w:headerReference w:type="default" r:id="rIdHdrDefault"/>
      <w:footerReference w:type="default" r:id="rIdFtrDefault"/>
      <w:titlePg/>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
  <Relationship Id="rIdNum" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
  <Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rIdChart1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="charts/chart1.xml"/>
  <Relationship Id="rIdEmf1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/vector1.emf"/>
  <Relationship Id="rIdHdrFirst" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="headerFirst.xml"/>
  <Relationship Id="rIdHdrEven" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="headerEven.xml"/>
  <Relationship Id="rIdHdrDefault" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="headerDefault.xml"/>
  <Relationship Id="rIdFtrDefault" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footerDefault.xml"/>
  <Relationship Id="rIdFn" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/>
  <Relationship Id="rIdEn" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/endnotes" Target="endnotes.xml"/>
</Relationships>`;

const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:evenAndOddHeaders/></w:settings>`;

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="emf" ContentType="image/x-emf"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const bytes = await writeZip([
  { name: '[Content_Types].xml', data: text(contentTypesXml) },
  { name: '_rels/.rels', data: text(rootRelsXml) },
  { name: 'word/_rels/document.xml.rels', data: text(docRelsXml) },
  { name: 'word/document.xml', data: text(documentXml) },
  { name: 'word/styles.xml', data: text(stylesXml) },
  { name: 'word/theme/theme1.xml', data: text(themeXml) },
  { name: 'word/numbering.xml', data: text(numberingXml) },
  { name: 'word/settings.xml', data: text(settingsXml) },
  { name: 'word/charts/chart1.xml', data: text(chartXml) },
  { name: 'word/headerFirst.xml', data: text(headerFirstXml) },
  { name: 'word/headerEven.xml', data: text(headerEvenXml) },
  { name: 'word/headerDefault.xml', data: text(headerDefaultXml) },
  { name: 'word/footerDefault.xml', data: text(footerDefaultXml) },
  { name: 'word/footnotes.xml', data: text(footnotesXml) },
  { name: 'word/endnotes.xml', data: text(endnotesXml) },
  { name: 'word/media/vector1.emf', data: new Uint8Array([1, 0, 0, 0]) },
]);

const outPath = path.resolve(process.cwd(), 'plugins/office-webapp/web/samples/qa-formats-rich.docx');
fs.writeFileSync(outPath, bytes);
console.log('CREATED qa-formats-rich.docx', bytes.length, 'bytes');
