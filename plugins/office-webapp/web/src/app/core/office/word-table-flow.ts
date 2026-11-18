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
export function flowRow(cells: CellContent[], states: CellPageState[], available: number): RowFragment {
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
    let consumed = 0;
    let line = start;
    while (line < cell.lines.length) {
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
