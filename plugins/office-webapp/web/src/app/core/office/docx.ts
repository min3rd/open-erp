import { attr, descendants, findChild, findChildren, parseXml, textOf, type XmlNode } from '../binary/xml';
import { findZipEntry, readZip } from '../binary/zip';
import { parseWordComments } from './comments';
import { parseSections } from './word-section';
import { formatNoteNumber, parseWordNotes } from './word-notes';
import { parseCitationSources } from './word-citations';
import { equationLabel, ommlToMathMl, parseEquations } from './word-equation';
import { parseInkStrokes } from './word-ink';
import { parseWordSmartArt } from './word-smartart';
import { parseWordChart } from './word-chart';
import { parseNumbering, parseNumberingFormats } from './word-format';
import {
  parseWordStyles, readParagraphBorders, readTableBordersNode, resolveCharacterStyle,
  resolveParagraphStyle, resolveTableStyle, resolveTableVisual,
  type ResolvedParagraphStyle, type TableVisualDefinition, type WordStyleSheet,
} from './word-styles';
import { watermarkText } from './word-extra';
import { parseProtection } from './word-protect';
import { parseAutoHyphenation } from './word-settings';
import { parseStyleSet, parseWordTheme, resolveThemeColor, resolveThemeFont, type ParsedWordTheme } from './word-theme';
import { readTableLayout, readTableSpans } from './word-tables';
import type { WordBlock, WordCellSpan, WordCellStyle, WordDocument, WordNestedTable, WordParagraph, WordRun, WordTableBorders, TableBreakHint } from './types';

const EMU_PER_PX = 9525;

export async function parseDocx(buffer: ArrayBuffer | Uint8Array): Promise<WordDocument> {
  const zip = await readZip(buffer);
  return parseDocxEntries(zip.entries, zip.warnings ?? []);
}

export function parseDocxEntries(entries: Map<string, Uint8Array>, initialWarnings: string[] = []): WordDocument {
  const mainPath = resolveMainDocumentPath(entries);
  const mainEntry = findZipEntry(entries, mainPath);
  if (!mainEntry) {
    throw new Error('OFFICE_DOCX_PARSE_FAILED');
  }
  const relsPath = relsPathForPart(mainEntry.path);
  const doc = parseXml(new TextDecoder('utf-8').decode(mainEntry.data));
  const documentNode = findChild(doc, 'w:document') ?? doc;
  const background = findChild(documentNode, 'w:background');
  const bgColor = attr(background, 'w:color');
  const pageColor = bgColor && bgColor !== 'auto' ? `#${bgColor.replace(/^#/, '')}` : undefined;
  const theme = parseWordTheme(entries);
  const styles = parseWordStyles(entries, theme);
  const warnings = [...initialWarnings];
  const blocks = parseWordBlocks(documentNode, entries, relsPath, theme, styles, warnings);
  const body = findChild(documentNode, 'w:body');
  const pageSize = readPageSize(mainEntry.data, body);
  const pageMargins = readPageMargins(body);
  const countRows = (rows: WordParagraph[][][]): number => rows.reduce(
    (rowSum, row) => rowSum + row.reduce(
      (cellSum, cell) => cellSum + cell.reduce((paragraphSum, paragraph) => paragraphSum + countWords(paragraph), 0),
      0,
    ),
    0,
  );
  const countNested = (items: WordNestedTable[] | undefined): number => (items ?? []).reduce(
    (sum, item) => sum + countRows(item.rows) + countNested(item.nested),
    0,
  );
  const wordCount = blocks.reduce((sum, block) => {
    if (block.kind === 'paragraph') return sum + countWords(block.paragraph);
    return sum + countRows(block.rows) + countNested(block.nested);
  }, 0);

  if (!findZipEntry(entries, 'word/styles.xml')) warnings.push('STYLES_MISSING');
  const appEntry = findZipEntry(entries, 'docProps/app.xml');
  const appPagesMatch = appEntry ? /<Pages>(\d+)<\/Pages>/.exec(new TextDecoder('utf-8').decode(appEntry.data)) : null;
  const appPages = appPagesMatch ? Number(appPagesMatch[1]) : undefined;
  const settingsEntry = findZipEntry(entries, 'word/settings.xml');
  const settingsRoot = settingsEntry ? parseXml(new TextDecoder('utf-8').decode(settingsEntry.data)) : null;
  const evenAndOddHeaders = Boolean(settingsRoot && descendants(settingsRoot, 'w:evenAndOddHeaders').length);

  const document: WordDocument = {
    blocks, wordCount, pageSize, pageMargins, appPages, warnings, xmlRoot: documentNode,
    pageColor, sourceFormat: 'docx', evenAndOddHeaders: evenAndOddHeaders || undefined,
  };
  document.numberingFormats = parseNumberingFormats(entries);
  document.comments = parseWordComments(entries, document);
  document.sections = parseSections(document, entries);
  assignSectionIndexes(document);
  document.watermark = watermarkText(document);
  document.protected = parseProtection(entries);
  document.theme = theme;
  document.styleSet = parseStyleSet(entries);
  document.notes = parseWordNotes(document, entries);
  relabelInlineNoteRuns(document);
  document.sources = parseCitationSources(entries, document);
  document.equations = parseEquations(document);
  document.inkStrokes = parseInkStrokes(entries, document);
  document.autoHyphenation = parseAutoHyphenation(entries);
  document.packageEntries = entries;
  return document;
}

function resolveMainDocumentPath(entries: Map<string, Uint8Array>): string {
  const pkgRels = findZipEntry(entries, '_rels/.rels');
  if (pkgRels) {
    const root = parseXml(new TextDecoder('utf-8').decode(pkgRels.data));
    for (const rel of descendants(root, 'Relationship')) {
      const type = attr(rel, 'Type') ?? '';
      const target = attr(rel, 'Target');
      if (target && type.toLowerCase().endsWith('/officedocument')) {
        return target.replace(/^\.\//, '').replace(/^\/+/, '');
      }
    }
  }
  return 'word/document.xml';
}

function relsPathForPart(partPath: string): string {
  const clean = partPath.replace(/^\/+/, '');
  const slash = clean.lastIndexOf('/');
  if (slash < 0) return `_rels/${clean}.rels`;
  return `${clean.slice(0, slash)}/_rels/${clean.slice(slash + 1)}.rels`;
}

function relabelInlineNoteRuns(document: WordDocument): void {
  const notes = document.notes;
  if (!notes) return;
  const mapNote = new Map<string, string>();
  for (const n of notes.footnotes) {
    mapNote.set(`footnote:${n.id}`, formatNoteNumber(n.numbering, notes.footnoteFormat));
  }
  for (const n of notes.endnotes) {
    mapNote.set(`endnote:${n.id}`, formatNoteNumber(n.numbering, notes.endnoteFormat));
  }
  const visitParagraph = (p: WordParagraph): void => {
    for (const run of p.runs) {
      if (!run.noteRef) continue;
      const formatted = mapNote.get(`${run.noteRef.kind}:${run.noteRef.id}`);
      if (formatted) run.noteRef.label = formatted;
    }
  };
  for (const block of document.blocks) {
    if (block.kind === 'paragraph') visitParagraph(block.paragraph);
    else for (const row of block.rows) for (const cell of row) for (const p of cell) visitParagraph(p);
  }
}

export function parseWordBlocks(
  documentNode: XmlNode,
  entries: Map<string, Uint8Array>,
  relsPath = 'word/_rels/document.xml.rels',
  themeArg?: ParsedWordTheme,
  stylesArg?: WordStyleSheet,
  warnings?: string[],
): WordBlock[] {
  const root = findChild(documentNode, 'w:document') ?? documentNode;
  const body = findChild(root, 'w:body');
  const relationships = readRelationships(findZipEntry(entries, relsPath)?.data);
  const numbering = parseNumbering(entries);
  const theme = themeArg ?? parseWordTheme(entries);
  const styles = stylesArg ?? parseWordStyles(entries, theme);
  const baseDir = relsPath.includes('/_rels/') ? relsPath.slice(0, relsPath.indexOf('/_rels/')) : 'word';
  const blocks: WordBlock[] = [];
  const append = (child: XmlNode): void => {
    if (child.name === 'w:p') {
      blocks.push({ kind: 'paragraph', paragraph: parseParagraph(child, relationships, entries, numbering, styles, theme, baseDir, undefined, warnings) });
    } else if (child.name === 'w:tbl') {
      const parsed = parseTable(child, relationships, entries, numbering, styles, theme, baseDir, warnings);
      blocks.push({ kind: 'table', rows: parsed.rows, nested: parsed.nested, grid: parsed.grid, rowHeights: parsed.rowHeights, headerRows: parsed.headerRows || undefined, cellStyles: parsed.cellStyles, cellSpans: parsed.cellSpans, align: parsed.align, widthPct: parsed.widthPct, breakHints: parsed.breakHints, tableWidthPx: parsed.tableWidthPx, colWidthsPx: parsed.colWidthsPx, borderless: parsed.borderless, tableBorders: parsed.tableBorders, xmlNode: child });
    } else if (child.name === 'w:sdt') {
      const content = findChild(child, 'w:sdtContent');
      for (const nested of content?.children ?? []) append(nested);
    }
  };
  if (body) {
    for (const child of body.children) append(child);
  }
  if (blocks.length === 0) blocks.push({ kind: 'paragraph', paragraph: { runs: [] } });
  // Word's contextual spacing removes the paragraph spacing between adjacent
  // paragraphs of the same style (list items in this document), so the rendered
  // page does not accumulate 8pt of after-spacing between every bullet.
  for (let index = 1; index < blocks.length; index++) {
    const previous = blocks[index - 1];
    const current = blocks[index];
    if (previous.kind !== 'paragraph' || current.kind !== 'paragraph') continue;
    if (!current.paragraph.contextualSpacing) continue;
    if ((previous.paragraph.style ?? '') !== (current.paragraph.style ?? '')) continue;
    current.paragraph.spaceBeforePx = 0;
    current.paragraph.spaceAfterPx = 0;
  }
  hydrateSmartArt(blocks, relationships, entries);
  return blocks;
}

function hydrateSmartArt(
  blocks: WordBlock[], relationships: Map<string, string>, entries: Map<string, Uint8Array>,
): void {
  const visitRun = (run: WordRun): void => {
    if (!run.smartArt || !run.xmlNode) return;
    const parsed = parseWordSmartArt(run.xmlNode, relationships, entries);
    if (parsed) run.smartArt = parsed;
  };
  const visitRows = (rows: WordParagraph[][][]): void => {
    for (const row of rows) for (const cell of row) for (const paragraph of cell) {
      for (const run of paragraph.runs) visitRun(run);
    }
  };
  for (const block of blocks) {
    if (block.kind === 'paragraph') {
      for (const run of block.paragraph.runs) visitRun(run);
    } else {
      visitRows(block.rows);
      for (const nested of block.nested ?? []) visitRows(nested.rows);
    }
  }
}

function parseParagraph(
  node: XmlNode,
  relationships: Map<string, string>,
  entries: Map<string, Uint8Array>,
  numbering: Map<string, 'bullet' | 'number'>,
  styles: WordStyleSheet,
  theme?: ParsedWordTheme,
  baseDir = 'word',
  tableStyle?: ResolvedParagraphStyle,
  warnings?: string[],
): WordParagraph {
  const pPr = findChild(node, 'w:pPr');
  const style = attr(findChild(pPr, 'w:pStyle'), 'w:val');
  const resolved = resolveParagraphStyle(styles, style);
  if (tableStyle) {
    for (const [key, value] of Object.entries(tableStyle)) {
      if (value !== undefined) (resolved as Record<string, unknown>)[key] = value;
    }
  }
  const jc = attr(findChild(pPr, 'w:jc'), 'w:val');
  const align = jc === 'both' ? 'justify' : jc === 'center' ? 'center' : jc === 'right' ? 'right' : jc === 'left' ? 'left' : (resolved.align ?? 'left');
  const headingMatch = style ? /heading\s*([1-6])/i.exec(style) : null;
  // Word's paragraph mark formatting (w:pPr/w:rPr) is the paragraph's default
  // run format: runs without their own w:sz/rFonts render at that size (a fresh
  // Word document writes 13 pt there, while docDefaults say 12 pt).
  const markRPr = findChild(pPr, 'w:rPr');
  const markSize = Number(attr(findChild(markRPr, 'w:sz'), 'w:val') ?? 0);
  const markSizePt = markSize > 0 ? markSize / 2 : undefined;
  const markRFonts = findChild(markRPr, 'w:rFonts');
  const markFont = attr(markRFonts, 'w:ascii')
    ?? attr(markRFonts, 'w:hAnsi')
    ?? resolveThemeFont(theme, attr(markRFonts, 'w:asciiTheme') ?? attr(markRFonts, 'w:hAnsiTheme'))
    ?? undefined;
  const headingLevel = headingMatch ? Number(headingMatch[1]) : undefined;
  const indNode = findChild(pPr, 'w:ind');
  const indent = Number(attr(indNode, 'w:left') ?? attr(indNode, 'w:start') ?? 0) || resolved.indentTwips || undefined;
  const indentRight = Number(attr(indNode, 'w:right') ?? attr(indNode, 'w:end') ?? 0) || resolved.indentRightTwips || undefined;
  const firstLineIndent = Number(attr(indNode, 'w:firstLine') ?? 0) || resolved.firstLineTwips || undefined;
  const hangingIndent = Number(attr(indNode, 'w:hanging') ?? 0) || resolved.hangingTwips || undefined;
  const directSpacing = findChild(pPr, 'w:spacing');
  const directLine = Number(attr(directSpacing, 'w:line') ?? 0);
  const directRule = attr(directSpacing, 'w:lineRule') ?? 'auto';
  const lineSpacing = directLine > 0
    ? (directRule === 'auto' ? directLine / 240 : resolved.lineSpacing)
    : (resolved.lineSpacing !== undefined ? resolved.lineSpacing * 1.0 : undefined);
  const lineHeightPx = directLine > 0
    ? (directRule === 'auto' ? undefined : Math.round((directLine / 20) * (96 / 72) * 100) / 100)
    : resolved.lineHeightPx;
  const directBefore = attr(directSpacing, 'w:before');
  const directAfter = attr(directSpacing, 'w:after');
  const spaceBeforePx = directBefore !== undefined
    ? Math.round((Number(directBefore) / 20) * (96 / 72) * 100) / 100
    : resolved.spaceBeforePx;
  const spaceAfterPx = directAfter !== undefined
    ? Math.round((Number(directAfter) / 20) * (96 / 72) * 100) / 100
    : resolved.spaceAfterPx;
  const numPr = findChild(pPr, 'w:numPr');
  const numId = attr(findChild(numPr, 'w:numId'), 'w:val');
  const numIlvl = Number(attr(findChild(numPr, 'w:ilvl'), 'w:val') ?? 0);
  const listType = numId ? numbering.get(numId) : undefined;
  // A heading takes its numbering from the style (Heading1 declares numId 14),
  // not from the paragraph, so lists and headings stay separate.
  const numberingSource = numId ? undefined : resolved.numId;
  const shdNode = findChild(pPr, 'w:shd');
  const shadingVal = attr(shdNode, 'w:fill');
  const shading = shadingVal && shadingVal !== 'auto'
    ? `#${shadingVal.replace(/^#/, '')}`
    : resolveThemeColor(theme, attr(shdNode, 'w:themeFill'), attr(shdNode, 'w:themeFillTint'), attr(shdNode, 'w:themeFillShade'))
      ?? resolved.shading;
  const borderSides = readParagraphBorders(findChild(pPr, 'w:pBdr'), theme) ?? resolved.borderSides;
  const borders = Boolean(borderSides) || Boolean(findChild(pPr, 'w:pBdr'));
  const pbNode = findChild(pPr, 'w:pageBreakBefore');
  const pageBreakBefore = pbNode
    ? (attr(pbNode, 'w:val') !== '0' && attr(pbNode, 'w:val') !== 'false')
    : resolved.pageBreakBefore;
  const sectionProperties = findChild(pPr, 'w:sectPr');
  const sectionType = attr(sectionProperties, 'w:type') ?? 'nextPage';
  const sectionBreakAfter = Boolean(sectionProperties) && sectionType !== 'continuous';

  const runs: WordRun[] = [];
  type FieldState = { kind: 'merge' | 'next' | 'xe' | 'other'; name: string; collecting: boolean; buffer: WordRun[] };
  let field: FieldState | null = null;
  const collect = (container: XmlNode, inheritedLink?: string): void => {
    for (const child of container.children) {
      if (child.name === 'w:r') {
        const hasText = Boolean(findChild(child, 'w:t') || findChild(child, 'w:tab') || findChild(child, 'w:br') || findChild(child, 'w:cr') || findChild(child, 'w:sym'));
        const fldChar = hasText ? null : findChild(child, 'w:fldChar');
        const fldType = fldChar ? attr(fldChar, 'w:fldCharType') : undefined;
        if (fldType === 'begin') {
          field = { kind: 'other', name: '', collecting: false, buffer: [] };
          continue;
        }
        if (field && !hasText) {
          const instrNode = findChild(child, 'w:instrText');
          if (instrNode) {
            const merge = /^\s*MERGEFIELD\s+(?:"([^"]+)"|(\S+))/i.exec(instrNode.text);
            if (merge) {
              field.kind = 'merge';
              field.name = (merge[1] ?? merge[2]).trim();
            } else if (/^\s*NEXT\b/i.test(instrNode.text)) {
              field.kind = 'next';
            } else if (/^\s*XE\b/i.test(instrNode.text)) {
              field.kind = 'xe';
            }
            continue;
          }
          if (fldType === 'separate') {
            field.collecting = true;
            continue;
          }
          if (fldType === 'end') {
            if (field.kind === 'merge') {
              const first = field.buffer[0];
              const cached = field.buffer.map((run) => run.text).join('');
              runs.push({
                text: cached || `«${field.name}»`,
                mergeField: field.name,
                bold: first?.bold, italic: first?.italic, underline: first?.underline,
                strike: first?.strike, color: first?.color, sizePt: first?.sizePt,
                font: first?.font, highlight: first?.highlight,
              });
            } else if (field.kind === 'next') {
              runs.push({ text: '', mergeRule: { kind: 'next' } });
            } else if (field.kind !== 'xe' && field.buffer.length) {
              runs.push(...field.buffer);
            }
            field = null;
            continue;
          }
          if (field.collecting) {
            const run = parseRun(child, relationships, entries, styles, theme, baseDir, inheritedLink, warnings);
            if (run) field.buffer.push(run);
          }
          continue;
        }
        if (field?.collecting) {
          const run = parseRun(child, relationships, entries, styles, theme, baseDir, inheritedLink, warnings);
          if (run) field.buffer.push(run);
          continue;
        }
        const run = parseRun(child, relationships, entries, styles, theme, baseDir, inheritedLink, warnings);
        if (run) runs.push(run);
      } else if (child.name === 'mc:AlternateContent') {
        const choice = findChild(child, 'mc:Choice');
        const fallback = findChild(child, 'mc:Fallback');
        const target = choice && choice.children.some((n) => n.name === 'w:r' || n.name === 'w:drawing' || n.name === 'w:t')
          ? choice
          : (fallback ?? choice);
        if (target) collect(target, inheritedLink);
      } else if (child.name === 'm:oMathPara' || child.name === 'm:oMath') {
        const display = child.name === 'm:oMathPara';
        const mathNode = display ? (findChild(child, 'm:oMath') ?? child) : child;
        runs.push({
          text: '',
          equation: {
            mathMl: ommlToMathMl(mathNode, display),
            label: equationLabel(mathNode),
            display,
          },
        });
      } else if (child.name === 'w:hyperlink') {
        const relId = attr(child, 'r:id');
        const anchor = attr(child, 'w:anchor');
        const link = relId ? relationships.get(relId) : anchor ? `#${anchor}` : inheritedLink;
        for (const runNode of findChildren(child, 'w:r')) {
          const run = parseRun(runNode, relationships, entries, styles, theme, baseDir, link, warnings);
          if (run) runs.push(run);
        }
        for (const nested of child.children) {
          if (nested.name === 'w:sdt' || nested.name === 'w:ins' || nested.name === 'w:smartTag') {
            collect(nested, link);
          }
        }
      } else if (child.name === 'w:sdt') {
        const content = findChild(child, 'w:sdtContent');
        if (content) collect(content, inheritedLink);
      } else if (child.name === 'w:fldSimple') {
        const instruction = attr(child, 'w:instr') ?? '';
        const merge = /^\s*MERGEFIELD\s+(?:"([^"]+)"|(\S+))/i.exec(instruction);
        if (merge) {
          const name = (merge[1] ?? merge[2]).trim();
          const cached = descendants(child, 'w:t').map((node) => node.text).join('');
          runs.push({ text: cached || `«${name}»`, mergeField: name });
        } else if (/^\s*NEXT\b/i.test(instruction)) {
          runs.push({ text: '', mergeRule: { kind: 'next' } });
        } else if (!/^\s*XE\b/i.test(instruction)) {
          collect(child, inheritedLink);
        }
      } else if (child.name === 'w:ins' || child.name === 'w:smartTag'
        || child.name === 'w:customXml' || child.name === 'w:dir' || child.name === 'w:bdo'
        || child.name === 'w:sdtContent') {
        collect(child, inheritedLink);
      }
    }
  };
  collect(node);
  // A style's w:caps applies to every run that does not set the toggle itself.
  if (resolved.caps) {
    for (const run of runs) if (run.caps === undefined) run.caps = true;
  }
  if (resolved.smallCaps) {
    for (const run of runs) if (run.smallCaps === undefined) run.smallCaps = true;
  }
  // Runs without their own size/font/emphasis/color follow paragraph mark and style defaults.
  for (const run of runs) {
    if (run.sizePt === undefined && markSizePt !== undefined) run.sizePt = markSizePt;
    if (run.font === undefined && markFont !== undefined) run.font = markFont;
    if (run.bold === undefined && resolved.bold !== undefined) run.bold = resolved.bold;
    if (run.italic === undefined && resolved.italic !== undefined) run.italic = resolved.italic;
    if (run.underline === undefined && resolved.underline !== undefined) run.underline = resolved.underline;
    if (run.strike === undefined && resolved.strike !== undefined) run.strike = resolved.strike;
    if (run.color === undefined && resolved.color !== undefined) run.color = resolved.color;
  }
  return {
    style, headingLevel, align, indent, indentRight, firstLineIndent, hangingIndent,
    lineSpacing, lineHeightPx,
    fontSizePt: markSizePt ?? resolved.fontSizePt, fontFamily: markFont ?? resolved.fontFamily,
    spaceBeforePx, spaceAfterPx,
    pageBreakBefore: pageBreakBefore || undefined,
    listType,
    listLevel: listType ? numIlvl : undefined,
    listNumId: listType && numId ? numId : undefined,
    shading,
    borders: borders || undefined,
    borderSides,
    numbering: numberingSource ? { id: numberingSource, level: resolved.numLevel ?? 0 } : undefined,
    sectionBreakAfter: sectionBreakAfter || undefined,
    keepNext: resolved.keepNext || Boolean(findChild(pPr, 'w:keepNext')) || undefined,
    contextualSpacing: resolved.contextualSpacing || Boolean(findChild(pPr, 'w:contextualSpacing')) || undefined,
    storedPageBreak: hasStoredPageBreak(node) || undefined,
    runs, xmlNode: node,
  };
}

/**
 * Word records w:lastRenderedPageBreak at the start of the pages of its stored
 * layout. Before any text in the paragraph it means Word itself began a page
 * there; the paginator honours it only for nearly full pages (75% rule).
 */
function hasStoredPageBreak(node: XmlNode): boolean {
  let sawText = false;
  let sawBreak = false;
  const walk = (current: XmlNode): void => {
    if (sawText || sawBreak) return;
    if (current.name === 'w:t' && (current.text ?? '').trim()) { sawText = true; return; }
    if (current.name === 'w:lastRenderedPageBreak') { sawBreak = true; return; }
    if (current.name === 'w:tbl') return;
    for (const child of current.children) walk(child);
  };
  walk(node);
  return sawBreak;
}

/** Character offsets of every w:lastRenderedPageBreak inside a paragraph. */
function storedBreakOffsets(node: XmlNode | undefined): number[] {
  if (!node) return [];
  const offsets: number[] = [];
  let cursor = 0;
  const walk = (current: XmlNode): void => {
    if (current.name === 'w:t') { cursor += current.text.length; return; }
    if (current.name === 'w:tab' || current.name === 'w:br') { cursor += 1; return; }
    if (current.name === 'w:lastRenderedPageBreak') { offsets.push(cursor); return; }
    for (const child of current.children) walk(child);
  };
  walk(node);
  return offsets;
}

function parseRun(
  node: XmlNode,
  relationships: Map<string, string>,
  entries: Map<string, Uint8Array>,
  styles: WordStyleSheet,
  theme?: ParsedWordTheme,
  baseDir = 'word',
  link?: string,
  warnings?: string[],
): WordRun | null {
  const rPr = findChild(node, 'w:rPr');
  const rStyleId = attr(findChild(rPr, 'w:rStyle'), 'w:val');
  const charStyle = rStyleId ? resolveCharacterStyle(styles, rStyleId) : {};
  const parts: string[] = [];
  let image: { path: string; width?: number; height?: number; alt?: string } | null = null;
  let videoUrl: string | undefined;
  let textBox: WordRun['textBox'];
  let group: WordRun['group'];
  let smartArt: WordRun['smartArt'];
  let chart: WordRun['chart'];
  let noteRef: WordRun['noteRef'];
  let pageBreak = false;

  const inspectDrawing = (drawing: XmlNode): void => {
    group = parseGroup(drawing, relationships, baseDir);
    if (group) {
      textBox = undefined;
      image = null;
    } else {
      image = parseDrawing(drawing, relationships, baseDir);
      textBox = parseTextBox(drawing);
    }
    videoUrl = parseOnlineVideo(drawing);
    const relIds = descendants(drawing, 'dgm:relIds')[0];
    if (relIds) {
      const extent = descendants(drawing, 'wp:extent')[0];
      smartArt = {
        dataPath: '', layoutPath: '', quickStylePath: '', colorsPath: '',
        widthPx: Math.round(Number(attr(extent ?? null, 'cx') ?? 0) / EMU_PER_PX) || 480,
        heightPx: Math.round(Number(attr(extent ?? null, 'cy') ?? 0) / EMU_PER_PX) || 240,
        nodes: [],
      };
    }
    const chartRef = descendants(drawing, 'c:chart')[0];
    const chartRel = chartRef ? attr(chartRef, 'r:id') : undefined;
    const chartTarget = chartRel ? relationships.get(chartRel) : undefined;
    if (chartTarget) {
      const extent = descendants(drawing, 'wp:extent')[0];
      const w = Math.round(Number(attr(extent ?? null, 'cx') ?? 0) / EMU_PER_PX) || 480;
      const h = Math.round(Number(attr(extent ?? null, 'cy') ?? 0) / EMU_PER_PX) || 280;
      chart = parseWordChart(normalizeMediaTarget(chartTarget, baseDir), entries, w, h) ?? undefined;
    }
  };

  for (const child of node.children) {
    if (child.name === 'w:t') parts.push(textOf(child));
    else if (child.name === 'w:tab') parts.push('\t');
    else if (child.name === 'w:cr') parts.push('\n');
    else if (child.name === 'w:noBreakHyphen') parts.push('\u2011');
    else if (child.name === 'w:softHyphen') parts.push('\u00AD');
    else if (child.name === 'w:sym') {
      const symChar = decodeSymbolChar(attr(child, 'w:font'), attr(child, 'w:char'));
      if (symChar) parts.push(symChar);
    } else if (child.name === 'w:footnoteReference' || child.name === 'w:endnoteReference') {
      const id = Number(attr(child, 'w:id') ?? 0);
      if (Number.isFinite(id) && id > 0) {
        noteRef = {
          kind: child.name === 'w:footnoteReference' ? 'footnote' : 'endnote',
          id,
          label: String(id),
        };
      }
    } else if (child.name === 'w:br') {
      if (attr(child, 'w:type') === 'page') pageBreak = true;
      else parts.push('\n');
    } else if (child.name === 'w:drawing') {
      inspectDrawing(child);
    } else if (child.name === 'w:pict') {
      const pictImage = parseVmlPicture(child, relationships, baseDir);
      if (pictImage) image = pictImage;
      else textBox = parseVmlTextBox(child) ?? textBox;
    } else if (child.name === 'mc:AlternateContent') {
      const choice = findChild(child, 'mc:Choice');
      const fallback = findChild(child, 'mc:Fallback');
      const choiceDrawing = choice ? findChild(choice, 'w:drawing') : null;
      if (choiceDrawing) {
        inspectDrawing(choiceDrawing);
      } else if (fallback) {
        const fbPict = findChild(fallback, 'w:pict');
        const fbDraw = findChild(fallback, 'w:drawing');
        if (fbDraw) inspectDrawing(fbDraw);
        else if (fbPict) {
          const pictImage = parseVmlPicture(fbPict, relationships, baseDir);
          if (pictImage) image = pictImage;
          else textBox = parseVmlTextBox(fbPict) ?? textBox;
        }
      }
    }
  }

  let unsupportedImageFormat: string | undefined;
  if (image?.path) {
    const ext = image.path.slice(image.path.lastIndexOf('.') + 1).toLowerCase();
    if (ext === 'emf' || ext === 'wmf') {
      unsupportedImageFormat = ext.toUpperCase();
      if (warnings && !warnings.includes('OFFICE_VECTOR_IMAGE_UNSUPPORTED')) {
        warnings.push('OFFICE_VECTOR_IMAGE_UNSUPPORTED');
      }
    }
  }

  if (parts.length === 0 && !image && !videoUrl && !textBox && !pageBreak && !group && !smartArt && !chart && !noteRef) return null;
  const size = attr(findChild(rPr, 'w:sz'), 'w:val');
  const colorNode = findChild(rPr, 'w:color');
  const colorVal = attr(colorNode, 'w:val');
  const color = colorVal && colorVal !== 'auto'
    ? `#${colorVal.replace(/^#/, '')}`
    : resolveThemeColor(theme, attr(colorNode, 'w:themeColor'), attr(colorNode, 'w:themeTint'), attr(colorNode, 'w:themeShade'))
      ?? charStyle.color;
  const shdNode = findChild(rPr, 'w:shd');
  const shdVal = attr(shdNode, 'w:fill');
  const shading = shdVal && shdVal !== 'auto'
    ? `#${shdVal.replace(/^#/, '')}`
    : resolveThemeColor(theme, attr(shdNode, 'w:themeFill'), attr(shdNode, 'w:themeFillTint'), attr(shdNode, 'w:themeFillShade'))
      ?? charStyle.shading;
  const highlight = attr(findChild(rPr, 'w:highlight'), 'w:val');
  const uNode = findChild(rPr, 'w:u');
  const uVal = attr(uNode, 'w:val');
  const underline = uNode
    ? (uVal ? uVal !== 'none' && uVal !== '0' && uVal !== 'false' : true)
    : charStyle.underline;
  const underlineStyle: WordRun['underlineStyle'] = underline && uVal
    ? (uVal === 'double' ? 'double' : uVal === 'dotted' ? 'dotted' : uVal === 'dash' || uVal === 'dashed' ? 'dashed' : uVal === 'wave' ? 'wavy' : 'single')
    : undefined;
  const rFonts = findChild(rPr, 'w:rFonts');
  const font = attr(rFonts, 'w:ascii')
    ?? attr(rFonts, 'w:hAnsi')
    ?? resolveThemeFont(theme, attr(rFonts, 'w:asciiTheme') ?? attr(rFonts, 'w:hAnsiTheme'))
    ?? attr(rFonts, 'w:cs')
    ?? charStyle.fontFamily;
  const float = parseWordFloat(node);

  return {
    text: parts.join(''),
    bold: readTriToggle(rPr, 'w:b') ?? charStyle.bold,
    italic: readTriToggle(rPr, 'w:i') ?? charStyle.italic,
    underline,
    underlineStyle,
    strike: readTriToggle(rPr, 'w:strike') ?? charStyle.strike,
    caps: readTriToggle(rPr, 'w:caps') ?? charStyle.caps,
    smallCaps: readTriToggle(rPr, 'w:smallCaps') ?? charStyle.smallCaps,
    vertAlign: (() => {
      const value = attr(findChild(rPr, 'w:vertAlign'), 'w:val');
      return value === 'superscript' || value === 'subscript' ? value : undefined;
    })(),
    color,
    shading,
    sizePt: size ? Number(size) / 2 : charStyle.fontSizePt,
    font,
    highlight: highlight ?? undefined,
    imagePath: image?.path,
    imageWidth: image?.width,
    imageHeight: image?.height,
    unsupportedImageFormat,
    alt: image?.alt ?? (textBox ? attr(descendants(node, 'wp:docPr')[0] ?? null, 'descr') : undefined),
    videoUrl,
    link,
    textBox,
    chart,
    noteRef,
    group,
    smartArt,
    pageBreak: pageBreak || undefined,
    float,
    rotate: float?.rotate,
    xmlNode: node,
  };
}

function parseGroup(drawing: XmlNode, relationships: Map<string, string>, baseDir = 'word'): WordRun['group'] {
  const wgp = descendants(drawing, 'wpg:wgp')[0];
  if (!wgp) return undefined;
  const grpPr = descendants(wgp, 'wpg:grpSpPr')[0];
  const grpXfrm = grpPr ? descendants(grpPr, 'a:xfrm')[0] : undefined;
  const grpExt = grpXfrm ? descendants(grpXfrm, 'a:ext')[0] : undefined;
  const extent = grpExt ?? descendants(drawing, 'wp:extent')[0];
  const width = Math.round(Number(attr(extent ?? null, 'cx') ?? 0) / EMU_PER_PX) || 320;
  const height = Math.round(Number(attr(extent ?? null, 'cy') ?? 0) / EMU_PER_PX) || 120;
  const children: WordRun[] = [];
  for (const child of wgp.children) {
    if (child.name === 'wps:wsp') {
      const textBox = parseShapeNode(child);
      if (!textBox) continue;
      children.push({
        text: '',
        textBox,
        groupOffset: parseChildOffset(child, 'wps:spPr'),
        rotate: parseChildRotation(child, 'wps:spPr'),
        xmlNode: child,
      });
    } else if (child.name === 'pic:pic') {
      const picture = parsePictureNode(child, relationships, baseDir);
      if (!picture) continue;
      children.push({
        text: '',
        ...picture,
        groupOffset: parseChildOffset(child, 'pic:spPr'),
        rotate: parseChildRotation(child, 'pic:spPr'),
        xmlNode: child,
      });
    }
  }
  return { width, height, children };
}

function extractTxBxText(content: XmlNode | undefined): string {
  if (!content) return '';
  const paragraphs = findChildren(content, 'w:p');
  if (!paragraphs.length) return descendants(content, 'w:t').map((node) => node.text).join('');
  return paragraphs.map((p) => descendants(p, 'w:t').map((node) => node.text).join('')).join('\n');
}

function parseShapeNode(wsp: XmlNode): WordRun['textBox'] {
  const content = descendants(wsp, 'w:txbxContent')[0];
  const geom = descendants(wsp, 'a:prstGeom')[0];
  const text = extractTxBxText(content);
  const xfrm = descendants(findChild(wsp, 'wps:spPr'), 'a:xfrm')[0];
  const extent = xfrm ? descendants(xfrm, 'a:ext')[0] : undefined;
  const width = Math.round(Number(attr(extent ?? null, 'cx') ?? 0) / EMU_PER_PX) || 320;
  const height = Math.round(Number(attr(extent ?? null, 'cy') ?? 0) / EMU_PER_PX) || 120;
  const fillNode = descendants(findChild(wsp, 'wps:spPr'), 'a:srgbClr')[0];
  const fill = attr(fillNode ?? null, 'val');
  const line = findChild(findChild(wsp, 'wps:spPr'), 'a:ln');
  const outlineNode = line ? descendants(line, 'a:srgbClr')[0] : undefined;
  const outline = attr(outlineNode ?? null, 'val');
  return {
    text, width, height, shape: attr(geom ?? null, 'prst') ?? undefined,
    fill: fill ? `#${fill}` : undefined, outline: outline ? `#${outline}` : undefined,
  };
}

function parsePictureNode(pic: XmlNode, relationships: Map<string, string>, baseDir = 'word'): Pick<WordRun, 'imagePath' | 'imageWidth' | 'imageHeight' | 'alt'> | null {
  const blip = descendants(pic, 'a:blip')[0];
  const relId = attr(blip ?? null, 'r:embed');
  const target = relId ? relationships.get(relId) : undefined;
  if (!target) return null;
  const xfrm = descendants(findChild(pic, 'pic:spPr'), 'a:xfrm')[0];
  const extent = xfrm ? descendants(xfrm, 'a:ext')[0] : undefined;
  const docPr = descendants(pic, 'pic:cNvPr')[0];
  return {
    imagePath: normalizeMediaTarget(target, baseDir),
    imageWidth: Math.round(Number(attr(extent ?? null, 'cx') ?? 0) / EMU_PER_PX) || undefined,
    imageHeight: Math.round(Number(attr(extent ?? null, 'cy') ?? 0) / EMU_PER_PX) || undefined,
    alt: attr(docPr ?? null, 'descr') ?? attr(docPr ?? null, 'title') ?? undefined,
  };
}

function parseChildOffset(node: XmlNode, shapeProperties: string): { x: number; y: number } | undefined {
  const xfrm = descendants(findChild(node, shapeProperties), 'a:xfrm')[0];
  const offset = xfrm ? descendants(xfrm, 'a:off')[0] : undefined;
  if (!offset) return undefined;
  return {
    x: Math.round(Number(attr(offset ?? null, 'x') ?? 0) / EMU_PER_PX),
    y: Math.round(Number(attr(offset ?? null, 'y') ?? 0) / EMU_PER_PX),
  };
}

function parseChildRotation(node: XmlNode, shapeProperties: string): number | undefined {
  const xfrm = descendants(findChild(node, shapeProperties), 'a:xfrm')[0];
  const value = Number(attr(xfrm ?? null, 'rot') ?? 0);
  return Number.isFinite(value) && value !== 0 ? Math.round(value / 60000) : undefined;
}

function parseWordFloat(node: XmlNode): WordRun['float'] {
  const anchor = descendants(node, 'wp:anchor')[0];
  if (!anchor) return undefined;
  const posH = descendants(anchor, 'wp:positionH')[0];
  const posV = descendants(anchor, 'wp:positionV')[0];
  const offset = (position: XmlNode | undefined): number => {
    const value = descendants(position ?? null, 'wp:posOffset')[0];
    return value ? Math.round(Number(value.text) / EMU_PER_PX) : 0;
  };
  const wrapNode = ['wp:wrapSquare', 'wp:wrapTight', 'wp:wrapThrough', 'wp:wrapTopAndBottom']
    .map((name) => ({ name, node: descendants(anchor, name)[0] }))
    .find((item) => Boolean(item.node));
  const behind = attr(anchor, 'behindDoc') === '1';
  const wrap = wrapNode
    ? (wrapNode.name.replace('wp:wrap', '').toLowerCase() === 'topandbottom'
      ? 'topAndBottom'
      : wrapNode.name.replace('wp:wrap', '').toLowerCase() as NonNullable<WordRun['float']>['wrap'])
    : behind ? 'behind' : 'front';
  const xfrm = descendants(node, 'a:xfrm')[0];
  const rot = Number(attr(xfrm, 'rot') ?? 0) / 60000;
  return {
    x: offset(posH),
    y: offset(posV),
    wrap,
    z: Number(attr(anchor, 'relativeHeight') ?? 0) || 0,
    rotate: Number.isFinite(rot) ? rot : 0,
    hidden: attr(anchor, 'hidden') === '1',
    anchorId: attr(anchor, 'wp14:anchorId') ?? attr(descendants(anchor, 'wp:docPr')[0], 'id') ?? undefined,
  };
}

function parseTextBox(drawing: XmlNode): WordRun['textBox'] {
  const textBox = descendants(drawing, 'wps:wsp')[0];
  if (!textBox) return undefined;
  const content = descendants(drawing, 'w:txbxContent')[0];
  const geom = descendants(drawing, 'a:prstGeom')[0];
  const shape = attr(geom, 'prst') ?? undefined;
  const text = extractTxBxText(content);
  const ext = descendants(drawing, 'wp:extent')[0];
  const width = Math.round(Number(attr(ext, 'cx') ?? 0) / EMU_PER_PX) || 320;
  const height = Math.round(Number(attr(ext, 'cy') ?? 0) / EMU_PER_PX) || 120;
  const fillNode = descendants(findChild(textBox, 'wps:spPr'), 'a:srgbClr')[0];
  const fill = attr(fillNode, 'val');
  const line = findChild(findChild(textBox, 'wps:spPr'), 'a:ln');
  const outlineNode = line ? descendants(line, 'a:srgbClr')[0] : undefined;
  const outline = attr(outlineNode ?? null, 'val');
  return {
    text, width, height, shape,
    fill: fill ? `#${fill}` : undefined, outline: outline ? `#${outline}` : undefined,
  };
}

function parseOnlineVideo(node: XmlNode): string | undefined {
  const video = descendants(node, 'wp15:webVideoPr')[0]
    ?? descendants(node, 'w15:webVideoPr')[0]
    ?? descendants(node, 'a:videoFile')[0];
  return video ? attr(video, 'href') ?? attr(video, 'embeddedUrl') ?? attr(video, 'r:link') : undefined;
}

function parseDrawing(node: XmlNode, relationships: Map<string, string>, baseDir = 'word'): { path: string; width?: number; height?: number; alt?: string } | null {
  const blip = descendants(node, 'a:blip')[0];
  const relId = attr(blip, 'r:embed');
  const target = relId ? relationships.get(relId) : undefined;
  if (!target) return null;
  const extent = descendants(node, 'wp:extent')[0];
  const width = extent ? Math.round(Number(attr(extent, 'cx') ?? 0) / EMU_PER_PX) : undefined;
  const height = extent ? Math.round(Number(attr(extent, 'cy') ?? 0) / EMU_PER_PX) : undefined;
  const docPr = descendants(node, 'wp:docPr')[0];
  return {
    path: normalizeMediaTarget(target, baseDir),
    width: width && width > 0 ? width : undefined,
    height: height && height > 0 ? height : undefined,
    alt: attr(docPr, 'descr') ?? attr(docPr, 'title') ?? undefined,
  };
}

function parseVmlPicture(pict: XmlNode, relationships: Map<string, string>, baseDir = 'word'): { path: string; width?: number; height?: number; alt?: string } | null {
  const imageData = descendants(pict, 'v:imagedata')[0];
  if (!imageData) return null;
  const relId = attr(imageData, 'r:id') ?? attr(imageData, 'o:relid');
  const target = relId ? relationships.get(relId) : undefined;
  if (!target) return null;
  const shape = descendants(pict, 'v:shape')[0] ?? descendants(pict, 'v:rect')[0] ?? null;
  const styleText = attr(shape, 'style') ?? '';
  const widthMatch = /width:\s*([\d.]+)(pt|in|px|cm|mm)/i.exec(styleText);
  const heightMatch = /height:\s*([\d.]+)(pt|in|px|cm|mm)/i.exec(styleText);
  return {
    path: normalizeMediaTarget(target, baseDir),
    width: widthMatch ? cssLengthToPx(Number(widthMatch[1]), widthMatch[2]) : undefined,
    height: heightMatch ? cssLengthToPx(Number(heightMatch[1]), heightMatch[2]) : undefined,
    alt: attr(shape, 'alt') ?? attr(imageData, 'o:title') ?? undefined,
  };
}

function parseVmlTextBox(pict: XmlNode): WordRun['textBox'] | undefined {
  const content = descendants(pict, 'w:txbxContent')[0];
  if (!content) return undefined;
  const text = extractTxBxText(content);
  const shape = descendants(pict, 'v:shape')[0] ?? descendants(pict, 'v:roundrect')[0] ?? descendants(pict, 'v:rect')[0] ?? descendants(pict, 'v:oval')[0] ?? null;
  const styleText = attr(shape, 'style') ?? '';
  const widthMatch = /width:\s*([\d.]+)(pt|in|px|cm|mm)/i.exec(styleText);
  const heightMatch = /height:\s*([\d.]+)(pt|in|px|cm|mm)/i.exec(styleText);
  const fill = attr(shape, 'fillcolor');
  const stroke = attr(shape, 'strokecolor');
  return {
    text,
    width: (widthMatch ? cssLengthToPx(Number(widthMatch[1]), widthMatch[2]) : undefined) ?? 320,
    height: (heightMatch ? cssLengthToPx(Number(heightMatch[1]), heightMatch[2]) : undefined) ?? 120,
    shape: shape?.name === 'v:roundrect' ? 'roundRect' : shape?.name === 'v:oval' ? 'ellipse' : undefined,
    fill: fill && fill !== 'none' ? (fill.startsWith('#') ? fill : `#${fill}`) : undefined,
    outline: stroke && stroke !== 'none' ? (stroke.startsWith('#') ? stroke : `#${stroke}`) : undefined,
  };
}

function cssLengthToPx(value: number, unit: string): number | undefined {
  if (!Number.isFinite(value) || value <= 0) return undefined;
  const lower = unit.toLowerCase();
  if (lower === 'pt') return Math.round((value * 96) / 72);
  if (lower === 'in') return Math.round(value * 96);
  if (lower === 'cm') return Math.round((value * 96) / 2.54);
  if (lower === 'mm') return Math.round((value * 96) / 25.4);
  return Math.round(value);
}

function decodeSymbolChar(fontName: string | undefined, hex: string | undefined): string {
  if (!hex) return '';
  const code = parseInt(hex, 16);
  if (!Number.isFinite(code)) return '';
  const low = code & 0xff;
  const font = (fontName ?? '').toLowerCase();
  if (font.includes('wingdings')) {
    const map: Record<number, string> = {
      0x6c: '●', 0x6d: '○', 0x6e: '■', 0x6f: '□', 0x70: '▪', 0x71: '▫',
      0x76: '❖', 0xa7: '▪', 0xfc: '✓', 0xfd: '✗', 0xfe: '☑', 0xe0: '➔', 0xe8: '➔', 0xd8: '➢',
    };
    if (map[low]) return map[low];
  }
  if (font.includes('symbol')) {
    const map: Record<number, string> = {
      0xb7: '•', 0xb0: '°', 0xb1: '±', 0xb4: '×', 0xb8: '÷',
      0xa3: '≤', 0xb3: '≥', 0xb9: '≠', 0xbb: '≈', 0xab: '↔',
      0xac: '←', 0xad: '↑', 0xae: '→', 0xaf: '↓', 0x61: 'α', 0x62: 'β', 0x64: 'δ', 0x70: 'π', 0x6d: 'μ',
    };
    if (map[low]) return map[low];
  }
  if (code >= 0xf000 && code <= 0xf0ff) return '•';
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

function readRelationships(bytes: Uint8Array | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!bytes) return map;
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  for (const relationship of descendants(root, 'Relationship')) {
    const id = attr(relationship, 'Id');
    const target = attr(relationship, 'Target');
    if (id && target) map.set(id, target);
  }
  return map;
}

function normalizeMediaTarget(target: string, baseDir = 'word'): string {
  const clean = target.replace(/^\.\//, '');
  if (clean.startsWith('/')) return clean.slice(1);
  if (clean.startsWith('../')) return clean.slice(3);
  return clean.startsWith(`${baseDir}/`) || clean.startsWith('word/') ? clean : `${baseDir}/${clean}`;
}

function readTriToggle(parent: XmlNode | null, name: string): boolean | undefined {
  const node = findChild(parent, name);
  if (!node) return undefined;
  const value = attr(node, 'w:val');
  return value !== '0' && value !== 'false';
}

function parseTable(
  node: XmlNode,
  relationships: Map<string, string>,
  entries: Map<string, Uint8Array>,
  numbering: Map<string, 'bullet' | 'number'>,
  styles: WordStyleSheet,
  theme?: ParsedWordTheme,
  baseDir = 'word',
  warnings?: string[],
): { rows: WordParagraph[][][]; nested: WordNestedTable[]; grid?: number[]; rowHeights: number[]; headerRows: number; cellStyles: (WordCellStyle | undefined)[][]; cellSpans: (WordCellSpan | undefined)[][]; align?: 'left' | 'center' | 'right'; widthPct?: number; breakHints: TableBreakHint[]; tableWidthPx?: number; colWidthsPx?: number[]; borderless?: boolean; tableBorders?: WordTableBorders } {
  const rows: WordParagraph[][][] = [];
  const nested: WordNestedTable[] = [];
  const breakHints: TableBreakHint[] = [];
  const rowHeights: number[] = [];
  const cellStyles: (WordCellStyle | undefined)[][] = [];
  const cellSpans = readTableSpans(node);
  let headerRows = 0;
  const tblPr = findChild(node, 'w:tblPr');
  const gridNode = findChild(node, 'w:tblGrid');
  let gridWidths = (gridNode ? findChildren(gridNode, 'w:gridCol') : [])
    .map((column) => Number(attr(column, 'w:w') ?? 0))
    .filter((width) => width > 0);
  if (!gridWidths.length) {
    const firstRow = findChildren(node, 'w:tr')[0];
    if (firstRow) {
      gridWidths = findChildren(firstRow, 'w:tc').map((cell) => {
        const tcW = findChild(findChild(cell, 'w:tcPr'), 'w:tcW');
        const val = Number(attr(tcW, 'w:w') ?? 0);
        const type = attr(tcW, 'w:type') ?? 'dxa';
        if (val <= 0) return 0;
        return type === 'pct' ? Math.round((val / 5000) * 9360) : val;
      }).filter((width) => width > 0);
    }
  }
  const gridTotal = gridWidths.reduce((sum, width) => sum + width, 0);
  const grid = gridWidths.length && gridTotal > 0
    ? gridWidths.map((width) => Math.round((width / gridTotal) * 10000) / 100)
    : undefined;
  const tableStyleId = attr(findChild(tblPr, 'w:tblStyle'), 'w:val');
  const tableStyle = tableStyleId ? resolveTableStyle(styles, tableStyleId) : undefined;
  const tableVisual = tableStyleId ? resolveTableVisual(styles, tableStyleId, theme) : undefined;
  const tblLook = findChild(tblPr, 'w:tblLook');
  const look = {
    firstRow: attr(tblLook, 'w:firstRow') === '1' || attr(tblLook, 'w:val')?.endsWith('20') || true,
    lastRow: attr(tblLook, 'w:lastRow') === '1',
    firstCol: attr(tblLook, 'w:firstColumn') === '1',
    lastCol: attr(tblLook, 'w:lastColumn') === '1',
    hBand: attr(tblLook, 'w:noHBand') !== '1',
    vBand: attr(tblLook, 'w:noVBand') !== '1',
  };
  // Word's default cell margin is 108 twips (0.19 cm) each side and 0 top and
  // bottom; keeping it makes the text column width, and therefore the line
  // breaks inside a cell, identical to Word's.
  const tableMargins = readCellMargins(findChild(tblPr, 'w:tblCellMar'));
  if (tableMargins.left === undefined) tableMargins.left = 7.2;
  if (tableMargins.right === undefined) tableMargins.right = 7.2;
  if (tableMargins.top === undefined) tableMargins.top = 0;
  if (tableMargins.bottom === undefined) tableMargins.bottom = 0;
  const trNodes = findChildren(node, 'w:tr');
  trNodes.forEach((row, rowIndex) => {
    const cells: WordParagraph[][] = [];
    const rowStyles: (WordCellStyle | undefined)[] = [];
    const trPr = findChild(row, 'w:trPr');
    if (rowIndex === headerRows && findChild(trPr, 'w:tblHeader')) headerRows++;
    const heightNode = findChild(trPr, 'w:trHeight');
    const heightTwips = Number(attr(heightNode, 'w:val') ?? 0);
    // w:trHeight is a minimum unless hRule=exact; CSS height on a table row is
    // also a minimum, so both rules map to style.height and rows stop collapsing
    // below the height Word reserved (951 rows in the bid document use atLeast).
    rowHeights.push(heightTwips > 0 ? Math.round((heightTwips / 15) * 100) / 100 : 0);
    const tcNodes = findChildren(row, 'w:tc');
    tcNodes.forEach((cell, cellIndex) => {
      const paragraphs: WordParagraph[] = [];
      const tcPr = findChild(cell, 'w:tcPr');
      const regionStyle = resolveCellTableVisual(tableVisual, look, rowIndex, trNodes.length, cellIndex, tcNodes.length);
      const cellStyle = mergeCellVisual(
        readCellStyle(tcPr ?? { name: 'w:tcPr', attrs: {}, text: '', children: [] }, tableMargins, theme),
        regionStyle,
      );
      rowStyles.push(cellStyle);
      const cellParagraphStyle: ResolvedParagraphStyle | undefined = tableStyle || regionStyle?.bold !== undefined || regionStyle?.color !== undefined
        ? {
          ...(tableStyle ?? {}),
          ...(regionStyle?.bold !== undefined ? { bold: regionStyle.bold } : {}),
          ...(regionStyle?.italic !== undefined ? { italic: regionStyle.italic } : {}),
          ...(regionStyle?.color !== undefined ? { color: regionStyle.color } : {}),
        }
        : undefined;
      for (const child of cell.children) {
        if (child.name === 'w:p') {
          paragraphs.push(parseParagraph(child, relationships, entries, numbering, styles, theme, baseDir, cellParagraphStyle, warnings));
        } else if (child.name === 'w:tbl') {
          const inner = parseTable(child, relationships, entries, numbering, styles, theme, baseDir, warnings);
          nested.push({
            row: rowIndex,
            cell: cellIndex,
            afterParagraph: paragraphs.length,
            rows: inner.rows,
            grid: inner.grid,
            rowHeights: inner.rowHeights,
            headerRows: inner.headerRows,
            cellStyles: inner.cellStyles,
            cellSpans: inner.cellSpans,
            nested: inner.nested,
            tableWidthPx: inner.tableWidthPx,
            colWidthsPx: inner.colWidthsPx,
          });
        }
      }
      let cellCursor = 0;
      for (const paragraph of paragraphs) {
        for (const offset of storedBreakOffsets(paragraph.xmlNode)) {
          breakHints.push({ row: rowIndex, cell: cellIndex, offset: cellCursor + offset });
        }
        cellCursor += paragraph.runs.map((run) => run.text).join('').length + 1;
      }
      cells.push(paragraphs.length ? paragraphs : [{ runs: [] }]);
    });
    rows.push(cells);
    cellStyles.push(rowStyles);
  });
  const layout = readTableLayout(node);
  // Word lays a table out on the grid it stored, even when the table is wider
  // than the text column (wide schedules overflow the right margin). Rendering
  // the authored twips keeps cell line breaks identical to Word's.
  const colWidthsPx = gridWidths.length
    ? gridWidths.map((width) => Math.round((width / 15) * 100) / 100)
    : undefined;
  const tableWidthPx = colWidthsPx?.length
    ? Math.round(colWidthsPx.reduce((sum, width) => sum + width, 0) * 100) / 100
    : layout.widthTwips
      ? Math.round((layout.widthTwips / 15) * 100) / 100
      : undefined;
  const directBorders = findChild(tblPr, 'w:tblBorders');
  const tableBorders = readTableBordersNode(directBorders, theme) ?? tableVisual?.tableBorders;
  const borderTopVal = attr(findChild(directBorders, 'w:top'), 'w:val');
  const borderless = (borderTopVal === 'nil' || borderTopVal === 'none')
    || (!directBorders && tableBorders?.top === 'none' && tableBorders?.insideH === 'none')
    ? true
    : undefined;
  return {
    rows, nested, grid, rowHeights, headerRows, cellStyles, cellSpans,
    align: layout.align, widthPct: layout.widthPct, breakHints,
    tableWidthPx, colWidthsPx,
    borderless,
    tableBorders,
  };
}

function resolveCellTableVisual(
  visual: TableVisualDefinition | undefined,
  look: { firstRow: boolean; lastRow: boolean; firstCol: boolean; lastCol: boolean; hBand: boolean; vBand: boolean },
  rowIndex: number,
  rowCount: number,
  cellIndex: number,
  colCount: number,
): { fill?: string; color?: string; bold?: boolean; italic?: boolean; borders?: Partial<WordCellStyle> } | undefined {
  if (!visual) return undefined;
  const merged: { fill?: string; color?: string; bold?: boolean; italic?: boolean; borders?: Partial<WordCellStyle> } = {};
  if (visual.cellFill) merged.fill = visual.cellFill;
  const applyRegion = (key: 'firstRow' | 'lastRow' | 'firstCol' | 'lastCol' | 'band1Horz' | 'band1Vert') => {
    const reg = visual.regions[key];
    if (!reg) return;
    if (reg.fill) merged.fill = reg.fill;
    if (reg.color) merged.color = reg.color;
    if (reg.bold !== undefined) merged.bold = reg.bold;
    if (reg.italic !== undefined) merged.italic = reg.italic;
    if (reg.borders) merged.borders = { ...(merged.borders ?? {}), ...reg.borders };
  };
  if (look.hBand && rowIndex % 2 === 1) applyRegion('band1Horz');
  if (look.vBand && cellIndex % 2 === 1) applyRegion('band1Vert');
  if (look.firstCol && cellIndex === 0) applyRegion('firstCol');
  if (look.lastCol && cellIndex === colCount - 1) applyRegion('lastCol');
  if (look.firstRow && rowIndex === 0) applyRegion('firstRow');
  if (look.lastRow && rowIndex === rowCount - 1) applyRegion('lastRow');
  return Object.keys(merged).length ? merged : undefined;
}

function mergeCellVisual(
  direct: WordCellStyle | undefined,
  region: { fill?: string; borders?: Partial<WordCellStyle> } | undefined,
): WordCellStyle | undefined {
  if (!region) return direct;
  const result: WordCellStyle = { ...(direct ?? {}) };
  if (!result.fill && region.fill) result.fill = region.fill;
  if (region.borders) {
    if (result.borderTop === undefined && region.borders.borderTop !== undefined) result.borderTop = region.borders.borderTop;
    if (result.borderBottom === undefined && region.borders.borderBottom !== undefined) result.borderBottom = region.borders.borderBottom;
    if (result.borderLeft === undefined && region.borders.borderLeft !== undefined) result.borderLeft = region.borders.borderLeft;
    if (result.borderRight === undefined && region.borders.borderRight !== undefined) result.borderRight = region.borders.borderRight;
    if (result.borderWidthPx === undefined && region.borders.borderWidthPx !== undefined) result.borderWidthPx = region.borders.borderWidthPx;
    if (result.borderColor === undefined && region.borders.borderColor !== undefined) result.borderColor = region.borders.borderColor;
  }
  return Object.keys(result).length ? result : undefined;
}

/**
 * Reads w:tcPr the way Word draws a cell: shading fill, vertical alignment,
 * per-edge borders (w:val="nil" = no line) and the cell margins that apply.
 */
function readCellStyle(tcPr: XmlNode, tableMargins: CellMargins, theme?: ParsedWordTheme): WordCellStyle | undefined {
  const style: WordCellStyle = {};
  const shdNode = findChild(tcPr, 'w:shd');
  const shade = attr(shdNode, 'w:fill');
  if (shade && shade !== 'auto') {
    style.fill = `#${shade.replace(/^#/, '')}`;
  } else {
    const themeShade = resolveThemeColor(theme, attr(shdNode, 'w:themeFill'), attr(shdNode, 'w:themeFillTint'), attr(shdNode, 'w:themeFillShade'));
    if (themeShade) style.fill = themeShade;
  }
  const valign = attr(findChild(tcPr, 'w:vAlign'), 'w:val');
  if (valign === 'center' || valign === 'bottom') style.valign = valign;
  const borders = findChild(tcPr, 'w:tcBorders');
  if (borders) {
    let width = 0;
    let color: string | undefined;
    for (const edge of ['top', 'left', 'bottom', 'right'] as const) {
      const border = findChild(borders, `w:${edge}`);
      if (!border) continue;
      const value = attr(border, 'w:val') ?? 'single';
      const on = value !== 'nil' && value !== 'none';
      if (edge === 'top') style.borderTop = on;
      else if (edge === 'left') style.borderLeft = on;
      else if (edge === 'bottom') style.borderBottom = on;
      else style.borderRight = on;
      if (!on) continue;
      width = Math.max(width, Number(attr(border, 'w:sz') ?? 4));
      const edgeColor = attr(border, 'w:color');
      if (edgeColor && edgeColor !== 'auto') color = `#${edgeColor.replace(/^#/, '')}`;
      else color = resolveThemeColor(theme, attr(border, 'w:themeColor'), attr(border, 'w:themeTint'), attr(border, 'w:themeShade')) ?? color;
    }
    // w:sz counts 1/8 pt; a 0.5pt rule is the thinnest line a screen draws.
    if (width > 0) style.borderWidthPx = Math.max(1, Math.round(width / 6));
    if (color) style.borderColor = color;
    const diagDown = attr(findChild(borders, 'w:tl2br'), 'w:val');
    const diagUp = attr(findChild(borders, 'w:tr2bl'), 'w:val');
    if (diagDown && diagDown !== 'nil' && diagDown !== 'none') style.diagDown = true;
    if (diagUp && diagUp !== 'nil' && diagUp !== 'none') style.diagUp = true;
  }
  const margins = { ...tableMargins, ...readCellMargins(findChild(tcPr, 'w:tcMar')) };
  if (margins.left !== undefined) style.padLeftPx = margins.left;
  if (margins.right !== undefined) style.padRightPx = margins.right;
  if (margins.top !== undefined) style.padTopPx = margins.top;
  if (margins.bottom !== undefined) style.padBottomPx = margins.bottom;
  return Object.keys(style).length ? style : undefined;
}

interface CellMargins { left?: number; right?: number; top?: number; bottom?: number }
/** twips -> px (1/15 px per twip); Word writes w:w for margins and w:val for older files. */
function readCellMargins(node: XmlNode | null): CellMargins {
  if (!node) return {};
  const margins: CellMargins = {};
  for (const edge of ['left', 'right', 'top', 'bottom'] as const) {
    const alias = edge === 'left' ? 'start' : edge === 'right' ? 'end' : edge;
    const value = findChild(node, `w:${edge}`) ?? findChild(node, `w:${alias}`);
    if (!value) continue;
    const twips = Number(attr(value, 'w:w') ?? attr(value, 'w:val') ?? 0);
    margins[edge] = Math.round((twips / 15) * 100) / 100;
  }
  return margins;
}

function countWords(paragraph: WordParagraph): number {
  const text = paragraph.runs.map((run) => run.text).join(' ').trim();
  return text ? text.split(/\s+/).length : 0;
}

/** Tag each block with the section it belongs to, using paragraph-level sectPr breaks. */
function assignSectionIndexes(document: WordDocument): void {
  const count = document.sections?.length ?? 0;
  if (count <= 1) {
    for (const block of document.blocks) block.sectionIndex = 0;
    return;
  }
  let index = 0;
  for (const block of document.blocks) {
    block.sectionIndex = Math.min(index, count - 1);
    if (block.kind === 'paragraph' && block.paragraph.sectionBreakAfter) {
      index = Math.min(index + 1, count - 1);
    }
  }
}

function readPageSize(_bytes: Uint8Array | undefined, body: XmlNode | null): { width: number; height: number } {
  const sectPr = body ? findChild(body, 'w:sectPr') : null;
  const pgSz = findChild(sectPr, 'w:pgSz');
  const widthTwip = Number(attr(pgSz, 'w:w') ?? 12240);
  const heightTwip = Number(attr(pgSz, 'w:h') ?? 15840);
  return {
    width: Math.round((widthTwip / 1440) * 96),
    height: Math.round((heightTwip / 1440) * 96),
  };
}

function readPageMargins(body: XmlNode | null): { top: number; bottom: number; left: number; right: number } {
  const sectPr = body ? findChild(body, 'w:sectPr') : null;
  const pgMar = findChild(sectPr, 'w:pgMar');
  const toPx = (twips: string | undefined, fallbackPx: number): number =>
    twips !== undefined ? Math.round((Number(twips) / 20) * (96 / 72) * 10) / 10 : fallbackPx;
  return {
    top: toPx(attr(pgMar, 'w:top'), 96),
    bottom: toPx(attr(pgMar, 'w:bottom'), 96),
    left: toPx(attr(pgMar, 'w:left'), 96),
    right: toPx(attr(pgMar, 'w:right'), 96),
  };
}

export function emuToPx(value: number): number {
  return Math.round(value / EMU_PER_PX);
}
