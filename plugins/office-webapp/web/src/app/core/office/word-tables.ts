import { attr, findChild, findChildren, parseXml, serializeXml, type XmlNode } from '../binary/xml';
import type { WordBlock, WordCellSpan, WordCellStyle, WordDocument, WordParagraph } from './types';
import { setParagraphRunBold, setParagraphRunStyle } from './word-runs';
import { STOCK_TABLE_LABEL_KEYS, STOCK_TABLE_STYLE_META, STOCK_TABLE_STYLES, type StockThemeFill } from './word-table-stock';

/**
 * Word table structure commands (Table Layout tab): insert/delete rows and
 * columns, header-row repeat, distribute columns, cell vertical alignment,
 * table alignment, merged cells and split cells. Every command edits the model
 * and the same w:tbl node, so a save keeps the change and the history snapshot
 * can undo it.
 */

export type TableAlign = 'left' | 'center' | 'right';
export type CellVerticalAlign = 'top' | 'center' | 'bottom';
type TableBlock = Extract<WordBlock, { kind: 'table' }>;

const GRID_TWIPS = 9360;

/** w:gridSpan / w:vMerge of every w:tc, row by row (1:1 with the model rows). */
export function readTableSpans(table: XmlNode): (WordCellSpan | undefined)[][] {
  return findChildren(table, 'w:tr').map((row) => findChildren(row, 'w:tc').map((cell) => {
    const tcPr = findChild(cell, 'w:tcPr');
    const span: WordCellSpan = {};
    const colSpan = Number(attr(findChild(tcPr, 'w:gridSpan'), 'w:val') ?? 1);
    if (colSpan > 1) span.colSpan = colSpan;
    const merge = findChild(tcPr, 'w:vMerge');
    // <w:vMerge/> with no value means "continue the merge above".
    if (merge) span.vMerge = attr(merge, 'w:val') === 'restart' ? 'restart' : 'continue';
    return span.colSpan || span.vMerge ? span : undefined;
  }));
}

function spanColumns(span: WordCellSpan | undefined): number {
  return Math.max(1, span?.colSpan ?? 1);
}

/** Grid column where each cell of a row starts. */
function columnStarts(spans: (WordCellSpan | undefined)[] | undefined, cells: number): number[] {
  const starts: number[] = [];
  let column = 0;
  for (let index = 0; index < cells; index++) {
    starts.push(column);
    column += spanColumns(spans?.[index]);
  }
  return starts;
}

function cellStartColumn(spans: (WordCellSpan | undefined)[][], rowIndex: number, cellIndex: number): number {
  return columnStarts(spans[rowIndex], cellIndex + 1)[cellIndex] ?? 0;
}

/** Index of the cell that covers a grid column, or -1. */
function cellAtColumn(spans: (WordCellSpan | undefined)[][] | undefined, rowIndex: number, column: number): number {
  const row = spans?.[rowIndex] ?? [];
  let start = 0;
  for (let index = 0; index < row.length; index++) {
    const width = spanColumns(row[index]);
    if (column < start + width) return index;
    start += width;
  }
  return -1;
}

/** Index in a row where a new cell at this grid column belongs. */
function insertIndexAtColumn(spans: (WordCellSpan | undefined)[] | undefined, column: number): number {
  const row = spans ?? [];
  let start = 0;
  for (let index = 0; index < row.length; index++) {
    if (start >= column) return index;
    start += spanColumns(row[index]);
  }
  return row.length;
}

/** How many grid columns a table really has (a merged cell counts its span). */
export function tableColumnCount(spans?: (WordCellSpan | undefined)[][]): number {
  let columns = 0;
  for (const row of spans ?? []) {
    columns = Math.max(columns, row.reduce((sum, cell) => sum + spanColumns(cell), 0));
  }
  return columns;
}

export interface WordCellLayout {
  colSpan: number;
  rowSpan: number;
  /** A continue cell that a restart cell above already covers: do not draw it. */
  covered: boolean;
}

function hasRestartAbove(spans: (WordCellSpan | undefined)[][], rowIndex: number, cellIndex: number): boolean {
  const column = cellStartColumn(spans, rowIndex, cellIndex);
  for (let index = rowIndex - 1; index >= 0; index--) {
    const above = cellAtColumn(spans, index, column);
    if (above < 0) return false;
    const span = spans[index]?.[above];
    if (span?.vMerge === 'restart') return true;
    if (span?.vMerge !== 'continue') return false;
  }
  return false;
}

/**
 * Draw layout of one cell. Word stores a vertical merge as a restart cell plus a
 * continue cell in every row it covers, so the restart gets the row span and the
 * continue cells stay hidden. A page that starts inside a merge has no restart
 * above it in its own row slice, so the continue cell is drawn as a normal cell.
 */
export function tableCellLayout(
  spans: (WordCellSpan | undefined)[][] | undefined, rowIndex: number, cellIndex: number,
): WordCellLayout {
  const span = spans?.[rowIndex]?.[cellIndex];
  const colSpan = spanColumns(span);
  if (!span?.vMerge) return { colSpan, rowSpan: 1, covered: false };
  if (span.vMerge === 'continue') {
    return { colSpan, rowSpan: 1, covered: Boolean(spans) && hasRestartAbove(spans!, rowIndex, cellIndex) };
  }
  let rowSpan = 1;
  const column = cellStartColumn(spans!, rowIndex, cellIndex);
  for (let index = rowIndex + 1; index < (spans?.length ?? 0); index++) {
    const below = cellAtColumn(spans, index, column);
    if (below < 0 || spans?.[index]?.[below]?.vMerge !== 'continue') break;
    rowSpan++;
  }
  return { colSpan, rowSpan, covered: false };
}

export function wordTableBlock(document: WordDocument, blockIndex: number): TableBlock | null {
  const block = document.blocks[blockIndex];
  return block?.kind === 'table' ? block : null;
}

function tableNode(block: TableBlock): XmlNode | null {
  return block.xmlNode?.name === 'w:tbl' ? block.xmlNode : null;
}

function rowNodes(table: XmlNode): XmlNode[] {
  return findChildren(table, 'w:tr');
}

function cellNodes(row: XmlNode | undefined): XmlNode[] {
  return row ? findChildren(row, 'w:tc') : [];
}

function makeNode(name: string, attrs: Record<string, string> = {}): XmlNode {
  return { name, attrs, text: '', children: [] };
}

function ensureProperties(parent: XmlNode, name: string): XmlNode {
  const existing = findChild(parent, name);
  if (existing) return existing;
  const node = makeNode(name);
  parent.children.unshift(node);
  return node;
}

function emptyParagraph(): XmlNode {
  return makeNode('w:p');
}

function cloneRowWithEmptyCells(source: XmlNode): XmlNode {
  const row = makeNode('w:tr');
  const trPr = findChild(source, 'w:trPr');
  if (trPr) row.children.push(structuredClone(trPr));
  for (const cell of cellNodes(source)) {
    const next = makeNode('w:tc');
    const tcPr = findChild(cell, 'w:tcPr');
    if (tcPr) {
      const copy = structuredClone(tcPr);
      const merge = findChild(copy, 'w:vMerge');
      if (merge) copy.children.splice(copy.children.indexOf(merge), 1);
      next.children.push(copy);
    }
    next.children.push(emptyParagraph());
    row.children.push(next);
  }
  return row;
}

function insertAfter(parent: XmlNode, after: XmlNode | undefined, node: XmlNode): void {
  const index = after ? parent.children.indexOf(after) : -1;
  if (index >= 0) parent.children.splice(index + 1, 0, node);
  else parent.children.push(node);
}

function markHeader(row: XmlNode, on: boolean): void {
  const trPr = ensureProperties(row, 'w:trPr');
  const existing = findChild(trPr, 'w:tblHeader');
  if (on && !existing) trPr.children.push(makeNode('w:tblHeader'));
  if (!on && existing) trPr.children.splice(trPr.children.indexOf(existing), 1);
}

/**
 * A structural edit rewrites w:gridCol/w:tcW to equal shares of the text
 * column, so the Word-authored widths no longer describe the table; rendering
 * falls back to the grid percentages that match the saved file.
 */
function resetColumnWidthsPx(block: Extract<WordBlock, { kind: 'table' }>): void {
  block.colWidthsPx = undefined;
  block.tableWidthPx = undefined;
}

/** w:gridCol + every w:tcW carry their share of the width; a merged cell keeps its span. */
function setEqualColumnWidths(table: XmlNode, count: number): void {  if (count <= 0) return;
  const width = Math.round(GRID_TWIPS / count);
  const percent = Math.round(10000 / count);
  let grid = findChild(table, 'w:tblGrid');
  if (!grid) {
    grid = makeNode('w:tblGrid');
    const tablePr = findChild(table, 'w:tblPr');
    const index = tablePr ? table.children.indexOf(tablePr) + 1 : 0;
    table.children.splice(index, 0, grid);
  }
  grid.children = Array.from({ length: count }, () => makeNode('w:gridCol', { 'w:w': String(width) }));
  for (const row of rowNodes(table)) {
    for (const cell of cellNodes(row)) {
      const tcPr = findChild(cell, 'w:tcPr');
      if (!tcPr) continue;
      const tcW = findChild(tcPr, 'w:tcW');
      if (tcW) {
        const span = Number(attr(findChild(tcPr, 'w:gridSpan'), 'w:val') ?? 1);
        tcW.attrs['w:w'] = String(percent * Math.max(1, span));
        tcW.attrs['w:type'] = 'pct';
      }
    }
  }
}

export function insertTableRow(
  document: WordDocument, blockIndex: number, rowIndex: number, where: 'above' | 'below',
): boolean {
  const block = wordTableBlock(document, blockIndex);
  const table = block ? tableNode(block) : null;
  if (!block || !table) return false;
  const rows = rowNodes(table);
  const sourceIndex = Math.min(Math.max(rowIndex, 0), rows.length - 1);
  const source = rows[sourceIndex];
  if (!source) return false;
  const at = where === 'above' ? sourceIndex : sourceIndex + 1;
  const node = cloneRowWithEmptyCells(source);
  const reference = rows[at];
  if (reference) table.children.splice(table.children.indexOf(reference), 0, node);
  else insertAfter(table, source, node);

  const emptyRow: WordParagraph[][] = cellNodes(node).map((cell) => {
    const paragraphNodes = cell.children.filter((child) => child.name === 'w:p');
    // Point the model at the new w:p nodes, so text typed in the new row is saved.
    return paragraphNodes.length
      ? paragraphNodes.map((paragraph) => ({ runs: [], xmlNode: paragraph }))
      : [{ runs: [] }];
  });
  block.rows.splice(at, 0, emptyRow);
  block.rowHeights?.splice(at, 0, 0);
  block.cellStyles?.splice(at, 0, emptyRow.map(() => undefined));
  block.cellSpans = readTableSpans(table);
  const headerRows = block.headerRows ?? 0;
  if (where === 'above' && sourceIndex < headerRows) {
    // Word keeps the header format with the first row: inserting above moves
    // the repeat flag down to the new first row.
    markHeader(source, false);
    markHeader(node, true);
  }
  return true;
}

export function insertTableColumn(
  document: WordDocument, blockIndex: number, rowIndex: number, cellIndex: number, side: 'left' | 'right',
): boolean {
  const block = wordTableBlock(document, blockIndex);
  const table = block ? tableNode(block) : null;
  if (!block || !table) return false;
  const rows = rowNodes(table);
  const sourceRow = rows[Math.min(Math.max(rowIndex, 0), rows.length - 1)];
  const sourceCells = cellNodes(sourceRow);
  if (!sourceCells.length) return false;
  const spans = block.cellSpans ?? readTableSpans(table);
  const sourceIndex = Math.min(Math.max(cellIndex, 0), sourceCells.length - 1);
  // A merged cell is one column boundary: the new column lands after (or before)
  // the whole merge, so gridSpan values in every row stay consistent.
  const startColumn = cellStartColumn(spans, rowIndex, sourceIndex)
    + (side === 'right' ? spanColumns(spans[rowIndex]?.[sourceIndex]) : 0);
  rows.forEach((row, index) => {
    const cells = cellNodes(row);
    const at = insertIndexAtColumn(spans[index], startColumn);
    const source = cells[Math.min(sourceIndex, cells.length - 1)];
    const cell = makeNode('w:tc');
    const tcPr = source ? findChild(source, 'w:tcPr') : null;
    if (tcPr) {
      const copy = structuredClone(tcPr);
      for (const name of ['w:vMerge', 'w:gridSpan']) {
        const node = findChild(copy, name);
        if (node) copy.children.splice(copy.children.indexOf(node), 1);
      }
      cell.children.push(copy);
    }
    const filler = emptyParagraph();
    cell.children.push(filler);
    const reference = cells[at];
    if (reference) row.children.splice(row.children.indexOf(reference), 0, cell);
    else row.children.push(cell);
    const modelRow = block.rows[index];
    if (modelRow) modelRow.splice(Math.min(at, modelRow.length), 0, [{ runs: [], xmlNode: filler }]);
    block.cellStyles?.[index]?.splice(Math.min(at, block.cellStyles[index].length), 0, undefined);
  });
  block.cellSpans = readTableSpans(table);
  const columns = Math.max(1, tableColumnCount(block.cellSpans));
  block.grid = Array.from({ length: columns }, () => Math.round(10000 / columns) / 100);
  setEqualColumnWidths(table, columns);
  resetColumnWidthsPx(block);
  return true;
}

export function deleteTableRow(document: WordDocument, blockIndex: number, rowIndex: number): boolean {  const block = wordTableBlock(document, blockIndex);
  const table = block ? tableNode(block) : null;
  if (!block || !table) return false;
  const rows = rowNodes(table);
  if (rows.length <= 1) return deleteWordTable(document, blockIndex);
  const index = Math.min(Math.max(rowIndex, 0), rows.length - 1);
  const row = rows[index];
  table.children.splice(table.children.indexOf(row), 1);
  block.rows.splice(index, 1);
  block.rowHeights?.splice(index, 1);
  block.cellStyles?.splice(index, 1);
  block.cellSpans = readTableSpans(table);
  // Deleting the repeating header row clears the flag with it.
  if (index < (block.headerRows ?? 0)) block.headerRows = undefined;
  return true;
}

export function deleteTableColumn(
  document: WordDocument, blockIndex: number, rowIndex: number, cellIndex: number,
): boolean {
  const block = wordTableBlock(document, blockIndex);
  const table = block ? tableNode(block) : null;
  if (!block || !table) return false;
  const rows = rowNodes(table);
  const spans = block.cellSpans ?? readTableSpans(table);
  const columns = tableColumnCount(spans);
  if (columns <= 1) return deleteWordTable(document, blockIndex);
  const column = cellStartColumn(spans, Math.min(Math.max(rowIndex, 0), rows.length - 1), cellIndex);
  rows.forEach((row, rowIndexValue) => {
    const cells = cellNodes(row);
    // A merged cell deletes the whole span it covers, like Word.
    const index = cellAtColumn(spans, rowIndexValue, column);
    const cell = index >= 0 ? cells[index] : undefined;
    if (!cell) return;
    row.children.splice(row.children.indexOf(cell), 1);
    block.rows[rowIndexValue]?.splice(index, 1);
    block.cellStyles?.[rowIndexValue]?.splice(index, 1);
  });
  block.cellSpans = readTableSpans(table);
  const remaining = Math.max(1, tableColumnCount(block.cellSpans));
  block.grid = Array.from({ length: remaining }, () => Math.round(10000 / remaining) / 100);
  setEqualColumnWidths(table, remaining);
  resetColumnWidthsPx(block);
  return true;
}

export function deleteWordTable(document: WordDocument, blockIndex: number): boolean {
  const block = document.blocks[blockIndex];
  if (block?.kind !== 'table') return false;
  const root = document.xmlRoot;
  const node = block.xmlNode;
  if (root && node) {
    const parent = findParent(root, node);
    if (parent) parent.children.splice(parent.children.indexOf(node), 1);
  }
  document.blocks.splice(blockIndex, 1);
  return true;
}

function findParent(root: XmlNode, node: XmlNode): XmlNode | null {
  if (root.children.includes(node)) return root;
  for (const child of root.children) {
    const found = findParent(child, node);
    if (found) return found;
  }
  return null;
}

export function setTableHeaderRow(document: WordDocument, blockIndex: number, on: boolean): boolean {
  const block = wordTableBlock(document, blockIndex);
  const table = block ? tableNode(block) : null;
  if (!block || !table) return false;
  const first = rowNodes(table)[0];
  if (!first) return false;
  markHeader(first, on);
  block.headerRows = on ? 1 : undefined;
  return true;
}

export function distributeTableColumns(document: WordDocument, blockIndex: number): boolean {
  const block = wordTableBlock(document, blockIndex);
  const table = block ? tableNode(block) : null;
  if (!block || !table) return false;
  block.cellSpans ??= readTableSpans(table);
  const columns = Math.max(1, tableColumnCount(block.cellSpans));
  block.grid = Array.from({ length: columns }, () => Math.round(10000 / columns) / 100);
  setEqualColumnWidths(table, columns);
  resetColumnWidthsPx(block);
  return true;
}

export function setRowVerticalAlign(
  document: WordDocument, blockIndex: number, rowIndex: number, align: CellVerticalAlign,
): boolean {
  const block = wordTableBlock(document, blockIndex);
  const table = block ? tableNode(block) : null;
  if (!block || !table) return false;
  const rows = rowNodes(table);
  const row = rows[Math.min(Math.max(rowIndex, 0), rows.length - 1)];
  if (!row) return false;
  cellNodes(row).forEach((cell, index) => {
    const tcPr = ensureProperties(cell, 'w:tcPr');
    let vAlign = findChild(tcPr, 'w:vAlign');
    if (!vAlign) {
      vAlign = makeNode('w:vAlign');
      tcPr.children.push(vAlign);
    }
    vAlign.attrs['w:val'] = align;
    const style = block.cellStyles?.[rowIndex]?.[index];
    block.cellStyles ??= block.rows.map((cells) => cells.map(() => undefined));
    block.cellStyles[rowIndex] ??= block.rows[rowIndex].map(() => undefined);
    block.cellStyles[rowIndex][index] = { ...(style ?? {}), valign: align };
  });
  return true;
}

export function setTableAlignment(document: WordDocument, blockIndex: number, align: TableAlign): boolean {
  const block = wordTableBlock(document, blockIndex);
  const table = block ? tableNode(block) : null;
  if (!block || !table) return false;
  const tblPr = ensureProperties(table, 'w:tblPr');
  let jc = findChild(tblPr, 'w:jc');
  if (!jc) {
    jc = makeNode('w:jc');
    tblPr.children.push(jc);
  }
  jc.attrs['w:val'] = align;
  block.align = align;
  return true;
}

export type WordTableStylePreset =
  | 'grid' | 'header' | 'banded' | 'list' | 'shaded' | 'none'
  | 'gridLight' | 'accentHeader' | 'accentStriped' | 'outline'
  | 'bandedColumns' | 'firstCol' | 'lastRow' | 'gridThick'
  | 'tableGrid' | 'lightShadingAccent1' | 'lightListAccent1'
  | 'lightGridAccent1' | 'mediumShadingAccent1'
  | AccentPreset;

/** Built-in Word table styles imported from a real Word document (4 accent each). */
type AccentPreset = string;

/** Gallery entry for one imported Word table style. */
export interface WordAccentTablePreset { preset: string; styleId: string; name: string; labelKey: string }

const STOCK_STYLE_ID_BY_PRESET: Record<string, string> = Object.fromEntries(
  Object.keys(STOCK_TABLE_STYLE_META).map((styleId) => [
    stockPresetName(styleId),
    styleId,
  ]),
);

function stockPresetName(styleId: string): string {
  return styleId.replace(/-/g, '').replace(/^(.)/, (letter) => letter.toLowerCase());
}

/** Gallery entries, one per imported Word style (name and label come from Word). */
export const WORD_ACCENT_TABLE_PRESETS: WordAccentTablePreset[] = Object.entries(STOCK_TABLE_STYLE_META)
  .map(([styleId, meta]) => ({
    preset: stockPresetName(styleId),
    styleId,
    name: meta.name,
    labelKey: STOCK_TABLE_LABEL_KEYS[styleId],
  }));

function accentPresetInfo(preset: WordTableStylePreset): { styleId: string; accent: number } | null {
  const styleId = STOCK_STYLE_ID_BY_PRESET[preset];
  if (!styleId) return null;
  const match = /Accent([1-6])$/.exec(styleId);
  return { styleId, accent: match ? Number(match[1]) : 1 };
}

/** Theme colours a table style can pull from the document (Word links styles to the theme). */
export interface TableStyleTheme {
  accent?: string;
  accents?: string[];
  font?: string;
}

/** Blend a #rrggbb colour towards white (amount 0..1) for banded rows and light borders. */
function tint(hex: string, amount: number): string {
  const value = hex.replace('#', '');
  if (value.length !== 6) return hex;
  const channels = [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16));
  const mixed = channels.map((channel) => Math.round(channel + (255 - channel) * amount));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/**
 * Per-preset table borders, header fill and header typography. `accent: true`
 * means the fill/colour comes from the document theme (Word's style-linked set).
 */
const TABLE_PRESETS: Partial<Record<WordTableStylePreset, {
  edges: { top: string; left: string; bottom: string; right: string; insideH: string; insideV: string };
  headerFill?: string;
  headerAccent?: boolean;
  bandedFill?: string;
  bandedAccent?: boolean;
  headerBold: boolean;
  headerColor?: string;
  headerAccentText?: boolean;
  themeFont?: boolean;
  edgeColor?: string;
  edgeAccentTint?: number;
  /** Column banding (Word's band1Vert) and first/last row/column emphasis. */
  columnBandFill?: string;
  firstColFill?: string;
  firstColBold?: boolean;
  lastRowBold?: boolean;
  lastRowDoubleTop?: boolean;
  outerThick?: boolean;
  edgeSize?: number;
}>> = {
  grid: { edges: { top: 'single', left: 'single', bottom: 'single', right: 'single', insideH: 'single', insideV: 'single' }, headerBold: true },
  header: {
    edges: { top: 'single', left: 'single', bottom: 'single', right: 'single', insideH: 'single', insideV: 'single' },
    headerFill: 'D9E2F3', headerBold: true,
  },
  banded: {
    edges: { top: 'single', left: 'single', bottom: 'single', right: 'single', insideH: 'single', insideV: 'single' },
    headerFill: 'D9E2F3', bandedFill: 'F2F2F2', headerBold: true,
  },
  list: {
    edges: { top: 'nil', left: 'nil', bottom: 'single', right: 'nil', insideH: 'single', insideV: 'nil' },
    headerFill: 'EDEDED', headerBold: true,
  },
  shaded: {
    edges: { top: 'single', left: 'single', bottom: 'single', right: 'single', insideH: 'single', insideV: 'single' },
    headerFill: '2F5496', headerBold: true, headerColor: '#FFFFFF',
  },
  none: {
    edges: { top: 'nil', left: 'nil', bottom: 'nil', right: 'nil', insideH: 'nil', insideV: 'nil' },
    headerBold: false,
  },
  // Theme-linked presets: header/band fills and borders derive from the theme accent.
  gridLight: {
    edges: { top: 'single', left: 'single', bottom: 'single', right: 'single', insideH: 'single', insideV: 'single' },
    headerBold: true, edgeAccentTint: 0.55, themeFont: true,
  },
  accentHeader: {
    edges: { top: 'single', left: 'single', bottom: 'single', right: 'single', insideH: 'single', insideV: 'single' },
    headerAccent: true, headerBold: true, headerAccentText: true, themeFont: true,
  },
  accentStriped: {
    edges: { top: 'single', left: 'single', bottom: 'single', right: 'single', insideH: 'single', insideV: 'single' },
    headerAccent: true, headerBold: true, headerAccentText: true, bandedAccent: true, themeFont: true,
  },
  outline: {
    edges: { top: 'single', left: 'single', bottom: 'single', right: 'single', insideH: 'nil', insideV: 'nil' },
    headerBold: true, themeFont: true,
  },
  bandedColumns: {
    edges: { top: 'single', left: 'single', bottom: 'single', right: 'single', insideH: 'single', insideV: 'single' },
    headerAccent: true, headerBold: true, headerAccentText: true, columnBandFill: 'EAF0F9', themeFont: true,
  },
  firstCol: {
    edges: { top: 'single', left: 'single', bottom: 'single', right: 'single', insideH: 'single', insideV: 'single' },
    headerAccent: true, headerBold: true, headerAccentText: true, firstColFill: 'DCE6F2', firstColBold: true, themeFont: true,
  },
  lastRow: {
    edges: { top: 'single', left: 'single', bottom: 'single', right: 'single', insideH: 'single', insideV: 'single' },
    headerBold: true, lastRowBold: true, lastRowDoubleTop: true, themeFont: true,
  },
  gridThick: {
    edges: { top: 'single', left: 'single', bottom: 'single', right: 'single', insideH: 'single', insideV: 'single' },
    headerBold: true, outerThick: true, edgeSize: 24,
  },
  // Word's own built-in table styles: standard style ids and display names.
  tableGrid: {
    edges: { top: 'single', left: 'single', bottom: 'single', right: 'single', insideH: 'single', insideV: 'single' },
    headerBold: true,
  },
  lightShadingAccent1: {
    edges: { top: 'single', left: 'nil', bottom: 'single', right: 'nil', insideH: 'single', insideV: 'nil' },
    headerAccent: true, headerBold: true, headerAccentText: true, bandedAccent: true,
  },
  lightListAccent1: {
    edges: { top: 'single', left: 'single', bottom: 'single', right: 'single', insideH: 'single', insideV: 'single' },
    headerAccent: true, headerBold: true, headerAccentText: true,
  },
  lightGridAccent1: {
    edges: { top: 'single', left: 'single', bottom: 'single', right: 'single', insideH: 'single', insideV: 'single' },
    headerAccent: true, headerBold: true, headerAccentText: true, bandedAccent: true,
  },
  mediumShadingAccent1: {
    edges: { top: 'single', left: 'nil', bottom: 'single', right: 'nil', insideH: 'single', insideV: 'nil' },
    headerAccent: true, headerBold: true, headerAccentText: true, firstColBold: true,
  },
};

/** Configuration the renderer uses for one imported Word style, resolved against the theme. */
function stockStyleConfig(styleId: string, accents: string[]) {
  const meta = STOCK_TABLE_STYLE_META[styleId];
  if (!meta) return null;
  const edges = {
    top: meta.edges['top'] ?? 'nil',
    left: meta.edges['left'] ?? 'nil',
    bottom: meta.edges['bottom'] ?? 'nil',
    right: meta.edges['right'] ?? 'nil',
    insideH: meta.edges['insideH'] ?? 'nil',
    insideV: meta.edges['insideV'] ?? 'nil',
  };
  const edgeColor = resolveStockFill(meta.edgeFill, accents)?.replace('#', '') ?? 'auto';
  const size = Number(meta.borderSz ?? 4);
  return {
    edges,
    headerFill: resolveStockFill(meta.header, accents),
    bandedFill: resolveStockFill(meta.band, accents),
    tableFill: resolveStockFill(meta.whole, accents),
    headerColor: resolveStockFill(meta.headerText, accents),
    headerBold: meta.headerBold,
    themeFont: false,
    firstColBold: meta.firstColBold,
    lastRowBold: meta.lastRowBold,
    edgeColor,
    edgeSize: Number.isFinite(size) && size > 0 ? size : 4,
    outerThick: false,
    columnBandFill: undefined as string | undefined,
    firstColFill: undefined as string | undefined,
    lastRowDoubleTop: false,
  };
}

/** Theme colour reference from Word (`accent3` + tint/shade) resolved to #rrggbb. */
function resolveStockFill(fill: StockThemeFill | undefined, accents: string[]): string | undefined {
  if (!fill) return undefined;
  const base = fill.theme ? themeBaseColor(fill.theme, accents) : (fill.hex ? `#${fill.hex}` : undefined);
  if (!base) return fill.hex ? `#${fill.hex}` : undefined;
  if (!fill.theme) return base;
  let value = base;
  if (fill.tint) value = tint(value, 1 - Number.parseInt(fill.tint, 16) / 255);
  if (fill.shade) value = shade(value, Number.parseInt(fill.shade, 16) / 255);
  return value;
}

function themeBaseColor(theme: string, accents: string[]): string | undefined {
  if (theme === 'background1' || theme === 'light1') return '#FFFFFF';
  if (theme === 'text1' || theme === 'dark1') return '#000000';
  const accent = /^accent([1-6])$/.exec(theme);
  if (accent) return accents[Number(accent[1]) - 1] ?? accents[0];
  return undefined;
}

/** Darken a #rrggbb colour towards black (Word's `w:themeShade`). */
function shade(hex: string, factor: number): string {
  const value = hex.replace('#', '');
  if (value.length !== 6) return hex;
  const channels = [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16));
  return `#${channels.map((channel) => Math.round(channel * factor).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/** A Word-imported preset uses its own definition; other presets use the local table. */
function tableStyleConfig(preset: WordTableStylePreset) {
  const config = TABLE_PRESETS[preset];
  if (!config) throw new Error(`unknown table preset ${preset}`);
  return config;
}

function tableStyleId(preset: WordTableStylePreset): string {
  const info = accentPresetInfo(preset);
  if (info) return info.styleId;
  return TABLE_STYLE_IDS[preset] ?? `OpenErp${preset[0].toUpperCase()}${preset.slice(1)}`;
}

function tableStyleName(preset: WordTableStylePreset): string | undefined {
  const info = accentPresetInfo(preset);
  if (info) return STOCK_TABLE_STYLE_META[info.styleId]?.name;
  return TABLE_STYLE_NAMES[preset];
}

/**
 * Table Design gallery: Word's presets combine table borders, cell shading and
 * header typography, so every part is written to the model and the w:tbl node.
 */
export function applyTableStyle(  document: WordDocument, blockIndex: number, preset: WordTableStylePreset, theme?: TableStyleTheme,
): boolean {
  const block = wordTableBlock(document, blockIndex);
  const table = block ? tableNode(block) : null;
  if (!block || !table) return false;
  const accents = (theme?.accents?.length ? theme.accents : [theme?.accent ?? '#2F5496']).map((value) => value.toUpperCase());
  const accentInfo = accentPresetInfo(preset);
  const stock = accentInfo ? stockStyleConfig(accentInfo.styleId, accents) : null;
  const config = stock ?? tableStyleConfig(preset);
  const accent = (accents[(accentInfo?.accent ?? 1) - 1] ?? accents[0]).toUpperCase();
  const accent2 = accentInfo ? accent : (accents[1] ?? accent).toUpperCase();
  const themed = config as typeof config & { headerAccent?: boolean; bandedAccent?: boolean; headerAccentText?: boolean; edgeAccentTint?: number };
  const headerFill = themed.headerAccent ? accent : config.headerFill;
  const bandedFill = themed.bandedAccent ? tint(accent2, 0.86) : config.bandedFill;
  const headerColor = themed.headerAccentText ? '#FFFFFF' : config.headerColor;
  const edgeColor = themed.edgeAccentTint !== undefined
    ? tint(accent2, themed.edgeAccentTint).replace('#', '')
    : (config.edgeColor ?? 'auto');
  const tableFill = (config as { tableFill?: string }).tableFill;
  const tblPr = ensureProperties(table, 'w:tblPr');
  // Real OOXML table style: Word keeps the preset in styles.xml and only stores
  // its id on the table, so the file reopens with the style still attached.
  const styleId = ensureTableStylePart(document, preset, {
    headerFill, bandedFill, headerColor, edges: config.edges, edgeColor,
    edgeSize: config.edgeSize, firstColFill: config.firstColFill, firstColBold: config.firstColBold,
    lastRowBold: config.lastRowBold, lastRowDoubleTop: config.lastRowDoubleTop,
    columnBandFill: config.columnBandFill, outerThick: config.outerThick,
  });
  const tblStyle = findChild(tblPr, 'w:tblStyle') ?? makeNode('w:tblStyle');
  tblStyle.attrs['w:val'] = styleId;
  if (!findChild(tblPr, 'w:tblStyle')) tblPr.children.unshift(tblStyle);
  const borders = ensureProperties(tblPr, 'w:tblBorders');
  for (const edge of ['w:top', 'w:left', 'w:bottom', 'w:right', 'w:insideH', 'w:insideV'] as const) {
    const key = edge.slice(2) as keyof typeof config.edges;
    const existing = findChild(borders, edge);
    const node = existing ?? makeNode(edge);
    node.attrs['w:val'] = config.edges[key];
    node.attrs['w:sz'] = String(config.outerThick && (edge === 'w:top' || edge === 'w:left' || edge === 'w:bottom' || edge === 'w:right') ? 24 : (config.edgeSize ?? 4));
    node.attrs['w:space'] = '0';
    node.attrs['w:color'] = edgeColor;
    if (!existing) borders.children.push(node);
  }
  block.borderless = preset === 'none';
  const rowCount = block.rows.length;
  const fillFor = (rowIndex: number, cellIndex: number): string | null => {
    if (rowIndex === 0 && headerFill) return headerFill;
    if (cellIndex === 0 && config.firstColFill) return config.firstColFill;
    if (config.columnBandFill && rowIndex > 0 && cellIndex % 2 === 1) return config.columnBandFill;
    if (bandedFill && rowIndex % 2 === 1) return bandedFill;
    return tableFill ?? null;
  };
  rowNodes(table).forEach((row, rowIndex) => {
    findChildren(row, 'w:tc').forEach((cell, cellIndex) => {
      const fill = fillFor(rowIndex, cellIndex);
      const tcPr = ensureProperties(cell, 'w:tcPr');
      const shade = findChild(tcPr, 'w:shd');
      if (!fill) {
        if (shade) tcPr.children.splice(tcPr.children.indexOf(shade), 1);
        const style = block.cellStyles?.[rowIndex]?.[cellIndex];
        if (style) delete style.fill;
      } else {
        const node = shade ?? makeNode('w:shd');
        node.attrs['w:val'] = 'clear';
        node.attrs['w:color'] = 'auto';
        node.attrs['w:fill'] = fill.replace('#', '');
        if (!shade) tcPr.children.splice(cellPropertyIndex(tcPr), 0, node);
        block.cellStyles ??= [];
        block.cellStyles[rowIndex] ??= [];
        block.cellStyles[rowIndex][cellIndex] = {
          ...(block.cellStyles[rowIndex][cellIndex] ?? {}),
          fill: fill.startsWith('#') ? fill.toUpperCase() : `#${fill.toUpperCase()}`,
        };
      }
      if (rowIndex === 0) {
        for (const paragraph of block.rows[rowIndex]?.[cellIndex] ?? []) {
          setParagraphRunStyle(paragraph, document, {
            bold: config.headerBold,
            ...(headerColor ? { color: headerColor } : {}),
            ...(config.themeFont && theme?.font ? { font: theme.font } : {}),
          });
        }
      } else if (cellIndex === 0 && config.firstColBold) {
        for (const paragraph of block.rows[rowIndex]?.[cellIndex] ?? []) {
          setParagraphRunStyle(paragraph, document, { bold: true, ...(config.themeFont && theme?.font ? { font: theme.font } : {}) });
        }
      }
      if (rowIndex === rowCount - 1 && config.lastRowBold) {
        for (const paragraph of block.rows[rowIndex]?.[cellIndex] ?? []) {
          setParagraphRunStyle(paragraph, document, { bold: true, ...(config.themeFont && theme?.font ? { font: theme.font } : {}) });
        }
      }
      if (config.outerThick) {
        // "Thick Grid": the ring is replaced by 2 px per-cell borders.
        block.cellStyles ??= [];
        block.cellStyles[rowIndex] ??= [];
        block.cellStyles[rowIndex][cellIndex] = {
          ...(block.cellStyles[rowIndex][cellIndex] ?? {}),
          borderTop: true,
          borderBottom: true,
          borderLeft: true,
          borderRight: true,
          borderWidthPx: 2,
          borderColor: '#000',
          borderPainter: true,
        };
      }
      if (preset === 'list') {        // List Table draws horizontal rules only: the cell owns its edges.
        block.cellStyles ??= [];
        block.cellStyles[rowIndex] ??= [];
        block.cellStyles[rowIndex][cellIndex] = {
          ...(block.cellStyles[rowIndex][cellIndex] ?? {}),
          borderTop: true,
          borderBottom: true,
          borderLeft: false,
          borderRight: false,
          borderWidthPx: 1,
          borderColor: '#000',
          borderPainter: true,
        };
      } else {
        // Leaving List Table removes the per-cell edges so the table ring returns.
        const cellBorders = findChild(tcPr, 'w:tcBorders');
        if (cellBorders) tcPr.children.splice(tcPr.children.indexOf(cellBorders), 1);
        const style = block.cellStyles?.[rowIndex]?.[cellIndex];
        if (style?.borderPainter) {
          delete style.borderPainter;
          delete style.borderTop;
          delete style.borderLeft;
          delete style.borderBottom;
          delete style.borderRight;
        }
      }
    });
  });
  return true;
}

const TABLE_STYLE_IDS: Partial<Record<WordTableStylePreset, string>> = {
  grid: 'OpenErpTableGrid',
  header: 'OpenErpTableGridHeader',
  banded: 'OpenErpTableBanded',
  list: 'OpenErpTableList',
  shaded: 'OpenErpTableShaded',
  none: 'OpenErpTableNone',
  gridLight: 'OpenErpTableGridLight',
  accentHeader: 'OpenErpTableAccentHeader',
  accentStriped: 'OpenErpTableAccentStriped',
  outline: 'OpenErpTableOutline',
  bandedColumns: 'OpenErpTableBandedColumns',
  firstCol: 'OpenErpTableFirstCol',
  lastRow: 'OpenErpTableLastRow',
  gridThick: 'OpenErpTableGridThick',
  // Word's built-in style ids, so the file reopens with the standard name.
  tableGrid: 'TableGrid',
  lightShadingAccent1: 'LightShading-Accent1',
  lightListAccent1: 'LightList-Accent1',
  lightGridAccent1: 'LightGrid-Accent1',
  mediumShadingAccent1: 'MediumShading1-Accent1',
};

/** Word's display names for its built-in table styles. */
const TABLE_STYLE_NAMES: Partial<Record<WordTableStylePreset, string>> = {
  tableGrid: 'Table Grid',
  lightShadingAccent1: 'Light Shading Accent 1',
  lightListAccent1: 'Light List Accent 1',
  lightGridAccent1: 'Light Grid Accent 1',
  mediumShadingAccent1: 'Medium Shading 1 Accent 1',
};

interface TableStyleContent {
  headerFill?: string;
  bandedFill?: string;
  headerColor?: string;
  edgeColor: string;
  edges: { top: string; left: string; bottom: string; right: string; insideH: string; insideV: string };
  edgeSize?: number;
  firstColFill?: string;
  firstColBold?: boolean;
  lastRowBold?: boolean;
  lastRowDoubleTop?: boolean;
  columnBandFill?: string;
  outerThick?: boolean;
}

/** Writes (or refreshes) a w:style type="table" for the preset in styles.xml. */
function ensureTableStylePart(document: WordDocument, preset: WordTableStylePreset, content: TableStyleContent): string {
  const entries = document.packageEntries ?? new Map<string, Uint8Array>();
  document.packageEntries = entries;
  const styleId = tableStyleId(preset);
  const bytes = entries.get('word/styles.xml');
  const root: XmlNode = bytes
    ? parseXml(new TextDecoder('utf-8').decode(bytes))
    : {
      name: 'w:styles',
      attrs: { 'xmlns:w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main' },
      text: '',
      children: [],
    };
  const styles = findChild(root, 'w:styles') ?? root;
  const builtinName = tableStyleName(preset);
  const existingIndex = styles.children.findIndex((child) => child.name === 'w:style' && child.attrs['w:styleId'] === styleId);
  // A real Word document may already carry the built-in definition: reuse it
  // instead of overwriting Word's own style with our approximation.
  if (existingIndex < 0 || !builtinName) {
    const stockXml = STOCK_TABLE_STYLES[styleId];
    const style = (stockXml ? parseXml(stockXml) : null) ?? buildTableStyleNode(styleId, preset, content, builtinName);
    if (existingIndex >= 0) styles.children[existingIndex] = style;
    else styles.children.push(style);
    entries.set('word/styles.xml', new TextEncoder().encode(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + serializeXml(root)));
  }
  return styleId;
}

function buildTableStyleNode(
  styleId: string, preset: WordTableStylePreset, content: TableStyleContent, builtinName?: string,
): XmlNode {
  const edges = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'] as const;
  const outer = new Set(['top', 'left', 'bottom', 'right']);
  const shade = (fill: string): XmlNode[] => [{
    name: 'w:tcPr', attrs: {}, text: '', children: [{
      name: 'w:shd',
      attrs: { 'w:val': 'clear', 'w:color': 'auto', 'w:fill': fill.replace('#', '') },
      text: '', children: [],
    }],
  }];
  const boldRun = (color?: string): XmlNode[] => [{
    name: 'w:rPr', attrs: {}, text: '', children: [
      { name: 'w:b', attrs: {}, text: '', children: [] },
      ...(color ? [{ name: 'w:color', attrs: { 'w:val': color.replace('#', '') }, text: '', children: [] }] : []),
    ],
  }];
  const children: XmlNode[] = [
    { name: 'w:name', attrs: { 'w:val': builtinName ?? `Open ERP ${preset}` }, text: '', children: [] },
    ...(builtinName
      ? [
        { name: 'w:basedOn', attrs: { 'w:val': 'TableNormal' }, text: '', children: [] },
        { name: 'w:uiPriority', attrs: { 'w:val': '59' }, text: '', children: [] },
        { name: 'w:unhideWhenUsed', attrs: {}, text: '', children: [] },
      ]
      : []),
    {
      name: 'w:tblPr', attrs: {}, text: '', children: [{
        name: 'w:tblBorders', attrs: {}, text: '', children: edges.map((edge) => ({
          name: `w:${edge}`,
          attrs: {
            'w:val': content.edges[edge],
            'w:sz': String(content.outerThick && outer.has(edge) ? 24 : content.edgeSize ?? 4),
            'w:space': '0', 'w:color': content.edgeColor,
          },
          text: '', children: [],
        })),
      }],
    },
  ];
  if (content.headerFill) {
    children.push({
      name: 'w:tblStylePr', attrs: { 'w:type': 'firstRow' }, text: '',
      children: [...boldRun(content.headerColor), ...shade(content.headerFill)],
    });
  }
  if (content.firstColFill || content.firstColBold) {
    children.push({
      name: 'w:tblStylePr', attrs: { 'w:type': 'firstCol' }, text: '', children: [
        ...(content.firstColBold ? boldRun() : []),
        ...(content.firstColFill ? shade(content.firstColFill) : []),
      ],
    });
  }
  if (content.lastRowBold || content.lastRowDoubleTop) {
    const parts: XmlNode[] = [];
    if (content.lastRowBold) parts.push(...boldRun());
    if (content.lastRowDoubleTop) {
      parts.push({
        name: 'w:tcPr', attrs: {}, text: '', children: [{
          name: 'w:tcBorders', attrs: {}, text: '', children: [{
            name: 'w:top', attrs: { 'w:val': 'double', 'w:sz': '6', 'w:space': '0', 'w:color': 'auto' },
            text: '', children: [],
          }],
        }],
      });
    }
    children.push({ name: 'w:tblStylePr', attrs: { 'w:type': 'lastRow' }, text: '', children: parts });
  }
  if (content.bandedFill) {
    children.push({ name: 'w:tblStylePr', attrs: { 'w:type': 'band1Horz' }, text: '', children: shade(content.bandedFill) });
  }
  if (content.columnBandFill) {
    children.push({ name: 'w:tblStylePr', attrs: { 'w:type': 'band1Vert' }, text: '', children: shade(content.columnBandFill) });
  }
  return { name: 'w:style', attrs: { 'w:type': 'table', 'w:styleId': styleId }, text: '', children };
}

/** Border painter: paints one edge across a cell range (Word paints the selection). */
export function applyTableCellBorder(
  document: WordDocument, blockIndex: number,
  range: { row: number; cell: number; row2: number; cell2: number },
  edge: 'top' | 'left' | 'bottom' | 'right' | 'tl2br' | 'tr2bl', on: boolean, size = 4, widthPx = 1,
  line: 'single' | 'double' = 'single',
): boolean {
  const block = wordTableBlock(document, blockIndex);
  const table = block ? tableNode(block) : null;
  if (!block || !table) return false;
  const rows = rowNodes(table);
  const rowStart = Math.min(range.row, range.row2);
  const rowEnd = Math.max(range.row, range.row2);
  const cellStart = Math.min(range.cell, range.cell2);
  const cellEnd = Math.max(range.cell, range.cell2);
  const key = edge === 'top' ? 'borderTop'
    : edge === 'left' ? 'borderLeft'
      : edge === 'bottom' ? 'borderBottom'
        : edge === 'right' ? 'borderRight'
          : edge === 'tl2br' ? 'diagDown' : 'diagUp';
  let painted = false;
  for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex++) {
    const row = rows[rowIndex];
    if (!row) continue;
    const cells = findChildren(row, 'w:tc');
    for (let cellIndex = cellStart; cellIndex <= cellEnd; cellIndex++) {
      const cell = cells[cellIndex];
      if (!cell) continue;
      const tcPr = ensureProperties(cell, 'w:tcPr');
      const borders = ensureProperties(tcPr, 'w:tcBorders');
      const name = `w:${edge}`;
      const node = findChild(borders, name) ?? makeNode(name);
      node.attrs['w:val'] = on ? line : 'nil';
      node.attrs['w:sz'] = String(size);
      node.attrs['w:space'] = '0';
      node.attrs['w:color'] = 'auto';
      if (!findChild(borders, name)) borders.children.push(node);
      block.cellStyles ??= [];
      block.cellStyles[rowIndex] ??= [];
      const style = block.cellStyles[rowIndex][cellIndex] ?? {};
      style[key] = on;
      style.borderWidthPx = widthPx;
      style.borderColor = style.borderColor ?? '#000';
      style.borderPainter = true;
      block.cellStyles[rowIndex][cellIndex] = style;
      painted = true;
    }
  }
  return painted;
}

/** Writes (or removes) a w:tcPr child in the order Word writes it. */
function setCellProperty(tcPr: XmlNode, name: string, value: string | null): void {
  const existing = findChild(tcPr, name);
  if (value === null) {
    if (existing) tcPr.children.splice(tcPr.children.indexOf(existing), 1);
    return;
  }
  if (existing) {
    existing.attrs['w:val'] = value;
    return;
  }
  const node = makeNode(name, { 'w:val': value });
  const anchor = findChild(tcPr, 'w:gridSpan') ?? findChild(tcPr, 'w:tcW');
  const index = anchor ? tcPr.children.indexOf(anchor) + 1 : 0;
  tcPr.children.splice(index, 0, node);
}

/** w:vMerge with no value means "continue the merge above", like Word writes it. */
function setVerticalMerge(tcPr: XmlNode, mode: 'restart' | 'continue' | null): void {
  const existing = findChild(tcPr, 'w:vMerge');
  if (mode === null) {
    if (existing) tcPr.children.splice(tcPr.children.indexOf(existing), 1);
    return;
  }
  if (mode === 'restart') {
    if (existing) existing.attrs['w:val'] = 'restart';
    else tcPr.children.splice(cellPropertyIndex(tcPr), 0, makeNode('w:vMerge', { 'w:val': 'restart' }));
    return;
  }
  if (existing) {
    delete existing.attrs['w:val'];
    return;
  }
  tcPr.children.splice(cellPropertyIndex(tcPr), 0, makeNode('w:vMerge'));
}

function cellPropertyIndex(tcPr: XmlNode): number {
  const anchor = findChild(tcPr, 'w:gridSpan') ?? findChild(tcPr, 'w:tcW');
  return anchor ? tcPr.children.indexOf(anchor) + 1 : 0;
}

/**
 * Merge Cells: one rectangular run of cells becomes a single cell. Word keeps
 * every paragraph of the run in the first cell and, when the run covers several
 * rows, stores the merge as a w:vMerge restart cell plus one continue cell per
 * row so Word itself can reopen the file.
 */
export function mergeTableCells(
  document: WordDocument, blockIndex: number,
  from: { row: number; cell: number }, to: { row: number; cell: number },
): boolean {
  const block = wordTableBlock(document, blockIndex);
  const table = block ? tableNode(block) : null;
  if (!block || !table) return false;
  const rowStart = Math.min(from.row, to.row);
  const rowEnd = Math.max(from.row, to.row);
  const cellStart = Math.min(from.cell, to.cell);
  const cellEnd = Math.max(from.cell, to.cell);
  if (rowStart === rowEnd && cellStart === cellEnd) return false;
  const rowNodesList = rowNodes(table);
  if (rowEnd >= rowNodesList.length || rowEnd >= block.rows.length) return false;
  const runWidth = cellEnd - cellStart + 1;
  const targets: XmlNode[][] = [];
  for (let index = rowStart; index <= rowEnd; index++) {
    const cells = cellNodes(rowNodesList[index]);
    if (cells.length < cellEnd + 1) return false;
    const run = cells.slice(cellStart, cellEnd + 1);
    // A nested table inside a merged cell cannot be represented by the model yet.
    if (run.some((cell) => findChild(cell, 'w:tbl'))) return false;
    targets.push(run);
  }
  const spans = block.cellSpans ?? readTableSpans(table);
  let colSpan = 0;
  for (let index = cellStart; index <= cellEnd; index++) {
    colSpan += spanColumns(spans[rowStart]?.[index]);
  }

  const paragraphs: WordParagraph[] = [];
  let firstStyle: WordCellStyle | undefined = block.cellStyles?.[rowStart]?.[cellStart];
  for (let index = rowStart; index <= rowEnd; index++) {
    for (let cell = cellStart; cell <= cellEnd; cell++) {
      const cellParagraphs = block.rows[index]?.[cell] ?? [];
      if (index === rowStart && cell === cellStart) firstStyle = block.cellStyles?.[index]?.[cell];
      // Empty filler cells of a merge add nothing but blank paragraphs.
      if (cellParagraphs.some((paragraph) => paragraph.runs.length > 0) || !paragraphs.length) {
        paragraphs.push(...cellParagraphs);
      }
    }
  }
  if (!paragraphs.length) paragraphs.push({ runs: [] });

  const fillers = new Map<number, WordParagraph>();
  for (let index = rowStart; index <= rowEnd; index++) {
    const row = rowNodesList[index]!;
    const run = targets[index - rowStart];
    const at = row.children.indexOf(run[0]);
    for (const cell of run) {
      const position = row.children.indexOf(cell);
      if (position >= 0) row.children.splice(position, 1);
    }
    const kept = run[0];
    const tcPr = ensureProperties(kept, 'w:tcPr');
    setCellProperty(tcPr, 'w:gridSpan', colSpan > 1 ? String(colSpan) : null);
    setVerticalMerge(tcPr, rowEnd > rowStart ? (index === rowStart ? 'restart' : 'continue') : null);
    kept.children = kept.children.filter((child) => child.name === 'w:tcPr');
    if (index === rowStart) {
      paragraphs.forEach((paragraph) => {
        if (paragraph.xmlNode) {
          kept.children.push(paragraph.xmlNode);
          return;
        }
        // A paragraph that only existed in the model (an empty filler cell)
        // gets a node, so text typed into the merged cell reaches the file.
        const node = emptyParagraph();
        paragraph.xmlNode = node;
        kept.children.push(node);
      });
    } else {
      // The continue cell keeps one empty paragraph; the model paragraph points
      // at that node so text typed there is saved like any other cell.
      const filler = emptyParagraph();
      kept.children.push(filler);
      fillers.set(index, { runs: [], xmlNode: filler });
    }
    if (!kept.children.some((child) => child.name === 'w:p')) {
      const filler = emptyParagraph();
      kept.children.push(filler);
      if (index !== rowStart) fillers.set(index, { runs: [], xmlNode: filler });
    }
    row.children.splice(Math.min(at, row.children.length), 0, kept);
  }

  block.rows[rowStart].splice(cellStart, runWidth, paragraphs);
  block.cellStyles?.[rowStart]?.splice(cellStart, runWidth, firstStyle);
  for (let index = rowStart + 1; index <= rowEnd; index++) {
    block.rows[index].splice(cellStart, runWidth, [fillers.get(index) ?? { runs: [] }]);
    block.cellStyles?.[index]?.splice(cellStart, runWidth, undefined);
  }
  block.cellSpans = readTableSpans(table);
  return true;
}

/**
 * Split Cells: the selected cell area becomes `rows` rows of `columns` cells, the
 * way Word's split dialog does it. The text stays in the first cell.
 */
export function splitTableCells(
  document: WordDocument, blockIndex: number, rowIndex: number, cellIndex: number, rows = 1, columns = 1,
): boolean {
  const block = wordTableBlock(document, blockIndex);
  const table = block ? tableNode(block) : null;
  if (!block || !table) return false;
  const rowNodesList = rowNodes(table);
  if (!rowNodesList[rowIndex]) return false;
  const spans = block.cellSpans ?? readTableSpans(table);
  const layout = tableCellLayout(spans, rowIndex, cellIndex);
  const height = Math.max(1, layout.rowSpan);
  const rowCount = Math.max(1, Math.round(rows));
  const columnCount = Math.max(1, Math.round(columns));
  if (layout.colSpan === 1 && height === 1 && rowCount === 1 && columnCount === 1) return false;
  const startColumn = cellStartColumn(spans, rowIndex, cellIndex);
  for (let offset = 0; offset < height && rowIndex + offset < rowNodesList.length; offset++) {
    const index = rowIndex + offset;
    const at = cellAtColumn(spans, index, startColumn);
    const rowCells = cellNodes(rowNodesList[index]);
    const target = at >= 0 ? rowCells[at] : null;
    if (!target) return false;
    const position = rowNodesList[index].children.indexOf(target);
    rowNodesList[index].children.splice(position, 1);
    const tcPr = findChild(target, 'w:tcPr');
    const style = block.cellStyles?.[index]?.[at];
    const modelParagraphs = block.rows[index]?.[at] ?? [{ runs: [] }];
    const newCells: XmlNode[] = [];
    const newModels: WordParagraph[][] = [];
    for (let column = 0; column < columnCount; column++) {
      const cell = makeNode('w:tc');
      const copy = tcPr ? structuredClone(tcPr) : null;
      if (copy) {
        const gridSpan = findChild(copy, 'w:gridSpan');
        if (gridSpan) copy.children.splice(copy.children.indexOf(gridSpan), 1);
        const merge = findChild(copy, 'w:vMerge');
        if (merge) copy.children.splice(copy.children.indexOf(merge), 1);
        const width = findChild(copy, 'w:tcW');
        const value = Number(attr(width, 'w:w') ?? 0);
        if (width && attr(width, 'w:type') === 'pct' && value > 0) {
          width.attrs['w:w'] = String(Math.round(value / columnCount));
        }
        cell.children.push(copy);
      }
      if (column === 0) {
        const paragraphNodes = target.children.filter((child) => child.name === 'w:p');
        paragraphNodes.forEach((node) => cell.children.push(node));
        if (!paragraphNodes.length) {
          const filler = emptyParagraph();
          cell.children.push(filler);
          if (modelParagraphs[0] && !modelParagraphs[0].xmlNode) modelParagraphs[0].xmlNode = filler;
        }
        newModels.push(modelParagraphs);
      } else {
        const filler = emptyParagraph();
        cell.children.push(filler);
        newModels.push([{ runs: [], xmlNode: filler }]);
      }
      newCells.push(cell);
    }
    rowNodesList[index].children.splice(position, 0, ...newCells);
    block.rows[index].splice(at, 1, ...newModels);
    block.cellStyles?.[index]?.splice(at, 1, ...newCells.map(() => style));
  }
  // Splitting into more rows than the cell covers adds empty rows below it.
  for (let extra = height; extra < rowCount; extra++) {
    const sourceRow = rowNodesList[rowIndex + height - 1];
    if (!sourceRow) break;
    const node = cloneRowWithEmptyCells(sourceRow);
    const reference = rowNodesList[rowIndex + height];
    if (reference) table.children.splice(table.children.indexOf(reference), 0, node);
    else insertAfter(table, sourceRow, node);
    const at = rowIndex + height;
    block.rows.splice(at, 0, cellNodes(node).map((cell) => {
      const paragraphNodes = cell.children.filter((child) => child.name === 'w:p');
      return paragraphNodes.length
        ? paragraphNodes.map((paragraph) => ({ runs: [], xmlNode: paragraph }))
        : [{ runs: [] }];
    }));
    block.rowHeights?.splice(at, 0, 0);
    block.cellStyles?.splice(at, 0, cellNodes(node).map(() => undefined));
    rowNodesList.splice(rowIndex + height, 0, node);
  }
  block.cellSpans = readTableSpans(table);
  return true;
}

/** Reads w:jc/w:tblW once per parse so the sheet renders Word's table width. */
export function readTableLayout(table: XmlNode): { align?: TableAlign; widthPct?: number; widthTwips?: number } {
  const tblPr = findChild(table, 'w:tblPr');
  const jc = attr(findChild(tblPr, 'w:jc'), 'w:val');
  const align = jc === 'center' ? 'center' : jc === 'right' || jc === 'end' ? 'right' : jc ? 'left' : undefined;
  const width = findChild(tblPr, 'w:tblW');
  const type = attr(width, 'w:type');
  const value = Number(attr(width, 'w:w') ?? 0);
  let widthPct: number | undefined;
  if (type === 'pct' && value > 0) widthPct = Math.min(100, value / 50);
  else if (type === 'dxa' && value > 0) widthPct = Math.min(100, (value / GRID_TWIPS) * 100);
  const widthTwips = type === 'dxa' && value > 0 ? value : undefined;
  return { align, widthPct, widthTwips };
}


