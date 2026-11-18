import fs from 'node:fs';
import { writeZip } from '../src/app/core/binary/zip.ts';

const enc = new TextEncoder();
const text = (value: string) => enc.encode(value);
const contentTypes = '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>';
const namespaces = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
  + 'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
  + 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
  + 'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"';

const longText = 'Đoạn văn bản dài dùng để kiểm tra văn bản chảy quanh đối tượng nổi. '
  + 'Nội dung này tiếp tục nhiều dòng để chắc chắn rằng các dòng đầu bị đẩy sang phải bởi hình nổi bên trái. '
  + 'Đây là dòng thứ ba của đoạn văn, vẫn phải nằm cạnh hình. '
  + 'Đây là dòng thứ tư, tiếp tục kiểm tra reflow.';

const wrapXml = `<?xml version="1.0"?><w:document ${namespaces}><w:body>`
  + '<w:p><w:r><w:t>Trước hình nổi</w:t></w:r></w:p>'
  + '<w:p><w:r><w:drawing><wp:anchor relativeHeight="10" behindDoc="0"><wp:simplePos x="0" y="0"/>'
  + '<wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH>'
  + '<wp:positionV relativeFrom="page"><wp:posOffset>952500</wp:posOffset></wp:positionV>'
  + '<wp:extent cx="1905000" cy="1143000"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
  + '<wp:wrapSquare wrapText="bothSides"/><wp:docPr id="21" name="Float"/>'
  + '<a:graphic><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp>'
  + '<wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1905000" cy="1143000"/></a:xfrm>'
  + '<a:prstGeom prst="rect"/><a:solidFill><a:srgbClr val="EAF1FB"/></a:solidFill></wps:spPr>'
  + '<wps:txbx><w:txbxContent><w:p><w:r><w:t>Hình nổi</w:t></w:r></w:p></w:txbxContent></wps:txbx>'
  + '<wps:bodyPr/></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p>'
  + `<w:p><w:r><w:t>${longText}</w:t></w:r></w:p>`
  + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>';

const nestedXml = `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>`
  + '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Level1</w:t></w:r></w:p>'
  + '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Level2</w:t></w:r></w:p>'
  + '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Level3</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'
  + '</w:tc></w:tr></w:tbl></w:tc></w:tr></w:tbl>'
  + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>';

const shape = (text: string, width: number, height: number): string => '<a:graphic><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp>'
  + `<wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${width * 9525}" cy="${height * 9525}"/></a:xfrm>`
  + '<a:prstGeom prst="rect"/><a:solidFill><a:srgbClr val="EAF1FB"/></a:solidFill></wps:spPr>'
  + `<wps:txbx><w:txbxContent><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:txbxContent></wps:txbx>`
  + '<wps:bodyPr/></wps:wsp></a:graphicData></a:graphic>';

const floatRun = (id: number, label: string, x: number, y: number, width: number, height: number, wrap: string, behind = false): string =>
  '<w:r><w:drawing><wp:anchor relativeHeight="10" behindDoc="' + (behind ? '1' : '0') + '">'
  + '<wp:simplePos x="0" y="0"/>'
  + `<wp:positionH relativeFrom="page"><wp:posOffset>${x * 9525}</wp:posOffset></wp:positionH>`
  + `<wp:positionV relativeFrom="page"><wp:posOffset>${y * 9525}</wp:posOffset></wp:positionV>`
  + `<wp:extent cx="${width * 9525}" cy="${height * 9525}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>`
  + `<wp:${wrap}/><wp:docPr id="${id}" name="${label}"/>`
  + shape(label, width, height)
  + '</wp:anchor></w:drawing></w:r>';

const floatPara = (id: number, label: string, x: number, y: number, width: number, height: number, wrap: string, behind = false): string =>
  `<w:p>${floatRun(id, label, x, y, width, height, wrap, behind)}</w:p>`;

const stackingXml = `<?xml version="1.0"?><w:document ${namespaces}><w:body>`
  + '<w:p><w:r><w:t>Trước các đối tượng</w:t></w:r></w:p>'
  + floatPara(31, 'Behind', 40, 100, 120, 60, 'wrapNone', true)
  + '<w:p><w:r><w:t>Đoạn giữa behind và front, nội dung đủ dài để kiểm tra layering.</w:t></w:r></w:p>'
  + floatPara(32, 'Front', 200, 200, 120, 60, 'wrapNone')
  + '<w:p><w:r><w:t>Đoạn sau front, nội dung đủ dài để kiểm tra layering.</w:t></w:r></w:p>'
  + floatPara(33, 'TopBottom', 80, 300, 160, 80, 'wrapTopAndBottom')
  + '<w:p><w:r><w:t>Sau top and bottom, đoạn này phải bắt đầu bên dưới khối TopBottom.</w:t></w:r></w:p>'
  + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>';

const aboveAnchorXml = `<?xml version="1.0"?><w:document ${namespaces}><w:body>`
  + '<w:p><w:r><w:t>Đoạn đầu</w:t></w:r></w:p>'
  + '<w:p><w:r><w:t>Đoạn hai</w:t></w:r></w:p>'
  + '<w:p><w:r><w:t>Đoạn ba</w:t></w:r></w:p>'
  + floatPara(41, 'WrapAbove', 40, 50, 120, 60, 'wrapSquare')
  + `<w:p><w:r><w:t>${longText}</w:t></w:r></w:p>`
  + '<w:p><w:r><w:t>Đoạn trước top and bottom</w:t></w:r></w:p>'
  + '<w:p><w:r><w:t>Đoạn trước top and bottom thêm</w:t></w:r></w:p>'
  + floatPara(42, 'TopAbove', 100, 30, 160, 80, 'wrapTopAndBottom')
  + '<w:p><w:r><w:t>Sau top and bottom phía trên anchor.</w:t></w:r></w:p>'
  + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>';

const multiFloatXml = `<?xml version="1.0"?><w:document ${namespaces}><w:body>`
  + '<w:p><w:r><w:t>Trước nhiều float</w:t></w:r></w:p>'
  + floatPara(51, 'LeftFloat', 0, 100, 100, 50, 'wrapSquare')
  + floatPara(52, 'RightFloat', 400, 300, 100, 50, 'wrapSquare')
  + `<w:p><w:r><w:t>${longText}</w:t></w:r></w:p>`
  + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>';

const crossingXml = `<?xml version="1.0"?><w:document ${namespaces}><w:body>`
  + `<w:p><w:r><w:t>${longText} ${longText} ${longText} ${longText}</w:t></w:r></w:p>`
  + floatPara(61, 'TopInside', 100, 80, 160, 80, 'wrapTopAndBottom')
  + '<w:p><w:r><w:t>Sau top and bottom trong đoạn.</w:t></w:r></w:p>'
  + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>';

const inlineShape = (id: number, label: string, width: number, height: number): string =>
  `<w:r><w:drawing><wp:inline><wp:extent cx="${width * 9525}" cy="${height * 9525}"/>`
  + `<wp:docPr id="${id}" name="${label}"/>`
  + shape(label, width, height)
  + '</wp:inline></w:drawing></w:r>';

const richCrossingXml = `<?xml version="1.0"?><w:document ${namespaces}><w:body>`
  + '<w:p><w:r><w:t>Trước đoạn có hộp.</w:t></w:r></w:p>'
  + `<w:p><w:r><w:t>${longText}</w:t></w:r>`
  + inlineShape(71, 'Hộp trong đoạn', 120, 60)
  + `<w:r><w:t>${longText} ${longText}</w:t></w:r></w:p>`
  + floatPara(72, 'TopRich', 100, 140, 160, 80, 'wrapTopAndBottom')
  + '<w:p><w:r><w:t>Sau top and bottom của đoạn có hộp.</w:t></w:r></w:p>'
  + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>';

const boundaryXml = `<?xml version="1.0"?><w:document ${namespaces}><w:body>`
  + '<w:p><w:r><w:t>Trước boundary</w:t></w:r></w:p>'
  + `<w:p><w:r><w:t>${longText} ${longText}</w:t></w:r>${floatRun(81, 'TopBoundary', 100, 93, 160, 80, 'wrapTopAndBottom')}</w:p>`
  + '<w:p><w:r><w:t>Sau boundary một đoạn.</w:t></w:r></w:p>'
  + '<w:p><w:r><w:t>Đoạn cuối.</w:t></w:r></w:p>'
  + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>';

const pPrChangeXml = `<?xml version="1.0"?><w:document ${namespaces}><w:body>`
  + '<w:p><w:r><w:t>Đoạn bình thường phía trước.</w:t></w:r></w:p>'
  + '<w:p><w:pPr><w:jc w:val="left"/><w:pPrChange w:id="901" w:author="Alice" w:date="2026-11-16T05:00:00Z">'
  + '<w:pPr><w:jc w:val="center"/><w:ind w:left="720"/></w:pPr></w:pPrChange></w:pPr>'
  + '<w:r><w:t>Đoạn có thay đổi định dạng</w:t></w:r></w:p>'
  + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>';

const spellXml = `<?xml version="1.0"?><w:document ${namespaces}><w:body>`
  + '<w:p><w:r><w:t>khong duoc viec  nay ,va recieve goverment</w:t></w:r></w:p>'
  + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>';

const grammarXml = `<?xml version="1.0"?><w:document ${namespaces}><w:body>`
  + '<w:p><w:r><w:t>The report are ready. He go to work every day. This is a apple. We depend of the supplier.</w:t></w:r></w:p>'
  + '<w:p><w:r><w:t>Những cái người này làm việc tốt.</w:t></w:r></w:p>'
  + '<w:p><w:r><w:t>This is more better. He gave advices. We went despite of the rain.</w:t></w:r></w:p>'
  + '<w:p><w:r><w:t>The information are useful.</w:t></w:r></w:p>'
  + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>';

for (const [name, body] of [['wrap-sample.docx', wrapXml], ['nested3.docx', nestedXml], ['stacking-sample.docx', stackingXml], ['above-anchor.docx', aboveAnchorXml], ['multi-float.docx', multiFloatXml], ['crossing-sample.docx', crossingXml], ['crossing-rich.docx', richCrossingXml], ['boundary-sample.docx', boundaryXml], ['pPrChange-sample.docx', pPrChangeXml], ['spell-sample.docx', spellXml], ['grammar-sample.docx', grammarXml]] as const) {
  const bytes = await writeZip([
    { name: '[Content_Types].xml', data: text(contentTypes) },
    { name: 'word/document.xml', data: text(body) },
  ]);
  fs.writeFileSync(`plugins/office-webapp/web/samples/${name}`, bytes);
  const targetDir = 'plugins/office-webapp/src/main/resources/META-INF/resources/samples';
  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(`plugins/office-webapp/web/samples/${name}`, `${targetDir}/${name}`);
  console.log('wrote', name, bytes.length);
}
