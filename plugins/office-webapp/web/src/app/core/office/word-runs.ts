import { findChild, type XmlNode } from '../binary/xml';
import type { WordDocument, WordParagraph, WordRun } from './types';
import { ensureHyperlinkRel } from './word-link';

export interface RunFormatInput {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  vertAlign?: 'superscript' | 'subscript' | '';
  caps?: boolean;
  font?: string;
  sizePt?: number;
  color?: string;
  highlight?: string;
  clear?: boolean;
}

interface Segment {
  text: string;
  run: WordRun;
  start: number;
  end: number;
}

export function applyRunFormat(document: WordDocument, blockIndex: number, start: number, end: number, input: RunFormatInput): boolean {
  const paragraph = paragraphAt(document, blockIndex);
  if (!paragraph) return false;
  const segments = textSegments(paragraph);
  if (!segments.length) return false;
  const total = segments[segments.length - 1].end;
  const from = Math.max(0, Math.min(total, Math.min(start, end)));
  const to = Math.max(0, Math.min(total, Math.max(start, end)));
  if (from === to) return false;
  const next: WordRun[] = [];
  for (const segment of segments) {
    if (segment.end <= from || segment.start >= to) {
      next.push({ ...segment.run, text: segment.text });
      continue;
    }
    if (segment.start < from) next.push({ ...segment.run, text: segment.text.slice(0, from - segment.start) });
    const midStart = Math.max(segment.start, from);
    const midEnd = Math.min(segment.end, to);
    next.push(formatRun({ ...segment.run, text: segment.text.slice(midStart - segment.start, midEnd - segment.start) }, input));
    if (segment.end > to) next.push({ ...segment.run, text: segment.text.slice(to - segment.start) });
  }
  paragraph.runs = mergeRuns([...next, ...nonTextRuns(paragraph)]);
  rewriteParagraphRuns(paragraph, document);
  return true;
}

export function clearRunFormat(document: WordDocument, blockIndex: number, start: number, end: number): boolean {
  return applyRunFormat(document, blockIndex, start, end, { clear: true });
}

export function replaceParagraphRange(document: WordDocument, blockIndex: number, start: number, end: number, text: string): boolean {
  const paragraph = paragraphAt(document, blockIndex);
  if (!paragraph) return false;
  const segments = textSegments(paragraph);
  if (!segments.length) return false;
  const total = segments[segments.length - 1].end;
  const from = Math.max(0, Math.min(total, Math.min(start, end)));
  const to = Math.max(0, Math.min(total, Math.max(start, end)));
  const next: WordRun[] = [];
  let inserted = false;
  for (const segment of segments) {
    if (segment.end < from || (segment.end === from && !inserted && from !== to)) {
      next.push({ ...segment.run, text: segment.text });
      continue;
    }
    if (segment.start > to || (segment.start === to && inserted)) {
      next.push({ ...segment.run, text: segment.text });
      continue;
    }
    if (segment.start < from) next.push({ ...segment.run, text: segment.text.slice(0, from - segment.start) });
    if (!inserted) {
      next.push({ ...segment.run, text });
      inserted = true;
    }
    if (segment.end > to) next.push({ ...segment.run, text: segment.text.slice(to - segment.start) });
  }
  if (!inserted) next.push({ text });
  paragraph.runs = mergeRuns([...next, ...nonTextRuns(paragraph)]);
  rewriteParagraphRuns(paragraph, document);
  return true;
}

export function paragraphPlainText(paragraph: WordParagraph): string {
  return textSegments(paragraph).map((segment) => segment.text).join('');
}

/** Inserts already-formatted runs (rich paste) at a character offset. */
export function insertFormattedRuns(
  document: WordDocument, blockIndex: number, at: number, runs: WordRun[],
): boolean {
  const paragraph = paragraphAt(document, blockIndex);
  if (!paragraph || !runs.length) return false;
  const segments = textSegments(paragraph);
  const total = segments.length ? segments[segments.length - 1].end : 0;
  const pos = Math.max(0, Math.min(total, at));
  const next: WordRun[] = [];
  let inserted = false;
  for (const segment of segments) {
    if (segment.end <= pos) {
      next.push({ ...segment.run, text: segment.text });
      continue;
    }
    if (segment.start >= pos) {
      if (!inserted) {
        next.push(...runs.map((run) => ({ ...run })));
        inserted = true;
      }
      next.push({ ...segment.run, text: segment.text });
      continue;
    }
    next.push({ ...segment.run, text: segment.text.slice(0, pos - segment.start) });
    next.push(...runs.map((run) => ({ ...run })));
    inserted = true;
    next.push({ ...segment.run, text: segment.text.slice(pos - segment.start) });
  }
  if (!inserted) next.push(...runs.map((run) => ({ ...run })));
  paragraph.runs = mergeRuns([...next, ...nonTextRuns(paragraph)]);
  rewriteParagraphRuns(paragraph, document);
  return true;
}

/** Table styles bold the header row: every text run of the cell paragraph. */
export function setParagraphRunBold(paragraph: WordParagraph, document: WordDocument, bold: boolean): void {
  setParagraphRunStyle(paragraph, document, { bold });
}

/** Header typography for table styles: bold and/or a font colour on every run. */
export function setParagraphRunStyle(
  paragraph: WordParagraph, document: WordDocument, patch: { bold?: boolean; color?: string; font?: string },
): void {
  let changed = false;
  for (const run of paragraph.runs) {
    if (run.imagePath || run.videoUrl || run.textBox || run.pageBreak) continue;
    if (patch.bold !== undefined && run.bold !== patch.bold) {
      run.bold = patch.bold;
      changed = true;
    }
    if (patch.color !== undefined && run.color !== patch.color) {
      run.color = patch.color;
      changed = true;
    }
    if (patch.font !== undefined && run.font !== patch.font) {
      run.font = patch.font;
      changed = true;
    }
  }
  if (changed) rewriteParagraphRuns(paragraph, document);
}

function paragraphAt(document: WordDocument, index: number): WordParagraph | null {
  const block = document.blocks[index];
  return block?.kind === 'paragraph' ? block.paragraph : null;
}

function textSegments(paragraph: WordParagraph): Segment[] {
  const segments: Segment[] = [];
  let offset = 0;
  for (const run of paragraph.runs) {
    if (run.imagePath || run.videoUrl || run.textBox || run.pageBreak || !run.text) continue;
    segments.push({ text: run.text, run, start: offset, end: offset + run.text.length });
    offset += run.text.length;
  }
  return segments;
}

function nonTextRuns(paragraph: WordParagraph): WordRun[] {
  return paragraph.runs.filter((run) => run.imagePath || run.videoUrl || run.textBox || run.pageBreak);
}

function formatRun(run: WordRun, input: RunFormatInput): WordRun {
  if (input.clear) {
    return { text: run.text, link: run.link };
  }
  const next: WordRun = { ...run };
  if (input.bold !== undefined) next.bold = input.bold;
  if (input.italic !== undefined) next.italic = input.italic;
  if (input.underline !== undefined) next.underline = input.underline;
  if (input.strike !== undefined) next.strike = input.strike;
  if (input.vertAlign !== undefined) next.vertAlign = input.vertAlign === '' ? undefined : input.vertAlign;
  if (input.caps !== undefined) next.caps = input.caps;
  if (input.font !== undefined) next.font = input.font;
  if (input.sizePt !== undefined) next.sizePt = input.sizePt;
  if (input.color !== undefined) next.color = input.color;
  if (input.highlight !== undefined) next.highlight = input.highlight;
  return next;
}

function mergeRuns(runs: WordRun[]): WordRun[] {
  const merged: WordRun[] = [];
  for (const run of runs) {
    const previous = merged[merged.length - 1];
    if (previous && sameFormat(previous, run) && previous.text && run.text
      && !previous.imagePath && !previous.videoUrl && !previous.pageBreak) {
      previous.text += run.text;
    } else {
      merged.push({ ...run });
    }
  }
  return merged;
}

function sameFormat(left: WordRun, right: WordRun): boolean {
  return left.bold === right.bold && left.italic === right.italic
    && left.underline === right.underline && left.strike === right.strike
    && left.color === right.color && left.sizePt === right.sizePt
    && left.font === right.font && left.highlight === right.highlight
    && left.link === right.link;
}

export function rewriteParagraphRuns(paragraph: WordParagraph, document: WordDocument): void {
  const node = paragraph.xmlNode;
  if (!node) return;
  const pPr = findChild(node, 'w:pPr');
  const children: XmlNode[] = pPr ? [pPr] : [];
  for (const run of paragraph.runs) {
    if (run.imagePath || run.videoUrl || run.textBox || run.pageBreak) continue;
    if (run.link) {
      const relId = ensureHyperlinkRel(document, run.link);
      children.push({ name: 'w:hyperlink', attrs: { 'r:id': relId }, text: '', children: [runNode(run)] });
    } else {
      children.push(runNode(run));
    }
  }
  for (const child of node.children) {
    if (child.name === 'w:r' && child.children.some((item) =>
      item.name === 'w:drawing' || item.name === 'w:pict' || item.name === 'w:object')) {
      children.push(child);
    }
  }
  node.children = children;
}

function runNode(run: WordRun): XmlNode {
  const rPr: XmlNode[] = [];
  if (run.font) {
    rPr.push({ name: 'w:rFonts', attrs: { 'w:ascii': run.font, 'w:hAnsi': run.font, 'w:cs': run.font }, text: '', children: [] });
  }
  if (run.bold) rPr.push({ name: 'w:b', attrs: {}, text: '', children: [] });
  if (run.italic) rPr.push({ name: 'w:i', attrs: {}, text: '', children: [] });
  if (run.strike) rPr.push({ name: 'w:strike', attrs: {}, text: '', children: [] });
  if (run.underline) rPr.push({ name: 'w:u', attrs: { 'w:val': 'single' }, text: '', children: [] });
  if (run.color) rPr.push({ name: 'w:color', attrs: { 'w:val': run.color.replace('#', '').toUpperCase() }, text: '', children: [] });
  if (run.highlight) rPr.push({ name: 'w:highlight', attrs: { 'w:val': run.highlight }, text: '', children: [] });
  if (run.sizePt) rPr.push({ name: 'w:sz', attrs: { 'w:val': String(Math.round(run.sizePt * 2)) }, text: '', children: [] });
  if (run.caps) rPr.push({ name: 'w:caps', attrs: {}, text: '', children: [] });
  if (run.vertAlign) rPr.push({ name: 'w:vertAlign', attrs: { 'w:val': run.vertAlign }, text: '', children: [] });
  const children: XmlNode[] = [];
  if (rPr.length) children.push({ name: 'w:rPr', attrs: {}, text: '', children: rPr });
  children.push({ name: 'w:t', attrs: { 'xml:space': 'preserve' }, text: run.text, children: [] });
  return { name: 'w:r', attrs: {}, text: '', children };
}
