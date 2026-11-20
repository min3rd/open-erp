import { attr, findChild, findChildren, parseXml, type XmlNode } from '../binary/xml';
import { findZipEntry } from '../binary/zip';
import type { WordCellStyle, WordParagraph, WordTableBorders } from './types';
import { resolveThemeColor, resolveThemeFont, type ParsedWordTheme } from './word-theme';

export interface ResolvedParagraphStyle {
  fontSizePt?: number;
  fontFamily?: string;
  /** w:caps in the style's run properties: text is shown in capitals. */
  caps?: boolean;
  smallCaps?: boolean;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  shading?: string;
  lineSpacing?: number;
  lineHeightPx?: number;
  spaceBeforePx?: number;
  spaceAfterPx?: number;
  align?: WordParagraph['align'];
  indentTwips?: number;
  indentRightTwips?: number;
  firstLineTwips?: number;
  hangingTwips?: number;
  pageBreakBefore?: boolean;
  borderSides?: WordParagraph['borderSides'];
  keepNext?: boolean;
  contextualSpacing?: boolean;
  /** Numbering declared by the style's w:numPr (heading letters, outline numbers). */
  numId?: string;
  numLevel?: number;
}

export interface TableRegionStyle {
  fill?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  borders?: Partial<WordCellStyle>;
}

export interface TableVisualDefinition {
  basedOn?: string;
  tableBorders?: WordTableBorders;
  cellFill?: string;
  regions: Partial<Record<'firstRow' | 'lastRow' | 'firstCol' | 'lastCol' | 'band1Horz' | 'band1Vert', TableRegionStyle>>;
}

interface StyleEntry {
  basedOn?: string;
  own: ResolvedParagraphStyle;
}

export interface WordStyleSheet {
  defaultParagraphStyle: string;
  defaults: ResolvedParagraphStyle;
  styles: Map<string, StyleEntry>;
  charStyles: Map<string, StyleEntry>;
  tableStyles: Map<string, StyleEntry>;
  tableVisuals: Map<string, TableVisualDefinition>;
}

const twipsToPx = (twips: number): number => Math.round((twips / 20) * (96 / 72) * 100) / 100;

/** Parse word/styles.xml into resolved paragraph, character, and table style metrics. */
export function parseWordStyles(
  entries: Map<string, Uint8Array> | undefined,
  theme?: ParsedWordTheme,
): WordStyleSheet {
  const sheet: WordStyleSheet = {
    defaultParagraphStyle: 'Normal',
    defaults: {},
    styles: new Map(),
    charStyles: new Map(),
    tableStyles: new Map(),
    tableVisuals: new Map(),
  };
  const entry = entries ? findZipEntry(entries, 'word/styles.xml') : undefined;
  if (!entry) return sheet;
  const parsed = parseXml(new TextDecoder('utf-8').decode(entry.data));
  const root = findChild(parsed, 'w:styles') ?? parsed;
  const defaults = findChild(root, 'w:docDefaults');
  const defaultRPr = findChild(findChild(defaults, 'w:rPrDefault'), 'w:rPr');
  const defaultPPr = findChild(findChild(defaults, 'w:pPrDefault'), 'w:pPr');
  sheet.defaults = { ...readRunMetrics(defaultRPr, theme), ...readParagraphMetrics(defaultPPr) };

  for (const style of findChildren(root, 'w:style')) {
    const type = attr(style, 'w:type');
    const id = attr(style, 'w:styleId');
    if (!id) continue;
    if (type !== 'paragraph' && type !== 'table' && type !== 'character') continue;
    if (type === 'paragraph' && attr(style, 'w:default') === '1') sheet.defaultParagraphStyle = id;
    const basedOn = attr(findChild(style, 'w:basedOn'), 'w:val') ?? undefined;
    const styleEntry: StyleEntry = {
      basedOn,
      own: {
        ...readRunMetrics(findChild(style, 'w:rPr'), theme),
        ...readParagraphMetrics(findChild(style, 'w:pPr')),
      },
    };
    if (type === 'table') {
      sheet.tableStyles.set(id, styleEntry);
      sheet.tableVisuals.set(id, readTableVisual(style, basedOn, theme));
    } else if (type === 'character') {
      sheet.charStyles.set(id, styleEntry);
    } else {
      sheet.styles.set(id, styleEntry);
    }
  }
  return sheet;
}

/** Resolve a paragraph style (and its basedOn chain) over document defaults. */
export function resolveParagraphStyle(sheet: WordStyleSheet, styleId?: string): ResolvedParagraphStyle {
  return resolveStyle(sheet, sheet.styles, styleId || sheet.defaultParagraphStyle);
}

/** Resolve a character style (and its basedOn chain). */
export function resolveCharacterStyle(sheet: WordStyleSheet, styleId?: string): ResolvedParagraphStyle {
  if (!styleId) return {};
  return resolveStyle(sheet, sheet.charStyles, styleId, {});
}

/** Resolve a table style (paragraph metrics applied to paragraphs inside cells). */
export function resolveTableStyle(sheet: WordStyleSheet, styleId?: string): ResolvedParagraphStyle {
  // Cell paragraphs without pStyle use the document's default paragraph style
  // (Normal), not raw docDefaults; the table style then overrides it.
  const resolved = resolveStyle(sheet, sheet.tableStyles, styleId, resolveParagraphStyle(sheet));
  // Word keeps cell text in the paragraph style's font: the run properties of a
  // table style only declare the table's own default (Table Grid stores 10pt
  // while the document's Normal is 14pt, and Word renders the cells at 14pt).
  const paragraph = resolveParagraphStyle(sheet);
  resolved.fontSizePt = paragraph.fontSizePt;
  resolved.fontFamily = paragraph.fontFamily;
  return resolved;
}

/** Resolve visual properties (borders & conditional row/column shading) of a table style. */
export function resolveTableVisual(
  sheet: WordStyleSheet,
  styleId?: string,
  theme?: ParsedWordTheme,
): TableVisualDefinition | undefined {
  if (!styleId) return undefined;
  const chain: TableVisualDefinition[] = [];
  let current: string | undefined = styleId;
  const seen = new Set<string>();
  while (current && !seen.has(current)) {
    seen.add(current);
    const def = sheet.tableVisuals.get(current);
    if (!def) break;
    chain.push(def);
    current = def.basedOn;
  }
  if (!chain.length) return undefined;
  const merged: TableVisualDefinition = { regions: {} };
  for (const def of chain.reverse()) {
    if (def.tableBorders) merged.tableBorders = { ...(merged.tableBorders ?? {}), ...def.tableBorders };
    if (def.cellFill) merged.cellFill = def.cellFill;
    for (const key of ['firstRow', 'lastRow', 'firstCol', 'lastCol', 'band1Horz', 'band1Vert'] as const) {
      if (def.regions[key]) {
        merged.regions[key] = { ...(merged.regions[key] ?? {}), ...def.regions[key] };
      }
    }
  }
  void theme;
  return merged;
}

function resolveStyle(
  sheet: WordStyleSheet,
  map: Map<string, StyleEntry>,
  styleId?: string,
  base: ResolvedParagraphStyle = { ...sheet.defaults },
): ResolvedParagraphStyle {
  const resolved: ResolvedParagraphStyle = { ...base };
  const chain: string[] = [];
  let current = styleId ?? '';
  while (current && !chain.includes(current)) {
    chain.push(current);
    current = map.get(current)?.basedOn ?? '';
  }
  for (const id of chain.reverse()) {
    const own = map.get(id)?.own;
    if (!own) continue;
    for (const [key, value] of Object.entries(own)) {
      if (value !== undefined) (resolved as Record<string, unknown>)[key] = value;
    }
  }
  return resolved;
}

function readToggle(node: XmlNode | null): boolean | undefined {
  if (!node) return undefined;
  const val = attr(node, 'w:val');
  return val !== '0' && val !== 'false';
}

function readRunMetrics(rPr: XmlNode | null, theme?: ParsedWordTheme): ResolvedParagraphStyle {
  if (!rPr) return {};
  const size = Number(attr(findChild(rPr, 'w:sz'), 'w:val') ?? 0);
  const rFonts = findChild(rPr, 'w:rFonts');
  const fontFamily = attr(rFonts, 'w:ascii')
    ?? attr(rFonts, 'w:hAnsi')
    ?? resolveThemeFont(theme, attr(rFonts, 'w:asciiTheme') ?? attr(rFonts, 'w:hAnsiTheme'))
    ?? attr(rFonts, 'w:cs')
    ?? undefined;
  const uNode = findChild(rPr, 'w:u');
  const uVal = attr(uNode, 'w:val');
  const underline = uNode ? (uVal ? uVal !== 'none' && uVal !== '0' && uVal !== 'false' : true) : undefined;
  const colorNode = findChild(rPr, 'w:color');
  const colorVal = attr(colorNode, 'w:val');
  const color = colorVal && colorVal !== 'auto'
    ? `#${colorVal.replace(/^#/, '')}`
    : resolveThemeColor(theme, attr(colorNode, 'w:themeColor'), attr(colorNode, 'w:themeTint'), attr(colorNode, 'w:themeShade'));
  const shdNode = findChild(rPr, 'w:shd');
  const shdFill = attr(shdNode, 'w:fill');
  const shading = shdFill && shdFill !== 'auto'
    ? `#${shdFill.replace(/^#/, '')}`
    : resolveThemeColor(theme, attr(shdNode, 'w:themeFill'), attr(shdNode, 'w:themeFillTint'), attr(shdNode, 'w:themeFillShade'));

  return {
    fontSizePt: size > 0 ? size / 2 : undefined,
    fontFamily,
    caps: readToggle(findChild(rPr, 'w:caps')),
    smallCaps: readToggle(findChild(rPr, 'w:smallCaps')),
    bold: readToggle(findChild(rPr, 'w:b')),
    italic: readToggle(findChild(rPr, 'w:i')),
    underline,
    strike: readToggle(findChild(rPr, 'w:strike')),
    color,
    shading,
  };
}

function readParagraphMetrics(pPr: XmlNode | null): ResolvedParagraphStyle {
  if (!pPr) return {};
  const spacing = findChild(pPr, 'w:spacing');
  const line = Number(attr(spacing, 'w:line') ?? 0);
  const rule = attr(spacing, 'w:lineRule') ?? 'auto';
  const before = attr(spacing, 'w:before');
  const after = attr(spacing, 'w:after');
  const jc = attr(findChild(pPr, 'w:jc'), 'w:val');
  const ind = findChild(pPr, 'w:ind');
  const indent = Number(attr(ind, 'w:left') ?? attr(ind, 'w:start') ?? 0);
  const indentRight = Number(attr(ind, 'w:right') ?? attr(ind, 'w:end') ?? 0);
  const firstLine = Number(attr(ind, 'w:firstLine') ?? 0);
  const hanging = Number(attr(ind, 'w:hanging') ?? 0);
  const pbBefore = findChild(pPr, 'w:pageBreakBefore');
  const borderSides = readParagraphBorders(findChild(pPr, 'w:pBdr'));
  return {
    lineSpacing: line > 0 && rule === 'auto' ? line / 240 : undefined,
    lineHeightPx: line > 0 && rule !== 'auto' ? twipsToPx(line) : undefined,
    spaceBeforePx: before !== undefined ? twipsToPx(Number(before) || 0) : undefined,
    spaceAfterPx: after !== undefined ? twipsToPx(Number(after) || 0) : undefined,
    align: jc === 'both' ? 'justify' : jc === 'center' ? 'center' : jc === 'right' ? 'right' : jc === 'left' ? 'left' : undefined,
    indentTwips: indent > 0 ? indent : undefined,
    indentRightTwips: indentRight > 0 ? indentRight : undefined,
    firstLineTwips: firstLine > 0 ? firstLine : undefined,
    hangingTwips: hanging > 0 ? hanging : undefined,
    pageBreakBefore: pbBefore ? attr(pbBefore, 'w:val') !== '0' && attr(pbBefore, 'w:val') !== 'false' : undefined,
    borderSides,
    numId: attr(findChild(findChild(pPr, 'w:numPr'), 'w:numId'), 'w:val') ?? undefined,
    numLevel: Number(attr(findChild(findChild(pPr, 'w:numPr'), 'w:ilvl'), 'w:val') ?? 0),
    keepNext: findChild(pPr, 'w:keepNext') ? true : undefined,
    contextualSpacing: findChild(pPr, 'w:contextualSpacing') ? true : undefined,
  };
}

export function readParagraphBorders(pBdr: XmlNode | null, theme?: ParsedWordTheme): WordParagraph['borderSides'] {
  if (!pBdr) return undefined;
  const sides: NonNullable<WordParagraph['borderSides']> = {};
  for (const edge of ['top', 'bottom', 'left', 'right'] as const) {
    const node = findChild(pBdr, `w:${edge}`);
    if (!node) continue;
    const val = attr(node, 'w:val') ?? 'single';
    if (val === 'nil' || val === 'none') continue;
    const sz = Math.max(1, Math.round(Number(attr(node, 'w:sz') ?? 4) / 6));
    const colorAttr = attr(node, 'w:color');
    const color = colorAttr && colorAttr !== 'auto'
      ? `#${colorAttr.replace(/^#/, '')}`
      : resolveThemeColor(theme, attr(node, 'w:themeColor'), attr(node, 'w:themeTint'), attr(node, 'w:themeShade')) ?? '#000000';
    const cssStyle = val === 'double' ? 'double' : val === 'dashed' ? 'dashed' : val === 'dotted' ? 'dotted' : 'solid';
    sides[edge] = `${sz}px ${cssStyle} ${color}`;
  }
  return Object.keys(sides).length ? sides : undefined;
}

export function readTableBordersNode(tblBorders: XmlNode | null, theme?: ParsedWordTheme): WordTableBorders | undefined {
  if (!tblBorders) return undefined;
  const result: WordTableBorders = {};
  for (const edge of ['top', 'bottom', 'left', 'right', 'insideH', 'insideV'] as const) {
    const node = findChild(tblBorders, `w:${edge}`);
    if (!node) continue;
    const val = attr(node, 'w:val') ?? 'single';
    if (val === 'nil' || val === 'none') {
      result[edge] = 'none';
      continue;
    }
    const sz = Math.max(1, Math.round(Number(attr(node, 'w:sz') ?? 4) / 6));
    const colorAttr = attr(node, 'w:color');
    const color = colorAttr && colorAttr !== 'auto'
      ? `#${colorAttr.replace(/^#/, '')}`
      : resolveThemeColor(theme, attr(node, 'w:themeColor'), attr(node, 'w:themeTint'), attr(node, 'w:themeShade')) ?? '#000000';
    const cssStyle = val === 'double' ? 'double' : val === 'dashed' ? 'dashed' : val === 'dotted' ? 'dotted' : 'solid';
    result[edge] = `${sz}px ${cssStyle} ${color}`;
  }
  return Object.keys(result).length ? result : undefined;
}

function readTableVisual(style: XmlNode, basedOn: string | undefined, theme?: ParsedWordTheme): TableVisualDefinition {
  const tblPr = findChild(style, 'w:tblPr');
  const tcPr = findChild(style, 'w:tcPr');
  const shd = findChild(tcPr, 'w:shd');
  const shdFill = attr(shd, 'w:fill');
  const cellFill = shdFill && shdFill !== 'auto'
    ? `#${shdFill.replace(/^#/, '')}`
    : resolveThemeColor(theme, attr(shd, 'w:themeFill'), attr(shd, 'w:themeFillTint'), attr(shd, 'w:themeFillShade'));

  const regions: TableVisualDefinition['regions'] = {};
  for (const region of findChildren(style, 'w:tblStylePr')) {
    const type = attr(region, 'w:type');
    if (type !== 'firstRow' && type !== 'lastRow' && type !== 'firstCol' && type !== 'lastCol' && type !== 'band1Horz' && type !== 'band1Vert') {
      continue;
    }
    const regTcPr = findChild(region, 'w:tcPr');
    const regShd = findChild(regTcPr, 'w:shd');
    const regFillAttr = attr(regShd, 'w:fill');
    const fill = regFillAttr && regFillAttr !== 'auto'
      ? `#${regFillAttr.replace(/^#/, '')}`
      : resolveThemeColor(theme, attr(regShd, 'w:themeFill'), attr(regShd, 'w:themeFillTint'), attr(regShd, 'w:themeFillShade'));
    const rPr = findChild(region, 'w:rPr');
    const rMetrics = readRunMetrics(rPr, theme);
    const tcBorders = findChild(regTcPr, 'w:tcBorders');
    const borders: Partial<WordCellStyle> = {};
    if (tcBorders) {
      let maxSz = 0;
      let bColor: string | undefined;
      for (const edge of ['top', 'left', 'bottom', 'right'] as const) {
        const b = findChild(tcBorders, `w:${edge}`);
        if (!b) continue;
        const val = attr(b, 'w:val') ?? 'single';
        const on = val !== 'nil' && val !== 'none';
        if (edge === 'top') borders.borderTop = on;
        else if (edge === 'left') borders.borderLeft = on;
        else if (edge === 'bottom') borders.borderBottom = on;
        else borders.borderRight = on;
        if (on) {
          maxSz = Math.max(maxSz, Number(attr(b, 'w:sz') ?? 4));
          const c = attr(b, 'w:color');
          if (c && c !== 'auto') bColor = `#${c.replace(/^#/, '')}`;
          else bColor = resolveThemeColor(theme, attr(b, 'w:themeColor'), attr(b, 'w:themeTint'), attr(b, 'w:themeShade')) ?? bColor;
        }
      }
      if (maxSz > 0) borders.borderWidthPx = Math.max(1, Math.round(maxSz / 6));
      if (bColor) borders.borderColor = bColor;
    }
    regions[type] = {
      fill,
      color: rMetrics.color,
      bold: rMetrics.bold,
      italic: rMetrics.italic,
      borders: Object.keys(borders).length ? borders : undefined,
    };
  }
  return {
    basedOn,
    tableBorders: readTableBordersNode(findChild(tblPr, 'w:tblBorders'), theme),
    cellFill,
    regions,
  };
}
