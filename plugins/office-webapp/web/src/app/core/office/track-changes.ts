import { attr, descendants, findChild, findChildren, textOf, type XmlNode } from '../binary/xml';
import type { WordDocument } from './types';

export type RevisionType = 'insert' | 'delete' | 'format';

export interface Revision {
  id: number;
  type: RevisionType;
  author: string;
  date: string;
  text: string;
  paragraphIndex: number;
}

interface Located {
  node: XmlNode;
  parent: XmlNode;
  paragraphIndex: number;
}

const FORMAT_NODES = new Set(['w:rPrChange', 'w:pPrChange']);

export function listRevisions(document: WordDocument, root: XmlNode | undefined = document.xmlRoot): Revision[] {
  if (!root) return [];
  const revisions: Revision[] = [];
  let fallbackId = -1;
  document.blocks.forEach((block, paragraphIndex) => {
    if (block.kind !== 'paragraph' || !block.paragraph.xmlNode) return;
    walk(block.paragraph.xmlNode, (node, parent, grandparent) => {
      if (node.name !== 'w:ins' && node.name !== 'w:del' && !FORMAT_NODES.has(node.name)) return;
      const id = Number(attr(node, 'w:id') ?? fallbackId--);
      const type: RevisionType = node.name === 'w:ins' ? 'insert'
        : node.name === 'w:del' ? 'delete' : 'format';
      const text = type === 'format'
        ? textOf(grandparent ?? parent)
        : descendants(node, node.name === 'w:del' ? 'w:delText' : 'w:t').map((item) => item.text).join('');
      revisions.push({
        id,
        type,
        author: attr(node, 'w:author') ?? '',
        date: attr(node, 'w:date') ?? '',
        text: type === 'format' ? textOf(grandparent ?? parent).slice(0, 80) : text,
        paragraphIndex,
      });
    });
  });
  return revisions;
}

export function acceptRevision(document: WordDocument, id: number): boolean {
  const located = locate(document, id);
  if (!located) return false;
  const { node, parent, paragraphIndex } = located;
  if (node.name === 'w:ins') unwrap(node, parent);
  else if (node.name === 'w:del') remove(node, parent);
  else {
    remove(node, parent);
    syncParagraphModel(document, paragraphIndex);
  }
  return true;
}

export function rejectRevision(document: WordDocument, id: number): boolean {
  const located = locate(document, id);
  if (!located) return false;
  const { node, parent, paragraphIndex } = located;
  if (node.name === 'w:ins') remove(node, parent);
  else if (node.name === 'w:del') unwrapDeleted(node, parent);
  else {
    restoreFormat(node, parent);
    syncParagraphModel(document, paragraphIndex);
  }
  return true;
}

/**
 * Re-read paragraph properties from XML after a format revision is accepted or
 * rejected, so alignment/indent/spacing/style/shading changes show immediately
 * without reloading the document.
 */
function syncParagraphModel(document: WordDocument, paragraphIndex: number): void {
  const block = document.blocks[paragraphIndex];
  if (!block || block.kind !== 'paragraph' || !block.paragraph.xmlNode) return;
  const paragraph = block.paragraph;
  const pPr = findChild(block.paragraph.xmlNode, 'w:pPr');
  const style = attr(findChild(pPr, 'w:pStyle'), 'w:val');
  const headingMatch = style ? /heading\s*([1-6])/i.exec(style) : null;
  paragraph.style = style ?? undefined;
  paragraph.headingLevel = headingMatch ? Number(headingMatch[1]) : undefined;
  const jc = attr(findChild(pPr, 'w:jc'), 'w:val');
  paragraph.align = jc === 'both' ? 'justify' : jc === 'center' ? 'center' : jc === 'right' ? 'right' : 'left';
  paragraph.indent = Number(attr(findChild(pPr, 'w:ind'), 'w:left') ?? 0) || undefined;
  const line = Number(attr(findChild(pPr, 'w:spacing'), 'w:line') ?? 0);
  paragraph.lineSpacing = line > 0 ? line / 240 : undefined;
  const shadingFill = attr(findChild(pPr, 'w:shd'), 'w:fill');
  paragraph.shading = shadingFill ? `#${shadingFill}` : undefined;
  paragraph.borders = Boolean(findChild(pPr, 'w:pBdr')) || undefined;
  if (!findChild(pPr, 'w:numPr')) paragraph.listType = undefined;
}

export function acceptAll(document: WordDocument): number {
  let count = 0;
  for (const revision of listRevisions(document)) {
    if (acceptRevision(document, revision.id)) count++;
  }
  return count;
}

export function rejectAll(document: WordDocument): number {
  let count = 0;
  for (const revision of [...listRevisions(document)].reverse()) {
    if (rejectRevision(document, revision.id)) count++;
  }
  return count;
}

/**
 * Record a text edit as a tracked insertion + deletion of the previous runs.
 * The paragraph keeps one `w:ins` (new text) and one `w:del` (old text).
 */
export function trackEdit(
  paragraph: XmlNode, newText: string, author: string, date = new Date().toISOString(),
  nextId = Date.now() % 100000,
): void {
  const oldTexts = descendants(paragraph, 'w:t').map((node) => node.text).join('');
  if (oldTexts === newText) return;
  const pPr = findChild(paragraph, 'w:pPr');
  const preserved = pPr ? [pPr] : [];
  const media = paragraph.children.filter((child) =>
    child.name === 'w:r' && child.children.some((item) =>
      item.name === 'w:drawing' || item.name === 'w:pict' || item.name === 'w:object'));
  const insertion: XmlNode = {
    name: 'w:ins',
    attrs: { 'w:id': String(nextId), 'w:author': author, 'w:date': date },
    text: '', children: [runNode('w:t', newText)],
  };
  const deletion: XmlNode = {
    name: 'w:del',
    attrs: { 'w:id': String(nextId + 1), 'w:author': author, 'w:date': date },
    text: '', children: [runNode('w:delText', oldTexts)],
  };
  paragraph.children = [...preserved, insertion, deletion, ...media];
}

function runNode(textName: string, text: string): XmlNode {
  return {
    name: 'w:r', attrs: {}, text: '', children: [
      { name: textName, attrs: { 'xml:space': 'preserve' }, text, children: [] },
    ],
  };
}

function locate(document: WordDocument, id: number): Located | null {
  const root = document.xmlRoot;
  if (!root) return null;
  for (let paragraphIndex = 0; paragraphIndex < document.blocks.length; paragraphIndex++) {
    const block = document.blocks[paragraphIndex];
    if (block.kind !== 'paragraph' || !block.paragraph.xmlNode) continue;
    let found: Located | null = null;
    walk(block.paragraph.xmlNode, (node, parent) => {
      if (found) return;
      if (node.name !== 'w:ins' && node.name !== 'w:del' && !FORMAT_NODES.has(node.name)) return;
      const nodeId = Number(attr(node, 'w:id') ?? Number.NaN);
      if (nodeId === id) found = { node, parent, paragraphIndex };
    });
    if (found) return found;
  }
  return null;
}

function walk(
  node: XmlNode,
  visit: (node: XmlNode, parent: XmlNode, grandparent: XmlNode | null) => void,
  parent: XmlNode | null = null,
  grandparent: XmlNode | null = null,
): void {
  if (parent) visit(node, parent, grandparent);
  for (const child of [...node.children]) walk(child, visit, node, parent);
}

function remove(node: XmlNode, parent: XmlNode): void {
  parent.children = parent.children.filter((child) => child !== node);
}

function unwrap(node: XmlNode, parent: XmlNode): void {
  const index = parent.children.indexOf(node);
  if (index < 0) return;
  parent.children.splice(index, 1, ...node.children);
}

function unwrapDeleted(node: XmlNode, parent: XmlNode): void {
  for (const text of descendants(node, 'w:delText')) text.name = 'w:t';
  unwrap(node, parent);
}

function restoreFormat(node: XmlNode, parent: XmlNode): void {
  const old = node.name === 'w:rPrChange' ? findChild(node, 'w:rPr') : findChild(node, 'w:pPr');
  if (old) {
    parent.children = old.children.map((child) => clone(child));
    parent.attrs = { ...old.attrs };
  }
  remove(node, parent);
}

function clone(node: XmlNode): XmlNode {
  return { name: node.name, attrs: { ...node.attrs }, text: node.text, children: node.children.map(clone) };
}

export function revisionCounts(revisions: Revision[]): Record<RevisionType, number> {
  const counts: Record<RevisionType, number> = { insert: 0, delete: 0, format: 0 };
  for (const revision of revisions) counts[revision.type]++;
  return counts;
}

export function revisionNodes(document: WordDocument): XmlNode[] {
  const root = document.xmlRoot;
  if (!root) return [];
  const nodes: XmlNode[] = [];
  walk(root, (node) => {
    if (node.name === 'w:ins' || node.name === 'w:del' || FORMAT_NODES.has(node.name)) nodes.push(node);
  });
  return nodes;
}

export { findChildren };
