import { attr, findChild, findChildren, parseXml, type XmlNode } from '../binary/xml';
import type { WordParagraph } from './types';

export interface ResolvedParagraphStyle {
  fontSizePt?: number;
  fontFamily?: string;
  lineSpacing?: number;
  lineHeightPx?: number;
  spaceBeforePx?: number;
  spaceAfterPx?: number;
  align?: WordParagraph['align'];
  indentTwips?: number;
  keepNext?: boolean;
  contextualSpacing?: boolean;
}

interface StyleEntry {
  basedOn?: string;
  own: ResolvedParagraphStyle;
}

export interface WordStyleSheet {
  defaultParagraphStyle: string;
  defaults: ResolvedParagraphStyle;
  styles: Map<string, StyleEntry>;
  tableStyles: Map<string, StyleEntry>;
}

const twipsToPx = (twips: number): number => Math.round((twips / 20) * (96 / 72) * 100) / 100;

/** Parse word/styles.xml into resolved paragraph metrics (size, line and paragraph spacing). */
export function parseWordStyles(entries: Map<string, Uint8Array> | undefined): WordStyleSheet {
  const sheet: WordStyleSheet = {
    defaultParagraphStyle: 'Normal',
    defaults: {},
    styles: new Map(),
    tableStyles: new Map(),
  };
  const bytes = entries?.get('word/styles.xml');
  if (!bytes) return sheet;
  const parsed = parseXml(new TextDecoder('utf-8').decode(bytes));
  const root = findChild(parsed, 'w:styles') ?? parsed;
  const defaults = findChild(root, 'w:docDefaults');
  const defaultRPr = findChild(findChild(defaults, 'w:rPrDefault'), 'w:rPr');
  const defaultPPr = findChild(findChild(defaults, 'w:pPrDefault'), 'w:pPr');
  sheet.defaults = { ...readRunMetrics(defaultRPr), ...readParagraphMetrics(defaultPPr) };

  for (const style of findChildren(root, 'w:style')) {
    const type = attr(style, 'w:type');
    if (type !== 'paragraph' && type !== 'table') continue;
    const id = attr(style, 'w:styleId');
    if (!id) continue;
    if (type === 'paragraph' && attr(style, 'w:default') === '1') sheet.defaultParagraphStyle = id;
    const entry: StyleEntry = {
      basedOn: attr(findChild(style, 'w:basedOn'), 'w:val') ?? undefined,
      own: {
        ...readRunMetrics(findChild(style, 'w:rPr')),
        ...readParagraphMetrics(findChild(style, 'w:pPr')),
      },
    };
    if (type === 'table') sheet.tableStyles.set(id, entry);
    else sheet.styles.set(id, entry);
  }
  return sheet;
}

/** Resolve a paragraph style (and its basedOn chain) over document defaults. */
export function resolveParagraphStyle(sheet: WordStyleSheet, styleId?: string): ResolvedParagraphStyle {
  return resolveStyle(sheet, sheet.styles, styleId || sheet.defaultParagraphStyle);
}

/** Resolve a table style (run/paragraph metrics applied to paragraphs inside cells). */
export function resolveTableStyle(sheet: WordStyleSheet, styleId?: string): ResolvedParagraphStyle {
  // Cell paragraphs without pStyle use the document's default paragraph style
  // (Normal), not raw docDefaults; the table style then overrides it.
  return resolveStyle(sheet, sheet.tableStyles, styleId, resolveParagraphStyle(sheet));
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

function readRunMetrics(rPr: XmlNode | null): ResolvedParagraphStyle {
  if (!rPr) return {};
  const size = Number(attr(findChild(rPr, 'w:sz'), 'w:val') ?? 0);
  return {
    fontSizePt: size > 0 ? size / 2 : undefined,
    fontFamily: attr(findChild(rPr, 'w:rFonts'), 'w:ascii') ?? undefined,
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
  const indent = Number(attr(findChild(pPr, 'w:ind'), 'w:left') ?? 0);
  return {
    lineSpacing: line > 0 && rule === 'auto' ? line / 240 : undefined,
    lineHeightPx: line > 0 && rule !== 'auto' ? twipsToPx(line) : undefined,
    spaceBeforePx: before !== undefined ? twipsToPx(Number(before) || 0) : undefined,
    spaceAfterPx: after !== undefined ? twipsToPx(Number(after) || 0) : undefined,
    align: jc === 'both' ? 'justify' : jc === 'center' ? 'center' : jc === 'right' ? 'right' : jc === 'left' ? 'left' : undefined,
    indentTwips: indent > 0 ? indent : undefined,
    keepNext: findChild(pPr, 'w:keepNext') ? true : undefined,
    contextualSpacing: findChild(pPr, 'w:contextualSpacing') ? true : undefined,
  };
}
