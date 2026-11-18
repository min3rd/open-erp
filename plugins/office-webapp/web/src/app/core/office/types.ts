import type { XmlNode } from '../binary/xml';
import type { WordComment } from './comments';
import type { PptAnimation, PptTransition } from './ppt-effects';
import type { WordSectionInfo } from './word-section';
import type { ExcelAnalysis } from './xlsx-analysis';
import type { WordNotes } from './word-notes';
import type { CitationSource } from './word-citations';
import type { WordEquation } from './word-equation';
import type { InkStroke } from './word-ink';

export type OfficeApp = 'word' | 'excel' | 'ppt' | 'pdf';

export interface WordFloat {
  x: number;
  y: number;
  wrap: 'square' | 'tight' | 'through' | 'none' | 'topAndBottom' | 'behind' | 'front';
  z: number;
  rotate: number;
  hidden?: boolean;
  anchorId?: string;
}

export interface WordGroup {
  width: number;
  height: number;
  children: WordRun[];
}

export interface WordRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  sizePt?: number;
  font?: string;
  highlight?: string;
  imagePath?: string;
  imageWidth?: number;
  imageHeight?: number;
  alt?: string;
  videoUrl?: string;
  link?: string;
  textBox?: { text: string; width: number; height: number; shape?: string; fill?: string };
  pageBreak?: boolean;
  mergeField?: string;
  mergeRule?: MergeRule;
  float?: WordFloat;
  group?: WordGroup;
  groupOffset?: { x: number; y: number };
  rotate?: number;
  xmlNode?: XmlNode;
}

export interface MergeRule {
  kind: 'next' | 'if';
  field?: string;
  operator?: '=' | '<>' | '>' | '<' | '>=' | '<=';
  value?: string;
  trueText?: string;
  falseText?: string;
}

export interface WordParagraph {
  style?: string;
  headingLevel?: number;
  align?: 'left' | 'center' | 'right' | 'justify';
  indent?: number;
  lineSpacing?: number;
  lineHeightPx?: number;
  fontSizePt?: number;
  fontFamily?: string;
  spaceBeforePx?: number;
  spaceAfterPx?: number;
  listType?: 'bullet' | 'number';
  shading?: string;
  borders?: boolean;
  sectionBreakAfter?: boolean;
  storedPageBreak?: boolean;
  keepNext?: boolean;
  contextualSpacing?: boolean;
  runs: WordRun[];
  xmlNode?: XmlNode;
  /** Model paragraph index when this paragraph is a cell slice on a table page. */
  sourceIndex?: number;
}

/**
 * Cell look taken from w:tcPr, the way Word resolves it: shading fill, vertical
 * alignment, per-edge borders (w:val="nil" means no line) and cell margins.
 */
export interface WordCellStyle {
  fill?: string;
  valign?: 'top' | 'center' | 'bottom';
  borderTop?: boolean;
  borderLeft?: boolean;
  borderBottom?: boolean;
  borderRight?: boolean;
  borderWidthPx?: number;
  borderColor?: string;
  padLeftPx?: number;
  padRightPx?: number;
  padTopPx?: number;
  padBottomPx?: number;
}

/**
 * Word's merged-cell markup: w:gridSpan widens one cell, and a vertical merge is
 * stored as a restart cell plus a continue cell in each row it covers.
 */
export interface WordCellSpan {
  colSpan?: number;
  vMerge?: 'restart' | 'continue';
}

export type WordBlock =
  | { kind: 'paragraph'; paragraph: WordParagraph; sectionIndex?: number }
  | { kind: 'table'; rows: WordParagraph[][][]; nested?: WordNestedTable[]; grid?: number[]; rowHeights?: number[]; headerRows?: number; cellStyles?: (WordCellStyle | undefined)[][]; cellSpans?: (WordCellSpan | undefined)[][]; splitRow?: boolean; sectionIndex?: number; align?: 'left' | 'center' | 'right'; widthPct?: number; rowMap?: number[]; fragment?: boolean; xmlNode?: XmlNode };

export interface WordNestedTable {
  row: number;
  cell: number;
  afterParagraph: number;
  rows: WordParagraph[][][];
  grid?: number[];
  rowHeights?: number[];
  headerRows?: number;
  cellStyles?: (WordCellStyle | undefined)[][];
  cellSpans?: (WordCellSpan | undefined)[][];
  nested?: WordNestedTable[];
}

export interface WordDocument {
  blocks: WordBlock[];
  wordCount: number;
  pageSize: { width: number; height: number };
  pageMargins?: { top: number; bottom: number; left: number; right: number };
  appPages?: number;
  warnings: string[];
  xmlRoot?: XmlNode;
  pageColor?: string;
  watermark?: string;
  protected?: boolean;
  theme?: { accent: string; font: string };
  styleSet?: string;
  comments?: WordComment[];
  sections?: WordSectionInfo[];
  notes?: WordNotes;
  sources?: CitationSource[];
  citationRoot?: XmlNode;
  citationPath?: string;
  equations?: WordEquation[];
  inkStrokes?: InkStroke[];
  inkPath?: string;
  packageEntries?: Map<string, Uint8Array>;
}

export interface ExcelCell {
  ref: string;
  row: number;
  col: number;
  value: string;
  formula?: string;
  type: 'string' | 'number' | 'boolean' | 'error' | 'empty';
  xmlNode?: XmlNode;
  styleIndex?: number;
  style?: CellStyle;
}

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  doubleUnderline?: boolean;
  strike?: boolean;
  font?: string;
  sizePt?: number;
  color?: string;
  fill?: string;
  border?: boolean;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  wrapText?: boolean;
  indent?: number;
  rotation?: number;
  numberFormat?: string;
}

export interface ExcelSheet {
  name: string;
  cells: Map<string, ExcelCell>;
  maxRow: number;
  maxCol: number;
  merges: string[];
  path?: string;
  xmlRoot?: XmlNode;
  freeze?: { row: number; col: number };
  comments?: Map<string, ExcelComment>;
  protected?: boolean;
}

export interface ExcelComment {
  ref: string;
  author: string;
  text: string;
}

export interface ExcelDocument {
  sheets: ExcelSheet[];
  warnings: string[];
  analysis?: ExcelAnalysis;
  analysisRoot?: XmlNode;
  analysisPath?: string;
  packageEntries?: Map<string, Uint8Array>;
  workbookRoot?: XmlNode;
}

export interface PptShape {
  id: string;
  name?: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSizePt?: number;
  bold?: boolean;
  color?: string;
  textNode?: XmlNode;
  kind?: 'text' | 'image' | 'video' | 'audio' | 'smartart' | 'chart' | 'table';
  mediaPath?: string;
  diagramPath?: string;
  diagramRoot?: XmlNode;
  smartArtNodes?: Array<{ text: string; node: XmlNode }>;
}

export interface PptComment {
  id: number;
  author: string;
  text: string;
  date?: string;
}

export interface PptSlide {
  index: number;
  shapes: PptShape[];
  path?: string;
  xmlRoot?: XmlNode;
  transition?: PptTransition;
  animations?: PptAnimation[];
  hidden?: boolean;
  notes?: string;
  notesPath?: string;
  comments?: PptComment[];
  commentsPath?: string;
  background?: string;
  layoutPath?: string;
  layoutName?: string;
}

export interface PptDocument {
  slides: PptSlide[];
  width: number;
  height: number;
  warnings: string[];
  packageEntries?: Map<string, Uint8Array>;
  presentationRoot?: XmlNode;
  presentationRels?: Map<string, string>;
  presentationRelsRaw?: string;
  removedParts?: Set<string>;
}

export interface PdfPageInfo {
  pageCount: number;
  width: number;
  height: number;
}

export interface OfficeDocument {
  app: OfficeApp;
  fileName: string;
  word?: WordDocument;
  excel?: ExcelDocument;
  ppt?: PptDocument;
  pdf?: PdfPageInfo;
  warnings: string[];
}
