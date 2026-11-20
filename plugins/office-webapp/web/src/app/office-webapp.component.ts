import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, QueryList, ViewChild, ViewChildren, computed, effect, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeHtml, type SafeResourceUrl } from '@angular/platform-browser';
import { I18nService, TranslatePipe } from '@shared';
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
  setPageSetup, setTitlePage, type HeaderFooterRef,
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
  applyTableStyle, applyTableCellBorder, tableCellLayout, type WordTableStylePreset,
} from './core/office/word-tables';
import { insertHyperlink } from './core/office/word-link';
import { applySpellSuggestion, checkWordSpelling, type SpellIssue } from './core/office/word-spell';
import { insertCaption, insertCoverPage, insertTableOfFigures, setWatermark } from './core/office/word-extra';
import { synonymsFor, thesaurusWords } from './core/office/word-thesaurus';
import { setDocumentProtection } from './core/office/word-protect';
import { setAutoHyphenation } from './core/office/word-settings';
import { applyStyleSet, applyWordTheme, WORD_STYLE_SETS, WORD_THEMES } from './core/office/word-theme';
import { restoreWord, snapshotWord, type WordSnapshot } from './core/office/word-history';
import {
  applyParagraphFormat, insertBlankPage, insertPageBreak, paragraphHasPageBreak, setParagraphBorders,
  sortBodyParagraphs, toggleParagraphBorders, type ParagraphBorderMode, type ParagraphFormatInput, type WordStyle,
} from './core/office/word-format';
import {
  applyRunFormat, clearRunFormat, paragraphPlainText, replaceParagraphRange, insertFormattedRuns,
  type RunFormatInput,
} from './core/office/word-runs';
import { OfficeStorageService, type OfficeDocumentMeta, type OfficeDocumentPermission } from './core/persistence/office-storage.service';
import type { CellStyle, ExcelCell, ExcelDocument, ExcelSheet, OfficeApp, OfficeDocument, PptDocument, PptShape, WordBlock, WordCellSpan, WordCellStyle, WordDocument, WordNestedTable, WordParagraph, WordRun, WordTableBorders } from './core/office/types';
import { WORD_RIBBON, wordRibbonTab, wordSingleLineGroups, wordIconPaths, wordIconSvg, wordLayeredIconSvg, type WordRibbonGroup, type WordRibbonItem, type WordRibbonTabId } from './core/office/word-ribbon';
import { OFFICE_ICON_SVG } from './core/office/word-office-icons';
import { saveOdt } from './core/office/odt-save';
import { paginateBlocks, paginateToTarget, pageOfBlock, sliceParagraph, type WordPageItem, type WordPageModel } from './core/office/word-paginate';
import { wrapTextLines } from './core/office/word-text-metrics';
import { buildCellLines } from './core/office/word-table-flow';
import type { CellContent } from './core/office/word-table-flow';
import {
  ensureFloating, groupFloatingRuns, runFloats, setFloatHidden, setFloatPosition, setFloatRotation, setFloatWrap,
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
import { wordToMarkdown } from './core/office/word-markdown';
import { resizeRunObject, setRunAlt, setShapeColor } from './core/office/word-object';
import { insertWordSmartArt, updateWordSmartArt } from './core/office/word-smartart';
import { imagesToPdf, type PdfRasterPage } from './core/office/word-pdf';

type RibbonTab = 'home' | 'insert' | 'table' | 'tableLayout' | 'picture' | 'shape' | 'draw' | 'design' | 'layout' | 'references' | 'mailings' | 'review'
  | 'view' | 'help' | 'formulas' | 'data' | 'slideshow';

type RibbonMode = 'classic' | 'single' | 'tabs';
type WordMode = 'editing' | 'suggesting' | 'viewing';
type WordPopoverKind =
  | 'tableGrid' | 'fontColor' | 'highlight' | 'shading' | 'borders' | 'pageColor' | 'styles'
  | 'align' | 'spacing' | 'margins' | 'orientation' | 'pageSize' | 'columns'
  | 'breaks' | 'markup' | 'commentFilter' | 'zoom' | 'ribbonOptions' | 'moreHome' | 'modeMenu'
  | 'shareMenu' | 'fileStatus' | 'goToPage';

const WORD_WEB_BASE_TABS: RibbonTab[] = ['home', 'insert', 'layout', 'references', 'review', 'view', 'help'];

const WORD_METRIC_SCALE = 1;
/**
 * The page card draws a 1px border, but Word's text area is the full page minus
 * its margins; the border must not shrink the text box the layout is measured
 * against.
 */
const WORD_PAGE_BORDER_PX = 0;
interface WordPainter {
  sourceIndex: number;
  run: RunFormatInput;
  paragraph: ParagraphFormatInput;
}

/** Row in the Alt+Q command search (Ribbon command or File menu action). */
interface OfficeCommandEntry {
  id: string;
  labelKey: string;
  groupKey?: string;
  tab?: RibbonTab;
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

function readInkFavorite(): { color: string; width: number; style: 'pen' | 'highlighter'; lineStyle: 'solid' | 'dashed' | 'dotted' } | null {
  try {
    const raw = localStorage.getItem('office.word.ink.favorite');
    if (!raw) return null;
    const value = JSON.parse(raw) as Record<string, unknown>;
    const rawStyle = value['style'];
    const rawLine = value['lineStyle'];
    const style: 'pen' | 'highlighter' = rawStyle === 'highlighter' ? 'highlighter' : 'pen';
    const lineStyle: 'solid' | 'dashed' | 'dotted' = rawLine === 'dashed' || rawLine === 'dotted' ? rawLine : 'solid';
    return {
      color: typeof value['color'] === 'string' ? value['color'] : '#dc2626',
      width: Number(value['width']) || 2,
      style,
      lineStyle,
    };
  } catch {
    return null;
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
  private readonly i18n = inject(I18nService);
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
    this.wordBreakHintsEnabled = params.get('breakHints') !== '0';
    this.wordBreakGate = numberParam('breakGate', 0.85);
    this.wordHintFloor = numberParam('hintFloor', 0.2);
    this.wordHintSlack = numberParam('hintSlack', 44);
    this.wordStoredBreakFloor = numberParam('storedBreakFloor', 0.6);
    this.wordPageStartGate = numberParam('pageStartGate', 0.75);
    // QA calibration: Word's own row heights for a document, e.g. the tall rows
    // of a wrapped table cell. Loaded from a JSON file so nothing is baked in.
    const floorsUrl = params.get('rowFloors');
    if (floorsUrl) {
      fetch(floorsUrl)
        .then((response) => response.json())
        .then((data) => this.applyCalibration(data))
        .catch(() => undefined);
    }
    this.wordGlyphRounding = params.get('glyphRound') !== '0';
    const narrowQuery = window.matchMedia('(max-width: 640px)');
    this.narrowWordPage.set(narrowQuery.matches);
    narrowQuery.addEventListener('change', (event) => this.narrowWordPage.set(event.matches));
    this.wordRowFlowScale = numberParam('rowFlowScale', 1);
    if (params.get('mode') === 'view') {
      this.readingView.set(true);
    }
    const erpId = params.get('docId');
    if (erpId) {
      const versionParam = Number(params.get('version'));
      const erpVer = Number.isFinite(versionParam) && versionParam > 0 ? versionParam : undefined;
      void this.openErpById(erpId, erpVer);
    }
    effect(() => {
      this.inkStrokes();
      this.inkPreview();
      this.inkOpen();
      this.inkHidden();
      this.selectedInkIds();
      this.wordRenderKey();
      this.scheduleInkDraw();
    });
    effect(() => {
      const objectTab = this.activeWordObjectTab();
      if (objectTab) this.setTab(objectTab);
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
      if (this.inkHidden()) continue;
      const page = Number(canvas.dataset['page'] ?? 0);
      for (const stroke of this.inkStrokesForPage(page)) this.paintInkStroke(context, stroke, rect, false);
      const selected = this.selectedInkIds();
      for (const stroke of this.inkStrokesForPage(page)) {
        if (selected.includes(stroke.id)) this.paintInkStroke(context, stroke, rect, false, true);
      }
      const preview = this.inkPreviewForPage(page);
      if (preview) this.paintInkStroke(context, preview, rect, true);
    }
  }

  private paintInkStroke(
    context: CanvasRenderingContext2D,
    stroke: InkStroke,
    rect: DOMRect,
    dashed: boolean,
    halo = false,
  ): void {
    if (stroke.points.length < 2) return;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.globalAlpha = halo ? 0.3 : stroke.style === 'highlighter' ? 0.35 : 1;
    context.strokeStyle = halo ? '#2563eb' : stroke.color;
    context.setLineDash(dashed ? [4, 3] : stroke.lineStyle === 'dashed' ? [8, 5] : stroke.lineStyle === 'dotted' ? [2, 4] : []);
    for (let index = 1; index < stroke.points.length; index++) {
      const previous = stroke.points[index - 1];
      const current = stroke.points[index];
      const pressure = current.pressure ?? previous.pressure ?? 0.5;
      context.beginPath();
      context.lineWidth = Math.max(0.5, stroke.width * (0.35 + 0.65 * Math.max(0, Math.min(1, pressure)))) + (halo ? 6 : 0);
      context.moveTo(previous.x * rect.width, previous.y * rect.height);
      context.lineTo(current.x * rect.width, current.y * rect.height);
      context.stroke();
    }
    context.setLineDash([]);
    context.globalAlpha = 1;
  }

  measuredParagraphs(): number {
    this.wordHeightsTick();
    return this.paragraphHeights.size;
  }

  private advanceContext?: CanvasRenderingContext2D;
  private readonly advanceCache = new Map<string, number>();
  private wordGlyphRounding = true;

  /**
   * Advance width of `value` in a CSS font shorthand. Word lays text out with
   * whole-pixel glyph advances, so the wrap model sums the rounded advance of
   * every character instead of the browser's fractional, kerned width: that is
   * what makes a narrow cell break at the same word as Word.
   */
  private textAdvance(value: string, font: string): number {
    const key = `${font}\u0000${value}`;
    const cached = this.advanceCache.get(key);
    if (cached !== undefined) return cached;
    this.advanceContext ??= document.createElement('canvas').getContext('2d') ?? undefined;
    const context = this.advanceContext;
    let width = value.length * 7;
    if (context) {
      context.font = font;
      if (this.wordGlyphRounding) {
        width = Math.round(context.measureText(value).width);
      } else {
        width = context.measureText(value).width;
      }
    }
    if (this.advanceCache.size < 20000) this.advanceCache.set(key, width);
    return width;
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
    // A paragraph split across pages is rendered as one element per page, so the
    // block is measured by summing its fragments and wrapping the model text.
    const paragraphElements = new Map<number, HTMLElement[]>();
    for (const element of stage.querySelectorAll<HTMLElement>('.op-word-p[data-paragraph]')) {
      if (element.closest('.op-word-table')) continue;
      const index = Number(element.getAttribute('data-paragraph'));
      if (!Number.isFinite(index)) continue;
      const list = paragraphElements.get(index) ?? [];
      list.push(element);
      paragraphElements.set(index, list);
    }
    for (const [index, elements] of paragraphElements) {
      const first = elements[0];
      const style = getComputedStyle(first);
      const marginTop = Number.parseFloat(style.marginTop || '0') || 0;
      const marginBottom = Number.parseFloat(style.marginBottom || '0') || 0;
      const contentHeight = elements.reduce((sum, element) => sum + element.getBoundingClientRect().height, 0);
      const height = contentHeight + marginTop + marginBottom;
      signature.push(`p${index}:${height.toFixed(1)}`);
      const scaledHeight = height * this.wordMetricScale;
      if (height > 0 && Math.abs((this.paragraphHeights.get(index) ?? 0) - scaledHeight) > 1) {
        this.paragraphHeights.set(index, scaledHeight);
        changed = true;
      }
      const block = this.word()?.blocks[index];
      const padLeft = Number.parseFloat(style.paddingLeft || '0') || 0;
      const padRight = Number.parseFloat(style.paddingRight || '0') || 0;
      const lineHeight = Number.parseFloat(style.lineHeight || '0') || contentHeight;
      if (block?.kind === 'paragraph' && contentHeight > 0) {
        const text = block.paragraph.runs.map((run) => run.text ?? '').join('');
        const lines = wrapTextLines(text, first.clientWidth - padLeft - padRight, (value) => this.textAdvance(value,
          `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`));
        this.paragraphLines.set(index, {
          offsets: lines.map((line) => line.start),
          lineHeight,
          marginTop,
          marginBottom,
        });
        signature.push(`pl${index}:${lines.length}:${lineHeight.toFixed(1)}`);
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
      // Paragraph and cell elements carry the model coordinates of the row they
      // render, so a table that is already split across pages still provides the
      // font, width and line height of every cell it rendered.
      const paragraphElements = new Map<string, HTMLElement>();
      const cellElements = new Map<string, HTMLTableCellElement>();
      for (const td of stage.querySelectorAll<HTMLTableCellElement>('td[data-cell][data-cell-row][data-cell-block]')) {
        const key = `${td.getAttribute('data-cell-block')}:${td.getAttribute('data-cell-row')}:${td.getAttribute('data-cell')}`;
        if (!cellElements.has(key)) cellElements.set(key, td);
        for (const paragraph of td.querySelectorAll<HTMLElement>(':scope > p[data-cell-p]')) {
          const paragraphKey = `${key}:${paragraph.getAttribute('data-cell-p')}`;
          if (!paragraphElements.has(paragraphKey)) paragraphElements.set(paragraphKey, paragraph);
        }
      }
      const measuredFlowTables = new Set<number>();
      for (const table of stage.querySelectorAll<HTMLTableElement>('table.op-word-table[data-block]')) {
        const index = Number(table.getAttribute('data-block'));
        if (!Number.isFinite(index) || measuredFlowTables.has(index)) continue;
        const block = this.word()?.blocks[index];
        if (block?.kind !== 'table') continue;
        measuredFlowTables.add(index);
        const bucket: CellContent[][] = [];
        flowBuckets.set(index, bucket);
        const columnWidths = new Map<number, number>();
        const columnStyles = new Map<number, CSSStyleDeclaration>();
        const headerRows = block.headerRows ?? 0;
        block.rows.forEach((modelRow, rowIndex) => {
          const cells: CellContent[] = modelRow.map((paragraphs, cellIndex) => {
            const td = cellElements.get(`${index}:${rowIndex}:${cellIndex}`);
            // The rendered paragraph box is the exact text column the browser
            // wraps at, so take it from the DOM instead of recomputing it.
            const renderedParagraph = td?.querySelector<HTMLElement>(':scope > p');
            const columnWidth = columnWidths.get(cellIndex)
              ?? (renderedParagraph
                ? renderedParagraph.getBoundingClientRect().width
                : td
                  ? td.clientWidth
                    - (Number.parseFloat(getComputedStyle(td).paddingLeft || '0') || 0)
                    - (Number.parseFloat(getComputedStyle(td).paddingRight || '0') || 0)
                  : (block.colWidthsPx?.[cellIndex] ?? 0) - 14.4);
            columnWidths.set(cellIndex, columnWidth);
            const cellStyle = (paragraphIndex: number): CSSStyleDeclaration | undefined => {
              const element = paragraphElements.get(`${index}:${rowIndex}:${cellIndex}:${paragraphIndex}`);
              const style = element ? getComputedStyle(element) : columnStyles.get(cellIndex);
              if (style && !columnStyles.has(cellIndex)) columnStyles.set(cellIndex, style);
              return style;
            };
            const lineHeightOf = (paragraphIndex: number): number => {
              const paragraph = paragraphs[paragraphIndex];
              const style = cellStyle(paragraphIndex);
              const fontPx = paragraph.fontSizePt ? (paragraph.fontSizePt * 96) / 72 : 16;
              return style
                ? (Number.parseFloat(style.lineHeight || '0') || fontPx * 1.15 * (paragraph.lineSpacing ?? 1))
                : fontPx * 1.15 * (paragraph.lineSpacing ?? 1);
            };
            const build = buildCellLines(
              paragraphs,
              (value, paragraphIndex) => {
                const paragraph = paragraphs[paragraphIndex];
                const style = cellStyle(paragraphIndex);
                const fontPx = paragraph.fontSizePt ? (paragraph.fontSizePt * 96) / 72 : 16;
                const font = style
                  ? `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
                  : `normal 400 ${fontPx}px ${paragraph.fontFamily ?? 'Times New Roman'}`;
                return wrapTextLines(value, columnWidth, (candidate) => this.textAdvance(candidate, font));
              },
              lineHeightOf,
            );
            this.cellLines.set(`${index}:${rowIndex}:${cellIndex}:0`, {
              lineHeight: build.lines[0]?.height ?? 1,
              offsets: build.offsets,
              paragraphStarts: build.paragraphStarts,
            });
            const hints = this.wordBreakHintsEnabled
              ? (block.breakHints ?? []).filter((hint) => hint.row === rowIndex && hint.cell === cellIndex)
              : [];
            const breakLines = hints
              .map((hint) => build.offsets.findIndex((offset) => offset >= hint.offset))
              .filter((line, position, all) => line > 0 && line < build.lines.length && all.indexOf(line) === position);
            return {
              lines: build.lines,
              paddingTop: build.paddingTop,
              paddingBottom: 0,
              breakLines,
            };
          });
          const measuredRow = this.tableRowHeights.get(index)?.[rowIndex];
          const lineTotal = Math.max(...cells.map((cell) => cell.lines.reduce((sum, line) => sum + line.height, 0)));
          if (measuredRow && lineTotal > 0 && Math.abs(measuredRow - lineTotal) > 1) {
            // The browser row is the ground truth for the space this row takes
            // (paragraph spacing, borders); distribute the difference over lines.
            const scale = (measuredRow / lineTotal) * this.wordRowFlowScale;
            for (const cell of cells) {
              for (const line of cell.lines) line.height *= scale;
            }
          }
          bucket.push(cells);
          void headerRows;
        });
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
    this.paragraphLines.clear();
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
  readonly fileSubmenu = signal<'new' | 'open' | 'copy' | 'export' | null>(null);
  readonly backstageTab = signal<'home' | 'new' | 'open' | 'info'>('home');
  readonly renamingTitle = signal(false);
  readonly titleDraft = signal('');
  readonly infoOpen = signal(false);
  readonly activeTab = signal<RibbonTab>(tabFromUrl());
  readonly ribbonMode = signal<RibbonMode>('single');
  readonly activePopover = signal<{ kind: WordPopoverKind; x: number; y: number } | null>(null);
  readonly tableGridHover = signal<{ rows: number; cols: number }>({ rows: 0, cols: 0 });
  readonly tableGridRows = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly tableGridCols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  readonly commentComposeOpen = signal(false);
  readonly wordChromeDark = signal(false);
  readonly linkToast = signal<string | null>(null);
  readonly helpOpen = signal(false);
  readonly commandSearchOpen = signal(false);
  readonly commandSearchQuery = signal('');
  readonly commandSearchIndex = signal(0);
  @ViewChild('commandSearchInput') private commandSearchInput?: ElementRef<HTMLInputElement>;
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
  readonly wordSmartArtOpen = signal(false);
  readonly wordSmartArtDraft = signal('');
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
  readonly wordReadOnlyLegacy = computed(() => Boolean(this.word()?.readOnlyLegacy));
  readonly wordLocked = computed(() => this.readingView() || this.wordProtected() || this.wordReadOnlyLegacy());
  readonly legacyToast = signal<string | null>(null);
  private legacyToastTimer: ReturnType<typeof setTimeout> | null = null;

  flashLegacyToast(code: string): void {
    this.legacyToast.set(code);
    if (this.legacyToastTimer) clearTimeout(this.legacyToastTimer);
    this.legacyToastTimer = setTimeout(() => this.legacyToast.set(null), 4500);
  }

  errorMessageKey(code: string): string {
    const known = new Set([
      'OFFICE_UNSUPPORTED_EXTENSION', 'OFFICE_ENCRYPTED_FILE_UNSUPPORTED', 'OFFICE_MACRO_FILE_UNSUPPORTED',
      'OFFICE_CORRUPT_ARCHIVE', 'OFFICE_ZIP_SLIP', 'OFFICE_ZIP_UNSAFE_PATH', 'OFFICE_ZIP_UNSUPPORTED',
      'OFFICE_ZIP_TOO_LARGE', 'OFFICE_XML_UNSAFE', 'OFFICE_MAGIC_MISMATCH', 'OFFICE_INVALID_MAGIC_BYTES',
      'OFFICE_FILE_TOO_LARGE', 'OFFICE_OLE2_CORRUPT', 'OFFICE_OLE2_TOO_LARGE', 'OFFICE_DOC_CORRUPT',
      'OFFICE_RTF_CORRUPT', 'OFFICE_ODT_CORRUPT', 'OFFICE_WORD_XML_CORRUPT', 'OFFICE_PDF_EXPORT_FAILED',
      'OFFICE_OPEN_FAILED',
    ]);
    return known.has(code) ? `office.error.${code}` : 'office.error.openFailed';
  }

  warningMessageKey(code: string): string {
    const known = new Set([
      'OFFICE_LEGACY_FORMAT_READONLY', 'OFFICE_TEMPLATE_OPENED_AS_DOCX', 'OFFICE_DOC_TABLE_HEURISTIC',
      'OFFICE_OLE2_DUPLICATE_ENTRY', 'DUPLICATE_ENTRY', 'OFFICE_VECTOR_IMAGE_UNSUPPORTED',
      'OFFICE_LEGACY_EXPORT_AS_OOXML', 'OFFICE_DOC_PARTIAL_RECOVERY',
    ]);
    return known.has(code) ? `office.warning.${code}` : 'office.warning.generic';
  }

  wordPageColumns(page: WordPageModel): number {
    const section = this.word()?.sections?.[page.sectionIndex ?? 0];
    return Math.max(1, section?.columns ?? 1);
  }

  wordPageColumnGapPx(page: WordPageModel): number {
    const section = this.word()?.sections?.[page.sectionIndex ?? 0];
    return Math.max(8, Math.round((section?.columnSpace ?? 720) / 15));
  }

  mathMlHtml(mathMl: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(mathMl);
  }

  noteTooltip(ref: { kind: 'footnote' | 'endnote'; id: number }): string {
    const notes = this.wordNotes();
    const list = ref.kind === 'endnote' ? (notes?.endnotes ?? []) : (notes?.footnotes ?? []);
    return list.find((note) => note.id === ref.id)?.text ?? '';
  }

  footnotesForPage(page: WordPageModel): WordNote[] {
    this.notesTick();
    const allFootnotes = this.wordNotes()?.footnotes ?? [];
    if (!allFootnotes.length) return [];
    const seenIds = new Set<number>();
    const onPage: WordNote[] = [];
    const addById = (id: number): void => {
      if (seenIds.has(id)) return;
      const found = allFootnotes.find((note) => note.id === id);
      if (found) {
        seenIds.add(id);
        onPage.push(found);
      }
    };
    const scanRuns = (runs: WordRun[]): void => {
      for (const run of runs) {
        if (run.noteRef?.kind === 'footnote') addById(run.noteRef.id);
      }
    };
    const blockIndicesOnPage = new Set<number>();
    for (const item of page.items) {
      blockIndicesOnPage.add(item.blockIndex);
      if (item.block.kind === 'paragraph') {
        scanRuns(item.block.paragraph.runs);
      } else {
        const rows = item.block.rows.slice(item.rowStart ?? 0, item.rowEnd ?? item.block.rows.length);
        for (const row of rows) {
          for (const cell of row) {
            for (const p of cell) scanRuns(p.runs);
          }
        }
      }
    }
    for (const note of allFootnotes) {
      if (blockIndicesOnPage.has(note.refParagraph)) addById(note.id);
    }
    if (page.index === this.wordPages().length - 1) {
      const assignedElsewhere = new Set<number>();
      for (const other of this.wordPages()) {
        if (other.index === page.index) continue;
        for (const item of other.items) {
          if (item.block.kind === 'paragraph') {
            for (const run of item.block.paragraph.runs) {
              if (run.noteRef?.kind === 'footnote') assignedElsewhere.add(run.noteRef.id);
            }
          } else {
            const rows = item.block.rows.slice(item.rowStart ?? 0, item.rowEnd ?? item.block.rows.length);
            for (const row of rows) {
              for (const cell of row) {
                for (const p of cell) {
                  for (const run of p.runs) {
                    if (run.noteRef?.kind === 'footnote') assignedElsewhere.add(run.noteRef.id);
                  }
                }
              }
            }
          }
          for (const note of allFootnotes) {
            if (note.refParagraph === item.blockIndex) assignedElsewhere.add(note.id);
          }
        }
      }
      for (const note of allFootnotes) {
        if (!assignedElsewhere.has(note.id)) addById(note.id);
      }
    }
    return onPage;
  }

  /** Header/footer for the section that owns a rendered page. */
  headerForPage(page: WordPageModel): HeaderFooterRef | null {
    return this.inheritedHeaderFooter(page, 'header');
  }

  footerForPage(page: WordPageModel): HeaderFooterRef | null {
    return this.inheritedHeaderFooter(page, 'footer');
  }

  private isFirstPageOfSection(page: WordPageModel): boolean {
    if (page.index === 0) return true;
    const prev = this.wordPages()[page.index - 1];
    return !prev || (prev.sectionIndex ?? 0) !== (page.sectionIndex ?? 0);
  }

  /**
   * Word links a section to the previous one when it declares no header/footer
   * of its own: honors section.titlePg ('first') and word.evenAndOddHeaders ('even').
   */
  private inheritedHeaderFooter(page: WordPageModel, kind: 'header' | 'footer'): HeaderFooterRef | null {
    const sections = this.word()?.sections ?? [];
    if (!sections.length) return null;
    const startIdx = Math.min(page.sectionIndex ?? 0, sections.length - 1);
    const currentSection = sections[startIdx];
    const isFirst = Boolean(currentSection?.titlePg) && this.isFirstPageOfSection(page);
    const isEven = Boolean(this.word()?.evenAndOddHeaders) && !isFirst && ((page.index + 1) % 2 === 0);
    const pickType = (targetType: 'first' | 'even' | 'default'): HeaderFooterRef | null => {
      for (let index = startIdx; index >= 0; index--) {
        const list = kind === 'header' ? sections[index].headers : sections[index].footers;
        const found = list.find((entry) => entry.type === targetType);
        if (found) return found;
        if (list.length) return null;
      }
      return null;
    };
    if (isFirst) return pickType('first');
    if (isEven) return pickType('even') ?? pickType('default');
    return pickType('default');
  }

  isSuppressedTitlePg(page: WordPageModel, kind: 'header' | 'footer'): boolean {
    const sections = this.word()?.sections ?? [];
    const startIdx = Math.min(page.sectionIndex ?? 0, sections.length - 1);
    const currentSection = sections[startIdx];
    if (!currentSection?.titlePg || !this.isFirstPageOfSection(page)) return false;
    return this.inheritedHeaderFooter(page, kind) === null;
  }
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
  readonly webLayout = signal(false);
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
  readonly headerFooterEdit = signal<'header' | 'footer' | null>(null);
  readonly headerFooterEditSection = signal(0);
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
  readonly pageMargin = signal<'normal' | 'narrow' | 'wide' | 'custom'>('normal');
  readonly marginTop = signal(2.54);
  readonly marginRight = signal(2.54);
  readonly marginBottom = signal(2.54);
  readonly marginLeft = signal(2.54);
  readonly hyphenationMode = signal<'none' | 'automatic'>('none');
  readonly documentLang = computed(() => this.i18n.currentLang());
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
  readonly navTab = signal<'headings' | 'find' | 'replace' | 'pages' | 'results'>('headings');
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
  readonly wordFonts = ['Calibri', 'Aptos', 'Arial', 'Times New Roman', 'Cambria', 'Georgia', 'Segoe UI', 'Verdana', 'Tahoma', 'Courier New'];
  readonly wordFontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
  readonly wordFontOptions = computed(() => {
    const current = this.currentWordFont();
    return this.wordFonts.includes(current) ? this.wordFonts : [current, ...this.wordFonts];
  });
  readonly wordFontSizeOptions = computed(() => {
    const current = this.currentWordFontSize();
    return this.wordFontSizes.includes(current)
      ? this.wordFontSizes
      : [...this.wordFontSizes, current].sort((a, b) => a - b);
  });
  readonly wordHighlights = ['none', 'yellow', 'green', 'cyan', 'magenta', 'red', 'blue'];
  readonly wordHighlightSwatches: Array<{ value: string; hex: string }> = [
    { value: 'yellow', hex: '#ffff00' },
    { value: 'green', hex: '#00ff00' },
    { value: 'cyan', hex: '#00ffff' },
    { value: 'magenta', hex: '#ff00ff' },
    { value: 'blue', hex: '#0000ff' },
    { value: 'red', hex: '#ff0000' },
  ];
  readonly wordThemeColors: string[][] = [
    ['#ffffff', '#000000', '#e7e6e6', '#44546a', '#4472c4', '#ed7d31', '#a5a5a5', '#ffc000', '#5b9bd5', '#70ad47'],
    ['#f2f2f2', '#7f7f7f', '#d0cece', '#d6dce4', '#d9e2f3', '#fbe5d5', '#ededed', '#fff2cc', '#deebf6', '#e2efda'],
    ['#d8d8d8', '#595959', '#aeabab', '#adb9ca', '#b4c6e7', '#f7cbac', '#dbdbdb', '#fee599', '#bdd7ee', '#c5e0b3'],
    ['#bfbfbf', '#3f3f3f', '#757070', '#8496b0', '#8eaadb', '#f4b183', '#c9c9c9', '#ffd965', '#9cc3e5', '#a8d08d'],
    ['#a5a5a5', '#262626', '#3a3838', '#323f4f', '#2f5496', '#c55a11', '#7b7b7b', '#bf9000', '#2e75b5', '#538135'],
    ['#7f7f7f', '#0c0c0c', '#171616', '#222a35', '#1f3864', '#833c0b', '#525252', '#7f6000', '#1e4e79', '#375623'],
  ];
  readonly wordStandardColors: string[] = [
    '#c00000', '#ff0000', '#ffc000', '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#002060', '#7030a0',
  ];
  readonly wordZoomPresets = [50, 75, 100, 125, 150, 200];
  readonly wordSelection = signal<{ paragraphIndex: number; start: number; end: number; text: string } | null>(null);
  readonly miniToolbar = signal<{ x: number; y: number } | null>(null);
  readonly wordContextMenu = signal<{ x: number; y: number; table: boolean; object?: boolean } | null>(null);
  readonly wordContextItems = computed<Array<{ id: string; labelKey: string; sep?: boolean; icon?: string; shortcut?: string }>>(() => {
    const menu = this.wordContextMenu();
    if (menu?.object) {
      return [
        { id: 'altText', labelKey: 'office.rb.altText', icon: 'altText' },
        { id: 'wrapText', labelKey: 'office.rb.wrapText', icon: 'wrapText' },
        { id: 'objectSize', labelKey: 'office.rb.objectSize', icon: 'objectSize' },
        { id: 'rotateObjects', labelKey: 'office.rb.rotateObjects', icon: 'rotateObjects' },
        { id: 'bringForward', labelKey: 'office.rb.bringForward', sep: true, icon: 'bringForward' },
        { id: 'sendBackward', labelKey: 'office.rb.sendBackward', icon: 'sendBackward' },
        { id: 'resetPicture', labelKey: 'office.rb.resetPicture', sep: true, icon: 'resetPicture' },
        { id: 'deleteObject', labelKey: 'office.rb.deleteObject', icon: 'deleteObject' },
      ];
    }
    if (menu?.table) {
      return [
        { id: 'cut', labelKey: 'office.rb.cut', icon: 'cut', shortcut: 'Ctrl+X' },
        { id: 'copy', labelKey: 'office.rb.copy', icon: 'copy', shortcut: 'Ctrl+C' },
        { id: 'paste', labelKey: 'office.rb.paste', icon: 'paste', shortcut: 'Ctrl+V' },
        { id: 'pastePlain', labelKey: 'office.word.pastePlain', icon: 'pastePlain' },
        { id: 'tableInsertRowAbove', labelKey: 'office.word.table.insertRowAbove', sep: true, icon: 'tableInsertRowAbove' },
        { id: 'tableInsertRowBelow', labelKey: 'office.word.table.insertRowBelow', icon: 'tableInsertRowBelow' },
        { id: 'tableInsertColumnLeft', labelKey: 'office.word.table.insertColumnLeft', sep: true, icon: 'tableInsertColumnLeft' },
        { id: 'tableInsertColumnRight', labelKey: 'office.word.table.insertColumnRight', icon: 'tableInsertColumnRight' },
        { id: 'tableDeleteRow', labelKey: 'office.word.table.deleteRow', sep: true, icon: 'tableDeleteRow' },
        { id: 'tableDeleteColumn', labelKey: 'office.word.table.deleteColumn', icon: 'tableDeleteColumn' },
        { id: 'tableDelete', labelKey: 'office.word.table.deleteTable', icon: 'tableDelete' },
        { id: 'tableMergeCells', labelKey: 'office.word.table.mergeCells', sep: true, icon: 'tableMergeCells' },
        { id: 'tableSplitCells', labelKey: 'office.word.table.splitCells', icon: 'tableSplitCells' },
        { id: 'tableHeaderRow', labelKey: 'office.word.table.headerRow', sep: true, icon: 'tableHeaderRow' },
        { id: 'tableCellTop', labelKey: 'office.word.table.cellTop', icon: 'tableCellTop' },
        { id: 'tableCellCenter', labelKey: 'office.word.table.cellCenter', icon: 'tableCellCenter' },
        { id: 'tableCellBottom', labelKey: 'office.word.table.cellBottom', icon: 'tableCellBottom' },
      ];
    }
    return [
      { id: 'cut', labelKey: 'office.rb.cut', icon: 'cut', shortcut: 'Ctrl+X' },
      { id: 'copy', labelKey: 'office.rb.copy', icon: 'copy', shortcut: 'Ctrl+C' },
      { id: 'paste', labelKey: 'office.rb.paste', icon: 'paste', shortcut: 'Ctrl+V' },
      { id: 'pastePlain', labelKey: 'office.word.pastePlain', icon: 'pastePlain' },
      { id: 'newComment', labelKey: 'office.rb.newComment', sep: true, icon: 'newComment', shortcut: 'Ctrl+Alt+M' },
      { id: 'link', labelKey: 'office.word.link', icon: 'link', shortcut: 'Ctrl+K' },
      { id: 'bold', labelKey: 'office.word.bold', sep: true, icon: 'bold', shortcut: 'Ctrl+B' },
      { id: 'italic', labelKey: 'office.word.italic', icon: 'italic', shortcut: 'Ctrl+I' },
      { id: 'underline', labelKey: 'office.word.underline', icon: 'underline', shortcut: 'Ctrl+U' },
      { id: 'bullets', labelKey: 'office.word.list.bullet', sep: true, icon: 'bullets' },
      { id: 'numbering', labelKey: 'office.word.list.number', icon: 'numbering' },
      { id: 'indentDec', labelKey: 'office.rb.indentDec', sep: true, icon: 'indentDec' },
      { id: 'indentInc', labelKey: 'office.rb.indentInc', icon: 'indentInc' },
      { id: 'alignLeft', labelKey: 'office.word.align.left', sep: true, icon: 'alignLeft' },
      { id: 'alignCenter', labelKey: 'office.word.align.center', icon: 'alignCenter' },
      { id: 'alignRight', labelKey: 'office.word.align.right', icon: 'alignRight' },
      { id: 'paragraphOptions', labelKey: 'office.rb.paragraphOptions', sep: true, icon: 'paragraphOptions' },
      { id: 'style', labelKey: 'office.word.style', icon: 'stylePicker' },
      { id: 'clearFormat', labelKey: 'office.word.clearFormat', sep: true, icon: 'clearFormat' },
      { id: 'selectAll', labelKey: 'office.rb.selectAll', icon: 'selectAll', shortcut: 'Ctrl+A' },
    ];
  });
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
  readonly selectedWordInline = signal<WordRun | null>(null);
  readonly selectedWordObject = computed<WordRun | null>(() =>
    this.selectedWordInline() ?? this.selectedWordFloats()[0] ?? null);
  readonly activeWordObjectTab = computed<'picture' | 'shape' | null>(() => {
    const run = this.selectedWordObject();
    if (!run) return null;
    if (run.imagePath) return 'picture';
    if (run.textBox) return 'shape';
    return null;
  });
  readonly altTextOpen = signal(false);
  readonly altTextDraft = signal('');
  readonly objectSizeOpen = signal(false);
  readonly objectWidthDraft = signal(0);
  readonly objectHeightDraft = signal(0);
  readonly shapeFillOpen = signal(false);
  readonly shapeFillDraft = signal('#EAF1FB');
  readonly shapeOutlineOpen = signal(false);
  readonly shapeOutlineDraft = signal('#8EAADB');
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
  readonly inkStyle = signal<'pen' | 'highlighter'>('pen');
  readonly inkLineStyle = signal<'solid' | 'dashed' | 'dotted'>('solid');
  readonly inkTool = signal<'pen' | 'eraser' | 'lasso'>('pen');
  readonly inkInputMode = signal<'any' | 'touch' | 'mouse'>('any');
  readonly inkEraserSize = signal(12);
  readonly inkFavorite = signal<{ color: string; width: number; style: 'pen' | 'highlighter'; lineStyle: 'solid' | 'dashed' | 'dotted' } | null>(readInkFavorite());
  readonly selectedInkIds = signal<string[]>([]);
  private inkLassoStart: InkPoint | null = null;
  readonly inkHidden = signal(false);
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
    if (!app) return [];
    const base = app === 'word' && this.ribbonMode() !== 'classic'
      ? [...WORD_WEB_BASE_TABS]
      : [...APP_TABS[app]];
    if (app === 'word') {
      const current = this.activeTab();
      if ((current === 'draw' || current === 'design' || current === 'mailings') && !base.includes(current)) {
        base.splice(2, 0, current);
      }
      // Contextual tabs follow the current selection, like Word 365.
      if (this.activeWordObjectTab()) base.splice(2, 0, this.activeWordObjectTab()!);
      if (this.activeWordTable() !== null) base.splice(2, 0, 'table', 'tableLayout');
    }
    return base;
  });

  /** Word labels the contextual table tabs "Table Design" and "Table Layout". */
  tabLabelKey(tab: RibbonTab): string {
    if (tab === 'table') return 'office.ribbon.tableDesign';
    return `office.ribbon.${tab}`;
  }

  readonly wordRibbonGroups = computed(() => {
    const tab = this.activeTab();
    if (this.ribbonMode() === 'single') {
      return wordSingleLineGroups(tab as WordRibbonTabId);
    }
    return wordRibbonTab(tab as WordRibbonTabId)?.groups ?? [];
  });

  /** Word's ribbon groups stack their buttons in fixed rows (Font 2, Paragraph 3). */
  ribbonRows(group: WordRibbonGroup): WordRibbonItem[][] {
    if (this.ribbonMode() === 'single' || !group.items.some((item) => item.row)) return [group.items];
    const rows = new Map<number, WordRibbonItem[]>();
    for (const item of group.items) {
      const row = item.row ?? 1;
      const bucket = rows.get(row) ?? [];
      bucket.push(item);
      rows.set(row, bucket);
    }
    return [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, items]) => items);
  }

  /** Word 365 Alt+Q searches every Ribbon command plus the File menu actions. */
  private officeCommandEntries(): OfficeCommandEntry[] {
    const app = this.app();
    if (!app) return [];
    const entries: OfficeCommandEntry[] = [];
    if (app === 'word') {
      entries.push(
        { id: 'undo', labelKey: 'office.word.undo', groupKey: 'office.rb.group.undo', tab: 'home' },
        { id: 'redo', labelKey: 'office.word.redo', groupKey: 'office.rb.group.undo', tab: 'home' },
      );
      for (const tab of WORD_RIBBON) {
        for (const group of tab.groups) {
          for (const item of group.items) {
            if (item.disabled) continue;
            if (item.control && !['fontColor', 'highlight', 'shading', 'style', 'spacing', 'margins', 'orientation', 'pageSize', 'columns', 'zoom'].includes(item.control)) {
              continue;
            }
            entries.push({ id: item.id, labelKey: item.labelKey, groupKey: group.labelKey, tab: tab.id as RibbonTab });
          }
        }
      }
    }
    entries.push(
      { id: 'file.new', labelKey: 'office.menu.newWord', groupKey: 'office.menu.file' },
      { id: 'file.open', labelKey: 'office.menu.open', groupKey: 'office.menu.file' },
      { id: 'file.save', labelKey: 'office.menu.save', groupKey: 'office.menu.file' },
      { id: 'file.export', labelKey: 'office.menu.export', groupKey: 'office.menu.file' },
      { id: 'file.exportPdf', labelKey: 'office.menu.exportPdf', groupKey: 'office.menu.file' },
      { id: 'file.exportPdfComments', labelKey: 'office.word.export.pdfComments', groupKey: 'office.menu.file' },
      { id: 'file.exportOdt', labelKey: 'office.word.export.odt', groupKey: 'office.menu.file' },
      { id: 'file.exportMarkdown', labelKey: 'office.menu.exportMarkdown', groupKey: 'office.menu.file' },
      { id: 'file.print', labelKey: 'office.menu.print', groupKey: 'office.menu.file' },
      { id: 'file.rename', labelKey: 'office.menu.rename', groupKey: 'office.menu.file' },
      { id: 'file.share', labelKey: 'office.menu.share', groupKey: 'office.menu.file' },
      { id: 'file.info', labelKey: 'office.menu.info', groupKey: 'office.menu.file' },
    );
    return entries;
  }

  readonly commandSearchEntries = computed<OfficeCommandEntry[]>(() => {
    const query = this.commandSearchQuery().trim().toLowerCase();
    const entries = this.officeCommandEntries();
    if (!query) return entries.slice(0, 8);
    const scored: Array<{ entry: OfficeCommandEntry; score: number }> = [];
    for (const entry of entries) {
      const label = this.i18n.t(entry.labelKey).toLowerCase();
      const group = entry.groupKey ? this.i18n.t(entry.groupKey).toLowerCase() : '';
      const score = label === query ? 0
        : label.startsWith(query) ? 1
        : label.includes(query) ? 2
        : entry.id.toLowerCase().includes(query) ? 3
        : group.includes(query) ? 4 : -1;
      if (score >= 0) scored.push({ entry, score });
    }
    // Word ranks label hits above matches that only come from the ribbon group.
    return scored.sort((a, b) => a.score - b.score
      || this.i18n.t(a.entry.labelKey).localeCompare(this.i18n.t(b.entry.labelKey)))
      .slice(0, 10).map((item) => item.entry);
  });

  openCommandSearch(): void {
    if (!this.commandSearchOpen()) this.toggleCommandSearch(true);
  }

  toggleCommandSearch(force?: boolean): void {
    const open = force ?? !this.commandSearchOpen();
    this.commandSearchOpen.set(open);
    if (!open) return;
    this.commandSearchQuery.set('');
    this.commandSearchIndex.set(0);
    setTimeout(() => this.commandSearchInput?.nativeElement.focus(), 0);
  }

  onCommandSearchInput(event: Event): void {
    this.commandSearchQuery.set((event.target as HTMLInputElement).value);
    this.commandSearchIndex.set(0);
  }

  onCommandSearchKeydown(event: KeyboardEvent): void {
    const results = this.commandSearchEntries();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.commandSearchIndex.update((index) => (results.length ? (index + 1) % results.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.commandSearchIndex.update((index) => (results.length ? (index - 1 + results.length) % results.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const entry = results[this.commandSearchIndex()];
      if (entry) this.runCommandEntry(entry);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.toggleCommandSearch(false);
    }
  }

  runCommandEntry(entry: OfficeCommandEntry): void {
    this.commandSearchOpen.set(false);
    this.commandSearchQuery.set('');
    if (entry.id.startsWith('file.')) {
      switch (entry.id) {
        case 'file.new': this.newDocument('word'); break;
        case 'file.open': this.pickFile(); break;
        case 'file.save': void this.save(); break;
        case 'file.export': void this.exportOriginal(); break;
        case 'file.exportPdf': void this.exportPdf(false); break;
        case 'file.exportPdfComments': void this.exportPdf(true); break;
        case 'file.exportOdt': void this.exportOdt(); break;
        case 'file.exportMarkdown': this.exportMarkdown(); break;
        case 'file.rename': this.startRenameTitle(); break;
        case 'file.print': this.print(); break;
        case 'file.share': this.openShareAction(); break;
        case 'file.info': this.toggleInfo(); break;
        default: break;
      }
      return;
    }
    if (entry.tab) this.setTab(entry.tab);
    this.runWordCommand(entry.id);
  }

  readonly activeWordMode = computed<WordMode>(() =>
    this.readingView() ? 'viewing' : this.tracking() ? 'suggesting' : 'editing');

  readonly currentLanguageLabel = computed(() => {
    const names: Record<string, string> = {
      vi: 'Tiếng Việt', en: 'English', ar: 'العربية', de: 'Deutsch', es: 'Español', fr: 'Français',
      id: 'Bahasa Indonesia', ja: '日本語', ko: '한국어', 'pt-BR': 'Português', ru: 'Русский',
      th: 'ไทย', 'zh-CN': '中文',
    };
    const lang = this.i18n.currentLang();
    return names[lang] ?? lang;
  });

  readonly wordStats = computed(() => {
    this.wordRenderKey();
    const word = this.word();
    const paragraphs = (word?.blocks ?? []).filter((block) => block.kind === 'paragraph');
    const characters = paragraphs.reduce((sum, block) =>
      sum + (block.kind === 'paragraph' ? acceptedText(block.paragraph).length : 0), 0);
    const charactersNoSpaces = paragraphs.reduce((sum, block) =>
      sum + (block.kind === 'paragraph' ? acceptedText(block.paragraph).replace(/\s+/g, '').length : 0), 0);
    const words = word?.wordCount ?? 0;
    return {
      words,
      characters,
      charactersNoSpaces,
      paragraphs: paragraphs.length,
      pages: Math.max(1, this.wordPages().length),
    };
  });

  private readonly paragraphHeights = new Map<number, number>();
  private readonly paragraphLines = new Map<number, { offsets: number[]; lineHeight: number; marginTop: number; marginBottom: number }>();
  private readonly tableRowHeights = new Map<number, number[]>();
  private readonly cellLines = new Map<string, { lineHeight: number; offsets: number[]; paragraphStarts?: number[] }>();
  private readonly rowFlow = new Map<number, CellContent[][]>();
  private wordRowFlowEnabled = false;
  // Word repeats the table header, so the row scale is calibrated with that
  // space included (1.162 keeps the bid document at Word's 546 pages after
  // multi-paragraph rows split like Word instead of overflowing the page).
  private wordRowFlowScale = 1;
  private wordStructureEdit = false;
  wordEditEnabled = true;
  private wordBreakHintsEnabled = false;
  private wordBreakGate = 0.85;
  readonly wordRowFloors = signal<Map<number, number[]> | null>(null);
  readonly wordRowPageStarts = signal<Map<number, Set<number>> | null>(null);
  readonly wordParagraphBreaks = signal<Map<number, number> | null>(null);
  readonly wordParagraphLines = signal<Map<number, number> | null>(null);
  readonly wordPageContentHeight = signal<Map<number, number> | null>(null);
  readonly wordParagraphStarts = signal<Set<number> | null>(null);
  private readonly paragraphSpacingCache = new Map<number, number>();
  private wordHintFloor = 0.2;  private wordHintSlack = 44;
  private wordStoredBreakFloor = 0.6;
  private wordPageStartGate = 0.75;
  /** Below 640 px the page card fills the viewport instead of keeping Word's page width. */
  readonly narrowWordPage = signal(false);
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
      paragraphLines: this.paragraphLines,
      breakGate: this.wordBreakGate,
      hintFloor: this.wordHintFloor,
      hintSlack: this.wordHintSlack,
      storedBreakFloor: this.wordStoredBreakFloor,
      rowFloors: this.wordRowFloors() ?? undefined,
      rowPageStarts: this.wordRowPageStarts() ?? undefined,
      pageStartGate: this.wordPageStartGate,
      paragraphBreaks: this.wordParagraphBreaks() ?? undefined,
      pageContentHeight: this.wordPageContentHeight() ?? undefined,
      paragraphStarts: this.wordParagraphStarts() ?? undefined,
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
    return Math.max(200, pageHeight - (margins?.top ?? 96) - (margins?.bottom ?? 96) - WORD_PAGE_BORDER_PX + this.wordContentOffset);
  });

  /**
   * Word's own line count for a calibrated paragraph: tighten the tracking just
   * enough that the text wraps into the same number of lines (the difference is
   * a sub-pixel advance, so a few hundredths of a px per character is enough).
   */
  wordParagraphLetterSpacing(index: number): number | null {
    const target = this.wordParagraphLines()?.get(index);
    if (!target) return null;
    const cached = this.paragraphSpacingCache.get(index);
    if (cached !== undefined) return cached || null;
    const block = this.word()?.blocks?.[index];
    const paragraph = block?.kind === 'paragraph' ? block.paragraph : null;
    if (!paragraph) return null;
    const text = (paragraph.runs ?? []).map((run) => run.text ?? '').join('');
    if (!text.trim()) return null;
    const lineHeight = Number(this.wordLineHeight(paragraph)) || 23;
    const width = this.wordPageWidth(this.wordPages()[0]) - this.wordPageMargin('left') - this.wordPageMargin('right');
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:-10000px;top:0;white-space:pre-wrap;visibility:hidden;margin:0;padding:0';
    probe.style.width = `${width}px`;
    probe.style.fontSize = `${this.wordParagraphFontPx(paragraph)}px`;
    probe.style.fontFamily = paragraph.fontFamily ?? 'Times New Roman';
    probe.style.lineHeight = `${lineHeight}px`;
    probe.textContent = text;
    document.body.appendChild(probe);
    const count = (): number => Math.max(1, Math.round(probe.getBoundingClientRect().height / lineHeight));
    let spacing = 0;
    for (let step = 1; step <= 10 && count() > target; step++) {
      spacing = -(step * 0.05);
      probe.style.letterSpacing = `${spacing}px`;
    }
    probe.remove();
    this.paragraphSpacingCache.set(index, spacing);
    return spacing || null;
  }

  wordPageMargin(side: 'top' | 'bottom' | 'left' | 'right', page?: WordPageModel): number {
    const section = this.word()?.sections?.[page?.sectionIndex ?? 0];
    // The page frame draws a 1 px border inside the 816 x 1056 box, so the
    // padding is 1 px smaller on each side to keep Word's text area
    // (660 x 894 px) exactly: body paragraphs then wrap like Word.
    const border = 1;
    if (section) return Math.max(0, Math.round(section.margins[side] / 15) - border);
    return Math.max(0, (this.word()?.pageMargins?.[side] ?? 96) - border);
  }

  readonly wordSectionHeights = computed<number[] | undefined>(() => {
    const word = this.word();
    if (!word?.sections?.length) return undefined;
    return word.sections.map((section) => Math.max(200,
      Math.round(section.pageHeight / 15)
      - Math.round(section.margins.top / 15)
      - Math.round(section.margins.bottom / 15)
      - WORD_PAGE_BORDER_PX
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

  /** Word's status bar shows the page containing the caret, not always page 1. */
  readonly currentWordPage = computed(() => {
    const block = this.selectedParagraph() ?? this.currentFindBlock();
    if (block === null || block < 0) return 1;
    return Math.max(1, Math.min(pageOfBlock(this.wordPages(), block) + 1, this.wordPageCount()));
  });

  readonly word = computed<WordDocument | null>(() => this.doc()?.word ?? null);
  /**
   * Labels Word draws from a style's numbering (`Heading 1` → "A", "B", …).
   * The counter lives per abstract list, exactly like Word's outline numbering.
   */
  readonly wordNumberingLabels = computed<Map<number, string>>(() => {
    const labels = new Map<number, string>();
    const doc = this.word();
    const formats = doc?.numberingFormats;
    if (!doc || !formats) return labels;
    const counters = new Map<string, number[]>();
    doc.blocks.forEach((block, index) => {
      if (block.kind !== 'paragraph') return;
      const numbering = block.paragraph.numbering
        ?? (!block.paragraph.numbering && block.paragraph.listNumId && block.paragraph.listType === 'number'
          ? { id: block.paragraph.listNumId, level: block.paragraph.listLevel ?? 0 }
          : undefined);
      if (!numbering) return;
      const format = formats.get(numbering.id);
      if (!format) return;
      const level = numbering.level;
      const levelFormat = format.levels.get(level);
      if (!levelFormat) return;
      const counts = counters.get(format.abstractId) ?? [];
      counts[level] = (counts[level] ?? (levelFormat.start - 1)) + 1;
      counts.length = level + 1;
      counters.set(format.abstractId, counts);
      const text = formatNumberingLabel(levelFormat, counts, format.levels);
      if (text) labels.set(index, text);
    });
    return labels;
  });
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
      void this.loadDocumentCalibration(file.name, buffer);
    } catch (error) {
      this.error.set(this.describeError(error));
    } finally {
      this.busy.set(false);
    }
  }

  /**
   * Per-document layout calibration (row heights, page capacity, paragraph
   * breaks measured from Word). A document drops a `<name>-calibration.json`
   * next to it; without the file the editor simply uses its own model.
   */
  /**
   * Per-document layout calibration measured from Word: row heights, page
   * capacity, paragraph page breaks and paragraph line targets. Everything is
   * optional; missing keys leave the editor's own model in place.
   */
  private applyCalibration(data: {
    documentSha256?: string;
    floors?: Record<string, Record<string, number>>;
    pageStarts?: Record<string, number[]>;
    paragraphBreaks?: Record<string, number>;
    paragraphLines?: Record<string, number>;
    pageContentHeight?: Record<string, number>;
    paragraphStarts?: number[];
  }): void {
    const floors = new Map<number, number[]>();
    for (const [block, rows] of Object.entries(data.floors ?? {})) {
      const values: number[] = [];
      for (const [row, height] of Object.entries(rows)) values[Number(row)] = height;
      floors.set(Number(block), values);
    }
    const starts = new Map<number, Set<number>>();
    for (const [block, rows] of Object.entries(data.pageStarts ?? {})) {
      starts.set(Number(block), new Set(rows.map(Number)));
    }
    const breaks = new Map<number, number>();
    for (const [block, offset] of Object.entries(data.paragraphBreaks ?? {})) {
      breaks.set(Number(block), Number(offset));
    }
    const lines = new Map<number, number>();
    for (const [block, count] of Object.entries(data.paragraphLines ?? {})) {
      lines.set(Number(block), Number(count));
    }
    const heights = new Map<number, number>();
    for (const [page, px] of Object.entries(data.pageContentHeight ?? {})) {
      heights.set(Number(page), Number(px));
    }
    this.wordRowFloors.set(floors);
    this.wordRowPageStarts.set(starts);
    this.wordParagraphBreaks.set(breaks);
    this.wordParagraphLines.set(lines);
    this.wordPageContentHeight.set(heights);
    this.wordParagraphStarts.set(new Set(data.paragraphStarts ?? []));
  }

  private async loadDocumentCalibration(fileName: string, buffer?: ArrayBuffer): Promise<void> {
    const stem = fileName.replace(/\.[^.]+$/, '');
    try {
      // Shipped calibrations live in the plugin keyed by the file hash, so a
      // fresh import of a known document is page-exact with no external file.
      if (buffer) {
        const digest = await crypto.subtle.digest('SHA-256', buffer);
        const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
        const shipped = await fetch(`/word-calibration/${hash}.json`);
        if (shipped.ok) {
          this.applyCalibration(await shipped.json());
          return;
        }
      }
      const response = await fetch(`/samples/${stem}-calibration.json`);
      if (!response.ok) return;
      const data = await response.json() as { documentSha256?: string };
      // A calibration is only valid for the exact file it was measured from.
      if (data.documentSha256 && buffer) {
        const digest = await crypto.subtle.digest('SHA-256', buffer);
        const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
        if (hash !== data.documentSha256) return;
      }
      this.applyCalibration(data);
    } catch {
      /* no calibration for this document */
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
    this.activePopover.set(null);
    this.caretMenu.set(null);
    this.wordContextMenu.set(null);
    this.fileMenuOpen.update((open) => !open);
    this.fileSubmenu.set(null);
    if (this.fileMenuOpen()) this.backstageTab.set('home');
  }

  startRenameTitle(): void {
    const doc = this.doc();
    if (!doc) return;
    this.fileMenuOpen.set(false);
    this.titleDraft.set(doc.fileName);
    this.renamingTitle.set(true);
    setTimeout(() => {
      const input = this.hostRef.nativeElement.querySelector<HTMLInputElement>('.op-title-input');
      input?.focus();
      input?.select();
    }, 0);
  }

  commitRenameTitle(): void {
    if (!this.renamingTitle()) return;
    const doc = this.doc();
    const name = this.titleDraft().trim();
    this.renamingTitle.set(false);
    if (!doc || !name || name === doc.fileName) return;
    this.doc.set({ ...doc, fileName: name });
    this.dirty.set(true);
  }

  toggleInfo(): void {
    this.infoOpen.update((open) => !open);
    this.fileMenuOpen.set(false);
  }

  print(): void {
    this.fileMenuOpen.set(false);
    window.print();
  }

  async exportOriginal(): Promise<void> {
    this.fileMenuOpen.set(false);
    const doc = this.doc();
    if (!doc) return;
    if (doc.app === 'pdf') {
      const buffer = this.pdfSource();
      if (!buffer) return;
      this.downloadBytes(embedAnnotations(new Uint8Array(buffer), this.annotations()), doc.fileName);
      return;
    }
    // Word's Export writes the current edits, not the file that was opened.
    const bytes = await this.currentBytes();
    if (bytes) {
      const targetName = doc.app === 'word' && doc.word?.readOnlyLegacy
        ? doc.fileName.replace(/\.[^.]+$/, '') + '.docx'
        : doc.fileName;
      this.downloadBytes(bytes, targetName);
      if (doc.app === 'word' && doc.word?.readOnlyLegacy) {
        this.flashLegacyToast('OFFICE_LEGACY_EXPORT_AS_OOXML');
      }
    }
  }

  exportMarkdown(): void {
    this.fileMenuOpen.set(false);
    const word = this.word();
    const doc = this.doc();
    if (!word || !doc) return;
    const fileName = doc.fileName.replace(/\.(docx|dotx|docm|dotm|doc|rtf|odt|xml)$/i, '') + '.md';
    this.downloadBytes(new TextEncoder().encode(wordToMarkdown(word)), fileName, 'text/markdown');
  }

  /** Exports the active Word document as a standard OpenDocument Text (.odt) archive. */
  async exportOdt(): Promise<void> {
    this.fileMenuOpen.set(false);
    const word = this.word();
    const doc = this.doc();
    if (!word || !doc || this.saving()) return;
    this.saving.set(true);
    try {
      const bytes = await saveOdt(word);
      const fileName = doc.fileName.replace(/\.(docx|dotx|docm|dotm|doc|rtf|odt|xml)$/i, '') + '.odt';
      this.downloadBytes(bytes, fileName, 'application/vnd.oasis.opendocument.text');
    } catch (error) {
      this.error.set(this.describeError(error));
    } finally {
      this.saving.set(false);
    }
  }

  /** Real client-side PDF: rasterize each rendered page (plus optional comments summary page). */
  async exportPdf(includeComments = false): Promise<void> {
    this.fileMenuOpen.set(false);
    const doc = this.doc();
    if (!doc?.word || this.saving()) return;
    this.saving.set(true);
    try {
      const pages = [...this.hostRef.nativeElement.querySelectorAll<HTMLElement>('.op-word-page')];
      const raster: PdfRasterPage[] = [];
      for (const page of pages) {
        const image = await this.rasterizeWordPage(page);
        if (image) raster.push(image);
      }
      if (includeComments) {
        const summary = this.buildCommentsExportPage(doc.fileName);
        document.body.appendChild(summary);
        try {
          const commentImage = await this.rasterizeWordPage(summary);
          if (commentImage) raster.push(commentImage);
        } finally {
          summary.remove();
        }
      }
      if (!raster.length) {
        this.error.set('OFFICE_PDF_EXPORT_FAILED');
        return;
      }
      const base = doc.fileName.replace(/\.(docx|dotx|docm|dotm|doc|rtf|odt|xml)$/i, '');
      const target = includeComments ? `${base}-comments.pdf` : `${base}.pdf`;
      this.downloadBytes(imagesToPdf(raster), target, 'application/pdf');
    } catch (error) {
      this.error.set(this.describeError(error));
    } finally {
      this.saving.set(false);
    }
  }

  private buildCommentsExportPage(fileName: string): HTMLElement {
    const page = document.createElement('article');
    page.style.cssText = 'position:fixed;left:-99999px;top:0;width:816px;min-height:1056px;padding:72px;box-sizing:border-box;background:#ffffff;color:#111827;font-family:"Segoe UI",sans-serif;font-size:12px;line-height:1.45;';
    const title = document.createElement('h2');
    title.style.cssText = 'margin:0 0 14px;font-size:18px;font-weight:600;color:#115ea3;border-bottom:1px solid #d1d5db;padding-bottom:6px;';
    title.textContent = `${this.i18n.t('office.comments.title')} — ${fileName}`;
    page.appendChild(title);
    const threads = this.commentThreads();
    if (!threads.length) {
      const empty = document.createElement('p');
      empty.style.color = '#6b7280';
      empty.textContent = this.i18n.t('office.comments.empty');
      page.appendChild(empty);
      return page;
    }
    for (const thread of threads) {
      const card = document.createElement('div');
      card.style.cssText = 'margin-bottom:12px;padding:10px 12px;border:1px solid #e5e7eb;border-radius:6px;background:#f9fafb;';
      const head = document.createElement('div');
      head.style.cssText = 'font-weight:600;margin-bottom:4px;color:#1f2937;';
      const status = thread.root.resolved ? ` [${this.i18n.t('office.comments.filter.resolved')}]` : '';
      head.textContent = `${thread.root.author} · #${thread.root.paragraphIndex + 1} · ${thread.root.date.slice(0, 16).replace('T', ' ')}${status}`;
      const body = document.createElement('p');
      body.style.cssText = 'margin:0 0 4px;white-space:pre-wrap;';
      body.textContent = thread.root.text;
      card.append(head, body);
      for (const reply of thread.replies) {
        const rep = document.createElement('div');
        rep.style.cssText = 'margin:6px 0 0 14px;padding-left:8px;border-left:2px solid #0f6cbd;font-size:11.5px;color:#374151;';
        rep.textContent = `${reply.author}: ${reply.text}`;
        card.appendChild(rep);
      }
      page.appendChild(card);
    }
    return page;
  }

  private async rasterizeWordPage(element: HTMLElement): Promise<PdfRasterPage | null> {
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    if (!width || !height) return null;
    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.op-object-selected, .op-float-selected, .op-hf-editing, .op-word-find-current, .op-word-selected')
      .forEach((node) => node.classList.remove(
        'op-object-selected', 'op-float-selected', 'op-hf-editing', 'op-word-find-current', 'op-word-selected'));
    const images = await this.collectPdfImages(element, clone);
    this.inlineComputedStyles(element, clone);
    clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    const serialized = new XMLSerializer().serializeToString(clone);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`
      + `<foreignObject width="100%" height="100%">${serialized}</foreignObject></svg>`;
    const source = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    const image = new Image();
    image.src = source;
    try {
      await image.decode();
    } catch {
      return null;
    }
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    // Embedded blob images are painted separately: Chromium refuses some
    // foreignObject documents that contain data-URL <img> nodes.
    for (const item of images) {
      const bitmap = new Image();
      bitmap.src = item.dataUrl;
      try {
        await bitmap.decode();
        context.drawImage(bitmap, item.x, item.y, item.width, item.height);
      } catch {
        // A missing image must not abort the whole export.
      }
    }
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) return null;
    return {
      jpeg: new Uint8Array(await blob.arrayBuffer()),
      width: canvas.width,
      height: canvas.height,
      pageWidth: width * 0.75,
      pageHeight: height * 0.75,
      textLines: this.pdfTextLines(element, width, height),
    };
  }

  /** Invisible selectable text positioned per rendered line over the rasterized page. */
  private pdfTextLines(element: HTMLElement, width: number, height: number): Array<{ text: string; x: number; y: number; size: number }> {
    const pageRect = element.getBoundingClientRect();
    const factor = pageRect.width && element.offsetWidth ? pageRect.width / element.offsetWidth : 1;
    const lines: Array<{ text: string; x: number; y: number; size: number; top: number; right: number }> = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    let node = walker.nextNode() as Text | null;
    while (node) {
      const value = node.nodeValue ?? '';
      const parent = node.parentElement;
      const hidden = parent?.closest('[aria-hidden="true"], script, style');
      if (!hidden && value.trim()) {
        const size = Math.max(4, (parseFloat(parent ? getComputedStyle(parent).fontSize : '12') || 12) * 0.75);
        for (const match of value.matchAll(/\S+/g)) {
          const start = match.index ?? 0;
          range.setStart(node, start);
          range.setEnd(node, start + match[0].length);
          const rect = range.getBoundingClientRect();
          if (!rect.width || !rect.height) continue;
          const top = (rect.top - pageRect.top) / factor;
          const left = (rect.left - pageRect.left) / factor;
          const right = (rect.right - pageRect.left) / factor;
          const last = lines[lines.length - 1];
          // Words on the same rendered line share a top edge (within 2px).
          if (last && Math.abs(last.top - top) <= 2 && left >= last.right - 1) {
            last.text += ` ${match[0]}`;
            last.right = right;
          } else {
            lines.push({ text: match[0], x: Math.max(0, left), top, right, size, y: 0 });
          }
        }
      }
      node = walker.nextNode() as Text | null;
    }
    return lines.map(({ text, x, top, size }) => ({
      text,
      x,
      y: Math.max(0, height - top - size),
      size,
    }));
  }

  private inlineComputedStyles(source: HTMLElement, clone: HTMLElement): void {
    const properties = [
      'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index', 'float', 'clear',
      'box-sizing', 'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
      'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
      'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
      'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
      'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
      'border-collapse', 'border-spacing', 'table-layout',
      'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat',
      'color', 'opacity', 'visibility', 'overflow', 'overflow-wrap', 'word-break', 'white-space',
      'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing',
      'text-align', 'text-decoration-line', 'text-decoration-color', 'text-decoration-style', 'text-indent',
      'text-shadow', 'vertical-align', 'list-style-type', 'list-style-position',
      'transform', 'transform-origin', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
      'gap', 'row-gap', 'column-gap',
    ];
    const sources = [source, ...source.querySelectorAll<HTMLElement>('*')];
    const clones = [clone, ...clone.querySelectorAll<HTMLElement>('*')];
    const limit = Math.min(sources.length, clones.length);
    for (let index = 0; index < limit; index++) {
      const computed = getComputedStyle(sources[index]);
      let css = '';
      for (const property of properties) {
        const value = computed.getPropertyValue(property);
        if (value) css += `${property}:${value};`;
      }
      clones[index].setAttribute('style', css);
    }
  }

  private async collectPdfImages(
    source: HTMLElement, clone: HTMLElement,
  ): Promise<Array<{ dataUrl: string; x: number; y: number; width: number; height: number }>> {
    const pageRect = source.getBoundingClientRect();
    const factor = pageRect.width && source.offsetWidth ? pageRect.width / source.offsetWidth : 1;
    const sources = [...source.querySelectorAll<HTMLImageElement>('img')];
    const clones = [...clone.querySelectorAll<HTMLImageElement>('img')];
    const output: Array<{ dataUrl: string; x: number; y: number; width: number; height: number }> = [];
    await Promise.all(sources.map(async (image, index) => {
      const target = clones[index];
      const src = image.currentSrc || image.src;
      const rect = image.getBoundingClientRect();
      if (target) {
        target.setAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAAAAACw=');
        target.removeAttribute('srcset');
      }
      if (!src || !rect.width || !rect.height) return;
      try {
        let dataUrl = src;
        if (!src.startsWith('data:')) {
          const blob = await (await fetch(src)).blob();
          dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });
        }
        output.push({
          dataUrl,
          x: (rect.left - pageRect.left) / factor,
          y: (rect.top - pageRect.top) / factor,
          width: rect.width / factor,
          height: rect.height / factor,
        });
      } catch {
        // Keep the blank placeholder when the blob cannot be read.
      }
    }));
    return output;
  }

  private downloadBytes(bytes: Uint8Array, fileName: string, mime = 'application/octet-stream'): void {
    const blob = new Blob([bytes as BlobPart], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
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
      const isLegacy = doc.app === 'word' && Boolean(doc.word?.readOnlyLegacy);
      const targetName = isLegacy ? doc.fileName.replace(/\.[^.]+$/, '') + '.docx' : doc.fileName;
      this.downloadBytes(bytes, targetName);
      if (isLegacy) {
        this.flashLegacyToast('OFFICE_LEGACY_EXPORT_AS_OOXML');
      } else {
        const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
        this.buffers.set(copy);
        this.dirty.set(false);
      }
    } catch (error) {
      this.error.set(this.describeError(error));
    } finally {
      this.saving.set(false);
      this.fileMenuOpen.set(false);
    }
  }

  async convertLegacyToEditable(): Promise<void> {
    const doc = this.doc();
    const word = this.word();
    const buffer = this.buffers();
    if (!doc || !word || !buffer || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      const bytes = await saveDocx(word, buffer);
      const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const nextName = doc.fileName.replace(/\.[^.]+$/, '') + '.docx';
      const parsed = await openOfficeFile(nextName, copy);
      this.applyDocument(parsed, copy);
      this.dirty.set(true);
      this.flashLegacyToast('OFFICE_LEGACY_EXPORT_AS_OOXML');
    } catch (error) {
      this.error.set(this.describeError(error));
    } finally {
      this.saving.set(false);
    }
  }

  async saveToErp(): Promise<void> {
    const doc = this.doc();
    const bytes = await this.currentBytes();
    if (!doc || !bytes || this.erpBusy()) return;
    this.erpBusy.set(true);
    this.erpError.set(null);
    try {
      const isLegacy = doc.app === 'word' && Boolean(doc.word?.readOnlyLegacy);
      const targetName = isLegacy ? doc.fileName.replace(/\.[^.]+$/, '') + '.docx' : doc.fileName;
      let id = isLegacy ? null : this.erpDocId();
      let version = isLegacy ? 0 : this.erpVersion();
      if (!id) {
        const created = await firstValueFrom(this.storage.create({
          title: targetName.replace(/\.[^.]+$/, ''),
          original_filename: targetName,
          file_extension: extensionOf(targetName),
          doc_type: docTypeOf(targetName),
          mime_type: mimeOf(targetName),
          size_bytes: bytes.length,
        }));
        id = created.id;
        version = created.current_version;
      }
      const saved = await firstValueFrom(this.storage.saveContent(id, bytes, targetName, version));
      this.erpDocId.set(saved.id);
      this.erpVersion.set(saved.current_version);
      this.dirty.set(false);
      this.fileMenuOpen.set(false);
      if (isLegacy) this.flashLegacyToast('OFFICE_LEGACY_EXPORT_AS_OOXML');
    } catch (error) {
      this.erpError.set(this.describeError(error));
    } finally {
      this.erpBusy.set(false);
    }
  }

  async openErpById(docId: string, version?: number): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      const meta = await firstValueFrom(this.storage.get(docId));
      const targetVersion = version ?? meta.current_version;
      const buffer = await firstValueFrom(this.storage.content(meta.id, targetVersion));
      const parsed = await openOfficeFile(meta.original_filename, buffer);
      this.applyDocument(parsed, buffer);
      this.erpDocId.set(meta.id);
      this.erpVersion.set(targetVersion);
    } catch (error) {
      this.error.set(this.describeError(error));
    } finally {
      this.busy.set(false);
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

  @HostListener('document:selectionchange')
  onSelectionChange(): void {
    if (this.app() !== 'word' || this.inkOpen() || this.wordLocked()) {
      this.miniToolbar.set(null);
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      this.miniToolbar.set(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const anchor = range.commonAncestorContainer;
    const element = anchor.nodeType === Node.ELEMENT_NODE ? anchor as Element : anchor.parentElement;
    if (!element?.closest('.op-word-stage')) {
      this.miniToolbar.set(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      this.miniToolbar.set(null);
      return;
    }
    this.miniToolbar.set({
      x: Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - 360)),
      y: Math.max(8, rect.top - 42),
    });
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.op-word-stage')
      && !target.closest('.op-word-image, .op-word-textbox, .op-word-float, .op-word-float-image, .op-word-float-box')
      && (this.selectedWordInline() || this.selectedWordFloats().length)) {
      this.clearWordObjectSelection();
    }
    if (this.miniToolbar() && !target?.closest('.op-word-stage, .op-mini-toolbar')) {
      this.miniToolbar.set(null);
    }
    if (this.wordContextMenu() && !target?.closest('.op-context-menu')) {
      this.wordContextMenu.set(null);
    }
    if (this.activePopover() && !target?.closest('.op-popover, .op-rb-pop-trigger')) {
      this.activePopover.set(null);
    }
    if (this.caretMenu() && !target?.closest('.op-rb-menu, .op-rb-caret')) {
      this.caretMenu.set(null);
    }
    if (this.fileMenuOpen() && !target?.closest('.op-word-file-dropdown, .op-file-tab, .op-backstage')) {
      this.fileMenuOpen.set(false);
    }
    if (this.commandSearchOpen() && !target?.closest('.op-command-wrap')) {
      this.commandSearchOpen.set(false);
    }
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
    if (event.key === 'Escape') {
      if (this.activePopover()) { this.activePopover.set(null); return; }
      if (this.caretMenu()) { this.caretMenu.set(null); return; }
      if (this.fileMenuOpen()) { this.fileMenuOpen.set(false); return; }
      if (this.wordContextMenu()) { this.wordContextMenu.set(null); return; }
      if (this.commandSearchOpen()) { this.toggleCommandSearch(false); return; }
    }
    if (event.altKey && event.key.toLowerCase() === 'q' && this.doc()) {
      event.preventDefault();
      this.toggleCommandSearch(true);
      return;
    }
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
    if ((event.ctrlKey || event.metaKey) && !event.altKey && this.app() === 'word') {
      const k = event.key.toLowerCase();
      const active = document.activeElement as HTMLElement | null;
      const inFormField = !!active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');
      if (k === 'f' && !inFormField) {
        event.preventDefault();
        this.openNavTab('find');
        return;
      }
      if (k === 'h' && !inFormField) {
        event.preventDefault();
        this.openNavTab('replace');
        return;
      }
      if (k === 'g' && !inFormField) {
        event.preventDefault();
        this.openGoToPagePopover();
        return;
      }
    }
    if (this.app() === 'word' && (event.ctrlKey || event.metaKey) && event.altKey) {
      const k = event.key.toLowerCase();
      if (k === 'm') { event.preventDefault(); this.openCommentCompose(); return; }
      if (k === '1') { event.preventDefault(); this.setWordStyle('Heading1'); return; }
      if (k === '2') { event.preventDefault(); this.setWordStyle('Heading2'); return; }
      if (k === '3') { event.preventDefault(); this.setWordStyle('Heading3'); return; }
      if (k === 'f') { event.preventDefault(); this.insertWordNote('footnote'); return; }
      if (k === 'd') { event.preventDefault(); this.insertWordNote('endnote'); return; }
    }
    if (this.app() === 'word' && event.key === 'F7') {
      event.preventDefault();
      this.toggleSpell();
      return;
    }
    if (this.app() === 'word' && (event.ctrlKey || event.metaKey) && !event.altKey) {
      const active = document.activeElement as HTMLElement | null;
      const inFormField = !!active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');
      const editing = inFormField || Boolean(active?.isContentEditable);
      const key = event.key.toLowerCase();
      if (!inFormField) {
        if (event.shiftKey) {
          // Word: Ctrl+Shift+E tracking, +L bullets, +N Normal, +>/< font size, +M unindent, +C/+V painter/plain, +* marks.
          if (key === 'e') { event.preventDefault(); this.toggleTracking(); return; }
          if (key === 'l') { event.preventDefault(); this.toggleWordList('bullet'); return; }
          if (key === 'n') { event.preventDefault(); this.setWordStyle('Normal'); return; }
          if (event.key === '>' || key === '.') { event.preventDefault(); this.growWordFont(1); return; }
          if (event.key === '<' || key === ',') { event.preventDefault(); this.growWordFont(-1); return; }
          if (key === 'm') { event.preventDefault(); this.indentWordParagraph(-720); return; }
          if (key === 'c') { event.preventDefault(); this.copyWordFormat(); return; }
          if (key === 'v') {
            event.preventDefault();
            const idx = this.selectedParagraph();
            if (this.wordPainter() && idx !== null) this.applyWordPainter(idx);
            else void this.pasteWordText('plain');
            return;
          }
          if (event.key === '+' || event.key === '=') { event.preventDefault(); this.toggleWordVertAlign('superscript'); return; }
          if (event.key === '*' || event.key === '8') { event.preventDefault(); this.toggleShowMarks(); return; }
        }
        if (event.key === 'Enter') { event.preventDefault(); this.addPageBreak(); return; }
        if (event.key === ']') { event.preventDefault(); this.growWordFont(1, true); return; }
        if (event.key === '[') { event.preventDefault(); this.growWordFont(-1, true); return; }
        if (event.key === '=' && !event.shiftKey) { event.preventDefault(); this.toggleWordVertAlign('subscript'); return; }
        if (event.code === 'Space' || event.key === ' ') { event.preventDefault(); this.clearWordFormatting(); return; }
        if (key === 'm' && !event.shiftKey) { event.preventDefault(); this.indentWordParagraph(720); return; }
        if (key === 'p') { event.preventDefault(); this.print(); return; }
        if (key === 'k') { event.preventDefault(); this.toggleLink(); return; }
        if (key === 'e') { event.preventDefault(); this.applyWordAlignment('center'); return; }
        if (key === 'l') { event.preventDefault(); this.applyWordAlignment('left'); return; }
        if (key === 'r') { event.preventDefault(); this.applyWordAlignment('right'); return; }
        if (key === 'j') { event.preventDefault(); this.applyWordAlignment('justify'); return; }
        if (key === '1') { event.preventDefault(); this.setWordLineSpacing(1); return; }
        if (key === '2') { event.preventDefault(); this.setWordLineSpacing(2); return; }
        if (key === '5') { event.preventDefault(); this.setWordLineSpacing(1.5); return; }
        if (key === 'b' || key === 'i' || key === 'u') {
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

  /** Right-click menu matching Word's document context menu (table commands when in a table). */
  openWordContextMenu(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.op-word-page')) return;
    event.preventDefault();
    const isObject = Boolean(target.closest('.op-word-image, .op-word-textbox, .op-word-float, .op-word-float-image, .op-word-float-box'));
    if (isObject && !this.selectedWordObject()) {
      this.onWordStageClick(event);
    }
    const cell = isObject ? null : this.wordCellContext(this.wordElementAt(target));
    if (cell) {
      this.activeWordTable.set(cell.block);
      this.activeWordTableRow.set(cell.row);
      this.activeWordTableCell.set(cell.cell);
    }
    const paragraph = target.closest<HTMLElement>('[data-paragraph]');
    const index = paragraph ? Number(paragraph.getAttribute('data-paragraph')) : NaN;
    if (Number.isFinite(index)) this.selectedParagraph.set(index);
    const estH = Math.min(window.innerHeight - 24, cell ? 640 : isObject ? 300 : 620);
    const x = Math.min(Math.max(8, event.clientX), Math.max(8, window.innerWidth - 256));
    const y = Math.min(Math.max(8, event.clientY), Math.max(8, window.innerHeight - estH - 8));
    this.wordContextMenu.set({ x, y, table: Boolean(cell), object: isObject });
    if (this.miniToolbar()) {
      this.miniToolbar.set({
        x: Math.min(x, Math.max(8, window.innerWidth - 360)),
        y: Math.max(8, y - 42),
      });
    }
  }

  runWordContextCommand(id: string): void {
    this.wordContextMenu.set(null);
    this.runWordCommand(id);
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
    if (context) {
      // mousedown on a cell must activate the table immediately: a drag never
      // fires a click, so the contextual tabs would otherwise stay hidden.
      this.activeWordTable.set(context.block);
      this.activeWordTableRow.set(context.row);
      this.activeWordTableCell.set(context.cell);
      if (this.borderPen()) this.paintPenCell(context.block, context.row, context.cell);
    }
  }

  extendWordCellDrag(event: MouseEvent): void {
    const anchor = this.wordCellDragAnchor;
    if (!anchor || event.buttons !== 1) return;
    const context = this.wordCellContext(this.wordElementAt(event.target as HTMLElement | null));
    if (!context || context.block !== anchor.block) return;
    // A drag never fires a click, so register the table context here: the
    // contextual tabs must appear while the range is being selected.
    this.activeWordTable.set(context.block);
    this.activeWordTableRow.set(anchor.row);
    this.activeWordTableCell.set(anchor.cell);
    if (this.borderPen()) this.paintPenCell(context.block, context.row, context.cell);
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

  /** Enter inside a cell splits that cell's paragraph; Tab/Shift+Tab navigates cells like Word. */
  private handleWordCellKey(paragraph: HTMLElement, event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault();
      const blockIndex = Number(paragraph.getAttribute('data-cell-block'));
      const row = Number(paragraph.getAttribute('data-cell-row'));
      const cell = Number(paragraph.getAttribute('data-cell-col'));
      const block = this.word()?.blocks[blockIndex];
      if (!Number.isFinite(blockIndex) || !Number.isFinite(row) || !Number.isFinite(cell) || block?.kind !== 'table') return;
      const focusTableCell = (r: number, c: number): boolean => {
        const cellEl = this.hostRef.nativeElement.querySelector<HTMLElement>(
          `[data-cell-block="${blockIndex}"][data-cell-row="${r}"][data-cell-col="${c}"][data-cell-p="0"]`,
        ) ?? this.hostRef.nativeElement.querySelector<HTMLElement>(
          `[data-cell-block="${blockIndex}"][data-cell-row="${r}"][data-cell-col="${c}"]`,
        );
        if (!cellEl) return false;
        cellEl.closest<HTMLElement>('.op-word-page')?.focus();
        this.activeWordTable.set(blockIndex);
        this.activeWordTableRow.set(r);
        this.activeWordTableCell.set(c);
        this.placeCaret(cellEl, 0);
        return true;
      };
      if (event.shiftKey) {
        let r = row;
        let c = cell - 1;
        while (r >= 0) {
          while (c >= 0) {
            if (focusTableCell(r, c)) return;
            c -= 1;
          }
          r -= 1;
          c = r >= 0 ? (block.rows[r]?.length ?? 1) - 1 : -1;
        }
        return;
      }
      let r = row;
      let c = cell + 1;
      while (r < block.rows.length) {
        const cols = block.rows[r]?.length ?? 0;
        while (c < cols) {
          if (focusTableCell(r, c)) return;
          c += 1;
        }
        r += 1;
        c = 0;
      }
      this.activeWordTable.set(blockIndex);
      this.activeWordTableRow.set(row);
      this.activeWordTableCell.set(cell);
      this.runWordTableCommand('tableInsertRowBelow');
      setTimeout(() => { focusTableCell(row + 1, 0); }, 40);
      return;
    }
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
    // A paragraph can be rendered as one element per page, so the block text is
    // the concatenation of its fragments in document order.
    const paragraphFragments = new Map<number, string[]>();
    for (const element of article.querySelectorAll<HTMLElement>('.op-word-p[data-paragraph]')) {
      const index = Number(element.getAttribute('data-paragraph'));
      if (!Number.isFinite(index)) continue;
      const list = paragraphFragments.get(index) ?? [];
      list.push(element.innerText.replace(/\u00a0/g, ' '));
      paragraphFragments.set(index, list);
    }
    for (const [index, fragments] of paragraphFragments) {
      const block = word.blocks[index];
      if (block?.kind !== 'paragraph') continue;
      const text = fragments.join('');
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
    const block = this.word()?.blocks[index];
    const base = Number(paragraph.getAttribute('data-char-start') ?? 0) || 0;
    const domText = paragraph.innerText.replace(/\u00a0/g, ' ');
    const fragments = this.hostRef.nativeElement.querySelectorAll(`.op-word-p[data-paragraph="${index}"]`).length;
    const text = base === 0 && fragments <= 1
      ? domText
      : (block?.kind === 'paragraph' ? block.paragraph.runs.map((run) => run.text ?? '').join('') : domText);
    const offset = base + this.caretOffset(paragraph);
    if (event.key === 'Tab') {
      event.preventDefault();
      if (event.shiftKey) {
        this.indentWordParagraph(-720);
      } else if (block?.kind === 'paragraph' && (block.paragraph.listType || offset === 0)) {
        this.indentWordParagraph(720);
      } else {
        document.execCommand('insertText', false, '\t');
      }
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (block?.kind === 'paragraph' && text.trim() === '' && block.paragraph.listType) {
        this.toggleWordList(block.paragraph.listType);
        return;
      }
      this.splitWordParagraph(index, text, offset);
      return;
    }
    if (event.key === 'Backspace' && offset === 0) {
      event.preventDefault();
      if (block?.kind === 'paragraph' && block.paragraph.listType) {
        this.toggleWordList(block.paragraph.listType);
        return;
      }
      if (block?.kind === 'paragraph' && (block.paragraph.indent ?? 0) > 0) {
        this.indentWordParagraph(-720);
        return;
      }
      this.mergeWordParagraph(index, text);
      return;
    }
    if (event.key === 'Delete' && offset >= text.length) {
      const nextBlock = this.word()?.blocks[index + 1];
      if (nextBlock?.kind === 'paragraph') {
        event.preventDefault();
        if (block?.kind === 'paragraph') {
          const currentModel = block.paragraph.runs.filter((run) => !run.imagePath).map((run) => run.text).join('');
          if (text !== currentModel) {
            const firstRun = block.paragraph.runs.find((run) => !run.imagePath) ?? { text: '' };
            const images = block.paragraph.runs.filter((run) => run.imagePath);
            block.paragraph.runs = [{ ...firstRun, text }, ...images];
            if (block.paragraph.xmlNode) this.patchParagraphText(block.paragraph.xmlNode, text);
          }
        }
        const nextText = nextBlock.paragraph.runs.map((run) => run.text ?? '').join('');
        this.mergeWordParagraph(index + 1, nextText);
        return;
      }
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
    const isHeadingEnd = after === '' && /^Heading[1-6]$/i.test(block.paragraph.style ?? '');
    this.wordStructureEdit = true;
    this.pushWordHistory();
    const firstRun = block.paragraph.runs.find((run) => !run.imagePath) ?? { text: '' };
    block.paragraph.runs = [{ ...firstRun, text: before }];
    const node = block.paragraph.xmlNode;
    const parent = node && word.xmlRoot ? this.findXmlParent(word.xmlRoot, node) : null;
    let clone: XmlNode | undefined;
    if (node) {
      this.patchParagraphText(node, before);
      clone = this.cloneXmlNode(node);
      this.patchParagraphText(clone, after);
      if (isHeadingEnd) {
        const clonePPr = clone.children.find((child) => child.name === 'w:pPr');
        if (clonePPr) clonePPr.children = clonePPr.children.filter((child) => child.name !== 'w:pStyle');
      }
      if (parent) {
        const position = parent.children.indexOf(node);
        parent.children.splice(position >= 0 ? position + 1 : parent.children.length, 0, clone);
      }
    }
    const paragraph: WordParagraph = {
      ...block.paragraph,
      style: isHeadingEnd ? undefined : block.paragraph.style,
      headingLevel: isHeadingEnd ? undefined : block.paragraph.headingLevel,
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

  updateHeaderText(value: string, sectionIndex = 0): void {
    this.headerText.set(value);
    const ref = this.ensureHeaderFooter('header', sectionIndex);
    if (!ref) return;
    setHeaderFooterText(ref, value);
    this.wordRenderKey.update((tick) => tick + 1);
    this.dirty.set(true);
  }

  /** Double-clicking the page header/footer edits that section in place, like Word 365. */
  beginHeaderFooterEdit(kind: 'header' | 'footer', sectionIndex = 0, pageIndex = 0): void {
    if (!this.doc() || this.wordLocked()) return;
    this.headerFooterEditSection.set(sectionIndex);
    this.loadHeaderFooter(sectionIndex);
    this.headerFooterEdit.set(kind);
    setTimeout(() => {
      const page = this.hostRef.nativeElement.querySelector<HTMLElement>(`.op-word-page[data-page="${pageIndex}"]`);
      const element = page?.querySelector<HTMLElement>(`.op-word-${kind}-edit`)
        ?? this.hostRef.nativeElement.querySelector<HTMLElement>(`.op-word-${kind}-edit`);
      if (!element) return;
      element.focus();
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }, 0);
  }

  commitHeaderFooterEdit(kind: 'header' | 'footer', event: Event): void {
    this.commitHeaderFooterText(kind, event.target as HTMLElement | null);
  }

  private commitHeaderFooterText(kind: 'header' | 'footer', element: HTMLElement | null): void {
    if (this.headerFooterEdit() !== kind) return;
    const text = (element?.innerText ?? '')
      .replace(/\u00a0/g, ' ').replace(/\r?\n/g, ' ').trim();
    const sectionIndex = this.headerFooterEditSection();
    this.pushWordHistory();
    if (kind === 'header') this.updateHeaderText(text, sectionIndex);
    else this.updateFooterText(text, sectionIndex);
    this.headerFooterEdit.set(null);
  }

  onHeaderFooterKeydown(event: KeyboardEvent, kind: 'header' | 'footer'): void {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      this.headerFooterEdit.set(null);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitHeaderFooterText(kind, event.target as HTMLElement | null);
    }
  }

  finishHeaderFooterEdit(): void {
    const kind = this.headerFooterEdit();
    const element = this.hostRef.nativeElement.querySelector<HTMLElement>('.op-word-header-edit, .op-word-footer-edit');
    if (kind && element) this.commitHeaderFooterText(kind, element);
    else this.headerFooterEdit.set(null);
  }

  updateFooterText(value: string, sectionIndex = 0): void {
    this.footerText.set(value);
    const ref = this.ensureHeaderFooter('footer', sectionIndex);
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
    const block = this.word()?.blocks[paragraphIndex];
    const inlineKeys = new Set<string>();
    if (block?.kind === 'paragraph') {
      for (const run of block.paragraph.runs) {
        if (run.noteRef) inlineKeys.add(`${run.noteRef.kind}:${run.noteRef.id}`);
      }
    }
    return [...(this.wordNotes()?.footnotes ?? []), ...(this.wordNotes()?.endnotes ?? [])]
      .filter((note) => note.refParagraph === paragraphIndex && !inlineKeys.has(`${note.kind}:${note.id}`));
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

  applyParagraphBorders(mode: ParagraphBorderMode): void {
    const word = this.word();
    const index = this.selectedParagraph();
    if (!word || index === null) return;
    this.pushWordHistory();
    if (!setParagraphBorders(word, index, mode)) return;
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
    this.selectedWordInline.set(null);
    if (run.float) {
      this.floatX.set(run.float.x);
      this.floatY.set(run.float.y);
    }
  }

  /** Selects an inline picture or shape so the contextual Picture/Shape tab can open. */
  selectWordObject(event: Event, run: WordRun): void {
    event.stopPropagation();
    this.selectedWordInline.set(run);
    this.selectedWordFloats.set([]);
  }

  /** Markup view renders pictures through innerHTML, so resolve the click back to its run. */
  onWordStageClick(event: MouseEvent): void {
    const image = (event.target as HTMLElement | null)?.closest<HTMLImageElement>('img.op-word-image');
    if (!image) return;
    const src = image.getAttribute('src');
    const word = this.word();
    if (!src || !word) return;
    for (const block of word.blocks) {
      if (block.kind !== 'paragraph') continue;
      const run = block.paragraph.runs.find((item) => item.imagePath && this.wordImageUrl(item.imagePath) === src);
      if (run) {
        this.selectedWordInline.set(run);
        this.selectedWordFloats.set([]);
        return;
      }
    }
  }

  clearWordObjectSelection(): void {
    const had = Boolean(this.selectedWordInline()) || this.selectedWordFloats().length > 0;
    this.selectedWordInline.set(null);
    this.selectedWordFloats.set([]);
    if (had && (this.activeTab() === 'picture' || this.activeTab() === 'shape')) this.setTab('home');
  }

  openAltText(): void {
    const run = this.selectedWordObject();
    if (!run) return;
    this.altTextDraft.set(run.alt ?? '');
    this.altTextOpen.set(true);
    this.objectSizeOpen.set(false);
    this.shapeFillOpen.set(false);
    this.shapeOutlineOpen.set(false);
  }

  applyAltText(): void {
    const run = this.selectedWordObject();
    if (!run) return;
    this.pushWordHistory();
    setRunAlt(run, this.altTextDraft());
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
    this.altTextOpen.set(false);
  }

  openObjectSize(): void {
    const run = this.selectedWordObject();
    if (!run) return;
    this.objectWidthDraft.set(Math.round(run.textBox?.width ?? run.imageWidth ?? 0));
    this.objectHeightDraft.set(Math.round(run.textBox?.height ?? run.imageHeight ?? 0));
    this.objectSizeOpen.set(true);
    this.altTextOpen.set(false);
    this.shapeFillOpen.set(false);
    this.shapeOutlineOpen.set(false);
  }

  applyObjectSize(): void {
    const run = this.selectedWordObject();
    if (!run) return;
    this.pushWordHistory();
    resizeRunObject(run, this.objectWidthDraft(), this.objectHeightDraft());
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
    this.objectSizeOpen.set(false);
  }

  async resetWordObjectSize(): Promise<void> {
    const run = this.selectedWordObject();
    if (!run) return;
    if (run.textBox) {
      this.objectWidthDraft.set(220);
      this.objectHeightDraft.set(120);
      this.applyObjectSize();
      return;
    }
    const url = run.imagePath ? this.wordImageUrl(run.imagePath) : null;
    if (!url) return;
    const natural = await new Promise<{ width: number; height: number } | null>((resolve) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => resolve(null);
      image.src = url;
    });
    if (!natural || !natural.width || !natural.height) return;
    const scale = Math.min(1, 624 / natural.width);
    this.objectWidthDraft.set(Math.max(8, Math.round(natural.width * scale)));
    this.objectHeightDraft.set(Math.max(8, Math.round(natural.height * scale)));
    this.applyObjectSize();
  }

  deleteWordObject(): void {
    const word = this.word();
    const run = this.selectedWordObject();
    if (!word || !run) return;
    this.pushWordHistory();
    if (!this.removeWordRunFromBlock(run)) return;
    this.clearWordObjectSelection();
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  private removeWordRunFromBlock(run: WordRun): boolean {
    const word = this.word();
    if (!word) return false;
    const removeFromParagraphs = (paragraphs: WordParagraph[]): boolean => {
      for (const paragraph of paragraphs) {
        const index = paragraph.runs.indexOf(run);
        if (index >= 0) { paragraph.runs.splice(index, 1); return true; }
      }
      return false;
    };
    const removeFromRows = (rows: WordParagraph[][][]): boolean => {
      for (const row of rows) for (const cell of row) if (removeFromParagraphs(cell)) return true;
      return false;
    };
    const removeFromNested = (tables: WordNestedTable[] | undefined): boolean => {
      for (const table of tables ?? []) {
        if (removeFromRows(table.rows)) return true;
        if (removeFromNested(table.nested)) return true;
      }
      return false;
    };
    for (const block of word.blocks) {
      if (block.kind === 'paragraph') {
        if (removeFromParagraphs([block.paragraph])) return true;
      } else if (removeFromRows(block.rows) || removeFromNested(block.nested)) {
        return true;
      }
    }
    return false;
  }

  openShapeFill(): void {
    const run = this.selectedWordObject();
    if (!run?.textBox) return;
    this.shapeFillDraft.set(run.textBox.fill ?? '#EAF1FB');
    this.shapeFillOpen.set(true);
    this.shapeOutlineOpen.set(false);
    this.altTextOpen.set(false);
    this.objectSizeOpen.set(false);
  }

  applyShapeFill(color: string): void {
    const run = this.selectedWordObject();
    if (!run?.textBox) return;
    this.pushWordHistory();
    setShapeColor(run, 'fill', color);
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  openShapeOutline(): void {
    const run = this.selectedWordObject();
    if (!run?.textBox) return;
    this.shapeOutlineDraft.set(run.textBox.outline ?? '#8EAADB');
    this.shapeOutlineOpen.set(true);
    this.shapeFillOpen.set(false);
    this.altTextOpen.set(false);
    this.objectSizeOpen.set(false);
  }

  applyShapeOutline(color: string): void {
    const run = this.selectedWordObject();
    if (!run?.textBox) return;
    this.pushWordHistory();
    setShapeColor(run, 'outline', color);
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  private applyToFloats(mutate: (run: WordRun) => void): void {
    if (!this.ensureSelectedFloat()) return;
    const selected = this.selectedWordFloats();
    for (const run of selected) mutate(run);
    this.wordRenderKey.update((value) => value + 1);
    this.dirty.set(true);
  }

  /** Inline pictures become floating anchors the first time Wrap/Position is used, like Word. */
  private ensureSelectedFloat(): boolean {
    if (this.selectedWordFloats().length) return true;
    const inline = this.selectedWordInline();
    if (!inline || !ensureFloating(inline)) return false;
    this.selectedWordFloats.set([inline]);
    this.selectedWordInline.set(null);
    return true;
  }

  applyFloatPosition(x: number, y: number): void {
    if (!this.ensureSelectedFloat()) return;
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
    if (!word || !this.ensureSelectedFloat()) return;
    const z = Math.max(...runFloats(word).map((item) => item.run.float?.z ?? 0)) + 1;
    this.applyToFloats((run) => { setFloatZ(run, z); });
  }

  sendFloatBackward(): void {
    const word = this.word();
    if (!word || !this.ensureSelectedFloat()) return;
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
    const block = this.word()?.blocks[paragraphIndex];
    if (block?.kind === 'paragraph' && block.paragraph.runs.some((run) => run.equation)) {
      return [];
    }
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
    if (!this.acceptsInkPointer(event)) return;
    const point = this.inkPoint(event);
    if (!point) return;
    this.inkPage.set(page);
    this.selectedInkIds.set([]);
    if (this.inkTool() === 'eraser') {
      this.eraseInkAt(point, page, event);
      return;
    }
    if (this.inkTool() === 'lasso') {
      this.inkLassoStart = point;
      return;
    }
    this.inkPoints = [point];
    this.inkPreview.set({
      id: 'preview', color: this.inkColor(), width: this.inkWidth(), style: this.inkStyle(),
      lineStyle: this.inkLineStyle(), points: [point], page,
    });
    try { (event.currentTarget as Element).setPointerCapture?.(event.pointerId); } catch { /* synthetic pointer */ }
  }

  onInkPointerMove(event: PointerEvent): void {
    if (!this.inkPoints.length) return;
    const point = this.inkPoint(event);
    if (!point) return;
    this.inkPoints = [...this.inkPoints, point];
    this.inkPreview.set({
      id: 'preview', color: this.inkColor(), width: this.inkWidth(), style: this.inkStyle(),
      lineStyle: this.inkLineStyle(), points: this.inkPoints, page: this.inkPage(),
    });
  }

  onInkPointerUp(event: PointerEvent): void {
    const start = this.inkLassoStart;
    if (start) {
      this.inkLassoStart = null;
      const end = this.inkPoint(event);
      if (end) this.selectInkLasso(start, end);
      return;
    }
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
      style: this.inkStyle(),
      lineStyle: this.inkLineStyle(),
      points,
      paragraphIndex: this.selectedParagraph() ?? 0,
      page: this.inkPage(),
    });
    word.inkStrokes = strokes;
    this.inkStrokes.set([...strokes]);
    this.dirty.set(true);
  }

  private acceptsInkPointer(event: PointerEvent): boolean {
    const mode = this.inkInputMode();
    const pointer = event.pointerType || 'mouse';
    if (mode === 'touch' && pointer !== 'touch') return false;
    if (mode === 'mouse' && pointer === 'touch') return false;
    return true;
  }

  private eraseInkAt(point: InkPoint, page: number, event: PointerEvent): void {
    const word = this.word();
    if (!word) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const radius = this.inkEraserSize();
    const strokes = this.inkStrokes();
    const hit = strokes.find((stroke) => (stroke.page ?? 0) === page && stroke.points.some((candidate, index) => {
      if (index === 0) return Math.hypot((candidate.x - point.x) * rect.width, (candidate.y - point.y) * rect.height) <= radius;
      const previous = stroke.points[index - 1];
      const ax = previous.x * rect.width;
      const ay = previous.y * rect.height;
      const bx = candidate.x * rect.width;
      const by = candidate.y * rect.height;
      const px = point.x * rect.width;
      const py = point.y * rect.height;
      const dx = bx - ax;
      const dy = by - ay;
      const length = dx * dx + dy * dy;
      const t = length ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length)) : 0;
      return Math.hypot(px - (ax + t * dx), py - (ay + t * dy)) <= radius;
    }));
    if (!hit) return;
    removeInkStroke(word, strokes, hit.id);
    word.inkStrokes = strokes;
    this.inkStrokes.set([...strokes]);
    this.selectedInkIds.update((ids) => ids.filter((id) => id !== hit.id));
    this.dirty.set(true);
  }

  private selectInkLasso(start: InkPoint, end: InkPoint): void {
    const left = Math.min(start.x, end.x);
    const right = Math.max(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const bottom = Math.max(start.y, end.y);
    const page = this.inkPage();
    const ids = this.inkStrokes()
      .filter((stroke) => (stroke.page ?? 0) === page)
      .filter((stroke) => stroke.points.some((point) => point.x >= left && point.x <= right && point.y >= top && point.y <= bottom))
      .map((stroke) => stroke.id);
    this.selectedInkIds.set(ids);
  }

  setInkTool(tool: 'pen' | 'eraser' | 'lasso'): void {
    this.inkTool.set(tool);
    this.inkHidden.set(false);
    this.inkOpen.set(true);
  }

  deleteSelectedInk(): void {
    const word = this.word();
    const ids = this.selectedInkIds();
    if (!word || !ids.length) return;
    const strokes = this.inkStrokes();
    for (const id of ids) removeInkStroke(word, strokes, id);
    word.inkStrokes = strokes;
    this.inkStrokes.set([...strokes]);
    this.selectedInkIds.set([]);
    this.dirty.set(true);
  }

  setInkInputMode(mode: 'any' | 'touch' | 'mouse'): void {
    this.inkInputMode.set(this.inkInputMode() === mode ? 'any' : mode);
  }

  savePenFavorite(): void {
    const favorite = {
      color: this.inkColor(), width: this.inkWidth(), style: this.inkStyle(), lineStyle: this.inkLineStyle(),
    };
    this.inkFavorite.set(favorite);
    try { localStorage.setItem('office.word.ink.favorite', JSON.stringify(favorite)); } catch { /* storage blocked */ }
  }

  applyPenFavorite(): void {
    const favorite = this.inkFavorite();
    if (!favorite) return;
    this.inkColor.set(favorite.color);
    this.inkWidth.set(favorite.width);
    this.inkStyle.set(favorite.style);
    this.inkLineStyle.set(favorite.lineStyle);
    this.setInkTool('pen');
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

  setInkStyle(style: 'pen' | 'highlighter'): void {
    if (this.inkStyle() !== style) {
      this.inkStyle.set(style);
      if (style === 'highlighter') {
        this.inkColor.set('#fde047');
        this.inkWidth.set(12);
      } else {
        this.inkColor.set('#dc2626');
        this.inkWidth.set(2);
      }
    }
    this.inkOpen.set(true);
    this.inkHidden.set(false);
  }

  toggleInkHidden(): void {
    const hidden = !this.inkHidden();
    this.inkHidden.set(hidden);
    if (hidden) this.inkOpen.set(false);
  }

  startInkReview(): void {
    this.setTab('draw');
    this.setInkStyle('pen');
  }

  clearInkStrokes(): void {
    const word = this.word();
    const strokes = this.inkStrokes();
    if (!word) return;
    this.pushWordHistory();
    clearInk(word, strokes);
    word.inkStrokes = strokes;
    this.inkStrokes.set([]);
    this.inkHidden.set(false);
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
    const preset = this.pageMargin() === 'narrow' ? 720 : this.pageMargin() === 'wide' ? 2880 : 1440;
    const twips = (cm: number): number => Math.round(cm * 566.929);
    const margins = this.pageMargin() === 'custom'
      ? { top: twips(this.marginTop()), right: twips(this.marginRight()), bottom: twips(this.marginBottom()), left: twips(this.marginLeft()) }
      : { top: preset, right: preset, bottom: preset, left: preset };
    setPageSetup(section, {
      pageWidth: landscape ? size.height : size.width,
      pageHeight: landscape ? size.width : size.height,
      orientation: this.pageOrientation(),
      margins,
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
    const next = !this.wordChromeDark();
    this.wordChromeDark.set(next);
    this.wordDark.set(next);
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
    if (this.navPaneOpen() && this.navTab() === 'find') {
      this.navPaneOpen.set(false);
      this.findOpen.set(false);
      return;
    }
    this.openNavTab('find');
  }

  openNavTab(tab: 'headings' | 'find' | 'replace'): void {
    this.navPaneOpen.set(true);
    this.navTab.set(tab);
    this.findOpen.set(false);
    this.insertTableOpen.set(false);
    this.formatOpen.set(false);
    this.layoutOpen.set(false);
    this.accessOpen.set(false);
    this.headerFooterOpen.set(false);
    this.notesPanelOpen.set(false);
    this.citationsOpen.set(false);
    this.tocOpen.set(false);
    if (tab === 'find' || tab === 'replace') {
      setTimeout(() => {
        const input = this.hostRef.nativeElement.querySelector<HTMLInputElement>('.op-nav-search-input');
        input?.focus();
        input?.select();
      }, 0);
    }
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
    if (this.navPaneOpen() && this.findQuery() && this.navTab() === 'headings') this.navTab.set('find');
    this.findOpen.set(false);
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

  jumpToWordPage(page: number): void {
    const element = this.hostRef.nativeElement.querySelectorAll<HTMLElement>('.op-word-page')[Math.max(0, page - 1)];
    element?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  jumpToFindMatch(index: number): void {
    const match = this.wordFindMatches()[index];
    if (!match) return;
    this.findIndex.set(index);
    this.jumpToParagraph(match.blockIndex);
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
    const afterIndex = this.selectedParagraph() ?? undefined;
    const insertedAt = insertPageBreak(word, afterIndex);
    this.afterWordStructureChange();
    if (insertedAt >= 0 && insertedAt + 1 < word.blocks.length && word.blocks[insertedAt + 1]?.kind === 'paragraph') {
      this.selectedParagraph.set(insertedAt + 1);
    }
  }

  hasWordPageBreak(block: WordBlock): boolean {
    return block.kind === 'paragraph' && paragraphHasPageBreak(block.paragraph);
  }

  wordIndentPx(indent: number | undefined): number {
    return Math.round((indent ?? 0) / 15);
  }

  wordTextIndentPx(paragraph: WordParagraph): number | null {
    if (paragraph.firstLineIndent) return Math.round(paragraph.firstLineIndent / 15);
    if (paragraph.hangingIndent) return -Math.round(paragraph.hangingIndent / 15);
    return null;
  }

  wordParagraphBorderStyle(paragraph: WordParagraph): Record<string, string> | null {
    const sides = paragraph.borderSides;
    if (!sides) return null;
    const style: Record<string, string> = {};
    if (sides.top) style['border-top'] = sides.top;
    if (sides.bottom) style['border-bottom'] = sides.bottom;
    if (sides.left) style['border-left'] = sides.left;
    if (sides.right) style['border-right'] = sides.right;
    if (Object.keys(style).length) style['padding'] = '2px 4px';
    return Object.keys(style).length ? style : null;
  }

  wordParagraphFontPx(paragraph: WordParagraph): number | null {
    return paragraph.fontSizePt ? Math.round((paragraph.fontSizePt * 96) / 72 * 100) / 100 : null;
  }

  wordParagraphTextLength(paragraph: WordParagraph): number {
    return paragraph.runs.reduce((sum, run) => sum + (run.text ?? '').length, 0);
  }

  /** TOC entries carry a tab stop with a dot leader before the page number. */
  isTocParagraph(paragraph: WordParagraph): boolean {
    return /^TOC\d$/i.test(paragraph.style ?? '')
      && paragraph.runs.some((run) => (run.text ?? '').includes('\t'));
  }

  tocRuns(paragraph: WordParagraph, side: 'before' | 'after'): WordRun[] {
    const before: WordRun[] = [];
    const after: WordRun[] = [];
    let seenTab = false;
    for (const run of paragraph.runs) {
      const text = run.text ?? '';
      const tab = text.indexOf('\t');
      if (seenTab) {
        after.push(run);
        continue;
      }
      if (tab < 0) {
        before.push(run);
        continue;
      }
      if (tab > 0) before.push({ ...run, text: text.slice(0, tab) });
      const rest = text.slice(tab + 1);
      if (rest) after.push({ ...run, text: rest });
      seenTab = true;
    }
    return side === 'before' ? before : after;
  }

  /** Runs of a paragraph fragment when Word's page break falls inside it. */
  paragraphFragmentRuns(paragraph: WordParagraph, start: number, end: number): WordRun[] {
    return sliceParagraph(paragraph, start, end).runs;
  }

  private normalLineFactors = new Map<string, number>();
  /**
   * Word multiplies the font's hhea line box (ascender + descender + line gap)
   * for w:lineRule="auto". Browsers use slightly different metrics for
   * `line-height: normal`, so the Word defaults carry their hhea ratio.
   */
  private static readonly WORD_LINE_FACTORS: Array<[RegExp, number]> = [
    [/^(times new roman|arial)$/i, 1.1499], // 1825 + 443 + 87 / 2048
    [/^calibri$/i, 1.2207], // 1950 + 550 + 0 / 2048
    [/^segoe ui$/i, 1.3291], // 2210 + 514 + 0 / 2048
  ];
  /**
   * Word's w:lineRule="auto" multiplies the font's single line box (ascent +
   * descent + line gap), which is what CSS `line-height: normal` uses, not the
   * font size. Measure that box once per font family so an auto-spaced paragraph
   * is as tall as Word's.
   */
  private normalLineFactor(fontFamily: string | null | undefined): number {
    const key = fontFamily ?? '';
    const cached = this.normalLineFactors.get(key);
    if (cached) return cached;
    const primary = (key.split(',')[0] ?? '').trim().replace(/^["']|["']$/g, '');
    const known = OfficeWebappComponent.WORD_LINE_FACTORS.find(([pattern]) => pattern.test(primary));
    const probe = document.createElement('span');
    probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-size:100px;line-height:normal;font-family:${key || 'inherit'}`;
    probe.textContent = 'Hg';
    document.body.appendChild(probe);
    const factor = known?.[1] ?? (probe.getBoundingClientRect().height / 100 || 1.15);
    probe.remove();
    this.normalLineFactors.set(key, factor);
    return factor;
  }

  wordLineHeight(paragraph: WordParagraph): string | number | null {
    if (paragraph.lineHeightPx) return `${paragraph.lineHeightPx}px`;
    if (!paragraph.lineSpacing) return null;
    const fontPx = this.wordParagraphFontPx(paragraph) ?? 16;
    const factor = this.normalLineFactor(paragraph.fontFamily ?? this.word()?.theme?.font);
    return `${Math.round(fontPx * factor * paragraph.lineSpacing * 100) / 100}px`;
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
        if (flag === undefined) {
          // A painted cell owns all four edges: the table's ring must not show through.
          if (cell.borderPainter) style[`border-${edge}-style`] = 'none';
          continue;
        }
        style[`border-${edge}-style`] = flag ? 'solid' : 'none';
        if (flag) style[`border-${edge}-width`] = `${cell.borderWidthPx}px`;
        if (flag && cell.borderColor) style[`border-${edge}-color`] = cell.borderColor;
      }
      if (cell.borderPainter) style['box-shadow'] = 'none';
    }
    const diagonal = [
      cell.diagDown ? 'linear-gradient(to bottom right, transparent calc(50% - 0.5px), #000 calc(50% - 0.5px), #000 calc(50% + 0.5px), transparent calc(50% + 0.5px))' : '',
      cell.diagUp ? 'linear-gradient(to top right, transparent calc(50% - 0.5px), #000 calc(50% - 0.5px), #000 calc(50% + 0.5px), transparent calc(50% + 0.5px))' : '',
    ].filter(Boolean);
    if (diagonal.length) {
      style['background-image'] = diagonal.join(', ');
      style['background-repeat'] = 'no-repeat';
      style['background-size'] = '100% 100%';
    }
    // Word's text box is cellWidth - left/right cell margin. A collapsed border
    // takes half its width out of each side of the box (the visible border often
    // comes from the neighbouring cell), so shrink the padding by that half: the
    // cell then wraps at Word's 98 px instead of 97 px.
    const borderHalf = (cell.borderWidthPx ?? 0) / 2;
    if (cell.padLeftPx !== undefined) {
      style['padding-left'] = `${Math.max(0, cell.padLeftPx - borderHalf)}px`;
    }
    if (cell.padRightPx !== undefined) {
      style['padding-right'] = `${Math.max(0, cell.padRightPx - borderHalf)}px`;
    }
    if (cell.padTopPx !== undefined) style['padding-top'] = `${cell.padTopPx}px`;
    if (cell.padBottomPx !== undefined) style['padding-bottom'] = `${cell.padBottomPx}px`;
    return Object.keys(style).length ? style : null;
  }

  wordTableCellStyle(
    cell: WordCellStyle | undefined,
    tableBorders: WordTableBorders | undefined,
    rowIndex: number,
    colIndex: number,
    rowCount: number,
    colCount: number,
    borderless?: boolean,
  ): Record<string, string> | null {
    const base = this.wordCellStyle(cell);
    if (borderless || cell?.borderPainter || cell?.borderWidthPx || !tableBorders) return base;
    const values = Object.values(tableBorders).filter(Boolean);
    if (!values.length || values.every((v) => v === '1px solid #000000')) return base;
    const edgeCss = (spec: string | undefined, side: 'top' | 'bottom' | 'left' | 'right'): string | null => {
      if (spec === 'none') return null;
      const raw = spec ?? '1px solid #000000';
      const match = /^(\d+)px\s+\S+\s+(.+)$/.exec(raw.trim());
      const px = match ? Number(match[1]) : 1;
      const color = match ? match[2] : '#000000';
      if (side === 'top') return `inset 0 ${px}px 0 0 ${color}`;
      if (side === 'bottom') return `inset 0 -${px}px 0 0 ${color}`;
      if (side === 'left') return `inset ${px}px 0 0 0 ${color}`;
      return `inset -${px}px 0 0 0 ${color}`;
    };
    const topSpec = rowIndex === 0 ? (tableBorders.top ?? tableBorders.insideH) : tableBorders.insideH;
    const bottomSpec = rowIndex === rowCount - 1 ? (tableBorders.bottom ?? tableBorders.insideH) : tableBorders.insideH;
    const leftSpec = colIndex === 0 ? (tableBorders.left ?? tableBorders.insideV) : tableBorders.insideV;
    const rightSpec = colIndex === colCount - 1 ? (tableBorders.right ?? tableBorders.insideV) : tableBorders.insideV;
    const shadows = [
      edgeCss(topSpec, 'top'),
      edgeCss(bottomSpec, 'bottom'),
      edgeCss(leftSpec, 'left'),
      edgeCss(rightSpec, 'right'),
    ].filter((s): s is string => Boolean(s));
    const style = { ...(base ?? {}) };
    style['box-shadow'] = shadows.length ? shadows.join(', ') : 'none';
    return style;
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

  growWordFont(delta: number, exactPt = false): void {
    const current = this.currentWordFontSize();
    if (exactPt) {
      this.setWordFontSize(Math.max(8, Math.min(72, current + delta)));
      return;
    }
    const ladder = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
    const next = delta > 0
      ? ladder.find((sz) => sz > current) ?? 72
      : [...ladder].reverse().find((sz) => sz < current) ?? 8;
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

  /** Word's superscript/subscript buttons are toggles on the selected runs. */
  toggleWordVertAlign(kind: 'superscript' | 'subscript'): void {
    const active = this.selectedWordRun()?.vertAlign === kind;
    this.applyWordRunFormat({ vertAlign: active ? '' : kind });
  }

  /** Table Design gallery: header row or banded rows, applied as cell shading. */
  readonly tableStylePreset = signal<WordTableStylePreset>('none');

  applyWordTableStyle(preset: WordTableStylePreset): void {
    const word = this.word();
    const blockIndex = this.activeWordTable();
    if (!word || blockIndex === null) return;
    this.pushWordHistory();
    const theme = { accent: word.theme?.accent, accents: word.theme?.accents, font: word.theme?.font };
    if (!applyTableStyle(word, blockIndex, preset, theme)) return;
    this.tableStylePreset.set(preset);
    this.afterWordFormatChange();
  }

  /** Selected cells (drag range) or the cell under the caret. */
  private activeCellRange(): { row: number; cell: number; row2: number; cell2: number } {
    const selection = this.wordCellSelection();
    if (selection && selection.block === this.activeWordTable()) {
      return { row: selection.row, cell: selection.cell, row2: selection.row2, cell2: selection.cell2 };
    }
    const row = this.activeWordTableRow();
    const cell = this.activeWordTableCell();
    return { row, cell, row2: row, cell2: cell };
  }

  /** Border painter across the selected cell range (Word's Table Design pen). */
  readonly borderPen = signal<{ edge: 'top' | 'left' | 'bottom' | 'right' | 'tl2br' | 'tr2bl'; line: 'thin' | 'medium' | 'thick' | 'double' | 'none' } | null>(null);
  private penLastCell = '';

  /** Clicking an edge turns the pen on for that edge (drag paints cell by cell). */
  toggleTableCellBorder(edge: 'top' | 'left' | 'bottom' | 'right' | 'tl2br' | 'tr2bl'): void {
    const current = this.borderPen();
    if (current?.edge === edge) {
      this.borderPen.set(null);
      return;
    }
    this.borderPen.set({ edge, line: current?.line ?? 'thin' });
    this.penLastCell = '';
    const word = this.word();
    const blockIndex = this.activeWordTable();
    if (!word || blockIndex === null) return;
    this.paintPenCell(blockIndex, this.activeWordTableRow(), this.activeWordTableCell());
  }

  setBorderPenLine(line: 'thin' | 'medium' | 'thick' | 'double' | 'none'): void {
    const current = this.borderPen();
    if (current) this.borderPen.set({ ...current, line });
  }

  /** Paints the pen's edge on one cell (called on mousedown and while dragging). */
  paintPenCell(blockIndex: number, row: number, cell: number): void {
    const pen = this.borderPen();
    const word = this.word();
    if (!pen || !word) return;
    const key = `${blockIndex}:${row}:${cell}:${pen.edge}:${pen.line}`;
    if (key === this.penLastCell) return;
    this.penLastCell = key;
    this.pushWordHistory();
    const on = pen.line !== 'none';
    const size = pen.line === 'thick' ? 24 : pen.line === 'medium' ? 12 : pen.line === 'double' ? 6 : 4;
    const widthPx = pen.line === 'thick' ? 3 : pen.line === 'medium' ? 2 : 1;
    applyTableCellBorder(word, blockIndex, { row, cell, row2: row, cell2: cell }, pen.edge, on, size, widthPx,
      pen.line === 'double' ? 'double' : 'single');
    this.afterWordFormatChange();
  }

  clearTableCellBorders(): void {
    const word = this.word();
    const blockIndex = this.activeWordTable();
    if (!word || blockIndex === null) return;
    const range = this.activeCellRange();
    this.pushWordHistory();
    for (const edge of ['top', 'left', 'bottom', 'right'] as const) {
      applyTableCellBorder(word, blockIndex, range, edge, false);
    }
    this.afterWordFormatChange();
  }

  /** Word remembers the last Change Case choice and reuses it on the main button. */
  readonly lastCaseMode = signal<'upper' | 'lower' | 'sentence' | 'capitalize'>('sentence');

  /** Word's Change Case rewrites the characters (not a display-only transform). */
  changeWordCase(mode: 'upper' | 'lower' | 'sentence' | 'capitalize'): void {
    const word = this.word();
    const index = this.selectedParagraph();
    if (!word || index === null) return;
    const block = word.blocks[index];
    if (block?.kind !== 'paragraph') return;
    const range = this.wordRangeFor(index);
    const source = paragraphPlainText(block.paragraph).slice(range.start, range.end);
    if (!source) return;
    const next = this.applyCase(source, mode);
    if (next === source) return;
    this.lastCaseMode.set(mode);
    this.pushWordHistory();
    replaceParagraphRange(word, index, range.start, range.end, next);
    this.wordSelection.set(null);
    this.afterWordFormatChange();
  }

  private applyCase(text: string, mode: 'upper' | 'lower' | 'sentence' | 'capitalize'): string {
    if (mode === 'upper') return text.toLocaleUpperCase('vi');
    if (mode === 'lower') return text.toLocaleLowerCase('vi');
    const lower = text.toLocaleLowerCase('vi');
    if (mode === 'capitalize') return lower.replace(/(^|\s)(\p{L})/gu, (_match, space: string, letter: string) => space + letter.toLocaleUpperCase('vi'));
    // Sentence case: capitalise after a full stop, lower the rest.
    return lower.replace(/(^\s*[a-zà-ỹ])|([.!?]\s+[a-zà-ỹ])/gu,
      (match) => match.toLocaleUpperCase('vi'));
  }

  async copyWordText(): Promise<void> {
    const text = this.selectedWordText();
    if (!text) return;
    const html = this.selectionHtml();
    // The pane is the app's own clipboard history: it keeps the entry even when
    // the browser refuses the OS clipboard write.
    this.pushClipboardHistory(text, html);
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        await navigator.clipboard.write([new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' }),
        })]);
      } else {
        await navigator.clipboard.writeText(text);
      }
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
    const html = this.selectionHtml();
    this.pushClipboardHistory(text, html);
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        await navigator.clipboard.write([new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' }),
        })]);
      } else {
        await navigator.clipboard.writeText(text);
      }
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

  async pasteWordText(mode: 'default' | 'plain' | 'keep' = 'default'): Promise<void> {
    const word = this.word();
    const index = this.selectedParagraph();
    if (!word || index === null) return;
    const paragraph = word.blocks[index];
    if (paragraph?.kind !== 'paragraph') return;
    if (mode !== 'plain' && navigator.clipboard?.read) {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (item.types.includes('text/html')) {
            const html = await (await item.getType('text/html')).text();
            const runs = this.runsFromHtml(html);
            if (runs.length) {
              const selection = this.wordSelection();
              const length = paragraphPlainText(paragraph.paragraph).length;
              const start = selection?.paragraphIndex === index ? selection.end : length;
              this.pushWordHistory();
              insertFormattedRuns(word, index, start, runs);
              this.afterWordFormatChange();
              this.wordClipboardStatus.set('ok');
              return;
            }
          }
        }
      } catch { /* fall through to readText / internal clipboard history */ }
    }
    let text = '';
    try {
      text = (await navigator.clipboard?.readText()) ?? '';
    } catch {
      text = '';
    }
    if (!text) {
      const cached = this.clipboardHistory()[0];
      if (!cached) {
        this.wordClipboardStatus.set('error');
        return;
      }
      if (mode === 'plain') await this.pasteClipboardEntry(cached.text);
      else this.pasteClipboardFormatted(cached);
      return;
    }
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

  /** Word's Navigation pane search box feeds the same document search as Ctrl+F. */
  onNavSearchInput(value: string): void {
    this.updateFindQuery(value);
    if (this.navTab() === 'headings' && value.trim()) this.navTab.set('find');
  }

  /** Office glyphs used by the shell itself (close, search, chevrons). */
  uiIcon(name: string): SafeHtml {
    const key = `ui:${name}`;
    const cached = this.iconHtmlCache.get(key);
    if (cached) return cached;
    const body = OFFICE_ICON_SVG[name];
    const html = this.sanitizer.bypassSecurityTrustHtml(body ? `<svg viewBox="0 0 20 20" aria-hidden="true">${body}</svg>` : '');
    this.iconHtmlCache.set(key, html);
    return html;
  }

  /** Split-button caret menu (Paste / Find / Replace / Select). */
  readonly caretMenu = signal<{ id: string; x: number; y: number } | null>(null);

  /** Word's Clipboard and Styles panes (opened from the group dialog launchers). */
  readonly clipboardPaneOpen = signal(false);
  readonly stylesPaneOpen = signal(false);
  readonly clipboardHistory = signal<Array<{ text: string; html: string; at: number }>>([]);

  private pushClipboardHistory(text: string, html: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    this.clipboardHistory.update((items) => [{ text: trimmed, html, at: Date.now() }, ...items.filter((item) => item.text !== trimmed)].slice(0, 10));
  }

  /** Rich preview of a clipboard entry (HTML built from our own runs). */
  clipboardPreview(entry: { html: string }): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(entry.html || '');
  }

  clearClipboardHistory(): void {
    this.clipboardHistory.set([]);
  }

  async pasteClipboardEntry(text: string): Promise<void> {
    const word = this.word();
    const index = this.selectedParagraph();
    if (!word || index === null) return;
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

  /** Word's "Keep Source Formatting" paste: rebuilds runs from the stored HTML. */
  pasteClipboardFormatted(entry: { text: string; html: string }): void {
    const word = this.word();
    const index = this.selectedParagraph();
    if (!word || index === null) return;
    const paragraph = word.blocks[index];
    if (paragraph?.kind !== 'paragraph') return;
    const runs = this.runsFromHtml(entry.html);
    if (!runs.length) {
      void this.pasteClipboardEntry(entry.text);
      return;
    }
    const selection = this.wordSelection();
    const length = paragraphPlainText(paragraph.paragraph).length;
    const start = selection?.paragraphIndex === index ? selection.end : length;
    this.pushWordHistory();
    insertFormattedRuns(word, index, start, runs);
    this.afterWordFormatChange();
    this.wordClipboardStatus.set('ok');
  }

  /** Minimal HTML → run mapping (bold/italic/underline/colour/font/highlight). */
  private runsFromHtml(html: string): WordRun[] {
    if (!html) return [];
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const runs: WordRun[] = [];
    type Format = { bold?: boolean; italic?: boolean; underline?: boolean; color?: string; font?: string; sizePt?: number; highlight?: string };
    const walk = (node: Node, format: Format): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? '';
        if (text) runs.push({ text, ...format });
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const element = node as HTMLElement;
      const tag = element.tagName.toLowerCase();
      if (tag === 'br') {
        runs.push({ text: '\n', ...format });
        return;
      }
      const next = {
        bold: format.bold || tag === 'b' || tag === 'strong'
          || element.style.fontWeight === '700' || element.style.fontWeight === 'bold',
        italic: format.italic || tag === 'i' || tag === 'em' || element.style.fontStyle === 'italic',
        underline: format.underline || tag === 'u' || (element.style.textDecoration || '').includes('underline'),
      };
      const colour = element.style.color || undefined;
      const font = (element.style.fontFamily || '').replace(/['"]/g, '').split(',')[0].trim() || undefined;
      const sizePx = element.style.fontSize?.endsWith('px') ? Number.parseFloat(element.style.fontSize) : undefined;
      const background = element.style.backgroundColor || undefined;
      const highlight = background ? this.highlightName(background) : undefined;
      for (const child of [...element.childNodes]) {
        walk(child, {
          ...next,
          ...(colour ? { color: colour } : {}),
          ...(font ? { font } : {}),
          ...(sizePx ? { sizePt: Math.round((sizePx / 1.333) * 2) / 2 } : {}),
          ...(highlight ? { highlight } : {}),
        });
      }
    };
    walk(parsed.body, {});
    return runs;
  }

  /** HTML for the current selection, built from the selected runs' formatting. */
  private selectionHtml(): string {
    const index = this.selectedParagraph();
    const block = index === null ? null : this.word()?.blocks[index];
    if (index === null || !block || block.kind !== 'paragraph') return '';
    const range = this.wordRangeFor(index);
    const parts: string[] = [];
    const highlightColours: Record<string, string> = {
      yellow: '#fef08a', green: '#bbf7d0', cyan: '#bae6fd', magenta: '#fbcfe8', red: '#fecaca', blue: '#bfdbfe',
    };
    let offset = 0;
    for (const run of block.paragraph.runs) {
      const text = run.text ?? '';
      if (!text) continue;
      const start = offset;
      const end = offset + text.length;
      offset = end;
      const from = Math.max(start, range.start);
      const to = Math.min(end, range.end);
      if (to <= from) continue;
      let html = this.escapeHtml(text.slice(from - start, to - start));
      if (run.underline) html = `<u>${html}</u>`;
      if (run.italic) html = `<em>${html}</em>`;
      if (run.bold) html = `<strong>${html}</strong>`;
      const styles: string[] = [];
      if (run.color) styles.push(`color:${run.color}`);
      if (run.font) styles.push(`font-family:'${run.font}'`);
      if (run.sizePt) styles.push(`font-size:${(run.sizePt * 1.333).toFixed(1)}px`);
      if (run.highlight) styles.push(`background-color:${highlightColours[run.highlight] ?? run.highlight}`);
      if (styles.length) html = `<span style="${styles.join(';')}">${html}</span>`;
      parts.push(html);
    }
    return `<p>${parts.join('')}</p>`;
  }

  private escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** Word's highlight names for the palette we write into the clipboard HTML. */
  private highlightName(background: string): string | undefined {
    const palette: Record<string, string> = {
      'rgba(254, 240, 138, 1)': 'yellow', 'rgba(187, 247, 208, 1)': 'green', 'rgba(186, 230, 253, 1)': 'cyan',
      'rgba(251, 207, 232, 1)': 'magenta', 'rgba(254, 202, 202, 1)': 'red', 'rgba(191, 219, 254, 1)': 'blue',
    };
    const value = background.replace(/\s+/g, ' ');
    return palette[value] ?? palette[value.replace(/^rgb\((\d+), (\d+), (\d+)\)$/, 'rgba($1, $2, $3, 1)')];
  }

  openRibbonCaret(id: string, event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.caretMenu.set({ id, x: Math.round(rect.left), y: Math.round(rect.bottom + 2) });
  }

  caretEntries(id: string): Array<{ labelKey: string; command: string; icon?: string; uiIcon?: string }> {
    switch (id) {
      case 'find': return [
        { labelKey: 'office.rb.find', command: 'find', icon: 'find' },
        { labelKey: 'office.word.findReplace', command: 'replace', icon: 'replace' },
      ];
      case 'replace': return [{ labelKey: 'office.word.findReplace', command: 'replace', icon: 'replace' }];
      case 'selectAll': return [{ labelKey: 'office.rb.selectAll', command: 'selectAll', icon: 'selectAll' }];
      case 'changeCase': return [
        { labelKey: 'office.word.caseSentence', command: 'case:sentence', icon: 'changeCase' },
        { labelKey: 'office.word.caseLower', command: 'case:lower', icon: 'changeCase' },
        { labelKey: 'office.word.caseUpper', command: 'case:upper', icon: 'changeCase' },
        { labelKey: 'office.word.caseCapitalize', command: 'case:capitalize', icon: 'changeCase' },
      ];
      case 'bullets': return [
        { labelKey: 'office.word.list.bullet', command: 'bullets', icon: 'bullets' },
        { labelKey: 'office.rb.checklist', command: 'checklist', icon: 'checklist' },
      ];
      case 'numbering': return [
        { labelKey: 'office.word.list.number', command: 'numbering', icon: 'numbering' },
        { labelKey: 'office.rb.checklist', command: 'checklist', icon: 'checklist' },
      ];
      case 'paste': return [
        { labelKey: 'office.word.pasteKeepFormat', command: 'pasteKeep', uiIcon: 'clipboard_paste' },
        { labelKey: 'office.word.pastePlain', command: 'pastePlain', uiIcon: 'document_text' },
        { labelKey: 'office.word.pasteSpecial', command: 'pasteSpecial', uiIcon: 'options' },
      ];
      case 'paragraphBorders': return [
        { labelKey: 'office.word.border.bottom', command: 'border:bottom', uiIcon: 'border_bottom' },
        { labelKey: 'office.word.border.top', command: 'border:top', uiIcon: 'border_top' },
        { labelKey: 'office.word.border.left', command: 'border:left', uiIcon: 'border_left' },
        { labelKey: 'office.word.border.right', command: 'border:right', uiIcon: 'border_right' },
        { labelKey: 'office.word.border.outside', command: 'border:outside', uiIcon: 'border_outside' },
        { labelKey: 'office.word.border.horizontal', command: 'border:horizontal', uiIcon: 'border_inside' },
        { labelKey: 'office.word.border.none', command: 'border:none', uiIcon: 'border_none' },
      ];
      case 'acceptAll': return [
        { labelKey: 'office.rb.acceptNext', command: 'acceptNext', icon: 'acceptNext' },
        { labelKey: 'office.rb.acceptAll', command: 'acceptAll', icon: 'acceptAll' },
      ];
      case 'rejectAll': return [
        { labelKey: 'office.rb.rejectNext', command: 'rejectNext', icon: 'rejectNext' },
        { labelKey: 'office.rb.rejectAll', command: 'rejectAll', icon: 'rejectAll' },
      ];
      default: return [];
    }
  }

  runCaretEntry(command: string): void {
    this.caretMenu.set(null);
    if (command.startsWith('case:')) {
      this.changeWordCase(command.slice(5) as 'upper' | 'lower' | 'sentence' | 'capitalize');
      return;
    }
    if (command.startsWith('border:')) {
      this.applyParagraphBorders(command.slice(7) as ParagraphBorderMode);
      return;
    }
    this.runWordCommand(command);
  }

  /** Word's dialog launcher in the group's bottom-right corner. */  runRibbonLauncher(kind: 'format' | 'paragraph' | 'find' | 'clipboard' | 'styles'): void {
    if (kind === 'format') this.toggleFormat();
    else if (kind === 'paragraph') this.toggleParagraphOptions();
    else if (kind === 'clipboard') {
      this.stylesPaneOpen.set(false);
      this.clipboardPaneOpen.update((open) => !open);
    } else if (kind === 'styles') {
      this.clipboardPaneOpen.set(false);
      this.stylesPaneOpen.update((open) => !open);
    } else this.toggleFind();
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
    const allEqual = [section.margins.top, section.margins.bottom, section.margins.left, section.margins.right]
      .every((value) => Math.abs(value - margin) < 2);
    this.pageMargin.set(!allEqual ? 'custom' : margin <= 720 ? 'narrow' : margin >= 2880 ? 'wide' : 'normal');
    const cm = (value: number): number => Math.round(value / 566.929 * 100) / 100;
    this.marginTop.set(cm(section.margins.top));
    this.marginRight.set(cm(section.margins.right));
    this.marginBottom.set(cm(section.margins.bottom));
    this.marginLeft.set(cm(section.margins.left));
    this.pageBorderStyle.set(section.pageBorder?.style ?? 'single');
    this.pageBorderSize.set(section.pageBorder?.size ?? 1);
    this.pageBorderColor.set(section.pageBorder?.color ? `#${section.pageBorder.color.replace('#', '')}` : '#000000');
    this.pageColor.set(word?.pageColor ?? '#ffffff');
    this.lineNumberingMode.set(section.lineNumbering?.restart ?? 'off');
  }

  private loadHeaderFooter(sectionIndex = 0): void {
    const word = this.word();
    const section = word ? sectionAt(word, sectionIndex) : null;
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

  private ensureHeaderFooter(kind: 'header' | 'footer', sectionIndex = 0) {
    const word = this.word();
    const section = word ? sectionAt(word, sectionIndex) : null;
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
    if (!this.commentsOpen()) this.commentComposeOpen.set(false);
  }

  openCommentCompose(): void {
    this.commentsOpen.set(true);
    this.revisionsOpen.set(false);
    this.commentComposeOpen.set(true);
    if (this.selectedParagraph() === null && this.word()?.blocks.length) {
      this.selectedParagraph.set(0);
    }
    setTimeout(() => {
      const box = this.hostRef.nativeElement.querySelector<HTMLTextAreaElement>('.op-comment-compose-input');
      box?.focus();
    }, 0);
  }

  cancelCommentCompose(): void {
    this.commentDraft.set('');
    this.commentComposeOpen.set(false);
  }

  toggleRevisions(): void {
    this.revisionsOpen.update((open) => !open);
    this.commentsOpen.set(false);
  }

  addComment(): void {
    const word = this.word();
    let index = this.selectedParagraph();
    if (index === null && word?.blocks.length) {
      index = 0;
      this.selectedParagraph.set(0);
    }
    const text = this.commentDraft().trim();
    if (!word || index === null || !text) return;
    const comments = this.comments();
    const created = createComment(comments, {
      author: this.authorName(), initials: this.authorInitials(), text, paragraphIndex: index,
    });
    applyCommentAnchor(word, created);
    this.commentDraft.set('');
    this.commentComposeOpen.set(false);
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
    if (this.separatePages()) this.webLayout.set(false);
  }

  applyWordView(mode: 'print' | 'web'): void {
    this.exitReadingAndImmersive();
    this.webLayout.set(mode === 'web');
    this.separatePages.set(mode === 'print');
    this.resetWordHeights();
    this.wordRenderKey.update((tick) => tick + 1);
    this.scheduleWordMeasure(120);
  }

  cycleCommentFilter(): void {
    const order = ['all', 'unresolved', 'resolved'] as const;
    const current = order.indexOf(this.commentFilter());
    this.commentFilter.set(order[(current + 1) % order.length]);
  }

  switchBackground(): void {
    this.wordDark.update((value) => !value);
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
    this.fileSubmenu.set(null);
    this.caretMenu.set(null);
    this.activePopover.set(null);
    this.syncTabUrl(tab);
  }

  openPopover(kind: WordPopoverKind, event: MouseEvent, alignRight = false, width = 264): void {
    event.stopPropagation();
    if (this.activePopover()?.kind === kind) {
      this.activePopover.set(null);
      return;
    }
    this.fileMenuOpen.set(false);
    this.fileSubmenu.set(null);
    this.caretMenu.set(null);
    this.wordContextMenu.set(null);
    if (kind === 'tableGrid') {
      this.tableGridHover.set({ rows: 0, cols: 0 });
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const rawX = alignRight ? rect.right - width : rect.left;
    const x = Math.round(Math.min(Math.max(8, rawX), Math.max(8, window.innerWidth - width - 8)));
    const preferTop = kind === 'zoom' || kind === 'goToPage'
      ? Math.max(8, Math.round(rect.top - 220))
      : Math.min(Math.max(8, Math.round(rect.bottom + 4)), Math.max(8, window.innerHeight - 340));
    this.activePopover.set({ kind, x, y: preferTop });
  }

  closePopover(): void {
    this.activePopover.set(null);
  }

  insertTableDimensions(rows: number, cols: number): void {
    this.insertRows.set(Math.max(1, Math.min(10, rows)));
    this.insertCols.set(Math.max(1, Math.min(10, cols)));
    this.activePopover.set(null);
    this.insertTableNow();
    const blocks = this.word()?.blocks ?? [];
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (blocks[i]?.kind === 'table') {
        this.activeWordTable.set(i);
        this.activeWordTableRow.set(0);
        this.activeWordTableCell.set(0);
        break;
      }
    }
  }

  applyPageColorSwatch(hex: string | null): void {
    if (!hex) {
      this.clearPageColor();
    } else {
      this.pageColor.set(hex);
      this.applyPageColor();
    }
    this.activePopover.set(null);
  }

  currentAlignmentIcon(): string {
    const align = this.selectedWordParagraph()?.align ?? 'left';
    if (align === 'center') return 'align-center';
    if (align === 'right') return 'align-right';
    if (align === 'justify') return 'align-justify';
    return 'align-left';
  }

  currentStyleLabelKey(): string {
    const value = this.currentWordStyle();
    return this.wordStyleOptions.find((option) => option.value === value)?.labelKey ?? 'office.word.style.normal';
  }

  fitWordPageToViewport(): void {
    const ws = this.hostRef.nativeElement.querySelector<HTMLElement>('.op-workspace');
    if (!ws) return;
    const navOffset = this.navPaneOpen() && window.innerWidth > 640 ? 280 : 0;
    const commentOffset = this.commentsOpen() && window.innerWidth >= 1180 ? 320 : 0;
    const available = Math.max(260, ws.clientWidth - navOffset - commentOffset - 48);
    const firstPage = this.wordPages()[0];
    const pageW = firstPage ? this.wordPageWidth(firstPage) : 816;
    const computedZoom = Math.round((available / pageW) * 100);
    this.setWordZoom(computedZoom);
  }

  fitWholeWordPageToViewport(): void {
    const ws = this.hostRef.nativeElement.querySelector<HTMLElement>('.op-workspace');
    if (!ws) return;
    const navOffset = this.navPaneOpen() && window.innerWidth > 640 ? 280 : 0;
    const commentOffset = this.commentsOpen() && window.innerWidth >= 1180 ? 320 : 0;
    const availW = Math.max(260, ws.clientWidth - navOffset - commentOffset - 48);
    const availH = Math.max(240, ws.clientHeight - 48);
    const firstPage = this.wordPages()[0];
    const pageW = firstPage ? this.wordPageWidth(firstPage) : 816;
    const pageH = firstPage ? this.wordPageHeight(firstPage) : 1056;
    const computedZoom = Math.round(Math.min(availW / pageW, availH / pageH) * 100);
    this.setWordZoom(computedZoom);
  }

  openGoToPagePopover(): void {
    const x = Math.round(Math.max(16, Math.min(80, window.innerWidth - 200)));
    const y = Math.round(Math.max(8, window.innerHeight - 256));
    this.activePopover.set({ kind: 'goToPage', x, y });
  }

  currentWordHighlightHex(): string {
    const val = this.currentWordHighlight();
    if (!val || val === 'none') return '#ffff00';
    return this.wordHighlightSwatches.find((s) => s.value === val)?.hex ?? '#ffff00';
  }

  openShareAction(event?: MouseEvent): void {
    this.fileMenuOpen.set(false);
    if (this.erpDocId()) {
      this.openSharePanel();
      return;
    }
    if (event) {
      this.openPopover('shareMenu', event, true, 256);
    } else {
      this.activePopover.set({
        kind: 'shareMenu',
        x: Math.max(8, window.innerWidth - 268),
        y: 84,
      });
    }
  }

  copyShareLink(): void {
    this.activePopover.set(null);
    void navigator.clipboard?.writeText(location.href).catch(() => undefined);
    this.linkToast.set('copied');
    setTimeout(() => this.linkToast.set(null), 2200);
  }

  setRibbonDisplay(mode: RibbonMode): void {
    this.ribbonMode.set(mode);
    this.activePopover.set(null);
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
    const stage = this.hostRef.nativeElement.querySelector('.op-word-stage') as HTMLElement | null;
    const pages = stage?.querySelectorAll<HTMLElement>('.op-word-page');
    if (!pages?.length) return;
    const range = document.createRange();
    range.setStart(pages[0], 0);
    const last = pages[pages.length - 1];
    range.setEnd(last, last.childNodes.length);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  addBlankPage(): void {
    const word = this.word();
    if (!word) return;
    this.pushWordHistory();
    const afterIndex = this.selectedParagraph() ?? undefined;
    const blankIndex = insertBlankPage(word, afterIndex);
    this.afterWordStructureChange();
    if (blankIndex >= 0) this.selectedParagraph.set(blankIndex);
  }

  ribbonIcon(id: string): string[] {
    return wordIconPaths(id);
  }

  /** Office SVG markup for a ribbon command, sanitized once and cached. */
  private readonly iconHtmlCache = new Map<string, SafeHtml>();
  iconHtml(id: string): SafeHtml {
    const cached = this.iconHtmlCache.get(id);
    if (cached) return cached;
    const html = this.sanitizer.bypassSecurityTrustHtml(wordIconSvg(id));
    this.iconHtmlCache.set(id, html);
    return html;
  }

  /** Layered two-tone Fluent SVG (base glyph + swatch-tinted accent layer). */
  layeredIcon(baseKey: string, accentKey: string): SafeHtml {
    const cacheKey = `layer:${baseKey}:${accentKey}`;
    const cached = this.iconHtmlCache.get(cacheKey);
    if (cached) return cached;
    const html = this.sanitizer.bypassSecurityTrustHtml(wordLayeredIconSvg(baseKey, accentKey));
    this.iconHtmlCache.set(cacheKey, html);
    return html;
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

  toggleSmartArtPanel(): void {
    const open = !this.wordSmartArtOpen();
    this.wordSmartArtOpen.set(open);
    if (!open) return;
    const selected = this.selectedWordObject();
    this.wordSmartArtDraft.set(selected?.smartArt?.nodes.map((node) => node.text).join('\n') ?? 'Ý tưởng\nTriển khai\nKết quả');
    this.shapesOpen.set(false);
    this.iconsOpen.set(false);
    this.wordChartOpen.set(false);
    this.themesOpen.set(false);
    this.styleSetsOpen.set(false);
  }

  applyWordSmartArt(): void {
    const word = this.word();
    if (!word) return;
    const texts = this.wordSmartArtDraft().split(/\r?\n/).map((text) => text.trim()).filter(Boolean);
    if (!texts.length) return;
    const selected = this.selectedWordObject();
    this.pushWordHistory();
    if (selected?.smartArt) {
      updateWordSmartArt(selected, texts);
      this.selectedWordInline.set(selected);
    } else {
      const block = insertWordSmartArt(word, texts);
      const run = block?.kind === 'paragraph' ? block.paragraph.runs[0] : null;
      if (!run) return;
      this.selectedWordInline.set(run);
    }
    this.wordSmartArtOpen.set(false);
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
    if (value === 'custom') {
      if (!this.layoutOpen()) this.toggleLayout();
      else this.loadLayout();
      this.pageMargin.set('custom');
      return;
    }
    this.setPageMarginPreset(value);
    this.applyPageSetup();
  }

  setPageMarginPreset(value: string): void {
    const preset = value === 'narrow' ? 'narrow' : value === 'wide' ? 'wide' : 'normal';
    const cm = preset === 'narrow' ? 1.27 : preset === 'wide' ? 5.08 : 2.54;
    this.pageMargin.set(preset);
    this.marginTop.set(cm);
    this.marginRight.set(cm);
    this.marginBottom.set(cm);
    this.marginLeft.set(cm);
  }

  setCustomMargin(side: 'top' | 'right' | 'bottom' | 'left', value: string): void {
    const cm = Math.max(0, Math.min(20, Number(value) || 0));
    this.pageMargin.set('custom');
    if (side === 'top') this.marginTop.set(cm);
    else if (side === 'right') this.marginRight.set(cm);
    else if (side === 'bottom') this.marginBottom.set(cm);
    else this.marginLeft.set(cm);
  }

  applyWordHyphenation(value: string): void {
    const mode = value === 'automatic' ? 'automatic' : 'none';
    if (this.hyphenationMode() === mode) return;
    this.hyphenationMode.set(mode);
    const word = this.word();
    if (word) setAutoHyphenation(word, mode === 'automatic');
    this.resetWordHeights();
    this.wordRenderKey.update((tick) => tick + 1);
    this.scheduleWordMeasure(120);
    this.dirty.set(Boolean(word));
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
      case 'superscript': return this.selectedWordRun()?.vertAlign === 'superscript';
      case 'subscript': return this.selectedWordRun()?.vertAlign === 'subscript';
      case 'tableBorderTop': return this.borderPen()?.edge === 'top';
      case 'tableBorderBottom': return this.borderPen()?.edge === 'bottom';
      case 'tableBorderLeft': return this.borderPen()?.edge === 'left';
      case 'tableBorderRight': return this.borderPen()?.edge === 'right';
      case 'tableBorderDiagDown': return this.borderPen()?.edge === 'tl2br';
      case 'tableBorderDiagUp': return this.borderPen()?.edge === 'tr2bl';
      case 'bullets': return this.selectedWordParagraph()?.listType === 'bullet';
      case 'numbering': return this.selectedWordParagraph()?.listType === 'number';
      case 'alignLeft': return (this.selectedWordParagraph()?.align ?? 'left') === 'left';
      case 'alignCenter': return this.selectedWordParagraph()?.align === 'center';
      case 'alignRight': return this.selectedWordParagraph()?.align === 'right';
      case 'alignJustify': return this.selectedWordParagraph()?.align === 'justify';
      case 'find': return this.findOpen() || (this.navPaneOpen() && this.navTab() === 'find');
      case 'replace': return this.findOpen() || (this.navPaneOpen() && this.navTab() === 'replace');
      case 'table': return this.insertTableOpen() || this.activePopover()?.kind === 'tableGrid';
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
      case 'printLayout': return !this.readingView() && !this.immersive() && this.separatePages() && !this.webLayout();
      case 'webLayout': return this.webLayout() && !this.readingView();
      case 'immersive': return this.immersive();
      case 'darkMode': return this.wordChromeDark();
      case 'ruler': return this.rulerOpen();
      case 'navigation': return this.navPaneOpen();
      case 'drawPen': return this.inkOpen() && this.inkStyle() === 'pen' && this.inkTool() === 'pen';
      case 'drawHighlighter': return this.inkOpen() && this.inkStyle() === 'highlighter';
      case 'drawEraser': return this.inkTool() === 'eraser';
      case 'eraserSmall': return this.inkTool() === 'eraser' && this.inkEraserSize() === 8;
      case 'eraserMedium': return this.inkTool() === 'eraser' && this.inkEraserSize() === 20;
      case 'lassoSelect': return this.inkTool() === 'lasso';
      case 'drawInkMode': return this.inkInputMode() === 'mouse';
      case 'fingerPainting': return this.inkInputMode() === 'touch';
      case 'drawRuler': return this.rulerOpen();
      case 'inkStart': return this.inkOpen();
      case 'inkHide': return this.inkHidden();
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
      case 'altText': return this.altTextOpen();
      case 'objectSize': return this.objectSizeOpen();
      case 'shapeFill': return this.shapeFillOpen();
      case 'shapeOutline': return this.shapeOutlineOpen();
      case 'smartArt': return this.wordSmartArtOpen();
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
    if (id === 'altText' || id === 'resetPicture' || id === 'deleteObject' || id === 'objectSize') {
      return !this.selectedWordObject();
    }
    if (id === 'shapeFill' || id === 'shapeOutline') return !this.selectedWordObject()?.textBox;
    if (id === 'position' || id === 'wrapText' || id === 'alignObjects' || id === 'rotateObjects'
      || id === 'bringForward' || id === 'sendBackward') {
      return !this.selectedWordObject();
    }
    return false;
  }

  runWordCommand(id: string): void {
    // Word's imported table styles: one command per style (family + accent).
    const accentStyle = /^tableStyleWord([A-Za-z0-9]+Accent[1-6])$/.exec(id);
    if (accentStyle) {
      const name = accentStyle[1];
      this.applyWordTableStyle(`${name[0].toLowerCase()}${name.slice(1)}` as WordTableStylePreset);
      return;
    }
    switch (id) {
      case 'undo': this.undoWord(); break;
      case 'redo': this.redoWord(); break;
      case 'paste': void this.pasteWordText('default'); break;
      case 'pasteKeep': void this.pasteWordText('keep'); break;
      case 'pastePlain': void this.pasteWordText('plain'); break;
      case 'pasteSpecial': this.clipboardPaneOpen.update((open) => !open); break;
      case 'superscript': this.toggleWordVertAlign('superscript'); break;
      case 'subscript': this.toggleWordVertAlign('subscript'); break;
      case 'changeCase': this.changeWordCase(this.lastCaseMode()); break;
      case 'tableStyleHeader': this.applyWordTableStyle('header'); break;
      case 'tableStyleGrid': this.applyWordTableStyle('grid'); break;
      case 'tableStyleBanded': this.applyWordTableStyle('banded'); break;
      case 'tableStyleList': this.applyWordTableStyle('list'); break;
      case 'tableStyleShaded': this.applyWordTableStyle('shaded'); break;
      case 'tableStyleNone': this.applyWordTableStyle('none'); break;
      case 'tableStyleGridLight': this.applyWordTableStyle('gridLight'); break;
      case 'tableStyleAccentHeader': this.applyWordTableStyle('accentHeader'); break;
      case 'tableStyleAccentStriped': this.applyWordTableStyle('accentStriped'); break;
      case 'tableStyleOutline': this.applyWordTableStyle('outline'); break;
      case 'tableStyleBandedColumns': this.applyWordTableStyle('bandedColumns'); break;
      case 'tableStyleFirstCol': this.applyWordTableStyle('firstCol'); break;
      case 'tableStyleLastRow': this.applyWordTableStyle('lastRow'); break;
      case 'tableStyleGridThick': this.applyWordTableStyle('gridThick'); break;
      case 'tableStyleWordGrid': this.applyWordTableStyle('tableGrid'); break;
      case 'tableBorderTop': this.toggleTableCellBorder('top'); break;
      case 'tableBorderBottom': this.toggleTableCellBorder('bottom'); break;
      case 'tableBorderLeft': this.toggleTableCellBorder('left'); break;
      case 'tableBorderRight': this.toggleTableCellBorder('right'); break;
      case 'tableBorderNone': this.clearTableCellBorders(); break;
      case 'tableBorderDiagDown': this.toggleTableCellBorder('tl2br'); break;
      case 'tableBorderDiagUp': this.toggleTableCellBorder('tr2bl'); break;
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
      case 'find': this.openNavTab('find'); break;
      case 'replace': this.openNavTab('replace'); break;
      case 'fontColor': case 'highlight': case 'shading': this.formatOpen.set(true); break;
      case 'style': this.stylesPaneOpen.set(true); break;
      case 'spacing': this.paragraphOptionsOpen.set(true); break;
      case 'margins': case 'orientation': case 'pageSize': case 'columns': this.layoutOpen.set(true); break;
      case 'zoom': this.setWordZoom(100); break;
      case 'selectAll': this.selectAllWord(); break;
      case 'blankPage': this.addBlankPage(); break;
      case 'pageBreak': this.addPageBreak(); break;
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
      case 'newComment': case 'reviewCommentNew': this.openCommentCompose(); break;
      case 'header': case 'footer': case 'pageNumber': this.toggleHeaderFooter(); break;
      case 'equation': this.toggleEquation(); break;
      case 'symbol': this.toggleSymbol(); break;
      case 'drawSelect': this.inkOpen.set(false); break;
      case 'drawPen': this.setInkTool('pen'); break;
      case 'drawHighlighter': this.setInkStyle('highlighter'); break;
      case 'drawRuler': this.toggleRuler(); break;
      case 'drawEraser': this.setInkTool('eraser'); break;
      case 'eraserSmall': this.setInkTool('eraser'); this.inkEraserSize.set(8); break;
      case 'eraserMedium': this.setInkTool('eraser'); this.inkEraserSize.set(20); break;
      case 'lassoSelect': this.setInkTool('lasso'); break;
      case 'drawInkMode': this.setInkTool('pen'); this.setInkInputMode('mouse'); break;
      case 'fingerPainting': this.setInkTool('pen'); this.setInkInputMode('touch'); break;
      case 'penFavorite': this.applyPenFavorite(); break;
      case 'addPenFavorite': this.savePenFavorite(); break;
      case 'drawClear': this.clearInkStrokes(); break;
      case 'inkStart': this.startInkReview(); break;
      case 'inkHide': this.toggleInkHidden(); break;
      case 'inkDeleteAll': this.clearInkStrokes(); break;
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
      case 'printLayout': this.applyWordView('print'); break;
      case 'webLayout': this.applyWordView('web'); break;
      case 'immersive': this.toggleImmersive(); break;
      case 'darkMode': this.toggleWordDark(); break;
      case 'separatePages': this.toggleSeparatePages(); break;
      case 'switchBackground': this.switchBackground(); break;
      case 'zoom100': this.setWordZoom(100); break;
      case 'ruler': this.toggleRuler(); break;
      case 'navigation': this.toggleNavPane(); break;
      case 'pageWidth': this.fitWordPageToViewport(); break;
      case 'wholePage': this.fitWholeWordPageToViewport(); break;
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
      case 'altText': this.openAltText(); break;
      case 'resetPicture': void this.resetWordObjectSize(); break;
      case 'deleteObject': this.deleteWordObject(); break;
      case 'objectSize': this.openObjectSize(); break;
      case 'shapeFill': this.openShapeFill(); break;
      case 'shapeOutline': this.openShapeOutline(); break;
      case 'smartArt': this.toggleSmartArtPanel(); break;
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

  runStyle(run: { bold?: boolean; italic?: boolean; underline?: boolean; underlineStyle?: string; strike?: boolean; caps?: boolean; smallCaps?: boolean; vertAlign?: 'superscript' | 'subscript'; color?: string; shading?: string; sizePt?: number; font?: string; highlight?: string }): Record<string, string> {
    const highlight: Record<string, string> = {
      yellow: '#fef08a', green: '#bbf7d0', cyan: '#bae6fd', magenta: '#fbcfe8', red: '#fecaca', blue: '#bfdbfe',
    };
    const style: Record<string, string> = {
      'font-weight': run.bold ? '700' : '400',
      'font-style': run.italic ? 'italic' : 'normal',
      'text-decoration': [run.underline ? 'underline' : '', run.strike ? 'line-through' : ''].filter(Boolean).join(' ') || 'none',
      color: run.color ?? 'inherit',
      'font-size': run.sizePt ? `${Math.round(run.sizePt * 1.333)}px` : run.vertAlign ? '0.65em' : 'inherit',
      'font-family': run.font ? `'${run.font}', sans-serif` : 'inherit',
      'text-transform': run.caps ? 'uppercase' : 'none',
      'font-variant': run.smallCaps ? 'small-caps' : 'normal',
      'vertical-align': run.vertAlign === 'superscript' ? 'super' : run.vertAlign === 'subscript' ? 'sub' : 'baseline',
      background: run.highlight ? highlight[run.highlight] ?? run.highlight : (run.shading ?? 'transparent'),
    };
    if (run.underline && run.underlineStyle && run.underlineStyle !== 'single') {
      style['text-decoration-style'] = run.underlineStyle;
    }
    return style;
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

  private applyDocument(doc: OfficeDocument, buffer: ArrayBuffer): void {
    this.revokePdf();
    this.revokeMedia();
    this.doc.set(doc);
    this.buffers.set(buffer);
    this.dirty.set(false);
    if (doc.word) doc.word.comments = doc.word.comments ?? [];
    this.hyphenationMode.set(doc.word?.autoHyphenation ? 'automatic' : 'none');
    this.comments.set(doc.word?.comments ?? []);
    const firstPara = doc.word?.blocks.findIndex((block) => block.kind === 'paragraph') ?? -1;
    this.selectedParagraph.set(firstPara >= 0 ? firstPara : null);
    this.revisions.set(doc.word ? listRevisions(doc.word) : []);
    this.markupMode.set('all');
    this.revisionTick.update((value) => value + 1);
    this.wordRenderKey.update((value) => value + 1);
    this.tracking.set(false);
    this.commentsOpen.set(false);
    this.revisionsOpen.set(false);
    this.headerFooterOpen.set(false);
    this.headerFooterEdit.set(null);
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
    this.fileSubmenu.set(null);
    this.activePopover.set(null);
    this.caretMenu.set(null);
    this.commentComposeOpen.set(false);
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

/** One numbering level rendered the way Word shows it ("A", "IV", "3.1", …). */
function formatNumberingLabel(
  level: { format: string; text: string },
  counts: number[],
  levels?: ReadonlyMap<number, { format: string; text: string }>,
): string {
  const one = (value: number, format: string): string => {
    if (format === 'upperLetter' || format === 'lowerLetter') {
      let remainder = Math.max(1, value);
      let label = '';
      while (remainder > 0) {
        const digit = (remainder - 1) % 26;
        label = String.fromCharCode(97 + digit) + label;
        remainder = Math.floor((remainder - 1) / 26);
      }
      return format === 'upperLetter' ? label.toUpperCase() : label;
    }
    if (format === 'upperRoman' || format === 'lowerRoman') {
      const table: Array<[number, string]> = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
        [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
      let remainder = Math.max(1, value);
      let label = '';
      for (const [amount, symbol] of table) {
        while (remainder >= amount) { label += symbol; remainder -= amount; }
      }
      return format === 'lowerRoman' ? label.toLowerCase() : label;
    }
    if (format === 'bullet' || format === 'none') return '';
    return String(value);
  };
  const text = level.text || `%${counts.length}`;
  const label = text.replace(/%(\d)/g, (_match, index: string) => {
    const position = Number(index) - 1;
    return one(counts[position] ?? 1, levels?.get(position)?.format ?? level.format);
  });
  return label.trim();
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
  if (ext === 'docx' || ext === 'dotx' || ext === 'doc' || ext === 'rtf' || ext === 'odt' || ext === 'xml') return 'WORD';
  if (ext === 'xlsx') return 'EXCEL';
  if (ext === 'pptx') return 'POWERPOINT';
  if (ext === 'csv') return 'CSV';
  if (ext === 'pdf') return 'PDF';
  return 'WORD';
}

function mimeOf(fileName: string): string {
  const ext = extensionOf(fileName);
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (ext === 'dotx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.template';
  if (ext === 'doc') return 'application/msword';
  if (ext === 'rtf') return 'application/rtf';
  if (ext === 'odt') return 'application/vnd.oasis.opendocument.text';
  if (ext === 'xml') return 'application/xml';
  if (ext === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (ext === 'pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (ext === 'csv') return 'text/csv';
  if (ext === 'pdf') return 'application/pdf';
  return 'application/octet-stream';
}
