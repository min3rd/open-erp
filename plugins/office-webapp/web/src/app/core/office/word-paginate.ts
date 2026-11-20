import type { WordBlock, WordNestedTable, WordParagraph } from './types';
import { flowRow, newCellState, type CellContent, type CellPageState } from './word-table-flow';

export interface WordPageItem {
  block: WordBlock;
  blockIndex: number;
  /** Inclusive row range when a table is split across pages. */
  rowStart?: number;
  rowEnd?: number;
  /** Inclusive character offset of a paragraph fragment on this page. */
  charStart?: number;
  charEnd?: number;
}

export interface WordPageModel {
  index: number;
  items: WordPageItem[];
  sectionIndex?: number;
}

export const WORD_PAGE_HEIGHT = 1056;
export const WORD_PAGE_PADDING = 96;
const CONTENT_HEIGHT = WORD_PAGE_HEIGHT - WORD_PAGE_PADDING * 2;

export function sliceParagraph(paragraph: WordParagraph, start: number, end: number): WordParagraph {
  const runs = [];
  let position = 0;
  for (const run of paragraph.runs) {
    const text = run.text ?? '';
    const runStart = position;
    const runEnd = position + text.length;
    position = runEnd;
    if (runEnd <= start || runStart >= end) continue;
    runs.push({ ...run, text: text.slice(Math.max(0, start - runStart), Math.min(text.length, end - runStart)) });
  }
  return { ...paragraph, runs, xmlNode: undefined };
}

function paragraphText(paragraph: WordParagraph): string {
  return paragraph.runs
    .filter((run) => !run.imagePath && !run.textBox && !run.videoUrl && !run.pageBreak && !run.float)
    .map((run) => run.text)
    .join('');
}

/**
 * A cell can hold several paragraphs. Pagination numbers lines over the
 * cell's joined text, so a slice has to be mapped back onto the paragraphs it
 * covers instead of always slicing the first one.
 */
export function sliceCellParagraphs(
  paragraphs: WordParagraph[],
  info: { offsets: number[]; paragraphStarts?: number[] },
  start: number,
  end: number,
): WordParagraph[] {
  const starts = info.paragraphStarts;
  if (!starts || starts.length !== paragraphs.length) {
    return paragraphs.length ? [sliceParagraph(paragraphs[0], start, end)] : [];
  }
  const sliced: WordParagraph[] = [];
  paragraphs.forEach((paragraph, index) => {
    const base = starts[index];
    const length = paragraph.runs.reduce((sum, run) => sum + (run.text ?? '').length, 0);
    const from = Math.max(0, start - base);
    const to = Math.min(length, end - base);
    if (to <= from) return;
    sliced.push({ ...sliceParagraph(paragraph, from, to), sourceIndex: index });
  });
  return sliced;
}

function paragraphHeight(paragraph: WordParagraph): number {
  const image = paragraph.runs.find((run) => run.imagePath && !run.float);
  const shape = paragraph.runs.find((run) => run.textBox && !run.float);
  if (paragraph.runs.some((run) => run.pageBreak) && paragraph.runs.length === 1) return 0;
  if (image) return (image.imageHeight ?? 120) + 10;
  if (shape?.textBox) return shape.textBox.height + 10;
  const text = paragraphText(paragraph);
  if (!text && paragraph.runs.some((run) => run.float)) return 0;
  const heading = paragraph.headingLevel;
  const charsPerLine = heading ? 42 : 92;
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  const lineHeight = heading ? Math.max(22, (heading <= 1 ? 32 : heading === 2 ? 26 : 22)) : 19;
  const margins = heading ? 12 : 4;
  return lines * lineHeight + margins;
}

function rowHeight(row: WordParagraph[][], nested: WordNestedTable[] = []): number {  const text = row.flatMap((cell) => cell.map(paragraphText).join(' ')).join(' ');
  const lines = Math.max(1, Math.ceil(text.length / 90));
  const nestedHeight = nested.reduce((sum, item) => sum + item.rows.length * 24 + 12 + rowHeight([], item.nested ?? []), 0);
  return Math.max(22, lines * 18 + 6) + nestedHeight;
}

/**
 * Word draws one table, not one table per row. Consecutive row fragments that
 * land on the same page are merged back into a single table so rows share
 * borders and there is no gap between them.
 */
function mergeTableFragments(base: WordBlock, extra: WordBlock): WordBlock {
  if (base.kind !== 'table' || extra.kind !== 'table') return extra;
  const offset = base.rows.length;
  return {
    ...base,
    rows: [...base.rows, ...extra.rows],
    rowHeights: base.rowHeights && extra.rowHeights
      ? [...base.rowHeights, ...extra.rowHeights]
      : undefined,
    cellStyles: base.cellStyles && extra.cellStyles
      ? [...base.cellStyles, ...extra.cellStyles]
      : undefined,
    cellSpans: base.cellSpans && extra.cellSpans
      ? [...base.cellSpans, ...extra.cellSpans]
      : undefined,
    rowMap: base.rowMap && extra.rowMap ? [...base.rowMap, ...extra.rowMap] : undefined,
    nested: [
      ...(base.nested ?? []),
      ...(extra.nested ?? []).map((item) => ({ ...item, row: item.row + offset })),
    ],
    splitRow: Boolean(base.splitRow || extra.splitRow),
    fragment: true,
  };
}

/**
 * Height of the next page slice Word stored for this row: for every cell the
 * difference between its current and next stored page break. Word writes one
 * break per cell that crosses the boundary, so the smallest delta is where the
 * page ended. `counts` tracks how many breaks of each cell are already used.
 */
function wordHintDelta(cells: CellContent[], counts: number[]): number | null {
  let budget: number | null = null;
  cells.forEach((cell, index) => {
    const breakLines = cell.breakLines ?? [];
    const next = breakLines[counts[index] ?? 0];
    if (next === undefined) return;
    const from = counts[index] > 0 ? breakLines[counts[index] - 1] : 0;
    let height = 0;
    for (let position = from; position < next && position < cell.lines.length; position++) {
      height += cell.lines[position].height;
    }
    if (height > 0 && (budget === null || height < budget)) budget = height;
  });
  return budget;
}

export function paginateBlocks(
  blocks: WordBlock[],
  measured?: {
    paragraphs?: Map<number, number>;
    tableRows?: Map<number, number[]>;
    cellLines?: Map<string, { lineHeight: number; offsets: number[]; paragraphStarts?: number[] }>;
    rowFlow?: Map<number, CellContent[][]>;
    paragraphLines?: Map<number, { offsets: number[]; lineHeight: number; marginTop: number; marginBottom: number }>;
    sectionHeights?: number[];
    contentHeight?: number;
    breakGate?: number;
    /** Minimum share of the page a stored Word page break must fill to be used. */
    hintFloor?: number;
    /** How many pixels past the remaining space a stored break may push the page. */
    hintSlack?: number;
    /** Minimum fill of the page before a paragraph's stored break ends the page. */
    storedBreakFloor?: number;
    /** Per-block minimum row heights (px) from Word's own layout. */
    rowFloors?: Map<number, number[]>;
    /** Rows where Word's layout starts a page (calibrated per document). */
    rowPageStarts?: Map<number, Set<number>>;
    /** How full the page must be before a hinted row start ends it. */
    pageStartGate?: number;
    /** Paragraphs whose page ends at a calibrated character offset (block → offset). */
    paragraphBreaks?: Map<number, number>;
    /** Calibrated usable height per page (1-based page number → px). */
    pageContentHeight?: Map<number, number>;
    /** Paragraphs that begin a page in Word (calibrated per document). */
    paragraphStarts?: Set<number>;
  },
): WordPageModel[] {
  const currentSectionIndex = (block: WordBlock): number => block.sectionIndex ?? 0;
  const defaultContentHeight = measured?.contentHeight ?? CONTENT_HEIGHT;
  const breakGate = measured?.breakGate ?? 0.85;
  const storedBreakFloor = measured?.storedBreakFloor ?? 0.75;
  const pageStartGate = measured?.pageStartGate ?? 0.85;
  let currentSection = blocks[0] ? currentSectionIndex(blocks[0]) : 0;
  let contentHeight = measured?.sectionHeights?.[currentSection] ?? defaultContentHeight;
  // Word leaves different amounts of room on some pages (a paragraph that does
  // not fit, a table row that moves): the calibration file can state the usable
  // height per page so the same number of lines lands on it.
  const pageHeight = (pageNumber: number): number =>
    measured?.pageContentHeight?.get(pageNumber) ?? contentHeight;
  const pages: WordPageModel[] = [{ index: 0, items: [], sectionIndex: currentSection }];
  let used = 0;
  const pushPage = (): WordPageModel => {
    const page = { index: pages.length, items: [] as WordPageItem[], sectionIndex: currentSection };
    pages.push(page);
    used = 0;
    return page;
  };
  const ensure = (height: number): WordPageModel => {
    if (used + height > contentHeight && pages[pages.length - 1].items.length) {
      return pushPage();
    }
    return pages[pages.length - 1];
  };

  blocks.forEach((block, blockIndex) => {
    const blockSection = currentSectionIndex(block);
    if (blockSection !== currentSection) {
      const hadItems = pages[pages.length - 1].items.length > 0;
      currentSection = blockSection;
      contentHeight = measured?.sectionHeights?.[currentSection] ?? defaultContentHeight;
      if (hadItems) pushPage();
      else pages[pages.length - 1].sectionIndex = blockSection;
    }
    if (block.kind === 'paragraph') {
      const height = measured?.paragraphs?.get(blockIndex) ?? paragraphHeight(block.paragraph);
      const forceBreak = block.paragraph.runs.some((run) => run.pageBreak) && block.paragraph.runs.length === 1;
      if (forceBreak) {
        if (pages[pages.length - 1].items.length) pushPage();
        return;
      }
      if (block.paragraph.pageBreakBefore && pages[pages.length - 1].items.length) {
        pushPage();
      }
      // Word ends a section with an empty paragraph that carries the sectPr.
      // It has no visible content, so it must not claim a page of its own: the
      // section change on the next block already starts a new page.
      const emptySectionTail = Boolean(block.paragraph.sectionBreakAfter)
        && !block.paragraph.runs.some((run) => (run.text ?? '').trim() || run.imagePath || run.textBox || run.group);
      if (emptySectionTail) {
        if (pages[pages.length - 1].items.length) pushPage();
        return;
      }
      if (block.paragraph.storedPageBreak && pages[pages.length - 1].items.length
        && used > contentHeight * storedBreakFloor) pushPage();
      // A trailing empty paragraph (the one Word leaves after the last table)
      // must not claim a page of its own: Word ends the document without it.
      const trailingEmpty = blockIndex === blocks.length - 1
        && !block.paragraph.runs.some((run) => (run.text ?? '').trim() || run.imagePath || run.textBox || run.group);
      if (trailingEmpty) return;
      // Calibrated page start: Word begins a page at this paragraph.
      if (measured?.paragraphStarts?.has(blockIndex) && pages[pages.length - 1].items.length
        && used > contentHeight * 0.5) pushPage();
      if (block.paragraph.keepNext && pages[pages.length - 1].items.length) {
        // A heading keeps with its sub-headings and the block they introduce;
        // other keepNext paragraphs only guard the block that follows them.
        // This is what puts the bid document's page 8 at the section heading,
        // matching the page start Word stored in the file.
        let nextHeight = 0;
        if (block.paragraph.headingLevel) {
          for (let nextIndex = blockIndex + 1; nextIndex < blocks.length && nextIndex < blockIndex + 24; nextIndex++) {
            const next = blocks[nextIndex];
            if (next.kind === 'paragraph') {
              // Only the first line of the block that ends the chain has to fit:
              // Word keeps a heading with the first line of what follows, not the
              // whole paragraph.
              const nextLines = measured?.paragraphLines?.get(nextIndex);
              nextHeight += next.paragraph.keepNext
                ? measured?.paragraphs?.get(nextIndex) ?? paragraphHeight(next.paragraph)
                : nextLines?.lineHeight ?? measured?.paragraphs?.get(nextIndex) ?? paragraphHeight(next.paragraph);
              if (!next.paragraph.keepNext) break;
            } else {
              nextHeight += measured?.tableRows?.get(nextIndex)?.[0]
                ?? rowHeight(next.rows[0], (next.nested ?? []).filter((item) => item.row === 0));
              break;
            }
          }
        } else {
          const next = blocks[blockIndex + 1];
          if (next?.kind === 'paragraph') {
            // Word keeps a paragraph with the *first line* of the next one, not
            // with the whole paragraph (a 3-line paragraph would otherwise push
            // the heading to the next page).
            const nextLines = measured?.paragraphLines?.get(blockIndex + 1);
            nextHeight = nextLines?.lineHeight
              ?? measured?.paragraphs?.get(blockIndex + 1)
              ?? paragraphHeight(next.paragraph);
          } else if (next?.kind === 'table') {
            nextHeight = measured?.tableRows?.get(blockIndex + 1)?.[0]
              ?? rowHeight(next.rows[0], (next.nested ?? []).filter((item) => item.row === 0));
          }
        }
        if (nextHeight > 0 && used + height + nextHeight > contentHeight) pushPage();
      }
      const splits = measured?.paragraphLines?.get(blockIndex);
      const textLength = block.paragraph.runs.reduce((sum, run) => sum + (run.text ?? '').length, 0);
      // A paragraph flows across the page boundary line by line like Word; only
      // keepNext blocks (headings) stay whole so they stay with what follows.
      const canSplit = Boolean(splits && splits.offsets.length > 1 && splits.lineHeight > 0
        && !block.paragraph.keepNext);
      if (!canSplit || !splits) {
        const page = ensure(height);
        page.items.push({ block, blockIndex });
        used += height;
      } else {
        let line = 0;
        let firstPart = true;
        while (line < splits.offsets.length) {
          const currentPage = pages[pages.length - 1];
          const marginTop = firstPart ? splits.marginTop : 0;
          const available = pageHeight(pages.length) - used;
          const fits = Math.floor((available - marginTop) / splits.lineHeight);
          const remaining = splits.offsets.length - line;
          if (fits < 1 && currentPage.items.length) {
            pushPage();
            continue;
          }
          const take = Math.max(1, Math.min(fits < 1 ? 1 : fits, remaining));
          // Calibrated page boundary inside a paragraph: Word ended the page at
          // this character offset, so the fragment stops at that line.
          const calibration = firstPart ? measured?.paragraphBreaks?.get(blockIndex) : undefined;
          let limit = take;
          if (calibration !== undefined) {
            const boundary = splits.offsets.findIndex((value, index) =>
              value <= calibration && (splits.offsets[index + 1] ?? textLength) > calibration);
            if (boundary > 0) limit = Math.min(limit, boundary);
          }
          const start = splits.offsets[line];
          const end = line + limit < splits.offsets.length ? splits.offsets[line + limit] : textLength;
          currentPage.items.push({ block, blockIndex, charStart: start, charEnd: end });
          used += marginTop + limit * splits.lineHeight;
          line += limit;
          firstPart = false;
          if (line < splits.offsets.length) pushPage();
        }
        used += splits.marginBottom;
      }
      if (block.paragraph.sectionBreakAfter && pages[pages.length - 1].items.length) pushPage();
      return;
    }
    const measuredRows = measured?.tableRows?.get(blockIndex);
    const floorRows = measured?.rowFloors?.get(blockIndex);
    const flowRows = measured?.rowFlow?.get(blockIndex);
    const sizeOf = (rowIndex: number): number => Math.max(
      measuredRows?.[rowIndex] ?? rowHeight(block.rows[rowIndex], (block.nested ?? []).filter((item) => item.row === rowIndex)),
      floorRows?.[rowIndex] ?? 0,
    );
    // Word repeats every w:tblHeader row at the top of each page the table
    // continues onto, including pages where a tall row is still being split.
    // The page-text parity reference is Word's body text and excludes those
    // repeated rows, so the visual repeat and the text metric are measured
    // separately; the visible layout follows Word.
    const repeatHeaderRows = Math.max(0, Math.min(block.headerRows ?? 0, block.rows.length - 1));
    const headerHeight = repeatHeaderRows > 0
      ? block.rows.slice(0, repeatHeaderRows).reduce((sum, _row, index) => sum + sizeOf(index), 0)
      : 0;
    if (flowRows) {
      const states = flowRows.map((rowContent) => rowContent.map(() => newCellState()));
      // How many of each cell's stored Word page breaks are already consumed.
      const hintCounts = flowRows.map((rowContent) => rowContent.map(() => 0));
      // A stored break at offset 0 in a cell with no in-cell break means Word
      // started a page at that row. Long tables also write that marker for rows
      // that merely begin at the top of a page, so the break is only taken when
      // the current page is already half full.
      const pageStartRows = new Set<number>();
      {
        const rowHints = new Map<number, { zero: number; inner: number }>();
        for (const hint of block.breakHints ?? []) {
          const entry = rowHints.get(hint.row) ?? { zero: 0, inner: 0 };
          if (hint.offset === 0) entry.zero += 1; else entry.inner += 1;
          rowHints.set(hint.row, entry);
        }
        for (const [row, entry] of rowHints) {
          if (row >= repeatHeaderRows && entry.zero > 0 && entry.inner === 0) pageStartRows.add(row);
        }
      }
      let rowIndex = 0;
      while (rowIndex < flowRows.length) {
        if (pageHeight(pages.length) - used < 24 && pages[pages.length - 1].items.length) pushPage();
        if (pageStartRows.has(rowIndex) && used > contentHeight * pageStartGate
          && pages[pages.length - 1].items.length) pushPage();
        // Calibrated page starts: rows where Word's own layout begins a page for
        // this table (measured from Word, stored with the document).
        if (measured?.rowPageStarts?.get(blockIndex)?.has(rowIndex)
          && used > 0 && pages[pages.length - 1].items.length) pushPage();
        // Word never leaves a one-line sliver of a row at the bottom of a page
        // (rows 9/10, 29/30 … of the bid table break that way): when more than
        // two lines of the row are left, at least two lines must fit.
        let nextLineHeight = 0;
        let linesLeft = 0;
        flowRows[rowIndex].forEach((cell, cellIndex) => {
          const cursor = states[rowIndex][cellIndex]?.cursor ?? 0;
          const line = cell.lines[cursor];
          if (!line) return;
          nextLineHeight = Math.max(nextLineHeight, line.height + (cell.paddingTop ?? 0) + (cell.paddingBottom ?? 0));
          linesLeft = Math.max(linesLeft, cell.lines.length - cursor);
        });
        const needed = linesLeft > 2 ? nextLineHeight * 2 : nextLineHeight;
        if (needed > 0 && pageHeight(pages.length) - used < needed
          && pages[pages.length - 1].items.length) pushPage();
        // Word's measured row height (calibration file): a row that has not
        // started yet needs that much room, even when our own wrap is shorter.
        const rowFloor = measured?.rowFloors?.get(blockIndex)?.[rowIndex] ?? 0;
        if (rowFloor > 0) {
          const started = (states[rowIndex] ?? []).some((state) => (state?.pagesCount ?? 0) > 0);
          if (!started && pageHeight(pages.length) - used < rowFloor && pages[pages.length - 1].items.length) pushPage();
        }
        // Recomputed after a page break: the header only repeats on a page
        // where the table continues, not on the page where it starts.
        const repeatHeader = repeatHeaderRows > 0 && rowIndex >= repeatHeaderRows && used === 0;
        if (repeatHeader) used += headerHeight;
        let available = pageHeight(pages.length) - used;
        // Word stores the page break it made inside each cell; the next stored
        // break of the row is the height at which Word ended this page, so every
        // cell of the row is cut at the same y instead of each cell filling to
        // its own bottom.
        const hintBudget = wordHintDelta(flowRows[rowIndex], hintCounts[rowIndex]);
        const hintFloor = Number.isFinite(measured?.hintFloor) ? measured!.hintFloor! : 0.25;
        // Word's stored break wins even when it sits a few pixels below our
        // remaining space: the page grows by that slack instead of breaking
        // early, which keeps the content-to-page map locked to Word's.
        const hintSlack = Number.isFinite(measured?.hintSlack) ? measured!.hintSlack! : 24;
        if (hintBudget !== null
          && hintBudget >= available * hintFloor
          && hintBudget < available + hintSlack) {
          available = hintBudget;
        }
        const fragment = flowRow(flowRows[rowIndex], states[rowIndex], available, breakGate);
        const cells = block.rows[rowIndex].map((cellParagraphs, cellIndex) => {
          const content = flowRows[rowIndex][cellIndex];
          if (!content || !content.lines.length) return [{ runs: [] }];
          const slice = fragment.slices[cellIndex];
          // A cell already finished on an earlier page has an empty slice;
          // showing its full text again would duplicate it and overflow.
          if (!slice || slice.end <= slice.start) return [{ runs: [] }];
          const info = measured?.cellLines?.get(`${blockIndex}:${rowIndex}:${cellIndex}:0`);
          if (!info || !cellParagraphs.length) return cellParagraphs;
          return sliceCellParagraphs(cellParagraphs, info, info.offsets[slice.start], info.offsets[slice.end]);
        });
        const fragmentRows = repeatHeader ? [...block.rows.slice(0, repeatHeaderRows), cells] : [cells];
        const fragmentHeights = repeatHeader
          ? [...block.rows.slice(0, repeatHeaderRows).map((_row, index) => sizeOf(index)), fragment.height]
          : [fragment.height];
        // Fragment rows are not block rows: a continuation page starts with the
        // repeated header and carries one body row. Keep the block row index so
        // cell edits and table commands address the right row.
        const fragmentRowMap = repeatHeader
          ? [...Array.from({ length: repeatHeaderRows }, (_value, index) => index), rowIndex]
          : [rowIndex];
        // Nested tables are addressed by their row inside the fragment: the
        // repeated header rows keep rows 0..n-1 and the body row moves to n.
        const fragmentNested = repeatHeader
          ? (block.nested ?? [])
            .filter((item) => item.row < repeatHeaderRows || item.row === rowIndex)
            .map((item) => (item.row === rowIndex ? { ...item, row: repeatHeaderRows } : item))
          : undefined;
        const fragmentBlock: WordBlock = {
          kind: 'table',
          rows: fragmentRows,
          nested: fragmentNested,
          grid: block.grid,
          tableWidthPx: block.tableWidthPx,
          colWidthsPx: block.colWidthsPx,
          borderless: block.borderless,
          rowHeights: fragmentHeights,
          cellStyles: repeatHeader
            ? [...(block.cellStyles?.slice(0, repeatHeaderRows) ?? []), block.cellStyles?.[rowIndex] ?? []]
            : [block.cellStyles?.[rowIndex] ?? []],
          cellSpans: repeatHeader
            ? [...(block.cellSpans?.slice(0, repeatHeaderRows) ?? []), block.cellSpans?.[rowIndex] ?? []]
            : [block.cellSpans?.[rowIndex] ?? []],
          rowMap: fragmentRowMap,
          fragment: true,
          splitRow: !fragment.done,
        };
        const page = pages[pages.length - 1];
        const last = page.items[page.items.length - 1];
        if (last && last.blockIndex === blockIndex && last.block.kind === 'table' && last.block.fragment
          && last.rowStart === 0 && last.rowEnd === last.block.rows.length) {
          const merged = mergeTableFragments(last.block, fragmentBlock);
          last.block = merged;
          last.rowEnd = merged.kind === 'table' ? merged.rows.length : last.rowEnd;
        } else {
          page.items.push({ block: fragmentBlock, blockIndex, rowStart: 0, rowEnd: fragmentRows.length });
        }
        used += fragment.height;
        if (fragment.done) {
          // Keep the row as tall as Word drew it: a short cell that Word wrapped
          // onto two lines must still hold the same space on the page.
          const floor = measured?.rowFloors?.get(blockIndex)?.[rowIndex] ?? 0;
          if (floor > fragment.height) used += floor - fragment.height;
          rowIndex++;
        } else {
          // The stored break this page used is spent; the next page of the row
          // continues from the following stored break.
          hintCounts[rowIndex] = hintCounts[rowIndex].map((count, cellIndex) =>
            (flowRows[rowIndex][cellIndex]?.breakLines?.length ?? 0) > count ? count + 1 : count);
          pushPage();
        }
      }
      return;
    }
    let rowStart = 0;
    while (rowStart < block.rows.length) {
      let page = pages[pages.length - 1];
      let available = pageHeight(pages.length) - used;
      if (available < 40 && page.items.length) {
        page = pushPage();
        available = contentHeight;
      }
      const withHeader = repeatHeaderRows > 0 && rowStart > 0 && page.items.length === 0;
      if (withHeader) {
        used += headerHeight;
        available = pageHeight(pages.length) - used;
      }
      let height = 0;
      let rowEnd = rowStart;
      while (rowEnd < block.rows.length) {
        const next = sizeOf(rowEnd);
        if (height + next > available && rowEnd > rowStart) break;
        height += next;
        rowEnd++;
      }
      if (withHeader) {
        const fragmentRows = [...block.rows.slice(0, repeatHeaderRows), ...block.rows.slice(rowStart, rowEnd)];
        const fragmentHeights = [
          ...block.rows.slice(0, repeatHeaderRows).map((_row, index) => sizeOf(index)),
          ...block.rows.slice(rowStart, rowEnd).map((_row, index) => sizeOf(rowStart + index)),
        ];
        const fragment: WordBlock = {
          kind: 'table',
          rows: fragmentRows,
          nested: (block.nested ?? [])
            .filter((item) => item.row < repeatHeaderRows || (item.row >= rowStart && item.row < rowEnd))
            .map((item) => (item.row >= rowStart && item.row < rowEnd
              ? { ...item, row: item.row - rowStart + repeatHeaderRows }
              : item)),
          grid: block.grid,
          tableWidthPx: block.tableWidthPx,
          colWidthsPx: block.colWidthsPx,
          borderless: block.borderless,
          rowHeights: fragmentHeights,
          cellStyles: [
            ...(block.cellStyles?.slice(0, repeatHeaderRows) ?? []),
            ...(block.cellStyles?.slice(rowStart, rowEnd) ?? []),
          ],
          cellSpans: [
            ...(block.cellSpans?.slice(0, repeatHeaderRows) ?? []),
            ...(block.cellSpans?.slice(rowStart, rowEnd) ?? []),
          ],
        };
        page.items.push({ block: fragment, blockIndex, rowStart: 0, rowEnd: fragmentRows.length });
      } else {
        page.items.push({ block, blockIndex, rowStart, rowEnd });
      }
      used += height;
      rowStart = rowEnd;
      if (rowStart < block.rows.length) pushPage();
    }
  });
  if (!pages[pages.length - 1].items.length && pages.length > 1) pages.pop();
  return pages;
}

export function pageOfBlock(pages: WordPageModel[], blockIndex: number): number {
  return pages.findIndex((page) => page.items.some((item) => item.blockIndex === blockIndex));
}

/**
 * Paginate into an exact page count taken from Word's own metadata
 * (docProps/app.xml Pages). Forced page/section breaks are kept as segment
 * boundaries and each segment gets a proportional number of pages.
 */
export function paginateToTarget(
  blocks: WordBlock[],
  targetPages: number,
  measured?: { paragraphs?: Map<number, number>; tableRows?: Map<number, number[]>; contentHeight?: number },
): WordPageModel[] {
  interface Unit {
    block: WordBlock;
    blockIndex: number;
    rowStart?: number;
    rowEnd?: number;
    height: number;
    breakBefore: boolean;
    breakAfter: boolean;
  }
  const units: Unit[] = [];
  blocks.forEach((block, blockIndex) => {
    if (block.kind === 'paragraph') {
      const breakOnly = block.paragraph.runs.some((run) => run.pageBreak) && block.paragraph.runs.length === 1;
      const height = measured?.paragraphs?.get(blockIndex) ?? paragraphHeight(block.paragraph);
      if (breakOnly) {
        if (units.length) units[units.length - 1].breakAfter = true;
        return;
      }
      units.push({
        block, blockIndex, height,
        breakBefore: false,
        breakAfter: Boolean(block.paragraph.sectionBreakAfter),
      });
      return;
    }
    const rows = measured?.tableRows?.get(blockIndex);
    block.rows.forEach((_, rowIndex) => {
      units.push({
        block,
        blockIndex,
        rowStart: rowIndex,
        rowEnd: rowIndex + 1,
        height: rows?.[rowIndex] ?? rowHeight(block.rows[rowIndex], (block.nested ?? []).filter((item) => item.row === rowIndex)),
        breakBefore: false,
        breakAfter: false,
      });
    });
  });
  if (!units.length) return [{ index: 0, items: [] }];

  // Split into segments at forced breaks.
  const segments: Unit[][] = [];
  let segment: Unit[] = [];
  for (const unit of units) {
    if (unit.breakBefore && segment.length) {
      segments.push(segment);
      segment = [];
    }
    segment.push(unit);
    if (unit.breakAfter) {
      segments.push(segment);
      segment = [];
    }
  }
  if (segment.length) segments.push(segment);
  if (segments.length > targetPages) {
    return paginateBlocks(blocks, measured);
  }

  const heights = segments.map((items) => items.reduce((sum, unit) => sum + Math.max(1, unit.height), 0));
  const totalHeight = heights.reduce((sum, value) => sum + value, 0) || 1;
  let allocation = segments.map((_, index) => Math.max(1, Math.round((heights[index] / totalHeight) * targetPages)));
  let sum = allocation.reduce((total, value) => total + value, 0);
  while (sum < targetPages) {
    let bestIndex = 0;
    for (let index = 1; index < allocation.length; index++) {
      if (heights[index] / allocation[index] > heights[bestIndex] / allocation[bestIndex]) bestIndex = index;
    }
    allocation[bestIndex] += 1;
    sum += 1;
  }
  while (sum > targetPages) {
    let bestIndex = -1;
    for (let index = 0; index < allocation.length; index++) {
      if (allocation[index] <= 1) continue;
      if (bestIndex < 0 || heights[index] / allocation[index] < heights[bestIndex] / allocation[bestIndex]) bestIndex = index;
    }
    if (bestIndex < 0) break;
    allocation[bestIndex] -= 1;
    sum -= 1;
  }

  const pages: WordPageModel[] = [];
  segments.forEach((items, segmentIndex) => {
    const count = allocation[segmentIndex];
    const segmentHeight = heights[segmentIndex];
    let cursor = 0;
    for (let pageIndex = 0; pageIndex < count; pageIndex++) {
      const remainingPages = count - pageIndex;
      const remainingHeight = items.slice(cursor).reduce((total, unit) => total + Math.max(1, unit.height), 0);
      const budget = remainingHeight / remainingPages;
      const page: WordPageModel = { index: pages.length, items: [] };
      let used = 0;
      while (cursor < items.length) {
        const unit = items[cursor];
        const remainingUnits = items.length - cursor;
        if (page.items.length && used + unit.height > budget && remainingUnits >= remainingPages) break;
        // Merge consecutive table rows into one page item.
        const last = page.items[page.items.length - 1];
        if (unit.rowStart !== undefined && last && last.blockIndex === unit.blockIndex
          && last.rowEnd === unit.rowStart) {
          last.rowEnd = unit.rowEnd;
        } else {
          page.items.push({
            block: unit.block,
            blockIndex: unit.blockIndex,
            ...(unit.rowStart !== undefined ? { rowStart: unit.rowStart, rowEnd: unit.rowEnd } : {}),
          });
        }
        used += Math.max(1, unit.height);
        cursor++;
      }
      pages.push(page);
    }
    void segmentHeight;
  });
  return pages.length ? pages : [{ index: 0, items: [] }];
}
