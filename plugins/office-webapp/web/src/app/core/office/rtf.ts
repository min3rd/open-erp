import type { WordBlock, WordCellSpan, WordCellStyle, WordDocument, WordParagraph, WordRun } from './types';
import { buildSyntheticWordPackage } from './word-synthetic';

interface RtfGroupState {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  caps?: boolean;
  smallCaps?: boolean;
  vertAlign?: 'superscript' | 'subscript';
  fontIndex: number;
  sizePt?: number;
  colorIndex: number;
  highlightIndex: number;
  uc: number;
  dest: string;
  skip: boolean;
}

interface RtfParagraphProps {
  align?: WordParagraph['align'];
  indent?: number;
  indentRight?: number;
  firstLineIndent?: number;
  spaceBeforePx?: number;
  spaceAfterPx?: number;
  lineSpacing?: number;
  pageBreakBefore?: boolean;
  headingLevel?: number;
  style?: string;
  listType?: 'bullet' | 'number';
  inTable: boolean;
}

interface RtfCellDef {
  rightTwips: number;
  fill?: string;
  hMerge?: 'first' | 'cont';
  vMerge?: 'restart' | 'continue';
  borderTop?: boolean;
  borderBottom?: boolean;
  borderLeft?: boolean;
  borderRight?: boolean;
}

interface RtfTableRow {
  cells: WordParagraph[][];
  defs: RtfCellDef[];
  heightPx?: number;
}

const CP1252_EXTRA: Record<number, number> = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021,
  0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160, 0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018,
  0x92: 0x2019, 0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014, 0x98: 0x02dc,
  0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153, 0x9e: 0x017e, 0x9f: 0x0178,
};

const RTF_HIGHLIGHT_MAP: Record<number, string> = {
  1: 'black', 2: 'blue', 3: 'cyan', 4: 'green', 5: 'magenta', 6: 'red', 7: 'yellow',
  8: 'white', 9: 'darkBlue', 10: 'darkCyan', 11: 'darkGreen', 12: 'darkMagenta',
  13: 'darkRed', 14: 'darkYellow', 15: 'darkGray', 16: 'lightGray',
};

const IGNORED_DESTINATIONS = new Set([
  'fonttbl', 'colortbl', 'stylesheet', 'info', 'userprops', 'propname', 'staticval', 'linkval',
  'listtable', 'listoverridetable', 'revtbl', 'rsidtbl', 'mmathPr', 'generator', 'xmlnstbl',
  'datastore', 'themedata', 'colorschememapping', 'latentstyles', 'nonshppict', 'object', 'objdata',
  'datafield', 'header', 'headerl', 'headerr', 'headerf', 'footer', 'footerl', 'footerr', 'footerf',
  'footnote', 'ftnsep', 'ftnsepc', 'aftnsep', 'aftnsepc', 'xe', 'tc', 'rxe', 'bkmkstart', 'bkmkend',
  'listtext', 'pntext', 'fldinst', 'shprslt',
]);

/**
 * Pure TypeScript RTF (`{\rtf1 ...}`) parser supporting font/color tables,
 * Unicode (`\uN`), codepages (1252/1258), headings, lists, merged/shaded tables,
 * inline PNG/JPEG pictures, hyperlinks, headers/footers, and footnotes.
 */
export function parseRtf(buffer: ArrayBuffer | Uint8Array): WordDocument {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const src = new TextDecoder('latin1').decode(bytes);
  if (!src.trimStart().startsWith('{\\rtf')) {
    throw new Error('OFFICE_DOCX_PARSE_FAILED');
  }

  let paperW = 12240;
  let paperH = 15840;
  let margL = 1440;
  let margR = 1440;
  let margT = 1440;
  let margB = 1440;
  let landscape = false;
  let codePage = 1252;

  const fonts = new Map<number, string>();
  const fontCharsets = new Map<number, number>();
  const colors: Array<string | undefined> = [];
  const styleHeadings = new Map<number, number>();
  const packageEntries = new Map<string, Uint8Array>();
  const warnings = ['OFFICE_LEGACY_FORMAT_READONLY'];

  const blocks: WordBlock[] = [];
  let mediaIndex = 1;

  // Sub-collectors for fonttbl, colortbl, stylesheet, pict, field, header/footer, footnote
  let curFontId = 0;
  let curFontText = '';
  let colorR = -1;
  let colorG = -1;
  let colorB = -1;
  let curStyleId = -1;
  let curStyleText = '';

  let pictKind: 'png' | 'jpg' | 'wmf' | 'emf' | null = null;
  let pictHex = '';
  let pictWTwips = 0;
  let pictHTwips = 0;
  let pictScaleX = 100;
  let pictScaleY = 100;

  let activeFieldLink: string | undefined;
  let fieldInstrBuf = '';
  let inFieldDepth = -1;

  let headerText = '';
  let headerAltText = '';
  let footerText = '';
  let footerAltText = '';
  let footnoteBuf = '';
  const footnotes: Array<{ id: number; text: string; refParagraph: number }> = [];

  let pProps: RtfParagraphProps = { inTable: false };
  let currentRuns: WordRun[] = [];
  let currentRowDefs: RtfCellDef[] = [];
  let currentCellDef: Partial<RtfCellDef> = {};
  let currentRowCells: WordParagraph[][] = [];
  let currentCellParagraphs: WordParagraph[] = [];
  let currentRowHeightPx: number | undefined;
  let pendingTableRows: RtfTableRow[] = [];

  const stack: RtfGroupState[] = [{
    fontIndex: 0,
    colorIndex: 0,
    highlightIndex: 0,
    uc: 1,
    dest: 'body',
    skip: false,
  }];
  const top = () => stack[stack.length - 1];

  const nearestStop = (stops: number[], val: number): number => {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let k = 0; k < stops.length; k++) {
      const d = Math.abs(stops[k] - val);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = k;
      }
    }
    return bestIdx;
  };

  const flushTable = (): void => {
    if (!pendingTableRows.length) return;
    const maxCols = Math.max(...pendingTableRows.map((r) => Math.max(r.cells.length, r.defs.length)), 1);
    const rawRights: number[] = [];
    for (const r of pendingTableRows) {
      for (const def of r.defs) rawRights.push(def.rightTwips);
    }
    rawRights.sort((a, b) => a - b);
    const mergedRights: number[] = [];
    for (const r of rawRights) {
      if (!mergedRights.length || r - mergedRights[mergedRights.length - 1] > 30) mergedRights.push(r);
    }
    const stops: number[] = mergedRights.length
      ? (mergedRights[0] > 30 ? [0, ...mergedRights] : mergedRights)
      : [];
    const colWidthsPx: number[] = [];
    if (stops.length >= 2) {
      for (let k = 1; k < stops.length; k++) {
        const w = Math.max(240, stops[k] - stops[k - 1]);
        colWidthsPx.push(Math.round((w / 15) * 100) / 100);
      }
    }
    const gridTotal = colWidthsPx.reduce((s, w) => s + w, 0);
    const grid = colWidthsPx.length && gridTotal > 0
      ? colWidthsPx.map((w) => Math.round((w / gridTotal) * 10000) / 100)
      : undefined;

    const rows: WordParagraph[][][] = [];
    const cellStyles: (WordCellStyle | undefined)[][] = [];
    const cellSpans: (WordCellSpan | undefined)[][] = [];
    const rowHeights: number[] = [];

    for (const r of pendingTableRows) {
      const normalizedCells: WordParagraph[][] = [];
      const rowStyle: (WordCellStyle | undefined)[] = [];
      const rowSpan: (WordCellSpan | undefined)[] = [];
      let rowPrevRight = stops[0] ?? 0;
      let prevCellStartIdx = 0;
      for (let c = 0; c < r.cells.length; c++) {
        const def = r.defs[c];
        if (def?.hMerge === 'cont') {
          const prevSpan = rowSpan[rowSpan.length - 1] ?? {};
          const stopSpan = stops.length >= 2 ? Math.max(1, nearestStop(stops, def.rightTwips) - prevCellStartIdx) : 1;
          prevSpan.colSpan = Math.max((prevSpan.colSpan ?? 1) + 1, stopSpan);
          rowSpan[rowSpan.length - 1] = prevSpan;
          rowPrevRight = def.rightTwips;
          continue;
        }
        normalizedCells.push(r.cells[c]);
        let spanCols = 1;
        if (def && stops.length >= 2) {
          const startIdx = nearestStop(stops, rowPrevRight);
          const endIdx = nearestStop(stops, def.rightTwips);
          spanCols = Math.max(1, endIdx - startIdx);
          prevCellStartIdx = startIdx;
          rowPrevRight = def.rightTwips;
        }
        const spanObj: WordCellSpan | undefined = (spanCols > 1 || def?.vMerge)
          ? {
              ...(spanCols > 1 ? { colSpan: spanCols } : {}),
              ...(def?.vMerge ? { vMerge: def.vMerge } : {}),
            }
          : undefined;
        rowSpan.push(spanObj);
        const st: WordCellStyle = {};
        if (def?.fill) st.fill = def.fill;
        if (def?.borderTop !== undefined) st.borderTop = def.borderTop;
        if (def?.borderBottom !== undefined) st.borderBottom = def.borderBottom;
        if (def?.borderLeft !== undefined) st.borderLeft = def.borderLeft;
        if (def?.borderRight !== undefined) st.borderRight = def.borderRight;
        rowStyle.push(Object.keys(st).length ? st : undefined);
      }
      while (normalizedCells.length < 1 && maxCols > 0) normalizedCells.push([{ runs: [{ text: '' }] }]);
      rows.push(normalizedCells);
      cellStyles.push(rowStyle);
      cellSpans.push(rowSpan);
      rowHeights.push(r.heightPx ?? 0);
    }

    blocks.push({
      kind: 'table',
      rows,
      grid,
      colWidthsPx: colWidthsPx.length ? colWidthsPx : undefined,
      tableWidthPx: colWidthsPx.length ? Math.round(colWidthsPx.reduce((s, w) => s + w, 0) * 100) / 100 : undefined,
      rowHeights: rowHeights.some((h) => h > 0) ? rowHeights : undefined,
      cellStyles,
      cellSpans,
    });
    pendingTableRows = [];
  };

  const makeParagraph = (): WordParagraph => ({
    style: pProps.style,
    headingLevel: pProps.headingLevel,
    align: pProps.align,
    indent: pProps.indent,
    indentRight: pProps.indentRight,
    firstLineIndent: pProps.firstLineIndent,
    spaceBeforePx: pProps.spaceBeforePx,
    spaceAfterPx: pProps.spaceAfterPx,
    lineSpacing: pProps.lineSpacing,
    pageBreakBefore: pProps.pageBreakBefore || undefined,
    listType: pProps.listType,
    runs: currentRuns.length
      ? currentRuns.map((run) => (run.text ? { ...run, text: run.text.normalize('NFC') } : run))
      : [{ text: '' }],
  });

  const commitParagraph = (force = false): void => {
    const hasContent = currentRuns.some((r) => r.text.length > 0 || r.imagePath || r.pageBreak || r.noteRef);
    if (pProps.inTable) {
      currentCellParagraphs.push(makeParagraph());
      currentRuns = [];
      return;
    }
    flushTable();
    if (hasContent || force) {
      blocks.push({ kind: 'paragraph', paragraph: makeParagraph() });
    }
    currentRuns = [];
  };

  const appendText = (value: string): void => {
    if (!value) return;
    const state = top();
    if (state.dest === 'fonttbl') {
      curFontText += value;
      if (curFontText.includes(';')) {
        const clean = curFontText.split(';')[0].trim();
        if (clean && !fonts.has(curFontId)) fonts.set(curFontId, clean);
        curFontText = '';
      }
      return;
    }
    if (state.dest === 'colortbl') {
      for (const ch of value) {
        if (ch === ';') {
          if (colorR >= 0 && colorG >= 0 && colorB >= 0) {
            colors.push(`#${hex2(colorR)}${hex2(colorG)}${hex2(colorB)}`);
          } else {
            colors.push(undefined);
          }
          colorR = -1; colorG = -1; colorB = -1;
        }
      }
      return;
    }
    if (state.dest === 'stylesheet') {
      curStyleText += value;
      if (curStyleText.includes(';') && curStyleId >= 0) {
        const m = /heading\s*([1-6])/i.exec(curStyleText);
        if (m) styleHeadings.set(curStyleId, Number(m[1]));
        curStyleId = -1;
        curStyleText = '';
      }
      return;
    }
    if (state.dest === 'pict') {
      pictHex += value.replace(/[^0-9a-fA-F]/g, '');
      return;
    }
    if (state.dest === 'fldinst') {
      fieldInstrBuf += value;
      return;
    }
    if (state.dest === 'header') {
      headerText += value;
      return;
    }
    if (state.dest === 'headerf' || state.dest === 'headerr' || state.dest === 'headerl') {
      headerAltText += value;
      return;
    }
    if (state.dest === 'footer') {
      footerText += value;
      return;
    }
    if (state.dest === 'footerf' || state.dest === 'footerr' || state.dest === 'footerl') {
      footerAltText += value;
      return;
    }
    if (state.dest === 'footnote') {
      footnoteBuf += value;
      return;
    }
    if (state.skip && state.dest !== 'body' && state.dest !== 'fldrslt') return;

    const font = fonts.get(state.fontIndex);
    const color = state.colorIndex > 0 ? colors[state.colorIndex] : undefined;
    const highlight = state.highlightIndex > 0 ? RTF_HIGHLIGHT_MAP[state.highlightIndex] : undefined;
    const prev = currentRuns[currentRuns.length - 1];
    if (prev && !prev.imagePath && !prev.pageBreak && !prev.noteRef
      && prev.bold === state.bold && prev.italic === state.italic
      && prev.underline === state.underline && prev.strike === state.strike
      && prev.caps === state.caps && prev.smallCaps === state.smallCaps
      && prev.vertAlign === state.vertAlign && prev.font === font
      && prev.sizePt === state.sizePt && prev.color === color
      && prev.highlight === highlight && prev.link === activeFieldLink) {
      prev.text += value;
    } else {
      currentRuns.push({
        text: value,
        bold: state.bold,
        italic: state.italic,
        underline: state.underline,
        strike: state.strike,
        caps: state.caps,
        smallCaps: state.smallCaps,
        vertAlign: state.vertAlign,
        font,
        sizePt: state.sizePt,
        color,
        highlight,
        link: activeFieldLink,
      });
    }
  };

  let i = 0;
  let skipAnsi = 0;
  const len = src.length;
  while (i < len) {
    const ch = src[i];
    if (ch === '{') {
      const parent = top();
      stack.push({ ...parent });
      i++;
      continue;
    }
    if (ch === '}') {
      const popped = stack.pop();
      const parentState = stack[stack.length - 1];
      if (popped?.dest === 'pict' && parentState?.dest !== 'pict' && pictHex.length > 0 && pictKind) {
        const imgBytes = hexToBytes(pictHex);
        if (pictKind === 'png' || pictKind === 'jpg') {
          const path = `word/media/image${mediaIndex++}.${pictKind}`;
          packageEntries.set(path, imgBytes);
          const wPx = pictWTwips > 0 ? Math.round(((pictWTwips * pictScaleX) / 100 / 1440) * 96) : 240;
          const hPx = pictHTwips > 0 ? Math.round(((pictHTwips * pictScaleY) / 100 / 1440) * 96) : 160;
          currentRuns.push({ text: '', imagePath: path, imageWidth: wPx, imageHeight: hPx });
        } else {
          if (!warnings.includes('OFFICE_VECTOR_IMAGE_UNSUPPORTED')) warnings.push('OFFICE_VECTOR_IMAGE_UNSUPPORTED');
          currentRuns.push({
            text: '',
            imagePath: `word/media/image${mediaIndex++}.${pictKind}`,
            unsupportedImageFormat: pictKind.toUpperCase(),
          });
        }
        pictKind = null;
        pictHex = '';
      }
      if (popped?.dest === 'fldinst' && parentState?.dest !== 'fldinst') {
        const linkMatch = /HYPERLINK\s+(?:"([^"]+)"|(\S+))/i.exec(fieldInstrBuf);
        if (linkMatch) activeFieldLink = linkMatch[1] ?? linkMatch[2];
        fieldInstrBuf = '';
      }
      if (popped?.dest === 'footnote' && parentState?.dest !== 'footnote' && footnoteBuf.trim()) {
        const id = footnotes.length + 1;
        footnotes.push({ id, text: footnoteBuf.trim().normalize('NFC'), refParagraph: blocks.length });
        currentRuns.push({ text: '', noteRef: { kind: 'footnote', id, label: String(id) } });
        footnoteBuf = '';
      }
      if (inFieldDepth >= 0 && stack.length <= inFieldDepth) {
        activeFieldLink = undefined;
        inFieldDepth = -1;
      }
      i++;
      continue;
    }
    if (ch === '\r' || ch === '\n') {
      i++;
      continue;
    }
    if (ch === '\\') {
      i++;
      if (i >= len) break;
      const next = src[i];
      if (next === '*' && stack.length > 1) {
        // Ignorable group marker; skip unknown destinations unless opted back in (\shppict/\fldinst).
        top().skip = true;
        top().dest = 'ignorable';
        i++;
        continue;
      }
      if (next === '\\' || next === '{' || next === '}') {
        if (skipAnsi > 0) skipAnsi--;
        else appendText(next);
        i++;
        continue;
      }
      if (next === '~') {
        if (skipAnsi > 0) skipAnsi--;
        else appendText('\u00A0');
        i++;
        continue;
      }
      if (next === '_' || next === '-') {
        if (skipAnsi > 0) skipAnsi--;
        else appendText(next === '_' ? '\u2011' : '\u00AD');
        i++;
        continue;
      }
      if (next === '\'') {
        const hex = src.slice(i + 1, i + 3);
        const byte = /^[0-9a-fA-F]{2}$/.test(hex) ? parseInt(hex, 16) : -1;
        if (byte >= 0) {
          if (skipAnsi > 0) {
            skipAnsi--;
          } else {
            const effectiveCp = fontCharsets.get(top().fontIndex) ?? codePage;
            appendText(decodeRtfByte(byte, effectiveCp));
          }
          i += 3;
          continue;
        }
      }
      if (next === '\r' || next === '\n') {
        commitParagraph(true);
        i++;
        continue;
      }

      const wordMatch = /^([a-zA-Z]+)(-?\d+)? ?/.exec(src.slice(i));
      if (!wordMatch) {
        i++;
        continue;
      }
      const ctrl = wordMatch[1];
      const param = wordMatch[2] !== undefined ? Number(wordMatch[2]) : undefined;
      i += wordMatch[0].length;

      if (ctrl === 'u' && param !== undefined) {
        const code = param < 0 ? param + 65536 : param;
        appendText(String.fromCharCode(code));
        skipAnsi = top().uc;
        continue;
      }
      if (ctrl === 'uc' && param !== undefined) {
        top().uc = Math.max(0, param);
        continue;
      }

      // Check destination controls
      if (ctrl === 'fldinst') {
        if (top().dest === 'body' || top().dest === 'fldrslt') {
          top().dest = 'fldinst';
          top().skip = false;
          fieldInstrBuf = '';
        } else {
          top().dest = 'ignorable';
          top().skip = true;
        }
        continue;
      }
      if (ctrl === 'fldrslt') {
        if (top().dest === 'body' || top().dest === 'fldrslt') {
          top().dest = 'fldrslt';
          top().skip = false;
        }
        continue;
      }
      if (ctrl === 'field') {
        inFieldDepth = stack.length - 1;
        continue;
      }
      if (ctrl === 'shppict') {
        if (top().dest === 'body' || top().dest === 'ignorable' || top().dest === 'fldrslt') {
          top().dest = 'body';
          top().skip = false;
        }
        continue;
      }
      if (ctrl === 'pict') {
        if (top().dest === 'nonshppict' || top().dest === 'ignorable') {
          top().dest = 'ignorable';
          top().skip = true;
          continue;
        }
        top().dest = 'pict';
        top().skip = false;
        pictKind = null;
        pictHex = '';
        pictWTwips = 0;
        pictHTwips = 0;
        pictScaleX = 100;
        pictScaleY = 100;
        continue;
      }
      if (IGNORED_DESTINATIONS.has(ctrl)) {
        top().dest = ctrl;
        top().skip = true;
        if (ctrl === 'footnote') footnoteBuf = '';
        continue;
      }

      const st = top();
      if (st.dest === 'fonttbl') {
        if (ctrl === 'f' && param !== undefined) { curFontId = param; curFontText = ''; }
        else if (ctrl === 'fcharset' && param !== undefined) {
          const mappedCp = charsetToCodePage(param);
          if (mappedCp) fontCharsets.set(curFontId, mappedCp);
        } else if (ctrl === 'cpg' && param !== undefined) {
          fontCharsets.set(curFontId, param);
        }
        continue;
      }
      if (st.dest === 'colortbl') {
        if (ctrl === 'red' && param !== undefined) colorR = param;
        else if (ctrl === 'green' && param !== undefined) colorG = param;
        else if (ctrl === 'blue' && param !== undefined) colorB = param;
        continue;
      }
      if (st.dest === 'stylesheet') {
        if (ctrl === 's' && param !== undefined) { curStyleId = param; curStyleText = ''; }
        continue;
      }
      if (st.dest === 'pict') {
        if (ctrl === 'pngblip') pictKind = 'png';
        else if (ctrl === 'jpegblip') pictKind = 'jpg';
        else if (ctrl === 'wmetafile') pictKind = 'wmf';
        else if (ctrl === 'emfblip') pictKind = 'emf';
        else if (ctrl === 'picwgoal' && param !== undefined) pictWTwips = param;
        else if (ctrl === 'pichgoal' && param !== undefined) pictHTwips = param;
        else if (ctrl === 'picscalex' && param !== undefined) pictScaleX = param;
        else if (ctrl === 'picscaley' && param !== undefined) pictScaleY = param;
        continue;
      }
      if (st.skip && st.dest !== 'body' && st.dest !== 'fldrslt') {
        if ((st.dest === 'footnote' || st.dest.startsWith('header') || st.dest.startsWith('footer')) && ctrl === 'f' && param !== undefined) {
          st.fontIndex = param;
        }
        continue;
      }

      switch (ctrl) {
        case 'ansicpg': if (param) codePage = param; break;
        case 'paperw': if (param) paperW = param; break;
        case 'paperh': if (param) paperH = param; break;
        case 'margl': if (param !== undefined) margL = param; break;
        case 'margr': if (param !== undefined) margR = param; break;
        case 'margt': if (param !== undefined) margT = param; break;
        case 'margb': if (param !== undefined) margB = param; break;
        case 'landscape': landscape = true; break;
        case 'plain':
          st.bold = undefined; st.italic = undefined; st.underline = undefined; st.strike = undefined;
          st.caps = undefined; st.smallCaps = undefined; st.vertAlign = undefined;
          st.sizePt = undefined; st.colorIndex = 0; st.highlightIndex = 0;
          break;
        case 'b': st.bold = param !== 0; break;
        case 'i': st.italic = param !== 0; break;
        case 'ul': case 'uldb': case 'uld': case 'ulwave': st.underline = param !== 0; break;
        case 'ulnone': st.underline = false; break;
        case 'strike': case 'striked': st.strike = param !== 0; break;
        case 'caps': st.caps = param !== 0; break;
        case 'scaps': st.smallCaps = param !== 0; break;
        case 'super': st.vertAlign = 'superscript'; break;
        case 'sub': st.vertAlign = 'subscript'; break;
        case 'nosupersub': st.vertAlign = undefined; break;
        case 'f': if (param !== undefined) st.fontIndex = param; break;
        case 'fs': if (param !== undefined) st.sizePt = param / 2; break;
        case 'cf': if (param !== undefined) st.colorIndex = param; break;
        case 'highlight': case 'cb': if (param !== undefined) st.highlightIndex = param; break;
        case 'pard':
          pProps = { inTable: false };
          break;
        case 'intbl':
          pProps.inTable = true;
          break;
        case 'ql': pProps.align = 'left'; break;
        case 'qc': pProps.align = 'center'; break;
        case 'qr': pProps.align = 'right'; break;
        case 'qj': pProps.align = 'justify'; break;
        case 'li': if (param !== undefined) pProps.indent = param; break;
        case 'ri': if (param !== undefined) pProps.indentRight = param; break;
        case 'fi': if (param !== undefined) pProps.firstLineIndent = param; break;
        case 'sb': if (param !== undefined) pProps.spaceBeforePx = Math.round((param / 20) * (96 / 72) * 100) / 100; break;
        case 'sa': if (param !== undefined) pProps.spaceAfterPx = Math.round((param / 20) * (96 / 72) * 100) / 100; break;
        case 'sl': if (param !== undefined && param > 0) pProps.lineSpacing = Math.round((param / 240) * 100) / 100; break;
        case 'pagebb': pProps.pageBreakBefore = true; break;
        case 's':
          if (param !== undefined && styleHeadings.has(param)) {
            const lvl = styleHeadings.get(param)!;
            pProps.headingLevel = lvl;
            pProps.style = `Heading${lvl}`;
          }
          break;
        case 'ls': pProps.listType = 'bullet'; break;
        case 'pn': pProps.listType = 'bullet'; break;
        case 'par': commitParagraph(true); break;
        case 'line': appendText('\n'); break;
        case 'tab': appendText('\t'); break;
        case 'page':
          commitParagraph(false);
          blocks.push({ kind: 'paragraph', paragraph: { runs: [{ text: '', pageBreak: true }] } });
          break;
        case 'emdash': appendText('—'); break;
        case 'endash': appendText('–'); break;
        case 'lquote': appendText('‘'); break;
        case 'rquote': appendText('’'); break;
        case 'ldblquote': appendText('“'); break;
        case 'rdblquote': appendText('”'); break;
        case 'bullet': appendText('•'); break;
        case 'trowd':
          currentRowDefs = [];
          currentCellDef = {};
          currentRowHeightPx = undefined;
          break;
        case 'trrh':
          if (param !== undefined && param !== 0) currentRowHeightPx = Math.round((Math.abs(param) / 15) * 100) / 100;
          break;
        case 'clcbpat':
          if (param !== undefined && colors[param]) currentCellDef.fill = colors[param];
          break;
        case 'clmgf': currentCellDef.hMerge = 'first'; break;
        case 'clmrg': currentCellDef.hMerge = 'cont'; break;
        case 'clvmgf': currentCellDef.vMerge = 'restart'; break;
        case 'clvmrg': currentCellDef.vMerge = 'continue'; break;
        case 'clbrdrt': currentCellDef.borderTop = true; break;
        case 'clbrdrb': currentCellDef.borderBottom = true; break;
        case 'clbrdrl': currentCellDef.borderLeft = true; break;
        case 'clbrdrr': currentCellDef.borderRight = true; break;
        case 'cellx':
          if (param !== undefined) {
            currentRowDefs.push({ ...currentCellDef, rightTwips: param });
            currentCellDef = {};
          }
          break;
        case 'cell':
          if (currentRuns.length || !currentCellParagraphs.length) {
            currentCellParagraphs.push(makeParagraph());
          }
          currentRowCells.push(currentCellParagraphs);
          currentCellParagraphs = [];
          currentRuns = [];
          break;
        case 'row':
          if (currentRowCells.length) {
            pendingTableRows.push({
              cells: currentRowCells,
              defs: currentRowDefs,
              heightPx: currentRowHeightPx,
            });
          }
          currentRowCells = [];
          currentCellParagraphs = [];
          currentRuns = [];
          break;
      }
      continue;
    }

    if (skipAnsi > 0) {
      skipAnsi--;
      i++;
      continue;
    }
    let j = i;
    while (j < len && src[j] !== '{' && src[j] !== '}' && src[j] !== '\\' && src[j] !== '\r' && src[j] !== '\n') {
      j++;
    }
    const slice = src.slice(i, j);
    if (skipAnsi > 0 && slice.length > 0) {
      const consume = Math.min(skipAnsi, slice.length);
      skipAnsi -= consume;
      appendText(slice.slice(consume));
    } else {
      appendText(slice);
    }
    i = j;
  }

  commitParagraph(false);
  flushTable();
  if (!blocks.length) blocks.push({ kind: 'paragraph', paragraph: { runs: [] } });

  const finalW = landscape && paperW < paperH ? paperH : paperW;
  const finalH = landscape && paperW < paperH ? paperW : paperH;
  const toPx = (twips: number) => Math.round((twips / 1440) * 96);

  const wordCount = blocks.reduce((sum, b) => {
    const countP = (p: WordParagraph) => {
      const t = p.runs.map((r) => r.text).join(' ').trim();
      return t ? t.split(/\s+/).length : 0;
    };
    if (b.kind === 'paragraph') return sum + countP(b.paragraph);
    return sum + b.rows.reduce((rs, r) => rs + r.reduce((cs, c) => cs + c.reduce((ps, p) => ps + countP(p), 0), 0), 0);
  }, 0);

  const document: WordDocument = {
    blocks,
    wordCount,
    pageSize: { width: toPx(finalW), height: toPx(finalH) },
    pageMargins: { top: toPx(margT), bottom: toPx(margB), left: toPx(margL), right: toPx(margR) },
    warnings,
    sourceFormat: 'rtf',
    readOnlyLegacy: true,
    packageEntries,
  };
  if (footnotes.length) {
    document.notes = {
      footnotes: footnotes.map((n, idx) => ({ id: n.id, kind: 'footnote', text: n.text, refParagraph: n.refParagraph, numbering: idx + 1 })),
      endnotes: [],
      footnoteFormat: 'decimal',
      endnoteFormat: 'lowerRoman',
      footnoteRestart: 'continuous',
      endnoteRestart: 'continuous',
      roots: { footnote: null, endnote: null },
    };
  }
  const resolvedHeader = (headerText || headerAltText).trim();
  const resolvedFooter = (footerText || footerAltText).trim();
  if (resolvedHeader || resolvedFooter) {
    const dummyNode = { name: 'w:sectPr', attrs: {}, text: '', children: [] };
    document.sections = [{
      index: 0,
      node: dummyNode,
      headers: resolvedHeader ? [{
        kind: 'header', type: 'default', path: 'word/header1.xml',
        xmlRoot: { name: 'w:hdr', attrs: {}, text: '', children: [] },
        text: resolvedHeader, hasPageNumber: false,
      }] : [],
      footers: resolvedFooter ? [{
        kind: 'footer', type: 'default', path: 'word/footer1.xml',
        xmlRoot: { name: 'w:ftr', attrs: {}, text: '', children: [] },
        text: resolvedFooter, hasPageNumber: false,
      }] : [],
      titlePg: false,
      pageNumberFormat: 'decimal',
      columns: 1,
      columnSpace: 720,
      pageWidth: finalW,
      pageHeight: finalH,
      orientation: landscape ? 'landscape' : 'portrait',
      margins: { top: margT, right: margR, bottom: margB, left: margL },
    }];
  }
  buildSyntheticWordPackage(document);
  return document;
}

function charsetToCodePage(charset: number): number | undefined {
  const table: Record<number, number> = {
    0: 1252,
    163: 1258,
    238: 1250,
    204: 1251,
    161: 1253,
    162: 1254,
    177: 1255,
    178: 1256,
    186: 1257,
    222: 874,
  };
  return table[charset];
}

function decodeRtfByte(byte: number, codePage: number): string {
  if (byte < 0x80) return String.fromCharCode(byte);
  if (codePage === 65001) return String.fromCharCode(byte);
  if (codePage === 1258) {
    const cp1258: Record<number, number> = {
      0xc3: 0x0102, 0xe3: 0x0103, 0xcc: 0x0300, 0xd0: 0x0110, 0xf0: 0x0111,
      0xd2: 0x0309, 0xd5: 0x01a0, 0xf5: 0x01a1, 0xdd: 0x01af, 0xfd: 0x01b0,
      0xde: 0x0303, 0xec: 0x0301, 0xf2: 0x0323,
    };
    if (cp1258[byte]) return String.fromCharCode(cp1258[byte]);
  }
  if (codePage !== 1252) {
    try {
      return new TextDecoder(`windows-${codePage}`).decode(new Uint8Array([byte]));
    } catch {
      // Fallback to CP1252 map below
    }
  }
  return String.fromCharCode(CP1252_EXTRA[byte] ?? byte);
}

function hex2(value: number): string {
  return Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0').toUpperCase();
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : hex.slice(0, -1);
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
