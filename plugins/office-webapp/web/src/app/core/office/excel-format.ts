import { attr, descendants, findChild, findChildren, parseXml, serializeXml, type XmlNode } from '../binary/xml';
import type { CellStyle, ExcelCell, ExcelDocument, ExcelSheet } from './types';

const STYLES_PATH = 'xl/styles.xml';
const BUILTIN_FORMATS: Record<number, string> = {
  0: 'General', 1: '0', 2: '0.00', 3: '#,##0', 4: '#,##0.00', 9: '0%', 10: '0.00%',
  14: 'mm-dd-yy', 20: 'h:mm', 21: 'h:mm:ss', 22: 'm/d/yy h:mm', 37: '#,##0 ;(#,##0)',
  38: '#,##0 ;[Red](#,##0)', 39: '#,##0.00;(#,##0.00)', 40: '#,##0.00;[Red](#,##0.00)',
};

export function parseCellStyleMap(entries: Map<string, Uint8Array>): Map<number, CellStyle> {
  const result = new Map<number, CellStyle>();
  const bytes = entries.get(STYLES_PATH);
  if (!bytes) return result;
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  const styles = findChild(root, 'styleSheet') ?? root;
  const formats = new Map<number, string>(Object.entries(BUILTIN_FORMATS).map(([id, code]) => [Number(id), code]));
  for (const node of findChildren(findChild(styles, 'numFmts'), 'numFmt')) {
    const id = Number(attr(node, 'numFmtId') ?? -1);
    const code = attr(node, 'formatCode');
    if (id >= 0 && code) formats.set(id, code);
  }
  const fonts = findChildren(findChild(styles, 'fonts'), 'font').map(parseFont);
  const fills = findChildren(findChild(styles, 'fills'), 'fill').map(parseFill);
  const borders = findChildren(findChild(styles, 'borders'), 'border').map(hasBorder);
  const xfs = findChildren(findChild(styles, 'cellXfs'), 'xf');
  xfs.forEach((xf, index) => {
    const style: CellStyle = {};
    const font = fonts[Number(attr(xf, 'fontId') ?? 0)];
    if (font) Object.assign(style, font);
    const fill = fills[Number(attr(xf, 'fillId') ?? 0)];
    if (fill) style.fill = fill;
    if (borders[Number(attr(xf, 'borderId') ?? 0)]) style.border = true;
    const numFmtId = Number(attr(xf, 'numFmtId') ?? 0);
    const numFmt = formats.get(numFmtId);
    if (numFmt && numFmt !== 'General') style.numberFormat = numFmt;
    const alignment = findChild(xf, 'alignment');
    const horizontal = attr(alignment, 'horizontal');
    if (horizontal === 'center' || horizontal === 'right' || horizontal === 'left') style.align = horizontal;
    const vertical = attr(alignment, 'vertical');
    if (vertical === 'top' || vertical === 'bottom' || vertical === 'center') {
      style.verticalAlign = vertical === 'center' ? 'middle' : vertical;
    }
    if (attr(alignment, 'wrapText') === '1') style.wrapText = true;
    const indent = Number(attr(alignment, 'indent') ?? 0);
    if (indent > 0) style.indent = indent;
    const rotation = Number(attr(alignment, 'textRotation') ?? 0);
    if (rotation > 0) style.rotation = rotation;
    if (Object.keys(style).length) result.set(index, style);
  });
  return result;
}

export function applyCellStyle(document: ExcelDocument, sheet: ExcelSheet, ref: string, input: Partial<CellStyle>): CellStyle | null {
  const cell = sheet.cells.get(ref);
  if (!cell) return null;
  const entries = document.packageEntries;
  if (!entries) return null;
  const root = loadStyles(entries);
  const styles = findChild(root, 'styleSheet') ?? root;
  const style: CellStyle = { ...(cell.style ?? {}), ...input };
  const fontId = ensureFont(styles, style);
  const fillId = ensureFill(styles, style);
  const borderId = ensureBorder(styles, style);
  const numFmtId = ensureNumberFormat(styles, style.numberFormat);
  const xfId = ensureCellXf(styles, {
    fontId, fillId, borderId, numFmtId,
    align: style.align, vertical: style.verticalAlign, wrapText: style.wrapText, indent: style.indent,
    rotation: style.rotation,
  });
  entries.set(STYLES_PATH, new TextEncoder().encode(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + serializeXml(root)));

  if (cell.xmlNode) cell.xmlNode.attrs['s'] = String(xfId);
  cell.styleIndex = xfId;
  cell.style = style;
  return style;
}

export function setFreezePane(sheet: ExcelSheet, row: number, col: number): void {
  const root = sheet.xmlRoot;
  if (!root) return;
  let sheetViews = findChild(root, 'sheetViews');
  if (!sheetViews) {
    sheetViews = { name: 'sheetViews', attrs: {}, text: '', children: [] };
    const at = root.children.findIndex((child) => child.name === 'sheetFormatPr' || child.name === 'sheetData');
    root.children.splice(at < 0 ? root.children.length : at, 0, sheetViews);
  }
  let view = findChild(sheetViews, 'sheetView');
  if (!view) {
    view = { name: 'sheetView', attrs: { workbookViewId: '0' }, text: '', children: [] };
    sheetViews.children.push(view);
  }
  view.children = view.children.filter((child) => child.name !== 'pane');
  if (row > 0 || col > 0) {
    view.children.unshift({
      name: 'pane',
      attrs: {
        xSplit: String(col),
        ySplit: String(row),
        topLeftCell: `${columnName(col + 1)}${row + 1}`,
        activePane: 'bottomRight',
        state: 'frozen',
      },
      text: '', children: [],
    });
    sheet.freeze = { row, col };
  } else {
    delete sheet.freeze;
  }
}

export function clearFreezePane(sheet: ExcelSheet): void {
  setFreezePane(sheet, 0, 0);
}

function loadStyles(entries: Map<string, Uint8Array>): XmlNode {
  const bytes = entries.get(STYLES_PATH);
  if (bytes) {
    const root = parseXml(new TextDecoder('utf-8').decode(bytes));
    return findChild(root, 'styleSheet') ?? root;
  }
  const root: XmlNode = {
    name: 'styleSheet',
    attrs: { xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main' },
    text: '', children: [
      { name: 'fonts', attrs: { count: '1' }, text: '', children: [
        { name: 'font', attrs: {}, text: '', children: [
          { name: 'sz', attrs: { val: '11' }, text: '', children: [] },
          { name: 'name', attrs: { val: 'Calibri' }, text: '', children: [] },
        ] },
      ] },
      { name: 'fills', attrs: { count: '2' }, text: '', children: [
        { name: 'fill', attrs: {}, text: '', children: [{ name: 'patternFill', attrs: { patternType: 'none' }, text: '', children: [] }] },
        { name: 'fill', attrs: {}, text: '', children: [{ name: 'patternFill', attrs: { patternType: 'gray125' }, text: '', children: [] }] },
      ] },
      { name: 'borders', attrs: { count: '1' }, text: '', children: [
        { name: 'border', attrs: {}, text: '', children: [
          { name: 'left', attrs: {}, text: '', children: [] },
          { name: 'right', attrs: {}, text: '', children: [] },
          { name: 'top', attrs: {}, text: '', children: [] },
          { name: 'bottom', attrs: {}, text: '', children: [] },
          { name: 'diagonal', attrs: {}, text: '', children: [] },
        ] },
      ] },
      { name: 'cellXfs', attrs: { count: '0' }, text: '', children: [] },
    ],
  };
  return root;
}

function parseFont(node: XmlNode): CellStyle {
  const style: CellStyle = {};
  if (findChild(node, 'b')) style.bold = true;
  if (findChild(node, 'i')) style.italic = true;
  const underline = findChild(node, 'u');
  if (underline) {
    if (attr(underline, 'val') === 'double') style.doubleUnderline = true;
    else style.underline = true;
  }
  if (findChild(node, 'strike')) style.strike = true;
  const color = findChild(node, 'color');
  const rgb = attr(color, 'rgb');
  if (rgb) style.color = rgbToHex(rgb);
  const size = attr(findChild(node, 'sz'), 'val');
  if (size) style.sizePt = Number(size);
  const name = attr(findChild(node, 'name'), 'val');
  if (name) style.font = name;
  return style;
}

function parseFill(node: XmlNode): string | undefined {
  const pattern = findChild(node, 'patternFill');
  if (attr(pattern, 'patternType') !== 'solid') return undefined;
  const rgb = attr(findChild(pattern, 'fgColor'), 'rgb');
  return rgb ? rgbToHex(rgb) : undefined;
}

function hasBorder(node: XmlNode): boolean {
  return ['left', 'right', 'top', 'bottom'].some((side) => Boolean(attr(findChild(node, side), 'style')));
}

function ensureFont(styles: XmlNode, style: CellStyle): number {
  const fonts = findChild(styles, 'fonts') ?? appendContainer(styles, 'fonts');
  const nodes = findChildren(fonts, 'font');
  const index = nodes.findIndex((node) => fontMatches(node, style));
  if (index >= 0) return index;
  fonts.children.push(buildFont(style));
  fonts.attrs['count'] = String(fonts.children.length);
  return fonts.children.length - 1;
}

function fontMatches(node: XmlNode, style: CellStyle): boolean {
  const underline = findChild(node, 'u');
  return Boolean(findChild(node, 'b')) === Boolean(style.bold)
    && Boolean(findChild(node, 'i')) === Boolean(style.italic)
    && Boolean(findChild(node, 'strike')) === Boolean(style.strike)
    && (attr(underline, 'val') === 'double') === Boolean(style.doubleUnderline)
    && Boolean(underline && attr(underline, 'val') !== 'double') === Boolean(style.underline)
    && (attr(findChild(node, 'name'), 'val') ?? 'Calibri') === (style.font ?? 'Calibri')
    && Number(attr(findChild(node, 'sz'), 'val') ?? 11) === Number(style.sizePt ?? 11)
    && (attr(findChild(node, 'color'), 'rgb') ? rgbToHex(attr(findChild(node, 'color'), 'rgb')!) : undefined) === style.color;
}

function buildFont(style: CellStyle): XmlNode {
  const children: XmlNode[] = [];
  if (style.bold) children.push({ name: 'b', attrs: {}, text: '', children: [] });
  if (style.italic) children.push({ name: 'i', attrs: {}, text: '', children: [] });
  if (style.strike) children.push({ name: 'strike', attrs: {}, text: '', children: [] });
  if (style.doubleUnderline) children.push({ name: 'u', attrs: { val: 'double' }, text: '', children: [] });
  else if (style.underline) children.push({ name: 'u', attrs: {}, text: '', children: [] });
  if (style.sizePt) children.push({ name: 'sz', attrs: { val: String(style.sizePt) }, text: '', children: [] });
  children.push({ name: 'color', attrs: { rgb: style.color ? `FF${style.color.replace('#', '').toUpperCase()}` : 'FF000000' }, text: '', children: [] });
  children.push({ name: 'name', attrs: { val: style.font ?? 'Calibri' }, text: '', children: [] });
  return { name: 'font', attrs: {}, text: '', children };
}

function ensureFill(styles: XmlNode, style: CellStyle): number {
  if (!style.fill) return 0;
  const fills = findChild(styles, 'fills') ?? appendContainer(styles, 'fills');
  const nodes = findChildren(fills, 'fill');
  const index = nodes.findIndex((node) => parseFill(node) === style.fill);
  if (index >= 0) return index;
  fills.children.push({
    name: 'fill', attrs: {}, text: '', children: [{
      name: 'patternFill', attrs: { patternType: 'solid' }, text: '', children: [
        { name: 'fgColor', attrs: { rgb: `FF${style.fill.replace('#', '').toUpperCase()}` }, text: '', children: [] },
        { name: 'bgColor', attrs: { indexed: '64' }, text: '', children: [] },
      ],
    }],
  });
  fills.attrs['count'] = String(fills.children.length);
  return fills.children.length - 1;
}

function ensureBorder(styles: XmlNode, style: CellStyle): number {
  if (!style.border) return 0;
  const borders = findChild(styles, 'borders') ?? appendContainer(styles, 'borders');
  const nodes = findChildren(borders, 'border');
  const index = nodes.findIndex((node) => hasBorder(node));
  if (index >= 0) return index;
  const side = (name: string): XmlNode => ({
    name, attrs: { style: 'thin' }, text: '', children: [
      { name: 'color', attrs: { rgb: 'FF000000' }, text: '', children: [] },
    ],
  });
  borders.children.push({
    name: 'border', attrs: {}, text: '', children: [
      side('left'), side('right'), side('top'), side('bottom'),
      { name: 'diagonal', attrs: {}, text: '', children: [] },
    ],
  });
  borders.attrs['count'] = String(borders.children.length);
  return borders.children.length - 1;
}

function ensureNumberFormat(styles: XmlNode, code: string | undefined): number {
  if (!code || code === 'General') return 0;
  const builtin = Object.entries(BUILTIN_FORMATS).find(([, value]) => value === code);
  if (builtin) return Number(builtin[0]);
  let container = findChild(styles, 'numFmts');
  if (!container) {
    container = { name: 'numFmts', attrs: { count: '0' }, text: '', children: [] };
    styles.children.unshift(container);
  }
  const existing = container.children.find((node) => attr(node, 'formatCode') === code);
  if (existing) return Number(attr(existing, 'numFmtId') ?? 164);
  const id = 164 + container.children.length;
  container.children.push({ name: 'numFmt', attrs: { numFmtId: String(id), formatCode: code }, text: '', children: [] });
  container.attrs['count'] = String(container.children.length);
  return id;
}

function ensureCellXf(styles: XmlNode, input: {
  fontId: number; fillId: number; borderId: number; numFmtId: number;
  align?: string; vertical?: string; wrapText?: boolean; indent?: number; rotation?: number;
}): number {
  const cellXfs = findChild(styles, 'cellXfs') ?? appendContainer(styles, 'cellXfs');
  const nodes = findChildren(cellXfs, 'xf');
  const index = nodes.findIndex((node) => {
    const alignment = findChild(node, 'alignment');
    return Number(attr(node, 'fontId') ?? 0) === input.fontId
      && Number(attr(node, 'fillId') ?? 0) === input.fillId
      && Number(attr(node, 'borderId') ?? 0) === input.borderId
      && Number(attr(node, 'numFmtId') ?? 0) === input.numFmtId
      && (attr(alignment, 'horizontal') ?? undefined) === input.align
      && (attr(alignment, 'vertical') === 'center' ? 'middle' : attr(alignment, 'vertical') ?? undefined) === input.vertical
      && (attr(alignment, 'wrapText') === '1') === Boolean(input.wrapText)
      && Number(attr(alignment, 'indent') ?? 0) === (input.indent ?? 0)
      && Number(attr(alignment, 'textRotation') ?? 0) === (input.rotation ?? 0);
  });
  if (index >= 0) return index;
  const attrs: Record<string, string> = {
    numFmtId: String(input.numFmtId), fontId: String(input.fontId), fillId: String(input.fillId),
    borderId: String(input.borderId), xfId: '0',
    applyFont: input.fontId ? '1' : '0', applyFill: input.fillId ? '1' : '0',
    applyBorder: input.borderId ? '1' : '0', applyNumberFormat: input.numFmtId ? '1' : '0',
    applyAlignment: input.align || input.vertical || input.wrapText || input.indent || input.rotation ? '1' : '0',
  };
  const alignAttrs: Record<string, string> = {};
  if (input.align) alignAttrs['horizontal'] = input.align;
  if (input.vertical) alignAttrs['vertical'] = input.vertical === 'middle' ? 'center' : input.vertical;
  if (input.wrapText) alignAttrs['wrapText'] = '1';
  if (input.indent) alignAttrs['indent'] = String(input.indent);
  if (input.rotation) alignAttrs['textRotation'] = String(input.rotation);
  const children: XmlNode[] = Object.keys(alignAttrs).length
    ? [{ name: 'alignment', attrs: alignAttrs, text: '', children: [] }]
    : [];
  cellXfs.children.push({ name: 'xf', attrs, text: '', children });
  cellXfs.attrs['count'] = String(cellXfs.children.length);
  return cellXfs.children.length - 1;
}

function appendContainer(styles: XmlNode, name: string): XmlNode {
  const node: XmlNode = { name, attrs: { count: '0' }, text: '', children: [] };
  styles.children.push(node);
  return node;
}

function rgbToHex(rgb: string): string {
  const value = rgb.replace(/^#/, '');
  return `#${value.length > 6 ? value.slice(-6) : value}`.toUpperCase().replace('#', '#');
}

function columnName(value: number): string {
  let column = '';
  let current = value;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    current = Math.floor((current - 1) / 26);
  }
  return column;
}

export function freezeFromSheet(sheet: ExcelSheet): { row: number; col: number } | undefined {
  return sheet.freeze;
}

export function styleOfCell(cell: ExcelCell | undefined): CellStyle {
  return cell?.style ?? {};
}

export function cellDisplayValue(cell: ExcelCell): string {
  const format = cell.style?.numberFormat;
  if (!format || format === 'General') return cell.value;
  const numeric = Number(cell.value.replace(/,/g, ''));
  if (!Number.isFinite(numeric)) return cell.value;
  if (format.includes('%')) {
    const decimals = (format.split('.')[1] ?? '').replace(/[^0]/g, '').length;
    return `${(numeric * 100).toFixed(decimals)}%`;
  }
  if (format.includes('0.00')) return `${numeric.toFixed(2)}${format.includes('₫') ? ' ₫' : ''}`;
  if (format.includes('0.0')) return `${numeric.toFixed(1)}${format.includes('₫') ? ' ₫' : ''}`;
  if (format.includes('#,##0')) return `${Math.round(numeric).toLocaleString('en-US')}${format.includes('₫') ? ' ₫' : ''}`;
  if (format.toLowerCase().includes('yy') || format.toLowerCase().includes('dd')) {
    const date = new Date((numeric - 25569) * 86400000);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }
  return cell.value;
}

export function freezeLabel(freeze: { row: number; col: number } | undefined): string {
  if (!freeze || (!freeze.row && !freeze.col)) return '';
  return `${columnName(freeze.col + 1)}${freeze.row + 1}`;
}

export function styleSummary(style: CellStyle | undefined): string {
  if (!style) return '';
  const parts: string[] = [];
  if (style.bold) parts.push('B');
  if (style.italic) parts.push('I');
  if (style.underline) parts.push('U');
  if (style.fill) parts.push('fill');
  if (style.border) parts.push('border');
  if (style.align) parts.push(style.align);
  if (style.numberFormat) parts.push(style.numberFormat);
  return parts.join(' · ');
}

export function styleHasChanges(style: CellStyle | undefined): boolean {
  return !!style && Object.keys(style).length > 0;
}

export function stylesheetSummary(entries: Map<string, Uint8Array>): { fonts: number; fills: number; borders: number; xfs: number } {
  const bytes = entries.get(STYLES_PATH);
  if (!bytes) return { fonts: 0, fills: 0, borders: 0, xfs: 0 };
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  const styles = findChild(root, 'styleSheet') ?? root;
  return {
    fonts: descendants(styles, 'font').length,
    fills: findChildren(findChild(styles, 'fills'), 'fill').length,
    borders: findChildren(findChild(styles, 'borders'), 'border').length,
    xfs: findChildren(findChild(styles, 'cellXfs'), 'xf').length,
  };
}
