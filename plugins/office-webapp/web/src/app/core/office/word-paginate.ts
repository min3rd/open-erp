import type { WordBlock, WordNestedTable, WordParagraph } from './types';
import { flowRow, newCellState, type CellContent } from './word-table-flow';

export interface WordPageItem {
  block: WordBlock;
  blockIndex: number;
  /** Inclusive row range when a table is split across pages. */
  rowStart?: number;
  rowEnd?: number;
}

export interface WordPageModel {
  index: number;
  items: WordPageItem[];
  sectionIndex?: number;
}

export const WORD_PAGE_HEIGHT = 1056;
export const WORD_PAGE_PADDING = 96;
const CONTENT_HEIGHT = WORD_PAGE_HEIGHT - WORD_PAGE_PADDING * 2;

function sliceParagraph(paragraph: WordParagraph, start: number, end: number): WordParagraph {
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

function rowHeight(row: WordParagraph[][], nested: WordNestedTable[] = []): number {
  const text = row.flatMap((cell) => cell.map(paragraphText).join(' ')).join(' ');
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

export function paginateBlocks(
  blocks: WordBlock[],
  measured?: {
    paragraphs?: Map<number, number>;
    tableRows?: Map<number, number[]>;
    cellLines?: Map<string, { lineHeight: number; offsets: number[]; paragraphStarts?: number[] }>;
    rowFlow?: Map<number, CellContent[][]>;
    sectionHeights?: number[];
    contentHeight?: number;
  },
): WordPageModel[] {
  const currentSectionIndex = (block: WordBlock): number => block.sectionIndex ?? 0;
  const defaultContentHeight = measured?.contentHeight ?? CONTENT_HEIGHT;
  let currentSection = blocks[0] ? currentSectionIndex(blocks[0]) : 0;
  let contentHeight = measured?.sectionHeights?.[currentSection] ?? defaultContentHeight;
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
      if (block.paragraph.storedPageBreak && pages[pages.length - 1].items.length
        && used > contentHeight * 0.75) pushPage();
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
              nextHeight += measured?.paragraphs?.get(nextIndex) ?? paragraphHeight(next.paragraph);
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
            nextHeight = measured?.paragraphs?.get(blockIndex + 1) ?? paragraphHeight(next.paragraph);
          } else if (next?.kind === 'table') {
            nextHeight = measured?.tableRows?.get(blockIndex + 1)?.[0]
              ?? rowHeight(next.rows[0], (next.nested ?? []).filter((item) => item.row === 0));
          }
        }
        if (nextHeight > 0 && used + height + nextHeight > contentHeight) pushPage();
      }
      const page = ensure(height);
      page.items.push({ block, blockIndex });
      used += height;
      if (block.paragraph.sectionBreakAfter && pages[pages.length - 1].items.length) pushPage();
      return;
    }
    const measuredRows = measured?.tableRows?.get(blockIndex);
    const flowRows = measured?.rowFlow?.get(blockIndex);
    const sizeOf = (rowIndex: number): number => measuredRows?.[rowIndex]
      ?? rowHeight(block.rows[rowIndex], (block.nested ?? []).filter((item) => item.row === rowIndex));
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
      let rowIndex = 0;
      while (rowIndex < flowRows.length) {
        if (contentHeight - used < 24 && pages[pages.length - 1].items.length) pushPage();
        // Recomputed after a page break: the header only repeats on a page
        // where the table continues, not on the page where it starts.
        const repeatHeader = repeatHeaderRows > 0 && rowIndex >= repeatHeaderRows && used === 0;
        if (repeatHeader) used += headerHeight;
        const available = contentHeight - used;
        const fragment = flowRow(flowRows[rowIndex], states[rowIndex], available);
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
        if (fragment.done) rowIndex++;
        else pushPage();
      }
      return;
    }
    let rowStart = 0;
    while (rowStart < block.rows.length) {
      let page = pages[pages.length - 1];
      let available = contentHeight - used;
      if (available < 40 && page.items.length) {
        page = pushPage();
        available = contentHeight;
      }
      const withHeader = repeatHeaderRows > 0 && rowStart > 0 && page.items.length === 0;
      if (withHeader) {
        used += headerHeight;
        available = contentHeight - used;
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
