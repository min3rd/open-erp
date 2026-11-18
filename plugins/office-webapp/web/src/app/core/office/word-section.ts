import { attr, descendants, findChild, findChildren, parseXml, textOf, type XmlNode } from '../binary/xml';
import type { WordDocument } from './types';

export type HeaderFooterKind = 'header' | 'footer';
export type HeaderFooterType = 'default' | 'first' | 'even';

export interface HeaderFooterRef {
  kind: HeaderFooterKind;
  type: HeaderFooterType;
  path: string;
  relId?: string;
  xmlRoot: XmlNode;
  text: string;
  hasPageNumber: boolean;
}

export interface WordSectionInfo {
  index: number;
  node: XmlNode;
  headers: HeaderFooterRef[];
  footers: HeaderFooterRef[];
  titlePg: boolean;
  pageNumberFormat: string;
  pageNumberStart?: number;
  columns: number;
  columnSpace: number;
  pageWidth: number;
  pageHeight: number;
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  pageBorder?: { style: string; size: number; color: string };
  lineNumbering?: { restart: 'continuous' | 'newPage' | 'newSection'; countBy: number };
}

const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const CONTENT_TYPE_HEADER = 'application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml';
const CONTENT_TYPE_FOOTER = 'application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml';

export function parseSections(document: WordDocument, entries: Map<string, Uint8Array>): WordSectionInfo[] {
  const root = document.xmlRoot;
  if (!root) return [];
  const body = findChild(root, 'w:body');
  const nodes = body ? descendants(body, 'w:sectPr') : [];
  if (!nodes.length) return [];
  const rels = parseDocumentRelationships(entries);
  return nodes.map((node, index) => {
    const headers: HeaderFooterRef[] = [];
    const footers: HeaderFooterRef[] = [];
    for (const reference of findChildren(node, 'w:headerReference')) {
      const ref = readReference('header', reference, rels, entries);
      if (ref) headers.push(ref);
    }
    for (const reference of findChildren(node, 'w:footerReference')) {
      const ref = readReference('footer', reference, rels, entries);
      if (ref) footers.push(ref);
    }
    const pgNumType = findChild(node, 'w:pgNumType');
    const cols = findChild(node, 'w:cols');
    const pgSz = findChild(node, 'w:pgSz');
    const pgMar = findChild(node, 'w:pgMar');
    const borders = findChild(node, 'w:pgBorders');
    const borderTop = findChild(borders, 'w:top');
    const lnNum = findChild(node, 'w:lnNumType');
    return {
      index,
      node,
      headers,
      footers,
      titlePg: findChild(node, 'w:titlePg') !== null,
      pageNumberFormat: attr(pgNumType, 'w:fmt') ?? 'decimal',
      pageNumberStart: attr(pgNumType, 'w:start') ? Number(attr(pgNumType, 'w:start')) : undefined,
      columns: Number(attr(cols, 'w:num') ?? 1) || 1,
      columnSpace: Number(attr(cols, 'w:space') ?? 720) || 720,
      pageWidth: Number(attr(pgSz, 'w:w') ?? 12240) || 12240,
      pageHeight: Number(attr(pgSz, 'w:h') ?? 15840) || 15840,
      orientation: attr(pgSz, 'w:orient') === 'landscape' ? 'landscape' : 'portrait',
      margins: {
        top: Number(attr(pgMar, 'w:top') ?? 1440) || 1440,
        right: Number(attr(pgMar, 'w:right') ?? 1440) || 1440,
        bottom: Number(attr(pgMar, 'w:bottom') ?? 1440) || 1440,
        left: Number(attr(pgMar, 'w:left') ?? 1440) || 1440,
      },
      pageBorder: borderTop
        ? {
          style: attr(borderTop, 'w:val') ?? 'single',
          size: (Number(attr(borderTop, 'w:sz') ?? 4) || 4) / 8,
          color: attr(borderTop, 'w:color') ?? '000000',
        }
        : undefined,
      lineNumbering: lnNum
        ? {
          restart: (attr(lnNum, 'w:restart') ?? 'continuous') as 'continuous' | 'newPage' | 'newSection',
          countBy: Number(attr(lnNum, 'w:countBy') ?? 1) || 1,
        }
        : undefined,
    };
  });
}

export function sectionAt(document: WordDocument, index = 0): WordSectionInfo | null {
  return document.sections?.[index] ?? null;
}

export function ensureHeaderFooter(
  document: WordDocument, section: WordSectionInfo, kind: HeaderFooterKind,
  type: HeaderFooterType = 'default', entries?: Map<string, Uint8Array>,
): HeaderFooterRef {
  const existing = (kind === 'header' ? section.headers : section.footers).find((item) => item.type === type);
  if (existing) return existing;

  const number = nextPartNumber(kind, entries);
  const path = `word/${kind}${number}.xml`;
  const rootName = kind === 'header' ? 'w:hdr' : 'w:ftr';
  const xmlRoot: XmlNode = {
    name: rootName,
    attrs: { 'xmlns:w': NS },
    text: '',
    children: [{ name: 'w:p', attrs: {}, text: '', children: [{ name: 'w:r', attrs: {}, text: '', children: [{ name: 'w:t', attrs: {}, text: '', children: [] }] }] }],
  };
  const relId = `rId${kind === 'header' ? 'Hdr' : 'Ftr'}${number}`;
  const reference: XmlNode = {
    name: kind === 'header' ? 'w:headerReference' : 'w:footerReference',
    attrs: { 'w:type': type, 'r:id': relId },
    text: '',
    children: [],
  };
  const firstContent = section.node.children.findIndex((child) =>
    !child.name.endsWith('Reference'));
  if (firstContent < 0) section.node.children.push(reference);
  else section.node.children.splice(firstContent, 0, reference);

  addRelationship(entries, relId, `${REL_TYPE}/${kind}`, `${kind}${number}.xml`);
  addContentType(entries, `/word/${kind}${number}.xml`, kind === 'header' ? CONTENT_TYPE_HEADER : CONTENT_TYPE_FOOTER);

  const ref: HeaderFooterRef = { kind, type, path, relId, xmlRoot, text: '', hasPageNumber: false };
  (kind === 'header' ? section.headers : section.footers).push(ref);
  return ref;
}

export function setHeaderFooterText(ref: HeaderFooterRef, text: string): void {
  const paragraph = findChild(ref.xmlRoot, 'w:p')
    ?? descendants(ref.xmlRoot, 'w:p')[0]
    ?? null;
  if (!paragraph) return;
  const texts = descendants(paragraph, 'w:t');
  const value = text.replace(/\r?\n/g, ' ');
  if (texts.length) {
    texts[0].text = value;
    for (let index = 1; index < texts.length; index++) texts[index].text = '';
  } else {
    paragraph.children.push({
      name: 'w:r', attrs: {}, text: '', children: [{ name: 'w:t', attrs: { 'xml:space': 'preserve' }, text: value, children: [] }],
    });
  }
  ref.text = value;
}

export function insertPageNumberField(ref: HeaderFooterRef): void {
  if (ref.hasPageNumber) return;
  const paragraph = findChild(ref.xmlRoot, 'w:p') ?? descendants(ref.xmlRoot, 'w:p')[0];
  if (!paragraph) return;
  paragraph.children.push({
    name: 'w:fldSimple',
    attrs: { 'w:instr': ' PAGE ' },
    text: '',
    children: [{
      name: 'w:r', attrs: {}, text: '', children: [{ name: 'w:t', attrs: {}, text: '1', children: [] }],
    }],
  });
  ref.hasPageNumber = true;
}

export function setPageNumbering(section: WordSectionInfo, format: string, start?: number): void {
  let node = findChild(section.node, 'w:pgNumType');
  if (!node) {
    node = { name: 'w:pgNumType', attrs: {}, text: '', children: [] };
    const anchor = section.node.children.findIndex((child) =>
      child.name === 'w:cols' || child.name === 'w:titlePg' || child.name === 'w:docGrid');
    if (anchor < 0) section.node.children.push(node);
    else section.node.children.splice(anchor, 0, node);
  }
  node.attrs['w:fmt'] = format;
  if (start !== undefined && Number.isFinite(start)) node.attrs['w:start'] = String(start);
  else delete node.attrs['w:start'];
  section.pageNumberFormat = format;
  section.pageNumberStart = start;
}

export function setTitlePage(section: WordSectionInfo, enabled: boolean): void {
  const existing = findChild(section.node, 'w:titlePg');
  if (enabled && !existing) {
    section.node.children.push({ name: 'w:titlePg', attrs: {}, text: '', children: [] });
  } else if (!enabled && existing) {
    section.node.children = section.node.children.filter((child) => child !== existing);
  }
  section.titlePg = enabled;
}

/** Serialize all header/footer parts referenced by any section. */
export interface PageSetupInput {
  pageWidth?: number;
  pageHeight?: number;
  orientation?: 'portrait' | 'landscape';
  margins?: { top: number; right: number; bottom: number; left: number };
}

export function setColumns(section: WordSectionInfo, count: number, space = 720): void {
  let cols = findChild(section.node, 'w:cols');
  if (!cols) {
    cols = { name: 'w:cols', attrs: {}, text: '', children: [] };
    const anchor = section.node.children.findIndex((child) => child.name === 'w:docGrid');
    if (anchor < 0) section.node.children.push(cols);
    else section.node.children.splice(anchor, 0, cols);
  }
  const safeCount = Math.max(1, Math.min(4, Math.round(count)));
  cols.attrs['w:num'] = String(safeCount);
  cols.attrs['w:space'] = String(Math.max(0, Math.round(space)));
  section.columns = safeCount;
  section.columnSpace = Math.max(0, Math.round(space));
}

export function setPageSetup(section: WordSectionInfo, input: PageSetupInput): void {
  let pgSz = findChild(section.node, 'w:pgSz');
  if (!pgSz) {
    pgSz = { name: 'w:pgSz', attrs: {}, text: '', children: [] };
    const anchor = section.node.children.findIndex((child) => child.name === 'w:pgMar');
    if (anchor < 0) section.node.children.push(pgSz);
    else section.node.children.splice(anchor, 0, pgSz);
  }
  const width = input.pageWidth ?? section.pageWidth;
  const height = input.pageHeight ?? section.pageHeight;
  const orientation = input.orientation ?? section.orientation;
  pgSz.attrs['w:w'] = String(Math.round(width));
  pgSz.attrs['w:h'] = String(Math.round(height));
  if (orientation === 'landscape') pgSz.attrs['w:orient'] = 'landscape';
  else delete pgSz.attrs['w:orient'];
  section.pageWidth = Math.round(width);
  section.pageHeight = Math.round(height);
  section.orientation = orientation;

  if (input.margins) {
    let pgMar = findChild(section.node, 'w:pgMar');
    if (!pgMar) {
      pgMar = { name: 'w:pgMar', attrs: {}, text: '', children: [] };
      section.node.children.push(pgMar);
    }
    const margins = input.margins;
    pgMar.attrs['w:top'] = String(Math.round(margins.top));
    pgMar.attrs['w:right'] = String(Math.round(margins.right));
    pgMar.attrs['w:bottom'] = String(Math.round(margins.bottom));
    pgMar.attrs['w:left'] = String(Math.round(margins.left));
    section.margins = { ...margins };
  }
}

/**
 * Insert a paragraph-level section break before the final body sectPr.
 * Returns the new number of sections.
 */
export function insertSectionBreak(document: WordDocument): number {
  const body = document.xmlRoot ? findChild(document.xmlRoot, 'w:body') : null;
  if (!body) return document.sections?.length ?? 0;
  const finalIndex = body.children.map((child) => child.name).lastIndexOf('w:sectPr');
  if (finalIndex < 0) return document.sections?.length ?? 0;
  const finalSection = body.children[finalIndex];
  const clone = cloneNode(finalSection);
  const paragraph: XmlNode = {
    name: 'w:p',
    attrs: {},
    text: '',
    children: [{ name: 'w:pPr', attrs: {}, text: '', children: [clone] }],
  };
  body.children.splice(finalIndex, 0, paragraph);
  document.blocks.push({ kind: 'paragraph', paragraph: { runs: [] } });
  document.sections = parseSections(document, document.packageEntries ?? new Map());
  return document.sections.length;
}

function cloneNode(node: XmlNode): XmlNode {
  return { name: node.name, attrs: { ...node.attrs }, text: node.text, children: node.children.map(cloneNode) };
}

export function setPageBorder(section: WordSectionInfo, border: { style: string; size: number; color: string } | null): void {
  section.node.children = section.node.children.filter((child) => child.name !== 'w:pgBorders');
  if (!border) {
    delete section.pageBorder;
    return;
  }
  const style = border.style === 'none' ? 'none' : border.style;
  const side = (name: string) => ({
    name: `w:${name}`,
    attrs: { 'w:val': style, 'w:sz': String(Math.max(2, Math.round(border.size * 8))), 'w:space': '24', 'w:color': border.color.replace('#', '').toUpperCase() },
    text: '', children: [],
  });
  const node = {
    name: 'w:pgBorders',
    attrs: { 'w:offsetFrom': 'page' },
    text: '', children: [side('top'), side('left'), side('bottom'), side('right')],
  };
  const anchor = section.node.children.findIndex((child) => child.name === 'w:lnNumType' || child.name === 'w:pgNumType' || child.name === 'w:cols');
  section.node.children.splice(anchor < 0 ? section.node.children.length : anchor, 0, node);
  section.pageBorder = { style, size: border.size, color: border.color };
}

export function setLineNumbering(section: WordSectionInfo, mode: 'off' | 'continuous' | 'newPage' | 'newSection', countBy = 1): void {
  section.node.children = section.node.children.filter((child) => child.name !== 'w:lnNumType');
  if (mode === 'off') {
    delete section.lineNumbering;
    return;
  }
  const node = {
    name: 'w:lnNumType',
    attrs: { 'w:countBy': String(Math.max(1, countBy)), 'w:restart': mode === 'newPage' ? 'newPage' : mode === 'newSection' ? 'newSection' : 'continuous' },
    text: '', children: [],
  };
  const anchor = section.node.children.findIndex((child) => child.name === 'w:pgNumType' || child.name === 'w:cols');
  section.node.children.splice(anchor < 0 ? section.node.children.length : anchor, 0, node);
  section.lineNumbering = { restart: mode, countBy };
}

export function setPageColor(document: WordDocument, color: string | null): void {
  const root = document.xmlRoot;
  if (!root) return;
  root.children = root.children.filter((child) => child.name !== 'w:background');
  if (!color) {
    delete document.pageColor;
    return;
  }
  root.children.unshift({
    name: 'w:background',
    attrs: { 'w:color': color.replace('#', '').toUpperCase() },
    text: '', children: [],
  });
  document.pageColor = color;
}

export function headerFooterParts(document: WordDocument): Array<{ name: string; data: string }> {
  const parts = new Map<string, XmlNode>();
  for (const section of document.sections ?? []) {
    for (const ref of [...section.headers, ...section.footers]) parts.set(ref.path, ref.xmlRoot);
  }
  const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  return [...parts.entries()].map(([name, root]) => ({ name, data: declaration + serialize(root) }));
}

function readReference(
  kind: HeaderFooterKind, reference: XmlNode, rels: Map<string, string>, entries: Map<string, Uint8Array>,
): HeaderFooterRef | null {
  const relId = attr(reference, 'r:id');
  const target = relId ? rels.get(relId) : undefined;
  if (!target) return null;
  const path = normalizeWordTarget(target);
  const bytes = entries.get(path);
  if (!bytes) return null;
  const xmlRoot = findChild(parseXml(new TextDecoder('utf-8').decode(bytes)), kind === 'header' ? 'w:hdr' : 'w:ftr');
  if (!xmlRoot) return null;
  const state = { hasPageNumber: false };
  const text = findChildren(xmlRoot, 'w:p').map((paragraph) => collectFieldText(paragraph, state)).join('\n').trim();
  return {
    kind,
    type: (attr(reference, 'w:type') as HeaderFooterType) ?? 'default',
    path,
    relId,
    xmlRoot,
    text,
    hasPageNumber: state.hasPageNumber,
  };
}

/**
 * Collect visible text while detecting PAGE fields. Simple fields (`w:fldSimple`)
 * and complex fields (`w:fldChar begin`/`instrText`/`separate`/`end`) both mark
 * the reference as dynamic; cached field results are skipped so stale page
 * numbers from the original document never render as static text.
 */
function collectFieldText(node: XmlNode, state: { hasPageNumber: boolean }): string {
  let text = '';
  let fieldOpen = false;
  let pageField = false;
  let inPageResult = false;
  const walk = (current: XmlNode): void => {
    if (current.name === 'w:fldChar') {
      const type = attr(current, 'w:fldCharType');
      if (type === 'begin') {
        fieldOpen = true;
        pageField = false;
      } else if (type === 'separate') {
        if (pageField) inPageResult = true;
      } else if (type === 'end') {
        fieldOpen = false;
        pageField = false;
        inPageResult = false;
      }
      return;
    }
    if (current.name === 'w:instrText') {
      if (fieldOpen && /PAGE/i.test(current.text)) {
        pageField = true;
        state.hasPageNumber = true;
      }
      return;
    }
    if (current.name === 'w:fldSimple') {
      if (/PAGE/i.test(attr(current, 'w:instr') ?? '')) state.hasPageNumber = true;
      return;
    }
    if (inPageResult) return;
    if (current.name === 'w:t') {
      text += current.text;
      return;
    }
    if (current.name === 'w:tab') {
      text += '\t';
      return;
    }
    if (current.name === 'w:br') {
      text += '\n';
      return;
    }
    for (const child of current.children) walk(child);
  };
  walk(node);
  return text;
}

function parseDocumentRelationships(entries: Map<string, Uint8Array>): Map<string, string> {
  const map = new Map<string, string>();
  const bytes = entries.get('word/_rels/document.xml.rels');
  if (!bytes) return map;
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  for (const rel of descendants(root, 'Relationship')) {
    const id = attr(rel, 'Id');
    const target = attr(rel, 'Target');
    if (id && target) map.set(id, target);
  }
  return map;
}

function addRelationship(entries: Map<string, Uint8Array> | undefined, id: string, type: string, target: string): void {
  if (!entries) return;
  const bytes = entries.get('word/_rels/document.xml.rels');
  const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const rel = `<Relationship Id="${id}" Type="${type}" Target="${target}"/>`;
  const xml = bytes
    ? new TextDecoder('utf-8').decode(bytes).replace('</Relationships>', `${rel}</Relationships>`)
    : `${declaration}<Relationships xmlns="${REL_NS}">${rel}</Relationships>`;
  entries.set('word/_rels/document.xml.rels', new TextEncoder().encode(xml));
}

function addContentType(entries: Map<string, Uint8Array> | undefined, partName: string, contentType: string): void {
  if (!entries) return;
  const bytes = entries.get('[Content_Types].xml');
  if (!bytes) return;
  let xml = new TextDecoder('utf-8').decode(bytes);
  if (xml.includes(`PartName="${partName}"`)) return;
  const override = `<Override PartName="${partName}" ContentType="${contentType}"/>`;
  if (xml.includes('</Types>')) xml = xml.replace('</Types>', `${override}</Types>`);
  else if (/<Types[^>]*\/>/.test(xml)) xml = xml.replace(/<Types([^>]*)\/>/, `<Types$1>${override}</Types>`);
  entries.set('[Content_Types].xml', new TextEncoder().encode(xml));
}

function nextPartNumber(kind: HeaderFooterKind, entries?: Map<string, Uint8Array>): number {
  let max = 0;
  const pattern = new RegExp(`^word/${kind}(\\d+)\\.xml$`);
  entries?.forEach((_value, name) => {
    const match = pattern.exec(name);
    if (match) max = Math.max(max, Number(match[1]));
  });
  return max + 1;
}

function normalizeWordTarget(target: string): string {
  const clean = target.replace(/^\.\//, '');
  if (clean.startsWith('/')) return clean.slice(1);
  return clean.startsWith('word/') ? clean : `word/${clean}`;
}

function serialize(node: XmlNode): string {
  if (node.name === '#document') return node.children.map(serialize).join('');
  const attrs = Object.entries(node.attrs).map(([key, value]) => ` ${key}="${escapeAttr(value)}"`).join('');
  const body = `${escapeText(node.text)}${node.children.map(serialize).join('')}`;
  return `<${node.name}${attrs}>${body}</${node.name}>`;
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;');
}
