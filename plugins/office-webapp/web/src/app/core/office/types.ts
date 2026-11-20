import type { XmlNode } from '../binary/xml';
import type { ChartLayout, ChartType } from './chart';
import type { WordComment } from './comments';
import type { PptAnimation, PptTransition } from './ppt-effects';
import type { WordSectionInfo } from './word-section';
import type { ExcelAnalysis } from './xlsx-analysis';
import type { WordNotes } from './word-notes';

export type { WordNote, WordNotes } from './word-notes';
import type { CitationSource } from './word-citations';
import type { WordEquation } from './word-equation';
import type { InkStroke } from './word-ink';

export type OfficeApp = 'word' | 'excel' | 'ppt' | 'pdf';

export interface WordChart {
  type: ChartType;
  title?: string;
  categories: string[];
  series: Array<{ label: string; values: number[]; color: string }>;
  width: number;
  height: number;
  layout: ChartLayout;
}

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
  underlineStyle?: 'single' | 'double' | 'dotted' | 'dashed' | 'wavy';
  strike?: boolean;
  /** w:caps: Word shows the run in capitals without changing the stored text. */
  caps?: boolean;
  smallCaps?: boolean;
  /** w:vertAlign: superscript/subscript runs. */
  vertAlign?: 'superscript' | 'subscript';
  color?: string;
  shading?: string;
  sizePt?: number;
  font?: string;
  highlight?: string;
  imagePath?: string;
  imageWidth?: number;
  imageHeight?: number;
  unsupportedImageFormat?: string;
  alt?: string;
  videoUrl?: string;
  link?: string;
  textBox?: { text: string; width: number; height: number; shape?: string; fill?: string; outline?: string };
  chart?: WordChart;
  equation?: { mathMl: string; label: string; display?: boolean };
  noteRef?: { kind: 'footnote' | 'endnote'; id: number; label: string };
  pageBreak?: boolean;
  mergeField?: string;
  mergeRule?: MergeRule;
  float?: WordFloat;
  group?: WordGroup;
  groupOffset?: { x: number; y: number };
  rotate?: number;
  smartArt?: WordSmartArt;
  xmlNode?: XmlNode;
}

export interface WordSmartArtNode {
  text: string;
  node?: XmlNode;
}

/** Word SmartArt: paragraph-level dgm:* parts plus the relIds graphic. */
export interface WordSmartArt {
  dataPath: string;
  layoutPath: string;
  quickStylePath?: string;
  colorsPath?: string;
  widthPx: number;
  heightPx: number;
  nodes: WordSmartArtNode[];
  dataRoot?: XmlNode;
  layoutRoot?: XmlNode;
  quickStyleRoot?: XmlNode;
  colorsRoot?: XmlNode;
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
  indentRight?: number;
  firstLineIndent?: number;
  hangingIndent?: number;
  lineSpacing?: number;
  lineHeightPx?: number;
  fontSizePt?: number;
  fontFamily?: string;
  spaceBeforePx?: number;
  spaceAfterPx?: number;
  pageBreakBefore?: boolean;
  listType?: 'bullet' | 'number';
  listLevel?: number;
  listNumId?: string;
  /** Numbering inherited from the paragraph style, e.g. Heading1's numId. */
  numbering?: { id: string; level: number };
  shading?: string;
  borders?: boolean;
  borderSides?: { top?: string; bottom?: string; left?: string; right?: string };
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
  /** Diagonal rules drawn inside the cell (w:tl2br / w:tr2bl). */
  diagDown?: boolean;
  diagUp?: boolean;
  /** Borders painted per edge by the Table Design border painter. */
  borderPainter?: boolean;
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

export interface WordTableBorders {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  insideH?: string;
  insideV?: string;
}

export type WordBlock =
  | { kind: 'paragraph'; paragraph: WordParagraph; sectionIndex?: number }
  | { kind: 'table'; rows: WordParagraph[][][]; nested?: WordNestedTable[]; grid?: number[]; rowHeights?: number[]; headerRows?: number; cellStyles?: (WordCellStyle | undefined)[][]; cellSpans?: (WordCellSpan | undefined)[][]; splitRow?: boolean; sectionIndex?: number; align?: 'left' | 'center' | 'right'; widthPct?: number; rowMap?: number[]; fragment?: boolean; breakHints?: TableBreakHint[]; xmlNode?: XmlNode; tableWidthPx?: number; colWidthsPx?: number[]; borderless?: boolean; tableBorders?: WordTableBorders };

export interface TableBreakHint {
  row: number;
  cell: number;
  /** Character offset in the cell text (paragraphs joined with newline). */
  offset: number;
}

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
  tableWidthPx?: number;
  colWidthsPx?: number[];
}

export interface WordDocument {
  blocks: WordBlock[];
  wordCount: number;
  pageSize: { width: number; height: number };
  pageMargins?: { top: number; bottom: number; left: number; right: number };
  appPages?: number;
  warnings: string[];
  sourceFormat?: 'docx' | 'dotx' | 'doc' | 'rtf' | 'odt' | 'wordml' | 'html';
  readOnlyLegacy?: boolean;
  evenAndOddHeaders?: boolean;
  xmlRoot?: XmlNode;
  pageColor?: string;
  watermark?: string;
  protected?: boolean;
  autoHyphenation?: boolean;
  theme?: { accent: string; font: string; accents?: string[]; minorFont?: string; colors?: Record<string, string> };
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
  /** Per-numId level formats from numbering.xml, for style-based numbering. */
  numberingFormats?: Map<string, WordNumberingFormat>;
  packageEntries?: Map<string, Uint8Array>;
}

/** One numbering definition: which abstract list it points at and its level text. */
export interface WordNumberingFormat {
  abstractId: string;
  levels: Map<number, { format: string; text: string; start: number; indentTwips?: number; hangingTwips?: number }>;
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
