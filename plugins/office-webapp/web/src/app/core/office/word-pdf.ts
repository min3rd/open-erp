/** Minimal PDF writer for Word page raster export (no third-party code). */
export interface PdfTextLine {
  text: string;
  x: number;
  y: number;
  size: number;
}

export interface PdfRasterPage {
  jpeg: Uint8Array;
  /** Pixel dimensions of the JPEG. */
  width: number;
  height: number;
  /** PDF page size in points (1/72 inch). */
  pageWidth: number;
  pageHeight: number;
  /** Invisible Unicode text layer positioned over the image. */
  textLines?: PdfTextLine[];
}

const ascii = (value: string): Uint8Array => {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index++) bytes[index] = value.charCodeAt(index) & 0xFF;
  return bytes;
};

const concat = (parts: Uint8Array[]): Uint8Array => {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
};

const pdfNumber = (value: number): string => (Math.round(value * 100) / 100).toString();

/** Builds a valid PDF whose pages each display one JPEG image. */
export function imagesToPdf(pages: PdfRasterPage[]): Uint8Array {
  if (!pages.length) throw new Error('PDF_NO_PAGES');
  const objects: Uint8Array[] = [];
  const offsets: number[] = [];
  const emit = (body: string, stream?: Uint8Array): number => {
    const id = objects.length + 1;
    const head = ascii(`${id} 0 obj\n${body}\n`);
    const tail = ascii('endobj\n');
    if (stream) {
      objects.push(concat([head, ascii('stream\n'), stream, ascii('\nendstream\n'), tail]));
    } else {
      objects.push(concat([head, tail]));
    }
    return id;
  };

  objects.push(new Uint8Array()); // catalog placeholder, object 1
  objects.push(new Uint8Array()); // pages placeholder, object 2
  const cidFontId = emit('<< /Type /Font /Subtype /CIDFontType2 /BaseFont /OpenERPText '
    + '/CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> '
    + `/FontDescriptor ${objects.length + 2} 0 R /DW 1000 /CIDToGIDMap /Identity >>`);
  const descriptorId = emit('<< /Type /FontDescriptor /FontName /OpenERPText /Flags 4 '
    + '/FontBBox [0 -200 1000 900] /ItalicAngle 0 /Ascent 900 /Descent -200 /CapHeight 700 /StemV 80 >>');
  const cmap = '/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n'
    + '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n'
    + '/CMapName /OpenERPText-UCS def\n/CMapType 2 def\n'
    + '1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n'
    + '1 beginbfrange\n<0000> <FFFF> <0000>\nendbfrange\n'
    + 'endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend\n';
  const cmapBytes = ascii(cmap);
  const toUnicodeId = emit(`<< /Length ${cmapBytes.length} >>`, cmapBytes);
  const fontId = emit('<< /Type /Font /Subtype /Type0 /BaseFont /OpenERPText /Encoding /Identity-H '
    + `/DescendantFonts [${cidFontId} 0 R] /ToUnicode ${toUnicodeId} 0 R >>`);
  const utf16Hex = (text: string): string => {
    let hex = '';
    for (const character of text) {
      const code = character.codePointAt(0) ?? 0x3F;
      hex += (code > 0xFFFF ? 0x3F : code).toString(16).padStart(4, '0');
    }
    return hex;
  };
  const pageIds: number[] = [];
  for (const page of pages) {
    const imageId = emit([
      '<< /Type /XObject /Subtype /Image',
      `/Width ${page.width} /Height ${page.height}`,
      '/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode',
      `/Length ${page.jpeg.length} >>`,
    ].join(' '), page.jpeg);
    const textOps = (page.textLines ?? []).filter((line) => line.text.trim()).map((line) =>
      `BT 3 Tr /F1 ${pdfNumber(line.size)} Tf 1 0 0 1 ${pdfNumber(line.x)} ${pdfNumber(line.y)} Tm <${utf16Hex(line.text)}> Tj ET`).join('\n');
    const content = ascii(`q\n${pdfNumber(page.pageWidth)} 0 0 ${pdfNumber(page.pageHeight)} 0 0 cm\n/Im0 Do\nQ\n${textOps}\n`);
    const contentId = emit(`<< /Length ${content.length} >>`, content);
    const pageId = emit([
      '<< /Type /Page',
      `/Parent 2 0 R`,
      `/MediaBox [0 0 ${pdfNumber(page.pageWidth)} ${pdfNumber(page.pageHeight)}]`,
      `/Resources << /XObject << /Im0 ${imageId} 0 R >> /Font << /F1 ${fontId} 0 R >> >>`,
      `/Contents ${contentId} 0 R >>`,
    ].join(' '));
    pageIds.push(pageId);
  }
  objects[0] = ascii('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects[1] = ascii(`2 0 obj\n<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>\nendobj\n`);

  const header = concat([ascii('%PDF-1.4\n'), new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A])]);
  let offset = header.length;
  const body: Uint8Array[] = [header];
  for (let index = 0; index < objects.length; index++) {
    offsets[index] = offset;
    body.push(objects[index]);
    offset += objects[index].length;
  }
  const xrefOffset = offset;
  const xref = [`xref\n0 ${objects.length + 1}`, '0000000000 65535 f '];
  for (const entry of offsets) xref.push(`${String(entry).padStart(10, '0')} 00000 n `);
  body.push(ascii([
    ...xref,
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    'startxref',
    String(xrefOffset),
    '%%EOF',
    '',
  ].join('\n')));
  return concat(body);
}
