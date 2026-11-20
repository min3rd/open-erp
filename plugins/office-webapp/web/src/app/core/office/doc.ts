import { detectFileKind, OfficeBinaryError } from '../binary/magic-bytes';
import { readOle2 } from '../binary/ole2';
import { parseDocx } from './docx';
import { parseRtf } from './rtf';
import type { WordBlock, WordCellSpan, WordDocument, WordNote, WordParagraph, WordRun } from './types';
import { buildSyntheticWordPackage } from './word-synthetic';
import { parseWordHtml, parseWordXml } from './word-xml';

interface Piece {
  cpStart: number;
  cpEnd: number;
  fcStart: number;
  compressed: boolean;
}

interface PapProps {
  istd: number;
  align?: WordParagraph['align'];
  inTable: boolean;
  fTtp: boolean;
  pageBreakBefore: boolean;
  indent?: number;
  indentRight?: number;
  firstLineIndent?: number;
  spaceBeforePx?: number;
  spaceAfterPx?: number;
  listIlfo?: number;
  listLevel?: number;
  cellEdges?: number[];
}

interface ChpProps {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  caps?: boolean;
  smallCaps?: boolean;
  vertAlign?: 'superscript' | 'subscript';
  color?: string;
  highlight?: string;
  sizePt?: number;
  ftc?: number;
  fcPic?: number;
}

interface SpanRange<T> {
  fcStart: number;
  fcEnd: number;
  props: T;
}

const CP1252_EXTRA: Record<number, number> = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021,
  0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160, 0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018,
  0x92: 0x2019, 0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014, 0x98: 0x02dc,
  0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153, 0x9e: 0x017e, 0x9f: 0x0178,
};

const ICO_COLORS: Record<number, string> = {
  1: '#000000', 2: '#0000FF', 3: '#00FFFF', 4: '#00FF00', 5: '#FF00FF', 6: '#FF0000', 7: '#FFFF00',
  8: '#FFFFFF', 9: '#000080', 10: '#008080', 11: '#008000', 12: '#800080', 13: '#800000',
  14: '#808000', 15: '#808080', 16: '#C0C0C0',
};

const ICO_HIGHLIGHT: Record<number, string> = {
  1: 'black', 2: 'blue', 3: 'cyan', 4: 'green', 5: 'magenta', 6: 'red', 7: 'yellow',
  8: 'white', 9: 'darkBlue', 10: 'darkCyan', 11: 'darkGreen', 12: 'darkMagenta',
  13: 'darkRed', 14: 'darkYellow', 15: 'darkGray', 16: 'lightGray',
};

/**
 * Pure TypeScript reader for Microsoft Word `.doc` files:
 * transparently handles legacy OLE2 Word 97–2003 binary (`[MS-DOC]`) as well
 * as `.doc` files actually saved as RTF, WordprocessingML XML, HTML/MHT, or
 * OOXML ZIP.
 */
export async function parseDoc(buffer: ArrayBuffer | Uint8Array): Promise<WordDocument> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const kind = detectFileKind(bytes);
  if (kind === 'ZIP') {
    const doc = await parseDocx(bytes);
    doc.warnings.push('OFFICE_LEGACY_FORMAT_READONLY');
    return doc;
  }
  if (kind === 'RTF') return parseRtf(bytes);
  if (kind === 'XML') return parseWordXml(bytes);
  if (kind === 'HTML') return parseWordHtml(bytes);
  if (kind !== 'OLE2') {
    throw new OfficeBinaryError('OFFICE_INVALID_MAGIC_BYTES', { extension: 'doc' });
  }
  return parseDocOle2(bytes);
}

function parseDocOle2(bytes: Uint8Array): WordDocument {
  const archive = readOle2(bytes);
  if (archive.readStream('EncryptedPackage')) {
    throw new OfficeBinaryError('OFFICE_ENCRYPTED_FILE_UNSUPPORTED', { extension: 'doc' });
  }
  const wordDoc = archive.readStream('WordDocument');
  if (!wordDoc || wordDoc.byteLength < 68) {
    throw new OfficeBinaryError('OFFICE_OLE2_CORRUPT', { reason: 'missing-worddocument' });
  }

  const fibView = new DataView(wordDoc.buffer, wordDoc.byteOffset, wordDoc.byteLength);
  const nFib = fibView.getUint16(2, true);
  const flags = fibView.getUint16(10, true);
  if ((flags & 0x0100) !== 0) {
    throw new OfficeBinaryError('OFFICE_ENCRYPTED_FILE_UNSUPPORTED', { extension: 'doc' });
  }
  const tableName = (flags & 0x0200) !== 0 ? '1Table' : '0Table';
  const tableStream = archive.readStream(tableName) ?? new Uint8Array(0);
  const dataStream = archive.readStream('Data');

  const fcMin = fibView.getUint32(24, true);
  const fcMac = fibView.getUint32(28, true);

  let cursor = 32;
  const csw = cursor + 2 <= wordDoc.byteLength ? fibView.getUint16(cursor, true) : 0;
  cursor += 2 + csw * 2;
  const cslwOffset = cursor;
  const cslw = cursor + 2 <= wordDoc.byteLength ? fibView.getUint16(cursor, true) : 0;
  const readLw = (idx: number): number =>
    idx < cslw && cslwOffset + 2 + idx * 4 + 4 <= wordDoc.byteLength
      ? fibView.getInt32(cslwOffset + 2 + idx * 4, true)
      : 0;
  const ccpText = Math.max(0, readLw(3));
  const ccpFtn = Math.max(0, readLw(4));
  const ccpHdd = Math.max(0, readLw(5));
  const ccpEdn = Math.max(0, readLw(8));
  cursor += 2 + cslw * 4;

  const cbRgFcLcb = cursor + 2 <= wordDoc.byteLength ? fibView.getUint16(cursor, true) : 0;
  const fcLcbBase = cursor + 2;
  const readFcLcb = (pairIdx: number): { fc: number; lcb: number } => {
    const pos = fcLcbBase + pairIdx * 8;
    if (pairIdx >= cbRgFcLcb || pos + 8 > wordDoc.byteLength) return { fc: 0, lcb: 0 };
    return {
      fc: fibView.getUint32(pos, true),
      lcb: fibView.getUint32(pos + 4, true),
    };
  };

  const warnings = ['OFFICE_LEGACY_FORMAT_READONLY'];
  const stshfLoc = readFcLcb(1);
  const fndTxtLoc = readFcLcb(3);
  const sedLoc = readFcLcb(6);
  const hddLoc = readFcLcb(11);
  const chpxLoc = readFcLcb(12);
  const papxLoc = readFcLcb(13);
  const ffnLoc = readFcLcb(15);
  const clxLoc = readFcLcb(33);
  const endTxtLoc = readFcLcb(47);

  let fullText = '';
  let pieces: Piece[] = [];

  if (nFib >= 193 && clxLoc.lcb > 0 && clxLoc.fc + clxLoc.lcb <= tableStream.byteLength) {
    const parsedPieces = parsePieceTable(tableStream.subarray(clxLoc.fc, clxLoc.fc + clxLoc.lcb), wordDoc);
    pieces = parsedPieces.pieces;
    fullText = parsedPieces.text;
  } else {
    warnings.push('OFFICE_DOC_PARTIAL_RECOVERY');
    const slice = wordDoc.subarray(Math.min(fcMin, wordDoc.byteLength), Math.min(fcMac, wordDoc.byteLength));
    fullText = decodeBestEffortSlice(slice);
    pieces = [{ cpStart: 0, cpEnd: fullText.length, fcStart: fcMin, compressed: true }];
  }

  const fonts = ffnLoc.lcb > 0 && ffnLoc.fc + ffnLoc.lcb <= tableStream.byteLength
    ? parseSttbfFfn(tableStream.subarray(ffnLoc.fc, ffnLoc.fc + ffnLoc.lcb))
    : new Map<number, string>();
  const styleNames = stshfLoc.lcb > 0 && stshfLoc.fc + stshfLoc.lcb <= tableStream.byteLength
    ? parseStshf(tableStream.subarray(stshfLoc.fc, stshfLoc.fc + stshfLoc.lcb))
    : new Map<number, string>();

  const papSpans = papxLoc.lcb > 0 && papxLoc.fc + papxLoc.lcb <= tableStream.byteLength
    ? parsePapFkps(tableStream.subarray(papxLoc.fc, papxLoc.fc + papxLoc.lcb), wordDoc)
    : [];
  const chpSpans = chpxLoc.lcb > 0 && chpxLoc.fc + chpxLoc.lcb <= tableStream.byteLength
    ? parseChpFkps(tableStream.subarray(chpxLoc.fc, chpxLoc.fc + chpxLoc.lcb), wordDoc)
    : [];

  const cpToFc = (cp: number): number => {
    for (const p of pieces) {
      if (cp >= p.cpStart && cp < p.cpEnd) {
        return p.fcStart + (cp - p.cpStart) * (p.compressed ? 1 : 2);
      }
    }
    return -1;
  };

  const findPap = (cp: number): PapProps | undefined => {
    const fc = cpToFc(cp);
    if (fc < 0) return undefined;
    for (const span of papSpans) {
      if (fc >= span.fcStart && fc < span.fcEnd) return span.props;
    }
    return undefined;
  };

  const findChp = (cp: number): ChpProps | undefined => {
    const fc = cpToFc(cp);
    if (fc < 0) return undefined;
    for (const span of chpSpans) {
      if (fc >= span.fcStart && fc < span.fcEnd) return span.props;
    }
    return undefined;
  };

  const packageEntries = new Map<string, Uint8Array>();
  let mediaIndex = 1;
  const picCache = new Map<number, { path: string; width?: number; height?: number } | null>();

  const extractInlinePicture = (fcPic: number): { path: string; width?: number; height?: number } | null => {
    if (picCache.has(fcPic)) return picCache.get(fcPic) ?? null;
    if (!dataStream || fcPic < 0 || fcPic + 68 > dataStream.byteLength) {
      picCache.set(fcPic, null);
      return null;
    }
    const dv = new DataView(dataStream.buffer, dataStream.byteOffset, dataStream.byteLength);
    const lcb = dv.getInt32(fcPic, true);
    if (lcb <= 68 || fcPic + lcb > dataStream.byteLength) {
      picCache.set(fcPic, null);
      return null;
    }
    const dxaGoal = dv.getInt16(fcPic + 28, true);
    const dyaGoal = dv.getInt16(fcPic + 30, true);
    const mx = dv.getUint16(fcPic + 32, true) || 1000;
    const my = dv.getUint16(fcPic + 34, true) || 1000;
    const picSlice = dataStream.subarray(fcPic, fcPic + lcb);
    const extracted = scanImageBytes(picSlice);
    if (!extracted) {
      picCache.set(fcPic, null);
      return null;
    }
    let width = dxaGoal > 0 ? Math.round(((dxaGoal * mx) / 1000 / 1440) * 96) : 0;
    let height = dyaGoal > 0 ? Math.round(((dyaGoal * my) / 1000 / 1440) * 96) : 0;
    if ((!width || !height) && extracted.ext === 'png' && extracted.bytes.byteLength >= 24) {
      const idv = new DataView(extracted.bytes.buffer, extracted.bytes.byteOffset, extracted.bytes.byteLength);
      const iw = idv.getUint32(16, false);
      const ih = idv.getUint32(20, false);
      if (iw > 0 && ih > 0) {
        width = width || iw;
        height = height || ih;
      }
    }
    const path = `word/media/image${mediaIndex++}.${extracted.ext}`;
    packageEntries.set(path, extracted.bytes);
    const meta = {
      path,
      width: width || 240,
      height: height || 160,
    };
    picCache.set(fcPic, meta);
    return meta;
  };

  const bodyEnd = ccpText > 0 ? Math.min(ccpText, fullText.length) : fullText.length;
  const blocks: WordBlock[] = [];
  let pendingTableRows: Array<{ cells: WordParagraph[][]; edges?: number[] }> = [];
  let pendingRowCells: WordParagraph[][] = [];
  let pendingCellParagraphs: WordParagraph[] = [];

  const nearestStop = (stops: number[], val: number): number => {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < stops.length; i++) {
      const dist = Math.abs(stops[i] - val);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  const flushTable = (): void => {
    if (pendingRowCells.length) {
      pendingTableRows.push({ cells: pendingRowCells });
      pendingRowCells = [];
    }
    if (!pendingTableRows.length) return;

    const rawStops: number[] = [];
    for (const r of pendingTableRows) {
      if (r.edges) {
        for (const e of r.edges) rawStops.push(e);
      }
    }
    rawStops.sort((a, b) => a - b);
    const stops: number[] = [];
    for (const s of rawStops) {
      if (!stops.length || s - stops[stops.length - 1] > 30) stops.push(s);
    }

    const colWidthsPx: number[] = [];
    if (stops.length >= 2) {
      for (let i = 1; i < stops.length; i++) {
        const wTwips = Math.max(240, stops[i] - stops[i - 1]);
        colWidthsPx.push(Math.round((wTwips / 1440) * 96 * 100) / 100);
      }
    }
    const gridTotal = colWidthsPx.reduce((s, w) => s + w, 0);
    const grid = colWidthsPx.length && gridTotal > 0
      ? colWidthsPx.map((w) => Math.round((w / gridTotal) * 10000) / 100)
      : undefined;

    const rows: WordParagraph[][][] = [];
    const cellSpans: (WordCellSpan | undefined)[][] = [];
    for (const r of pendingTableRows) {
      rows.push(r.cells);
      const spans: (WordCellSpan | undefined)[] = [];
      if (stops.length >= 2 && r.edges && r.edges.length >= 2) {
        for (let c = 0; c < r.cells.length; c++) {
          if (c + 1 < r.edges.length) {
            const spanCols = Math.max(1, nearestStop(stops, r.edges[c + 1]) - nearestStop(stops, r.edges[c]));
            spans.push(spanCols > 1 ? { colSpan: spanCols } : undefined);
          } else {
            spans.push(undefined);
          }
        }
      }
      cellSpans.push(spans);
    }

    blocks.push({
      kind: 'table',
      rows,
      grid,
      colWidthsPx: colWidthsPx.length ? colWidthsPx : undefined,
      tableWidthPx: colWidthsPx.length ? Math.round(gridTotal * 100) / 100 : undefined,
      cellSpans: cellSpans.some((row) => row.some(Boolean)) ? cellSpans : undefined,
    });
    pendingTableRows = [];
  };

  let pStart = 0;
  for (let cp = 0; cp <= bodyEnd; cp++) {
    const ch = cp < bodyEnd ? fullText[cp] : '\r';
    if (ch !== '\r' && ch !== '\x07' && ch !== '\x0c') continue;

    const pEnd = cp;
    const pap = findPap(cp) ?? findPap(pStart);
    const runs = buildRunsForRange(fullText, pStart, pEnd, findChp, fonts, extractInlinePicture);
    const styleName = pap ? styleNames.get(pap.istd) : undefined;
    const hMatch = styleName ? /heading\s*([1-6])/i.exec(styleName) : null;
    const headingLevel = hMatch ? Number(hMatch[1]) : undefined;
    const paragraph: WordParagraph = {
      style: headingLevel ? `Heading${headingLevel}` : styleName,
      headingLevel,
      align: pap?.align,
      indent: pap?.indent,
      indentRight: pap?.indentRight,
      firstLineIndent: pap?.firstLineIndent,
      spaceBeforePx: pap?.spaceBeforePx,
      spaceAfterPx: pap?.spaceAfterPx,
      pageBreakBefore: pap?.pageBreakBefore || undefined,
      listType: pap?.listIlfo && pap.listIlfo > 0 ? 'bullet' : undefined,
      listLevel: pap?.listIlfo && pap.listIlfo > 0 ? (pap.listLevel ?? 0) : undefined,
      runs: runs.length ? runs : [{ text: '' }],
    };

    if (ch === '\x07') {
      const isRowMark = Boolean(pap?.fTtp) || (pEnd === pStart && pendingRowCells.length > 0 && !pap?.inTable);
      if (isRowMark) {
        if (pendingRowCells.length) {
          pendingTableRows.push({ cells: pendingRowCells, edges: pap?.cellEdges });
          pendingRowCells = [];
        }
        pendingCellParagraphs = [];
      } else {
        pendingCellParagraphs.push(paragraph);
        pendingRowCells.push(pendingCellParagraphs);
        pendingCellParagraphs = [];
      }
    } else if (pap?.inTable) {
      pendingCellParagraphs.push(paragraph);
    } else {
      flushTable();
      if (ch === '\x0c') {
        if (paragraph.runs.some((r) => r.text.length > 0 || r.imagePath)) {
          blocks.push({ kind: 'paragraph', paragraph });
        }
        blocks.push({ kind: 'paragraph', paragraph: { runs: [{ text: '', pageBreak: true }] } });
      } else if (paragraph.runs.some((r) => r.text.length > 0 || r.imagePath) || cp < bodyEnd) {
        blocks.push({ kind: 'paragraph', paragraph });
      }
    }
    pStart = cp + 1;
  }
  flushTable();
  if (!blocks.length) blocks.push({ kind: 'paragraph', paragraph: { runs: [] } });

  const { pageSize, pageMargins } = sedLoc.lcb > 0 && sedLoc.fc + sedLoc.lcb <= tableStream.byteLength
    ? parseFirstSectionGeometry(tableStream.subarray(sedLoc.fc, sedLoc.fc + sedLoc.lcb), wordDoc)
    : { pageSize: { width: 816, height: 1056 }, pageMargins: { top: 96, bottom: 96, left: 96, right: 96 } };

  const footnotes = parseSubstoryNotes('footnote', ccpText, ccpFtn, fullText, fndTxtLoc, tableStream);
  const endnotes = parseSubstoryNotes('endnote', ccpText + ccpFtn + ccpHdd, ccpEdn, fullText, endTxtLoc, tableStream);
  const hdrFtr = parseSubstoryHeaders(ccpText + ccpFtn, ccpHdd, fullText, hddLoc, tableStream);

  const document: WordDocument = {
    blocks,
    wordCount: countWords(blocks),
    pageSize,
    pageMargins,
    warnings,
    sourceFormat: 'doc',
    readOnlyLegacy: true,
    packageEntries,
  };
  if (footnotes.length || endnotes.length) {
    document.notes = {
      footnotes,
      endnotes,
      footnoteFormat: 'decimal',
      endnoteFormat: 'lowerRoman',
      footnoteRestart: 'continuous',
      endnoteRestart: 'continuous',
      roots: { footnote: null, endnote: null },
    };
  }
  if (hdrFtr.header || hdrFtr.footer) {
    document.sections = [{
      index: 0,
      node: { name: 'w:sectPr', attrs: {}, text: '', children: [] },
      headers: hdrFtr.header ? [{
        kind: 'header', type: 'default', path: 'word/header1.xml',
        xmlRoot: { name: 'w:hdr', attrs: {}, text: '', children: [] },
        text: hdrFtr.header, hasPageNumber: false,
      }] : [],
      footers: hdrFtr.footer ? [{
        kind: 'footer', type: 'default', path: 'word/footer1.xml',
        xmlRoot: { name: 'w:ftr', attrs: {}, text: '', children: [] },
        text: hdrFtr.footer, hasPageNumber: false,
      }] : [],
      titlePg: false,
      pageNumberFormat: 'decimal',
      columns: 1,
      columnSpace: 720,
      pageWidth: Math.round((pageSize.width / 96) * 1440),
      pageHeight: Math.round((pageSize.height / 96) * 1440),
      orientation: pageSize.width > pageSize.height ? 'landscape' : 'portrait',
      margins: {
        top: Math.round((pageMargins.top / 96) * 1440),
        right: Math.round((pageMargins.right / 96) * 1440),
        bottom: Math.round((pageMargins.bottom / 96) * 1440),
        left: Math.round((pageMargins.left / 96) * 1440),
      },
    }];
  }
  buildSyntheticWordPackage(document);
  return document;
}

function buildRunsForRange(
  fullText: string,
  start: number,
  end: number,
  findChp: (cp: number) => ChpProps | undefined,
  fonts: Map<number, string>,
  extractPic: (fcPic: number) => { path: string; width?: number; height?: number } | null,
): WordRun[] {
  const runs: WordRun[] = [];
  let fieldMode: 'none' | 'instr' | 'result' = 'none';
  let instrText = '';
  let linkUrl: string | undefined;

  for (let cp = start; cp < end; cp++) {
    const ch = fullText[cp];
    if (ch === '\x13') {
      fieldMode = 'instr';
      instrText = '';
      linkUrl = undefined;
      continue;
    }
    if (ch === '\x14') {
      fieldMode = 'result';
      const hm = /HYPERLINK\s+(?:"([^"]+)"|(\S+))/i.exec(instrText);
      if (hm) linkUrl = hm[1] ?? hm[2];
      continue;
    }
    if (ch === '\x15') {
      fieldMode = 'none';
      instrText = '';
      linkUrl = undefined;
      continue;
    }
    if (fieldMode === 'instr') {
      instrText += ch;
      continue;
    }
    if (ch === '\x01') {
      const chp = findChp(cp);
      if (chp?.fcPic !== undefined) {
        const pic = extractPic(chp.fcPic);
        if (pic) runs.push({ text: '', imagePath: pic.path, imageWidth: pic.width, imageHeight: pic.height });
      }
      continue;
    }
    if (ch === '\x02' || ch === '\x05' || ch === '\x08' || ch === '\x0f' || ch === '\x0e') continue;
    const displayChar = ch === '\x0b' ? '\n' : ch;
    const chp = findChp(cp);
    const font = chp?.ftc !== undefined ? fonts.get(chp.ftc) : undefined;
    const prev = runs[runs.length - 1];
    if (prev && !prev.imagePath
      && prev.bold === chp?.bold && prev.italic === chp?.italic
      && prev.underline === chp?.underline && prev.strike === chp?.strike
      && prev.caps === chp?.caps && prev.smallCaps === chp?.smallCaps
      && prev.vertAlign === chp?.vertAlign && prev.color === chp?.color
      && prev.highlight === chp?.highlight && prev.sizePt === chp?.sizePt
      && prev.font === font && prev.link === linkUrl) {
      prev.text += displayChar;
    } else {
      runs.push({
        text: displayChar,
        bold: chp?.bold,
        italic: chp?.italic,
        underline: chp?.underline,
        strike: chp?.strike,
        caps: chp?.caps,
        smallCaps: chp?.smallCaps,
        vertAlign: chp?.vertAlign,
        color: chp?.color,
        highlight: chp?.highlight,
        sizePt: chp?.sizePt,
        font,
        link: linkUrl,
      });
    }
  }
  return runs;
}

function parsePieceTable(clx: Uint8Array, wordDoc: Uint8Array): { pieces: Piece[]; text: string } {
  let offset = 0;
  const view = new DataView(clx.buffer, clx.byteOffset, clx.byteLength);
  while (offset < clx.byteLength && clx[offset] === 0x01) {
    if (offset + 3 > clx.byteLength) break;
    const cb = view.getUint16(offset + 1, true);
    offset += 3 + cb;
  }
  if (offset + 5 > clx.byteLength || clx[offset] !== 0x02) {
    return { pieces: [], text: '' };
  }
  const plcSize = view.getUint32(offset + 1, true);
  const plcStart = offset + 5;
  const available = Math.min(plcSize, clx.byteLength - plcStart);
  const n = Math.floor((available - 4) / 12);
  if (n <= 0) return { pieces: [], text: '' };

  const plcView = new DataView(clx.buffer, clx.byteOffset + plcStart, available);
  const pieces: Piece[] = [];
  const chunks: string[] = [];

  for (let idx = 0; idx < n; idx++) {
    const cpStart = plcView.getInt32(idx * 4, true);
    const cpEnd = plcView.getInt32((idx + 1) * 4, true);
    const charCount = Math.max(0, cpEnd - cpStart);
    const pcdOffset = (n + 1) * 4 + idx * 8;
    const fcRaw = plcView.getUint32(pcdOffset + 2, true);
    const compressed = (fcRaw & 0x40000000) !== 0;
    const fcStart = compressed ? Math.floor((fcRaw & 0x3fffffff) / 2) : (fcRaw & 0x3fffffff);
    pieces.push({ cpStart, cpEnd, fcStart, compressed });

    if (charCount === 0 || fcStart >= wordDoc.byteLength) continue;
    if (compressed) {
      const endByte = Math.min(wordDoc.byteLength, fcStart + charCount);
      let s = '';
      for (let b = fcStart; b < endByte; b++) {
        const code = wordDoc[b];
        s += String.fromCharCode(CP1252_EXTRA[code] ?? code);
      }
      chunks.push(s);
    } else {
      const endByte = Math.min(wordDoc.byteLength, fcStart + charCount * 2);
      let s = '';
      for (let b = fcStart; b + 1 < endByte; b += 2) {
        s += String.fromCharCode(wordDoc[b] | (wordDoc[b + 1] << 8));
      }
      chunks.push(s);
    }
  }
  return { pieces, text: chunks.join('') };
}

function decodeBestEffortSlice(slice: Uint8Array): string {
  let zeroHigh = 0;
  for (let i = 1; i < slice.byteLength; i += 2) {
    if (slice[i] === 0) zeroHigh++;
  }
  if (slice.byteLength >= 4 && zeroHigh > slice.byteLength / 4) {
    let out = '';
    for (let i = 0; i + 1 < slice.byteLength; i += 2) {
      out += String.fromCharCode(slice[i] | (slice[i + 1] << 8));
    }
    return out;
  }
  let out = '';
  for (let i = 0; i < slice.byteLength; i++) {
    const c = slice[i];
    out += String.fromCharCode(CP1252_EXTRA[c] ?? c);
  }
  return out;
}

function parseSttbfFfn(buf: Uint8Array): Map<number, string> {
  const fonts = new Map<number, string>();
  if (buf.byteLength < 6) return fonts;
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const extended = view.getUint16(0, true) === 0xffff;
  const count = view.getUint16(extended ? 2 : 0, true);
  let pos = extended ? 6 : 4;
  for (let idx = 0; idx < count && pos < buf.byteLength; idx++) {
    const cbFfnM1 = buf[pos];
    const recLen = cbFfnM1 + 1;
    if (pos + recLen > buf.byteLength) break;
    if (recLen > 42) {
      let name = '';
      for (let off = pos + 40; off + 1 < pos + recLen; off += 2) {
        const code = buf[off] | (buf[off + 1] << 8);
        if (code === 0) break;
        name += String.fromCharCode(code);
      }
      if (name.trim()) fonts.set(idx, name.trim());
    }
    pos += recLen;
  }
  return fonts;
}

function parseStshf(buf: Uint8Array): Map<number, string> {
  const names = new Map<number, string>();
  if (buf.byteLength < 10) return names;
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const cbStshi = view.getUint16(0, true);
  if (2 + cbStshi > buf.byteLength) return names;
  const cstd = view.getUint16(2, true);
  const cbStdBase = view.getUint16(4, true);
  let pos = 2 + cbStshi;
  for (let istd = 0; istd < cstd && pos + 2 <= buf.byteLength; istd++) {
    const cbStd = view.getUint16(pos, true);
    pos += 2;
    if (cbStd > 0 && pos + cbStd <= buf.byteLength && cbStd > cbStdBase + 2) {
      const nameOff = pos + cbStdBase;
      const cch = view.getUint16(nameOff, true);
      let name = '';
      for (let c = 0; c < cch && nameOff + 2 + c * 2 + 1 < pos + cbStd; c++) {
        const code = view.getUint16(nameOff + 2 + c * 2, true);
        if (code === 0) break;
        name += String.fromCharCode(code);
      }
      if (name.trim()) names.set(istd, name.trim());
    }
    pos += cbStd;
  }
  return names;
}

function parsePapFkps(plcBte: Uint8Array, wordDoc: Uint8Array): Array<SpanRange<PapProps>> {
  const result: Array<SpanRange<PapProps>> = [];
  const pns = readBtePns(plcBte);
  for (const pn of pns) {
    const base = pn * 512;
    if (base + 512 > wordDoc.byteLength) continue;
    const fkp = wordDoc.subarray(base, base + 512);
    const dv = new DataView(wordDoc.buffer, wordDoc.byteOffset + base, 512);
    const crun = fkp[511];
    if (crun === 0 || (crun + 1) * 4 + crun * 13 > 511) continue;
    for (let i = 0; i < crun; i++) {
      const fcStart = dv.getUint32(i * 4, true);
      const fcEnd = dv.getUint32((i + 1) * 4, true);
      const bxOffset = (crun + 1) * 4 + i * 13;
      const bWord = fkp[bxOffset];
      const props: PapProps = { istd: 0, inTable: false, fTtp: false, pageBreakBefore: false };
      if (bWord > 0 && bWord * 2 + 2 < 512) {
        let p = bWord * 2;
        let cb = fkp[p] * 2;
        if (cb === 0 && p + 1 < 512) {
          p++;
          cb = fkp[p] * 2;
        } else if (cb > 0) {
          cb -= 1;
        }
        const startSprm = p + 1;
        const endSprm = Math.min(511, startSprm + cb);
        if (startSprm + 2 <= endSprm) {
          props.istd = fkp[startSprm] | (fkp[startSprm + 1] << 8);
          applyPapSprms(fkp.subarray(startSprm + 2, endSprm), props);
        }
      }
      result.push({ fcStart, fcEnd, props });
    }
  }
  return result;
}

function parseChpFkps(plcBte: Uint8Array, wordDoc: Uint8Array): Array<SpanRange<ChpProps>> {
  const result: Array<SpanRange<ChpProps>> = [];
  const pns = readBtePns(plcBte);
  for (const pn of pns) {
    const base = pn * 512;
    if (base + 512 > wordDoc.byteLength) continue;
    const fkp = wordDoc.subarray(base, base + 512);
    const dv = new DataView(wordDoc.buffer, wordDoc.byteOffset + base, 512);
    const crun = fkp[511];
    if (crun === 0 || (crun + 1) * 4 + crun > 511) continue;
    for (let i = 0; i < crun; i++) {
      const fcStart = dv.getUint32(i * 4, true);
      const fcEnd = dv.getUint32((i + 1) * 4, true);
      const bWord = fkp[(crun + 1) * 4 + i];
      const props: ChpProps = {};
      if (bWord > 0 && bWord * 2 + 1 < 512) {
        const p = bWord * 2;
        const cb = fkp[p];
        const endSprm = Math.min(511, p + 1 + cb);
        applyChpSprms(fkp.subarray(p + 1, endSprm), props);
      }
      result.push({ fcStart, fcEnd, props });
    }
  }
  return result;
}

function readBtePns(plc: Uint8Array): number[] {
  const n = Math.floor((plc.byteLength - 4) / 8);
  if (n <= 0) return [];
  const dv = new DataView(plc.buffer, plc.byteOffset, plc.byteLength);
  const pns: number[] = [];
  for (let i = 0; i < n; i++) {
    pns.push(dv.getUint32((n + 1) * 4 + i * 4, true) & 0x003fffff);
  }
  return pns;
}

function sprmOperandLength(sprm: number, buf: Uint8Array, opPos: number): number {
  const spra = (sprm >> 13) & 0x7;
  if (spra === 0 || spra === 1) return 1;
  if (spra === 2 || spra === 4 || spra === 5) return 2;
  if (spra === 3) return 4;
  if (spra === 7) return 3;
  if (sprm === 0xd608) {
    if (opPos + 2 > buf.byteLength) return buf.byteLength - opPos;
    return (buf[opPos] | (buf[opPos + 1] << 8)) + 1;
  }
  return opPos < buf.byteLength ? 1 + buf[opPos] : 0;
}

function applyPapSprms(buf: Uint8Array, props: PapProps): void {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let pos = 0;
  while (pos + 2 <= buf.byteLength) {
    const sprm = dv.getUint16(pos, true);
    const opPos = pos + 2;
    const opLen = sprmOperandLength(sprm, buf, opPos);
    if (opPos + opLen > buf.byteLength) break;
    switch (sprm) {
      case 0x2403: case 0x2461: {
        const jc = buf[opPos];
        props.align = jc === 1 ? 'center' : jc === 2 ? 'right' : jc === 3 ? 'justify' : 'left';
        break;
      }
      case 0x2407: props.pageBreakBefore = buf[opPos] !== 0; break;
      case 0x2416: props.inTable = buf[opPos] !== 0; break;
      case 0x2417: props.fTtp = buf[opPos] !== 0; break;
      case 0x840f: case 0x845e: props.indent = dv.getInt16(opPos, true); break;
      case 0x840e: case 0x845d: props.indentRight = dv.getInt16(opPos, true); break;
      case 0x8411: case 0x8460: props.firstLineIndent = dv.getInt16(opPos, true); break;
      case 0xa413: props.spaceBeforePx = Math.round((dv.getUint16(opPos, true) / 20) * (96 / 72) * 100) / 100; break;
      case 0xa414: props.spaceAfterPx = Math.round((dv.getUint16(opPos, true) / 20) * (96 / 72) * 100) / 100; break;
      case 0x460b: props.listIlfo = dv.getUint16(opPos, true); break;
      case 0x260a: props.listLevel = buf[opPos]; break;
      case 0xd608: {
        if (opLen >= 3) {
          const itcMac = buf[opPos + 2];
          if (itcMac > 0 && opPos + 3 + (itcMac + 1) * 2 <= opPos + opLen) {
            const edges: number[] = [];
            for (let c = 0; c <= itcMac; c++) {
              edges.push(dv.getInt16(opPos + 3 + c * 2, true));
            }
            props.cellEdges = edges;
          }
        }
        break;
      }
    }
    pos = opPos + opLen;
  }
}

function applyChpSprms(buf: Uint8Array, props: ChpProps): void {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let pos = 0;
  while (pos + 2 <= buf.byteLength) {
    const sprm = dv.getUint16(pos, true);
    const opPos = pos + 2;
    const opLen = sprmOperandLength(sprm, buf, opPos);
    if (opPos + opLen > buf.byteLength) break;
    switch (sprm) {
      case 0x0835: props.bold = buf[opPos] !== 0 && buf[opPos] !== 0x80; break;
      case 0x0836: props.italic = buf[opPos] !== 0 && buf[opPos] !== 0x80; break;
      case 0x0837: props.strike = buf[opPos] !== 0 && buf[opPos] !== 0x80; break;
      case 0x083a: props.smallCaps = buf[opPos] !== 0 && buf[opPos] !== 0x80; break;
      case 0x083b: props.caps = buf[opPos] !== 0 && buf[opPos] !== 0x80; break;
      case 0x2a3e: props.underline = buf[opPos] !== 0; break;
      case 0x4a43: props.sizePt = dv.getUint16(opPos, true) / 2; break;
      case 0x2a48: {
        const iss = buf[opPos];
        props.vertAlign = iss === 1 ? 'superscript' : iss === 2 ? 'subscript' : undefined;
        break;
      }
      case 0x2a42: props.color = ICO_COLORS[buf[opPos]] ?? props.color; break;
      case 0x6870: {
        const hex = (b: number) => b.toString(16).padStart(2, '0').toUpperCase();
        props.color = `#${hex(buf[opPos])}${hex(buf[opPos + 1])}${hex(buf[opPos + 2])}`;
        break;
      }
      case 0x2a0c: props.highlight = ICO_HIGHLIGHT[buf[opPos]]; break;
      case 0x4a4f: props.ftc = dv.getUint16(opPos, true); break;
      case 0x6a03: props.fcPic = dv.getInt32(opPos, true); break;
    }
    pos = opPos + opLen;
  }
}

function scanImageBytes(slice: Uint8Array): { ext: 'png' | 'jpg'; bytes: Uint8Array } | null {
  // Look for PNG header 89 50 4E 47 0D 0A 1A 0A
  for (let i = 0; i + 16 < slice.byteLength; i++) {
    if (slice[i] === 0x89 && slice[i + 1] === 0x50 && slice[i + 2] === 0x4e && slice[i + 3] === 0x47
      && slice[i + 4] === 0x0d && slice[i + 5] === 0x0a && slice[i + 6] === 0x1a && slice[i + 7] === 0x0a) {
      for (let j = i + 8; j + 12 <= slice.byteLength; j++) {
        if (slice[j + 4] === 0x49 && slice[j + 5] === 0x45 && slice[j + 6] === 0x4e && slice[j + 7] === 0x44) {
          return { ext: 'png', bytes: slice.slice(i, j + 12) };
        }
      }
      return { ext: 'png', bytes: slice.slice(i) };
    }
    if (slice[i] === 0xff && slice[i + 1] === 0xd8 && slice[i + 2] === 0xff) {
      return { ext: 'jpg', bytes: slice.slice(i) };
    }
  }
  return null;
}

function parseFirstSectionGeometry(
  plcfsed: Uint8Array,
  wordDoc: Uint8Array,
): { pageSize: { width: number; height: number }; pageMargins: { top: number; bottom: number; left: number; right: number } } {
  let xaPage = 12240;
  let yaPage = 15840;
  let dxaLeft = 1440;
  let dxaRight = 1440;
  let dyaTop = 1440;
  let dyaBottom = 1440;
  let landscape = false;

  const n = Math.floor((plcfsed.byteLength - 4) / 16);
  if (n >= 1) {
    const dv = new DataView(plcfsed.buffer, plcfsed.byteOffset, plcfsed.byteLength);
    const fcSepx = dv.getInt32((n + 1) * 4 + 2, true);
    if (fcSepx > 0 && fcSepx + 2 < wordDoc.byteLength) {
      const wdv = new DataView(wordDoc.buffer, wordDoc.byteOffset, wordDoc.byteLength);
      const cb = wdv.getUint16(fcSepx, true);
      const grpprl = wordDoc.subarray(fcSepx + 2, Math.min(wordDoc.byteLength, fcSepx + 2 + cb));
      const gdv = new DataView(grpprl.buffer, grpprl.byteOffset, grpprl.byteLength);
      let pos = 0;
      while (pos + 2 <= grpprl.byteLength) {
        const sprm = gdv.getUint16(pos, true);
        const opPos = pos + 2;
        const opLen = sprmOperandLength(sprm, grpprl, opPos);
        if (opPos + opLen > grpprl.byteLength) break;
        if (sprm === 0xb01f) xaPage = gdv.getUint16(opPos, true);
        else if (sprm === 0xb020) yaPage = gdv.getUint16(opPos, true);
        else if (sprm === 0xb021) dxaLeft = gdv.getUint16(opPos, true);
        else if (sprm === 0xb022) dxaRight = gdv.getUint16(opPos, true);
        else if (sprm === 0x9023) dyaTop = gdv.getUint16(opPos, true);
        else if (sprm === 0x9024) dyaBottom = gdv.getUint16(opPos, true);
        else if (sprm === 0x301d) landscape = grpprl[opPos] === 2;
        pos = opPos + opLen;
      }
    }
  }
  const toPx = (twips: number) => Math.round((twips / 1440) * 96);
  const w = landscape && xaPage < yaPage ? yaPage : xaPage;
  const h = landscape && xaPage < yaPage ? xaPage : yaPage;
  return {
    pageSize: { width: toPx(w), height: toPx(h) },
    pageMargins: { top: toPx(dyaTop), bottom: toPx(dyaBottom), left: toPx(dxaLeft), right: toPx(dxaRight) },
  };
}

function parseSubstoryNotes(
  kind: 'footnote' | 'endnote',
  baseCp: number,
  ccpCount: number,
  fullText: string,
  txtLoc: { fc: number; lcb: number },
  tableStream: Uint8Array,
): WordNote[] {
  if (ccpCount <= 0 || txtLoc.lcb < 8 || txtLoc.fc + txtLoc.lcb > tableStream.byteLength) return [];
  const plc = tableStream.subarray(txtLoc.fc, txtLoc.fc + txtLoc.lcb);
  const dv = new DataView(plc.buffer, plc.byteOffset, plc.byteLength);
  const count = Math.floor(txtLoc.lcb / 4) - 1;
  const notes: WordNote[] = [];
  for (let i = 0; i < count - 1; i++) {
    const s = dv.getInt32(i * 4, true);
    const e = dv.getInt32((i + 1) * 4, true);
    const raw = fullText.slice(baseCp + s, baseCp + e).replace(/[\x00-\x1f]/g, ' ').trim();
    if (raw) notes.push({ id: i + 1, kind, text: raw, refParagraph: -1, numbering: notes.length + 1 });
  }
  return notes;
}

function parseSubstoryHeaders(
  baseCp: number,
  ccpHdd: number,
  fullText: string,
  hddLoc: { fc: number; lcb: number },
  tableStream: Uint8Array,
): { header?: string; footer?: string } {
  if (ccpHdd <= 0 || hddLoc.lcb < 8 || hddLoc.fc + hddLoc.lcb > tableStream.byteLength) return {};
  const plc = tableStream.subarray(hddLoc.fc, hddLoc.fc + hddLoc.lcb);
  const dv = new DataView(plc.buffer, plc.byteOffset, plc.byteLength);
  const count = Math.floor(hddLoc.lcb / 4) - 1;
  const sliceAt = (idx: number): string => {
    if (idx + 1 >= count) return '';
    const s = dv.getInt32(idx * 4, true);
    const e = dv.getInt32((idx + 1) * 4, true);
    if (e <= s) return '';
    return fullText.slice(baseCp + s, baseCp + e).replace(/[\x00-\x1f]/g, ' ').trim();
  };
  // In PlcfHdd, story 7 = odd header, story 8 = even footer, story 9 = odd footer
  const header = sliceAt(7) || sliceAt(6) || undefined;
  const footer = sliceAt(9) || sliceAt(8) || undefined;
  return { header, footer };
}

function countWords(blocks: WordBlock[]): number {
  const countP = (p: WordParagraph) => {
    const t = p.runs.map((r) => r.text).join(' ').trim();
    return t ? t.split(/\s+/).length : 0;
  };
  return blocks.reduce((sum, b) => {
    if (b.kind === 'paragraph') return sum + countP(b.paragraph);
    return sum + b.rows.reduce((rs, r) => rs + r.reduce((cs, c) => cs + c.reduce((ps, p) => ps + countP(p), 0), 0), 0);
  }, 0);
}
