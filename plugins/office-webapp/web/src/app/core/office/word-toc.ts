import { attr, descendants, findChild, type XmlNode } from '../binary/xml';
import type { WordBlock, WordDocument, WordParagraph } from './types';

export interface WordBookmark {
  id: number;
  name: string;
  paragraphIndex: number;
}

export interface TocEntry {
  level: number;
  text: string;
  page: number;
  paragraphIndex: number;
}

export function parseBookmarks(document: WordDocument): WordBookmark[] {
  const bookmarks: WordBookmark[] = [];
  document.blocks.forEach((block, index) => {
    if (block.kind !== 'paragraph' || !block.paragraph.xmlNode) return;
    for (const node of descendants(block.paragraph.xmlNode, 'w:bookmarkStart')) {
      const name = attr(node, 'w:name');
      if (!name || name.startsWith('_')) continue;
      bookmarks.push({ id: Number(attr(node, 'w:id') ?? 0), name, paragraphIndex: index });
    }
  });
  return bookmarks;
}

export function addBookmark(document: WordDocument, name: string, paragraphIndex: number): WordBookmark | null {
  const block = document.blocks[paragraphIndex];
  if (!block || block.kind !== 'paragraph' || !block.paragraph.xmlNode) return null;
  const clean = sanitizeBookmark(name);
  if (!clean) return null;
  const existing = parseBookmarks(document);
  if (existing.some((bookmark) => bookmark.name === clean)) return existing.find((bookmark) => bookmark.name === clean)!;
  const id = existing.reduce((max, bookmark) => Math.max(max, bookmark.id), 0) + 1;
  const paragraph = block.paragraph.xmlNode;
  const start: XmlNode = { name: 'w:bookmarkStart', attrs: { 'w:id': String(id), 'w:name': clean }, text: '', children: [] };
  const end: XmlNode = { name: 'w:bookmarkEnd', attrs: { 'w:id': String(id) }, text: '', children: [] };
  const insertAt = paragraph.children.findIndex((child) => child.name !== 'w:pPr');
  if (insertAt < 0) paragraph.children.push(start, end);
  else {
    paragraph.children.splice(insertAt, 0, start);
    paragraph.children.push(end);
  }
  return { id, name: clean, paragraphIndex };
}

export function removeBookmark(document: WordDocument, name: string): boolean {
  let removed = false;
  for (const block of document.blocks) {
    if (block.kind !== 'paragraph' || !block.paragraph.xmlNode) continue;
    const ids = new Set(
      descendants(block.paragraph.xmlNode, 'w:bookmarkStart')
        .filter((node) => attr(node, 'w:name') === name)
        .map((node) => attr(node, 'w:id')),
    );
    if (!ids.size) continue;
    block.paragraph.xmlNode.children = block.paragraph.xmlNode.children.filter((child) => {
      if (child.name === 'w:bookmarkStart' && ids.has(attr(child, 'w:id'))) return false;
      if (child.name === 'w:bookmarkEnd' && ids.has(attr(child, 'w:id'))) return false;
      return true;
    });
    removed = true;
  }
  return removed;
}

export function insertCrossReference(
  document: WordDocument, bookmark: WordBookmark, paragraphIndex: number,
): boolean {
  const block = document.blocks[paragraphIndex];
  if (!block || block.kind !== 'paragraph' || !block.paragraph.xmlNode) return false;
  const target = document.blocks[bookmark.paragraphIndex];
  const text = target?.kind === 'paragraph'
    ? target.paragraph.runs.map((run) => run.text).join('').trim() || bookmark.name
    : bookmark.name;
  block.paragraph.xmlNode.children.push(fieldRun(` REF ${bookmark.name} \\h `, text));
  block.paragraph.runs.push({ text });
  return true;
}

export function tocEntries(document: WordDocument): TocEntry[] {
  const entries: TocEntry[] = [];
  document.blocks.forEach((block, index) => {
    if (block.kind !== 'paragraph' || !block.paragraph.headingLevel) return;
    const text = block.paragraph.runs.map((run) => run.text).join('').trim();
    if (!text) return;
    entries.push({ level: block.paragraph.headingLevel, text, page: entries.length + 1, paragraphIndex: index });
  });
  return entries;
}

export function insertToc(
  document: WordDocument,
  title = 'Mục lục',
  pages?: Map<number, number>,
): number {
  const body = document.xmlRoot ? findChild(document.xmlRoot, 'w:document') ?? document.xmlRoot : null;
  const bodyNode = body ? findChild(body, 'w:body') : null;
  if (!bodyNode) return 0;
  const entries = tocEntries(document);
  if (!entries.length) return 0;
  removeToc(document);
  const paragraphs: Array<{ node: XmlNode; block: WordBlock }> = [];
  const heading = textParagraph(title, true, 'TOCHeading');
  paragraphs.push({
    node: heading,
    block: { kind: 'paragraph', paragraph: { style: 'TOCHeading', runs: [{ text: title, bold: true }], xmlNode: heading } },
  });
  for (const entry of entries) {
    const page = pages?.get(entry.paragraphIndex) ?? entry.page;
    const text = `${'  '.repeat(Math.max(0, entry.level - 1))}${entry.text}\t${page}`;
    const node = textParagraph(text, false, `TOC${Math.min(3, Math.max(1, entry.level))}`);
    paragraphs.push({
      node,
      block: {
        kind: 'paragraph',
        paragraph: { style: `TOC${Math.min(3, Math.max(1, entry.level))}`, runs: [{ text }], xmlNode: node },
      },
    });
  }
  const sectPr = findChild(bodyNode, 'w:sectPr');
  const index = sectPr ? bodyNode.children.indexOf(sectPr) : bodyNode.children.length;
  bodyNode.children.splice(index, 0, ...paragraphs.map((item) => item.node));
  document.blocks.push(...paragraphs.map((item) => item.block));
  return entries.length;
}

export function removeToc(document: WordDocument): number {
  const body = document.xmlRoot ? findChild(document.xmlRoot, 'w:document') ?? document.xmlRoot : null;
  const bodyNode = body ? findChild(body, 'w:body') : null;
  const removed = new Set<XmlNode>();
  let count = 0;
  document.blocks = document.blocks.filter((block) => {
    const style = block.kind === 'paragraph' ? block.paragraph.style : undefined;
    if (!style || !/^TOC(Heading|[1-9])$/.test(style)) return true;
    if (block.kind === 'paragraph' && block.paragraph.xmlNode) removed.add(block.paragraph.xmlNode);
    count++;
    return false;
  });
  if (bodyNode && removed.size) {
    bodyNode.children = bodyNode.children.filter((child) => !removed.has(child));
  }
  return count;
}

/**
 * Refresh page numbers of existing TOC paragraphs in place (keeps TOC styles,
 * hyperlinks and field structure). `pages` maps heading block index -> 1-based page.
 */
export function syncTocPageNumbers(document: WordDocument, pages: Map<number, number>): number {
  const headings = tocEntries(document).map((entry) => ({
    index: entry.paragraphIndex,
    key: normalizeTocText(entry.text),
  }));
  let changed = 0;
  // The TOC lists the headings in document order, so when the counts agree the
  // n-th line belongs to the n-th heading. Matching by text instead loses
  // duplicate headings such as "Kết luận" under different chapters.
  const tocBlocks = document.blocks.filter((block) =>
    block.kind === 'paragraph' && /^TOC[1-9]$/.test(block.paragraph.style ?? ''));
  if (tocBlocks.length === headings.length) {
    tocBlocks.forEach((block, position) => {
      if (block.kind !== 'paragraph') return;
      const text = block.paragraph.runs.map((run) => run.text).join('');
      const match = /^(.*?)(\t|\s{2,})(\d+)\s*$/.exec(text);
      if (!match) return;
      const page = pages.get(headings[position].index);
      if (!page || String(page) === match[3]) return;
      updateTocNumber(block.paragraph, page);
      changed++;
    });
    return changed;
  }
  let cursor = 0;
  for (const block of document.blocks) {
    if (block.kind !== 'paragraph') continue;
    const style = block.paragraph.style;
    if (!style || !/^TOC[1-9]$/.test(style)) continue;
    const text = block.paragraph.runs.map((run) => run.text).join('');
    const match = /^(.*?)(\t|\s{2,})(\d+)\s*$/.exec(text);
    if (!match) continue;
    const entryText = normalizeTocText(match[1]);
    // Headings repeat ("Kết luận" under every chapter), so the TOC line is
    // matched against the next heading in document order, never an earlier one.
    let found = -1;
    for (let index = cursor; index < headings.length; index++) {
      const key = headings[index].key;
      if (entryText === key || entryText.endsWith(` ${key}`)) {
        found = index;
        break;
      }
    }
    if (found < 0) continue;
    cursor = found + 1;
    const page = pages.get(headings[found].index);
    if (!page || String(page) === match[3]) continue;
    updateTocNumber(block.paragraph, page);
    changed++;
  }
  return changed;
}

function normalizeTocText(value: string): string {
  return value.replace(/[\t ]+/g, ' ').trim().toLowerCase();
}

function updateTocNumber(paragraph: WordParagraph, page: number): void {
  for (let index = paragraph.runs.length - 1; index >= 0; index--) {
    const run = paragraph.runs[index];
    if (/\d+\s*$/.test(run.text)) {
      run.text = run.text.replace(/\d+\s*$/, String(page));
      break;
    }
  }
  if (!paragraph.xmlNode) return;
  const texts = descendants(paragraph.xmlNode, 'w:t').reverse();
  for (const node of texts) {
    if (/\d+\s*$/.test(node.text)) {
      node.text = node.text.replace(/\d+\s*$/, String(page));
      return;
    }
  }
}

function textParagraph(text: string, bold = false, style?: string): XmlNode {
  const runChildren: XmlNode[] = [];
  if (bold) runChildren.push({ name: 'w:rPr', attrs: {}, text: '', children: [{ name: 'w:b', attrs: {}, text: '', children: [] }] });
  runChildren.push({ name: 'w:t', attrs: { 'xml:space': 'preserve' }, text, children: [] });
  const children: XmlNode[] = [];
  if (style) {
    children.push({
      name: 'w:pPr', attrs: {}, text: '',
      children: [{ name: 'w:pStyle', attrs: { 'w:val': style }, text: '', children: [] }],
    });
  }
  children.push({ name: 'w:r', attrs: {}, text: '', children: runChildren });
  return { name: 'w:p', attrs: {}, text: '', children };
}

function fieldRun(instr: string, result: string): XmlNode {
  return {
    name: 'w:r', attrs: {}, text: '', children: [
      { name: 'w:fldChar', attrs: { 'w:fldCharType': 'begin' }, text: '', children: [] },
      { name: 'w:instrText', attrs: { 'xml:space': 'preserve' }, text: instr, children: [] },
      { name: 'w:fldChar', attrs: { 'w:fldCharType': 'separate' }, text: '', children: [] },
      { name: 'w:t', attrs: { 'xml:space': 'preserve' }, text: result, children: [] },
      { name: 'w:fldChar', attrs: { 'w:fldCharType': 'end' }, text: '', children: [] },
    ],
  };
}

function sanitizeBookmark(value: string): string {
  const clean = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_]/g, '_').replace(/^([^A-Za-z_])/, '_$1');
  return clean.slice(0, 40);
}
