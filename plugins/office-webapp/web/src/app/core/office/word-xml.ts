import { OfficeBinaryError } from '../binary/magic-bytes';
import { attr, decodeXmlEntities, descendants, findChild, findChildren, parseXml, serializeXml, textOf, type XmlNode } from '../binary/xml';
import { parseDocxEntries } from './docx';
import type { WordBlock, WordCellSpan, WordCellStyle, WordDocument, WordParagraph, WordRun } from './types';
import { buildSyntheticWordPackage } from './word-synthetic';

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const encoder = new TextEncoder();

/**
 * Parses Flat OPC Word XML (`<pkg:package>`) and Word 2003 WordprocessingML
 * (`<w:wordDocument>`). Flat OPC parts are decoded into OOXML ZIP entries and
 * parsed with full fidelity; Word 2003 ML is converted to a `WordDocument` and
 * materialized into a synthetic OOXML package.
 */
export function parseWordXml(buffer: ArrayBuffer | Uint8Array): WordDocument {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const text = new TextDecoder('utf-8').decode(bytes);
  const parsed = parseXml(text);
  const pkgRoot = findChild(parsed, 'pkg:package');
  if (pkgRoot) {
    const entries = new Map<string, Uint8Array>();
    for (const part of findChildren(pkgRoot, 'pkg:part')) {
      const name = attr(part, 'pkg:name')?.replace(/^\/+/, '');
      if (!name) continue;
      const xmlData = findChild(part, 'pkg:xmlData');
      const binData = findChild(part, 'pkg:binaryData');
      if (xmlData && xmlData.children.length > 0) {
        entries.set(name, encoder.encode(XML_DECL + serializeXml(xmlData.children[0])));
      } else if (binData) {
        entries.set(name, base64ToBytes(binData.text));
      }
    }
    const doc = parseDocxEntries(entries, ['OFFICE_LEGACY_FORMAT_READONLY']);
    doc.sourceFormat = 'wordml';
    doc.readOnlyLegacy = true;
    return doc;
  }

  const wordDocRoot = findChild(parsed, 'w:wordDocument');
  if (wordDocRoot) {
    return parseWord2003Xml(wordDocRoot);
  }

  throw new OfficeBinaryError('OFFICE_UNSUPPORTED_EXTENSION', { extension: 'xml' });
}

function parseWord2003Xml(root: XmlNode): WordDocument {
  const stylesMap = new Map<string, { headingLevel?: number; font?: string; sizePt?: number; bold?: boolean; italic?: boolean; align?: WordParagraph['align'] }>();
  const stylesNode = findChild(root, 'w:styles');
  for (const st of findChildren(stylesNode, 'w:style')) {
    const id = attr(st, 'w:styleId');
    if (!id) continue;
    const name = attr(findChild(st, 'w:name'), 'w:val') ?? id;
    const hMatch = /heading\s*([1-6])/i.exec(id) ?? /heading\s*([1-6])/i.exec(name);
    const rPr = findChild(st, 'w:rPr');
    const pPr = findChild(st, 'w:pPr');
    const jc = attr(findChild(pPr, 'w:jc'), 'w:val');
    const sz = Number(attr(findChild(rPr, 'w:sz'), 'w:val') ?? 0);
    stylesMap.set(id, {
      headingLevel: hMatch ? Number(hMatch[1]) : undefined,
      font: attr(findChild(rPr, 'w:rFonts'), 'w:ascii') ?? undefined,
      sizePt: sz > 0 ? sz / 2 : undefined,
      bold: findChild(rPr, 'w:b') ? true : undefined,
      italic: findChild(rPr, 'w:i') ? true : undefined,
      align: jc === 'both' ? 'justify' : jc === 'center' ? 'center' : jc === 'right' ? 'right' : jc === 'left' ? 'left' : undefined,
    });
  }

  const listMap = new Map<string, 'bullet' | 'number'>();
  const listsNode = findChild(root, 'w:lists');
  const listDefKinds = new Map<string, 'bullet' | 'number'>();
  for (const def of findChildren(listsNode, 'w:listDef')) {
    const id = attr(def, 'w:listDefId');
    const nfc = attr(descendants(def, 'w:nfc')[0] ?? null, 'w:val');
    if (id) listDefKinds.set(id, nfc === '23' ? 'bullet' : 'number');
  }
  for (const lst of findChildren(listsNode, 'w:list')) {
    const id = attr(lst, 'w:ilfo');
    const ilt = attr(findChild(lst, 'w:ilst'), 'w:val');
    if (id && ilt) listMap.set(id, listDefKinds.get(ilt) ?? 'bullet');
  }

  const packageEntries = new Map<string, Uint8Array>();
  let mediaIndex = 1;
  const blocks: WordBlock[] = [];
  let pageSize = { width: 816, height: 1056 };
  let pageMargins = { top: 96, bottom: 96, left: 96, right: 96 };

  const parseRun2003 = (rNode: XmlNode, link?: string): WordRun | null => {
    const rPr = findChild(rNode, 'w:rPr');
    const parts: string[] = [];
    let imagePath: string | undefined;
    let imageWidth: number | undefined;
    let imageHeight: number | undefined;
    let pageBreak = false;

    for (const child of rNode.children) {
      if (child.name === 'w:t') parts.push(textOf(child));
      else if (child.name === 'w:tab') parts.push('\t');
      else if (child.name === 'w:br') {
        if (attr(child, 'w:type') === 'page') pageBreak = true;
        else parts.push('\n');
      } else if (child.name === 'w:pict') {
        const bin = findChild(child, 'w:binData');
        if (bin?.text) {
          const binName = attr(bin, 'w:name') ?? '';
          const extMatch = /\.(png|jpe?g|gif|bmp)$/i.exec(binName);
          const ext = extMatch ? extMatch[1].toLowerCase() : 'png';
          const path = `word/media/image${mediaIndex++}.${ext}`;
          packageEntries.set(path, base64ToBytes(bin.text));
          imagePath = path;
          const shape = findChild(child, 'v:shape') ?? findChild(child, 'v:rect') ?? null;
          const styleStr = attr(shape, 'style') ?? '';
          const wM = /width:\s*([\d.]+)(pt|px|in)/i.exec(styleStr);
          const hM = /height:\s*([\d.]+)(pt|px|in)/i.exec(styleStr);
          imageWidth = wM ? (wM[2] === 'pt' ? Math.round(Number(wM[1]) * 96 / 72) : wM[2] === 'in' ? Math.round(Number(wM[1]) * 96) : Math.round(Number(wM[1]))) : 240;
          imageHeight = hM ? (hM[2] === 'pt' ? Math.round(Number(hM[1]) * 96 / 72) : hM[2] === 'in' ? Math.round(Number(hM[1]) * 96) : Math.round(Number(hM[1]))) : 160;
        }
      }
    }
    if (!parts.length && !imagePath && !pageBreak) return null;
    const sz = Number(attr(findChild(rPr, 'w:sz'), 'w:val') ?? 0);
    const colorVal = attr(findChild(rPr, 'w:color'), 'w:val');
    const uVal = attr(findChild(rPr, 'w:u'), 'w:val');
    const vert = attr(findChild(rPr, 'w:vertAlign'), 'w:val');
    return {
      text: parts.join(''),
      bold: findChild(rPr, 'w:b') ? attr(findChild(rPr, 'w:b'), 'w:val') !== 'off' && attr(findChild(rPr, 'w:b'), 'w:val') !== '0' : undefined,
      italic: findChild(rPr, 'w:i') ? attr(findChild(rPr, 'w:i'), 'w:val') !== 'off' && attr(findChild(rPr, 'w:i'), 'w:val') !== '0' : undefined,
      underline: findChild(rPr, 'w:u') ? (uVal !== 'none' && uVal !== 'off' && uVal !== '0') : undefined,
      strike: findChild(rPr, 'w:strike') ? true : undefined,
      color: colorVal && colorVal !== 'auto' ? `#${colorVal.replace(/^#/, '')}` : undefined,
      sizePt: sz > 0 ? sz / 2 : undefined,
      font: attr(findChild(rPr, 'w:rFonts'), 'w:ascii') ?? undefined,
      highlight: attr(findChild(rPr, 'w:highlight'), 'w:val') ?? undefined,
      vertAlign: vert === 'superscript' || vert === 'subscript' ? vert : undefined,
      imagePath,
      imageWidth,
      imageHeight,
      link,
      pageBreak: pageBreak || undefined,
    };
  };

  const parseParagraph2003 = (pNode: XmlNode): WordParagraph => {
    const pPr = findChild(pNode, 'w:pPr');
    const style = attr(findChild(pPr, 'w:pStyle'), 'w:val');
    const stInfo = style ? stylesMap.get(style) : undefined;
    const jc = attr(findChild(pPr, 'w:jc'), 'w:val');
    const align: WordParagraph['align'] =
      jc === 'both' ? 'justify' : jc === 'center' ? 'center' : jc === 'right' ? 'right' : jc === 'left' ? 'left' : stInfo?.align;
    const listIlfo = attr(findChild(findChild(pPr, 'w:listPr'), 'w:ilfo'), 'w:val');
    const listIlvl = Number(attr(findChild(findChild(pPr, 'w:listPr'), 'w:ilvl'), 'w:val') ?? 0);
    const listType = listIlfo ? (listMap.get(listIlfo) ?? 'bullet') : undefined;
    const ind = findChild(pPr, 'w:ind');
    const indent = Number(attr(ind, 'w:left') ?? 0) || undefined;
    const runs: WordRun[] = [];

    const walkInline = (container: XmlNode, link?: string): void => {
      for (const child of container.children) {
        if (child.name === 'w:r') {
          const run = parseRun2003(child, link);
          if (run) runs.push(run);
        } else if (child.name === 'w:hlink') {
          const dest = attr(child, 'w:dest') ?? attr(child, 'w:bookmark');
          walkInline(child, dest);
        }
      }
    };
    walkInline(pNode);
    for (const run of runs) {
      if (run.sizePt === undefined && stInfo?.sizePt) run.sizePt = stInfo.sizePt;
      if (run.font === undefined && stInfo?.font) run.font = stInfo.font;
      if (run.bold === undefined && stInfo?.bold) run.bold = stInfo.bold;
      if (run.italic === undefined && stInfo?.italic) run.italic = stInfo.italic;
    }
    return {
      style,
      headingLevel: stInfo?.headingLevel,
      align,
      indent,
      fontSizePt: stInfo?.sizePt,
      fontFamily: stInfo?.font,
      listType,
      listLevel: listType ? listIlvl : undefined,
      pageBreakBefore: findChild(pPr, 'w:pageBreakBefore') ? true : undefined,
      runs,
    };
  };

  const parseTable2003 = (tblNode: XmlNode): Extract<WordBlock, { kind: 'table' }> => {
    const gridCols = findChildren(findChild(tblNode, 'w:tblGrid'), 'w:gridCol')
      .map((col) => Number(attr(col, 'w:w') ?? 0))
      .filter((w) => w > 0);
    const colWidthsPx = gridCols.length ? gridCols.map((w) => Math.round((w / 15) * 100) / 100) : undefined;
    const rows: WordParagraph[][][] = [];
    const cellStyles: (WordCellStyle | undefined)[][] = [];
    const cellSpans: (WordCellSpan | undefined)[][] = [];
    for (const tr of findChildren(tblNode, 'w:tr')) {
      const rowCells: WordParagraph[][] = [];
      const rowStyle: (WordCellStyle | undefined)[] = [];
      const rowSpan: (WordCellSpan | undefined)[] = [];
      for (const tc of findChildren(tr, 'w:tc')) {
        const tcPr = findChild(tc, 'w:tcPr');
        const colSpan = Number(attr(findChild(tcPr, 'w:gridSpan'), 'w:val') ?? 1);
        const vMerge = findChild(tcPr, 'w:vMerge');
        rowSpan.push(colSpan > 1 || vMerge ? {
          ...(colSpan > 1 ? { colSpan } : {}),
          ...(vMerge ? { vMerge: attr(vMerge, 'w:val') === 'restart' ? 'restart' : 'continue' } : {}),
        } : undefined);
        const fill = attr(findChild(tcPr, 'w:shd'), 'w:fill');
        const valign = attr(findChild(tcPr, 'w:vAlign'), 'w:val');
        rowStyle.push(fill || valign ? {
          fill: fill && fill !== 'auto' ? `#${fill}` : undefined,
          valign: valign === 'center' || valign === 'bottom' ? valign : undefined,
        } : undefined);
        const paragraphs = findChildren(tc, 'w:p').map(parseParagraph2003);
        rowCells.push(paragraphs.length ? paragraphs : [{ runs: [] }]);
      }
      rows.push(rowCells);
      cellStyles.push(rowStyle);
      cellSpans.push(rowSpan);
    }
    return { kind: 'table', rows, colWidthsPx, cellStyles, cellSpans };
  };

  const walkBody = (container: XmlNode): void => {
    for (const child of container.children) {
      if (child.name === 'w:p') blocks.push({ kind: 'paragraph', paragraph: parseParagraph2003(child) });
      else if (child.name === 'w:tbl') blocks.push(parseTable2003(child));
      else if (child.name === 'wx:sect' || child.name === 'wx:sub-section') walkBody(child);
      else if (child.name === 'w:sectPr') {
        const pgSz = findChild(child, 'w:pgSz');
        const pgMar = findChild(child, 'w:pgMar');
        if (pgSz) {
          pageSize = {
            width: Math.round((Number(attr(pgSz, 'w:w') ?? 12240) / 1440) * 96),
            height: Math.round((Number(attr(pgSz, 'w:h') ?? 15840) / 1440) * 96),
          };
        }
        if (pgMar) {
          const px = (v: string | undefined) => v ? Math.round((Number(v) / 1440) * 96) : 96;
          pageMargins = {
            top: px(attr(pgMar, 'w:top')),
            bottom: px(attr(pgMar, 'w:bottom')),
            left: px(attr(pgMar, 'w:left')),
            right: px(attr(pgMar, 'w:right')),
          };
        }
      }
    }
  };
  const body = findChild(root, 'w:body');
  if (body) walkBody(body);
  if (!blocks.length) blocks.push({ kind: 'paragraph', paragraph: { runs: [] } });

  const document: WordDocument = {
    blocks,
    wordCount: countDocumentWords(blocks),
    pageSize,
    pageMargins,
    warnings: ['OFFICE_LEGACY_FORMAT_READONLY'],
    sourceFormat: 'wordml',
    readOnlyLegacy: true,
    packageEntries,
  };
  buildSyntheticWordPackage(document);
  return document;
}

/**
 * Parses HTML or Word-exported MHT ("Single File Web Page" / HTML-with-.doc
 * extension) safely into a `WordDocument` using a pure TypeScript HTML scanner.
 */
export function parseWordHtml(buffer: ArrayBuffer | Uint8Array): WordDocument {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let raw = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);

  const mediaByLocation = new Map<string, Uint8Array>();
  const packageEntries = new Map<string, Uint8Array>();
  let htmlSource = raw;

  if (/^mime-version:/im.test(raw.slice(0, 512))) {
    const extracted = extractMhtParts(raw);
    htmlSource = extracted.html;
    for (const [loc, imgBytes] of extracted.images) mediaByLocation.set(loc, imgBytes);
  }

  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(htmlSource);
  const contentHtml = (bodyMatch ? bodyMatch[1] : htmlSource)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const blocks = parseHtmlFragmentToBlocks(contentHtml, mediaByLocation, packageEntries);
  if (!blocks.length) blocks.push({ kind: 'paragraph', paragraph: { runs: [] } });

  const document: WordDocument = {
    blocks,
    wordCount: countDocumentWords(blocks),
    pageSize: { width: 816, height: 1056 },
    pageMargins: { top: 96, bottom: 96, left: 96, right: 96 },
    warnings: ['OFFICE_LEGACY_FORMAT_READONLY'],
    sourceFormat: 'html',
    readOnlyLegacy: true,
    packageEntries,
  };
  buildSyntheticWordPackage(document);
  return document;
}

function extractMhtParts(raw: string): { html: string; images: Map<string, Uint8Array> } {
  const images = new Map<string, Uint8Array>();
  const boundaryMatch = /boundary="?([^"\r\n;]+)"?/i.exec(raw);
  if (!boundaryMatch) return { html: raw, images };
  const parts = raw.split(`--${boundaryMatch[1]}`);
  let html = '';
  for (const part of parts) {
    const sep = part.search(/\r?\n\r?\n/);
    if (sep < 0) continue;
    const header = part.slice(0, sep);
    const body = part.slice(sep).replace(/^\r?\n\r?\n/, '').trim();
    const typeMatch = /Content-Type:\s*([^\r\n;]+)/i.exec(header);
    const encMatch = /Content-Transfer-Encoding:\s*([^\r\n;]+)/i.exec(header);
    const locMatch = /Content-Location:\s*([^\r\n]+)/i.exec(header);
    const mime = (typeMatch?.[1] ?? '').trim().toLowerCase();
    const encoding = (encMatch?.[1] ?? '').trim().toLowerCase();
    if (mime === 'text/html' && !html) {
      html = encoding === 'quoted-printable'
        ? decodeQuotedPrintable(body)
        : encoding === 'base64'
          ? new TextDecoder('utf-8').decode(base64ToBytes(body))
          : body;
    } else if (mime.startsWith('image/') && locMatch && encoding === 'base64') {
      images.set(locMatch[1].trim(), base64ToBytes(body));
    }
  }
  return { html: html || raw, images };
}

function decodeQuotedPrintable(input: string): string {
  const unfolded = input.replace(/=\r?\n/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < unfolded.length; i++) {
    if (unfolded[i] === '=' && /^[0-9a-fA-F]{2}$/.test(unfolded.slice(i + 1, i + 3))) {
      bytes.push(parseInt(unfolded.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      const encoded = encoder.encode(unfolded[i]);
      for (const b of encoded) bytes.push(b);
    }
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
}

function parseHtmlFragmentToBlocks(
  html: string,
  mediaByLocation: Map<string, Uint8Array>,
  packageEntries: Map<string, Uint8Array>,
): WordBlock[] {
  const blocks: WordBlock[] = [];
  let mediaCounter = 1;

  interface InlineState {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    color?: string;
    sizePt?: number;
    font?: string;
    highlight?: string;
    vertAlign?: 'superscript' | 'subscript';
    link?: string;
  }

  let currentRuns: WordRun[] = [];
  let currentParagraphStyle: Partial<WordParagraph> = {};
  let listStack: Array<'bullet' | 'number'> = [];
  const stateStack: InlineState[] = [{}];

  interface TableCollector {
    rows: WordParagraph[][][];
    currentRow: WordParagraph[][] | null;
    currentCell: WordParagraph[] | null;
    inCell: boolean;
    cellSpans: (WordCellSpan | undefined)[][];
    currentRowSpans: (WordCellSpan | undefined)[];
  }
  let tableCollector: TableCollector | null = null;

  const flushParagraph = (force = false): void => {
    const hasContent = currentRuns.some((r) => r.text.length > 0 || r.imagePath || r.pageBreak);
    if (!hasContent && !force) {
      currentRuns = [];
      currentParagraphStyle = {};
      return;
    }
    const paragraph: WordParagraph = {
      ...currentParagraphStyle,
      runs: currentRuns.length ? currentRuns : [{ text: '' }],
    };
    if (tableCollector?.inCell && tableCollector.currentCell) {
      tableCollector.currentCell.push(paragraph);
    } else {
      blocks.push({ kind: 'paragraph', paragraph });
    }
    currentRuns = [];
    currentParagraphStyle = {};
  };

  const tokenRegex = /(<\/?[a-zA-Z0-9]+(?:\s+[^>]*)?>)|([^<]+)/g;
  for (const match of html.matchAll(tokenRegex)) {
    const tagToken = match[1];
    const textToken = match[2];
    if (textToken !== undefined) {
      const normalized = decodeHtmlEntities(textToken.replace(/[\r\n\t]+/g, ' '));
      if (!normalized.trim() && !currentRuns.length) continue;
      const top = stateStack[stateStack.length - 1];
      currentRuns.push({
        text: normalized,
        bold: top.bold,
        italic: top.italic,
        underline: top.underline,
        strike: top.strike,
        color: top.color,
        sizePt: top.sizePt,
        font: top.font,
        highlight: top.highlight,
        vertAlign: top.vertAlign,
        link: top.link,
      });
      continue;
    }

    const closing = tagToken.startsWith('</');
    const nameMatch = /^<\/?([a-zA-Z0-9]+)/.exec(tagToken);
    if (!nameMatch) continue;
    const tag = nameMatch[1].toLowerCase();
    const selfClosing = tagToken.endsWith('/>') || tag === 'br' || tag === 'img' || tag === 'hr';
    const attrs = parseHtmlAttrs(tagToken);
    const styleMap = parseCssInline(attrs['style'] ?? '');

    if (!closing) {
      if (tag === 'table') {
        flushParagraph();
        tableCollector = { rows: [], currentRow: null, currentCell: null, inCell: false, cellSpans: [], currentRowSpans: [] };
      } else if (tag === 'tr' && tableCollector) {
        flushParagraph();
        tableCollector.currentRow = [];
        tableCollector.currentRowSpans = [];
      } else if ((tag === 'td' || tag === 'th') && tableCollector && tableCollector.currentRow) {
        flushParagraph();
        tableCollector.currentCell = [];
        tableCollector.inCell = true;
        const colSpan = Number(attrs['colspan'] ?? 1);
        tableCollector.currentRowSpans.push(colSpan > 1 ? { colSpan } : undefined);
        stateStack.push({ ...stateStack[stateStack.length - 1], ...(tag === 'th' ? { bold: true } : {}) });
      } else if (tag === 'ul' || tag === 'ol') {
        flushParagraph();
        listStack.push(tag === 'ul' ? 'bullet' : 'number');
      } else if (/^h([1-6])$/.test(tag) || tag === 'p' || tag === 'div' || tag === 'li' || tag === 'blockquote') {
        flushParagraph();
        const headingLevel = /^h([1-6])$/.test(tag) ? Number(tag[1]) : undefined;
        const alignVal = (styleMap['text-align'] ?? attrs['align'] ?? '').toLowerCase();
        const align: WordParagraph['align'] =
          alignVal === 'center' || alignVal === 'right' || alignVal === 'justify' || alignVal === 'left' ? alignVal : undefined;
        currentParagraphStyle = {
          headingLevel,
          style: headingLevel ? `Heading${headingLevel}` : tag === 'blockquote' ? 'Quote' : undefined,
          align,
          listType: tag === 'li' ? (listStack[listStack.length - 1] ?? 'bullet') : undefined,
          listLevel: tag === 'li' ? Math.max(0, listStack.length - 1) : undefined,
        };
        if (headingLevel) {
          const sizes = [22, 18, 15, 13, 12, 11];
          stateStack.push({ ...stateStack[stateStack.length - 1], bold: true, sizePt: sizes[headingLevel - 1] });
        } else {
          stateStack.push({ ...stateStack[stateStack.length - 1] });
        }
      } else if (tag === 'br') {
        currentRuns.push({ text: '\n' });
      } else if (tag === 'img') {
        const src = attrs['src'] ?? '';
        let imgBytes: Uint8Array | undefined;
        let ext = 'png';
        const dataMatch = /^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/i.exec(src);
        if (dataMatch) {
          ext = dataMatch[1].toLowerCase() === 'jpeg' ? 'jpg' : dataMatch[1].toLowerCase().replace('+xml', '');
          imgBytes = base64ToBytes(dataMatch[2]);
        } else if (mediaByLocation.has(src)) {
          imgBytes = mediaByLocation.get(src);
          const m = /\.(png|jpe?g|gif|webp)$/i.exec(src);
          if (m) ext = m[1].toLowerCase();
        }
        if (imgBytes && imgBytes.length > 0) {
          const path = `word/media/image${mediaCounter++}.${ext}`;
          packageEntries.set(path, imgBytes);
          currentRuns.push({
            text: '',
            imagePath: path,
            imageWidth: Number(attrs['width']) || 240,
            imageHeight: Number(attrs['height']) || 160,
            alt: attrs['alt'] ?? undefined,
          });
        }
      } else {
        const prev = stateStack[stateStack.length - 1];
        const next: InlineState = { ...prev };
        if (tag === 'b' || tag === 'strong' || styleMap['font-weight'] === 'bold' || Number(styleMap['font-weight']) >= 600) next.bold = true;
        if (tag === 'i' || tag === 'em' || styleMap['font-style'] === 'italic') next.italic = true;
        if (tag === 'u' || (styleMap['text-decoration'] ?? '').includes('underline')) next.underline = true;
        if (tag === 's' || tag === 'strike' || tag === 'del' || (styleMap['text-decoration'] ?? '').includes('line-through')) next.strike = true;
        if (tag === 'sup') next.vertAlign = 'superscript';
        if (tag === 'sub') next.vertAlign = 'subscript';
        if (tag === 'a' && attrs['href']) next.link = attrs['href'];
        const color = styleMap['color'] ?? attrs['color'];
        if (color && /^#[0-9a-f]{3,6}$/i.test(color)) next.color = color;
        const font = styleMap['font-family'] ?? attrs['face'];
        if (font) next.font = font.split(',')[0].replace(/['"]/g, '').trim();
        const sizeMatch = /^([\d.]+)\s*(pt|px)/i.exec(styleMap['font-size'] ?? '');
        if (sizeMatch) {
          next.sizePt = sizeMatch[2].toLowerCase() === 'px' ? Math.round(Number(sizeMatch[1]) * 0.75) : Number(sizeMatch[1]);
        }
        if (!selfClosing) stateStack.push(next);
      }
    } else {
      if (tag === 'table' && tableCollector) {
        flushParagraph();
        if (tableCollector.rows.length) {
          blocks.push({
            kind: 'table',
            rows: tableCollector.rows,
            cellSpans: tableCollector.cellSpans,
          });
        }
        tableCollector = null;
      } else if (tag === 'tr' && tableCollector?.currentRow) {
        tableCollector.rows.push(tableCollector.currentRow);
        tableCollector.cellSpans.push(tableCollector.currentRowSpans);
        tableCollector.currentRow = null;
      } else if ((tag === 'td' || tag === 'th') && tableCollector?.currentRow && tableCollector.currentCell) {
        flushParagraph(tableCollector.currentCell.length === 0);
        tableCollector.currentRow.push(tableCollector.currentCell.length ? tableCollector.currentCell : [{ runs: [{ text: '' }] }]);
        tableCollector.currentCell = null;
        tableCollector.inCell = false;
        if (stateStack.length > 1) stateStack.pop();
      } else if (tag === 'ul' || tag === 'ol') {
        flushParagraph();
        listStack.pop();
      } else if (/^h([1-6])$/.test(tag) || tag === 'p' || tag === 'div' || tag === 'li' || tag === 'blockquote') {
        flushParagraph();
        if (stateStack.length > 1) stateStack.pop();
      } else {
        if (stateStack.length > 1) stateStack.pop();
      }
    }
  }
  flushParagraph();
  return blocks;
}

function parseHtmlAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const m of tag.matchAll(/([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attrs[m[1].toLowerCase()] = decodeHtmlEntities(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

function parseCssInline(style: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const decl of style.split(';')) {
    const colon = decl.indexOf(':');
    if (colon < 0) continue;
    map[decl.slice(0, colon).trim().toLowerCase()] = decl.slice(colon + 1).trim();
  }
  return map;
}

function decodeHtmlEntities(input: string): string {
  return decodeXmlEntities(input)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&lsquo;/gi, '‘')
    .replace(/&rsquo;/gi, '’')
    .replace(/&ldquo;/gi, '“')
    .replace(/&rdquo;/gi, '”')
    .replace(/&bull;/gi, '•');
}

function base64ToBytes(value: string): Uint8Array {
  const clean = value.replace(/\s+/g, '');
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function countDocumentWords(blocks: WordBlock[]): number {
  const countParagraph = (p: WordParagraph) => {
    const t = p.runs.map((r) => r.text).join(' ').trim();
    return t ? t.split(/\s+/).length : 0;
  };
  return blocks.reduce((sum, block) => {
    if (block.kind === 'paragraph') return sum + countParagraph(block.paragraph);
    return sum + block.rows.reduce((rs, row) => rs + row.reduce((cs, cell) => cs + cell.reduce((ps, p) => ps + countParagraph(p), 0), 0), 0);
  }, 0);
}
