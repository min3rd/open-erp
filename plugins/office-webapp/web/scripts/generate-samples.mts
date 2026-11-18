import fs from 'node:fs';
import path from 'node:path';
import { writeZip } from '../src/app/core/binary/zip.ts';

const out = path.resolve(process.argv[2] ?? '.tmp/samples');
fs.mkdirSync(out, { recursive: true });
const enc = new TextEncoder();
const xml = (value: string) => enc.encode(value);

async function main(): Promise<void> {
  const docx = await writeZip([
    { name: '[Content_Types].xml', data: xml('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>') },
    {
      name: 'word/document.xml',
      data: xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="1F4E79"/></w:rPr><w:t>Báo cáo Sprint 12</w:t></w:r></w:p>
<w:p><w:r><w:t>Office WebApp đọc trực tiếp .docx trên trình duyệt, không upload nội dung lên máy chủ.</w:t></w:r></w:p>
<w:p><w:r><w:rPr><w:i/></w:rPr><w:t>Tiếng Việt: ă â ê ô ơ ư đ — 0123456789</w:t></w:r></w:p>
<w:tbl>
<w:tr><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Hạng mục</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Trạng thái</w:t></w:r></w:p></w:tc></w:tr>
<w:tr><w:tc><w:p><w:r><w:t>Word parser</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Hoàn thành</w:t></w:r></w:p></w:tc></w:tr>
<w:tr><w:tc><w:p><w:r><w:t>Excel parser</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Hoàn thành</w:t></w:r></w:p></w:tc></w:tr>
</w:tbl>
<w:p><w:r><w:t>Kết luận: nền tảng OOXML thuần TypeScript đã chạy.</w:t></w:r></w:p>
<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr>
</w:body></w:document>`),
    },
  ]);

  const xlsx = await writeZip([
    { name: 'xl/workbook.xml', data: xml('<?xml version="1.0"?><workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Doanh thu" sheetId="1" r:id="rId1"/><sheet name="Chi phí" sheetId="2" r:id="rId2"/></sheets></workbook>') },
    { name: 'xl/_rels/workbook.xml.rels', data: xml('<?xml version="1.0"?><Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml" Type="worksheet"/><Relationship Id="rId2" Target="worksheets/sheet2.xml" Type="worksheet"/></Relationships>') },
    { name: 'xl/sharedStrings.xml', data: xml('<?xml version="1.0"?><sst><si><t>Tháng</t></si><si><t>Doanh thu</t></si><si><t>Chi phí</t></si><si><t>Lợi nhuận</t></si></sst>') },
    { name: 'xl/worksheets/sheet1.xml', data: xml('<?xml version="1.0"?><worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>01/2026</t></is></c><c r="B2"><v>120000000</v></c><c r="C2"><v>75000000</v></c><c r="D2"><f>B2-C2</f><v>45000000</v></c></row><row r="3"><c r="A3" t="inlineStr"><is><t>02/2026</t></is></c><c r="B3"><v>150000000</v></c><c r="C3"><v>90000000</v></c><c r="D3"><f>B3-C3</f><v>60000000</v></c></row><row r="4"><c r="A4" t="inlineStr"><is><t>Tổng</t></is></c><c r="B4"><f>SUM(B2:B3)</f><v>270000000</v></c><c r="C4"><f>SUM(C2:C3)</f><v>165000000</v></c><c r="D4"><f>SUM(D2:D3)</f><v>105000000</v></c></row></sheetData><mergeCells><mergeCell ref="A4:A4"/></mergeCells></worksheet>') },
    { name: 'xl/worksheets/sheet2.xml', data: xml('<?xml version="1.0"?><worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Chi phí vận hành</t></is></c><c r="B1"><v>90000000</v></c></row></sheetData></worksheet>') },
  ]);

  const pptx = await writeZip([
    { name: 'ppt/presentation.xml', data: xml('<?xml version="1.0"?><p:presentation xmlns:p="p" xmlns:r="r"><p:sldSz cx="12192000" cy="6858000"/><p:sldIdLst><p:sldId id="256" r:id="rId1"/><p:sldId id="257" r:id="rId2"/></p:sldIdLst></p:presentation>') },
    { name: 'ppt/_rels/presentation.xml.rels', data: xml('<?xml version="1.0"?><Relationships><Relationship Id="rId1" Target="slides/slide1.xml" Type="slide"/><Relationship Id="rId2" Target="slides/slide2.xml" Type="slide"/></Relationships>') },
    { name: 'ppt/slides/slide1.xml', data: xml('<?xml version="1.0"?><p:sld xmlns:p="p" xmlns:a="a"><p:cSld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="914400" y="914400"/><a:ext cx="9500000" cy="1500000"/></a:xfrm></p:spPr><p:txBody><a:p><a:r><a:rPr sz="4400" b="1"/><a:t>Báo cáo Sprint 12</a:t></a:r></a:p></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Sub"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="1200000" y="2800000"/><a:ext cx="8500000" cy="900000"/></a:xfrm></p:spPr><p:txBody><a:p><a:r><a:rPr sz="2400"/><a:t>Office WebApp — OOXML client-side</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>') },
    { name: 'ppt/slides/slide2.xml', data: xml('<?xml version="1.0"?><p:sld xmlns:p="p" xmlns:a="a"><p:cSld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="4" name="Title2"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="914400" y="914400"/><a:ext cx="9500000" cy="1500000"/></a:xfrm></p:spPr><p:txBody><a:p><a:r><a:rPr sz="4000" b="1"/><a:t>Kết quả</a:t></a:r></a:p></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="5" name="Body"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="1200000" y="2400000"/><a:ext cx="8500000" cy="2200000"/></a:xfrm></p:spPr><p:txBody><a:p><a:r><a:rPr sz="2200"/><a:t>22 smoke test PASS</a:t></a:r></a:p><a:p><a:r><a:rPr sz="2200"/><a:t>Plugin build thành công</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>') },
  ]);

  fs.writeFileSync(path.join(out, 'sample.docx'), docx);
  fs.writeFileSync(path.join(out, 'sample.xlsx'), xlsx);
  fs.writeFileSync(path.join(out, 'sample.pptx'), pptx);
  fs.writeFileSync(path.join(out, 'sample.csv'), 'Tháng;Doanh thu;Chi phí\n01/2026;120000000;75000000\n02/2026;150000000;90000000\n');

  const validated = await writeZip([
    { name: 'xl/workbook.xml', data: xml('<?xml version="1.0"?><workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Kiểm tra" sheetId="1" r:id="rId1"/></sheets></workbook>') },
    { name: 'xl/_rels/workbook.xml.rels', data: xml('<?xml version="1.0"?><Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml" Type="worksheet"/></Relationships>') },
    { name: 'xl/worksheets/sheet1.xml', data: xml('<?xml version="1.0"?><worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Số lượng</t></is></c><c r="B1" t="inlineStr"><is><t>Trạng thái</t></is></c></row><row r="2"><c r="A2"><v>150</v></c><c r="B2" t="inlineStr"><is><t>Vượt ngưỡng</t></is></c></row><row r="3"><c r="A3"><v>50</v></c><c r="B3" t="inlineStr"><is><t>Đạt</t></is></c></row></sheetData><conditionalFormatting sqref="A2:A10"><cfRule type="cellIs" operator="greaterThan" priority="1"><formula>100</formula></cfRule></conditionalFormatting><dataValidations><dataValidation type="whole" operator="between" sqref="A2:A10" allowBlank="1" showErrorMessage="1" errorTitle="Số lượng" errorMessage="Nhập số từ 1 đến 100"><formula1>1</formula1><formula2>100</formula2></dataValidation></dataValidations></worksheet>') },
  ]);
  fs.writeFileSync(path.join(out, 'sample-cf-dv.xlsx'), validated);

  const mediaDir = process.env['SAMPLE_MEDIA_DIR'];
  const videoBytes = mediaDir
    ? new Uint8Array(fs.readFileSync(path.join(mediaDir, 'video1.mp4')))
    : xml('fake-mp4-bytes');
  const audioBytes = mediaDir
    ? new Uint8Array(fs.readFileSync(path.join(mediaDir, 'audio1.wav')))
    : xml('RIFF....WAVEfmt fake-audio-bytes');
  const smartart = await writeZip([
    { name: 'ppt/presentation.xml', data: xml('<?xml version="1.0"?><p:presentation xmlns:p="p" xmlns:r="r"><p:sldSz cx="12192000" cy="6858000"/><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst></p:presentation>') },
    { name: 'ppt/_rels/presentation.xml.rels', data: xml('<?xml version="1.0"?><Relationships><Relationship Id="rId1" Target="slides/slide1.xml" Type="slide"/></Relationships>') },
    { name: 'ppt/slides/_rels/slide1.xml.rels', data: xml('<?xml version="1.0"?><Relationships><Relationship Id="rId2" Target="../diagrams/data1.xml" Type="diagramData"/><Relationship Id="rId3" Target="../media/video1.mp4" Type="video"/><Relationship Id="rId4" Target="../media/audio1.wav" Type="audio"/></Relationships>') },
    { name: 'ppt/diagrams/data1.xml', data: xml('<?xml version="1.0"?><dgm:dataModel xmlns:dgm="dgm" xmlns:a="a"><dgm:ptLst><dgm:pt><dgm:t><a:p><a:r><a:t>Ý tưởng</a:t></a:r></a:p></dgm:t></dgm:pt><dgm:pt><dgm:t><a:p><a:r><a:t>Triển khai</a:t></a:r></a:p></dgm:t></dgm:pt></dgm:ptLst></dgm:dataModel>') },
    { name: 'ppt/media/video1.mp4', data: videoBytes },
    { name: 'ppt/media/audio1.wav', data: audioBytes },
    { name: 'ppt/slides/slide1.xml', data: xml('<?xml version="1.0"?><p:sld xmlns:p="p" xmlns:a="a" xmlns:dgm="dgm" xmlns:r="r"><p:cSld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="914400" y="457200"/><a:ext cx="10058400" cy="914400"/></a:xfrm></p:spPr><p:txBody><a:p><a:r><a:rPr sz="3600" b="1"/><a:t>SmartArt &amp; Media</a:t></a:r></a:p></p:txBody></p:sp><p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="10" name="SmartArt"/></p:nvGraphicFramePr><p:xfrm><a:off x="914400" y="1600200"/><a:ext cx="4572000" cy="2743200"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/diagram"><dgm:relIds r:dm="rId2" r:lo="rId2" r:qs="rId2" r:cs="rId2"/></a:graphicData></a:graphic></p:graphicFrame><p:pic><p:nvPicPr><p:cNvPr id="11" name="Video"/><p:nvPr><a:videoFile r:link="rId3"/></p:nvPr></p:nvPicPr><p:spPr><a:xfrm><a:off x="5943600" y="1600200"/><a:ext cx="4572000" cy="2571750"/></a:xfrm></p:spPr></p:pic><p:pic><p:nvPicPr><p:cNvPr id="12" name="Audio"/><p:nvPr><a:audioFile r:link="rId4"/></p:nvPr></p:nvPicPr><p:spPr><a:xfrm><a:off x="5943600" y="4572000"/><a:ext cx="4572000" cy="685800"/></a:xfrm></p:spPr></p:pic></p:spTree></p:cSld></p:sld>') },
  ]);
  fs.writeFileSync(path.join(out, 'sample-smartart.pptx'), smartart);

  const layoutDoc = await writeZip([
    { name: '[Content_Types].xml', data: xml('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>') },
    {
      name: 'word/document.xml',
      data: xml('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:a="a" xmlns:pic="pic" xmlns:wp="wp"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Chương 1 — Bố cục</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr><w:r><w:t>Mục nhỏ (nhảy bậc H1 → H3)</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr></w:p><w:p><w:r><w:t>Ảnh minh họa bên dưới chưa có alt text:</w:t></w:r></w:p><w:p><w:r><w:drawing><wp:inline><wp:docPr id="1" name="Anh minh hoa"/><a:graphic><a:graphicData><pic:pic><pic:nvPicPr><pic:cNvPr id="1" name="Anh minh hoa"/></pic:nvPicPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Hạng mục</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Giá trị</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>Doanh thu</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>270.000.000</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>'),
    },
  ]);
  fs.writeFileSync(path.join(out, 'sample-layout.docx'), layoutDoc);

  const imageDir = process.env['SAMPLE_IMAGE_DIR'];
  const imageBytes = imageDir
    ? new Uint8Array(fs.readFileSync(path.join(imageDir, 'image1.png')))
    : new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
  const reviewDoc = await writeZip([
    { name: '[Content_Types].xml', data: xml('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/></Types>') },
    { name: 'word/_rels/document.xml.rels', data: xml('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdImg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/></Relationships>') },
    { name: 'word/media/image1.png', data: imageBytes },
    { name: 'word/document.xml', data: xml('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="a" xmlns:pic="pic" xmlns:wp="wp"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Ảnh &amp; Markup</w:t></w:r></w:p><w:p><w:r><w:t>A</w:t></w:r><w:ins w:id="1" w:author="Alice" w:date="2026-11-16T00:00:00Z"><w:r><w:t>B</w:t></w:r></w:ins><w:del w:id="2" w:author="Alice" w:date="2026-11-16T00:00:00Z"><w:r><w:delText>C</w:delText></w:r></w:del><w:r><w:drawing><wp:inline><wp:extent cx="2286000" cy="1143000"/><wp:docPr id="1" name="Logo" descr="Logo ERP"/><a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:embed="rIdImg"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:p><w:r><w:t>Đoạn văn bản thường.</w:t></w:r></w:p><w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>') },
  ]);
  fs.writeFileSync(path.join(out, 'sample-review-image.docx'), reviewDoc);

  const videoDoc = await writeZip([
    { name: '[Content_Types].xml', data: xml('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>') },
    { name: 'word/document.xml', data: xml('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="a" xmlns:wp="wp" xmlns:wp15="wp15"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Video trực tuyến</w:t></w:r></w:p><w:p><w:r><w:t>Xem bản ghi:</w:t></w:r><w:r><w:drawing><wp:inline><wp:extent cx="4572000" cy="2571750"/><wp:docPr id="2" name="Video" descr="Video demo"/><wp15:webVideoPr href="https://youtu.be/demo-webinar" embeddedUrl="https://youtu.be/embed/demo-webinar"/></wp:inline></w:drawing></w:r></w:p><w:p><w:r><w:t>Hết.</w:t></w:r></w:p><w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>') },
  ]);
  fs.writeFileSync(path.join(out, 'sample-online-video.docx'), videoDoc);
  console.log(out);
}

void main();
