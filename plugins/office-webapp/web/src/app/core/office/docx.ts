import { attr, descendants, findChild, findChildren, parseXml, textOf, type XmlNode } from '../binary/xml';
import { readZip } from '../binary/zip';
import { parseWordComments } from './comments';
import { parseSections } from './word-section';
import { parseWordNotes } from './word-notes';
import { parseCitationSources } from './word-citations';
import { parseEquations } from './word-equation';
import { parseInkStrokes } from './word-ink';
import { parseNumbering } from './word-format';
import { parseWordStyles, resolveParagraphStyle, resolveTableStyle, type ResolvedParagraphStyle, type WordStyleSheet } from './word-styles';
import { watermarkText } from './word-extra';
import { parseProtection } from './word-protect';
import { parseStyleSet, parseWordTheme } from './word-theme';
import { readTableLayout, readTableSpans } from './word-tables';
import type { WordBlock, WordCellSpan, WordCellStyle, WordDocument, WordNestedTable, WordParagraph, WordRun } from './types';

const EMU_PER_PX = 9525;

export async function parseDocx(buffer: ArrayBuffer | Uint8Array): Promise<WordDocument> {
  const zip = await readZip(buffer);
  const documentBytes = zip.entries.get('word/document.xml');
  if (!documentBytes) {
    throw new Error('OFFICE_DOCX_PARSE_FAILED');
  }
  const doc = parseXml(new TextDecoder('utf-8').decode(documentBytes));
  const documentNode = findChild(doc, 'w:document') ?? doc;
  const background = findChild(documentNode, 'w:background');
  const pageColor = attr(background, 'w:color') ? `#${attr(background, 'w:color')!.replace(/^#/, '')}` : undefined;
  const blocks = parseWordBlocks(documentNode, zip.entries);
  const warnings: string[] = [];
  const body = findChild(documentNode, 'w:body');
  const pageSize = readPageSize(zip.entries.get('word/document.xml'), body);
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

  if (!zip.entries.has('word/styles.xml')) warnings.push('STYLES_MISSING');
  const appBytes = zip.entries.get('docProps/app.xml');
  const appPagesMatch = appBytes ? /<Pages>(\d+)<\/Pages>/.exec(new TextDecoder('utf-8').decode(appBytes)) : null;
  const appPages = appPagesMatch ? Number(appPagesMatch[1]) : undefined;
  const document: WordDocument = { blocks, wordCount, pageSize, pageMargins, appPages, warnings, xmlRoot: documentNode, pageColor };
  document.comments = parseWordComments(zip.entries, document);
  document.sections = parseSections(document, zip.entries);
  assignSectionIndexes(document);
  document.watermark = watermarkText(document);
  document.protected = parseProtection(zip.entries);
  document.theme = parseWordTheme(zip.entries);
  document.styleSet = parseStyleSet(zip.entries);
  document.notes = parseWordNotes(document, zip.entries);
  document.sources = parseCitationSources(zip.entries, document);
  document.equations = parseEquations(document);
  document.inkStrokes = parseInkStrokes(zip.entries, document);
  document.packageEntries = zip.entries;
  return document;
}

export function parseWordBlocks(documentNode: XmlNode, entries: Map<string, Uint8Array>): WordBlock[] {
  const root = findChild(documentNode, 'w:document') ?? documentNode;
  const body = findChild(root, 'w:body');
  const relationships = readRelationships(entries.get('word/_rels/document.xml.rels'));
  const numbering = parseNumbering(entries);
  const styles = parseWordStyles(entries);
  const blocks: WordBlock[] = [];
  const append = (child: XmlNode): void => {
    if (child.name === 'w:p') {
      blocks.push({ kind: 'paragraph', paragraph: parseParagraph(child, relationships, numbering, styles) });
    } else if (child.name === 'w:tbl') {
      const parsed = parseTable(child, relationships, numbering, styles);
      blocks.push({ kind: 'table', rows: parsed.rows, nested: parsed.nested, grid: parsed.grid, rowHeights: parsed.rowHeights, headerRows: parsed.headerRows || undefined, cellStyles: parsed.cellStyles, cellSpans: parsed.cellSpans, align: parsed.align, widthPct: parsed.widthPct, xmlNode: child });
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
  return blocks;
}

function parseParagraph(
  node: XmlNode,
  relationships: Map<string, string>,
  numbering: Map<string, 'bullet' | 'number'>,
  styles: WordStyleSheet,
  tableStyle?: ResolvedParagraphStyle,
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
  const headingLevel = headingMatch ? Number(headingMatch[1]) : undefined;
  const indent = Number(attr(findChild(pPr, 'w:ind'), 'w:left') ?? 0) || resolved.indentTwips || undefined;
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
  const numId = attr(findChild(findChild(pPr, 'w:numPr'), 'w:numId'), 'w:val');
  const listType = numId ? numbering.get(numId) : undefined;
  const shadingFill = attr(findChild(pPr, 'w:shd'), 'w:fill');
  const borders = Boolean(findChild(pPr, 'w:pBdr'));
  const sectionProperties = findChild(pPr, 'w:sectPr');
  const sectionType = attr(sectionProperties, 'w:type') ?? 'nextPage';
  const sectionBreakAfter = Boolean(sectionProperties) && sectionType !== 'continuous';

  const runs: WordRun[] = [];
  type FieldState = { kind: 'merge' | 'next' | 'xe' | 'other'; name: string; collecting: boolean; buffer: WordRun[] };
  let field: FieldState | null = null;
  const collect = (container: XmlNode, inheritedLink?: string): void => {
    for (const child of container.children) {
      if (child.name === 'w:r') {
        const hasText = Boolean(findChild(child, 'w:t') || findChild(child, 'w:tab') || findChild(child, 'w:br'));
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
            const run = parseRun(child, relationships, inheritedLink);
            if (run) field.buffer.push(run);
          }
          continue;
        }
        if (field?.collecting) {
          const run = parseRun(child, relationships, inheritedLink);
          if (run) field.buffer.push(run);
          continue;
        }
        const run = parseRun(child, relationships, inheritedLink);
        if (run) runs.push(run);
      } else if (child.name === 'w:hyperlink') {
        const relId = attr(child, 'r:id');
        const anchor = attr(child, 'w:anchor');
        const link = relId ? relationships.get(relId) : anchor ? `#${anchor}` : inheritedLink;
        for (const runNode of findChildren(child, 'w:r')) {
          const run = parseRun(runNode, relationships, link);
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
  return {
    style, headingLevel, align, indent, lineSpacing, lineHeightPx,
    fontSizePt: resolved.fontSizePt, fontFamily: resolved.fontFamily,
    spaceBeforePx, spaceAfterPx,
    listType, shading: shadingFill ? `#${shadingFill}` : undefined, borders: borders || undefined,
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

function parseRun(node: XmlNode, relationships: Map<string, string>, link?: string): WordRun | null {  const rPr = findChild(node, 'w:rPr');
  const parts: string[] = [];
  let image: { path: string; width?: number; height?: number; alt?: string } | null = null;
  let videoUrl: string | undefined;
  let textBox: WordRun['textBox'];
  let group: WordRun['group'];
  let pageBreak = false;
  for (const child of node.children) {
    if (child.name === 'w:t') parts.push(textOf(child));
    else if (child.name === 'w:tab') parts.push('\t');
    else if (child.name === 'w:br') {
      if (attr(child, 'w:type') === 'page') pageBreak = true;
      else parts.push('\n');
    } else if (child.name === 'w:drawing') {
      group = parseGroup(child, relationships);
      if (group) {
        textBox = undefined;
        image = null;
      } else {
        image = parseDrawing(child, relationships);
        textBox = parseTextBox(child);
      }
      videoUrl = parseOnlineVideo(child);
    }
  }
  if (parts.length === 0 && !image && !videoUrl && !textBox && !pageBreak && !group) return null;
  const size = attr(findChild(rPr, 'w:sz'), 'w:val');
  const color = attr(findChild(rPr, 'w:color'), 'w:val');
  const highlight = attr(findChild(rPr, 'w:highlight'), 'w:val');
  const float = parseWordFloat(node);
  return {
    text: parts.join(''),
    bold: hasToggle(rPr, 'w:b'),
    italic: hasToggle(rPr, 'w:i'),
    underline: hasToggle(rPr, 'w:u') || Boolean(attr(findChild(rPr, 'w:u'), 'w:val')),
    strike: hasToggle(rPr, 'w:strike'),
    color: color ? `#${color}` : undefined,
    sizePt: size ? Number(size) / 2 : undefined,
    font: attr(findChild(rPr, 'w:rFonts'), 'w:ascii'),
    highlight: highlight ?? undefined,
    imagePath: image?.path,
    imageWidth: image?.width,
    imageHeight: image?.height,
    alt: image?.alt,
    videoUrl,
    link,
    textBox,
    group,
    pageBreak: pageBreak || undefined,
    float,
    rotate: float?.rotate,
    xmlNode: node,
  };
}

function parseGroup(drawing: XmlNode, relationships: Map<string, string>): WordRun['group'] {
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
      const picture = parsePictureNode(child, relationships);
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

function parseShapeNode(wsp: XmlNode): WordRun['textBox'] {
  const content = descendants(wsp, 'w:txbxContent')[0];
  const geom = descendants(wsp, 'a:prstGeom')[0];
  const text = content ? descendants(content, 'w:t').map((node) => node.text).join('') : '';
  const xfrm = descendants(findChild(wsp, 'wps:spPr'), 'a:xfrm')[0];
  const extent = xfrm ? descendants(xfrm, 'a:ext')[0] : undefined;
  const width = Math.round(Number(attr(extent ?? null, 'cx') ?? 0) / EMU_PER_PX) || 320;
  const height = Math.round(Number(attr(extent ?? null, 'cy') ?? 0) / EMU_PER_PX) || 120;
  const fillNode = descendants(findChild(wsp, 'wps:spPr'), 'a:srgbClr')[0];
  const fill = attr(fillNode ?? null, 'val');
  return { text, width, height, shape: attr(geom ?? null, 'prst') ?? undefined, fill: fill ? `#${fill}` : undefined };
}

function parsePictureNode(pic: XmlNode, relationships: Map<string, string>): Pick<WordRun, 'imagePath' | 'imageWidth' | 'imageHeight' | 'alt'> | null {
  const blip = descendants(pic, 'a:blip')[0];
  const relId = attr(blip ?? null, 'r:embed');
  const target = relId ? relationships.get(relId) : undefined;
  if (!target) return null;
  const xfrm = descendants(findChild(pic, 'pic:spPr'), 'a:xfrm')[0];
  const extent = xfrm ? descendants(xfrm, 'a:ext')[0] : undefined;
  const docPr = descendants(pic, 'pic:cNvPr')[0];
  return {
    imagePath: normalizeMediaTarget(target),
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
  const text = content ? descendants(content, 'w:t').map((node) => node.text).join('') : '';
  const ext = descendants(drawing, 'wp:extent')[0];
  const width = Math.round(Number(attr(ext, 'cx') ?? 0) / EMU_PER_PX) || 320;
  const height = Math.round(Number(attr(ext, 'cy') ?? 0) / EMU_PER_PX) || 120;
  const fillNode = descendants(findChild(textBox, 'wps:spPr'), 'a:srgbClr')[0];
  const fill = attr(fillNode, 'val');
  return { text, width, height, shape, fill: fill ? `#${fill}` : undefined };
}

function parseOnlineVideo(node: XmlNode): string | undefined {
  const video = descendants(node, 'wp15:webVideoPr')[0]
    ?? descendants(node, 'w15:webVideoPr')[0]
    ?? descendants(node, 'a:videoFile')[0];
  return video ? attr(video, 'href') ?? attr(video, 'embeddedUrl') ?? attr(video, 'r:link') : undefined;
}

function parseDrawing(node: XmlNode, relationships: Map<string, string>): { path: string; width?: number; height?: number; alt?: string } | null {
  const blip = descendants(node, 'a:blip')[0];
  const relId = attr(blip, 'r:embed');
  const target = relId ? relationships.get(relId) : undefined;
  if (!target) return null;
  const extent = descendants(node, 'wp:extent')[0];
  const width = extent ? Math.round(Number(attr(extent, 'cx') ?? 0) / EMU_PER_PX) : undefined;
  const height = extent ? Math.round(Number(attr(extent, 'cy') ?? 0) / EMU_PER_PX) : undefined;
  const docPr = descendants(node, 'wp:docPr')[0];
  return {
    path: normalizeMediaTarget(target),
    width: width && width > 0 ? width : undefined,
    height: height && height > 0 ? height : undefined,
    alt: attr(docPr, 'descr') ?? attr(docPr, 'title') ?? undefined,
  };
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

function normalizeMediaTarget(target: string): string {
  const clean = target.replace(/^\.\//, '');
  if (clean.startsWith('/')) return clean.slice(1);
  return clean.startsWith('word/') ? clean : `word/${clean}`;
}

function hasToggle(parent: XmlNode | null, name: string): boolean {
  const node = findChild(parent, name);
  if (!node) return false;
  const value = attr(node, 'w:val');
  return value !== '0' && value !== 'false';
}

function parseTable(
  node: XmlNode,
  relationships: Map<string, string>,
  numbering: Map<string, 'bullet' | 'number'>,
  styles: WordStyleSheet,
): { rows: WordParagraph[][][]; nested: WordNestedTable[]; grid?: number[]; rowHeights: number[]; headerRows: number; cellStyles: (WordCellStyle | undefined)[][]; cellSpans: (WordCellSpan | undefined)[][]; align?: 'left' | 'center' | 'right'; widthPct?: number } {
  const rows: WordParagraph[][][] = [];
  const nested: WordNestedTable[] = [];
  const rowHeights: number[] = [];
  const cellStyles: (WordCellStyle | undefined)[][] = [];
  const cellSpans = readTableSpans(node);
  let headerRows = 0;
  const gridNode = findChild(node, 'w:tblGrid');
  const gridWidths = (gridNode ? findChildren(gridNode, 'w:gridCol') : [])
    .map((column) => Number(attr(column, 'w:w') ?? 0))
    .filter((width) => width > 0);
  const gridTotal = gridWidths.reduce((sum, width) => sum + width, 0);
  const grid = gridWidths.length && gridTotal > 0
    ? gridWidths.map((width) => Math.round((width / gridTotal) * 10000) / 100)
    : undefined;
  const tableStyleId = attr(findChild(findChild(node, 'w:tblPr'), 'w:tblStyle'), 'w:val');
  const tableStyle = tableStyleId ? resolveTableStyle(styles, tableStyleId) : undefined;
  // Word's own default (w:tblCellMar absent) is 108 twips each side; the sheet
  // keeps its calibrated 6px instead so the 546-page pagination stays put.
  const tableMargins = readCellMargins(findChild(findChild(node, 'w:tblPr'), 'w:tblCellMar'));
  findChildren(node, 'w:tr').forEach((row, rowIndex) => {
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
    findChildren(row, 'w:tc').forEach((cell, cellIndex) => {
      const paragraphs: WordParagraph[] = [];
      const tcPr = findChild(cell, 'w:tcPr');
      rowStyles.push(tcPr ? readCellStyle(tcPr, tableMargins) : undefined);
      for (const child of cell.children) {
        if (child.name === 'w:p') {
          paragraphs.push(parseParagraph(child, relationships, numbering, styles, tableStyle));
        } else if (child.name === 'w:tbl') {
          const inner = parseTable(child, relationships, numbering, styles);
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
          });
        }
      }
      cells.push(paragraphs.length ? paragraphs : [{ runs: [] }]);
    });
    rows.push(cells);
    cellStyles.push(rowStyles);
  });
  const layout = readTableLayout(node);
  return { rows, nested, grid, rowHeights, headerRows, cellStyles, cellSpans, align: layout.align, widthPct: layout.widthPct };
}

/**
 * Reads w:tcPr the way Word draws a cell: shading fill, vertical alignment,
 * per-edge borders (w:val="nil" = no line) and the cell margins that apply.
 */
function readCellStyle(tcPr: XmlNode, tableMargins: CellMargins): WordCellStyle | undefined {
  const style: WordCellStyle = {};
  const shade = attr(findChild(tcPr, 'w:shd'), 'w:fill');
  if (shade && shade !== 'auto') style.fill = `#${shade}`;
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
      if (edgeColor && edgeColor !== 'auto') color = `#${edgeColor}`;
    }
    // w:sz counts 1/8 pt; a 0.5pt rule is the thinnest line a screen draws.
    if (width > 0) style.borderWidthPx = Math.max(1, Math.round(width / 6));
    if (color) style.borderColor = color;
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
