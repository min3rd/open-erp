import { attr, findChild, findChildren, type XmlNode } from '../binary/xml';
import type { WordBlock, WordCellSpan, WordCellStyle, WordDocument, WordParagraph } from './types';

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

/** w:gridCol + every w:tcW carry their share of the width; a merged cell keeps its span. */
function setEqualColumnWidths(table: XmlNode, count: number): void {
  if (count <= 0) return;
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
  return true;
}

export function deleteTableRow(document: WordDocument, blockIndex: number, rowIndex: number): boolean {
  const block = wordTableBlock(document, blockIndex);
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
export function readTableLayout(table: XmlNode): { align?: TableAlign; widthPct?: number } {
  const tblPr = findChild(table, 'w:tblPr');
  const jc = attr(findChild(tblPr, 'w:jc'), 'w:val');
  const align = jc === 'center' ? 'center' : jc === 'right' || jc === 'end' ? 'right' : jc ? 'left' : undefined;
  const width = findChild(tblPr, 'w:tblW');
  const type = attr(width, 'w:type');
  const value = Number(attr(width, 'w:w') ?? 0);
  let widthPct: number | undefined;
  if (type === 'pct' && value > 0) widthPct = Math.min(100, value / 50);
  else if (type === 'dxa' && value > 0) widthPct = Math.min(100, (value / GRID_TWIPS) * 100);
  return { align, widthPct };
}


