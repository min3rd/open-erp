import { attr, descendants, findChild, findChildren, parseXml, textOf, type XmlNode } from '../binary/xml';
import { findZipEntry, readZip } from '../binary/zip';
import type { WordBlock, WordCellSpan, WordCellStyle, WordDocument, WordParagraph, WordRun } from './types';
import type { WordNote } from './word-notes';
import { buildSyntheticWordPackage } from './word-synthetic';

interface OdtStyleDef {
  parent?: string;
  align?: WordParagraph['align'];
  indentTwips?: number;
  indentRightTwips?: number;
  firstLineTwips?: number;
  spaceBeforePx?: number;
  spaceAfterPx?: number;
  lineSpacing?: number;
  pageBreakBefore?: boolean;
  shading?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  caps?: boolean;
  smallCaps?: boolean;
  color?: string;
  runShading?: string;
  sizePt?: number;
  font?: string;
  vertAlign?: 'superscript' | 'subscript';
  colWidthPx?: number;
  cellStyle?: WordCellStyle;
}

/**
 * Pure TypeScript OpenDocument Text (`.odt`) reader supporting `styles.xml`,
 * `content.xml`, headings, multi-level bullet/numbered lists, spans, links,
 * tables with column widths and merged cells, embedded images, headers/footers,
 * and footnotes/endnotes.
 */
export async function parseOdt(buffer: ArrayBuffer | Uint8Array): Promise<WordDocument> {
  const zip = await readZip(buffer);
  const contentEntry = findZipEntry(zip.entries, 'content.xml');
  if (!contentEntry) {
    throw new Error('OFFICE_DOCX_PARSE_FAILED');
  }
  const stylesEntry = findZipEntry(zip.entries, 'styles.xml');
  const contentRoot = parseXml(new TextDecoder('utf-8').decode(contentEntry.data));
  const stylesRoot = stylesEntry ? parseXml(new TextDecoder('utf-8').decode(stylesEntry.data)) : null;

  const styles = new Map<string, OdtStyleDef>();
  const listKinds = new Map<string, 'bullet' | 'number'>();
  let pageSize = { width: 816, height: 1056 };
  let pageMargins = { top: 96, bottom: 96, left: 96, right: 96 };
  let headerText = '';
  let footerText = '';

  const readStyleContainer = (root: XmlNode | null): void => {
    if (!root) return;
    for (const st of descendants(root, 'style:style')) {
      const name = attr(st, 'style:name');
      if (!name) continue;
      styles.set(name, parseOdtStyleNode(st));
    }
    for (const ls of descendants(root, 'text:list-style')) {
      const name = attr(ls, 'style:name');
      if (!name) continue;
      const hasNum = descendants(ls, 'text:list-level-style-number').length > 0;
      listKinds.set(name, hasNum ? 'number' : 'bullet');
    }
    const pageProps = descendants(root, 'style:page-layout-properties')[0];
    if (pageProps) {
      const w = lengthToPx(attr(pageProps, 'fo:page-width'));
      const h = lengthToPx(attr(pageProps, 'fo:page-height'));
      if (w && h) pageSize = { width: Math.round(w), height: Math.round(h) };
      const mt = lengthToPx(attr(pageProps, 'fo:margin-top'));
      const mb = lengthToPx(attr(pageProps, 'fo:margin-bottom'));
      const ml = lengthToPx(attr(pageProps, 'fo:margin-left'));
      const mr = lengthToPx(attr(pageProps, 'fo:margin-right'));
      pageMargins = {
        top: mt ? Math.round(mt) : 96,
        bottom: mb ? Math.round(mb) : 96,
        left: ml ? Math.round(ml) : 96,
        right: mr ? Math.round(mr) : 96,
      };
    }
    const masterPage = descendants(root, 'style:master-page')[0];
    if (masterPage) {
      const hdr = findChild(masterPage, 'style:header');
      const ftr = findChild(masterPage, 'style:footer');
      if (hdr && !headerText) headerText = textOf(hdr).trim();
      if (ftr && !footerText) footerText = textOf(ftr).trim();
    }
  };
  readStyleContainer(stylesRoot);
  readStyleContainer(contentRoot);

  const resolveStyle = (name: string | undefined): OdtStyleDef => {
    const chain: OdtStyleDef[] = [];
    let current = name;
    const seen = new Set<string>();
    while (current && !seen.has(current)) {
      seen.add(current);
      const def = styles.get(current);
      if (!def) break;
      chain.push(def);
      current = def.parent;
    }
    const merged: OdtStyleDef = {};
    for (const def of chain.reverse()) {
      for (const [k, v] of Object.entries(def)) {
        if (v !== undefined && k !== 'parent') (merged as Record<string, unknown>)[k] = v;
      }
    }
    return merged;
  };

  const packageEntries = new Map<string, Uint8Array>();
  const warnings = [...(zip.warnings ?? []), 'OFFICE_LEGACY_FORMAT_READONLY'];
  let mediaIndex = 1;
  const footnotes: WordNote[] = [];
  const endnotes: WordNote[] = [];
  const blocks: WordBlock[] = [];

  const copyPicture = (href: string | undefined): { path: string; unsupported?: string } | null => {
    if (!href) return null;
    const entry = findZipEntry(zip.entries, href);
    if (!entry) return null;
    const extMatch = /\.([a-zA-Z0-9]+)$/.exec(entry.path);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'png';
    if (ext === 'emf' || ext === 'wmf') {
      if (!warnings.includes('OFFICE_VECTOR_IMAGE_UNSUPPORTED')) warnings.push('OFFICE_VECTOR_IMAGE_UNSUPPORTED');
      return { path: `word/media/image${mediaIndex++}.${ext}`, unsupported: ext.toUpperCase() };
    }
    const target = `word/media/image${mediaIndex++}.${ext}`;
    packageEntries.set(target, entry.data);
    return { path: target };
  };

  const collectInline = (
    node: XmlNode,
    inherited: OdtStyleDef,
    link: string | undefined,
    runs: WordRun[],
    blockIndexHint: number,
  ): void => {
    if (node.text) {
      runs.push({
        text: node.text,
        bold: inherited.bold,
        italic: inherited.italic,
        underline: inherited.underline,
        strike: inherited.strike,
        caps: inherited.caps,
        smallCaps: inherited.smallCaps,
        color: inherited.color,
        shading: inherited.runShading,
        sizePt: inherited.sizePt,
        font: inherited.font,
        vertAlign: inherited.vertAlign,
        link,
      });
    }
    for (const child of node.children) {
      if (child.name === 'text:s') {
        const count = Math.max(1, Number(attr(child, 'text:c') ?? 1));
        runs.push({ text: ' '.repeat(count), font: inherited.font, sizePt: inherited.sizePt, link });
      } else if (child.name === 'text:tab') {
        runs.push({ text: '\t', font: inherited.font, sizePt: inherited.sizePt, link });
      } else if (child.name === 'text:line-break') {
        runs.push({ text: '\n', font: inherited.font, sizePt: inherited.sizePt, link });
      } else if (child.name === 'text:span') {
        const spanStyle = resolveStyle(attr(child, 'text:style-name'));
        collectInline(child, mergeOdtStyles(inherited, spanStyle), link, runs, blockIndexHint);
      } else if (child.name === 'text:a') {
        const href = attr(child, 'xlink:href');
        const linkStyle = resolveStyle(attr(child, 'text:style-name'));
        collectInline(child, mergeOdtStyles(inherited, linkStyle), href ?? link, runs, blockIndexHint);
      } else if (child.name === 'draw:frame') {
        const imgNode = findChild(child, 'draw:image');
        const pic = copyPicture(attr(imgNode, 'xlink:href'));
        if (pic) {
          const w = lengthToPx(attr(child, 'svg:width'));
          const h = lengthToPx(attr(child, 'svg:height'));
          const alt = findChild(child, 'svg:title')?.text || findChild(child, 'svg:desc')?.text || undefined;
          runs.push({
            text: '',
            imagePath: pic.path,
            imageWidth: w ? Math.round(w) : 240,
            imageHeight: h ? Math.round(h) : 160,
            unsupportedImageFormat: pic.unsupported,
            alt,
          });
        }
      } else if (child.name === 'text:note') {
        const noteClass = attr(child, 'text:note-class') === 'endnote' ? 'endnote' : 'footnote';
        const body = findChild(child, 'text:note-body');
        const noteText = body ? textOf(body).trim() : '';
        const list = noteClass === 'endnote' ? endnotes : footnotes;
        const id = list.length + 1;
        list.push({ id, kind: noteClass, text: noteText, refParagraph: blockIndexHint, numbering: id });
        runs.push({ text: '', noteRef: { kind: noteClass, id, label: String(id) } });
      } else {
        collectInline(child, inherited, link, runs, blockIndexHint);
      }
      if (child.text && child.name === '#text') {
        // handled via node.text
      }
    }
  };

  // NOTE: Our pure-TS XML parser puts all mixed text on parent.text when there are
  // interleaved children? Wait: in binary/xml.ts, text before/after children is
  // concatenated onto parent.text! To preserve exact text order around inline spans
  // in ODT, let's also support ordered parsing directly from XML string for paragraphs
  // if a paragraph contains mixed text + spans! Let's use an inline token order helper
  // or check how xml.ts stores text: xml.ts appends text before/after children onto
  // `parent.text`! Let's check: if a `<text:p>` has `Hello <text:span>world</text:span>!`,
  // `xml.ts` sets `p.text = "Hello !"`, `span.text = "world"`.
  // Wait — THAT WOULD REORDER `"Hello !"` before `"world"` if we don't parse inline tokens!
  // Let's preserve exact interleaved text order by parsing inline runs cleanly from raw XML
  // or checking if `node.children.length > 0 && node.text.length > 0`!
  // Let's write a clean recursive interleaved inline reader right from `content.xml`
  // OR even better: a lightweight mixed-content XML child walker using exact token slice!
  void collectInline;

  const rawContentXml = new TextDecoder('utf-8').decode(contentEntry.data);
  const inlineSlices = indexParagraphXmlSlices(rawContentXml);

  let pSeq = 0;
  const parseOdtParagraph = (
    pNode: XmlNode,
    listCtx?: { kind: 'bullet' | 'number'; level: number },
  ): WordParagraph => {
    const styleName = attr(pNode, 'text:style-name');
    const resolved = resolveStyle(styleName);
    const isHeading = pNode.name === 'text:h';
    const headingLevel = isHeading ? Math.min(6, Math.max(1, Number(attr(pNode, 'text:outline-level') ?? 1))) : undefined;
    const blockIdx = blocks.length;
    const rawInner = inlineSlices.get(pSeq++);
    const runs: WordRun[] = rawInner !== undefined
      ? parseMixedOdtInline(rawInner, resolved, resolveStyle, copyPicture, footnotes, endnotes, blockIdx)
      : (() => {
        const r: WordRun[] = [];
        collectInline(pNode, resolved, undefined, r, blockIdx);
        return r;
      })();

    return {
      style: headingLevel ? `Heading${headingLevel}` : styleName,
      headingLevel,
      align: resolved.align,
      indent: resolved.indentTwips,
      indentRight: resolved.indentRightTwips,
      firstLineIndent: resolved.firstLineTwips,
      spaceBeforePx: resolved.spaceBeforePx,
      spaceAfterPx: resolved.spaceAfterPx,
      lineSpacing: resolved.lineSpacing,
      pageBreakBefore: resolved.pageBreakBefore || undefined,
      shading: resolved.shading,
      listType: listCtx?.kind,
      listLevel: listCtx ? listCtx.level : undefined,
      runs: runs.length ? runs : [{ text: '' }],
    };
  };

  const walkTextChildren = (container: XmlNode, listDepth = 0, listTypeOverride?: 'bullet' | 'number'): void => {
    for (const child of container.children) {
      if (child.name === 'text:p' || child.name === 'text:h') {
        blocks.push({
          kind: 'paragraph',
          paragraph: parseOdtParagraph(child, listTypeOverride ? { kind: listTypeOverride, level: Math.max(0, listDepth - 1) } : undefined),
        });
      } else if (child.name === 'text:list') {
        const listStyle = attr(child, 'text:style-name');
        const kind = (listStyle ? listKinds.get(listStyle) : undefined) ?? listTypeOverride ?? 'bullet';
        for (const item of findChildren(child, 'text:list-item')) {
          walkTextChildren(item, listDepth + 1, kind);
        }
      } else if (child.name === 'table:table') {
        blocks.push(parseOdtTable(child));
      }
    }
  };

  const parseOdtTable = (tblNode: XmlNode): Extract<WordBlock, { kind: 'table' }> => {
    const colWidthsPx: number[] = [];
    const columnNodes = [
      ...findChildren(tblNode, 'table:table-column'),
      ...findChildren(tblNode, 'table:table-columns').flatMap((grp) => findChildren(grp, 'table:table-column')),
    ];
    for (const col of columnNodes) {
      const repeat = Math.max(1, Number(attr(col, 'table:number-columns-repeated') ?? 1));
      const styleDef = resolveStyle(attr(col, 'table:style-name'));
      const width = styleDef.colWidthPx ?? 120;
      for (let r = 0; r < Math.min(repeat, 64); r++) colWidthsPx.push(width);
    }
    const gridTotal = colWidthsPx.reduce((s, w) => s + w, 0);
    const grid = colWidthsPx.length && gridTotal > 0
      ? colWidthsPx.map((w) => Math.round((w / gridTotal) * 10000) / 100)
      : undefined;

    const rows: WordParagraph[][][] = [];
    const cellStyles: (WordCellStyle | undefined)[][] = [];
    const cellSpans: (WordCellSpan | undefined)[][] = [];
    let headerRows = 0;

    const collectRow = (tr: XmlNode, isHeader: boolean): void => {
      if (isHeader) headerRows++;
      const rowCells: WordParagraph[][] = [];
      const rowStyle: (WordCellStyle | undefined)[] = [];
      const rowSpan: (WordCellSpan | undefined)[] = [];
      let horizCoverRemaining = 0;
      for (const cell of tr.children) {
        if (cell.name === 'table:table-cell') {
          const repeat = Math.max(1, Number(attr(cell, 'table:number-columns-repeated') ?? 1));
          const colSpan = Number(attr(cell, 'table:number-columns-spanned') ?? 1);
          const rowSpanAttr = Number(attr(cell, 'table:number-rows-spanned') ?? 1);
          const styleDef = resolveStyle(attr(cell, 'table:style-name'));
          const paragraphs: WordParagraph[] = [];
          for (const child of cell.children) {
            if (child.name === 'text:p' || child.name === 'text:h') {
              paragraphs.push(parseOdtParagraph(child));
            } else if (child.name === 'text:list') {
              for (const item of findChildren(child, 'text:list-item')) {
                for (const lp of findChildren(item, 'text:p')) {
                  paragraphs.push(parseOdtParagraph(lp, { kind: 'bullet', level: 0 }));
                }
              }
            }
          }
          const spanObj: WordCellSpan | undefined = (colSpan > 1 || rowSpanAttr > 1) ? {
            ...(colSpan > 1 ? { colSpan } : {}),
            ...(rowSpanAttr > 1 ? { vMerge: 'restart' } : {}),
          } : undefined;
          for (let r = 0; r < Math.min(repeat, 32); r++) {
            rowCells.push(paragraphs.length ? paragraphs : [{ runs: [{ text: '' }] }]);
            rowStyle.push(styleDef.cellStyle);
            rowSpan.push(spanObj);
          }
          horizCoverRemaining = Math.max(0, colSpan - 1);
        } else if (cell.name === 'table:covered-table-cell') {
          if (horizCoverRemaining > 0) {
            horizCoverRemaining--;
            continue;
          }
          rowCells.push([{ runs: [{ text: '' }] }]);
          rowStyle.push(undefined);
          rowSpan.push({ vMerge: 'continue' });
        }
      }
      if (rowCells.length) {
        rows.push(rowCells);
        cellStyles.push(rowStyle);
        cellSpans.push(rowSpan);
      }
    };

    for (const child of tblNode.children) {
      if (child.name === 'table:table-header-rows') {
        for (const tr of findChildren(child, 'table:table-row')) collectRow(tr, true);
      } else if (child.name === 'table:table-row') {
        collectRow(child, false);
      }
    }

    return {
      kind: 'table',
      rows,
      grid,
      colWidthsPx: colWidthsPx.length ? colWidthsPx : undefined,
      tableWidthPx: colWidthsPx.length ? Math.round(colWidthsPx.reduce((s, w) => s + w, 0) * 100) / 100 : undefined,
      headerRows: headerRows || undefined,
      cellStyles,
      cellSpans,
    };
  };

  const officeText = descendants(contentRoot, 'office:text')[0];
  if (officeText) walkTextChildren(officeText);
  if (!blocks.length) blocks.push({ kind: 'paragraph', paragraph: { runs: [] } });

  const wordCount = blocks.reduce((sum, b) => {
    const countP = (p: WordParagraph) => {
      const t = p.runs.map((r) => r.text).join(' ').trim();
      return t ? t.split(/\s+/).length : 0;
    };
    if (b.kind === 'paragraph') return sum + countP(b.paragraph);
    return sum + b.rows.reduce((rs, r) => rs + r.reduce((cs, c) => cs + c.reduce((ps, p) => ps + countP(p), 0), 0), 0);
  }, 0);

  const document: WordDocument = {
    blocks,
    wordCount,
    pageSize,
    pageMargins,
    warnings,
    sourceFormat: 'odt',
    readOnlyLegacy: true,
    packageEntries,
  };
  if (footnotes.length || endnotes.length) {
    document.notes = {
      footnotes,
      endnotes,
      footnoteFormat: 'decimal',
      endnoteFormat: 'lowerRoman',
      footnoteRestart: 'continuous',
      endnoteRestart: 'continuous',
      roots: { footnote: null, endnote: null },
    };
  }
  if (headerText || footerText) {
    document.sections = [{
      index: 0,
      node: { name: 'w:sectPr', attrs: {}, text: '', children: [] },
      headers: headerText ? [{
        kind: 'header', type: 'default', path: 'word/header1.xml',
        xmlRoot: { name: 'w:hdr', attrs: {}, text: '', children: [] },
        text: headerText, hasPageNumber: false,
      }] : [],
      footers: footerText ? [{
        kind: 'footer', type: 'default', path: 'word/footer1.xml',
        xmlRoot: { name: 'w:ftr', attrs: {}, text: '', children: [] },
        text: footerText, hasPageNumber: false,
      }] : [],
      titlePg: false,
      pageNumberFormat: 'decimal',
      columns: 1,
      columnSpace: 720,
      pageWidth: Math.round((pageSize.width / 96) * 1440),
      pageHeight: Math.round((pageSize.height / 96) * 1440),
      orientation: pageSize.width > pageSize.height ? 'landscape' : 'portrait',
      margins: {
        top: Math.round((pageMargins.top / 96) * 1440),
        right: Math.round((pageMargins.right / 96) * 1440),
        bottom: Math.round((pageMargins.bottom / 96) * 1440),
        left: Math.round((pageMargins.left / 96) * 1440),
      },
    }];
  }
  buildSyntheticWordPackage(document);
  return document;
}

/**
 * Extracts raw inner XML substrings of `<text:p>` and `<text:h>` in document
 * order so mixed text+span inline runs keep their exact character sequence.
 */
function indexParagraphXmlSlices(xml: string): Map<number, string> {
  const result = new Map<number, string>();
  const tagRe = /<\/?(text:p|text:h)(?:\s+[^>]*)?\/?>/g;
  const openStarts: number[] = [];
  let seq = 0;
  for (const m of xml.matchAll(tagRe)) {
    const token = m[0];
    const idx = m.index ?? 0;
    if (token.startsWith('</')) {
      const start = openStarts.pop();
      if (start !== undefined && openStarts.length === 0) {
        result.set(seq++, xml.slice(start, idx));
      }
    } else if (token.endsWith('/>')) {
      if (openStarts.length === 0) result.set(seq++, '');
    } else {
      openStarts.push(idx + token.length);
    }
  }
  return result;
}

function parseMixedOdtInline(
  innerXml: string,
  baseStyle: OdtStyleDef,
  resolveStyle: (name: string | undefined) => OdtStyleDef,
  copyPicture: (href: string | undefined) => { path: string; unsupported?: string } | null,
  footnotes: WordNote[],
  endnotes: WordNote[],
  blockIndexHint: number,
): WordRun[] {
  const runs: WordRun[] = [];
  const wrapped = parseXmlOrdered(`<root>${innerXml}</root>`);
  const walk = (nodes: OrderedNode[], style: OdtStyleDef, link?: string): void => {
    for (const item of nodes) {
      if (typeof item === 'string') {
        if (!item) continue;
        runs.push({
          text: item,
          bold: style.bold,
          italic: style.italic,
          underline: style.underline,
          strike: style.strike,
          caps: style.caps,
          smallCaps: style.smallCaps,
          color: style.color,
          shading: style.runShading,
          sizePt: style.sizePt,
          font: style.font,
          vertAlign: style.vertAlign,
          link,
        });
        continue;
      }
      if (item.name === 'text:s') {
        const count = Math.max(1, Number(item.attrs['text:c'] ?? 1));
        runs.push({ text: ' '.repeat(count), font: style.font, sizePt: style.sizePt, link });
      } else if (item.name === 'text:tab') {
        runs.push({ text: '\t', font: style.font, sizePt: style.sizePt, link });
      } else if (item.name === 'text:line-break') {
        runs.push({ text: '\n', font: style.font, sizePt: style.sizePt, link });
      } else if (item.name === 'text:span') {
        walk(item.children, mergeOdtStyles(style, resolveStyle(item.attrs['text:style-name'])), link);
      } else if (item.name === 'text:a') {
        const href = item.attrs['xlink:href'] ?? link;
        walk(item.children, mergeOdtStyles(style, resolveStyle(item.attrs['text:style-name'])), href);
      } else if (item.name === 'draw:frame') {
        const img = item.children.find((c): c is OrderedElement => typeof c !== 'string' && c.name === 'draw:image');
        const pic = copyPicture(img?.attrs['xlink:href']);
        if (pic) {
          const w = lengthToPx(item.attrs['svg:width']);
          const h = lengthToPx(item.attrs['svg:height']);
          runs.push({
            text: '',
            imagePath: pic.path,
            imageWidth: w ? Math.round(w) : 240,
            imageHeight: h ? Math.round(h) : 160,
            unsupportedImageFormat: pic.unsupported,
          });
        }
      } else if (item.name === 'text:note') {
        const noteClass = item.attrs['text:note-class'] === 'endnote' ? 'endnote' : 'footnote';
        const body = item.children.find((c): c is OrderedElement => typeof c !== 'string' && c.name === 'text:note-body');
        const noteText = body ? orderedText(body).trim() : '';
        const list = noteClass === 'endnote' ? endnotes : footnotes;
        const id = list.length + 1;
        list.push({ id, kind: noteClass, text: noteText, refParagraph: blockIndexHint, numbering: id });
        runs.push({ text: '', noteRef: { kind: noteClass, id, label: String(id) } });
      } else {
        walk(item.children, style, link);
      }
    }
  };
  walk(wrapped, baseStyle);
  return runs;
}

type OrderedNode = string | OrderedElement;
interface OrderedElement {
  name: string;
  attrs: Record<string, string>;
  children: OrderedNode[];
}

function parseXmlOrdered(source: string): OrderedNode[] {
  const root: OrderedElement = { name: '#root', attrs: {}, children: [] };
  const stack: OrderedElement[] = [root];
  const tokenRe = /(<\/?[A-Za-z0-9_.:-]+(?:\s+[^>]*)?\/?>)|([^<]+)/g;
  for (const m of source.matchAll(tokenRe)) {
    const tag = m[1];
    const txt = m[2];
    if (txt !== undefined) {
      const decoded = txt
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'").replace(/&amp;/g, '&');
      stack[stack.length - 1].children.push(decoded);
      continue;
    }
    if (tag.startsWith('</')) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const selfClosing = tag.endsWith('/>');
    const nameMatch = /^<([A-Za-z0-9_.:-]+)/.exec(tag);
    if (!nameMatch) continue;
    const attrs: Record<string, string> = {};
    for (const am of tag.matchAll(/([A-Za-z0-9_.:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      attrs[am[1]] = (am[2] ?? am[3] ?? '').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
    }
    const el: OrderedElement = { name: nameMatch[1], attrs, children: [] };
    stack[stack.length - 1].children.push(el);
    if (!selfClosing) stack.push(el);
  }
  return (root.children[0] as OrderedElement | undefined)?.children ?? [];
}

function orderedText(node: OrderedElement): string {
  return node.children.map((c) => (typeof c === 'string' ? c : orderedText(c))).join(' ');
}

function parseOdtStyleNode(st: XmlNode): OdtStyleDef {
  const def: OdtStyleDef = { parent: attr(st, 'style:parent-style-name') ?? undefined };
  const pProps = findChild(st, 'style:paragraph-properties');
  if (pProps) {
    const ta = attr(pProps, 'fo:text-align');
    def.align = ta === 'center' ? 'center' : (ta === 'right' || ta === 'end') ? 'right' : ta === 'justify' ? 'justify' : (ta === 'left' || ta === 'start') ? 'left' : undefined;
    def.indentTwips = lengthToTwips(attr(pProps, 'fo:margin-left'));
    def.indentRightTwips = lengthToTwips(attr(pProps, 'fo:margin-right'));
    def.firstLineTwips = lengthToTwips(attr(pProps, 'fo:text-indent'));
    def.spaceBeforePx = lengthToPx(attr(pProps, 'fo:margin-top'));
    def.spaceAfterPx = lengthToPx(attr(pProps, 'fo:margin-bottom'));
    const lh = attr(pProps, 'fo:line-height');
    if (lh && lh.endsWith('%')) def.lineSpacing = Math.round((Number(lh.slice(0, -1)) / 100) * 100) / 100;
    if (attr(pProps, 'fo:break-before') === 'page') def.pageBreakBefore = true;
    const bg = attr(pProps, 'fo:background-color');
    if (bg && bg !== 'transparent') def.shading = bg;
  }
  const tProps = findChild(st, 'style:text-properties');
  if (tProps) {
    const fw = attr(tProps, 'fo:font-weight');
    if (fw) def.bold = fw === 'bold' || Number(fw) >= 600;
    const fs = attr(tProps, 'fo:font-style');
    if (fs) def.italic = fs === 'italic' || fs === 'oblique';
    const ul = attr(tProps, 'style:text-underline-style');
    if (ul) def.underline = ul !== 'none';
    const stLine = attr(tProps, 'style:text-line-through-style');
    if (stLine) def.strike = stLine !== 'none';
    const col = attr(tProps, 'fo:color');
    if (col && col.startsWith('#')) def.color = col;
    const rbg = attr(tProps, 'fo:background-color');
    if (rbg && rbg !== 'transparent') def.runShading = rbg;
    const pt = lengthToPt(attr(tProps, 'fo:font-size'));
    if (pt) def.sizePt = pt;
    def.font = attr(tProps, 'style:font-name') ?? attr(tProps, 'fo:font-family')?.replace(/['"]/g, '') ?? undefined;
    if (attr(tProps, 'fo:text-transform') === 'uppercase') def.caps = true;
    if (attr(tProps, 'fo:font-variant') === 'small-caps') def.smallCaps = true;
    const pos = attr(tProps, 'style:text-position');
    if (pos) {
      if (pos.startsWith('super') || (parseFloat(pos) > 0)) def.vertAlign = 'superscript';
      else if (pos.startsWith('sub') || (parseFloat(pos) < 0)) def.vertAlign = 'subscript';
    }
  }
  const colProps = findChild(st, 'style:table-column-properties');
  if (colProps) {
    def.colWidthPx = lengthToPx(attr(colProps, 'style:column-width'));
  }
  const cellProps = findChild(st, 'style:table-cell-properties');
  if (cellProps) {
    const cs: WordCellStyle = {};
    const bg = attr(cellProps, 'fo:background-color');
    if (bg && bg !== 'transparent') cs.fill = bg;
    const va = attr(cellProps, 'style:vertical-align');
    if (va === 'middle') cs.valign = 'center';
    else if (va === 'bottom') cs.valign = 'bottom';
    const allBorder = attr(cellProps, 'fo:border');
    if (allBorder) {
      const on = allBorder !== 'none';
      cs.borderTop = on; cs.borderBottom = on; cs.borderLeft = on; cs.borderRight = on;
    }
    for (const edge of ['top', 'bottom', 'left', 'right'] as const) {
      const b = attr(cellProps, `fo:border-${edge}`);
      if (!b) continue;
      const on = b !== 'none';
      if (edge === 'top') cs.borderTop = on;
      else if (edge === 'bottom') cs.borderBottom = on;
      else if (edge === 'left') cs.borderLeft = on;
      else cs.borderRight = on;
    }
    if (Object.keys(cs).length) def.cellStyle = cs;
  }
  return def;
}

function mergeOdtStyles(base: OdtStyleDef, over: OdtStyleDef): OdtStyleDef {
  const out: OdtStyleDef = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (v !== undefined && k !== 'parent') (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

function lengthToPx(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const m = /^(-?[\d.]+)\s*(cm|mm|in|pt|px)$/i.exec(raw.trim());
  if (!m) return undefined;
  const val = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (unit === 'cm') return (val / 2.54) * 96;
  if (unit === 'mm') return (val / 25.4) * 96;
  if (unit === 'in') return val * 96;
  if (unit === 'pt') return (val / 72) * 96;
  return val;
}

function lengthToPt(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const px = lengthToPx(raw);
  return px ? Math.round(((px * 72) / 96) * 10) / 10 : undefined;
}

function lengthToTwips(raw: string | undefined): number | undefined {
  const px = lengthToPx(raw);
  return px !== undefined ? Math.round(px * 15) : undefined;
}
