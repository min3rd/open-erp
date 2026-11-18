import { descendants, findChild, type XmlNode } from '../binary/xml';
import type { WordParagraph } from './types';

export type MarkupMode = 'all' | 'simple' | 'none';
export type MarkupKind = 'normal' | 'insert' | 'delete';

export interface MarkupSegment {
  text: string;
  kind: MarkupKind;
}

const SKIP = new Set(['w:pPr', 'w:bookmarkStart', 'w:bookmarkEnd', 'w:commentRangeStart', 'w:commentRangeEnd']);

export function paragraphSegments(paragraph: WordParagraph, mode: MarkupMode): MarkupSegment[] {
  const node = paragraph.xmlNode;
  if (!node) {
    return paragraph.runs
      .map((run) => run.text)
      .filter(Boolean)
      .map((text) => ({ text, kind: 'normal' as MarkupKind }));
  }
  const raw = collectSegments(node);
  if (mode === 'all') return raw;
  return raw
    .filter((segment) => segment.kind !== 'delete')
    .map((segment) => ({ text: segment.text, kind: 'normal' as MarkupKind }));
}

export function paragraphHasRevision(paragraph: WordParagraph): boolean {
  const node = paragraph.xmlNode;
  if (!node) return false;
  return containsRevision(node);
}

export function acceptedText(paragraph: WordParagraph): string {
  return paragraphSegments(paragraph, 'simple').map((segment) => segment.text).join('');
}

/**
 * Replace the paragraph with the accepted text (drop deletions, unwrap insertions)
 * while keeping non-text runs such as embedded drawings.
 */
export function setAcceptedText(paragraph: WordParagraph, value: string): void {
  const node = paragraph.xmlNode;
  const images = paragraph.runs.filter((run) => run.imagePath);
  if (!node) {
    paragraph.runs = [...(value ? [{ text: value }] : []), ...images];
    return;
  }
  const children: XmlNode[] = [];
  for (const child of node.children) {
    if (child.name === 'w:ins') {
      children.push(...child.children);
    } else if (child.name === 'w:del') {
      continue;
    } else {
      children.push(child);
    }
  }
  node.children = children;

  const textRuns = node.children.filter((child) => child.name === 'w:r');
  const textNodes = textRuns.flatMap((run) => run.children.filter((child) => child.name === 'w:t'));
  if (textNodes.length) {
    textNodes[0].text = value;
    for (let index = 1; index < textNodes.length; index++) textNodes[index].text = '';
  } else if (value) {
    const run: XmlNode = {
      name: 'w:r', attrs: {}, text: '',
      children: [{ name: 'w:t', attrs: { 'xml:space': 'preserve' }, text: value, children: [] }],
    };
    const firstDrawing = node.children.findIndex((child) => child.name === 'w:r' && child.children.some((item) => item.name === 'w:drawing'));
    if (firstDrawing < 0) node.children.push(run);
    else node.children.splice(firstDrawing, 0, run);
  }
  paragraph.runs = [...(value ? [{ text: value }] : []), ...images];
}

function collectSegments(node: XmlNode): MarkupSegment[] {
  const segments: MarkupSegment[] = [];
  for (const child of node.children) {
    if (SKIP.has(child.name)) continue;
    if (child.name === 'w:ins') {
      const text = textOfChildren(child, 'w:t');
      if (text) segments.push({ text, kind: 'insert' });
    } else if (child.name === 'w:del') {
      const text = textOfChildren(child, 'w:delText');
      if (text) segments.push({ text, kind: 'delete' });
    } else if (child.name === 'w:r') {
      const text = runText(child);
      if (text) segments.push({ text, kind: 'normal' });
    } else if (child.name === 'w:hyperlink') {
      for (const run of child.children) {
        if (run.name !== 'w:r') continue;
        const text = runText(run);
        if (text) segments.push({ text, kind: 'normal' });
      }
    } else if (child.name === 'w:fldSimple') {
      for (const run of child.children) {
        if (run.name !== 'w:r') continue;
        const text = runText(run);
        if (text) segments.push({ text, kind: 'normal' });
      }
    } else if (child.name === 'm:oMath') {
      continue;
    } else {
      segments.push(...collectSegments(child));
    }
  }
  return segments;
}

function runText(run: XmlNode): string {
  let text = '';
  for (const child of run.children) {
    if (child.name === 'w:t') text += child.text;
    else if (child.name === 'w:delText') text += child.text;
    else if (child.name === 'w:tab') text += '\t';
    else if (child.name === 'w:br') text += '\n';
  }
  return text;
}

function textOfChildren(node: XmlNode, name: string): string {
  let text = '';
  for (const child of node.children) {
    if (child.name === name) text += child.text;
    else text += textOfChildren(child, name);
  }
  return text;
}

function containsRevision(node: XmlNode): boolean {
  for (const child of node.children) {
    if (child.name === 'w:ins' || child.name === 'w:del' || child.name === 'w:rPrChange' || child.name === 'w:pPrChange') return true;
    if (containsRevision(child)) return true;
  }
  return false;
}

export function revisionStyle(kind: MarkupKind): string {
  if (kind === 'insert') return 'op-markup-insert';
  if (kind === 'delete') return 'op-markup-delete';
  return '';
}

export { findChild };
