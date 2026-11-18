import { attr, descendants, findChild, parseXml, type XmlNode } from '../binary/xml';
import type { WordBlock, WordDocument, WordParagraph } from './types';

export type WordStyle = 'Normal' | 'NoSpacing' | 'Title' | 'Subtitle' | 'Heading1' | 'Heading2' | 'Heading3'
  | 'Heading4' | 'Heading5' | 'Heading6' | 'Quote';

export interface ParagraphFormatInput {
  align?: 'left' | 'center' | 'right' | 'justify';
  indent?: number;
  indentDelta?: number;
  lineSpacing?: number;
  style?: WordStyle;
  listType?: 'bullet' | 'number' | null;
  shading?: string;
}

const PPR_ORDER = ['w:pStyle', 'w:keepNext', 'w:numPr', 'w:spacing', 'w:ind', 'w:jc'];
const BULLET_NUM_ID = 9001;
const NUMBER_NUM_ID = 9002;
const REL_NUMBERING = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering';
const CONTENT_TYPE_NUMBERING = 'application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml';

export function parseNumbering(entries: Map<string, Uint8Array>): Map<string, 'bullet' | 'number'> {
  const result = new Map<string, 'bullet' | 'number'>();
  const bytes = entries.get('word/numbering.xml');
  if (!bytes) return result;
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  const abstract = new Map<string, 'bullet' | 'number'>();
  for (const node of descendants(root, 'w:abstractNum')) {
    const id = attr(node, 'w:abstractNumId');
    const format = attr(descendants(node, 'w:numFmt')[0], 'w:val');
    if (id) abstract.set(id, format === 'bullet' ? 'bullet' : 'number');
  }
  for (const node of descendants(root, 'w:num')) {
    const id = attr(node, 'w:numId');
    const abstractId = attr(findChild(node, 'w:abstractNumId'), 'w:val');
    if (!id || !abstractId) continue;
    result.set(id, abstract.get(abstractId) ?? 'number');
  }
  return result;
}

export function applyParagraphFormat(document: WordDocument, blockIndex: number, input: ParagraphFormatInput): boolean {
  const block: WordBlock | undefined = document.blocks[blockIndex];
  if (!block || block.kind !== 'paragraph') return false;
  const paragraph = block.paragraph;
  const node = paragraph.xmlNode;
  if (!node) return false;
  const pPr = ensureParagraphProperties(node);

  if (input.align) {
    setPPrChild(pPr, 'w:jc', { 'w:val': input.align === 'justify' ? 'both' : input.align });
    paragraph.align = input.align;
  }

  if (input.indentDelta !== undefined || input.indent !== undefined) {
    const next = Math.max(0, Math.min(4320, input.indent ?? (paragraph.indent ?? 0) + (input.indentDelta ?? 0)));
    const ind = setPPrChild(pPr, 'w:ind', {});
    ind.attrs['w:left'] = String(next);
    paragraph.indent = next;
  }

  if (input.lineSpacing !== undefined) {
    const line = Math.round(input.lineSpacing * 240);
    const spacing = setPPrChild(pPr, 'w:spacing', {});
    spacing.attrs['w:line'] = String(line);
    spacing.attrs['w:lineRule'] = 'auto';
    paragraph.lineSpacing = input.lineSpacing;
  }

  if (input.style !== undefined) {
    if (input.style === 'Normal') {
      removePPrChild(pPr, 'w:pStyle');
      removePPrChild(pPr, 'w:jc');
      removePPrChild(pPr, 'w:ind');
      removePPrChild(pPr, 'w:spacing');
      removePPrChild(pPr, 'w:numPr');
      paragraph.style = undefined;
      paragraph.headingLevel = undefined;
      paragraph.align = 'left';
      paragraph.indent = undefined;
      paragraph.lineSpacing = undefined;
      paragraph.listType = undefined;
    } else if (input.style === 'NoSpacing') {
      setPPrChild(pPr, 'w:pStyle', { 'w:val': 'NoSpacing' });
      removePPrChild(pPr, 'w:ind');
      removePPrChild(pPr, 'w:spacing');
      removePPrChild(pPr, 'w:jc');
      paragraph.style = 'NoSpacing';
      paragraph.headingLevel = undefined;
      paragraph.align = 'left';
      paragraph.indent = undefined;
      paragraph.lineSpacing = undefined;
    } else {
      setPPrChild(pPr, 'w:pStyle', { 'w:val': input.style });
      paragraph.style = input.style;
      const heading = /^Heading([1-6])$/.exec(input.style);
      paragraph.headingLevel = heading ? Number(heading[1]) : undefined;
    }
  }

  if (input.shading !== undefined) {
    const fill = input.shading.replace('#', '').toUpperCase();
    const shd = setPPrChild(pPr, 'w:shd', { 'w:val': 'clear', 'w:color': 'auto', 'w:fill': fill });
    shd.attrs['w:fill'] = fill;
    paragraph.shading = `#${fill}`;
  }

  if (input.listType !== undefined) {
    if (input.listType === null) {
      removePPrChild(pPr, 'w:numPr');
      paragraph.listType = undefined;
    } else {
      const ids = ensureNumberingPart(document.packageEntries ?? new Map());
      const numPr: XmlNode = {
        name: 'w:numPr', attrs: {}, text: '', children: [
          { name: 'w:ilvl', attrs: { 'w:val': '0' }, text: '', children: [] },
          { name: 'w:numId', attrs: { 'w:val': String(input.listType === 'bullet' ? ids.bullet : ids.number) }, text: '', children: [] },
        ],
      };
      removePPrChild(pPr, 'w:numPr');
      insertOrdered(pPr, numPr);
      paragraph.listType = input.listType;
    }
  }

  return true;
}

export function insertPageBreak(document: WordDocument): number {
  const body = document.xmlRoot ? findChild(document.xmlRoot, 'w:body') : null;
  if (!body) return -1;
  const paragraph: XmlNode = {
    name: 'w:p', attrs: {}, text: '', children: [
      { name: 'w:r', attrs: {}, text: '', children: [
        { name: 'w:br', attrs: { 'w:type': 'page' }, text: '', children: [] },
      ] },
    ],
  };
  const sections = body.children
    .map((child, index) => (child.name === 'w:sectPr' ? index : -1))
    .filter((index) => index >= 0);
  const at = sections.length ? sections[sections.length - 1] : body.children.length;
  body.children.splice(at, 0, paragraph);
  document.blocks.push({ kind: 'paragraph', paragraph: { runs: [{ text: '', pageBreak: true }], xmlNode: paragraph } });
  return document.blocks.length - 1;
}

export function paragraphHasPageBreak(paragraph: WordParagraph): boolean {
  return paragraph.runs.some((run) => run.pageBreak);
}

export function sortBodyParagraphs(document: WordDocument, fromIndex: number): boolean {
  const body = document.xmlRoot ? findChild(document.xmlRoot, 'w:body') : null;
  if (!body) return false;
  const targets: Array<{ blockIndex: number; node: XmlNode; text: string }> = [];
  document.blocks.forEach((block, index) => {
    if (index < fromIndex || block.kind !== 'paragraph' || !block.paragraph.xmlNode) return;
    targets.push({ blockIndex: index, node: block.paragraph.xmlNode, text: acceptedTextOf(block.paragraph) });
  });
  if (targets.length < 2) return false;
  const sorted = [...targets].sort((left, right) => left.text.localeCompare(right.text, 'vi'));
  const nodes = new Set(targets.map((item) => item.node));
  let cursor = 0;
  body.children = body.children.map((child) => nodes.has(child) ? sorted[cursor++].node : child);
  const slots = targets.map((item) => item.blockIndex);
  const ordered = sorted.map((item) => document.blocks[item.blockIndex]);
  slots.forEach((slot, index) => { document.blocks[slot] = ordered[index]; });
  return true;
}

function acceptedTextOf(paragraph: WordParagraph): string {
  return paragraph.runs.filter((run) => !run.imagePath && !run.videoUrl && !run.textBox && !run.pageBreak)
    .map((run) => run.text).join('');
}

function ensureParagraphProperties(node: XmlNode): XmlNode {
  let pPr = findChild(node, 'w:pPr');
  if (!pPr) {
    pPr = { name: 'w:pPr', attrs: {}, text: '', children: [] };
    node.children.unshift(pPr);
  }
  return pPr;
}

function setPPrChild(pPr: XmlNode, name: string, attrs: Record<string, string>): XmlNode {
  const existing = findChild(pPr, name);
  if (existing) {
    for (const [key, value] of Object.entries(attrs)) existing.attrs[key] = value;
    return existing;
  }
  const node: XmlNode = { name, attrs: { ...attrs }, text: '', children: [] };
  insertOrdered(pPr, node);
  return node;
}

function insertOrdered(pPr: XmlNode, node: XmlNode): void {
  const order = PPR_ORDER.indexOf(node.name);
  const at = pPr.children.findIndex((child) => {
    const childOrder = PPR_ORDER.indexOf(child.name);
    return childOrder >= 0 && order >= 0 && childOrder > order;
  });
  pPr.children.splice(at < 0 ? pPr.children.length : at, 0, node);
}

function removePPrChild(pPr: XmlNode, name: string): void {
  pPr.children = pPr.children.filter((child) => child.name !== name);
}

function ensureNumberingPart(entries: Map<string, Uint8Array>): { bullet: number; number: number } {
  const path = 'word/numbering.xml';
  let xml = entries.get(path) ? new TextDecoder('utf-8').decode(entries.get(path)) : '';
  if (!xml) {
    xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
      + abstractNumbering()
      + '<w:num w:numId="9001"><w:abstractNumId w:val="9001"/></w:num>'
      + '<w:num w:numId="9002"><w:abstractNumId w:val="9002"/></w:num>'
      + '</w:numbering>';
  } else if (!xml.includes(`w:numId="${BULLET_NUM_ID}"`)) {
    xml = xml.includes('</w:numbering>')
      ? xml.replace('</w:numbering>', abstractNumbering()
        + '<w:num w:numId="9001"><w:abstractNumId w:val="9001"/></w:num>'
        + '<w:num w:numId="9002"><w:abstractNumId w:val="9002"/></w:num></w:numbering>')
      : xml + abstractNumbering();
  }
  entries.set(path, new TextEncoder().encode(xml));
  ensureNumberingRelationship(entries);
  ensureNumberingContentType(entries);
  return { bullet: BULLET_NUM_ID, number: NUMBER_NUM_ID };
}

function abstractNumbering(): string {
  return '<w:abstractNum w:abstractNumId="9001"><w:lvl w:ilvl="0"><w:start w:val="1"/>'
    + '<w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/>'
    + '<w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>'
    + '<w:abstractNum w:abstractNumId="9002"><w:lvl w:ilvl="0"><w:start w:val="1"/>'
    + '<w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/>'
    + '<w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>';
}

function ensureNumberingRelationship(entries: Map<string, Uint8Array>): void {
  const path = 'word/_rels/document.xml.rels';
  let rels = entries.get(path) ? new TextDecoder('utf-8').decode(entries.get(path)) : '';
  if (!rels) {
    rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
  }
  if (!rels.includes('numbering.xml')) {
    rels = rels.includes('</Relationships>')
      ? rels.replace('</Relationships>', `<Relationship Id="rIdNumbering" Type="${REL_NUMBERING}" Target="numbering.xml"/></Relationships>`)
      : `${rels}<Relationship Id="rIdNumbering" Type="${REL_NUMBERING}" Target="numbering.xml"/>`;
  }
  entries.set(path, new TextEncoder().encode(rels));
}

function ensureNumberingContentType(entries: Map<string, Uint8Array>): void {
  const path = '[Content_Types].xml';
  let types = entries.get(path) ? new TextDecoder('utf-8').decode(entries.get(path)) : '';
  if (!types) {
    types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>';
  }
  if (!types.includes('/word/numbering.xml')) {
    const override = `<Override PartName="/word/numbering.xml" ContentType="${CONTENT_TYPE_NUMBERING}"/>`;
    types = types.includes('</Types>') ? types.replace('</Types>', `${override}</Types>`) : `${types}${override}`;
  }
  entries.set(path, new TextEncoder().encode(types));
}

export function toggleParagraphBorders(document: WordDocument, blockIndex: number): boolean {
  const block = document.blocks[blockIndex];
  if (!block || block.kind !== 'paragraph') return false;
  const node = block.paragraph.xmlNode;
  if (!node) return false;
  const paragraph = block.paragraph;
  const pPr = ensureParagraphProperties(node);
  if (paragraph.borders) {
    removePPrChild(pPr, 'w:pBdr');
    paragraph.borders = undefined;
    return true;
  }
  const borders: XmlNode = {
    name: 'w:pBdr', attrs: {}, text: '',
    children: ['top', 'left', 'bottom', 'right'].map((side) => ({
      name: `w:${side}`,
      attrs: { 'w:val': 'single', 'w:sz': '4', 'w:space': '1', 'w:color': '000000' },
      text: '', children: [],
    })),
  };
  const existing = findChild(pPr, 'w:pBdr');
  if (existing) pPr.children[pPr.children.indexOf(existing)] = borders;
  else pPr.children.push(borders);
  paragraph.borders = true;
  return true;
}
