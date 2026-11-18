import { attr, descendants, findChild, type XmlNode } from '../binary/xml';
import type { WordBlock, WordDocument, WordParagraph } from './types';

export interface IndexEntry {
  term: string;
  blockIndex: number;
}

export interface IndexDisplayEntry {
  term: string;
  page: number;
}

const INDEX_STYLE = /^Index([1-9]|Heading)$/;

export function markIndexEntry(document: WordDocument, paragraphIndex: number, term: string): boolean {
  const block = document.blocks[paragraphIndex];
  const cleaned = term.trim().replace(/"/g, "'");
  if (!block || block.kind !== 'paragraph' || !cleaned) return false;
  block.paragraph.xmlNode?.children.push({
    name: 'w:fldSimple',
    attrs: { 'w:instr': ` XE "${cleaned}" ` },
    text: '',
    children: [],
  });
  return true;
}

export function parseIndexEntries(document: WordDocument): IndexEntry[] {
  const entries: IndexEntry[] = [];
  document.blocks.forEach((block, blockIndex) => {
    if (block.kind !== 'paragraph' || !block.paragraph.xmlNode) return;
    for (const field of descendants(block.paragraph.xmlNode, 'w:fldSimple')) {
      const instruction = attr(field, 'w:instr') ?? '';
      const match = /^\s*XE\s+"([^"]+)"/i.exec(instruction);
      if (match) entries.push({ term: match[1].trim(), blockIndex });
    }
  });
  return entries;
}

export function indexParagraphs(entries: IndexDisplayEntry[], title = 'Index'): WordBlock[] {
  const preamble = (style: string): XmlNode => ({
    name: 'w:pPr', attrs: {}, text: '',
    children: [{ name: 'w:pStyle', attrs: { 'w:val': style }, text: '', children: [] }],
  });
  const makeBlock = (style: string, text: string): WordBlock => {
    const paragraph: WordParagraph = {
      style,
      runs: [{ text }],
      xmlNode: {
        name: 'w:p', attrs: {}, text: '',
        children: [
          preamble(style),
          {
            name: 'w:r', attrs: {}, text: '',
            children: [{ name: 'w:t', attrs: { 'xml:space': 'preserve' }, text, children: [] }],
          },
        ],
      },
    };
    return { kind: 'paragraph', paragraph };
  };
  const blocks: WordBlock[] = [makeBlock('IndexHeading', title)];
  const sorted = [...entries].sort((left, right) => left.term.localeCompare(right.term, 'vi'));
  for (const entry of sorted) {
    blocks.push(makeBlock('Index1', entry.page > 0 ? `${entry.term}\t${entry.page}` : entry.term));
  }
  return blocks;
}

export function clearGeneratedIndex(document: WordDocument): number {
  const body = document.xmlRoot
    ? findChild(findChild(document.xmlRoot, 'w:document') ?? document.xmlRoot, 'w:body')
    : null;
  const removedNodes = new Set<XmlNode>();
  let removed = 0;
  document.blocks = document.blocks.filter((block) => {
    const style = block.kind === 'paragraph' ? block.paragraph.style : undefined;
    if (!style || !INDEX_STYLE.test(style)) return true;
    if (block.kind === 'paragraph' && block.paragraph.xmlNode) removedNodes.add(block.paragraph.xmlNode);
    removed++;
    return false;
  });
  if (body && removedNodes.size) {
    body.children = body.children.filter((child) => !removedNodes.has(child));
  }
  return removed;
}

export function hasGeneratedIndex(document: WordDocument): boolean {
  return document.blocks.some((block) => block.kind === 'paragraph'
    && INDEX_STYLE.test(block.paragraph.style ?? ''));
}

export function insertIndex(document: WordDocument, entries: IndexDisplayEntry[], title = 'Index'): number {
  clearGeneratedIndex(document);
  const body = document.xmlRoot
    ? findChild(findChild(document.xmlRoot, 'w:document') ?? document.xmlRoot, 'w:body')
    : null;
  if (!body) return 0;
  const blocks = indexParagraphs(entries, title);
  const nodes = blocks.flatMap((block) => block.kind === 'paragraph' && block.paragraph.xmlNode
    ? [block.paragraph.xmlNode] : []);
  const sectPr = findChild(body, 'w:sectPr');
  const index = sectPr ? body.children.indexOf(sectPr) : body.children.length;
  body.children.splice(index, 0, ...nodes);
  document.blocks.push(...blocks);
  return entries.length;
}
