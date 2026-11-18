import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, QueryList, ViewChild, ViewChildren, computed, effect, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeHtml, type SafeResourceUrl } from '@angular/platform-browser';
import { TranslatePipe } from '@shared';
import { firstValueFrom } from 'rxjs';
import { attr, descendants, findChild, parseXml, type XmlNode } from './core/binary/xml';
import { numberToColumn, parseCellRef, parseXlsx } from './core/office/xlsx';
import { openOfficeFile } from './core/office/parser';
import { mediaMimeType } from './core/office/pptx';
import {
  addSlide, addSlideComment, deleteSlide, deleteSlideComment, moveSlide, setSlideBackground,
  setSlideNotes, setSlideSize, toggleSlideHidden,
} from './core/office/ppt-edit';
import { saveDocx } from './core/office/docx-save';
import { saveCsv, saveXlsx } from './core/office/xlsx-save';
import { savePptx } from './core/office/pptx-save';
import { evaluateFormula, recalculateSheet } from './core/office/formula';
import { buildPivot, parsePivotSource, type PivotAggregate, type PivotResult } from './core/office/pivot';
import { buildChartModel, layoutChart, type ChartLayout, type ChartModel, type ChartSeriesConfig, type ChartType } from './core/office/chart';
import {
  parseExcelAnalysis, removeChart, removePivot, saveAnalysis, upsertChart, upsertPivot,
  type ExcelAnalysis, type SavedChartConfig, type SavedPivotConfig, type SavedSlicer, type SavedTable,
} from './core/office/xlsx-analysis';
import { addConditionalRule, addValidationRule, type ConditionalRuleInput, type ValidationRuleInput } from './core/office/excel-rules';
import { createTableConfig, filterTableRows, slicerValues, type TableRow } from './core/office/excel-table';
import { parseConditionalRules, styleFor, rangeContains, clearConditionalRules, removeConditionalRule } from './core/office/conditional';
import { parseValidations, validate } from './core/office/validation';
import {
  applyCellStyle, cellDisplayValue, clearFreezePane, freezeLabel, setFreezePane, styleOfCell,
} from './core/office/excel-format';
import { findInSheet, rebuildSheetData, sortSheetKeys, visibleRows, type SheetFilter, type SortKey } from './core/office/excel-sort';
import {
  autoSum, clearCell, deleteCells, deleteColumn, deleteRow, insertCells, insertColumn, insertRow,
  mergeAndCenter, mergeRange, normalizeRange, unmergeRange,
} from './core/office/excel-edit';
import {
  addDefinedName, parseDefinedNames, removeDefinedName, setSheetProtection, setWorkbookProtection,
  workbookProtected, type DefinedName,
} from './core/office/excel-names';
import { writeSheetComments } from './core/office/excel-comments';
import {
  applyCommentAnchor, createComment, deleteThread, removeCommentAnchors, replyToComment,
  setResolved, threadOf, type WordComment,
} from './core/office/comments';
import {
  acceptAll, acceptRevision, listRevisions, rejectAll, rejectRevision, revisionCounts,
  revisionNodes, trackEdit, type Revision,
} from './core/office/track-changes';
import {
  animationCss, applyAnimations, applyTransition, parseAnimations, transitionCss,
  type PptAnimation, type PptAnimationEffect, type PptTransition, type PptTransitionType,
} from './core/office/ppt-effects';
import {
  addAnnotation, annotationsForPage, annotationsStorageKey, createAnnotation, embedAnnotations,
  parseAnnotations, parseEmbeddedAnnotations, removeAnnotation, serializeAnnotations,
  type PdfAnnotation, type PdfAnnotationType,
} from './core/office/pdf-annotations';
import {
  extractPdfTextPages, pdfSearchSummary, searchPdfPages,
  type PdfSearchHit, type PdfTextPage,
} from './core/office/pdf-text';
import {
  ensureHeaderFooter, insertPageNumberField, insertSectionBreak, sectionAt, setColumns,
  setHeaderFooterText, setLineNumbering, setPageBorder, setPageColor, setPageNumbering,
  setPageSetup, setTitlePage,
} from './core/office/word-section';
import {
  accessibilitySummary, markTableHeader, scanAccessibility, setImageAlt,
  type AccessibilityIssue,
} from './core/office/word-accessibility';
import {
  deleteNote, ensureNote, setNoteNumbering, type NoteKind, type NoteNumberFormat, type NoteRestart,
  type WordNote, type WordNotes,
} from './core/office/word-notes';
import {
  addCitationSource, apaBibliography, insertBibliography, insertCitation, removeCitationSource,
  type CitationSource,
} from './core/office/word-citations';
import {
  addBookmark, insertCrossReference, insertToc, parseBookmarks, removeBookmark, removeToc, syncTocPageNumbers as syncTocPages, tocEntries,
  type WordBookmark,
} from './core/office/word-toc';
import {
  deleteEquation, equationLabel, insertEquation, parseEquations, type EquationKind, type EquationInput,
  type WordEquation,
} from './core/office/word-equation';
import {
  addInkStroke, clearInk, inkPointsValue, removeInkStroke, type InkPoint, type InkStroke,
} from './core/office/word-ink';
import {
  acceptedText, paragraphHasRevision, paragraphSegments, revisionStyle, setAcceptedText,
  type MarkupMode, type MarkupSegment,
} from './core/office/word-markup';
import { findWordMatches, replaceWordText, type WordFindMatch } from './core/office/word-find';
import { insertWordImage, insertWordTable, insertWordVideo, insertTextBox, insertWordShape } from './core/office/word-insert';
import {
  deleteTableColumn, deleteTableRow, deleteWordTable, distributeTableColumns, insertTableColumn,
  insertTableRow, mergeTableCells, setRowVerticalAlign, setTableAlignment, setTableHeaderRow, splitTableCells,
  tableCellLayout,
} from './core/office/word-tables';
import { insertHyperlink } from './core/office/word-link';
import { applySpellSuggestion, checkWordSpelling, type SpellIssue } from './core/office/word-spell';
import { insertCaption, insertCoverPage, insertTableOfFigures, setWatermark } from './core/office/word-extra';
import { synonymsFor, thesaurusWords } from './core/office/word-thesaurus';
import { setDocumentProtection } from './core/office/word-protect';
import { applyStyleSet, applyWordTheme, WORD_STYLE_SETS, WORD_THEMES } from './core/office/word-theme';
import { restoreWord, snapshotWord, type WordSnapshot } from './core/office/word-history';
import {
  applyParagraphFormat, insertPageBreak, paragraphHasPageBreak, sortBodyParagraphs, toggleParagraphBorders,
  type ParagraphFormatInput, type WordStyle,
} from './core/office/word-format';
import {
  applyRunFormat, clearRunFormat, paragraphPlainText, replaceParagraphRange,
  type RunFormatInput,
} from './core/office/word-runs';
import { OfficeStorageService, type OfficeDocumentMeta, type OfficeDocumentPermission } from './core/persistence/office-storage.service';
import type { CellStyle, ExcelCell, ExcelDocument, ExcelSheet, OfficeApp, OfficeDocument, PptDocument, PptShape, WordBlock, WordCellSpan, WordCellStyle, WordDocument, WordNestedTable, WordParagraph, WordRun } from './core/office/types';
import { wordRibbonTab, wordIconPaths, type WordRibbonTabId } from './core/office/word-ribbon';
import { paginateBlocks, paginateToTarget, pageOfBlock, type WordPageItem, type WordPageModel } from './core/office/word-paginate';
import type { CellContent } from './core/office/word-table-flow';
import {
  groupFloatingRuns, runFloats, setFloatHidden, setFloatPosition, setFloatRotation, setFloatWrap,
  setFloatZ, ungroupFloatingRun,
} from './core/office/word-arrange';
import {
  clearGeneratedIndex, hasGeneratedIndex, insertIndex, markIndexEntry, parseIndexEntries,
  type IndexEntry,
} from './core/office/word-index';
import {
  checkMergeErrors, emptyMailMergeState, finishMerge, insertAddressBlock, insertGreetingLine,
  insertLabels, insertMergeField, insertMergeRule, mergeFieldValue, parseMergeRows, ruleResult,
  type MailMergeState,
} from './core/office/word-mailmerge';
import { parseCsv } from './core/office/csv';

type RibbonTab = 'home' | 'insert' | 'table' | 'draw' | 'design' | 'layout' | 'references' | 'mailings' | 'review'
  | 'view' | 'help' | 'formulas' | 'data' | 'slideshow';

type RibbonMode = 'classic' | 'single' | 'tabs';
type WordMode = 'editing' | 'suggesting' | 'viewing';

const WORD_METRIC_SCALE = 1;
interface WordPainter {
  sourceIndex: number;
  run: RunFormatInput;
  paragraph: ParagraphFormatInput;
}

const APP_TABS: Record<OfficeApp, RibbonTab[]> = {
  word: ['home', 'insert', 'draw', 'design', 'layout', 'references', 'mailings', 'review', 'view', 'help'],
  excel: ['home', 'insert', 'formulas', 'data', 'view'],
  ppt: ['home', 'insert', 'slideshow', 'view'],
  pdf: ['home', 'view'],
};

const ALL_RIBBON_TABS: RibbonTab[] = ['home', 'insert', 'table', 'draw', 'design', 'layout', 'references', 'mailings',
  'review', 'view', 'help', 'formulas', 'data', 'slideshow'];

function tabFromUrl(): RibbonTab {
  try {
    const value = new URLSearchParams(location.search).get('tab') ?? '';
    return ALL_RIBBON_TABS.includes(value as RibbonTab) ? value as RibbonTab : 'home';
  } catch {
    return 'home';
  }
}

@Component({
  selector: 'op-office-webapp-app',
  templateUrl: './office-webapp.component.html',
  styleUrl: './office-webapp.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, NgTemplateOutlet],
})
export class OfficeWebappComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly storage = inject(OfficeStorageService);
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    this.syncTabUrl(this.activeTab());
    const params = new URLSearchParams(location.search);
    const numberParam = (name: string, fallback: number): number => {
      if (!params.has(name)) return fallback;
      const value = Number(params.get(name));
      return Number.isFinite(value) ? value : fallback;
    };
    this.wordMetricScale = numberParam('metricScale', WORD_METRIC_SCALE);
    this.wordTableScale = numberParam('tableScale', 1);
    this.wordContentOffset = numberParam('contentOffset', 0);
    this.wordTargetDisabled = params.get('target') === '0';
    this.wordRowFlowEnabled = params.get('rowFlow') !== '0';
    this.wordEditEnabled = params.get('edit') !== '0';
    // Word repeats the w:tblHeader row on every page the table continues onto,
    // so the row scale is calibrated with that space included: 1.162 lands on
    // Word's 546 pages for the bid document while every table page shows its
    // header like Office 365 and no page overflows its box.
    this.wordRowFlowScale = numberParam('rowFlowScale', 1.162);
    effect(() => {
      this.inkStrokes();
      this.inkPreview();
      this.inkOpen();
      this.wordRenderKey();
      this.scheduleInkDraw();
    });
  }

  @ViewChildren('inkCanvas') private inkCanvases?: QueryList<ElementRef<HTMLCanvasElement>>;
  private inkDrawQueued = false;

  private scheduleInkDraw(): void {
    if (this.inkDrawQueued) return;
    this.inkDrawQueued = true;
    requestAnimationFrame(() => {
      this.inkDrawQueued = false;
      this.drawInkLayers();
    });
  }

  private drawInkLayers(): void {
    const canvases = this.inkCanvases?.toArray() ?? [];
    const dpr = window.devicePixelRatio || 1;
    for (const reference of canvases) {
      const canvas = reference.nativeElement;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      const width = Math.round(rect.width * dpr);
      const height = Math.round(rect.height * dpr);
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) continue;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      const page = Number(canvas.dataset['page'] ?? 0);
      for (const stroke of this.inkStrokesForPage(page)) this.paintInkStroke(context, stroke, rect, false);
      const preview = this.inkPreviewForPage(page);
      if (preview) this.paintInkStroke(context, preview, rect, true);
    }
  }

  private paintInkStroke(
    context: CanvasRenderingContext2D,
    stroke: InkStroke,
    rect: DOMRect,
    dashed: boolean,
  ): void {
    if (stroke.points.length < 2) return;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = stroke.color;
    context.setLineDash(dashed ? [4, 3] : []);
    for (let index = 1; index < stroke.points.length; index++) {
      const previous = stroke.points[index - 1];
      const current = stroke.points[index];
      const pressure = current.pressure ?? previous.pressure ?? 0.5;
      context.beginPath();
      context.lineWidth = Math.max(0.5, stroke.width * (0.35 + 0.65 * Math.max(0, Math.min(1, pressure))));
      context.moveTo(previous.x * rect.width, previous.y * rect.height);
      context.lineTo(current.x * rect.width, current.y * rect.height);
      context.stroke();
    }
    context.setLineDash([]);
  }

  measuredParagraphs(): number {
    this.wordHeightsTick();
    return this.paragraphHeights.size;
  }

  private scheduleWordMeasure(delay = 80): void {
    if (this.measureScheduled) return;
    this.measureScheduled = true;
    setTimeout(() => {
      this.measureScheduled = false;
      try {
        this.measureWordHeights();
      } catch {
        // measurement is best-effort; pagination falls back to estimates
      }
    }, delay);
  }

  private measureWordHeights(): void {
    const active = document.activeElement as HTMLElement | null;
    if (active?.closest('.op-word-page')) return;
    const stage = this.hostRef.nativeElement.querySelector('.op-word-stage');
    if (!stage) return;
    let changed = false;
    const signature: string[] = [];
    for (const element of stage.querySelectorAll<HTMLElement>('.op-word-p[data-paragraph]')) {
      if (element.closest('.op-word-table')) continue;
      const index = Number(element.getAttribute('data-paragraph'));
      if (!Number.isFinite(index)) continue;
      const style = getComputedStyle(element);
      const height = element.getBoundingClientRect().height
        + Number.parseFloat(style.marginTop || '0') + Number.parseFloat(style.marginBottom || '0');
      signature.push(`p${index}:${height.toFixed(1)}`);
      const scaledHeight = height * this.wordMetricScale;
      if (height > 0 && Math.abs((this.paragraphHeights.get(index) ?? 0) - scaledHeight) > 1) {
        this.paragraphHeights.set(index, scaledHeight);
        changed = true;
      }
    }
    const tables = new Map<number, number[]>();
    const measuredTables = new Set<number>();
    for (const table of stage.querySelectorAll<HTMLTableElement>('table.op-word-table[data-block]:not([data-fragment="true"])')) {
      const index = Number(table.getAttribute('data-block'));
      if (!Number.isFinite(index)) continue;
      const rows = [...table.rows].map((row) => row.getBoundingClientRect().height);
      // Fragments after the first one start with the repeated w:tblHeader
      // rows, which are not part of the block's row list.
      const block = this.word()?.blocks[index];
      const headerRows = block?.kind === 'table' ? (block.headerRows ?? 0) : 0;
      const skip = measuredTables.has(index) ? Math.min(headerRows, rows.length) : 0;
      measuredTables.add(index);
      tables.set(index, [...(tables.get(index) ?? []), ...rows.slice(skip)]);
    }
    for (const [index, rows] of tables) {
      const scaledRows = rows.map((height) => height * this.wordTableScale);
      const current = this.tableRowHeights.get(index);
      if (!current || current.length !== scaledRows.length
        || scaledRows.some((height, rowIndex) => Math.abs((current[rowIndex] ?? 0) - height) > 1)) {
        this.tableRowHeights.set(index, scaledRows);
        changed = true;
      }
    }
    // Stored measurements, not rendered fragments, keep the settle signature stable
    // when a table is split and its fragments are excluded from measurement.
    for (const [index, rows] of this.tableRowHeights) {
      signature.push(`t${index}:${rows.map((height) => height.toFixed(1)).join(',')}`);
    }
    if (this.wordRowFlowEnabled) {
      const flowBuckets = new Map<number, CellContent[][]>();
      const measuredFlowTables = new Set<number>();
      for (const table of stage.querySelectorAll<HTMLTableElement>('table.op-word-table[data-block]:not([data-fragment="true"])')) {
        const index = Number(table.getAttribute('data-block'));
        if (!Number.isFinite(index)) continue;
        const bucket = flowBuckets.get(index) ?? [];
        flowBuckets.set(index, bucket);
        const block = this.word()?.blocks[index];
        const headerRows = block?.kind === 'table' ? (block.headerRows ?? 0) : 0;
        const rows = [...table.rows];
        const skip = measuredFlowTables.has(index) ? Math.min(headerRows, rows.length) : 0;
        measuredFlowTables.add(index);
        for (const tr of rows.slice(skip)) {
          const rowIndex = bucket.length;
          // A covered continue cell of a vertical merge is not rendered, so the
          // measured row is rebuilt by data-cell index; indexing by DOM order
          // would shift every cell of that row.
          const modelRow = block?.kind === 'table' ? block.rows[rowIndex] : undefined;
          const cellCount = Math.max(modelRow?.length ?? tr.cells.length, tr.cells.length);
          const cells: CellContent[] = Array.from({ length: cellCount }, () => ({ lines: [], paddingTop: 0, paddingBottom: 6 }));
          for (const td of tr.cells) {
            const dataCell = Number(td.getAttribute('data-cell'));
            const cellIndex = Number.isFinite(dataCell) ? dataCell : 0;
            const paragraphs = [...td.querySelectorAll<HTMLElement>(':scope > p')];
            if (!paragraphs.length) continue;
            // A cell may hold several paragraphs (Word splits such rows across
            // pages too). Lines are numbered over the joined text, and the
            // paragraph starts let pagination slice back into the same
            // paragraphs, so a tall row is clipped to the page instead of
            // spilling past it.
            const texts = paragraphs.map((paragraph) => paragraph.innerText ?? '');
            const text = texts.join('\n');
            if (!text.length) continue;
            const lineHeight = Math.max(1, Number.parseFloat(getComputedStyle(paragraphs[0]).lineHeight) || 1);
            const totalHeight = paragraphs.reduce((sum, paragraph) => sum + paragraph.getBoundingClientRect().height, 0);
            const lineCount = Math.max(1, Math.round(totalHeight / lineHeight));
            const offsets: number[] = [];
            for (let line = 0; line <= lineCount; line++) offsets.push(Math.round((line * text.length) / lineCount));
            const paragraphStarts: number[] = [];
            let cursor = 0;
            for (const value of texts) {
              paragraphStarts.push(cursor);
              cursor += value.length + 1;
            }
            this.cellLines.set(`${index}:${rowIndex}:${cellIndex}:0`, { lineHeight, offsets, paragraphStarts });
            const lines = [];
            for (let line = 0; line < lineCount; line++) {
              lines.push({ start: offsets[line], end: offsets[line + 1], height: lineHeight });
            }
            cells[cellIndex] = { lines, paddingTop: 0, paddingBottom: 6 };
          }
          const measuredRow = this.tableRowHeights.get(index)?.[rowIndex];
          const lineTotal = Math.max(...cells.map((cell) => cell.lines.reduce((sum, line) => sum + line.height, 0)));
          if (measuredRow && lineTotal > 0) {
            const scale = (measuredRow / lineTotal) * this.wordRowFlowScale;
            for (const cell of cells) {
              for (const line of cell.lines) line.height *= scale;
            }
          }
          bucket.push(cells);
        }
      }
      for (const [index, flowRows] of flowBuckets) {
        if (!flowRows.length) continue;
        const signatureText = flowRows.map((row) => row.map((cell) => cell.lines.length).join('.')).join('|');
        const previous = this.rowFlow.get(index);
        if (signatureText !== previous?.map((row) => row.map((cell) => cell.lines.length).join('.')).join('|')) {
          changed = true;
        }
        this.rowFlow.set(index, flowRows);
      }
      for (const [index, flowRows] of this.rowFlow) {
        signature.push(`r${index}:${flowRows.map((row) => row.map((cell) => cell.lines.length).join('.')).join('|')}`);
      }
    }
    if (changed) {
      this.wordHeightsTick.update((value) => value + 1);
    }
    this.measureInlineFloatSplits();
    const snapshot = signature.join('|');
    const stable = snapshot.length > 0 && snapshot === this.measureSignature;
    this.measureSignature = snapshot;
    if (stable) {
      this.measureAttempts = 0;
      if (!this.wordSettled()) this.wordSettled.set(true);
      this.refreshTocPagesAutomatically();
      return;
    }
    this.measureAttempts += 1;
    this.wordMeasureAttempts.set(this.measureAttempts);
    if (this.wordSettled()) this.wordSettled.set(false);
    if (this.measureAttempts <= 20) {
      this.scheduleWordMeasure(this.measureAttempts < 3 ? 80 : 120);
    } else {
      this.wordSettled.set(true);
      this.refreshTocPagesAutomatically();
    }
  }

  /** After pagination settles, rewrite TOC page numbers in place (no Update TOC click). */
  private refreshTocPagesAutomatically(): void {
    const word = this.word();
    if (!word) return;
    const entries = tocEntries(word);
    if (!entries.length) return;
    const pages = this.wordPages();
    const pageMap = new Map<number, number>();
    for (const entry of entries) {
      pageMap.set(entry.paragraphIndex, Math.max(1, pageOfBlock(pages, entry.paragraphIndex) + 1));
    }
    const key = entries.map((entry) => `${entry.paragraphIndex}:${pageMap.get(entry.paragraphIndex)}`).join(',');
    if (key === this.tocSyncKey) return;
    this.tocSyncKey = key;
    if (!syncTocPages(word, pageMap)) return;
    this.tocList.set(tocEntries(word));
    this.wordRenderKey.update((value) => value + 1);
    this.scheduleWordMeasure(150);
  }

  private resetWordHeights(): void {
    this.paragraphHeights.clear();
    this.tableRowHeights.clear();
    this.cellLines.clear();
    this.rowFlow.clear();
    this.inlineSplitPasses = 0;
    this.inlineFloatSplits.set(new Map());
    this.measureSignature = '';
    this.measureAttempts = 0;
    this.wordMeasureAttempts.set(0);
    this.wordSettled.set(false);
    this.tocSyncKey = '';
  }

  private syncTabUrl(tab: RibbonTab): void {
    try {
      const url = new URL(location.href);
      url.searchParams.set('tab', tab);
      history.replaceState(null, '', url.toString());
    } catch {
      // URL sync is best-effort (sandboxed embeds may block history)
    }
  }

  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('wordImageInput') private wordImageInput?: ElementRef<HTMLInputElement>;
  @ViewChild('mergeFileInput') private mergeFileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('gridCanvas') set gridCanvas(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.canvasRef = ref;
    setTimeout(() => this.drawGrid(), 0);
  }

  private canvasRef?: ElementRef<HTMLCanvasElement>;
  private pdfObjectUrl: string | null = null;

  readonly doc = signal<OfficeDocument | null>(null);
  readonly app = computed(() => this.doc()?.app ?? null);
  readonly busy = signal(false);
  readonly saving = signal(false);
  readonly dirty = signal(false);
  readonly error = signal<string | null>(null);
  readonly fileMenuOpen = signal(false);
  readonly infoOpen = signal(false);
  readonly activeTab = signal<RibbonTab>(tabFromUrl());
  readonly ribbonMode = signal<RibbonMode>('single');
  readonly helpOpen = signal(false);
  readonly wordCountOpen = signal(false);
  readonly wordFullscreen = signal(false);
  readonly coverOpen = signal(false);
  readonly coverTitle = signal('');
  readonly coverSubtitle = signal('');
  readonly textBoxOpen = signal(false);
  readonly textBoxDraft = signal('');
  readonly captionOpen = signal(false);
  readonly captionLabel = signal('Hình');
  readonly captionText = signal('');
  readonly watermarkOpen = signal(false);
  readonly watermarkDraft = signal('DRAFT');
  readonly newWindowHint = signal<string | null>(null);
  readonly showMarks = signal(false);
  readonly shapesOpen = signal(false);
  readonly iconsOpen = signal(false);
  readonly wordChartOpen = signal(false);
  readonly wordChartData = signal('Doanh thu:120, Chi phí:80, Lợi nhuận:40');
  readonly wordChartType = signal<'bar' | 'line' | 'pie'>('bar');
  readonly themesOpen = signal(false);
  readonly styleSetsOpen = signal(false);
  readonly thesaurusOpen = signal(false);
  readonly thesaurusQuery = signal('');
  readonly wordThemes = WORD_THEMES;
  readonly wordStyleSets = WORD_STYLE_SETS;
  readonly wordShapes = [
    { id: 'rect', labelKey: 'office.rb.shape.rect' },
    { id: 'roundRect', labelKey: 'office.rb.shape.roundRect' },
    { id: 'ellipse', labelKey: 'office.rb.shape.ellipse' },
    { id: 'line', labelKey: 'office.rb.shape.line' },
  ] as const;
  readonly wordIcons = [
    { id: 'check', labelKey: 'office.rb.icon.check', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1F4E79" stroke-width="2"><path d="M4 12l5 5L20 6"/></svg>' },
    { id: 'star', labelKey: 'office.rb.icon.star', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#B8860B" stroke-width="2"><path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-2.7L7 19l1-6-4-4 5.5-.5z"/></svg>' },
    { id: 'heart', labelKey: 'office.rb.icon.heart', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#C00000" stroke-width="2"><path d="M12 21s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z"/></svg>' },
    { id: 'flag', labelKey: 'office.rb.icon.flag', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" stroke-width="2"><path d="M5 21V4h9l-1 3h6l-1 4h-5l1 3H5"/></svg>' },
    { id: 'clock', labelKey: 'office.rb.icon.clock', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6A1B9A" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>' },
    { id: 'mail', labelKey: 'office.rb.icon.mail', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0F6CBD" stroke-width="2"><rect x="3" y="6" width="18" height="12"/><path d="M3 7l9 6 9-6"/></svg>' },
  ];
  readonly thesaurusResults = computed(() => {
    const query = this.thesaurusQuery().trim();
    return query ? synonymsFor(query) : [];
  });
  readonly wordProtected = computed(() => Boolean(this.word()?.protected));
  readonly currentHeader = computed(() => {
    this.wordRenderKey();
    return this.word()?.sections?.[0]?.headers.find((header) => header.type === 'default') ?? null;
  });
  readonly currentFooter = computed(() => {
    this.wordRenderKey();
    return this.word()?.sections?.[0]?.footers.find((footer) => footer.type === 'default') ?? null;
  });
  readonly zoom = signal(100);
  readonly selectedSheet = signal(0);
  readonly selectedSlide = signal(0);
  readonly selectedCell = signal('A1');
  readonly pdfUrl = signal<SafeResourceUrl | null>(null);
  readonly pdfPage = signal(1);
  readonly pdfRotation = signal(0);
  readonly annotationTool = signal<'select' | PdfAnnotationType | 'eraser'>('select');
  readonly annotationColor = signal('#ffd54f');
  readonly annotations = signal<PdfAnnotation[]>([]);
  readonly pageAnnotations = computed(() => annotationsForPage(this.annotations(), this.pdfPage()));
  readonly pendingNote = signal<{ x: number; y: number } | null>(null);
  readonly noteDraft = signal('');
  readonly annotationPreview = signal<PdfAnnotation | null>(null);
  readonly pdfSearchOpen = signal(false);
  readonly pdfSearchQuery = signal('');
  readonly pdfSearchHits = signal<PdfSearchHit[]>([]);
  readonly pdfSearchIndex = signal(0);
  readonly pdfSearchPosition = computed(() => pdfSearchSummary(this.pdfSearchHits(), this.pdfSearchIndex()));
  readonly pdfTextPages = signal<PdfTextPage[]>([]);
  readonly pdfPageSegments = computed(() => {
    const text = this.pdfPageText(this.pdfPage());
    if (!text) return [];
    const query = this.pdfSearchQuery().trim();
    if (!query) return [{ text, match: false }];
    const segments: Array<{ text: string; match: boolean }> = [];
    const lower = text.toLowerCase();
    const needle = query.toLowerCase();
    let from = 0;
    while (from < text.length) {
      const at = lower.indexOf(needle, from);
      if (at < 0) break;
      if (at > from) segments.push({ text: text.slice(from, at), match: false });
      segments.push({ text: text.slice(at, at + needle.length), match: true });
      from = at + needle.length;
    }
    if (from < text.length) segments.push({ text: text.slice(from), match: false });
    return segments;
  });
  private annotationKey: string | null = null;
  private annotationStart: { x: number; y: number } | null = null;
  private annotationPoints: Array<{ x: number; y: number }> = [];
  private pdfBaseUrl: string | null = null;
  readonly pdfPageUrl = signal<SafeResourceUrl | null>(null);
  readonly pdfAspect = computed(() => {
    const info = this.pdfInfo();
    return info && info.height ? info.width / info.height : 612 / 792;
  });
  readonly erpOpen = signal(false);
  readonly erpBusy = signal(false);
  readonly erpDocs = signal<OfficeDocumentMeta[]>([]);
  readonly erpError = signal<string | null>(null);
  readonly erpDocId = signal<string | null>(null);
  readonly erpVersion = signal<number>(0);
  readonly shareOpen = signal(false);
  readonly shareBusy = signal(false);
  readonly shareList = signal<OfficeDocumentPermission[]>([]);
  readonly shareSubject = signal('');
  readonly sharePermission = signal('READ');
  readonly shareError = signal<string | null>(null);
  readonly chartOpen = signal(false);
  readonly chartType = signal<ChartType>('column');
  readonly chartModel = signal<ChartModel | null>(null);
  readonly chartLayout = computed(() => {
    const model = this.chartModel();
    return model ? layoutChart(model, 480, 280) : null;
  });
  readonly pivotOpen = signal(false);
  readonly pivotResult = signal<PivotResult | null>(null);
  readonly excelAnalysis = signal<ExcelAnalysis>({ pivots: [], charts: [], tables: [], slicers: [] });
  readonly pivotSource = signal('A1:D4');
  readonly pivotRowField = signal<number | null>(null);
  readonly pivotColumnField = signal<number | null>(null);
  readonly pivotValueField = signal<number | null>(null);
  readonly pivotAggregate = signal<PivotAggregate>('SUM');
  readonly pivotHeaders = computed(() => {
    const sheet = this.currentSheet();
    const range = parsePivotSource(this.pivotSource());
    if (!sheet || !range) return [];
    const headers: Array<{ column: number; name: string }> = [];
    for (let col = range.startCol; col <= range.endCol; col++) {
      const ref = `${numberToColumn(col)}${range.startRow}`;
      headers.push({ column: col, name: String(sheet.cells.get(ref)?.value ?? numberToColumn(col)) });
    }
    return headers;
  });
  readonly chartCategories = signal('A2:A4');
  readonly chartSeriesList = signal<ChartSeriesConfig[]>([{ range: 'B2:B4', label: 'Doanh thu' }]);
  readonly chartTitle = signal('');
  readonly chartAxisTitle = signal('');
  readonly chartShowLegend = signal(true);
  readonly cfOpen = signal(false);
  readonly cfRange = signal('A1:B10');
  readonly cfType = signal<ConditionalRuleInput['type']>('cellIs');
  readonly cfOperator = signal<NonNullable<ConditionalRuleInput['operator']>>('greaterThan');
  readonly cfValue = signal('100');
  readonly cfValue2 = signal('0');
  readonly cfText = signal('');
  readonly cfColor = signal('#f8696b');
  readonly dvOpen = signal(false);
  readonly dvRange = signal('A1:A10');
  readonly dvType = signal<ValidationRuleInput['type']>('whole');
  readonly dvOperator = signal<NonNullable<ValidationRuleInput['operator']>>('between');
  readonly dvFormula1 = signal('1');
  readonly dvFormula2 = signal('100');
  readonly dvMessage = signal('');
  readonly tableOpen = signal(false);
  readonly tableSource = signal('A1:D4');
  readonly tableName = signal('Table1');
  readonly tableList = signal<SavedTable[]>([]);
  readonly activeTableId = signal<string | null>(null);
  readonly slicerColumn = signal('');
  readonly slicerSelected = signal<string[]>([]);
  readonly tablePreview = signal<TableRow[]>([]);
  readonly tableColumns = signal<string[]>([]);
  readonly excelFormatOpen = signal(false);
  readonly excelDataOpen = signal(false);
  readonly excelFindQuery = signal('');
  readonly excelFindIndex = signal(0);
  readonly excelFilter = signal<SheetFilter | null>(null);
  readonly excelFilterValue = signal('');
  readonly excelRange = signal('A1');
  readonly excelSecondarySort = signal(0);
  readonly excelSortAscending = signal(true);
  readonly excelLastSort = signal<SortKey[] | null>(null);
  readonly excelNameDraft = signal('');
  readonly excelFormulaDraft = signal('Data!$B$2:$B$4');
  readonly excelShowFormulas = signal(false);
  readonly excelManualCalc = signal(false);
  readonly excelCommentDraft = signal('');
  readonly excelCommentIndex = signal(0);
  readonly excelTick = signal(0);
  readonly excelNames = computed<DefinedName[]>(() => {
    this.excelTick();
    const excel = this.doc()?.excel;
    return excel ? parseDefinedNames(excel) : [];
  });
  readonly excelCfRules = computed(() => {
    this.excelTick();
    const sheet = this.currentSheet();
    return sheet ? parseConditionalRules(sheet) : [];
  });
  readonly excelComments = computed(() => {
    this.excelTick();
    const sheet = this.currentSheet();
    return sheet ? [...(sheet.comments?.values() ?? [])].sort((a, b) => a.ref.localeCompare(b.ref)) : [];
  });
  readonly selectedExcelComment = computed(() => {
    this.excelTick();
    return this.currentSheet()?.comments?.get(this.selectedCell()) ?? null;
  });
  readonly excelSheetProtected = computed(() => {
    this.excelTick();
    return Boolean(this.currentSheet()?.protected);
  });
  readonly excelWorkbookProtected = computed(() => {
    this.excelTick();
    const excel = this.doc()?.excel;
    return excel ? workbookProtected(excel) : false;
  });
  readonly excelFonts = ['Calibri', 'Arial', 'Times New Roman', 'Courier New'];
  readonly excelFontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24];
  readonly excelNumberFormats = ['General', '0', '0.00', '0.0', '0.000', '#,##0', '#,##0.00', '#,##0 "₫"', '0%', '0.00%', 'mm-dd-yy'];
  readonly selectedExcelStyle = computed(() => {
    this.excelTick();
    return styleOfCell(this.currentSheet()?.cells.get(this.selectedCell()));
  });
  readonly excelFindMatches = computed(() => {
    this.excelTick();
    const sheet = this.currentSheet();
    return sheet ? findInSheet(sheet, this.excelFindQuery()) : [];
  });
  readonly excelFreeze = computed(() => {
    this.excelTick();
    return this.currentSheet()?.freeze;
  });
  readonly excelFreezeLabel = computed(() => freezeLabel(this.excelFreeze()));
  readonly cellError = signal<string | null>(null);
  readonly commentsOpen = signal(false);
  readonly comments = signal<WordComment[]>([]);
  readonly commentThreads = computed(() => threadOf(this.comments()));
  readonly selectedParagraph = signal<number | null>(null);
  readonly commentDraft = signal('');
  readonly replyTarget = signal<number | null>(null);
  readonly replyDraft = signal('');
  readonly tracking = signal(false);
  readonly revisions = signal<Revision[]>([]);
  readonly revisionsOpen = signal(false);
  readonly revisionIndex = signal(0);
  readonly separatePages = signal(true);
  readonly commentFilter = signal<'all' | 'unresolved' | 'resolved'>('all');
  readonly filteredCommentThreads = computed(() => {
    const filter = this.commentFilter();
    const threads = this.commentThreads();
    if (filter === 'all') return threads;
    return threads.filter((thread) => filter === 'resolved' ? thread.root.resolved : !thread.root.resolved);
  });
  readonly revisionCounts = computed(() => revisionCounts(this.revisions()));
  readonly authorName = signal(readAuthorName());
  readonly authorInitials = computed(() => initialsOf(this.authorName()));
  readonly headerFooterOpen = signal(false);
  readonly headerText = signal('');
  readonly footerText = signal('');
  readonly pageNumberFormat = signal('decimal');
  readonly pageNumberStart = signal<number | null>(1);
  readonly differentFirstPage = signal(false);
  readonly footerPageNumber = signal(false);
  readonly layoutOpen = signal(false);
  readonly sectionCount = signal(1);
  readonly columnCount = signal(1);
  readonly columnSpace = signal(720);
  readonly pageSize = signal<'A4' | 'Letter'>('A4');
  readonly pageOrientation = signal<'portrait' | 'landscape'>('portrait');
  readonly pageMargin = signal<'normal' | 'narrow' | 'wide'>('normal');
  readonly pageSetupOpen = signal(false);
  readonly pageBorderStyle = signal('single');
  readonly pageBorderSize = signal(1);
  readonly pageBorderColor = signal('#000000');
  readonly pageColor = signal('#ffffff');
  readonly lineNumberingMode = signal<'off' | 'continuous' | 'newPage' | 'newSection'>('off');
  readonly readingView = signal(false);
  readonly immersive = signal(false);
  readonly wordDark = signal(false);
  readonly rulerOpen = signal(false);
  readonly accessOpen = signal(false);
  readonly accessIssues = signal<AccessibilityIssue[]>([]);
  readonly accessSummary = computed(() => accessibilitySummary(this.accessIssues()));
  readonly altDrafts = signal<Record<number, string>>({});
  readonly findOpen = signal(false);
  readonly findQuery = signal('');
  readonly findReplacement = signal('');
  readonly findMatchCase = signal(false);
  readonly findWholeWord = signal(false);
  readonly findIndex = signal(0);
  readonly insertTableOpen = signal(false);
  readonly insertRows = signal(2);
  readonly insertCols = signal(3);
  readonly formatOpen = signal(false);
  readonly navPaneOpen = signal(false);
  readonly linkOpen = signal(false);
  readonly linkText = signal('');
  readonly linkUrl = signal('https://');
  readonly symbolOpen = signal(false);
  readonly videoOpen = signal(false);
  readonly videoUrlDraft = signal('https://');
  readonly spellOpen = signal(false);
  readonly spellIgnored = signal<string[]>([]);
  readonly spellIssueTick = signal(0);
  readonly spellIssues = computed<SpellIssue[]>(() => {
    this.wordRenderKey();
    this.spellIssueTick();
    return checkWordSpelling(this.word()?.blocks ?? [], new Set(this.spellIgnored()));
  });
  readonly symbols = ['©', '®', '™', '§', '¶', '±', '×', '÷', '≤', '≥', '≠', '∞', '∑', '∏', '√', '∫', 'α', 'β', 'γ', 'π', 'Ω', '←', '→', '↑', '↓', '—', '…', '•'];
  readonly wordStyleOptions: Array<{ value: WordStyle; labelKey: string }> = [
    { value: 'Normal', labelKey: 'office.word.style.normal' },
    { value: 'NoSpacing', labelKey: 'office.word.style.noSpacing' },
    { value: 'Title', labelKey: 'office.word.style.title' },
    { value: 'Subtitle', labelKey: 'office.word.style.subtitle' },
    { value: 'Heading1', labelKey: 'office.word.style.heading1' },
    { value: 'Heading2', labelKey: 'office.word.style.heading2' },
    { value: 'Heading3', labelKey: 'office.word.style.heading3' },
    { value: 'Heading4', labelKey: 'office.word.style.heading4' },
    { value: 'Heading5', labelKey: 'office.word.style.heading5' },
    { value: 'Heading6', labelKey: 'office.word.style.heading6' },
    { value: 'Quote', labelKey: 'office.word.style.quote' },
  ];
  readonly wordFonts = ['Calibri', 'Arial', 'Times New Roman', 'Cambria', 'Courier New'];
  readonly wordFontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36];
  readonly wordHighlights = ['none', 'yellow', 'green', 'cyan', 'magenta', 'red', 'blue'];
  readonly wordSelection = signal<{ paragraphIndex: number; start: number; end: number; text: string } | null>(null);
  /** Table under the caret, for Word's contextual Table tab. */
  readonly activeWordTable = signal<number | null>(null);
  readonly activeWordTableRow = signal(0);
  readonly activeWordTableCell = signal(0);
  /** Cell run picked with the mouse, for Merge/Split Cells. */
  readonly wordCellSelection = signal<{ block: number; row: number; cell: number; row2: number; cell2: number } | null>(null);
  private wordCellDragAnchor: { block: number; row: number; cell: number } | null = null;
  readonly splitCellsOpen = signal(false);
  readonly splitCellRows = signal(1);
  readonly splitCellColumns = signal(1);
  readonly wordPainter = signal<WordPainter | null>(null);
  readonly wordClipboardStatus = signal<string | null>(null);
  readonly selectedWordRun = computed(() => {
    this.wordRenderKey();
    const selection = this.wordSelection();
    const index = selection?.paragraphIndex ?? this.selectedParagraph();
    if (index === null) return null;
    const block = this.word()?.blocks[index];
    if (block?.kind !== 'paragraph') return null;
    const start = selection?.start ?? 0;
    let offset = 0;
    for (const run of block.paragraph.runs) {
      if (run.imagePath || run.videoUrl || run.pageBreak || !run.text) continue;
      if (start >= offset && start < offset + run.text.length) return run;
      offset += run.text.length;
    }
    return block.paragraph.runs.find((run) => run.text && !run.imagePath && !run.videoUrl && !run.pageBreak) ?? null;
  });
  readonly selectedWordParagraph = computed(() => {
    this.wordRenderKey();
    const index = this.selectedParagraph();
    if (index === null) return null;
    const block = this.word()?.blocks[index];
    return block?.kind === 'paragraph' ? block.paragraph : null;
  });
  readonly currentWordStyle = computed<WordStyle>(() => {
    this.wordRenderKey();
    const style = this.selectedWordParagraph()?.style ?? 'Normal';
    return this.wordStyleOptions.some((option) => option.value === style) ? style as WordStyle : 'Normal';
  });
  readonly wordFindMatches = computed<WordFindMatch[]>(() => {
    this.wordRenderKey();
    return findWordMatches(this.word()?.blocks ?? [], this.findQuery(), {
      matchCase: this.findMatchCase(),
      wholeWord: this.findWholeWord(),
    });
  });
  readonly wordFindBlocks = computed(() => new Set(this.wordFindMatches().map((match) => match.blockIndex)));
  readonly currentFindBlock = computed(() => this.wordFindMatches()[this.findIndex()]?.blockIndex ?? -1);
  private wordUndoStack: WordSnapshot[] = [];
  private wordRedoStack: WordSnapshot[] = [];
  readonly wordHistoryTick = signal(0);
  readonly canUndoWord = computed(() => {
    this.wordHistoryTick();
    return this.wordUndoStack.length > 0;
  });
  readonly canRedoWord = computed(() => {
    this.wordHistoryTick();
    return this.wordRedoStack.length > 0;
  });
  readonly notesPanelOpen = signal(false);
  readonly wordNotes = signal<WordNotes | null>(null);
  readonly notesTick = signal(0);
  readonly wordNoteDraft = signal('');
  readonly noteKind = signal<NoteKind>('footnote');
  readonly footnotes = computed(() => { this.notesTick(); return this.wordNotes()?.footnotes ?? []; });
  readonly endnotes = computed(() => { this.notesTick(); return this.wordNotes()?.endnotes ?? []; });
  readonly noteFormat = computed(() => this.wordNotes()?.footnoteFormat ?? 'decimal');
  readonly endnoteFormat = computed(() => this.wordNotes()?.endnoteFormat ?? 'decimal');
  readonly citationsOpen = signal(false);
  readonly mailMergeOpen = signal(false);
  readonly mailMerge = signal<MailMergeState>(emptyMailMergeState());
  readonly mergeFieldDraft = signal('');
  readonly mergeRuleKind = signal<'next' | 'if'>('next');
  readonly mergeRuleField = signal('');
  readonly mergeRuleOperator = signal<'=' | '<>' | '>' | '<' | '>=' | '<='>('=');
  readonly mergeRuleValue = signal('');
  readonly mergeRuleTrue = signal('');
  readonly mergeRuleFalse = signal('');
  readonly mergeFind = signal('');
  readonly mergeMessage = signal<string | null>(null);
  readonly mergePanelMode = signal<'main' | 'rules' | 'match' | 'start'>('main');
  readonly indexOpen = signal(false);
  readonly indexTerm = signal('');
  readonly paragraphOptionsOpen = signal(false);
  readonly emojiOpen = signal(false);
  readonly commentsRead = signal<Set<number>>(new Set());
  readonly wordEmojis = [
    { char: '😀', labelKey: 'office.emoji.smile' },
    { char: '❤️', labelKey: 'office.emoji.heart' },
    { char: '👍', labelKey: 'office.emoji.thumb' },
    { char: '⭐', labelKey: 'office.emoji.star' },
    { char: '🎉', labelKey: 'office.emoji.party' },
    { char: '✅', labelKey: 'office.emoji.check' },
  ] as const;
  readonly selectedWordFloats = signal<WordRun[]>([]);
  readonly arrangePanel = signal<'position' | 'wrap' | 'align' | 'rotate' | 'selection' | null>(null);
  readonly inlineFloatSplits = signal<Map<number, { run: WordRun; runIndex: number; offset: number }>>(new Map());
  readonly floatX = signal(0);
  readonly floatY = signal(0);
  readonly indexEntries = computed<IndexEntry[]>(() => {
    this.wordRenderKey();
    const word = this.word();
    return word ? parseIndexEntries(word) : [];
  });
  readonly indexDisplay = computed(() => {
    this.wordRenderKey();
    const pages = this.wordPages();
    return this.indexEntries().map((entry) => ({
      term: entry.term,
      page: Math.max(0, pageOfBlock(pages, entry.blockIndex) + 1),
    }));
  });
  readonly mergeRecipients = computed(() => {
    const state = this.mailMerge();
    const query = this.mergeFind().trim().toLowerCase();
    return state.recipients
      .map((record, index) => ({ record, index }))
      .filter(({ record }) => !query || Object.values(record).some((value) => value.toLowerCase().includes(query)));
  });
  readonly sources = signal<CitationSource[]>([]);
  readonly citationType = signal<CitationSource['type']>('book');
  readonly citationAuthor = signal('');
  readonly citationTitle = signal('');
  readonly citationYear = signal('');
  readonly citationPublisher = signal('');
  readonly tocOpen = signal(false);
  readonly bookmarks = signal<WordBookmark[]>([]);
  readonly bookmarkName = signal('');
  readonly tocList = signal<ReturnType<typeof tocEntries>>([]);
  readonly equationOpen = signal(false);
  readonly equations = signal<WordEquation[]>([]);
  readonly equationKind = signal<EquationKind>('fraction');
  readonly equationNumerator = signal('a');
  readonly equationDenominator = signal('b');
  readonly equationBase = signal('x');
  readonly equationExponent = signal('2');
  readonly equationSubscript = signal('i');
  readonly equationText = signal('x + y = z');
  readonly inkOpen = signal(false);
  readonly inkStrokes = signal<InkStroke[]>([]);
  readonly inkColor = signal('#dc2626');
  readonly inkWidth = signal(2);
  readonly inkPreview = signal<InkStroke | null>(null);
  readonly inkPage = signal(0);
  private inkPoints: InkPoint[] = [];
  readonly markupMode = signal<MarkupMode>('all');
  readonly revisionTick = signal(0);
  readonly wordRenderKey = signal(0);
  readonly selectedShapeId = signal<string | null>(null);
  readonly transitionType = signal<PptTransitionType>('fade');
  readonly transitionDuration = signal(500);
  readonly animationEffect = signal<PptAnimationEffect>('fade');
  readonly animationTrigger = signal<'click' | 'after'>('click');
  readonly pptEffectsOpen = signal(false);
  readonly pptEffectStatus = signal<string | null>(null);
  readonly pptNotesOpen = signal(false);
  readonly pptNotesDraft = signal('');
  readonly pptCommentsOpen = signal(false);
  readonly pptCommentDraft = signal('');
  readonly pptCommentIndex = signal(0);
  readonly pptSetupOpen = signal(false);
  readonly pptBackground = signal('#ffffff');
  readonly pptSize = signal<'16:9' | '4:3'>('16:9');
  readonly pptTick = signal(0);
  readonly slideComments = computed(() => {
    this.pptTick();
    return this.currentSlide()?.comments ?? [];
  });
  readonly currentPptComment = computed(() => this.slideComments()[this.pptCommentIndex()] ?? null);
  readonly smartArtOpen = signal(false);
  readonly smartArtShape = signal<PptShape | null>(null);
  readonly smartArtDraft = signal<string[]>([]);
  private mediaUrls = new Map<string, string>();
  private wordMediaUrls = new Map<string, string>();
  readonly slideAnimations = computed(() => {
    const slides = this.doc()?.ppt?.slides ?? [];
    const index = Math.min(this.selectedSlide(), Math.max(slides.length - 1, 0));
    return slides[index]?.animations ?? [];
  });
  readonly presenting = signal(false);

  readonly tabs = computed<RibbonTab[]>(() => {
    const app = this.app();
    const tabs = app ? [...APP_TABS[app]] : [];
    // Word's contextual Table tab appears while the caret sits in a table.
    if (app === 'word' && this.activeWordTable() !== null && !tabs.includes('table')) {
      tabs.splice(2, 0, 'table');
    }
    if (app === 'word' && this.activeWordTable() === null) {
      const index = tabs.indexOf('table');
      if (index >= 0) tabs.splice(index, 1);
    }
    return tabs;
  });

  readonly wordRibbonGroups = computed(() => {
    const tab = this.activeTab();
    return wordRibbonTab(tab as WordRibbonTabId)?.groups ?? [];
  });

  readonly activeWordMode = computed<WordMode>(() =>
    this.readingView() ? 'viewing' : this.tracking() ? 'suggesting' : 'editing');

  readonly wordStats = computed(() => {
    this.wordRenderKey();
    const word = this.word();
    const paragraphs = (word?.blocks ?? []).filter((block) => block.kind === 'paragraph');
    const characters = paragraphs.reduce((sum, block) =>
      sum + (block.kind === 'paragraph' ? acceptedText(block.paragraph).length : 0), 0);
    const words = word?.wordCount ?? 0;
    return {
      words,
      characters,
      paragraphs: paragraphs.length,
      pages: Math.max(1, Math.ceil(words / 500)),
    };
  });

  private readonly paragraphHeights = new Map<number, number>();
  private readonly tableRowHeights = new Map<number, number[]>();
  private readonly cellLines = new Map<string, { lineHeight: number; offsets: number[]; paragraphStarts?: number[] }>();
  private readonly rowFlow = new Map<number, CellContent[][]>();
  private wordRowFlowEnabled = false;
  // Word repeats the table header, so the row scale is calibrated with that
  // space included (1.162 keeps the bid document at Word's 546 pages after
  // multi-paragraph rows split like Word instead of overflowing the page).
  private wordRowFlowScale = 1.162;
  private wordStructureEdit = false;
  wordEditEnabled = true;
  private measureScheduled = false;
  private wordMetricScale = WORD_METRIC_SCALE;
  private wordTableScale = 1;
  private wordContentOffset = 0;
  private wordTargetDisabled = false;
  private measureSignature = '';
  private measureAttempts = 0;
  private tocSyncKey = '';
  private inlineSplitPasses = 0;
  readonly wordHeightsTick = signal(0);
  readonly wordSettled = signal(false);
  readonly wordDomVersion = signal(0);
  readonly wordMeasureAttempts = signal(0);

  readonly wordPages = computed(() => {
    this.wordRenderKey();
    this.wordHeightsTick();
    const blocks = this.word()?.blocks ?? [];
    const options = {
      paragraphs: this.paragraphHeights,
      tableRows: this.tableRowHeights,
      cellLines: this.cellLines,
      rowFlow: this.wordRowFlowEnabled ? this.rowFlow : undefined,
      sectionHeights: this.wordSectionHeights(),
      contentHeight: this.wordContentHeight(),
    };
    const base = paginateBlocks(blocks, options);
    const target = this.wordTargetDisabled || this.wordRowFlowEnabled
      || (this.word()?.sections?.length ?? 0) > 1 ? undefined : this.word()?.appPages;
    if (!target || target < 1
      || Math.abs(base.length - target) > Math.max(6, base.length * 0.12)) {
      return base;
    }
    return paginateToTarget(blocks, target, options);
  });

  readonly wordContentHeight = computed(() => {
    const word = this.word();
    const margins = word?.pageMargins;
    const pageHeight = word?.pageSize.height ?? 1056;
    return Math.max(200, pageHeight - (margins?.top ?? 96) - (margins?.bottom ?? 96) + this.wordContentOffset);
  });

  wordPageMargin(side: 'top' | 'bottom' | 'left' | 'right', page?: WordPageModel): number {
    const section = this.word()?.sections?.[page?.sectionIndex ?? 0];
    if (section) return Math.round(section.margins[side] / 15);
    return this.word()?.pageMargins?.[side] ?? 96;
  }

  readonly wordSectionHeights = computed<number[] | undefined>(() => {
    const word = this.word();
    if (!word?.sections?.length) return undefined;
    return word.sections.map((section) => Math.max(200,
      Math.round(section.pageHeight / 15)
      - Math.round(section.margins.top / 15)
      - Math.round(section.margins.bottom / 15)
      + this.wordContentOffset));
  });

  wordPageWidth(page: WordPageModel): number {
    const section = this.word()?.sections?.[page.sectionIndex ?? 0];
    return section ? Math.round(section.pageWidth / 15) : (this.word()?.pageSize.width ?? 816);
  }

  wordPageHeight(page: WordPageModel): number {
    const section = this.word()?.sections?.[page.sectionIndex ?? 0];
    return section ? Math.round(section.pageHeight / 15) : (this.word()?.pageSize.height ?? 1056);
  }

  readonly wordPageCount = computed(() => this.wordPages().length);

  readonly word = computed<WordDocument | null>(() => this.doc()?.word ?? null);
  readonly wordBlocks = computed(() => {
    this.wordRenderKey();
    return [...(this.word()?.blocks ?? [])];
  });
  readonly excel = computed<ExcelDocument | null>(() => this.doc()?.excel ?? null);
  readonly ppt = computed<PptDocument | null>(() => this.doc()?.ppt ?? null);
  readonly pdfInfo = computed(() => this.doc()?.pdf ?? null);

  readonly currentSheet = computed(() => {
    const sheets = this.excel()?.sheets ?? [];
    return sheets[Math.min(this.selectedSheet(), Math.max(sheets.length - 1, 0))] ?? null;
  });

  readonly currentSlide = computed(() => {
    const slides = this.ppt()?.slides ?? [];
    return slides[Math.min(this.selectedSlide(), Math.max(slides.length - 1, 0))] ?? null;
  });

  readonly stageWidth = 920;
  readonly stageHeight = computed(() => {
    const size = this.ppt();
    if (!size || !size.width) return 518;
    return Math.round((this.stageWidth * size.height) / size.width);
  });

  readonly statusCount = computed(() => {
    const app = this.app();
    if (app === 'word') return this.word()?.wordCount ?? 0;
    if (app === 'excel') return this.excel()?.sheets.length ?? 0;
    if (app === 'ppt') return this.ppt()?.slides.length ?? 0;
    if (app === 'pdf') return this.pdfInfo()?.pageCount ?? 0;
    return 0;
  });

  readonly statusUnitKey = computed(() => {
    const app = this.app();
    return app ? `office.unit.${app}` : '';
  });

  pickFile(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) void this.openFile(file);
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) void this.openFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  async openFile(file: File): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = await openOfficeFile(file.name, buffer);
      this.applyDocument(parsed, buffer);
    } catch (error) {
      this.error.set(this.describeError(error));
    } finally {
      this.busy.set(false);
    }
  }

  newDocument(app: OfficeApp): void {
    this.fileMenuOpen.set(false);
    this.revokePdf();
    this.buffers.set(null);
    this.dirty.set(false);
    if (app === 'word') {
      this.doc.set({
        app, fileName: 'Untitled.docx', warnings: [],
        word: { blocks: [{ kind: 'paragraph', paragraph: { runs: [] } }], wordCount: 0, pageSize: { width: 816, height: 1056 }, warnings: [] },
      });
    } else if (app === 'excel') {
      this.doc.set({
        app, fileName: 'Untitled.xlsx', warnings: [],
        excel: { sheets: [{ name: 'Sheet1', cells: new Map(), maxRow: 0, maxCol: 0, merges: [] }], warnings: [] },
      });
    } else if (app === 'ppt') {
      this.doc.set({
        app, fileName: 'Untitled.pptx', warnings: [],
        ppt: { slides: [{ index: 1, shapes: [] }], width: 1280, height: 720, warnings: [] },
      });
    } else {
      this.error.set('PDF_NEW_UNSUPPORTED');
      return;
    }
    this.resetView();
  }

  closeDocument(): void {
    this.doc.set(null);
    this.buffers.set(null);
    this.dirty.set(false);
    this.revokePdf();
    this.revokeMedia();
    this.wordUndoStack = [];
    this.wordRedoStack = [];
    this.wordSelection.set(null);
    this.wordPainter.set(null);
    this.wordClipboardStatus.set(null);
    this.formatOpen.set(false);
    this.wordHistoryTick.update((value) => value + 1);
    this.error.set(null);
    this.resetView();
  }

  toggleFileMenu(): void {
    this.fileMenuOpen.update((open) => !open);
  }

  toggleInfo(): void {
    this.infoOpen.update((open) => !open);
    this.fileMenuOpen.set(false);
  }

  print(): void {
    this.fileMenuOpen.set(false);
    window.print();
  }

  exportOriginal(): void {
    this.fileMenuOpen.set(false);
    const doc = this.doc();
    const buffer = this.pdfSource();
    if (!doc || !buffer) return;
    const bytes = doc.app === 'pdf'
      ? embedAnnotations(new Uint8Array(buffer), this.annotations())
      : new Uint8Array(buffer);
    this.downloadBytes(bytes, doc.fileName);
  }

  async save(): Promise<void> {
    const active = document.activeElement as HTMLElement | null;
    if (active?.isContentEditable) active.blur();
    const doc = this.doc();
    if (!doc || this.saving()) return;
    this.saving.set(true);
    try {
      const bytes = await this.currentBytes();
      if (!bytes) return;
      this.downloadBytes(bytes, doc.fileName);
      const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      this.buffers.set(copy);
      this.dirty.set(false);
    } catch (error) {
      this.error.set(this.describeError(error));
    } finally {
      this.saving.set(false);
      this.fileMenuOpen.set(false);
    }
  }

  async saveToErp(): Promise<void> {
    const doc = this.doc();
    const bytes = await this.currentBytes();
    if (!doc || !bytes || this.erpBusy()) return;
    this.erpBusy.set(true);
    this.erpError.set(null);
    try {
      let id = this.erpDocId();
      let version = this.erpVersion();
      if (!id) {
        const created = await firstValueFrom(this.storage.create({
          title: doc.fileName.replace(/\.[^.]+$/, ''),
          original_filename: doc.fileName,
          file_extension: extensionOf(doc.fileName),
          doc_type: docTypeOf(doc.fileName),
          mime_type: mimeOf(doc.fileName),
          size_bytes: bytes.length,
        }));
        id = created.id;
        version = created.current_version;
      }
      const saved = await firstValueFrom(this.storage.saveContent(id, bytes, doc.fileName, version));
      this.erpDocId.set(saved.id);
      this.erpVersion.set(saved.current_version);
      this.dirty.set(false);
      this.fileMenuOpen.set(false);
    } catch (error) {
      this.erpError.set(this.describeError(error));
    } finally {
      this.erpBusy.set(false);
    }
  }

  async openErpPanel(): Promise<void> {
    this.erpOpen.set(true);
    this.erpBusy.set(true);
    this.erpError.set(null);
    try {
      this.erpDocs.set(await firstValueFrom(this.storage.list()));
    } catch (error) {
      this.erpError.set(this.describeError(error));
    } finally {
      this.erpBusy.set(false);
    }
  }

  async openErpDocument(meta: OfficeDocumentMeta): Promise<void> {
    this.erpBusy.set(true);
    this.erpError.set(null);
    try {
      const buffer = await firstValueFrom(this.storage.content(meta.id, meta.current_version));
      const parsed = await openOfficeFile(meta.original_filename, buffer);
      this.applyDocument(parsed, buffer);
      this.erpDocId.set(meta.id);
      this.erpVersion.set(meta.current_version);
      this.erpOpen.set(false);
    } catch (error) {
      this.erpError.set(this.describeError(error));
    } finally {
      this.erpBusy.set(false);
    }
  }

  async openSharePanel(): Promise<void> {
    const id = this.erpDocId();
    if (!id) return;
    this.shareOpen.set(true);
    this.shareError.set(null);
    await this.loadShareList(id);
  }

  async addShare(): Promise<void> {
    const id = this.erpDocId();
    const subject = this.shareSubject().trim();
    if (!id || !subject || this.shareBusy()) return;
    this.shareBusy.set(true);
    this.shareError.set(null);
    try {
      await firstValueFrom(this.storage.share(id, subject, this.sharePermission()));
      this.shareSubject.set('');
      await this.loadShareList(id);
    } catch (error) {
      this.shareError.set(this.describeError(error));
    } finally {
      this.shareBusy.set(false);
    }
  }

  async revokeShare(permission: OfficeDocumentPermission): Promise<void> {
    const id = this.erpDocId();
    if (!id || this.shareBusy()) return;
    this.shareBusy.set(true);
    try {
      await firstValueFrom(this.storage.revoke(id, permission.id));
      await this.loadShareList(id);
    } catch (error) {
      this.shareError.set(this.describeError(error));
    } finally {
      this.shareBusy.set(false);
    }
  }

  private async loadShareList(id: string): Promise<void> {
    try {
      this.shareList.set(await firstValueFrom(this.storage.permissions(id)));
    } catch (error) {
      this.shareError.set(this.describeError(error));
    }
  }

  private async currentBytes(): Promise<Uint8Array | null> {
    const doc = this.doc();
    const buffer = this.buffers();
    if (!doc || !buffer) return null;
    if (doc.app === 'pdf') return embedAnnotations(new Uint8Array(buffer), this.annotations());
    return this.serializeCurrent();
  }

  setPdfPage(page: number): void {
    const total = this.pdfInfo()?.pageCount ?? 1;
    this.pdfPage.set(Math.max(1, Math.min(total, Math.round(page) || 1)));
    this.refreshPdfPageUrl();
  }

  private refreshPdfPageUrl(): void {
    const base = this.pdfBaseUrl;
    if (!base) return;
    this.pdfPageUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(
      `${base}#page=${this.pdfPage()}&toolbar=0&navpanes=0&scrollbar=0&view=FitH`));
  }

  nextPdfPage(): void {
    this.setPdfPage(this.pdfPage() + 1);
  }

  prevPdfPage(): void {
    this.setPdfPage(this.pdfPage() - 1);
  }

  rotatePdf(): void {
    this.pdfRotation.update((value) => (value + 90) % 360);
  }

  pdfThumbUrl(page: number): SafeResourceUrl | null {
    const base = this.pdfBaseUrl;
    if (!base) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `${base}#page=${page}&toolbar=0&navpanes=0&scrollbar=0&view=FitH`);
  }

  openPdfSearch(): void {
    if (this.app() !== 'pdf') return;
    this.pdfSearchOpen.set(true);
    setTimeout(() => {
      const input = this.hostRef.nativeElement.querySelector('.op-pdf-search-input') as HTMLInputElement | null;
      input?.focus();
      input?.select();
    });
  }

  closePdfSearch(): void {
    this.pdfSearchOpen.set(false);
  }

  updatePdfSearch(value: string): void {
    this.pdfSearchQuery.set(value);
    const hits = searchPdfPages(this.pdfTextPages(), value);
    this.pdfSearchHits.set(hits);
    this.pdfSearchIndex.set(0);
    if (hits.length) this.setPdfPage(hits[0].page);
  }

  nextPdfHit(): void {
    const hits = this.pdfSearchHits();
    if (!hits.length) return;
    const next = (this.pdfSearchIndex() + 1) % hits.length;
    this.pdfSearchIndex.set(next);
    this.setPdfPage(hits[next].page);
  }

  prevPdfHit(): void {
    const hits = this.pdfSearchHits();
    if (!hits.length) return;
    const prev = (this.pdfSearchIndex() - 1 + hits.length) % hits.length;
    this.pdfSearchIndex.set(prev);
    this.setPdfPage(hits[prev].page);
  }

  onPdfSearchEnter(event: KeyboardEvent): void {
    event.preventDefault();
    if (event.shiftKey) this.prevPdfHit();
    else this.nextPdfHit();
  }

  pdfPageText(page: number): string {
    return this.pdfTextPages().find((item) => item.page === page)?.text ?? '';
  }

  pdfPageNumbers(): number[] {
    return Array.from({ length: Math.max(1, this.pdfInfo()?.pageCount ?? 1) }, (_, index) => index + 1);
  }

  setAnnotationTool(tool: 'select' | PdfAnnotationType | 'eraser'): void {
    this.annotationTool.set(tool);
    this.pendingNote.set(null);
    this.noteDraft.set('');
  }

  onAnnotationPointerDown(event: PointerEvent): void {
    const point = this.annotationPoint(event);
    if (!point) return;
    const tool = this.annotationTool();
    if (tool === 'highlight') {
      this.annotationStart = point;
      this.annotationPreview.set({
        id: 'preview', page: this.pdfPage(), type: 'highlight', color: this.annotationColor(),
        x: point.x, y: point.y, width: 0, height: 0,
      });
      try { (event.currentTarget as Element).setPointerCapture?.(event.pointerId); } catch { /* synthetic pointer */ }
    } else if (tool === 'ink') {
      this.annotationPoints = [point];
      this.annotationPreview.set({
        id: 'preview', page: this.pdfPage(), type: 'ink', color: this.annotationColor(),
        x: point.x, y: point.y, points: [point],
      });
      try { (event.currentTarget as Element).setPointerCapture?.(event.pointerId); } catch { /* synthetic pointer */ }
    } else if (tool === 'note') {
      this.pendingNote.set(point);
    }
  }

  onAnnotationPointerMove(event: PointerEvent): void {
    const tool = this.annotationTool();
    const point = this.annotationPoint(event);
    if (!point) return;
    if (tool === 'highlight' && this.annotationStart) {
      const start = this.annotationStart;
      this.annotationPreview.set({
        id: 'preview', page: this.pdfPage(), type: 'highlight', color: this.annotationColor(),
        x: Math.min(start.x, point.x), y: Math.min(start.y, point.y),
        width: Math.abs(point.x - start.x), height: Math.abs(point.y - start.y),
      });
    } else if (tool === 'ink' && this.annotationPoints.length) {
      this.annotationPoints = [...this.annotationPoints, point];
      this.annotationPreview.set({
        id: 'preview', page: this.pdfPage(), type: 'ink', color: this.annotationColor(),
        x: this.annotationPoints[0].x, y: this.annotationPoints[0].y, points: this.annotationPoints,
      });
    }
  }

  onAnnotationPointerUp(event: PointerEvent): void {
    const preview = this.annotationPreview();
    const tool = this.annotationTool();
    if (tool === 'highlight' && preview && (preview.width ?? 0) > 0.004 && (preview.height ?? 0) > 0.004) {
      this.commitAnnotation(createAnnotation({
        page: preview.page, type: 'highlight', color: preview.color,
        x: preview.x, y: preview.y, width: preview.width, height: preview.height,
      }));
    } else if (tool === 'ink' && this.annotationPoints.length > 1) {
      const first = this.annotationPoints[0];
      this.commitAnnotation(createAnnotation({
        page: this.pdfPage(), type: 'ink', color: this.annotationColor(),
        x: first.x, y: first.y, points: this.annotationPoints, author: this.authorName(),
      }));
    }
    this.annotationPreview.set(null);
    this.annotationStart = null;
    this.annotationPoints = [];
    try { (event.currentTarget as Element).releasePointerCapture?.(event.pointerId); } catch { /* synthetic pointer */ }
  }

  addNote(): void {
    const pending = this.pendingNote();
    const text = this.noteDraft().trim();
    if (!pending || !text) return;
    this.commitAnnotation(createAnnotation({
      page: this.pdfPage(), type: 'note', color: this.annotationColor(),
      x: pending.x, y: pending.y, text, author: this.authorName(),
    }));
    this.pendingNote.set(null);
    this.noteDraft.set('');
  }

  eraseAnnotation(annotation: PdfAnnotation): void {
    if (this.annotationTool() !== 'eraser') return;
    this.annotations.set(removeAnnotation(this.annotations(), annotation.id));
    this.persistAnnotations();
  }

  clearPageAnnotations(): void {
    this.annotations.set(this.annotations().filter((annotation) => annotation.page !== this.pdfPage()));
    this.persistAnnotations();
  }

  annotationPointsValue(annotation: PdfAnnotation): string {
    return (annotation.points ?? []).map((point) => `${point.x * 1000},${point.y * 1000}`).join(' ');
  }

  private commitAnnotation(annotation: PdfAnnotation): void {
    this.annotations.set(addAnnotation(this.annotations(), annotation));
    this.persistAnnotations();
  }

  private persistAnnotations(): void {
    if (this.annotationKey) localStorage.setItem(this.annotationKey, serializeAnnotations(this.annotations()));
    this.dirty.set(true);
  }

  private annotationPoint(event: PointerEvent | MouseEvent): { x: number; y: number } | null {
    const target = event.currentTarget as SVGElement | null;
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
  }

  private async serializeCurrent(): Promise<Uint8Array | null> {
    const doc = this.doc();
    const buffer = this.buffers();
    if (!doc || !buffer || doc.app === 'pdf') return null;
    if (doc.app === 'word') return saveDocx(doc.word!, buffer);
    if (doc.app === 'excel') {
      return doc.fileName.toLowerCase().endsWith('.csv') ? saveCsv(doc.excel!) : saveXlsx(doc.excel!, buffer);
    }
    return savePptx(doc.ppt!, buffer);
  }

  @HostListener('window:popstate')
  onPopState(): void {
    const tab = tabFromUrl();
    const app = this.app();
    const allowed = app ? APP_TABS[app] : ALL_RIBBON_TABS;
    this.activeTab.set(allowed.includes(tab) ? tab : 'home');
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.presenting()) {
      if (event.key === 'Escape') { event.preventDefault(); this.exitPresent(); return; }
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') { event.preventDefault(); this.nextSlide(); return; }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); this.prevSlide(); return; }
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f' && this.app() === 'pdf') {
      event.preventDefault();
      this.openPdfSearch();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f' && this.app() === 'word') {
      const active = document.activeElement as HTMLElement | null;
      const editing = !!active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA'
        || active.tagName === 'SELECT' || active.isContentEditable);
      if (!editing) {
        event.preventDefault();
        this.toggleFind();
        return;
      }
    }
    if (this.app() === 'word' && (event.ctrlKey || event.metaKey) && !event.altKey) {
      const active = document.activeElement as HTMLElement | null;
      const editing = !!active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA'
        || active.tagName === 'SELECT' || active.isContentEditable);
      const key = event.key.toLowerCase();
      if (editing && (key === 'b' || key === 'i' || key === 'u')) {
        event.preventDefault();
        this.runWordCommand(key === 'b' ? 'bold' : key === 'i' ? 'italic' : 'underline');
        return;
      }
      if (!editing && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) this.redoWord(); else this.undoWord();
        return;
      }
      if (!editing && key === 'y') {
        event.preventDefault();
        this.redoWord();
        return;
      }
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      void this.save();
    }
  }

  onWordBlur(block: WordBlock, event: Event): void {
    if (this.wordStructureEdit) return;
    if (block.kind !== 'paragraph' || paragraphHasPageBreak(block.paragraph)) return;
    const target = event.target as HTMLElement;
    const text = target.innerText.replace(/\u00a0/g, ' ');
    if (text === block.paragraph.runs.filter((run) => !run.imagePath).map((run) => run.text).join('')) return;
    this.pushWordHistory();
    const firstRun = block.paragraph.runs.find((run) => !run.imagePath) ?? { text: '' };
    const images = block.paragraph.runs.filter((run) => run.imagePath);
    block.paragraph.runs = [{ ...firstRun, text }, ...images];
    if (block.paragraph.xmlNode) {
      if (this.tracking()) {
        trackEdit(block.paragraph.xmlNode, text, this.authorName());
        this.refreshRevisions();
        this.refreshWordText();
        this.revisionTick.update((value) => value + 1);
        this.wordRenderKey.update((value) => value + 1);
      } else {
        this.patchParagraphText(block.paragraph.xmlNode, text);
      }
    }
    this.recomputeWordCount();
    this.scheduleWordMeasure(150);
    this.dirty.set(true);
  }

  onWordParagraphKeydown(index: number, event: KeyboardEvent): void {
    const paragraph = event.currentTarget as HTMLElement | null;
    this.handleWordParagraphKey(index, paragraph, event);
  }

  onWordPageKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    let paragraph = target?.closest<HTMLElement>('.op-word-p, p[data-cell-block]') ?? null;
    if (!paragraph) {
      const selection = window.getSelection();
      const anchor = selection?.anchorNode ?? null;
      const element = anchor?.nodeType === Node.TEXT_NODE ? anchor.parentElement : anchor as HTMLElement | null;
      paragraph = element?.closest<HTMLElement>('.op-word-p, p[data-cell-block]') ?? null;
    }
    if (!paragraph) return;
    if (paragraph.hasAttribute('data-cell-block')) {
      this.handleWordCellKey(paragraph, event);
      return;
    }
    const index = Number(paragraph.getAttribute('data-paragraph'));
    if (!Number.isFinite(index)) return;
    this.handleWordParagraphKey(index, paragraph, event);
  }

  /** Remembers the table under the caret so the contextual Table tab can open. */
  captureWordTable(event?: Event): void {
    const target = event?.target as HTMLElement | null;
    const element = this.wordElementAt(target);
    const context = this.wordCellContext(element);
    if (!context) {
      this.activeWordTable.set(null);
      this.wordCellSelection.set(null);
      this.splitCellsOpen.set(false);
      if (this.activeTab() === 'table') this.setTab('home');
      return;
    }
    this.activeWordTable.set(context.block);
    this.activeWordTableRow.set(context.row);
    this.activeWordTableCell.set(context.cell);
    // A drag that ends on the same cell keeps the selected range.
    if (this.isWordCellSelected(context.block, context.row, context.cell)) return;
    const shift = event instanceof MouseEvent && event.shiftKey;
    const anchor = this.wordCellDragAnchor;
    if (shift && anchor && anchor.block === context.block) {
      this.wordCellSelection.set({
        block: anchor.block, row: anchor.row, cell: anchor.cell, row2: context.row, cell2: context.cell,
      });
      return;
    }
    this.wordCellDragAnchor = { block: context.block, row: context.row, cell: context.cell };
    this.wordCellSelection.set(null);
  }

  /** Drag across cells selects them the way Word's table selection works. */
  beginWordCellDrag(event: MouseEvent): void {
    if (event.button !== 0) return;
    const context = this.wordCellContext(this.wordElementAt(event.target as HTMLElement | null));
    this.wordCellDragAnchor = context ? { block: context.block, row: context.row, cell: context.cell } : null;
  }

  extendWordCellDrag(event: MouseEvent): void {
    const anchor = this.wordCellDragAnchor;
    if (!anchor || event.buttons !== 1) return;
    const context = this.wordCellContext(this.wordElementAt(event.target as HTMLElement | null));
    if (!context || context.block !== anchor.block) return;
    const current = this.wordCellSelection();
    if (current && current.row === anchor.row && current.cell === anchor.cell
      && current.row2 === context.row && current.cell2 === context.cell) return;
    this.wordCellSelection.set({
      block: anchor.block, row: anchor.row, cell: anchor.cell, row2: context.row, cell2: context.cell,
    });
  }

  private wordCellContext(element: HTMLElement | null): { block: number; row: number; cell: number } | null {
    const cell = element?.closest<HTMLTableCellElement>('td');
    const table = cell?.closest<HTMLTableElement>('table.op-word-table[data-block]');
    const row = cell?.closest<HTMLTableRowElement>('tr');
    if (!cell || !table || !row) return null;
    const blockIndex = Number(table.getAttribute('data-block'));
    // Hidden continue cells shift the visual index, so read the model index.
    const cellIndex = Number(cell.getAttribute('data-cell'));
    return Number.isFinite(blockIndex) && Number.isFinite(cellIndex)
      ? { block: blockIndex, row: Number(row.getAttribute('data-row')) || 0, cell: cellIndex }
      : null;
  }

  isWordCellSelected(blockIndex: number | null | undefined, row: number, cell: number): boolean {
    const selection = this.wordCellSelection();
    if (!selection || blockIndex === null || blockIndex === undefined || selection.block !== blockIndex) return false;
    const rowStart = Math.min(selection.row, selection.row2);
    const rowEnd = Math.max(selection.row, selection.row2);
    const cellStart = Math.min(selection.cell, selection.cell2);
    const cellEnd = Math.max(selection.cell, selection.cell2);
    return row >= rowStart && row <= rowEnd && cell >= cellStart && cell <= cellEnd;
  }

  wordCellColSpan(spans: (WordCellSpan | undefined)[][] | undefined, rowIndex: number, cellIndex: number): number | null {
    const layout = tableCellLayout(spans, rowIndex, cellIndex);
    return layout.colSpan > 1 ? layout.colSpan : null;
  }

  wordCellRowSpan(spans: (WordCellSpan | undefined)[][] | undefined, rowIndex: number, cellIndex: number): number | null {
    const layout = tableCellLayout(spans, rowIndex, cellIndex);
    return layout.rowSpan > 1 ? layout.rowSpan : null;
  }

  wordCellCovered(spans: (WordCellSpan | undefined)[][] | undefined, rowIndex: number, cellIndex: number): boolean {
    return tableCellLayout(spans, rowIndex, cellIndex).covered;
  }

  private wordElementAt(target: HTMLElement | null): HTMLElement | null {
    if (target?.closest?.('td')) return target;
    const selection = window.getSelection();
    const anchor = selection?.anchorNode ?? null;
    return anchor?.nodeType === Node.TEXT_NODE ? anchor.parentElement : anchor as HTMLElement | null;
  }

  private wordTableContext(): { blockIndex: number; row: number; cell: number } | null {
    const live = this.tableContextFromDom();
    if (live) return live;
    const blockIndex = this.activeWordTable();
    return blockIndex === null ? null : {
      blockIndex, row: this.activeWordTableRow(), cell: this.activeWordTableCell(),
    };
  }

  private tableContextFromDom(): { blockIndex: number; row: number; cell: number } | null {
    const element = this.wordElementAt(null);
    const context = this.wordCellContext(element);
    return context ? { blockIndex: context.block, row: context.row, cell: context.cell } : null;
  }

  /** Table commands: each edits the model and the same w:tbl node. */
  private runWordTableCommand(id: string): boolean {
    const word = this.word();
    const context = this.wordTableContext();
    if (!word || !context) return false;
    const args = { block: context.blockIndex, row: context.row, cell: context.cell };
    let changed = false;
    switch (id) {
      case 'tableInsertRowAbove': changed = insertTableRow(word, args.block, args.row, 'above'); break;
      case 'tableInsertRowBelow': changed = insertTableRow(word, args.block, args.row, 'below'); break;
      case 'tableInsertColumnLeft': changed = insertTableColumn(word, args.block, args.row, args.cell, 'left'); break;
      case 'tableInsertColumnRight': changed = insertTableColumn(word, args.block, args.row, args.cell, 'right'); break;
      case 'tableDeleteRow': changed = deleteTableRow(word, args.block, args.row); break;
      case 'tableDeleteColumn': changed = deleteTableColumn(word, args.block, args.row, args.cell); break;
      case 'tableDelete': changed = deleteWordTable(word, args.block); break;
      case 'tableHeaderRow': {
        const block = word.blocks[args.block];
        changed = block?.kind === 'table'
          && setTableHeaderRow(word, args.block, !(block.headerRows ?? 0));
        break;
      }
      case 'tableDistributeColumns': changed = distributeTableColumns(word, args.block); break;
      case 'tableCellTop': changed = setRowVerticalAlign(word, args.block, args.row, 'top'); break;
      case 'tableCellCenter': changed = setRowVerticalAlign(word, args.block, args.row, 'center'); break;
      case 'tableCellBottom': changed = setRowVerticalAlign(word, args.block, args.row, 'bottom'); break;
      case 'tableAlignLeft': changed = setTableAlignment(word, args.block, 'left'); break;
      case 'tableAlignCenter': changed = setTableAlignment(word, args.block, 'center'); break;
      case 'tableAlignRight': changed = setTableAlignment(word, args.block, 'right'); break;
      case 'tableMergeCells': {
        const selection = this.wordCellSelection();
        if (!selection || selection.block !== args.block) return true;
        changed = mergeTableCells(
          word, args.block,
          { row: selection.row, cell: selection.cell },
          { row: selection.row2, cell: selection.cell2 },
        );
        if (changed) {
          const row = Math.min(selection.row, selection.row2);
          const cell = Math.min(selection.cell, selection.cell2);
          this.activeWordTableRow.set(row);
          this.activeWordTableCell.set(cell);
          this.wordCellSelection.set({ block: args.block, row, cell, row2: row, cell2: cell });
        }
        break;
      }
      case 'tableSplitCells':
        this.splitCellRows.set(1);
        this.splitCellColumns.set(1);
        this.splitCellsOpen.set(true);
        return true;
      default: return false;
    }
    if (!changed) return true;
    this.pushWordHistory();
    if (id === 'tableDelete') {
      this.activeWordTable.set(null);
    } else if (this.activeWordTable() !== null) {
      const block = word.blocks[this.activeWordTable() as number];
      const rows = block?.kind === 'table' ? block.rows.length : 0;
      this.activeWordTableRow.set(Math.max(0, Math.min(this.activeWordTableRow(), rows - 1)));
    }
    this.keepWordScroll();
    this.afterWordStructureChange();
    return true;
  }

  /** Applies the Split Cells panel: rows x columns, Word's own dialog default 1 x 1. */
  applyWordSplitCells(): void {
    const word = this.word();
    const context = this.wordTableContext();
    if (!word || !context) return;
    const rows = Math.max(1, Math.min(10, Math.round(this.splitCellRows())));
    const columns = Math.max(1, Math.min(10, Math.round(this.splitCellColumns())));
    this.pushWordHistory();
    if (!splitTableCells(word, context.blockIndex, context.row, context.cell, rows, columns)) return;
    this.splitCellsOpen.set(false);
    this.wordCellSelection.set(null);
    this.keepWordScroll();
    this.afterWordStructureChange();
  }

  /** Enter inside a cell splits that cell's paragraph, like Word. */
  private handleWordCellKey(paragraph: HTMLElement, event: KeyboardEvent): void {
    const text = paragraph.innerText.replace(/\u00a0/g, ' ');
    const offset = this.caretOffset(paragraph);
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.splitWordCellParagraph(paragraph, text, offset);
      return;
    }
    if (event.key === 'Backspace' && offset === 0) {
      // Browser merging would leave paragraphs the model cannot address.
      event.preventDefault();
    }
  }

  private splitWordCellParagraph(element: HTMLElement, text: string, offset: number): void {
    const word = this.word();
    const blockIndex = Number(element.getAttribute('data-cell-block'));
    const row = Number(element.getAttribute('data-cell-row'));
    const cell = Number(element.getAttribute('data-cell-col'));
    const paragraphIndex = Number(element.getAttribute('data-cell-p'));
    const block = word?.blocks[blockIndex];
    if (!word || block?.kind !== 'table') return;
    const paragraphs = block.rows[row]?.[cell];
    const paragraph = paragraphs?.[paragraphIndex];
    if (!paragraphs || !paragraph) return;
    const head = text.slice(0, Math.max(0, Math.min(offset, text.length)));
    const tail = text.slice(head.length);
    this.pushWordHistory();
    const firstRun = paragraph.runs.find((run) => !run.imagePath) ?? { text: '' };
    paragraph.runs = [{ ...firstRun, text: head }];
    const next: WordParagraph = { ...paragraph, runs: [{ ...firstRun, text: tail }], xmlNode: undefined };
    paragraphs.splice(paragraphIndex + 1, 0, next);
    if (paragraph.xmlNode) {
      this.patchParagraphText(paragraph.xmlNode, head);
      const parent = this.wordCellNode(block, row, cell);
      if (parent && paragraph.xmlNode) {
        const clone = structuredClone(paragraph.xmlNode);
        next.xmlNode = clone;
        this.patchParagraphText(clone, tail);
        const at = parent.children.indexOf(paragraph.xmlNode);
        parent.children.splice(at >= 0 ? at + 1 : parent.children.length, 0, clone);
      }
    }
    this.afterWordStructureChange();
    const paragraphKey = `${blockIndex}`;
    setTimeout(() => {
      const target = this.hostRef.nativeElement.querySelector<HTMLElement>(
        `[data-cell-block="${paragraphKey}"][data-cell-row="${row}"][data-cell-col="${cell}"][data-cell-p="${paragraphIndex + 1}"]`);
      if (!target) return;
      target.focus();
      this.placeCaret(target, 0);
    }, 0);
  }

  private wordCellNode(block: Extract<WordBlock, { kind: 'table' }>, row: number, cell: number): XmlNode | null {
    const table = block.xmlNode;
    if (!table) return null;
    const rows = table.children.filter((child) => child.name === 'w:tr');
    const cells = rows[row]?.children.filter((child) => child.name === 'w:tc') ?? [];
    return cells[cell] ?? null;
  }

  private placeCaret(element: HTMLElement, offset: number): void {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let remaining = offset;
    let node = walker.nextNode();
    while (node) {
      const length = node.textContent?.length ?? 0;
      if (remaining <= length) {
        range.setStart(node, remaining);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
      remaining -= length;
      node = walker.nextNode();
    }
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  onWordPageFocusOut(event: FocusEvent): void {
    if (this.wordStructureEdit) return;
    const article = event.currentTarget as HTMLElement | null;
    const next = event.relatedTarget as Node | null;
    if (!article || (next && article.contains(next))) return;
    this.syncWordPageFromDom(article);
  }

  private syncWordPageFromDom(article: HTMLElement): void {
    const word = this.word();
    if (!word) return;
    const changes: Array<{ block: Extract<WordBlock, { kind: 'paragraph' }>; text: string }> = [];
    for (const element of article.querySelectorAll<HTMLElement>('.op-word-p[data-paragraph]')) {
      const index = Number(element.getAttribute('data-paragraph'));
      const block = word.blocks[index];
      if (!Number.isFinite(index) || block?.kind !== 'paragraph') continue;
      const text = element.innerText.replace(/\u00a0/g, ' ');
      const current = block.paragraph.runs.filter((run) => !run.imagePath).map((run) => run.text).join('');
      if (text !== current) changes.push({ block, text });
    }
    const cellChanges: Array<{ paragraph: WordParagraph; text: string }> = [];
    for (const element of article.querySelectorAll<HTMLElement>('p[data-cell-block]')) {
      const blockIndex = Number(element.getAttribute('data-cell-block'));
      const row = Number(element.getAttribute('data-cell-row'));
      const cell = Number(element.getAttribute('data-cell-col'));
      const index = Number(element.getAttribute('data-cell-p'));
      const block = word.blocks[blockIndex];
      if (block?.kind !== 'table') continue;
      const paragraph = block.rows[row]?.[cell]?.[index];
      if (!paragraph) continue;
      const text = element.innerText.replace(/\u00a0/g, ' ');
      const current = paragraph.runs.filter((run) => !run.imagePath).map((run) => run.text).join('');
      if (text !== current) cellChanges.push({ paragraph, text });
    }
    if (!changes.length && !cellChanges.length) return;
    this.pushWordHistory();
    for (const change of changes) {
      const paragraph = change.block.paragraph;
      const firstRun = paragraph.runs.find((run) => !run.imagePath) ?? { text: '' };
      const images = paragraph.runs.filter((run) => run.imagePath);
      paragraph.runs = [{ ...firstRun, text: change.text }, ...images];
      if (paragraph.xmlNode) this.patchParagraphText(paragraph.xmlNode, change.text);
    }
    for (const change of cellChanges) {
      const paragraph = change.paragraph;
      const firstRun = paragraph.runs.find((run) => !run.imagePath) ?? { text: '' };
      const images = paragraph.runs.filter((run) => run.imagePath);
      paragraph.runs = [{ ...firstRun, text: change.text }, ...images];
      if (paragraph.xmlNode) this.patchParagraphText(paragraph.xmlNode, change.text);
    }
    this.cleanupWordPageTextNodes();
    this.refreshWordSignal();
    this.wordDomVersion.update((value) => value + 1);
    this.wordRenderKey.update((value) => value + 1);
    this.recomputeWordCount();
    this.scheduleWordMeasure(100);
    this.dirty.set(true);
  }

  private cleanupWordPageTextNodes(): void {
    for (const paragraph of this.hostRef.nativeElement.querySelectorAll<HTMLElement>('.op-word-p')) {
      for (const node of [...paragraph.childNodes]) {
        if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim()) paragraph.removeChild(node);
      }
    }
  }

  private handleWordParagraphKey(index: number, paragraph: HTMLElement | null, event: KeyboardEvent): void {
    if (!paragraph?.isContentEditable) return;
    const text = paragraph.innerText.replace(/\u00a0/g, ' ');
    const offset = this.caretOffset(paragraph);
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.splitWordParagraph(index, text, offset);
      return;
    }
    if (event.key === 'Backspace' && offset === 0) {
      event.preventDefault();
      this.mergeWordParagraph(index, text);
      return;
    }
    if ((event.key === 'ArrowLeft' || event.key === 'ArrowUp') && offset === 0) {
      const previous = this.adjacentWordParagraph(index, -1);
      if (previous !== null) {
        event.preventDefault();
        this.focusWordParagraph(previous, Number.MAX_SAFE_INTEGER);
      }
      return;
    }
    if ((event.key === 'ArrowRight' || event.key === 'ArrowDown') && offset >= text.length) {
      const next = this.adjacentWordParagraph(index, 1);
      if (next !== null) {
        event.preventDefault();
        this.focusWordParagraph(next, 0);
      }
    }
  }

  private caretOffset(element: HTMLElement): number {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return 0;
    const range = selection.getRangeAt(0);
    if (!element.contains(range.startContainer)) return 0;
    const before = range.cloneRange();
    before.selectNodeContents(element);
    before.setEnd(range.startContainer, range.startOffset);
    return before.toString().length;
  }

  private adjacentWordParagraph(index: number, direction: -1 | 1): number | null {
    const word = this.word();
    if (!word) return null;
    const next = index + direction;
    if (next < 0 || next >= word.blocks.length) return null;
    return word.blocks[next].kind === 'paragraph' ? next : null;
  }

  private focusWordParagraph(index: number, offset: number): void {
    setTimeout(() => {
      const paragraph = this.hostRef.nativeElement.querySelector<HTMLElement>(`.op-word-p[data-paragraph="${index}"]`);
      if (!paragraph) return;
      const article = paragraph.closest<HTMLElement>('.op-word-page');
      article?.focus();
      const text = paragraph.innerText ?? '';
      const target = offset === Number.MAX_SAFE_INTEGER ? text.length : Math.max(0, Math.min(offset, text.length));
      const range = document.createRange();
      const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
      let remaining = target;
      let node = walker.nextNode();
      while (node) {
        const length = node.textContent?.length ?? 0;
        if (remaining <= length) {
          range.setStart(node, remaining);
          range.collapse(true);
          break;
        }
        remaining -= length;
        node = walker.nextNode();
      }
      if (!node) {
        range.selectNodeContents(paragraph);
        range.collapse(false);
      }
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }, 30);
  }

  private splitWordParagraph(index: number, text: string, offset: number): void {
    const word = this.word();
    const block = word?.blocks[index];
    if (!word || block?.kind !== 'paragraph') return;
    const before = text.slice(0, offset);
    const after = text.slice(offset);
    this.wordStructureEdit = true;
    this.pushWordHistory();
    const firstRun = block.paragraph.runs.find((run) => !run.imagePath) ?? { text: '' };
    block.paragraph.runs = [{ ...firstRun, text }];
    const node = block.paragraph.xmlNode;
    const parent = node && word.xmlRoot ? this.findXmlParent(word.xmlRoot, node) : null;
    let clone: XmlNode | undefined;
    if (node) {
      this.patchParagraphText(node, before);
      clone = this.cloneXmlNode(node);
      this.patchParagraphText(clone, after);
      if (parent) {
        const position = parent.children.indexOf(node);
        parent.children.splice(position >= 0 ? position + 1 : parent.children.length, 0, clone);
      }
    }
    const paragraph: WordParagraph = {
      ...block.paragraph,
      runs: [{ ...firstRun, text: after }],
      xmlNode: clone,
      sectionBreakAfter: undefined,
      keepNext: undefined,
    };
    word.blocks.splice(index + 1, 0, { kind: 'paragraph', paragraph, sectionIndex: block.sectionIndex });
    this.cleanupWordPageTextNodes();
    this.refreshWordSignal();
    this.wordDomVersion.update((value) => value + 1);
    this.wordRenderKey.update((value) => value + 1);
    this.recomputeWordCount();
    this.scheduleWordMeasure(60);
    this.dirty.set(true);
    setTimeout(() => {
      this.wordStructureEdit = false;
      this.focusWordParagraph(index + 1, 0);
    }, 60);
  }

  private mergeWordParagraph(index: number, text: string): void {
    const word = this.word();
    const block = word?.blocks[index];
    const previousIndex = index - 1;
    const previous = word?.blocks[previousIndex];
    if (!word || block?.kind !== 'paragraph' || previous?.kind !== 'paragraph') return;
    const previousText = previous.paragraph.runs.map((run) => run.text).join('');
    this.wordStructureEdit = true;
    this.pushWordHistory();
    const firstRun = previous.paragraph.runs.find((run) => !run.imagePath) ?? { text: '' };
    previous.paragraph.runs = [{ ...firstRun, text: previousText + text }];
    if (previous.paragraph.xmlNode) this.patchParagraphText(previous.paragraph.xmlNode, previousText + text);
    if (block.paragraph.xmlNode) {
      const parent = word.xmlRoot ? this.findXmlParent(word.xmlRoot, block.paragraph.xmlNode) : null;
      if (parent) parent.children = parent.children.filter((child) => child !== block.paragraph.xmlNode);
    }
    word.blocks.splice(index, 1);
    this.cleanupWordPageTextNodes();
    this.refreshWordSignal();
    this.wordDomVersion.update((value) => value + 1);
    this.wordRenderKey.update((value) => value + 1);
    this.recomputeWordCount();
    this.scheduleWordMeasure(60);
    this.dirty.set(true);
    setTimeout(() => {
      this.wordStructureEdit = false;
      this.focusWordParagraph(previousIndex, previousText.length);
    }, 60);
  }

  private findXmlParent(node: XmlNode, target: XmlNode): XmlNode | null {
    for (const child of node.children) {
      if (child === target) return node;
      const parent = this.findXmlParent(child, target);
      if (parent) return parent;
    }
    return null;
  }

  private cloneXmlNode(node: XmlNode): XmlNode {
    return { name: node.name, attrs: { ...node.attrs }, text: node.text, children: node.children.map((child) => this.cloneXmlNode(child)) };
  }

  onMarkupBlur(index: number, block: WordBlock, event: Event): void {
    if (block.kind !== 'paragraph') return;
    const text = (event.target as HTMLElement).innerText.replace(/\u00a0/g, ' ');
    if (text === this.markupVisibleText(index)) return;
    const word = this.word();
    if (!word) return;
    this.pushWordHistory();
    if (this.tracking()) {
      acceptAll(word);
      if (block.paragraph.xmlNode) trackEdit(block.paragraph.xmlNode, text, this.authorName());
      this.refreshRevisions();
      this.refreshWordText();
    } else {
      setAcceptedText(block.paragraph, text);
      this.refreshRevisions();
    }
    this.recomputeWordCount();
    this.revisionTick.update((value) => value + 1);
    this.wordRenderKey.update((value) => value + 1);
    this.scheduleWordMeasure(150);
    this.dirty.set(true);
  }

  toggleHeaderFooter(): void {
    if (this.headerFooterOpen()) {
      this.headerFooterOpen.set(false);
      return;
    }
    this.loadHeaderFooter();
    this.headerFooterOpen.set(true);
  }

  updateHeaderText(value: string): void {
    this.headerText.set(value);
    const ref = this.ensureHeaderFooter('header');
    if (!ref) return;
    setHeaderFooterText(ref, value);
    this.wordRenderKey.update((tick) => tick + 1);
    this.dirty.set(true);
  }

  updateFooterText(value: string): void {
    this.footerText.set(value);
    const ref = this.ensureHeaderFooter('footer');
    if (!ref) return;
    setHeaderFooterText(ref, value);
    this.wordRenderKey.update((tick) => tick + 1);
    this.dirty.set(true);
  }

  insertFooterPageNumber(): void {
    const ref = this.ensureHeaderFooter('footer');
    if (!ref) return;
    insertPageNumberField(ref);
    this.footerPageNumber.set(true);
    this.dirty.set(true);
  }

  applyPageNumberingSettings(): void {
    const section = this.currentSection();
    if (!section) return;
    setPageNumbering(section, this.pageNumberFormat(), this.pageNumberStart() ?? undefined);
    this.dirty.set(true);
  }

  updateDifferentFirstPage(value: boolean): void {
    this.differentFirstPage.set(value);
    const section = this.currentSection();
    if (!section) return;
    setTitlePage(section, value);
    this.dirty.set(true);
  }

  toggleNotes(): void {
    if (this.notesPanelOpen()) {
      this.notesPanelOpen.set(false);
      return;
    }
    const word = this.word();
    this.wordNotes.set(word?.notes ?? null);
    this.notesTick.update((value) => value + 1);
    this.notesPanelOpen.set(true);
  }

  addWordNote(): void {
    const word = this.word();
    const notes = this.wordNotes();
    const index = this.selectedParagraph();
    const text = this.wordNoteDraft().trim();
    if (!word || !notes || index === null || !text) return;
    ensureNote(word, notes, this.noteKind(), text, index);
    this.wordNoteDraft.set('');
    this.notesTick.update((value) => value + 1);
    this.dirty.set(true);
  }

  removeNoteItem(note: WordNote): void {
    const word = this.word();
    const notes = this.wordNotes();
    if (!word || !notes) return;
    deleteNote(word, notes, note.kind, note.id);
    this.notesTick.update((value) => value + 1);
    this.dirty.set(true);
  }

  gotoNote(note: WordNote): void {
    if (note.refParagraph < 0) return;
    this.selectParagraph(note.refParagraph);
    const element = this.hostRef.nativeElement.querySelector(`[data-paragraph="${note.refParagraph}"]`) as HTMLElement | null;
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  updateNoteNumbering(kind: NoteKind, format: string, restart?: string): void {
    const word = this.word();
    const notes = this.wordNotes();
    if (!word || !notes) return;
    const currentRestart = kind === 'footnote' ? notes.footnoteRestart : notes.endnoteRestart;
    setNoteNumbering(
      sectionAt(word, 0), notes, kind,
      format as NoteNumberFormat,
      (restart ?? currentRestart) as NoteRestart,
    );
    this.notesTick.update((value) => value + 1);
    this.dirty.set(true);
  }

  notesFor(paragraphIndex: number): WordNote[] {
    this.notesTick();
    return [...(this.wordNotes()?.footnotes ?? []), ...(this.wordNotes()?.endnotes ?? [])]
      .filter((note) => note.refParagraph === paragraphIndex);
  }

  toggleCitations(): void {
    if (this.citationsOpen()) {
      this.citationsOpen.set(false);
      return;
    }
    const word = this.word();
    this.sources.set([...(word?.sources ?? [])]);
    this.citationsOpen.set(true);
    this.tocOpen.set(false);
  }

  addCitation(): void {
    const word = this.word();
    if (!word || !this.citationAuthor().trim() || !this.citationTitle().trim()) return;
    const sources = this.sources();
    addCitationSource(word, sources, {
      type: this.citationType(),
      author: this.citationAuthor(),
      title: this.citationTitle(),
      year: this.citationYear(),
      publisher: this.citationPublisher().trim() || undefined,
    });
    this.sources.set([...sources]);
    word.sources = sources;
    this.citationAuthor.set('');
    this.citationTitle.set('');
    this.citationYear.set('');
    this.citationPublisher.set('');
    this.dirty.set(true);
  }

  citeSource(source: CitationSource): void {
    const word = this.word();
    const index = this.selectedParagraph() ?? 0;
    if (!word) return;
    if (insertCitation(word, this.sources(), [source.tag], index)) {
      this.refreshWordDocument();
      this.dirty.set(true);
    }
  }

  removeSource(source: CitationSource): void {
    const word = this.word();
    if (!word) return;
    const sources = this.sources();
    removeCitationSource(word, sources, source.tag);
    this.sources.set([...sources]);
    this.dirty.set(true);
  }

  insertBibliography(): void {
    const word = this.word();
    if (!word) return;
    insertBibliography(word, this.sources());
    this.refreshWordDocument();
    this.dirty.set(true);
  }

  sourcePreview(source: CitationSource): string {
    return apaBibliography(source);
  }

  toggleMailMerge(): void {
    if (this.mailMergeOpen()) {
      this.mailMergeOpen.set(false);
      return;
    }
    this.mailMergeOpen.set(true);
    this.citationsOpen.set(false);
    this.tocOpen.set(false);
    this.mergePanelMode.set('main');
    this.mergeMessage.set(null);
  }

  pickMergeData(): void {
    this.mergeFileInput?.nativeElement.click();
  }

  async loadMergeData(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const lower = file.name.toLowerCase();
      const document = lower.endsWith('.csv') || lower.endsWith('.txt')
        ? parseCsv(buffer)
        : await parseXlsx(buffer);
      const sheet = document.sheets[0];
      const parsed = sheet ? parseMergeRows(this.sheetToMergeRows(sheet)) : { fields: [], recipients: [] };
      if (!parsed.fields.length) {
        this.mergeMessage.set('office.mailMerge.noData');
        return;
      }
      this.mailMerge.set({
        ...this.mailMerge(),
        sourceName: file.name,
        fields: parsed.fields,
        recipients: parsed.recipients,
        selected: parsed.recipients.map((_, index) => index),
        previewIndex: null,
        errors: [],
      });
      if (!parsed.fields.includes(this.mergeFieldDraft())) this.mergeFieldDraft.set(parsed.fields[0]);
      if (!this.mergeRuleField()) this.mergeRuleField.set(parsed.fields[0]);
      this.mergeMessage.set(null);
    } catch {
      this.mergeMessage.set('office.mailMerge.invalidData');
    } finally {
      input.value = '';
    }
  }

  private sheetToMergeRows(sheet: ExcelSheet): string[][] {
    const rows: string[][] = [];
    for (let row = 1; row <= sheet.maxRow; row++) {
      const cells: string[] = [];
      for (let col = 1; col <= sheet.maxCol; col++) {
        cells.push(sheet.cells.get(`${numberToColumn(col)}${row}`)?.value ?? '');
      }
      rows.push(cells);
    }
    return rows;
  }

  toggleMergeRecipient(index: number): void {
    const state = this.mailMerge();
    const selected = state.selected.includes(index)
      ? state.selected.filter((item) => item !== index)
      : [...state.selected, index].sort((left, right) => left - right);
    this.mailMerge.set({ ...state, selected, previewIndex: null });
  }

  setMergeRecipients(all: boolean): void {
    const state = this.mailMerge();
    this.mailMerge.set({
      ...state,
      selected: all ? state.recipients.map((_, index) => index) : [],
      previewIndex: null,
    });
  }

  toggleMergeHighlight(): void {
    this.mailMerge.update((state) => ({ ...state, highlight: !state.highlight }));
  }

  toggleMergePreview(): void {
    const state = this.mailMerge();
    if (!state.recipients.length) {
      this.mergeMessage.set('office.mailMerge.noData');
      return;
    }
    this.mailMerge.set({
      ...state,
      previewIndex: state.previewIndex === null ? (state.selected[0] ?? 0) : null,
    });
  }

  stepMergePreview(delta: number): void {
    const state = this.mailMerge();
    if (!state.recipients.length) return;
    const current = state.previewIndex ?? (delta > 0 ? -1 : 0);
    const next = current + delta;
    if (next < 0 || next >= state.recipients.length) return;
    this.mailMerge.set({ ...state, previewIndex: next });
  }

  private mergeInsertIndex(): number {
    const blocks = this.word()?.blocks ?? [];
    const selected = this.selectedParagraph();
    if (selected !== null && blocks[selected]?.kind === 'paragraph') return selected;
    for (let index = blocks.length - 1; index >= 0; index--) {
      if (blocks[index].kind === 'paragraph') return index;
    }
    return 0;
  }

  private afterWordInsert(): void {
    this.recomputeWordCount();
    this.wordRenderKey.update((value) => value + 1);
    this.scheduleWordMeasure(150);
    this.dirty.set(true);
  }

  insertMergeFieldNow(): void {
    const word = this.word();
    if (!word) return;
    const field = this.mergeFieldDraft() || this.mailMerge().fields[0];
    if (!field || !insertMergeField(word, this.mergeInsertIndex(), field)) {
      this.mergeMessage.set('office.mailMerge.noData');
      return;
    }
    this.afterWordInsert();
  }

  insertAddressBlockNow(): void {
    const word = this.word();
    if (!word) return;
    const state = this.mailMerge();
    const pick = (...candidates: string[]): string => {
      const needles = candidates.map((candidate) => candidate.toLowerCase());
      return state.fields.find((field) => needles.some((needle) => field.toLowerCase().includes(needle))) ?? '';
    };
    const next: MailMergeState = {
      ...state,
      addressBlock: {
        name: pick('name', 'họ tên', 'ho ten'),
        company: pick('company', 'công ty', 'cong ty'),
        address: pick('address', 'địa chỉ', 'dia chi'),
        city: pick('city', 'thành phố', 'thanh pho'),
        state: pick('state', 'tỉnh', 'tinh'),
        postal: pick('postal', 'zip', 'bưu chính', 'buu chinh'),
        country: pick('country', 'quốc gia', 'quoc gia'),
      },
    };
    if (!insertAddressBlock(word, this.mergeInsertIndex(), next)) {
      this.mergeMessage.set('office.mailMerge.noData');
      return;
    }
    this.mailMerge.set(next);
    this.afterWordInsert();
  }

  insertGreetingLineNow(): void {
    const word = this.word();
    if (!word) return;
    const state = this.mailMerge();
    if (!insertGreetingLine(word, this.mergeInsertIndex(), state)) {
      this.mergeMessage.set('office.mailMerge.noData');
      return;
    }
    this.afterWordInsert();
  }

  insertMergeRuleNow(): void {
    const word = this.word();
    if (!word) return;
    const rule = this.mergeRuleKind() === 'next'
      ? { kind: 'next' as const }
      : {
        kind: 'if' as const,
        field: this.mergeRuleField() || this.mailMerge().fields[0],
        operator: this.mergeRuleOperator(),
        value: this.mergeRuleValue(),
        trueText: this.mergeRuleTrue(),
        falseText: this.mergeRuleFalse(),
      };
    if (!insertMergeRule(word, this.mergeInsertIndex(), rule)) return;
    this.afterWordInsert();
    this.mergePanelMode.set('main');
  }

  insertLabelsNow(): void {
    const word = this.word();
    if (!word) return;
    const state = this.mailMerge();
    const field = this.mergeFieldDraft() || state.fields[0] || 'Name';
    if (!insertLabels(word, 3, 8, field)) return;
    this.afterWordInsert();
  }

  finishMergeNow(): void {
    const word = this.word();
    const state = this.mailMerge();
    if (!word || !state.recipients.length) {
      this.mergeMessage.set('office.mailMerge.noData');
      return;
    }
    const count = finishMerge(word, { ...state, previewIndex: null });
    if (!count) {
      this.mergeMessage.set('office.mailMerge.noData');
      return;
    }
    this.mailMerge.set({ ...state, previewIndex: null, errors: [] });
    this.afterWordInsert();
    this.mergeMessage.set('office.mailMerge.done');
  }

  checkMergeErrorsNow(): void {
    const word = this.word();
    if (!word) return;
    const errors = checkMergeErrors(word, this.mailMerge());
    this.mailMerge.set({ ...this.mailMerge(), errors });
    this.mergeMessage.set(errors.length ? null : 'office.mailMerge.noErrors');
  }

  setMergeTarget(target: MailMergeState['target']): void {
    this.mailMerge.update((state) => ({ ...state, target }));
  }

  wordRunText(run: WordRun): string {
    const state = this.mailMerge();
    if (run.mergeField) return mergeFieldValue(state, run.mergeField, state.previewIndex);
    if (run.mergeRule) return ruleResult(run.mergeRule, state, state.previewIndex);
    return run.text;
  }

  wordRunHighlighted(run: WordRun): boolean {
    return Boolean(run.mergeField && this.mailMerge().highlight);
  }

  nestedTablesFor(block: WordBlock, rowIndex: number, cellIndex: number): WordNestedTable[] {
    if (block.kind !== 'table') return [];
    return (block.nested ?? [])
      .filter((item) => item.row === rowIndex && item.cell === cellIndex)
      .sort((left, right) => left.afterParagraph - right.afterParagraph);
  }

  mergeRecipientLabel(record: Record<string, string>, index: number): string {
    const state = this.mailMerge();
    const values = state.fields.slice(0, 2).map((field) => record[field]).filter(Boolean);
    return values.length ? `${index + 1}. ${values.join(' — ')}` : `${index + 1}`;
  }

  toggleIndex(): void {
    if (this.indexOpen()) {
      this.indexOpen.set(false);
      return;
    }
    const selection = this.wordSelection();
    if (selection?.text.trim()) this.indexTerm.set(selection.text.trim());
    this.indexOpen.set(true);
    this.citationsOpen.set(false);
    this.tocOpen.set(false);
    this.mailMergeOpen.set(false);
  }

  markIndexEntryNow(): void {
    const word = this.word();
    if (!word) return;
    const paragraphIndex = this.wordSelection()?.paragraphIndex
      ?? this.selectedParagraph()
      ?? this.mergeInsertIndex();
    if (!markIndexEntry(word, paragraphIndex, this.indexTerm())) return;
    this.indexTerm.set('');
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  insertIndexNow(): void {
    const word = this.word();
    if (!word) return;
    const entries = this.indexDisplay();
    if (!entries.length) return;
    insertIndex(word, entries);
    this.afterWordInsert();
  }

  updateIndexNow(): void {
    const word = this.word();
    if (!word) return;
    if (!hasGeneratedIndex(word)) {
      this.insertIndexNow();
      return;
    }
    const entries = this.indexDisplay();
    if (!entries.length) return;
    insertIndex(word, entries);
    this.afterWordInsert();
  }

  toggleChecklist(): void {
    const paragraph = this.selectedWordParagraph();
    if (!paragraph) return;
    const text = paragraph.runs.map((run) => run.text).join('');
    const next = text.startsWith('☑') ? text.replace('☑', '☐')
      : text.startsWith('☐') ? text.replace('☐', '☑')
        : `☐ ${text}`;
    this.pushWordHistory();
    setAcceptedText(paragraph, next);
    if (paragraph.xmlNode) this.patchParagraphText(paragraph.xmlNode, next);
    this.recomputeWordCount();
    this.scheduleWordMeasure(150);
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  toggleParagraphBordersNow(): void {
    const word = this.word();
    const index = this.selectedParagraph();
    if (!word || index === null) return;
    this.pushWordHistory();
    if (!toggleParagraphBorders(word, index)) return;
    this.wordRenderKey.update((value) => value + 1);
    this.scheduleWordMeasure(150);
    this.dirty.set(true);
  }

  toggleParagraphOptions(): void {
    this.paragraphOptionsOpen.update((value) => !value);
    this.emojiOpen.set(false);
  }

  toggleEmoji(): void {
    this.emojiOpen.update((value) => !value);
    this.paragraphOptionsOpen.set(false);
  }

  insertEmoji(char: string): void {
    const word = this.word();
    const index = this.selectedParagraph();
    if (!word || index === null) return;
    const selection = this.wordSelection();
    const hasRange = selection?.paragraphIndex === index;
    this.pushWordHistory();
    if (hasRange && selection) replaceParagraphRange(word, index, selection.start, selection.end, char);
    else {
      const paragraph = this.selectedWordParagraph();
      if (!paragraph) return;
      setAcceptedText(paragraph, paragraph.runs.map((run) => run.text).join('') + char);
      if (paragraph.xmlNode) this.patchParagraphText(paragraph.xmlNode, paragraph.runs.map((run) => run.text).join(''));
    }
    this.recomputeWordCount();
    this.scheduleWordMeasure(150);
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  markAllCommentsRead(): void {
    this.commentsRead.set(new Set(this.commentThreads().map((thread) => thread.root.id)));
  }

  isCommentRead(id: number): boolean {
    return this.commentsRead().has(id);
  }

  openViewHeaderFooter(): void {
    this.headerFooterOpen.set(true);
    this.loadHeaderFooter();
  }

  openViewNotes(kind: 'footnote' | 'endnote'): void {
    this.noteKind.set(kind);
    this.wordNotes.set(this.word()?.notes ?? null);
    this.notesTick.update((value) => value + 1);
    this.notesPanelOpen.set(true);
  }

  toggleArrangePanel(panel: 'position' | 'wrap' | 'align' | 'rotate' | 'selection'): void {
    this.arrangePanel.set(this.arrangePanel() === panel ? null : panel);
  }

  wordPageFloats(page: WordPageModel): Array<{ key: string; run: WordRun; blockIndex: number }> {
    const result: Array<{ key: string; run: WordRun; blockIndex: number }> = [];
    for (const item of page.items) {
      if (item.block.kind === 'paragraph') {
        item.block.paragraph.runs.forEach((run, runIndex) => {
          if (run.float) result.push({ key: `${item.blockIndex}:${runIndex}`, run, blockIndex: item.blockIndex });
        });
      } else {
        item.block.rows.slice(item.rowStart ?? 0, item.rowEnd ?? item.block.rows.length)
          .forEach((row, rowIndex) => {
            row.forEach((cell, cellIndex) => {
              cell.forEach((paragraph, paragraphIndex) => {
                paragraph.runs.forEach((run, runIndex) => {
                  if (run.float) {
                    result.push({
                      key: `${item.blockIndex}:${rowIndex}:${cellIndex}:${paragraphIndex}:${runIndex}`,
                      run,
                      blockIndex: item.blockIndex,
                    });
                  }
                });
              });
            });
          });
      }
    }
    return result;
  }

  isWrapFloat(run: WordRun): boolean {
    const wrap = run.float?.wrap;
    return wrap === 'square' || wrap === 'tight' || wrap === 'through';
  }

  isBlockFloat(run: WordRun): boolean {
    return run.float?.wrap === 'topAndBottom';
  }

  wordPageOverlayFloats(page: WordPageModel): Array<{ key: string; run: WordRun; blockIndex: number }> {
    return this.wordPageFloats(page).filter((item) => !this.isWrapFloat(item.run) && !this.isBlockFloat(item.run));
  }

  wrapFloatsForBlock(page: WordPageModel, blockIndex: number): Array<{ key: string; run: WordRun; blockIndex: number }> {
    return this.wordPageFloats(page)
      .filter((item) => item.blockIndex === blockIndex && this.isWrapFloat(item.run));
  }

  wordPageWrapFloats(page: WordPageModel): Array<{ key: string; run: WordRun; blockIndex: number }> {
    return this.wordPageFloats(page)
      .filter((item) => this.isWrapFloat(item.run))
      .sort((left, right) => (left.run.float?.y ?? 0) - (right.run.float?.y ?? 0));
  }

  pageWrapTop(run: WordRun): number {
    return Math.max(0, Math.min(864 - this.floatHeight(run), run.float?.y ?? 0));
  }

  blockFloatsForBlock(page: WordPageModel, blockIndex: number): Array<{ key: string; run: WordRun; blockIndex: number }> {
    return this.wordPageFloats(page)
      .filter((item) => item.blockIndex === blockIndex && this.isBlockFloat(item.run));
  }

  itemFlowHeight(item: WordPageItem): number {
    if (item.block.kind === 'paragraph') return this.paragraphHeights.get(item.blockIndex) ?? 20;
    const start = item.rowStart ?? 0;
    const end = item.rowEnd ?? item.block.rows.length;
    const measured = this.tableRowHeights.get(item.blockIndex);
    if (measured?.length) return measured.slice(start, end).reduce((sum, height) => sum + height, 0);
    return Math.max(1, end - start) * 22;
  }

  wrapTopMargin(page: WordPageModel, current: WordPageItem, run: WordRun): number {
    const target = run.float?.y ?? 0;
    let flow = 0;
    for (const item of page.items) {
      if (item === current) break;
      flow += this.itemFlowHeight(item);
    }
    return Math.round(target - flow);
  }

  blockMarginLeft(run: WordRun): number {
    return Math.max(0, Math.min(624 - this.floatWidth(run), run.float?.x ?? 0));
  }

  private blockFloatPlan(page: WordPageModel): Array<{
    itemIndex: number;
    entry: { key: string; run: WordRun; blockIndex: number };
    margin: number;
  }> {
    const inlineRuns = new Set([...this.inlineFloatSplits().values()].map((entry) => entry.run));
    const floats = this.wordPageFloats(page)
      .filter((item) => this.isBlockFloat(item.run) && !inlineRuns.has(item.run));
    const items = page.items;
    const planned = floats.map((float) => {
      const target = float.run.float?.y ?? 0;
      let flow = 0;
      let insertion = items.length;
      for (let index = 0; index < items.length; index++) {
        const height = this.itemFlowHeight(items[index]);
        if (target < flow + height) {
          insertion = index;
          break;
        }
        flow += height;
      }
      return { float, target, insertion };
    }).sort((left, right) => left.insertion - right.insertion || left.target - right.target);

    const plan: Array<{ itemIndex: number; entry: { key: string; run: WordRun; blockIndex: number }; margin: number }> = [];
    let flow = 0;
    let cursor = 0;
    items.forEach((item, index) => {
      while (cursor < planned.length && planned[cursor].insertion <= index) {
        const entry = planned[cursor];
        const margin = Math.round(entry.target - flow);
        plan.push({ itemIndex: index, entry: entry.float, margin });
        flow += margin + this.floatHeight(entry.float.run);
        cursor++;
      }
      flow += this.itemFlowHeight(item);
    });
    while (cursor < planned.length) {
      const entry = planned[cursor];
      const margin = Math.round(entry.target - flow);
      plan.push({ itemIndex: items.length, entry: entry.float, margin });
      flow += margin + this.floatHeight(entry.float.run);
      cursor++;
    }
    return plan;
  }

  blockFloatsBefore(page: WordPageModel, itemIndex: number): Array<{ key: string; run: WordRun; margin: number }> {
    return this.blockFloatPlan(page)
      .filter((entry) => entry.itemIndex === itemIndex)
      .map((entry) => ({ key: entry.entry.key, run: entry.entry.run, margin: entry.margin }));
  }

  blockFloatsAfter(page: WordPageModel): Array<{ key: string; run: WordRun; margin: number }> {
    return this.blockFloatPlan(page)
      .filter((entry) => entry.itemIndex === page.items.length)
      .map((entry) => ({ key: entry.entry.key, run: entry.entry.run, margin: entry.margin }));
  }

  inlineSplitFor(blockIndex: number): { run: WordRun; runIndex: number; offset: number } | null {
    return this.inlineFloatSplits().get(blockIndex) ?? null;
  }

  splitRunsFor(block: WordBlock, blockIndex: number, part: 'before' | 'after'): WordRun[] {
    if (block.kind !== 'paragraph') return [];
    const split = this.inlineSplitFor(blockIndex);
    if (!split) return block.paragraph.runs;
    const { before, after } = this.splitRunsAt(block.paragraph.runs, split);
    return part === 'before' ? before : after;
  }

  private splitRunsAt(
    runs: WordRun[],
    split: { runIndex: number; offset: number },
  ): { before: WordRun[]; after: WordRun[] } {
    const index = Math.max(0, Math.min(split.runIndex, runs.length));
    const target = runs[index];
    if (!target) return { before: runs, after: [] };
    const before = runs.slice(0, index);
    const after = runs.slice(index + 1);
    if (split.offset <= 0) return { before, after: [target, ...after] };
    if (split.offset >= target.text.length) return { before: [...before, target], after };
    before.push({ ...target, text: target.text.slice(0, split.offset) });
    return { before, after: [{ ...target, text: target.text.slice(split.offset) }, ...after] };
  }

  private findRunSplitAt(element: Element, target: number): { runIndex: number; offset: number } | null {
    const nodes = [...element.querySelectorAll<HTMLElement>('[data-run-index]')]
      .filter((node) => !node.closest('.op-word-float-inline'));
    for (const node of nodes) {
      const runIndex = Number(node.getAttribute('data-run-index'));
      if (!Number.isFinite(runIndex)) continue;
      const rect = node.getBoundingClientRect();
      if (rect.height === 0) continue;
      if (rect.top >= target - 1) return { runIndex, offset: 0 };
      if (rect.bottom <= target - 1) continue;
      if (node.tagName === 'IMG' || node.classList.contains('op-word-textbox')) continue;
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      let offset = 0;
      let textNode = walker.nextNode();
      while (textNode) {
        const value = textNode.textContent ?? '';
        for (let index = 0; index < value.length; index++) {
          const range = document.createRange();
          range.setStart(textNode, index);
          range.setEnd(textNode, index + 1);
          const charRect = range.getBoundingClientRect();
          if (charRect.height > 0 && charRect.top >= target - 1) return { runIndex, offset: offset + index };
        }
        offset += value.length;
        textNode = walker.nextNode();
      }
    }
    return null;
  }

  private measureInlineFloatSplits(): void {
    if (this.inlineSplitPasses >= 3) return;
    const stage = this.hostRef.nativeElement.querySelector('.op-word-stage');
    const word = this.word();
    if (!stage || !word) return;
    const next = new Map<number, { run: WordRun; runIndex: number; offset: number }>();
    for (const page of this.wordPages()) {
      const pageElement = stage.querySelector<HTMLElement>(`.op-word-page[data-page="${page.index}"]`);
      if (!pageElement) continue;
      const flow: Array<{ item: WordPageItem; top: number; height: number }> = [];
      let cursor = 0;
      for (const item of page.items) {
        const height = this.itemFlowHeight(item);
        flow.push({ item, top: cursor, height });
        cursor += height;
      }
      for (const float of this.wordPageFloats(page)) {
        if (!this.isBlockFloat(float.run)) continue;
        if ([...next.values()].some((entry) => entry.run === float.run)) continue;
        const y = float.run.float?.y ?? 0;
        const slot = flow.find((entry) => entry.item.block.kind === 'paragraph'
          && y >= entry.top - 0.5 && y < entry.top + entry.height);
        if (!slot) continue;
        const blockIndex = slot.item.blockIndex;
        const block = word.blocks[blockIndex];
        if (!block || block.kind !== 'paragraph') continue;
        if (block.paragraph.runs.includes(float.run)) continue;
        const element = pageElement.querySelector<HTMLElement>(`.op-word-p[data-paragraph="${blockIndex}"]`);
        if (!element) continue;
        const target = element.getBoundingClientRect().top + (y - slot.top);
        const split = this.findRunSplitAt(element, target);
        if (!split) continue;
        next.set(blockIndex, { run: float.run, runIndex: split.runIndex, offset: split.offset });
      }
    }
    const current = this.inlineFloatSplits();
    const same = next.size === current.size
      && [...next].every(([key, value]) => {
        const previous = current.get(key);
        return previous?.run === value.run
          && previous.runIndex === value.runIndex
          && previous.offset === value.offset;
      });
    if (same) return;
    this.inlineSplitPasses += 1;
    this.inlineFloatSplits.set(next);
    this.wordRenderKey.update((value) => value + 1);
    this.scheduleWordMeasure(150);
  }

  wrapSide(run: WordRun): 'left' | 'right' {
    const x = run.float?.x ?? 0;
    return x + this.floatWidth(run) / 2 < 312 ? 'left' : 'right';
  }

  wrapMarginLeft(run: WordRun): number {
    return this.wrapSide(run) === 'left' ? Math.max(0, Math.min(312, run.float?.x ?? 0)) : 0;
  }

  wrapMarginRight(run: WordRun): number {
    return this.wrapSide(run) === 'right'
      ? Math.max(0, 624 - ((run.float?.x ?? 0) + this.floatWidth(run)))
      : 0;
  }

  wrapShapeOutside(run: WordRun): string | null {
    if (run.float?.wrap === 'square') return 'inset(0)';
    if (run.float?.wrap === 'tight' || run.float?.wrap === 'through') {
      if (run.textBox?.shape === 'ellipse') return 'circle(50%)';
      if (run.textBox?.shape === 'roundRect') return 'inset(0 round 12px)';
      return 'inset(0)';
    }
    return null;
  }

  nestedTablesIn(
    nested: WordNestedTable[] | undefined,
    rowIndex: number,
    cellIndex: number,
  ): WordNestedTable[] {
    return (nested ?? [])
      .filter((item) => item.row === rowIndex && item.cell === cellIndex)
      .sort((left, right) => left.afterParagraph - right.afterParagraph);
  }

  isWordFloatSelected(run: WordRun): boolean {
    return this.selectedWordFloats().includes(run);
  }

  selectWordFloat(event: Event, run: WordRun): void {
    event.stopPropagation();
    const mouse = event as MouseEvent;
    const multi = mouse.ctrlKey || mouse.metaKey || mouse.shiftKey;
    const current = this.selectedWordFloats();
    this.selectedWordFloats.set(multi
      ? (current.includes(run) ? current.filter((item) => item !== run) : [...current, run])
      : [run]);
    if (run.float) {
      this.floatX.set(run.float.x);
      this.floatY.set(run.float.y);
    }
  }

  private applyToFloats(mutate: (run: WordRun) => void): void {
    const selected = this.selectedWordFloats();
    if (!selected.length) return;
    for (const run of selected) mutate(run);
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  applyFloatPosition(x: number, y: number): void {
    const run = this.selectedWordFloats()[0];
    if (!run) return;
    const deltaX = x - (run.float?.x ?? 0);
    const deltaY = y - (run.float?.y ?? 0);
    this.applyToFloats((item) => {
      setFloatPosition(item, (item.float?.x ?? 0) + deltaX, (item.float?.y ?? 0) + deltaY);
    });
    this.floatX.set(x);
    this.floatY.set(y);
  }

  applyFloatAlign(horizontal: 'left' | 'center' | 'right', vertical: 'top' | 'middle' | 'bottom'): void {
    const run = this.selectedWordFloats()[0];
    if (!run) return;
    const width = this.floatWidth(run);
    const height = this.floatHeight(run);
    const x = horizontal === 'left' ? 0 : horizontal === 'center' ? Math.round((624 - width) / 2) : 624 - width;
    const y = vertical === 'top' ? 0 : vertical === 'middle' ? Math.round((864 - height) / 2) : 864 - height;
    this.applyFloatPosition(x, y);
  }

  applyFloatWrap(wrap: 'square' | 'tight' | 'through' | 'none' | 'topAndBottom' | 'behind' | 'front'): void {
    if (!this.selectedWordFloats().length) return;
    this.applyToFloats((run) => { setFloatWrap(run, wrap); });
  }

  applyFloatRotate(degrees: number): void {
    if (!this.selectedWordFloats().length) return;
    this.applyToFloats((run) => { setFloatRotation(run, degrees); });
  }

  bringFloatForward(): void {
    const word = this.word();
    if (!word || !this.selectedWordFloats().length) return;
    const z = Math.max(...runFloats(word).map((item) => item.run.float?.z ?? 0)) + 1;
    this.applyToFloats((run) => { setFloatZ(run, z); });
  }

  sendFloatBackward(): void {
    const word = this.word();
    if (!word || !this.selectedWordFloats().length) return;
    const z = Math.min(...runFloats(word).map((item) => item.run.float?.z ?? 0)) - 1;
    this.applyToFloats((run) => { setFloatZ(run, z); });
  }

  toggleFloatVisibility(run: WordRun): void {
    setFloatHidden(run, !run.float?.hidden);
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  groupSelectedFloats(): void {
    const word = this.word();
    const selected = this.selectedWordFloats().filter((run) => run.float && !run.group);
    if (!word || selected.length < 2) return;
    const groupRun = groupFloatingRuns(word, selected);
    if (!groupRun) return;
    this.selectedWordFloats.set([groupRun]);
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  ungroupSelectedFloats(): void {
    const word = this.word();
    if (!word) return;
    const groups = this.selectedWordFloats().filter((run) => run.group);
    if (!groups.length) return;
    const children = groups.flatMap((run) => ungroupFloatingRun(word, run));
    if (!children.length) return;
    this.selectedWordFloats.set(children);
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  floatWidth(run: WordRun): number {
    return run.group?.width ?? run.textBox?.width ?? run.imageWidth ?? 160;
  }

  floatHeight(run: WordRun): number {
    return run.group?.height ?? run.textBox?.height ?? run.imageHeight ?? 80;
  }

  floatZ(run: WordRun): number {
    const wrap = run.float?.wrap;
    if (wrap === 'behind') return 0;
    if (wrap === 'front' || wrap === 'none') return 3;
    return 1;
  }

  wordFloatList(): Array<{ run: WordRun; page: number }> {
    const word = this.word();
    if (!word) return [];
    const pages = this.wordPages();
    return runFloats(word).map(({ run, paragraphIndex }) => ({
      run,
      page: Math.max(1, pageOfBlock(pages, paragraphIndex) + 1),
    }));
  }

  arrangeTitleKey(): string {
    switch (this.arrangePanel()) {
      case 'position': return 'office.arrange.position';
      case 'wrap': return 'office.arrange.wrap';
      case 'align': return 'office.arrange.align';
      case 'rotate': return 'office.arrange.rotate';
      case 'selection': return 'office.arrange.selection';
      default: return 'office.arrange.title';
    }
  }

  wordFloatLabel(run: WordRun): string {
    if (run.group) return '';
    if (run.textBox) return run.textBox.text.trim().slice(0, 30);
    if (run.imagePath) return (run.alt ?? '').trim().slice(0, 30);
    return '';
  }

  wordFloatKindKey(run: WordRun): string {
    if (run.group) return 'office.arrange.group';
    if (run.textBox) return 'office.arrange.shape';
    if (run.imagePath) return 'office.arrange.image';
    return 'office.arrange.object';
  }

  hasNestedTables(): boolean {
    const root = this.word()?.xmlRoot;
    if (!root) return false;
    let nested = false;
    const walk = (node: XmlNode, insideTable: boolean): void => {
      for (const child of node.children) {
        if (nested) return;
        if (child.name === 'w:tbl' && insideTable) {
          nested = true;
          return;
        }
        walk(child, insideTable || child.name === 'w:tbl');
      }
    };
    walk(root, false);
    return nested;
  }

  toggleToc(): void {
    if (this.tocOpen()) {
      this.tocOpen.set(false);
      return;
    }
    const word = this.word();
    this.bookmarks.set(word ? parseBookmarks(word) : []);
    this.tocList.set(word ? tocEntries(word) : []);
    this.tocOpen.set(true);
    this.citationsOpen.set(false);
  }

  addNewBookmark(): void {
    const word = this.word();
    const index = this.selectedParagraph();
    const name = this.bookmarkName().trim();
    if (!word || index === null || !name) return;
    const bookmark = addBookmark(word, name, index);
    if (!bookmark) return;
    this.bookmarks.set(parseBookmarks(word));
    this.bookmarkName.set('');
    this.dirty.set(true);
  }

  removeBookmarkItem(bookmark: WordBookmark): void {
    const word = this.word();
    if (!word) return;
    removeBookmark(word, bookmark.name);
    this.bookmarks.set(parseBookmarks(word));
    this.dirty.set(true);
  }

  insertReference(bookmark: WordBookmark): void {
    const word = this.word();
    const index = this.selectedParagraph() ?? 0;
    if (!word) return;
    if (insertCrossReference(word, bookmark, index)) {
      this.refreshWordDocument();
      this.dirty.set(true);
    }
  }

  buildToc(): void {
    const word = this.word();
    if (!word) return;
    const pages = this.wordPages();
    const pageMap = new Map<number, number>();
    for (const entry of tocEntries(word)) {
      pageMap.set(entry.paragraphIndex, Math.max(1, pageOfBlock(pages, entry.paragraphIndex) + 1));
    }
    removeToc(word);
    insertToc(word, 'Mục lục', pageMap);
    this.tocList.set(tocEntries(word));
    this.refreshWordDocument();
    this.wordRenderKey.update((value) => value + 1);
    this.scheduleWordMeasure(150);
    this.dirty.set(true);
  }

  toggleEquation(): void {
    if (this.equationOpen()) {
      this.equationOpen.set(false);
      return;
    }
    const word = this.word();
    this.equations.set(word?.equations ?? []);
    this.equationOpen.set(true);
    this.citationsOpen.set(false);
    this.tocOpen.set(false);
  }

  insertEquationItem(): void {
    const word = this.word();
    const index = this.selectedParagraph() ?? 0;
    if (!word) return;
    const input: EquationInput = { kind: this.equationKind() };
    if (input.kind === 'fraction') {
      input.numerator = this.equationNumerator();
      input.denominator = this.equationDenominator();
    } else if (input.kind === 'sqrt' || input.kind === 'linear') {
      input.text = this.equationText();
    } else if (input.kind === 'superscript') {
      input.base = this.equationBase();
      input.exponent = this.equationExponent();
    } else {
      input.base = this.equationBase();
      input.subscript = this.equationSubscript();
    }
    if (!insertEquation(word, input, index)) return;
    this.equations.set(parseEquations(word));
    this.refreshWordDocument();
    this.dirty.set(true);
  }

  removeEquationItem(equation: WordEquation): void {
    const word = this.word();
    if (!word) return;
    deleteEquation(word, equation.node);
    word.equations = parseEquations(word);
    this.equations.set(word.equations);
    this.refreshWordDocument();
    this.dirty.set(true);
  }

  equationsFor(paragraphIndex: number): WordEquation[] {
    return this.equations().filter((equation) => equation.paragraphIndex === paragraphIndex);
  }

  equationListLabel(equation: WordEquation): string {
    return equationLabel(equation.node);
  }

  toggleInk(): void {
    if (this.inkOpen()) {
      this.inkOpen.set(false);
      this.inkPreview.set(null);
      return;
    }
    const word = this.word();
    this.inkStrokes.set([...(word?.inkStrokes ?? [])]);
    this.inkOpen.set(true);
    this.equationOpen.set(false);
    this.citationsOpen.set(false);
    this.tocOpen.set(false);
  }

  onInkPointerDown(event: PointerEvent, page = 0): void {
    const point = this.inkPoint(event);
    if (!point) return;
    this.inkPage.set(page);
    this.inkPoints = [point];
    this.inkPreview.set({ id: 'preview', color: this.inkColor(), width: this.inkWidth(), points: [point], page });
    try { (event.currentTarget as Element).setPointerCapture?.(event.pointerId); } catch { /* synthetic pointer */ }
  }

  onInkPointerMove(event: PointerEvent): void {
    if (!this.inkPoints.length) return;
    const point = this.inkPoint(event);
    if (!point) return;
    this.inkPoints = [...this.inkPoints, point];
    this.inkPreview.set({ id: 'preview', color: this.inkColor(), width: this.inkWidth(), points: this.inkPoints, page: this.inkPage() });
  }

  onInkPointerUp(event: PointerEvent): void {
    const points = this.inkPoints;
    this.inkPoints = [];
    this.inkPreview.set(null);
    try { (event.currentTarget as Element).releasePointerCapture?.(event.pointerId); } catch { /* synthetic pointer */ }
    const word = this.word();
    if (!word || points.length < 2) return;
    const strokes = this.inkStrokes();
    addInkStroke(word, strokes, {
      color: this.inkColor(),
      width: this.inkWidth(),
      points,
      paragraphIndex: this.selectedParagraph() ?? 0,
      page: this.inkPage(),
    });
    word.inkStrokes = strokes;
    this.inkStrokes.set([...strokes]);
    this.dirty.set(true);
  }

  undoInkStroke(): void {
    const word = this.word();
    const strokes = this.inkStrokes();
    const last = strokes[strokes.length - 1];
    if (!word || !last) return;
    removeInkStroke(word, strokes, last.id);
    word.inkStrokes = strokes;
    this.inkStrokes.set([...strokes]);
    this.dirty.set(true);
  }

  clearInkStrokes(): void {
    const word = this.word();
    const strokes = this.inkStrokes();
    if (!word) return;
    clearInk(word, strokes);
    word.inkStrokes = strokes;
    this.inkStrokes.set([]);
    this.dirty.set(true);
  }

  inkStrokesForPage(page: number): InkStroke[] {
    return this.inkStrokes().filter((stroke) => (stroke.page ?? 0) === page);
  }

  inkPreviewForPage(page: number): InkStroke | null {
    const preview = this.inkPreview();
    return preview && (preview.page ?? 0) === page ? preview : null;
  }

  inkStrokePoints(stroke: InkStroke): string {
    return inkPointsValue(stroke);
  }

  private inkPoint(event: PointerEvent): InkPoint | null {
    const target = event.currentTarget as HTMLElement | null;
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const pressure = Number.isFinite(event.pressure) && event.pressure > 0
      ? Math.min(1, event.pressure)
      : 0.5;
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
      pressure,
    };
  }

  private refreshWordDocument(): void {
    const doc = this.doc();
    if (doc) this.doc.set({ ...doc });
  }

  toggleLayout(): void {
    if (this.layoutOpen()) {
      this.layoutOpen.set(false);
      return;
    }
    this.loadLayout();
    this.layoutOpen.set(true);
    this.accessOpen.set(false);
    this.formatOpen.set(false);
    this.headerFooterOpen.set(false);
    this.notesPanelOpen.set(false);
    this.citationsOpen.set(false);
    this.tocOpen.set(false);
  }

  applyColumns(): void {
    const word = this.word();
    const section = word ? sectionAt(word, 0) : null;
    if (!section) return;
    setColumns(section, this.columnCount(), this.columnSpace());
    this.refreshWordDocument();
    this.dirty.set(true);
  }

  applyPageSetup(): void {
    const word = this.word();
    const section = word ? sectionAt(word, 0) : null;
    if (!section) return;
    const sizes = {
      A4: { width: 11906, height: 16838 },
      Letter: { width: 12240, height: 15840 },
    };
    const size = sizes[this.pageSize()];
    const landscape = this.pageOrientation() === 'landscape';
    const margins = this.pageMargin() === 'narrow' ? 720 : this.pageMargin() === 'wide' ? 2880 : 1440;
    setPageSetup(section, {
      pageWidth: landscape ? size.height : size.width,
      pageHeight: landscape ? size.width : size.height,
      orientation: this.pageOrientation(),
      margins: { top: margins, right: margins, bottom: margins, left: margins },
    });
    this.refreshWordDocument();
    this.dirty.set(true);
  }

  togglePageSetup(): void {
    if (this.pageSetupOpen()) {
      this.pageSetupOpen.set(false);
      return;
    }
    this.loadLayout();
    this.pageSetupOpen.set(true);
    this.layoutOpen.set(false);
    this.accessOpen.set(false);
    this.findOpen.set(false);
    this.insertTableOpen.set(false);
    this.formatOpen.set(false);
  }

  applyPageBorder(): void {
    const word = this.word();
    const section = word ? sectionAt(word, 0) : null;
    if (!section) return;
    setPageBorder(section, {
      style: this.pageBorderStyle(),
      size: this.pageBorderSize(),
      color: this.pageBorderColor(),
    });
    this.refreshWordDocument();
    this.dirty.set(true);
  }

  clearPageBorder(): void {
    const word = this.word();
    const section = word ? sectionAt(word, 0) : null;
    if (!section) return;
    setPageBorder(section, null);
    this.refreshWordDocument();
    this.dirty.set(true);
  }

  applyPageColor(): void {
    const word = this.word();
    if (!word) return;
    setPageColor(word, this.pageColor());
    this.refreshWordDocument();
    this.dirty.set(true);
  }

  clearPageColor(): void {
    const word = this.word();
    if (!word) return;
    setPageColor(word, null);
    this.pageColor.set('#ffffff');
    this.refreshWordDocument();
    this.dirty.set(true);
  }

  applyLineNumbering(): void {
    const word = this.word();
    const section = word ? sectionAt(word, 0) : null;
    if (!section) return;
    setLineNumbering(section, this.lineNumberingMode());
    this.refreshWordDocument();
    this.dirty.set(true);
  }

  toggleReadingView(): void {
    this.readingView.update((value) => !value);
    if (this.readingView()) {
      this.immersive.set(false);
      this.rulerOpen.set(false);
    }
  }

  toggleImmersive(): void {
    this.immersive.update((value) => !value);
    if (this.immersive()) this.readingView.set(true);
  }

  toggleWordDark(): void {
    this.wordDark.update((value) => !value);
  }

  toggleRuler(): void {
    this.rulerOpen.update((value) => !value);
  }

  pageBorderPx(): number {
    return Math.max(0, (this.word()?.sections?.[0]?.pageBorder?.size ?? 0) * 1.333);
  }

  pageBorderCss(): string {
    const style = this.word()?.sections?.[0]?.pageBorder?.style;
    return style === 'double' ? 'double' : style === 'dashed' ? 'dashed' : style === 'none' ? 'none' : 'solid';
  }

  pageBorderColorCss(): string {
    const color = this.word()?.sections?.[0]?.pageBorder?.color;
    if (!color) return '#e5e7eb';
    return color.startsWith('#') ? color : `#${color}`;
  }

  addSectionBreak(): void {
    const word = this.word();
    if (!word) return;
    this.sectionCount.set(insertSectionBreak(word));
    this.loadLayout();
    this.refreshWordDocument();
    this.dirty.set(true);
  }

  toggleAccessibility(): void {
    if (this.accessOpen()) {
      this.accessOpen.set(false);
      return;
    }
    this.refreshAccessibility();
    this.accessOpen.set(true);
    this.layoutOpen.set(false);
    this.formatOpen.set(false);
    this.headerFooterOpen.set(false);
    this.notesPanelOpen.set(false);
    this.citationsOpen.set(false);
    this.tocOpen.set(false);
    this.findOpen.set(false);
    this.insertTableOpen.set(false);
  }

  toggleFind(): void {
    if (this.findOpen()) {
      this.findOpen.set(false);
      return;
    }
    this.findOpen.set(true);
    this.insertTableOpen.set(false);
    this.formatOpen.set(false);
    this.layoutOpen.set(false);
    this.accessOpen.set(false);
    this.headerFooterOpen.set(false);
    this.notesPanelOpen.set(false);
    this.citationsOpen.set(false);
    this.tocOpen.set(false);
  }

  toggleInsertTable(): void {
    if (this.insertTableOpen()) {
      this.insertTableOpen.set(false);
      return;
    }
    this.insertTableOpen.set(true);
    this.findOpen.set(false);
    this.layoutOpen.set(false);
    this.accessOpen.set(false);
    this.headerFooterOpen.set(false);
    this.notesPanelOpen.set(false);
    this.citationsOpen.set(false);
    this.tocOpen.set(false);
    this.formatOpen.set(false);
  }

  toggleFormat(): void {
    if (this.formatOpen()) {
      this.formatOpen.set(false);
      return;
    }
    this.formatOpen.set(true);
    this.findOpen.set(false);
    this.insertTableOpen.set(false);
    this.layoutOpen.set(false);
    this.accessOpen.set(false);
    this.headerFooterOpen.set(false);
    this.notesPanelOpen.set(false);
    this.citationsOpen.set(false);
    this.tocOpen.set(false);
  }

  toggleNavPane(): void {
    this.navPaneOpen.update((value) => !value);
    this.linkOpen.set(false);
    this.symbolOpen.set(false);
    this.videoOpen.set(false);
    this.spellOpen.set(false);
  }

  jumpToParagraph(index: number): void {
    this.selectParagraph(index);
    const element = this.hostRef.nativeElement.querySelector(`[data-paragraph="${index}"]`) as HTMLElement | null;
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  toggleLink(): void {
    this.linkOpen.update((value) => !value);
    this.navPaneOpen.set(false);
    this.symbolOpen.set(false);
    this.videoOpen.set(false);
    this.spellOpen.set(false);
  }

  applyHyperlink(): void {
    const word = this.word();
    const index = this.selectedParagraph() ?? 0;
    if (!word) return;
    this.pushWordHistory();
    if (insertHyperlink(word, index, this.linkText() || this.linkUrl(), this.linkUrl())) {
      this.afterWordTextChange();
      this.linkText.set('');
      this.linkOpen.set(false);
    }
  }

  toggleSymbol(): void {
    this.symbolOpen.update((value) => !value);
    this.navPaneOpen.set(false);
    this.linkOpen.set(false);
    this.videoOpen.set(false);
    this.spellOpen.set(false);
  }

  insertWordSymbol(symbol: string): void {
    const word = this.word();
    const index = this.selectedParagraph();
    if (!word || index === null) return;
    const block = word.blocks[index];
    if (block?.kind !== 'paragraph') return;
    const length = paragraphPlainText(block.paragraph).length;
    this.pushWordHistory();
    if (replaceParagraphRange(word, index, length, length, symbol)) this.afterWordTextChange();
  }

  toggleVideo(): void {
    this.videoOpen.update((value) => !value);
    this.navPaneOpen.set(false);
    this.linkOpen.set(false);
    this.symbolOpen.set(false);
    this.spellOpen.set(false);
  }

  applyVideo(): void {
    const word = this.word();
    if (!word) return;
    this.pushWordHistory();
    if (insertWordVideo(word, this.videoUrlDraft())) {
      this.afterWordStructureChange();
      this.videoOpen.set(false);
    }
  }

  toggleSpell(): void {
    this.spellOpen.update((value) => !value);
    this.navPaneOpen.set(false);
    this.linkOpen.set(false);
    this.symbolOpen.set(false);
    this.videoOpen.set(false);
    this.spellIssueTick.update((value) => value + 1);
  }

  fixSpell(issue: SpellIssue): void {
    this.fixSpellWith(issue, issue.suggestion);
  }

  fixSpellWith(issue: SpellIssue, suggestion: string): void {
    const word = this.word();
    if (!word) return;
    this.pushWordHistory();
    if (applySpellSuggestion(word, issue, suggestion)) {
      this.afterWordTextChange();
      this.spellIssueTick.update((value) => value + 1);
    }
  }

  ignoreSpell(issue: SpellIssue): void {
    this.spellIgnored.update((list) => [...list, issue.word.toLowerCase()]);
    this.spellIssueTick.update((value) => value + 1);
  }

  applyWordAlignment(align: ParagraphFormatInput['align']): void {
    this.applyWordParagraphFormat({ align });
  }

  indentWordParagraph(delta: number): void {
    this.applyWordParagraphFormat({ indentDelta: delta });
  }

  setWordLineSpacing(value: number): void {
    this.applyWordParagraphFormat({ lineSpacing: value });
  }

  setWordStyle(style: WordStyle): void {
    this.applyWordParagraphFormat({ style });
  }

  toggleWordList(type: 'bullet' | 'number'): void {
    const current = this.selectedWordParagraph()?.listType;
    this.applyWordParagraphFormat({ listType: current === type ? null : type });
  }

  addPageBreak(): void {
    const word = this.word();
    if (!word) return;
    this.pushWordHistory();
    insertPageBreak(word);
    this.afterWordStructureChange();
  }

  hasWordPageBreak(block: WordBlock): boolean {
    return block.kind === 'paragraph' && paragraphHasPageBreak(block.paragraph);
  }

  wordIndentPx(indent: number | undefined): number {
    return Math.round((indent ?? 0) / 15);
  }

  wordParagraphFontPx(paragraph: WordParagraph): number | null {
    return paragraph.fontSizePt ? Math.round((paragraph.fontSizePt * 96) / 72 * 100) / 100 : null;
  }

  wordLineHeight(paragraph: WordParagraph): string | number | null {
    if (paragraph.lineHeightPx) return `${paragraph.lineHeightPx}px`;
    return paragraph.lineSpacing ?? null;
  }

  /** Cell look from w:tcPr; nil edges must not draw, so they are explicit here. */
  wordCellStyle(cell: WordCellStyle | undefined): Record<string, string> | null {
    if (!cell) return null;
    const style: Record<string, string> = {};
    if (cell.fill) style['background-color'] = cell.fill;
    if (cell.valign) style['vertical-align'] = cell.valign === 'center' ? 'middle' : cell.valign;
    if (cell.borderWidthPx) {
      for (const edge of ['top', 'left', 'bottom', 'right'] as const) {
        const flag = edge === 'top' ? cell.borderTop
          : edge === 'left' ? cell.borderLeft
            : edge === 'bottom' ? cell.borderBottom : cell.borderRight;
        if (flag === undefined) continue;
        style[`border-${edge}-style`] = flag ? 'solid' : 'none';
        if (flag) style[`border-${edge}-width`] = `${cell.borderWidthPx}px`;
        if (flag && cell.borderColor) style[`border-${edge}-color`] = cell.borderColor;
      }
    }
    if (cell.padLeftPx !== undefined) style['padding-left'] = `${cell.padLeftPx}px`;
    if (cell.padRightPx !== undefined) style['padding-right'] = `${cell.padRightPx}px`;
    if (cell.padTopPx !== undefined) style['padding-top'] = `${cell.padTopPx}px`;
    if (cell.padBottomPx !== undefined) style['padding-bottom'] = `${cell.padBottomPx}px`;
    return Object.keys(style).length ? style : null;
  }

  focusWordPage(page: WordPageModel, event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target || target.closest('.op-word-p, .op-word-table, .op-word-header, .op-word-footer')) return;
    const article = target.closest<HTMLElement>('.op-word-page');
    if (!article) return;
    const paragraphs = article.querySelectorAll<HTMLElement>('.op-word-p');
    const paragraph = paragraphs?.[paragraphs.length - 1];
    if (!paragraph) return;
    article.focus();
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  private applyWordParagraphFormat(input: ParagraphFormatInput): void {
    const word = this.word();
    const index = this.selectedParagraph();
    if (!word || index === null) return;
    this.pushWordHistory();
    if (!applyParagraphFormat(word, index, input)) return;
    this.afterWordFormatChange();
  }

  private afterWordFormatChange(): void {
    this.revisionTick.update((value) => value + 1);
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  captureWordSelection(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      this.wordSelection.set(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const node = range.commonAncestorContainer;
    const element = (node.nodeType === 1 ? node as HTMLElement : node.parentElement)
      ?.closest('.op-word-p[data-paragraph]') as HTMLElement | null;
    if (!element) {
      this.wordSelection.set(null);
      return;
    }
    const index = Number(element.getAttribute('data-paragraph'));
    if (!Number.isFinite(index)) return;
    const prefix = range.cloneRange();
    prefix.selectNodeContents(element);
    prefix.setEnd(range.startContainer, range.startOffset);
    const full = range.cloneRange();
    full.selectNodeContents(element);
    const start = prefix.toString().length;
    const end = Math.min(full.toString().length, start + range.toString().length);
    if (end <= start) {
      this.wordSelection.set(null);
      return;
    }
    this.wordSelection.set({ paragraphIndex: index, start, end, text: range.toString() });
    this.selectedParagraph.set(index);
  }

  isRunActive(key: 'bold' | 'italic' | 'underline' | 'strike'): boolean {
    return Boolean(this.selectedWordRun()?.[key]);
  }

  currentWordFont(): string {
    return this.selectedWordRun()?.font ?? 'Calibri';
  }

  currentWordFontSize(): number {
    return Math.round(this.selectedWordRun()?.sizePt ?? 11);
  }

  currentWordColor(): string {
    return this.selectedWordRun()?.color ?? '#000000';
  }

  currentWordHighlight(): string {
    return this.selectedWordRun()?.highlight ?? 'none';
  }

  toggleWordRunProperty(key: 'bold' | 'italic' | 'underline' | 'strike'): void {
    this.applyWordRunFormat({ [key]: !this.isRunActive(key) } as RunFormatInput);
  }

  setWordFont(font: string): void {
    this.applyWordRunFormat({ font });
  }

  setWordFontSize(size: number): void {
    this.applyWordRunFormat({ sizePt: size });
  }

  growWordFont(delta: number): void {
    const next = Math.max(8, Math.min(72, this.currentWordFontSize() + delta));
    this.setWordFontSize(next);
  }

  setWordColor(color: string): void {
    this.applyWordRunFormat({ color });
  }

  setWordHighlight(value: string): void {
    this.applyWordRunFormat({ highlight: value === 'none' ? '' : value });
  }

  clearWordFormatting(): void {
    const word = this.word();
    const index = this.selectedParagraph();
    if (!word || index === null) return;
    const range = this.wordRangeFor(index);
    this.pushWordHistory();
    clearRunFormat(word, index, range.start, range.end);
    applyParagraphFormat(word, index, { style: 'Normal' });
    this.wordSelection.set(null);
    this.afterWordFormatChange();
  }

  async copyWordText(): Promise<void> {
    const text = this.selectedWordText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.wordClipboardStatus.set('ok');
    } catch {
      this.wordClipboardStatus.set('error');
    }
  }

  async cutWordText(): Promise<void> {
    const word = this.word();
    const index = this.selectedParagraph();
    if (!word || index === null) return;
    const text = this.selectedWordText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      this.wordClipboardStatus.set('error');
      return;
    }
    const range = this.wordRangeFor(index);
    this.pushWordHistory();
    replaceParagraphRange(word, index, range.start, range.end, '');
    this.wordSelection.set(null);
    this.afterWordFormatChange();
    this.wordClipboardStatus.set('ok');
  }

  async pasteWordText(): Promise<void> {
    const word = this.word();
    const index = this.selectedParagraph();
    if (!word || index === null) return;
    let text = '';
    try {
      text = await navigator.clipboard.readText();
    } catch {
      this.wordClipboardStatus.set('error');
      return;
    }
    if (!text) return;
    const paragraph = word.blocks[index];
    if (paragraph?.kind !== 'paragraph') return;
    const selection = this.wordSelection();
    const length = paragraphPlainText(paragraph.paragraph).length;
    const start = selection?.paragraphIndex === index ? selection.end : length;
    this.pushWordHistory();
    replaceParagraphRange(word, index, start, start, text);
    this.afterWordFormatChange();
    this.wordClipboardStatus.set('ok');
  }

  copyWordFormat(): void {
    const index = this.selectedParagraph();
    const block = index === null ? null : this.word()?.blocks[index];
    if (!block || block.kind !== 'paragraph') return;
    const run = this.selectedWordRun();
    this.wordPainter.set({
      sourceIndex: index as number,
      paragraph: {
        align: block.paragraph.align ?? 'left',
        indent: block.paragraph.indent ?? 0,
        lineSpacing: block.paragraph.lineSpacing ?? 1,
        style: block.paragraph.style as WordStyle | undefined,
      },
      run: {
        bold: run?.bold, italic: run?.italic, underline: run?.underline, strike: run?.strike,
        font: run?.font, sizePt: run?.sizePt, color: run?.color, highlight: run?.highlight,
      },
    });
  }

  private applyWordPainter(index: number): void {
    const painter = this.wordPainter();
    const word = this.word();
    this.wordPainter.set(null);
    if (!painter || !word) return;
    const block = word.blocks[index];
    if (!block || block.kind !== 'paragraph') return;
    this.pushWordHistory();
    applyParagraphFormat(word, index, painter.paragraph);
    const length = paragraphPlainText(block.paragraph).length;
    applyRunFormat(word, index, 0, length, painter.run);
    this.selectedParagraph.set(index);
    this.wordSelection.set(null);
    this.afterWordFormatChange();
  }

  private applyWordRunFormat(input: RunFormatInput): void {
    const word = this.word();
    const index = this.wordSelection()?.paragraphIndex ?? this.selectedParagraph();
    if (!word || index === null) return;
    const range = this.wordRangeFor(index);
    if (range.start === range.end) return;
    this.pushWordHistory();
    if (!applyRunFormat(word, index, range.start, range.end, input)) return;
    this.afterWordFormatChange();
  }

  private wordRangeFor(index: number): { start: number; end: number } {
    const selection = this.wordSelection();
    if (selection && selection.paragraphIndex === index && selection.end > selection.start) {
      return { start: selection.start, end: selection.end };
    }
    const block = this.word()?.blocks[index];
    return {
      start: 0,
      end: block?.kind === 'paragraph' ? paragraphPlainText(block.paragraph).length : 0,
    };
  }

  private selectedWordText(): string {
    const selection = this.wordSelection();
    if (selection?.text) return selection.text;
    const index = this.selectedParagraph();
    const block = index === null ? null : this.word()?.blocks[index];
    return block?.kind === 'paragraph' ? paragraphPlainText(block.paragraph) : '';
  }

  updateFindQuery(value: string): void {
    this.findQuery.set(value);
    this.findIndex.set(0);
    const first = this.wordFindMatches()[0];
    if (first) this.selectParagraph(first.blockIndex);
  }

  jumpToFind(index: number): void {
    const match = this.wordFindMatches()[index];
    if (!match) return;
    this.findIndex.set(index);
    this.selectParagraph(match.blockIndex);
    const element = this.hostRef.nativeElement.querySelector(`[data-paragraph="${match.blockIndex}"]`) as HTMLElement | null;
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  nextFind(): void {
    const matches = this.wordFindMatches();
    if (!matches.length) return;
    this.jumpToFind((this.findIndex() + 1) % matches.length);
  }

  prevFind(): void {
    const matches = this.wordFindMatches();
    if (!matches.length) return;
    this.jumpToFind((this.findIndex() - 1 + matches.length) % matches.length);
  }

  replaceFindOne(): void {
    const word = this.word();
    const match = this.wordFindMatches()[this.findIndex()];
    if (!word || !match) return;
    const block = word.blocks[match.blockIndex];
    if (block?.kind !== 'paragraph') return;
    this.pushWordHistory();
    const current = acceptedText(block.paragraph);
    const next = current.slice(0, match.start) + this.findReplacement() + current.slice(match.end);
    setAcceptedText(block.paragraph, next);
    this.afterWordTextChange();
    this.findIndex.set(Math.min(this.findIndex(), Math.max(0, this.wordFindMatches().length - 1)));
  }

  replaceFindAll(): void {
    const word = this.word();
    const query = this.findQuery().trim();
    if (!word || !query) return;
    const targets = [...new Set(this.wordFindMatches().map((match) => match.blockIndex))];
    if (!targets.length) return;
    this.pushWordHistory();
    for (const blockIndex of targets) {
      const block = word.blocks[blockIndex];
      if (block?.kind !== 'paragraph') continue;
      const current = acceptedText(block.paragraph);
      const next = replaceWordText(current, query, this.findReplacement(), {
        matchCase: this.findMatchCase(),
        wholeWord: this.findWholeWord(),
      });
      if (next !== current) setAcceptedText(block.paragraph, next);
    }
    this.afterWordTextChange();
    this.findIndex.set(0);
  }

  insertTableNow(): void {
    const word = this.word();
    if (!word) return;
    this.pushWordHistory();
    const block = insertWordTable(word, this.insertRows(), this.insertCols());
    if (!block) return;
    this.insertTableOpen.set(false);
    this.afterWordStructureChange();
  }

  async onWordImagePicked(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const word = this.word();
    if (!word) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    let width = 320;
    let height = 200;
    try {
      const bitmap = await createImageBitmap(new Blob([bytes], { type: file.type || 'image/png' }));
      width = bitmap.width;
      height = bitmap.height;
      bitmap.close();
    } catch {
      // keep fallback dimensions for formats the browser cannot decode
    }
    this.pushWordHistory();
    const block = insertWordImage(word, {
      bytes,
      extension: file.name.includes('.') ? file.name.split('.').pop() ?? 'png' : 'png',
      widthPx: width,
      heightPx: height,
      fileName: file.name,
    });
    input.value = '';
    if (!block) return;
    this.wordMediaUrls.clear();
    this.afterWordStructureChange();
  }

  undoWord(): void {
    const word = this.word();
    if (!word) return;
    const snapshot = this.wordUndoStack.pop();
    if (!snapshot) return;
    const current = snapshotWord(word);
    if (current) this.wordRedoStack.push(current);
    restoreWord(word, snapshot);
    this.afterWordHistoryRestore();
  }

  redoWord(): void {
    const word = this.word();
    if (!word) return;
    const snapshot = this.wordRedoStack.pop();
    if (!snapshot) return;
    const current = snapshotWord(word);
    if (current) this.wordUndoStack.push(current);
    restoreWord(word, snapshot);
    this.afterWordHistoryRestore();
  }

  private pushWordHistory(): void {
    const word = this.word();
    if (!word) return;
    const snapshot = snapshotWord(word);
    if (!snapshot) return;
    this.wordUndoStack.push(snapshot);
    if (this.wordUndoStack.length > 50) this.wordUndoStack.shift();
    this.wordRedoStack = [];
    this.wordHistoryTick.update((value) => value + 1);
  }

  private afterWordTextChange(): void {
    this.recomputeWordCount();
    this.refreshRevisions();
    this.revisionTick.update((value) => value + 1);
    this.wordRenderKey.update((value) => value + 1);
    this.scheduleWordMeasure();
    this.dirty.set(true);
  }

  /** Re-rendering every page resets the workspace scroll; put the reader back. */
  private keepWordScroll(): void {
    const workspace = this.hostRef.nativeElement.querySelector<HTMLElement>('.op-workspace');
    if (!workspace) return;
    const top = workspace.scrollTop;
    if (top < 1) return;
    for (const delay of [0, 120, 320, 700]) {
      setTimeout(() => {
        const current = this.hostRef.nativeElement.querySelector<HTMLElement>('.op-workspace');
        if (current && Math.abs(current.scrollTop - top) > 4) current.scrollTop = top;
      }, delay);
    }
  }

  private afterWordStructureChange(): void {
    this.resetWordHeights();
    this.recomputeWordCount();
    this.refreshRevisions();
    this.revisionTick.update((value) => value + 1);
    this.wordRenderKey.update((value) => value + 1);
    this.scheduleWordMeasure();
    this.dirty.set(true);
  }

  private afterWordHistoryRestore(): void {
    const word = this.word();
    if (!word) return;
    this.resetWordHeights();
    this.wordMediaUrls.clear();
    this.doc.set({ ...(this.doc() as OfficeDocument) });
    this.refreshRevisions();
    this.revisionTick.update((value) => value + 1);
    this.wordRenderKey.update((value) => value + 1);
    this.wordHistoryTick.update((value) => value + 1);
    this.scheduleWordMeasure();
    this.dirty.set(true);
  }

  setAltDraft(index: number, value: string): void {
    this.altDrafts.update((map) => ({ ...map, [index]: value }));
  }

  applyImageAlt(issue: AccessibilityIssue, index: number): void {
    const text = (this.altDrafts()[index] ?? '').trim();
    if (!issue.node || !text) return;
    setImageAlt(issue.node, text);
    this.refreshAccessibility();
    this.refreshWordDocument();
    this.dirty.set(true);
  }

  applyTableHeader(issue: AccessibilityIssue): void {
    if (!issue.node) return;
    markTableHeader(issue.node);
    this.refreshAccessibility();
    this.refreshWordDocument();
    this.dirty.set(true);
  }

  accessLabelKey(code: AccessibilityIssue['code']): string {
    return `office.word.access.${code}`;
  }

  private refreshAccessibility(): void {
    const word = this.word();
    this.accessIssues.set(word ? scanAccessibility(word) : []);
  }

  private loadLayout(): void {
    const word = this.word();
    const section = word ? sectionAt(word, 0) : null;
    this.sectionCount.set(word?.sections?.length ?? 1);
    if (!section) return;
    this.columnCount.set(section.columns);
    this.columnSpace.set(section.columnSpace);
    this.pageOrientation.set(section.orientation);
    this.pageSize.set(section.pageWidth > section.pageHeight ? 'A4' : section.pageWidth === 12240 ? 'Letter' : 'A4');
    const margin = section.margins.top;
    this.pageMargin.set(margin <= 720 ? 'narrow' : margin >= 2880 ? 'wide' : 'normal');
    this.pageBorderStyle.set(section.pageBorder?.style ?? 'single');
    this.pageBorderSize.set(section.pageBorder?.size ?? 1);
    this.pageBorderColor.set(section.pageBorder?.color ? `#${section.pageBorder.color.replace('#', '')}` : '#000000');
    this.pageColor.set(word?.pageColor ?? '#ffffff');
    this.lineNumberingMode.set(section.lineNumbering?.restart ?? 'off');
  }

  private loadHeaderFooter(): void {
    const word = this.word();
    const section = word ? sectionAt(word, 0) : null;
    if (!section) return;
    this.headerText.set(section.headers.find((ref) => ref.type === 'default')?.text ?? '');
    const footer = section.footers.find((ref) => ref.type === 'default');
    this.footerText.set(footer?.text ?? '');
    this.footerPageNumber.set(footer?.hasPageNumber ?? false);
    this.pageNumberFormat.set(section.pageNumberFormat);
    this.pageNumberStart.set(section.pageNumberStart ?? 1);
    this.differentFirstPage.set(section.titlePg);
  }

  private currentSection(): ReturnType<typeof sectionAt> {
    const word = this.word();
    return word ? sectionAt(word, 0) : null;
  }

  private ensureHeaderFooter(kind: 'header' | 'footer') {
    const word = this.word();
    const section = this.currentSection();
    if (!word || !section) return null;
    return ensureHeaderFooter(word, section, kind, 'default', word.packageEntries);
  }

  selectParagraph(index: number): void {
    if (this.wordPainter() && this.wordPainter()?.sourceIndex !== index) {
      this.applyWordPainter(index);
      return;
    }
    this.selectedParagraph.set(index);
    const selection = this.wordSelection();
    if (selection && selection.paragraphIndex !== index) this.wordSelection.set(null);
  }

  toggleComments(): void {
    this.commentsOpen.update((open) => !open);
    this.revisionsOpen.set(false);
  }

  toggleRevisions(): void {
    this.revisionsOpen.update((open) => !open);
    this.commentsOpen.set(false);
  }

  addComment(): void {
    const word = this.word();
    const index = this.selectedParagraph();
    const text = this.commentDraft().trim();
    if (!word || index === null || !text) return;
    const comments = this.comments();
    const created = createComment(comments, {
      author: this.authorName(), initials: this.authorInitials(), text, paragraphIndex: index,
    });
    applyCommentAnchor(word, created);
    this.commentDraft.set('');
    this.refreshComments();
    this.dirty.set(true);
  }

  submitReply(parent: WordComment): void {
    const text = this.replyDraft().trim();
    if (!text) return;
    replyToComment(this.comments(), parent, {
      author: this.authorName(), initials: this.authorInitials(), text,
    });
    this.replyTarget.set(null);
    this.replyDraft.set('');
    this.refreshComments();
    this.dirty.set(true);
  }

  toggleResolved(comment: WordComment): void {
    setResolved(this.comments(), comment.id, !comment.resolved);
    this.refreshComments();
    this.dirty.set(true);
  }

  removeThread(comment: WordComment): void {
    const word = this.word();
    if (!word) return;
    const removed = deleteThread(this.comments(), comment.id);
    removeCommentAnchors(word, removed);
    this.refreshComments();
    this.dirty.set(true);
  }

  gotoComment(direction: 1 | -1): void {
    const roots = this.commentThreads();
    if (!roots.length) return;
    const current = this.selectedParagraph();
    const positions = roots.map((thread) => thread.root.paragraphIndex).sort((a, b) => a - b);
    const target = direction > 0
      ? positions.find((value) => value > (current ?? -1)) ?? positions[0]
      : [...positions].reverse().find((value) => value < (current ?? Number.MAX_SAFE_INTEGER)) ?? positions[positions.length - 1];
    this.selectParagraph(target);
    const element = this.hostRef.nativeElement.querySelector(`[data-paragraph="${target}"]`) as HTMLElement | null;
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  toggleTracking(): void {
    this.tracking.update((value) => !value);
  }

  accept(id: number): void {
    const word = this.word();
    if (!word) return;
    if (acceptRevision(word, id)) {
      this.refreshRevisions();
      this.refreshWordText();
      this.revisionTick.update((value) => value + 1);
      this.wordRenderKey.update((value) => value + 1);
      this.dirty.set(true);
    }
  }

  reject(id: number): void {
    const word = this.word();
    if (!word) return;
    if (rejectRevision(word, id)) {
      this.refreshRevisions();
      this.refreshWordText();
      this.revisionTick.update((value) => value + 1);
      this.wordRenderKey.update((value) => value + 1);
      this.dirty.set(true);
    }
  }

  acceptEveryRevision(): void {
    const word = this.word();
    if (!word) return;
    acceptAll(word);
    this.refreshRevisions();
    this.refreshWordText();
    this.revisionTick.update((value) => value + 1);
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  rejectEveryRevision(): void {
    const word = this.word();
    if (!word) return;
    rejectAll(word);
    this.refreshRevisions();
    this.refreshWordText();
    this.revisionTick.update((value) => value + 1);
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  stepRevision(direction: -1 | 1, action: 'accept' | 'reject'): void {
    const revisions = this.revisions();
    if (!revisions.length) return;
    const index = Math.max(0, Math.min(this.revisionIndex(), revisions.length - 1));
    const revision = revisions[index];
    if (action === 'accept') this.accept(revision.id);
    else this.reject(revision.id);
    const next = Math.max(0, Math.min(index + direction, this.revisions().length - 1));
    this.revisionIndex.set(next);
  }

  toggleSeparatePages(): void {
    this.separatePages.update((value) => !value);
  }

  cycleCommentFilter(): void {
    const order = ['all', 'unresolved', 'resolved'] as const;
    const current = order.indexOf(this.commentFilter());
    this.commentFilter.set(order[(current + 1) % order.length]);
  }

  switchBackground(): void {
    this.toggleWordDark();
  }

  revisionLabel(revision: Revision): string {
    return revision.text || `#${revision.id}`;
  }

  private refreshComments(): void {
    const list = [...this.comments()];
    this.comments.set(list);
    const word = this.word();
    if (word) word.comments = list;
  }

  private refreshRevisions(): void {
    const word = this.word();
    this.revisions.set(word ? listRevisions(word) : []);
  }

  private refreshWordText(): void {
    const word = this.word();
    if (!word) return;
    for (const block of word.blocks) {
      if (block.kind !== 'paragraph' || !block.paragraph.xmlNode) continue;
      const text = descendants(block.paragraph.xmlNode, 'w:t').map((node) => node.text).join('');
      const images = block.paragraph.runs.filter((run) => run.imagePath);
      block.paragraph.runs = [...(text ? [{ text }] : []), ...images];
    }
    this.recomputeWordCount();
  }

  onShapeBlur(shape: PptShape, event: Event): void {
    const text = (event.target as HTMLElement).innerText.replace(/\u00a0/g, ' ');
    shape.text = text;
    if (shape.textNode) shape.textNode.text = text;
    this.dirty.set(true);
  }

  commitFormula(value: string): void {
    const sheet = this.currentSheet();
    const ref = this.selectedCell();
    if (!sheet) return;
    const parsed = parseCellRef(ref);
    if (!parsed) return;
    const formula = value.startsWith('=') ? value : undefined;
    const display = formula ? evaluateFormula(sheet, formula) : value;
    const rule = parseValidations(sheet).find((item) => item.ranges.some((range) => rangeContains(range, ref)));
    if (rule) {
      const outcome = validate(rule, display);
      if (!outcome.valid) {
        this.cellError.set(outcome.code ?? 'VALIDATION_FAILED');
        return;
      }
    }
    this.cellError.set(null);
    const existing = sheet.cells.get(ref);
    const cell: ExcelCell = existing ?? { ref, row: parsed.row, col: parsed.col, value: '', type: 'empty' };
    cell.formula = formula;
    if (formula) {
      cell.value = display;
      cell.type = display.startsWith('#') ? 'error' : 'number';
    } else {
      cell.value = value;
      cell.type = value.trim() !== '' && Number.isFinite(Number(value.replace(/,/g, ''))) ? 'number' : 'string';
    }
    sheet.cells.set(ref, cell);
    sheet.maxRow = Math.max(sheet.maxRow, parsed.row);
    sheet.maxCol = Math.max(sheet.maxCol, parsed.col);
    this.updateCellNode(sheet, cell);
    if (!this.excelManualCalc()) {
      for (const changed of recalculateSheet(sheet)) {
        const target = sheet.cells.get(changed);
        if (target && changed !== ref) this.updateCellNode(sheet, target);
      }
    }
    this.dirty.set(true);
    this.drawGrid();
  }

  toggleChart(): void {
    if (this.chartOpen()) {
      this.chartOpen.set(false);
      return;
    }
    this.chartOpen.set(true);
    this.pivotOpen.set(false);
    const saved = this.excelAnalysis().charts[0];
    if (saved) this.applyChartConfig(saved);
    else this.buildChart(true);
  }

  setChartType(type: ChartType): void {
    this.chartType.set(type);
    this.buildChart(true);
  }

  updateChartSeries(index: number, field: 'range' | 'label', value: string): void {
    const list = this.chartSeriesList().map((item, position) =>
      position === index ? { ...item, [field]: value } : item);
    this.chartSeriesList.set(list);
  }

  addChartSeries(): void {
    this.chartSeriesList.update((list) => [...list, { range: 'C2:C4', label: `Series ${list.length + 1}` }]);
  }

  removeChartSeries(index: number): void {
    this.chartSeriesList.update((list) => list.filter((_, position) => position !== index));
  }

  applyChart(): void {
    this.buildChart(true);
  }

  private buildChart(save = false): void {
    const sheet = this.currentSheet();
    if (!sheet) return;
    const config = {
      type: this.chartType(),
      categories: this.chartCategories(),
      series: this.chartSeriesList(),
      title: this.chartTitle() || sheet.name,
      showLegend: this.chartShowLegend(),
      axisTitle: this.chartAxisTitle() || undefined,
    };
    const model = buildChartModel(sheet, config);
    this.chartModel.set(model);
    if (save && !model.error) {
      const excel = this.doc()?.excel;
      if (excel) {
        upsertChart(excel, this.excelAnalysis(), { ...config, id: 'chart1' });
        this.dirty.set(true);
      }
    }
  }

  private applyChartConfig(config: SavedChartConfig): void {
    this.chartType.set(config.type);
    this.chartCategories.set(config.categories);
    this.chartSeriesList.set(config.series.map((item) => ({ ...item })));
    this.chartTitle.set(config.title ?? '');
    this.chartAxisTitle.set(config.axisTitle ?? '');
    this.chartShowLegend.set(config.showLegend !== false);
    this.buildChart(false);
  }

  togglePivot(): void {
    if (this.pivotOpen()) {
      this.pivotOpen.set(false);
      return;
    }
    this.pivotOpen.set(true);
    this.chartOpen.set(false);
    const saved = this.excelAnalysis().pivots[0];
    if (saved) {
      this.applyPivotConfig(saved);
    } else {
      this.initPivotDefaults();
    }
  }

  setPivotSource(value: string): void {
    this.pivotSource.set(value);
    this.pivotRowField.set(null);
    this.pivotColumnField.set(null);
    this.pivotValueField.set(null);
  }

  onFieldDragStart(column: number, event: DragEvent): void {
    event.dataTransfer?.setData('text/plain', String(column));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
  }

  dropPivotField(zone: 'row' | 'column' | 'value', event: DragEvent): void {
    event.preventDefault();
    const column = Number(event.dataTransfer?.getData('text/plain'));
    if (!Number.isFinite(column) || column <= 0) return;
    if (zone === 'row') this.pivotRowField.set(column);
    else if (zone === 'column') this.pivotColumnField.set(column);
    else this.pivotValueField.set(column);
  }

  clearPivotField(zone: 'row' | 'column' | 'value'): void {
    if (zone === 'row') this.pivotRowField.set(null);
    else if (zone === 'column') this.pivotColumnField.set(null);
    else this.pivotValueField.set(null);
  }

  pivotFieldName(column: number | null): string {
    return this.pivotHeaders().find((header) => header.column === column)?.name ?? '—';
  }

  buildPivotFromFields(): void {
    const sheet = this.currentSheet();
    const row = this.pivotRowField();
    const value = this.pivotValueField();
    if (!sheet || !row || !value) return;
    const source = this.pivotSource();
    const range = parsePivotSource(source);
    if (!range) return;
    const config: SavedPivotConfig = {
      id: 'pivot1',
      source,
      title: `${this.pivotFieldName(row)} × ${this.pivotFieldName(value)}`,
      rowField: { column: row, header: this.pivotFieldName(row) },
      columnField: this.pivotColumnField()
        ? { column: this.pivotColumnField()!, header: this.pivotFieldName(this.pivotColumnField()) }
        : undefined,
      values: [{
        column: value,
        aggregate: this.pivotAggregate(),
        header: this.pivotFieldName(value),
      }],
    };
    this.pivotResult.set(buildPivot(sheet, config));
    const excel = this.doc()?.excel;
    if (excel) {
      upsertPivot(excel, this.excelAnalysis(), config);
      this.dirty.set(true);
    }
  }

  private applyPivotConfig(config: SavedPivotConfig): void {
    this.pivotSource.set(config.source);
    this.pivotRowField.set(config.rowField?.column ?? null);
    this.pivotColumnField.set(config.columnField?.column ?? null);
    this.pivotValueField.set(config.values[0]?.column ?? null);
    this.pivotAggregate.set(config.values[0]?.aggregate ?? 'SUM');
    const sheet = this.currentSheet();
    if (sheet) this.pivotResult.set(buildPivot(sheet, config));
  }

  private initPivotDefaults(): void {
    const sheet = this.currentSheet();
    if (!sheet) return;
    let dataMaxRow = Math.max(sheet.maxRow, 2);
    const lastLabel = String(sheet.cells.get(`A${dataMaxRow}`)?.value ?? '').trim();
    if (dataMaxRow > 2 && /^(tổng|total)$/i.test(lastLabel)) dataMaxRow -= 1;
    const maxCol = Math.max(sheet.maxCol, 2);
    this.pivotSource.set(`A1:${numberToColumn(maxCol)}${dataMaxRow}`);
    this.pivotRowField.set(1);
    this.pivotColumnField.set(null);
    this.pivotValueField.set(Math.min(2, maxCol));
    this.pivotAggregate.set('SUM');
    this.buildPivotFromFields();
  }

  toggleCf(): void {
    this.cfOpen.update((open) => !open);
    this.dvOpen.set(false);
    this.tableOpen.set(false);
    this.chartOpen.set(false);
    this.pivotOpen.set(false);
  }

  applyConditionalFormatting(): void {
    const sheet = this.currentSheet();
    if (!sheet) return;
    const input: ConditionalRuleInput = {
      range: this.cfRange(),
      type: this.cfType(),
      operator: this.cfOperator(),
      value: this.cfValue(),
      value2: this.cfValue2(),
      text: this.cfText(),
      color: this.cfColor(),
    };
    if (addConditionalRule(sheet, input)) {
      this.excelTick.update((value) => value + 1);
      this.dirty.set(true);
      this.drawGrid();
    }
  }

  toggleDv(): void {
    this.dvOpen.update((open) => !open);
    this.cfOpen.set(false);
    this.tableOpen.set(false);
    this.chartOpen.set(false);
    this.pivotOpen.set(false);
  }

  applyDataValidation(): void {
    const sheet = this.currentSheet();
    if (!sheet) return;
    const input: ValidationRuleInput = {
      ranges: this.dvRange(),
      type: this.dvType(),
      operator: this.dvOperator(),
      formula1: this.dvFormula1(),
      formula2: this.dvFormula2(),
      errorMessage: this.dvMessage(),
    };
    if (addValidationRule(sheet, input)) this.dirty.set(true);
  }

  toggleTable(): void {
    if (this.tableOpen()) {
      this.tableOpen.set(false);
      return;
    }
    this.tableOpen.set(true);
    this.cfOpen.set(false);
    this.dvOpen.set(false);
    this.chartOpen.set(false);
    this.pivotOpen.set(false);
    this.excelFormatOpen.set(false);
    this.excelDataOpen.set(false);
    const analysis = this.excelAnalysis();
    this.tableList.set([...analysis.tables]);
    const first = analysis.tables[0];
    if (first) this.selectTable(first);
  }

  toggleExcelFormat(): void {
    if (this.excelFormatOpen()) {
      this.excelFormatOpen.set(false);
      return;
    }
    this.excelFormatOpen.set(true);
    this.excelDataOpen.set(false);
    this.cfOpen.set(false);
    this.dvOpen.set(false);
    this.tableOpen.set(false);
    this.chartOpen.set(false);
    this.pivotOpen.set(false);
  }

  toggleExcelData(): void {
    if (this.excelDataOpen()) {
      this.excelDataOpen.set(false);
      return;
    }
    this.excelDataOpen.set(true);
    this.excelFormatOpen.set(false);
    this.cfOpen.set(false);
    this.dvOpen.set(false);
    this.tableOpen.set(false);
    this.chartOpen.set(false);
    this.pivotOpen.set(false);
  }

  applyExcelFormat(input: Partial<CellStyle>): void {
    const doc = this.doc()?.excel;
    const sheet = this.currentSheet();
    if (!doc || !sheet) return;
    const ref = this.selectedCell();
    const position = parseCellRef(ref);
    if (!position) return;
    if (!sheet.cells.has(ref)) {
      sheet.cells.set(ref, {
        ref, row: position.row, col: position.col, value: '', type: 'empty',
      });
    }
    applyCellStyle(doc, sheet, ref, input);
    rebuildSheetData(sheet);
    this.afterExcelChange();
  }

  setExcelNumberFormat(value: string): void {
    this.applyExcelFormat({ numberFormat: value === 'General' ? undefined : value });
  }

  growExcelFont(delta: number): void {
    const current = this.selectedExcelStyle().sizePt ?? 11;
    this.applyExcelFormat({ sizePt: Math.max(8, Math.min(72, current + delta)) });
  }

  toggleExcelBorder(): void {
    this.applyExcelFormat({ border: !this.selectedExcelStyle().border });
  }

  toggleFreezePane(): void {
    const sheet = this.currentSheet();
    if (!sheet) return;
    if (sheet.freeze) {
      clearFreezePane(sheet);
    } else {
      const position = parseCellRef(this.selectedCell());
      if (!position) return;
      setFreezePane(sheet, Math.max(0, position.row - 1), Math.max(0, position.col - 1));
    }
    this.afterExcelChange();
  }

  sortExcel(ascending: boolean): void {
    const sheet = this.currentSheet();
    const position = parseCellRef(this.selectedCell());
    if (!sheet || !position) return;
    this.excelSortAscending.set(ascending);
    this.excelLastSort.set([{ column: position.col, ascending }]);
    sortSheetKeys(sheet, this.excelLastSort() ?? []);
    this.afterExcelChange();
  }

  customSortExcel(): void {
    const sheet = this.currentSheet();
    const position = parseCellRef(this.selectedCell());
    if (!sheet || !position) return;
    const keys: SortKey[] = [{ column: position.col, ascending: this.excelSortAscending() }];
    const secondary = this.excelSecondarySort();
    if (secondary > 0 && secondary !== position.col) keys.push({ column: secondary, ascending: this.excelSortAscending() });
    this.excelLastSort.set(keys);
    sortSheetKeys(sheet, keys);
    this.afterExcelChange();
  }

  reapplyExcelSort(): void {
    const sheet = this.currentSheet();
    const keys = this.excelLastSort();
    if (!sheet || !keys?.length) return;
    sortSheetKeys(sheet, keys);
    this.afterExcelChange();
  }

  insertExcelCells(direction: 'right' | 'down'): void {
    const sheet = this.currentSheet();
    if (!sheet) return;
    insertCells(sheet, this.selectedCell(), direction);
    this.afterExcelChange();
  }

  deleteExcelCells(direction: 'left' | 'up'): void {
    const sheet = this.currentSheet();
    if (!sheet) return;
    deleteCells(sheet, this.selectedCell(), direction);
    this.afterExcelChange();
  }

  insertExcelRow(): void {
    const sheet = this.currentSheet();
    const position = parseCellRef(this.selectedCell());
    if (!sheet || !position) return;
    insertRow(sheet, position.row);
    this.afterExcelChange();
  }

  deleteExcelRow(): void {
    const sheet = this.currentSheet();
    const position = parseCellRef(this.selectedCell());
    if (!sheet || !position) return;
    deleteRow(sheet, position.row);
    this.afterExcelChange();
  }

  insertExcelColumn(): void {
    const sheet = this.currentSheet();
    const position = parseCellRef(this.selectedCell());
    if (!sheet || !position) return;
    insertColumn(sheet, position.col);
    this.afterExcelChange();
  }

  deleteExcelColumn(): void {
    const sheet = this.currentSheet();
    const position = parseCellRef(this.selectedCell());
    if (!sheet || !position) return;
    deleteColumn(sheet, position.col);
    this.afterExcelChange();
  }

  autoSumExcel(): void {
    const sheet = this.currentSheet();
    if (!sheet) return;
    autoSum(sheet, this.selectedCell());
    this.afterExcelChange();
  }

  clearExcelCell(mode: 'contents' | 'formats' | 'all'): void {
    const sheet = this.currentSheet();
    if (!sheet) return;
    clearCell(sheet, this.selectedCell(), mode);
    this.afterExcelChange();
  }

  mergeExcelRange(): void {
    const sheet = this.currentSheet();
    const doc = this.doc()?.excel;
    if (!sheet || !doc) return;
    const range = normalizeRange(this.excelRange()) ?? `${this.selectedCell()}:${this.selectedCell()}`;
    mergeAndCenter(doc, sheet, range);
    this.afterExcelChange();
  }

  unmergeExcelRange(): void {
    const sheet = this.currentSheet();
    if (!sheet) return;
    unmergeRange(sheet, this.excelRange());
    this.afterExcelChange();
  }

  toggleExcelWrap(): void {
    this.applyExcelFormat({ wrapText: !this.selectedExcelStyle().wrapText });
  }

  indentExcel(delta: number): void {
    const current = this.selectedExcelStyle().indent ?? 0;
    this.applyExcelFormat({ indent: Math.max(0, Math.min(15, current + delta)) });
  }

  changeExcelDecimals(delta: number): void {
    const current = this.selectedExcelStyle().numberFormat ?? '0.00';
    const decimals = (current.split('.')[1] ?? '').replace(/[^0]/g, '').length;
    const next = Math.max(0, Math.min(6, decimals + delta));
    const format = next === 0 ? '0' : `0.${'0'.repeat(next)}`;
    this.setExcelNumberFormat(format);
  }

  applyExcelStylePreset(preset: 'normal' | 'good' | 'bad' | 'neutral' | 'total'): void {
    const sheet = this.currentSheet();
    const doc = this.doc()?.excel;
    if (!sheet || !doc) return;
    const previousFormat = this.selectedExcelStyle().numberFormat;
    clearCell(sheet, this.selectedCell(), 'formats');
    const input: Partial<CellStyle> = preset === 'good'
      ? { fill: '#C6EFCE', color: '#006100' }
      : preset === 'bad' ? { fill: '#FFC7CE', color: '#9C0006' }
        : preset === 'neutral' ? { fill: '#FFEB9C', color: '#9C6500' }
          : preset === 'total' ? { fill: '#E2EFDA', color: '#1F4E79', bold: true, border: true }
            : {};
    if (previousFormat) input.numberFormat = previousFormat;
    if (Object.keys(input).length) {
      applyCellStyle(doc, sheet, this.selectedCell(), input);
      rebuildSheetData(sheet);
    }
    this.afterExcelChange();
  }

  deleteExcelConditionalRule(index: number): void {
    const sheet = this.currentSheet();
    if (!sheet) return;
    if (removeConditionalRule(sheet, index)) this.afterExcelChange();
  }

  clearExcelConditionalRules(): void {
    const sheet = this.currentSheet();
    if (!sheet) return;
    if (clearConditionalRules(sheet)) this.afterExcelChange();
  }

  addExcelDefinedName(): void {
    const excel = this.doc()?.excel;
    if (!excel) return;
    if (addDefinedName(excel, this.excelNameDraft(), this.excelFormulaDraft(), 0)) {
      this.excelNameDraft.set('');
      this.afterExcelChange();
    }
  }

  deleteExcelDefinedName(name: string): void {
    const excel = this.doc()?.excel;
    if (!excel) return;
    if (removeDefinedName(excel, name)) this.afterExcelChange();
  }

  toggleExcelSheetProtection(): void {
    const sheet = this.currentSheet();
    if (!sheet) return;
    setSheetProtection(sheet, !sheet.protected);
    this.afterExcelChange();
  }

  toggleExcelWorkbookProtection(): void {
    const excel = this.doc()?.excel;
    if (!excel) return;
    setWorkbookProtection(excel, !workbookProtected(excel));
    this.afterExcelChange();
  }

  toggleExcelShowFormulas(): void {
    this.excelShowFormulas.update((value) => !value);
    this.drawGrid();
  }

  calculateExcel(): void {
    const sheet = this.currentSheet();
    const doc = this.doc()?.excel;
    if (!sheet || !doc) return;
    recalculateSheet(sheet);
    this.afterExcelChange();
  }

  calculateExcelWorkbook(): void {
    const doc = this.doc()?.excel;
    if (!doc) return;
    for (const sheet of doc.sheets) recalculateSheet(sheet);
    this.afterExcelChange();
  }

  toggleExcelManualCalc(): void {
    this.excelManualCalc.update((value) => !value);
  }

  saveExcelComment(): void {
    const sheet = this.currentSheet();
    const excel = this.doc()?.excel;
    if (!sheet || !excel) return;
    const ref = this.selectedCell();
    if (!sheet.comments) sheet.comments = new Map();
    const text = this.excelCommentDraft().trim();
    if (!text) {
      sheet.comments.delete(ref);
    } else {
      sheet.comments.set(ref, { ref, author: this.authorName(), text });
    }
    writeSheetComments(excel.packageEntries ?? new Map(), sheet);
    this.afterExcelChange();
  }

  deleteExcelComment(): void {
    const sheet = this.currentSheet();
    const excel = this.doc()?.excel;
    if (!sheet || !excel) return;
    sheet.comments?.delete(this.selectedCell());
    this.excelCommentDraft.set('');
    writeSheetComments(excel.packageEntries ?? new Map(), sheet);
    this.afterExcelChange();
  }

  nextExcelComment(delta: number): void {
    const comments = this.excelComments();
    if (!comments.length) return;
    const next = (this.excelCommentIndex() + delta + comments.length) % comments.length;
    this.excelCommentIndex.set(next);
    this.selectedCell.set(comments[next].ref);
    this.excelCommentDraft.set(comments[next].text);
    this.drawGrid();
  }

  applyExcelFilter(): void {
    const position = parseCellRef(this.selectedCell());
    if (!position) return;
    this.excelFilter.set({ column: position.col, value: this.excelFilterValue() });
    this.afterExcelChange();
  }

  clearExcelFilter(): void {
    this.excelFilter.set(null);
    this.excelFilterValue.set('');
    this.afterExcelChange();
  }

  updateExcelFind(value: string): void {
    this.excelFindQuery.set(value);
    this.excelFindIndex.set(0);
  }

  nextExcelFind(delta: number): void {
    const matches = this.excelFindMatches();
    if (!matches.length) return;
    const next = (this.excelFindIndex() + delta + matches.length) % matches.length;
    this.excelFindIndex.set(next);
    this.selectedCell.set(matches[next].ref);
    this.afterExcelChange();
  }

  private afterExcelChange(): void {
    this.excelTick.update((value) => value + 1);
    this.dirty.set(true);
    setTimeout(() => this.drawGrid(), 0);
  }

  createTable(): void {
    const sheet = this.currentSheet();
    const excel = this.doc()?.excel;
    if (!sheet || !excel) return;
    const table = createTableConfig(sheet, this.tableSource(), this.tableName());
    if (!table) return;
    const analysis = this.excelAnalysis();
    analysis.tables.push(table);
    saveAnalysis(excel, analysis);
    this.tableList.set([...analysis.tables]);
    this.tableName.set(`Table${analysis.tables.length + 1}`);
    this.selectTable(table);
    this.dirty.set(true);
  }

  selectTable(table: SavedTable): void {
    this.activeTableId.set(table.id);
    this.tableColumns.set(table.columns);
    this.slicerColumn.set(table.columns[0] ?? '');
    this.refreshSlicerSelection(table);
    this.refreshTablePreview(table);
  }

  chooseSlicerColumn(column: string): void {
    this.slicerColumn.set(column);
    const table = this.tableList().find((item) => item.id === this.activeTableId());
    if (table) {
      this.refreshSlicerSelection(table);
      this.refreshTablePreview(table);
    }
  }

  slicerChoices(): string[] {
    const sheet = this.currentSheet();
    const table = this.tableList().find((item) => item.id === this.activeTableId());
    if (!sheet || !table) return [];
    const column = table.columns.indexOf(this.slicerColumn());
    return column < 0 ? [] : slicerValues(sheet, table, column);
  }

  toggleSlicerValue(value: string): void {
    const sheet = this.currentSheet();
    const excel = this.doc()?.excel;
    const table = this.tableList().find((item) => item.id === this.activeTableId());
    if (!sheet || !excel || !table) return;
    const analysis = this.excelAnalysis();
    let slicer = analysis.slicers.find((item) => item.tableId === table.id && item.column === this.slicerColumn());
    if (!slicer) {
      slicer = { id: `slicer-${Date.now().toString(36)}`, tableId: table.id, column: this.slicerColumn(), selected: [] };
      analysis.slicers.push(slicer);
    }
    slicer.selected = slicer.selected.includes(value)
      ? slicer.selected.filter((item) => item !== value)
      : [...slicer.selected, value];
    saveAnalysis(excel, analysis);
    this.slicerSelected.set([...slicer.selected]);
    this.refreshTablePreview(table);
    this.dirty.set(true);
  }

  clearSlicers(): void {
    const excel = this.doc()?.excel;
    const table = this.tableList().find((item) => item.id === this.activeTableId());
    if (!excel || !table) return;
    const analysis = this.excelAnalysis();
    analysis.slicers = analysis.slicers.filter((item) => item.tableId !== table.id);
    saveAnalysis(excel, analysis);
    this.slicerSelected.set([]);
    this.refreshTablePreview(table);
    this.dirty.set(true);
  }

  private refreshSlicerSelection(table: SavedTable): void {
    const slicer = this.excelAnalysis().slicers.find((item) => item.tableId === table.id && item.column === this.slicerColumn());
    this.slicerSelected.set([...(slicer?.selected ?? [])]);
  }

  private refreshTablePreview(table: SavedTable): void {
    const sheet = this.currentSheet();
    if (!sheet) return;
    this.tablePreview.set(filterTableRows(sheet, table, this.excelAnalysis().slicers));
  }

  polyline(points: Array<{ x: number; y: number }>): string {
    return points.map((point) => `${point.x},${point.y}`).join(' ');
  }

  zoomBy(delta: number): void {
    this.zoom.update((value) => Math.min(200, Math.max(50, value + delta)));
  }

  setTab(tab: RibbonTab): void {
    this.activeTab.set(tab);
    this.fileMenuOpen.set(false);
    this.syncTabUrl(tab);
  }

  cycleRibbonMode(): void {
    this.ribbonMode.update((mode) => mode === 'classic' ? 'single' : mode === 'single' ? 'tabs' : 'classic');
  }

  setRibbonMode(mode: RibbonMode): void {
    this.ribbonMode.set(mode);
  }

  setWordMode(mode: WordMode): void {
    if (mode === 'viewing') {
      this.readingView.set(true);
      this.tracking.set(false);
      return;
    }
    this.readingView.set(false);
    this.immersive.set(false);
    this.tracking.set(mode === 'suggesting');
  }

  setWordZoom(value: number): void {
    this.zoom.set(Math.min(200, Math.max(50, Math.round(value))));
  }

  pickWordImage(): void {
    this.wordImageInput?.nativeElement.click();
  }

  selectAllWord(): void {
    const page = this.hostRef.nativeElement.querySelector('.op-word-page') as HTMLElement | null;
    if (!page) return;
    const range = document.createRange();
    range.selectNodeContents(page);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  addBlankPage(): void {
    this.addPageBreak();
  }

  ribbonIcon(id: string): string[] {
    return wordIconPaths(id);
  }

  onWordAnchor(event: Event, link: string): void {
    if (!link.startsWith('#')) return;
    const word = this.word();
    if (!word) return;
    event.preventDefault();
    const bookmark = parseBookmarks(word).find((item) => item.name === link.slice(1));
    if (bookmark) this.jumpToParagraph(bookmark.paragraphIndex);
  }

  toggleCover(): void {
    const open = !this.coverOpen();
    this.coverOpen.set(open);
    if (!open) return;
    this.coverTitle.set((this.doc()?.fileName ?? '').replace(/\.[^.]+$/, ''));
    this.coverSubtitle.set(this.authorName());
    this.textBoxOpen.set(false);
    this.captionOpen.set(false);
    this.watermarkOpen.set(false);
  }

  applyCoverPage(): void {
    const word = this.word();
    if (!word) return;
    const title = this.coverTitle().trim() || (this.doc()?.fileName ?? '').replace(/\.[^.]+$/, '') || 'Document';
    const subtitle = this.coverSubtitle().trim() || this.authorName();
    const date = new Date().toLocaleDateString('vi-VN');
    this.pushWordHistory();
    if (!insertCoverPage(word, title, subtitle, date)) return;
    this.coverOpen.set(false);
    this.afterWordStructureChange();
  }

  toggleTextBox(): void {
    const open = !this.textBoxOpen();
    this.textBoxOpen.set(open);
    if (!open) return;
    this.coverOpen.set(false);
    this.captionOpen.set(false);
    this.watermarkOpen.set(false);
  }

  applyTextBox(): void {
    const word = this.word();
    if (!word) return;
    this.pushWordHistory();
    if (!insertTextBox(word, this.textBoxDraft().trim())) return;
    this.textBoxOpen.set(false);
    this.textBoxDraft.set('');
    this.afterWordStructureChange();
  }

  toggleCaption(): void {
    const open = !this.captionOpen();
    this.captionOpen.set(open);
    if (!open) return;
    this.coverOpen.set(false);
    this.textBoxOpen.set(false);
    this.watermarkOpen.set(false);
  }

  applyCaption(): void {
    const word = this.word();
    const text = this.captionText().trim();
    if (!word || !text) return;
    this.pushWordHistory();
    if (!insertCaption(word, this.captionLabel(), text)) return;
    this.captionOpen.set(false);
    this.captionText.set('');
    this.afterWordStructureChange();
  }

  toggleWatermark(): void {
    const open = !this.watermarkOpen();
    this.watermarkOpen.set(open);
    if (!open) return;
    this.watermarkDraft.set(this.word()?.watermark ?? 'DRAFT');
    this.coverOpen.set(false);
    this.textBoxOpen.set(false);
    this.captionOpen.set(false);
  }

  applyWatermark(): void {
    const word = this.word();
    if (!word) return;
    this.pushWordHistory();
    setWatermark(word, this.watermarkDraft());
    this.doc.set({ ...(this.doc() as OfficeDocument) });
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  clearWatermark(): void {
    const word = this.word();
    if (!word) return;
    this.pushWordHistory();
    setWatermark(word, null);
    this.doc.set({ ...(this.doc() as OfficeDocument) });
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  openNewWindow(): void {
    const opened = window.open(location.href, '_blank', 'noopener');
    this.newWindowHint.set(opened ? 'ok' : 'blocked');
    setTimeout(() => this.newWindowHint.set(null), 4000);
  }

  private refreshWordSignal(): void {
    const doc = this.doc();
    if (!doc?.word) return;
    this.doc.set({ ...doc, word: { ...doc.word } });
  }

  toggleShowMarks(): void {
    this.showMarks.update((value) => !value);
  }

  sortSelectedParagraphs(): void {
    const word = this.word();
    const index = this.selectedParagraph();
    if (!word || index === null) return;
    this.pushWordHistory();
    if (sortBodyParagraphs(word, index)) this.afterWordFormatChange();
  }

  applyParagraphShading(color: string): void {
    const word = this.word();
    const index = this.selectedParagraph();
    if (!word || index === null) return;
    this.pushWordHistory();
    applyParagraphFormat(word, index, { shading: color });
    this.afterWordFormatChange();
  }

  currentParagraphShading(): string {
    return this.selectedWordParagraph()?.shading ?? '#FFF2CC';
  }

  toggleShapes(): void {
    const open = !this.shapesOpen();
    this.shapesOpen.set(open);
    if (open) {
      this.iconsOpen.set(false);
      this.wordChartOpen.set(false);
      this.themesOpen.set(false);
      this.styleSetsOpen.set(false);
    }
  }

  insertShapeNow(shape: 'rect' | 'roundRect' | 'ellipse' | 'line'): void {
    const word = this.word();
    if (!word) return;
    this.pushWordHistory();
    if (!insertWordShape(word, { shape, widthPx: shape === 'line' ? 320 : 220, heightPx: shape === 'line' ? 6 : 120 })) return;
    this.shapesOpen.set(false);
    this.wordMediaUrls.clear();
    this.afterWordStructureChange();
  }

  toggleIcons(): void {
    const open = !this.iconsOpen();
    this.iconsOpen.set(open);
    if (open) {
      this.shapesOpen.set(false);
      this.wordChartOpen.set(false);
      this.themesOpen.set(false);
      this.styleSetsOpen.set(false);
    }
  }

  iconDataUrl(svg: string): string {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  insertIconNow(icon: { id: string; svg: string }): void {    const word = this.word();
    if (!word) return;
    const bytes = new TextEncoder().encode(icon.svg);
    this.pushWordHistory();
    if (!insertWordImage(word, {
      bytes, extension: 'svg', widthPx: 32, heightPx: 32, fileName: `icon-${icon.id}.svg`,
    })) return;
    this.iconsOpen.set(false);
    this.wordMediaUrls.clear();
    this.afterWordStructureChange();
  }

  toggleWordChart(): void {
    const open = !this.wordChartOpen();
    this.wordChartOpen.set(open);
    if (open) {
      this.shapesOpen.set(false);
      this.iconsOpen.set(false);
      this.themesOpen.set(false);
      this.styleSetsOpen.set(false);
    }
  }

  async insertWordChart(): Promise<void> {
    const word = this.word();
    if (!word) return;
    const points = this.wordChartData().split(/[,\n;]/)
      .map((part) => part.split(':'))
      .filter((pair) => pair.length === 2 && Number.isFinite(Number(pair[1].trim())))
      .map((pair) => ({ label: pair[0].trim(), value: Number(pair[1].trim()) }));
    if (!points.length) return;
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 480, 300);
    const palette = ['#1F4E79', '#2E75B6', '#8EAADB', '#F2A900', '#C00000'];
    const max = Math.max(...points.map((point) => point.value), 1);
    if (this.wordChartType() === 'pie') {
      const total = points.reduce((sum, point) => sum + point.value, 0) || 1;
      let angle = -Math.PI / 2;
      points.forEach((point, index) => {
        const slice = (point.value / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(150, 150);
        ctx.arc(150, 150, 100, angle, angle + slice);
        ctx.closePath();
        ctx.fillStyle = palette[index % palette.length];
        ctx.fill();
        angle += slice;
      });
    } else {
      const chartWidth = 400;
      const chartHeight = 210;
      const step = chartWidth / points.length;
      ctx.strokeStyle = '#9ca3af';
      ctx.beginPath();
      ctx.moveTo(40, 250);
      ctx.lineTo(460, 250);
      ctx.stroke();
      points.forEach((point, index) => {
        const value = (point.value / max) * chartHeight;
        const x = 50 + index * step;
        if (this.wordChartType() === 'bar') {
          ctx.fillStyle = palette[index % palette.length];
          ctx.fillRect(x, 250 - value, step * 0.6, value);
        } else {
          ctx.strokeStyle = palette[0];
          ctx.lineWidth = 2;
          ctx.beginPath();
          const px = x + step * 0.3;
          const py = 250 - value;
          if (index === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          ctx.stroke();
          ctx.fillStyle = palette[0];
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#374151';
        ctx.font = '11px sans-serif';
        ctx.fillText(point.label.slice(0, 10), x, 265);
      });
    }
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(this.wordChartType() === 'pie' ? 'Biểu đồ tròn' : this.wordChartType() === 'line' ? 'Biểu đồ đường' : 'Biểu đồ cột', 20, 24);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    this.pushWordHistory();
    if (!insertWordImage(word, {
      bytes, extension: 'png', widthPx: 480, heightPx: 300, fileName: `chart-${this.wordChartType()}.png`,
    })) return;
    this.wordChartOpen.set(false);
    this.wordMediaUrls.clear();
    this.afterWordStructureChange();
  }

  toggleThemes(): void {
    const open = !this.themesOpen();
    this.themesOpen.set(open);
    if (open) {
      this.styleSetsOpen.set(false);
      this.shapesOpen.set(false);
      this.iconsOpen.set(false);
      this.wordChartOpen.set(false);
    }
  }

  applyThemePreset(id: string): void {
    const word = this.word();
    const preset = WORD_THEMES.find((theme) => theme.id === id);
    if (!word || !preset) return;
    this.pushWordHistory();
    if (!applyWordTheme(word, preset)) return;
    this.refreshWordSignal();
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  toggleStyleSets(): void {
    const open = !this.styleSetsOpen();
    this.styleSetsOpen.set(open);
    if (open) {
      this.themesOpen.set(false);
      this.shapesOpen.set(false);
      this.iconsOpen.set(false);
      this.wordChartOpen.set(false);
    }
  }

  applyStyleSetPreset(id: string): void {
    const word = this.word();
    if (!word) return;
    this.pushWordHistory();
    if (!applyStyleSet(word, id)) return;
    this.refreshWordSignal();
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  toggleThesaurus(): void {
    const open = !this.thesaurusOpen();
    this.thesaurusOpen.set(open);
    if (!open) return;
    const selection = this.wordSelection()?.text;
    const paragraph = this.selectedWordParagraph();
    const text = selection || (paragraph ? paragraph.runs.map((run) => run.text).join(' ') : '');
    const word = text.split(/[^\p{L}]+/u).filter(Boolean).sort((a, b) => b.length - a.length)[0] ?? '';
    this.thesaurusQuery.set(word);
    this.themesOpen.set(false);
    this.styleSetsOpen.set(false);
  }

  toggleRestrictEditing(): void {
    const word = this.word();
    if (!word) return;
    this.pushWordHistory();
    setDocumentProtection(word, !word.protected);
    this.refreshWordSignal();
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  insertTableOfFiguresNow(): void {
    const word = this.word();
    if (!word) return;
    this.pushWordHistory();
    if (!insertTableOfFigures(word, 'Hình')) return;
    this.afterWordStructureChange();
  }

  toggleHelp(): void {
    if (this.helpOpen()) {
      this.helpOpen.set(false);
      return;
    }
    this.helpOpen.set(true);
    this.wordCountOpen.set(false);
    this.pageSetupOpen.set(false);
    this.findOpen.set(false);
    this.accessOpen.set(false);
  }

  toggleWordCount(): void {
    if (this.wordCountOpen()) {
      this.wordCountOpen.set(false);
      return;
    }
    this.wordCountOpen.set(true);
    this.helpOpen.set(false);
    this.pageSetupOpen.set(false);
    this.findOpen.set(false);
  }

  insertWordNote(kind: NoteKind): void {
    const word = this.word();
    const notes = this.wordNotes();
    const index = this.selectedParagraph();
    if (!word || !notes || index === null) return;
    ensureNote(word, notes, kind, '', index);
    this.notesTick.update((value) => value + 1);
    if (!this.notesPanelOpen()) this.toggleNotes();
    this.dirty.set(true);
  }

  nextWordNote(): void {
    const notes = [...this.footnotes(), ...this.endnotes()];
    if (!notes.length) return;
    const current = this.selectedParagraph() ?? -1;
    const next = notes.find((note) => note.refParagraph > current) ?? notes[0];
    this.selectParagraph(next.refParagraph);
    const element = this.hostRef.nativeElement.querySelector(`[data-paragraph="${next.refParagraph}"]`) as HTMLElement | null;
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  deleteSelectedComment(): void {
    const index = this.selectedParagraph();
    const threads = this.commentThreads();
    const thread = threads.find((item) => item.root.paragraphIndex === index)
      ?? threads.find((item) => !item.root.resolved);
    if (thread) this.removeThread(thread.root);
  }

  cycleMarkup(): void {
    this.setMarkupMode(this.markupMode() === 'all' ? 'simple' : this.markupMode() === 'simple' ? 'none' : 'all');
  }

  applyWordMargins(value: string): void {
    this.pageMargin.set(value === 'narrow' ? 'narrow' : value === 'wide' ? 'wide' : 'normal');
    this.applyPageSetup();
  }

  applyWordOrientation(value: string): void {
    this.pageOrientation.set(value === 'landscape' ? 'landscape' : 'portrait');
    this.applyPageSetup();
  }

  applyWordPageSize(value: string): void {
    this.pageSize.set(value === 'Letter' ? 'Letter' : 'A4');
    this.applyPageSetup();
  }

  applyWordColumns(value: number): void {
    const word = this.word();
    const section = word ? sectionAt(word, 0) : null;
    if (!section) return;
    const count = Math.max(1, Math.min(3, Math.round(value)));
    this.columnCount.set(count);
    setColumns(section, count, this.columnSpace());
    this.refreshWordDocument();
    this.dirty.set(true);
  }

  applyWordLineNumbers(value: string): void {
    this.lineNumberingMode.set(value === 'newPage' ? 'newPage' : value === 'newSection' ? 'newSection'
      : value === 'continuous' ? 'continuous' : 'off');
    this.applyLineNumbering();
  }

  async toggleWordFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        this.wordFullscreen.set(false);
      } else {
        await this.hostRef.nativeElement.requestFullscreen();
        this.wordFullscreen.set(true);
      }
    } catch {
      // fullscreen may be blocked by the host; the toolbar state still reflects the attempt
      this.wordFullscreen.set(Boolean(document.fullscreenElement));
    }
  }

  exitReadingAndImmersive(): void {
    this.readingView.set(false);
    this.immersive.set(false);
  }

  wordCommandActive(id: string): boolean {
    switch (id) {
      case 'painter': return Boolean(this.wordPainter());
      case 'bold': case 'italic': case 'underline': case 'strike': return this.isRunActive(id as 'bold' | 'italic' | 'underline' | 'strike');
      case 'bullets': return this.selectedWordParagraph()?.listType === 'bullet';
      case 'numbering': return this.selectedWordParagraph()?.listType === 'number';
      case 'alignLeft': return (this.selectedWordParagraph()?.align ?? 'left') === 'left';
      case 'alignCenter': return this.selectedWordParagraph()?.align === 'center';
      case 'alignRight': return this.selectedWordParagraph()?.align === 'right';
      case 'alignJustify': return this.selectedWordParagraph()?.align === 'justify';
      case 'find': case 'replace': return this.findOpen();
      case 'table': return this.insertTableOpen();
      case 'link': return this.linkOpen();
      case 'symbol': return this.symbolOpen();
      case 'video': return this.videoOpen();
      case 'equation': return this.equationOpen();
      case 'insertToc': case 'insertTocInsert': case 'bookmark': case 'bookmarkRef': case 'crossReference': case 'crossRef': return this.tocOpen();
      case 'insertCitation': return this.citationsOpen();
      case 'header': case 'footer': case 'pageNumber': return this.headerFooterOpen();
      case 'newComment': case 'reviewCommentNew': return this.commentsOpen();
      case 'spelling': return this.spellOpen();
      case 'wordCount': return this.wordCountOpen();
      case 'accessibility': return this.accessOpen();
      case 'trackChanges': return this.tracking();
      case 'reviewPane': return this.revisionsOpen();
      case 'readMode': return this.readingView();
      case 'immersive': return this.immersive();
      case 'darkMode': return this.wordDark();
      case 'ruler': return this.rulerOpen();
      case 'navigation': return this.navPaneOpen();
      case 'drawPen': return this.inkOpen();
      case 'pageColor': case 'pageBorders': case 'layoutPageColor': case 'layoutPageBorders': return this.pageSetupOpen();
      case 'showComments': return this.commentsOpen();
      case 'filterComments': return this.commentFilter() !== 'all';
      case 'separatePages': return this.separatePages();
      case 'switchBackground': return this.wordDark();
      case 'zoom100': return this.zoom() === 100;
      case 'columnsMore': return this.layoutOpen();
      case 'fullscreen': return this.wordFullscreen();
      case 'coverPage': return this.coverOpen();
      case 'textBox': return this.textBoxOpen();
      case 'watermark': return this.watermarkOpen();
      case 'insertCaption': return this.captionOpen();
      case 'showMarks': return this.showMarks();
      case 'shapes': return this.shapesOpen();
      case 'icons': return this.iconsOpen();
      case 'chart': return this.wordChartOpen();
      case 'themes': return this.themesOpen();
      case 'styleSets': return this.styleSetsOpen();
      case 'thesaurus': return this.thesaurusOpen();
      case 'restrictEditing': return this.wordProtected();
      case 'position': return this.arrangePanel() === 'position';
      case 'wrapText': return this.arrangePanel() === 'wrap';
      case 'alignObjects': return this.arrangePanel() === 'align';
      case 'rotateObjects': return this.arrangePanel() === 'rotate';
      case 'selectionPane': return this.arrangePanel() === 'selection';
      case 'paragraphOptions': return this.paragraphOptionsOpen();
      case 'emoji': return this.emojiOpen();
      case 'viewHeaderFooter': return this.headerFooterOpen();
      case 'viewFootnotes': return this.notesPanelOpen() && this.noteKind() === 'footnote';
      case 'viewEndnotes': return this.notesPanelOpen() && this.noteKind() === 'endnote';
      case 'markEntry': case 'insertIndex': case 'updateIndex': return this.indexOpen();
      case 'startMailMerge': case 'selectRecipients': case 'editRecipients': case 'addressBlock':
      case 'greetingLine': case 'insertMergeField': case 'mergeRules': case 'findRecipient':
      case 'finishMerge': case 'envelopes': case 'labels': return this.mailMergeOpen();
      case 'highlightMergeFields': return this.mailMerge().highlight;
      case 'previewResults': return this.mailMerge().previewIndex !== null;
      case 'help': case 'shortcuts': return this.helpOpen();
      default: return false;
    }
  }

  wordCommandDisabled(id: string): boolean {
    if (!this.doc()) return true;
    if (id === 'undo') return !this.canUndoWord();
    if (id === 'redo') return !this.canRedoWord();
    if (id === 'reviewCommentDelete') {
      return !this.commentThreads().length;
    }
    if (id === 'acceptAll' || id === 'rejectAll' || id === 'reviewPane') return this.revisions().length === 0;
    if (['acceptPrev', 'acceptNext', 'rejectPrev', 'rejectNext'].includes(id)) return this.revisions().length === 0;
    if (id === 'filterComments') return this.commentThreads().length === 0;
    if (id === 'nextNote') return !this.footnotes().length && !this.endnotes().length;
    if (id === 'groupObjects') return this.selectedWordFloats().length < 2;
    if (id === 'position' || id === 'wrapText' || id === 'alignObjects' || id === 'rotateObjects'
      || id === 'bringForward' || id === 'sendBackward') {
      return this.selectedWordFloats().length === 0;
    }
    return false;
  }

  runWordCommand(id: string): void {
    switch (id) {
      case 'undo': this.undoWord(); break;
      case 'redo': this.redoWord(); break;
      case 'paste': void this.pasteWordText(); break;
      case 'cut': void this.cutWordText(); break;
      case 'copy': void this.copyWordText(); break;
      case 'painter': if (this.wordPainter()) this.wordPainter.set(null); else this.copyWordFormat(); break;
      case 'growFont': this.growWordFont(1); break;
      case 'shrinkFont': this.growWordFont(-1); break;
      case 'bold': case 'italic': case 'underline': case 'strike':
        this.toggleWordRunProperty(id as 'bold' | 'italic' | 'underline' | 'strike'); break;
      case 'clearFormat': this.clearWordFormatting(); break;
      case 'bullets': this.toggleWordList('bullet'); break;
      case 'numbering': this.toggleWordList('number'); break;
      case 'indentDec': this.indentWordParagraph(-720); break;
      case 'indentInc': this.indentWordParagraph(720); break;
      case 'alignLeft': this.applyWordAlignment('left'); break;
      case 'alignCenter': this.applyWordAlignment('center'); break;
      case 'alignRight': this.applyWordAlignment('right'); break;
      case 'alignJustify': this.applyWordAlignment('justify'); break;
      case 'find': this.toggleFind(); break;
      case 'replace': if (!this.findOpen()) this.toggleFind(); break;
      case 'selectAll': this.selectAllWord(); break;
      case 'blankPage': case 'pageBreak': this.addBlankPage(); break;
      case 'table': this.toggleInsertTable(); break;
      case 'tableInsertRowAbove': case 'tableInsertRowBelow':
      case 'tableInsertColumnLeft': case 'tableInsertColumnRight':
      case 'tableDeleteRow': case 'tableDeleteColumn': case 'tableDelete':
      case 'tableHeaderRow': case 'tableDistributeColumns':
      case 'tableCellTop': case 'tableCellCenter': case 'tableCellBottom':
      case 'tableAlignLeft': case 'tableAlignCenter': case 'tableAlignRight':
      case 'tableMergeCells': case 'tableSplitCells':
        this.runWordTableCommand(id);
        break;
      case 'picture': this.pickWordImage(); break;
      case 'drawing': this.setTab('draw'); break;
      case 'video': this.toggleVideo(); break;
      case 'link': this.toggleLink(); break;
      case 'bookmark': case 'bookmarkRef': this.toggleToc(); break;
      case 'crossReference': case 'crossRef': this.toggleToc(); break;
      case 'newComment': case 'reviewCommentNew': this.toggleComments(); break;
      case 'header': case 'footer': case 'pageNumber': this.toggleHeaderFooter(); break;
      case 'equation': this.toggleEquation(); break;
      case 'symbol': this.toggleSymbol(); break;
      case 'drawSelect': this.inkOpen.set(false); break;
      case 'drawPen': this.inkOpen.set(true); break;
      case 'drawEraser': this.undoInkStroke(); break;
      case 'drawClear': this.clearInkStrokes(); break;
      case 'pageColor': case 'pageBorders': case 'layoutPageColor': case 'layoutPageBorders': this.togglePageSetup(); break;
      case 'breakPage': this.addPageBreak(); break;
      case 'breakSection': this.addSectionBreak(); break;
      case 'columnsMore': this.toggleLayout(); break;
      case 'layoutIndentDec': this.indentWordParagraph(-720); break;
      case 'layoutIndentInc': this.indentWordParagraph(720); break;
      case 'insertToc': case 'insertTocInsert': case 'updateToc': this.buildToc(); break;
      case 'insertFootnote': this.insertWordNote('footnote'); break;
      case 'insertEndnote': this.insertWordNote('endnote'); break;
      case 'nextNote': this.nextWordNote(); break;
      case 'insertCitation': this.toggleCitations(); break;
      case 'bibliography': this.insertBibliography(); break;
      case 'spelling': this.toggleSpell(); break;
      case 'wordCount': this.toggleWordCount(); break;
      case 'accessibility': this.toggleAccessibility(); break;
      case 'reviewCommentDelete': this.deleteSelectedComment(); break;
      case 'reviewCommentPrev': this.gotoComment(-1); break;
      case 'reviewCommentNext': this.gotoComment(1); break;
      case 'showComments': this.toggleComments(); break;
      case 'filterComments': this.cycleCommentFilter(); break;
      case 'trackChanges': this.toggleTracking(); break;
      case 'markup': this.cycleMarkup(); break;
      case 'reviewPane': this.toggleRevisions(); break;
      case 'acceptAll': this.acceptEveryRevision(); break;
      case 'rejectAll': this.rejectEveryRevision(); break;
      case 'acceptPrev': this.stepRevision(-1, 'accept'); break;
      case 'acceptNext': this.stepRevision(1, 'accept'); break;
      case 'rejectPrev': this.stepRevision(-1, 'reject'); break;
      case 'rejectNext': this.stepRevision(1, 'reject'); break;
      case 'readMode': this.toggleReadingView(); break;
      case 'printLayout': this.exitReadingAndImmersive(); break;
      case 'immersive': this.toggleImmersive(); break;
      case 'darkMode': this.toggleWordDark(); break;
      case 'separatePages': this.toggleSeparatePages(); break;
      case 'switchBackground': this.switchBackground(); break;
      case 'zoom100': this.setWordZoom(100); break;
      case 'ruler': this.toggleRuler(); break;
      case 'navigation': this.toggleNavPane(); break;
      case 'pageWidth': this.setWordZoom(100); break;
      case 'wholePage': this.setWordZoom(75); break;
      case 'fullscreen': void this.toggleWordFullscreen(); break;
      case 'coverPage': this.toggleCover(); break;
      case 'textBox': this.toggleTextBox(); break;
      case 'watermark': this.toggleWatermark(); break;
      case 'insertCaption': this.toggleCaption(); break;
      case 'newWindow': this.openNewWindow(); break;
      case 'sortParagraphs': this.sortSelectedParagraphs(); break;
      case 'showMarks': this.toggleShowMarks(); break;
      case 'shapes': this.toggleShapes(); break;
      case 'icons': this.toggleIcons(); break;
      case 'chart': this.toggleWordChart(); break;
      case 'themes': this.toggleThemes(); break;
      case 'styleSets': this.toggleStyleSets(); break;
      case 'tableOfFigures': this.insertTableOfFiguresNow(); break;
      case 'thesaurus': this.toggleThesaurus(); break;
      case 'markEntry': this.toggleIndex(); break;
      case 'insertIndex': this.indexOpen.set(true); this.insertIndexNow(); break;
      case 'updateIndex': this.updateIndexNow(); break;
      case 'restrictEditing': this.toggleRestrictEditing(); break;
      case 'position': this.toggleArrangePanel('position'); break;
      case 'wrapText': this.toggleArrangePanel('wrap'); break;
      case 'alignObjects': this.toggleArrangePanel('align'); break;
      case 'rotateObjects': this.toggleArrangePanel('rotate'); break;
      case 'selectionPane': this.toggleArrangePanel('selection'); break;
      case 'groupObjects': this.groupSelectedFloats(); break;
      case 'bringForward': this.bringFloatForward(); break;
      case 'sendBackward': this.sendFloatBackward(); break;
      case 'checklist': this.toggleChecklist(); break;
      case 'paragraphBorders': this.toggleParagraphBordersNow(); break;
      case 'paragraphOptions': this.toggleParagraphOptions(); break;
      case 'emoji': this.toggleEmoji(); break;
      case 'markAllRead': this.markAllCommentsRead(); break;
      case 'viewHeaderFooter': this.openViewHeaderFooter(); break;
      case 'viewFootnotes': this.openViewNotes('footnote'); break;
      case 'viewEndnotes': this.openViewNotes('endnote'); break;
      case 'startMailMerge': this.mailMergeOpen.set(true); this.mergePanelMode.set('start'); break;
      case 'selectRecipients': this.mailMergeOpen.set(true); this.pickMergeData(); break;
      case 'editRecipients': this.mailMergeOpen.set(true); this.mergePanelMode.set('main'); break;
      case 'highlightMergeFields': this.mailMergeOpen.set(true); this.toggleMergeHighlight(); break;
      case 'addressBlock': this.mailMergeOpen.set(true); this.insertAddressBlockNow(); break;
      case 'greetingLine': this.mailMergeOpen.set(true); this.insertGreetingLineNow(); break;
      case 'insertMergeField': this.mailMergeOpen.set(true); break;
      case 'mergeRules': this.mailMergeOpen.set(true); this.mergePanelMode.set('rules'); break;
      case 'previewResults': this.mailMergeOpen.set(true); this.toggleMergePreview(); break;
      case 'findRecipient': this.mailMergeOpen.set(true); break;
      case 'checkErrors': this.checkMergeErrorsNow(); break;
      case 'finishMerge': this.finishMergeNow(); break;
      case 'envelopes': this.mailMergeOpen.set(true); this.setMergeTarget('envelopes'); break;
      case 'labels': this.mailMergeOpen.set(true); this.setMergeTarget('labels'); this.insertLabelsNow(); break;
      case 'help': case 'shortcuts': this.toggleHelp(); break;
      case 'feedback': this.toggleInfo(); break;
      default: break;
    }
  }

  selectSheet(index: number): void {
    this.selectedSheet.set(index);
    this.selectedCell.set('A1');
    setTimeout(() => this.drawGrid(), 0);
  }

  selectSlide(index: number): void {
    this.selectedSlide.set(index);
    this.selectedShapeId.set(null);
    const slide = this.currentSlide();
    this.pptNotesDraft.set(slide?.notes ?? '');
    this.pptBackground.set(slide?.background ?? '#ffffff');
    this.pptCommentIndex.set(0);
    this.pptNotesOpen.set(false);
    this.pptCommentsOpen.set(false);
    this.pptSetupOpen.set(false);
  }

  addPptSlide(): void {
    const ppt = this.ppt();
    if (!ppt) return;
    addSlide(ppt);
    this.selectedSlide.set(ppt.slides.length - 1);
    this.selectSlide(ppt.slides.length - 1);
    this.pptTick.update((value) => value + 1);
    this.dirty.set(true);
  }

  duplicatePptSlide(): void {
    const ppt = this.ppt();
    if (!ppt) return;
    addSlide(ppt, this.selectedSlide());
    this.selectSlide(ppt.slides.length - 1);
    this.pptTick.update((value) => value + 1);
    this.dirty.set(true);
  }

  deletePptSlide(): void {
    const ppt = this.ppt();
    if (!ppt) return;
    const index = this.selectedSlide();
    if (!deleteSlide(ppt, index)) return;
    this.selectedSlide.set(Math.min(index, ppt.slides.length - 1));
    this.selectSlide(this.selectedSlide());
    this.pptTick.update((value) => value + 1);
    this.dirty.set(true);
  }

  movePptSlide(delta: number): void {
    const ppt = this.ppt();
    if (!ppt) return;
    const target = this.selectedSlide() + delta;
    if (!moveSlide(ppt, this.selectedSlide(), target)) return;
    this.selectedSlide.set(target);
    this.pptTick.update((value) => value + 1);
    this.dirty.set(true);
  }

  togglePptHidden(): void {
    const ppt = this.ppt();
    if (!ppt) return;
    if (toggleSlideHidden(ppt, this.selectedSlide())) {
      this.pptTick.update((value) => value + 1);
      this.dirty.set(true);
    }
  }

  togglePptNotes(): void {
    this.pptNotesOpen.update((value) => !value);
    this.pptCommentsOpen.set(false);
    this.pptSetupOpen.set(false);
    this.pptNotesDraft.set(this.currentSlide()?.notes ?? '');
  }

  savePptNotes(): void {
    const ppt = this.ppt();
    if (!ppt) return;
    const index = this.selectedSlide();
    if (setSlideNotes(ppt, index, this.pptNotesDraft())) {
      this.pptTick.update((value) => value + 1);
      this.dirty.set(true);
    }
  }

  togglePptComments(): void {
    this.pptCommentsOpen.update((value) => !value);
    this.pptNotesOpen.set(false);
    this.pptSetupOpen.set(false);
    this.pptCommentIndex.set(0);
  }

  addPptComment(): void {
    const ppt = this.ppt();
    if (!ppt) return;
    const text = this.pptCommentDraft().trim();
    if (!text) return;
    if (addSlideComment(ppt, this.selectedSlide(), text, this.authorName(), new Date().toISOString())) {
      this.pptCommentDraft.set('');
      this.pptCommentIndex.update((value) => Math.max(0, this.slideComments().length - 1));
      this.pptTick.update((value) => value + 1);
      this.dirty.set(true);
    }
  }

  deletePptComment(id: number): void {
    const ppt = this.ppt();
    if (!ppt) return;
    if (deleteSlideComment(ppt, this.selectedSlide(), id)) {
      this.pptCommentIndex.set(0);
      this.pptTick.update((value) => value + 1);
      this.dirty.set(true);
    }
  }

  nextPptComment(delta: number): void {
    const comments = this.slideComments();
    if (!comments.length) return;
    this.pptCommentIndex.set((this.pptCommentIndex() + delta + comments.length) % comments.length);
  }

  togglePptSetup(): void {
    this.pptSetupOpen.update((value) => !value);
    this.pptNotesOpen.set(false);
    this.pptCommentsOpen.set(false);
    this.pptBackground.set(this.currentSlide()?.background ?? '#ffffff');
    this.pptSize.set(this.ppt()?.width === 960 ? '4:3' : '16:9');
  }

  applyPptBackground(color: string): void {
    const ppt = this.ppt();
    if (!ppt) return;
    this.pptBackground.set(color);
    if (setSlideBackground(ppt, this.selectedSlide(), color)) {
      this.pptTick.update((value) => value + 1);
      this.dirty.set(true);
    }
  }

  clearPptBackground(): void {
    const ppt = this.ppt();
    if (!ppt) return;
    if (setSlideBackground(ppt, this.selectedSlide(), null)) {
      this.pptBackground.set('#ffffff');
      this.pptTick.update((value) => value + 1);
      this.dirty.set(true);
    }
  }

  applyPptSize(value: string): void {
    const ppt = this.ppt();
    if (!ppt) return;
    this.pptSize.set(value === '4:3' ? '4:3' : '16:9');
    setSlideSize(ppt, this.pptSize() === '4:3' ? 960 : 1280, 720);
    this.pptTick.update((value) => value + 1);
    this.dirty.set(true);
  }

  selectShape(shape: PptShape): void {
    this.selectedShapeId.set(shape.id);
    if (shape.kind === 'smartart' && shape.smartArtNodes?.length) {
      this.smartArtShape.set(shape);
      this.smartArtDraft.set(shape.smartArtNodes.map((item) => item.text));
      this.smartArtOpen.set(true);
      this.pptEffectsOpen.set(false);
    } else {
      this.smartArtShape.set(null);
      this.smartArtOpen.set(false);
    }
  }

  updateSmartArtDraft(index: number, value: string): void {
    this.smartArtDraft.update((list) => list.map((item, position) => position === index ? value : item));
  }

  applySmartArt(): void {
    const shape = this.smartArtShape();
    if (!shape?.smartArtNodes) return;
    const draft = this.smartArtDraft();
    shape.smartArtNodes.forEach((item, index) => {
      const text = draft[index] ?? item.text;
      item.text = text;
      item.node.text = text;
    });
    shape.text = shape.smartArtNodes.map((item) => item.text).filter(Boolean).join(' · ') || '[SmartArt]';
    this.markPptDirty();
  }

  toggleSmartArt(): void {
    this.smartArtOpen.update((open) => !open);
  }

  mediaUrlFor(shape: PptShape): string | null {
    if (!shape.mediaPath || (shape.kind !== 'video' && shape.kind !== 'audio')) return null;
    const cached = this.mediaUrls.get(shape.mediaPath);
    if (cached) return cached;
    const bytes = this.doc()?.ppt?.packageEntries?.get(shape.mediaPath);
    if (!bytes) return null;
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mediaMimeType(shape.mediaPath) }));
    this.mediaUrls.set(shape.mediaPath, url);
    return url;
  }

  private revokeMedia(): void {
    this.mediaUrls.forEach((url) => URL.revokeObjectURL(url));
    this.mediaUrls.clear();
    this.wordMediaUrls.forEach((url) => URL.revokeObjectURL(url));
    this.wordMediaUrls.clear();
  }

  wordHeaderImages(ref: { path: string; xmlRoot?: XmlNode } | null): Array<{ path: string; width: number; height: number; alt?: string }> {
    if (!ref?.xmlRoot) return [];
    const entries = this.word()?.packageEntries;
    if (!entries) return [];
    const slash = ref.path.lastIndexOf('/');
    const dir = ref.path.slice(0, slash);
    const relsPath = `${dir}/_rels/${ref.path.slice(slash + 1)}.rels`;
    const relsBytes = entries.get(relsPath);
    const relMap = new Map<string, string>();
    if (relsBytes) {
      const rels = parseXml(new TextDecoder('utf-8').decode(relsBytes));
      for (const rel of descendants(rels, 'Relationship')) {
        const id = attr(rel, 'Id');
        const target = attr(rel, 'Target');
        if (id && target) relMap.set(id, target);
      }
    }
    return descendants(ref.xmlRoot, 'w:drawing').flatMap((drawing) => {
      const blip = descendants(drawing, 'a:blip')[0];
      const embed = attr(blip, 'r:embed');
      const target = embed ? relMap.get(embed) : undefined;
      if (!target) return [];
      const targetPath = target.startsWith('/') ? target.slice(1) : target.startsWith('..')
        ? new URL(target, `http://x/${dir}/`).pathname.slice(1)
        : `${dir}/${target}`;
      const ext = descendants(drawing, 'wp:extent')[0];
      const width = Math.round(Number(attr(ext, 'cx') ?? 0) / 9525) || 96;
      const height = Math.round(Number(attr(ext, 'cy') ?? 0) / 9525) || 32;
      const docPr = descendants(drawing, 'wp:docPr')[0];
      return [{ path: targetPath, width, height, alt: attr(docPr, 'descr') ?? undefined }];
    });
  }

  wordImageUrl(path: string | undefined): string | null {
    if (!path) return null;
    const cached = this.wordMediaUrls.get(path);
    if (cached) return cached;
    const bytes = this.word()?.packageEntries?.get(path);
    if (!bytes) return null;
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mediaMimeType(path) }));
    this.wordMediaUrls.set(path, url);
    return url;
  }

  private swipeStartX = 0;

  onSwipeStart(event: TouchEvent): void {
    this.swipeStartX = event.changedTouches[0]?.clientX ?? 0;
  }

  onSwipeEnd(event: TouchEvent, target: 'slide' | 'sheet'): void {
    const end = event.changedTouches[0]?.clientX ?? this.swipeStartX;
    const delta = end - this.swipeStartX;
    if (Math.abs(delta) < 40) return;
    if (target === 'slide') {
      if (delta < 0) this.nextSlide();
      else this.prevSlide();
      return;
    }
    const sheets = this.excel()?.sheets.length ?? 0;
    if (!sheets) return;
    const next = Math.min(sheets - 1, Math.max(0, this.selectedSheet() + (delta < 0 ? 1 : -1)));
    this.selectSheet(next);
  }

  togglePptEffects(): void {
    this.pptEffectsOpen.update((open) => !open);
  }

  applyTransitionToSlide(): void {
    const slide = this.currentSlide();
    if (!slide?.xmlRoot) return;
    const transition: PptTransition = {
      type: this.transitionType(), durationMs: this.transitionDuration(),
    };
    applyTransition(slide.xmlRoot, transition);
    slide.transition = transition;
    this.markPptDirty();
  }

  applyTransitionEverywhere(): void {
    const ppt = this.ppt();
    if (!ppt) return;
    const transition: PptTransition = {
      type: this.transitionType(), durationMs: this.transitionDuration(),
    };
    for (const slide of ppt.slides) {
      if (!slide.xmlRoot) continue;
      applyTransition(slide.xmlRoot, transition);
      slide.transition = { ...transition };
    }
    this.markPptDirty();
  }

  addShapeAnimation(): void {
    const slide = this.currentSlide();
    const shapeId = this.selectedShapeId();
    this.pptEffectStatus.set(`add:${shapeId ?? 'null'}:${slide ? (slide.xmlRoot ? 'root' : 'noroot') : 'noslide'}`);
    if (!slide?.xmlRoot || !shapeId) return;
    const animation: PptAnimation = {
      targetId: shapeId,
      effect: this.animationEffect(),
      durationMs: 500,
      delayMs: 0,
      trigger: this.animationTrigger(),
    };
    const next = [...(slide.animations ?? []), animation];
    applyAnimations(slide.xmlRoot, next);
    slide.animations = next;
    this.pptEffectStatus.set(`added:${next.length}`);
    this.markPptDirty();
  }

  removeShapeAnimation(index: number): void {
    const slide = this.currentSlide();
    if (!slide?.xmlRoot) return;
    const next = (slide.animations ?? []).filter((_, position) => position !== index);
    applyAnimations(slide.xmlRoot, next);
    slide.animations = next;
    this.markPptDirty();
  }

  shapeAnimation(shapeId: string): PptAnimation | undefined {
    return this.slideAnimations().find((animation) => animation.targetId === shapeId);
  }

  animationClass(shapeId: string): string {
    if (!this.presenting()) return '';
    const animation = this.shapeAnimation(shapeId);
    return animation ? animationCss(animation.effect) : '';
  }

  animationDelay(shapeId: string): string {
    const animation = this.shapeAnimation(shapeId);
    if (!animation || !this.presenting()) return '0ms';
    return `${animation.delayMs}ms`;
  }

  slideTransitionClass(): string {
    const transition = this.currentSlide()?.transition;
    return transition ? transitionCss(transition.type) : '';
  }

  slideTransitionDuration(): string {
    return `${this.currentSlide()?.transition?.durationMs ?? 500}ms`;
  }

  private markPptDirty(): void {
    const doc = this.doc();
    if (doc) this.doc.set({ ...doc });
    this.dirty.set(true);
  }

  async present(): Promise<void> {
    if (!this.ppt()) return;
    this.presenting.set(true);
    try {
      await this.hostRef.nativeElement.requestFullscreen();
    } catch {
      /* fullscreen may be blocked; overlay still works */
    }
  }

  exitPresent(): void {
    this.presenting.set(false);
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
  }

  nextSlide(): void {
    const slides = this.ppt()?.slides ?? [];
    if (!slides.length) return;
    this.selectedSlide.update((index) => Math.min(slides.length - 1, index + 1));
  }

  prevSlide(): void {
    this.selectedSlide.update((index) => Math.max(0, index - 1));
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    if (!document.fullscreenElement && this.presenting()) this.presenting.set(false);
  }

  onGridClick(event: MouseEvent): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - 43;
    const y = event.clientY - rect.top - 26;
    if (x < 0 || y < 0) return;
    const col = Math.floor(x / 120) + 1;
    const row = Math.floor(y / 24) + 1;
    const ref = `${numberToColumn(col)}${row}`;
    this.selectedCell.set(ref);
    this.excelCommentDraft.set(this.currentSheet()?.comments?.get(ref)?.text ?? '');
    this.drawGrid();
  }

  selectedCellValue(): string {
    const cell = this.currentSheet()?.cells.get(this.selectedCell());
    return cell?.formula ?? cell?.value ?? '';
  }

  isEditableShape(shape: PptShape): boolean {
    return !shape.kind || shape.kind === 'text';
  }

  shapeStyle(shape: PptShape): Record<string, string> {
    const size = this.ppt();
    const scale = size && size.width ? this.stageWidth / size.width : 1;
    return {
      left: `${Math.round(shape.x * scale)}px`,
      top: `${Math.round(shape.y * scale)}px`,
      width: `${Math.max(24, Math.round(shape.width * scale))}px`,
      height: `${Math.max(20, Math.round(shape.height * scale))}px`,
      'font-size': `${Math.max(10, Math.round((shape.fontSizePt ?? 18) * 1.333 * scale))}px`,
      color: shape.color ?? 'inherit',
      'font-weight': shape.bold ? '700' : '400',
    };
  }

  runStyle(run: { bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; color?: string; sizePt?: number; font?: string; highlight?: string }): Record<string, string> {
    const highlight: Record<string, string> = {
      yellow: '#fef08a', green: '#bbf7d0', cyan: '#bae6fd', magenta: '#fbcfe8', red: '#fecaca', blue: '#bfdbfe',
    };
    return {
      'font-weight': run.bold ? '700' : '400',
      'font-style': run.italic ? 'italic' : 'normal',
      'text-decoration': [run.underline ? 'underline' : '', run.strike ? 'line-through' : ''].filter(Boolean).join(' ') || 'none',
      color: run.color ?? 'inherit',
      'font-size': run.sizePt ? `${Math.round(run.sizePt * 1.333)}px` : 'inherit',
      'font-family': run.font ? `'${run.font}', sans-serif` : 'inherit',
      background: run.highlight ? highlight[run.highlight] ?? run.highlight : 'transparent',
    };
  }

  paragraphClass(block: WordBlock): string {
    if (block.kind !== 'paragraph') return '';
    const level = block.paragraph.headingLevel;
    return level ? `op-word-heading op-word-h${level}` : '';
  }

  segmentsFor(index: number): MarkupSegment[] {
    this.revisionTick();
    const block = this.word()?.blocks[index];
    return block?.kind === 'paragraph' ? paragraphSegments(block.paragraph, this.markupMode()) : [];
  }

  hasRevision(index: number): boolean {
    this.revisionTick();
    const block = this.word()?.blocks[index];
    return block?.kind === 'paragraph' ? paragraphHasRevision(block.paragraph) : false;
  }

  markupClass(index: number): string {
    return this.markupMode() === 'simple' && this.hasRevision(index) ? 'op-markup-bar' : '';
  }

  segmentClass(kind: MarkupSegment['kind']): string {
    return revisionStyle(kind);
  }

  markupHtml(index: number): SafeHtml {
    const html = this.segmentsFor(index)
      .map((segment) => `<span class="${revisionStyle(segment.kind)}">${escapeHtml(segment.text)}</span>`)
      .join('');
    const block = this.word()?.blocks[index];
    const images = block?.kind === 'paragraph'
      ? block.paragraph.runs
        .filter((run) => run.imagePath)
        .map((run) => {
          const url = this.wordImageUrl(run.imagePath);
          return url
            ? `<img class="op-word-image" src="${url}" alt="${escapeHtml(run.alt ?? '')}" contenteditable="false">`
            : '';
        })
        .join('')
      : '';
    const videos = block?.kind === 'paragraph'
      ? block.paragraph.runs
        .filter((run) => run.videoUrl)
        .map((run) => `<a class="op-word-video" href="${escapeHtml(run.videoUrl ?? '')}" target="_blank" rel="noopener noreferrer">[video]</a>`)
        .join('')
      : '';
    return this.sanitizer.bypassSecurityTrustHtml(html + images + videos);
  }

  markupVisibleText(index: number): string {
    return this.segmentsFor(index).map((segment) => segment.text).join('');
  }

  setMarkupMode(mode: MarkupMode): void {
    this.markupMode.set(mode);
  }

  trackBlock(index: number, block: WordBlock): string {
    return block.kind === 'paragraph' ? `p-${index}-${block.paragraph.style ?? ''}` : `t-${index}`;
  }

  private patchParagraphText(node: XmlNode, text: string): void {
    const texts = descendants(node, 'w:t');
    if (texts.length > 0) {
      texts[0].text = text;
      for (let index = 1; index < texts.length; index++) texts[index].text = '';
      return;
    }
    node.children.push({
      name: 'w:r',
      attrs: {},
      text: '',
      children: [{ name: 'w:t', attrs: {}, text, children: [] }],
    });
  }

  private recomputeWordCount(): void {
    const doc = this.doc();
    if (!doc?.word) return;
    doc.word.wordCount = doc.word.blocks.reduce((sum, block) => {
      if (block.kind === 'paragraph') {
        const text = block.paragraph.runs.map((run) => run.text).join(' ').trim();
        return sum + (text ? text.split(/\s+/).length : 0);
      }
      return sum + block.rows.flat().reduce((cellSum, cell) => {
        const text = cell.map((paragraph) => paragraph.runs.map((run) => run.text).join(' ')).join(' ').trim();
        return cellSum + (text ? text.split(/\s+/).length : 0);
      }, 0);
    }, 0);
  }

  private updateCellNode(sheet: ExcelSheet, cell: ExcelCell): void {
    if (!sheet.xmlRoot) return;
    const sheetData = findChild(sheet.xmlRoot, 'sheetData');
    if (!sheetData) return;
    let rowNode = sheetData.children.find((child) => child.name === 'row' && child.attrs['r'] === String(cell.row));
    if (!rowNode) {
      rowNode = { name: 'row', attrs: { r: String(cell.row) }, text: '', children: [] };
      sheetData.children.push(rowNode);
    }
    let cellNode = rowNode.children.find((child) => child.name === 'c' && child.attrs['r'] === cell.ref);
    if (!cellNode) {
      cellNode = { name: 'c', attrs: { r: cell.ref }, text: '', children: [] };
      rowNode.children.push(cellNode);
    }
    cellNode.children = cellNode.children.filter((child) => !['f', 'v', 'is'].includes(child.name));
    if (cell.formula) {
      cellNode.children.push({ name: 'f', attrs: {}, text: cell.formula.slice(1), children: [] });
    }
    if (cell.value !== '') {
      cellNode.children.push({ name: 'v', attrs: {}, text: cell.value, children: [] });
    }
    if (cell.type === 'string') cellNode.attrs['t'] = 'str';
    else delete cellNode.attrs['t'];
    cell.xmlNode = cellNode;
  }

  private downloadBytes(bytes: Uint8Array, fileName: string): void {
    const blob = new Blob([bytes as BlobPart], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private applyDocument(doc: OfficeDocument, buffer: ArrayBuffer): void {
    this.revokePdf();
    this.revokeMedia();
    this.doc.set(doc);
    this.buffers.set(buffer);
    this.dirty.set(false);
    if (doc.word) doc.word.comments = doc.word.comments ?? [];
    this.comments.set(doc.word?.comments ?? []);
    this.selectedParagraph.set(null);
    this.revisions.set(doc.word ? listRevisions(doc.word) : []);
    this.markupMode.set('all');
    this.revisionTick.update((value) => value + 1);
    this.wordRenderKey.update((value) => value + 1);
    this.tracking.set(false);
    this.commentsOpen.set(false);
    this.revisionsOpen.set(false);
    this.headerFooterOpen.set(false);
    this.notesPanelOpen.set(false);
    this.citationsOpen.set(false);
    this.tocOpen.set(false);
    this.layoutOpen.set(false);
    this.accessOpen.set(false);
    this.altDrafts.set({});
    this.findOpen.set(false);
    this.findQuery.set('');
    this.findReplacement.set('');
    this.findIndex.set(0);
    this.insertTableOpen.set(false);
    this.formatOpen.set(false);
    this.wordSelection.set(null);
    this.wordPainter.set(null);
    this.wordClipboardStatus.set(null);
    this.wordUndoStack = [];
    this.wordRedoStack = [];
    this.wordHistoryTick.update((value) => value + 1);
    this.pdfSearchOpen.set(false);
    this.pdfSearchQuery.set('');
    this.pdfSearchHits.set([]);
    this.pdfSearchIndex.set(0);
    this.wordNotes.set(doc.word?.notes ?? null);
    this.sources.set([...(doc.word?.sources ?? [])]);
    this.bookmarks.set(doc.word ? parseBookmarks(doc.word) : []);
    this.tocList.set(doc.word ? tocEntries(doc.word) : []);
    this.equations.set(doc.word?.equations ?? []);
    this.inkStrokes.set([...(doc.word?.inkStrokes ?? [])]);
    this.inkOpen.set(false);
    this.equationOpen.set(false);
    this.smartArtOpen.set(false);
    this.smartArtShape.set(null);
    this.smartArtDraft.set([]);
    if (doc.word) this.loadHeaderFooter();
    this.resetView();
    if (doc.app === 'pdf') {
      const bytes = new Uint8Array(buffer);
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
      this.pdfObjectUrl = url;
      this.pdfBaseUrl = url;
      this.pdfPage.set(1);
      this.refreshPdfPageUrl();
      this.pdfRotation.set(0);
      this.annotationTool.set('select');
      this.pendingNote.set(null);
      this.noteDraft.set('');
      this.annotationKey = annotationsStorageKey(doc.fileName, bytes.length);
      const embedded = parseEmbeddedAnnotations(bytes);
      const local = parseAnnotations(localStorage.getItem(this.annotationKey));
      this.annotations.set(embedded.length ? embedded : local);
      this.dirty.set(false);
      this.pdfTextPages.set([]);
      this.pdfSearchOpen.set(false);
      this.pdfSearchQuery.set('');
      this.pdfSearchHits.set([]);
      this.pdfSearchIndex.set(0);
      void extractPdfTextPages(bytes)
        .then((pages) => this.pdfTextPages.set(pages))
        .catch(() => this.pdfTextPages.set([]));
    }
    if (doc.app === 'excel') {
      this.excelAnalysis.set(doc.excel?.analysis ?? { pivots: [], charts: [], tables: [], slicers: [] });
      setTimeout(() => this.drawGrid(), 0);
    }
    if (doc.app === 'word') this.scheduleWordMeasure();
  }

  readonly buffers = signal<ArrayBuffer | null>(null);

  private pdfSource(): ArrayBuffer | null {
    return this.buffers();
  }

  private resetView(): void {
    this.resetWordHeights();
    this.selectedSheet.set(0);
    this.selectedSlide.set(0);
    this.selectedCell.set('A1');
    this.activeTab.set('home');
    this.syncTabUrl('home');
    this.infoOpen.set(false);
    this.fileMenuOpen.set(false);
    this.chartOpen.set(false);
    this.pivotOpen.set(false);
    this.cellError.set(null);
    this.pptNotesOpen.set(false);
    this.pptCommentsOpen.set(false);
    this.pptSetupOpen.set(false);
    this.pptNotesDraft.set('');
    this.pptCommentDraft.set('');
    this.navPaneOpen.set(false);
    this.linkOpen.set(false);
    this.symbolOpen.set(false);
    this.videoOpen.set(false);
    this.spellOpen.set(false);
    this.headerFooterOpen.set(false);
    this.notesPanelOpen.set(false);
    this.citationsOpen.set(false);
    this.tocOpen.set(false);
    this.layoutOpen.set(false);
    this.accessOpen.set(false);
    this.equationOpen.set(false);
    this.inkOpen.set(false);
    this.excelAnalysis.set({ pivots: [], charts: [], tables: [], slicers: [] });
    this.cfOpen.set(false);
    this.dvOpen.set(false);
    this.tableOpen.set(false);
    if (this.app() !== 'pdf') {
      this.pdfUrl.set(null);
      this.pdfBaseUrl = null;
    }
  }

  private revokePdf(): void {
    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
      this.pdfObjectUrl = null;
    }
    this.pdfPageUrl.set(null);
    this.pdfBaseUrl = null;
  }

  private describeError(error: unknown): string {
    if (error && typeof error === 'object' && 'code' in error) {
      return String((error as { code: unknown }).code);
    }
    return error instanceof Error ? error.message : 'OFFICE_OPEN_FAILED';
  }

  private drawGrid(): void {
    const canvas = this.canvasRef?.nativeElement;
    const sheet = this.currentSheet();
    if (!canvas || !sheet) return;
    const width = 1000;
    const height = 540;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const headerH = 26;
    const headerW = 43;
    const rowH = 24;
    const colW = 120;
    const rows = 20;
    const cols = 10;

    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, headerH);
    ctx.fillRect(0, 0, headerW, height);
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.font = '12px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#374151';

    for (let col = 1; col <= cols; col++) {
      ctx.fillText(numberToColumn(col), headerW + (col - 1) * colW + 8, headerH / 2);
    }
    for (let row = 1; row <= rows; row++) {
      ctx.fillText(String(row), 10, headerH + (row - 1) * rowH + rowH / 2);
    }

    const selected = parseCellRef(this.selectedCell());
    const cfRules = parseConditionalRules(sheet);
    const filtered = visibleRows(sheet, this.excelFilter());
    for (let row = 1; row <= rows; row++) {
      const rowVisible = !filtered || row === 1 || filtered.has(row);
      for (let col = 1; col <= cols; col++) {
        const ref = `${numberToColumn(col)}${row}`;
        const cell = sheet.cells.get(ref);
        const style = cell?.style;
        const x = headerW + (col - 1) * colW;
        const y = headerH + (row - 1) * rowH;
        if (!rowVisible) {
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(x + 1, y + 1, colW - 2, rowH - 2);
          ctx.strokeStyle = '#e5e7eb';
          ctx.strokeRect(x, y, colW, rowH);
          continue;
        }
        if (selected && selected.row === row && selected.col === col) {
          ctx.fillStyle = '#dbeafe';
          ctx.fillRect(x + 1, y + 1, colW - 2, rowH - 2);
        }
        if (style?.fill) {
          ctx.fillStyle = style.fill;
          ctx.fillRect(x + 1, y + 1, colW - 2, rowH - 2);
        }
        const cf = cell ? styleFor(cfRules, ref, cell.type === 'number' ? Number(cell.value) : cell.value, sheet) : {};
        if (cf.background) {
          ctx.fillStyle = cf.background;
          ctx.fillRect(x + 1, y + 1, colW - 2, rowH - 2);
        }
        if (cf.barRatio !== undefined && cf.barRatio > 0) {
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = cf.barColor ?? '#638ec6';
          ctx.fillRect(x + 1, y + 1, (colW - 2) * Math.min(1, cf.barRatio), rowH - 2);
          ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = style?.border ? '#374151' : '#e5e7eb';
        ctx.lineWidth = style?.border ? 1.5 : 1;
        ctx.strokeRect(x, y, colW, rowH);
        ctx.lineWidth = 1;
        if (cell) {
          const display = this.excelShowFormulas() && cell.formula ? cell.formula : cellDisplayValue(cell);
          if (display) {
            const size = Math.round((style?.sizePt ?? 11) * 1.333);
            ctx.font = `${style?.italic ? 'italic ' : ''}${style?.bold ? 'bold ' : ''}${size}px ${style?.font ? `"${style.font}", sans-serif` : 'sans-serif'}`;
            ctx.fillStyle = cf.color ?? style?.color ?? (cell.type === 'number' ? '#1d4ed8' : '#111827');
            const value = display.length > 18 ? `${display.slice(0, 17)}…` : display;
            const textWidth = ctx.measureText(value).width;
            const indentX = (style?.indent ?? 0) * 8;
            const textX = style?.align === 'center' ? x + Math.max(4, (colW - textWidth) / 2) + indentX
              : style?.align === 'right' ? x + colW - textWidth - 6 - indentX
                : x + 6 + indentX;
            ctx.fillText(value, textX, y + rowH / 2);
          }
          if (sheet.comments?.has(ref)) {
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.moveTo(x + colW - 1, y + 1);
            ctx.lineTo(x + colW - 7, y + 1);
            ctx.lineTo(x + colW - 1, y + 7);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
    }
    const freeze = sheet.freeze;
    if (freeze) {
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 2;
      if (freeze.col > 0) {
        const x = headerW + freeze.col * colW;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      if (freeze.row > 0) {
        const y = headerH + freeze.row * rowH;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      ctx.lineWidth = 1;
    }
    ctx.strokeStyle = '#9ca3af';
    ctx.strokeRect(0, 0, width, height);
  }
}

function extensionOf(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : 'bin';
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function readAuthorName(): string {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('openerp_user_name') ?? localStorage.getItem('openerp_full_name');
    if (stored && stored.trim()) return stored.trim();
  }
  return 'ERP User';
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'EU';
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : `${parts[0][0]}${parts[parts.length - 1][0]}`;
  return letters.toUpperCase();
}

function docTypeOf(fileName: string): string {
  const ext = extensionOf(fileName);
  if (ext === 'docx') return 'WORD';
  if (ext === 'xlsx') return 'EXCEL';
  if (ext === 'pptx') return 'POWERPOINT';
  if (ext === 'csv') return 'CSV';
  if (ext === 'pdf') return 'PDF';
  return 'WORD';
}

function mimeOf(fileName: string): string {
  const ext = extensionOf(fileName);
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (ext === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (ext === 'pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (ext === 'csv') return 'text/csv';
  if (ext === 'pdf') return 'application/pdf';
  return 'application/octet-stream';
}
