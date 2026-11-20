import { parseXml, serializeXml, type XmlNode } from '../binary/xml';
import type { WordBlock, WordCellStyle, WordDocument, WordParagraph, WordRun } from './types';

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const WP_NS = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
const A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const PIC_NS = 'http://schemas.openxmlformats.org/drawingml/2006/picture';
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const CT_NS = 'http://schemas.openxmlformats.org/package/2006/content-types';

const EMU_PER_PX = 9525;
const encoder = new TextEncoder();

/**
 * Materializes a full OOXML `.docx` XML tree + package parts from an in-memory
 * `WordDocument` model (used when opening non-OOXML formats such as `.doc`,
 * `.rtf`, `.odt`, Word 2003 `.xml`, or HTML-as-DOC so editing tools and
 * `saveDocx()` produce valid `.docx` packages readable by Microsoft Word).
 */
export function buildSyntheticWordPackage(doc: WordDocument): { xmlRoot: XmlNode; entries: Map<string, Uint8Array> } {
  const entries = new Map<string, Uint8Array>();
  if (doc.packageEntries) {
    for (const [name, bytes] of doc.packageEntries) {
      if (name.startsWith('word/media/') || name.startsWith('word/header') || name.startsWith('word/footer')) {
        entries.set(name, bytes);
      }
    }
  }

  const rels: Array<{ id: string; type: string; target: string; mode?: string }> = [
    { id: 'rIdStyles', type: `${R_NS}/styles`, target: 'styles.xml' },
    { id: 'rIdNumbering', type: `${R_NS}/numbering`, target: 'numbering.xml' },
  ];
  const mediaRelIds = new Map<string, string>();
  let nextRel = 1;
  const ensureMediaRel = (mediaPath: string): string => {
    const normalized = mediaPath.startsWith('word/') ? mediaPath : `word/${mediaPath.replace(/^\/+/, '')}`;
    const existing = mediaRelIds.get(normalized);
    if (existing) return existing;
    const id = `rIdImg${nextRel++}`;
    mediaRelIds.set(normalized, id);
    rels.push({
      id,
      type: `${R_NS}/image`,
      target: normalized.startsWith('word/') ? normalized.slice('word/'.length) : normalized,
    });
    return id;
  };
  const ensureHyperlinkRel = (url: string): string => {
    const id = `rIdLink${nextRel++}`;
    rels.push({
      id,
      type: `${R_NS}/hyperlink`,
      target: url,
      mode: 'External',
    });
    return id;
  };

  let nextDocPrId = 1;
  const bodyChildren: XmlNode[] = [];
  for (const block of doc.blocks) {
    if (block.kind === 'paragraph') {
      const node = buildParagraphNode(block.paragraph, ensureMediaRel, ensureHyperlinkRel, () => nextDocPrId++);
      block.paragraph.xmlNode = node;
      bodyChildren.push(node);
    } else {
      const node = buildTableNode(block, ensureMediaRel, ensureHyperlinkRel, () => nextDocPrId++);
      block.xmlNode = node;
      bodyChildren.push(node);
    }
  }

  const widthTwips = Math.round(((doc.pageSize?.width ?? 816) / 96) * 1440);
  const heightTwips = Math.round(((doc.pageSize?.height ?? 1056) / 96) * 1440);
  const margins = doc.pageMargins ?? { top: 96, bottom: 96, left: 96, right: 96 };
  const pgSzAttrs: Record<string, string> = {
    'w:w': String(widthTwips),
    'w:h': String(heightTwips),
  };
  if (widthTwips > heightTwips) pgSzAttrs['w:orient'] = 'landscape';

  const sectPr: XmlNode = {
    name: 'w:sectPr',
    attrs: {},
    text: '',
    children: [
      { name: 'w:pgSz', attrs: pgSzAttrs, text: '', children: [] },
      {
        name: 'w:pgMar',
        attrs: {
          'w:top': String(Math.round((margins.top / 96) * 1440)),
          'w:right': String(Math.round((margins.right / 96) * 1440)),
          'w:bottom': String(Math.round((margins.bottom / 96) * 1440)),
          'w:left': String(Math.round((margins.left / 96) * 1440)),
          'w:header': '720',
          'w:footer': '720',
          'w:gutter': '0',
        },
        text: '',
        children: [],
      },
    ],
  };
  bodyChildren.push(sectPr);

  const xmlRoot: XmlNode = {
    name: 'w:document',
    attrs: {
      'xmlns:w': W_NS,
      'xmlns:r': R_NS,
      'xmlns:wp': WP_NS,
      'xmlns:a': A_NS,
      'xmlns:pic': PIC_NS,
    },
    text: '',
    children: [{ name: 'w:body', attrs: {}, text: '', children: bodyChildren }],
  };

  entries.set('word/document.xml', encoder.encode(XML_DECL + serializeXml(xmlRoot)));
  entries.set('word/styles.xml', encoder.encode(defaultStylesXml()));
  entries.set('word/numbering.xml', encoder.encode(defaultNumberingXml()));

  const relsXml = XML_DECL
    + `<Relationships xmlns="${REL_NS}">`
    + rels.map((rel) =>
      `<Relationship Id="${escapeAttr(rel.id)}" Type="${escapeAttr(rel.type)}" Target="${escapeAttr(rel.target)}"${rel.mode ? ` TargetMode="${escapeAttr(rel.mode)}"` : ''}/>`)
      .join('')
    + '</Relationships>';
  entries.set('word/_rels/document.xml.rels', encoder.encode(relsXml));

  entries.set(
    '_rels/.rels',
    encoder.encode(
      `${XML_DECL}<Relationships xmlns="${REL_NS}">`
      + `<Relationship Id="rId1" Type="${R_NS}/officeDocument" Target="word/document.xml"/>`
      + '</Relationships>',
    ),
  );

  entries.set('[Content_Types].xml', encoder.encode(buildContentTypesXml(entries)));

  doc.xmlRoot = xmlRoot;
  doc.packageEntries = entries;
  return { xmlRoot, entries };
}

function buildParagraphNode(
  paragraph: WordParagraph,
  ensureMediaRel: (path: string) => string,
  ensureHyperlinkRel: (url: string) => string,
  nextDocPrId: () => number,
): XmlNode {
  const pPrChildren: XmlNode[] = [];
  if (paragraph.style) {
    pPrChildren.push({ name: 'w:pStyle', attrs: { 'w:val': paragraph.style }, text: '', children: [] });
  } else if (paragraph.headingLevel) {
    pPrChildren.push({ name: 'w:pStyle', attrs: { 'w:val': `Heading${paragraph.headingLevel}` }, text: '', children: [] });
  }
  if (paragraph.pageBreakBefore) {
    pPrChildren.push({ name: 'w:pageBreakBefore', attrs: {}, text: '', children: [] });
  }
  if (paragraph.listType) {
    pPrChildren.push({
      name: 'w:numPr',
      attrs: {},
      text: '',
      children: [
        { name: 'w:ilvl', attrs: { 'w:val': String(Math.max(0, paragraph.listLevel ?? 0)) }, text: '', children: [] },
        { name: 'w:numId', attrs: { 'w:val': paragraph.listType === 'bullet' ? '9001' : '9002' }, text: '', children: [] },
      ],
    });
  }
  if (paragraph.borders || paragraph.borderSides) {
    const sides = paragraph.borderSides;
    pPrChildren.push({
      name: 'w:pBdr',
      attrs: {},
      text: '',
      children: (['top', 'left', 'bottom', 'right'] as const)
        .filter((side) => paragraph.borders || sides?.[side])
        .map((side) => ({
          name: `w:${side}`,
          attrs: { 'w:val': 'single', 'w:sz': '4', 'w:space': '1', 'w:color': '000000' },
          text: '',
          children: [],
        })),
    });
  }
  if (paragraph.shading) {
    pPrChildren.push({
      name: 'w:shd',
      attrs: { 'w:val': 'clear', 'w:color': 'auto', 'w:fill': paragraph.shading.replace('#', '').toUpperCase() },
      text: '',
      children: [],
    });
  }
  if (paragraph.spaceBeforePx !== undefined || paragraph.spaceAfterPx !== undefined || paragraph.lineSpacing !== undefined) {
    const attrs: Record<string, string> = {};
    if (paragraph.spaceBeforePx !== undefined) attrs['w:before'] = String(Math.max(0, Math.round((paragraph.spaceBeforePx * 72 / 96) * 20)));
    if (paragraph.spaceAfterPx !== undefined) attrs['w:after'] = String(Math.max(0, Math.round((paragraph.spaceAfterPx * 72 / 96) * 20)));
    if (paragraph.lineSpacing !== undefined) {
      attrs['w:line'] = String(Math.max(120, Math.round(paragraph.lineSpacing * 240)));
      attrs['w:lineRule'] = 'auto';
    }
    pPrChildren.push({ name: 'w:spacing', attrs, text: '', children: [] });
  }
  if (paragraph.indent || paragraph.indentRight || paragraph.firstLineIndent || paragraph.hangingIndent) {
    const attrs: Record<string, string> = {};
    if (paragraph.indent) attrs['w:left'] = String(Math.round(paragraph.indent));
    if (paragraph.indentRight) attrs['w:right'] = String(Math.round(paragraph.indentRight));
    if (paragraph.firstLineIndent) attrs['w:firstLine'] = String(Math.round(paragraph.firstLineIndent));
    if (paragraph.hangingIndent) attrs['w:hanging'] = String(Math.round(paragraph.hangingIndent));
    pPrChildren.push({ name: 'w:ind', attrs, text: '', children: [] });
  }
  if (paragraph.align) {
    pPrChildren.push({
      name: 'w:jc',
      attrs: { 'w:val': paragraph.align === 'justify' ? 'both' : paragraph.align },
      text: '',
      children: [],
    });
  }

  const children: XmlNode[] = [];
  if (pPrChildren.length) children.push({ name: 'w:pPr', attrs: {}, text: '', children: pPrChildren });
  for (const run of paragraph.runs) {
    children.push(buildRunOrLinkNode(run, ensureMediaRel, ensureHyperlinkRel, nextDocPrId));
  }
  return { name: 'w:p', attrs: {}, text: '', children };
}

function buildRunOrLinkNode(
  run: WordRun,
  ensureMediaRel: (path: string) => string,
  ensureHyperlinkRel: (url: string) => string,
  nextDocPrId: () => number,
): XmlNode {
  const runNode = buildRunNode(run, ensureMediaRel, nextDocPrId);
  if (run.link) {
    if (run.link.startsWith('#')) {
      return {
        name: 'w:hyperlink',
        attrs: { 'w:anchor': run.link.slice(1) },
        text: '',
        children: [runNode],
      };
    }
    const relId = ensureHyperlinkRel(run.link);
    return {
      name: 'w:hyperlink',
      attrs: { 'r:id': relId },
      text: '',
      children: [runNode],
    };
  }
  return runNode;
}

function buildRunNode(
  run: WordRun,
  ensureMediaRel: (path: string) => string,
  nextDocPrId: () => number,
): XmlNode {
  const rPr: XmlNode[] = [];
  if (run.font) {
    rPr.push({
      name: 'w:rFonts',
      attrs: { 'w:ascii': run.font, 'w:hAnsi': run.font, 'w:cs': run.font },
      text: '',
      children: [],
    });
  }
  if (run.bold) rPr.push({ name: 'w:b', attrs: {}, text: '', children: [] });
  if (run.italic) rPr.push({ name: 'w:i', attrs: {}, text: '', children: [] });
  if (run.caps) rPr.push({ name: 'w:caps', attrs: {}, text: '', children: [] });
  if (run.smallCaps) rPr.push({ name: 'w:smallCaps', attrs: {}, text: '', children: [] });
  if (run.strike) rPr.push({ name: 'w:strike', attrs: {}, text: '', children: [] });
  if (run.color && run.color !== 'auto') {
    rPr.push({ name: 'w:color', attrs: { 'w:val': run.color.replace('#', '').toUpperCase() }, text: '', children: [] });
  }
  if (run.sizePt) {
    const half = String(Math.round(run.sizePt * 2));
    rPr.push({ name: 'w:sz', attrs: { 'w:val': half }, text: '', children: [] });
    rPr.push({ name: 'w:szCs', attrs: { 'w:val': half }, text: '', children: [] });
  }
  if (run.highlight && run.highlight !== 'none') {
    rPr.push({ name: 'w:highlight', attrs: { 'w:val': run.highlight }, text: '', children: [] });
  }
  if (run.shading) {
    rPr.push({
      name: 'w:shd',
      attrs: { 'w:val': 'clear', 'w:color': 'auto', 'w:fill': run.shading.replace('#', '').toUpperCase() },
      text: '',
      children: [],
    });
  }
  if (run.underline) {
    rPr.push({ name: 'w:u', attrs: { 'w:val': run.underlineStyle ?? 'single' }, text: '', children: [] });
  }
  if (run.vertAlign) {
    rPr.push({ name: 'w:vertAlign', attrs: { 'w:val': run.vertAlign }, text: '', children: [] });
  }

  const children: XmlNode[] = [];
  if (rPr.length) children.push({ name: 'w:rPr', attrs: {}, text: '', children: rPr });

  if (run.pageBreak) {
    children.push({ name: 'w:br', attrs: { 'w:type': 'page' }, text: '', children: [] });
  } else if (run.imagePath && !run.unsupportedImageFormat) {
    const relId = ensureMediaRel(run.imagePath);
    const cx = String(Math.max(9525, Math.round((run.imageWidth ?? 240) * EMU_PER_PX)));
    const cy = String(Math.max(9525, Math.round((run.imageHeight ?? 160) * EMU_PER_PX)));
    const docId = String(nextDocPrId());
    children.push(buildInlineDrawingNode(relId, docId, cx, cy, run.alt ?? 'Image'));
  } else {
    const value = run.text ?? '';
    const segments = value.split(/(\n|\t)/);
    for (const part of segments) {
      if (!part) continue;
      if (part === '\n') {
        children.push({ name: 'w:br', attrs: {}, text: '', children: [] });
      } else if (part === '\t') {
        children.push({ name: 'w:tab', attrs: {}, text: '', children: [] });
      } else {
        children.push({ name: 'w:t', attrs: { 'xml:space': 'preserve' }, text: part, children: [] });
      }
    }
    if (children.length === (rPr.length ? 1 : 0)) {
      children.push({ name: 'w:t', attrs: { 'xml:space': 'preserve' }, text: '', children: [] });
    }
  }
  return { name: 'w:r', attrs: {}, text: '', children };
}

function buildInlineDrawingNode(relId: string, docId: string, cx: string, cy: string, alt: string): XmlNode {
  return parseXml(
    `<w:drawing>`
    + `<wp:inline distT="0" distB="0" distL="0" distR="0">`
    + `<wp:extent cx="${cx}" cy="${cy}"/>`
    + `<wp:docPr id="${docId}" name="Picture ${docId}" descr="${escapeAttr(alt)}"/>`
    + `<a:graphic>`
    + `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">`
    + `<pic:pic>`
    + `<pic:nvPicPr><pic:cNvPr id="${docId}" name="Picture ${docId}" descr="${escapeAttr(alt)}"/><pic:cNvPicPr/></pic:nvPicPr>`
    + `<pic:blipFill><a:blip r:embed="${escapeAttr(relId)}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>`
    + `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>`
    + `</pic:pic>`
    + `</a:graphicData>`
    + `</a:graphic>`
    + `</wp:inline>`
    + `</w:drawing>`,
  ).children[0];
}

function buildTableNode(
  block: Extract<WordBlock, { kind: 'table' }>,
  ensureMediaRel: (path: string) => string,
  ensureHyperlinkRel: (url: string) => string,
  nextDocPrId: () => number,
): XmlNode {
  const maxCols = Math.max(
    block.colWidthsPx?.length ?? 0,
    block.grid?.length ?? 0,
    ...block.rows.map((row, r) => row.reduce((sum, _c, c) => sum + Math.max(1, block.cellSpans?.[r]?.[c]?.colSpan ?? 1), 0)),
    1,
  );
  const colTwips: number[] = [];
  for (let c = 0; c < maxCols; c++) {
    const px = block.colWidthsPx?.[c];
    if (px && px > 0) colTwips.push(Math.max(240, Math.round(px * 15)));
    else if (block.grid?.[c]) colTwips.push(Math.max(240, Math.round((block.grid[c] / 100) * 9360)));
    else colTwips.push(Math.round(9360 / maxCols));
  }

  const borderVal = block.borderless ? 'nil' : 'single';
  const tblPr: XmlNode = {
    name: 'w:tblPr',
    attrs: {},
    text: '',
    children: [
      { name: 'w:tblW', attrs: { 'w:w': block.widthPct ? String(Math.round(block.widthPct * 50)) : '5000', 'w:type': 'pct' }, text: '', children: [] },
      ...(block.align ? [{ name: 'w:jc', attrs: { 'w:val': block.align }, text: '', children: [] }] : []),
      {
        name: 'w:tblBorders',
        attrs: {},
        text: '',
        children: ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map((edge) => ({
          name: `w:${edge}`,
          attrs: { 'w:val': borderVal, 'w:sz': '4', 'w:space': '0', 'w:color': 'auto' },
          text: '',
          children: [],
        })),
      },
    ],
  };

  const tblGrid: XmlNode = {
    name: 'w:tblGrid',
    attrs: {},
    text: '',
    children: colTwips.map((w) => ({ name: 'w:gridCol', attrs: { 'w:w': String(w) }, text: '', children: [] })),
  };

  const trNodes: XmlNode[] = block.rows.map((row, rowIndex) => {
    const trPrChildren: XmlNode[] = [];
    if (block.headerRows && rowIndex < block.headerRows) {
      trPrChildren.push({ name: 'w:tblHeader', attrs: {}, text: '', children: [] });
    }
    const heightPx = block.rowHeights?.[rowIndex] ?? 0;
    if (heightPx > 0) {
      trPrChildren.push({ name: 'w:trHeight', attrs: { 'w:val': String(Math.round(heightPx * 15)) }, text: '', children: [] });
    }
    let gridCursor = 0;
    const tcNodes: XmlNode[] = row.map((cellParagraphs, cellIndex) => {
      const span = block.cellSpans?.[rowIndex]?.[cellIndex];
      const cellStyle = block.cellStyles?.[rowIndex]?.[cellIndex];
      const colSpan = Math.max(1, span?.colSpan ?? 1);
      let cellTwips = 0;
      for (let offset = 0; offset < colSpan; offset++) {
        cellTwips += colTwips[gridCursor + offset] ?? Math.round(9360 / maxCols);
      }
      gridCursor += colSpan;

      const tcPrChildren: XmlNode[] = [
        { name: 'w:tcW', attrs: { 'w:w': String(cellTwips), 'w:type': 'dxa' }, text: '', children: [] },
      ];
      if (colSpan > 1) {
        tcPrChildren.push({ name: 'w:gridSpan', attrs: { 'w:val': String(colSpan) }, text: '', children: [] });
      }
      if (span?.vMerge) {
        tcPrChildren.push({
          name: 'w:vMerge',
          attrs: span.vMerge === 'restart' ? { 'w:val': 'restart' } : {},
          text: '',
          children: [],
        });
      }
      if (cellStyle?.fill) {
        tcPrChildren.push({
          name: 'w:shd',
          attrs: { 'w:val': 'clear', 'w:color': 'auto', 'w:fill': cellStyle.fill.replace('#', '').toUpperCase() },
          text: '',
          children: [],
        });
      }
      if (cellStyle?.valign) {
        tcPrChildren.push({ name: 'w:vAlign', attrs: { 'w:val': cellStyle.valign }, text: '', children: [] });
      }
      const tcBorders = buildCellBordersNode(cellStyle);
      if (tcBorders) tcPrChildren.push(tcBorders);

      const pNodes = cellParagraphs.length
        ? cellParagraphs.map((paragraph) => buildParagraphNode(paragraph, ensureMediaRel, ensureHyperlinkRel, nextDocPrId))
        : [{ name: 'w:p', attrs: {}, text: '', children: [] }];
      return {
        name: 'w:tc',
        attrs: {},
        text: '',
        children: [{ name: 'w:tcPr', attrs: {}, text: '', children: tcPrChildren }, ...pNodes],
      };
    });

    const trChildren: XmlNode[] = [];
    if (trPrChildren.length) trChildren.push({ name: 'w:trPr', attrs: {}, text: '', children: trPrChildren });
    trChildren.push(...tcNodes);
    return { name: 'w:tr', attrs: {}, text: '', children: trChildren };
  });

  return { name: 'w:tbl', attrs: {}, text: '', children: [tblPr, tblGrid, ...trNodes] };
}

function buildCellBordersNode(style: WordCellStyle | undefined): XmlNode | null {
  if (!style) return null;
  const edges: Array<['top' | 'left' | 'bottom' | 'right', boolean | undefined]> = [
    ['top', style.borderTop],
    ['left', style.borderLeft],
    ['bottom', style.borderBottom],
    ['right', style.borderRight],
  ];
  const defined = edges.filter(([, flag]) => flag !== undefined);
  if (!defined.length) return null;
  const color = (style.borderColor ?? '#000000').replace('#', '').toUpperCase();
  const sz = String(Math.max(4, (style.borderWidthPx ?? 1) * 6));
  return {
    name: 'w:tcBorders',
    attrs: {},
    text: '',
    children: defined.map(([edge, flag]): XmlNode => ({
      name: `w:${edge}`,
      attrs: flag
        ? { 'w:val': 'single', 'w:sz': sz, 'w:space': '0', 'w:color': color }
        : { 'w:val': 'nil' },
      text: '',
      children: [],
    })),
  };
}

function defaultStylesXml(): string {
  return `${XML_DECL}<w:styles xmlns:w="${W_NS}">`
    + `<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault>`
    + `<w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>`
    + `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>`
    + `<w:style w:type="paragraph" w:styleId="NoSpacing"><w:name w:val="No Spacing"/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:style>`
    + `<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="44"/></w:rPr></w:style>`
    + `<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:rPr><w:color w:val="595959"/><w:sz w:val="28"/></w:rPr></w:style>`
    + `<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="2F5496"/><w:sz w:val="32"/></w:rPr></w:style>`
    + `<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="160" w:after="60"/></w:pPr><w:rPr><w:b/><w:color w:val="2F5496"/><w:sz w:val="26"/></w:rPr></w:style>`
    + `<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="120" w:after="40"/></w:pPr><w:rPr><w:b/><w:color w:val="1F3864"/><w:sz w:val="24"/></w:rPr></w:style>`
    + `<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:rPr><w:i/></w:rPr></w:style>`
    + `<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/></w:style>`
    + `<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:basedOn w:val="TableNormal"/></w:style>`
    + `</w:styles>`;
}

function defaultNumberingXml(): string {
  return `${XML_DECL}<w:numbering xmlns:w="${W_NS}">`
    + `<w:abstractNum w:abstractNumId="9001"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>`
    + `<w:abstractNum w:abstractNumId="9002"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>`
    + `<w:num w:numId="9001"><w:abstractNumId w:val="9001"/></w:num>`
    + `<w:num w:numId="9002"><w:abstractNumId w:val="9002"/></w:num>`
    + `</w:numbering>`;
}

function buildContentTypesXml(entries: Map<string, Uint8Array>): string {
  const imageDefaults: Array<[string, string]> = [
    ['png', 'image/png'],
    ['jpg', 'image/jpeg'],
    ['jpeg', 'image/jpeg'],
    ['gif', 'image/gif'],
    ['bmp', 'image/bmp'],
    ['svg', 'image/svg+xml'],
    ['webp', 'image/webp'],
  ];
  const extras = imageDefaults
    .filter(([ext]) => [...entries.keys()].some((name) => name.toLowerCase().endsWith(`.${ext}`)))
    .map(([ext, mime]) => `<Default Extension="${ext}" ContentType="${mime}"/>`)
    .join('');
  return `${XML_DECL}<Types xmlns="${CT_NS}">`
    + `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`
    + `<Default Extension="xml" ContentType="application/xml"/>`
    + extras
    + `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>`
    + `<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>`
    + `<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>`
    + `</Types>`;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
