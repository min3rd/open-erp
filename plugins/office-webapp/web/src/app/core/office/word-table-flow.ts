/**
 * Pure row-flow kernel modelled on ONLYOFFICE sdkjs
 * `CTable.prototype.private_RecalculatePage` (word/Editor/Table/TableRecalculate.js):
 * each cell keeps its own page state (cursor/pagesCount/firstPageHasContent),
 * is clipped to the current page bounds, and a row continues on the next page
 * when its cells still have lines left. `TableRowsBottom` records the bottom
 * of the row on each page.
 */

export interface CellLine {
  /** Inclusive character offset where the line starts. */
  start: number;
  /** Exclusive character offset where the line ends. */
  end: number;
  height: number;
}

export interface CellContent {
  lines: CellLine[];
  paddingTop: number;
  paddingBottom: number;
  /** Line indexes where Word stored a page break inside this cell. */
  breakLines?: number[];
}

export interface CellPageState {
  cursor: number;
  pagesCount: number;
  firstPageHasContent: boolean;
}

export interface CellPageSlice {
  start: number;
  end: number;
  clipTop: number;
  clipBottom: number;
}

export interface RowFragment {
  slices: CellPageSlice[];
  height: number;
  clipTop: number;
  clipBottom: number;
  firstPageHasContent: boolean;
  done: boolean;
}

export function newCellState(): CellPageState {
  return { cursor: 0, pagesCount: 0, firstPageHasContent: false };
}

/**
 * Fill one row fragment against `available` pixels.
 * - consumes at least one line per cell when the page is empty (forces progress)
 * - clips each cell to [clipTop, clipBottom] like ONLYOFFICE's Set_ClipInfo
 */
export function flowRow(cells: CellContent[], states: CellPageState[], available: number, breakGate = 0.85): RowFragment {
  const budget = Math.max(1, available);
  const slices: CellPageSlice[] = [];
  let height = 0;
  let firstPageHasContent = false;
  let done = true;

  cells.forEach((cell, index) => {
    const state = states[index] ?? newCellState();
    states[index] = state;
    const padding = (cell.paddingTop ?? 0) + (cell.paddingBottom ?? 0);
    const cellBudget = Math.max(1, budget - padding);
    const start = state.cursor;
    const breakLines = cell.breakLines ?? [];
    let consumed = 0;
    let line = start;
    while (line < cell.lines.length) {
      // Word's own page break inside this cell. The hint is only trusted once the
      // page is nearly full: our line numbering can sit a line or two away from
      // Word's, so an early hint would cut the page short for no reason.
      if (consumed > 0 && consumed >= cellBudget * breakGate && breakLines.includes(line)) break;
      const next = cell.lines[line].height;
      if (consumed + next > cellBudget && consumed > 0) break;
      if (consumed + next > cellBudget && consumed === 0 && state.firstPageHasContent) break;
      consumed += next;
      line++;
      if (consumed >= cellBudget) break;
    }
    if (line === start && start < cell.lines.length) {
      // Force one line when nothing fits at the top of a page.
      consumed = cell.lines[start].height;
      line = start + 1;
    }
    state.cursor = line;
    const cellHeight = consumed + (consumed > 0 ? padding : 0);
    if (consumed > 0) {
      state.pagesCount += 1;
      state.firstPageHasContent = true;
      firstPageHasContent = true;
    }
    // Keep one slice per cell, including cells with no line on this page, so
    // a later cell's slice is never shifted onto a finished cell.
    slices.push({
      start,
      end: line,
      clipTop: 0,
      clipBottom: line > start ? cellHeight : 0,
    });
    height = Math.max(height, cellHeight);
    if (line < cell.lines.length) done = false;
  });

  return {
    slices,
    height,
    clipTop: 0,
    clipBottom: Math.min(height, budget),
    firstPageHasContent,
    done,
  };
}

export interface TableRowLayout {
  row: number;
  fragment: RowFragment;
  page: number;
  /** Bottom of the row content on this page (ONLYOFFICE TableRowsBottom). */
  bottom: number;
}

export function paginateTableRows(
  rows: CellContent[][],
  contentHeight: number,
): TableRowLayout[] {
  const states = rows.map((row) => row.map(() => newCellState()));
  const layout: TableRowLayout[] = [];
  const bottoms: number[] = rows.map(() => 0);
  let page = 0;
  let used = 0;
  let row = 0;
  let guard = 0;
  const limit = rows.length * 1000 + 10000;

  while (row < rows.length) {
    if (guard++ > limit) throw new Error('TABLE_FLOW_DOES_NOT_CONVERGE');
    const available = contentHeight - used;
    if (available < 2 && used > 0) {
      page++;
      used = 0;
      continue;
    }
    const fragment = flowRow(rows[row], states[row], available);
    layout.push({ row, fragment, page, bottom: used + fragment.height });
    bottoms[row] = Math.max(bottoms[row], used + fragment.height);
    used += fragment.height;
    if (fragment.done) {
      row++;
    } else {
      page++;
      used = 0;
    }
  }
  return layout;
}

export interface CellLineBuild {
  lines: CellLine[];
  /** Character offset of every line start, plus one terminator. */
  offsets: number[];
  paragraphStarts: number[];
  paddingTop: number;
}

/**
 * Turns a cell's paragraphs into the line list row flow consumes. Every entry of
 * `lines` — including the gap a paragraph spacing adds — gets a matching offset,
 * because pagination maps line indexes back to character offsets when it slices
 * the cell at a page boundary.
 */
export function buildCellLines(
  paragraphs: Array<{ runs: Array<{ text?: string }>; spaceBeforePx?: number; spaceAfterPx?: number }>,
  wrap: (text: string, paragraphIndex: number) => Array<{ start: number; end: number }>,
  lineHeightOf: (paragraphIndex: number) => number,
): CellLineBuild {
  const lines: CellLine[] = [];
  const offsets: number[] = [];
  const paragraphStarts: number[] = [];
  let cursor = 0;
  let paddingTop = 0;
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const text = paragraph.runs.map((run) => run.text ?? '').join('');
    const lineHeight = Math.max(1, lineHeightOf(paragraphIndex));
    paragraphStarts.push(cursor);
    if (paragraphIndex === 0) paddingTop = paragraph.spaceBeforePx ?? 0;
    const wrapped = text.length ? wrap(text, paragraphIndex) : [{ start: 0, end: 0 }];
    for (const line of wrapped) {
      lines.push({ start: cursor + line.start, end: cursor + line.end, height: lineHeight });
      offsets.push(cursor + line.start);
    }
    cursor += text.length + 1;
    // Word adds a paragraph's space-after inside the cell too, including the
    // last paragraph: rows with a 8 pt after are ~11 px taller than the lines.
    const spacing = paragraph.spaceAfterPx ?? 0;
    if (spacing > 0) {
      lines.push({ start: cursor - 1, end: cursor - 1, height: spacing });
      offsets.push(cursor - 1);
    }
  });
  if (!lines.length) {
    lines.push({ start: 0, end: 0, height: Math.max(1, lineHeightOf(0)) });
    offsets.push(0);
  }
  offsets.push(cursor);
  return { lines, offsets, paragraphStarts, paddingTop };
}
